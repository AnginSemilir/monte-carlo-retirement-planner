/*
 * TEST K, THE READ (SAVE-K.md, its rule committed before any unit ran; D137 (4); read once). EXPLORATORY.
 * The gate first: every unit there (the 30 employees and the control); one stamp (the read's code, the tree's audit stamp,
 * this test's files, one Node); seed 7025, 4,000 paths, 45 points, estate weight 0.02; each employee's identity held again
 * here from the arrays (CANDDA-T's first 500 paths against the registered CANDDA's, its digest and settings line), and the
 * control's (S280's CANDSA-T against its registered CANDSA on all 4,000 paths); each employee's CANDSA-T at the registered
 * CANDSA's configuration and settings line; the groups a partition of the panel's employees, each salary on its side of its
 * region's higher-rate threshold. Then K, its outcome as SAVE-K.md rules it in advance (D137 (4)), and what is printed beside.
 *   node research/solver/reduce-save-k.mjs [dir] [tree] > research/solver/results-save-k.txt   (the tree: the units' own, unless given)
 *   node research/solver/reduce-save-k.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { byPath, Z } from './reduce-phase4.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { KEYS } from './audit-save-v2.mjs';
import { GROUPS, EMPLOYEES, CONTROL, UNITS, TREE_CODE, TREE_AUDIT, SEED, IDENT, kStamp, dec, readRegistered, differs, anyDiffer } from './save-k.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N = 4000, PTS = 45, W = 0.02, BAR_HIGH = 0.85, BAR_LOW = 0.33, FROM_YEAR = 2029, LATE = 5;
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const pct = (k, n) => (n ? `${(100 * k / n).toFixed(1)}%` : '-');
const mean = x => { let s = 0; for (let i = 0; i < x.length; i++) s += x[i]; return s / x.length; };
function cov(x, y) { const mx = mean(x), my = mean(y); let s = 0; for (let i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my); return s / (x.length - 1); }

/* each path's survival change, X against D, averaged over the households (reduce-phase4.mjs survivalItem's series) */
export function pathSeries(pairs, n) {
  const x = new Float64Array(n);
  for (const [c, o] of pairs) for (let i = 0; i < n; i++) x[i] += 100 * (c.survived[i] - o.survived[i]) / pairs.length;
  return x;
}
/* K = mean(a) / mean(b), its 95% interval by the delta method on the two paired series; a denominator at or below nought is
   refused */
export function ratio(a, b) {
  const n = a.length, A = mean(a), B = mean(b);
  if (!(B > 0)) return { refused: `the gain it is a share of is ${B} points, not above nought`, A, B };
  const K = A / B, v = (cov(a, a) - 2 * K * cov(a, b) + K * K * cov(b, b)) / n / (B * B), se = Math.sqrt(Math.max(0, v));
  return { K, A, B, se, d: K, lo: K - Z * se, hi: K + Z * se };
}
/* K2 less K1, its 95% interval by the delta method on the four paired series */
export function ratioDiff(a1, b1, a2, b2) {
  const n = a1.length, A1 = mean(a1), B1 = mean(b1), A2 = mean(a2), B2 = mean(b2), K1 = A1 / B1, K2 = A2 / B2;
  const g = [-1 / B1, A1 / (B1 * B1), 1 / B2, -A2 / (B2 * B2)], S = [a1, b1, a2, b2];
  let v = 0;
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) v += g[i] * g[j] * cov(S[i], S[j]) / n;
  const d = K2 - K1, se = Math.sqrt(Math.max(0, v));
  return { d, se, lo: d - Z * se, hi: d + Z * se, K1, K2 };
}
/* the outcome (SAVE-K.md, ruled in advance by D137 (4)): the bars on the point estimates, a value at a bar reaching it */
export function outcomeOf(K, Kbasic, gainLo) {
  if (K >= BAR_HIGH && Kbasic >= BAR_HIGH) return 'THE CAUSE FAILS';
  if (K >= BAR_LOW && gainLo > 0) return 'THE CAUSE HOLDS IN SIZE';
  return 'THE GAIN IS MOSTLY THE PRICE';
}
export const DECIDES = {
  'THE CAUSE FAILS': 'the change of default goes ahead as the PASS has it, with ISA first held back for an employee (D137 (4)); its D-line says the gain holds on income tax relief alone, so the 2029 cap and the non-sacrificer are measured, not inferred',
  'THE CAUSE HOLDS IN SIZE': 'the change of default goes with the law\'s price in the split\'s two routes (D134 (3)\'s cap brought forward for saveSplitRoutes), with its test; its D-line gives both figures; whether the app asks how an employee pays in goes to the maintainer',
  'THE GAIN IS MOSTLY THE PRICE': 'the change of default is held for employees and comes back to the maintainer; the self-employed\'s part may go alone, on the maintainer\'s word',
};

