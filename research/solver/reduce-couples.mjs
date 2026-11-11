/*
 * PART D, D4'S RE-RUN: THE READ (registrations/couples-d4b.md; audit-couples.mjs; STATE.md D34 the harm rule; the review of 9 Nov,
 * items 1 and 9: D4's 40 couples landed again on the code after items 2 to 5, couples-panel-d4b.json, and two stages: every
 * unit's first STAGE1 paths, then, for each couple and weight whose CANDC survival on them is below APP's plus STAGE_BAR points,
 * the rest of its N (stage-couples.mjs, the run's stage2.json, which this read recomputes and holds to its own decision); a
 * couple and weight at or above the bar stops there and is read as not harmed against APP), once, after its gate.
 * THE REVISION OF 11 NOV (the external review's ANSWERS-2026-11-11.md, sections 3 and 4; the maintainer's D78 and D80): S1, the
 * comparison against SHIPC, is reported and decides nothing (no couple has had SHIPC, so as a gate it could only withhold the
 * candidate); SHIPC runs the first SHIP_N paths of each unit, in one chunk, and D34's per-couple flags against it are dropped
 * (1,000 paths cannot carry them); the candidate is af001697ce1b (D73's port) on the thinner reference's lattice; each person's
 * record says where the sweep sends cash ISA money and whether the solve took the solve on anchors, each unit's that the
 * couples' path ran on its flat arrays and shared scores (items 11 and 2) and that nothing D80 rules out was on. The gate:
 *   - provenance (fair-gate.mjs requireFairLogs): every unit's log stamped by the launcher under the registration, the
 *     registration unedited since, one code across the logs;
 *   - the units: every couple of couples-panel-d4b.json in every arm (APP; CANDC and SHIPC at 0.02 and 0.01), each in its
 *     chunks (CHUNKS2, as the audit's: every chunk there, its paths the chunk's share of the unit's, every chunk on one stamp,
 *     plan, run record and horizon; SHIPC one chunk, its first SHIP_N paths, and no other whatever went on), joined path by
 *     path; one stamp across the units, seed SEED on the registered paths (couples-paths-d4b.json); each solver arm's
 *     configuration hash the registration's (CONFIG: CANDC the candidate af001697ce1b, SHIPC the product's settings
 *     07c069b6e330), and each person's run record its settings (WANT, the adaptive lattice LATTICE where a bridge year was
 *     read, the sweep to the ISA on CANDC and unset on SHIPC, the solve on anchors on wherever a CANDC person's solve has the
 *     joint tier state, off with its reason where it has none, and none on SHIPC); the couples' path on its flat arrays and
 *     shared scores (COUPLE.flat, COUPLE.fast), and no shortlist, item 12 option or tie-break (D80: each recorded 'none' or
 *     'off'); CANDC and SHIPC the same for each person in everything but the
 *     solver's own settings (FAIR: the mixture, lambda, the spending levels, the minimum pot, the raise weight, the final
 *     year), APP the app's rules as registered (APP_WANT) on the household's minimum pot; the couple's target the panel's,
 *     its five units on one inputs hash (each engine context but the policy's own fields), and the couples' rollout beside
 *     the engine on the first 500 paths of each solver unit (the fidelity gaps are reported);
 *   - each unit's stamp under the registration, its code, audit and registration blob the logs' own, and its audit hash that
 *     of the files this read takes (audit-couples.mjs stampFilesHash: the audit's files, the app's solve and its settings, the
 *     candidate's hash, the panel, the paths, this reducer and the code it borrows).
 * THE DECISION, at each estate weight (both must pass), on the paths every couple ran in CANDC and APP (the first stage's,
 * or all of them where every couple and weight went on), each path's change averaged over
 * the 40 couples and the 95% interval taken from the spread across paths (Phase 4's rule, reduce-phase4.mjs byPath):
 *   A1 survival against the app's rules, CANDC less APP, in points: passes when the interval's lower end is above 0;
 *   A2 spending delivered over every year, CANDC less APP as a share of the couple's mean under APP, in %: passes when the
 *      lower end is above -1.
 *   A path survives when every year's own spending (the target at the level the arm chose, or the guardrails' spend) is met
 *   to within a pound and the minimum pot is held at the end (audit-phase4.mjs runPath).
 *   PASS: both at both weights: the candidate for couples goes to the maintainer, who decides whether couples run it under
 *   Part C's switch (D42 holds until then). NOT PASSED: the items that failed and by how much; couples keep the app's rules
 *   under the switch, and nothing is tuned until it passes.
 * S1, REPORTED, NOT DECIDING (D78): survival against the product's settings, CANDC less SHIPC, in points, at each weight: the
 *   pooled change over the 40 couples on SHIPC's own paths (the first SHIP_N of each unit, CANDC's same paths), its 95%
 *   interval taken as A1's is. Where that interval lies wholly below S1_NOTE (-0.25) points the read says so in a line: it
 *   is logged in the register of open items with an owner, the maintainer. Whatever S1 reads, the outcome is A1's and A2's.
 * FLAGS, for investigation whatever the outcome; none blocks on its own (D34 (3)):
 *   - harm against APP, per couple and weight: the observed loss over the couple's paths above its
 *     threshold, set from its own realised discordance (the Clopper-Pearson upper 95% bound) at its paths by Phase 4's exact
 *     rates (size-phase4.mjs thresholdFor: a quarter-point loss read as harm at most 5% of the time), the rule fixed in
 *     couples-paths-d4b.json before the run. Every comparison against APP (80) is printed with its discordance, bound,
 *     threshold and both rates (D34 (4)); each whose 1-point rate is below D34's 90% is named (the registration's rule for
 *     them). There is no flag against SHIPC;
 *   - spending: a couple delivering more than 5% less over every year than under the app's rules.
 * REPORTED (no survival figure without the spending delivered beside it), everything against SHIPC on SHIPC's own paths:
 * spending delivered CANDC less SHIPC; the cost
 * years: the spending delivered in them over the couples with someone retired in a cost year (a year with no one retired has
 * no spending to deliver: those couples named and left out), and over every couple with a cost year the paths failing in a
 * cost year or the two after it, each arm and CANDC less APP and less SHIPC; A1 and A2 apart where arm A takes the full lump
 * sum; S1 over each cohort; A1 and S1 over the couples either of whose candidate tables reads a bridge year (the bridge with
 * the household's money, D2.4, as a whole) and the rest; the fidelity gaps; the solve times and the hosts.
 *   node research/solver/reduce-couples.mjs [dir] > research/solver/results-couples-d4.txt
 *   node research/solver/reduce-couples.mjs --pilot [dir] > research/solver/results-couples-pilot.txt   (EXPLORATORY)
 *   node research/solver/reduce-couples.mjs --planted
 */
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem, spendingItem, lossOf, harmFlag, lumpGroups, kvOf, byPath } from './reduce-phase4.mjs';
import { thresholdFor, harmRate, twoStageRate } from './size-phase4.mjs';
import { STAGE1, STAGE_BAR, SHIP_N } from './stage-couples.mjs';
import { clopperPearson } from './stats.mjs';
import { LOG_STAMP } from './fair-gate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const REGISTRATION = 'research/solver/registrations/couples-d4b.md', SEED = 7021, BESIDE_N = 500;
export const COHORTS = ['lib', 'young'], WEIGHTS = ['0.02', '0.01'], ARMS = ['APP/-', 'CANDC/0.02', 'CANDC/0.01', 'SHIPC/0.02', 'SHIPC/0.01'];
/* the arms the decision is read on (A1 and A2); SHIPC is reported on its own paths */
export const DECIDING = ARMS.filter(k => !k.startsWith('SHIPC'));
/* A1's and A2's bars; S1 has none (reported, not deciding: D78): S1_NOTE is where its interval, wholly below, is logged in
   the register with an owner */
export const A1_BAR = 0, A2_BAR = -1, S1_NOTE = -0.25, SPEND_FLAG = -5, TP_BAR = 0.9;
/* as audit-couples.mjs: each arm's chunks (SHIPC has no second stage), each solver arm's configuration hash, the candidate's
   lattice, the solve on anchors as a person's record names it (the audit's planted checks hold these copies to its own) */
export const CHUNKS2 = { CANDC: 3, SHIPC: 0, APP: 1 }, CONFIG = { CANDC: 'af001697ce1b', SHIPC: '07c069b6e330' }, LATTICE = '80x21x64+foot+stepAll';
export const COARSE_ON = 'w2a3b3g2c2-NT-LRVOH-h3', COARSE_OFF = 'off:no_joint_tier_state_on_this_solve:_the_whole_menu';
/* the two stages as audit-couples.mjs lays them out: chunk 0 the first n1 paths, chunks 1 to CHUNKS2[arm] split [n1, N) evenly;
   SHIPC's one chunk the first `ship` paths (LAYOUT is the registration's; the planted checks alone set smaller ones) */
