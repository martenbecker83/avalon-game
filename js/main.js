// Menu's, schermen en de spel-lus
//
// Eén spel = één of twee personages, 3 levens en vier werelden. Je kiest een wereld, blijft daarin tot hij
// uitgespeeld is en kiest dan de volgende. Het spel eindigt als alle werelden uitgespeeld zijn,
// als je levens op zijn (game over) of als je stopt. De score wordt dan altijd geregistreerd.
//
// Met z'n tweeën kan op één apparaat (twee controllers of één toetsenbord) of ieder op een eigen apparaat.
// In dat laatste geval rekent het apparaat dat het spel maakte ('host') alles uit en stuurt het beeld naar de ander ('gast').
import { CHARACTERS, charById, renderPortrait, drawCharacter } from './characters.js';
import { WORLDS } from './worlds.js';
import { drawWorldPreview, drawBackground, drawGround } from './art.js';
import { Game, PLAYER_COLORS } from './game.js';
import { createFinale } from './finale.js';
import { initInput, isTouch, clearPressed, controllers, remote, pollInput, setInputMode, spatialNav, onPadConnected, connectedPads, checkPadCount, onPadCountChange } from './input.js';
import { initAudio, setMusic, setSfx, sfx, playMusic, setSfxTap, countOpenGames } from './audio.js';
import { Net } from './net.js';
import * as store from './storage.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const settings = store.getSettings();
let selectedChar = charById(settings.character);
let run = normalizeRun(store.getRun());   // het lopende spel (of null)
let currentWorld = run?.current ? WORLDS.find((w) => w.id === run.current.world) : null;
let mode = 'menu';               // menu | play | finale
let highlightId = null;          // nieuwe score die in het scorebord oplicht
let lastPosted = null;           // antwoord van de server op de laatste score (met plek)

// samen spelen
let party = { mode: 'single', slot: 0, chosen: [null, null] }; // tijdens het kiezen van personages
let net = null;                  // verbinding met het andere apparaat
let role = null;                 // 'host' | 'guest' | null
let fxQueue = [];                // geluiden die naar de gast moeten

setMusic(settings.music); setSfx(settings.sfx);

export const MEDALS = {
  jungle: { icon: '🌴', label: 'Oerwoud' },
  clouds: { icon: '☁️', label: 'Paarse Wolken' },
  water: { icon: '🐠', label: 'Onderwater' },
  sky: { icon: '🐉', label: 'Lucht' },
};
function normalizeRun(r) {
  if (!r) return null;
  if (!Array.isArray(r.chars)) r.chars = [r.char || 'avalon'];
  r.mode = r.mode || (r.chars.length > 1 ? 'local2' : 'single');
  return r;
}
const runChars = () => (run ? run.chars : [selectedChar.id]).map(charById);
const playingChars = () => (run?.absent ? runChars().slice(0, 1) : runChars());
const saveRun = () => { if (run && run.mode !== 'online') store.setRun(run); };
const isDuo = (r = run) => !!r && r.chars.length > 1;
const myIndex = () => (role === 'guest' ? 1 : 0);

// ---------- game hooks ----------
let bannerTimer = null;
const heartSvg = (on) => `<svg class="h ${on ? '' : 'empty'}" viewBox="0 0 32 30"><path d="M16 28C4 19 1 13 1 8.5 1 4.4 4.3 1 8.5 1c3 0 5.6 1.8 7.5 4.6C17.9 2.8 20.5 1 23.5 1 27.7 1 31 4.4 31 8.5 31 13 28 19 16 28z"/></svg>`;
const hooks = {
  onHud({ players, max, lives, coins, label }) {
    const rows = [$('#hud-hearts'), $('#hud-hearts2')];
    const duo = players.length > 1;
    rows[0].classList.toggle('duo', duo);
    rows[1].classList.toggle('hidden', !duo);
    players.slice(0, 2).forEach((p, i) => {
      const hearts = Array.from({ length: max }, (_, k) => heartSvg(k < p.hearts)).join('');
      rows[i].innerHTML = duo ? `<canvas class="who" style="--pc:${PLAYER_COLORS[i]}"></canvas>${hearts}${p.down ? '<span class="hud-down">komt terug…</span>' : ''}` : hearts;
      if (duo) renderHead(rows[i].querySelector('canvas'), charById(p.char), 30);
    });
    $('#hud-life-count').textContent = `×${lives}`;
    $('#hud-coin-count').textContent = coins;
    $('#hud-level').textContent = label;
  },
  onRefill(missing) {
    [$('#hud-hearts'), $('#hud-hearts2')].forEach((el, i) => {
      if (!missing[i]) return;
      el.classList.remove('refill'); void el.offsetWidth; el.classList.add('refill'); clearTimeout(el._rt); el._rt = setTimeout(() => el.classList.remove('refill'), 900);
    });
  },
  onCoin() { const el = $('#hud-coins'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); },
  onBanner(title, sub, ms = 1600) {
    const b = $('#banner');
    b.innerHTML = `${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}`;
    b.classList.remove('hidden'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.add('hidden'), ms);
  },
  onBossBar(name, frac) {
    const bar = $('#boss-bar');
    if (!name) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden'); $('#boss-name').textContent = name; $('#boss-fill').style.width = `${Math.round(frac * 100)}%`;
  },
  onCheckpoint({ level, checkpoint, coins, lives }) { if (!run) return; run.current = { world: currentWorld.id, level, checkpoint }; run.coins = coins; run.lives = lives; saveRun(); },
  onLifeLost({ level, checkpoint, coins, lives }) { if (!run) return; run.current = { world: currentWorld.id, level, checkpoint }; run.coins = coins; run.lives = lives; saveRun(); },
  onLevelComplete({ level, coins, lives }) {
    run.current = { world: currentWorld.id, level: level + 1, checkpoint: 0 }; run.coins = coins; run.lives = lives; saveRun();
    startLevel(level + 1, 0, true); // nieuw level: hartjes weer vol
  },
  onWorldComplete({ coins, lives }) {
    if (!run.completed.includes(currentWorld.id)) run.completed.push(currentWorld.id);
    // beloning: een wereld uitgespeeld = een leven erbij
    run.coins = coins; run.lives = lives + 1; run.current = null; saveRun();
    leaveGame();
    if (run.completed.length >= WORLDS.length) { endRun('won'); return; }
    show('worlds');
    const html = (who) => `<h2>${esc(currentWorld.name)} uitgespeeld!</h2>
      <div class="medal-row big">${medalsHtml(run.completed)}</div>
      <p class="life-bonus">❤️ +1 leven! ${isDuo() ? 'Jullie hebben' : 'Je hebt'} er nu ${run.lives}.</p>
      <p>${who}</p>`;
    modal(`${html(`${isDuo() ? 'Jullie hebben' : 'Je hebt'} de mensen bevrijd. Kies de volgende wereld!`)}
      <div class="menu"><button class="big-btn" data-act="ok">Verder</button></div>`, () => closeModal());
    if (role === 'host') sendNet({ t: 'wait', html: `${html('Speler 1 kiest de volgende wereld')}<p class="wait-dots">Even wachten</p>` });
  },
  onGameOver({ coins }) { if (run) run.coins = coins; endRun('gameover'); },
};
// op het host-apparaat gaat alles wat in beeld komt ook naar de gast
for (const k of ['onHud', 'onCoin', 'onBanner', 'onBossBar', 'onRefill']) {
  const f = hooks[k];
  hooks[k] = (...a) => { f(...a); if (role === 'host' && mode === 'play') sendNet({ t: 'h', k, a }); };
}
const game = new Game(canvas, hooks);
setSfxTap((name) => { if (role === 'host' && mode === 'play') fxQueue.push(name); });

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function medalsHtml(done, all = true) {
  return WORLDS.filter((w) => all || done.includes(w.id)).map((w) => {
    const got = done.includes(w.id);
    return `<span class="medal m-${w.id} ${got ? 'got' : ''}" title="${MEDALS[w.id].label}${got ? ' uitgespeeld' : ''}">${MEDALS[w.id].icon}</span>`;
  }).join('');
}

