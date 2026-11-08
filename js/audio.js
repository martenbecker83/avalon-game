// Muziek en geluidseffecten, volledig gesynthetiseerd met WebAudio (geen bestanden nodig)
let ac = null, master = null, musicGain = null, sfxGain = null;
let musicOn = true, sfxOn = true;
let music = null;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  musicGain = ac.createGain(); musicGain.gain.value = musicOn ? 0.32 : 0; musicGain.connect(master);
  sfxGain = ac.createGain(); sfxGain.gain.value = sfxOn ? 0.7 : 0; sfxGain.connect(master);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) ac.suspend?.(); else ac.resume?.();
});
export function setMusic(on) {
  musicOn = on;
  if (musicGain) musicGain.gain.setTargetAtTime(on ? 0.32 : 0, ac.currentTime, 0.05);
}
export function setSfx(on) {
  sfxOn = on;
  if (sfxGain) sfxGain.gain.setTargetAtTime(on ? 0.7 : 0, ac.currentTime, 0.05);
}

function noiseBuffer() {
  if (noiseBuffer.buf) return noiseBuffer.buf;
  const len = ac.sampleRate * 1;
  const b = ac.createBuffer(1, len, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return (noiseBuffer.buf = b);
}

function tone({ f = 440, f2 = null, type = 'square', dur = 0.15, vol = 0.3, at = 0, attack = 0.005, dest = sfxGain, curve = 'exp' }) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) {
    if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    else o.frequency.linearRampToValueAtTime(f2, t + dur);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest);
  o.start(t); o.stop(t + dur + 0.05);
}
function noise({ dur = 0.2, vol = 0.3, at = 0, freq = 1200, q = 1, type = 'bandpass', f2 = null, dest = sfxGain }) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const src = ac.createBufferSource(); src.buffer = noiseBuffer();
  const flt = ac.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(freq, t); flt.Q.value = q;
  if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(flt); flt.connect(g); g.connect(dest);
  src.start(t); src.stop(t + dur + 0.05);
}

