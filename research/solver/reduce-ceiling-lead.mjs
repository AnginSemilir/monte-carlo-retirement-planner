/*
 * THE HARVEST CEILING'S ALLOWANCE STEP: THE READ (CEILING-LEAD.md; EXPLORATORY, seed 7002). The stamps first (fair-gate.mjs
 * requireFairLogs), then the gate: every household in; one code, audit, seed, count of paths, points and candidate; every
 * arm on the household's plan at the same settings, its arrays one a path; each arm's pensionCeiling read back as its arm
 * says (OFF both raw; RAWPA the allowance raw and the band adjusted; NOW both adjusted, the band's RAWPA's). Then the rule:
 *   on S030, S090 and S328F, over the paths at or below the cap (four times opening wealth) in all three arms, the mean
 *   lifetime tax T: the rise T(NOW) - T(OFF), the allowance step's part T(NOW) - T(RAWPA), each with its paired interval;
 *   1 the rise wholly above nought on at least two of the three, else NOT REPRODUCED;
 *   2 over the households where it is, the share (the parts' sum over the rises' sum): 0.5 or more THE ALLOWANCE STEP IS
 *     THE COST, under 0.2 NOT THE ALLOWANCE STEP, between PART OF IT.
 * Beside it: HARVEST-CEILING.md's four parts, NOW against OFF, RAWPA against OFF and RAWPA against NOW (reduce-ceiling.mjs).
 *   node research/solver/reduce-ceiling-lead.mjs [dir] > research/solver/results-ceiling-lead.txt
 *   node research/solver/reduce-ceiling-lead.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rule as fourParts, armOf, RULE as FOUR } from './reduce-ceiling.mjs';
import { zFor } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const LEAD = { households: ['S030', 'S090', 'S328F'], need: 2, cost: 0.5, not: 0.2 };
export const ARMS = ['OFF', 'RAWPA', 'NOW'];
export const LAUNCHED = 'd6a10c1d', AMENDED = ['reduce-ceiling-lead.mjs', 'CEILING-LEAD.md'];
/* the stamped files that changed since the launch (`at` gives a file's bytes at the launch, `now` its bytes in the tree), and
   those of them the amendment does not allow (the reviewer at the read, finding 2: this check gets its planted case) */
