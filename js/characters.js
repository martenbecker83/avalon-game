// Personages: definities + getekende figuren (alles in code, geen foto's)

export const CHARACTERS = [
  {
    id: 'avalon', name: 'Avalon', weapon: 'Zwaard', kind: 'human', height: 72,
    power: 'Zwaardslag',
    desc: 'Supersnel, met snelle zwaardslagen dichtbij.',
    stats: { kracht: 3, bereik: 2, snelheid: 5 },
    attack: { type: 'sword', cd: 0.30, dmg: 2 },
    speed: 355, jump: 790,
    look: {
      skin: '#f1c7a6', skinShade: '#d9a383', cheek: '#f39a8f',
      hair: '#1f1612', hairHi: '#4a3528', hairStyle: 'bob',
      eye: '#5b4a2e', brow: '#1f1612',
      top: '#f4efe4', topShade: '#d9d0bf', topStyle: 'vest', trim: '#6b3524', trim2: '#d6452f',
      pants: '#3d4f74', shoes: '#e9e9ee', earring: true, child: true,
    },
  },
  {
    id: 'papa', name: 'Papa', weapon: 'Bierflesjes', kind: 'human', height: 88,
    power: 'Flessenworp',
    desc: 'Gooit flesjes ver in een boog. Schuim raakt de buren!',
    stats: { kracht: 3, bereik: 4, snelheid: 4 },
    attack: { type: 'bottle', cd: 0.40, dmg: 1 },
    speed: 320, jump: 770,
    look: {
      skin: '#f0c4a3', skinShade: '#d39d7c', cheek: '#ee9a86', stubble: true,
      hair: '#6a4328', hairHi: '#9a6a43', hairStyle: 'swept',
      eye: '#6f8fa6', brow: '#5a3a22',
      top: '#1f5fd0', topShade: '#16479f', topStyle: 'hoodie', trim: '#f2f2f2',
      pants: '#2d3442', shoes: '#3a2c22',
    },
  },
  {
    id: 'mama', name: 'Mama', weapon: 'Microfoon', kind: 'human', height: 84,
    power: 'Schreeuwgolf',
    desc: 'Haar schreeuw gaat dwars door alle vijanden heen.',
    stats: { kracht: 4, bereik: 4, snelheid: 4 },
    attack: { type: 'mic', cd: 0.90, dmg: 2 },
    speed: 320, jump: 770,
    look: {
      skin: '#d9a77f', skinShade: '#bb855e', cheek: '#e38e7a',
      hair: '#1d1411', hairHi: '#4a3226', hairStyle: 'long',
      eye: '#3e2a1c', brow: '#1d1411',
      top: '#f7f7f4', topShade: '#d8d8d2', topStyle: 'cardigan', trim: '#ffffff',
      pants: '#5b6ea8', shoes: '#f0e6dc',
    },
  },
  {
    id: 'fuchi', name: 'Fu-Chi', weapon: 'Klauwen', kind: 'cat', height: 48,
    power: 'Klauwenstorm',
    desc: 'Supersnel krabben en springt het hoogst van iedereen.',
    stats: { kracht: 2, bereik: 1, snelheid: 5 },
    attack: { type: 'claws', cd: 0.15, dmg: 1 },
    speed: 360, jump: 880,
    look: { fur: '#efe3d2', furShade: '#cdbba4', point: '#4a2f22', pointHi: '#6e4a36', eye: '#6fb8d8', white: '#ffffff' },
  },
  {
    id: 'oma', name: 'Oma', weapon: 'Appeltaart', kind: 'human', height: 80,
    power: 'Taart-in-je-gezicht',
    desc: 'Taart vol in het gezicht: de vijand ziet even niks!',
    stats: { kracht: 4, bereik: 2, snelheid: 2 },
    attack: { type: 'pie', cd: 0.5, dmg: 2 },
    speed: 255, jump: 745,
    look: {
      skin: '#f3cdb3', skinShade: '#d9aa8d', cheek: '#ef9e93', freckles: true,
      hair: '#efe8d8', hairHi: '#ffffff', hairStyle: 'pixie',
      eye: '#6d7d8a', brow: '#cfc3ad',
      top: '#2e8c7a', topShade: '#226b5d', topStyle: 'pattern', trim: '#f0f4f2', trim2: '#3e4a8c',
      pants: '#2f3a55', shoes: '#f2f2f2', wrinkles: 1,
    },
  },
  {
    id: 'opa', name: 'Opa', weapon: 'Moersleutel', kind: 'human', height: 90,
    power: 'Sleutelsmijter',
    desc: 'Smijt zijn moersleutel. Niet ver, maar keihard.',
    stats: { kracht: 5, bereik: 2, snelheid: 2 },
    attack: { type: 'wrench', cd: 0.45, dmg: 3 },
    speed: 255, jump: 740,
    look: {
      skin: '#f0c9ad', skinShade: '#d4a184', cheek: '#ec9c8c',
      hair: '#f4f4f0', hairHi: '#ffffff', hairStyle: 'thinwhite',
      eye: '#7f97a6', brow: '#dcdcd4',
      top: '#222428', topShade: '#141518', topStyle: 'tee', trim: '#3a3d44',
      pants: '#4a5263', shoes: '#2a2a2a', glasses: 'aviator', glassColor: '#1c1c1c', wrinkles: 2,
    },
  },
  {
    id: 'lolo', name: 'Lolo', weapon: 'Hamer', kind: 'human', height: 82,
    power: 'Hamerdreun',
    desc: 'Dreunt op de grond en raakt vijanden links en rechts.',
    stats: { kracht: 5, bereik: 1, snelheid: 2 },
    attack: { type: 'hammer', cd: 0.6, dmg: 3 },
    speed: 255, jump: 740,
    look: {
      skin: '#d6a47c', skinShade: '#b7845d', cheek: '#e08c76', stubble: true,
      hair: '#a9a9a6', hairHi: '#d6d6d2', hairStyle: 'buzz',
      eye: '#3a2a1e', brow: '#8a8782',
      top: '#7d7a52', topShade: '#5f5d3d', topStyle: 'polo', trim: '#6b6844',
      pants: '#3c3f47', shoes: '#2a2a2a', glasses: 'round', glassColor: '#3b3f4a', wrinkles: 2, bigSmile: true,
    },
  },
  {
    id: 'lola', name: 'Lola', weapon: 'Pannenkoeken', kind: 'human', height: 78,
    power: 'Pannenkoek-boemerang',
    desc: 'Pannenkoek-boemerang die heen én terug raakt.',
    stats: { kracht: 4, bereik: 2, snelheid: 2 },
    attack: { type: 'pancake', cd: 0.5, dmg: 2 },
    speed: 255, jump: 745,
    look: {
      skin: '#dfb08c', skinShade: '#c0906b', cheek: '#e8957f',
      hair: '#c9c9c6', hairHi: '#ececea', hairStyle: 'shortgrey',
      eye: '#3a2a1e', brow: '#8f8a84',
      top: '#c8cdd3', topShade: '#a6acb4', topStyle: 'tee', trim: '#b5bbc3',
      pants: '#2d3a5c', shoes: '#efefef', glasses: 'cat', glassColor: '#24408f', wrinkles: 1, earring: true, pout: true,
    },
  },
];

