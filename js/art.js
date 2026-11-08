// Alles wat getekend wordt behalve de personages: werelden, vijanden, bazen, items
import { roundRect, drawBottle, drawPie, drawWrench, drawPancake, drawChalk, drawCharacter, darken, lighten } from './characters.js';
import { PEOPLE } from './worlds.js';

function ell(ctx, x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
function lg(ctx, x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rg(ctx, x, y, r, c1, c2) { const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; }
const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

export const PAL = {
  jungle: { sky: ['#6fcbe8', '#e6f8c8'], far: '#8cc777', mid: '#4f9b47', near: '#2f7a37', top: '#6cc24a', topHi: '#a5e874', body: '#8a5a35', bodyDk: '#5e3a20', plat: '#7a5232', platTop: '#79cf52' },
  clouds: { sky: ['#4b2a86', '#f3a6d6'], far: '#b991e8', mid: '#9a74d6', near: '#7d58c2', top: '#fbf3ff', topHi: '#ffffff', body: '#d5b8f5', bodyDk: '#a785da', plat: '#e7d3fb', platTop: '#ffffff' },
  water:  { sky: ['#0a4f80', '#46bcd9'], far: '#1d6b8c', mid: '#175a78', near: '#104866', top: '#f3dfa6', topHi: '#fff1c8', body: '#d6b46c', bodyDk: '#a9894a', plat: '#c98b6a', platTop: '#ff9e8a' },
  sky:    { sky: ['#3ea9f2', '#dff4ff'], far: '#ffffff', mid: '#eaf6ff', near: '#cfe9fb', top: '#73cf55', topHi: '#a9ec7f', body: '#b98f64', bodyDk: '#8a6744', plat: '#a8835c', platTop: '#86dc66' },
};

// ---------- backgrounds (screen space) ----------
export function drawBackground(ctx, wid, camX, camY, W, H, t) {
  const P = PAL[wid];
  ctx.fillStyle = lg(ctx, 0, 0, 0, H, [[0, P.sky[0]], [1, P.sky[1]]]);
  ctx.fillRect(0, 0, W, H);
  const py = -camY * 0.3;
  if (wid === 'jungle') {
    ell(ctx, W * 0.82 - camX * 0.01, 90 + py * 0.2, 46, 46, 'rgba(255,250,210,.9)');
    hills(ctx, camX * 0.12, W, H, 300 + py * 0.4, 70, P.far, 1);
    trees(ctx, camX * 0.25, W, 360 + py * 0.6, '#3f8a3e', 0.8, 11);
    hills(ctx, camX * 0.35, W, H, 380 + py * 0.7, 50, P.mid, 2);
    trees(ctx, camX * 0.5, W, 430 + py * 0.8, '#2a6b30', 1.1, 29);
    // hanging vines
    ctx.strokeStyle = 'rgba(40,110,40,.55)'; ctx.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      const vx = ((i * 260 - camX * 0.6) % (W + 300) + W + 300) % (W + 300) - 150;
      ctx.beginPath(); ctx.moveTo(vx, -10);
      ctx.quadraticCurveTo(vx + Math.sin(t + i) * 12, 70 + hash(i) * 60, vx + 6, 110 + hash(i + 3) * 90); ctx.stroke();
      ell(ctx, vx + 6, 110 + hash(i + 3) * 90, 7, 4, 'rgba(60,150,60,.7)');
    }
  } else if (wid === 'clouds') {
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 60; i++) { const sx = (hash(i) * 2000 - camX * 0.03) % W; const sy = hash(i + 9) * H * 0.55; const tw = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.globalAlpha = 0.3 + tw * 0.6; ell(ctx, (sx + W) % W, sy, 1.6, 1.6, null); ctx.fill(); }
    ctx.globalAlpha = 1;
    ell(ctx, W * 0.2 - camX * 0.01, 110 + py * 0.2, 54, 54, 'rgba(255,230,250,.85)');
    ell(ctx, W * 0.2 - camX * 0.01 + 16, 98 + py * 0.2, 46, 46, P.sky[0]);
    castles(ctx, camX * 0.1, W, 330 + py * 0.4, P.far);
    cloudBank(ctx, camX * 0.2, W, 380 + py * 0.5, P.far, 1);
    cloudBank(ctx, camX * 0.4, W, 440 + py * 0.7, P.mid, 2);
  } else if (wid === 'water') {
    // light rays
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const rx = ((i * 330 - camX * 0.1) % (W + 400) + W + 400) % (W + 400) - 200;
      ctx.fillStyle = `rgba(160,230,255,${0.05 + 0.03 * Math.sin(t + i)})`;
      ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx + 90, 0); ctx.lineTo(rx + 260, H); ctx.lineTo(rx + 120, H); ctx.fill();
    }
    ctx.restore();
    rocks(ctx, camX * 0.15, W, H, 340 + py * 0.4, P.far, 3);
    seaweedRow(ctx, camX * 0.3, W, 420 + py * 0.6, '#1f7a6a', t, 0.8, 5);
    rocks(ctx, camX * 0.35, W, H, 400 + py * 0.7, P.mid, 7);
    // bubbles
    for (let i = 0; i < 26; i++) {
      const bx = ((hash(i) * 1600 - camX * 0.5) % W + W) % W;
      const by = H - ((t * (30 + hash(i + 4) * 40) + hash(i + 2) * H) % (H + 40));
      ctx.strokeStyle = 'rgba(220,250,255,.55)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(bx + Math.sin(t * 2 + i) * 6, by, 3 + hash(i + 8) * 5, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (wid === 'sky') {
    ell(ctx, W * 0.85 - camX * 0.01, 80 + py * 0.2, 50, 50, 'rgba(255,248,200,1)');
    ell(ctx, W * 0.85 - camX * 0.01, 80 + py * 0.2, 75, 75, 'rgba(255,248,200,.25)');
    cloudBank(ctx, camX * 0.08, W, 300 + py * 0.3, 'rgba(255,255,255,.75)', 3);
    farIslands(ctx, camX * 0.18, W, 260 + py * 0.4, t);
    cloudBank(ctx, camX * 0.3, W, 480 + py * 0.6, 'rgba(255,255,255,.9)', 4);
    // wind lines
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const wx = ((i * 380 - camX * 0.7 - t * 120) % (W + 400) + W + 400) % (W + 400) - 200;
      const wy = 80 + hash(i) * 300;
      ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 40, wy - 8, wx + 90, wy); ctx.stroke();
    }
  }
}

function hills(ctx, off, W, H, base, amp, col, seed) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 20; x += 20) { const wx = x + off; ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(wx * 0.004 + seed) * Math.cos(wx * 0.0017 + seed * 2))); }
  ctx.lineTo(W, H); ctx.fill();
}
function trees(ctx, off, W, base, col, s, seed) {
  const sp = 120 * s;
  const start = Math.floor(off / sp) - 1;
  for (let i = start; i < start + W / sp + 3; i++) {
    const x = i * sp - off + hash(i + seed) * 40;
    const h = (90 + hash(i * 3 + seed) * 80) * s;
    ctx.fillStyle = darken('#6b4a2b', .2); ctx.fillRect(x - 5 * s, base - h * 0.5, 10 * s, h * 0.5 + 40);
    ctx.fillStyle = col;
    ell(ctx, x, base - h * 0.62, 42 * s, 34 * s, null); ctx.fill();
    ell(ctx, x - 26 * s, base - h * 0.48, 30 * s, 24 * s, null); ctx.fill();
    ell(ctx, x + 26 * s, base - h * 0.5, 32 * s, 26 * s, null); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ell(ctx, x - 10 * s, base - h * 0.72, 22 * s, 14 * s, null); ctx.fill();
  }
}
function cloudBank(ctx, off, W, base, col, seed) {
  ctx.fillStyle = col;
  const sp = 160; const start = Math.floor(off / sp) - 1;
  for (let i = start; i < start + W / sp + 3; i++) {
    const x = i * sp - off; const r = 50 + hash(i + seed) * 40;
    ell(ctx, x, base - hash(i * 7 + seed) * 30, r * 1.2, r * 0.8, null); ctx.fill();
  }
  ctx.fillRect(0, base, W, 600);
}
function castles(ctx, off, W, base, col) {
  ctx.fillStyle = col;
  const sp = 520; const start = Math.floor(off / sp) - 1;
  for (let i = start; i < start + W / sp + 3; i++) {
    const x = i * sp - off + hash(i) * 120;
    const h = 90 + hash(i + 2) * 60;
    ctx.fillRect(x, base - h, 60, h); ctx.fillRect(x - 30, base - h * 0.6, 120, h * 0.6);
    ctx.beginPath(); ctx.moveTo(x - 6, base - h); ctx.lineTo(x + 30, base - h - 45); ctx.lineTo(x + 66, base - h); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 36, base - h * 0.6); ctx.lineTo(x - 15, base - h * 0.6 - 30); ctx.lineTo(x + 6, base - h * 0.6); ctx.fill();
  }
}
function rocks(ctx, off, W, H, base, col, seed) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 30; x += 30) { const wx = x + off; ctx.lineTo(x, base - 60 * Math.abs(Math.sin(wx * 0.006 + seed)) - 30 * hash(Math.floor(wx / 30) + seed)); }
  ctx.lineTo(W, H); ctx.fill();
}
function seaweedRow(ctx, off, W, base, col, t, s, seed) {
  ctx.strokeStyle = col; ctx.lineCap = 'round';
  const sp = 70; const start = Math.floor(off / sp) - 1;
  for (let i = start; i < start + W / sp + 3; i++) {
    const x = i * sp - off + hash(i + seed) * 30; const h = (60 + hash(i * 5) * 90) * s;
    ctx.lineWidth = 6 * s;
    ctx.beginPath(); ctx.moveTo(x, base + 40);
    ctx.bezierCurveTo(x + Math.sin(t + i) * 14, base - h * 0.3, x - Math.sin(t * 1.2 + i) * 14, base - h * 0.7, x + Math.sin(t * 0.9 + i) * 10, base - h); ctx.stroke();
  }
}
function farIslands(ctx, off, W, base, t) {
  const sp = 420; const start = Math.floor(off / sp) - 1;
  for (let i = start; i < start + W / sp + 3; i++) {
    const x = i * sp - off + hash(i) * 150; const y = base + hash(i + 4) * 120 + Math.sin(t * 0.8 + i) * 6;
    const w = 90 + hash(i + 2) * 80;
    ctx.fillStyle = 'rgba(160,130,100,.55)';
    ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w * 0.1, y + w * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(120,200,110,.7)'; ctx.fillRect(x - w / 2, y - 8, w, 9);
  }
}

// ---------- terrain (world space) ----------
export const DEPTH = 14; // 2.5D top face depth

