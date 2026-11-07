// Menu's, schermen en de spel-lus
import { CHARACTERS, charById, renderPortrait, drawCharacter } from './characters.js';
import { WORLDS, LEVELS_PER_WORLD, GROUND_Y } from './worlds.js';
import { drawWorldPreview, drawBackground, drawGround } from './art.js';
import { Game } from './game.js';
import { initInput, isTouch, clearPressed } from './input.js';
import { initAudio, setMusic, setSfx, sfx, playMusic, stopMusic } from './audio.js';
import * as store from './storage.js';

const $ = (s) => document.querySelector(s);
const canvas = $('#game');
const settings = store.getSettings();
let selectedChar = charById(settings.character);
let currentWorld = null;
let runChar = selectedChar; // het personage van het lopende spel (kan niet wisselen tijdens een spel)
let mode = 'menu'; // menu | play

setMusic(settings.music); setSfx(settings.sfx);

// ---------- game hooks ----------
let bannerTimer = null;
const game = new Game(canvas, {
  onHud({ hearts, max, lives, coins, label }) {
    $('#hud-life-count').textContent = `×${lives}`;
    $('#hud-hearts').innerHTML = Array.from({ length: max }, (_, i) => `<svg class="h ${i < hearts ? '' : 'empty'}" viewBox="0 0 32 30"><path d="M16 28C4 19 1 13 1 8.5 1 4.4 4.3 1 8.5 1c3 0 5.6 1.8 7.5 4.6C17.9 2.8 20.5 1 23.5 1 27.7 1 31 4.4 31 8.5 31 13 28 19 16 28z"/></svg>`).join('');
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
  onCheckpoint({ level, checkpoint, coins, lives }) { saveProgress({ level, checkpoint, coins, lives }); },
  onLifeLost({ level, checkpoint, coins, lives }) { saveProgress({ level, checkpoint, coins, lives }); },
  onLevelComplete({ level, coins, lives }) {
    const next = level + 1;
    saveProgress({ level: next, checkpoint: 0, coins, lives });
    startLevel(next, 0, coins, lives); // nieuw level: hartjes weer vol
  },
  onGameOver({ coins }) {
    store.clearProgress(currentWorld.id); // na game over begin je weer bij 0
    showScoreEntry(coins, 'gameover');
  },
  onWorldComplete({ coins }) {
    const prog = store.getProgress(currentWorld.id) || {};
    store.setProgress(currentWorld.id, { level: 1, checkpoint: 0, coins: 0, lives: 3, active: false, freed: true, best: Math.max(prog.best || 0, coins) });
    showScoreEntry(coins, 'won');
  },
});

function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function saveProgress({ level, checkpoint, coins, lives }) {
  const old = store.getProgress(currentWorld.id) || {};
  store.setProgress(currentWorld.id, { ...old, level, checkpoint, coins, lives: lives ?? old.lives ?? 3, char: runChar.id, active: true });
}

// ---------- screens ----------
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('hidden', s.id !== `scr-${id}`));
  if (id === 'chars') buildChars();
  if (id === 'worlds') buildWorlds();
  if (id === 'scores') buildScores('global');
}
function hideScreens() { document.querySelectorAll('.screen').forEach((s) => s.classList.add('hidden')); }

document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { sfx.click(); show(b.dataset.back); }));
$('#btn-play').addEventListener('click', () => { initAudio(); playMusic('title'); sfx.click(); show('chars'); });
$('#btn-scores').addEventListener('click', () => { initAudio(); sfx.click(); show('scores'); });
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

