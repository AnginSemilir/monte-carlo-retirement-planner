/*
 * N7's two fingerprints, the same in Node and in a browser (Web Crypto's SHA-256 in both):
 *   tablesOf(r), digestOf(arrays)   every table a solve keeps (audit-e2x.mjs's list, in its order), hashed array by array
 *                                   and then together, so a device's tables can be checked against Node's bit for bit;
 *   codeOf(files)                   the solver's source files as the page loaded them, so a stale page is caught.
 */
export const CODE_FILES = ['research/engine.mjs', 'src/solver/model.js', 'src/solver/solve.js', 'src/solver/grid.js',
  'src/solver/reader.js', 'src/solver/fast.js', 'src/solver/adaptive.js'];

export function tablesOf(r) {
  const out = [], W = r.tablesW;
  const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L);
  else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  return out;
}
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = bytes => crypto.subtle.digest('SHA-256', bytes);

/* each array's own hash (its kind, length and bytes), then the hash of them all in order */
export async function digestOf(arrays) {
  const parts = [];
  for (const a of arrays) {
    const head = new TextEncoder().encode(`${a.constructor.name}:${a.length}:`);
    const body = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    const one = new Uint8Array(head.length + body.length); one.set(head); one.set(body, head.length);
    parts.push(new Uint8Array(await sha(one)));
  }
  const all = new Uint8Array(parts.length * 32); parts.forEach((p, i) => all.set(p, i * 32));
  return hex(await sha(all));
}
export const sizeOf = arrays => ({ values: arrays.reduce((t, a) => t + a.length, 0), bytes: arrays.reduce((t, a) => t + a.byteLength, 0) });

/* files: [[path, bytes]] in CODE_FILES' order */
export async function codeOf(files) {
  const enc = new TextEncoder(), chunks = [];
  for (const [p, b] of files) { chunks.push(enc.encode(`${p}\0`), new Uint8Array(b), enc.encode('\0')); }
  const n = chunks.reduce((t, c) => t + c.length, 0), all = new Uint8Array(n);
  let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  return hex(await sha(all)).slice(0, 16);
}
