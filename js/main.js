// Menu's, schermen en de spel-lus
//
// Eén spel = één personage, 3 levens en vier werelden. Je kiest een wereld, blijft daarin tot hij
// uitgespeeld is en kiest dan de volgende. Het spel eindigt als alle werelden uitgespeeld zijn,
// als je levens op zijn (game over) of als je stopt. De score wordt dan altijd geregistreerd.
import { CHARACTERS, charById, renderPortrait, drawCharacter } from './characters.js';
import { WORLDS } from './worlds.js';
import { drawWorldPreview, drawBackground, drawGround } from './art.js';
import { Game } from './game.js';
import { createFinale } from './finale.js';
import { initInput, isTouch, clearPressed } from './input.js';
import { initAudio, setMusic, setSfx, sfx, playMusic } from './audio.js';
import * as store from './storage.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const settings = store.getSettings();
let selectedChar = charById(settings.character);
let run = store.getRun();        // het lopende spel (of null)
let currentWorld = run?.current ? WORLDS.find((w) => w.id === run.current.world) : null;
let mode = 'menu';               // menu | play
let highlightId = null;          // nieuwe score die in het scorebord oplicht
let lastPosted = null;           // antwoord van de server op de laatste score (met plek)

setMusic(settings.music); setSfx(settings.sfx);

export const MEDALS = {
  jungle: { icon: '🌴', label: 'Oerwoud' },
  clouds: { icon: '☁️', label: 'Paarse Wolken' },
  water: { icon: '🐠', label: 'Onderwater' },
  sky: { icon: '🐉', label: 'Lucht' },
};
const runChar = () => charById(run?.char || selectedChar.id);
const saveRun = () => { if (run) store.setRun(run); };

// ---------- game hooks ----------
let bannerTimer = null;
const game = new Game(canvas, {
  onHud({ hearts, max, lives, coins, label }) {
    $('#hud-hearts').innerHTML = Array.from({ length: max }, (_, i) => `<svg class="h ${i < hearts ? '' : 'empty'}" viewBox="0 0 32 30"><path d="M16 28C4 19 1 13 1 8.5 1 4.4 4.3 1 8.5 1c3 0 5.6 1.8 7.5 4.6C17.9 2.8 20.5 1 23.5 1 27.7 1 31 4.4 31 8.5 31 13 28 19 16 28z"/></svg>`).join('');
    $('#hud-life-count').textContent = `×${lives}`;
    $('#hud-coin-count').textContent = coins;
    $('#hud-level').textContent = label;
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
    startLevel(level + 1, 0); // nieuw level: hartjes weer vol
  },
  onWorldComplete({ coins, lives }) {
    if (!run.completed.includes(currentWorld.id)) run.completed.push(currentWorld.id);
    run.coins = coins; run.lives = lives; run.current = null; saveRun();
    leaveGame();
    if (run.completed.length >= WORLDS.length) { endRun('won'); return; }
    show('worlds');
    modal(`<h2>${esc(currentWorld.name)} uitgespeeld!</h2>
      <div class="medal-row big">${medalsHtml(run.completed)}</div>
      <p>Je hebt de mensen bevrijd. Kies je volgende wereld!</p>
      <div class="menu"><button class="big-btn" data-act="ok">Verder</button></div>`, () => closeModal());
  },
  onGameOver({ coins }) { if (run) run.coins = coins; endRun('gameover'); },
});

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
  if (id === 'scores') buildScores(highlightTab || 'global');
}
function hideScreens() { document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden')); }

document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => {
  sfx.click();
  if (b.dataset.back === 'chars' && run) show('title'); else show(b.dataset.back);
}));

$('#btn-play').addEventListener('click', () => {
  initAudio(); playMusic('title'); sfx.click();
  if (!run) { show('chars'); return; }
  const c = runChar();
  modal(`
    <h2>Je spel loopt nog</h2>
    <canvas class="modal-portrait small" id="mp"></canvas>
    <p>Met <b>${esc(c.name)}</b>, <b>${run.coins} munten</b> en <b>${run.lives} ${run.lives === 1 ? 'leven' : 'levens'}</b>.</p>
    <div class="medal-row">${medalsHtml(run.completed)}</div>
    <div class="menu">
      <button class="big-btn" data-act="continue">Verder spelen</button>
      <button class="big-btn alt" data-act="new">Nieuw spel</button>
    </div>`, (act) => {
    if (act === 'continue') { closeModal(); resumeRun(); }
    if (act === 'new') {
      if (!run.coins) { closeModal(); endRun('stop'); return; } // 0 munten: geen bevestiging nodig
      modal(`<h2>Nieuw spel?</h2><p>Je huidige spel stopt en je score van <b>${run.coins} munten</b> wordt geregistreerd.</p>
        <div class="menu"><button class="big-btn" data-act="yes">Ja, stoppen</button><button class="big-btn alt" data-act="no">Nee, terug</button></div>`, (a2) => {
        closeModal();
        if (a2 === 'yes') endRun('stop');
      });
    }
  });
  renderPortrait($('#mp'), c, { w: 80, h: 80 });
});
$('#btn-scores').addEventListener('click', () => { initAudio(); sfx.click(); highlightId = null; highlightTab = null; show('scores'); });