export function drawGround(ctx, wid, g, viewBottom) {
  const P = PAL[wid];
  const bottom = wid === 'sky' ? g.y + 120 : viewBottom + 40;
  const x = g.x, w = g.w, y = g.y;
  // front face
  if (wid === 'sky') {
    ctx.fillStyle = lg(ctx, 0, y, 0, bottom, [[0, P.body], [1, P.bodyDk]]);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    const steps = Math.max(3, Math.floor(w / 60));
    for (let i = steps; i >= 0; i--) { const px = x + (w * i) / steps; const d = (Math.sin((i / steps) * Math.PI) * 110 + 10) * (0.7 + 0.3 * hash(px)); ctx.lineTo(px, y + d); }
    ctx.closePath(); ctx.fill();
  } else if (wid === 'clouds') {
    ctx.fillStyle = lg(ctx, 0, y, 0, y + 260, [[0, P.body], [1, P.bodyDk]]);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, bottom); ctx.lineTo(x, bottom); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let px = x + 20; px < x + w - 10; px += 46) ell(ctx, px, y + 28 + hash(px) * 18, 22, 12, null), ctx.fill();
  } else {
    ctx.fillStyle = lg(ctx, 0, y, 0, y + 240, [[0, P.body], [1, P.bodyDk]]);
    ctx.fillRect(x, y, w, bottom - y);
    // texture
    ctx.fillStyle = 'rgba(0,0,0,.08)';
    for (let px = x + 12; px < x + w - 8; px += 34) {
      const py = y + 30 + hash(px) * 140;
      ell(ctx, px + hash(px + 1) * 10, py, 7 + hash(px + 2) * 6, 4 + hash(px + 3) * 3, null); ctx.fill();
    }
    if (wid === 'water') { ctx.fillStyle = 'rgba(255,255,255,.15)'; for (let px = x + 20; px < x + w; px += 60) { ell(ctx, px, y + 20 + hash(px + 9) * 30, 5, 2, null); ctx.fill(); } }
  }
  // side shading at edges
  // (niet bij zwevende eilanden: daar stak dit randje als een grijs streepje onder het eiland uit)
  if (wid !== 'sky') { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x + w - 8, y, 8, bottom - y); }
  // top face (2.5D)
  ctx.fillStyle = P.top;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 6, y - DEPTH); ctx.lineTo(x + w + 6, y - DEPTH); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.topHi; ctx.fillRect(x + 3, y - DEPTH * 0.55 - 2, w, 3);
  // lip
  if (wid === 'jungle' || wid === 'sky') {
    ctx.fillStyle = P.top;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let px = x; px <= x + w; px += 14) ctx.lineTo(px + 7, y + 7 + hash(px) * 6), ctx.lineTo(px + 14, y);
    ctx.closePath(); ctx.fill();
  } else if (wid === 'clouds') {
    ctx.fillStyle = P.top;
    for (let px = x + 8; px < x + w; px += 22) ell(ctx, px, y + 2, 14, 8, null), ctx.fill();
  } else if (wid === 'water') {
    ctx.fillStyle = darken(P.top, .06); ctx.fillRect(x, y, w, 6);
  }
}

export function drawPlat(ctx, wid, p, t) {
  const P = PAL[wid];
  const x = p.x, y = p.y, w = p.w, h = 22;
  if (p.kind === 'bounce') {
    // stuiterwolk
    const sq = p.squash || 0;
    ctx.save(); ctx.translate(x + w / 2, y + 10); ctx.scale(1 + sq * 0.15, 1 - sq * 0.3);
    ctx.fillStyle = '#ffd6f4';
    for (const [dx, dy, r] of [[-38, 2, 18], [-14, -6, 24], [14, -4, 22], [38, 3, 17], [0, 6, 22]]) ell(ctx, dx, dy, r, r * 0.8, null), ctx.fill();
    ctx.fillStyle = '#ff9fdc'; ctx.fillRect(-46, 8, 92, 6);
    ctx.fillStyle = '#7a3a8a'; ell(ctx, -8, 0, 2, 2.5, null); ctx.fill(); ell(ctx, 8, 0, 2, 2.5, null); ctx.fill();
    ctx.restore();
    return;
  }
  if (wid === 'clouds') {
    ctx.fillStyle = P.plat;
    for (let px = x + 10; px < x + w - 4; px += 20) ell(ctx, px, y + 6, 15, 11, null), ctx.fill();
    ctx.fillStyle = P.platTop; for (let px = x + 10; px < x + w - 4; px += 20) ell(ctx, px, y - 2, 12, 7, null), ctx.fill();
    return;
  }
  if (wid === 'water') {
    // coral / shell platform
    ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, '#ff9e8a'], [1, '#d4614f']]);
    roundRect(ctx, x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let px = x + 12; px < x + w - 8; px += 18) ell(ctx, px, y + 11, 3, 3, null), ctx.fill();
    ctx.fillStyle = '#ffc2b5'; ctx.fillRect(x + 6, y, w - 12, 4);
    return;
  }
  ctx.fillStyle = lg(ctx, 0, y, 0, y + h, [[0, P.plat], [1, darken(P.plat, .3)]]);
  roundRect(ctx, x, y, w, h, 6); ctx.fill();
  ctx.fillStyle = P.platTop;
  ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x + 5, y - 9); ctx.lineTo(x + w + 5, y - 9); ctx.lineTo(x + w, y + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 4, y - 6, w, 2);
  if (p.kind === 'moving') { ctx.fillStyle = '#ffd34d'; ell(ctx, x + w / 2, y + 11, 5, 5, null); ctx.fill(); ctx.fillStyle = '#c99a1f'; ell(ctx, x + w / 2, y + 11, 2, 2, null); ctx.fill(); }
}

export function drawDeco(ctx, wid, d, t) {
  const { x, y } = d;
  if (d.kind === 'sign') {
    ctx.fillStyle = '#8a5a35'; ctx.fillRect(x - 3, y - 70, 6, 70);
    ctx.fillStyle = '#c98b52'; roundRect(ctx, x - 50, y - 100, 100, 40, 8); ctx.fill();
    ctx.fillStyle = '#5a3818'; ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BEGIN →', x, y - 73);
    return;
  }
  if (wid === 'jungle') {
    if (d.kind === 'bush') { ctx.fillStyle = '#3f9a3a'; ell(ctx, x, y - 14, 34, 20, null); ctx.fill(); ell(ctx, x + 24, y - 10, 22, 15, null); ctx.fill(); ctx.fillStyle = '#ff5c8a'; ell(ctx, x - 8, y - 22, 4, 4, null); ctx.fill(); ell(ctx, x + 14, y - 18, 4, 4, null); ctx.fill(); }
    else { ctx.fillStyle = '#7a4f2a'; ctx.fillRect(x - 7, y - 120, 14, 120); ctx.fillStyle = '#3a9a3f';
      for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(x, y - 120); ctx.rotate(-Math.PI / 2 + (i - 2.5) * 0.5 + Math.sin(t + i) * 0.04); ctx.beginPath(); ctx.ellipse(0, -40, 12, 44, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
  } else if (wid === 'clouds') {
    if (d.kind === 'bush') { ctx.fillStyle = '#ffe680'; for (let i = 0; i < 3; i++) star(ctx, x + i * 18, y - 18 - Math.sin(t * 2 + i) * 4, 7); }
    else { ctx.fillStyle = 'rgba(255,255,255,.75)'; ell(ctx, x, y - 50, 26, 18, null); ctx.fill(); ctx.fillStyle = '#8f6bd0'; ctx.fillRect(x - 2, y - 34, 4, 34); }
  } else if (wid === 'water') {
    if (d.kind === 'bush') { ctx.fillStyle = '#ff7aa2'; for (let i = 0; i < 5; i++) { ctx.save(); ctx.translate(x, y); ctx.rotate((i - 2) * 0.35); ctx.fillRect(-3, -50, 6, 50); ell(ctx, 0, -52, 7, 7, null); ctx.fill(); ctx.restore(); } }
    else seaweedRow(ctx, -x + 35, 70, y - 10, '#2f9a6a', t, 1.1, x);
  } else if (wid === 'sky') {
    if (d.kind === 'bush') { ctx.fillStyle = '#5cbf4a'; ell(ctx, x, y - 10, 24, 14, null); ctx.fill(); ctx.fillStyle = '#fff'; ell(ctx, x - 6, y - 18, 3, 3, null); ctx.fill(); ell(ctx, x + 8, y - 14, 3, 3, null); ctx.fill(); }
    else { ctx.fillStyle = '#e0e0e0'; ctx.fillRect(x - 3, y - 90, 6, 90); ctx.save(); ctx.translate(x, y - 90); ctx.rotate(t * 2); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-4, 0, 8, 38); } ctx.restore(); }
  }
}
function star(ctx, x, y, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }

// ---------- items ----------
export function drawToken(ctx, x, y, t) {
  // gekke groene rondjes met een A erop
  const bob = Math.sin(t * 3 + x) * 5;
  const sq = 1 + Math.sin(t * 5 + x) * 0.08;
  ctx.save(); ctx.translate(x, y + bob); ctx.rotate(Math.sin(t * 2 + x) * 0.25); ctx.scale(sq, 2 - sq);
  ell(ctx, 0, 0, 24, 24, 'rgba(120,255,120,.25)');
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; const r = 17 + Math.sin(a * 5 + t * 6) * 1.8; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  ctx.fillStyle = rg(ctx, 0, 0, 18, '#b5ff7a', '#2aa53a'); ctx.fill();
  ctx.strokeStyle = '#147a24'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('A', 0, 2);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ell(ctx, -7, -8, 5, 3, null, -0.5); ctx.fill();
  ctx.restore();
}
export function drawHeart(ctx, x, y, t, s = 1) {
  const bob = Math.sin(t * 3 + x) * 4;
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(s * (1 + Math.sin(t * 6) * 0.05), s * (1 + Math.sin(t * 6) * 0.05));
  ctx.beginPath(); ctx.moveTo(0, 12);
  ctx.bezierCurveTo(-18, 0, -14, -16, 0, -8); ctx.bezierCurveTo(14, -16, 18, 0, 0, 12);
  ctx.fillStyle = rg(ctx, 0, 0, 16, '#ff9fb0', '#e8324f'); ctx.fill();
  ctx.strokeStyle = '#a81f36'; ctx.lineWidth = 2; ctx.stroke();
  ell(ctx, -6, -6, 3.5, 2.4, 'rgba(255,255,255,.7)', -0.6);
  ctx.restore();
}
export function drawCoin(ctx, x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(Math.cos(t * 8) * s, s);
  ell(ctx, 0, 0, 11, 11, rg(ctx, 0, 0, 11, '#fff6b0', '#e0a100'));
  ctx.strokeStyle = '#b07800'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#9a6400'; ctx.font = '800 13px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('A', 0, 1); ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
export function drawCheckpoint(ctx, x, y, active, t) {
  ctx.fillStyle = '#d8dde4'; ctx.fillRect(x - 3, y - 110, 6, 110);
  ell(ctx, x, y - 112, 7, 7, '#ffd34d');
  const wave = Math.sin(t * 5) * 4;
  ctx.fillStyle = active ? '#42c94a' : '#ff5a5f';
  ctx.beginPath(); ctx.moveTo(x + 3, y - 104); ctx.quadraticCurveTo(x + 30, y - 98 + wave, x + 56, y - 92); ctx.quadraticCurveTo(x + 30, y - 82 - wave, x + 3, y - 74); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(active ? '✓' : 'A', x + 22, y - 84);
  ell(ctx, x, y, 18, 5, 'rgba(0,0,0,.18)');
}
export function drawPortal(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y - 75);
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `hsla(${(t * 120 + i * 40) % 360},90%,65%,.9)`; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(0, 0, 40 - i * 7, 70 - i * 12, 0, t * (i % 2 ? 2 : -2), t * (i % 2 ? 2 : -2) + Math.PI * 1.6); ctx.stroke();
  }
  ell(ctx, 0, 0, 30, 54, 'rgba(255,255,255,.35)');
  ctx.fillStyle = '#fff'; ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('VERDER', 0, -84);
  ctx.restore();
}