export const LAYOUT = { n1: STAGE1, bar: STAGE_BAR, ship: SHIP_N, oneStage: false };   // oneStage: the pilot's units, each read whole at its N
export const chunksOf = arm => 1 + CHUNKS2[arm];
export const firstOf = arm => (arm === 'SHIPC' ? LAYOUT.ship : LAYOUT.n1);
export const rangeOf = (N, arm, j) => { const n1 = Math.min(firstOf(arm), N); if (j === 0) return [0, n1]; const K = CHUNKS2[arm], R = N - n1; if (!K) return [n1, n1]; return [n1 + Math.floor(((j - 1) * R) / K), n1 + Math.floor((j * R) / K)]; };
const LAMBDA = '0.0223606797749979';
/* what each person's run record must say in each solver arm (as audit-couples.mjs WANT), and APP's run record */
export const WANT = {
  CANDC: { pts: '45', bridgeRead: 'reader', readerRef: 'adaptive', readerSplit: 'rs', tiersBelow: '3', tableDealing: 'false', switchCharge: '0.001', e3: 'true', e3pcls: 'true', hr: 'yes', jointWorlds: 'true', bridgeStep: 'exact', switchMargin: '0', pclsInterp: 'true', failDelivered: 'true', lambda: LAMBDA, sweepCashIsaTo: 'isa' },
  SHIPC: { pts: '30', bridgeRead: 'false', tierState: 'null', tiersBelow: '2', tableDealing: 'true', e3: 'false', e3pcls: 'false', hr: 'no', jointWorlds: 'false', failDelivered: 'false', lambda: LAMBDA, sweepCashIsaTo: 'unset', coarse: 'none' }
};
/* the solve on anchors a CANDC person must record (as audit-couples.mjs coarseWant): on where their solve has the joint tier
   state, off with its reason where it has none */
export const coarseWant = p => (p.tierState === undefined || p.tierState === 'null' ? COARSE_OFF : COARSE_ON);
/* the unit's own record: the couples' path as run (items 11 and 2), and D80's three (each 'none' or 'off:<names>') */
export const HEAD_WANT = { flat: 'true', fast: 'true' }, D80_KEYS = ['shortlist', 'item12', 'tieBreak'];
export const APP_WANT = { guardrails: 'true', lookahead: '5', raiseCap: '1.1' };
/* what CANDC and SHIPC share, person by person at a weight (CHECKLIST 3: the arms differ in the solver's settings alone) */
export const FAIR = ['mix', 'lambda', 'levels', 'minPot', 'raiseW', 'finalIntegral', 'bequestWeight'];

const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const arraysOf = x => x && { survived: dec(x.survived, Uint8Array), estate: dec(x.estate, Float32Array), wealth: dec(x.wealth, Float32Array), delivered: dec(x.delivered, Float32Array), unmet: dec(x.unmet, Float32Array), tax: dec(x.tax, Float32Array), failYear: dec(x.failYear, Int16Array), costDelivered: dec(x.costDelivered, Float32Array) };
/* the fields every chunk of a unit must share */
const SHARED = ['stamp', 'inputs', 'ran', 'seed', 'N', 'Y', 'target', 'costYears', 'costRetired', 'label', 'cohort', 'chunks'];
/* each unit's chunks joined path by path (a unit written whole, as the pilot's were, is its one chunk) */
export function loadDir(dir) {
  const parts = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) {
    const j = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString());
    const c = { ...j, chunk: j.chunk ?? 0, chunks: j.chunks ?? 1, lo: j.lo ?? 0, hi: j.hi ?? j.N, main: arraysOf(j.main) };
    ((parts[j.id] ||= {})[`${j.arm}/${j.w}`] ||= []).push(c);
  }
  const U = {};
  for (const [id, byArm] of Object.entries(parts)) for (const [k, cs] of Object.entries(byArm)) {
    cs.sort((a, b) => a.chunk - b.chunk || a.lo - b.lo);
    const first = cs[0], main = {};
    for (const f of Object.keys(first.main)) {
      const out = new first.main[f].constructor(cs.reduce((s, c) => s + c.main[f].length, 0));
      let o = 0; for (const c of cs) { out.set(c.main[f], o); o += c.main[f].length; }
      main[f] = out;
    }
    const sum = f => cs.reduce((s, c) => s + (c[f] || 0), 0);
    (U[id] ||= {})[k] = { ...first, main, besideA: first.beside ? dec(first.beside.survived, Uint8Array) : null, secs: sum('secs'), solveSecs: sum('solveSecs'), engineSecs: sum('engineSecs'),
      parts: cs.map(c => Object.fromEntries([...SHARED, 'chunk', 'lo', 'hi', 'beside', 'cpu', 'secs'].map(f => [f, c[f]]))) };
  }
  return U;
}
/* the first stage's decision from the units (stage-couples.mjs's rule, recomputed): for each couple and weight, d1 (CANDC less
   APP on the first n1 paths, points) and whether it goes on (d1 below the bar, and its N past n1) */