export const sfx = {
  jump() { tone({ f: 320, f2: 640, type: 'square', dur: 0.14, vol: 0.12 }); },
  coin() { tone({ f: 988, type: 'square', dur: 0.08, vol: 0.12 }); tone({ f: 1319, type: 'square', dur: 0.22, vol: 0.12, at: 0.07 }); },
  token() { [784, 988, 1175, 1568].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.18, vol: 0.2, at: i * 0.07 })); },
  heartsFull() { [523, 659, 784, 1047, 1319].forEach((f, i) => { tone({ f, type: 'triangle', dur: 0.22, vol: 0.18, at: i * 0.07 }); tone({ f: f * 2, type: 'sine', dur: 0.15, vol: 0.05, at: i * 0.07 }); }); },
  heart() { [523, 659, 784].forEach((f, i) => tone({ f, type: 'sine', dur: 0.2, vol: 0.22, at: i * 0.08 })); },
  hit() { noise({ dur: 0.1, vol: 0.35, freq: 900, q: 0.8 }); tone({ f: 200, f2: 90, type: 'square', dur: 0.1, vol: 0.15 }); },
  enemyDie() { tone({ f: 600, f2: 120, type: 'sawtooth', dur: 0.25, vol: 0.12 }); noise({ dur: 0.15, vol: 0.2, freq: 2000 }); },
  hurt() { tone({ f: 420, f2: 110, type: 'sawtooth', dur: 0.35, vol: 0.18 }); },
  checkpoint() { [523, 784, 1047].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.25, vol: 0.2, at: i * 0.1 })); },
  swish() { noise({ dur: 0.12, vol: 0.25, freq: 2500, f2: 700, q: 1.2 }); },
  throw() { noise({ dur: 0.16, vol: 0.18, freq: 1200, f2: 400, q: 1 }); },
  glass() { [2600, 3300, 2100].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.12, vol: 0.08, at: i * 0.03 })); noise({ dur: 0.2, vol: 0.12, freq: 5000, type: 'highpass' }); },
  splat() { noise({ dur: 0.18, vol: 0.35, freq: 400, f2: 150, type: 'lowpass' }); },
  clang() { tone({ f: 1800, type: 'square', dur: 0.08, vol: 0.07 }); tone({ f: 2700, type: 'triangle', dur: 0.2, vol: 0.06 }); },
  thud() { tone({ f: 140, f2: 40, type: 'sine', dur: 0.3, vol: 0.5 }); noise({ dur: 0.2, vol: 0.3, freq: 300, type: 'lowpass' }); },
  meow() { tone({ f: 700, f2: 1100, type: 'sawtooth', dur: 0.09, vol: 0.05, curve: 'lin' }); tone({ f: 1100, f2: 600, type: 'sawtooth', dur: 0.14, vol: 0.05, at: 0.08, curve: 'lin' }); },
  scream() {
    // Mama's schreeuw in de microfoon: vervormde zaagtand met vibrato
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(880, t + 0.12); o.frequency.linearRampToValueAtTime(760, t + 0.55);
    const lfo = ac.createOscillator(); lfo.frequency.value = 9; const lg = ac.createGain(); lg.gain.value = 30; lfo.connect(lg); lg.connect(o.frequency);
    const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 900; f1.Q.value = 3;
    const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1400; f2.Q.value = 4;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(sfxGain);
    o.start(t); lfo.start(t); o.stop(t + 0.65); lfo.stop(t + 0.65);
    noise({ dur: 0.5, vol: 0.12, freq: 3000, q: 0.7 });
  },
  bossHit() { tone({ f: 160, f2: 70, type: 'square', dur: 0.18, vol: 0.22 }); noise({ dur: 0.12, vol: 0.3, freq: 600 }); },
  bossRoar() { tone({ f: 110, f2: 60, type: 'sawtooth', dur: 0.8, vol: 0.25, curve: 'lin' }); noise({ dur: 0.8, vol: 0.2, freq: 300, type: 'lowpass' }); },
  stomp() { tone({ f: 260, f2: 90, type: 'square', dur: 0.12, vol: 0.15 }); },
  shock() { tone({ f: 90, f2: 50, type: 'sawtooth', dur: 0.4, vol: 0.25 }); },
  zap() { noise({ dur: 0.25, vol: 0.25, freq: 3000, f2: 800, q: 2 }); tone({ f: 1500, f2: 300, type: 'square', dur: 0.2, vol: 0.06 }); },
  fire() { noise({ dur: 0.35, vol: 0.25, freq: 800, f2: 300, type: 'lowpass' }); },
  bubble() { tone({ f: 400, f2: 1200, type: 'sine', dur: 0.12, vol: 0.12 }); },
  levelUp() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ f, type: 'square', dur: 0.16, vol: 0.11, at: i * 0.11 })); },
  victory() {
    const seq = [523, 523, 523, 659, 784, 659, 784, 1047];
    const durs = [0.12, 0.12, 0.12, 0.3, 0.3, 0.15, 0.15, 0.7];
    let at = 0; seq.forEach((f, i) => { tone({ f, type: 'square', dur: durs[i], vol: 0.12, at }); tone({ f: f / 2, type: 'triangle', dur: durs[i], vol: 0.15, at }); at += durs[i] * 0.95; });
  },
  gameOver() { [392, 330, 262, 196].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.3, vol: 0.2, at: i * 0.22 })); },
  click() { tone({ f: 660, type: 'triangle', dur: 0.06, vol: 0.12 }); },
  portal() { tone({ f: 300, f2: 1200, type: 'sine', dur: 0.6, vol: 0.2 }); },
  chalk() { noise({ dur: 0.08, vol: 0.2, freq: 3200, q: 2 }); tone({ f: 1400, f2: 900, type: 'triangle', dur: 0.05, vol: 0.06 }); },
  chalkHit() { noise({ dur: 0.12, vol: 0.25, freq: 2000, q: 0.8 }); tone({ f: 2400, type: 'triangle', dur: 0.04, vol: 0.06 }); },
  hairball() {
    // kat die een haarbal ophoest: twee keer 'hek' en dan 'ptoe'
    noise({ dur: 0.09, vol: 0.3, freq: 500, q: 1.5 }); noise({ dur: 0.09, vol: 0.3, freq: 550, q: 1.5, at: 0.12 });
    tone({ f: 260, f2: 520, type: 'sawtooth', dur: 0.12, vol: 0.08, at: 0.22 }); noise({ dur: 0.1, vol: 0.25, freq: 1400, q: 1, at: 0.22 });
  },
  rice() { noise({ dur: 0.22, vol: 0.22, freq: 5000, q: 0.6, type: 'highpass' }); },
  bow() { [1319, 1568, 2093].forEach((f, i) => tone({ f, type: 'sine', dur: 0.2, vol: 0.12, at: i * 0.06 })); },
  burp() {
    // Papa's boer: lage, grommende zaagtand die wegzakt, met wat lucht erdoor
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(120, t + 0.12); o.frequency.exponentialRampToValueAtTime(55, t + 0.7);
    const lfo = ac.createOscillator(); lfo.frequency.value = 23; const lg = ac.createGain(); lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 4;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
    o.connect(f); f.connect(g); g.connect(sfxGain);
    o.start(t); lfo.start(t); o.stop(t + 0.8); lfo.stop(t + 0.8);
    noise({ dur: 0.5, vol: 0.1, freq: 400, type: 'lowpass' });
  },
  karaoke() { [659, 784, 880, 784, 1047, 988, 880].forEach((f, i) => { tone({ f, type: 'triangle', dur: 0.16, vol: 0.14, at: i * 0.13 }); tone({ f: f / 2, type: 'sine', dur: 0.16, vol: 0.08, at: i * 0.13 }); }); },
  snore() {
    // Opa snurkt: twee keer een brommend inademen en een fluitje
    noise({ dur: 0.45, vol: 0.3, freq: 250, q: 3, type: 'bandpass' }); tone({ f: 70, f2: 90, type: 'sawtooth', dur: 0.45, vol: 0.1, curve: 'lin' });
    tone({ f: 900, f2: 1400, type: 'sine', dur: 0.3, vol: 0.06, at: 0.55, curve: 'lin' });
    noise({ dur: 0.45, vol: 0.3, freq: 250, q: 3, type: 'bandpass', at: 0.95 }); tone({ f: 70, f2: 90, type: 'sawtooth', dur: 0.45, vol: 0.1, at: 0.95, curve: 'lin' });
  },
  slip() { tone({ f: 300, f2: 1400, type: 'sine', dur: 0.25, vol: 0.18 }); tone({ f: 1400, f2: 200, type: 'sine', dur: 0.3, vol: 0.14, at: 0.25 }); },
  boing() { tone({ f: 180, f2: 520, type: 'sine', dur: 0.12, vol: 0.3 }); tone({ f: 520, f2: 260, type: 'sine', dur: 0.35, vol: 0.2, at: 0.1 }); tone({ f: 1800, type: 'triangle', dur: 0.15, vol: 0.06 }); },
};

