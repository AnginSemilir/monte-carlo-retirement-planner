/*
 * THE SHARE RULES' TEST, THE READ (registrations/share-rules.md; read once, by its rule).
 * The stamps first (fair-gate.mjs requireFairLogs), then the gate: every unit of share-rules-panel.json in TODAY and MEANS, and
 * in FLAT exactly where its share differs from TODAY's; one code, audit, seed, prediction, estate weight and Node version; each
 * unit at the registration's paths (share-rules-paths.json), every array one a path; each unit's arms on one plan (the inputs
 * hash with each person's MPAA age left out, the age following each arm's own drawing) at the panel's target, arm A's pick the
 * landing's; each arm at its configuration and its rule's share (couple.js shareBy on the unit's plan); each person's settings
 * the couples' registered run's (audit-couples.mjs wantProblems), the couples' path flat and fast, D80's three none.
 * Then the rule, for FLAT and for MEANS against TODAY, each on the units where its share differs from TODAY's:
 *   1. no unit flagged by D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths against the threshold its
 *      realised discordance sets), the loss and the threshold compared in whole paths (harmExact);
 *   2. the pooled survival change (reduce-phase4.mjs survivalItem, its 95% interval by path) with its lower end above 0;
 *   3. pooled spending delivered (spendingItem, in percent of TODAY's) not lower than TODAY's by more than 0.05%.
 * Which is taken: both hold, MEANS only if against FLAT, on the units where their shares differ, its pooled survival change
 * has its lower end above 0, else FLAT; one holds, that one; neither, NEITHER (today's split stays).
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
import { requireFairLogs } from './fair-gate.mjs';
import { cmpBar } from './paired-exact.mjs';
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
  const h = harmOf(c, o, n), j = Math.round(h.t * h.n / 100), k = h.lost - h.saved;
  if (cmpBar(j, h.n, h.t) !== 0) throw new Error(`reduce-share-rules: the threshold ${h.t} is not a whole number of paths of ${h.n}`);
  return { ...h, j, flag: k > j };
}
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
    cases.push(['the gate: a tie-break on is refused (D80)', String(G(build(U => { U[u45.id].TODAY.ran = U[u45.id].TODAY.ran.replace('tieBreak none', 'tieBreak on:1e-4'); })).some(x => /tieBreak/.test(x))), 'true']); }
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
  if (!PILOT) requireFairLogs(existsSync(dir) ? Object.fromEntries(readdirSync(dir).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(dir, x), 'utf8')])) : {}, REGISTRATION, { blob: () => '-' });
  const P = gate(U, units, { seed: PILOT ? PILOT_SEED : SEED, prediction: PILOT ? null : REGISTRATION, audit: stampFilesHash(), paths, code });
  console.log(`THE SHARE RULES' TEST${PILOT ? ' (THE PILOT: NOT AN OUTCOME)' : ''}: ${units.length} units of ${dir.split('/').slice(-1)[0]}; the gate: ${P.length ? 'REFUSED' : 'fair'}`);
  if (P.length) { for (const x of P.slice(0, 20)) console.log(`  ${x}`); process.exit(1); }
  const flat = compare(U, units, 'FLAT', 'TODAY'), means = compare(U, units, 'MEANS', 'TODAY'), mvf = compare(U, units, 'MEANS', 'FLAT');
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
    console.log(`\nTHE SHARE RULES' OUTCOME: ${D.outcome}${D.rule ? ` ('${D.rule}' becomes the couples' default, the reviewer on the change of default)` : ' (today\'s split stays)'}`);
  }
}
