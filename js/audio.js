// Muziek en geluidseffecten, volledig gesynthetiseerd met WebAudio (geen bestanden nodig)
let ac = null, master = null, musicGain = null, sfxGain = null;
let enabled = true;
let music = null;

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = enabled ? 0.9 : 0; master.connect(ac.destination);
  musicGain = ac.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
  sfxGain = ac.createGain(); sfxGain.gain.value = 0.7; sfxGain.connect(master);
}
export function setSound(on) {
  enabled = on;
  if (master) master.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.05);
}
export const soundOn = () => enabled;

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
};

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

function buildSong(def) {
  const r = rng(def.seed);
  const sc = def.scale, n = sc.length;
  const deg = (d) => def.root + sc[((d % n) + n) % n] + 12 * Math.floor(d / n);
  // melody: 4 bars x 8 eighths, motif-based
  const motif = [];
  let d = 4 + Math.floor(r() * 3);
  for (let i = 0; i < 8; i++) { motif.push(r() < 0.22 ? null : d); d += Math.floor(r() * 5) - 2; d = Math.max(2, Math.min(11, d)); }
  const mel = [];
  for (let bar = 0; bar < 4; bar++) {
    const shift = def.prog[bar];
    for (let i = 0; i < 8; i++) {
      let m = motif[i];
      if (m !== null && bar % 2 === 1 && i > 4) m = m + (bar === 3 ? -1 : 1);
      mel.push(m === null ? null : deg(m + (bar === 2 ? 2 : 0) + (shift > 4 ? 0 : 0)));
    }
  }
  return { mel, bass: def.prog.map((p) => deg(p) - 24), chords: def.prog.map((p) => [deg(p), deg(p + 2), deg(p + 4)]) };
}

export function playMusic(name) {
  if (!ac) return;
  if (music && music.name === name) return;
  stopMusic();
  const def = SONGS[name] || SONGS.title;
  const song = buildSong(def);
  const step = 60 / def.bpm / 2; // eighth notes
  let i = 0;
  let next = ac.currentTime + 0.1;
  const timer = setInterval(() => {
    if (!ac) return;
    while (next < ac.currentTime + 0.25) {
      const bar = Math.floor(i / 8) % 4, pos = i % 8;
      const m = song.mel[i % 32];
      const at = next - ac.currentTime;
      if (m) tone({ f: N(m), type: def.lead, dur: step * 0.9, vol: def.lead === 'sine' ? 0.16 : 0.07, at, dest: musicGain, attack: 0.01 });
      if (pos % 2 === 0) tone({ f: N(song.bass[bar] + (pos === 4 ? 7 : 0)), type: 'triangle', dur: step * 1.7, vol: 0.22, at, dest: musicGain });
      if (pos === 0 || pos === 4) song.chords[bar].forEach((c) => tone({ f: N(c), type: 'sine', dur: step * 3.5, vol: 0.035, at, dest: musicGain, attack: 0.03 }));
      // drums
      if (def.perc === 'heavy') {
        if (pos % 2 === 0) noise({ dur: 0.12, vol: 0.18, freq: 120, type: 'lowpass', at, dest: musicGain });
        if (pos === 2 || pos === 6) noise({ dur: 0.1, vol: 0.14, freq: 1800, at, dest: musicGain });
      } else if (def.perc === 'bongo') {
        if (pos === 0 || pos === 3 || pos === 6) tone({ f: pos === 3 ? 260 : 190, f2: 120, type: 'sine', dur: 0.12, vol: 0.18, at, dest: musicGain });
        noise({ dur: 0.03, vol: 0.04, freq: 7000, type: 'highpass', at, dest: musicGain });
      } else {
        if (pos === 0 || pos === 4) tone({ f: 120, f2: 50, type: 'sine', dur: 0.15, vol: 0.2, at, dest: musicGain });
        if (pos === 2 || pos === 6) noise({ dur: 0.08, vol: 0.06, freq: 2500, at, dest: musicGain });
        if (pos % 2 === 1) noise({ dur: 0.02, vol: 0.03, freq: 8000, type: 'highpass', at, dest: musicGain });
      }
      next += step; i++;
    }
  }, 60);
  music = { name, timer };
}
export function stopMusic() { if (music) { clearInterval(music.timer); music = null; } }