// ---------- screens ----------
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('hidden', s.id !== `scr-${id}`));
  if (id === 'chars') buildChars();
  if (id === 'worlds') buildWorlds();
  if (id === 'scores') buildScores(highlightTab || 'global', scorePlayers);
  if (id === 'title') document.activeElement?.blur?.();
}
function hideScreens() { document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden')); }

document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
  sfx.click();
  const to = b.dataset.back;
  if (to === 'title' && document.querySelector('#scr-chars:not(.hidden)')) {
    // terug bij het kiezen van een personage
    if (party.mode === 'local2' && party.slot === 1) { party.slot = 0; party.chosen = [null, null]; buildChars(); return; }
    if (party.mode === 'online') { leaveOnline(); }
  }
  if (to === 'chars' && run) { if (role === 'host') leaveOnline(); show('title'); return; }
  show(to);
}));

// ---------- spelen: 1 of 2 spelers ----------
$('#btn-play').addEventListener('click', () => {
  initAudio(); playMusic('title'); sfx.click();
  if (!run) { askPlayers(); return; }
  const cs = runChars();
  modal(`
    <h2>Je spel loopt nog</h2>
    <div class="choice-row">${cs.map(() => '<canvas class="modal-portrait small"></canvas>').join('')}</div>
    <p>Met <b>${cs.map((c) => esc(c.name)).join(' en ')}</b>, <b>${run.coins} munten</b> en <b>${run.lives} ${run.lives === 1 ? 'leven' : 'levens'}</b>.</p>
    <div class="medal-row">${medalsHtml(run.completed)}</div>
    <div class="menu">
      <button class="big-btn" data-act="continue">Verder spelen</button>
      <button class="big-btn alt" data-act="new">Nieuw spel</button>
    </div>`, (act) => {
    if (act === 'continue') { closeModal(); resumeRun(); }
    if (act === 'new') {
      if (!run.coins) { closeModal(); endRun('stop', { quiet: true }); askPlayers(); return; } // 0 munten: geen bevestiging nodig
      modal(`<h2>Nieuw spel?</h2><p>Je huidige spel stopt en je score van <b>${run.coins} munten</b> wordt geregistreerd.</p>
        <div class="menu"><button class="big-btn" data-act="yes">Ja, stoppen</button><button class="big-btn alt" data-act="no">Nee, terug</button></div>`, (a2) => {
        closeModal();
        if (a2 === 'yes') endRun('stop');
      });
    }
  });
  document.querySelectorAll('#modal-card .modal-portrait').forEach((cv, i) => renderPortrait(cv, cs[i], { w: 80, h: 80 }));
});

function askPlayers() {
  modal(`<h2>Met hoeveel spelers?</h2>
    <div class="choice-row">
      <button class="choice" data-act="1"><span class="ico">🙂</span>1 speler</button>
      <button class="choice" data-act="2"><span class="ico">🙂🙂</span>2 spelers<small>Samen in één beeld</small></button>
    </div>
    <div class="menu"><button class="big-btn alt small" data-act="cancel">Terug</button></div>`, (act) => {
    if (act === 'cancel') { closeModal(); return; }
    if (act === '1') { closeModal(); party = { mode: 'single', slot: 0, chosen: [null, null] }; setInputMode('single'); show('chars'); }
    if (act === '2') askHow();
  });
  focusFirst();
}
function askHow() {
  const pads = connectedPads().length;
  modal(`<h2>Hoe spelen jullie samen?</h2>
    <div class="choice-row">
      <button class="choice" data-act="local"><span class="ico">🎮🎮</span>Op dit apparaat<small>Twee controllers, of samen op één toetsenbord${pads ? ` (${pads} controller${pads > 1 ? 's' : ''} gevonden)` : ''}</small></button>
      <button class="choice" data-act="online"><span class="ico">📱📱</span>Ieder op een eigen apparaat<small>Elk op je eigen iPad of laptop, samen in hetzelfde beeld</small></button>
    </div>
    <div class="menu"><button class="big-btn alt small" data-act="back">Terug</button></div>`, (act) => {
    if (act === 'back') { askPlayers(); return; }
    if (act === 'local') {
      closeModal(); party = { mode: 'local2', slot: 0, chosen: [null, null] }; setInputMode('local2'); show('chars');
      if (!connectedPads().length) hooks.onBanner('Speler 1: A D W + F', 'Speler 2: pijltjes + K', 3200);
    }
    if (act === 'online') askOnline();
  });
  focusFirst();
}
function askOnline() {
  modal(`<h2>Ieder op een eigen apparaat</h2>
    <p>Eén van jullie maakt een spel en krijgt een code. De ander kiest "Meedoen" en tikt de code in. Zit allebei op hetzelfde wifi-netwerk.</p>
    <div class="choice-row">
      <button class="choice" data-act="host"><span class="ico">✨</span>Spel maken<small>Jij bent speler 1</small></button>
      <button class="choice" data-act="join"><span class="ico">🔑</span>Meedoen<small>Met een code, jij bent speler 2</small></button>
    </div>
    <div class="menu"><button class="big-btn alt small" data-act="back">Terug</button></div>`, (act) => {
    if (act === 'back') { askHow(); return; }
    if (act === 'host') hostOnline();
    if (act === 'join') joinOnline();
  });
  focusFirst();
}

