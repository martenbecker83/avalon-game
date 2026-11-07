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
  const refresh = () => {
    const on = new Set(active.values());
    for (const b of btns) {
      const k = b.dataset.k;
      const v = on.has(k);
      b.classList.toggle('on', v);
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
  const touchArea = document.getElementById('touch');
  const handle = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (e.type === 'touchend' || e.type === 'touchcancel') active.delete(t.identifier);
      else { const k = hit(t.clientX, t.clientY); if (k) active.set(t.identifier, k); else active.delete(t.identifier); }
    }
    refresh();
  };
  for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) touchArea.addEventListener(ev, handle, { passive: false });
  // mouse fallback for touch buttons (testing on laptop)
  for (const b of btns) {
    b.addEventListener('mousedown', () => { active.set('m' + b.dataset.k, b.dataset.k); refresh(); });
    b.addEventListener('mouseup', () => { active.delete('m' + b.dataset.k); refresh(); });
    b.addEventListener('mouseleave', () => { active.delete('m' + b.dataset.k); refresh(); });
  }
}

export const isTouch = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
