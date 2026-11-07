// Voortgang, eigen scores (op dit apparaat) en het gedeelde scorebord
const KEY_PROGRESS = 'avalon.progress.v1';
const KEY_SCORES = 'avalon.scores.v1';
const KEY_SETTINGS = 'avalon.settings.v1';

function read(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
}
function write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* opslag vol of geblokkeerd */ } }

// progress per world: { level: 1..5, checkpoint: 0..2, coins, freed: bool, active: bool }
export function getProgress(worldId) { return read(KEY_PROGRESS, {})[worldId] || null; }
export function setProgress(worldId, p) { const all = read(KEY_PROGRESS, {}); all[worldId] = p; write(KEY_PROGRESS, all); }
export function clearProgress(worldId) {
  const all = read(KEY_PROGRESS, {}); const old = all[worldId];
  all[worldId] = { level: 1, checkpoint: 0, coins: 0, active: false, freed: old?.freed || false };
  write(KEY_PROGRESS, all);
}

export function getSettings() { return read(KEY_SETTINGS, { sound: true, character: 'avalon', initials: '' }); }
export function setSettings(s) { write(KEY_SETTINGS, { ...getSettings(), ...s }); }

export function getLocalScores() { return read(KEY_SCORES, []); }
export function addLocalScore(entry) {
  const list = getLocalScores(); list.push(entry);
  list.sort((a, b) => b.score - a.score);
  write(KEY_SCORES, list.slice(0, 50));
}

const API = '/api/scores';
export async function fetchGlobalScores() {
  const r = await fetch(API, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new Error('scorebord niet bereikbaar');
  const data = await r.json();
  return Array.isArray(data.scores) ? data.scores : [];
}
export async function postGlobalScore(entry) {
  const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(entry) });
  if (!r.ok) throw new Error('opslaan mislukt');
  return r.json();
}