// ---------- online: verbinden ----------
function sendNet(msg, fast = false) { if (net?.open) net.send(msg, fast); }
function leaveOnline() {
  if (net) { const n = net; net = null; n.onClose = () => {}; n.close(); }
  role = null; setInputMode('single');
}
function newNet() {
  leaveOnline();
  net = new Net();
  net.onMessage = onNetMessage;
  net.onClose = onNetClosed;
  return net;
}
async function hostOnline() {
  const n = newNet();
  modal(`<h2>Spel maken</h2><p class="wait-dots">Code maken</p><div class="menu"><button class="big-btn alt small" data-act="cancel">Annuleren</button></div>`, (act) => {
    if (act === 'cancel') { leaveOnline(); closeModal(); }
  });
  try {
    await n.host((code) => {
      modal(`<h2>Jullie code</h2>
        <div class="room-code">${code}</div>
        <p>Speler 2: open Avalon op je eigen apparaat, kies <b>Spelen › 2 spelers › Ieder op een eigen apparaat › Meedoen</b> en tik deze code in.</p>
        <p class="wait-dots">Wachten op speler 2</p>
        <div class="menu"><button class="big-btn alt small" data-act="cancel">Annuleren</button></div>`, (act) => { if (act === 'cancel') { leaveOnline(); closeModal(); } });
    });
  } catch (e) {
    if (net !== n) return; // geannuleerd
    leaveOnline();
    modal(`<h2>Dat lukte niet</h2><p>${e.message === 'server' ? 'De server is nu niet bereikbaar. Samen spelen op twee apparaten werkt alleen op de echte website.' : 'Er kwam geen verbinding met speler 2. Zitten jullie op hetzelfde wifi-netwerk?'}</p>
      <div class="menu"><button class="big-btn" data-act="ok">Oké</button></div>`, () => closeModal());
    return;
  }
  if (net !== n) return;
  onConnected('host');
}
function joinOnline() {
  let code = [];
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'.split('');
  const render = (err = '') => {
    modal(`<h2>Meedoen</h2>
      <p>Tik de code van speler 1 in:</p>
      <div class="ini-boxes">${[0, 1, 2, 3].map((i) => `<div class="ini-box ${i === code.length ? 'active' : ''}">${code[i] || ''}</div>`).join('')}</div>
      ${err ? `<p style="color:#d33">${err}</p>` : ''}
      <div class="keyboard">${letters.map((l) => `<button data-act="k" data-l="${l}">${l}</button>`).join('')}<button class="wide" data-act="del">⌫ Wis</button></div>
      <div class="menu"><button class="big-btn" data-act="go" ${code.length === 4 ? '' : 'disabled'}>Meedoen</button><button class="big-btn alt small" data-act="back">Terug</button></div>`, async (act, btn) => {
      if (act === 'k' && code.length < 4) { code.push(btn.dataset.l); render(); if (code.length === 4) document.querySelector('[data-act="go"]')?.focus(); }
      if (act === 'del') { code.pop(); render(); }
      if (act === 'back') { window.removeEventListener('keydown', onKey); askOnline(); }
      if (act === 'go' && code.length === 4) go();
    });
  };
  const onKey = (e) => {
    if (!$('.ini-boxes') || $('#modal').classList.contains('hidden')) { window.removeEventListener('keydown', onKey); return; }
    if (/^[a-z]$/i.test(e.key) && code.length < 4) { code.push(e.key.toUpperCase()); render(); }
    else if (e.key === 'Backspace') { code.pop(); render(); }
    else if (e.key === 'Enter' && code.length === 4) go();
  };
  const go = async () => {
    window.removeEventListener('keydown', onKey);
    const n = newNet();
    modal(`<h2>Verbinden…</h2><p class="wait-dots">Even geduld</p><div class="menu"><button class="big-btn alt small" data-act="cancel">Annuleren</button></div>`, (act) => { if (act === 'cancel') { leaveOnline(); closeModal(); } });
    try { await n.join(code.join('')); } catch (e) {
      if (net !== n) return;
      leaveOnline(); code = [];
      window.addEventListener('keydown', onKey);
      render(e.message === 'code onbekend' ? 'Deze code ken ik niet. Klopt hij?' : e.message === 'server' ? 'De server is nu niet bereikbaar.' : 'Geen verbinding gelukt. Zitten jullie op hetzelfde wifi-netwerk?');
      return;
    }
    if (net !== n) return;
    onConnected('guest');
  };
  window.addEventListener('keydown', onKey);
  render();
}
function onConnected(r) {
  role = r;
  setInputMode('online');
  sendNet({ t: 'hello', viewW: game.baseViewW });
  sfx.levelUp();
  closeModal();
  party = { mode: 'online', slot: r === 'host' ? 0 : 1, chosen: [null, null] };
  show('chars');
  hooks.onBanner('Verbonden!', r === 'host' ? 'Jij bent speler 1' : 'Jij bent speler 2', 1800);
}
function onNetClosed() {
  const wasRole = role;
  net = null; role = null; setInputMode('single');
  if (wasRole === 'guest') {
    leaveGame(); hideScreens(); show('title');
    modal(`<h2>Verbinding verbroken</h2><p>De verbinding met speler 1 is weg.</p><div class="menu"><button class="big-btn" data-act="ok">Oké</button></div>`, () => closeModal());
    return;
  }
  // host: speler 2 is weg
  if (run) {
    run.absent = true;
    if (mode === 'play' && game.running) {
      game.paused = true;
      game.players.length = 1; game.chars = game.chars.slice(0, 1); game.ctls = [controllers[0]]; game.hud();
    }
    modal(`<h2>Speler 2 is weg</h2><p>De verbinding met het andere apparaat is verbroken. Je kunt alleen verder spelen; de score komt op de lijst voor 2 spelers.</p>
      <div class="menu"><button class="big-btn" data-act="go">Alleen verder</button><button class="big-btn alt" data-act="stop">Stoppen</button></div>`, (act) => {
      closeModal();
      if (act === 'go') { if (mode === 'play') { game.paused = false; clearPressed(); } }
      if (act === 'stop') { run.coins = mode === 'play' ? game.coins : run.coins; endRun('stop', { guestGone: true }); }
    });
  } else {
    show('title');
    modal(`<h2>Speler 2 is weg</h2><p>De verbinding met het andere apparaat is verbroken.</p><div class="menu"><button class="big-btn" data-act="ok">Oké</button></div>`, () => closeModal());
  }
}

let guestIni = null; // initialen van speler 2 (online)
function onNetMessage(m) {
  switch (m.t) {
    case 'hello': game.leashW = Math.min(game.baseViewW, m.viewW || game.baseViewW); break;
    case 'pick': {
      const other = role === 'host' ? 1 : 0;
      if (role === 'host' && m.id && m.id === party.chosen[0]) { sendNet({ t: 'reject' }); break; }
      party.chosen[other] = m.id;
      if (!$('#scr-chars').classList.contains('hidden')) buildChars();
      if (role === 'host' && party.chosen[0] && party.chosen[1]) startRun(party.chosen.slice());
      break;
    }
    case 'reject': party.chosen[1] = null; closeModal(); buildChars(); hooks.onBanner('Die is al gekozen', 'Kies een ander personage', 1800); break;
    case 'run': run = normalizeRun(m.run); closeModal(); hideScreens(); waitModal('<h2>Klaar!</h2><p class="wait-dots">Speler 1 kiest een wereld</p>'); break;
    case 'wait': run = run || null; leaveGame(); hideScreens(); waitModal(m.html); break;
    case 'start': guestStart(m); break;
    case 's': if (role === 'guest' && mode === 'play') game.applySnapshot(m.s); break;
    case 'h': if (role === 'guest') hooks[m.k]?.(...m.a); break;
    case 'fx': if (role === 'guest') for (const n of m.l) { if (n.startsWith('music:')) playMusic(n.slice(6)); else sfx[n]?.(); } break;
    case 'i': if (role === 'host') remote.applyRemote(m); break;
    case 'pause': if (mode === 'play') showPause(false); break;
    case 'resume': if (mode === 'play') { closeModal(); game.paused = false; clearPressed(); } break;
    case 'stop': if (role === 'host' && run) { run.coins = game.coins; endRun('stop'); } break;
    case 'end': if (role === 'guest') guestEnd(m); break;
    case 'ini': if (role === 'host') { guestIni = m.ini; guestIniWaiter?.(); } break;
    case 'scores': if (role === 'guest') guestScores(m); break;
  }
}
function waitModal(html) { modal(`${html}<div class="menu"><button class="big-btn alt small" data-act="leave">Stoppen</button></div>`, (act) => { if (act === 'leave') { leaveOnline(); closeModal(); show('title'); } }); }