// Met een 'tap' kan het spel geluiden doorsturen naar de tweede speler (online samen spelen)
let tap = null;
export function setSfxTap(fn) { tap = fn; }
for (const k of Object.keys(sfx)) { const f = sfx[k]; sfx[k] = (...a) => { if (tap) tap(k); f(...a); }; }

// ---------- Muziek ----------
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  title:  { bpm: 112, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], lead: 'triangle', seed: 3 },
  jungle: { bpm: 120, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 6, 4], lead: 'square', seed: 11, perc: 'bongo' },
  clouds: { bpm: 96, root: 62, scale: [0, 2, 4, 6, 7, 9, 11], prog: [0, 3, 1, 4], lead: 'sine', seed: 23 },
  water:  { bpm: 88, root: 55, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 2], lead: 'sine', seed: 31, pent: true },
  sky:    { bpm: 132, root: 64, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3], lead: 'square', seed: 47 },
  boss:   { bpm: 150, root: 52, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 0, 5, 6], lead: 'sawtooth', seed: 59, perc: 'heavy' },
};

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Een liedje van 8 maten. De melodie volgt de akkoorden: op de zware tellen altijd een akkoordtoon, daartussen
// stapjes door de toonladder. (Vroeger negeerde de melodie de akkoorden, waardoor het klonk alsof er twee
// liedjes tegelijk speelden.)
function buildSong(def) {
  const r = rng(def.seed);
  const sc = def.scale, n = sc.length;
  const deg = (d) => def.root + sc[((d % n) + n) % n] + 12 * Math.floor(d / n);
  const BARS = 8;
  const chordOf = (bar) => def.prog[bar % def.prog.length];
  const tones = (c) => { const t = []; for (let o = -1; o <= 2; o++) for (const k of [0, 2, 4]) t.push(c + k + o * n); return t; };
  const LO = n + 1, HI = 2 * n + 3; // melodie blijft in een prettig bereik boven de akkoorden
  // twee ritmes (8 achtsten per maat); tel 1 heeft altijd een noot
  const rhythm = () => { const a = []; for (let i = 0; i < 8; i++) a.push(i === 0 || i === 4 ? true : r() < (i % 2 ? 0.45 : 0.7)); return a; };
  const rA = rhythm(), rB = rhythm();
  const order = [rA, rA, rB, rA, rA, rA, rB, [true, false, true, false, true, false, false, false]];
  const mel = [];
  let d = n + 2 + Math.floor(r() * 3);
  for (let bar = 0; bar < BARS; bar++) {
    const c = chordOf(bar), ct = tones(c).filter((x) => x >= LO && x <= HI);
    const rh = order[bar];
    for (let i = 0; i < 8; i++) {
      if (!rh[i]) { mel.push(null); continue; }
      if (bar === BARS - 1 && i === 4) { // slot: terug naar de grondtoon
        const home = [n, 2 * n].reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a)); d = home; mel.push(deg(d)); continue;
      }
      if (i === 0 || i === 4) {
        // zware tel: dichtstbijzijnde akkoordtoon (soms een sprongetje naar een andere)
        const sorted = ct.slice().sort((a, b) => Math.abs(a - d) - Math.abs(b - d));
        d = sorted[r() < 0.75 ? 0 : Math.min(1, sorted.length - 1)];
      } else {
        // lichte tel: stapje omhoog of omlaag; naar de volgende zware tel toe
        const step = r() < 0.5 ? 1 : -1;
        d = Math.max(LO, Math.min(HI, d + step));
      }
      mel.push(deg(d));
    }
  }
  return {
    bars: BARS, mel,
    bass: Array.from({ length: BARS }, (_, b) => deg(chordOf(b)) - 24),
    fifth: Array.from({ length: BARS }, (_, b) => deg(chordOf(b) + 4) - 24),
    chords: Array.from({ length: BARS }, (_, b) => [deg(chordOf(b)), deg(chordOf(b) + 2), deg(chordOf(b) + 4)]),
  };
}

