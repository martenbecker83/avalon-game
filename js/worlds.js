// Werelden, vijanden, (mini-)bazen en de levelgenerator

export const GROUND_Y = 440;
export const LEVELS_PER_WORLD = 5;

export const WORLDS = [
  {
    id: 'jungle', name: 'Oerwoud', music: 'jungle',
    blurb: 'Lianen, slangen en wilde zwijnen',
    physics: { gravity: 1900, maxFall: 950 },
    enemies: { normal: ['snake', 'parrot', 'frog'], hard: ['boar'] },
    boss: {
      kind: 'gorilla', name: 'Koning Gorrilax', flying: false, proj: 'coconut',
      attacks: ['charge', 'slam', 'throw', 'rain', 'summon'],
      minis: [
        { name: 'Gorrilax Mini', attacks: ['charge'], tint: '#e2553b' },
        { name: 'Gorrilax de Gooier', attacks: ['charge', 'throw'], tint: '#3b8fe2' },
        { name: 'Gorrilax de Springer', attacks: ['slam', 'throw'], tint: '#e2c23b' },
        { name: 'Gorrilax de Sterke', attacks: ['slam', 'charge', 'summon'], tint: '#9b3be2' },
      ],
    },
  },
  {
    id: 'clouds', name: 'Paarse Wolken', music: 'clouds',
    blurb: 'Stuiterwolken en bliksemvleermuizen',
    physics: { gravity: 1750, maxFall: 850 },
    enemies: { normal: ['cloudling', 'bat'], hard: ['stormtroll'] },
    boss: {
      kind: 'wizard', name: 'Tovenaar Donderbaard', flying: true, proj: 'bolt',
      attacks: ['shot', 'rain', 'teleport', 'summon', 'slam'],
      minis: [
        { name: 'Donderbaardje', attacks: ['shot'], tint: '#f0a5ff' },
        { name: 'Donderbaard de Flitser', attacks: ['shot', 'rain'], tint: '#7fd8ff' },
        { name: 'Donderbaard de Verdwijner', attacks: ['teleport', 'shot'], tint: '#ffe27f' },
        { name: 'Donderbaard de Storm', attacks: ['teleport', 'rain', 'summon'], tint: '#ff8f8f' },
      ],
    },
  },
  {
    id: 'water', name: 'Onderwater', music: 'water',
    blurb: 'Zwemmen tussen krabben en kwallen',
    physics: { gravity: 1050, maxFall: 330, swim: true },
    enemies: { normal: ['crab', 'jelly', 'fish'], hard: ['puffer'] },
    boss: {
      kind: 'octopus', name: 'Octavia de Octopus', flying: true, proj: 'ink',
      attacks: ['throw', 'charge', 'slam', 'shot', 'summon', 'rain'],
      minis: [
        { name: 'Kleine Octavia', attacks: ['throw'], tint: '#ff9fc0' },
        { name: 'Octavia de Spuiter', attacks: ['charge', 'throw'], tint: '#9fffd2' },
        { name: 'Octavia de Grijper', attacks: ['slam', 'shot'], tint: '#ffd59f' },
        { name: 'Octavia de Wervelwind', attacks: ['shot', 'rain', 'summon'], tint: '#b49fff' },
      ],
    },
  },
  {
    id: 'sky', name: 'Lucht', music: 'sky',
    blurb: 'Zwevende eilanden, hier kun je dubbel springen',
    physics: { gravity: 1850, maxFall: 900, doubleJump: true },
    enemies: { normal: ['wasp', 'crow'], hard: ['knight'] },
    boss: {
      kind: 'dragon', name: 'Vuurdraak Skorch', flying: true, proj: 'fire',
      attacks: ['swoop', 'shot', 'rain', 'summon', 'charge'],
      minis: [
        { name: 'Skorchje', attacks: ['swoop'], tint: '#7fd36b' },
        { name: 'Skorch de Duiker', attacks: ['shot', 'swoop'], tint: '#6bb8d3' },
        { name: 'Skorch de Vuurspuwer', attacks: ['rain', 'swoop'], tint: '#d3c36b' },
        { name: 'Skorch de Wervelstorm', attacks: ['shot', 'rain', 'summon'], tint: '#b06bd3' },
      ],
    },
  },
];

export const worldById = (id) => WORLDS.find((w) => w.id === id);