export const charById = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];

// ---------- helpers ----------
function limb(ctx, x1, y1, x2, y2, w, color, shade) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = shade; ctx.lineWidth = w + 2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1 - 0.6, y1 - 0.6); ctx.lineTo(x2 - 0.6, y2 - 0.6); ctx.stroke();
}
function ell(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}
function radial(ctx, x, y, r, c1, c2) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
  g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
}
const lerp = (a, b, t) => a + (b - a) * t;

// Two-segment leg with knee bend
function leg(ctx, hx, hy, angle, len, w, colPants, shadePants, shoe, bend = 0) {
  const kx = hx + Math.sin(angle) * len * 0.5;
  const ky = hy + Math.cos(angle) * len * 0.5;
  const a2 = angle - Math.max(0, bend);
  const fx = kx + Math.sin(a2) * len * 0.5;
  const fy = ky + Math.cos(a2) * len * 0.5;
  limb(ctx, hx, hy, kx, ky, w, colPants, shadePants);
  limb(ctx, kx, ky, fx, fy, w * 0.9, colPants, shadePants);
  // shoe
  ctx.save(); ctx.translate(fx, fy); ctx.rotate(-a2 * 0.5);
  ell(ctx, 3, 1, 7, 3.6, shoe);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(-4, 2.6, 14, 1.4);
  ctx.restore();
  return { fx, fy };
}

// ---------- main draw ----------
// st: { t, walk, moving, air, vy, atk (0..1 or -1), hurt, flash, portrait }
export function drawCharacter(ctx, def, st) {
  if (def.kind === 'cat') return drawCat(ctx, def, st);
  return drawHuman(ctx, def, st);
}

function drawHuman(ctx, def, st) {
  const L = def.look;
  const s = def.height / 100;
  ctx.save();
  ctx.scale(s, s);
  const t = st.t || 0;
  const child = !!L.child;
  const headR = child ? 11.6 : 10.2;
  const headY = -100 + headR + 1;
  const neckY = headY + headR - 1;
  const shY = neckY + 3.5;
  const hipY = child ? -45 : -48;
  const legLen = -hipY - 2;
  const bob = st.moving && !st.air ? Math.abs(Math.sin(st.walk)) * 1.6 : Math.sin(t * 2.2) * 0.6;
  ctx.translate(0, -bob);

  let swing = st.moving && !st.air ? Math.sin(st.walk) * 0.42 : 0;
  let legA = swing, legB = -swing;
  let bendA = st.moving ? Math.max(0, -Math.cos(st.walk)) * 0.7 : 0;
  let bendB = st.moving ? Math.max(0, Math.cos(st.walk)) * 0.7 : 0;
  if (st.air) { legA = 0.45; legB = -0.25; bendA = 0.9; bendB = 0.3; }

  // arm poses
  let backArm = -swing * 0.8, frontArm = swing * 0.8;
  let frontElbow = 0.3;
  const atk = st.atk ?? -1;
  const wt = def.attack.type;
  if (atk >= 0) {
    if (wt === 'sword') { frontArm = lerp(3.0, 0.9, easeOut(atk)); frontElbow = 0.1; }
    else if (wt === 'hammer') { frontArm = lerp(3.3, 0.9, easeIn(atk)); frontElbow = 0.05; }
    else if (wt === 'mic') { frontArm = 1.45; frontElbow = 1.6; }
    else { frontArm = lerp(3.9, 1.5, easeOut(atk)); frontElbow = 0.15; }
  } else if (st.air) { backArm = -2.2; frontArm = 2.1; frontElbow = 0.4; }
  else if (!st.moving) { backArm = 0.08 + Math.sin(t * 2.2) * 0.03; frontArm = -0.08 - Math.sin(t * 2.2) * 0.03; }

  const shoulderW = child ? 8 : 10;
  const armLen = child ? 30 : 34;
  const armW = child ? 6.6 : 7.4;

  // --- back hair (long styles) ---
  if (L.hairStyle === 'long') drawHairBackLong(ctx, L, headY, headR, t, st);
  if (L.hairStyle === 'bob') drawHairBackBob(ctx, L, headY, headR);

  // --- back arm ---
  if (!st.bust) drawArm(ctx, -shoulderW * 0.35, shY + 2, backArm, 0.35, armLen, armW, shadeOf(L.top, L.topShade, true), L.topShade, L.skinShade, L, false, null);

  // --- back leg ---
  leg(ctx, -2.5, hipY, legB, legLen, child ? 8 : 9, shadeOf(L.pants, darken(L.pants, .25), true), darken(L.pants, .35), darken(L.shoes, .15), bendB);

  // --- torso ---
  drawTorso(ctx, L, shY, hipY, shoulderW, child, t);

  // --- front leg ---
  leg(ctx, 2.5, hipY, legA, legLen, child ? 8.4 : 9.4, L.pants, darken(L.pants, .3), L.shoes, bendA);
  // re-draw lower torso hem over hips for clean overlap
  drawHem(ctx, L, hipY, shoulderW, child);

  // --- neck & head ---
  limb(ctx, 1, neckY - 2, 1.5, shY + 1, child ? 6 : 7, L.skin, L.skinShade);
  drawHead(ctx, L, headY, headR, st);

  // --- front arm + weapon ---
  if (!st.bust) drawArm(ctx, shoulderW * 0.45, shY + 2, frontArm, frontElbow, armLen, armW + 0.4, L.top, L.topShade, L.skinShade, L, true, (hx, hy, ang) => {
    if (!st.noWeapon) drawHeldWeapon(ctx, def, hx, hy, ang, atk, t);
  });

  ctx.restore();
}

function easeOut(x) { return 1 - (1 - x) * (1 - x); }
function easeIn(x) { return x * x; }
function shadeOf(c) { return darken(c, .12); }