// ---------- sound buttons ----------
$('#btn-scores').addEventListener('click', () => { initAudio(); sfx.click(); highlightId = null; highlightTab = null; show('scores'); });

const musicBtn = $('#btn-music'), sfxBtn = $('#btn-sfx');
const paintSound = () => {
  musicBtn.textContent = settings.music ? '🎵 Muziek aan' : '🎵 Muziek uit';
  sfxBtn.textContent = settings.sfx ? '🔊 Effecten aan' : '🔇 Effecten uit';
  musicBtn.classList.toggle('off', !settings.music); sfxBtn.classList.toggle('off', !settings.sfx);
};
paintSound();
function toggleMusic() {
  initAudio(); settings.music = !settings.music; setMusic(settings.music); store.setSettings({ music: settings.music }); paintSound();
  if (settings.music && mode !== 'play') playMusic('title');
}
function toggleSfx() {
  initAudio(); settings.sfx = !settings.sfx; setSfx(settings.sfx); store.setSettings({ sfx: settings.sfx }); paintSound();
}
musicBtn.addEventListener('click', () => { toggleMusic(); sfx.click(); });
sfxBtn.addEventListener('click', () => { toggleSfx(); sfx.click(); });

// ---------- characters ----------
function takenBy(id) {
  const i = party.chosen.findIndex((c, k) => c === id && k !== party.slot);
  return i;
}
function buildChars() {
  const grid = $('#char-grid');
  grid.innerHTML = '';
  const title = party.mode === 'single' ? 'Kies je personage' : `Speler ${party.slot + 1}, kies je personage`;
  $('#chars-title').innerHTML = party.mode === 'single' ? title : `<span style="color:${PLAYER_COLORS[party.slot]}">●</span> ${title}`;
  if (takenBy(selectedChar.id) >= 0) selectedChar = CHARACTERS.find((c) => takenBy(c.id) < 0);
  for (const c of CHARACTERS) {
    const card = document.createElement('button');
    const tb = takenBy(c.id);
    const mine = party.chosen[party.slot] === c.id;
    card.className = 'card' + (c.id === selectedChar.id ? ' selected' : '') + (tb >= 0 ? ' taken' : '');
    card.innerHTML = `<canvas></canvas><div class="c-name">${c.name}</div>${tb >= 0 ? `<span class="taken-tag" style="--pc:${PLAYER_COLORS[tb]}">Speler ${tb + 1}</span>` : ''}${mine ? `<span class="pick-tag" style="--pc:${PLAYER_COLORS[party.slot]}">Gekozen</span>` : ''}`;
    if (tb >= 0) card.disabled = true;
    card.addEventListener('focus', () => {
      if (!document.body.classList.contains('padnav') || selectedChar.id === c.id || tb >= 0) return;
      selectedChar = c; store.setSettings({ character: c.id });
      grid.querySelectorAll('.card').forEach((el) => el.classList.remove('selected'));
      card.classList.add('selected'); paintDetail();
    });
    card.addEventListener('click', () => {
      if (selectedChar.id === c.id) { confirmPick(); return; }
      selectedChar = c; store.setSettings({ character: c.id });
      grid.querySelectorAll('.card').forEach((el) => el.classList.remove('selected'));
      card.classList.add('selected'); sfx.click(); paintDetail();
    });
    grid.appendChild(card);
    requestAnimationFrame(() => renderPortrait(card.querySelector('canvas'), c));
  }
  paintDetail();
  padFocus(grid.querySelector('.card.selected'));
}
// met een controller staat de focus meteen op de juiste knop, zodat één druk op A genoeg is
function padFocus(el) {
  if (!el || !document.body.classList.contains('padnav') || !connectedPads().length) return;
  requestAnimationFrame(() => { if ($('#modal').classList.contains('hidden')) el.focus(); });
}
function paintDetail() {
  const c = selectedChar;
  const bar = (v) => `<span class="stat-bar"><i style="width:${v * 20}%"></i></span>`;
  const special = c.special ? ` · extra: ${c.special.name.toLowerCase()}` : '';
  $('#char-detail').innerHTML = `
    <div class="power">
      <h3>${c.name}</h3>
      <div class="power-tag">Superkracht: ${c.power} (${c.weapon.toLowerCase()}${special})</div>
      <p>${c.desc}</p>
    </div>
    <div class="stats">
      <span>Kracht</span>${bar(c.stats.kracht)}
      <span>Bereik</span>${bar(c.stats.bereik)}
      <span>Snelheid</span>${bar(c.stats.snelheid)}
    </div>
    <button class="big-btn" id="btn-choose">Kies ${c.name}</button>`;
  $('#btn-choose').addEventListener('click', confirmPick);
}
function confirmPick() {
  sfx.click();
  const id = selectedChar.id;
  if (takenBy(id) >= 0) return;
  if (party.mode === 'single') { startRun([id]); return; }
  party.chosen[party.slot] = id;
  if (party.mode === 'local2') {
    if (party.slot === 0) { party.slot = 1; buildChars(); hooks.onBanner('Speler 2', 'Kies je personage', 1300); return; }
    startRun(party.chosen.slice());
    return;
  }
  // online
  sendNet({ t: 'pick', id });
  buildChars();
  const other = party.slot === 0 ? 1 : 0;
  if (role === 'host' && party.chosen[other]) { startRun(party.chosen.slice()); return; }
  waitModal(`<h2>${esc(selectedChar.name)} gekozen!</h2><p class="wait-dots">Wachten tot speler ${other + 1} kiest</p>`);
}

// ---------- run ----------
function startRun(chars) {
  closeModal();
  run = { mode: party.mode, chars, char: chars[0], lives: 3, coins: 0, completed: [], current: null, started: new Date().toISOString() };
  saveRun();
  if (role === 'host') sendNet({ t: 'run', run });
  show('worlds');
}
function resumeRun() {
  setInputMode(run.mode === 'local2' ? 'local2' : 'single');
  if (run.current) {
    currentWorld = WORLDS.find((w) => w.id === run.current.world);
    startLevel(run.current.level, run.current.checkpoint);
  } else show('worlds');
}

// ---------- worlds ----------
function buildWorlds() {
  const grid = $('#world-grid');
  grid.innerHTML = '';
  const done = run?.completed || [];
  const cs = runChars();
  $('#world-sub').innerHTML = run ? `<span class="chip">${cs.map((c, i) => `<canvas class="chip-ico" data-i="${i}"></canvas>`).join('')}${cs.map((c) => esc(c.name)).join(' & ')}</span>
    <span class="chip"><span class="coin-ico">A</span>${run.coins}</span>
    <span class="chip" title="levens">${cs.map((c, i) => `<canvas class="chip-ico" data-life="${i}"></canvas>`).join('')}×${run.lives}</span>${run.mode === 'local2' ? '<span class="chip">🎮 Speler 1 kiest</span>' : ''}` : '';
  if (run) { document.querySelectorAll('#world-sub canvas[data-i]').forEach((cv) => renderHead(cv, cs[+cv.dataset.i], 30)); document.querySelectorAll('#world-sub canvas[data-life]').forEach((cv) => renderHead(cv, cs[+cv.dataset.life], 30)); }
  WORLDS.forEach((w, idx) => {
    const got = done.includes(w.id);
    const card = document.createElement('button');
    card.className = 'card world-card' + (got ? ' done' : '');
    card.innerHTML = `<canvas></canvas>${got ? `<span class="w-badge">${MEDALS[w.id].icon} Uitgespeeld</span>` : ''}<div class="w-info"><div class="w-name">${w.name}</div><div class="w-prog">${got ? 'De mensen zijn bevrijd!' : w.blurb}</div></div>`;
    card.addEventListener('click', () => {
      if (got) { sfx.click(); hooks.onBanner('Al uitgespeeld!', 'Kies een andere wereld', 1400); return; }
      sfx.click(); chooseWorld(idx);
    });
    grid.appendChild(card);
    requestAnimationFrame(() => drawWorldPreview(card.querySelector('canvas'), w.id));
  });
  padFocus(grid.querySelector('.world-card:not(.done)'));
}
function chooseWorld(idx) {
  currentWorld = WORLDS[idx];
  run.current = { world: currentWorld.id, level: 1, checkpoint: 0 };
  saveRun();
  startLevel(1, 0);
}

