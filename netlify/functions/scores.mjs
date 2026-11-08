// Gedeeld scorebord voor iedereen die Avalon speelt (Netlify Function + Netlify Blobs)
// Twee lijsten: 1 speler ('top') en 2 spelers samen ('top2', met twee personages en twee keer initialen)
import { getStore } from '@netlify/blobs';

const CHARS = ['avalon', 'papa', 'mama', 'fuchi', 'oma', 'opa', 'lolo', 'lola'];
const WORLDS = ['jungle', 'clouds', 'water', 'sky'];
const MAX_SCORE = 5000;
const KEEP = 200;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});
const cleanIni = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);

export default async (req) => {
  const url = new URL(req.url);
  const duo = url.searchParams.get('mode') === 'duo';
  const store = getStore({ name: 'avalon-scores', consistency: 'strong' });
  const key = duo ? 'top2' : 'top';
  const list = (await store.get(key, { type: 'json' })) || [];

  if (req.method === 'GET') return json({ scores: list.slice(0, 10) });

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'ongeldige invoer' }, 400); }
    const score = Math.floor(Number(body.score));
    const worlds = Array.isArray(body.worlds) ? [...new Set(body.worlds.filter((w) => WORLDS.includes(w)))] : [];
    const id = /^[a-z0-9]{4,16}$/.test(String(body.id || '')) ? String(body.id) : Math.random().toString(36).slice(2, 12);
    if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) return json({ error: 'ongeldige score' }, 400);
    let entry;
    if (duo) {
      const initials = Array.isArray(body.initials) ? body.initials.map(cleanIni) : [];
      const chars = Array.isArray(body.characters) ? body.characters : [];
      if (initials.length !== 2 || !initials[0] || !initials[1] || chars.length !== 2 || !chars.every((c) => CHARS.includes(c)) || chars[0] === chars[1]) {
        return json({ error: 'ongeldige score' }, 400);
      }
      entry = { id, initials, characters: chars, worlds, score, date: new Date().toISOString().slice(0, 10) };
    } else {
      const initials = cleanIni(body.initials);
      if (!initials || !CHARS.includes(body.character)) return json({ error: 'ongeldige score' }, 400);
      entry = { id, initials, character: body.character, worlds, score, date: new Date().toISOString().slice(0, 10) };
    }
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    await store.setJSON(key, list.slice(0, KEEP));
    const rank = list.indexOf(entry) + 1;
    return json({ ok: true, rank, entry });
  }
  return json({ error: 'niet toegestaan' }, 405);
};

export const config = { path: '/api/scores' };