function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
export function darken(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  const [r, g, b] = hexToRgb(hex);
  const f = 1 - amt;
  return `rgb(${(r * f) | 0},${(g * f) | 0},${(b * f) | 0})`;
}
export function lighten(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${(r + (255 - r) * amt) | 0},${(g + (255 - g) * amt) | 0},${(b + (255 - b) * amt) | 0})`;
}

function drawArm(ctx, sx, sy, ang, elbow, len, w, col, shade, skinShade, L, front, weaponCb) {
  const ex = sx + Math.sin(ang) * len * 0.5;
  const ey = sy + Math.cos(ang) * len * 0.5;
  const a2 = ang + elbow;
  const hx = ex + Math.sin(a2) * len * 0.48;
  const hy = ey + Math.cos(a2) * len * 0.48;
  const sleeveFull = L.topStyle === 'hoodie' || L.topStyle === 'cardigan' || L.topStyle === 'vest' || L.topStyle === 'pattern';
  limb(ctx, sx, sy, ex, ey, w, col, shade);
  if (sleeveFull) limb(ctx, ex, ey, hx, hy, w * 0.92, col, shade);
  else limb(ctx, ex, ey, hx, hy, w * 0.78, front ? L.skin : darken(L.skin, .08), skinShade);
  if (sleeveFull && L.topStyle === 'hoodie') { ell(ctx, hx - Math.sin(a2) * 2, hy - Math.cos(a2) * 2, w * 0.5, w * 0.5, darken(col, .1)); }
  if (weaponCb) weaponCb(hx, hy, a2);
  ell(ctx, hx, hy, w * 0.55, w * 0.55, front ? L.skin : darken(L.skin, .08));
  return { hx, hy };
}

function drawTorso(ctx, L, shY, hipY, sw, child, t) {
  const top = shY - 1, bot = hipY + 4;
  const wTop = sw + (child ? 3 : 4.5), wBot = sw + (child ? 1.5 : 2);
  ctx.beginPath();
  ctx.moveTo(-wTop + 1, top + 2);
  ctx.quadraticCurveTo(-wTop - 1, top, -wTop + 3, top - 1.5);
  ctx.lineTo(wTop - 2, top - 1.5);
  ctx.quadraticCurveTo(wTop + 1.5, top, wTop + 0.5, top + 3);
  ctx.lineTo(wBot + 1, bot);
  ctx.quadraticCurveTo(0, bot + 2.5, -wBot, bot);
  ctx.closePath();
  const g = ctx.createLinearGradient(-wTop, 0, wTop, 0);
  g.addColorStop(0, L.topShade); g.addColorStop(0.55, L.top); g.addColorStop(1, darken(L.top, .05));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.8; ctx.stroke();

  ctx.save(); ctx.clip();
  if (L.topStyle === 'vest') {
    // knitted sweater vest with V-neck stripes (Avalon)
    ctx.strokeStyle = L.trim; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-6, top - 2); ctx.lineTo(1.5, top + 9); ctx.lineTo(8, top - 2); ctx.stroke();
    ctx.strokeStyle = L.trim2; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(-6.5, top - 0.6); ctx.lineTo(1.5, top + 10.8); ctx.lineTo(8.6, top - 0.6); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-4, top - 2); ctx.lineTo(1.5, top + 6.5); ctx.lineTo(6, top - 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,70,.15)'; ctx.lineWidth = 0.7;
    for (let y = top + 4; y < bot; y += 2.6) { ctx.beginPath(); ctx.moveTo(-20, y); ctx.lineTo(20, y); ctx.stroke(); }
    ctx.fillStyle = L.trim; ctx.fillRect(-20, bot - 3.2, 40, 3.2);
  } else if (L.topStyle === 'hoodie') {
    ctx.fillStyle = darken(L.top, .18);
    ctx.beginPath(); ctx.ellipse(1.5, top + 0.5, 10, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a2f3a'; ctx.beginPath(); ctx.ellipse(1.5, top + 0.2, 6.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = L.trim; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-1, top + 2); ctx.lineTo(-2, top + 13); ctx.moveTo(4.5, top + 2); ctx.lineTo(5.5, top + 12); ctx.stroke();
    ell(ctx, -2, top + 13.5, 1.1, 1.4, '#cfd6de'); ell(ctx, 5.5, top + 12.5, 1.1, 1.4, '#cfd6de');
    ctx.fillStyle = darken(L.top, .12); ctx.fillRect(-9, bot - 10, 19, 6.5);
    ctx.fillStyle = darken(L.top, .2); ctx.fillRect(-20, bot - 3, 40, 3);
  } else if (L.topStyle === 'cardigan') {
    ctx.fillStyle = '#ece7df'; ctx.fillRect(-1.5, top - 2, 6, bot - top + 4);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-1.5, top); ctx.lineTo(-1.5, bot); ctx.moveTo(4.5, top); ctx.lineTo(4.5, bot); ctx.stroke();
  } else if (L.topStyle === 'pattern') {
    // colourful patterned top (Oma)
    const cols = [L.trim, L.trim2, '#f2b84b'];
    for (let i = 0; i < 22; i++) {
      const x = ((i * 37) % 30) - 15, y = top + ((i * 53) % (bot - top));
      ctx.fillStyle = cols[i % 3]; ctx.beginPath(); ctx.ellipse(x, y, 2.4, 1.3, i, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(1.5, top - 1.5, 5, 3.4, 0, 0, Math.PI * 2); ctx.fill();
  } else if (L.topStyle === 'polo') {
    ctx.fillStyle = darken(L.top, .2);
    ctx.beginPath(); ctx.moveTo(-4, top - 2); ctx.lineTo(1.5, top + 4); ctx.lineTo(7, top - 2); ctx.lineTo(5, top + 1.5); ctx.lineTo(1.5, top + 6); ctx.lineTo(-2, top + 1.5); ctx.fill();
    ell(ctx, 1.5, top + 8, .7, .7, '#e8e2c8'); ell(ctx, 1.5, top + 11, .7, .7, '#e8e2c8');
  } else {
    // t-shirt neck
    ctx.fillStyle = L.skin; ctx.beginPath(); ctx.ellipse(1.5, top - 1.6, 5.2, 3.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = L.trim; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(1.5, top - 1.4, 5.6, 3.7, 0, 0.1, Math.PI - 0.1); ctx.stroke();
  }
  // soft light from top-left
  const lg = ctx.createLinearGradient(0, top, 0, bot);
  lg.addColorStop(0, 'rgba(255,255,255,.18)'); lg.addColorStop(1, 'rgba(0,0,0,.08)');
  ctx.fillStyle = lg; ctx.fillRect(-25, top - 5, 50, bot - top + 10);
  ctx.restore();
}
function drawHem(ctx, L, hipY, sw, child) {
  // belt / waist line
  const w = sw + (child ? 1.5 : 2);
  ctx.fillStyle = darken(L.pants, .15);
  ctx.beginPath(); ctx.ellipse(0.5, hipY + 3.5, w, 2.2, 0, 0, Math.PI); ctx.fill();
}

function drawHead(ctx, L, hy, r, st) {
  const t = st.t || 0;
  // ear (back side)
  ell(ctx, -3.6, hy + 1.2, 2.6, 3.6, L.skinShade);
  ell(ctx, -3.4, hy + 1.2, 1.6, 2.4, darken(L.skin, .12));
  if (L.earring) ell(ctx, -3.2, hy + 4.8, 0.9, 0.9, '#f2f2f2');
  // head shape
  ctx.beginPath();
  ctx.moveTo(-r * 0.86, hy - r * 0.2);
  ctx.bezierCurveTo(-r * 0.95, hy - r * 1.12, r * 0.95, hy - r * 1.15, r * 0.98, hy - r * 0.15);
  ctx.bezierCurveTo(r * 1.02, hy + r * 0.55, r * 0.55, hy + r * 1.05, r * 0.1, hy + r * 1.02);
  ctx.bezierCurveTo(-r * 0.45, hy + r * 1.0, -r * 0.9, hy + r * 0.5, -r * 0.86, hy - r * 0.2);
  ctx.fillStyle = radial(ctx, r * 0.15, hy - r * 0.1, r * 1.1, L.skin, L.skinShade);
  ctx.fill();
  // ear front-ish (near ear is hidden in 3/4 view; draw subtle jaw shade)
  ctx.fillStyle = 'rgba(0,0,0,.05)'; ell(ctx, -r * 0.4, hy + r * 0.5, r * 0.45, r * 0.35, null); ctx.fill();

  const blink = (Math.sin(t * 1.7) > 0.985 || st.hurt) ? 0.15 : 1;
  // eyes (3/4 view: near eye at +x bigger)
  const eyeY = hy + r * 0.02;
  const ex1 = r * 0.12, ex2 = r * 0.62;
  for (const [ex, er] of [[ex1, 1.0], [ex2, 0.86]]) {
    ctx.save(); ctx.translate(ex, eyeY); ctx.scale(er, blink);
    ell(ctx, 0, 0, 2.6, 2.0, '#ffffff');
    ell(ctx, 0.5, 0.15, 1.55, 1.75, L.eye);
    ell(ctx, 0.6, 0.2, 0.8, 0.95, '#141414');
    ell(ctx, 1.1, -0.55, 0.45, 0.45, '#ffffff');
    ctx.strokeStyle = 'rgba(40,25,20,.75)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 2.0, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.restore();
  }
  // brows
  ctx.strokeStyle = L.brow; ctx.lineWidth = 1.25; ctx.lineCap = 'round';
  const browUp = st.hurt ? -0.8 : 0;
  ctx.beginPath(); ctx.moveTo(ex1 - 2.6, eyeY - 3.6 + browUp); ctx.quadraticCurveTo(ex1, eyeY - 5 + browUp, ex1 + 2.4, eyeY - 3.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex2 - 2.0, eyeY - 3.9); ctx.quadraticCurveTo(ex2 + 0.4, eyeY - 4.9 + browUp, ex2 + 2.4, eyeY - 3.6 + browUp); ctx.stroke();
  // wrinkles (laugh lines)
  if (L.wrinkles) {
    ctx.strokeStyle = 'rgba(120,70,50,.28)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(ex2 + 2.9, eyeY - 0.5); ctx.lineTo(ex2 + 3.8, eyeY - 1.2); ctx.moveTo(ex2 + 3, eyeY + 0.6); ctx.lineTo(ex2 + 3.9, eyeY + 0.9); ctx.stroke();
    if (L.wrinkles > 1) { ctx.beginPath(); ctx.moveTo(-r * 0.3, hy - r * 0.55); ctx.quadraticCurveTo(r * 0.3, hy - r * 0.62, r * 0.8, hy - r * 0.52); ctx.stroke(); }
  }
  // nose
  ctx.strokeStyle = L.skinShade; ctx.lineWidth = 1.0;
  ctx.beginPath(); ctx.moveTo(r * 0.5, eyeY + 1.6); ctx.quadraticCurveTo(r * 0.98, eyeY + 4.8, r * 0.62, eyeY + 5.4); ctx.stroke();
  ell(ctx, r * 0.68, eyeY + 5.2, 1.4, 0.9, 'rgba(160,90,70,.22)');
  // cheeks
  ell(ctx, r * 0.68, eyeY + 4.4, 2.3, 1.4, hexA(L.cheek, 0.35));
  ell(ctx, -r * 0.05, eyeY + 4.4, 2.4, 1.5, hexA(L.cheek, 0.3));
  if (L.freckles) { ctx.fillStyle = 'rgba(170,110,80,.4)'; for (const [fx, fy] of [[0.3, 3], [0.9, 3.4], [-0.6, 3.6], [0.5, 4.2], [1.3, 2.6]]) ell(ctx, r * 0.35 + fx, eyeY + fy, 0.35, 0.35, null), ctx.fill(); }
  if (L.stubble) { ctx.fillStyle = 'rgba(80,60,50,.12)'; ctx.beginPath(); ctx.ellipse(r * 0.25, hy + r * 0.72, r * 0.7, r * 0.33, 0, 0, Math.PI * 2); ctx.fill(); }
  // mouth
  const my = eyeY + 7.6;
  if (st.hurt) {
    ell(ctx, r * 0.4, my, 1.6, 1.8, '#6a2a2a');
  } else if (st.mic) {
    ell(ctx, r * 0.42, my, 2.4, 2.8, '#5a1f22'); ell(ctx, r * 0.42, my + 1.3, 1.5, 1, '#d55');
  } else if (L.pout) {
    ell(ctx, r * 0.42, my, 2.2, 1.3, '#b8615e'); ell(ctx, r * 0.42, my - 0.3, 1.6, 0.4, 'rgba(255,255,255,.3)');
  } else {
    const w = L.bigSmile ? 4.6 : 3.8;
    ctx.beginPath(); ctx.moveTo(r * 0.42 - w, my - 1.1); ctx.quadraticCurveTo(r * 0.42, my + (L.bigSmile ? 4.4 : 3.6), r * 0.42 + w * 0.85, my - 1.3);
    ctx.quadraticCurveTo(r * 0.42, my + 0.4, r * 0.42 - w, my - 1.1);
    ctx.fillStyle = '#7a2e2e'; ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = '#fbfbf6'; ctx.fillRect(r * 0.42 - w, my - 2, w * 2, 2.1); ctx.restore();
  }

  // hair front
  drawHairFront(ctx, L, hy, r, t);

  // glasses
  if (L.glasses) drawGlasses(ctx, L, ex1, ex2, eyeY, r);
}

function hexA(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

function drawGlasses(ctx, L, ex1, ex2, ey, r) {
  ctx.strokeStyle = L.glassColor; ctx.lineWidth = 0.65;
  ctx.fillStyle = 'rgba(200,230,255,.18)';
  if (L.glasses === 'aviator') {
    for (const [x, s] of [[ex1, 1], [ex2 + 0.3, 0.85]]) {
      ctx.beginPath(); ctx.ellipse(x, ey + 0.7, 3.1 * s, 2.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(ex1 + 3, ey - 1.8); ctx.lineTo(ex2 - 2.4, ey - 1.8); ctx.stroke();
  } else if (L.glasses === 'cat') {
    for (const [x, s] of [[ex1, 1], [ex2 + 0.3, 0.85]]) {
      ctx.beginPath(); ctx.ellipse(x, ey + 0.5, 3.1 * s, 2.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, ey - 0.2, 3.1 * s, 2.0, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 1.1; ctx.stroke(); ctx.lineWidth = 0.65;
    }
    ell(ctx, ex2 + 3.3, ey - 1.6, 0.5, 0.5, '#e8f1ff');
  } else {
    for (const [x, s] of [[ex1, 1], [ex2 + 0.3, 0.85]]) {
      ctx.beginPath(); ctx.ellipse(x, ey + 0.3, 2.9 * s, 2.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
  }
  ctx.beginPath(); ctx.moveTo(ex1 + 2.9, ey); ctx.quadraticCurveTo((ex1 + ex2) / 2, ey - 1.0, ex2 - 2.3, ey); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex1 - 2.9, ey - 0.3); ctx.lineTo(-3.4, ey - 1.0); ctx.stroke();
}

function drawHairBackLong(ctx, L, hy, r, t, st) {
  const sway = Math.sin(t * 2) * 1.2 - (st.moving ? 3 : 0);
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, hy - r * 0.4);
  ctx.bezierCurveTo(-r * 1.25, hy + r * 1.2, -r * 1.3 + sway, hy + r * 2.8, -r * 0.6 + sway, hy + r * 3.3);
  ctx.lineTo(r * 0.3 + sway * 0.6, hy + r * 3.0);
  ctx.bezierCurveTo(r * 0.2, hy + r * 1.8, r * 0.6, hy + r * 0.9, r * 0.6, hy);
  ctx.closePath();
  const g = ctx.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, L.hair); g.addColorStop(1, L.hairHi);
  ctx.fillStyle = g; ctx.fill();
}
function drawHairBackBob(ctx, L, hy, r) {
  ctx.beginPath();
  ctx.moveTo(-r * 1.02, hy - r * 0.5);
  ctx.bezierCurveTo(-r * 1.2, hy + r * 0.6, -r * 1.05, hy + r * 1.35, -r * 0.5, hy + r * 1.45);
  ctx.lineTo(r * 0.2, hy + r * 1.3);
  ctx.lineTo(r * 0.2, hy);
  ctx.closePath();
  ctx.fillStyle = L.hair; ctx.fill();
}

function drawHairFront(ctx, L, hy, r, t) {
  const g = ctx.createLinearGradient(-r, hy - r, r, hy);
  g.addColorStop(0, L.hair); g.addColorStop(0.6, L.hairHi); g.addColorStop(1, L.hair);
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.5;
  const s = L.hairStyle;
  ctx.beginPath();
  if (s === 'bob') {
    // straight dark bob, side part, fringe swept to the front
    ctx.moveTo(-r * 1.05, hy + r * 1.0);
    ctx.bezierCurveTo(-r * 1.25, hy - r * 0.6, -r * 0.5, hy - r * 1.35, r * 0.3, hy - r * 1.18);
    ctx.bezierCurveTo(r * 1.05, hy - r * 1.05, r * 1.15, hy - r * 0.4, r * 1.02, hy - r * 0.05);
    ctx.bezierCurveTo(r * 0.7, hy - r * 0.6, r * 0.1, hy - r * 0.72, -r * 0.35, hy - r * 0.35);
    ctx.bezierCurveTo(-r * 0.6, hy + r * 0.1, -r * 0.55, hy + r * 0.8, -r * 0.62, hy + r * 1.25);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = hexA('#ffffff', 0.12); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-r * 0.2, hy - r * 1.05); ctx.quadraticCurveTo(r * 0.5, hy - r * 0.9, r * 0.9, hy - r * 0.3); ctx.stroke();
  } else if (s === 'long') {
    ctx.moveTo(-r * 1.0, hy + r * 0.9);
    ctx.bezierCurveTo(-r * 1.2, hy - r * 0.7, -r * 0.4, hy - r * 1.3, r * 0.35, hy - r * 1.15);
    ctx.bezierCurveTo(r * 1.0, hy - r * 1.0, r * 1.12, hy - r * 0.5, r * 1.0, hy - r * 0.1);
    ctx.bezierCurveTo(r * 0.75, hy - r * 0.65, r * 0.25, hy - r * 0.9, -r * 0.2, hy - r * 0.55);
    ctx.bezierCurveTo(-r * 0.5, hy - r * 0.1, -r * 0.5, hy + r * 0.6, -r * 0.55, hy + r * 1.0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (s === 'pixie') {
    // short spiky white/blonde
    ctx.moveTo(-r * 0.95, hy + r * 0.3);
    const spikes = [[-1.1, -0.6], [-0.85, -1.15], [-0.45, -1.25], [-0.1, -1.4], [0.25, -1.2], [0.6, -1.3], [0.85, -0.95], [1.1, -0.75], [1.0, -0.45]];
    for (const [x, y] of spikes) ctx.lineTo(r * x, hy + r * y);
    ctx.lineTo(r * 0.75, hy - r * 0.55);
    ctx.lineTo(r * 0.45, hy - r * 0.45);
    ctx.lineTo(r * 0.2, hy - r * 0.62);
    ctx.lineTo(-r * 0.1, hy - r * 0.45);
    ctx.lineTo(-r * 0.45, hy - r * 0.5);
    ctx.lineTo(-r * 0.6, hy - r * 0.1);
    ctx.lineTo(-r * 0.7, hy + r * 0.4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (s === 'shortgrey') {
    ctx.moveTo(-r * 1.0, hy + r * 0.55);
    ctx.bezierCurveTo(-r * 1.2, hy - r * 0.8, -r * 0.3, hy - r * 1.35, r * 0.4, hy - r * 1.2);
    ctx.bezierCurveTo(r * 1.1, hy - r * 1.05, r * 1.15, hy - r * 0.55, r * 0.95, hy - r * 0.35);
    ctx.bezierCurveTo(r * 0.6, hy - r * 0.75, r * 0.0, hy - r * 0.6, -r * 0.3, hy - r * 0.45);
    ctx.bezierCurveTo(-r * 0.55, hy - r * 0.1, -r * 0.55, hy + r * 0.3, -r * 0.62, hy + r * 0.65);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.6;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-r * 0.6 + i * 2.4, hy - r * 1.0); ctx.quadraticCurveTo(-r * 0.3 + i * 2.6, hy - r * 0.8, r * 0.1 + i * 2.2, hy - r * 0.55); ctx.stroke(); }
  } else if (s === 'buzz') {
    // very short grey, receding
    ctx.moveTo(-r * 0.9, hy + r * 0.25);
    ctx.bezierCurveTo(-r * 1.02, hy - r * 0.75, -r * 0.4, hy - r * 1.18, r * 0.25, hy - r * 1.1);
    ctx.bezierCurveTo(r * 0.55, hy - r * 1.05, r * 0.5, hy - r * 0.95, r * 0.15, hy - r * 0.9);
    ctx.bezierCurveTo(-r * 0.35, hy - r * 0.8, -r * 0.55, hy - r * 0.3, -r * 0.55, hy + r * 0.3);
    ctx.closePath();
    ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(90,90,90,.35)';
    for (let i = 0; i < 26; i++) { const a = (i / 26) * Math.PI * 0.9 + Math.PI * 1.05; ell(ctx, Math.cos(a) * r * 0.85 - r * 0.15, hy + Math.sin(a) * r * 0.95 - r * 0.05, 0.35, 0.35, null); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ell(ctx, r * 0.3, hy - r * 0.75, r * 0.4, r * 0.18, null, -0.2); ctx.fill();
  } else if (s === 'thinwhite') {
    // wispy white, receding with messy tufts
    ctx.moveTo(-r * 0.95, hy + r * 0.3);
    ctx.bezierCurveTo(-r * 1.15, hy - r * 0.6, -r * 0.85, hy - r * 1.0, -r * 0.4, hy - r * 1.05);
    ctx.bezierCurveTo(-r * 0.25, hy - r * 0.9, -r * 0.5, hy - r * 0.5, -r * 0.6, hy + r * 0.3);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = L.hair; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
    const wob = Math.sin(t * 3) * 0.6;
    for (let i = 0; i < 9; i++) {
      const bx = -r * 0.7 + i * r * 0.18, by = hy - r * (0.95 + Math.sin(i) * 0.08);
      ctx.beginPath(); ctx.moveTo(bx, by + 1.2); ctx.quadraticCurveTo(bx - 2 + wob, by - 1.2, bx - 4.5 + wob, by - 1.6 - (i % 3) * 0.5); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ell(ctx, r * 0.35, hy - r * 0.7, r * 0.45, r * 0.2, null, -0.2); ctx.fill();
  } else if (s === 'swept') {
    // medium brown hair swept back to the side
    ctx.moveTo(-r * 0.95, hy + r * 0.25);
    ctx.bezierCurveTo(-r * 1.2, hy - r * 0.8, -r * 0.6, hy - r * 1.45, r * 0.3, hy - r * 1.35);
    ctx.bezierCurveTo(r * 1.15, hy - r * 1.25, r * 1.25, hy - r * 0.7, r * 1.0, hy - r * 0.55);
    ctx.bezierCurveTo(r * 0.85, hy - r * 0.75, r * 0.6, hy - r * 0.8, r * 0.35, hy - r * 0.78);
    ctx.bezierCurveTo(-r * 0.1, hy - r * 0.75, -r * 0.4, hy - r * 0.45, -r * 0.55, hy - r * 0.05);
    ctx.lineTo(-r * 0.6, hy + r * 0.3);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = hexA('#ffffff', 0.18); ctx.lineWidth = 0.8;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(r * 0.9, hy - r * (0.75 + i * 0.12)); ctx.quadraticCurveTo(r * 0.2, hy - r * (1.25 + i * 0.03), -r * 0.7, hy - r * (0.6 + i * 0.12)); ctx.stroke(); }
    // grey temple
    ctx.fillStyle = 'rgba(200,200,200,.35)'; ell(ctx, -r * 0.62, hy + r * 0.05, 1.6, 3, null); ctx.fill();
  }
}

// ---------- weapons ----------
export function drawHeldWeapon(ctx, def, hx, hy, ang, atk, t) {
  const type = def.attack.type;
  ctx.save(); ctx.translate(hx, hy);
  const dirA = Math.PI / 2 - ang; // arm direction in canvas space
  if (type === 'sword') {
    ctx.rotate(-ang + Math.PI);
    ctx.fillStyle = '#7a4a22'; ctx.fillRect(-1.6, -2, 3.2, 8);
    ctx.fillStyle = '#e1b533'; ctx.fillRect(-5, -3.5, 10, 2.6);
    const g = ctx.createLinearGradient(-2, 0, 2, 0); g.addColorStop(0, '#e9eef4'); g.addColorStop(1, '#9fb0c2');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-2, -3.5); ctx.lineTo(-2, -30); ctx.lineTo(0, -34); ctx.lineTo(2, -30); ctx.lineTo(2, -3.5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-0.6, -5); ctx.lineTo(-0.6, -30); ctx.stroke();
  } else if (type === 'bottle') {
    if (atk < 0 || atk < 0.55) { ctx.rotate(-ang + Math.PI); drawBottle(ctx, 0, -6, 1); }
  } else if (type === 'mic') {
    ctx.rotate(-ang + Math.PI * 0.5);
    ctx.fillStyle = '#2b2b30'; ctx.fillRect(-1.6, -1, 3.2, 11);
    ell(ctx, 0, -2.5, 3.6, 3.6, '#9aa3ad');
    ctx.strokeStyle = '#6c7680'; ctx.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-3.4, -2.5 + i * 1.2); ctx.lineTo(3.4, -2.5 + i * 1.2); ctx.stroke(); }
  } else if (type === 'pie') {
    if (atk < 0 || atk < 0.5) { ctx.rotate(-ang + Math.PI); drawPie(ctx, 0, -4, 0.9); }
  } else if (type === 'wrench') {
    if (atk < 0 || atk < 0.5) { ctx.rotate(-ang + Math.PI); drawWrench(ctx, 0, -8, 1); }
  } else if (type === 'hammer') {
    // gewone klauwhamer: houten steel met een stalen kop dwars erop
    ctx.rotate(-ang + Math.PI); ctx.scale(1.3, 1.3);
    const wg = ctx.createLinearGradient(-2, 0, 2, 0); wg.addColorStop(0, '#a8743f'); wg.addColorStop(0.5, '#dcaa6c'); wg.addColorStop(1, '#9a6735');
    ctx.fillStyle = wg; roundRect(ctx, -1.6, -24, 3.2, 28, 1.4); ctx.fill();
    ctx.fillStyle = '#e04a3a'; roundRect(ctx, -2, -3, 4, 7, 1.6); ctx.fill();
    const mg = ctx.createLinearGradient(0, -30, 0, -23); mg.addColorStop(0, '#e2e6eb'); mg.addColorStop(1, '#7c848e');
    ctx.fillStyle = mg;
    roundRect(ctx, -3.5, -30, 10, 6.5, 1.2); ctx.fill();          // kop
    roundRect(ctx, 6, -30.8, 3.2, 8.2, 1); ctx.fill();            // slagvlak
    ctx.beginPath(); ctx.moveTo(-3.5, -29.5); ctx.quadraticCurveTo(-7.5, -29, -9.5, -32); ctx.lineTo(-8.2, -28.2); ctx.quadraticCurveTo(-6.5, -25.5, -3.5, -24.5); ctx.closePath(); ctx.fill(); // klauw
    ctx.strokeStyle = '#5c636c'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-7, -30); ctx.lineTo(-5, -26.8); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-3, -29.4, 9, 1);
  } else if (type === 'pancake') {
    if (atk < 0 || atk < 0.5) { ctx.rotate(-ang + Math.PI); drawPancake(ctx, 0, -5, 0.8, t); }
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function drawBottle(ctx, x, y, s) {
  // groene beugelfles: bolle buik, korte hals, witte porseleinen dop met rood rubbertje en een metalen beugel
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(-5, 0, 5, 0);
  g.addColorStop(0, '#1f5a12'); g.addColorStop(0.35, '#6fc23f'); g.addColorStop(0.55, '#4a9a26'); g.addColorStop(1, '#1b4f10');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-2, -12); ctx.lineTo(2, -12);              // hals
  ctx.quadraticCurveTo(2.2, -8, 4.6, -5.5);             // schouder
  ctx.lineTo(4.8, 7); ctx.quadraticCurveTo(4.8, 9, 3, 9);
  ctx.lineTo(-3, 9); ctx.quadraticCurveTo(-4.8, 9, -4.8, 7);
  ctx.lineTo(-4.6, -5.5); ctx.quadraticCurveTo(-2.2, -8, -2, -12);
  ctx.closePath(); ctx.fill();
  // ingegoten embleem op de buik
  ctx.strokeStyle = 'rgba(200,255,160,.35)'; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.ellipse(0, 2.5, 2.6, 4.2, 0, 0, Math.PI * 2); ctx.stroke();
  // groen-witte halsetiket
  ctx.fillStyle = '#0f3d22'; ctx.beginPath(); ctx.moveTo(-2.6, -10); ctx.lineTo(2.6, -10); ctx.lineTo(4, -5.8); ctx.lineTo(-4, -5.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4f1e6'; ctx.beginPath(); ctx.ellipse(0, -6.4, 3.2, 1.8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d23a2a'; ctx.fillRect(-1.8, -6.8, 3.6, 0.8);
  // rubbertje + porseleinen dop
  ctx.fillStyle = '#d6352b'; ctx.fillRect(-2.2, -12.9, 4.4, 1);
  ctx.fillStyle = '#f7f7f5'; ctx.beginPath(); ctx.ellipse(0, -14, 2.4, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c4'; ctx.lineWidth = 0.4; ctx.stroke();
  // metalen beugel
  ctx.strokeStyle = '#b9bfc6'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(-2.3, -14); ctx.lineTo(-2.9, -10.5); ctx.moveTo(2.3, -14); ctx.lineTo(2.9, -10.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-2.4, -15.2); ctx.quadraticCurveTo(0, -17, 2.4, -15.2); ctx.stroke();
  // glans
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-3.4, -4, 1, 11);
  ctx.restore();
}
export function drawPie(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(ctx, 0, 2, 10, 3.6, '#b9b9c2');
  ell(ctx, 0, 0, 9, 3.6, '#d7953e');
  ctx.fillStyle = '#e9b665';
  ctx.beginPath(); ctx.ellipse(0, -1, 8.6, 3.2, 0, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#b8752a'; ctx.lineWidth = 0.8;
  for (let i = -6; i <= 6; i += 3) { ctx.beginPath(); ctx.moveTo(i - 1.5, -3.6); ctx.lineTo(i + 1.5, 1.2); ctx.stroke(); }
  ctx.restore();
}
export function drawWrench(ctx, x, y, s, rot = 0) {
  // grote pijptang: rood handvat, zilveren haakbek met tanden en een kartelring
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  // handle
  const hg = ctx.createLinearGradient(-3, 0, 3, 0); hg.addColorStop(0, '#9e3a24'); hg.addColorStop(0.5, '#d5603f'); hg.addColorStop(1, '#8a2f1c');
  ctx.fillStyle = hg; roundRect(ctx, -2.6, -4, 5.2, 20, 2.4); ctx.fill();
  ctx.fillStyle = '#5a1e10'; ell(ctx, 0, 13.5, 1, 1.2, null); ctx.fill();
  // housing
  ctx.fillStyle = '#c4513a'; roundRect(ctx, -4.2, -10, 8.4, 8, 1.6); ctx.fill();
  ctx.fillStyle = '#e07a5c'; ell(ctx, -2.2, -6, 0.9, 0.9, null); ctx.fill();
  // knurled ring
  ctx.fillStyle = '#5c6470'; roundRect(ctx, 1, -9, 3.6, 5.5, 1); ctx.fill();
  ctx.strokeStyle = '#2f343b'; ctx.lineWidth = 0.4;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(1.2, -8.4 + k * 1.3); ctx.lineTo(4.4, -8.4 + k * 1.3); ctx.stroke(); }
  // lower jaw
  const sg = ctx.createLinearGradient(-4, 0, 4, 0); sg.addColorStop(0, '#8d949c'); sg.addColorStop(0.5, '#dfe4e8'); sg.addColorStop(1, '#7d848c');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.moveTo(-4.2, -10); ctx.lineTo(-7.5, -12); ctx.lineTo(-7.5, -14.5); ctx.lineTo(-1, -12.5); ctx.lineTo(-1, -10); ctx.closePath(); ctx.fill();
  // shaft + hook jaw
  ctx.fillRect(0.6, -21, 3, 11.5);
  ctx.beginPath(); ctx.moveTo(3.6, -21); ctx.quadraticCurveTo(4, -25, 0, -25.5); ctx.lineTo(-7.5, -24); ctx.lineTo(-8.5, -21.5); ctx.lineTo(-7.5, -19.5); ctx.lineTo(0.6, -20); ctx.closePath(); ctx.fill();
  // teeth
  ctx.fillStyle = '#aeb4ba';
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-7 + k * 1.8, -19.6); ctx.lineTo(-6.1 + k * 1.8, -18.4); ctx.lineTo(-5.2 + k * 1.8, -19.6); ctx.fill(); }
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-7 + k * 1.8, -14.4); ctx.lineTo(-6.1 + k * 1.8, -15.6); ctx.lineTo(-5.2 + k * 1.8, -14.4); ctx.fill(); }
  ctx.restore();
}
export function drawPancake(ctx, x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(ctx, 0, 1.2, 11, 4, '#b8752e');
  ell(ctx, 0, 0, 11, 4, '#e8b05a');
  ell(ctx, -2, -0.5, 4, 1.4, '#d08f3c');
  ell(ctx, 4, 0.6, 2.4, 1, '#d08f3c');
  ell(ctx, 1, -1.2, 2.6, 1.1, '#fff4c8');
  ctx.restore();
}

// ---------- the cat (Fu-Chi) ----------
function drawCat(ctx, def, st) {
  const L = def.look;
  const s = def.height / 50;
  const t = st.t || 0;
  ctx.save(); ctx.scale(s, s);
  const run = st.moving && !st.air;
  const ph = st.walk * 1.2;
  const bob = run ? Math.abs(Math.sin(ph)) * 1.5 : Math.sin(t * 2) * 0.4;
  const atk = st.atk ?? -1;
  const crouch = atk >= 0 ? Math.sin(atk * Math.PI) * 3 : 0;
  ctx.translate(0, -bob + crouch * 0.4);
  const bodyY = -21;

  // tail (fluffy, dark)
  const tailSw = Math.sin(t * 3) * 0.35 + (run ? -0.4 : 0) + (st.air ? -0.6 : 0);
  ctx.save(); ctx.translate(-22, bodyY - 2); ctx.rotate(-0.9 + tailSw);
  const tg = ctx.createLinearGradient(0, 0, 0, -30); tg.addColorStop(0, L.pointHi); tg.addColorStop(1, L.point);
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.bezierCurveTo(-9, -12, -7, -26, -1, -32); ctx.bezierCurveTo(6, -28, 7, -12, 4, 0); ctx.closePath(); ctx.fill();
  ctx.restore();

  // legs (back pair darker)
  const legW = 5.2;
  const legs = [
    { x: -15, ph: ph + Math.PI, back: true }, { x: 13, ph: ph, back: true },
    { x: -12, ph: ph, back: false }, { x: 16, ph: ph + Math.PI, back: false },
  ];
  const drawLeg = (lg) => {
    let a = run ? Math.sin(lg.ph) * 0.5 : 0;
    if (st.air) a = lg.x < 0 ? -0.8 : 0.8;
    const len = 16;
    const kx = lg.x + Math.sin(a) * len * 0.5, ky = bodyY + 6 + Math.cos(a) * len * 0.5;
    const a2 = lg.x < 0 ? a + 0.35 : a - 0.15;
    const fx = kx + Math.sin(a2) * len * 0.5, fy = Math.min(ky + Math.cos(a2) * len * 0.5, -1);
    const col = lg.back ? L.pointHi : L.point;
    limb(ctx, lg.x, bodyY + 3, kx, ky, legW + 1.6, lg.back ? L.furShade : L.fur, L.furShade);
    limb(ctx, kx, ky, fx, fy, legW, col, darken(L.point, .3));
    ell(ctx, fx + 1.2, fy + 0.4, 3.4, 2.2, col);
  };
  legs.filter((l) => l.back).forEach(drawLeg);

  // body: fluffy cream
  const bg = ctx.createRadialGradient(-2, bodyY - 8, 3, 0, bodyY, 28);
  bg.addColorStop(0, '#fffaf2'); bg.addColorStop(0.7, L.fur); bg.addColorStop(1, L.furShade);
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0, bodyY, 25, 12.5, 0, 0, Math.PI * 2); ctx.fill();
  // fluff tufts
  ctx.fillStyle = L.fur;
  for (let i = 0; i < 9; i++) { const a = Math.PI * 0.15 + i * 0.33; ell(ctx, Math.cos(a) * 22, bodyY + Math.sin(a) * 11, 4, 3, null); ctx.fill(); }
  // back shading (point colour darker on the back near tail)
  ctx.fillStyle = 'rgba(120,90,70,.18)'; ell(ctx, -10, bodyY - 6, 14, 5, null); ctx.fill();

  legs.filter((l) => !l.back).forEach(drawLeg);

  // head
  const hx = 23, hy = bodyY - 12;
  ctx.save(); ctx.translate(hx, hy);
  const tilt = run ? Math.sin(ph * 2) * 0.03 : Math.sin(t * 1.3) * 0.05;
  ctx.rotate(tilt);
  // ruff (white chest fluff)
  ctx.fillStyle = '#fff8ee';
  ctx.beginPath(); ctx.ellipse(-4, 10, 10, 9, 0.3, 0, Math.PI * 2); ctx.fill();
  // ears
  for (const [ex, er] of [[-7, -0.25], [5, 0.25]]) {
    ctx.save(); ctx.translate(ex, -8); ctx.rotate(er);
    ctx.fillStyle = L.point; ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(0, -10); ctx.lineTo(5, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a4436'; ctx.beginPath(); ctx.moveTo(-2.6, 2); ctx.lineTo(0, -6); ctx.lineTo(2.6, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // head fur
  const hg = ctx.createRadialGradient(-2, -4, 2, 0, 0, 14);
  hg.addColorStop(0, '#f6ecdf'); hg.addColorStop(1, L.furShade);
  ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(0, 0, 12.5, 11, 0, 0, Math.PI * 2); ctx.fill();
  // dark face mask (seal point)
  const mg = ctx.createRadialGradient(2, 3, 1, 1, 2, 10);
  mg.addColorStop(0, L.point); mg.addColorStop(0.65, L.pointHi); mg.addColorStop(1, 'rgba(110,74,54,0)');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(1.5, 2.5, 10, 9, 0, 0, Math.PI * 2); ctx.fill();
  // eyes blue
  const blink = Math.sin(t * 1.3) > 0.99 ? 0.15 : 1;
  for (const [ex, sc] of [[-3.2, 0.9], [5.2, 1]]) {
    ctx.save(); ctx.translate(ex, -0.5); ctx.scale(sc, blink * (st.hurt ? 0.3 : 1));
    ell(ctx, 0, 0, 2.8, 2.3, '#e9f6fb');
    ell(ctx, 0.3, 0, 2.2, 2.1, L.eye);
    ell(ctx, 0.4, 0, 0.8, 1.9, '#111');
    ell(ctx, 1.1, -0.8, 0.5, 0.5, '#fff');
    ctx.restore();
  }
  // nose + white chin
  ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.moveTo(2.2, 3.8); ctx.lineTo(4.6, 3.8); ctx.lineTo(3.4, 5.4); ctx.closePath(); ctx.fill();
  ell(ctx, 3.3, 8.2, 3.2, 2.2, '#ffffff');
  ctx.strokeStyle = '#2a1a14'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(3.4, 5.4); ctx.lineTo(3.4, 6.5); ctx.quadraticCurveTo(2, 7.4, 1.2, 6.6); ctx.moveTo(3.4, 6.5); ctx.quadraticCurveTo(4.8, 7.4, 5.6, 6.6); ctx.stroke();
  // whiskers
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.45;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath(); ctx.moveTo(6, 5 + i); ctx.quadraticCurveTo(12, 3 + i * 2.5, 17, 2 + i * 3.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 5 + i); ctx.quadraticCurveTo(-6, 3 + i * 2.5, -11, 3 + i * 3); ctx.stroke();
  }
  ctx.restore();

  // claw slash effect
  if (atk >= 0) {
    ctx.save(); ctx.translate(hx + 6, hy + 8);
    ctx.strokeStyle = `rgba(255,255,255,${1 - atk})`; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(4, 0, 16 + i * 4, -1.1 + atk * 0.6, 0.6 + atk * 0.6); ctx.stroke();
    }
    ctx.fillStyle = L.point; ell(ctx, 10 + atk * 6, 2, 4.5, 3.2, null); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Render a portrait into a canvas element
export function renderPortrait(canvas, def, opts = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || opts.w || 200, h = canvas.clientHeight || opts.h || 210;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // ground shadow
  const isCat = def.kind === 'cat';
  const scale = (opts.headOnly ? (isCat ? 3.2 : 2.6) : (isCat ? 2.3 : 1.95)) * Math.min(h / 210, (w / (isCat ? 190 : 150)));
  ctx.save();
  if (opts.headOnly) {
    ctx.translate(w * (isCat ? 0.08 : 0.5), h * (isCat ? 1.25 : 1.0) + (isCat ? 0 : def.height * scale * 0.62));
  } else {
    ctx.translate(w * (isCat ? 0.45 : 0.5), h * 0.92);
    ctx.fillStyle = 'rgba(30,60,100,.16)';
    ctx.beginPath(); ctx.ellipse(isCat ? 10 : 0, 2, isCat ? 55 : 34, 8, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.scale(scale, scale);
  drawCharacter(ctx, def, { t: opts.t || 0.4, walk: 0, moving: false, air: false, atk: -1 });
  ctx.restore();
}