const musicBtn = $('#btn-music'), sfxBtn = $('#btn-sfx');
const paintSound = () => {
  musicBtn.textContent = settings.music ? '🎵 Muziek aan' : '🎵 Muziek uit';
  sfxBtn.textContent = settings.sfx ? '🔊 Effecten aan' : '🔇 Effecten uit';
  musicBtn.classList.toggle('off', !settings.music); sfxBtn.classList.toggle('off', !settings.sfx);
};
paintSound();
musicBtn.addEventListener('click', () => {
  initAudio(); settings.music = !settings.music; setMusic(settings.music); store.setSettings({ music: settings.music }); paintSound();
  if (settings.music) playMusic('title');
  sfx.click();
});
sfxBtn.addEventListener('click', () => {
  initAudio(); settings.sfx = !settings.sfx; setSfx(settings.sfx); store.setSettings({ sfx: settings.sfx }); paintSound();
  sfx.click();
});

// ---------- characters ----------
function buildChars() {
  const grid = $('#char-grid');
  grid.innerHTML = '';
  for (const c of CHARACTERS) {
    const card = document.createElement('button');
    card.className = 'card' + (c.id === selectedChar.id ? ' selected' : '');
    card.innerHTML = `<canvas></canvas><div class="c-name">${c.name}</div>`;
    card.addEventListener('click', () => {
      if (selectedChar.id === c.id) { startRun(); return; }
      selectedChar = c; store.setSettings({ character: c.id });
      grid.querySelectorAll('.card').forEach((el) => el.classList.remove('selected'));
      card.classList.add('selected'); sfx.click(); paintDetail();
    });
    grid.appendChild(card);
    requestAnimationFrame(() => renderPortrait(card.querySelector('canvas'), c));
  }
  paintDetail();
}
function paintDetail() {
  const c = selectedChar;
  const bar = (v) => `<span class="stat-bar"><i style="width:${v * 20}%"></i></span>`;
  $('#char-detail').innerHTML = `
    <div class="power">
      <h3>${c.name}</h3>
      <div class="power-tag">Superkracht: ${c.power} (${c.weapon.toLowerCase()})</div>
      <p>${c.desc}</p>
    </div>
    <div class="stats">
      <span>Kracht</span>${bar(c.stats.kracht)}
      <span>Bereik</span>${bar(c.stats.bereik)}
      <span>Snelheid</span>${bar(c.stats.snelheid)}
    </div>
    <button class="big-btn" id="btn-choose">Kies ${c.name}</button>`;
  $('#btn-choose').addEventListener('click', startRun);
}

// ---------- run ----------
function startRun() {
  sfx.click();
  run = { char: selectedChar.id, lives: 3, coins: 0, completed: [], current: null, started: new Date().toISOString() };
  saveRun();
  show('worlds');
}
function resumeRun() {
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
  const c = runChar();
  $('#world-sub').innerHTML = run ? `<span class="chip"><canvas class="chip-ico" id="ws-ico"></canvas>${esc(c.name)}</span>
    <span class="chip"><span class="coin-ico">A</span>${run.coins}</span>
    <span class="chip" title="levens"><canvas class="chip-ico" id="ws-life"></canvas>×${run.lives}</span>` : '';
  if (run) { renderHead($('#ws-ico'), c, 30); renderHead($('#ws-life'), c, 30); }
  WORLDS.forEach((w, idx) => {
    const got = done.includes(w.id);
    const card = document.createElement('button');
    card.className = 'card world-card' + (got ? ' done' : '');
    card.innerHTML = `<canvas></canvas>${got ? `<span class="w-badge">${MEDALS[w.id].icon} Uitgespeeld</span>` : ''}<div class="w-info"><div class="w-name">${w.name}</div><div class="w-prog">${got ? 'De mensen zijn bevrijd!' : w.blurb}</div></div>`;
    card.addEventListener('click', () => {
      if (got) { sfx.click(); game.hooks.onBanner('Al uitgespeeld!', 'Kies een andere wereld', 1400); return; }
      sfx.click(); chooseWorld(idx);
    });
    grid.appendChild(card);
    requestAnimationFrame(() => drawWorldPreview(card.querySelector('canvas'), w.id));
  });
}
function chooseWorld(idx) {
  currentWorld = WORLDS[idx];
  run.current = { world: currentWorld.id, level: 1, checkpoint: 0 };
  saveRun();
  startLevel(1, 0);
}

