// Eerste contact voor samen spelen op twee apparaten: bewaart kort de verbindingsgegevens onder een code van 4 letters.
// Daarna praten de twee browsers rechtstreeks met elkaar (WebRTC); deze functie doet dan niets meer.
import { getStore } from '@netlify/blobs';

const TTL = 15 * 60 * 1000; // een code is 15 minuten geldig
const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

export default async (req) => {
  const url = new URL(req.url);
  const code = String(url.searchParams.get('code') || '').toUpperCase();
  const kind = url.searchParams.get('kind');
  if (!/^[A-Z]{4}$/.test(code)) return json({ error: 'ongeldige code' }, 400);
  const store = getStore({ name: 'avalon-rooms', consistency: 'strong' });
  const key = `room-${code}`;
  const room = await store.get(key, { type: 'json' });
  const alive = room && Date.now() - room.created < TTL;

  if (req.method === 'GET') {
    if (!alive || !['offer', 'answer'].includes(kind) || !room[kind]) return json({ error: 'niet gevonden' }, 404);
    return json({ sdp: room[kind] });
  }
  if (req.method === 'POST') {
    let body; try { body = await req.json(); } catch { return json({ error: 'ongeldige invoer' }, 400); }
    const sdp = String(body.sdp || '');
    if (!sdp || sdp.length > 20000) return json({ error: 'ongeldige invoer' }, 400);
    if (kind === 'offer') {
      if (alive && body.fresh) return json({ error: 'code bezet' }, 409);
      await store.setJSON(key, { created: Date.now(), offer: sdp, answer: null });
      return json({ ok: true });
    }
    if (kind === 'answer') {
      if (!alive) return json({ error: 'niet gevonden' }, 404);
      if (room.answer) return json({ error: 'al bezet' }, 409);
      await store.setJSON(key, { ...room, answer: sdp });
      return json({ ok: true });
    }
    return json({ error: 'ongeldige invoer' }, 400);
  }
  if (req.method === 'DELETE') { await store.delete(key); return json({ ok: true }); }
  return json({ error: 'niet toegestaan' }, 405);
};

export const config = { path: '/api/room' };