// Vijanden. hard = moeilijke vijand (2 munten)
export const ENEMY_TYPES = {
  snake:      { hp: 2, w: 46, h: 22, behavior: 'walker', speed: 55 },
  frog:       { hp: 2, w: 34, h: 28, behavior: 'hopper', speed: 140 },
  parrot:     { hp: 2, w: 38, h: 32, behavior: 'flyer', speed: 1.4, range: 90 },
  boar:       { hp: 4, w: 62, h: 42, behavior: 'charger', speed: 70, charge: 360, hard: true },
  cloudling:  { hp: 2, w: 42, h: 30, behavior: 'walker', speed: 50 },
  bat:        { hp: 2, w: 40, h: 26, behavior: 'flyer', speed: 1.8, range: 110 },
  stormtroll: { hp: 4, w: 46, h: 56, behavior: 'shooter', speed: 30, proj: 'bolt', hard: true },
  crab:       { hp: 2, w: 44, h: 26, behavior: 'walker', speed: 70 },
  jelly:      { hp: 2, w: 32, h: 40, behavior: 'floater', speed: 1.3, range: 60 },
  fish:       { hp: 2, w: 40, h: 26, behavior: 'flyer', speed: 1.1, range: 140 },
  puffer:     { hp: 4, w: 44, h: 40, behavior: 'puffer', speed: 1.0, range: 50, hard: true },
  wasp:       { hp: 2, w: 34, h: 28, behavior: 'flyer', speed: 2.0, range: 100 },
  crow:       { hp: 2, w: 42, h: 30, behavior: 'flyer', speed: 1.2, range: 150 },
  knight:     { hp: 4, w: 40, h: 58, behavior: 'charger', speed: 60, charge: 300, hard: true },
};

// De gevangen mensen (altijd dezelfde groep, in elke wereld)
export const PEOPLE = [
  { skin: '#f0c9a8', skinShade: '#d4a184', cheek: '#ee9a86', hair: '#c2732f', hairHi: '#e0964f', hairStyle: 'long', eye: '#4a6b3a', brow: '#a4612a', top: '#e8505b', topShade: '#c23a45', topStyle: 'tee', trim: '#c23a45', pants: '#3b4a6b', shoes: '#ffffff' },
  { skin: '#8d5a3b', skinShade: '#6f4329', cheek: '#b46a52', hair: '#1a1210', hairHi: '#3b2a20', hairStyle: 'buzz', eye: '#2a1a12', brow: '#1a1210', top: '#f5c33b', topShade: '#d6a51f', topStyle: 'polo', trim: '#c79414', pants: '#2b2f38', shoes: '#333', bigSmile: true },
  { skin: '#f3d1b6', skinShade: '#d8ad91', cheek: '#f0a09a', hair: '#f2d27a', hairHi: '#fff0b8', hairStyle: 'bob', eye: '#3b6fa8', brow: '#c9a447', top: '#7bc96f', topShade: '#5aa84e', topStyle: 'tee', trim: '#5aa84e', pants: '#6a4fa0', shoes: '#ff7fa8', child: true },
  { skin: '#e1b48f', skinShade: '#c2926c', cheek: '#e8957f', hair: '#3b2418', hairHi: '#6a4430', hairStyle: 'swept', eye: '#3a2a1e', brow: '#3b2418', top: '#5b8fd6', topShade: '#3f6fb3', topStyle: 'hoodie', trim: '#ffffff', pants: '#3a3f4a', shoes: '#1d1d1d', stubble: true },
  { skin: '#c8956c', skinShade: '#a6774f', cheek: '#d98a70', hair: '#efefef', hairHi: '#ffffff', hairStyle: 'shortgrey', eye: '#2a1a12', brow: '#ccc', top: '#b07bd6', topShade: '#8f5bb5', topStyle: 'cardigan', trim: '#fff', pants: '#40404a', shoes: '#704020', glasses: 'round', glassColor: '#5a3a20', wrinkles: 2 },
];

