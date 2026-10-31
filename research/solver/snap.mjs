/*
 * 7AK'S SNAPS (audit-7ak.mjs; research/tests/snap-7ak.test.mjs): a position's nearest grid cell (nearestIndex's own
 * rounding, as coordinates) and the position with one thing moved to that cell - total wealth W, the pension share a, the
 * ISA share b, the gain bucket, the lump-allowance bucket, or all of it (the cell's own state, toVec) - and the reader's
 * chance read at the nearest cell's accessible money (grid.js g.readerAcc, research only, restored after).
 */
import { locateVec, toVec } from '../../src/solver/grid.js';
export const SNAPS = ['W', 'a', 'b', 'gain', 'pcls', 'reader', 'all'];
// the nearest cell's coordinates (nearestIndex's own rounding) and the snapped states
export function nearestOf(g, s) {
  const loc = locateVec(g, s);
  return { ip: Math.min(g.np - 1, loc.p.i + (loc.p.w > 0.5 ? 1 : 0)), ii: Math.min(g.ni - 1, loc.i.i + (loc.i.w > 0.5 ? 1 : 0)), it: Math.min(g.nt - 1, loc.t.i + (loc.t.w > 0.5 ? 1 : 0)), ig: loc.ig + (loc.igw > 0.5 ? 1 : 0), ic: loc.ic + (loc.icw > 0.5 ? 1 : 0) };   // nearestIndex's rounding, the interpolated axes' lower bracket rounded by their weight
}
export const shares = s => { const W = s[0] + s[1] + s[2], rest = W - s[0]; return { W, a: W > 0 ? s[0] / W : 0, b: rest > 0 ? s[1] / rest : 0 }; };
export const build = (s, W, a, b) => { const o = Float64Array.from(s), pen = a * W, rest = W - pen, isa = b * rest; o[0] = pen; o[1] = isa; o[2] = rest - isa; return o; };
export function snapState(g, s, what, nc = nearestOf(g, s)) {
  const { W, a, b } = shares(s);
  if (what === 'W') return build(s, g.axes.W.pts[nc.ip], a, b);
  if (what === 'a') return build(s, W, g.axes.a.pts[nc.ii], b);
  if (what === 'b') return build(s, W, a, g.axes.b.pts[nc.it]);
  if (what === 'gain') { const o = Float64Array.from(s); o[3] = g.gain[nc.ig]; return o; }
  if (what === 'pcls') { const o = Float64Array.from(s); o[4] = g.pcls[nc.ic] * g.m.P.lsa; o[5] = g.pcls[nc.ic] > 0 ? 1 : 0; return o; }
  if (what === 'all') return toVec(g, nc.ip, nc.ii, nc.it, nc.ig, nc.ic, new Float64Array(7));
  return s;
}
// the reader's chance read at the nearest cell's accessible money: W (1 - a) at the grown position's nearest W and a
export const readerAccAtCell = g => s => { const nc = nearestOf(g, s); return g.axes.W.pts[nc.ip] * (1 - g.axes.a.pts[nc.ii]); };
export const withReaderSnap = (r, f) => { const gs = [...new Set([r.g, ...r.mix.tables.map(t => t.g).filter(Boolean)])]; gs.forEach(g => { g.readerAcc = readerAccAtCell(g); }); try { return f(); } finally { gs.forEach(g => { delete g.readerAcc; }); } };

