// Muziek en geluidseffecten, volledig gesynthetiseerd met WebAudio (geen bestanden nodig)
let ac = null, master = null, musicGain = null, sfxGain = null;
let musicOn = true, sfxOn = true;
let music = null;
let wanted = null; // het nummer dat nu zou moeten spelen (ook als de muziek uit staat)

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') { ac.resume(); claim(); if (!music && wanted && musicOn) playMusic(wanted); } return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
  musicGain = ac.createGain(); musicGain.gain.value = musicOn ? 0.32 : 0; musicGain.connect(master);
  sfxGain = ac.createGain(); sfxGain.gain.value = sfxOn ? 0.7 : 0; sfxGain.connect(master);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => {
  if (!ac) return;
  if (document.hidden) ac.suspend?.(); else { ac.resume?.(); claim(); if (!music && wanted && musicOn) playMusic(wanted); }
});
// tikken in een tabblad dat even stil was, zet het geluid daar weer aan
if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { if (ac && ac.state === 'suspended' && !document.hidden) initAudio(); });
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => { stopMusic(); ac?.suspend?.(); });
// Staat het spel in meer tabbladen open? Dan speelt alleen het tabblad dat je gebruikt muziek; de andere zwijgen.
const me = Math.random().toString(36).slice(2);
let others = null;
try { others = new BroadcastChannel('avalon-audio'); } catch { /* oude browser */ }
function claim() { try { others?.postMessage({ t: 'claim', id: me }); } catch { /* niets */ } }
if (others) others.onmessage = (e) => {
  if (e.data?.id === me) return;
  if (e.data?.t === 'ping') { others.postMessage({ t: 'pong', id: me, to: e.data.id, music: !!music }); return; }
  if (e.data?.t === 'pong' && e.data.to === me) { pongs?.add(e.data.id); return; }
  if (e.data?.t !== 'claim') return;
  stopMusic(); ac?.suspend?.();
};
// Hoe vaak staat het spel open (in deze browser / deze app)? Voor de melding in Instellingen
let pongs = null;
export async function countOpenGames() {
  if (!others) return 1;
  pongs = new Set();
  others.postMessage({ t: 'ping', id: me });
  await new Promise((r) => setTimeout(r, 350));
  const n = pongs.size + 1; pongs = null; return n;
}
// Volume hard zetten: geleidelijk dempen (setTargetAtTime) werkt op iPad/Safari niet altijd
function hardSet(param, v) {
  param.cancelScheduledValues(ac.currentTime);
  param.value = v;
  param.setValueAtTime(v, ac.currentTime);
}
export function setMusic(on) {
  musicOn = on;
  if (!ac) return;
  hardSet(musicGain.gain, on ? 0.32 : 0);
  // muziek uit = de muziek echt stoppen, niet alleen zachter zetten
  if (!on) stopMusic();
  else if (wanted) playMusic(wanted);
}
export function setSfx(on) {
  sfxOn = on;
  if (sfxGain) hardSet(sfxGain.gain, on ? 0.7 : 0);
}