export function stageOf(U, panel) {
  const out = {};
  for (const h of panel) for (const w of WEIGHTS) {
    const c = U[h.id] && U[h.id][`CANDC/${w}`], a = U[h.id] && U[h.id]['APP/-'];
    if (!c || !a) continue;
    const n = Math.min(LAYOUT.n1, c.main.survived.length, a.main.survived.length);
    let sc = 0, sa = 0; for (let i = 0; i < n; i++) { sc += c.main.survived[i]; sa += a.main.survived[i]; }
    const d1 = (100 * (sc - sa)) / n;
    out[`${h.id}|${w}`] = LAYOUT.oneStage ? { d1, n, on: true } : { d1, n, on: d1 < LAYOUT.bar - 1e-12 && c.N > LAYOUT.n1 };
  }
  return out;
}
/* a solver unit's run record: its head (the configuration, the household's minimum pot) and each person's */
const headOf = ran => kvOf((ran || '').split(' | ')[0]);
export const personOf = (ran, who) => { const m = new RegExp(`${who}: (.*?)(?: \\| |$)`).exec(ran || ''); return kvOf(m ? m[1] : ''); };
/* the gate over the units: every problem, so a refusal names them all */
export function gate(U, panel, paths, logs = null, files = null, stage2 = null) {
  const P = [], stamps = new Set(), st = stageOf(U, panel);
  // the run's own decision (stage2.json) is this read's: the same couples and weights going on, from the same stamp
  if (stage2) {
    const mine = Object.entries(st).filter(([, v]) => v.on).map(([k]) => k).sort().join(), theirs = (stage2.continue || []).map(x => `${x.id}|${x.w}`).sort().join();
    if (mine !== theirs) P.push(`the stage gate's decision (stage2.json) not the read's: it ran on ${theirs || 'none'}; the first stage says ${mine || 'none'}`);
  }
  // SHIPC never goes on: its unit is its first paths, whatever the first stage decided (D78)
  const goesOn = (id, arm, w) => (arm === 'SHIPC' ? false : arm === 'APP' ? WEIGHTS.some(v => (st[`${id}|${v}`] || {}).on) : !!(st[`${id}|${w}`] || {}).on);
  for (const h of panel) {
    const u = U[h.id] || {};
    if (!COHORTS.includes(h.cohort)) P.push(`${h.id}: cohort ${h.cohort}`);
    for (const k of ARMS) if (!u[k]) P.push(`${h.id}: no ${k} unit`);
    const got = ARMS.map(k => u[k]).filter(Boolean);
    for (const x of got) {
      const k = `${x.arm}/${x.w}`, J = chunksOf(x.arm), on = goesOn(h.id, x.arm, x.w), want = on ? J : 1, ship = x.arm === 'SHIPC';
      stamps.add(JSON.stringify(x.stamp));
      // its chunks: each there once, each on its stage's share of the paths, each the unit's own in every shared field; the
      // first stage's alone where its couple and weight stopped there, every chunk where it goes on; SHIPC's one chunk alone
      const idx = x.parts.map(c => c.chunk);
      if (x.parts.length !== want || new Set(idx).size !== want || idx.some(c => !(c >= 0 && c < want))) P.push(`${h.id} ${k}: chunks ${idx.join(',')}, not ${on ? `0 to ${J - 1}` : ship ? `0 (SHIPC is its first ${LAYOUT.ship} paths alone: no second stage)` : '0 (stopped at the first stage)'}`);
      for (const c of x.parts) {
        const [lo, hi] = rangeOf(x.N, x.arm, c.chunk);
        if (c.lo !== lo || c.hi !== hi) P.push(`${h.id} ${k} chunk ${c.chunk}: paths ${c.lo} to ${c.hi}, not ${lo} to ${hi}`);
        for (const f of SHARED) if (JSON.stringify(c[f]) !== JSON.stringify(x.parts[0][f])) P.push(`${h.id} ${k} chunk ${c.chunk}: its ${f} not its first chunk's`);
        if (c.chunk > 0 && c.beside) P.push(`${h.id} ${k} chunk ${c.chunk}: a rollout beside outside the first chunk`);
      }
      if (x.chunks !== J) P.push(`${h.id} ${k}: written in ${x.chunks} chunks, not ${J}`);
      if (x.seed !== SEED) P.push(`${h.id} ${k}: seed ${x.seed}`);
      const nWant = on ? x.N : Math.min(firstOf(x.arm), x.N);
      if (x.N !== paths[h.id] || x.main.survived.length !== nWant) P.push(`${h.id} ${k}: ${x.main.survived.length} of ${x.N} paths (${on ? 'going on' : ship ? 'SHIPC\'s own first paths' : 'stopped at the first stage'}: ${nWant}), registered ${paths[h.id]}`);
      if (x.target !== h.target) P.push(`${h.id} ${k}: target ${x.target}, the panel's ${h.target}`);
      if (x.stamp.prediction !== REGISTRATION) P.push(`${h.id} ${k}: stamped under ${x.stamp.prediction}, not ${REGISTRATION}`);
      if (files && x.stamp.audit !== files) P.push(`${h.id} ${k}: launched on files hashing ${x.stamp.audit}; the files this read takes hash ${files}`);
      if (logs && ['code', 'audit', 'sha'].some(f => x.stamp[f] !== logs[f])) P.push(`${h.id} ${k}: its stamp not the logs'`);
      if (!x.inputs) P.push(`${h.id} ${k}: no inputs hash`);
      if (!Array.isArray(x.costRetired) || x.costRetired.length !== (x.costYears || []).length) P.push(`${h.id} ${k}: whether anyone is retired in each cost year not recorded`);
      if (x.arm === 'APP') {
        const a = kvOf(x.ran);
        for (const [f, v] of Object.entries(APP_WANT)) if (a[f] !== v) P.push(`${h.id} ${k}: ran with ${f} ${a[f]}, not ${v}`);
        continue;
      }
      if (!x.beside || x.beside.N !== Math.min(x.N, firstOf(x.arm), BESIDE_N)) P.push(`${h.id} ${k}: the rollout beside ${x.beside ? `on ${x.beside.N} paths` : 'missing'}, not on ${Math.min(x.N, firstOf(x.arm), BESIDE_N)}`);
      const head = headOf(x.ran);
      if (head.config !== CONFIG[x.arm]) P.push(`${h.id} ${k}: its configuration ${head.config}, not the registration's ${CONFIG[x.arm]}`);
      // the couples' path as the registration names it (the joint move on flat arrays, item 11; the shared scores, item 2)
      for (const [f, v] of Object.entries(HEAD_WANT)) if (head[f] !== v) P.push(`${h.id} ${k}: the couples' path ran with COUPLE.${f} ${head[f]}, not ${v}`);
      // D80: no shortlist, item 12 option or tie-break in a registered arm; a unit that does not record all three is refused
      for (const f of D80_KEYS) if (!/^(none|off:\S+)$/.test(head[f] || '')) P.push(`${h.id} ${k}: ${f} ${head[f] === undefined ? 'not recorded' : head[f]} (D80: none in a registered couples' arm)`);
      // each person's table on half the household's spending, as D4's couples ran (D70: shareRule off; the design review of 11 Nov, MINOR 2)
      if (!LAYOUT.oneStage && (head.share !== '0.5' || head.shareRule !== 'half')) P.push(`${h.id} ${k}: its share ${head.share} by ${head.shareRule}, not 0.5 by half`);
      if (u['APP/-'] && head.hhMinPot !== kvOf(u['APP/-'].ran).minPot) P.push(`${h.id} ${k}: the household's minimum pot ${head.hhMinPot}, APP's ${kvOf(u['APP/-'].ran).minPot}`);
      for (const who of ['self', 'part']) {
        const p = personOf(x.ran, who);
        for (const [f, v] of [...Object.entries(WANT[x.arm]), ['bequestWeight', String(Number(x.w))]]) if (p[f] !== v) P.push(`${h.id} ${k} ${who}: ran with ${f} ${p[f]}, not ${v}`);
        if (x.arm === 'CANDC' && p.lattice !== LATTICE && p.lattice !== 'unbuilt') P.push(`${h.id} ${k} ${who}: the lattice ${p.lattice}, not ${LATTICE}`);
        // the solve on anchors (D73): on wherever the person's solve has the joint tier state, off with its reason where not
        if (x.arm === 'CANDC' && p.coarse !== coarseWant(p)) P.push(`${h.id} ${k} ${who}: the solve on anchors ${p.coarse}, not ${coarseWant(p)} (${coarseWant(p) === COARSE_ON ? 'the joint tier state' : 'no joint tier state'})`);
      }
    }
    if (got.length && new Set(got.map(x => x.Y)).size > 1) P.push(`${h.id}: the arms' horizons differ`);
    if (got.length && new Set(got.map(x => x.inputs)).size > 1) P.push(`${h.id}: the arms' inputs differ (${got.map(x => `${x.arm}/${x.w} ${x.inputs}`).join(', ')})`);
    if (got.length && new Set(got.map(x => JSON.stringify([x.costYears, x.costRetired]))).size > 1) P.push(`${h.id}: the arms' cost years differ`);
    // person by person: an arm's two weights the same but for the estate weight; CANDC and SHIPC the same in FAIR at a weight
    const bare = (ran, who) => { const p = personOf(ran, who); delete p.bequestWeight; return p; };
    for (const arm of ['CANDC', 'SHIPC']) { const a = u[`${arm}/0.02`], b = u[`${arm}/0.01`]; if (!a || !b) continue; for (const who of ['self', 'part']) { const x = bare(a.ran, who), y = bare(b.ran, who); for (const f of new Set([...Object.keys(x), ...Object.keys(y)])) if (x[f] !== y[f]) P.push(`${h.id} ${arm} ${who}: its two weights differ in ${f} (${x[f]}, ${y[f]})`); } }
    for (const w of WEIGHTS) { const c = u[`CANDC/${w}`], s = u[`SHIPC/${w}`]; if (!c || !s) continue; for (const who of ['self', 'part']) { const x = personOf(c.ran, who), y = personOf(s.ran, who); for (const f of FAIR) if (x[f] !== y[f]) P.push(`${h.id} W${w} ${who}: CANDC and SHIPC differ in ${f} (${x[f]}, ${y[f]})`); } }
  }
  if (stamps.size > 1) {
    const by = {};
    for (const h of panel) for (const k of ARMS) { const x = (U[h.id] || {})[k]; if (x) (by[JSON.stringify(x.stamp)] ||= []).push(`${h.id} ${k}`); }
    P.push(`${stamps.size} stamps across the units (one code, audit, registration and Node version wanted): ${Object.entries(by).map(([s, us]) => `${s} on ${us.length} (${us.slice(0, 3).join(', ')}${us.length > 3 ? ', ...' : ''})`).join('; ')}`);
  }
  return P;
}
/* the outcome from the items: A1 and A2 at each weight. S1 is reported and decides nothing, whatever it reads (D78) */
export function decide(items) {
  const failed = [];
  for (const w of WEIGHTS) {
    const it = items[w];
    if (!(it.A1.lo > A1_BAR)) failed.push(`A1 at W${w} (lower end ${it.A1.lo.toFixed(3)}, not above ${A1_BAR})`);
    if (!(it.A2.lo > A2_BAR)) failed.push(`A2 at W${w} (lower end ${it.A2.lo.toFixed(3)}%, not above ${A2_BAR}%)`);
  }
  return failed.length ? { outcome: 'NOT PASSED', decides: `couples keep the app's rules under the switch (D42) and nothing is tuned to pass; failed: ${failed.join('; ')}` }
    : { outcome: 'PASS', decides: 'the candidate for couples goes to the maintainer, who decides whether couples run it under Part C\'s switch' };
}
/* a couple's harm comparison against an arm: the loss over its paths, the threshold its own discordance sets at its paths, and
   both of D34's rates at that threshold (a quarter-point loss read as harm, and a 1-point loss) */
export function harmOf(c, o, n = Math.min(c.survived.length, o.survived.length)) {
  const L = lossOf({ survived: c.survived.subarray(0, n) }, { survived: o.survived.subarray(0, n) }), k = Math.round(L.disc * L.n), dUp = Math.max(clopperPearson(k, L.n)[1], 0.0101), t = thresholdFor(dUp, L.n);
  return { ...L, k, dUp, t, fp: harmRate(dUp, L.n, t, 0.25), tp: harmRate(dUp, L.n, t, 1), flag: harmFlag(L, t) };
}
/* a comparison against APP under the two stages: its threshold at the couple's N from the realised discordance (over the paths
   it ran), its rates the exact two-stage rates (size-phase4.mjs twoStageRate); stopped at the first stage, read as not harmed */
export function harmTwoStage(c, o, N, st) {
  if (LAYOUT.oneStage) return { ...harmOf(c, o), stopped: false, d1: st.d1, N };
  const h = harmOf(c, o), tN = thresholdFor(h.dUp, N), r = D => twoStageRate(h.dUp, N, tN, D, Math.min(LAYOUT.n1, N), LAYOUT.bar);
  return { ...h, t: tN, fp: r(0.25).flag, tp: r(1).flag, flag: st.on ? harmFlag(h, tN) : false, stopped: !st.on, d1: st.d1, N };
}
/* every comparison D34 (4) asks for: each couple and weight against APP. None against SHIPC: its per-couple flags are
   dropped, 1,000 paths a unit cannot carry them (D78) */
export function harmRows(U, panel) {
  const rows = [], st = stageOf(U, panel);
  for (const h of panel) for (const w of WEIGHTS) {
    const c = U[h.id][`CANDC/${w}`], s = st[`${h.id}|${w}`];
    rows.push({ id: h.id, w, nm: 'APP', ...harmTwoStage(c.main, U[h.id]['APP/-'].main, c.N, s) });
  }
  return rows;
}
/* the paths every one of these couples ran in SHIPC at a weight, and CANDC's same paths: SHIPC's own first paths */
export const shipPaths = (U, hs, w) => Math.min(...hs.flatMap(h => [U[h.id][`SHIPC/${w}`].main.survived.length, U[h.id][`CANDC/${w}`].main.survived.length]));
/* the items at a weight: A1 and A2, the deciding ones, on n; S1 and the spending beside it, reported, on nS */
export function itemsAt(U, panel, w) {
  // the paths every couple ran in CANDC and APP: the first stage's unless every couple and weight went on. SHIPC's paths are
  // fewer and take no part in it: the deciding items are not cut to them
  const n = Math.min(...panel.flatMap(h => DECIDING.map(k => U[h.id][k].main.survived.length))), nS = shipPaths(U, panel, w);
  const C = h => U[h.id][`CANDC/${w}`].main, A = h => U[h.id]['APP/-'].main, S = h => U[h.id][`SHIPC/${w}`].main;
  return { n, nS, A1: survivalItem(panel.map(h => [C(h), A(h)]), n), A2: spendingItem(panel.map(h => [C(h), A(h)]), n), S1: survivalItem(panel.map(h => [C(h), S(h)]), nS), CS: spendingItem(panel.map(h => [C(h), S(h)]), nS) };
}
/* S1's interval wholly below S1_NOTE: logged in the register with an owner; it changes no outcome */
export const s1Noted = S1 => S1.hi < S1_NOTE;
/* whether anyone is retired in a couple's cost year (the audit's record; a unit written before it, the pilot's, read from the
   spending delivered in the cost years under APP, which is nought on every path when no one is retired) */