// Knoppen in beeld alleen op een touchscherm zonder controller. Met een controller (zoals de Nimbus) staat er
// in plaats daarvan een korte uitleg in beeld. Met de knop rechtsboven kun je de knoppen zelf tonen of verbergen.
let touchChar = null;
let controlsOverride = null; // null = automatisch, true = tonen, false = verbergen (geldt tot de app sluit)
let legendTimer = null;
function showTouch(localChar) { touchChar = localChar; refreshControls(true); }
function refreshControls(fresh = false) {
  if (mode !== 'play') { $('#pad-legend').classList.add('hidden'); return; }
  const pads = connectedPads().length > 0, touch = isTouch();
  const buttons = controlsOverride ?? (touch && !pads);
  $('#touch').classList.toggle('hidden', !buttons);
  $('.tbtn-special').classList.toggle('hidden', !touchChar?.special);
  const legend = $('#pad-legend');
  const wasHidden = legend.classList.contains('hidden');
  legend.classList.toggle('hidden', buttons || !pads);
  const duo = (run?.chars?.length || 1) > 1 && role !== 'guest';
  $('#pl-special').textContent = duo || !touchChar?.special ? 'Special' : touchChar.special.name;
  if (!legend.classList.contains('hidden') && (wasHidden || fresh)) {
    legend.classList.remove('dim'); clearTimeout(legendTimer);
    legendTimer = setTimeout(() => legend.classList.add('dim'), 6000);
  }
  const ctl = $('#btn-ctrl');
  ctl.classList.toggle('hidden', !touch);
  ctl.innerHTML = buttons
    ? '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="7" cy="14" r="4" fill="currentColor"/><circle cx="17" cy="10" r="3" fill="currentColor"/><circle cx="17" cy="18" r="2.4" fill="currentColor"/><path d="M3 3l18 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="7" cy="14" r="4" fill="currentColor"/><circle cx="17" cy="10" r="3" fill="currentColor"/><circle cx="17" cy="18" r="2.4" fill="currentColor"/></svg>';
  ctl.setAttribute('aria-label', buttons ? 'Knoppen verbergen' : 'Knoppen tonen');
  ctl.title = buttons ? 'Knoppen verbergen' : 'Knoppen tonen';
}
$('#btn-ctrl').addEventListener('click', () => {
  const pads = connectedPads().length > 0;
  const shown = controlsOverride ?? (isTouch() && !pads);
  controlsOverride = !shown;
  sfx.click(); refreshControls(true);
});
onPadCountChange((n) => {
  if (n) $('#pad-help').classList.remove('hidden');
  controlsOverride = null; // controller erbij of weg: weer automatisch kiezen
  refreshControls(true);
});
function startLevel(level, checkpoint, refill = false) {
  initAudio();
  mode = 'play';
  closeModal();
  hideScreens();
  $('#banner').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  clearPressed();
  const cs = playingChars();
  showTouch(cs[0]);
  paintLifeIcons(cs);
  const ctls = cs.length === 1 ? [controllers[0]] : role === 'host' ? [controllers[0], remote] : [controllers[0], controllers[1]];
  const worldIdx = WORLDS.indexOf(currentWorld);
  if (role === 'host') { fxQueue = []; sendNet({ t: 'start', worldIdx, level, checkpoint, coins: run.coins, lives: run.lives, chars: run.chars, run }); }
  game.start({ worldIdx, level, checkpoint, coins: run.coins, lives: run.lives, chars: cs, ctls, refill });
}
// gast: het spel van de host laten zien
function guestStart(m) {
  initAudio();
  run = normalizeRun(m.run);
  currentWorld = WORLDS[m.worldIdx];
  mode = 'play';
  closeModal(); hideScreens();
  $('#banner').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  clearPressed();
  const cs = m.chars.map(charById);
  showTouch(cs[1]);
  paintLifeIcons(cs);
  game.start({ worldIdx: m.worldIdx, level: m.level, checkpoint: m.checkpoint, coins: m.coins, lives: m.lives, chars: cs, ctls: [], mirror: true });
}

// levens zijn samen: met z'n tweeën staan beide hoofdjes bij de levens, zodat ook speler 2 ze ziet
function paintLifeIcons(cs) {
  renderHead($('#hud-life-ico'), cs[0], 30);
  const two = $('#hud-life-ico2');
  two.classList.toggle('hidden', cs.length < 2);
  if (cs.length > 1) renderHead(two, cs[1], 30);
  $('#hud-lives').classList.toggle('duo', cs.length > 1);
  $('#hud-lives').title = cs.length > 1 ? 'Levens (samen)' : 'Levens';
}
function leaveGame() {
  game.running = false; mode = 'menu';
  $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); $('#boss-bar').classList.add('hidden'); $('#pad-legend').classList.add('hidden');
  playMusic('title');
}

// ---------- pause ----------
function pause() {
  if (mode !== 'play' || !game.running || !$('#modal').classList.contains('hidden')) return;
  sendNet({ t: 'pause' });
  showPause(true);
}
function showPause(mine) {
  game.paused = true; sfx.click();
  modal(`
    <h2>Pauze</h2>
    <p>${esc(currentWorld.name)} · level ${game.level} · ${game.coins} munten${mine ? '' : `<br><small>Speler ${role === 'host' ? 2 : 1} drukte op pauze</small>`}</p>
    <div class="menu">
      <button class="big-btn" data-act="resume">Verder</button>
      <button class="big-btn alt" data-act="settings">⚙️ Instellingen</button>
      <button class="big-btn alt" data-act="stop">Stoppen</button>
    </div>`, (act) => {
    if (act === 'resume') { closeModal(); game.paused = false; clearPressed(); sendNet({ t: 'resume' }); }
    if (act === 'settings') { openSettings(() => showPause(mine)); return; }
    if (act === 'stop') {
      if (!game.coins) { closeModal(); doStop(); return; } // 0 munten: geen bevestiging nodig
      modal(`<h2>Stoppen?</h2><p>Het spel stopt en de score van <b>${game.coins} munten</b> wordt geregistreerd.</p>
        <div class="menu"><button class="big-btn" data-act="yes">Ja, stoppen</button><button class="big-btn alt" data-act="no">Nee, verder spelen</button></div>`, (a2) => {
        if (a2 === 'no') { closeModal(); game.paused = false; clearPressed(); sendNet({ t: 'resume' }); }
        if (a2 === 'yes') doStop();
      });
    }
  });
  focusFirst();
}
function doStop() {
  if (role === 'guest') { sendNet({ t: 'stop' }); modal('<h2>Stoppen…</h2>', () => {}); return; }
  run.coins = game.coins; endRun('stop');
}
$('#btn-pause').addEventListener('click', pause);

