/*
 * THE SHARE REPLAY, THE READ (D110; research/solver/SHARE-REPLAY.md, its rule committed before the run). EXPLORATORY.
 * Reads share-replay.mjs's eleven files (results/share-replay/<unit>-<rule>.json.gz): first the gate (every comparison, one
 * code, the read's, seed 7023, its paths, top six, no smoke, each category replayed as the caps say); then the fair-test gate
 * on the runs the replay starts from (fair-gate.mjs requireFairLogs on the registered run's logs in the tree the files name,
 * under the registration, as the share rules' read called it: the replay's X and T match those runs to the bit, and its
 * variants run in the same process on the same paths); then the rule.
 *
 * The measure: a variant V's recovery, pooled over the ten flagged comparisons (the mirror apart): the rule's lost paths V
 * keeps, less the saved and the both-keep paths it loses, each category scaled from the paths replayed to its whole count in
 * the arm's 16,000 (gainOf), over the rule's lost paths. The mechanism, on the replayed lost paths: in the five years before
 * the failure (the failure year itself left out), a year in which the household draws, a person funding at least half the
 * draw (by the split; both at an even split) reads their own position at 0.98 or more or 0.02 or less, and TODAY's policy at
 * that state picks a lower level than the rule's (mechanismOf). The equity: over the same years, the rule's tiers against
 * TODAY's at the same states, by their place in TIER_ORDER (equityOf: above nought, the rule holds more equity).
 * The outcome (outcomeOf), the first that holds:
 *   1. L recovers half or more and the mechanism shows on more than half the lost paths: THE CAUSE HOLDS, with TK naming it:
 *      TK recovering half or more, THE LEVELS ON OFFER; under half, THE PRICING;
 *   2. R recovers half or more, L and TK each under a quarter, and the rule holds more equity: THE RISK RIVAL;
 *   3. S recovers half or more: THE SPLIT;
 *   4. L recovers half or more, the mechanism not shown: THE LEVEL, ITS MECHANISM NOT SHOWN;
 *   5. no variant recovers a quarter: NO PART RECOVERS A QUARTER;
 *   6. otherwise: MIXED.
 * Beside, deciding nothing: each comparison's counts and gains; the mirror (which part's loss takes S147-db's gain away);
 * the lost paths by kind; the funding check on the failing years; the year the two arms' moves first part.
 *   node research/solver/reduce-share-replay.mjs [dir] > research/solver/results-share-replay.txt
 *   node research/solver/reduce-share-replay.mjs --planted          (REDUCE_SHARE_REPLAY_PLANT=window or unscaled: it fails)
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMPARISONS, CAPS, RUNS, REC_FIELDS, TOPK } from './share-replay.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
export const CODE = 'c0dcfa9ef2f2', SEED = 7023, N_UNIT = 16000, HALF = 0.5, QUARTER = 0.25, READ_HI = 0.98, READ_LO = 0.02, WINDOW = 5;
export const VARIANTS = ['L', 'R', 'S', 'TK'];
// plants (REDUCE_SHARE_REPLAY_PLANT), each failing the planted suite: 'window' (the failure year in the window), 'unscaled'
const PLANT = process.env.REDUCE_SHARE_REPLAY_PLANT || '';
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const dec = (b64, C) => { const b = Buffer.from(b64, 'base64'), c = new Uint8Array(b.length); c.set(b); return new C(c.buffer, 0, b.length / C.BYTES_PER_ELEMENT); };
export function load(dir) {
  const out = {};
  for (const x of readdirSync(dir).filter(x => /\.json\.gz$/.test(x))) {
    const r = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString());
    const runs = Object.fromEntries(Object.entries(r.runs).map(([k, v]) => [k, { survived: dec(v.survived, Uint8Array), failYear: dec(v.failYear, Int16Array), wealth: dec(v.wealth, Float32Array), unmet: dec(v.unmet, Float32Array) }]));
    out[`${r.rule} ${r.unit}`] = { ...r, runs, rec: { X: dec(r.rec.X, Float32Array), T: dec(r.rec.T, Float32Array) } };
  }
  return out;
}
/* the gate: refusals, each a line */
export function gate(D) {
  const P = [], want = COMPARISONS.map(([r, u]) => `${r} ${u}`);
  for (const k of want) if (!D[k]) P.push(`${k}: missing`);
  for (const k of Object.keys(D)) if (!want.includes(k)) P.push(`${k}: not a comparison of the rule`);
  for (const [k, c] of Object.entries(D)) {
    if (c.smoke) P.push(`${k}: a smoke run`);
    if (c.code !== CODE) P.push(`${k}: code ${c.code}, not the read's ${CODE}`);
    if (c.seed !== SEED || c.N !== N_UNIT) P.push(`${k}: seed ${c.seed}, ${c.N} paths, not ${SEED} and ${N_UNIT}`);
    if (c.topK !== TOPK) P.push(`${k}: top ${c.topK}, not ${TOPK}`);
    for (const cat of ['lost', 'saved', 'ctrl']) if (c.idx[cat].length !== Math.min(CAPS[cat], c.pop[cat])) P.push(`${k}: ${c.idx[cat].length} ${cat} replayed, not ${Math.min(CAPS[cat], c.pop[cat])}`);
    if (c.order.length !== c.idx.lost.length + c.idx.saved.length + c.idx.ctrl.length) P.push(`${k}: the order is not the categories'`);
    for (const r of RUNS) if (!c.runs[r] || c.runs[r].survived.length !== c.order.length) P.push(`${k}: run ${r} missing or short`);
    if (c.fields.join() !== REC_FIELDS.join()) P.push(`${k}: the record's fields are not the replay's`);
  }
  const one = (what, g) => { const vs = [...new Set(Object.values(D).map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('tree', c => c.tree); one('Node version', c => c.node);
  return P;
}
/* a variant's gain on one comparison, in paths of the arm's whole run: lost kept, less saved and both-keep paths lost */
export function gainOf(c, v) {
  const n = { lost: 0, saved: 0, ctrl: 0 }, k = { lost: 0, saved: 0, ctrl: 0 };
  c.order.forEach(([cat], i) => { n[cat]++; if (c.runs[v].survived[i]) k[cat]++; });
  const sc = cat => (n[cat] ? (PLANT === 'unscaled' ? 1 : c.pop[cat] / n[cat]) : 0);
  return { n, k, gain: sc('lost') * k.lost - sc('saved') * (n.saved - k.saved) - sc('ctrl') * (n.ctrl - k.ctrl) };
}
const at = (c, run, i, t, field) => c.rec[run][(i * c.Y + t) * REC_FIELDS.length + REC_FIELDS.indexOf(field)];
/* the years of a lost path's window: the five before its failure year under the rule (X) */
const windowOf = (c, i) => { const fy = c.runs.X.failYear[i], lo = Math.max(0, fy - WINDOW), hi = PLANT === 'window' ? fy + 1 : fy; return Array.from({ length: Math.max(0, hi - lo) }, (_, j) => lo + j); };
export function mechanismOf(c) {
  let paths = 0, shown = 0;
  c.order.forEach(([cat], i) => {
    if (cat !== 'lost') return;
    paths++;
    const hit = windowOf(c, i).some(t => {
      const draw = at(c, 'X', i, t, 'draw'), sp = at(c, 'X', i, t, 'split'), ra = at(c, 'X', i, t, 'readA'), rb = at(c, 'X', i, t, 'readB');
      const extreme = r => r >= READ_HI || r <= READ_LO;
      const funder = (sp > 0.5 && extreme(ra)) || (sp < 0.5 && extreme(rb)) || (sp === 0.5 && (extreme(ra) || extreme(rb)));
      return draw > 0 && funder && at(c, 'X', i, t, 'oLevel') < at(c, 'X', i, t, 'level');
    });
    if (hit) shown++;
  });
  return { paths, shown };
}
export function equityOf(c) {
  let n = 0, sum = 0;
  c.order.forEach(([cat], i) => {
    if (cat !== 'lost') return;
    for (const t of windowOf(c, i)) for (const [x, o] of [['penA', 'oPenA'], ['isaA', 'oIsaA'], ['penB', 'oPenB'], ['isaB', 'oIsaB']]) {
      const rx = at(c, 'X', i, t, x), ro = at(c, 'X', i, t, o);
      if (rx >= 0 && ro >= 0) { n++; sum += ro - rx; }   // TIER_ORDER's place: the rule's lower is more equity
    }
  });
  return { n, sum };
}
export function outcomeOf({ rec, mech, equity }) {
  const { L, R, S, TK } = rec;
  if (L >= HALF && mech > HALF) return TK >= HALF ? 'THE CAUSE HOLDS: THE LEVELS ON OFFER' : 'THE CAUSE HOLDS: THE PRICING';
  if (R >= HALF && L < QUARTER && TK < QUARTER && equity > 0) return 'THE RISK RIVAL';
  if (S >= HALF) return 'THE SPLIT';
  if (L >= HALF) return 'THE LEVEL, ITS MECHANISM NOT SHOWN';
  if (VARIANTS.every(v => rec[v] < QUARTER)) return 'NO PART RECOVERS A QUARTER';
  return 'MIXED';
}

function planted() {
  const cases = [];
  const O = (rec, mech = 0, equity = 0) => outcomeOf({ rec, mech, equity });
  cases.push(['L half with the mechanism and TK half: the levels on offer', O({ L: 0.6, R: 0.1, S: 0.1, TK: 0.5 }, 0.6), 'THE CAUSE HOLDS: THE LEVELS ON OFFER']);
  cases.push(['L half with the mechanism and TK under half: the pricing', O({ L: 0.5, R: 0.1, S: 0.1, TK: 0.49 }, 0.51), 'THE CAUSE HOLDS: THE PRICING']);
  cases.push(['the mechanism on exactly half is not more than half', O({ L: 0.7, R: 0.1, S: 0.1, TK: 0.1 }, 0.5), 'THE LEVEL, ITS MECHANISM NOT SHOWN']);
  cases.push(['R half, L and TK under a quarter, more equity: the risk rival', O({ L: 0.2, R: 0.6, S: 0.1, TK: 0.1 }, 0, 0.3), 'THE RISK RIVAL']);
  cases.push(['R half without more equity: not the risk rival', O({ L: 0.2, R: 0.6, S: 0.1, TK: 0.1 }, 0, 0), 'MIXED']);
  cases.push(['R half with L at a quarter: not the risk rival', O({ L: 0.25, R: 0.6, S: 0.1, TK: 0.1 }, 0, 1), 'MIXED']);
  cases.push(['S half: the split', O({ L: 0.1, R: 0.1, S: 0.55, TK: 0.1 }), 'THE SPLIT']);
  cases.push(['every variant under a quarter: no part', O({ L: 0.24, R: -0.1, S: 0.2, TK: 0.1 }), 'NO PART RECOVERS A QUARTER']);
  cases.push(['one variant at a quarter, none half: mixed', O({ L: 0.25, R: 0.1, S: 0.1, TK: 0.1 }), 'MIXED']);
  // gainOf on a small comparison: 4 of 1,000 lost replayed, 3 kept; 2 of 10 saved, 1 lost; 2 of 900 controls, 1 lost
  const c = { pop: { lost: 1000, saved: 10, ctrl: 900 }, order: [['lost'], ['lost'], ['lost'], ['lost'], ['saved'], ['saved'], ['ctrl'], ['ctrl']], runs: { L: { survived: Uint8Array.from([1, 1, 1, 0, 1, 0, 1, 0]) } } };
  cases.push(['gainOf scales each category to its whole count', gainOf(c, 'L').gain.toFixed(1), (750 - 5 - 450).toFixed(1)]);
  // the mechanism: a lost path failing in year 6, its year 3 a draw on a person read at 0.99 with TODAY lower; the same with
  // TODAY level, and with no draw, not shown; a year after the failure not looked at
  const Y = 8, R0 = REC_FIELDS.length, mk = edit => { const rec = new Float32Array(Y * R0).fill(0); const put = (t, k, v) => { rec[t * R0 + REC_FIELDS.indexOf(k)] = v; };
    for (let t = 0; t < Y; t++) { put(t, 'level', 1); put(t, 'oLevel', 1); put(t, 'split', 0.75); put(t, 'readA', 0.5); put(t, 'readB', 0.5); put(t, 'draw', 1000); } edit(put); return rec; };
  const one = rec => ({ Y, order: [['lost']], runs: { X: { failYear: Int16Array.from([6]) } }, rec: { X: rec } });
  cases.push(['the mechanism shown', mechanismOf(one(mk(p => { p(3, 'readA', 0.99); p(3, 'oLevel', 0.9); }))).shown, 1]);
  cases.push(['the mechanism: TODAY at the same level, not shown', mechanismOf(one(mk(p => { p(3, 'readA', 0.99); }))).shown, 0]);
  cases.push(['the mechanism: no draw that year, not shown', mechanismOf(one(mk(p => { p(3, 'readA', 0.99); p(3, 'oLevel', 0.9); p(3, 'draw', 0); }))).shown, 0]);
  cases.push(['the mechanism: the reading on the person not funding, not shown', mechanismOf(one(mk(p => { p(3, 'readB', 0.99); p(3, 'oLevel', 0.9); }))).shown, 0]);
  cases.push(['the mechanism: the failure year itself not in the window', mechanismOf(one(mk(p => { p(6, 'readA', 0.99); p(6, 'oLevel', 0.9); }))).shown, 0]);
  cases.push(['the mechanism: six years before the failure not in the window', mechanismOf(one(mk(p => { p(0, 'readA', 0.99); p(0, 'oLevel', 0.9); }))).shown, 0]);
  cases.push(['equityOf: the rule a place riskier than TODAY on one slot', (() => { const e = equityOf(one(mk(p => { for (let t = 0; t < Y; t++) for (const k of ['penA', 'isaA', 'penB', 'isaB', 'oPenA', 'oIsaA', 'oPenB', 'oIsaB']) p(t, k, 2); p(2, 'penA', 1); }))); return `${e.sum} of ${e.n}`; })(), '1 of 20']);
  // the gate: a smoke file and a code other than the read's refused
  const file = { smoke: true, code: 'x', seed: SEED, N: N_UNIT, topK: TOPK, idx: { lost: [], saved: [], ctrl: [] }, pop: { lost: 0, saved: 0, ctrl: 0 }, order: [], runs: Object.fromEntries(RUNS.map(r => [r, { survived: [] }])), fields: REC_FIELDS, tree: 't', node: 'n' };
  const g = gate({ [`${COMPARISONS[0][0]} ${COMPARISONS[0][1]}`]: file });
  cases.push(['the gate refuses a smoke run, another code and the missing comparisons', `${g.some(x => /a smoke run/.test(x))} ${g.some(x => /code x/.test(x))} ${g.filter(x => /missing/.test(x)).length}`, `true true ${COMPARISONS.length - 1}`]);
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  const dir = process.argv[2] || join(HERE, 'results', 'share-replay');
  if (!existsSync(dir)) { console.error(`reduce-share-replay: no ${dir}`); process.exit(2); }
  const D = load(dir), P = gate(D);
  console.log(`THE SHARE REPLAY (EXPLORATORY, seed ${SEED}'s read paths; SHARE-REPLAY.md): ${Object.keys(D).length} comparisons; the gate: ${P.length ? 'REFUSED' : 'fair'}`);
  if (P.length) { for (const x of P.slice(0, 20)) console.log(`  ${x}`); process.exit(1); }
  { // the fair-test gate on the registered runs the replay starts from (their launch logs, under the registration)
    const { requireFairLogs } = await import('./fair-gate.mjs'), RUN = join(Object.values(D)[0].tree, 'research/solver/results/share-rules-run');
    requireFairLogs(existsSync(RUN) ? Object.fromEntries(readdirSync(RUN).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(RUN, x), 'utf8')])) : {}, 'research/solver/registrations/share-rules.md');
    console.log(`  the registered runs it starts from: their ${readdirSync(RUN).filter(x => /^case\d+\.txt$/.test(x)).length} logs stamped under the registration as it stands (fair-gate.mjs requireFairLogs)`); }
  const flags = COMPARISONS.filter(c => !c[2]).map(([r, u]) => D[`${r} ${u}`]), mirror = D[COMPARISONS.find(c => c[2]).slice(0, 2).join(' ')];
  console.log('\nEach flagged comparison: the rule\'s lost / saved / both-keep paths (replayed), and each variant\'s lost kept, saved lost, controls lost and its gain in paths:');
  const tot = { lostPop: 0 }, gains = Object.fromEntries(VARIANTS.map(v => [v, 0]));
  for (const c of flags) {
    tot.lostPop += c.pop.lost;
    const parts = VARIANTS.map(v => { const g = gainOf(c, v); gains[v] += g.gain; return `${v} ${g.k.lost}, ${g.n.saved - g.k.saved}, ${g.n.ctrl - g.k.ctrl}: ${f(g.gain, 1)}`; });
    console.log(`  ${c.rule.padEnd(5)} ${c.unit.padEnd(12)} ${c.pop.lost} / ${c.pop.saved} / ${c.pop.ctrl} (${c.idx.lost.length} / ${c.idx.saved.length} / ${c.idx.ctrl.length}) | ${parts.join(' | ')}`);
  }
  const rec = Object.fromEntries(VARIANTS.map(v => [v, gains[v] / tot.lostPop]));
  const mech = flags.reduce((a, c) => { const m = mechanismOf(c); return { paths: a.paths + m.paths, shown: a.shown + m.shown }; }, { paths: 0, shown: 0 });
  const eq = flags.reduce((a, c) => { const e = equityOf(c); return { n: a.n + e.n, sum: a.sum + e.sum }; }, { n: 0, sum: 0 });
  const mechShare = mech.paths ? mech.shown / mech.paths : 0, equity = eq.n ? eq.sum / eq.n : 0;
  console.log(`\nThe rule (pooled over the ten flags; the rule's lost paths ${tot.lostPop}):`);
  for (const v of VARIANTS) console.log(`  ${v.padEnd(2)} recovers ${f(rec[v], 4)} of the lost paths (${f(gains[v], 1)} paths): ${rec[v] >= HALF ? 'half or more' : rec[v] >= QUARTER ? 'a quarter or more, under half' : 'under a quarter'}`);
  console.log(`  the mechanism: on ${mech.shown} of ${mech.paths} lost paths replayed (${(100 * mechShare).toFixed(1)}%): ${mechShare > HALF ? 'more than half' : 'not more than half'}`);
  console.log(`  the equity: the rule's tiers against TODAY's at the same states, ${f(equity, 4)} places of TIER_ORDER a slot over ${eq.n} slot-years: ${equity > 0 ? 'the rule holds more equity' : 'the rule does not hold more equity'}`);
  console.log(`\nTHE SHARE REPLAY'S OUTCOME: ${outcomeOf({ rec, mech: mechShare, equity })}`);
  console.log('\nBESIDE, DECIDING NOTHING:');
  { const parts = VARIANTS.map(v => { const g = gainOf(mirror, v); return `${v} keeps ${g.k.saved} of ${g.n.saved} saved, ${g.k.lost} of ${g.n.lost} lost, ${g.k.ctrl} of ${g.n.ctrl} controls`; });
    console.log(`  the mirror, ${mirror.rule} on ${mirror.unit} (saved ${mirror.pop.saved}, lost ${mirror.pop.lost}): ${parts.join('; ')}`); }
  { // the lost paths by kind under the rule: running short (unmet over £1) or below the minimum pot; each variant's keeping of each
    const kinds = { short: { n: 0 }, pot: { n: 0 } }; for (const v of VARIANTS) { kinds.short[v] = 0; kinds.pot[v] = 0; }
    for (const c of flags) c.order.forEach(([cat], i) => { if (cat !== 'lost') return; const k = c.runs.X.unmet[i] > 1 ? 'short' : 'pot'; kinds[k].n++; for (const v of VARIANTS) if (c.runs[v].survived[i]) kinds[k][v]++; });
    console.log(`  the lost paths replayed by kind, each variant keeping: running short ${kinds.short.n} (${VARIANTS.map(v => `${v} ${kinds.short[v]}`).join(', ')}); below the minimum pot ${kinds.pot.n} (${VARIANTS.map(v => `${v} ${kinds.pot[v]}`).join(', ')})`); }
  { // the failing year under the rule: did its move fund the year in the exact model, and would any level of the menu at any split
    let years = 0, unfunded = 0, fundable = 0;
    for (const c of flags) c.order.forEach(([cat], i) => { if (cat !== 'lost') return; const fy = c.runs.X.failYear[i]; if (fy < 0 || fy >= c.Y || !(c.runs.X.unmet[i] > 1)) return; years++; if (!at(c, 'X', i, fy, 'funded')) { unfunded++; if (at(c, 'X', i, fy, 'fundLevel') >= 0) fundable++; } });
    console.log(`  the failing year of the lost paths that run short: ${years}; its move unfunded in the exact model ${unfunded}, of them a level of the menu at some split funding it ${fundable}`); }
  { // the first year the rule's move parts from TODAY's at the same state (level, split or tiers), before the failure year
    const before = []; for (const c of flags) c.order.forEach(([cat], i) => { if (cat !== 'lost') return; const fy = c.runs.X.failYear[i];
      for (let t = 0; t < fy; t++) { const d = ['level', 'split', 'penA', 'isaA', 'penB', 'isaB'].some((k, j) => at(c, 'X', i, t, k) !== at(c, 'X', i, t, ['oLevel', 'oSplit', 'oPenA', 'oIsaA', 'oPenB', 'oIsaB'][j])); if (d) { before.push(fy - t); return; } } before.push(0); });
    before.sort((x, y) => x - y);
    console.log(`  the years from the rule's first move apart from TODAY's to the failure, on the lost paths: the median ${before[Math.floor(before.length / 2)]}, a quarter ${before[Math.floor(before.length / 4)]}, three quarters ${before[Math.floor(3 * before.length / 4)]}; never apart before it ${before.filter(x => x === 0).length} of ${before.length}`); }
}
