/*
 * A solve's fingerprint, the same in Node and in a browser (Web Crypto's SHA-256 in both; research/solver/n7/digest.mjs, with
 * the adaptive reference's arrays added): every table the solve keeps, in a fixed order, hashed array by array and then
 * together. The Phase 7 harness checks the page's solve against Node's with it, bit for bit.
 */
export function tablesOf(r) {
  const out = [], W = r.tablesW;
  const add = L => { for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of L[key]) out.push(a); };
  if (W.layW) for (const ls of W.layW) for (const L of ls) add(L);
  else for (let k = 0; k < W.survW.length; k++) add({ surv: W.survW[k], beq: W.beqW[k], resil: W.resilW[k], pol: W.polW[k], short: W.shortW[k] });
  // the adaptive reference's own arrays (adaptive.js arrays()), where the solve built one
  const ref = r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref;
  if (ref) {
    const { V, MV, V0, MV0, AST, ASTY } = ref.arrays(), yrs = o => Object.keys(o).map(Number).sort((a, b) => a - b);
    out.push(AST);
    for (const Vk of V) for (const t of yrs(Vk)) out.push(Vk[t]);
    for (const t of yrs(MV)) out.push(MV[t]);
    for (const Vk of V0) for (const t of yrs(Vk)) out.push(Vk[t]);
    for (const t of yrs(MV0)) out.push(MV0[t]);
    for (const t of yrs(ASTY)) out.push(ASTY[t]);
  }
  return out;
}
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = bytes => crypto.subtle.digest('SHA-256', bytes);

/* each array's own hash (its kind, length and bytes, copied out of shared memory first), then the hash of them all */
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