// ---------- instellingen (ook tijdens het spel) ----------
function openSettings(back = null) {
  const inGame = mode === 'play' && game.running;
  const wasPaused = game.paused;
  if (inGame) game.paused = true;
  const render = (focusAct) => {
    const pads = connectedPads().length > 0;
    const buttonsOn = controlsOverride ?? (isTouch() && !pads);
    const row = (label, act, on) => `<div class="set-row"><span>${label}</span><button class="toggle ${on ? 'on' : ''}" data-act="${act}">${on ? 'Aan' : 'Uit'}</button></div>`;
    modal(`<h2>Instellingen</h2>
      ${row('🎵 Muziek', 'music', settings.music)}
      ${row('🔊 Geluidseffecten', 'sfx', settings.sfx)}
      ${inGame && isTouch() ? row('👆 Knoppen in beeld', 'buttons', buttonsOn) : ''}
      <p id="open-games" class="hidden" style="font-size:.85em;color:#c0392b;margin:6px 0 0"></p>
      <div class="menu"><button class="big-btn" data-act="close">${back ? 'Terug' : inGame ? 'Verder spelen' : 'Klaar'}</button></div>`, (act) => {
      if (act === 'music') { toggleMusic(); render('music'); }
      if (act === 'sfx') { toggleSfx(); render('sfx'); }
      if (act === 'buttons') { controlsOverride = !buttonsOn; refreshControls(true); render('buttons'); }
      if (act === 'close') {
        if (back) { back(); return; }
        closeModal();
        if (inGame && !wasPaused) { game.paused = false; clearPressed(); }
      }
    });
    if (focusAct && connectedPads().length) requestAnimationFrame(() => $(`#modal-card [data-act="${focusAct}"]`)?.focus());
    // staat het spel nog ergens anders open? Dan hoor je misschien ook die muziek
    countOpenGames().then((n) => {
      const el = $('#open-games'); if (!el || n < 2) return;
      el.textContent = `⚠️ Het spel staat ${n}× open. Sluit de andere vensters, anders hoor je dubbele muziek.`;
      el.classList.remove('hidden');
    });
  };
  render();
}
$('#btn-settings').addEventListener('click', () => {
  if (mode !== 'play' || !$('#modal').classList.contains('hidden')) return;
  sfx.click(); openSettings();
});
// 2 spelers op één apparaat: bij welke speler hoort deze controller? (zelfde indeling als in input.js)
function padSlot(padIdx) {
  return connectedPads().length >= 2 ? Math.min(padIdx, 1) : (isTouch() ? 1 : 0);
}
let iniOwner = null; // 0/1 = alleen die speler mag nu initialen intikken (2 spelers op één apparaat)
// Wie mag het menu nu bedienen? null = iedereen
function menuOwner() {
  if (iniOwner !== null) return iniOwner;
  if (run?.mode === 'local2' && !$('#scr-worlds').classList.contains('hidden')) return 0; // alleen speler 1 kiest de wereld
  return null;
}
// Op een iPad met één controller tikt speler 1 op het scherm en heeft speler 2 de controller:
// is speler 2 aan de beurt, dan telt tikken op het scherm niet mee.
function touchBlocked(e) {
  return e.isTrusted && menuOwner() === 1 && isTouch() && connectedPads().length === 1;
}
initInput(pause, (dir, padIdx) => {
  if (mode === 'play') return;
  const choosing = party.mode === 'local2' && !$('#scr-chars').classList.contains('hidden') && $('#modal').classList.contains('hidden');
  if (choosing && connectedPads().length >= 2 && padIdx !== party.slot) return;
  const owner = menuOwner();
  if (owner !== null && padSlot(padIdx) !== owner) return;
  spatialNav(dir);
});
// tik of muis: de gele controller-rand is dan niet nodig
window.addEventListener('pointerdown', () => document.body.classList.remove('padnav'));
onPadConnected(() => { $('#pad-help').classList.remove('hidden'); });

// ---------- modal ----------
let modalHandler = null;
function modal(html, handler) {
  $('#modal-card').innerHTML = html;
  $('#modal').classList.remove('hidden');
  modalHandler = handler;
  if (connectedPads().length) focusFirst();
}
function closeModal() { $('#modal').classList.add('hidden'); modalHandler = null; }
function focusFirst() { if (!connectedPads().length) return; requestAnimationFrame(() => $('#modal-card').querySelector('button:not([disabled])')?.focus()); }
$('#modal').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (b && modalHandler && !touchBlocked(e)) { sfx.click(); modalHandler(b.dataset.act, b); }
});

// ---------- initialen intikken ----------
// Vraagt 3 letters; who = 'Speler 1' / 'Speler 2' of '' (1 speler)
function askInitials({ title, sub, score, done, faces, who, start, owner = null }, onSave) {
  iniOwner = owner;
  let ini = (start || '').slice(0, 3).split('');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const render = () => {
    const boxes = [0, 1, 2].map((i) => `<div class="ini-box ${i === ini.length ? 'active' : ''}">${ini[i] || ''}</div>`).join('');
    modal(`
      <h2>${title}</h2>
      ${sub ? `<p>${sub}</p>` : ''}
      <div class="score-head"><span class="mini-heads">${faces.map(() => '<canvas class="modal-portrait small"></canvas>').join('')}</span><div><div class="big-score">${score}</div><p>munten</p></div></div>
      <div class="medal-row">${medalsHtml(done)}</div>
      <p style="margin-bottom:4px">${who ? `<b>${who}</b>, typ` : 'Typ'} je initialen voor het scorebord:</p>
      <div class="ini-boxes">${boxes}</div>
      <div class="keyboard">${letters.map((l) => `<button data-act="k" data-l="${l}">${l}</button>`).join('')}<button class="wide" data-act="del">⌫ Wis</button></div>
      <div class="menu"><button class="big-btn" data-act="save" ${ini.length ? '' : 'disabled'}>Opslaan</button></div>
    `, (act, btn) => {
      if (act === 'k' && ini.length < 3) { ini.push(btn.dataset.l); render(); if (ini.length === 3) requestAnimationFrame(() => requestAnimationFrame(() => $('[data-act="save"]')?.focus())); }
      if (act === 'del') { ini.pop(); render(); }
      if (act === 'save' && ini.length) save();
    });
    document.querySelectorAll('#modal-card .modal-portrait').forEach((cv, i) => renderPortrait(cv, faces[i], { w: 80, h: 80 }));
  };
  const save = () => { window.removeEventListener('keydown', onKey); iniOwner = null; onSave(ini.join('')); };
  const onKey = (e) => {
    if (!$('.ini-boxes')) return;
    if (/^[a-z]$/i.test(e.key) && ini.length < 3) { ini.push(e.key.toUpperCase()); render(); }
    else if (e.key === 'Backspace') { ini.pop(); render(); }
    else if (e.key === 'Enter' && ini.length) save();
  };
  window.addEventListener('keydown', onKey);
  render();
}