// people cage / freed people
export function drawCage(ctx, x, y, open, t, freed) {
  const w = 230, h = 150;
  if (!open) {
    PEOPLE.forEach((p, i) => {
      ctx.save(); ctx.translate(x - w / 2 + 30 + i * 42, y);
      const def = { kind: 'human', height: p.child ? 58 : 70, look: p, attack: { type: 'none' } };
      drawCharacter(ctx, def, { t: t + i, walk: 0, moving: false, air: false, atk: -1, noWeapon: true });
      ctx.restore();
    });
    ctx.fillStyle = '#5a5f6a'; ctx.fillRect(x - w / 2 - 8, y - h - 14, w + 16, 16);
    ctx.fillRect(x - w / 2 - 8, y - 6, w + 16, 10);
    ctx.fillStyle = '#7b828f';
    for (let bx = x - w / 2; bx <= x + w / 2; bx += 20) ctx.fillRect(bx - 3, y - h, 6, h);
    ctx.fillStyle = '#c9a227'; roundRect(ctx, x - 16, y - h * 0.55, 32, 26, 6); ctx.fill();
    ctx.fillStyle = '#7a5c00'; ell(ctx, x, y - h * 0.55 + 12, 4, 5, null); ctx.fill();
    // help bubble
    ctx.fillStyle = '#fff'; roundRect(ctx, x - 70, y - h - 66, 140, 40, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 8, y - h - 27); ctx.lineTo(x + 8, y - h - 27); ctx.lineTo(x, y - h - 15); ctx.fill();
    ctx.fillStyle = '#d33'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HELP ONS!', x, y - h - 38 + Math.sin(t * 6) * 2);
  } else {
    // broken cage parts
    ctx.fillStyle = '#5a5f6a'; ctx.save(); ctx.translate(x - w / 2 - 20, y - 4); ctx.rotate(-0.15); ctx.fillRect(0, 0, w * 0.5, 10); ctx.restore();
    ctx.save(); ctx.translate(x + 30, y - 4); ctx.rotate(0.12); ctx.fillRect(0, 0, w * 0.5, 10); ctx.restore();
  }
}
export function drawFreedPeople(ctx, people, t) {
  for (const p of people) {
    ctx.save(); ctx.translate(p.x, p.y);
    if (p.dir < 0) ctx.scale(-1, 1);
    const def = { kind: 'human', height: p.look.child ? 58 : 70, look: p.look, attack: { type: 'none' } };
    drawCharacter(ctx, def, { t: t + p.i, walk: t * 10, moving: Math.abs(p.vx) > 5, air: p.y < p.groundY - 2, atk: -1, noWeapon: true });
    ctx.restore();
    if (p.cheer > 0) {
      ctx.fillStyle = '#fff'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 3;
      ctx.strokeText(p.text, p.x, p.y - 82); ctx.fillText(p.text, p.x, p.y - 82);
    }
  }
}

// ---------- enemies ----------
export function drawEnemy(ctx, e, t) {
  const tt = t + e.id;
  ctx.save(); ctx.translate(e.x, e.y);
  if (e.dir < 0) ctx.scale(-1, 1);
  if (e.flash > 0) ctx.filter = 'brightness(2.2)';
  const mood = (e.calm > 0 || e.stun > 0) ? e.mood : null;
  if (mood === 'dance' && e.calm > 0) { ctx.translate(0, -Math.abs(Math.sin(tt * 7)) * 8); ctx.rotate(Math.sin(tt * 7) * 0.25); }
  if (mood === 'sleep' && e.calm > 0) ctx.rotate(0.18);
  if (mood === 'slip') ctx.rotate(Math.min(1, e.stun) * 3.2);
  const squish = mood === 'flat' ? 0.45 : e.stun > 0 ? 0.85 : 1;
  ctx.scale(mood === 'flat' ? 1.35 : 1, squish);
  if (e.type === 'spider' && e.homeY !== undefined) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, e.homeY - e.y - 150); ctx.stroke(); }
  switch (e.type) {
    case 'snake': {
      const g = rg(ctx, 0, -10, 26, '#9fe36b', '#3f9a2a');
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const px = -24 + i * 3.6; const py = -7 + Math.sin(i * 0.9 + tt * 6) * 3; i ? ctx.lineTo(px, py - 6) : ctx.moveTo(px, py - 6); }
      for (let i = 12; i >= 0; i--) { const px = -24 + i * 3.6; const py = -7 + Math.sin(i * 0.9 + tt * 6) * 3; ctx.lineTo(px, py + 6); }
      ctx.fill();
      ctx.fillStyle = '#f5d84a'; for (let i = 1; i < 11; i += 2) { ell(ctx, -24 + i * 3.6, -7 + Math.sin(i * 0.9 + tt * 6) * 3, 2, 2, null); ctx.fill(); }
      ell(ctx, 22, -12, 11, 9, '#7ccf4f');
      eye(ctx, 24, -15, 3.2); eye(ctx, 18, -16, 2.6);
      ctx.strokeStyle = '#e33'; ctx.lineWidth = 1.5; const tg = Math.sin(tt * 10) > 0 ? 6 : 2; ctx.beginPath(); ctx.moveTo(32, -10); ctx.lineTo(32 + tg, -10); ctx.lineTo(34 + tg, -12); ctx.moveTo(32 + tg, -10); ctx.lineTo(34 + tg, -8); ctx.stroke();
      break;
    }
    case 'frog': {
      const hop = e.onGround ? 0 : 1;
      ell(ctx, 0, -14, 17, 14 + hop * 2, rg(ctx, 0, -14, 18, '#a0ef6f', '#3e9e2e'));
      ell(ctx, 0, -8, 11, 7, '#e8f7c0');
      ell(ctx, -8, -26, 6, 6, '#7ccf4f'); ell(ctx, 8, -26, 6, 6, '#7ccf4f');
      eye(ctx, -8, -27, 3.4); eye(ctx, 8, -27, 3.4);
      ctx.strokeStyle = '#2a5a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -14, 6, 0.3, Math.PI - 0.3); ctx.stroke();
      ell(ctx, -14, -2, 8, 3, '#4fae3a'); ell(ctx, 14, -2, 8, 3, '#4fae3a');
      break;
    }
    case 'parrot': case 'crow': {
      const crow = e.type === 'crow';
      const wing = Math.sin(tt * 14) * 0.8;
      ell(ctx, 0, -16, 16, 12, crow ? '#2c2f3a' : '#e8413a');
      ctx.save(); ctx.translate(-2, -20); ctx.rotate(-wing); ell(ctx, -6, -6, 14, 6, crow ? '#454a5a' : '#3a7be8', -0.4); ctx.restore();
      ell(ctx, 12, -24, 9, 8, crow ? '#2c2f3a' : '#e8413a');
      ctx.fillStyle = crow ? '#f0b030' : '#f5d84a'; ctx.beginPath(); ctx.moveTo(19, -26); ctx.lineTo(28, -22); ctx.lineTo(19, -19); ctx.fill();
      eye(ctx, 14, -27, 2.8);
      ctx.fillStyle = crow ? '#2c2f3a' : '#2fae3b'; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-30, -10); ctx.lineTo(-28, -18); ctx.lineTo(-14, -14); ctx.fill();
      break;
    }
    case 'boar': {
      const run = e.charging ? Math.sin(tt * 20) : Math.sin(tt * 8) * 0.5;
      for (const lx of [-18, 16]) { ctx.fillStyle = '#4a2f22'; ctx.fillRect(lx - 4 + run * 3, -14, 8, 14); }
      ell(ctx, 0, -24, 30, 18, rg(ctx, 0, -26, 30, '#a2765a', '#5e3a28'));
      ctx.fillStyle = '#3a2418'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-16 + i * 6, -40); ctx.lineTo(-13 + i * 6, -48); ctx.lineTo(-10 + i * 6, -40); ctx.fill(); }
      ell(ctx, 26, -22, 14, 12, '#8a6048');
      ell(ctx, 37, -20, 6, 5, '#e0a090'); ell(ctx, 36, -21, 1.3, 1.5, '#5a2a20'); ell(ctx, 39, -19, 1.3, 1.5, '#5a2a20');
      ctx.fillStyle = '#fff8e0'; ctx.beginPath(); ctx.moveTo(32, -14); ctx.quadraticCurveTo(40, -18, 38, -28); ctx.lineTo(35, -16); ctx.fill();
      eye(ctx, 28, -28, 3, true);
      ctx.fillStyle = '#6a4030'; ctx.beginPath(); ctx.moveTo(18, -32); ctx.lineTo(22, -42); ctx.lineTo(26, -32); ctx.fill();
      if (e.windup > 0) { ctx.fillStyle = '#fff'; ctx.font = '800 20px sans-serif'; ctx.fillText('!', 26, -50); }
      break;
    }
    case 'cloudling': {
      ctx.fillStyle = '#9fa8c8';
      for (const [dx, dy, r] of [[-12, -12, 12], [0, -18, 14], [13, -12, 11], [0, -8, 13]]) ell(ctx, dx, dy, r, r * 0.9, null), ctx.fill();
      ctx.fillStyle = '#c7cde6'; ell(ctx, -4, -20, 8, 5, null); ctx.fill();
      eye(ctx, 2, -15, 3, true); eye(ctx, 10, -14, 2.6, true);
      ctx.strokeStyle = '#3a3f5a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(6, -6, 4, Math.PI + 0.4, -0.4); ctx.stroke();
      if (Math.sin(tt * 3) > 0.7) { ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, 8); ctx.lineTo(-2, 8); ctx.lineTo(-6, 16); ctx.stroke(); }
      break;
    }
    case 'bat': {
      const wing = Math.sin(tt * 16);
      ctx.fillStyle = '#5a3a8a';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(s * 18, -30 - wing * 10, s * 24, -14 + wing * 4); ctx.quadraticCurveTo(s * 14, -12, s * 10, -6); ctx.closePath(); ctx.fill(); }
      ell(ctx, 0, -14, 10, 10, '#3a2a5a');
      ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(-6, -22); ctx.lineTo(-4, -30); ctx.lineTo(-1, -22); ctx.moveTo(1, -22); ctx.lineTo(4, -30); ctx.lineTo(6, -22); ctx.fill();
      ell(ctx, -3, -15, 2.4, 2.4, '#ffe04a'); ell(ctx, 4, -15, 2.4, 2.4, '#ffe04a');
      ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.moveTo(-1, -6); ctx.lineTo(1, -10); ctx.lineTo(3, -6); ctx.fill();
      break;
    }
    case 'stormtroll': {
      ell(ctx, 0, -6, 22, 8, '#7a6aa8');
      ctx.fillStyle = rg(ctx, 0, -30, 26, '#8a8fb0', '#4a4f70');
      roundRect(ctx, -18, -54, 36, 50, 14); ctx.fill();
      ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.moveTo(-12, -54); ctx.lineTo(-6, -66); ctx.lineTo(0, -54); ctx.lineTo(6, -66); ctx.lineTo(12, -54); ctx.fill();
      eye(ctx, 2, -40, 3.4, true); eye(ctx, 11, -39, 3, true);
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(0, -28, 12, 3);
      if (e.aim > 0) { ctx.save(); ctx.translate(16, -46); ctx.rotate(-0.6); ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, -10); ctx.lineTo(2, -10); ctx.lineTo(8, -22); ctx.lineTo(-2, -6); ctx.lineTo(2, -6); ctx.fill(); ctx.restore(); }
      break;
    }
    case 'crab': {
      const sc = Math.sin(tt * 12);
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 10, -8); ctx.lineTo(s * (18 + i * 3), -4 + sc * (i % 2 ? 2 : -2)); ctx.lineTo(s * (20 + i * 3), 0); ctx.stroke(); }
      ell(ctx, 0, -12, 20, 11, rg(ctx, 0, -14, 20, '#ff7a5a', '#c0392b'));
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 20, -20); ctx.rotate(s * (0.4 + sc * 0.2)); ell(ctx, 0, -4, 8, 6, '#e8503a'); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(s * 8, -12); ctx.lineTo(s * 2, -6); ctx.fill(); ctx.restore(); }
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-5, -27); ctx.moveTo(5, -20); ctx.lineTo(6, -27); ctx.stroke();
      eye(ctx, -5, -28, 3); eye(ctx, 6, -28, 3);
      break;
    }
    case 'jelly': {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = rg(ctx, 0, -28, 18, '#ffd0f5', '#e070d0');
      ctx.beginPath(); ctx.arc(0, -26, 16, Math.PI, 0); ctx.quadraticCurveTo(10, -18, 0, -20); ctx.quadraticCurveTo(-10, -18, -16, -26); ctx.fill();
      ctx.strokeStyle = '#e88ad8'; ctx.lineWidth = 2.4;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 5, -20); ctx.quadraticCurveTo(i * 5 + Math.sin(tt * 4 + i) * 5, -10, i * 5 + Math.sin(tt * 4 + i + 1) * 4, 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      eye(ctx, -5, -30, 2.4); eye(ctx, 5, -30, 2.4);
      break;
    }
    case 'fish': {
      const tl = Math.sin(tt * 10) * 0.4;
      ctx.save(); ctx.translate(-16, -14); ctx.rotate(tl); ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -10); ctx.lineTo(-14, 10); ctx.closePath(); ctx.fill(); ctx.restore();
      ell(ctx, 0, -14, 19, 12, rg(ctx, 0, -16, 19, '#ffd05a', '#ff8a1a'));
      ctx.fillStyle = '#fff'; ctx.fillRect(-4, -25, 4, 22); ctx.fillRect(-12, -23, 3, 18);
      eye(ctx, 10, -17, 3.4);
      ctx.strokeStyle = '#a04a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(16, -11, 3, 0.4, 2); ctx.stroke();
      break;
    }
    case 'puffer': {
      const big = e.puffed ? 1.45 : 1;
      ctx.save(); ctx.translate(0, -20); ctx.scale(big, big);
      ctx.fillStyle = '#d8b45a';
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.15) * 14, Math.sin(a - 0.15) * 14); ctx.lineTo(Math.cos(a) * (e.puffed ? 24 : 18), Math.sin(a) * (e.puffed ? 24 : 18)); ctx.lineTo(Math.cos(a + 0.15) * 14, Math.sin(a + 0.15) * 14); ctx.fill(); }
      ell(ctx, 0, 0, 16, 15, rg(ctx, 0, -2, 16, '#fff0b0', '#d0a040'));
      ell(ctx, 0, 6, 10, 6, '#fff8e0');
      eye(ctx, 6, -4, 3.4, true); eye(ctx, -2, -5, 3, true);
      ell(ctx, 12, 3, 2.4, 2, '#a05a2a');
      ctx.restore();
      break;
    }
    case 'wasp': {
      const wing = Math.sin(tt * 30) * 0.5;
      ctx.fillStyle = 'rgba(220,240,255,.75)'; ell(ctx, -2, -26, 10, 5, null, -0.6 + wing); ctx.fill(); ell(ctx, 4, -26, 9, 4, null, -0.3 - wing); ctx.fill();
      ell(ctx, -8, -14, 12, 9, '#ffd02a'); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(-12, -22, 3, 16); ctx.fillRect(-6, -22, 3, 16);
      ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.moveTo(-19, -14); ctx.lineTo(-26, -12); ctx.lineTo(-19, -10); ctx.fill();
      ell(ctx, 8, -16, 8, 7, '#2a2a2a'); eye(ctx, 11, -18, 2.6, true);
      break;
    }
    case 'knight': {
      ell(ctx, 0, -6, 26, 8, '#ffffff'); ell(ctx, -14, -8, 12, 7, '#ffffff'); ell(ctx, 14, -8, 12, 7, '#ffffff');
      ctx.fillStyle = rg(ctx, 0, -34, 24, '#e0e6ee', '#8a96a6');
      roundRect(ctx, -15, -52, 30, 42, 10); ctx.fill();
      ell(ctx, 0, -56, 14, 13, '#b8c2cf');
      ctx.fillStyle = '#2a2f3a'; ctx.fillRect(-2, -60, 14, 4);
      ctx.fillStyle = '#e8413a'; ctx.beginPath(); ctx.moveTo(-6, -68); ctx.quadraticCurveTo(-18, -78, -22, -62); ctx.quadraticCurveTo(-12, -66, -4, -64); ctx.fill();
      ctx.fillStyle = '#3a7be8'; roundRect(ctx, 8, -46, 16, 26, 6); ctx.fill(); ctx.fillStyle = '#ffd34d'; ell(ctx, 16, -34, 3, 3, null); ctx.fill();
      ctx.fillStyle = '#d8dde4'; ctx.fillRect(-22, -44, 4, 30);
      if (e.windup > 0) { ctx.fillStyle = '#fff'; ctx.font = '800 20px sans-serif'; ctx.fillText('!', 0, -76); }
      break;
    }
    default: drawEnemyMore(ctx, e, tt); break;
  }
  ctx.filter = 'none';
  if (mood === 'dance' && e.calm > 0) {
    ctx.fillStyle = ['#ff5fa2', '#7c5cff', '#2f9be0'][Math.floor(tt * 3) % 3]; ctx.font = '800 18px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('♪', Math.sin(tt * 3) * 14, -e.h - 14 - ((tt * 24) % 14));
  } else if (mood === 'sleep' && e.calm > 0) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(30,50,90,.6)'; ctx.lineWidth = 3; ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) { const ph = ((tt * 0.8 + i / 3) % 1); ctx.globalAlpha = 1 - ph; ctx.font = `800 ${10 + ph * 10}px sans-serif`; ctx.strokeText('z', 8 + ph * 16, -e.h - 6 - ph * 30); ctx.fillText('z', 8 + ph * 16, -e.h - 6 - ph * 30); }
    ctx.globalAlpha = 1;
  } else if (e.calm > 0) {
  // betoverd door het strikje: blosjes en hartjes
    ctx.fillStyle = 'rgba(255,120,170,.55)'; ell(ctx, 6, -e.h * 0.55, 4, 2.5, null); ctx.fill();
    ctx.fillStyle = '#ff5fa2'; ctx.font = '800 14px sans-serif'; ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6 + Math.sin(t * 6) * 0.4; ctx.fillText('♥', Math.sin(t * 2 + e.id) * 10, -e.h - 22 - ((t * 20) % 12)); ctx.globalAlpha = 1;
  }
  // stun stars / pie splat (of breiwol, boerwolk)
  if (e.stun > 0 && mood === 'tangle') {
    ctx.strokeStyle = '#ff7fb2'; ctx.lineWidth = 2.4;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(0, -e.h * 0.5, e.w * 0.6, 5 + i * 2, i * 0.6 + Math.sin(tt) * 0.1, 0, Math.PI * 2); ctx.stroke(); }
  } else if (e.stun > 0 && mood === 'burp') {
    ctx.globalAlpha = 0.6; ell(ctx, 0, -e.h * 0.6, e.w * 0.6, e.h * 0.5, 'rgba(170,220,90,.7)'); ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe04a'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; star(ctx, Math.cos(a) * 16, -e.h - 8 + Math.sin(a) * 4, 4); }
  } else if (e.stun > 0 && (mood === 'flat' || mood === 'slip')) {
    ctx.fillStyle = '#ffe04a'; for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; star(ctx, Math.cos(a) * 18, -e.h - 8 + Math.sin(a) * 5, 5); }
  } else if (e.stun > 0) {
    ctx.fillStyle = '#f2e2b0'; ell(ctx, 18, -e.h * 0.8, 10, 8, null); ctx.fill();
    ctx.fillStyle = '#e9b665'; ell(ctx, 16, -e.h * 0.8 - 2, 5, 3, null); ctx.fill();
    ctx.fillStyle = '#ffe04a'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; star(ctx, Math.cos(a) * 16, -e.h - 8 + Math.sin(a) * 4, 4); }
  }
  ctx.restore();
  if (e.bow) drawBow(ctx, e.x, e.y - e.h * (e.pop ?? 1) - 2, 0.9, t + e.id);
  if (e.hard && e.hp < e.maxhp) {
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(e.x - 18, e.y - e.h - 14, 36, 5);
    ctx.fillStyle = '#ff5a5f'; ctx.fillRect(e.x - 18, e.y - e.h - 14, 36 * (e.hp / e.maxhp), 5);
  }
}
function eye(ctx, x, y, r, angry) {
  ell(ctx, x, y, r, r, '#fff'); ell(ctx, x + r * 0.3, y, r * 0.55, r * 0.6, '#1a1a1a'); ell(ctx, x + r * 0.45, y - r * 0.35, r * 0.2, r * 0.2, '#fff');
  if (angry) { ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r, y - r - 1); ctx.lineTo(x + r, y - r * 0.4 - 1); ctx.stroke(); }
}