function startLevel(level, checkpoint) {
  initAudio();
  mode = 'play';
  closeModal();
  hideScreens();
  $('#banner').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#touch').classList.toggle('hidden', !isTouch());
  clearPressed();
  const c = runChar();
  renderHead($('#hud-life-ico'), c, 30);
  game.start({ worldIdx: WORLDS.indexOf(currentWorld), level, checkpoint, coins: run.coins, lives: run.lives, char: c });
}

function leaveGame() {
  game.running = false; mode = 'menu';
  $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); $('#boss-bar').classList.add('hidden');
  playMusic('title');
}

// ---------- pause ----------
function pause() {
  if (mode !== 'play' || !game.running || !$('#modal').classList.contains('hidden')) return;
  game.paused = true; sfx.click();
  modal(`
    <h2>Pauze</h2>
    <p>${esc(currentWorld.name)} · level ${game.level} · ${game.coins} munten</p>
    <div class="menu">
      <button class="big-btn" data-act="resume">Verder</button>
      <button class="big-btn alt" data-act="stop">Stoppen</button>
    </div>`, (act) => {
    if (act === 'resume') { closeModal(); game.paused = false; clearPressed(); }
    if (act === 'stop') {
      if (!game.coins) { closeModal(); run.coins = 0; endRun('stop'); return; } // 0 munten: geen bevestiging nodig
      modal(`<h2>Stoppen?</h2><p>Je spel stopt en je score van <b>${game.coins} munten</b> wordt geregistreerd.</p>
        <div class="menu"><button class="big-btn" data-act="yes">Ja, stoppen</button><button class="big-btn alt" data-act="no">Nee, verder spelen</button></div>`, (a2) => {
        if (a2 === 'no') { closeModal(); game.paused = false; clearPressed(); }
        if (a2 === 'yes') { run.coins = game.coins; endRun('stop'); }
      });
    }
  });
}
$('#btn-pause').addEventListener('click', pause);
initInput(pause);

// ---------- modal ----------
let modalHandler = null;
function modal(html, handler) {
  $('#modal-card').innerHTML = html;
  $('#modal').classList.remove('hidden');
  modalHandler = handler;
}
function closeModal() { $('#modal').classList.add('hidden'); modalHandler = null; }
$('#modal').addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (b && modalHandler) { sfx.click(); modalHandler(b.dataset.act, b); }
});

// ---------- end of a run: always register the score ----------
let highlightTab = null;
function endRun(kind) {
  const finished = run;
  run = null; store.clearRun();
  leaveGame();
  hideScreens();
  const c = charById(finished.char);
  const score = finished.coins, done = finished.completed;
  if (!score && kind !== 'won') { show('title'); return; } // niets verdiend: niet opslaan, terug naar het hoofdmenu
  let ini = (settings.initials || '').slice(0, 3).split('');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const title = kind === 'won' ? 'Alles uitgespeeld!' : kind === 'gameover' ? 'Game over' : 'Spel gestopt';
  const sub = kind === 'won' ? 'Je hebt de mensen in alle vier de werelden bevrijd!' : kind === 'gameover' ? 'Je levens zijn op.' : '';
  const render = () => {
    const boxes = [0, 1, 2].map((i) => `<div class="ini-box ${i === ini.length ? 'active' : ''}">${ini[i] || ''}</div>`).join('');
    modal(`
      <h2>${title}</h2>
      ${sub ? `<p>${sub}</p>` : ''}
      <div class="score-head"><canvas class="modal-portrait small" id="mp"></canvas><div><div class="big-score">${score}</div><p>munten</p></div></div>
      <div class="medal-row">${medalsHtml(done)}</div>
      <p style="margin-bottom:4px">Typ je initialen voor het scorebord:</p>
      <div class="ini-boxes">${boxes}</div>
      <div class="keyboard">${letters.map((l) => `<button data-act="k" data-l="${l}">${l}</button>`).join('')}<button class="wide" data-act="del">⌫ Wis</button></div>
      <div class="menu"><button class="big-btn" data-act="save" ${ini.length ? '' : 'disabled'}>Opslaan</button></div>
    `, async (act, btn) => {
      if (act === 'k' && ini.length < 3) { ini.push(btn.dataset.l); render(); }
      if (act === 'del') { ini.pop(); render(); }
      if (act === 'save' && ini.length) save();
    });
    renderPortrait($('#mp'), c, { w: 80, h: 80 });
  };
  const save = async () => {
    window.removeEventListener('keydown', onKey);
    const initials = ini.join('');
    settings.initials = initials; store.setSettings({ initials });
    const entry = { id: Math.random().toString(36).slice(2, 12), initials, character: c.id, worlds: done, score, date: new Date().toISOString().slice(0, 10) };
    store.addLocalScore(entry);
    $('#modal-card').innerHTML = '<h2>Opslaan…</h2>';
    let ok = true;
    try { lastPosted = await store.postGlobalScore(entry); } catch { ok = false; lastPosted = null; }
    closeModal();
    highlightId = entry.id; highlightTab = ok ? 'global' : 'local';
    show('scores');
  };
  const onKey = (e) => {
    if (!$('.ini-boxes')) return;
    if (/^[a-z]$/i.test(e.key) && ini.length < 3) { ini.push(e.key.toUpperCase()); render(); }
    else if (e.key === 'Backspace') { ini.pop(); render(); }
    else if (e.key === 'Enter' && ini.length) save();
  };
  window.addEventListener('keydown', onKey);
  if (kind === 'won') playFinale(c, render); else render();
}

