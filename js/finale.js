// Slot-parade als het hele spel is uitgespeeld: alle personages, de bevrijde mensen,
// alle vijanden en alle eindbazen komen voorbij door de vier werelden, met vuurwerk.
import { CHARACTERS, drawCharacter } from './characters.js';
import { WORLDS, ENEMY_TYPES, PEOPLE } from './worlds.js';
import { drawBackground, drawGround, drawEnemy, drawBoss, BOSS_SIZE } from './art.js';

const ENEMY_NAMES = {
  snake: 'Slang', frog: 'Kikker', parrot: 'Papegaai', boar: 'Wild zwijn',
  cloudling: 'Wolkje', bat: 'Vleermuis', stormtroll: 'Stormtrol',
  crab: 'Krab', jelly: 'Kwal', fish: 'Vis', puffer: 'Kogelvis',
  wasp: 'Wesp', crow: 'Kraai', knight: 'Wolkenridder',
};
const FLYING = ['flyer', 'floater', 'puffer'];
const GROUND = 440;
const SPEED = 120;

export function createFinale(hero) {
  // volgorde: de held voorop, dan de rest van de familie, de bevrijde mensen, per wereld de vijanden en de baas
  const items = [];
  let x = 0;
  const add = (it, gap) => { it.x = x; items.push(it); x += gap; };
  add({ kind: 'title', text: 'Gefeliciteerd!', sub: 'Alle vier de werelden zijn gered' }, 520);
  add({ kind: 'char', def: hero, label: `${hero.name} · de held!`, big: true }, 230);
  CHARACTERS.filter((c) => c.id !== hero.id).forEach((c) => add({ kind: 'char', def: c, label: c.name }, 170));
  x += 120;
  add({ kind: 'title', text: 'De bevrijde mensen', sub: 'Dank je wel!' }, 380);
  PEOPLE.forEach((p, i) => add({ kind: 'person', look: p, label: '' }, 90 + (i === PEOPLE.length - 1 ? 200 : 0)));
  WORLDS.forEach((w, wi) => {
    const seen = new Set();
    add({ kind: 'title', text: w.name, sub: 'De vijanden', world: w.id }, 400);
    [...w.enemies.normal, ...w.enemies.hard].forEach((t) => { if (!seen.has(t)) { seen.add(t); add({ kind: 'enemy', type: t, label: ENEMY_NAMES[t] || t, world: w.id }, 150); } });
    x += 80;
    add({ kind: 'boss', world: w.id, worldIdx: wi, label: w.boss.name }, 420);
  });
  x += 200;
  add({ kind: 'title', text: 'Bedankt voor het spelen!', sub: 'AVALON' }, 0);
  const total = x;

  const state = { t: 0, items, total, done: false, sparks: [], nextBurst: 0.3 };

  state.update = (dt) => {
    state.t += dt;
    state.nextBurst -= dt;
    if (state.nextBurst <= 0) {
      state.nextBurst = 0.35 + Math.random() * 0.5;
      const cx = 150 + Math.random() * 700, cy = 80 + Math.random() * 180;
      const hue = Math.random() * 360;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2, v = 120 + Math.random() * 160;
        state.sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.2, color: `hsl(${hue + Math.random() * 40},95%,65%)`, rx: Math.random() });
      }
    }
    for (const s of state.sparks) { s.life -= dt; s.vy += 160 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.99; }
    state.sparks = state.sparks.filter((s) => s.life > 0);
    if (scroll() > total + 700) state.done = true;
  };

  const scroll = () => state.t * SPEED;

  state.render = (ctx, W, H) => {
    const sc = scroll();
    // de achtergrond hoort bij het stuk van de parade dat nu in beeld is
    const baseX0 = W + 80 - sc;
    let wid = 'sky';
    for (const it of items) if (it.kind === 'title' && it.world && baseX0 + it.x < W * 0.75) wid = it.world;
    drawBackground(ctx, wid, sc * 0.6, 0, W, H, state.t);
    drawGround(ctx, wid, { x: -40, w: W + 80, y: GROUND }, H + 40);

    // parade: items lopen van rechts naar links
    const baseX = W + 80 - sc;
    for (const it of items) {
      const px = baseX + it.x;
      if (px < -300 || px > W + 300) continue;
      ctx.save();
      const walk = state.t * 9 + it.x;
      if (it.kind === 'title') {
        ctx.translate(px, 0);
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.font = '800 54px "Baloo 2", sans-serif';
        ctx.lineWidth = 10; ctx.strokeStyle = '#1d6aa3'; ctx.strokeText(it.text, 0, 180);
        ctx.fillStyle = '#fff'; ctx.fillText(it.text, 0, 180);
        ctx.font = '800 26px "Baloo 2", sans-serif';
        ctx.lineWidth = 6; ctx.strokeText(it.sub, 0, 220); ctx.fillText(it.sub, 0, 220);
      } else if (it.kind === 'char') {
        const hop = Math.abs(Math.sin(walk * 0.5)) * (it.big ? 10 : 4);
        ctx.translate(px, GROUND - hop);
        shadow(ctx, it.def.kind === 'cat' ? 40 : 30);
        ctx.scale(-(it.big ? 1.6 : 1.3), it.big ? 1.6 : 1.3);
        const atk = it.big ? (Math.sin(state.t * 2) > 0.6 ? (state.t * 3) % 1 : -1) : -1;
        drawCharacter(ctx, it.def, { t: state.t + it.x, walk, moving: true, air: false, atk });
      } else if (it.kind === 'person') {
        ctx.translate(px, GROUND);
        shadow(ctx, 22);
        ctx.scale(-1.15, 1.15);
        drawCharacter(ctx, { kind: 'human', height: it.look.child ? 58 : 70, look: it.look, attack: { type: 'none' } }, { t: state.t + it.x, walk, moving: true, air: false, atk: -1, noWeapon: true });
      } else if (it.kind === 'enemy') {
        const def = ENEMY_TYPES[it.type];
        const fly = FLYING.includes(def.behavior);
        const y = fly ? GROUND - 90 + Math.sin(state.t * 3 + it.x) * 14 : GROUND;
        ctx.translate(0, 0);
        if (!fly) { ctx.save(); ctx.translate(px, GROUND); shadow(ctx, def.w * 0.5); ctx.restore(); }
        ctx.translate(0, 0);
        ctx.scale(1, 1);
        ctx.save(); ctx.translate(px, y); ctx.scale(1.35, 1.35); ctx.translate(-px, -y);
        drawEnemy(ctx, { type: it.type, x: px, y, dir: -1, id: it.x, h: def.h, w: def.w, hp: 1, maxhp: 1, flash: 0, stun: 0, onGround: true, puffed: Math.sin(state.t * 2) > 0.3 }, state.t);
        ctx.restore();
      } else if (it.kind === 'boss') {
        const w = WORLDS[it.worldIdx];
        const flying = w.boss.flying;
        const y = flying ? GROUND - 30 + Math.sin(state.t * 2) * 10 : GROUND;
        ctx.save(); ctx.translate(px, GROUND); shadow(ctx, BOSS_SIZE[w.boss.kind][0] * 0.3); ctx.restore();
        drawBoss(ctx, { kind: w.boss.kind, x: px, y, dir: -1, scale: 0.75, tint: null, flash: 0, dizzy: 0, state: 'idle', moving: true }, state.t);
      }
      ctx.restore();
      if (it.label) {
        const ly = it.kind === 'boss' ? GROUND + 34 : GROUND + 30;
        ctx.font = `800 ${it.big ? 26 : 20}px "Baloo 2", sans-serif`; ctx.textAlign = 'center';
        ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.45)';
        ctx.strokeText(it.label, px, ly); ctx.fillStyle = '#fff'; ctx.fillText(it.label, px, ly);
      }
    }

    // vuurwerk en confetti
    for (const s of state.sparks) {
      ctx.globalAlpha = Math.min(1, s.life * 1.5);
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x - 2.5, s.y - 2.5, 5, 5);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 40; i++) {
      const cx = (i * 97 + state.t * (40 + (i % 5) * 12)) % (W + 40) - 20;
      const cy = (i * 53 + state.t * (60 + (i % 7) * 10)) % (H + 40) - 20;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(state.t * 3 + i);
      ctx.fillStyle = ['#ff5a5f', '#ffd34d', '#42c94a', '#3a7be8', '#c45bd6'][i % 5];
      ctx.fillRect(-4, -2, 8, 4); ctx.restore();
    }
  };
  return state;
}

function shadow(ctx, r) {
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  ctx.beginPath(); ctx.ellipse(0, 2, r, 6, 0, 0, Math.PI * 2); ctx.fill();
}