// ---------- extra vijanden (30 nieuwe soorten) ----------
function legs(ctx, xs, y, len, col, w, tt, sp = 10) {
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  xs.forEach((x, i) => { const s = Math.sin(tt * sp + i * 1.7) * 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s, y + len); ctx.stroke(); });
}
function spikes(ctx, cx, cy, r, n, len, col, rot = 0) {
  ctx.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a - 0.18) * r, cy + Math.sin(a - 0.18) * r); ctx.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len)); ctx.lineTo(cx + Math.cos(a + 0.18) * r, cy + Math.sin(a + 0.18) * r); ctx.fill();
  }
}
function flap(ctx, x, y, len, w, col, tt, sp = 14, up = 1) {
  const a = Math.sin(tt * sp) * 0.7;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5 - a * up); ell(ctx, -len * 0.5, 0, len * 0.6, w, col, 0); ctx.restore();
}
function smile(ctx, x, y, r, col = '#2a1a1a') { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0.3, Math.PI - 0.3); ctx.stroke(); }
function frown(ctx, x, y, r, col = '#2a1a1a') { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y + r, r, Math.PI + 0.4, -0.4); ctx.stroke(); }

function drawEnemyMore(ctx, e, tt) {
  switch (e.type) {
    // ----- oerwoud -----
    case 'monkey': {
      const air = !e.onGround;
      ctx.strokeStyle = '#6a3e22'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-28, -20 + Math.sin(tt * 4) * 6, -24, -36); ctx.stroke();
      legs(ctx, [-6, 6], -10, 10, '#6a3e22', 5, tt, air ? 0 : 12);
      ell(ctx, 0, -20, 13, 13, rg(ctx, 0, -22, 14, '#a8693c', '#6a3e22'));
      ell(ctx, 2, -16, 8, 7, '#e8c49a');
      ell(ctx, 5, -32, 11, 10, '#8a5430'); ell(ctx, 8, -30, 8, 7, '#e8c49a');
      ell(ctx, -5, -34, 4, 4, '#e8c49a'); ell(ctx, 15, -35, 4, 4, '#e8c49a');
      eye(ctx, 6, -33, 2.6); eye(ctx, 12, -33, 2.4); smile(ctx, 10, -29, 3);
      ctx.strokeStyle = '#8a5430'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, -22); ctx.lineTo(16, air ? -40 : -14); ctx.stroke();
      if (air) { ctx.fillStyle = '#ffe04a'; ell(ctx, 18, -44, 4, 9, null, 0.4); ctx.fill(); }
      break;
    }
    case 'spider': {
      // draad naar boven (wordt in drawEnemy getekend), lijf hangt eraan
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 2.4;
      for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const w = Math.sin(tt * 8 + i) * 2; ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(s * (12 + i * 2), -24 + i * 5 + w, s * (18 + i * 2), -6 + i * 3); ctx.stroke(); }
      ell(ctx, 0, -16, 13, 12, rg(ctx, 0, -18, 13, '#5a4a6a', '#1e1826'));
      ctx.fillStyle = '#e8413a'; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(4, -18); ctx.lineTo(0, -12); ctx.lineTo(-4, -18); ctx.fill();
      eye(ctx, -4, -10, 2.4, true); eye(ctx, 4, -10, 2.4, true);
      break;
    }
    case 'beetle': {
      legs(ctx, [-12, 0, 12], -8, 8, '#1a3a2a', 2.6, tt, 14);
      ell(ctx, 0, -14, 22, 13, rg(ctx, -4, -18, 22, '#5be0a0', '#13704a'));
      ctx.strokeStyle = '#0a4a2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-2, -27); ctx.lineTo(-2, -2); ctx.stroke();
      ell(ctx, -8, -20, 6, 3, 'rgba(255,255,255,.35)');
      ell(ctx, 21, -12, 8, 7, '#163a2a'); eye(ctx, 24, -14, 2.6, true);
      ctx.strokeStyle = '#163a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(26, -18); ctx.quadraticCurveTo(34, -24, 32, -32); ctx.stroke();
      break;
    }
    case 'chameleon': {
      const hue = (Math.sin(tt * 0.8) * 0.5 + 0.5);
      const c1 = hue > 0.5 ? '#9be35a' : '#5ac8e3', c2 = hue > 0.5 ? '#3c8a1e' : '#1e6a8a';
      ctx.strokeStyle = c2; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-22, -10, 8, -Math.PI * 0.2, Math.PI * 1.4); ctx.stroke();
      legs(ctx, [-10, 10], -8, 8, c2, 4, tt, 0);
      ell(ctx, 0, -16, 20, 11, rg(ctx, 0, -18, 20, c1, c2));
      ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(-14, -26); for (let i = 0; i < 6; i++) ctx.lineTo(-12 + i * 5, i % 2 ? -26 : -30); ctx.lineTo(16, -24); ctx.fill();
      ell(ctx, 20, -18, 10, 9, c1);
      ell(ctx, 22, -22, 5, 5, c2); eye(ctx, 23, -22, 3.2);
      if (e.aim > 0) { ctx.strokeStyle = '#ff6f8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, -15); ctx.lineTo(28 + e.aim * 60, -16); ctx.stroke(); ell(ctx, 28 + e.aim * 60, -16, 4, 4, '#ff6f8a'); }
      break;
    }
    case 'toucan': {
      flap(ctx, -4, -22, 22, 7, '#1d1d24', tt, e.diving ? 4 : 14);
      ell(ctx, 0, -18, 16, 12, '#1d1d24'); ell(ctx, 4, -14, 8, 7, '#fff4d0');
      ell(ctx, 12, -26, 9, 8, '#1d1d24');
      ctx.fillStyle = '#ff9a1a'; ctx.beginPath(); ctx.moveTo(18, -30); ctx.quadraticCurveTo(38, -30, 40, -22); ctx.lineTo(18, -22); ctx.fill();
      ctx.fillStyle = '#e8413a'; ctx.beginPath(); ctx.moveTo(34, -28); ctx.quadraticCurveTo(40, -27, 40, -22); ctx.lineTo(34, -22); ctx.fill();
      ell(ctx, 14, -28, 3.4, 3.4, '#4ab0e8'); eye(ctx, 14, -28, 2);
      ctx.fillStyle = '#1d1d24'; ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-26, -10); ctx.lineTo(-12, -12); ctx.fill();
      break;
    }
    case 'mosquito': {
      ctx.fillStyle = 'rgba(220,240,255,.7)'; const w = Math.sin(tt * 40) * 0.6;
      ell(ctx, -2, -20, 9, 4, null, -0.8 + w); ctx.fill(); ell(ctx, 2, -20, 8, 3.5, null, -0.4 - w); ctx.fill();
      legs(ctx, [-6, -2, 2], -12, 10, '#3a3a48', 1.2, tt, 6);
      ell(ctx, -8, -13, 9, 4, '#5a5a6e', 0.3);
      ell(ctx, 4, -14, 6, 5, '#3a3a48');
      ctx.strokeStyle = '#3a3a48'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(9, -13); ctx.lineTo(18, -9); ctx.stroke();
      ell(ctx, 6, -16, 2.4, 2.4, '#e8413a');
      break;
    }
    case 'tiger': {
      const run = e.charging ? Math.sin(tt * 22) : Math.sin(tt * 8) * 0.5;
      ctx.strokeStyle = '#e8892a'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-28, -26); ctx.quadraticCurveTo(-40, -36, -36, -46 + run * 3); ctx.stroke();
      for (const lx of [-20, -10, 14, 22]) { ctx.fillStyle = '#d97a1e'; ctx.fillRect(lx - 3 + run * (lx > 0 ? 3 : -3), -14, 7, 14); ctx.fillStyle = '#fff4e0'; ctx.fillRect(lx - 3 + run * (lx > 0 ? 3 : -3), -3, 7, 3); }
      ell(ctx, 0, -24, 30, 14, rg(ctx, 0, -26, 30, '#ffb04a', '#d06a12'));
      ctx.fillStyle = '#2a1a10'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 9, -38); ctx.lineTo(-16 + i * 9, -26); ctx.lineTo(-13 + i * 9, -37); ctx.fill(); }
      ell(ctx, 28, -28, 13, 12, '#ffa43a'); ell(ctx, 34, -23, 7, 5, '#fff4e0');
      ell(ctx, 22, -40, 4, 4, '#ffa43a'); ell(ctx, 32, -40, 4, 4, '#ffa43a');
      eye(ctx, 30, -31, 3, true); ell(ctx, 38, -26, 2, 1.6, '#2a1a10');
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(25, -38, 2, 5); ctx.fillRect(29, -39, 2, 5);
      if (e.windup > 0) { ctx.fillStyle = '#fff'; ctx.font = '800 20px sans-serif'; ctx.fillText('!', 26, -50); }
      break;
    }
    // ----- paarse wolken -----
    case 'raindrop': {
      const sq = e.onGround ? 1.15 : 0.9;
      ctx.save(); ctx.scale(sq, 2 - sq);
      ctx.fillStyle = rg(ctx, -3, -14, 16, '#bfe6ff', '#3a8ae0');
      ctx.beginPath(); ctx.moveTo(0, -34); ctx.quadraticCurveTo(14, -14, 13, -9); ctx.arc(0, -10, 13, 0, Math.PI); ctx.quadraticCurveTo(-14, -14, 0, -34); ctx.fill();
      ctx.restore();
      ell(ctx, -4, -16, 3, 5, 'rgba(255,255,255,.6)');
      eye(ctx, 1, -12, 2.6, true); eye(ctx, 7, -12, 2.4, true);
      break;
    }
    case 'ghost': {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#f4f0ff';
      ctx.beginPath(); ctx.arc(0, -24, 16, Math.PI, 0); ctx.lineTo(16, -4);
      for (let i = 0; i < 4; i++) { const x = 16 - (i + 1) * 8; ctx.quadraticCurveTo(x + 4, -10 + Math.sin(tt * 6 + i) * 3, x, -4); }
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ell(ctx, 1, -26, 3.4, 4.4, '#2a2240'); ell(ctx, 9, -26, 3, 4, '#2a2240');
      ell(ctx, 6, -16, 3.4, 4, '#2a2240');
      ell(ctx, -6, -18, 3, 2, 'rgba(255,150,200,.6)');
      break;
    }
    case 'owl': {
      flap(ctx, -6, -22, 20, 7, '#8a6a9a', tt, e.diving ? 3 : 10);
      ell(ctx, 0, -18, 15, 16, rg(ctx, 0, -20, 16, '#c8a8d8', '#7a5a8a'));
      ell(ctx, 2, -12, 9, 9, '#efe4f4');
      ctx.fillStyle = '#7a5a8a'; ctx.beginPath(); ctx.moveTo(-12, -30); ctx.lineTo(-10, -40); ctx.lineTo(-4, -32); ctx.moveTo(14, -32); ctx.lineTo(12, -40); ctx.lineTo(6, -32); ctx.fill();
      ell(ctx, -4, -26, 6, 6, '#fff7c0'); ell(ctx, 8, -26, 6, 6, '#fff7c0');
      ell(ctx, -3, -26, 3, 3.4, '#1a1a1a'); ell(ctx, 9, -26, 3, 3.4, '#1a1a1a');
      ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.moveTo(1, -22); ctx.lineTo(5, -22); ctx.lineTo(3, -17); ctx.fill();
      break;
    }
    case 'snowman': {
      ell(ctx, 0, -14, 17, 14, rg(ctx, -4, -18, 18, '#ffffff', '#c8d4ea'));
      ell(ctx, 0, -36, 12, 11, rg(ctx, -3, -40, 12, '#ffffff', '#c8d4ea'));
      ctx.fillStyle = '#2a2a3a'; ctx.fillRect(-10, -50, 20, 4); ctx.fillRect(-7, -62, 14, 12);
      ctx.fillStyle = '#e8413a'; ctx.fillRect(-7, -53, 14, 3);
      eye(ctx, 2, -38, 2.4, true); eye(ctx, 8, -38, 2.2, true);
      ctx.fillStyle = '#ff8a1a'; ctx.beginPath(); ctx.moveTo(6, -34); ctx.lineTo(18, -32); ctx.lineTo(6, -31); ctx.fill();
      ctx.fillStyle = '#2a2a3a'; for (const y of [-22, -14, -6]) { ell(ctx, 4, y, 1.8, 1.8, null); ctx.fill(); }
      ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(24, e.aim > 0 ? -34 : -24); ctx.stroke();
      break;
    }
    case 'icicle': {
      ctx.fillStyle = rg(ctx, -2, -30, 16, '#ffffff', '#8fd0f0');
      ctx.beginPath(); ctx.moveTo(-12, -40); ctx.lineTo(12, -40); ctx.lineTo(2, 0); ctx.lineTo(-2, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-6, -38, 2, 22);
      eye(ctx, -4, -32, 2.6, true); eye(ctx, 4, -32, 2.6, true);
      break;
    }
    case 'sheep': {
      legs(ctx, [-12, -4, 8, 14], -10, 10, '#3a3448', 4, tt, 12);
      ctx.fillStyle = '#f2ecff';
      for (const [dx, dy, r] of [[-14, -20, 9], [-4, -24, 10], [8, -22, 10], [0, -14, 11], [-12, -12, 8], [12, -14, 8]]) { ell(ctx, dx, dy, r, r, null); ctx.fill(); }
      ell(ctx, 20, -20, 8, 9, '#3a3448'); ell(ctx, 16, -26, 4, 3, '#f2ecff');
      ell(ctx, 18, -16, 4, 2, '#5a5468', 0.4);
      eye(ctx, 21, -22, 2.4);
      break;
    }
    case 'moth': {
      const w = Math.sin(tt * 18);
      ctx.fillStyle = '#b08ad8';
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(0, -16); ctx.scale(1, 0.6 + w * 0.4 * s); ell(ctx, s * 10, -6, 12, 9, null); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#ffd34d'; ell(ctx, -10, -18, 3, 3, null); ctx.fill(); ell(ctx, 10, -18, 3, 3, null); ctx.fill();
      ell(ctx, 0, -14, 4, 9, '#6a4a8a');
      ctx.strokeStyle = '#6a4a8a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -22); ctx.quadraticCurveTo(4, -30, 8, -30); ctx.moveTo(0, -22); ctx.quadraticCurveTo(-4, -30, -8, -30); ctx.stroke();
      eye(ctx, 1, -20, 1.8);
      break;
    }
    case 'yeti': {
      const run = e.charging ? Math.sin(tt * 20) : Math.sin(tt * 6) * 0.4;
      for (const lx of [-12, 10]) { ctx.fillStyle = '#c8d4ea'; ctx.fillRect(lx - 6 + run * 3, -18, 12, 18); }
      ctx.fillStyle = rg(ctx, -6, -40, 34, '#ffffff', '#a8b8d8'); roundRect(ctx, -24, -60, 48, 46, 20); ctx.fill();
      ell(ctx, 8, -44, 12, 10, '#8aa0c8');
      eye(ctx, 6, -48, 3, true); eye(ctx, 14, -47, 2.8, true);
      ctx.fillStyle = '#fff'; ctx.fillRect(6, -40, 3, 4); ctx.fillRect(12, -40, 3, 4); ctx.fillStyle = '#3a2a4a'; ctx.fillRect(5, -41, 12, 1.6);
      ctx.fillStyle = '#e8f0ff'; ell(ctx, 24, -30 + run * 4, 8, 12, null); ctx.fill();
      if (e.windup > 0) { ctx.fillStyle = '#fff'; ctx.font = '800 20px sans-serif'; ctx.fillText('!', 0, -70); }
      break;
    }
    // ----- onderwater -----
    case 'shrimp': {
      ctx.save(); ctx.translate(0, -12); ctx.rotate(e.onGround ? 0 : -0.4);
      ctx.fillStyle = '#ff8a7a';
      for (let i = 0; i < 5; i++) ell(ctx, -14 + i * 6, Math.sin(i * 0.7) * 3, 6 - i * 0.3, 6 - Math.abs(i - 2), null), ctx.fill();
      ctx.fillStyle = '#e8503a'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-26, -6); ctx.lineTo(-26, 6); ctx.fill();
      ctx.strokeStyle = '#e8503a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(12, -2); ctx.quadraticCurveTo(24, -16, 30, -8); ctx.moveTo(12, -2); ctx.quadraticCurveTo(22, -12, 28, -2); ctx.stroke();
      eye(ctx, 10, -4, 2.4);
      ctx.restore();
      break;
    }
    case 'seahorse': {
      ctx.fillStyle = rg(ctx, 0, -28, 18, '#ffe07a', '#e8a01a');
      ctx.beginPath(); ctx.moveTo(-2, -44); ctx.quadraticCurveTo(12, -46, 10, -34); ctx.quadraticCurveTo(10, -26, 4, -22); ctx.quadraticCurveTo(10, -12, 2, -6); ctx.quadraticCurveTo(-6, -2, -2, 4); ctx.quadraticCurveTo(-12, -2, -8, -10); ctx.quadraticCurveTo(-10, -24, -6, -34); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8a01a'; ctx.beginPath(); ctx.moveTo(8, -40); ctx.lineTo(20, -38); ctx.lineTo(9, -35); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,80,.7)'; ell(ctx, -9, -24, 4, 7 + Math.sin(tt * 12) * 2, null); ctx.fill();
      eye(ctx, 4, -38, 2.4);
      break;
    }
    case 'eel': {
      const up = e.pop ?? 1; // 0 = verstopt, 1 = helemaal boven
      ctx.save(); ctx.beginPath(); ctx.rect(-30, -80, 60, 80); ctx.clip();
      ctx.translate(0, (1 - up) * 56);
      ctx.fillStyle = rg(ctx, 0, -30, 26, '#7ae0b0', '#2a8a6a');
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const y = -i * 5.4; const x = Math.sin(i * 0.6 + tt * 5) * 5; i ? ctx.lineTo(x - 7, y) : ctx.moveTo(x - 7, y); }
      for (let i = 10; i >= 0; i--) { const y = -i * 5.4; const x = Math.sin(i * 0.6 + tt * 5) * 5; ctx.lineTo(x + 7, y); }
      ctx.fill();
      ell(ctx, Math.sin(6 + tt * 5) * 5 + 3, -56, 9, 7, '#5ac898');
      eye(ctx, 5, -58, 2.6, true); ctx.fillStyle = '#1a3a2a'; ctx.fillRect(4, -52, 8, 1.6);
      ctx.restore();
      ctx.fillStyle = '#d8c48a'; ell(ctx, 0, -2, 18, 5, null); ctx.fill();
      break;
    }
    case 'angler': {
      ctx.strokeStyle = '#3a2a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -30); ctx.quadraticCurveTo(14, -48, 26, -40); ctx.stroke();
      const glow = 0.6 + Math.sin(tt * 6) * 0.4;
      ell(ctx, 26, -38, 10, 10, `rgba(255,250,150,${0.3 * glow})`); ell(ctx, 26, -38, 4, 4, '#fffab0');
      ell(ctx, 0, -16, 19, 14, rg(ctx, 0, -18, 19, '#6a5a8a', '#2a2040'));
      ctx.fillStyle = '#2a2040'; ctx.beginPath(); ctx.moveTo(-16, -16); ctx.lineTo(-28, -26); ctx.lineTo(-28, -6); ctx.fill();
      ctx.fillStyle = '#1a1028'; ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(19, -16); ctx.lineTo(18, -4); ctx.fill();
      ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 3, -13); ctx.lineTo(11.5 + i * 3, -9); ctx.lineTo(13 + i * 3, -13.5); ctx.fill(); }
      eye(ctx, 8, -22, 3, true);
      break;
    }
    case 'starfish': {
      ctx.save(); ctx.translate(0, -13); ctx.rotate(e.x * 0.03);
      ctx.fillStyle = rg(ctx, 0, 0, 20, '#ffb0c0', '#e85a7a');
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 7 : 19; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff0f4'; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 0.4; ell(ctx, Math.cos(a) * 11, Math.sin(a) * 11, 1.4, 1.4, null); ctx.fill(); }
      ctx.restore();
      eye(ctx, -3, -15, 2.4); eye(ctx, 4, -15, 2.4); smile(ctx, 0, -12, 3);
      break;
    }
    case 'urchin': {
      const rot = tt * 0.6;
      spikes(ctx, 0, -14, 12, 16, 9, '#3a1a4a', rot);
      ell(ctx, 0, -14, 13, 12, rg(ctx, -2, -16, 13, '#8a4aa8', '#3a1a4a'));
      eye(ctx, -3, -16, 2.6, true); eye(ctx, 5, -16, 2.6, true);
      break;
    }
    case 'shark': {
      const tl = Math.sin(tt * 8) * 0.3;
      ctx.save(); ctx.translate(-30, -16); ctx.rotate(tl); ctx.fillStyle = '#5a7a9a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -16); ctx.lineTo(-8, 0); ctx.lineTo(-14, 14); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = rg(ctx, 0, -20, 36, '#9ab8d4', '#4a6a8a');
      ctx.beginPath(); ctx.moveTo(-32, -16); ctx.quadraticCurveTo(-10, -36, 22, -28); ctx.quadraticCurveTo(40, -22, 36, -14); ctx.quadraticCurveTo(20, -2, -10, -6); ctx.quadraticCurveTo(-24, -8, -32, -16); ctx.fill();
      ctx.fillStyle = '#4a6a8a'; ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(0, -46); ctx.lineTo(8, -30); ctx.fill();
      ctx.fillStyle = '#e8f0f8'; ctx.beginPath(); ctx.moveTo(-10, -7); ctx.quadraticCurveTo(14, -4, 34, -14); ctx.quadraticCurveTo(14, -10, -10, -7); ctx.fill();
      ctx.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(20 + i * 3.6, -14); ctx.lineTo(21.8 + i * 3.6, -10); ctx.lineTo(23.6 + i * 3.6, -14); ctx.fill(); }
      eye(ctx, 24, -22, 2.8, true);
      break;
    }
    // ----- lucht -----
    case 'seagull': {
      flap(ctx, -4, -20, 26, 6, '#c8ccd4', tt, e.diving ? 3 : 9);
      ell(ctx, 0, -16, 17, 10, '#ffffff'); ell(ctx, -6, -18, 10, 5, '#d8dce4');
      ell(ctx, 14, -22, 8, 7, '#ffffff');
      ctx.fillStyle = '#f0b030'; ctx.beginPath(); ctx.moveTo(20, -24); ctx.lineTo(30, -21); ctx.lineTo(20, -19); ctx.fill(); ell(ctx, 26, -21, 1.4, 1.4, '#e8413a');
      eye(ctx, 16, -24, 2.4, true);
      ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.moveTo(-16, -16); ctx.lineTo(-24, -12); ctx.lineTo(-15, -12); ctx.fill();
      break;
    }
    case 'dragonling': {
      flap(ctx, -2, -24, 20, 8, '#7a3ab0', tt, 12);
      ctx.strokeStyle = '#a05ad8'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-12, -14); ctx.quadraticCurveTo(-24, -10, -26, -20 + Math.sin(tt * 5) * 4); ctx.stroke();
      ell(ctx, 0, -16, 14, 11, rg(ctx, 0, -18, 14, '#c88af0', '#7a3ab0'));
      ell(ctx, 2, -12, 7, 5, '#ffe0a0');
      ell(ctx, 14, -24, 9, 8, '#a05ad8');
      ctx.fillStyle = '#ffe0a0'; ctx.beginPath(); ctx.moveTo(10, -30); ctx.lineTo(12, -38); ctx.lineTo(15, -30); ctx.fill();
      eye(ctx, 16, -26, 2.6); ell(ctx, 22, -21, 1.2, 1.2, '#3a1a4a');
      if (Math.sin(tt * 2) > 0.85) { ell(ctx, 28, -20, 5, 3, 'rgba(255,140,40,.8)'); }
      break;
    }
    case 'squirrel': {
      ctx.fillStyle = '#c8682a'; ctx.beginPath(); ctx.moveTo(-8, -10); ctx.quadraticCurveTo(-30, -16, -24, -40 + Math.sin(tt * 4) * 3); ctx.quadraticCurveTo(-10, -44, -10, -26); ctx.closePath(); ctx.fill();
      ell(ctx, 0, -14, 11, 12, rg(ctx, 0, -16, 12, '#e8904a', '#b0581e')); ell(ctx, 3, -11, 6, 7, '#ffe8c8');
      ell(ctx, 8, -28, 9, 8, '#e0884a'); ctx.fillStyle = '#c8682a'; ctx.beginPath(); ctx.moveTo(3, -33); ctx.lineTo(4, -42); ctx.lineTo(8, -34); ctx.fill();
      eye(ctx, 11, -30, 2.4); ell(ctx, 16, -26, 1.4, 1.2, '#3a1a0a');
      // vliegeekhoorn: vliesje tussen poten als hij springt
      if (!e.onGround) { ctx.fillStyle = 'rgba(232,144,74,.7)'; ctx.beginPath(); ctx.moveTo(-10, -18); ctx.lineTo(-18, -6); ctx.lineTo(16, -6); ctx.lineTo(10, -18); ctx.fill(); }
      break;
    }
    case 'gargoyle': {
      flap(ctx, -6, -32, 18, 7, '#6a7480', tt, 4);
      legs(ctx, [-6, 8], -12, 12, '#5a6470', 6, tt, 10);
      ctx.fillStyle = rg(ctx, 0, -26, 22, '#a8b0bc', '#5a6470'); roundRect(ctx, -14, -38, 28, 28, 8); ctx.fill();
      ell(ctx, 6, -38, 11, 9, '#8a94a0');
      ctx.fillStyle = '#5a6470'; ctx.beginPath(); ctx.moveTo(-2, -44); ctx.lineTo(-4, -54); ctx.lineTo(3, -46); ctx.moveTo(10, -46); ctx.lineTo(14, -55); ctx.lineTo(15, -44); ctx.fill();
      eye(ctx, 4, -40, 2.6, true); eye(ctx, 11, -40, 2.4, true); frown(ctx, 8, -34, 3);
      break;
    }
    case 'balloon': {
      ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(Math.sin(tt * 3) * 4, -12, 0, -2); ctx.stroke();
      ctx.fillStyle = '#b07a3a'; ctx.fillRect(-6, -8, 12, 8);
      ell(ctx, 0, -40, 15, 18, rg(ctx, -4, -46, 18, '#ffb0d0', '#e83a7a'));
      ctx.fillStyle = '#e83a7a'; ctx.beginPath(); ctx.moveTo(-3, -22); ctx.lineTo(3, -22); ctx.lineTo(0, -25); ctx.fill();
      ell(ctx, -6, -46, 4, 6, 'rgba(255,255,255,.5)');
      eye(ctx, -3, -40, 2.6, true); eye(ctx, 5, -40, 2.6, true); frown(ctx, 1, -33, 3);
      break;
    }
    case 'goat': {
      const run = e.charging ? Math.sin(tt * 20) : Math.sin(tt * 7) * 0.5;
      for (const lx of [-14, -6, 10, 16]) { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(lx - 2 + run * (lx > 0 ? 3 : -3), -14, 5, 14); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(lx - 2 + run * (lx > 0 ? 3 : -3), -3, 5, 3); }
      ell(ctx, 0, -22, 22, 11, rg(ctx, 0, -24, 22, '#ffffff', '#c8c0b0'));
      ell(ctx, 20, -28, 9, 8, '#f4ecdc');
      ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(16, -36, 6, Math.PI, Math.PI * 1.9); ctx.stroke();
      ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(22, -21); ctx.lineTo(26, -12); ctx.lineTo(28, -21); ctx.fill();
      eye(ctx, 22, -30, 2.6, true);
      if (e.windup > 0) { ctx.fillStyle = '#fff'; ctx.font = '800 20px sans-serif'; ctx.fillText('!', 16, -46); }
      break;
    }
    case 'archer': {
      legs(ctx, [-5, 5], -16, 16, '#3a4a2a', 5, tt, 0);
      ctx.fillStyle = rg(ctx, 0, -32, 20, '#7ac85a', '#3a7a2a'); roundRect(ctx, -11, -44, 22, 30, 6); ctx.fill();
      ell(ctx, 1, -50, 9, 9, '#f0c8a0');
      ctx.fillStyle = '#3a7a2a'; ctx.beginPath(); ctx.moveTo(-10, -50); ctx.quadraticCurveTo(0, -66, 12, -52); ctx.lineTo(20, -56); ctx.lineTo(10, -48); ctx.closePath(); ctx.fill();
      eye(ctx, 4, -50, 2.2, true);
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(14, -32, 14, -1.2, 1.2); ctx.stroke();
      const pull = e.aim > 0 ? 8 : 0;
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(19, -45); ctx.lineTo(14 - pull, -32); ctx.lineTo(19, -19); ctx.stroke();
      break;
    }
    case 'eagle': {
      flap(ctx, -8, -22, 34, 9, '#6a4a2a', tt, e.diving ? 2 : 8);
      ell(ctx, 0, -16, 22, 12, rg(ctx, 0, -18, 22, '#9a6a3a', '#4a2a12'));
      ell(ctx, 20, -24, 10, 9, '#ffffff');
      ctx.fillStyle = '#f0b030'; ctx.beginPath(); ctx.moveTo(26, -27); ctx.quadraticCurveTo(36, -26, 33, -18); ctx.lineTo(27, -21); ctx.fill();
      eye(ctx, 22, -27, 2.6, true);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-20, -16); ctx.lineTo(-32, -10); ctx.lineTo(-30, -20); ctx.fill();
      if (e.diving) { ctx.strokeStyle = '#f0b030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(6, 2); ctx.moveTo(10, -6); ctx.lineTo(12, 2); ctx.stroke(); }
      break;
    }
  }
}

