// Toetsenbord + touch-knoppen
export const keys = { left: false, right: false, jump: false, attack: false, down: false };
const pressed = new Set(); // edge-triggered
export function consume(k) { if (pressed.has(k)) { pressed.delete(k); return true; } return false; }
export function clearPressed() { pressed.clear(); }

const map = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  ArrowDown: 'down', KeyS: 'down',
  KeyX: 'attack', KeyJ: 'attack', KeyK: 'attack', Enter: 'attack', ShiftLeft: 'attack',
  Escape: 'pause', KeyP: 'pause',
};

function set(k, v) {
  if (v && !keys[k]) pressed.add(k);
  keys[k] = v;
}

export function initInput(onPause) {
  window.addEventListener('keydown', (e) => {
    const k = map[e.code];
    if (!k) return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    e.preventDefault();
    if (k === 'pause') { if (!e.repeat) onPause(); return; }
    set(k, true);
  });
  window.addEventListener('keyup', (e) => {
    const k = map[e.code];
    if (!k || k === 'pause') return;
    set(k, false);
  });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  // Multi-touch buttons: track which button each touch is on
  const btns = [...document.querySelectorAll('.tbtn')];
  const active = new Map(); // touchId -> key
  let stickJump = false;
  const refresh = () => {
    const on = new Set(active.values());
    for (const b of btns) {
      const k = b.dataset.k;
      b.classList.toggle('on', on.has(k));
      const v = on.has(k) || (k === 'jump' && stickJump);
      if (keys[k] !== v) set(k, v);
    }
  };
  const hit = (x, y) => {
    for (const b of btns) {
      const r = b.getBoundingClientRect();
      const pad = 14;
      if (x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad) return b.dataset.k;
    }
    return null;
  };
  // joystick (left side): drag the knob left/right to walk
  const stick = document.getElementById('stick');
  const knob = document.getElementById('stick-knob');
  let stickId = null, stickCx = 0;
  let stickCy = 0;
  // knop naar links/rechts = lopen, knop omhoog duwen = springen
  const stickMove = (x, y) => {
    const max = stick.clientWidth * 0.3;
    let dx = x - stickCx, dy = y - stickCy;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    const dead = max * 0.25;
    if (keys.left !== dx < -dead) set('left', dx < -dead);
    if (keys.right !== dx > dead) set('right', dx > dead);
    const up = dy < -max * 0.5;
    if (up !== stickJump) { stickJump = up; refresh(); }
  };
  const stickEnd = () => { stickId = null; knob.style.transform = ''; set('left', false); set('right', false); stickJump = false; refresh(); stick.classList.remove('on'); };
  const inStick = (x, y) => {
    const r = stick.getBoundingClientRect(); const pad = 70;
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  };

  const touchArea = document.getElementById('touch');
  const handle = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const end = e.type === 'touchend' || e.type === 'touchcancel';
      if (t.identifier === stickId) { if (end) stickEnd(); else stickMove(t.clientX, t.clientY); continue; }
      if (e.type === 'touchstart' && stickId === null && inStick(t.clientX, t.clientY)) {
        stickId = t.identifier; const r = stick.getBoundingClientRect(); stickCx = r.left + r.width / 2; stickCy = r.top + r.height / 2;
        stick.classList.add('on'); stickMove(t.clientX, t.clientY); continue;
      }
      if (end) active.delete(t.identifier);
      else { const k = hit(t.clientX, t.clientY); if (k) active.set(t.identifier, k); else active.delete(t.identifier); }
    }
    refresh();
  };
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) touchArea.addEventListener(ev, handle, { passive: false });
  // mouse fallback for the joystick (testing on a laptop)
  stick.addEventListener('mousedown', (e) => {
    const r = stick.getBoundingClientRect(); stickCx = r.left + r.width / 2; stickCy = r.top + r.height / 2; stickId = 'mouse'; stickMove(e.clientX, e.clientY);
    const mv = (ev) => stickMove(ev.clientX, ev.clientY);
    const up = () => { stickEnd(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  });
  // mouse fallback for touch buttons (testing on laptop)
  for (const b of btns) {
    b.addEventListener('mousedown', () => { active.set('m' + b.dataset.k, b.dataset.k); refresh(); });
    b.addEventListener('mouseup', () => { active.delete('m' + b.dataset.k); refresh(); });
    b.addEventListener('mouseleave', () => { active.delete('m' + b.dataset.k); refresh(); });
  }
}

export const isTouch = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
