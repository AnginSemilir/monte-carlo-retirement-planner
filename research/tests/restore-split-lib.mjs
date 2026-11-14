/* restore-split.test.mjs's helpers, shared with its worker: the adaptive reference's arrays as one digest, its counts, the
   plan at a dial position */
import { createHash } from 'node:crypto';

export const atDial = (p, pos) => ({ ...p, solver: { ...(p.solver || {}), aims: { ...((p.solver && p.solver.aims) || {}), cuts: pos } } });
const refOf = r => r.g && r.g.reader && r.g.reader.adaptive && r.g.reader.adaptive.ref;
/* every array of the reference (its step thresholds by year included), in a fixed order */
export function refDigest(r) {
  const a = refOf(r);
  if (!a) return 'none';
  const { V, MV, V0, MV0, AST, ASTY } = a.arrays(), h = createHash('sha256');
  const add = x => h.update(new Uint8Array(x.buffer, x.byteOffset, x.byteLength));
  const yrs = o => Object.keys(o).map(Number).sort((p, q) => p - q).forEach(t => { h.update(`y${t}`); add(o[t]); });
  add(AST); yrs(ASTY); V.forEach(yrs); yrs(MV); V0.forEach(yrs); yrs(MV0);
  return h.digest('hex');
}
/* the reference's counts, as the stored record keeps them (src/solverCache.js cacheOf) */
export const countsOf = r => { const a = refOf(r); return a ? { nonMono: a.nonMono, footLive: a.footLive || 0 } : null; };