/* the test's units, their arms' arrays decoded */
export function loadK(dir) {
  return readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => {
    const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString());
    for (const a of Object.keys(U.arms)) for (const [k, Ty] of Object.entries(KEYS)) U.arms[a][k] = dec(U.arms[a][k], Ty);
    return U;
  });
}

/* the gate: refusals, each a line. `reg` the registered units by id; `want` the stamp the files give now */
export function gate(units, reg, want) {
  const P = [], byId = Object.fromEntries(units.map(u => [u.id, u]));
  for (const id of UNITS) if (!byId[id]) P.push(`${id}: missing`);
  for (const u of units) if (!UNITS.includes(u.id)) P.push(`${u.id}: not a household of the test`);
  if (new Set(units.map(u => u.id)).size !== units.length) P.push('a household twice');
  const one = (what, g) => { const vs = [...new Set(units.map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('tree audit', u => u.stamp.treeAudit); one('k stamp', u => u.stamp.k); one('Node version', u => u.stamp.node); one('tree', u => u.stamp.tree);
  for (const u of units) {
    const tag = u.id;
    if (u.stamp.code !== TREE_CODE) P.push(`${tag}: code ${u.stamp.code}, not the read's ${TREE_CODE}`);
    if (u.stamp.treeAudit !== TREE_AUDIT) P.push(`${tag}: the tree's audit stamp ${u.stamp.treeAudit}, not the registered run's ${TREE_AUDIT}`);
    if (u.stamp.k !== want.k) P.push(`${tag}: run on this test's files at ${u.stamp.k}, not on them as they are (${want.k})`);
    if (u.smoke) P.push(`${tag}: a smoke unit`);
    if (u.seed !== SEED || u.N !== N || u.pts !== PTS || u.W !== W) P.push(`${tag}: seed ${u.seed}, ${u.N} paths, ${u.pts} points, weight ${u.W}; not ${SEED}, ${N}, ${PTS}, ${W}`);
    const R = reg[u.id];
    if (!R) { P.push(`${tag}: no registered unit`); continue; }
    const want2 = u.id === CONTROL ? ['CANDSA-T'] : ['CANDDA-T', 'CANDSA-T'];
    for (const a of want2) if (!u.arms[a]) P.push(`${tag}: ${a} missing`);
    if (want2.some(a => !u.arms[a])) continue;
    const S = u.arms['CANDSA-T'];
    if (S.config !== R.arms.CANDSA.config) P.push(`${tag}: CANDSA-T's configuration ${S.config}, not the registered CANDSA's ${R.arms.CANDSA.config}`);
    if (S.settings !== R.arms.CANDSA.settings) P.push(`${tag}: CANDSA-T's settings line is not the registered CANDSA's`);
    if (S.n !== N || Object.keys(KEYS).some(k => !S[k] || S[k].length !== N)) P.push(`${tag}: CANDSA-T not ${N} paths, every array one a path`);
    if (u.id === CONTROL) {
      // the control: its CANDSA-T the registered CANDSA, the digest and every array on every path
      if (S.digest !== R.arms.CANDSA.digest) P.push(`${tag} (the control): CANDSA-T's table digest is not the registered CANDSA's`);
      const D = differs(S, R.arms.CANDSA, N, KEYS);
      if (anyDiffer(D)) P.push(`${tag} (the control): CANDSA-T differs from the registered CANDSA on its ${N} paths (${JSON.stringify(D)})`);
    } else {
      // the identity: CANDDA-T the registered CANDDA, its digest, its settings line and every array on its first IDENT paths
      const I = u.arms['CANDDA-T'];
      if (I.config !== R.arms.CANDDA.config) P.push(`${tag}: CANDDA-T's configuration ${I.config}, not the registered CANDDA's`);
      if (I.digest !== R.arms.CANDDA.digest) P.push(`${tag} (the identity): CANDDA-T's table digest is not the registered CANDDA's`);
      if (I.settings !== R.arms.CANDDA.settings) P.push(`${tag} (the identity): CANDDA-T's settings line is not the registered CANDDA's`);
      if (I.n !== IDENT) P.push(`${tag} (the identity): ${I.n} paths, not ${IDENT}`);
      else { const D = differs(I, R.arms.CANDDA, IDENT, KEYS); if (anyDiffer(D)) P.push(`${tag} (the identity): CANDDA-T differs from the registered CANDDA on its first ${IDENT} paths (${JSON.stringify(D)})`); }
      if (!u.employed) P.push(`${tag}: not an employee`);
    }
    if (R.arms.CANDDA.n < N || R.arms.CANDSA.n < N) P.push(`${tag}: the registered anchors arms ran fewer than ${N} paths`);
  }
  // the groups: a partition of the panel's employees, each salary on its side of its region's higher-rate threshold
  const emp = units.filter(u => u.id !== CONTROL);
  const inGroups = new Set(EMPLOYEES);
  if (inGroups.size !== EMPLOYEES.length || EMPLOYEES.length !== 30) P.push(`the groups hold ${EMPLOYEES.length} places for ${inGroups.size} households, not 30`);
  for (const u of emp) {
    const g = Object.keys(GROUPS).find(k => GROUPS[k].includes(u.id));
    if (!g) { P.push(`${u.id}: in no group`); continue; }
    const higher = u.salary > u.higherFrom;
    if ((g === 'higher') !== higher) P.push(`${u.id}: in the ${g} group, its salary ${u.salary} ${higher ? 'above' : 'at or below'} its region's higher-rate threshold ${u.higherFrom}`);
  }
  return P;
}

/* the read: K, its groups, the gain itself and what is printed beside it (lines, so a planted case can read them) */
export function report(units, reg, N = 4000) {
  const out = [], log = x => out.push(x), byId = Object.fromEntries(units.map(u => [u.id, u]));
  const series = (ids, arm) => pathSeries(ids.map(id => [arm === 'T' ? byId[id].arms['CANDSA-T'] : reg[id].arms.CANDSA, reg[id].arms.CANDDA]), N);
  const all = EMPLOYEES, aAll = series(all, 'T'), bAll = series(all, 'S');
  const Kall = ratio(aAll, bAll);
  const gainS = byPath(all.map(id => i => 100 * (reg[id].arms.CANDSA.survived[i] - reg[id].arms.CANDDA.survived[i])), N);
  const gainT = byPath(all.map(id => i => 100 * (byId[id].arms['CANDSA-T'].survived[i] - reg[id].arms.CANDDA.survived[i])), N);
  const tLessS = byPath(all.map(id => i => 100 * (byId[id].arms['CANDSA-T'].survived[i] - reg[id].arms.CANDSA.survived[i])), N);
  const G = Object.fromEntries(Object.keys(GROUPS).map(g => [g, { a: series(GROUPS[g], 'T'), b: series(GROUPS[g], 'S') }]));
  const Kg = Object.fromEntries(Object.keys(GROUPS).map(g => [g, ratio(G[g].a, G[g].b)]));
  log(`\nTHE GAIN, pooled survival by path over the ${all.length} employees, points (each path's change averaged over the households; ${N} paths of seed ${SEED}):`);
  log(`  CANDSA less CANDDA, the registered pair on anchors: ${iv(gainS)}`);
  log(`  CANDSA-T less CANDDA, the split at income tax relief alone: ${iv(gainT)}`);
  log(`  CANDSA-T less CANDSA: ${iv(tLessS)}`);
  if (Kall.refused) { log(`\nK: REFUSED: ${Kall.refused}`); log('OUTCOME: NONE: K cannot be read; to the maintainer'); return { lines: out, outcome: 'NONE' }; }
  log(`\nK, the share of the gain left at that price, (CANDSA-T less CANDDA) over (CANDSA less CANDDA), its 95% interval by the delta method: ${Kall.K.toFixed(3)} (${Kall.lo.toFixed(3)} to ${Kall.hi.toFixed(3)})`);
  const gname = { basic: `the ${GROUPS.basic.length} basic-rate employees outside the three`, higher: `the ${GROUPS.higher.length} higher-rate employees`, three: `the three that save ISA first most (${GROUPS.three.join(', ')})` };
  for (const g of ['basic', 'higher', 'three']) {
    const k = Kg[g];
    log(`  K for ${gname[g]}: ${k.refused ? `REFUSED (${k.refused})` : `${k.K.toFixed(3)} (${k.lo.toFixed(3)} to ${k.hi.toFixed(3)}); the gain CANDSA less CANDDA ${f3(k.B)}, CANDSA-T less CANDDA ${f3(k.A)}`}`);
  }
  const sig = !Kg.basic.refused && !Kg.higher.refused ? ratioDiff(G.basic.a, G.basic.b, G.higher.a, G.higher.b) : null;
  if (sig) log(`  the higher-rate group's K less the basic-rate group's: ${f3(sig.d)} (${f3(sig.lo)} to ${f3(sig.hi)}): ${sig.lo > 0 ? 'the basic-rate group\'s K below the higher-rate group\'s beyond its noise: the cause\'s signature' : 'not beyond its noise: no signature'}`);
  const Kb = Kg.basic.refused ? NaN : Kg.basic.K, outcome = outcomeOf(Kall.K, Kb, gainT.lo);
  log(`\nTHE RULE (SAVE-K.md; D137 (4)): K ${Kall.K.toFixed(3)} and the basic-rate group's K ${Number.isFinite(Kb) ? Kb.toFixed(3) : 'unread'} against ${BAR_HIGH}; K against ${BAR_LOW}, with CANDSA-T's gain over CANDDA ${gainT.lo > 0 ? 'beyond noise (its lower end above nought)' : 'not beyond noise'}`);
  log(`OUTCOME: ${outcome}: ${DECIDES[outcome]}${outcome === 'THE CAUSE HOLDS IN SIZE' ? (sig && sig.lo > 0 ? '; the signature printed above' : '; without the signature (the basic-rate group\'s K not below the higher-rate group\'s beyond its noise), which the report says') : ''}`);
  log('\nWhat the cause predicts (the deep review): the basic-rate group keeps about half or less, the higher-rate about nine-tenths, the three more than all, pooled about 0.7; the plans\' shape instead: every group nine-tenths or more.');
  // beside, deciding nothing
  log('\nBESIDE, DECIDING NOTHING:');
  log('  by household, survival points over its paths (saved / lost against CANDDA): CANDSA less CANDDA | CANDSA-T less CANDDA');
  const cnt = (X, D) => { let s = 0, l = 0; for (let i = 0; i < N; i++) { if (X.survived[i] && !D.survived[i]) s++; else if (D.survived[i] && !X.survived[i]) l++; } return { s, l, d: 100 * (s - l) / N }; };
  for (const g of ['basic', 'higher', 'three']) for (const id of GROUPS[g]) {
    const u = byId[id], R = reg[id], cs = cnt(R.arms.CANDSA, R.arms.CANDDA), ct = cnt(u.arms['CANDSA-T'], R.arms.CANDDA);
    log(`    ${id.padEnd(6)} ${g.padEnd(6)} £${u.salary} ${u.region.padEnd(8)} ${f3(cs.d)} (${cs.s} / ${cs.l}) | ${f3(ct.d)} (${ct.s} / ${ct.l})`);
  }
  // the save each working year's move takes from 2029, runPolicy's first paths: the registered CANDSA's and CANDSA-T's
  const saves = (ids, pick) => { const c = [0, 0, 0]; for (const id of ids) { const A = pick(id), B = A.beside, nw = B.years, sv = dec(B.save, Uint8Array); for (let k = 0; k < B.N; k++) for (let d = 0; d < nw; d++) if (A.baseYear + A.workT[d] >= FROM_YEAR) c[sv[k * nw + d]]++; } return c; };
  const sLine = c => { const n = c[0] + c[1] + c[2]; return `the plan's own ${pct(c[0], n)}, the pension first ${pct(c[1], n)}, the ISA first ${pct(c[2], n)} of ${n}`; };
  log(`  the save of the working-year decisions from ${FROM_YEAR} (runPolicy's first paths):`);
  for (const [g, ids] of [['all 30', all], ...['basic', 'higher', 'three'].map(g => [g, GROUPS[g]])]) {
    log(`    ${g}: CANDSA ${sLine(saves(ids, id => ({ ...reg[id].arms.CANDSA, baseYear: reg[id].arms.CANDSA.baseYear })))} | CANDSA-T ${sLine(saves(ids, id => byId[id].arms['CANDSA-T']))}`);
  }
  // the tier step below the plan's tiers in the last LATE working years, by each index's tier name (save-k.mjs tierNames)
  const step = (u, A) => {
    const B = A.beside, nw = B.years, tp = dec(B.tierPen, Uint8Array), ti = dec(B.tierIsa, Uint8Array), names = u.arms['CANDSA-T'].tierNames, ord = u.TIER_ORDER;
    const of = (list, idx) => (list[0] && list[idx] ? ord.indexOf(list[idx]) - ord.indexOf(list[0]) : null);
    let s = 0, m = 0;
    for (let k = 0; k < B.N; k++) for (let d = Math.max(0, nw - LATE); d < nw; d++) { for (const v of [of(names.pen, tp[k * nw + d]), of(names.isa, ti[k * nw + d])]) if (v !== null) { s += v; m++; } }
    return m ? s / m : NaN;
  };
  log(`  the mean tier step below the plan's tiers in the last ${LATE} working years (a step a tier; above the plan's tiers counted below nought), runPolicy's first paths: CANDDA | CANDSA | CANDSA-T`);
  for (const g of ['basic', 'higher', 'three']) {
    const v = arm => GROUPS[g].map(id => step(byId[id], arm === 'T' ? byId[id].arms['CANDSA-T'] : reg[id].arms[arm])), m3 = x => mean(Float64Array.from(x)).toFixed(2);
    log(`    ${g}: ${m3(v('CANDDA'))} | ${m3(v('CANDSA'))} | ${m3(v('T'))}`);
  }
  // the kind of failure of the paths saved and lost against CANDDA: running out, or every year paid and the pot ending below
  const kinds = pick => { const k = { saved: { out: 0, pot: 0 }, lost: { out: 0, pot: 0 } }; for (const id of all) { const X = pick(id), D = reg[id].arms.CANDDA; for (let i = 0; i < N; i++) { if (X.survived[i] && !D.survived[i]) k.saved[D.unmet[i] > 0 ? 'out' : 'pot']++; else if (D.survived[i] && !X.survived[i]) k.lost[X.unmet[i] > 0 ? 'out' : 'pot']++; } } return k; };
  const kLine = k => `saved ${k.saved.out + k.saved.pot} (${k.saved.out} running out, ${k.saved.pot} the pot below the minimum), lost ${k.lost.out + k.lost.pot} (${k.lost.out}, ${k.lost.pot})`;
  log(`  the paths saved and lost against CANDDA over the 30, by the failing arm's kind of failure: CANDSA ${kLine(kinds(id => reg[id].arms.CANDSA))}; CANDSA-T ${kLine(kinds(id => byId[id].arms['CANDSA-T']))}`);
  const med = xs => { const s = [...xs].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
  log(`  the times (a guide, four units at a time): CANDSA-T's solve the median ${med(all.map(id => byId[id].arms['CANDSA-T'].solveSecs)).toFixed(0)} s against the registered CANDSA's ${med(all.map(id => reg[id].arms.CANDSA.solveSecs)).toFixed(0)} s; a path ${med(all.map(id => byId[id].arms['CANDSA-T'].cpuUs / 1e3 / N)).toFixed(1)} ms against ${med(all.map(id => reg[id].arms.CANDSA.cpuUs / 1e3 / reg[id].arms.CANDSA.n)).toFixed(1)} ms`);
  return { lines: out, outcome, K: Kall, Kg, sig, gainT, gainS };
}

function planted() {
  const cases = [], n = 1000;
  const arm = (surv, extra = {}) => ({ survived: Uint8Array.from(surv), delivered: new Float64Array(n), pot: new Float64Array(n), tax: new Float64Array(n), estate: new Float64Array(n), failYear: new Int16Array(n), unmet: new Float64Array(n), ...extra });
  const D = arm(Array(n).fill(0)), S = arm(Array.from({ length: n }, (_, i) => (i < 100 ? 1 : 0))), H = arm(Array.from({ length: n }, (_, i) => (i < 50 ? 1 : 0)));
  const r = (x, y) => ratio(pathSeries([[x, D]], n), pathSeries([[y, D]], n));
  const half = r(H, S), whole = r(S, S), none = r(D, S);
  cases.push(['K\'s arithmetic: half the gained paths, all of them, none', `${half.K} ${whole.K} ${none.K}`, '0.5 1 0']);
  cases.push(['the split at the registered price exactly: K 1 with no spread', `${whole.se}`, '0']);
  { const a = pathSeries([[H, D]], n), b = pathSeries([[S, D]], n), k = half.K, e = Float64Array.from(a, (v, i) => v - k * b[i]);
    cases.push(['the delta interval as the residual\'s spread over the gain', `${Math.abs(half.se - Math.sqrt(cov(e, e) / n) / half.B) < 1e-12}`, 'true']); }
  cases.push(['a gain at or below nought refused', `${!!r(H, D).refused} ${!!r(H, arm(Array.from({ length: n }, (_, i) => (i < 100 ? 0 : 0)))).refused}`, 'true true']);
  { const d = ratioDiff(pathSeries([[H, D]], n), pathSeries([[S, D]], n), pathSeries([[S, D]], n), pathSeries([[S, D]], n));
    cases.push(['the groups\' difference: 1 less 0.5', `${d.d}`, '0.5']); }
  const o = (...x) => outcomeOf(...x);
  cases.push(['the outcomes at their bars', [o(0.9, 0.9, 0.1), o(0.85, 0.85, -1), o(0.9, 0.84, 0.1), o(0.5, 0.5, 0.1), o(0.33, 0.1, 0.01), o(0.5, 0.5, -0.01), o(0.5, 0.5, 0), o(0.329, 0.9, 0.5)].join(' | '),
    ['THE CAUSE FAILS', 'THE CAUSE FAILS', 'THE CAUSE HOLDS IN SIZE', 'THE CAUSE HOLDS IN SIZE', 'THE CAUSE HOLDS IN SIZE', 'THE GAIN IS MOSTLY THE PRICE', 'THE GAIN IS MOSTLY THE PRICE', 'THE GAIN IS MOSTLY THE PRICE'].join(' | ')]);
  // the gate on planted units: clean, then each fault named
  // every array of a planted arm at its own length (the registered arms' and the split's N, the identity's IDENT)
  const arrs = len => Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(len)]));
  const mk = () => {
    const reg = {}, units = [];
    for (const id of UNITS) {
      const sal = GROUPS.higher.includes(id) ? 80000 : 30000;
      reg[id] = { arms: { CANDDA: { ...arrs(N), n: N, config: 'd', settings: 'sd', digest: 'gd' }, CANDSA: { ...arrs(N), n: N, config: 'a', settings: 'sa', digest: 'ga' } } };
      const kArm = (nn, o2) => ({ ...arrs(nn), n: nn, ...o2 });
      const arms = id === CONTROL ? { 'CANDSA-T': kArm(N, { config: 'a', settings: 'sa', digest: 'ga' }) } : { 'CANDDA-T': kArm(IDENT, { config: 'd', settings: 'sd', digest: 'gd' }), 'CANDSA-T': kArm(N, { config: 'a', settings: 'sa', digest: 'gx' }) };
      units.push({ id, employed: id !== CONTROL, salary: sal, higherFrom: 50270, seed: SEED, N, pts: PTS, W, smoke: false, stamp: { code: TREE_CODE, treeAudit: TREE_AUDIT, k: 'kk', node: 'v' }, arms });
    }
    return { units, reg };
  };
  { const { units, reg } = mk(); cases.push(['the gate on clean planted units', gate(units, reg, { k: 'kk' }).join('; ') || 'fair', 'fair']); }
  const faults = [
    ['the identity one path apart', x => { x.units.find(u => u.id === 'S180').arms['CANDDA-T'].survived[7] = 1; }, /S180 \(the identity\): CANDDA-T differs/],
    ['the identity\'s digest', x => { x.units.find(u => u.id === 'S180').arms['CANDDA-T'].digest = 'zz'; }, /S180 \(the identity\): CANDDA-T's table digest/],
    ['the control one path apart', x => { x.units.find(u => u.id === CONTROL).arms['CANDSA-T'].tax[3999] = 1; }, /the control\): CANDSA-T differs/],
    ['a unit missing', x => { x.units = x.units.filter(u => u.id !== 'S300F'); }, /S300F: missing/],
    ['another code', x => { x.units[0].stamp.code = 'other'; }, /more than one code/],
    ['the split at another configuration', x => { x.units.find(u => u.id === 'S248').arms['CANDSA-T'].config = 'b'; }, /S248: CANDSA-T's configuration/],
    ['a salary on the wrong side of its threshold', x => { x.units.find(u => u.id === 'S212').salary = 40000; }, /S212: in the higher group/],
    ['a smoke unit', x => { x.units[2].smoke = true; }, /a smoke unit/],
  ];
  const missed = faults.filter(([, f, re]) => { const x = mk(); f(x); return !gate(x.units, x.reg, { k: 'kk' }).some(p => re.test(p)); }).map(([nm]) => nm);
  cases.push([`each fault in the gate named (${faults.length})`, missed.join(', ') || 'all named', 'all named']);
  cases.push(['the groups: 3, 13 and 14, the control apart, 31 units', `${GROUPS.three.length} ${GROUPS.basic.length} ${GROUPS.higher.length} ${UNITS.length} ${UNITS.includes(CONTROL) && !EMPLOYEES.includes(CONTROL)}`, '3 13 14 31 true']);
  let bad = 0;
  for (const [nm, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit(planted() ? 1 : 0);
  if (args[0] === '--smoke') {
    // the machinery end to end on the smoke's files (light settings, seed 7002): no registered arrays exist at those settings,
    // so the smoke's own arms stand in: its CANDSA-T for CANDSA, and its CANDDA-T for CANDDA with every path failed, so the gain
    // is above nought and every part of the report runs (K reads 1 by construction); no figure is read
    const units = loadK(args[1] || join(HERE, 'results', 'save-k-smoke')), n = units[0].N, reg = {};
    for (const u of units) if (u.arms['CANDDA-T']) reg[u.id] = { arms: { CANDDA: { ...u.arms['CANDDA-T'], survived: new Uint8Array(n), beside: u.arms['CANDSA-T'].beside }, CANDSA: u.arms['CANDSA-T'] } };
    const P = gate(units, Object.fromEntries(units.map(u => [u.id, reg[u.id] || { arms: { CANDSA: u.arms['CANDSA-T'], CANDDA: u.arms['CANDSA-T'] } }])), { k: kStamp() });
    console.log(`THE SMOKE (machinery only, no read): ${units.length} units on ${n} paths; the gate refuses it, as it must (${P.length} lines, the first: ${P[0] || 'none'})`);
    const R = report(units, reg, n);
    console.log(`the report ran end to end: ${R.lines.length} lines; K ${R.K && R.K.K !== undefined ? R.K.K.toFixed(3) : 'refused'} (1 by construction); the outcome line: ${R.lines.find(l => l.startsWith('OUTCOME')) || 'none'}`);
    process.exit(units.length === UNITS.length && R.lines.length > 20 ? 0 : 1);
  }
  const dir = args[0] || join(HERE, 'results', 'save-k-7025');
  if (!existsSync(dir)) { console.error(`reduce-save-k: no ${dir}`); process.exit(2); }
  // the read's tree: as given, else the one every unit was run from (its stamp; the gate holds them to one)
  const units = loadK(dir), tree = args[1] || (units[0] && units[0].stamp.tree);
  if (!tree || !existsSync(join(tree, 'research/solver/results/save-v2-run'))) { console.error(`reduce-save-k: the read's tree ${tree} holds no registered units`); process.exit(2); }
  const reg = Object.fromEntries(UNITS.map(id => [id, readRegistered(tree, id, KEYS)]));
  console.log('TEST K (EXPLORATORY; SAVE-K.md, D137 (4)): the employees\' split at income tax relief alone (employmentSelf set to self-employed), against the registered anchors pair of the savings split\'s v2');
  // the fair-test gate on the registered run the test reads its CANDDA and CANDSA from (its launch logs in the tree, under its
  // registration as it stands), as the share replay's read does (D110's form); this test's own stamps are held one in gate()
  const RUN = join(tree, 'research/solver/results/save-v2-run'), logs = existsSync(RUN) ? Object.fromEntries(readdirSync(RUN).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(RUN, x), 'utf8')])) : {};
  requireFairLogs(logs, 'research/solver/registrations/save-v2.md');
  console.log(`the registered run it reads: its ${Object.keys(logs).length} launch logs stamped under research/solver/registrations/save-v2.md as it stands (fair-gate.mjs requireFairLogs)`);
  const P = gate(units, reg, { k: kStamp() });
  if (P.length) { console.log('THE GATE: REFUSED (a STOP: nothing is read)'); for (const p of P) console.log(`  ${p}`); process.exit(3); }
  const s = units[0].stamp;
  console.log(`THE GATE: fair - ${units.length} units (${EMPLOYEES.length} employees and the control ${CONTROL}), seed ${SEED}, ${N} paths, ${PTS} points, weight ${W}; one stamp: code ${s.code}, the tree's audit ${s.treeAudit}, k ${s.k}, Node ${s.node}; the identity on ${EMPLOYEES.length} of ${EMPLOYEES.length} employees (the table digest, the settings line and every array on the first ${IDENT} paths the registered CANDDA's); the control ${CONTROL}'s CANDSA-T the registered CANDSA (the digest, the settings line and every array on all ${N} paths)`);
  const R = report(units, reg);
  for (const l of R.lines) console.log(l);
}