function noiseBuffer() {
  if (noiseBuffer.buf) return noiseBuffer.buf;
  const len = ac.sampleRate * 1;
  const b = ac.createBuffer(1, len, ac.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return (noiseBuffer.buf = b);
}

function tone({ f = 440, f2 = null, type = 'square', dur = 0.15, vol = 0.3, at = 0, attack = 0.005, dest = sfxGain, curve = 'exp', hold = 0, detune = 0 }) {
  if (!ac) return;
  const t = ac.currentTime + at;
  const o = ac.createOscillator(); const g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) {
    if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    else o.frequency.linearRampToValueAtTime(f2, t + dur);
  }
  if (detune) o.detune.setValueAtTime(detune, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  // hold > 0: de noot blijft even mooi doorklinken (zingend) en sterft dan zacht uit, in plaats van meteen weg te tikken
  if (hold > 0) g.gain.exponentialRampToValueAtTime(vol * 0.6, t + Math.max(attack + 0.01, dur * hold));
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
// Vrolijke, rustige liedjes: allemaal in majeur, zachte klanken (geen schelle blokgolven) en lange, zingende noten
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SONGS = {
  title:  { bpm: 100, root: 60, scale: MAJOR, prog: [0, 5, 3, 4], seed: 5,  lead: 'triangle', bell: 0.35, perc: 'soft' },
  jungle: { bpm: 108, root: 65, scale: MAJOR, prog: [0, 3, 4, 0], seed: 12, lead: 'triangle', bell: 0.5, perc: 'bongo' },
  clouds: { bpm: 92,  root: 62, scale: MAJOR, prog: [0, 3, 5, 4], seed: 27, lead: 'sine', bell: 0.45, perc: 'soft' },
  water:  { bpm: 84,  root: 55, scale: [0, 2, 4, 7, 9], prog: [0, 3, 1, 2], seed: 31, lead: 'sine', bell: 0.3, perc: 'soft' },
  sky:    { bpm: 112, root: 64, scale: MAJOR, prog: [0, 4, 5, 3], seed: 44, lead: 'triangle', bell: 0.4, perc: 'soft' },
  boss:   { bpm: 126, root: 57, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 4], seed: 61, lead: 'triangle', bell: 0.25, perc: 'drive' },
};

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Een liedje van 8 maten in de vorm A A' B A'': een kort deuntje dat terugkomt (dat maakt het meezingbaar).
// Het deuntje schuift mee met de akkoorden, zodat de melodie altijd bij de begeleiding past.
function buildSong(def) {
  const r = rng(def.seed);
  const sc = def.scale, n = sc.length;
  const deg = (d) => def.root + sc[((d % n) + n) % n] + 12 * Math.floor(d / n);
  const BARS = 8;
  const chordOf = (bar) => def.prog[bar % def.prog.length];
  const pent = n === 5;
  const tones = (c) => { const t = []; for (let o = -1; o <= 3; o++) for (const k of (pent ? [0, 2, 3] : [0, 2, 4])) t.push(c + k + o * n); return t; };
  const LO = n, HI = 2 * n + 4;
  const nearestChordTone = (c, d) => tones(c).filter((x) => x >= LO && x <= HI).sort((a, b) => Math.abs(a - d) - Math.abs(b - d))[0];
  // ritmes in achtsten: true = nieuwe noot, false = vorige noot klinkt door. Rustig: vooral kwartnoten en halve noten
  const RH = [
    [1, 0, 1, 0, 1, 0, 1, 1], [1, 0, 0, 1, 1, 0, 1, 0], [1, 0, 1, 1, 1, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 1, 0], [1, 0, 1, 0, 1, 1, 1, 0],
  ];
  const pick = () => RH[Math.floor(r() * RH.length)];
  // motief van 2 maten: stapjes omhoog/omlaag (relatief), begint op een akkoordtoon
  const motif = (len) => { const steps = []; for (let i = 0; i < len; i++) steps.push(r() < 0.15 ? 0 : (r() < 0.55 ? 1 : -1) * (r() < 0.2 ? 2 : 1)); return steps; };
  const rhA = [pick(), pick()], rhB = [pick(), pick()];
  const stA = [motif(8), motif(8)], stB = [motif(8), motif(8)];
  const plan = [[rhA[0], stA[0]], [rhA[1], stA[1]], [rhA[0], stA[0]], [rhA[1], stA[1].map((x) => -x)],
    [rhB[0], stB[0]], [rhB[1], stB[1]], [rhA[0], stA[0]], [[1, 0, 1, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0]]];
  const mel = [];
  let d = n + 2;
  for (let bar = 0; bar < BARS; bar++) {
    const c = chordOf(bar);
    const [rh, st] = plan[bar];
    d = nearestChordTone(c, d);
    let k = 0;
    for (let i = 0; i < 8; i++) {
      if (!rh[i]) { mel.push(null); continue; }
      if (bar === BARS - 1 && i === 4) { d = nearestChordTone(0, d); d = d - (((d % n) + n) % n); if (d < LO) d += n; mel.push(deg(d)); continue; } // slot op de grondtoon
      if (i === 4 && k > 0) d = nearestChordTone(c, d); // halverwege de maat weer op een akkoordtoon
      else if (k > 0) d = Math.max(LO, Math.min(HI, d + st[k]));
      mel.push(deg(d)); k++;
    }
  }
  const chord = (b) => (pent ? [0, 2, 3] : [0, 2, 4]).map((k) => deg(chordOf(b) + k));
  return {
    bars: BARS, mel,
    bass: Array.from({ length: BARS }, (_, b) => deg(chordOf(b)) - 24),
    fifth: Array.from({ length: BARS }, (_, b) => deg(chordOf(b) + (pent ? 3 : 4)) - 24),
    chords: Array.from({ length: BARS }, (_, b) => chord(b)),
  };
}

export function playMusic(name) {
  if (tap) tap('music:' + name);
  wanted = name;
  if (!ac) return;
  if (!musicOn) { stopMusic(); return; }
  if (music && music.name === name) return;
  stopMusic();
  claim();
  const def = SONGS[name] || SONGS.title;
  const song = buildSong(def);
  const step = 60 / def.bpm / 2; // achtsten
  const total = song.bars * 8;
  // elk nummer krijgt een eigen volumeknop, zodat we het bij wisselen meteen helemaal kunnen dempen
  const songGain = ac.createGain(); songGain.gain.value = 0.65; songGain.connect(musicGain);
  // een beetje galm maakt alles zachter en ronder
  const echo = ac.createDelay(1); echo.delayTime.value = step * 3;
  const echoGain = ac.createGain(); echoGain.gain.value = 0.22;
  const echoTone = ac.createBiquadFilter(); echoTone.type = 'lowpass'; echoTone.frequency.value = 2200;
  songGain.connect(echo); echo.connect(echoTone); echoTone.connect(echoGain); echoGain.connect(echo); echoGain.connect(musicGain);
  const lead = ac.createGain(); lead.gain.value = 1; lead.connect(songGain);
  let i = 0;
  let next = ac.currentTime + 0.12;
  // ruim vooruit inplannen (0,6 s), zodat de muziek niet hapert als de iPad het even druk heeft
  const AHEAD = 0.6;
  const timer = setInterval(() => {
    if (!ac || music?.timer !== timer) { clearInterval(timer); return; }
    if (ac.state !== 'running') return;
    if (next < ac.currentTime - 0.05) next = ac.currentTime + 0.05;
    while (next < ac.currentTime + AHEAD) {
      const bar = Math.floor(i / 8) % song.bars, pos = i % 8;
      const m = song.mel[i % total];
      const at = next - ac.currentTime;
      if (m) {
        let len = 1; while (len < 4 && !song.mel[(i + len) % total] && pos + len < 8) len++;
        const dur = step * len * 0.98 + 0.06;
        tone({ f: N(m), type: def.lead, dur, vol: def.lead === 'sine' ? 0.15 : 0.11, at, dest: lead, attack: 0.025, hold: 0.7 });
        // zacht belletje een octaaf hoger: maakt het vrolijk en sprankelend
        tone({ f: N(m + 12), type: 'sine', dur: Math.min(dur, 0.5), vol: 0.03 * def.bell * 2, at, dest: lead, attack: 0.005 });
      }
      // bas: rustig 'oem-pa' op tel 1 en 3
      if (pos === 0 || pos === 4) tone({ f: N(pos === 0 ? song.bass[bar] : song.fifth[bar]), type: 'triangle', dur: step * 3.6, vol: 0.16, at, dest: songGain, attack: 0.02, hold: 0.6 });
      // speeldoos-arpeggio van het akkoord op de achtsten ertussen
      if (pos % 2 === 1) { const ch = song.chords[bar]; tone({ f: N(ch[(pos >> 1) % ch.length]), type: 'sine', dur: step * 1.8, vol: 0.035, at, dest: songGain, attack: 0.006 }); }
      // zacht akkoord eronder
      if (pos === 0) song.chords[bar].forEach((c) => tone({ f: N(c - 12), type: 'sine', dur: step * 7.8, vol: 0.022, at, dest: songGain, attack: 0.15, hold: 0.8 }));
      // ritme: zacht en ontspannen
      if (def.perc === 'bongo') {
        if (pos === 0 || pos === 3 || pos === 6) tone({ f: pos === 3 ? 240 : 180, f2: 130, type: 'sine', dur: 0.14, vol: 0.09, at, dest: songGain });
        if (pos % 2 === 1) noise({ dur: 0.04, vol: 0.012, freq: 6000, type: 'highpass', at, dest: songGain });
      } else if (def.perc === 'drive') {
        if (pos === 0 || pos === 4) tone({ f: 110, f2: 48, type: 'sine', dur: 0.18, vol: 0.14, at, dest: songGain });
        if (pos === 2 || pos === 6) noise({ dur: 0.09, vol: 0.03, freq: 1800, q: 0.7, at, dest: songGain });
        noise({ dur: 0.03, vol: pos % 2 ? 0.012 : 0.007, freq: 7500, type: 'highpass', at, dest: songGain });
      } else {
        if (pos === 0 || pos === 4) tone({ f: 100, f2: 50, type: 'sine', dur: 0.16, vol: 0.1, at, dest: songGain });
        if (pos === 2 || pos === 6) noise({ dur: 0.06, vol: 0.016, freq: 3000, q: 0.6, at, dest: songGain });
        if (pos % 2 === 1) noise({ dur: 0.03, vol: 0.008, freq: 8000, type: 'highpass', at, dest: songGain });
      }
      next += step; i++;
    }
  }, 50);
  music = { name, timer, gain: songGain, extra: [echo, echoGain, echoTone, lead] };
}
export function stopMusic() {
  if (!music) return;
  clearInterval(music.timer);
  const g = music.gain;
  const extra = music.extra || [];
  if (g && ac) { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setTargetAtTime(0, ac.currentTime, 0.02); setTimeout(() => { g.disconnect(); extra.forEach((x) => x.disconnect()); }, 600); }
  music = null;
}
