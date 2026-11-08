// Besturing: toetsenbord, touch-knoppen en controllers (bijv. SteelSeries Nimbus), voor 1 of 2 spelers
//
// Elke speler heeft een eigen Controller. Iedere bron (toetsenbord-helft, touch, gamepad, netwerk)
// houdt zijn eigen toestand bij; pollInput() voegt die elke frame samen per speler.

const KEYS = ['left', 'right', 'jump', 'attack', 'special', 'down'];
const EDGE = ['jump', 'attack', 'special'];

export class Controller {
  constructor() {
    this.keys = Object.fromEntries(KEYS.map((k) => [k, false]));
    this.pressed = new Set();
    this.counts = { jump: 0, attack: 0, special: 0 }; // tellers per druk (voor het netwerk)
  }
  consume(k) { if (this.pressed.has(k)) { this.pressed.delete(k); return true; } return false; }
  clear() { this.pressed.clear(); }
  apply(next) { // next: { left: bool, ... }
    for (const k of KEYS) {
      const v = !!next[k];
      if (v && !this.keys[k]) { this.pressed.add(k); if (k in this.counts) this.counts[k]++; }
      this.keys[k] = v;
    }
  }
  // toestand van de andere speler via het netwerk: knoppen + tellers, zodat geen druk verloren gaat
  applyRemote(st) {
    for (const k of KEYS) this.keys[k] = !!(st.k & (1 << KEYS.indexOf(k)));
    for (const k of EDGE) {
      const n = st.c?.[k] ?? 0;
      if (n > this.counts[k]) this.pressed.add(k);
      this.counts[k] = n;
    }
  }
  snapshot() { let bits = 0; KEYS.forEach((k, i) => { if (this.keys[k]) bits |= 1 << i; }); return { k: bits, c: { ...this.counts } }; }
}

export const controllers = [new Controller(), new Controller()];
export const remote = new Controller(); // de speler op het andere apparaat (alleen voor de host)

// 'single': alles bestuurt speler 1 · 'local2': twee spelers op één apparaat · 'online': dit apparaat = speler 1-controller
let inputMode = 'single';
export function setInputMode(m) { inputMode = m; for (const c of controllers) c.clear(); }
export function getInputMode() { return inputMode; }

// ---------- bronnen ----------
const empty = () => Object.fromEntries(KEYS.map((k) => [k, false]));
const kbA = empty();   // WASD-kant (+ spatie, X, J, C in 1-speler)
const kbB = empty();   // pijltjes-kant
const touch = empty();

// 1 speler: alle toetsen. 2 spelers op één toetsenbord: links = speler 1, rechts = speler 2
const mapA = { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'down', Space: 'jump', KeyF: 'attack', KeyG: 'special', KeyX: 'attack', KeyC: 'special', ShiftLeft: 'attack' };
const mapB = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ArrowDown: 'down', KeyK: 'attack', KeyJ: 'attack', Enter: 'attack', KeyL: 'special', ShiftRight: 'special' };

export function clearPressed() { for (const c of controllers) c.clear(); remote.clear(); }

let onPauseCb = () => {};
let menuNav = null; // functie(richting|'ok'|'back', controllernummer) zolang er geen spel loopt

