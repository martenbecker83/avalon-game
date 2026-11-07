// Gedeeld scorebord voor iedereen die Avalon speelt (Netlify Function + Netlify Blobs)
import { getStore } from '@netlify/blobs';

const CHARS = ['avalon', 'papa', 'mama', 'fuchi', 'oma', 'opa', 'lolo', 'lola'];
const WORLDS = ['jungle', 'clouds', 'water', 'sky'];
const MAX_SCORE = 5000;
const KEEP = 200;

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export default async (req) => {
  const store = getStore({ name: 'avalon-scores', consistency: 'strong' });
  const list = (await store.get('top', { type: 'json' })) || [];

  if (req.method === 'GET') return json({ scores: list.slice(0, 10) });

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch { return json({ error: 'ongeldige invoer' }, 400); }
    const initials = String(body.initials || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    const score = Math.floor(Number(body.score));
    const worlds = Array.isArray(body.worlds) ? [...new Set(body.worlds.filter((w) => WORLDS.includes(w)))] : [];
    const id = /^[a-z0-9]{4,16}$/.test(String(body.id || '')) ? String(body.id) : Math.random().toString(36).slice(2, 12);
    if (!initials || !CHARS.includes(body.character) || !Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
      return json({ error: 'ongeldige score' }, 400);
    }
    const entry = { id, initials, character: body.character, worlds, score, date: new Date().toISOString().slice(0, 10) };
    list.push(entry);
    list.sort((a, b) => b.score - a.score);
    await store.setJSON('top', list.slice(0, KEEP));
    const rank = list.indexOf(entry) + 1;
    return json({ ok: true, rank, entry });
  }
  return json({ error: 'niet toegestaan' }, 405);
};

export const config = { path: '/api/scores' };