export function stampDrift(files, at, now, amended = AMENDED) {
  const moved = files.filter(f => !Buffer.from(at(f)).equals(Buffer.from(now(f))));
  return { moved, extra: moved.filter(f => !amended.includes(f)) };
}
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`;
const sgbp = v => `${v >= 0 ? '+' : '-'}£${Math.round(Math.abs(v)).toLocaleString('en-GB')}`;
const mean = a => { let s = 0; for (let k = 0; k < a.length; k++) s += a[k]; return s / Math.max(1, a.length); };
/* a paired mean difference x - y over the paths `keep` picks: { d, se, lo, hi, n } */
export function pairedMean(x, y, keep) {
  let n = 0, s = 0, q = 0;
  for (let k = 0; k < x.length; k++) { if (!keep[k]) continue; const d = x[k] - y[k]; n++; s += d; q += d * d; }
  if (n < 2) return { d: NaN, se: NaN, lo: NaN, hi: NaN, n };
  const d = s / n, se = Math.sqrt(Math.max(0, q / n - d * d) / (n - 1)), z = zFor(0.05);
  return { d, se, lo: d - z * se, hi: d + z * se, n };
}
/* one household's line of the lead: u = { id, cap, arms: { OFF, RAWPA, NOW } } (the arms' arrays) */
export function leadOf(u) {
  const n = u.arms.NOW.pot.length, keep = new Uint8Array(n);
  for (let k = 0; k < n; k++) keep[k] = ARMS.every(a => u.arms[a].pot[k] <= u.cap) ? 1 : 0;
  const T = Object.fromEntries(ARMS.map(a => { let s = 0, c = 0; for (let k = 0; k < n; k++) if (keep[k]) { s += u.arms[a].tax[k]; c++; } return [a, s / Math.max(1, c)]; }));
  const rise = pairedMean(u.arms.NOW.tax, u.arms.OFF.tax, keep), part = pairedMean(u.arms.NOW.tax, u.arms.RAWPA.tax, keep);
  return { id: u.id, below: rise.n, n, T, rise, part, reproduced: rise.lo > 0 };
}
/* the rule over the three households' lines */
export function leadRule(L) {
  const rep = L.filter(h => h.reproduced);
  if (rep.length < LEAD.need) return { rep, share: NaN, verdict: 'NOT REPRODUCED' };
  const share = rep.reduce((s, h) => s + h.part.d, 0) / rep.reduce((s, h) => s + h.rise.d, 0);
  return { rep, share, verdict: share >= LEAD.cost ? 'THE ALLOWANCE STEP IS THE COST' : share < LEAD.not ? 'NOT THE ALLOWANCE STEP' : 'PART OF IT' };
}
/* the gate: refusals, each a line */
export function gate(raw, ids, audit, size = { N: 16000, pts: 45, seed: 7002 }) {
  const P = [], missing = ids.filter(id => !raw.some(u => u.id === id));
  if (missing.length) P.push(`households missing: ${missing.join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts); one('candidate', u => u.candidate);
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && raw.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of raw) {
    if (!(U.cap > 0 && Math.abs(U.cap - 4 * U.opening) < 0.01)) P.push(`${U.id}: the cap is not four times opening wealth`);
    if (!U.arms || ARMS.some(a => !U.arms[a])) { P.push(`${U.id}: an arm missing`); continue; }
    for (const a of ARMS) { const x = U.arms[a];
      if (x.inputs !== U.inputs) P.push(`${U.id} ${a}: not on the household's plan`);
      if (x.rest !== U.arms.NOW.rest) P.push(`${U.id} ${a}: its settings are not NOW's`);
      for (const k of ['survived', 'pot', 'delivered', 'target', 'tax']) if (armOf(x)[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
    }
    const o = U.arms.OFF.probe, r = U.arms.RAWPA.probe, w = U.arms.NOW.probe;
    if (!o || !r || !w) { P.push(`${U.id}: an arm's pensionCeiling not read back`); continue; }
    if (!(o.pa === o.rawPa && o.band === o.rawBand)) P.push(`${U.id} OFF: its pensionCeiling changes a ceiling`);
    // the band's probe (£3,000 of interest and £3,000 of dividends) reaches a band's edge only where the band starts above
    // the UK threshold less £6,000: a Scottish band (£43,662) stays as given in every arm, as pensionCeiling's (a) says, and
    // the probe cannot tell RAWPA from OFF there; so where NOW's band is as given, the three arms' tables must all differ
    // (changed 13 Nov after the run, before any outcome was read: the gate as launched refused S050, S188 and S368 on it)
    const bandEdge = w.band < w.rawBand, digests = new Set(ARMS.map(a => U.arms[a].digest));
    if (!(r.pa === r.rawPa && r.band === w.band && r.band <= r.rawBand)) P.push(`${U.id} RAWPA: not the allowance raw and the band NOW's`);
    if (!(w.pa < w.rawPa && w.band <= w.rawBand)) P.push(`${U.id} NOW: the allowance not adjusted`);
    if (!bandEdge && digests.size !== ARMS.length) P.push(`${U.id}: the probe does not reach its band's edge and the arms' tables do not all differ`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (what, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
  const n = 2000;
  // a household: tax under OFF 100 a path; NOW higher by `rise` and RAWPA by `rise - part`, with a little noise; the last 200 paths above the cap in NOW
  const mk = (id, rise, part) => {
    const arm = (add) => ({ survived: new Uint8Array(n).fill(1), delivered: new Float64Array(n).fill(1000), target: new Float64Array(n).fill(1000), pot: new Float64Array(n).fill(500), tax: Float64Array.from({ length: n }, (_, k) => 100 + add + (k % 7) * 0.01 * add) });
    const u = { id, cap: 1000, arms: { OFF: arm(0), RAWPA: arm(rise - part), NOW: arm(rise) } };
    for (let k = n - 200; k < n; k++) { u.arms.NOW.pot[k] = 5000; u.arms.NOW.tax[k] = 1e6; }
    return u;
  };
  const R = (specs) => leadRule(specs.map(([id, rise, part]) => leadOf(mk(id, rise, part))));
  check('paths above the cap in any arm are left out (a huge tax there moves nothing)', (h => h.below === n - 200 && Math.abs(h.rise.d - 10.3) < 0.01)(leadOf(mk('A', 10, 8))));
  check('a rise on all three, four-fifths of it the allowance step: THE ALLOWANCE STEP IS THE COST', (r => r.verdict === 'THE ALLOWANCE STEP IS THE COST' && Math.abs(r.share - 0.8) < 1e-9)(R([['A', 10, 8], ['B', 10, 8], ['C', 10, 8]])));
  check('a tenth of it: NOT THE ALLOWANCE STEP; a third: PART OF IT', R([['A', 10, 1], ['B', 10, 1], ['C', 10, 1]]).verdict === 'NOT THE ALLOWANCE STEP' && R([['A', 9, 3], ['B', 9, 3], ['C', 9, 3]]).verdict === 'PART OF IT');
  check('a rise on one of three only: NOT REPRODUCED; on two, the share is over those two', R([['A', 10, 8], ['B', 0, 0], ['C', -5, 0]]).verdict === 'NOT REPRODUCED' && (r => r.rep.length === 2 && r.verdict === 'THE ALLOWANCE STEP IS THE COST')(R([['A', 10, 8], ['B', 10, 6], ['C', 0, 0]])));
  // the gate
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const probes = { OFF: { pa: 12570, band: 50270, rawPa: 12570, rawBand: 50270 }, RAWPA: { pa: 12570, band: 44270, rawPa: 12570, rawBand: 50270 }, NOW: { pa: 11000, band: 44270, rawPa: 12570, rawBand: 50270 } };
  const armX = (a, o = {}) => ({ probe: probes[a], digest: `d${a}`, inputs: 'h', rest: 'pts 45', survived: b64(new Uint8Array(2)), pot: b64(new Float64Array(2)), delivered: b64(new Float64Array(2)), target: b64(new Float64Array(2)), tax: b64(new Float64Array(2)), ...o });
  const unit = (id, o = {}, arms = {}) => ({ id, seed: 7002, N: 2, pts: 45, inputs: 'h', candidate: 'c1', opening: 100, cap: 400, stamp: { code: 'c', audit: 'a' }, arms: { OFF: armX('OFF'), RAWPA: armX('RAWPA'), NOW: armX('NOW'), ...arms }, ...o });
  const size = { N: 2, pts: 45, seed: 7002 }, G = (units, ids = ['E', 'F']) => gate(units, ids, 'a', size);
  { const g0 = G([unit('E'), unit('F')]); check(`the gate passes two whole households${g0.length ? `: ${g0[0]}` : ''}`, g0.length === 0); }
  check('the gate refuses a missing household, two codes, two candidates, and a unit of another size', G([unit('E')]).some(x => /households missing: F/.test(x)) && G([unit('E'), unit('F', { stamp: { code: 'x', audit: 'a' } })]).some(x => /more than one code/.test(x)) && G([unit('E'), unit('F', { candidate: 'c2' })]).some(x => /more than one candidate/.test(x)) && gate([unit('E'), unit('F')], ['E', 'F'], 'a').some(x => /not 16000 paths/.test(x)));
  check('the gate refuses an OFF arm whose pensionCeiling changes a ceiling', G([unit('E', {}, { OFF: armX('OFF', { probe: probes.RAWPA }) }), unit('F')]).some(x => /E OFF: its pensionCeiling changes a ceiling/.test(x)));
  check('the gate refuses a RAWPA arm that is NOW\'s engine or OFF\'s, and a NOW arm that is RAWPA\'s', G([unit('E', {}, { RAWPA: armX('RAWPA', { probe: probes.NOW }) }), unit('F')]).some(x => /E RAWPA: not the allowance raw/.test(x)) && G([unit('E', {}, { RAWPA: armX('RAWPA', { probe: probes.OFF }) }), unit('F')]).some(x => /E RAWPA: not the allowance raw/.test(x)) && G([unit('E', {}, { NOW: armX('NOW', { probe: probes.RAWPA }) }), unit('F')]).some(x => /E NOW: the allowance not adjusted/.test(x)));
  { // a Scottish band (£43,662): the probe leaves it as given in every arm; fair while the three arms' tables differ, refused where two are the same
    const sc = { OFF: { pa: 12570, band: 43662, rawPa: 12570, rawBand: 43662 }, RAWPA: { pa: 12570, band: 43662, rawPa: 12570, rawBand: 43662 }, NOW: { pa: 7070, band: 43662, rawPa: 12570, rawBand: 43662 } };
    const scot = (o = {}) => unit('E', {}, { OFF: armX('OFF', { probe: sc.OFF }), RAWPA: armX('RAWPA', { probe: sc.RAWPA, ...o }), NOW: armX('NOW', { probe: sc.NOW }) });
    const g1 = G([scot(), unit('F')]);
    check(`the gate passes a Scottish household whose arms' tables differ${g1.length ? `: ${g1[0]}` : ''}, and refuses one whose RAWPA tables are OFF's`, g1.length === 0 && G([scot({ digest: 'dOFF' }), unit('F')]).some(x => /E: the probe does not reach its band's edge and the arms' tables do not all differ/.test(x)));
  }
  check('the gate refuses arms at different settings, an arm on another plan, a wrong cap and a missing arm', G([unit('E', {}, { OFF: armX('OFF', { rest: 'pts 30' }) }), unit('F')]).some(x => /E OFF: its settings are not NOW's/.test(x)) && G([unit('E', {}, { RAWPA: armX('RAWPA', { inputs: 'x' }) }), unit('F')]).some(x => /not on the household's plan/.test(x)) && G([unit('E', { cap: 300 }), unit('F')]).some(x => /the cap is not four times/.test(x)) && G([unit('E', {}, { RAWPA: undefined }), unit('F')]).some(x => /E: an arm missing/.test(x)));
  { const files = ['reduce-ceiling-lead.mjs', 'CEILING-LEAD.md', 'stats.mjs', 'audit-ceiling-lead.mjs'], launched = Object.fromEntries(files.map(f => [f, `${f} as launched`]));
    const drift = edits => stampDrift(files, f => launched[f], f => edits[f] || launched[f]);
    const none = drift({}), amended = drift({ 'reduce-ceiling-lead.mjs': 'the gate amended', 'CEILING-LEAD.md': 'its amendment' }), planted1 = drift({ 'stats.mjs': 'the interval changed' }), planted2 = drift({ 'audit-ceiling-lead.mjs': 'an arm changed', 'CEILING-LEAD.md': 'x' });
    check('the stamp check: nothing changed passes; the reducer and the rule page changed pass (the amendment); stats.mjs changed is refused; the audit changed is refused beside an allowed change', none.moved.length === 0 && amended.extra.length === 0 && amended.moved.length === 2 && planted1.extra.join() === 'stats.mjs' && planted2.extra.join() === 'audit-ceiling-lead.mjs'); }
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'ceiling-lead-7002');
  const { HOUSEHOLDS, stampFilesHash } = await import('./audit-ceiling-lead.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const ids = smoke ? raw.map(u => u.id) : HOUSEHOLDS;
  // the units were stamped by the files as launched (d6a10c1d); the reducer and the rule page were changed after the run,
  // before any outcome was read (CEILING-LEAD.md's amendment): the stamp is checked against the files at the launch, and
  // every stamped file but those two is checked unchanged since
  let audit = smoke ? null : stampFilesHash();
  if (!smoke) {
    const { execFileSync } = await import('node:child_process'), { createHash } = await import('node:crypto'), { STAMP_FILES } = await import('./audit-ceiling-lead.mjs');
    const at = f => execFileSync('git', ['-C', HERE, 'show', `${LAUNCHED}:research/solver/${f}`]);
    const h = createHash('sha256'); for (const f of STAMP_FILES) h.update(at(f)); audit = h.digest('hex').slice(0, 12);
    const { moved, extra } = stampDrift(STAMP_FILES, at, f => readFileSync(join(HERE, f)));
    if (extra.length) { console.log(`CEILING-LEAD GATE: NOT FAIR\n  stamped files changed since the launch beyond the amendment's: ${extra.join(', ')}`); process.exit(1); }
    console.log(`(the units' audit stamp checked against the files at the launch, ${LAUNCHED}: ${audit}; changed since, by the amendment: ${moved.join(', ') || 'none'})`);
  }
  const P = gate(raw, ids, audit, smoke ? null : undefined);
  if (P.length) { console.log(`CEILING-LEAD GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const units = ids.map(id => raw.find(u => u.id === id)), u0 = units[0];
  const U = units.map(u => ({ id: u.id, cap: u.cap, opening: u.opening, raw: u, arms: Object.fromEntries(ARMS.map(a => [a, armOf(u.arms[a])])) }));
  console.log(`CEILING-LEAD (EXPLORATORY; CEILING-LEAD.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ids.length} households, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, the candidate ${u0.candidate} (${u0.arms.NOW.rest}); the gate: fair (one code, audit, seed, count of paths, points and candidate; every arm on the household's plan at the same settings; each arm's pensionCeiling read back: OFF every ceiling as given, RAWPA the allowance's as given and the band's NOW's, NOW the allowance's adjusted; where the probe does not reach a band's edge, the three arms' tables all different)`);
  const del = x => { let d = 0, t = 0; for (let k = 0; k < x.delivered.length; k++) { d += x.delivered[k]; t += x.target[k]; } return (100 * d) / Math.max(1e-9, t); };
  const capped = (x, cap) => { let s = 0; for (let k = 0; k < x.pot.length; k++) s += Math.min(x.pot[k], cap); return s / x.pot.length; };
  console.log(`\nBy household and arm (OFF / RAWPA / NOW): survival; spending delivered, % of target; the mean pot left; the pot capped at the estate cap; lifetime tax, all paths; the tables' digests the same as NOW's or not; the solves' seconds:`);
  for (const u of U) {
    const row = g => ARMS.map(a => g(u.arms[a], a)).join(' / ');
    console.log(`  ${u.id.padEnd(6)} ${row(x => `${(100 * mean(x.survived)).toFixed(2)}%`)} | spending ${row(x => del(x).toFixed(3))} | pot ${row(x => gbp(mean(x.pot)))} | capped (cap ${gbp(u.cap)}) ${row(x => gbp(capped(x, u.cap)))} | tax ${row(x => gbp(mean(x.tax)))} | tables ${row((x, a) => (u.raw.arms[a].digest === u.raw.arms.NOW.digest ? 'same' : 'differ'))} | solve ${row((x, a) => `${u.raw.arms[a].solveSecs.toFixed(0)} s`)}`);
  }
  const L = U.filter(u => smoke || LEAD.households.includes(u.id)).map(leadOf), R = leadRule(L);
  console.log(`\nThe rule, on ${L.map(h => h.id).join(', ')}: over the paths at or below the cap in all three arms, the mean lifetime tax (OFF / RAWPA / NOW), the rise NOW less OFF and the allowance step's part NOW less RAWPA, each with its paired 95% interval:`);
  for (const h of L) console.log(`  ${h.id.padEnd(6)} ${h.below} of ${h.n} paths | tax ${ARMS.map(a => gbp(h.T[a])).join(' / ')} | the rise ${sgbp(h.rise.d)} (${sgbp(h.rise.lo)} to ${sgbp(h.rise.hi)}): ${h.reproduced ? 'reproduced' : 'not reproduced'} | the allowance step's part ${sgbp(h.part.d)} (${sgbp(h.part.lo)} to ${sgbp(h.part.hi)})${h.rise.d > 0 ? `, ${(100 * h.part.d / h.rise.d).toFixed(1)}% of the rise` : ''}`);
  console.log(`  1. the rise wholly above nought on at least ${LEAD.need} of the ${L.length}: on ${R.rep.length} (${R.rep.map(h => h.id).join(', ') || 'none'})`);
  if (R.rep.length >= LEAD.need) console.log(`  2. the share over those, the parts' sum over the rises' sum: ${(100 * R.share).toFixed(1)}% (${100 * LEAD.cost}% or more the cost, under ${100 * LEAD.not}% not)`);
  console.log(`\nBeside the rule, deciding nothing here: the other households' lines by the same measure:`);
  for (const h of U.filter(u => !L.some(x => x.id === u.id)).map(leadOf)) console.log(`  ${h.id.padEnd(6)} ${h.below} of ${h.n} paths | tax ${ARMS.map(a => gbp(h.T[a])).join(' / ')} | the rise ${sgbp(h.rise.d)} (${sgbp(h.rise.lo)} to ${sgbp(h.rise.hi)}) | the allowance step's part ${sgbp(h.part.d)} (${sgbp(h.part.lo)} to ${sgbp(h.part.hi)})`);
  console.log(`\nBeside the rule: HARVEST-CEILING.md's four parts (1 pooled survival's lower end above ${FOUR.pooledLo}; 2 no household wholly below ${FOUR.household}; 3 pooled spending within ${FOUR.spend} points of target; 4 the pooled mean pot not lower by more than ${-FOUR.pot}%), the tie-break in both arms:`);
  let ceilingFails = null;
  for (const [name, b, a] of [['NOW against OFF (the ceiling\'s own rule again)', 'OFF', 'NOW'], ['RAWPA against OFF', 'OFF', 'RAWPA'], ['RAWPA against NOW', 'NOW', 'RAWPA']]) {
    const Q = fourParts(U.map(u => ({ id: u.id, B: u.arms[b], A: u.arms[a] })));
    const failed = [!Q.part1 && 1, !Q.part2 && 2, !Q.part3 && 3, !Q.part4 && 4].filter(Boolean);
    if (b === 'OFF' && a === 'NOW') ceilingFails = failed;
    const capB = mean(U.map(u => capped(u.arms[b], u.cap))), capA = mean(U.map(u => capped(u.arms[a], u.cap)));
    console.log(`  ${name}: 1. survival ${f(Q.pooled)} (${f(Q.lo)} to ${f(Q.hi)})${Q.part1 ? '' : ' FAILS'}; 2. wholly below: ${Q.harmed.length ? Q.harmed.map(h => h.id).join(', ') + ' FAILS' : 'none'}; 3. spending ${f(Q.spend, 4)}${Q.part3 ? '' : ' FAILS'}; 4. the pot ${f(Q.pot, 3)}%${Q.part4 ? '' : ' FAILS'}: ${failed.length ? `FAILS ${failed.join(', ')}` : 'PASSES 1 to 4'}; beside: the capped pot ${f(100 * (capA / Math.max(1e-9, capB) - 1), 3)}%, lifetime tax ${gbp(Q.avg(h => h.taxB))} to ${gbp(Q.avg(h => h.taxA))} (${f(100 * (Q.avg(h => h.taxA) / Math.max(1e-9, Q.avg(h => h.taxB)) - 1), 2)}%)`);
    for (const h of Q.H) console.log(`      ${h.id.padEnd(6)} d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${f(h.delA - h.delB, 4)} | pot ${f(100 * (h.potA / Math.max(1e-9, h.potB) - 1), 2)}% | tax ${f(100 * (h.taxA / Math.max(1e-9, h.taxB) - 1), 2)}%`);
  }
  console.log(`\nCEILING-LEAD OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}${Number.isFinite(R.share) ? ` (the share ${(100 * R.share).toFixed(1)}%)` : ''}; the ceiling's own rule with the tie-break in both arms: ${ceilingFails.length ? `FAILS ${ceilingFails.join(', ')}: to the maintainer at once` : 'PASSES 1 to 4'}`);
}