// ---------- slot-parade ----------
let finale = null, finaleDone = null;
function playFinale(hero, then) {
  finale = createFinale(hero); finaleDone = then;
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
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  sfx.click(); buildScores(t.dataset.tab);
}));
async function buildScores(tab) {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
  const list = $('#score-list');
  list.innerHTML = '<div class="empty">Laden…</div>';
  let rows;
  if (tab === 'local') rows = store.getLocalScores();
  else {
    try { rows = await store.fetchGlobalScores(); }
    catch { list.innerHTML = '<div class="empty">Het algemene scorebord is nu niet bereikbaar.<br>Bekijk je eigen scores bij "Op dit apparaat".</div>'; return; }
  }
  if (!rows.length) { list.innerHTML = '<div class="empty">Nog geen scores. Speel en zet jouw naam bovenaan!</div>'; return; }
  list.innerHTML = '';
  const top = rows.slice(0, 10);
  const mine = highlightId ? rows.findIndex((r) => r.id === highlightId) : -1;
  const addRow = (r, i) => {
    const c = charById(r.character);
    const done = Array.isArray(r.worlds) ? r.worlds : []; // oude scores (met alleen de gespeelde wereld) krijgen geen sticker
    const row = document.createElement('div');
    row.className = `score-row ${i < 3 ? 'top' + (i + 1) : ''} ${r.id && r.id === highlightId ? 'me' : ''}`;
    const cup = i < 3 ? `<svg class="cup c${i + 1}" viewBox="0 0 32 32"><path d="M9 4h14v7a7 7 0 0 1-14 0z"/><path d="M9 6H4v2a5 5 0 0 0 5 5M23 6h5v2a5 5 0 0 1-5 5" fill="none" stroke-width="2.4"/><rect x="14" y="17" width="4" height="6"/><rect x="9" y="23" width="14" height="4" rx="1.5"/></svg>` : '';
    row.innerHTML = `<span class="rank">${cup}<b>${i + 1}</b></span><span class="ini">${esc(r.initials)}</span>
      <canvas class="face" title="${c.name}"></canvas><span class="date">${esc(fmtDate(r.date))}</span>
      <span class="medal-row mini">${medalsHtml(done, false)}</span>
      <span class="pts">${r.score}</span>`;
    list.appendChild(row);
    renderHead(row.querySelector('canvas'), c);
    return row;
  };
  top.forEach(addRow);
  let mineRow = mine >= 10 ? [rows[mine], mine] : null;
  if (mine === -1 && tab === 'global' && lastPosted?.entry?.id === highlightId && lastPosted.rank > 10) mineRow = [lastPosted.entry, lastPosted.rank - 1];
  if (mineRow) {
    const sep = document.createElement('div'); sep.className = 'score-sep'; sep.textContent = 'Jouw score'; list.appendChild(sep);
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
  if (need && game.running) game.paused = true;
  else if (mode === 'play' && game.running && $('#modal').classList.contains('hidden')) game.paused = false;
}

// ---------- main loop ----------
window.addEventListener('resize', () => { game.resize(); checkRotate(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && game.running && !game.paused) pause(); });
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'play' && game.lv) {
    game.update(dt / 2); game.update(dt / 2); // two half steps for smoother physics
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

// unlock audio on first interaction (iPad)
window.addEventListener('pointerdown', () => { initAudio(); if (mode === 'menu') playMusic('title'); }, { once: true });

// debug helpers (only via URL ?debug)
if (location.search.includes('debug')) {
  window.__avalon = {
    game, WORLDS, get run() { return run; },
    finale(id = 'avalon') { playFinale(charById(id), () => {}); },
    play(worldIdx, charId, level = 1) {
      selectedChar = charById(charId);
      run = { char: charId, lives: 3, coins: 0, completed: [], current: null };
      currentWorld = WORLDS[worldIdx]; run.current = { world: currentWorld.id, level, checkpoint: 0 };
      startLevel(level, 0);
    },
  };
}