export function initInput(onPause, navFn) {
  onPauseCb = onPause; menuNav = navFn;
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); if (!e.repeat) onPause(); return; }
    const a = mapA[e.code], b = mapB[e.code];
    if (!a && !b) return;
    e.preventDefault();
    if (a) kbA[a] = true; if (b) kbB[b] = true;
  });
  window.addEventListener('keyup', (e) => {
    const a = mapA[e.code], b = mapB[e.code];
    if (a) kbA[a] = false; if (b) kbB[b] = false;
  });
  window.addEventListener('blur', () => { for (const s of [kbA, kbB, touch]) for (const k in s) s[k] = false; });

  // Multi-touch knoppen: houd bij op welke knop elke vinger staat
  const btns = [...document.querySelectorAll('.tbtn')];
  const active = new Map(); // touchId -> key
  const refresh = () => {
    const on = new Set(active.values());
    for (const b of btns) { const k = b.dataset.k; b.classList.toggle('on', on.has(k)); touch[k] = on.has(k); }
  };
  const hit = (x, y) => {
    for (const b of btns) {
      if (b.offsetParent === null) continue; // verborgen knop
      const r = b.getBoundingClientRect();
      const pad = 14;
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return b.dataset.k;
    }
    return null;
  };
  // schuifknop links: knop naar links/rechts = lopen
  const stick = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  let stickId = null, stickCx = 0;
  const stickMove = (x) => {
    const max = stick.clientWidth * 0.3;
    const dx = Math.max(-max, Math.min(max, x - stickCx));
    knob.style.transform = `translate(${dx}px, 0)`;
    const dead = max * 0.22;
    touch.left = dx < -dead; touch.right = dx > dead;
  };
  const stickEnd = () => { stickId = null; knob.style.transform = ''; touch.left = false; touch.right = false; stick.classList.remove('on'); };
  const inStick = (x, y) => {
    const r = stick.getBoundingClientRect(); const pad = 70;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  };

  const touchArea = document.getElementById('touch');
  const handle = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const end = e.type === 'touchend' || e.type === 'touchcancel';
      if (t.identifier === stickId) { if (end) stickEnd(); else stickMove(t.clientX); continue; }
      if (e.type === 'touchstart' && stickId === null && inStick(t.clientX, t.clientY)) {
        stickId = t.identifier; const r = stick.getBoundingClientRect(); stickCx = r.left + r.width / 2;
        stick.classList.add('on'); stickMove(t.clientX); continue;
      }
      if (end) active.delete(t.identifier);
      else { const k = hit(t.clientX, t.clientY); if (k) active.set(t.identifier, k); else active.delete(t.identifier); }
    }
    refresh();
  };
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) touchArea.addEventListener(ev, handle, { passive: false });
  // muis als vervanger voor touch (testen op een laptop)
  stick.addEventListener('mousedown', (e) => {
    const r = stick.getBoundingClientRect(); stickCx = r.left + r.width / 2; stickId = 'mouse'; stickMove(e.clientX);
    const mv = (ev) => stickMove(ev.clientX);
    const up = () => { stickEnd(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  for (const b of btns) {
    b.addEventListener('mousedown', () => { active.set('m' + b.dataset.k, b.dataset.k); refresh(); });
    b.addEventListener('mouseup', () => { active.delete('m' + b.dataset.k); refresh(); });
    b.addEventListener('mouseleave', () => { active.delete('m' + b.dataset.k); refresh(); });
  }

  window.addEventListener('gamepadconnected', (e) => { padHint?.(e.gamepad); });
}
let padHint = null;
export function onPadConnected(fn) { padHint = fn; }

// ---------- controllers (Gamepad API, standaard-indeling) ----------
// A = springen · B of X = aanvallen · Y = speciaal · linker stick / pijltjes = lopen · Menu = pauze
const padPrev = new Map(); // index -> { pause, nav: {...} }
function readPad(gp) {
  const b = (i) => !!gp.buttons[i]?.pressed;
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  return {
    left: b(14) || ax < -0.4, right: b(15) || ax > 0.4, down: b(13) || ay > 0.6,
    jump: b(0) || b(12), attack: b(1) || b(2) || b(7) || b(5), special: b(3) || b(6) || b(4),
    pause: b(9) || b(8),
    up: b(12) || ay < -0.6, ok: b(0), back: b(1),
  };
}
export function connectedPads() {
  const list = navigator.getGamepads ? [...navigator.getGamepads()].filter((g) => g && g.connected) : [];
  return list.sort((a, b) => a.index - b.index);
}

// Elke frame aanroepen. playing = er loopt een spel (anders stuurt een controller het menu)
export function pollInput(playing) {
  const pads = connectedPads();
  const merged = [empty(), empty()];
  const or = (dst, src) => { for (const k of KEYS) if (src[k]) dst[k] = true; };
  if (inputMode === 'local2') {
    or(merged[0], kbA); or(merged[1], kbB); or(merged[0], touch);
  } else {
    or(merged[0], kbA); or(merged[0], kbB); or(merged[0], touch);
  }
  pads.forEach((gp, i) => {
    const st = readPad(gp);
    // 2 spelers op één apparaat: twee controllers = elk een eigen speler. Met één controller op een iPad
    // speelt speler 1 met touch en speler 2 met de controller; op een laptop speler 2 met de pijltjes.
    let slot = 0;
    if (inputMode === 'local2') slot = pads.length >= 2 ? Math.min(i, 1) : (isTouch() ? 1 : 0);
    or(merged[slot], st);
    const prev = padPrev.get(gp.index) || {};
    if (st.pause && !prev.pause) onPauseCb();
    if (!playing && menuNav) {
      const dirs = { left: st.left, right: st.right, up: st.up, down: st.down, ok: st.ok, back: st.back };
      const now = performance.now();
      for (const [k, v] of Object.entries(dirs)) {
        const was = prev[k];
        const rep = prev['t_' + k] || 0;
        if (v && (!was || (k !== 'ok' && k !== 'back' && now - rep > 260))) { menuNav(k, i); st['t_' + k] = now; }
        else if (v) st['t_' + k] = rep;
      }
    }
    padPrev.set(gp.index, st);
  });
  controllers[0].apply(merged[0]);
  controllers[1].apply(merged[1]);
}

let padCount = 0, padCountCb = null;
export function onPadCountChange(fn) { padCountCb = fn; }
export function checkPadCount() {
  const n = connectedPads().length;
  if (n !== padCount) { padCount = n; padCountCb?.(n); }
}
export const isTouch = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// ---------- menu bedienen met een controller ----------
// Kiest de knop die het dichtst in de gekozen richting ligt (zoals op een tv)
export function spatialNav(dir) {
  document.body.classList.add('padnav'); // laat duidelijk zien welke knop gekozen is
  const layer = !document.getElementById('modal').classList.contains('hidden') ? document.getElementById('modal')
    : document.querySelector('.screen:not(.hidden)');
  if (!layer) return;
  const items = [...layer.querySelectorAll('button:not([disabled]), .card')].filter((el) => el.offsetParent !== null && !el.disabled);
  if (!items.length) return;
  let cur = document.activeElement;
  if (!items.includes(cur)) {
    if (dir === 'back') { layer.querySelector('[data-back]')?.click(); return; }
    (layer.querySelector('.card.selected') || items.find((el) => el.classList.contains('card') && !el.disabled) || items.find((el) => !el.dataset.back) || items[0]).focus(); return;
  }
  if (dir === 'ok') { cur.click(); return; }
  if (dir === 'back') {
    const back = layer.querySelector('[data-back]') || layer.querySelector('[data-act="no"], [data-act="resume"], [data-act="cancel"]');
    back?.click(); return;
  }
  const r0 = cur.getBoundingClientRect(); const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  const v = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir];
  let best = null, bd = Infinity;
  for (const el of items) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect(); const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
    const along = dx * v[0] + dy * v[1]; if (along <= 4) continue;
    const across = Math.abs(dx * v[1] - dy * v[0]);
    const d = along + across * 2.2;
    if (d < bd) { bd = d; best = el; }
  }
  if (best) { best.focus(); best.scrollIntoView?.({ block: 'nearest' }); }
}
