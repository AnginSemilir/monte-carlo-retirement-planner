// The solve on anchors and shortlists (the review of 9 Nov, item 10; D73): its settings as one word, from the review's
// scripts/solve-cfg.mjs at c3fea94d. The candidate carries w2a3b3g2c2-NT-LRVOH-h3 since D73.
// A setting of the prototype (opts.coarse), written as one word:
//     w<stride>a<stride>b<stride>[g<stride>c<stride>]-<sources>-<widening>[-<extra>...]      e.g. w2a3b3g2c2-NT-LRVOH-h3
//   strides   every w-th wealth point, a-th pension-share point, b-th ISA-share point, g-th gain bucket and c-th allowance
//             bucket is an anchor and takes the whole menu; each axis's last point is always one
//   sources   N the moves the anchors around the cell stored this year, T the move the cell stored next year
//   widening  one step from a move: L one spending level either way, V every spending level, R one tier step either way,
//             O one draw-order step either way, H the same draw order's other re-wraps, E every move (the identity
//             test's); `none` for none
//   extras    h<rounds> climb: the sources are scored, then for that many rounds each layer's best move so far is widened
//             and the new moves scored (without it every source move is widened once);
//             q<na>x<nb>x<nz> the bridge reference's lattice (the candidate's is 80x21x64 since D73; 160x41x128 before);
//             nomemo the repeat-move rule left out; any other word a plant's name (staleflow, posonly, nocopy)
//   `off`     the solve as it is (off-x-x-q80x21x64: the solve as it is on a thinner bridge reference)
export function parseConfig(c) {
  if (c === 'off') return { coarse: null, lattice: null };
  const [g, src, ex, ...extras] = c.split('-'), m = /^w(\d)a(\d)b(\d)(?:g(\d)c(\d))?$/.exec(g);
  if (g !== 'off' && !m) throw new Error(`not a setting: ${c}`);
  const coarse = g === 'off' ? null : { w: +m[1], a: +m[2], b: +m[3], g: +(m[4] || 1), c: +(m[5] || 1), src, expand: ex === 'none' ? '' : ex, plant: '' };
  let lattice = null;
  for (const x of extras) {
    const q = /^q(\d+)x(\d+)x(\d+)$/.exec(x);
    if (q) lattice = { na: +q[1], nb: +q[2], nz: +q[3], foot: true, stepAll: true };
    else if (/^h\d$/.test(x)) coarse.climb = +x.slice(1);
    else if (x === 'nomemo') coarse.memo = false;
    else coarse.plant = x;
  }
  return { coarse, lattice };
}
// the research options a setting adds to a solve (light: the small reference lattice the 4-point checks use)
// since D73 the candidate carries `coarse`: no setting, or `off`, takes it out (coarse undefined), so the solve is the one without it
export const researchOf = (cfg, light = {}) => ({ ...light, ...(cfg && cfg.lattice ? { adaptiveLattice: cfg.lattice } : {}), coarse: cfg && cfg.coarse ? cfg.coarse : undefined });