// ---------- deterministic random ----------
export function rng(seed) {
  let s = (seed * 2654435761) >>> 0;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ---------- level generator ----------
export function generateLevel(worldIdx, level) {
  const world = WORLDS[worldIdx];
  const r = rng(worldIdx * 1000 + level * 17 + 7);
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const diff = (level - 1) / 4; // 0 .. 1
  const length = 7000 + level * 1500;
  const physics = world.physics;
  const jumpH = physics.swim ? 999 : physics.doubleJump ? 230 : 135; // safe vertical reach
  const maxGap = physics.swim ? 320 : physics.doubleJump ? 300 : 175;

  const grounds = []; // {x, w, y}
  const plats = [];   // {x, y, w, kind: 'plat'|'moving'|'bounce', ...}
  const enemies = [];
  const tokenSpots = [];
  const heartSpots = [];
  const deco = [];
  const checkpoints = [];
  const cpTargets = [length * 0.34, length * 0.67];
  let id = 1;

  let x = 0, gy = GROUND_Y;
  const addGround = (w, y = gy) => { grounds.push({ x, w, y }); const g = grounds[grounds.length - 1]; x += w; return g; };
  const enemyOn = (gx, gw, gyy, forceHard = false) => {
    const hard = forceHard || r() < 0.12 + diff * 0.28;
    const list = hard ? world.enemies.hard : world.enemies.normal.filter((t) => !['parrot', 'bat', 'fish', 'wasp', 'crow', 'jelly'].includes(t));
    const type = pick(list.length ? list : world.enemies.normal);
    const def = ENEMY_TYPES[type];
    const ex = gx + 60 + r() * Math.max(10, gw - 120);
    const flying = ['flyer', 'floater', 'puffer'].includes(def.behavior);
    enemies.push({ id: id++, type, x: ex, y: flying ? gyy - 90 - r() * 60 : gyy, range: Math.min(gw / 2 - 30, 160), hard: !!def.hard });
  };
  const flyerAt = (fx, fy) => {
    const t = pick(world.enemies.normal.filter((t) => ['flyer', 'floater'].includes(ENEMY_TYPES[t].behavior)));
    if (t) enemies.push({ id: id++, type: t, x: fx, y: fy, range: 120, hard: false });
  };

  // start area
  addGround(900);
  deco.push({ kind: 'sign', x: 160, y: gy });

  let lastType = '';
  while (x < length) {
    // checkpoint: force a flat piece
    if (checkpoints.length < 2 && x > cpTargets[checkpoints.length]) {
      const g = addGround(520);
      checkpoints.push({ x: g.x + 200, y: g.y });
      lastType = 'cp';
      continue;
    }
    const options = ['run', 'run', 'gap', 'gap', 'steps', 'pit', 'hill'];
    if (level >= 2) options.push('moving', 'pit');
    if (world.id === 'clouds') options.push('bounce');
    if (level >= 3) options.push('gauntlet');
    let type = pick(options);
    if (type === lastType && type !== 'run') type = 'run';
    lastType = type;

    if (type === 'run') {
      const g = addGround(ri(450, 850));
      const n = 1 + (r() < 0.35 + diff * 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) enemyOn(g.x + (g.w / n) * i, g.w / n, g.y);
      if (r() < 0.45) { // floating platform with maybe a token
        const py = g.y - ri(100, Math.min(130, jumpH - 5));
        const p = { x: g.x + g.w / 2 - 70, y: py, w: 140, kind: 'plat' };
        plats.push(p);
        if (r() < 0.6) {
          const p2 = { x: p.x + 160, y: py - ri(80, Math.min(120, jumpH - 15)), w: 110, kind: 'plat' };
          plats.push(p2); tokenSpots.push({ x: p2.x + p2.w / 2, y: p2.y - 40 });
        } else heartSpots.push({ x: p.x + p.w / 2, y: p.y - 34 });
      }
      if (r() < 0.6) deco.push({ kind: 'bush', x: g.x + r() * g.w, y: g.y });
      if (r() < 0.5) deco.push({ kind: 'tree', x: g.x + r() * g.w, y: g.y });
    } else if (type === 'gap') {
      x += Math.min(maxGap, ri(90, 130) + Math.round(diff * 45));
      const dy = ri(-1, 1) * ri(20, 60);
      gy = Math.max(GROUND_Y - 120, Math.min(GROUND_Y + 30, gy + dy));
      const g = addGround(ri(380, 640));
      if (r() < 0.5) enemyOn(g.x, g.w, g.y);
      if (r() < 0.35) flyerAt(g.x - 60, g.y - 170);
    } else if (type === 'steps') {
      const g = addGround(ri(500, 700));
      let py = g.y;
      const n = ri(3, 4);
      for (let i = 0; i < n; i++) {
        py = Math.max(GROUND_Y - 300, py - ri(70, Math.min(100, jumpH - 20)));
        plats.push({ x: g.x + 60 + i * 150, y: py, w: 120, kind: 'plat' });
      }
      tokenSpots.push({ x: g.x + 60 + (n - 1) * 150 + 60, y: py - 42 });
      enemyOn(g.x, g.w, g.y);
    } else if (type === 'pit' || type === 'gauntlet') {
      const n = ri(2, 4);
      const startX = x;
      let px = x + 40, py = gy - ri(30, 70);
      for (let i = 0; i < n; i++) {
        plats.push({ x: px, y: py, w: ri(100, 140), kind: type === 'gauntlet' && i % 2 ? 'moving' : 'plat', mx: 0, my: 50 + diff * 30, sp: 1.2 + r() });
        if (i === n - 1 && r() < 0.5) heartSpots.push({ x: px + 60, y: py - 34 });
        px += ri(170, Math.min(230, maxGap + 40));
        py = Math.max(GROUND_Y - 240, Math.min(gy - 20, py + ri(-60, 50)));
      }
      x = px + 30;
      if (r() < 0.7) flyerAt((startX + x) / 2, gy - 220);
      if (type === 'gauntlet') tokenSpots.push({ x: (startX + x) / 2, y: gy - 260 });
      const g = addGround(ri(380, 560));
      enemyOn(g.x, g.w, g.y);
    } else if (type === 'moving') {
      const span = ri(360, 480);
      plats.push({ x: x + 40, y: gy - 30, w: 130, kind: 'moving', mx: span - 220, my: 0, sp: 0.7 + diff * 0.4 });
      x += span;
      const g = addGround(ri(400, 600));
      enemyOn(g.x, g.w, g.y, r() < 0.3);
    } else if (type === 'hill') {
      const up = ri(50, Math.min(90, jumpH - 30));
      gy -= up; const g = addGround(ri(400, 700)); enemyOn(g.x, g.w, g.y);
      gy += up + ri(-20, 30); gy = Math.min(GROUND_Y + 30, gy);
      addGround(ri(250, 400));
    } else if (type === 'bounce') {
      x += 60;
      plats.push({ x: x, y: gy - 10, w: 110, kind: 'bounce' });
      x += 300;
      tokenSpots.push({ x: x - 150, y: gy - 380 });
      const g = addGround(ri(400, 600)); enemyOn(g.x, g.w, g.y);
    }
  }
  while (checkpoints.length < 2) { const g = addGround(500); checkpoints.push({ x: g.x + 200, y: g.y }); }

  // arena
  x += 40;
  gy = GROUND_Y;
  const arena = { x, w: 1100, y: GROUND_Y };
  addGround(1100);
  addGround(800); // wall area after arena (camera end)

  // choose 3 tokens and up to 2 hearts
  shuffle(tokenSpots, r);
  const tokens = tokenSpots.slice(0, 1).map((p) => ({ id: id++, ...p })); // 1 groene token per level
  // fallback tokens if not enough spots
  while (tokens.length < 1) {
    const g = grounds[2 + Math.floor(r() * (grounds.length - 4))];
    const p = { x: g.x + g.w / 2 - 60, y: g.y - 120, w: 120, kind: 'plat' };
    plats.push(p); tokens.push({ id: id++, x: p.x + 60, y: p.y - 42 });
  }
  shuffle(heartSpots, r);
  const hearts = heartSpots.slice(0, 2).map((p) => ({ id: id++, ...p }));

  // keep enemies out of start + checkpoints + arena
  const safe = enemies.filter((e) => e.x > 700 && e.x < arena.x - 150 && !checkpoints.some((c) => Math.abs(c.x - e.x) < 180));

  return { world, worldIdx, level, length: x, grounds, plats, enemies: safe, tokens, hearts, checkpoints, arena, deco, isFinal: level === LEVELS_PER_WORLD };
}

function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

export function bossSpec(worldIdx, level) {
  const w = WORLDS[worldIdx];
  const final = level === LEVELS_PER_WORLD;
  if (final) return { ...w.boss, mini: false, level, hp: 45, scale: 1.0, speed: 1.15, tint: null, attacks: w.boss.attacks, reward: 25 };
  const m = w.boss.minis[level - 1];
  return { ...w.boss, mini: true, level, name: m.name, hp: 8 + level * 4, scale: 0.55 + level * 0.07, speed: 0.8 + level * 0.08, tint: m.tint, attacks: m.attacks, reward: 10 };
}
