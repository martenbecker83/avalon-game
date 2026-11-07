// Gameplay: speler, vijanden, wapens, bazen, camera en tekenen
import { drawCharacter } from './characters.js';
import { WORLDS, ENEMY_TYPES, GROUND_Y, PEOPLE, generateLevel, bossSpec } from './worlds.js';
import {
  drawBackground, drawGround, drawPlat, drawDeco, drawToken, drawHeart, drawCoin, drawCheckpoint, drawPortal,
  drawCage, drawFreedPeople, drawEnemy, drawBoss, drawProjectile, BOSS_SIZE, DEPTH,
} from './art.js';
import { keys, consume } from './input.js';
import { sfx, playMusic } from './audio.js';

const VIEW_H = 540;
const MAX_HEARTS = 3;
const COIN_NORMAL = 1, COIN_HARD = 2, COIN_TOKEN = 5;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

export class Game {
  constructor(canvas, hooks) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks;
    this.t = 0;
    this.running = false;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.scale = (h * dpr) / VIEW_H;
    this.viewW = (w * dpr) / this.scale;
    // keep a minimum view width on portrait screens
    if (this.viewW < 620) { this.scale = (w * dpr) / 620; this.viewW = 620; }
    this.viewH = (h * dpr) / this.scale;
  }

  // ---------- setup ----------
  start({ worldIdx, level, checkpoint, coins, char, lives = 3 }) {
    this.lives = lives;
    this.worldIdx = worldIdx; this.world = WORLDS[worldIdx];
    this.char = char;
    this.level = level;
    this.coins = coins;
    this.coinsAtCp = coins;
    this.checkpoint = checkpoint; // 0 = start, 1 / 2
    this.lv = generateLevel(worldIdx, level);
    this.buildState();
    this.running = true; this.paused = false;
    playMusic(this.world.music);
    this.hooks.onBanner(`${this.world.name}`, `Level ${level}`);
    this.hud();
  }

  buildState() {
    const lv = this.lv;
    const cpX = this.checkpoint > 0 ? lv.checkpoints[this.checkpoint - 1].x : 0;
    this.enemies = lv.enemies.filter((e) => e.x > cpX + 150).map((e) => this.makeEnemy(e));
    this.tokens = lv.tokens.filter((p) => p.x > cpX).map((p) => ({ ...p, got: false }));
    this.hearts = lv.hearts.filter((p) => p.x > cpX).map((p) => ({ ...p, got: false }));
    this.plats = lv.plats.map((p) => ({ ...p, ox: p.x, oy: p.y, dx: 0, dy: 0, squash: 0 }));
    this.projectiles = []; this.hostile = []; this.particles = []; this.texts = [];
    this.boss = null; this.bossDone = false; this.portal = null; this.people = null; this.cageOpen = false;
    this.arenaLocked = false; this.phase = 'play'; this.phaseT = 0;
    this.shake = 0;
    const spawn = this.checkpoint > 0 ? lv.checkpoints[this.checkpoint - 1] : { x: 120, y: GROUND_Y };
    const d = this.char;
    this.p = {
      x: spawn.x + 30, y: spawn.y - 2, vx: 0, vy: 0, dir: 1,
      w: d.kind === 'cat' ? 44 : 28, h: d.height * (d.kind === 'cat' ? 0.95 : 0.98),
      onGround: false, coyote: 0, jumpBuf: 0, jumpsLeft: 1, swimCd: 0, cut: false,
      hearts: MAX_HEARTS, inv: 1.0, atkT: 0, atkDur: 0.25, cd: 0, walk: 0, standOn: null,
      safe: { x: spawn.x, y: spawn.y },
    };
    this.cam = { x: Math.max(0, this.p.x - this.viewW * 0.35), y: GROUND_Y - (this.viewH - 100) };
    this.hooks.onBossBar(null);
  }

  makeEnemy(spec) {
    const def = ENEMY_TYPES[spec.type];
    return {
      ...spec, def, hp: def.hp, maxhp: def.hp, w: def.w, h: def.h, home: spec.x, homeY: spec.y,
      vx: 0, vy: 0, dir: -1, t: Math.random() * 6, stun: 0, flash: 0, dead: false, onGround: false,
      windup: 0, charging: 0, cool: 1 + Math.random() * 2, aim: 0, puffed: false,
      flying: ['flyer', 'floater', 'puffer'].includes(def.behavior),
    };
  }

  hud() { this.hooks.onHud({ hearts: this.p.hearts, max: MAX_HEARTS, lives: this.lives, coins: this.coins, label: `${this.world.name} · Level ${this.level}` }); }

  addCoins(n, x, y) {
    this.coins += n;
    this.texts.push({ x, y, text: `+${n}`, life: 1, vy: -60, color: '#ffd34d' });
    for (let i = 0; i < Math.min(n, 6); i++) this.particles.push({ kind: 'coin', x, y, vx: (Math.random() - 0.5) * 220, vy: -250 - Math.random() * 200, life: 0.8, max: 0.8 });
    sfx.coin();
    this.hooks.onCoin();
    this.hud();
  }

  // ---------- world queries ----------
  solidsNear(x0, x1) {
    return this.lv.grounds.filter((g) => g.x < x1 && g.x + g.w > x0);
  }
  groundAt(x) { // top y of ground block at x, or null
    for (const g of this.lv.grounds) if (x >= g.x && x <= g.x + g.w) return g.y;
    return null;
  }

  // ---------- update ----------
  update(dt) {
    if (!this.running || this.paused) return;
    dt = Math.min(dt, 1 / 30);
    this.t += dt;
    this.phaseT += dt;
    this.updatePlats(dt);
    if (this.phase === 'play' || this.phase === 'boss' || this.phase === 'cleared') this.updatePlayer(dt);
    else if (this.phase === 'freed' || this.phase === 'freeing') this.updatePlayer(dt, true);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    this.updatePickups();
    this.updateCamera(dt);
    this.updatePhase(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
  }

  updatePlats(dt) {
    for (const p of this.plats) {
      const px = p.x, py = p.y;
      if (p.kind === 'moving') {
        const s = Math.sin(this.t * (p.sp || 1));
        p.x = p.ox + (p.mx ? (s * 0.5 + 0.5) * p.mx : 0);
        p.y = p.oy + (p.my ? s * p.my : 0);
      }
      p.dx = p.x - px; p.dy = p.y - py;
      if (p.squash > 0) p.squash = Math.max(0, p.squash - dt * 4);
    }
  }

  updatePlayer(dt, cutscene = false) {
    const p = this.p, d = this.char, ph = this.world.physics;
    const L = !cutscene && keys.left, R = !cutscene && keys.right;
    const target = (R ? 1 : 0) - (L ? 1 : 0);
    const accel = p.onGround ? 2600 : 1700;
    const maxV = d.speed;
    if (target) { p.vx += target * accel * dt; p.dir = target; }
    else { const f = p.onGround ? 2400 : 700; p.vx -= Math.sign(p.vx) * Math.min(Math.abs(p.vx), f * dt); }
    p.vx = clamp(p.vx, -maxV, maxV);

    // jumping
    if (!cutscene && consume('jump')) p.jumpBuf = 0.14;
    p.jumpBuf -= dt; p.coyote -= dt; p.swimCd -= dt;
    if (p.jumpBuf > 0) {
      if (p.onGround || p.coyote > 0) {
        p.vy = -(ph.swim ? d.jump * 0.75 : d.jump); p.onGround = false; p.coyote = 0; p.jumpBuf = 0; p.cut = false; p.standOn = null;
        p.jumpsLeft = ph.doubleJump ? 1 : 0; sfx.jump();
        this.dust(p.x, p.y, 6);
      } else if (ph.swim && p.swimCd <= 0) {
        p.vy = -d.jump * 0.5; p.swimCd = 0.26; p.jumpBuf = 0; sfx.bubble();
        this.particles.push({ kind: 'bubble', x: p.x, y: p.y - p.h * 0.5, vx: 0, vy: -60, life: 1, max: 1 });
      } else if (ph.doubleJump && p.jumpsLeft > 0) {
        p.vy = -d.jump * 0.88; p.jumpsLeft--; p.jumpBuf = 0; p.cut = false; sfx.jump();
        for (let i = 0; i < 8; i++) this.particles.push({ kind: 'cloud', x: p.x, y: p.y, vx: (Math.random() - 0.5) * 160, vy: Math.random() * 60, life: 0.5, max: 0.5 });
      }
    }
    if (!keys.jump && p.vy < -260 && !p.cut && !ph.swim) { p.vy *= 0.55; p.cut = true; }

    // attack
    p.cd -= dt;
    if (p.atkT > 0) p.atkT -= dt;
    if (!cutscene && (consume('attack') || (keys.attack && d.attack.type === 'claws')) && p.cd <= 0) this.attack();

    // gravity
    p.vy += ph.gravity * dt * (ph.swim && keys.jump ? 0.75 : 1);
    p.vy = Math.min(p.vy, ph.maxFall);

    // carried by moving platform
    if (p.standOn) { p.x += p.standOn.dx; p.y += p.standOn.dy; }

    // move X
    const prevB = p.y;
    p.x += p.vx * dt;
    const bx = () => ({ l: p.x - p.w / 2, r: p.x + p.w / 2, t: p.y - p.h, b: p.y });
    for (const g of this.solidsNear(p.x - 60, p.x + 60)) {
      const box = bx(); const gb = { l: g.x, r: g.x + g.w, t: g.y, b: 99999 };
      if (overlap(box, gb) && box.b > g.y + 6) {
        if (p.vx > 0 || p.x < g.x) p.x = g.x - p.w / 2 - 0.01; else p.x = g.x + g.w + p.w / 2 + 0.01;
        p.vx = 0;
      }
    }
    // arena walls & level bounds
    const minX = this.arenaLocked ? this.lv.arena.x + 20 : 20;
    const maxX = this.arenaLocked && !this.bossDone ? this.lv.arena.x + this.lv.arena.w - 20 : this.lv.length - 40;
    if (p.x < minX) { p.x = minX; p.vx = Math.max(0, p.vx); }
    if (p.x > maxX) { p.x = maxX; p.vx = Math.min(0, p.vx); }

    // move Y
    p.y += p.vy * dt;
    const wasGround = p.onGround;
    p.onGround = false; p.standOn = null;
    for (const g of this.solidsNear(p.x - 30, p.x + 30)) {
      const box = bx(); const gb = { l: g.x, r: g.x + g.w, t: g.y, b: 99999 };
      if (overlap(box, gb)) {
        if (p.vy >= 0 && prevB <= g.y + 12) { p.y = g.y; p.vy = 0; p.onGround = true; }
      }
    }
    if (p.vy >= 0) {
      for (const pl of this.plats) {
        const top = pl.y;
        if (p.x + p.w / 2 > pl.x && p.x - p.w / 2 < pl.x + pl.w && prevB <= top + 6 + Math.max(0, pl.dy) && p.y >= top) {
          if (pl.kind === 'bounce') {
            p.y = top; p.vy = -d.jump * 1.45; pl.squash = 1; sfx.jump(); p.cut = true; p.jumpsLeft = 1;
          } else { p.y = top; p.vy = 0; p.onGround = true; p.standOn = pl; }
        }
      }
    }
    if (p.onGround) {
      p.coyote = 0.1; p.jumpsLeft = ph.doubleJump ? 1 : 0;
      if (!wasGround && prevB < p.y - 1) this.dust(p.x, p.y, 4);
      if (!p.standOn) p.safe = { x: p.x, y: p.y };
    }
    if (ph.swim) {
      const sup = this.groundBelow(p.x, p.y) ?? GROUND_Y;
      const ceil = Math.min(sup, GROUND_Y) - 230;
      if (p.y < ceil) { p.y = ceil; p.vy = Math.max(p.vy, 40); }
    }
    if (Math.abs(p.vx) > 20 && p.onGround) p.walk += dt * Math.abs(p.vx) / 22;

    // fall in pit
    if (p.y > GROUND_Y + 320) {
      this.hurt(true);
      if (this.p.hearts > 0) {
        p.x = p.safe.x - p.dir * 10; p.y = p.safe.y - 2; p.vx = 0; p.vy = 0;
      }
    }

    if (p.inv > 0) p.inv -= dt;

    // checkpoints
    this.lv.checkpoints.forEach((c, i) => {
      if (i + 1 > this.checkpoint && p.x > c.x - 10) {
        this.checkpoint = i + 1; this.coinsAtCp = this.coins;
        sfx.checkpoint();
        this.hooks.onBanner('Checkpoint!', null, 1200);
        for (let k = 0; k < 16; k++) this.particles.push({ kind: 'spark', x: c.x + 20, y: c.y - 90, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 300, life: 0.8, max: 0.8, color: ['#42c94a', '#ffd34d', '#fff'][k % 3] });
        this.hooks.onCheckpoint({ level: this.level, checkpoint: this.checkpoint, coins: this.coins, lives: this.lives });
      }
    });

    // arena trigger
    const a = this.lv.arena;
    if (!this.arenaLocked && p.x > a.x + 140 && this.phase === 'play') this.startBoss();
    // portal
    if (this.portal && Math.abs(p.x - this.portal.x) < 40 && this.phase === 'cleared' && this.phaseT > 0.4) {
      this.phase = 'leaving'; this.phaseT = 0; sfx.portal();
    }
  }

  dust(x, y, n) {
    for (let i = 0; i < n; i++) this.particles.push({ kind: 'dust', x: x + (Math.random() - 0.5) * 20, y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * 60, life: 0.45, max: 0.45 });
  }

  hurt(fall = false) {
    const p = this.p;
    if (!fall && p.inv > 0) return;
    p.hearts--; p.inv = 1.4;
    sfx.hurt();
    this.shake = 8;
    if (!fall) { p.vy = -380; p.vx = -p.dir * 260; }
    this.hud();
    if (p.hearts <= 0) {
      this.lives--;
      this.phase = this.lives > 0 ? 'dead' : 'gameover'; this.phaseT = 0;
      if (this.lives > 0) {
        this.hooks.onBanner('Oeps!', this.lives === 1 ? 'Nog 1 leven' : `Nog ${this.lives} levens`, 1600);
        this.hooks.onLifeLost({ level: this.level, checkpoint: this.checkpoint, coins: this.coinsAtCp, lives: this.lives });
      } else this.hooks.onBanner('Game over', null, 1800);
      sfx.gameOver();
      this.hud();
    }
  }

  // ---------- attacks ----------
  attack() {
    const p = this.p, a = this.char.attack;
    p.cd = a.cd;
    const mx = p.x + p.dir * 12, my = p.y - p.h * 0.62;
    switch (a.type) {
      case 'sword':
        p.atkT = p.atkDur = 0.22; sfx.swish();
        this.melee({ l: p.x + (p.dir > 0 ? -6 : -82), r: p.x + (p.dir > 0 ? 82 : 6), t: p.y - p.h - 26, b: p.y + 6 }, a.dmg, 'sword');
        break;
      case 'claws':
        p.atkT = p.atkDur = 0.14; if (Math.random() < 0.3) sfx.meow(); else sfx.swish();
        this.melee({ l: p.x + (p.dir > 0 ? 0 : -64), r: p.x + (p.dir > 0 ? 64 : 0), t: p.y - p.h - 14, b: p.y + 4 }, a.dmg, 'claws');
        break;
      case 'hammer':
        p.atkT = p.atkDur = 0.32; sfx.swish();
        this.pendingHammer = 0.17;
        break;
      case 'mic':
        p.atkT = p.atkDur = 0.55; sfx.scream();
        this.projectiles.push({ type: 'wave', x: p.x + p.dir * 30, y: my - 4, vx: p.dir * 560, vy: 0, g: 0, life: 0.85, age: 0, dmg: a.dmg, pierce: true, dir: p.dir, w: 70, h: 110, hit: new Set() });
        break;
      case 'bottle':
        p.atkT = p.atkDur = 0.3; sfx.throw();
        this.projectiles.push({ type: 'bottle', x: mx, y: my - 10, vx: p.dir * 440 + p.vx * 0.3, vy: -470, g: 1500, life: 2.2, age: 0, dmg: a.dmg, rot: 0, spin: p.dir * 14, w: 20, h: 20, hit: new Set(), splash: true });
        break;
      case 'pie':
        p.atkT = p.atkDur = 0.3; sfx.throw();
        this.projectiles.push({ type: 'pie', x: mx, y: my, vx: p.dir * 430 + p.vx * 0.2, vy: this.aimVy(mx, my, 430, 650, -150), g: 650, life: 0.6, age: 0, dmg: a.dmg, w: 28, h: 18, hit: new Set(), stun: 1.8 });
        break;
      case 'wrench':
        p.atkT = p.atkDur = 0.24; sfx.throw();
        this.projectiles.push({ type: 'wrench', x: mx, y: my, vx: p.dir * 560, vy: this.aimVy(mx, my, 560, 150, -40), g: 150, life: 0.45, age: 0, dmg: a.dmg, rot: 0, spin: p.dir * 22, w: 22, h: 22, hit: new Set() });
        break;
      case 'pancake':
        if (this.projectiles.filter((q) => q.type === 'pancake').length >= 2) { p.cd = 0.1; return; }
        p.atkT = p.atkDur = 0.3; sfx.throw();
        this.projectiles.push({ type: 'pancake', x: mx, y: my, vx: p.dir * 560, vy: this.aimVy(mx, my, 560, 0, 0) * 0.8, g: 0, life: 1.6, age: 0, dmg: a.dmg, rot: 0, spin: 18, w: 34, h: 18, hit: new Set(), boomerang: true, dir: p.dir, back: false, pierce: true });
        break;
    }
  }

  // friendly auto-aim: throw a bit higher/lower towards the nearest target in front (handy for flying bosses)
  aimVy(sx, sy, speed, g, fallback) {
    const p = this.p;
    let best = null, bd = 1e9;
    for (const e of this.targets()) {
      const b = this.boxOf(e); const ex = (b.l + b.r) / 2, ey = (b.t + b.b) / 2;
      const dx = (ex - sx) * p.dir;
      if (dx < 20 || dx > 650) continue;
      if (Math.abs(ey - sy) < 30) continue;
      if (dx < bd) { bd = dx; best = { dx, dy: ey - sy }; }
    }
    if (!best) return fallback;
    const t = best.dx / speed;
    return clamp(best.dy / t - 0.5 * g * t, -700, 400);
  }

  targets() {
    const list = this.enemies.filter((e) => !e.dead);
    if (this.boss && !this.boss.dead && this.boss.state !== 'intro' && !(this.boss.fade !== undefined && this.boss.fade < 0.5)) list.push(this.boss);
    return list;
  }
  boxOf(e) {
    if (e.isBoss) { const [w, h] = BOSS_SIZE[e.kind]; const s = e.scale; return { l: e.x - w * s * 0.42, r: e.x + w * s * 0.42, t: e.y - h * s * 0.95, b: e.y - h * s * 0.05 }; }
    const big = e.puffed ? 1.4 : 1;
    return { l: e.x - (e.w / 2) * big, r: e.x + (e.w / 2) * big, t: e.y - e.h * big - (e.type === 'puffer' ? 0 : 0), b: e.y };
  }
  melee(box, dmg, kind) {
    for (const e of this.targets()) if (overlap(box, this.boxOf(e))) this.damage(e, dmg, { kind, fromX: this.p.x });
    // visual
    const p = this.p;
    if (kind === 'sword') this.particles.push({ kind: 'slash', x: p.x + p.dir * 30, y: p.y - p.h * 0.55, dir: p.dir, life: 0.2, max: 0.2 });
  }
  damage(e, dmg, opts = {}) {
    if (e.dead) return;
    e.hp -= dmg; e.flash = 0.12;
    if (opts.stun) e.stun = e.isBoss ? Math.min(0.6, opts.stun) : opts.stun;
    this.particles.push({ kind: 'hit', x: e.x, y: e.y - (e.isBoss ? 80 * e.scale : e.h * 0.6), life: 0.25, max: 0.25 });
    if (e.isBoss) { sfx.bossHit(); this.hooks.onBossBar(e.name, Math.max(0, e.hp / e.maxhp)); this.shake = Math.max(this.shake, 3); }
    else { sfx.hit(); e.vx = Math.sign(e.x - (opts.fromX ?? this.p.x)) * 120; if (!e.flying) e.vy = -160; }
    if (e.hp <= 0) e.isBoss ? this.killBoss(e) : this.killEnemy(e);
  }
  killEnemy(e) {
    e.dead = true; sfx.enemyDie();
    for (let i = 0; i < 10; i++) this.particles.push({ kind: 'puff', x: e.x + (Math.random() - 0.5) * e.w, y: e.y - e.h / 2 + (Math.random() - 0.5) * e.h, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160, life: 0.5, max: 0.5 });
    this.addCoins(e.hard ? COIN_HARD : COIN_NORMAL, e.x, e.y - e.h - 10);
  }

  hammerHit() {
    const p = this.p;
    sfx.thud(); this.shake = 6;
    const box = { l: p.x - 105, r: p.x + 105, t: p.y - p.h - 40, b: p.y + 20 };
    for (const e of this.targets()) {
      const b = this.boxOf(e);
      if (overlap(box, b)) this.damage(e, this.char.attack.dmg, { kind: 'hammer', fromX: p.x });
    }
    this.particles.push({ kind: 'ring', x: p.x, y: p.y, life: 0.35, max: 0.35 });
    this.dust(p.x - 40, p.y, 6); this.dust(p.x + 40, p.y, 6);
  }

  // ---------- projectiles ----------
  updateProjectiles(dt) {
    if (this.pendingHammer !== undefined && this.pendingHammer !== null) {
      this.pendingHammer -= dt;
      if (this.pendingHammer <= 0) { this.pendingHammer = null; this.hammerHit(); }
    }
    const p = this.p;
    for (const q of this.projectiles) {
      q.age += dt;
      if (q.boomerang) {
        if (!q.back && q.age > 0.3) { q.back = true; q.hit = new Set(); }
        if (q.back) {
          const dx = p.x - q.x, dy = (p.y - p.h * 0.6) - q.y; const dist = Math.hypot(dx, dy) || 1;
          q.vx += (dx / dist) * 2600 * dt; q.vy += (dy / dist) * 2600 * dt;
          const sp = Math.hypot(q.vx, q.vy); if (sp > 720) { q.vx *= 720 / sp; q.vy *= 720 / sp; }
          if (dist < 30) q.dead = true;
        }
      }
      q.vy += (q.g || 0) * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
      if (q.spin) q.rot = (q.rot || 0) + q.spin * dt;
      if (q.age > q.life) { q.dead = true; if (q.splash) this.shatter(q); }
      if (q.dead) continue;
      const box = { l: q.x - q.w / 2, r: q.x + q.w / 2, t: q.y - q.h / 2, b: q.y + q.h / 2 };
      for (const e of this.targets()) {
        if (q.hit.has(e)) continue;
        if (overlap(box, this.boxOf(e))) {
          q.hit.add(e);
          if (q.splash) { this.shatter(q); q.dead = true; break; }
          this.damage(e, q.dmg, { stun: q.stun, fromX: q.x - q.vx });
          if (q.type === 'pie') { sfx.splat(); this.splat(q.x, q.y, '#f2e2b0'); }
          if (q.type === 'wrench') sfx.clang();
          if (!q.pierce) { q.dead = true; break; }
        }
      }
      // hit ground
      if (!q.dead && q.type !== 'wave' && !q.boomerang) {
        const gy = this.groundAt(q.x);
        if (gy !== null && q.y > gy - 4) {
          q.dead = true;
          if (q.splash) this.shatter(q);
          else if (q.type === 'pie') { sfx.splat(); this.splat(q.x, gy, '#f2e2b0'); }
          else if (q.type === 'wrench') { sfx.clang(); this.dust(q.x, gy, 3); }
        }
      }
    }
    this.projectiles = this.projectiles.filter((q) => !q.dead);

    // hostile projectiles
    for (const h of this.hostile) {
      h.age += dt;
      if (h.type === 'warn') { if (h.age >= h.life) { h.dead = true; this.hostile.push(h.spawn()); } continue; }
      h.vy += (h.g || 0) * dt;
      h.x += h.vx * dt; h.y += h.vy * dt;
      if (h.spin) h.rot = (h.rot || 0) + h.spin * dt;
      if (h.age > h.life) h.dead = true;
      if (h.type !== 'shock') {
        const gy = this.groundAt(h.x);
        if (gy !== null && h.y > gy && h.vy > 0) { h.dead = true; if (h.type === 'bolt') sfx.zap(); this.dust(h.x, gy, 4); }
      }
      const pb = { l: p.x - p.w / 2 + 4, r: p.x + p.w / 2 - 4, t: p.y - p.h + 6, b: p.y };
      const hb = { l: h.x - h.w / 2, r: h.x + h.w / 2, t: h.y - h.h / 2, b: h.y + h.h / 2 };
      if (h.type === 'shock') { hb.t = h.y - 26; hb.b = h.y; }
      if (!h.dead && overlap(pb, hb) && this.phase !== 'dead') { this.hurt(); if (h.type !== 'shock') h.dead = true; }
    }
    this.hostile = this.hostile.filter((h) => !h.dead);
  }
  shatter(q) {
    sfx.glass();
    const box = { l: q.x - 60, r: q.x + 60, t: q.y - 60, b: q.y + 50 };
    for (const e of this.targets()) if (overlap(box, this.boxOf(e))) this.damage(e, q.dmg, { fromX: q.x });
    for (let i = 0; i < 14; i++) this.particles.push({ kind: 'foam', x: q.x, y: q.y, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 280, life: 0.6, max: 0.6 });
    for (let i = 0; i < 6; i++) this.particles.push({ kind: 'glass', x: q.x, y: q.y, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 200, life: 0.5, max: 0.5 });
  }
  splat(x, y, color) { for (let i = 0; i < 10; i++) this.particles.push({ kind: 'blob', x, y, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 200, life: 0.5, max: 0.5, color }); }

  // ---------- enemies ----------
  updateEnemies(dt) {
    const p = this.p, ph = this.world.physics;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.abs(e.x - p.x) > this.viewW * 1.3 && !e.summoned) continue; // sleep off-screen
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.stun > 0) { e.stun -= dt; e.vx *= 0.9; this.enemyPhysics(e, dt); continue; }
      const d = e.def; const dxp = p.x - e.x;
      switch (d.behavior) {
        case 'walker': {
          if (Math.abs(e.vx) < d.speed * 0.5) e.vx = e.dir * d.speed;
          e.vx += (e.dir * d.speed - e.vx) * Math.min(1, dt * 4);
          this.patrol(e);
          this.enemyPhysics(e, dt);
          break;
        }
        case 'hopper': {
          e.cool -= dt;
          if (e.onGround) { e.vx *= 0.8; if (e.cool <= 0) { e.dir = Math.abs(dxp) < 400 ? Math.sign(dxp) : e.dir; e.vy = -520; e.vx = e.dir * d.speed; e.cool = 1.2 + Math.random(); e.onGround = false; } }
          this.patrol(e);
          this.enemyPhysics(e, dt);
          break;
        }
        case 'charger': {
          if (e.charging > 0) {
            e.charging -= dt; e.vx = e.dir * d.charge;
            if (!this.groundAhead(e) && e.onGround) { e.charging = 0; e.vx = 0; }
          } else if (e.windup > 0) {
            e.windup -= dt; e.vx = 0; if (e.windup <= 0) e.charging = 1.1;
          } else {
            e.cool -= dt;
            e.vx = e.dir * d.speed; this.patrol(e);
            if (e.cool <= 0 && Math.abs(dxp) < 340 && Math.abs(p.y - e.y) < 80) { e.dir = Math.sign(dxp) || 1; e.windup = 0.5; e.cool = 2.2; }
          }
          this.enemyPhysics(e, dt);
          break;
        }
        case 'shooter': {
          e.dir = Math.sign(dxp) || e.dir; e.vx = 0; e.cool -= dt; e.aim = Math.max(0, e.aim - dt);
          if (e.cool <= 0 && Math.abs(dxp) < 560) {
            e.cool = 2.4 - (this.level - 1) * 0.2; e.aim = 0.4;
            const tt = 0.9; const vx = dxp / tt; const vy = ((p.y - 40) - (e.y - 50)) / tt - 0.5 * 900 * tt;
            this.hostile.push({ type: d.proj, x: e.x + e.dir * 14, y: e.y - 50, vx, vy, g: 900, life: 3, age: 0, w: 20, h: 20 });
            sfx.zap();
          }
          this.enemyPhysics(e, dt);
          break;
        }
        case 'flyer': {
          e.x = e.home + Math.sin(e.t * d.speed) * (d.range || 100);
          e.dir = Math.cos(e.t * d.speed) > 0 ? 1 : -1;
          e.y = e.homeY + Math.sin(e.t * 2.3) * 18;
          break;
        }
        case 'floater': {
          e.y = e.homeY + Math.sin(e.t * d.speed) * (d.range || 50);
          e.x = e.home + Math.sin(e.t * 0.5) * 30;
          e.dir = Math.sign(dxp) || 1;
          break;
        }
        case 'puffer': {
          e.y = e.homeY + Math.sin(e.t * d.speed) * (d.range || 40);
          e.x = e.home + Math.sin(e.t * 0.4) * 60;
          e.dir = Math.sign(dxp) || 1;
          e.puffed = Math.abs(dxp) < 160 || Math.sin(e.t * 1.3) > 0.6;
          break;
        }
      }
      // contact with player
      const pb = { l: p.x - p.w / 2 + 3, r: p.x + p.w / 2 - 3, t: p.y - p.h + 4, b: p.y };
      const eb = this.boxOf(e);
      if (overlap(pb, eb) && this.phase !== 'dead') {
        const stomp = this.p.vy > 120 && p.y - 14 < eb.t + 12 && e.type !== 'puffer';
        if (stomp) { this.p.vy = -480; this.p.cut = true; sfx.stomp(); this.damage(e, 1, { fromX: p.x }); }
        else if (e.stun <= 0) this.hurt();
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead || false);
  }
  groundAhead(e) {
    const ax = e.x + e.dir * (e.w / 2 + 6);
    const gy = this.groundAt(ax);
    if (gy !== null && Math.abs(gy - e.y) < 20) return true;
    for (const pl of this.plats) if (ax > pl.x && ax < pl.x + pl.w && Math.abs(pl.y - e.y) < 8) return true;
    return false;
  }
  patrol(e) {
    if (e.onGround && !this.groundAhead(e)) { e.dir *= -1; e.vx = e.dir * Math.abs(e.vx); }
    if (!e.summoned && Math.abs(e.x - e.home) > (e.range || 120) && Math.sign(e.x - e.home) === e.dir) { e.dir *= -1; }
    if (e.summoned && this.lv.arena) {
      const a = this.lv.arena;
      if (e.x < a.x + 30) e.dir = 1; if (e.x > a.x + a.w - 30) e.dir = -1;
    }
  }
  enemyPhysics(e, dt) {
    const ph = this.world.physics;
    const prev = e.y;
    e.vy = Math.min(e.vy + ph.gravity * dt, ph.maxFall);
    e.x += e.vx * dt; e.y += e.vy * dt;
    e.onGround = false;
    const gy = this.groundAt(e.x);
    if (gy !== null && e.y >= gy && prev <= gy + 14) { e.y = gy; e.vy = 0; e.onGround = true; }
    for (const pl of this.plats) if (e.x > pl.x && e.x < pl.x + pl.w && e.vy >= 0 && prev <= pl.y + 4 && e.y >= pl.y) { e.y = pl.y; e.vy = 0; e.onGround = true; e.x += pl.dx; }
    if (e.y > GROUND_Y + 400) e.dead = true;
  }

  // ---------- bosses ----------
  startBoss() {
    this.arenaLocked = true; this.phase = 'boss'; this.phaseT = 0;
    const spec = bossSpec(this.worldIdx, this.level);
    const a = this.lv.arena;
    const [bw, bh] = BOSS_SIZE[spec.kind];
    this.boss = {
      ...spec, isBoss: true, x: a.x + a.w - 240, y: -200, vx: 0, vy: 0, dir: -1,
      hp: spec.hp, maxhp: spec.hp, state: 'intro', timer: 1.4, flash: 0, stun: 0, dizzy: 0, attacksDone: 0,
      groundY: a.y, hoverY: a.y - (spec.flying ? 120 + 50 * spec.scale : 0), last: null, moving: false, breath: 0,
    };
    playMusic('boss');
    sfx.bossRoar();
    this.hooks.onBanner(spec.name, spec.mini ? `Mini-baas · Level ${this.level}` : 'EINDBAAS!', 1800);
    this.hooks.onBossBar(spec.name, 1);
    if (this.lv.isFinal) this.cage = { x: a.x + a.w + 220, y: a.y };
  }

  updateBoss(dt) {
    const b = this.boss; if (!b || b.dead) return;
    const p = this.p, a = this.lv.arena;
    b.flash = Math.max(0, b.flash - dt);
    b.breath = Math.max(0, b.breath - dt);
    if (b.dizzy > 0) b.dizzy -= dt;
    b.timer -= dt;
    const sp = b.speed;
    const left = a.x + 80, right = a.x + a.w - 80;
    const faceP = () => { b.dir = p.x > b.x ? 1 : -1; };
    const onGround = () => b.y >= b.groundY - 0.5;
    const gravity = (k = 1) => { b.vy += 2000 * k * dt; b.y += b.vy * dt; if (b.y >= b.groundY) { const landed = b.vy > 300; b.y = b.groundY; b.vy = 0; return landed; } return false; };
    const hover = () => { b.y += ((b.hoverY + Math.sin(this.t * 2) * 14) - b.y) * Math.min(1, dt * 3); };
    if (b.stun > 0) { b.stun -= dt; return; }

    switch (b.state) {
      case 'intro':
        if (b.flying) { b.y += (b.hoverY - b.y) * Math.min(1, dt * 2.5); }
        else gravity();
        if (b.timer <= 0) { b.state = 'idle'; b.timer = 0.8; }
        break;
      case 'idle': {
        faceP();
        b.moving = false;
        if (b.flying) { hover(); b.x += (clamp(p.x + (b.x > p.x ? 220 : -220), left, right) - b.x) * dt * 0.8; b.moving = true; }
        else { gravity(); if (Math.abs(p.x - b.x) > 200) { b.x += b.dir * 70 * sp * dt; b.moving = true; } }
        if (b.timer <= 0) this.bossChoose(b);
        break;
      }
      case 'rest': // flying bosses come down to rest: chance to hit them with melee
        b.moving = false;
        if (b.y < b.groundY) { b.vy = Math.max(b.vy, 200); gravity(0.6); }
        b.dizzy = Math.max(b.dizzy, 0.2);
        if (b.timer <= 0) { b.state = 'idle'; b.timer = 0.6; }
        break;
      case 'charge':
        if (b.sub === 'wind') {
          b.x += Math.sin(this.t * 60) * 1.5;
          if (b.timer <= 0) { b.sub = 'go'; b.timer = 2.0; sfx.bossRoar(); }
        } else {
          b.moving = true;
          b.x += b.dir * 430 * sp * dt;
          if (b.flying) b.y += ((b.groundY - 30) - b.y) * Math.min(1, dt * 4); else gravity();
          if (b.x < left - 40 || b.x > right + 40 || b.timer <= 0) {
            b.x = clamp(b.x, left - 40, right + 40);
            this.shake = 8; sfx.thud(); b.state = 'dizzy'; b.timer = 1.1; b.dizzy = 1.1; b.moving = false;
          }
        }
        break;
      case 'dizzy':
        if (!b.flying) gravity(); else b.y += ((b.groundY - 20) - b.y) * Math.min(1, dt * 3);
        if (b.timer <= 0) this.bossIdle(b);
        break;
      case 'slam':
        if (b.sub === 'up') {
          b.x += b.vx * dt; b.vy += 2000 * dt; b.y += b.vy * dt;
          if (b.vy > 0 && b.y >= b.groundY) {
            b.y = b.groundY; b.vy = 0; this.shake = 12; sfx.shock();
            for (const dir of [-1, 1]) this.hostile.push({ type: 'shock', x: b.x + dir * 50, y: b.groundY, vx: dir * 330 * sp, vy: 0, g: 0, life: 2.6, age: 0, w: 40, h: 30, color: this.worldIdx === 2 ? 'rgba(200,220,255,.8)' : undefined });
            this.dust(b.x, b.y, 14);
            b.sub = 'land'; b.timer = b.flying ? 0.9 : 0.5;
          }
        } else if (b.timer <= 0) this.bossIdle(b);
        break;
      case 'throw':
        if (!b.flying) gravity(); else hover();
        faceP();
        if (b.timer <= 0 && b.count > 0) {
          b.count--; b.timer = 0.35;
          const tt = 0.85 + Math.random() * 0.3;
          const tx = p.x + (Math.random() - 0.5) * 120;
          const sx = b.x + b.dir * 40 * b.scale, sy = b.y - 120 * b.scale;
          const vx = (tx - sx) / tt, vy = ((p.y - 20) - sy) / tt - 0.5 * 1100 * tt;
          this.hostile.push({ type: b.proj === 'bolt' ? 'bolt' : b.proj, x: sx, y: sy, vx, vy, g: 1100, life: 3, age: 0, w: 22, h: 22, spin: 8 });
          sfx.throw();
        } else if (b.timer <= 0) this.bossIdle(b);
        break;
      case 'shot':
        faceP(); if (b.flying) hover(); else gravity();
        if (b.timer <= 0 && b.count > 0) {
          b.count--; b.timer = 0.3; b.breath = 0.2;
          const sx = b.x + b.dir * 70 * b.scale, sy = b.y - (b.kind === 'dragon' ? 104 : 100) * b.scale;
          const ang = Math.atan2((p.y - p.h * 0.5) - sy, p.x - sx);
          const v = 380 + 40 * this.level;
          const type = b.proj === 'coconut' ? 'coconut' : b.proj;
          this.hostile.push({ type, x: sx, y: sy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, g: 0, life: 3, age: 0, w: 22, h: 20 });
          if (b.proj === 'fire') sfx.fire(); else if (b.proj === 'bolt') sfx.zap(); else sfx.bubble();
        } else if (b.timer <= 0) this.bossIdle(b);
        break;
      case 'rain':
        if (b.flying) hover(); else gravity();
        if (b.timer <= 0 && b.count > 0) {
          b.count--; b.timer = 0.22;
          const rx = Math.random() < 0.4 ? p.x + (Math.random() - 0.5) * 60 : left + Math.random() * (right - left);
          const type = { coconut: 'coconut', bolt: 'bolt', ink: 'bubble', fire: 'fire' }[b.proj];
          const top = this.cam.y - 40;
          this.hostile.push({ type: 'warn', x: rx, y: this.groundAt(rx) ?? GROUND_Y, life: 0.7, age: 0, spawn: () => ({ type, x: rx, y: top, vx: 0, vy: 260, g: 900, life: 3, age: 0, w: 24, h: 24, spin: 5 }) });
        } else if (b.timer <= 0) this.bossIdle(b);
        break;
      case 'summon':
        if (b.flying) hover(); else gravity();
        if (b.timer <= 0) {
          const alive = this.enemies.filter((e) => e.summoned && !e.dead).length;
          const types = this.world.enemies.normal;
          for (let i = 0; i < Math.min(2, 3 - alive); i++) {
            const t = types[i % types.length];
            const ex = i ? left + 20 : right - 20;
            const def = ENEMY_TYPES[t];
            const flying = ['flyer', 'floater', 'puffer'].includes(def.behavior);
            const e = this.makeEnemy({ id: 9000 + Math.floor(Math.random() * 1e6), type: t, x: ex, y: flying ? GROUND_Y - 140 : GROUND_Y - 200, range: 200, hard: false });
            e.summoned = true; e.home = ex; this.enemies.push(e);
            for (let k = 0; k < 8; k++) this.particles.push({ kind: 'spark', x: ex, y: GROUND_Y - 60, vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 200, life: 0.5, max: 0.5, color: '#fff' });
          }
          this.bossIdle(b);
        }
        break;
      case 'teleport':
        if (b.sub === 'out') {
          b.fade = Math.max(0, (b.fade ?? 1) - dt * 3);
          if (b.fade <= 0) { b.x = p.x < (left + right) / 2 ? right - 60 : left + 60; b.sub = 'in'; sfx.zap(); }
        } else {
          b.fade = Math.min(1, b.fade + dt * 3); hover();
          if (b.fade >= 1) { b.fade = undefined; b.state = 'shot'; b.count = 2 + Math.floor(this.level / 2); b.timer = 0.3; }
        }
        break;
      case 'swoop':
        if (b.sub === 'rise') {
          b.y += ((b.groundY - 330) - b.y) * Math.min(1, dt * 4);
          b.x += ((b.dir > 0 ? left : right) - b.x) * Math.min(1, dt * 2);
          if (b.timer <= 0) { b.sub = 'dive'; b.timer = 1.6; faceP(); b.tx = p.x; sfx.fire(); }
        } else {
          b.moving = true;
          b.x += b.dir * 480 * sp * dt;
          const k = clamp(1 - Math.abs(b.x - b.tx) / 360, 0, 1);
          b.y += (((b.groundY - 330) + (300 - 30 * b.scale) * k) - b.y) * Math.min(1, dt * 6);
          if (b.timer <= 0 || b.x < left - 30 || b.x > right + 30) { b.x = clamp(b.x, left - 30, right + 30); this.bossIdle(b); }
        }
        break;
    }
    b.x = clamp(b.x, left - 60, right + 60);

    // contact damage
    const pb = { l: p.x - p.w / 2 + 4, r: p.x + p.w / 2 - 4, t: p.y - p.h + 6, b: p.y };
    if (overlap(pb, this.boxOf(b)) && b.state !== 'intro' && !(b.fade !== undefined && b.fade < 0.5)) {
      const bb = this.boxOf(b);
      if (p.vy > 150 && p.y - 20 < bb.t + 20) { p.vy = -560; sfx.stomp(); this.damage(b, 1, {}); }
      else this.hurt();
    }
  }
  bossChoose(b) {
    let opts = b.attacks.filter((x) => x !== b.last || b.attacks.length === 1);
    const atk = opts[Math.floor(Math.random() * opts.length)];
    b.last = atk; b.state = atk; b.sub = null; b.attacksDone++;
    const lvl = this.level;
    if (b.flying && b.attacksDone % 3 === 0 && atk !== 'charge') { b.state = 'rest'; b.timer = 1.8; b.vy = 0; return; }
    switch (atk) {
      case 'charge': b.sub = 'wind'; b.timer = 0.55; b.dir = this.p.x > b.x ? 1 : -1; break;
      case 'slam': {
        b.sub = 'up'; const tt = 0.85; b.vx = clamp((this.p.x - b.x) / tt, -500, 500); b.vy = b.flying ? -300 : -850;
        if (b.flying) { b.vy = 400; b.y = Math.min(b.y, b.groundY - 1); }
        break;
      }
      case 'throw': b.count = b.mini ? Math.min(3, lvl) : 4; b.timer = 0.3; break;
      case 'shot': b.count = b.mini ? 1 + Math.ceil(lvl / 2) : 4; b.timer = 0.4; break;
      case 'rain': b.count = b.mini ? 3 + lvl : 9; b.timer = 0.3; break;
      case 'summon': b.timer = 0.6; sfx.bossRoar(); break;
      case 'teleport': b.sub = 'out'; b.fade = 1; break;
      case 'swoop': b.sub = 'rise'; b.timer = 1.0; break;
    }
  }
  bossIdle(b) { b.state = 'idle'; b.timer = Math.max(0.5, (b.mini ? 1.7 - this.level * 0.15 : 1.1)); b.sub = null; b.moving = false; }
  killBoss(b) {
    b.dead = true; this.bossDone = true;
    sfx.bossRoar(); this.shake = 14;
    for (let i = 0; i < 40; i++) this.particles.push({ kind: 'spark', x: b.x + (Math.random() - 0.5) * 120 * b.scale, y: b.y - Math.random() * 150 * b.scale, vx: (Math.random() - 0.5) * 500, vy: -Math.random() * 500, life: 1, max: 1, color: ['#ffd34d', '#fff', '#ff5a5f', '#42c94a'][i % 4] });
    for (const e of this.enemies) if (e.summoned) e.dead = true;
    this.hostile = [];
    this.hooks.onBossBar(null);
    this.addCoins(b.reward, b.x, b.y - 140 * b.scale);
    this.phaseT = 0;
    if (this.lv.isFinal) {
      this.phase = 'freeing';
      this.hooks.onBanner(`${b.name} verslagen!`, null, 1800);
    } else {
      this.phase = 'cleared';
      this.portal = { x: this.lv.arena.x + this.lv.arena.w - 90, y: this.lv.arena.y };
      sfx.levelUp();
      this.hooks.onBanner('Level gehaald!', 'Loop naar het portaal', 2200);
      playMusic(this.world.music);
    }
  }

  updatePhase(dt) {
    if (this.phase === 'gameover' && this.phaseT > 1.8) {
      this.phase = 'done'; this.running = false;
      this.hooks.onGameOver({ coins: this.coins, level: this.level });
    }
    if (this.phase === 'dead' && this.phaseT > 1.6) {
      // respawn at checkpoint
      this.coins = this.coinsAtCp;
      this.buildState();
      this.hud();
      playMusic(this.world.music);
    }
    if (this.phase === 'leaving' && this.phaseT > 0.7) {
      this.phase = 'done'; this.running = false;
      this.hooks.onLevelComplete({ level: this.level, coins: this.coins, lives: this.lives });
    }
    if (this.phase === 'freeing' && this.phaseT > 1.8 && !this.cageOpen) {
      this.cageOpen = true; this.phase = 'freed'; this.phaseT = 0;
      sfx.victory();
      const c = this.cage;
      const texts = ['Dank je!', 'Hoera!', 'Vrij!', 'Held!', 'Joepie!'];
      this.people = PEOPLE.map((look, i) => ({ look, i, x: c.x - 90 + i * 42, y: c.y, groundY: c.y, vx: -(80 + i * 30), vy: -200 - i * 40, dir: -1, cheer: 0, text: texts[i] }));
      for (let i = 0; i < 30; i++) this.particles.push({ kind: 'spark', x: c.x, y: c.y - 80, vx: (Math.random() - 0.5) * 500, vy: -Math.random() * 400, life: 1.2, max: 1.2, color: ['#ffd34d', '#fff', '#42c94a'][i % 3] });
      this.hooks.onBanner('De mensen zijn bevrijd!', `${this.world.name} uitgespeeld`, 3500);
      this.arenaLocked = false;
    }
    if (this.people) {
      for (const pp of this.people) {
        pp.vy += 1600 * dt; pp.x += pp.vx * dt; pp.y += pp.vy * dt;
        if (pp.y >= pp.groundY) { pp.y = pp.groundY; pp.vy = 0; pp.cheer += dt; if (Math.random() < dt * 1.6) pp.vy = -380; }
        const targetX = this.p.x + 60 + pp.i * 40;
        pp.vx += ((targetX - pp.x) * 2 - pp.vx) * dt * 2;
        pp.dir = pp.vx >= 0 ? 1 : -1;
        if (Math.abs(targetX - pp.x) < 30) pp.dir = this.p.x > pp.x ? 1 : -1;
      }
    }
    if (this.phase === 'freed' && this.phaseT > 5.5) {
      this.phase = 'done'; this.running = false;
      this.hooks.onWorldComplete({ coins: this.coins });
    }
  }

  // ---------- pickups ----------
  updatePickups() {
    const p = this.p;
    const pb = { l: p.x - p.w / 2 - 6, r: p.x + p.w / 2 + 6, t: p.y - p.h - 6, b: p.y + 4 };
    for (const tk of this.tokens) {
      if (tk.got) continue;
      if (overlap(pb, { l: tk.x - 20, r: tk.x + 20, t: tk.y - 20, b: tk.y + 20 })) {
        tk.got = true; sfx.token(); this.addCoins(COIN_TOKEN, tk.x, tk.y - 20);
        for (let i = 0; i < 18; i++) this.particles.push({ kind: 'spark', x: tk.x, y: tk.y, vx: (Math.random() - 0.5) * 400, vy: (Math.random() - 0.5) * 400, life: 0.6, max: 0.6, color: i % 2 ? '#7aff6a' : '#fff' });
      }
    }
    for (const h of this.hearts) {
      if (h.got) continue;
      if (overlap(pb, { l: h.x - 16, r: h.x + 16, t: h.y - 16, b: h.y + 16 })) {
        if (p.hearts >= MAX_HEARTS) continue;
        h.got = true; p.hearts = Math.min(MAX_HEARTS, p.hearts + 1); sfx.heart(); this.hud();
        this.texts.push({ x: h.x, y: h.y - 20, text: '+♥', life: 1, vy: -60, color: '#ff5a7a' });
      }
    }
  }

  updateParticles(dt) {
    for (const q of this.particles) {
      q.life -= dt;
      if (q.kind === 'coin' || q.kind === 'glass' || q.kind === 'foam' || q.kind === 'blob' || q.kind === 'spark') q.vy += 900 * dt;
      if (q.kind === 'bubble') q.vx = Math.sin(q.life * 10) * 30;
      q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt;
    }
    this.particles = this.particles.filter((q) => q.life > 0);
    for (const tx of this.texts) { tx.life -= dt; tx.y += tx.vy * dt; }
    this.texts = this.texts.filter((tx) => tx.life > 0);
  }

  updateCamera(dt) {
    const p = this.p, c = this.cam;
    let tx = p.x - this.viewW * 0.38 + p.dir * 40;
    const a = this.lv.arena;
    if (this.arenaLocked && !this.bossDone) {
      tx = a.x + a.w / 2 - this.viewW / 2;
      if (this.viewW < a.w) tx = clamp(p.x - this.viewW / 2, a.x - 20, a.x + a.w - this.viewW + 20);
    }
    tx = clamp(tx, 0, this.lv.length - this.viewW);
    c.x += (tx - c.x) * Math.min(1, dt * 6);
    // vertical: ground sits near the bottom of the screen; follow the player up on high jumps
    const base = GROUND_Y - (this.viewH - 100);
    const ty = Math.min(base, p.y - p.h - this.viewH * 0.3);
    c.y += (clamp(ty, base - 380, base + 40) - c.y) * Math.min(1, dt * 4);
  }

  // ---------- render ----------
  render() {
    const ctx = this.ctx;
    if (!this.lv) return;
    const s = this.scale;
    const W = this.viewW, H = this.viewH;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const wid = this.world.id;
    drawBackground(ctx, wid, this.cam.x, this.cam.y, W, H, this.t);

    const sx = this.shake ? (Math.random() - 0.5) * this.shake : 0, sy = this.shake ? (Math.random() - 0.5) * this.shake : 0;
    ctx.save();
    ctx.translate(-Math.round(this.cam.x) + sx, -Math.round(this.cam.y) + sy);
    const x0 = this.cam.x - 100, x1 = this.cam.x + W + 100;
    const bottom = this.cam.y + H;

    for (const d of this.lv.deco) if (d.x > x0 - 100 && d.x < x1 + 100) drawDeco(ctx, wid, d, this.t);
    for (const g of this.lv.grounds) if (g.x < x1 && g.x + g.w > x0) drawGround(ctx, wid, g, bottom);
    for (const pl of this.plats) if (pl.x < x1 && pl.x + pl.w > x0) drawPlat(ctx, wid, pl, this.t);
    this.lv.checkpoints.forEach((c, i) => { if (c.x > x0 && c.x < x1) drawCheckpoint(ctx, c.x, c.y, this.checkpoint > i, this.t); });

    if (this.lv.isFinal) {
      const a = this.lv.arena;
      const cx = this.cage ? this.cage.x : a.x + a.w + 220;
      if (cx > x0 - 200 && cx < x1 + 200) drawCage(ctx, cx, a.y, this.cageOpen, this.t);
    }
    if (this.arenaLocked && !this.bossDone) this.drawArenaWalls(ctx);

    for (const tk of this.tokens) if (!tk.got && tk.x > x0 && tk.x < x1) drawToken(ctx, tk.x, tk.y, this.t);
    for (const h of this.hearts) if (!h.got && h.x > x0 && h.x < x1) drawHeart(ctx, h.x, h.y, this.t);
    if (this.portal) drawPortal(ctx, this.portal.x, this.portal.y, this.t);

    // shadows
    const shadow = (x, y, r) => { const gy = this.groundBelow(x, y); if (gy === null) return; const k = clamp(1 - (gy - y) / 260, 0.2, 1); ctx.fillStyle = `rgba(0,0,0,${0.18 * k})`; ctx.beginPath(); ctx.ellipse(x, gy, r * k, 5 * k, 0, 0, Math.PI * 2); ctx.fill(); };
    for (const e of this.enemies) if (!e.dead && e.x > x0 && e.x < x1) shadow(e.x, e.y, e.w * 0.5);
    if (this.boss && !this.boss.dead) shadow(this.boss.x, this.boss.y, BOSS_SIZE[this.boss.kind][0] * 0.4 * this.boss.scale);
    shadow(this.p.x, this.p.y, this.p.w * 0.7);

    for (const e of this.enemies) if (!e.dead && e.x > x0 && e.x < x1) drawEnemy(ctx, e, this.t);
    if (this.boss && !this.boss.dead) drawBoss(ctx, this.boss, this.t);
    if (this.people) drawFreedPeople(ctx, this.people, this.t);

    this.drawPlayer(ctx);

    for (const q of this.projectiles) drawProjectile(ctx, q, this.t);
    for (const h of this.hostile) drawProjectile(ctx, h, this.t);
    this.drawParticles(ctx);

    ctx.restore();

    // fade when leaving through portal
    if (this.phase === 'leaving') { ctx.fillStyle = `rgba(255,255,255,${Math.min(1, this.phaseT / 0.7)})`; ctx.fillRect(0, 0, W, H); }
    if (this.phase === 'dead' || this.phase === 'gameover') { ctx.fillStyle = `rgba(20,30,60,${Math.min(0.5, this.phaseT / 1.6)})`; ctx.fillRect(0, 0, W, H); }
  }

  groundBelow(x, y) {
    let best = null;
    const g = this.groundAt(x); if (g !== null && g >= y - 2) best = g;
    for (const pl of this.plats) if (x > pl.x && x < pl.x + pl.w && pl.y >= y - 2 && (best === null || pl.y < best)) best = pl.y;
    return best;
  }

  drawArenaWalls(ctx) {
    const a = this.lv.arena;
    for (const wx of [a.x, a.x + a.w]) {
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(wx - 6, a.y - 600, 12, 600);
      ctx.fillStyle = 'rgba(255,90,95,.5)';
      for (let y = a.y - 580; y < a.y; y += 40) ctx.fillRect(wx - 6, y + ((this.t * 60) % 40), 12, 18);
    }
  }

  drawPlayer(ctx) {
    const p = this.p;
    if (p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0 && this.phase !== 'dead' && this.phase !== 'gameover') return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.dir, 1);
    const atk = p.atkT > 0 ? 1 - p.atkT / p.atkDur : -1;
    drawCharacter(ctx, this.char, {
      t: this.t, walk: p.walk, moving: Math.abs(p.vx) > 20, air: !p.onGround, vy: p.vy, atk,
      hurt: p.inv > 1.1 || this.phase === 'dead' || this.phase === 'gameover', mic: this.char.attack.type === 'mic' && atk >= 0,
    });
    ctx.restore();
  }

  drawParticles(ctx) {
    for (const q of this.particles) {
      const k = q.life / q.max;
      ctx.globalAlpha = Math.min(1, k * 1.5);
      switch (q.kind) {
        case 'dust': ctx.fillStyle = this.world.id === 'water' ? 'rgba(240,220,170,.8)' : 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(q.x, q.y, 4 + (1 - k) * 6, 0, Math.PI * 2); ctx.fill(); break;
        case 'cloud': ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 6 + (1 - k) * 6, 0, Math.PI * 2); ctx.fill(); break;
        case 'puff': ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 7 + (1 - k) * 9, 0, Math.PI * 2); ctx.fill(); break;
        case 'coin': drawCoin(ctx, q.x, q.y, this.t, 0.8); break;
        case 'spark': ctx.fillStyle = q.color; ctx.fillRect(q.x - 3, q.y - 3, 6, 6); break;
        case 'foam': ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(q.x, q.y, 5 * k + 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'glass': ctx.fillStyle = '#7ed36a'; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); break;
        case 'blob': ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, 5 * k + 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'bubble': ctx.strokeStyle = 'rgba(230,250,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, 5, 0, Math.PI * 2); ctx.stroke(); break;
        case 'hit': ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const r1 = 6 + (1 - k) * 10, r2 = 16 + (1 - k) * 18; ctx.moveTo(q.x + Math.cos(a) * r1, q.y + Math.sin(a) * r1); ctx.lineTo(q.x + Math.cos(a) * r2, q.y + Math.sin(a) * r2); } ctx.stroke(); break;
        case 'ring': ctx.strokeStyle = 'rgba(255,230,150,.9)'; ctx.lineWidth = 8 * k; ctx.beginPath(); ctx.ellipse(q.x, q.y - 4, 30 + (1 - k) * 80, 10 + (1 - k) * 18, 0, 0, Math.PI * 2); ctx.stroke(); break;
        case 'slash': ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 6 * k + 1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(q.x - q.dir * 20, q.y, 48, q.dir > 0 ? -1.3 : Math.PI - 0.2, q.dir > 0 ? 0.2 : Math.PI + 1.3); ctx.stroke(); break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.font = '800 22px "Baloo 2", sans-serif';
    for (const tx of this.texts) {
      ctx.globalAlpha = Math.min(1, tx.life * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.strokeText(tx.text, tx.x, tx.y);
      ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
  }
}