// ---------- end of a run: always register the score ----------
let highlightTab = null;
let scorePlayers = 1;
let guestIniWaiter = null;
function endRun(kind, opts = {}) {
  const finished = run;
  run = null; store.clearRun();
  leaveGame();
  hideScreens();
  const cs = finished.chars.map(charById);
  const duo = cs.length > 1;
  const score = finished.coins, done = finished.completed;
  const online = role === 'host';
  if (online) sendNet({ t: 'end', kind, score, done, chars: finished.chars });
  if (!score && kind !== 'won') { if (online) leaveOnline(); if (!opts.quiet) show('title'); return; } // niets verdiend: niet opslaan
  const title = kind === 'won' ? 'Alles uitgespeeld!' : kind === 'gameover' ? 'Game over' : 'Spel gestopt';
  const sub = kind === 'won' ? `${duo ? 'Jullie hebben' : 'Je hebt'} de mensen in alle vier de werelden bevrijd!` : kind === 'gameover' ? `${duo ? 'Jullie' : 'Je'} levens zijn op.` : '';
  const base = { title, sub, score, done, faces: cs };

  const finish = async (inis) => {
    const id = Math.random().toString(36).slice(2, 12);
    const date = new Date().toISOString().slice(0, 10);
    const entry = duo ? { id, initials: inis, characters: finished.chars, worlds: done, score, date }
      : { id, initials: inis[0], character: cs[0].id, worlds: done, score, date };
    store.addLocalScore(entry, duo);
    $('#modal-card').innerHTML = '<h2>Opslaan…</h2>'; $('#modal').classList.remove('hidden');
    let ok = true;
    try { lastPosted = await store.postGlobalScore(entry, duo); } catch { ok = false; lastPosted = null; }
    if (online) { sendNet({ t: 'scores', entry, ok, posted: lastPosted }); setTimeout(leaveOnline, 1500); }
    closeModal();
    highlightId = entry.id; highlightTab = ok ? 'global' : 'local'; scorePlayers = duo ? 2 : 1;
    show('scores');
  };
  const ask = () => {
    const local2 = duo && finished.mode === 'local2';
    askInitials({ ...base, who: duo ? 'Speler 1' : '', start: settings.initials, owner: local2 ? 0 : null }, (a) => {
      settings.initials = a; store.setSettings({ initials: a });
      if (!duo) { finish([a]); return; }
      if (finished.mode === 'local2') {
        askInitials({ ...base, who: 'Speler 2', start: settings.initials2, owner: 1 }, (b) => {
          settings.initials2 = b; store.setSettings({ initials2: b });
          finish([a, b]);
        });
        return;
      }
      // online: speler 2 tikt op het eigen apparaat
      const go = () => { guestIniWaiter = null; finish([a, guestIni || 'SP']); };
      if (guestIni || opts.guestGone || !net?.open) { go(); return; }
      modal(`<h2>Bijna klaar</h2><p class="wait-dots">Wachten tot speler 2 de initialen heeft ingetikt</p>
        <div class="menu"><button class="big-btn alt small" data-act="skip">Niet wachten</button></div>`, (act) => { if (act === 'skip') go(); });
      guestIniWaiter = go;
    });
  };
  guestIni = null;
  if (kind === 'won') playFinale(cs, ask); else ask();
}
// gast: het spel is afgelopen
function guestEnd(m) {
  leaveGame(); hideScreens(); run = null;
  if (!m.score && m.kind !== 'won') { leaveOnline(); show('title'); closeModal(); return; }
  const cs = m.chars.map(charById);
  const title = m.kind === 'won' ? 'Alles uitgespeeld!' : m.kind === 'gameover' ? 'Game over' : 'Spel gestopt';
  const ask = () => askInitials({ title, sub: '', score: m.score, done: m.done, faces: cs, who: 'Speler 2', start: settings.initials2 || settings.initials }, (b) => {
    settings.initials2 = b; store.setSettings({ initials2: b });
    sendNet({ t: 'ini', ini: b });
    modal('<h2>Opslaan…</h2><p class="wait-dots">Speler 1 slaat de score op</p>', () => {});
  });
  if (m.kind === 'won') playFinale(cs, ask); else ask();
}
function guestScores(m) {
  store.addLocalScore(m.entry, true);
  lastPosted = m.posted;
  leaveOnline();
  closeModal();
  highlightId = m.entry.id; highlightTab = m.ok ? 'global' : 'local'; scorePlayers = 2;
  show('scores');
}

// ---------- slot-parade ----------
let finale = null, finaleDone = null;
function playFinale(heroes, then) {
  finale = createFinale(heroes); finaleDone = then;
  mode = 'finale'; hideScreens(); closeModal();
  playMusic('title'); sfx.victory();
  const btn = document.createElement('button');
  btn.id = 'finale-skip'; btn.className = 'big-btn small'; btn.textContent = 'Verder ›';
  btn.addEventListener('click', () => { sfx.click(); endFinale(); });
  document.body.appendChild(btn);
}
function endFinale() {
  if (!finale) return;
  finale = null; mode = 'menu';
  document.getElementById('finale-skip')?.remove();
  const f = finaleDone; finaleDone = null; if (f) f();
}