export const retiredInCost = x => (Array.isArray(x.costRetired) ? x.costRetired.some(Boolean) : x.main.costDelivered.some(v => v > 0));
export const costItem = (pairs, n) => spendingItem(pairs.map(([c, o]) => [{ ...c, delivered: c.costDelivered }, { ...o, delivered: o.costDelivered }]), n);
/* each path: 1 when it fails in a cost year or the two after it */
export const failWindow = (m, costYears) => Uint8Array.from(m.failYear, f => (f >= 0 && costYears.some(c => f >= c && f <= c + 2) ? 1 : 0));
const f3 = x => x.toFixed(3), sgn = x => `${x >= 0 ? '+' : ''}${x.toFixed(3)}`, iv = r => `${sgn(r.d)} (${f3(r.lo)} to ${f3(r.hi)}, se ${r.se.toFixed(4)})`;
const pct = (a, n) => (100 * a.reduce((s, x) => s + x, 0) / n).toFixed(3);

export function report(U, panel) {
  const lines = [], items = {};
  for (const w of WEIGHTS) {
    const it = items[w] = itemsAt(U, panel, w);
    lines.push(`W${w}: A1 survival CANDC less APP ${iv(it.A1)} points: ${it.A1.lo > A1_BAR ? 'PASSES' : 'FAILS'}; A2 spending delivered ${iv(it.A2)}%: ${it.A2.lo > A2_BAR ? 'PASSES' : 'FAILS'} (on the ${it.n} paths every couple ran in CANDC and APP)`);
  }
  const out = decide(items);
  lines.push(`OUTCOME: ${out.outcome}: ${out.decides}`);
  // S1: reported, not deciding (D78; the external review's answer of 11 Nov, section 3), after the outcome it does not change
  lines.push('', 'S1, REPORTED, NOT DECIDING (D78): the candidate for couples against the couples\' solver at the product\'s settings, which no couple has had');
  for (const w of WEIGHTS) {
    const it = items[w];
    lines.push(`W${w}: S1 survival CANDC less SHIPC ${iv(it.S1)} points, pooled over the ${panel.length} couples on SHIPC's own paths (the first ${it.nS} of each unit, CANDC's same paths) (spending delivered CANDC less SHIPC ${iv(it.CS)}%)`);
    if (s1Noted(it.S1)) lines.push(`  S1 at W${w}: the interval lies wholly below ${S1_NOTE} points: logged in the register of open items with an owner, the maintainer (a finding to investigate: whether the candidate's settings suit couples as well as the product's); the outcome above is unchanged`);
  }
  lines.push('', 'FLAGS (D34: for investigation, none blocking on its own; against APP and for spending: none against SHIPC, D78)');
  const flags = [], rows = harmRows(U, panel);
  for (const r of rows) if (r.flag) flags.push(`${r.id} W${r.w} harm against ${r.nm}: loss ${r.loss.toFixed(3)} points over ${r.n} paths (${r.saved} saved, ${r.lost} lost), threshold ${r.t.toFixed(4)} at discordance up to ${(100 * r.dUp).toFixed(2)}% (a 1-point loss read ${r.tp.toFixed(3)})`);
  for (const h of panel) for (const w of WEIGHTS) {
    // paired: on the paths both ran (the design review of 11 Nov, MINOR 3: one weight stopped, APP gone on for the other)
    const c = U[h.id][`CANDC/${w}`].main, a = U[h.id]['APP/-'].main, n = Math.min(c.delivered.length, a.delivered.length), sum = x => x.subarray(0, n).reduce((s, y) => s + y, 0) / n, m = sum(a.delivered), d = 100 * (sum(c.delivered) - m) / (m || 1);
    if (d < SPEND_FLAG) flags.push(`${h.id} W${w} spending: ${d.toFixed(2)}% against APP`);
  }
  lines.push(flags.length ? flags.map(f => `  ${f}`).join('\n') : '  none');
  const below = rows.filter(r => !(r.tp >= TP_BAR));
  lines.push('', `D34 (4), every comparison against APP (none against SHIPC: its per-couple flags are dropped, D78): the realised discordance (its Clopper-Pearson upper 95% bound, priced at 1.01% at least), the threshold it sets at the couple's N, its rates the exact two-stage rates: a quarter-point loss read as harm, a 1-point loss read as harm; the observed loss; whether the couple and weight stopped at the first stage (its change against APP there)`);
  for (const r of rows) lines.push(`  ${r.id.padEnd(6)} W${r.w} CANDC less ${r.nm.padEnd(5)} discordant ${r.k} of ${r.n} (${(100 * r.k / r.n).toFixed(2)}%, up to ${(100 * r.dUp).toFixed(2)}%): threshold ${r.t.toFixed(4)}, a quarter-point loss read ${r.fp.toFixed(3)}, a 1-point loss read ${r.tp.toFixed(3)}${r.tp >= TP_BAR ? '' : ' (BELOW 0.90)'}; loss ${r.loss.toFixed(3)} (${r.saved} saved, ${r.lost} lost)${r.stopped ? `; stopped at the first stage (${r.d1 >= 0 ? '+' : ''}${r.d1.toFixed(3)} points against APP there): read as not harmed` : ''}${r.flag ? ' FLAGGED' : ''}`);
  lines.push(`  the 1-point rate below D34's 0.90 on ${below.length} of ${rows.length} comparisons${below.length ? `: ${below.map(r => `${r.id} W${r.w} against ${r.nm} (${r.tp.toFixed(3)})`).join(', ')}; by the registration, reported as below D34's rate` : ''}`);
  lines.push('', 'REPORTED (against APP on the paths every couple ran in CANDC and APP; against SHIPC on SHIPC\'s own paths, the first of each unit)');
  const withCost = panel.filter(h => (U[h.id]['APP/-'].costYears || []).length), spendSet = withCost.filter(h => retiredInCost(U[h.id]['APP/-'])), leftOut = withCost.filter(h => !spendSet.includes(h));
  for (const w of WEIGHTS) {
    // n: the deciding items' paths; nS: SHIPC's own (every figure against SHIPC is read on them, CANDC's same paths)
    const n = items[w].n, nS = items[w].nS, C = h => U[h.id][`CANDC/${w}`].main, A = h => U[h.id]['APP/-'].main, S = h => U[h.id][`SHIPC/${w}`].main;
    if (spendSet.length) lines.push(`W${w} the cost years' spending delivered, over the ${spendSet.length} couples with someone retired in a cost year: CANDC less APP ${iv(costItem(spendSet.map(h => [C(h), A(h)]), n))}%, less SHIPC ${iv(costItem(spendSet.map(h => [C(h), S(h)]), nS))}% (on SHIPC's ${nS} paths)`);
    if (leftOut.length) lines.push(`  left out, no one retired in their cost year (no spending to deliver in it, nought in every arm): ${leftOut.length}, ${leftOut.map(h => h.id).join(', ')}`);
    if (withCost.length) {
      const fw = (m, h) => failWindow(m, U[h.id]['APP/-'].costYears), tot = (f, k) => 100 * withCost.reduce((s, h) => s + fw(f(h), h).slice(0, k).reduce((a, x) => a + x, 0), 0) / (withCost.length * k);
      const diff = (g, k) => byPath(withCost.map(h => { const c = fw(C(h), h), o = fw(g(h), h); return i => 100 * (c[i] - o[i]); }), k);
      lines.push(`W${w} the paths failing in a cost year or the two after it, over the ${withCost.length} couples with a cost year: APP ${tot(A, n).toFixed(3)}%, CANDC ${tot(C, n).toFixed(3)}%; CANDC less APP ${iv(diff(A, n))} points; on SHIPC's ${nS} paths SHIPC ${tot(S, nS).toFixed(3)}%, CANDC ${tot(C, nS).toFixed(3)}%, CANDC less SHIPC ${iv(diff(S, nS))} points`);
    }
    for (const [nm, hs] of lumpGroups(panel)) if (hs.length) lines.push(`W${w} where arm A ${nm} (${hs.length}): A1 ${iv(survivalItem(hs.map(h => [C(h), A(h)]), n))} points, A2 ${iv(spendingItem(hs.map(h => [C(h), A(h)]), n))}%`);
    for (const co of COHORTS) { const hs = panel.filter(h => h.cohort === co); if (hs.length) lines.push(`W${w} S1 over the ${co === 'lib' ? 'library' : 'younger'} cohort (${hs.length}): ${iv(survivalItem(hs.map(h => [C(h), S(h)]), nS))} points (spending ${iv(spendingItem(hs.map(h => [C(h), S(h)]), nS))}%)`); }
    // the bridge with the household's money (D2.4) as a whole: the couples either of whose candidate tables reads a bridge year
    const yearsOf = h => ['self', 'part'].map(who => personOf(U[h.id][`CANDC/${w}`].ran, who).readerYears);
    if (panel.every(h => yearsOf(h).every(y => y !== undefined))) {
      const br = panel.filter(h => yearsOf(h).some(y => Number(y) > 0)), rest = panel.filter(h => !br.includes(h));
      for (const [nm, hs] of [['either of whose candidate tables reads a bridge year', br], ['neither of whose does', rest]]) if (hs.length) lines.push(`W${w} over the ${hs.length} couples ${nm}: A1 ${iv(survivalItem(hs.map(h => [C(h), A(h)]), n))} points, S1 ${iv(survivalItem(hs.map(h => [C(h), S(h)]), nS))} points (spending CANDC less APP ${iv(spendingItem(hs.map(h => [C(h), A(h)]), n))}%)${hs === br ? ` [${hs.map(h => h.id).join(', ')}]` : ''}`);
    } else lines.push(`W${w} the bridge couples apart: not recorded on these units (each person's readerYears)`);
  }
  let eo = 0, mo = 0, nb = 0;
  for (const h of panel) for (const k of ARMS.slice(1)) { const x = U[h.id][k]; if (x.beside) { eo += x.beside.engineOnly; mo += x.beside.modelOnly; nb += x.beside.N; } }
  lines.push(`the couples' rollout in the model beside the engine: ${nb} paths, the engine alone surviving ${eo}, the model alone ${mo}`);
  const secs = Object.values(U).flatMap(Object.values), hosts = [...new Set(secs.flatMap(x => x.parts.map(c => c.cpu)))];
  lines.push(`the units' core-hours ${(secs.reduce((s, x) => s + x.secs, 0) / 3600).toFixed(1)} (the solves ${(secs.reduce((s, x) => s + x.solveSecs, 0) / 3600).toFixed(1)}); the longest unit ${(Math.max(...secs.map(x => x.secs)) / 3600).toFixed(2)} hours, its longest chunk ${(Math.max(...secs.flatMap(x => x.parts.map(c => c.secs))) / 3600).toFixed(2)}; the hosts: ${hosts.join('; ')}`);
  return { lines, out, items, rows };
}

function planted() {
  const cases = [], n1Was = LAYOUT.n1, shipWas = LAYOUT.ship;
  LAYOUT.n1 = 100;   // a first stage of 100 of the planted units' 400 paths
  LAYOUT.ship = 50;   // SHIPC's own paths: the first 50 of each unit (fewer than the first stage's, as the run's 1,000 are)
  const dir = mkdtempSync(join(tmpdir(), 'd4read-')), n = 400, Y = 30;
  const b64 = (T, len, f) => Buffer.from(T.from({ length: len }, (_, i) => f(i)).buffer).toString('base64');
  const stamp = { code: 'c', audit: 'a', prediction: REGISTRATION, sha: 's', node: 'v' };
  // a CANDC person as registered: the joint tier state (four pairs), the lattice, the solve on anchors on
  const person = (arm, w, over = {}) => Object.entries({ ...WANT[arm], bequestWeight: String(Number(w)), mix: '3', levels: '1,1.1,0.95,0.9,0.8', minPot: '500', raiseW: '0.003', finalIntegral: 'true', ...(arm === 'CANDC' ? { lattice: LATTICE, tierState: '0/0,1/1,2/2,3/3', coarse: COARSE_ON } : {}), readerYears: '0', ...over }).map(([k, v]) => `${k} ${v}`).join(' ');
  // a solver unit's own record: the couples' path as run and D80's three (a null leaves one out, as a unit written before them)
  const headOfUnit = (arm, head) => Object.entries({ config: CONFIG[arm], hhMinPot: '1000', share: '0.5', shareRule: 'half', flat: 'true', fast: 'true', shortlist: 'none', item12: 'none', tieBreak: 'off:tieMargin', ...head }).filter(([, v]) => v !== null).map(([k, v]) => `${k} ${v}`).join(' ');
  const ranOf = (arm, w, over = {}, head = {}) => (arm === 'APP' ? Object.entries({ armA: 'Bracket_Fill', ...APP_WANT, minPot: '1000', ...head }).map(([k, v]) => `${k} ${v}`).join(' ')
    : `${headOfUnit(arm, head)} | self: ${person(arm, w, over)} | part: ${person(arm, w, over)}`);
  // a unit in its chunks: the first stage's alone, or every chunk where `go` (SHIPC's one chunk either way); f(i) gives path
  // i's survival, fy(i) its failure year, cd(i) its cost years' spending, dl(i) its spending; `ranges` plants other chunks
  const unit = (id, cohort, arm, w, lostIdx, { go = false, extra = {}, over = {}, head = {}, skip = -1, fy = i => (lostIdx(i) ? 10 : -1), cd = () => 10, dl = () => 100, costRetired = [true], ranges = null } = {}) => {
    const J = chunksOf(arm);
    for (const [j, lo, hi] of ranges || Array.from({ length: go ? J : 1 }, (_, q) => [q, ...rangeOf(n, arm, q)])) {
      if (j === skip) continue;
      const len = hi - lo, at = f => i => f(lo + i), nb = Math.min(n, firstOf(arm), BESIDE_N);
      writeFileSync(join(dir, `${id}-${arm}-w${w}-c${j}.json.gz`), gzipSync(JSON.stringify({ id, arm, w, chunk: j, chunks: J, lo, hi, cohort, target: 1000, inputs: 'I', stamp, ran: ranOf(arm, w, over, head), seed: SEED, N: n, n: len, Y, costYears: [3], costRetired, solveSecs: 1, engineSecs: 1, secs: 2, label: 'L', cpu: 'host',
        beside: arm === 'APP' || j > 0 ? null : { N: nb, engineOnly: 0, modelOnly: 0, secs: 1, survived: b64(Uint8Array, nb, () => 1) },
        main: { survived: b64(Uint8Array, len, at(i => (lostIdx(i) ? 0 : 1))), estate: b64(Float32Array, len, () => 1), wealth: b64(Float32Array, len, () => 1), delivered: b64(Float32Array, len, at(dl)), unmet: b64(Float32Array, len, () => 0), tax: b64(Float32Array, len, () => 0), failYear: b64(Int16Array, len, at(fy)), level: b64(Uint8Array, len * Y, () => 0), costDelivered: b64(Float32Array, len, at(cd)) }, ...extra })));
    }
  };
  // two couples. C1: APP loses paths 0-39 (in the first stage, failing in year 4, inside its cost year's window), CANDC none,
  // so C1 stops at the first stage at both weights (+40 points); C2: APP loses paths 150-189 (in the second stage), so C2 is
  // level at the first stage and goes on at both weights. SHIPC, on its own first 50 paths of each unit whether its couple
  // stopped or went on, loses paths 0-9 on both. C2's cost year falls before anyone retires (nothing to deliver in it in any arm)
  const panel = [{ id: 'C1', cohort: 'lib', target: 1000, label: 'Bracket Fill Basic, lump sum' }, { id: 'C2', cohort: 'young', target: 1000, label: 'ISA First' }];
  const fair = () => {
    unit('C1', 'lib', 'APP', '-', i => i < 40, { fy: i => (i < 40 ? 4 : -1) });
    unit('C2', 'young', 'APP', '-', i => i >= 150 && i < 190, { go: true, cd: () => 0, costRetired: [false] });
    for (const w of WEIGHTS) {
      unit('C1', 'lib', 'CANDC', w, () => false, { cd: () => 12 }); unit('C1', 'lib', 'SHIPC', w, i => i < 10);
      unit('C2', 'young', 'CANDC', w, () => false, { go: true, cd: () => 0, costRetired: [false] }); unit('C2', 'young', 'SHIPC', w, i => i < 10, { cd: () => 0, costRetired: [false] });
    }
  };
  fair();
  const paths = { C1: n, C2: n };
  let U = loadDir(dir), P = gate(U, panel, paths, null, 'a', { continue: [{ id: 'C2', w: '0.02' }, { id: 'C2', w: '0.01' }] });
  cases.push(['a fair run, each unit in its stages\' chunks, its stage file the read\'s, passes the gate', `${P.length}${P.length ? ` ${P[0]}` : ''}`, '0']);
  // SHIPC's part of this case changed on 11 Nov (D78): two chunks to 400 paths before, now one chunk of its first 50
  cases.push(['the chunks joined path by path: C2 going on, CANDC 4 chunks to 400 paths, SHIPC its one chunk of 50; C1 stopped, its first stage\'s 100, SHIPC 50 there too; C2 APP\'s lost paths where they were', `${U.C2['CANDC/0.02'].parts.length} ${U.C2['SHIPC/0.02'].parts.length} ${U.C2['CANDC/0.02'].main.survived.length} ${U.C2['SHIPC/0.02'].main.survived.length} ${U.C1['CANDC/0.02'].parts.length} ${U.C1['CANDC/0.02'].main.survived.length} ${U.C1['SHIPC/0.01'].main.survived.length} ${U.C2['APP/-'].main.survived.slice(148, 152).join('')}`, '4 1 400 50 1 100 50 1100']);
  const st = stageOf(U, panel);
  cases.push(['the first stage\'s decision: C1 +40 points against APP stops, C2 level goes on', `${st['C1|0.02'].d1.toFixed(1)} ${st['C1|0.02'].on} ${st['C2|0.01'].d1.toFixed(1)} ${st['C2|0.01'].on}`, '40.0 false 0.0 true']);
  const R = report(U, panel);
  cases.push(['A1 is CANDC less APP on the paths every couple ran in CANDC and APP (the first stage\'s 100, not cut to SHIPC\'s 50, where it would read +40), path by path over the couples: +20 points', `${R.items['0.02'].n} ${R.items['0.02'].A1.d.toFixed(3)}`, '100 20.000']);
  // S1's case changed on 11 Nov (D78): +10 points on the first stage's 100 paths before; now on SHIPC's own 50 (10 lost of 50)
  cases.push(['S1 is CANDC less SHIPC on SHIPC\'s own paths (the first 50 of each unit, CANDC\'s same paths): +20 points, its interval taken as A1\'s is; printed as reported, after the outcome', `${R.items['0.02'].nS} ${R.items['0.02'].S1.d.toFixed(3)} ${R.items['0.02'].S1.lo < 20 && R.items['0.02'].S1.hi > 20} ${R.lines.findIndex(l => /^W0\.02: S1 survival CANDC less SHIPC \+20\.000 .* on SHIPC's own paths \(the first 50 of each unit/.test(l)) > R.lines.findIndex(l => /^OUTCOME/.test(l))}`, '50 20.000 true true']);
  cases.push(['the outcome PASS when A1 and A2 clear at both weights; S1 above -0.25 is not logged', `${R.out.outcome} ${R.lines.some(l => /logged in the register/.test(l))}`, 'PASS false']);
  const rowC1 = R.rows.find(r => r.id === 'C1' && r.w === '0.02' && r.nm === 'APP'), rowC2 = R.rows.find(r => r.id === 'C2' && r.w === '0.02' && r.nm === 'APP');
  cases.push(['against APP: C1 stopped, read as not harmed over its 100 paths; C2 read at its 400 by the threshold at N, two-stage rates', `${rowC1.stopped} ${rowC1.flag} ${rowC1.n} ${rowC2.stopped} ${rowC2.n} ${rowC2.N} ${R.lines.some(l => /C1 +W0\.02 CANDC less APP .*stopped at the first stage \(\+40\.000 points against APP there\): read as not harmed/.test(l))}`, 'true false 100 false 400 400 true']);
  cases.push(['the cost years\' spending over the couple retired in its cost year alone (+20%, not +10% with C2\'s noughts averaged in); C2 named as left out', `${R.lines.some(l => /W0\.02 the cost years' spending delivered, over the 1 couples .* CANDC less APP \+20\.000 /.test(l))} ${R.lines.some(l => /left out, .*: 1, C2$/.test(l))}`, 'true true']);
  cases.push(['the paths failing in a cost year or the two after: against APP on the first stage\'s paths, APP 20% over both couples (C1\'s 40 of 100 in year 4), CANDC less APP -20 points; against SHIPC on its own 50 paths', `${R.lines.some(l => /W0\.02 the paths failing .* APP 20\.000%, CANDC 0\.000%; CANDC less APP -20\.000 .*; on SHIPC's 50 paths SHIPC 0\.000%, CANDC 0\.000%, CANDC less SHIPC \+0\.000 /.test(l))}`, 'true']);
  // D34 (4)'s case changed on 11 Nov (D78): 8 comparisons before, half of them against SHIPC; now those against APP alone
  cases.push(['every comparison printed for D34 (4): 2 couples, 2 weights, against APP alone; none against SHIPC', `${R.rows.length} ${R.lines.filter(l => /^ {2}C\d +W0\.0\d CANDC less /.test(l)).length} ${R.rows.some(r => r.nm === 'SHIPC')} ${R.lines.some(l => /CANDC less SHIPC +discordant/.test(l))}`, '4 4 false false']);
  cases.push(['no figure against SHIPC reads past SHIPC\'s paths: none is NaN', `${R.lines.some(l => /NaN/.test(l))}`, 'false']);
  // A2's failing branch: CANDC delivering a tenth less spending than APP
  for (const w of WEIGHTS) unit('C1', 'lib', 'CANDC', w, () => false, { cd: () => 12, dl: () => 90 });
  U = loadDir(dir);
  const R3 = report(U, panel);
  cases.push(['a CANDC delivering a tenth less than APP on one couple fails A2 (-5%) and is flagged for spending', `${R3.out.outcome} ${/A2 at W0\.02/.test(R3.out.decides)} ${R3.lines.some(l => /C1 W0\.02 spending: -10\.00% against APP/.test(l))}`, 'NOT PASSED true true']);
  // a CANDC unit that loses (C1 then below APP at the first stage, so it would have gone on: written whole): A1 fails; S1,
  // far below, is not among what failed, and raises no flag for its couple (this case asked for S1's failure and SHIPC's
  // harm flag before 11 Nov: D78 drops both)
  for (const w of WEIGHTS) unit('C1', 'lib', 'CANDC', w, i => i < 60, { go: true, cd: () => 12 });
  U = loadDir(dir);
  const R2 = report(U, panel);
  cases.push(['a losing CANDC fails A1 at both weights (NOT PASSED) and its harm flag against APP fires; S1 is not among the failed items and there is no harm flag against SHIPC', `${R2.out.outcome} ${/A1 at W0\.02.*A1 at W0\.01/.test(R2.out.decides)} ${R2.lines.some(l => /C1 W0\.02 harm against APP/.test(l))} ${/S1/.test(R2.out.decides)} ${R2.lines.some(l => /harm against SHIPC/.test(l))}`, 'NOT PASSED true true false false']);
  // S1 REPORTED, NOT DECIDING (D78): CANDC loses paths 40-49 on both couples, SHIPC none, so on SHIPC's 50 paths S1 is -20
  // points, its interval wholly below -0.25; A1 (+10: C1 +30, C2 -10 on the first stage) and A2 clear. The outcome is PASS,
  // and the read says S1 is logged in the register with an owner. Under the rule before 11 Nov this read NOT PASSED
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir); fair();
  for (const w of WEIGHTS) {
    unit('C1', 'lib', 'CANDC', w, i => i >= 40 && i < 50, { cd: () => 12 }); unit('C1', 'lib', 'SHIPC', w, () => false);
    unit('C2', 'young', 'CANDC', w, i => i >= 40 && i < 50, { go: true, cd: () => 0, costRetired: [false] }); unit('C2', 'young', 'SHIPC', w, () => false, { cd: () => 0, costRetired: [false] });
  }
  { const US = loadDir(dir), PS = gate(US, panel, paths, null, 'a'), RS = report(US, panel), s = RS.items['0.02'];
    cases.push(['S1 does not decide: CANDC 20 points below SHIPC (its interval wholly below -0.25) with A1 and A2 clearing reads PASS, and the read says it is logged in the register with an owner, the maintainer', `${PS.length} ${s.A1.lo > A1_BAR} ${s.A2.lo > A2_BAR} ${s.S1.d.toFixed(3)} ${s.S1.hi < S1_NOTE} ${RS.out.outcome} ${RS.lines.filter(l => /^ {2}S1 at W0\.0[12]: the interval lies wholly below -0\.25 points: logged in the register of open items with an owner, the maintainer .*the outcome above is unchanged$/.test(l)).length}`, '0 true true -20.000 true PASS 2']); }
  cases.push(['S1 is logged only when its whole interval is below -0.25: an upper end at -0.26 is, at -0.25 or above it is not', `${s1Noted({ hi: -0.26 })} ${s1Noted({ hi: -0.25 })} ${s1Noted({ hi: 0.3 })}`, 'true false false']);
  // one weight stopped, the other gone on (C1: APP loses paths 0-39; CANDC at 0.01 loses 0-59, so W0.01 goes on and APP with
  // it; W0.02 stops): the spending flag paired on the paths both ran, not CANDC's 100 against APP's 400 (APP delivering
  // 1,000 a path past the first stage: unpaired, W0.02 would read -87%). SHIPC at 0.01 stays its one chunk: it never goes on
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir); fair();
  unit('C1', 'lib', 'APP', '-', i => i < 40, { go: true, fy: i => (i < 40 ? 4 : -1), dl: i => (i < 100 ? 100 : 1000) });
  unit('C1', 'lib', 'CANDC', '0.01', i => i < 60, { go: true, cd: () => 12 });
  { const U4 = loadDir(dir), st4 = stageOf(U4, panel), R4 = report(U4, panel), P4 = gate(U4, panel, paths, null, 'a');
    cases.push(['one weight stopped and the other gone on: the gate passes, and the spending flag is read on the paths both ran (no flag at W0.02)', `${st4['C1|0.02'].on} ${st4['C1|0.01'].on} ${P4.length} ${R4.lines.some(l => /C1 W0\.02 spending/.test(l))}`, 'false true 0 false']); }
  // the gate's refusals, each planted once on a fair run
  const refusals = [
    ['a wrong seed', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { extra: { seed: 7002 } }), 'C1 CANDC/0.02: seed 7002'],
    ['another inputs hash', () => unit('C1', 'lib', 'SHIPC', '0.01', i => i < 10, { extra: { inputs: 'J' } }), 'C1: the arms\' inputs differ'],
    ['a person run without the third tier step', () => unit('C2', 'young', 'CANDC', '0.01', () => false, { go: true, cd: () => 0, costRetired: [false], over: { tiersBelow: '2' } }), 'C2 CANDC/0.01 self: ran with tiersBelow 2, not 3'],
    ['a person solved without HR (menuPlus removed)', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { over: { hr: 'no' } }), 'C1 CANDC/0.02 self: ran with hr no, not yes'],
    ['another configuration hash (the candidate before D73\'s port)', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { head: { config: 'd71f65ae871e' } }), 'C1 CANDC/0.02: its configuration d71f65ae871e, not the registration\'s af001697ce1b'],
    ['another lattice (the reference before D73\'s port)', () => unit('C1', 'lib', 'CANDC', '0.01', () => false, { over: { lattice: '160x41x128+foot+stepAll' } }), 'C1 CANDC/0.01 self: the lattice 160x41x128+foot+stepAll, not 80x21x64+foot+stepAll'],
    // D73's port: the two settings each person's record gains (fair-variables rows 35 and 36)
    ['a CANDC person without the sweep to the ISA', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { over: { sweepCashIsaTo: 'unset' } }), 'C1 CANDC/0.02 self: ran with sweepCashIsaTo unset, not isa'],
    ['a SHIPC person with the sweep to the ISA', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { over: { sweepCashIsaTo: 'isa' } }), 'C1 SHIPC/0.02 self: ran with sweepCashIsaTo isa, not unset'],
    ['a CANDC person with the joint tier state solved on the whole menu (the solve on anchors not taken)', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { over: { coarse: 'none' } }), `C1 CANDC/0.02 self: the solve on anchors none, not ${COARSE_ON} (the joint tier state)`],
    ['a CANDC person with the joint tier state recording the solve on anchors off', () => unit('C1', 'lib', 'CANDC', '0.01', () => false, { over: { coarse: COARSE_OFF } }), `C1 CANDC/0.01 self: the solve on anchors ${COARSE_OFF}, not ${COARSE_ON} (the joint tier state)`],
    ['a CANDC person with no joint tier state recording the solve on anchors on', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { over: { tierState: 'null' } }), `C1 CANDC/0.02 self: the solve on anchors ${COARSE_ON}, not ${COARSE_OFF} (no joint tier state)`],
    ['a CANDC person with no joint tier state recording it off for another reason (a locked dial position)', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { over: { tierState: 'null', coarse: 'off:a_locked_dial_position_keeps_the_whole_menu' } }), `C1 CANDC/0.02 self: the solve on anchors off:a_locked_dial_position_keeps_the_whole_menu, not ${COARSE_OFF}`],
    ['a SHIPC person handed the solve on anchors', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { over: { coarse: COARSE_ON } }), `C1 SHIPC/0.02 self: ran with coarse ${COARSE_ON}, not none`],
    // items 11 and 2 as run
    ['the couples\' path off its flat arrays (item 11)', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { head: { flat: 'false' } }), 'C1 CANDC/0.02: the couples\' path ran with COUPLE.flat false, not true'],
    ['the couples\' path off its shared scores (item 2)', () => unit('C1', 'lib', 'SHIPC', '0.01', i => i < 10, { head: { fast: 'false' } }), 'C1 SHIPC/0.01: the couples\' path ran with COUPLE.fast false, not true'],
    ['a unit that does not record the couples\' path', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { head: { flat: null } }), 'C1 CANDC/0.02: the couples\' path ran with COUPLE.flat undefined, not true'],
    // D80
    ['a shortlist on (D80)', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { head: { shortlist: 'ON:SHORT.on' } }), 'C1 CANDC/0.02: shortlist ON:SHORT.on (D80: none in a registered couples\' arm)'],
    ['an option of item 12 on (D80)', () => unit('C1', 'lib', 'CANDC', '0.01', () => false, { head: { item12: 'ON:COUPLE_APPROX.near' } }), 'C1 CANDC/0.01: item12 ON:COUPLE_APPROX.near (D80: none in a registered couples\' arm)'],
    ['item 13\'s tie-break on (D80)', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { head: { tieBreak: 'ON:tieAboveCap' } }), 'C1 SHIPC/0.02: tieBreak ON:tieAboveCap (D80: none in a registered couples\' arm)'],
    ['a unit that does not record D80\'s check', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { head: { tieBreak: null } }), 'C1 CANDC/0.02: tieBreak not recorded (D80: none in a registered couples\' arm)'],
    // SHIPC's own paths (D78)
    ['SHIPC run on past its first paths (a second-stage chunk)', () => unit('C2', 'young', 'SHIPC', '0.02', i => i < 10, { cd: () => 0, costRetired: [false], ranges: [[0, 0, 50], [1, 50, 400]] }), 'C2 SHIPC/0.02: chunks 0,1, not 0 (SHIPC is its first 50 paths alone: no second stage)'],
    ['SHIPC on the first stage\'s paths, not its own first 50', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { ranges: [[0, 0, 100]] }), 'C1 SHIPC/0.02 chunk 0: paths 0 to 100, not 0 to 50'],
    ['SHIPC written as one of two chunks (D4\'s layout)', () => unit('C1', 'lib', 'SHIPC', '0.01', i => i < 10, { extra: { chunks: 2 } }), 'C1 SHIPC/0.01: written in 2 chunks, not 1'],
    ['CANDC and SHIPC on other spending levels', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { over: { levels: '1,1.1,0.95,0.9' } }), 'C1 W0.02 self: CANDC and SHIPC differ in levels'],
    ['CANDC and SHIPC on other minimum pots', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { over: { minPot: '400' } }), 'C1 W0.02 self: CANDC and SHIPC differ in minPot'],
    ['an arm\'s two weights differing beyond the estate weight', () => unit('C1', 'lib', 'SHIPC', '0.01', i => i < 10, { over: { raiseW: '0.004' } }), 'C1 SHIPC self: its two weights differ in raiseW'],
    ['APP without its lookahead', () => unit('C1', 'lib', 'APP', '-', i => i < 40, { head: { lookahead: '0' } }), 'C1 APP/-: ran with lookahead 0, not 5'],
    ['a couple\'s share not half (the share rule on)', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { head: { share: '0.9', shareRule: 'pots' } }), 'C1 SHIPC/0.02: its share 0.9 by pots, not 0.5 by half'],
    ['the household\'s minimum pot not APP\'s', () => unit('C1', 'lib', 'SHIPC', '0.02', i => i < 10, { head: { hhMinPot: '900' } }), 'C1 SHIPC/0.02: the household\'s minimum pot 900, APP\'s 1000'],
    ['a missing unit', () => rmSync(join(dir, 'C1-APP-w--c0.json.gz')), 'C1: no APP/- unit'],
    ['a missing chunk', () => rmSync(join(dir, 'C2-CANDC-w0.02-c2.json.gz')), 'C2 CANDC/0.02: chunks 0,1,3, not 0 to 3'],
    // (these four named SHIPC's second-stage chunk before 11 Nov; SHIPC has none now, so they plant on APP's or CANDC's)
    ['a chunk on the wrong paths', () => unit('C2', 'young', 'APP', '-', i => i >= 150 && i < 190, { go: true, cd: () => 0, costRetired: [false], extra: { lo: 150 }, skip: 0 }), 'C2 APP/- chunk 1: paths 150 to 400, not 100 to 400'],
    ['a stopped couple and weight with second-stage chunks', () => unit('C1', 'lib', 'CANDC', '0.02', () => false, { go: true, cd: () => 12 }), 'C1 CANDC/0.02: chunks 0,1,2,3, not 0 (stopped at the first stage)'],
    ['a couple going on without APP\'s second stage', () => rmSync(join(dir, 'C2-APP-w--c1.json.gz')), 'C2 APP/-: chunks 0, not 0 to 1'],
    ['a chunk on another run record', () => { const f = join(dir, 'C2-CANDC-w0.01-c3.json.gz'), j = JSON.parse(gunzipSync(readFileSync(f))); j.ran = j.ran.replace('readerYears 0', 'readerYears 1'); writeFileSync(f, gzipSync(JSON.stringify(j))); }, 'C2 CANDC/0.01 chunk 3: its ran not its first chunk\'s'],
    ['a wrong path count', () => unit('C2', 'young', 'SHIPC', '0.02', i => i < 10, { cd: () => 0, costRetired: [false], extra: { N: 300 } }), 'C2 SHIPC/0.02: 50 of 300 paths'],
    ['a wrong target', () => unit('C2', 'young', 'SHIPC', '0.01', i => i < 10, { cd: () => 0, costRetired: [false], extra: { target: 990 } }), 'C2 SHIPC/0.01: target 990, the panel\'s 1000'],
    ['a unit not launched under the registration', () => unit('C2', 'young', 'CANDC', '0.02', () => false, { go: true, cd: () => 0, costRetired: [false], extra: { stamp: { ...stamp, prediction: 'NOT-LAUNCHED' } } }), 'C2 CANDC/0.02: stamped under NOT-LAUNCHED'],
    ['the rollout beside missing', () => unit('C2', 'young', 'SHIPC', '0.02', i => i < 10, { cd: () => 0, costRetired: [false], extra: { beside: null } }), 'C2 SHIPC/0.02: the rollout beside missing, not on 50'],
    ['the rollout beside short', () => unit('C2', 'young', 'CANDC', '0.01', () => false, { go: true, cd: () => 0, costRetired: [false], extra: { beside: { N: 50, engineOnly: 0, modelOnly: 0, secs: 1, survived: '' } } }), 'C2 CANDC/0.01: the rollout beside on 50 paths, not on 100'],
    ['whether anyone is retired in the cost year not recorded', () => unit('C2', 'young', 'APP', '-', i => i >= 150 && i < 190, { go: true, cd: () => 0, costRetired: null }), 'C2 APP/-: whether anyone is retired in each cost year not recorded']
  ];
  for (const [nm, plant, want] of refusals) {
    rmSync(dir, { recursive: true, force: true }); mkdirSync(dir); fair();
    plant();
    const Q = gate(loadDir(dir), panel, paths, null, 'a');
    cases.push([`the gate names ${nm}`, `${Q.some(p => p.startsWith(want))}${Q.some(p => p.startsWith(want)) ? '' : ` [${Q.join(' / ')}]`}`, 'true']);
  }
  // a person with no joint tier state (consent withdrawn, or one tier pair) recording the solve on anchors off with its reason
  // is not refused for it: C1's two CANDC units, both people (none of the 40 couples has such a person: each has four pairs)
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir); fair();
  for (const w of WEIGHTS) unit('C1', 'lib', 'CANDC', w, () => false, { cd: () => 12, over: { tierState: 'null', coarse: COARSE_OFF } });
  { const Q = gate(loadDir(dir), panel, paths, null, 'a'); cases.push(['the gate passes a CANDC person with no joint tier state who records the solve on anchors off with its reason', `${Q.length}${Q.length ? ` ${Q[0]}` : ''}`, '0']); }
  // the audit hash not the files', and more than one stamp
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir); fair();
  cases.push(['the gate names a unit launched on other files (its audit hash not the files\' as read)', `${gate(loadDir(dir), panel, paths, null, 'b').some(p => /launched on files hashing a; the files this read takes hash b/.test(p))}`, 'true']);
  cases.push(['the gate names a stage file whose decision is not the read\'s (C1 at 0.02 run on)', `${gate(loadDir(dir), panel, paths, null, 'a', { continue: [{ id: 'C1', w: '0.02' }, { id: 'C2', w: '0.02' }, { id: 'C2', w: '0.01' }] }).some(p => /^the stage gate's decision \(stage2\.json\) not the read's/.test(p))}`, 'true']);
  unit('C2', 'young', 'SHIPC', '0.01', i => i < 10, { cd: () => 0, costRetired: [false], extra: { stamp: { ...stamp, code: 'd' } } });
  cases.push(['the gate names more than one stamp across the units', `${gate(loadDir(dir), panel, paths, null, 'a').some(p => /^2 stamps across the units/.test(p))}`, 'true']);
  rmSync(dir, { recursive: true, force: true });
  // a couple's threshold from its own discordance: 40 of 400 discordant, all lost: a 10-point loss, flagged
  { const c = { survived: Uint8Array.from({ length: 400 }, (_, i) => (i < 40 ? 0 : 1)) }, o = { survived: Uint8Array.from({ length: 400 }, () => 1) }, h = harmOf(c, o);
    cases.push(['a couple\'s threshold from its own discordance at its paths; a 10-point loss flagged', `${h.flag} ${h.t > 0.25}`, 'true true']);
    const z = harmOf(o, o); cases.push(['no discordance: priced at the 1.01% a 1-point loss needs, no flag', `${z.flag} ${z.dUp.toFixed(4)}`, 'false 0.0101']); }
  // D34's 1-point rate at 19,000 paths: below 0.90 at a 15% discordance (named), above it at 5%
  { const N = 19000, pair = q => { const k = Math.round(q * N); return [{ survived: Uint8Array.from({ length: N }, (_, i) => (i < k / 2 ? 0 : 1)) }, { survived: Uint8Array.from({ length: N }, (_, i) => (i >= k / 2 && i < k ? 0 : 1)) }]; };
    const a = harmOf(...pair(0.15)), b = harmOf(...pair(0.05));
    cases.push(['at 19,000 paths a 15% discordance holds a 1-point loss below 0.90 (named), a 5% one above it; the quarter-point rate at most 0.05 in both', `${a.tp < TP_BAR} ${b.tp >= TP_BAR} ${a.fp <= 0.05 && b.fp <= 0.05}`, 'true true true']); }
  let bad = 0;
  for (const [nm, got, w] of cases) { const ok = got === w; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${nm}: ${got}${ok ? '' : ` (want ${w})`}`); }
  LAYOUT.n1 = n1Was; LAYOUT.ship = shipWas;
  console.log('EDGES: no discordance, a missing unit, a missing chunk, a stopped couple with second-stage chunks, a couple going on without them, a stage file not the read\'s, a cost year with no one retired, a wrong seed, the weights differing beyond the estate weight, a losing candidate, A2 failing, a 1-point rate below 0.90, S1 far below with A1 and A2 clearing, S1\'s upper end exactly at -0.25, SHIPC with a second-stage chunk, SHIPC on the first stage\'s paths, a person with no joint tier state, a unit recording nothing of D80');
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

async function read(dir) {
  const { requireFairLogs } = await import('./fair-gate.mjs');
  const logs = Object.fromEntries(readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(dir, f), 'utf8')]));
  requireFairLogs(logs, REGISTRATION);
  const ls = [...Object.values(logs).join('\n').matchAll(LOG_STAMP)].map(([, code, audit, , sha]) => ({ code, audit, sha })), logStamp = ls[0] || null;
  if (new Set(ls.map(x => JSON.stringify(x))).size > 1) { console.log('THE GATE: REFUSED (the logs carry more than one stamp)'); process.exit(1); }
  const panel = JSON.parse(readFileSync(join(HERE, 'couples-panel-d4b.json'), 'utf8')).panel, reg = JSON.parse(readFileSync(join(HERE, 'couples-paths-d4b.json'), 'utf8'));
  const stage2 = JSON.parse(readFileSync(join(dir, 'stage2.json'), 'utf8'));
  if (reg.n1 !== LAYOUT.n1 || reg.bar !== LAYOUT.bar || reg.shipN !== LAYOUT.ship) { console.log(`THE GATE: REFUSED (couples-paths-d4b.json's stages ${reg.n1} and ${reg.bar} and SHIPC's paths ${reg.shipN}, not this read's ${LAYOUT.n1}, ${LAYOUT.bar} and ${LAYOUT.ship})`); process.exit(1); }
  if (stage2.shipN !== LAYOUT.ship) { console.log(`THE GATE: REFUSED (the stage gate's stage2.json has SHIPC on ${stage2.shipN} paths, not this read's ${LAYOUT.ship})`); process.exit(1); }
  const { stampFilesHash } = await import('./audit-couples.mjs');
  const U = loadDir(dir), problems = gate(U, panel, reg.paths, logStamp, stampFilesHash(), stage2);
  console.log(`D4B READ: ${dir}; ${Object.keys(U).length} couples`);
  // the run on the code the couples were landed on (the design review of 11 Nov, MINOR 1)
  const landed = JSON.parse(readFileSync(join(HERE, 'couples-panel-d4b.json'), 'utf8')).code;
  if (logStamp && logStamp.code !== landed) { console.log(`THE GATE: REFUSED (the run's code ${logStamp.code}, the panel landed on ${landed})`); process.exit(1); }
  if (problems.length) { console.log(`THE GATE: REFUSED (${problems.length})\n  ${problems.join('\n  ')}`); process.exit(1); }
  const st = stageOf(U, panel), on = Object.values(st).filter(v => v.on).length;
  console.log(`the gate: fair - ${panel.length} couples in every arm, each unit in its chunks, seed ${SEED} on their registered paths (${reg.N}) in two stages (the first ${LAYOUT.n1}; ${on} of ${Object.keys(st).length} couple-weights went on, as the run's stage gate decided; SHIPC on the first ${LAYOUT.ship} paths of each unit, in one chunk, whatever went on), one stamp; CANDC ${CONFIG.CANDC} (the sweep to the ISA; the solve on anchors ${COARSE_ON} wherever a person's solve has the joint tier state; the reference's lattice ${LATTICE}), SHIPC ${CONFIG.SHIPC}; the couples' path on its flat arrays and shared scores; no shortlist, item 12 option or tie-break in any unit (D80)`);
  console.log(report(U, panel).lines.join('\n'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
  // the pilot's figures through this read's items (EXPLORATORY: the pilot's seed, no registration, no gate but the units' own)
  if (process.argv[2] === '--pilot') {
    LAYOUT.oneStage = true;
    const dir = process.argv[3] || join(HERE, 'results', 'd4-pilot'), U = loadDir(dir), panelAll = JSON.parse(readFileSync(join(HERE, 'couples-panel.json'), 'utf8')).panel;
    const panel = panelAll.filter(h => U[h.id] && ARMS.every(k => U[h.id][k]));
    const any = Object.values(U).flatMap(Object.values)[0];
    console.log(`D4'S PILOT, EXPLORATORY (${dir.replace(/.*research\/solver\//, '')}): ${panel.map(h => h.id).join(', ')}; seed ${any.seed}, ${any.N} paths a unit, each unit whole; not the registered read`);
    const inputs = panel.filter(h => new Set(ARMS.map(k => U[h.id][k].inputs)).size > 1);
    console.log(`each couple's five units on one inputs hash: ${inputs.length ? `NO (${inputs.map(h => h.id).join(', ')})` : 'yes'}`);
    // D4's pilot units alone lack these two records; a pilot run since has both, and the line is not printed for it
    if (panel.some(h => !Array.isArray(U[h.id]['APP/-'].costRetired))) console.log('(the pilot\'s units predate the cost years\' retired record and each person\'s readerYears: whether anyone is retired in the cost year is read from the spending delivered in it under APP)');
    console.log(report(U, panel).lines.join('\n'));
    process.exit(0);
  }
  await read(process.argv[2] || join(HERE, 'results', 'd4b-run'));
}
