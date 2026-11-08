// Samen spelen op twee apparaten: een directe verbinding (WebRTC) tussen de twee browsers.
// Het spel maken = 'host' (rekent het spel uit), meedoen met de code = 'gast' (tekent wat de host stuurt).
// Alleen het eerste contact (een korte code) loopt via de Netlify Function /api/room.

const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
const LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function randomCode() { return Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join(''); }

async function api(method, params, body) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(`/api/room?${q}`, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('server');
  return r.json();
}

function gathered(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((res) => {
    const done = () => { pc.removeEventListener('icegatheringstatechange', chk); res(); };
    const chk = () => { if (pc.iceGatheringState === 'complete') done(); };
    pc.addEventListener('icegatheringstatechange', chk);
    setTimeout(done, 3000);
  });
}

export class Net {
  constructor() {
    this.pc = null; this.rel = null; this.fast = null;
    this.role = null; this.code = null; this.open = false; this.cancelled = false;
    this.onMessage = () => {}; this.onClose = () => {};
  }

  _wire(ch) {
    ch.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } this.onMessage(m); };
    ch.onclose = () => this._closed();
  }
  _closed() {
    if (!this.open) return;
    this.open = false;
    this.onClose();
  }
  _waitOpen() {
    return new Promise((res, rej) => {
      const t0 = Date.now();
      const chk = () => {
        if (this.cancelled) return rej(new Error('gestopt'));
        if (this.rel?.readyState === 'open' && this.fast?.readyState === 'open') { this.open = true; return res(); }
        if (Date.now() - t0 > 20000) return rej(new Error('verbinden lukt niet'));
        setTimeout(chk, 100);
      };
      chk();
    });
  }
  _pc() {
    const pc = new RTCPeerConnection(ICE);
    pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) setTimeout(() => { if (pc.connectionState !== 'connected') this._closed(); }, pc.connectionState === 'disconnected' ? 4000 : 0); };
    return pc;
  }

  // Nieuw spel maken: geeft de code via onCode en wacht tot de tweede speler meedoet
  async host(onCode) {
    this.role = 'host'; this.cancelled = false;
    const pc = this.pc = this._pc();
    this.rel = pc.createDataChannel('rel', { ordered: true });
    this.fast = pc.createDataChannel('fast', { ordered: false, maxRetransmits: 0 });
    this._wire(this.rel); this._wire(this.fast);
    await pc.setLocalDescription(await pc.createOffer());
    await gathered(pc);
    let code;
    for (let i = 0; i < 5; i++) {
      code = randomCode();
      const r = await api('POST', { code, kind: 'offer' }, { sdp: pc.localDescription.sdp, fresh: true });
      if (r?.ok) break;
    }
    this.code = code; onCode(code);
    // wacht op het antwoord van de andere speler (max. 10 minuten)
    const until = Date.now() + 10 * 60 * 1000;
    while (!this.cancelled && Date.now() < until) {
      const r = await api('GET', { code, kind: 'answer' }).catch(() => null);
      if (r?.sdp) { await pc.setRemoteDescription({ type: 'answer', sdp: r.sdp }); break; }
      await sleep(1200);
    }
    if (this.cancelled) throw new Error('gestopt');
    await this._waitOpen();
    api('DELETE', { code }).catch(() => {});
  }

  // Meedoen met een code
  async join(code) {
    this.role = 'guest'; this.cancelled = false; this.code = code;
    const r = await api('GET', { code, kind: 'offer' });
    if (!r?.sdp) throw new Error('code onbekend');
    const pc = this.pc = this._pc();
    pc.ondatachannel = (e) => { if (e.channel.label === 'rel') this.rel = e.channel; else this.fast = e.channel; this._wire(e.channel); };
    await pc.setRemoteDescription({ type: 'offer', sdp: r.sdp });
    await pc.setLocalDescription(await pc.createAnswer());
    await gathered(pc);
    await api('POST', { code, kind: 'answer' }, { sdp: pc.localDescription.sdp });
    await this._waitOpen();
  }

  send(msg, fast = false) {
    const ch = fast ? this.fast : this.rel;
    if (!this.open || !ch || ch.readyState !== 'open') return;
    if (fast && ch.bufferedAmount > 64 * 1024) return; // netwerk loopt achter: deze momentopname overslaan
    try { ch.send(JSON.stringify(msg)); } catch { /* verbinding net weg */ }
  }

  close() {
    this.cancelled = true; this.open = false;
    try { this.rel?.close(); this.fast?.close(); this.pc?.close(); } catch { /* */ }
    this.pc = this.rel = this.fast = null;
  }
}