// ---------- scoreboard ----------
document.querySelectorAll('.tab[data-tab]').forEach((t) => t.addEventListener('click', () => {
  sfx.click(); buildScores(t.dataset.tab, scorePlayers);
}));
document.querySelectorAll('.ptab').forEach((t) => t.addEventListener('click', () => {
  sfx.click(); scorePlayers = +t.dataset.players; buildScores(curTab, scorePlayers);
}));
let curTab = 'global';
async function buildScores(tab, players = 1) {
  curTab = tab;
  const duo = players === 2;
  document.querySelectorAll('.tab[data-tab]').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
  document.querySelectorAll('.ptab').forEach((x) => x.classList.toggle('active', +x.dataset.players === players));
  const list = $('#score-list');
  list.innerHTML = '<div class="empty">Laden…</div>';
  let rows;
  if (tab === 'local') rows = store.getLocalScores(duo);
  else {
    try { rows = await store.fetchGlobalScores(duo); }
    catch { list.innerHTML = '<div class="empty">Het algemene scorebord is nu niet bereikbaar.<br>Bekijk je eigen scores bij "Op dit apparaat".</div>'; return; }
  }
  if (curTab !== tab) return;
  if (!rows.length) { list.innerHTML = `<div class="empty">Nog geen scores${duo ? ' voor 2 spelers' : ''}. Speel en zet ${duo ? 'jullie' : 'jouw'} naam bovenaan!</div>`; return; }
  list.innerHTML = '';
  const top = rows.slice(0, 10);
  const mine = highlightId ? rows.findIndex((r) => r.id === highlightId) : -1;
  const addRow = (r, i) => {
    const chars = (r.characters || [r.character]).map(charById);
    const inis = Array.isArray(r.initials) ? r.initials : [r.initials];
    const done = Array.isArray(r.worlds) ? r.worlds : []; // oude scores (met alleen de gespeelde wereld) krijgen geen sticker
    const row = document.createElement('div');
    row.className = `score-row ${chars.length > 1 ? 'duo' : ''} ${i < 3 ? 'top' + (i + 1) : ''} ${r.id && r.id === highlightId ? 'me' : ''}`;
    const cup = i < 3 ? `<svg class="cup c${i + 1}" viewBox="0 0 32 32"><path d="M9 4h14v7a7 7 0 0 1-14 0z"/><path d="M9 6H4v2a5 5 0 0 0 5 5M23 6h5v2a5 5 0 0 1-5 5" fill="none" stroke-width="2.4"/><rect x="14" y="17" width="4" height="6"/><rect x="9" y="23" width="14" height="4" rx="1.5"/></svg>` : '';
    const faces = chars.length > 1 ? `<span class="faces">${chars.map((c) => `<canvas title="${c.name}"></canvas>`).join('')}</span>` : `<canvas class="face" title="${chars[0].name}"></canvas>`;
    row.innerHTML = `<span class="rank">${cup}<b>${i + 1}</b></span><span class="ini ${inis.length > 1 ? 'duo' : ''}">${inis.map(esc).join(' & ')}</span>
      ${faces}<span class="date">${esc(fmtDate(r.date))}</span>
      <span class="medal-row mini">${medalsHtml(done, false)}</span>
      <span class="pts">${r.score}</span>`;
    list.appendChild(row);
    row.querySelectorAll('canvas').forEach((cv, k) => renderHead(cv, chars[k]));
    return row;
  };
  top.forEach(addRow);
  let mineRow = mine >= 10 ? [rows[mine], mine] : null;
  if (mine === -1 && tab === 'global' && lastPosted?.entry?.id === highlightId && lastPosted.rank > 10) mineRow = [lastPosted.entry, lastPosted.rank - 1];
  if (mineRow) {
    const sep = document.createElement('div'); sep.className = 'score-sep'; sep.textContent = duo ? 'Jullie score' : 'Jouw score'; list.appendChild(sep);
    addRow(mineRow[0], mineRow[1]);
  }
  const me = list.querySelector('.me');
  if (me) { me.scrollIntoView({ block: 'center' }); if (mine >= 0 && mine < 10) sfx.levelUp(); }
}
function fmtDate(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}` : (d || '');
}
function renderHead(cv, def, size = 40) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = size * dpr; cv.height = size * dpr;
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr * size / 40, 0, 0, dpr * size / 40, 0, 0);
  ctx.save();
  // het hoofd netjes in het midden van het rondje
  if (def.kind === 'cat') { ctx.translate(-15, 71); ctx.scale(1.6, 1.6); }
  else { const k = 155 / def.height; ctx.translate(19, 22 + def.height * 0.86 * k * 0.6); ctx.scale(k * 0.6, k * 0.6); }
  drawCharacter(ctx, def, { t: 0.5, walk: 0, moving: false, air: false, atk: -1, noWeapon: true, bust: true });
  ctx.restore();
}

// ---------- title scene ----------
let titleT = 0;
function renderTitle(dt) {
  titleT += dt;
  const ctx = canvas.getContext('2d');
  const s = (canvas.height) / 540;
  const W = canvas.width / s, H = 540;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  drawBackground(ctx, 'jungle', titleT * 30, 0, W, H, titleT);
  drawGround(ctx, 'jungle', { x: -20, w: W + 40, y: 470 }, 560);
  const n = CHARACTERS.length;
  const gap = Math.min(110, (W - 80) / n);
  CHARACTERS.forEach((c, i) => {
    ctx.save();
    const x = W / 2 + (i - (n - 1) / 2) * gap;
    const hop = Math.max(0, Math.sin(titleT * 3 + i * 0.8)) * 14;
    ctx.translate(x, 470 - hop);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(c.kind === 'cat' ? 10 : 0, hop, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.scale(1.25, 1.25);
    drawCharacter(ctx, c, { t: titleT + i, walk: 0, moving: false, air: hop > 2, atk: -1 });
    ctx.restore();
  });
}

// ---------- orientation hint ----------
const rot = document.createElement('div');
rot.id = 'rotate-hint';
rot.style.cssText = 'position:fixed;inset:0;z-index:20;display:none;align-items:center;justify-content:center;flex-direction:column;background:linear-gradient(#5cc3f5,#c9ecff);color:#fff;font-weight:800;font-size:30px;text-align:center;text-shadow:0 3px 0 #1d6aa3;padding:20px';
rot.innerHTML = '<div style="font-size:80px">📱↻</div>Draai je scherm een kwartslag<br>om te spelen';
document.body.appendChild(rot);
function checkRotate() {
  const portrait = window.innerHeight > window.innerWidth * 1.1;
  const need = mode === 'play' && isTouch() && portrait;
  rot.style.display = need ? 'flex' : 'none';
  if (role) return; // online: de pauze loopt via het pauzemenu
  if (need && game.running) game.paused = true;
  else if (mode === 'play' && game.running && $('#modal').classList.contains('hidden')) game.paused = false;
}

// ---------- main loop ----------
function onResize() { game.resize(); checkRotate(); if (role === 'guest') sendNet({ t: 'hello', viewW: game.baseViewW }); }
window.addEventListener('resize', onResize);
window.visualViewport?.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => { for (const ms of [100, 300, 700]) setTimeout(onResize, ms); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && game.running && !game.paused) pause(); });
let last = performance.now();
let frameNo = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  frameNo++;
  if (game.sizeChanged()) onResize();
  checkPadCount();
  pollInput(mode === 'play');
  if (mode === 'play' && game.lv) {
    if (role === 'guest') {
      sendNet({ t: 'i', ...controllers[0].snapshot() }, true);
      game.update(dt);
    } else {
      game.update(dt / 2); game.update(dt / 2); // two half steps for smoother physics
      if (role === 'host') {
        if (frameNo % 2 === 0 && game.running) sendNet({ t: 's', s: game.snapshot() }, true);
        if (fxQueue.length) { sendNet({ t: 'fx', l: fxQueue }); fxQueue = []; }
      }
    }
    game.render();
  } else if (mode === 'finale' && finale) {
    finale.update(dt);
    const ctx = canvas.getContext('2d'); const s = canvas.height / 540;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    finale.render(ctx, canvas.width / s, 540);
    if (finale.done) endFinale();
  } else renderTitle(dt);
  requestAnimationFrame(frame);
}
game.resize();
requestAnimationFrame(frame);
checkRotate();
if (connectedPads().length) $('#pad-help').classList.remove('hidden');

// unlock audio on first interaction (iPad)
window.addEventListener('pointerdown', () => { initAudio(); if (mode === 'menu') playMusic('title'); }, { once: true });

// debug helpers (only via URL ?debug)
if (location.search.includes('debug')) {
  window.__avalon = {
    game, WORLDS, get run() { return run; }, get role() { return role; }, get net() { return net; }, controllers,
    finale(id = 'avalon') { playFinale([charById(id)], () => {}); },
    play(worldIdx, charIds, level = 1) {
      const ids = Array.isArray(charIds) ? charIds : [charIds];
      selectedChar = charById(ids[0]);
      run = { mode: ids.length > 1 ? 'local2' : 'single', chars: ids, char: ids[0], lives: 3, coins: 0, completed: [], current: null };
      setInputMode(run.mode);
      currentWorld = WORLDS[worldIdx]; run.current = { world: currentWorld.id, level, checkpoint: 0 };
      startLevel(level, 0);
    },
    end(kind = 'stop') { run.coins = game.coins || 5; endRun(kind); },
  };
}