// Strikje van Avalon op het hoofd van een vijand of baas
export function drawBow(ctx, x, y, s = 1, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 3) * 0.12);
  ctx.fillStyle = '#ff5fa2'; ctx.strokeStyle = '#c8306e'; ctx.lineWidth = 1.4;
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(d * 10, -10, d * 15, -4); ctx.quadraticCurveTo(d * 16, 4, d * 12, 6); ctx.quadraticCurveTo(d * 6, 6, 0, 0); ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-2, 2); ctx.lineTo(-6, 12); ctx.lineTo(-2, 10); ctx.moveTo(2, 2); ctx.lineTo(6, 12); ctx.lineTo(2, 10); ctx.fill();
  ell(ctx, 0, 0, 4, 4, '#ff8ac0'); ctx.stroke();
  ell(ctx, -8, -4, 3, 1.6, 'rgba(255,255,255,.6)', -0.5);
  ctx.restore();
}

// ---------- bosses ----------
export const BOSS_SIZE = { gorilla: [140, 160], wizard: [100, 170], octopus: [160, 140], dragon: [190, 130] };

export function drawBoss(ctx, b, t) {
  ctx.save(); ctx.translate(b.x, b.y);
  if (b.dir < 0) ctx.scale(-1, 1);
  const s = b.scale; ctx.scale(s, s);
  if (b.flash > 0) ctx.filter = 'brightness(2.4)';
  if (b.fade !== undefined) ctx.globalAlpha = b.fade;
  const tint = b.tint;
  if (b.kind === 'gorilla') gorilla(ctx, b, t, tint);
  else if (b.kind === 'wizard') wizard(ctx, b, t, tint);
  else if (b.kind === 'octopus') octopus(ctx, b, t, tint);
  else if (b.kind === 'dragon') dragon(ctx, b, t, tint);
  ctx.filter = 'none'; ctx.globalAlpha = 1;
  if (b.dizzy > 0) { ctx.fillStyle = '#ffe04a'; for (let i = 0; i < 4; i++) { const a = t * 5 + i * 1.6; star(ctx, Math.cos(a) * 40, -BOSS_SIZE[b.kind][1] - 14 + Math.sin(a) * 8, 8); } }
  ctx.restore();
}
function crown(ctx, x, y, s, col = '#ffd34d') {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 20 * s, y); ctx.lineTo(x - 22 * s, y - 20 * s); ctx.lineTo(x - 10 * s, y - 9 * s); ctx.lineTo(x, y - 24 * s); ctx.lineTo(x + 10 * s, y - 9 * s); ctx.lineTo(x + 22 * s, y - 20 * s); ctx.lineTo(x + 20 * s, y); ctx.closePath(); ctx.fill();
  ell(ctx, x, y - 7 * s, 3.5 * s, 3.5 * s, '#e8413a'); ell(ctx, x - 12 * s, y - 5 * s, 2.5 * s, 2.5 * s, '#3a7be8'); ell(ctx, x + 12 * s, y - 5 * s, 2.5 * s, 2.5 * s, '#42c94a');
}
function gorilla(ctx, b, t, tint) {
  const walk = b.moving ? Math.sin(t * 10) : 0;
  const atkArm = b.state === 'throw' || b.state === 'slam' ? -1.2 : 0;
  ctx.fillStyle = '#2b2a33';
  ctx.fillRect(-34 + walk * 6, -50, 24, 50); ctx.fillRect(10 - walk * 6, -50, 24, 50);
  ell(ctx, -22 + walk * 6, -2, 16, 7, '#1d1c22'); ell(ctx, 22 - walk * 6, -2, 16, 7, '#1d1c22');
  // back arm
  ctx.save(); ctx.translate(-40, -120); ctx.rotate(0.15 - walk * 0.3); ctx.fillStyle = '#24232b'; roundRect(ctx, -14, 0, 28, 95, 14); ctx.fill(); ctx.restore();
  // body
  ell(ctx, 0, -95, 62, 62, rg(ctx, 0, -100, 64, '#4d4b59', '#22212a'));
  ell(ctx, 6, -86, 34, 38, rg(ctx, 6, -88, 36, '#7d7686', '#4d4859'));
  // head
  ell(ctx, 14, -150, 34, 30, rg(ctx, 14, -154, 34, '#4d4b59', '#25242c'));
  ell(ctx, 26, -140, 22, 16, '#8d8496');
  ell(ctx, 28, -145, 4, 3, '#2a2a2a'); ell(ctx, 36, -144, 4, 3, '#2a2a2a');
  ctx.fillStyle = '#3a3742'; ctx.fillRect(6, -168, 36, 8);
  eye(ctx, 18, -160, 6, true); eye(ctx, 36, -158, 5, true);
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(20, -132); ctx.quadraticCurveTo(30, -138, 40, -132); ctx.stroke();
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(-18, -178, 64, 10); ctx.beginPath(); ctx.moveTo(-18, -176); ctx.lineTo(-34, -186); ctx.lineTo(-30, -168); ctx.fill(); }
  else crown(ctx, 14, -176, 1.2);
  // front arm
  ctx.save(); ctx.translate(48, -120); ctx.rotate(-0.15 + walk * 0.3 + atkArm); ctx.fillStyle = '#34333d'; roundRect(ctx, -15, 0, 30, 98, 15); ctx.fill(); ell(ctx, 0, 98, 18, 14, '#5a5562'); ctx.restore();
}
function wizard(ctx, b, t, tint) {
  const fl = Math.sin(t * 2.5) * 4;
  ctx.translate(0, fl);
  // cloud seat
  ctx.fillStyle = '#6a6f8f'; for (const [dx, r] of [[-40, 22], [-14, 28], [14, 26], [40, 22]]) ell(ctx, dx, -10, r, r * 0.7, null), ctx.fill();
  ctx.fillStyle = '#8a8faf'; ell(ctx, -10, -18, 26, 10, null); ctx.fill();
  // robe
  ctx.fillStyle = lg(ctx, 0, -130, 0, -10, [[0, tint || '#6a3ad0'], [1, '#2a1a6a']]);
  ctx.beginPath(); ctx.moveTo(-34, -20); ctx.lineTo(-22, -110); ctx.lineTo(22, -110); ctx.lineTo(40, -20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe04a'; for (let i = 0; i < 5; i++) star(ctx, -18 + i * 9, -40 - (i % 2) * 30, 4);
  // face
  ell(ctx, 4, -122, 18, 18, '#f0c8a8');
  eye(ctx, 2, -126, 4, true); eye(ctx, 14, -125, 3.6, true);
  ell(ctx, 18, -116, 4, 3.5, '#e0a088');
  // beard
  ctx.fillStyle = '#d8dde6';
  ctx.beginPath(); ctx.moveTo(-14, -116); ctx.quadraticCurveTo(-8, -60 + Math.sin(t * 3) * 3, 8, -52); ctx.quadraticCurveTo(26, -70, 24, -114); ctx.quadraticCurveTo(8, -104, -14, -116); ctx.fill();
  ctx.strokeStyle = '#ffe04a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -100); ctx.lineTo(-4, -90); ctx.lineTo(4, -86); ctx.lineTo(0, -74); ctx.stroke();
  // hat
  ctx.fillStyle = tint ? darken(tint, .2) : '#4a2aa0';
  ctx.beginPath(); ctx.moveTo(-26, -134); ctx.quadraticCurveTo(-4, -146, 30, -134); ctx.lineTo(16, -160); ctx.quadraticCurveTo(10, -190, -14, -196); ctx.quadraticCurveTo(-2, -176, -10, -150); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe04a'; star(ctx, 2, -156, 7); star(ctx, -12, -184, 4);
  // wand
  const wa = b.state === 'shot' || b.state === 'rain' ? -0.9 : -0.3 + Math.sin(t * 2) * 0.1;
  ctx.save(); ctx.translate(30, -84); ctx.rotate(wa); ctx.fillStyle = '#7a4a22'; ctx.fillRect(-2, -50, 4, 52); ctx.fillStyle = '#ffe04a'; star(ctx, 0, -54, 9);
  if (b.state === 'shot' || b.state === 'rain') { ctx.fillStyle = 'rgba(255,240,120,.5)'; ell(ctx, 0, -54, 18 + Math.sin(t * 30) * 4, 18, null); ctx.fill(); }
  ctx.restore();
}
function octopus(ctx, b, t, tint) {
  const body = tint || '#c4408a';
  for (let i = 0; i < 8; i++) {
    const bx = -60 + i * 17;
    ctx.strokeStyle = darken(body, .1); ctx.lineWidth = 16 - Math.abs(i - 3.5) * 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx * 0.6, -50);
    ctx.bezierCurveTo(bx, -20, bx + Math.sin(t * 3 + i) * 22, -14, bx + Math.sin(t * 3 + i + 1) * 28, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffd0e8';
    for (let k = 1; k < 4; k++) ell(ctx, bx * (0.6 + k * 0.13) + Math.sin(t * 3 + i) * k * 5, -44 + k * 12, 2.4, 2.4, null), ctx.fill();
  }
  ell(ctx, 0, -86, 62, 56, rg(ctx, 0, -96, 62, lighten(body.startsWith('#') ? body : '#c4408a', .35), darken(body, .1)));
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ell(ctx, -18, -118, 22, 12, null, -0.4); ctx.fill();
  for (const [sx, sy, r] of [[-26, -94, 5], [-36, -70, 4], [30, -110, 4]]) ell(ctx, sx, sy, r, r, 'rgba(255,255,255,.25)');
  eye(ctx, 8, -88, 12, true); eye(ctx, 38, -86, 10, true);
  ctx.strokeStyle = '#4a0a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(28, -64, 10, Math.PI + 0.5, -0.5); ctx.stroke();
  if (!b.tint) crown(ctx, 10, -138, 1.0);
  else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(10, -140, 8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = b.tint; ctx.beginPath(); ctx.arc(10, -140, 4, 0, Math.PI * 2); ctx.fill(); }
}
function dragon(ctx, b, t, tint) {
  const body = tint || '#e2553b';
  const flap = Math.sin(t * (b.state === 'swoop' ? 14 : 7));
  // tail
  ctx.strokeStyle = darken(body, .1); ctx.lineWidth = 18; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-50, -60); ctx.quadraticCurveTo(-100, -50 + Math.sin(t * 3) * 10, -120, -80 + Math.sin(t * 3) * 14); ctx.stroke();
  ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(-120, -80 + Math.sin(t * 3) * 14); ctx.lineTo(-140, -92 + Math.sin(t * 3) * 14); ctx.lineTo(-130, -70 + Math.sin(t * 3) * 14); ctx.fill();
  // back wing
  wing(ctx, -6, -86, -flap, darken(body, .25));
  // legs
  ctx.fillStyle = darken(body, .15); roundRect(ctx, -34, -40, 20, 38, 8); ctx.fill(); roundRect(ctx, 10, -40, 20, 38, 8); ctx.fill();
  // body
  ell(ctx, 0, -62, 58, 36, rg(ctx, 0, -70, 58, lighten(body.startsWith('#') ? body : '#e2553b', .3), darken(body, .15)));
  ell(ctx, 14, -50, 36, 20, '#ffd98a');
  ctx.strokeStyle = '#e8b050'; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 12, -64); ctx.lineTo(-6 + i * 12, -34); ctx.stroke(); }
  // neck + head
  ctx.strokeStyle = body; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(40, -76); ctx.quadraticCurveTo(64, -104, 74, -112); ctx.stroke();
  ell(ctx, 84, -116, 28, 20, rg(ctx, 84, -120, 28, lighten(body.startsWith('#') ? body : '#e2553b', .3), darken(body, .1)));
  ell(ctx, 104, -108, 16, 11, darken(body, .05));
  ell(ctx, 112, -112, 2.6, 2, '#2a1010');
  eye(ctx, 84, -124, 6, true);
  ctx.fillStyle = '#fff3d0'; for (const hx of [64, 76]) { ctx.beginPath(); ctx.moveTo(hx, -132); ctx.lineTo(hx - 10, -152); ctx.lineTo(hx + 6, -134); ctx.fill(); }
  if (b.state === 'shot' || b.breath > 0) { ctx.fillStyle = 'rgba(255,170,40,.8)'; ell(ctx, 124, -104, 12, 8, null); ctx.fill(); ctx.fillStyle = 'rgba(255,240,120,.9)'; ell(ctx, 124, -104, 6, 4, null); ctx.fill(); }
  if (!b.tint) crown(ctx, 80, -134, 0.7);
  // front wing
  wing(ctx, 6, -84, flap, body);
}
function wing(ctx, x, y, flap, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.4 + flap * 0.5);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -90); ctx.quadraticCurveTo(-40, -60, -70, -56); ctx.quadraticCurveTo(-50, -34, -64, -12); ctx.quadraticCurveTo(-34, -14, 0, 0); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -90); ctx.moveTo(0, 0); ctx.lineTo(-70, -56); ctx.moveTo(0, 0); ctx.lineTo(-64, -12); ctx.stroke();
  ctx.restore();
}

