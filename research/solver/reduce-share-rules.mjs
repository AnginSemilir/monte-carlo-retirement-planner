/*
 * THE SHARE RULES' TEST, THE READ (registrations/share-rules.md; read once, by its rule).
 * The stamps first (fair-gate.mjs requireFairLogs: every log stamped by the launcher under the registration, its git blob the
 * registration's now), then the gate: every unit of share-rules-panel.json in TODAY and MEANS, and in FLAT exactly where its
 * share differs from TODAY's (where it does not, FLAT's solve would be TODAY's to the bit, the same share on the same plan, so
 * TODAY's run stands for FLAT's in MEANS against FLAT: withStandIn); one code, audit, seed, prediction, estate weight and Node version; each
 * unit at the registration's paths (share-rules-paths.json), every array one a path; each unit's arms on one plan (the inputs
 * hash with each person's MPAA age left out, the age following each arm's own drawing) at the panel's target, arm A's pick the
 * landing's; each arm at its configuration and its rule's share (couple.js shareBy on the unit's plan); each person's settings
 * the couples' registered run's (audit-couples.mjs wantProblems), the couples' path flat and fast, D80's three none.
 * Then the rule, for FLAT and for MEANS against TODAY, each on the units where its share differs from TODAY's:
 *   1. no unit flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths against the threshold its
 *      realised discordance sets), the loss and the threshold compared in whole paths (harmExact);
 *   2. the pooled survival change (reduce-phase4.mjs survivalItem, its 95% interval by path) with its lower end above 0;
 *   3. spending: the pooled change in spending delivered (reduce-phase4.mjs spendingItem: each unit's in percent of the base's
 *      mean spending delivered, the units weighted equally), its point estimate not below -0.05%.
 * Which is taken: both hold, MEANS only if against FLAT, on every unit where their shares differ (all 32, TODAY's run standing
 * for FLAT's where FLAT's share is TODAY's), its pooled survival change has its lower end above 0, else FLAT; one holds, that
 * one; neither, NEITHER (today's split stays). Beside, deciding nothing: each rule's mean pot left, lifetime tax and spending,
 * the rollout's fidelity gaps beside the engine, and the solve times.
 * A comparison whose 1-point rate at its realised discordance falls below 0.90 is named with its rate (D34 (4)).
 *   node research/solver/reduce-share-rules.mjs [dir] > research/solver/results-share-rules.txt     the registered read
 *   node research/solver/reduce-share-rules.mjs --pilot [dir]                                        the pilot's units, no outcome
 *   node research/solver/reduce-share-rules.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem, spendingItem } from './reduce-phase4.mjs';
import { harmOf } from './reduce-couples.mjs';
import { wantProblems } from './audit-couples.mjs';
import { requireFairLogs, checkLogStamps } from './fair-gate.mjs';
import { ARMS, RULE_OF, SEED, PILOT_SEED, REGISTRATION, PATHS_FILE, W, configOf, shareOfArm, flatRuns, stampFilesHash, pilotUnits } from './audit-share-rules.mjs';
import { readSharePanel, PANEL } from './share-rules-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TP_BAR = 0.9, POOL_BAR = 0, SPEND_BAR = -0.05;
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const T = { survived: Uint8Array, wealth: Float32Array, estate: Float32Array, delivered: Float32Array, unmet: Float32Array, tax: Float32Array, failYear: Int16Array };
const dec = (b64, C) => { const b = Buffer.from(b64, 'base64'); return new C(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
export const mainOf = m => Object.fromEntries(Object.entries(T).map(([k, C]) => [k, dec(m[k], C)]));
export function loadDir(dir) {
  const U = {};
  for (const x of readdirSync(dir).filter(x => /\.json\.gz$/.test(x))) {
    const r = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString());
    (U[r.id] = U[r.id] || {})[r.arm] = { ...r, main: mainOf(r.main) };
  }
  return U;
}
/* the arms a unit runs: TODAY and MEANS always, FLAT where its share differs from TODAY's */
export const armsOf = u => ARMS.filter(a => a !== 'FLAT' || flatRuns(u.plan));
/* each person's settings line from an arm's record (`| self: ... | part: ...`) */
export const personLine = (ran, who) => { const m = new RegExp(`${who}: (.*?)(?: \\| |$)`).exec(ran || ''); return m ? m[1] : ''; };
const kv = s => Object.fromEntries((s.match(/(\S+) (\S+)/g) || []).map(x => x.split(' ')));
/* the gate: refusals, each a line. `units` the panel's units (id, kind, target, label, plan); `paths` id -> N, or null (pilot) */
export function gate(U, units, { seed, prediction = null, audit = null, paths = null, ptsFree = false, code = null } = {}) {
  const P = [], all = [];
  for (const u of units) {
    for (const arm of armsOf(u)) { const r = U[u.id] && U[u.id][arm]; if (!r) P.push(`${u.id} ${arm}: missing`); else all.push(r); }
    // FLAT where its share is TODAY's would be a run the rule does not read: its presence is a fault of the batch
    if (!flatRuns(u.plan) && U[u.id] && U[u.id].FLAT) P.push(`${u.id} FLAT: run where its share is TODAY's`);
  }
  const one = (what, g) => { const vs = [...new Set(all.map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', r => r.stamp.code); one('audit', r => r.stamp.audit); one('seed', r => r.seed); one('prediction', r => r.stamp.prediction); one('estate weight', r => r.W); one('Node version', r => r.stamp.node);
  if (all.some(r => r.seed !== seed)) P.push(`a unit is not on seed ${seed}`);
  if (all.some(r => r.W !== W)) P.push(`a unit is not at estate weight ${W}`);
  if (prediction && all.some(r => r.stamp.prediction !== prediction)) P.push(`a unit was not run under ${prediction}`);
  if (audit && all.some(r => r.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (code && all.some(r => r.stamp.code !== code)) P.push(`a unit's code is not the code the panel was landed on (${code})`);
  for (const u of units) {
    const R = U[u.id] || {}, arms = armsOf(u); if (arms.some(a => !R[a])) continue;
    const N = paths ? paths[u.id] : R.TODAY.N;
    if (!(N > 0)) P.push(`${u.id}: no paths for it`);
    for (const arm of arms) {
      const r = R[arm], head = kv(r.ran.split(' | ')[0]), want = shareOfArm(arm, u.plan);
      if (r.N !== N) P.push(`${u.id} ${arm}: ${r.N} paths, not ${N}`);
      for (const k of Object.keys(T)) if (r.main[k].length !== r.N) P.push(`${u.id} ${arm}: ${k} not one a path`);
      if (r.inputsNoMpaa !== R.TODAY.inputsNoMpaa) P.push(`${u.id} ${arm}: not on the unit's plan (inputs ${r.inputsNoMpaa}, TODAY's ${R.TODAY.inputsNoMpaa})`);
      if (r.label !== u.label) P.push(`${u.id} ${arm}: arm A's pick ${r.label}, not the landing's ${u.label}`);
      if (r.target !== u.target) P.push(`${u.id} ${arm}: target ${r.target}, not the panel's ${u.target}`);
      if (r.config !== configOf(arm)) P.push(`${u.id} ${arm}: configuration ${r.config}, not ${configOf(arm)}`);
      if (Math.abs(r.share - want) > 1e-12 || r.shareRule !== RULE_OF[arm]) P.push(`${u.id} ${arm}: share ${r.share} ${r.shareRule}, not ${want} ${RULE_OF[arm]}`);
      if (head.flat !== 'true' || head.fast !== 'true') P.push(`${u.id} ${arm}: the couples' path flat ${head.flat} fast ${head.fast}`);
      for (const k of ['shortlist', 'item12', 'tieBreak']) if (!/^(none|off:\S+)$/.test(head[k] || '')) P.push(`${u.id} ${arm}: ${k} ${head[k]} (D80: none in a registered couples' arm)`);
      for (const who of ['self', 'part']) { const line = personLine(r.ran, who); if (!/\S+ \S+/.test(line)) { P.push(`${u.id} ${arm} ${who}: no settings line`); continue; } const bad = wantProblems('CANDC', line, W, ptsFree); if (bad.length) P.push(`${u.id} ${arm} ${who}: ${bad.join('; ')}`); }
    }
  }
  return P;
}
/* D34's harm rule with its flag in whole paths: the loss (paths the base keeps and the arm loses, less those it saves) above the
   threshold harmOf's realised discordance sets, the threshold taken back to whole paths (it is 100 j / n), so a loss on the
   threshold is read exactly (paired-exact.mjs's class) */
export function harmExact(c, o, n) {
  // size-phase4.mjs thresholdFor sets the threshold as 100 * j / N for a whole j: j taken back by the same expression, which
  // gives the same double for any N (an exact rational test, cmpBar, failed at 17,000 to 19,000 paths, where 100 j / N is
  // not a double: the reviewer of the registration, MINOR 5; the planted cases hold N from 16,000 to 19,000)
  const h = harmOf(c, o, n), j = Math.round(h.t * h.n / 100), k = h.lost - h.saved;
  if (100 * j / h.n !== h.t) throw new Error(`reduce-share-rules: the threshold ${h.t} is not a whole number of paths of ${h.n}`);
  return { ...h, j, flag: k > j };
}
/* FLAT's runs with TODAY's standing where FLAT's share is TODAY's (the 90/10 units: FLAT is not run there, its solve the same as
   TODAY's to the bit), so that MEANS against FLAT is read on every unit where the two shares differ (the reviewer of the
   registration, BLOCKING 2: compare kept only the units FLAT ran) */
export function withStandIn(U, units) {
  const V = {};
  for (const u of units) {
    const R = U[u.id]; if (!R) continue;
    V[u.id] = { ...R };
    if (!R.FLAT && R.TODAY && !flatRuns(u.plan)) V[u.id].FLAT = { ...R.TODAY, arm: 'FLAT', standsFor: 'TODAY' };
  }
  return V;
}
/* the launch logs' stamps against the registration (fair-gate.mjs checkLogStamps, its blob the registration's now): exported for
   the planted cases (the reviewer of the registration, BLOCKING 1: the read had given the exploratory form, every log then
   read as PREDICTION EDITED) */
export const logProblems = (texts, opts) => checkLogStamps(texts, REGISTRATION, opts);
/* one rule against another on the units where their shares differ: each unit's harm, the pooled survival change and spending */
export function compare(U, units, X, B) {
  const on = units.filter(u => U[u.id] && U[u.id][X] && U[u.id][B] && Math.abs(U[u.id][X].share - U[u.id][B].share) > 1e-12);
  if (!on.length) return { X, B, rows: [], pooled: null, spend: null, n: 0 };
  const n = Math.min(...on.map(u => U[u.id][X].N));
  const rows = on.map(u => { const c = U[u.id][X].main, o = U[u.id][B].main, s = a => 100 * a.survived.reduce((t, x) => t + x, 0) / a.survived.length;
    return { id: u.id, kind: u.kind, variant: u.variant, feature: u.feature, shareX: U[u.id][X].share, shareB: U[u.id][B].share, sX: s(c), sB: s(o), ...harmExact(c, o, U[u.id][X].N) }; });
  const pairs = on.map(u => [U[u.id][X].main, U[u.id][B].main]);
  return { X, B, rows, pooled: survivalItem(pairs, n), spend: spendingItem(pairs, n), n };
}
/* a rule holds: no unit flagged, the pooled gain's lower end above 0, spending not lower by more than 0.05% */
export const holds = C => !!C.pooled && C.rows.every(r => !r.flag) && C.pooled.lo > POOL_BAR && C.spend.d >= SPEND_BAR;
export function decide(flat, means, meansOverFlat) {
  const hf = holds(flat), hm = holds(means);
  if (hf && hm) return meansOverFlat && meansOverFlat.pooled && meansOverFlat.pooled.lo > POOL_BAR ? { outcome: 'MEANS PASSES', rule: 'means' } : { outcome: 'FLAT PASSES', rule: 'potsflat' };
  if (hm) return { outcome: 'MEANS PASSES', rule: 'means' };
  if (hf) return { outcome: 'FLAT PASSES', rule: 'potsflat' };
  return { outcome: 'NEITHER', rule: null };
}

function planted() {
  const cases = [], arr = (n, ones) => { const a = new Uint8Array(n); for (const i of ones) a[i] = 1; return a; };
  // the flag in whole paths: a loss sitting on its own threshold (each comparison sets it from its own discordance) is not harm,
  // and over a range of losses the flag is harmOf's own, path for path
  { const lose = (n, k) => ({ c: { survived: arr(n, []) }, o: { survived: arr(n, Array.from({ length: k }, (_, i) => i)) } });
    let on = null, agree = true;
    for (const n of [1000, 2000, 4000]) {
      for (let k = 1; k <= n / 10; k++) { const x = lose(n, k), h = harmExact(x.c, x.o, n), g = harmOf(x.c, x.o, n); if (h.flag !== g.flag) agree = false; if (!on && h.lost - h.saved === h.j) on = { n, k, flag: h.flag }; }
      if (on) break;
    }
    cases.push(['the harm flag in whole paths: a loss on its own threshold found and not flagged; over every loss tried, the same flag as harmOf\'s', `${!!on} ${on ? on.flag : '-'} ${agree}`, 'true false true']); }
  // the decision
  { const C = (flag, lo, sd) => ({ rows: [{ flag }], pooled: { lo }, spend: { d: sd } });
    const d = (a, b, m) => decide(a, b, m).outcome;
    cases.push(['both hold and MEANS beats FLAT beyond noise: MEANS', d(C(false, 0.1, 0), C(false, 0.3, 0), { pooled: { lo: 0.05 } }), 'MEANS PASSES']);
    cases.push(['both hold, MEANS not beyond noise over FLAT: FLAT', d(C(false, 0.1, 0), C(false, 0.3, 0), { pooled: { lo: -0.01 } }), 'FLAT PASSES']);
    cases.push(['FLAT flagged on a unit, MEANS holds: MEANS', d(C(true, 0.5, 0), C(false, 0.2, 0), null), 'MEANS PASSES']);
    cases.push(['MEANS\' gain not beyond noise, FLAT holds: FLAT', d(C(false, 0.2, 0), C(false, -0.1, 0), null), 'FLAT PASSES']);
    cases.push(['FLAT\'s spending lower by more than 0.05%, MEANS flagged: NEITHER', d(C(false, 0.2, -0.06), C(true, 0.3, 0), null), 'NEITHER']); }
  // the gate on a built unit set
  { const panel = readSharePanel(), u45 = panel.find(u => u.variant === '45'), u90 = panel.find(u => u.variant === '90'), units = [u45, u90];
    const rec = (u, arm, extra = {}) => ({ id: u.id, arm, N: 4, W, seed: 1, stamp: { code: 'c', audit: 'a', prediction: 'p', node: 'n' }, inputsNoMpaa: 'h', label: u.label, target: u.target, config: configOf(arm),
      share: shareOfArm(arm, u.plan), shareRule: RULE_OF[arm], ran: 'config x flat true fast true shortlist none item12 none tieBreak none | self: | part: ', main: Object.fromEntries(Object.entries(T).map(([k, C]) => [k, new C(4)])), ...extra });
    const build = mod => { const U = {}; for (const u of units) { U[u.id] = {}; for (const a of armsOf(u)) U[u.id][a] = rec(u, a); } if (mod) mod(U); return U; };
    const G = (U, o = {}) => gate(U, units, { seed: 1, ptsFree: true, ...o }).filter(x => !/self|part/.test(x));
    cases.push(['the gate: the built units fair (the settings lines left to the run)', String(G(build()).length), '0']);
    cases.push(['the gate: FLAT missing where its share differs is refused', String(G(build(U => { delete U[u45.id].FLAT; })).some(x => /FLAT: missing/.test(x))), 'true']);
    cases.push(['the gate: FLAT run where its share is TODAY\'s is refused', String(G(build(U => { U[u90.id].FLAT = rec(u90, 'FLAT'); })).some(x => /share is TODAY's/.test(x))), 'true']);
    cases.push(['the gate: a share not the rule\'s is refused', String(G(build(U => { U[u45.id].FLAT.share = 0.5; })).some(x => /share 0.5/.test(x))), 'true']);
    cases.push(['the gate: another seed, another code, another plan are refused', `${G(build(U => { U[u45.id].MEANS.seed = 2; })).some(x => /seed/.test(x))} ${G(build(U => { U[u45.id].MEANS.stamp = { ...U[u45.id].MEANS.stamp, code: 'd' }; })).some(x => /code/.test(x))} ${G(build(U => { U[u90.id].MEANS.inputsNoMpaa = 'g'; })).some(x => /plan/.test(x))}`, 'true true true']);
    cases.push(['the gate: a tie-break on is refused (D80)', String(G(build(U => { U[u45.id].TODAY.ran = U[u45.id].TODAY.ran.replace('tieBreak none', 'tieBreak on:1e-4'); })).some(x => /tieBreak/.test(x))), 'true']);
    // every other refusal on its own planted fault (the reviewer of the registration, MINOR 5: CHECKLIST 5)
    const M = U => U[u45.id].MEANS;
    const faults = [
      ['another audit', U => { M(U).stamp = { ...M(U).stamp, audit: 'z' }; }, {}, /more than one audit/],
      ['another prediction', U => { M(U).stamp = { ...M(U).stamp, prediction: 'q' }; }, {}, /more than one prediction/],
      ['another Node', U => { M(U).stamp = { ...M(U).stamp, node: 'm' }; }, {}, /more than one Node version/],
      ['another estate weight', U => { M(U).W = 0.01; }, {}, /estate weight/],
      ['another count of paths', U => { M(U).N = 3; }, {}, /MEANS: 3 paths, not 4/],
      ['an array not one a path', U => { M(U).main.tax = new Float32Array(3); }, {}, /MEANS: tax not one a path/],
      ["another of arm A's picks", U => { M(U).label = 'x'; }, {}, /arm A's pick x/],
      ['another target', U => { M(U).target = 1; }, {}, /MEANS: target 1/],
      ['another configuration', U => { M(U).config = 'z'; }, {}, /configuration z/],
      ["the couples' path not flat", U => { M(U).ran = M(U).ran.replace('flat true', 'flat false'); }, {}, /path flat false/],
      ['a shortlist on (D80)', U => { M(U).ran = M(U).ran.replace('shortlist none', 'shortlist order'); }, {}, /shortlist order/],
      ["item 12's options on (D80)", U => { M(U).ran = M(U).ran.replace('item12 none', 'item12 on'); }, {}, /item12 on/],
      ['an audit not these files\'', null, { audit: 'b' }, /audit is not these files/],
      ['run under another prediction', null, { prediction: 'r' }, /not run under r/],
      ["a code not the panel's", null, { code: 'k' }, /not the code the panel was landed on/],
      ["the registration's paths not run", null, { paths: Object.fromEntries(units.map(u => [u.id, 5])) }, /4 paths, not 5/]
    ];
    const missed = faults.filter(([, mod, o, re]) => !G(build(mod), o).some(x => re.test(x))).map(([n]) => n);
    cases.push([`the gate: every other refusal on its planted fault (${faults.length})`, missed.join(', ') || 'all fire', 'all fire']);
    // the stand-in: MEANS against FLAT on both units, TODAY's run standing for FLAT's at 90/10 (BLOCKING 2), where without it the
    // 90/10 unit dropped out; and none where FLAT should have run
    { const U = build(), V = withStandIn(U, units), W2 = withStandIn(build(X => { delete X[u45.id].FLAT; }), units);
      cases.push(["MEANS against FLAT: TODAY's run stands for FLAT's at 90/10, so both units are read (one without it); no stand-in where FLAT should have run",
        `${compare(V, units, 'MEANS', 'FLAT').rows.length} ${compare(U, units, 'MEANS', 'FLAT').rows.length} ${V[u90.id].FLAT.standsFor} ${!!W2[u45.id].FLAT}`, '2 1 TODAY false']); } }
  // the launch logs as run-from-snapshot.sh stamps them, against the registration's blob (BLOCKING 1)
  { const sha = 'a'.repeat(40), log = (pred, sh) => `stamp: code c0 audit a0 prediction ${pred} sha ${sh}\nnode v22\n`;
    const fair = logProblems({ 'case0.txt': log(REGISTRATION, sha) }, { blob: () => sha });
    const edited = logProblems({ 'case0.txt': log(REGISTRATION, sha) }, { blob: () => 'b'.repeat(40), textAt: () => 'as launched', textNow: () => 'edited' });
    const byHand = logProblems({ 'case0.txt': log('NOT-LAUNCHED', '-') }, { blob: () => sha });
    const oldForm = logProblems({ 'case0.txt': log(REGISTRATION, sha) }, { blob: () => '-', textAt: () => 'as launched', textNow: () => 'edited' });
    cases.push(["the launch logs: one stamped under the registration as it stands is fair; under an edited registration, run by hand, or read with the exploratory form's blob ('-'), refused",
      `${fair.length} ${edited.some(x => /PREDICTION EDITED/.test(x))} ${byHand.some(x => /outside run-from-snapshot/.test(x))} ${oldForm.some(x => /PREDICTION EDITED/.test(x))}`, '0 true true true']); }
  // the threshold in whole paths at any count the sizing can give (D61's 19,000 the most): no throw, the flag harmOf's
  { let thrown = 0, agree = 0, n = 0;
    for (const N of [16000, 17000, 18000, 19000]) for (const k of [0, 40, 80, 160, 320]) {
      const c = { survived: new Uint8Array(N).fill(1) }, o = { survived: new Uint8Array(N).fill(1) };
      for (let i = 0; i < k; i++) o.survived[i] = 0;
      n++; try { const h = harmExact(c, o, N), g = harmOf(c, o, N); if (h.flag === g.flag) agree++; } catch { thrown++; }
    }
    cases.push(['the threshold in whole paths at 16,000 to 19,000 paths: none throws, every flag harmOf\'s', `${thrown} ${agree === n}`, '0 true']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED: ${bad} of ${cases.length}` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--planted') process.exit(planted() ? 1 : 0);
  const PILOT = args[0] === '--pilot', dir = (PILOT ? args[1] : args[0]) || join(HERE, 'results', PILOT ? 'share-rules-pilot' : 'share-rules-run');
  const panel = readSharePanel(), units = PILOT ? pilotUnits(panel) : panel, U = loadDir(dir);
  const paths = PILOT ? null : JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths, code = JSON.parse(readFileSync(PANEL, 'utf8')).code;
  if (!PILOT) requireFairLogs(existsSync(dir) ? Object.fromEntries(readdirSync(dir).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(dir, x), 'utf8')])) : {}, REGISTRATION);
  // the pilot (EXPLORATORY, sizing only) is read on its own files' stamp: its units keep the audit they ran under
  const P = gate(U, units, { seed: PILOT ? PILOT_SEED : SEED, prediction: PILOT ? null : REGISTRATION, audit: PILOT ? null : stampFilesHash(), paths, code });
  console.log(`THE SHARE RULES' TEST${PILOT ? ' (THE PILOT: NOT AN OUTCOME)' : ''}: ${units.length} units of ${dir.split('/').slice(-1)[0]}; the gate: ${P.length ? 'REFUSED' : 'fair'}`);
  if (P.length) { for (const x of P.slice(0, 20)) console.log(`  ${x}`); process.exit(1); }
  const V = withStandIn(U, units), flat = compare(V, units, 'FLAT', 'TODAY'), means = compare(V, units, 'MEANS', 'TODAY'), mvf = compare(V, units, 'MEANS', 'FLAT');
  for (const C of [flat, means]) {
    console.log(`\n${C.X} against ${C.B}, on the ${C.rows.length} units where its share differs (${C.n} paths each pooled):`);
    for (const r of C.rows) console.log(`  ${r.id.padEnd(12)} share ${r.shareB.toFixed(3)} to ${r.shareX.toFixed(3)}; ${r.sB.toFixed(2)}% to ${r.sX.toFixed(2)}%: ${r.lost} lost, ${r.saved} saved of ${r.n}, the loss ${f(r.loss)} against the threshold ${r.t.toFixed(3)} (${r.j} paths); discordance ${(100 * r.disc).toFixed(2)}% (upper ${(100 * r.dUp).toFixed(2)}%), the 1-point rate ${r.tp.toFixed(3)}${r.tp < TP_BAR ? ' (BELOW 0.90: named, D34 (4))' : ''}: ${r.flag ? 'FLAGGED' : 'not flagged'}`);
    if (!PILOT) {
      console.log(`  1. no unit flagged: ${C.rows.some(r => r.flag) ? `FAILS (${C.rows.filter(r => r.flag).map(r => r.id).join(', ')})` : 'HOLDS'}`);
      console.log(`  2. the pooled survival change ${f(C.pooled.d)} (${f(C.pooled.lo)} to ${f(C.pooled.hi)}, se ${C.pooled.se.toFixed(4)}): its lower end above 0: ${C.pooled.lo > POOL_BAR ? 'HOLDS' : 'FAILS'}`);
      console.log(`  3. pooled spending delivered ${f(C.spend.d, 4)}% of TODAY's (${f(C.spend.lo, 4)} to ${f(C.spend.hi, 4)}): not lower by more than 0.05%: ${C.spend.d >= SPEND_BAR ? 'HOLDS' : 'FAILS'}`);
      console.log(`  ${C.X}: ${holds(C) ? 'HOLDS 1 to 3' : 'FAILS'}`);
    }
  }
  if (!PILOT) {
    if (mvf.pooled) console.log(`\nMEANS against FLAT, on the ${mvf.rows.length} units where their shares differ: the pooled survival change ${f(mvf.pooled.d)} (${f(mvf.pooled.lo)} to ${f(mvf.pooled.hi)})`);
    const D = decide(flat, means, mvf);
    console.log(`\nTHE SHARE RULES' OUTCOME: ${D.outcome}${D.rule ? ` ('${D.rule}' becomes the couples' default, the reviewer on the change of default; what it reaches beyond the panel is by inference, the registration's list)` : ' (today\'s split stays)'}`);
  }
  // beside, deciding nothing: each rule's figures over the units it ran, the rollout beside the engine and the solve times
  console.log('\nBESIDE, DECIDING NOTHING:');
  for (const arm of ARMS) {
    const recs = units.map(u => U[u.id] && U[u.id][arm]).filter(Boolean), mean = a => a.reduce((t, x) => t + x, 0) / a.length;
    if (!recs.length) continue;
    const pot = mean(recs.map(r => mean(r.main.wealth))), tax = mean(recs.map(r => mean(r.main.tax))), del = mean(recs.map(r => mean(r.main.delivered)));
    const eo = recs.reduce((t, r) => t + (r.beside ? r.beside.engineOnly : 0), 0), mo = recs.reduce((t, r) => t + (r.beside ? r.beside.modelOnly : 0), 0), nb = recs.reduce((t, r) => t + (r.beside ? r.beside.N : 0), 0);
    const ss = recs.map(r => r.solveSecs).sort((x, y) => x - y);
    console.log(`  ${arm.padEnd(5)} over its ${recs.length} units: the mean pot left £${Math.round(pot).toLocaleString('en-GB')}, lifetime tax £${Math.round(tax).toLocaleString('en-GB')}, spending delivered £${Math.round(del).toLocaleString('en-GB')} a path; the rollout beside the engine on ${nb} paths: surviving in the engine alone ${eo}, in the model alone ${mo} (a fidelity gap where either is not nought); the solve ${Math.round(ss[0])} to ${Math.round(ss[ss.length - 1])} s`);
  }
}