export function playMusic(name) {
  if (tap) tap('music:' + name);
  if (!ac) return;
  if (music && music.name === name) return;
  stopMusic();
  const def = SONGS[name] || SONGS.title;
  const song = buildSong(def);
  const step = 60 / def.bpm / 2; // achtsten
  const total = song.bars * 8;
  // elk nummer krijgt een eigen volumeknop, zodat we het bij wisselen meteen helemaal kunnen dempen
  const songGain = ac.createGain(); songGain.gain.value = 1; songGain.connect(musicGain);
  let i = 0;
  let next = ac.currentTime + 0.1;
  const timer = setInterval(() => {
    if (!ac || music?.timer !== timer) { clearInterval(timer); return; }
    if (ac.state !== 'running') return;
    // timers lopen soms achter (iPad, tabblad op de achtergrond): sla gemiste noten over in plaats van ze allemaal tegelijk af te spelen
    if (next < ac.currentTime - 0.05) next = ac.currentTime + 0.05;
    while (next < ac.currentTime + 0.25) {
      const bar = Math.floor(i / 8) % song.bars, pos = i % 8;
      const m = song.mel[i % total];
      const at = next - ac.currentTime;
      if (m) {
        let len = 1; while (len < 3 && !song.mel[(i + len) % total] && (pos + len) % 4 !== 0) len++;
        tone({ f: N(m), type: def.lead, dur: step * len * 0.85, vol: def.lead === 'sine' ? 0.14 : 0.055, at, dest: songGain, attack: 0.01 });
      }
      if (pos === 0 || pos === 4) tone({ f: N(pos === 0 ? song.bass[bar] : song.fifth[bar]), type: 'triangle', dur: step * 3.4, vol: 0.2, at, dest: songGain });
      if (pos === 0) song.chords[bar].forEach((c) => tone({ f: N(c), type: 'sine', dur: step * 7.5, vol: 0.028, at, dest: songGain, attack: 0.04 }));
      // drums
      if (def.perc === 'heavy') {
        if (pos % 2 === 0) noise({ dur: 0.12, vol: 0.16, freq: 120, type: 'lowpass', at, dest: songGain });
        if (pos === 2 || pos === 6) noise({ dur: 0.1, vol: 0.12, freq: 1800, at, dest: songGain });
      } else if (def.perc === 'bongo') {
        if (pos === 0 || pos === 3 || pos === 6) tone({ f: pos === 3 ? 260 : 190, f2: 120, type: 'sine', dur: 0.12, vol: 0.16, at, dest: songGain });
        if (pos % 2 === 1) noise({ dur: 0.03, vol: 0.035, freq: 7000, type: 'highpass', at, dest: songGain });
      } else {
        if (pos === 0 || pos === 4) tone({ f: 120, f2: 50, type: 'sine', dur: 0.15, vol: 0.18, at, dest: songGain });
        if (pos === 2 || pos === 6) noise({ dur: 0.08, vol: 0.05, freq: 2500, at, dest: songGain });
        if (pos % 2 === 1) noise({ dur: 0.02, vol: 0.025, freq: 8000, type: 'highpass', at, dest: songGain });
      }
      next += step; i++;
    }
  }, 60);
  music = { name, timer, gain: songGain };
}
export function stopMusic() {
  if (!music) return;
  clearInterval(music.timer);
  const g = music.gain;
  if (g && ac) { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0, ac.currentTime, 0.02); setTimeout(() => g.disconnect(), 600); }
  music = null;
}