// ---------- projectiles ----------
export function drawProjectile(ctx, p, t) {
  ctx.save(); ctx.translate(p.x, p.y);
  switch (p.type) {
    case 'bottle': ctx.rotate(p.rot); drawBottle(ctx, 0, 0, 1.6); break;
    case 'pie': drawPie(ctx, 0, 0, 1.6); break;
    case 'wrench': drawWrench(ctx, 0, 0, 1.5, p.rot); break;
    case 'pancake': ctx.scale(1, 0.7 + Math.sin(p.rot) * 0.15); drawPancake(ctx, 0, 0, 1.7); break;
    case 'wave': {
      const k = p.age / p.life;
      ctx.scale(p.dir, 1);
      for (let i = 0; i < 4; i++) {
        const r = 20 + i * 12 + k * 30;
        ctx.strokeStyle = `rgba(${i % 2 ? '255,120,200' : '120,220,255'},${(1 - k) * (0.9 - i * 0.15)})`;
        ctx.lineWidth = 6 - i;
        ctx.beginPath(); ctx.arc(-30, 0, r, -0.7, 0.7); ctx.stroke();
      }
      ctx.fillStyle = `rgba(255,255,255,${1 - k})`; ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('AAAH!', 0, -46);
      break;
    }
    case 'coconut': ctx.rotate(p.rot); ell(ctx, 0, 0, 13, 12, rg(ctx, 0, 0, 13, '#a06a3a', '#5a3418')); ell(ctx, -3, -4, 2, 2, '#3a2010'); ell(ctx, 3, -4, 2, 2, '#3a2010'); ell(ctx, 0, 2, 2, 2, '#3a2010'); break;
    case 'bolt': {
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = 'rgba(255,240,120,.4)'; ell(ctx, 0, 0, 22, 12, null); ctx.fill();
      ctx.fillStyle = '#ffe04a'; ctx.beginPath(); ctx.moveTo(-18, -3); ctx.lineTo(0, -6); ctx.lineTo(-4, 0); ctx.lineTo(18, 0); ctx.lineTo(0, 6); ctx.lineTo(4, 0); ctx.lineTo(-18, 3); ctx.closePath(); ctx.fill();
      break;
    }
    case 'ink': ell(ctx, 0, 0, 13, 11, '#2a1a3a'); ell(ctx, -4, -4, 3, 2, 'rgba(255,255,255,.4)'); for (let i = 0; i < 3; i++) ell(ctx, -p.vx * 0.02 * (i + 1), -p.vy * 0.02 * (i + 1), 6 - i * 1.5, 6 - i * 1.5, 'rgba(42,26,58,.5)'); break;
    case 'bubble': ctx.strokeStyle = 'rgba(220,250,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke(); ell(ctx, -4, -5, 4, 3, 'rgba(255,255,255,.7)'); break;
    case 'fire': {
      const f = 1 + Math.sin(t * 30 + p.x) * 0.15;
      ell(ctx, 0, 0, 18 * f, 14 * f, 'rgba(255,120,30,.6)'); ell(ctx, 0, 0, 11 * f, 9 * f, '#ffb030'); ell(ctx, 2, 0, 5, 4, '#fff6b0');
      break;
    }
    case 'shock': {
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.moveTo(-18, 0); ctx.quadraticCurveTo(0, -34 - Math.sin(t * 30) * 6, 18, 0); ctx.fill();
      ctx.fillStyle = p.color || 'rgba(140,110,80,.8)'; ctx.fillRect(-22, -6, 44, 6);
      break;
    }
    case 'seed': ell(ctx, 0, 0, 7, 5, '#7a4a1a', Math.atan2(p.vy, p.vx)); ell(ctx, -2, -2, 2, 1.4, 'rgba(255,255,255,.4)'); break;
    case 'snowball': ell(ctx, 0, 0, 11, 11, rg(ctx, 0, 0, 11, '#ffffff', '#bcd0ec')); break;
    case 'arrow': {
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(12, 0); ctx.stroke();
      ctx.fillStyle = '#c8ccd4'; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(10, -4); ctx.lineTo(10, 4); ctx.fill();
      ctx.fillStyle = '#e8413a'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-20, -5); ctx.lineTo(-12, 0); ctx.lineTo(-20, 5); ctx.fill();
      break;
    }
    case 'chalk': drawChalk(ctx, 0, 0, 1.5, p.rot || 0, p.color || '#fff'); break;
    case 'hairball': {
      ctx.rotate(p.rot || 0);
      ell(ctx, 0, 0, 12, 11, rg(ctx, 0, 0, 12, '#d8c8b0', '#7a5a42'));
      ctx.strokeStyle = '#5a3e2a'; ctx.lineWidth = 1.2;
      for (let i = 0; i < 9; i++) { const a = i * 0.7; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.quadraticCurveTo(Math.cos(a + 0.4) * 13, Math.sin(a + 0.4) * 13, Math.cos(a + 0.2) * 16, Math.sin(a + 0.2) * 15); ctx.stroke(); }
      break;
    }
    case 'burp': {
      // groene boerwolk
      const k = p.age / p.life;
      ctx.scale(p.dir || 1, 1); ctx.globalAlpha = Math.max(0, 1 - k);
      for (let i = 0; i < 5; i++) ell(ctx, -20 + i * 12, Math.sin(i * 2 + t * 12) * 14, 22 + k * 20 - i * 2, 18 + k * 16 - i * 2, i % 2 ? 'rgba(180,225,95,.7)' : 'rgba(140,200,70,.6)');
      ctx.globalAlpha = 1;
      break;
    }
    case 'yarn': {
      // bol breiwol met een draadje erachter
      ctx.rotate(p.rot || 0);
      ell(ctx, 0, 0, 13, 13, rg(ctx, 0, 0, 13, '#ff9ec6', '#d6457f'));
      ctx.strokeStyle = 'rgba(140,20,70,.65)'; ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, 0, 12, 5 + i * 2, i * 0.8, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#ff8ab8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 0); ctx.quadraticCurveTo(22, 8, 30, 2); ctx.stroke();
      ctx.fillStyle = '#c0c4cc'; ctx.save(); ctx.rotate(0.6); ctx.fillRect(-1, -20, 2, 18); ctx.rotate(-1.1); ctx.fillRect(-1, -20, 2, 18); ctx.restore();
      break;
    }
    case 'peel': {
      // bananenschil
      ctx.rotate(p.rot || 0);
      ctx.fillStyle = '#ffd93b'; ctx.strokeStyle = '#b88a10'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (const a of [-2.6, -1.6, 0.9, 2.2]) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(12, 0, 10, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
      ell(ctx, 0, -3, 3, 2, '#6b4a10');
      break;
    }
    case 'pan': {
      // draaiende koekenpan (Lola)
      ctx.rotate(p.rot || 0);
      ctx.fillStyle = '#6b4a2e'; ctx.fillRect(14, -3.5, 24, 7);
      ctx.fillStyle = '#3a2716'; ctx.fillRect(34, -3.5, 4, 7);
      ell(ctx, 0, 0, 17, 17, '#2b2f36');
      ell(ctx, 0, 0, 13, 13, '#3d434d');
      ell(ctx, -4, -4, 6, 5, 'rgba(255,255,255,.18)');
      break;
    }
    case 'rice': ell(ctx, 0, 0, 3.4, 1.8, '#fffdf2', Math.atan2(p.vy, p.vx)); ctx.strokeStyle = 'rgba(160,150,120,.6)'; ctx.lineWidth = 0.6; ctx.stroke(); break;
    case 'warn': {
      ctx.globalAlpha = 0.4 + Math.sin(t * 20) * 0.3;
      ell(ctx, 0, 0, 26, 7, '#ff3b3b');
      break;
    }
  }
  ctx.restore();
}

// world preview for selection cards
export function drawWorldPreview(canvas, wid, t = 0) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 400, h = canvas.clientHeight || 200;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const sc = h / 300; ctx.save(); ctx.scale(sc, sc);
  const W = w / sc, H = 300;
  ctx.translate(0, -160);
  drawBackground(ctx, wid, 300, 0, W, 460, t + 1);
  drawGround(ctx, wid, { x: -10, w: W * 0.45, y: 420 }, 470);
  drawGround(ctx, wid, { x: W * 0.55, w: W * 0.6, y: 400 }, 470);
  drawPlat(ctx, wid, { x: W * 0.32, y: 330, w: 120, kind: 'plat' }, t);
  drawToken(ctx, W * 0.32 + 60, 290, t);
  const enemy = { world: wid, jungle: 'snake', clouds: 'cloudling', water: 'crab', sky: 'knight' }[wid];
  drawEnemy(ctx, { type: enemy, x: W * 0.72, y: 400, dir: -1, id: 3, h: 30, hp: 1, maxhp: 1, flash: 0, stun: 0 }, t);
  ctx.restore();
}