// characters
function buildChars() {
  const grid = $('#char-grid');
  grid.innerHTML = '';
  for (const c of CHARACTERS) {
    const card = document.createElement('button');
    card.className = 'card' + (c.id === selectedChar.id ? ' selected' : '');
    card.innerHTML = `<canvas></canvas><div class="c-name">${c.name}</div><div class="c-weapon">${c.weapon}</div>`;
    card.addEventListener('click', () => {
      if (selectedChar.id === c.id) { goWorlds(); return; }
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
      <h3>${c.name} · ${c.weapon}</h3>
      <div class="power-tag">Superkracht: ${c.power}</div>
      <p>${c.desc}</p>
    </div>
    <div class="stats">
      <span>Kracht</span>${bar(c.stats.kracht)}
      <span>Bereik</span>${bar(c.stats.bereik)}
      <span>Snelheid</span>${bar(c.stats.snelheid)}
    </div>
    <button class="big-btn" id="btn-choose">Kies ${c.name}</button>`;
  $('#btn-choose').addEventListener('click', goWorlds);
}
function goWorlds() { sfx.click(); show('worlds'); }

// worlds
function buildWorlds() {
  const grid = $('#world-grid');
  grid.innerHTML = '';
  WORLDS.forEach((w, idx) => {
    const prog = store.getProgress(w.id);
    const card = document.createElement('button');
    card.className = 'card world-card';
    const lvl = prog?.active ? prog.level : 0;
    const dots = Array.from({ length: LEVELS_PER_WORLD }, (_, i) => `<i class="${i + 1 < lvl ? 'done' : ''} ${i === LEVELS_PER_WORLD - 1 ? 'boss' : ''}"></i>`).join('');
    const pc = prog?.char ? charById(prog.char).name : '';
    const status = prog?.active ? `Bezig met ${pc}: level ${prog.level} · ${prog.coins} munten · ${prog.lives ?? 3} ${(prog.lives ?? 3) === 1 ? 'leven' : 'levens'}` : (prog?.freed ? 'Uitgespeeld! Speel nog eens voor een hogere score' : w.blurb);
    card.innerHTML = `<canvas></canvas>${prog?.freed ? '<span class="w-badge">★ Mensen bevrijd</span>' : ''}<div class="w-info"><div class="w-name">${w.name}</div><div class="w-prog">${status}</div><div class="dots">${dots}</div></div>`;
    card.addEventListener('click', () => { sfx.click(); chooseWorld(idx); });
    grid.appendChild(card);
    requestAnimationFrame(() => drawWorldPreview(card.querySelector('canvas'), w.id));
  });
}

function chooseWorld(idx) {
  currentWorld = WORLDS[idx];
  const prog = store.getProgress(currentWorld.id);
  if (prog?.active && (prog.level > 1 || prog.checkpoint > 0 || prog.coins > 0)) {
    const pc = charById(prog.char || selectedChar.id);
    const lives = prog.lives ?? 3;
    modal(`
      <h2>${currentWorld.name}</h2>
      <canvas class="modal-portrait" id="mp"></canvas>
      <p>Je was met <b>${pc.name}</b> bij <b>level ${prog.level}</b>${prog.checkpoint ? `, checkpoint ${prog.checkpoint}` : ''}, met <b>${prog.coins} munten</b> en <b>${lives} ${lives === 1 ? 'leven' : 'levens'}</b>.</p>
      <div class="menu">
        <button class="big-btn" data-act="continue">Verder spelen met ${pc.name}</button>
        <button class="big-btn alt" data-act="restart">Opnieuw beginnen met ${selectedChar.name}</button>
        <button class="big-btn alt small" data-act="cancel">Terug</button>
      </div>`, (act) => {
      if (act === 'continue') { closeModal(); runChar = pc; startLevel(prog.level, prog.checkpoint, prog.coins, lives); }
      if (act === 'restart') { closeModal(); store.clearProgress(currentWorld.id); runChar = selectedChar; saveProgress({ level: 1, checkpoint: 0, coins: 0, lives: 3 }); startLevel(1, 0, 0, 3); }
      if (act === 'cancel') closeModal();
    });
    const mp = $('#mp'); if (mp) renderPortrait(mp, pc, { w: 110, h: 110 });
  } else {
    runChar = selectedChar;
    saveProgress({ level: 1, checkpoint: 0, coins: 0, lives: 3 });
    startLevel(1, 0, 0, 3);
  }
}

function startLevel(level, checkpoint, coins, lives = 3) {
  initAudio();
  mode = 'play';
  hideScreens();
  $('#hud').classList.remove('hidden');
  $('#touch').classList.toggle('hidden', !isTouch());
  clearPressed();
  renderHead($('#hud-life-ico'), runChar, 30);
  game.start({ worldIdx: WORLDS.indexOf(currentWorld), level, checkpoint, coins, lives, char: runChar });
}

function leaveGame() {
  game.running = false; mode = 'menu';
  $('#hud').classList.add('hidden'); $('#touch').classList.add('hidden'); $('#boss-bar').classList.add('hidden'); $('#banner').classList.add('hidden');
  playMusic('title');
}

// pause
function pause() {
  if (mode !== 'play' || !game.running || $('#modal').classList.contains('hidden') === false) return;
  game.paused = true; sfx.click();
  const coins = game.coins;
  modal(`
    <h2>Pauze</h2>
    <p>${currentWorld.name} · level ${game.level} · ${coins} munten</p>
    <div class="menu">
      <button class="big-btn" data-act="resume">Verder</button>
      <button class="big-btn alt" data-act="later">Stoppen, later verder</button>
      <button class="big-btn alt" data-act="score">Stoppen &amp; score registreren</button>
    </div>`, (act) => {
    if (act === 'resume') { closeModal(); game.paused = false; clearPressed(); }
    if (act === 'later') { closeModal(); leaveGame(); show('worlds'); }
    if (act === 'score') {
      modal(`<h2>Zeker weten?</h2><p>Je registreert ${game.coinsAtCp} munten (je stand bij het laatste checkpoint). Deze wereld begint daarna weer bij level 1.</p>
        <div class="menu"><button class="big-btn" data-act="yes">Ja, score registreren</button><button class="big-btn alt" data-act="no">Nee, terug</button></div>`, (a2) => {
        if (a2 === 'no') { closeModal(); pause2(); }
        if (a2 === 'yes') {
          const c = game.coinsAtCp;
          const prog = store.getProgress(currentWorld.id) || {};
          store.setProgress(currentWorld.id, { level: 1, checkpoint: 0, coins: 0, lives: 3, active: false, freed: !!prog.freed });
          leaveGame(); showScoreEntry(c, 'stop');
        }
      });
    }
  });
}
function pause2() { game.paused = false; pause(); }
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

// ---------- score entry ----------
function showScoreEntry(score, kind) {
  leaveGame();
  const won = kind === 'won', over = kind === 'gameover';
  const after = () => show(over ? 'chars' : 'worlds');
  let ini = (settings.initials || '').slice(0, 3).split('');
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const render = () => {
    const boxes = [0, 1, 2].map((i) => `<div class="ini-box ${i === ini.length ? 'active' : ''}">${ini[i] || ''}</div>`).join('');
    modal(`
      <h2>${won ? 'Gewonnen!' : over ? 'Game over' : 'Score registreren'}</h2>
      ${won ? `<p>Je hebt de mensen in <b>${currentWorld.name}</b> bevrijd met ${runChar.name}!</p>` : over ? `<p>Je levens zijn op. ${currentWorld.name} begint weer bij level 1.</p>` : `<p>${currentWorld.name} met ${runChar.name}</p>`}
      <div class="score-head"><canvas class="modal-portrait small" id="mp"></canvas><div><div class="big-score">${score}</div><p>munten</p></div></div>
      <p style="margin-bottom:4px">Typ je initialen:</p>
      <div class="ini-boxes">${boxes}</div>
      <div class="keyboard">${letters.map((l) => `<button data-act="k" data-l="${l}">${l}</button>`).join('')}<button class="wide" data-act="del">⌫ Wis</button></div>
      <div class="menu"><button class="big-btn" data-act="save" ${ini.length ? '' : 'disabled'}>Opslaan</button><button class="big-btn alt small" data-act="skip">Niet opslaan</button></div>
    `, async (act, btn) => {
      if (act === 'k' && ini.length < 3) { ini.push(btn.dataset.l); render(); }
      if (act === 'del') { ini.pop(); render(); }
      if (act === 'skip') { closeModal(); after(); }
      if (act === 'save' && ini.length) {
        const initials = ini.join('');
        settings.initials = initials; store.setSettings({ initials });
        const entry = { initials, character: runChar.id, world: currentWorld.id, score, date: new Date().toISOString().slice(0, 10) };
        store.addLocalScore(entry);
        $('#modal-card').innerHTML = '<h2>Opslaan…</h2>';
        let ok = true;
        try { await store.postGlobalScore(entry); } catch { ok = false; }
        modal(`<h2>${ok ? 'Opgeslagen!' : 'Bijna gelukt'}</h2><p>${ok ? 'Je score staat op het scorebord.' : 'Het algemene scorebord is nu niet bereikbaar. Je score is wel op dit apparaat bewaard.'}</p>
          <div class="menu"><button class="big-btn" data-act="board">Bekijk scorebord</button><button class="big-btn alt" data-act="again">${over ? 'Kies een personage' : 'Verder spelen'}</button></div>`, (a) => {
          closeModal();
          if (a === 'board') show('scores'); else after();
        });
      }
    });
    const mp = $('#mp'); if (mp) renderPortrait(mp, runChar, { w: 80, h: 80 });
  };
  render();
  const onKey = (e) => {
    if ($('#modal').classList.contains('hidden') || !$('.ini-boxes')) { window.removeEventListener('keydown', onKey); return; }
    if (/^[a-z]$/i.test(e.key) && ini.length < 3) { ini.push(e.key.toUpperCase()); render(); }
    else if (e.key === 'Backspace') { ini.pop(); render(); }
    else if (e.key === 'Enter' && ini.length) $('[data-act="save"]')?.click();
  };
  window.addEventListener('keydown', onKey);
}

// ---------- scoreboard ----------
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
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
  if (!rows.length) { list.innerHTML = '<div class="empty">Nog geen scores. Speel een wereld en zet jouw naam bovenaan!</div>'; return; }
  list.innerHTML = '';
  rows.slice(0, 50).forEach((r, i) => {
    const c = charById(r.character);
    const w = WORLDS.find((x) => x.id === r.world);
    const row = document.createElement('div');
    row.className = `score-row ${i < 3 ? 'top' + (i + 1) : ''}`;
    row.innerHTML = `<span class="rank">${i + 1}</span><span class="ini">${esc(r.initials)}</span>
      <span class="who"><canvas title="${c.name}"></canvas><span>${w ? w.name : ''}<small>${esc(fmtDate(r.date))}</small></span></span>
      <span class="pts">${r.score}</span>`;
    list.appendChild(row);
    renderHead(row.querySelector('canvas'), c);
  });
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
  if (def.kind === 'cat') { ctx.translate(-8, 82); ctx.scale(1.6, 1.6); }
  else { const k = 155 / def.height; ctx.translate(20, 28 + def.height * 0.86 * k * 0.6); ctx.scale(k * 0.6, k * 0.6); }
  drawCharacter(ctx, def, { t: 0.5, walk: 0, moving: false, air: false, atk: -1, noWeapon: true });
  ctx.restore();
}

// ---------- title scene ----------
let titleT = 0;
function renderTitle(dt) {
  titleT += dt;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
window.addEventListener('resize', () => { game.resize(); checkRotate(); if (mode === 'menu') game.resize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play' && game.running && !game.paused) pause(); });
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'play' && game.lv) {
    // two half steps for smoother physics on fast motion
    game.update(dt / 2); game.update(dt / 2);
    game.render();
  } else renderTitle(dt);
  requestAnimationFrame(frame);
}
game.resize();
requestAnimationFrame(frame);
checkRotate();

// unlock audio on first interaction (iPad)
window.addEventListener('pointerdown', () => { initAudio(); if (mode === 'menu') playMusic('title'); }, { once: true });

// debug helpers (only via URL ?debug)
if (location.search.includes('debug')) window.__avalon = { game, startLevel, WORLDS, setWorld: (i) => (currentWorld = WORLDS[i]), setChar: (id) => (runChar = selectedChar = charById(id)) };
