/*
 * TIE-C2'S SPEED EXCEPTION, TIMED CLEANLY, READ (TIE-C2-TIMING.md, its rule committed before it runs; D108; EXPLORATORY, seed
 * 7001). Reads audit-tie-c2-timing.mjs's units once. The gate: every couple's unit with its four processes, two of each arm
 * in the order the unit names; one code and one audit stamp; seed 7001, the timed paths and the points as designed; each
 * couple's tables TIE-C2's when solved and in every process; each process's options as named and its every timed path's
 * outcome TIE-C2's for its arm; and the timing repeating (the median over the couples of each arm's second process's CPU time
 * against its first, within x0.99 to x1.01). Then the rule: the median over the twelve couples of LOOKHOLD's CPU time over the
 * timed paths (its two processes together) against CANDS's, at or under x1.25: LOOKHOLD becomes the couples' default (D105,
 * D108); over: the trade goes to the maintainer. Beside it, deciding nothing: each couple's ratio by CPU time and by wall
 * clock, each arm's two processes against each other, by cohort, the load averages, and the read's own ratios beside.
 *   node research/solver/reduce-tie-c2-timing.mjs [dir] [--smoke]      node research/solver/reduce-tie-c2-timing.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
/* TIE-C2-TIMING.md's bar (D105's quarter) and the band the timing must repeat within */
export const RULE = { bar: 1.25, repeat: [0.99, 1.01] }, ARMS = ['CANDS', 'LOOKHOLD'];
export const orderOf = k => (k % 2 === 0 ? ['CANDS', 'LOOKHOLD', 'LOOKHOLD', 'CANDS'] : ['LOOKHOLD', 'CANDS', 'CANDS', 'LOOKHOLD']);
export const median = a => { const s = [...a].sort((p, q) => p - q), k = s.length; return k % 2 ? s[(k - 1) / 2] : (s[k / 2 - 1] + s[k / 2]) / 2; };
const procOf = (u, arm, rep) => u.procs.find(p => p.arm === arm && p.rep === rep);
const sumOf = (u, arm, key = 'cpuUs') => u.procs.filter(p => p.arm === arm).reduce((s, p) => s + p[key], 0);

/* the gate over the units, against the design's couples: every problem */
export function gate(units, ids, audit, size = { N: 500, seed: 7001, pts: 45 }) {
  const P = [], missing = ids.filter(id => !units.some(u => u.id === id));
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && units.some(u => u.N !== size.N || u.seed !== size.seed || u.pts !== size.pts)) P.push(`a unit is not ${size.N} timed paths of seed ${size.seed} at ${size.pts} points`);
  for (const u of units) {
    const want = orderOf(u.k);
    if (!Array.isArray(u.procs) || u.procs.length !== 4 || u.procs.some((p, i) => p.arm !== want[i])) { P.push(`${u.id}: its processes are not ${want.join(', ')}`); continue; }
    if (ARMS.some(arm => !procOf(u, arm, 1) || !procOf(u, arm, 2))) P.push(`${u.id}: an arm without both its processes`);
    if (!u.solvedSame) P.push(`${u.id}: the tables solved are not TIE-C2's`);
    for (const p of u.procs) {
      const at = `${u.id} ${p.arm} (${p.rep})`;
      if (!p.tablesSame) P.push(`${at}: the tables restored are not TIE-C2's`);
      if (!p.optionsOk) P.push(`${at}: the options are not as named`);
      if (p.differ !== 0) P.push(`${at}: ${p.differ} timed paths' outcomes are not TIE-C2's`);
      if (p.n !== u.N) P.push(`${at}: ${p.n} paths timed, not ${u.N}`);
      if (!(p.cpuUs > 0)) P.push(`${at}: no CPU time`);
    }
  }
  if (!P.length) for (const arm of ARMS) {
    const m = median(units.map(u => procOf(u, arm, 2).cpuUs / procOf(u, arm, 1).cpuUs));
    if (!(m >= RULE.repeat[0] && m <= RULE.repeat[1])) P.push(`the timing does not repeat: ${arm}'s second process against its first, the median over the couples x${m.toFixed(4)}, outside x${RULE.repeat[0]} to x${RULE.repeat[1]}`);
  }
  return P;
}

/* the rule: each couple's ratio, the median over the couples, and the verdict */
export function rule(units) {
  const rows = units.map(u => ({
    id: u.id, cohort: u.cohort, ratio: sumOf(u, 'LOOKHOLD') / sumOf(u, 'CANDS'), wall: sumOf(u, 'LOOKHOLD', 'wallMs') / sumOf(u, 'CANDS', 'wallMs'),
    repeat: Object.fromEntries(ARMS.map(arm => [arm, procOf(u, arm, 2).cpuUs / procOf(u, arm, 1).cpuUs])),
    ms: Object.fromEntries(ARMS.map(arm => [arm, sumOf(u, arm) / 1e3 / (2 * u.N)]))
  }));
  const m = median(rows.map(r => r.ratio));
  return { rows, median: m, under: m <= RULE.bar, verdict: m <= RULE.bar ? `AT OR UNDER THE BAR (x${RULE.bar}): LOOKHOLD BECOMES THE COUPLES' DEFAULT (D105, D108)` : `OVER THE BAR (x${RULE.bar}): THE TRADE GOES TO THE MAINTAINER` };
}

function planted() {
  let bad = 0;
  const check = (name, ok) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) bad++; };
  const ids = Array.from({ length: 12 }, (_, k) => `U${k}`);
  // a unit whose two CANDS processes take cands[0] and cands[1] microseconds and whose LOOKHOLD ones look[0] and look[1]
  const unit = (k, { cands = [100e6, 100e6], look = [120e6, 120e6], code = 'c', audit = 'a', proc = {}, solvedSame = true, drop = false } = {}) => {
    const reps = { CANDS: 0, LOOKHOLD: 0 };
    const procs = orderOf(k).map(arm => { const rep = ++reps[arm], cpuUs = (arm === 'CANDS' ? cands : look)[rep - 1];
      return { arm, rep, n: 500, cpuUs, wallMs: cpuUs / 1e3, tablesSame: true, optionsOk: true, differ: 0, load: [[0, 0, 0], [0, 0, 0]], ...(proc[`${arm}${rep}`] || {}) }; });
    return { k, id: `U${k}`, cohort: k < 8 ? 'young' : 'lib', seed: 7001, N: 500, pts: 45, order: orderOf(k), solvedSame, stamp: { code, audit }, procs: drop ? procs.slice(0, 3) : procs };
  };
  const set = f => ids.map((_, k) => unit(k, f ? f(k) : {}));
  const V = s => (gate(s, ids, 'a').length ? 'REFUSED' : rule(s).under ? 'UNDER' : 'OVER');
  check('every couple at x1.20: at or under the bar', V(set()) === 'UNDER');
  check('every couple at exactly x1.25: at or under the bar (the bar itself counts as under)', V(set(() => ({ look: [125e6, 125e6] }))) === 'UNDER' && rule(set(() => ({ look: [125e6, 125e6] }))).median === 1.25);
  check('every couple at x1.26: over the bar', V(set(() => ({ look: [126e6, 126e6] }))) === 'OVER');
  check('six couples at x1.30 and six at x1.20: the median the mean of the sixth and seventh, x1.25, at or under', (() => { const s = set(k => ({ look: k < 6 ? [130e6, 130e6] : [120e6, 120e6] })); return V(s) === 'UNDER' && Math.abs(rule(s).median - 1.25) < 1e-12; })());
  check('seven couples at x1.26: over, whatever the other five', V(set(k => ({ look: k < 7 ? [126e6, 126e6] : [100e6, 100e6] }))) === 'OVER');
  check('the ratio is LOOKHOLD\'s two processes together against CANDS\'s two', Math.abs(rule([unit(0, { cands: [100e6, 110e6], look: [120e6, 132e6] })]).rows[0].ratio - 252 / 210) < 1e-12);
  check('a unit missing: the gate refuses', gate(set().slice(0, 11), ids, 'a').some(x => /units missing: U11/.test(x)));
  check('a unit with three processes: the gate refuses', gate(set(k => (k === 3 ? { drop: true } : {})), ids, 'a').some(x => /U3: its processes/.test(x)));
  check('a timed path\'s outcome not TIE-C2\'s: the gate refuses', gate(set(k => (k === 2 ? { proc: { LOOKHOLD2: { differ: 1 } } } : {})), ids, 'a').some(x => /U2 LOOKHOLD \(2\): 1 timed paths/.test(x)));
  check('tables not TIE-C2\'s, solved or restored: the gate refuses', (() => { const P = gate(set(k => (k === 4 ? { solvedSame: false } : k === 5 ? { proc: { CANDS1: { tablesSame: false } } } : {})), ids, 'a'); return P.some(x => /U4: the tables solved/.test(x)) && P.some(x => /U5 CANDS \(1\): the tables restored/.test(x)); })());
  check('the options not as named: the gate refuses', gate(set(k => (k === 6 ? { proc: { LOOKHOLD1: { optionsOk: false } } } : {})), ids, 'a').some(x => /U6 LOOKHOLD \(1\): the options/.test(x)));
  check('two code stamps, or an audit not these files\': the gate refuses', gate(set(k => (k === 7 ? { code: 'd' } : {})), ids, 'a').some(x => /more than one code/.test(x)) && gate(set(), ids, 'b').some(x => /audit is not these files/.test(x)));
  check('the timing not repeating (each CANDS second process x1.03 of its first): the gate refuses', gate(set(() => ({ cands: [100e6, 103e6] })), ids, 'a').some(x => /does not repeat: CANDS/.test(x)));
  check('the timing repeating within x1.005: the gate passes', gate(set(() => ({ cands: [100e6, 100.5e6], look: [120e6, 119.5e6] })), ids, 'a').length === 0);
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'tie-c2-timing-7001');
  const { COUPLES, stampFilesHash } = await import('./audit-tie-c2-timing.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const units = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const ids = COUPLES.filter(id => !smoke || units.some(u => u.id === id));
  const P = gate(units, ids, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  // the run's every unit with its own log, which requireFairLogs has read (a unit file without one would pass it unread)
  if (!smoke) for (const u of units) if (!existsSync(join(DIR, `case${u.k}.txt`))) P.push(`${u.id}: no log case${u.k}.txt beside its unit`);
  // a smoke reports what the gate would refuse and reads on, to try the read's own lines; the run stops here
  if (P.length && !smoke) { console.log(`TIE-C2'S TIMING GATE: NOT FAIR, NOTHING DECIDED\n  ${P.join('\n  ')}`); process.exit(1); }
  if (P.length) console.log(`SMOKE: the gate would refuse:\n  ${P.join('\n  ')}`);
  const ordered = ids.map(id => units.find(u => u.id === id)), u0 = ordered[0], R = rule(ordered);
  const x3 = v => `x${v.toFixed(3)}`, rng = a => `${x3(Math.min(...a))} to ${x3(Math.max(...a))}`;
  console.log(`TIE-C2'S SPEED EXCEPTION, TIMED CLEANLY (EXPLORATORY; TIE-C2-TIMING.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} couples, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths timed in each of four fresh processes a couple after ${u0.warm} untimed, ${u0.pts} points; ${P.length ? 'THE GATE WOULD REFUSE (above): a smoke reads on' : "each couple's tables TIE-C2's and every timed path's outcome TIE-C2's; the gate fair"}`);
  console.log(`\nTHE RULE: the median over the couples of LOOKHOLD's CPU time against CANDS's ${x3(R.median)}, the bar x${RULE.bar}`);
  console.log(`TIE-C2'S TIMING OUTCOME${smoke ? ' (SMOKE, DECIDING NOTHING)' : ''}: ${R.verdict}`);
  console.log(`\nBESIDE THE RULE, DECIDING NOTHING:`);
  for (const arm of ARMS) console.log(`  the timing repeating: ${arm}'s second process against its first, the median ${x3(median(R.rows.map(r => r.repeat[arm])))} (${rng(R.rows.map(r => r.repeat[arm]))})`);
  console.log(`  by wall clock, LOOKHOLD against CANDS, the median ${x3(median(R.rows.map(r => r.wall)))}`);
  for (const c of ['young', 'lib']) { const rs = R.rows.filter(r => r.cohort === c); if (rs.length) console.log(`  the ${c === 'young' ? 'younger' : 'library\'s'} ${rs.length}: the median ${x3(median(rs.map(r => r.ratio)))} (${rng(rs.map(r => r.ratio))})`); }
  const REF = join(HERE, 'results', 'tie-c2-7001'), refOf = id => { const f = join(REF, `${id}.json.gz`); return !smoke && existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null; };
  console.log(`  by couple (CPU ms a path, CANDS and LOOKHOLD; the ratio by CPU time and by wall clock; each arm's second process against its first; the read's ratio, its wall clock with the arms in one process, CANDS first):`);
  for (const r of R.rows) {
    const u = ordered.find(x => x.id === r.id), ref = refOf(r.id), load = u.procs.map(p => p.load[0][0].toFixed(2)).join('/');
    console.log(`    ${r.id.padEnd(6)} ${r.ms.CANDS.toFixed(1)} and ${r.ms.LOOKHOLD.toFixed(1)} ms: ${x3(r.ratio)} (wall ${x3(r.wall)}); repeat CANDS ${x3(r.repeat.CANDS)}, LOOKHOLD ${x3(r.repeat.LOOKHOLD)}; the processes ${u.order.join(', ')}, the load at each start ${load}${ref ? `; the read ${x3(ref.arms.LOOKHOLD.engineSecs / ref.arms.CANDS.engineSecs)}` : ''}`);
  }
  if (!smoke) { const refs = R.rows.map(r => refOf(r.id)).filter(Boolean); if (refs.length === R.rows.length) console.log(`  the read's median over the same couples, beside: ${x3(median(refs.map(x => x.arms.LOOKHOLD.engineSecs / x.arms.CANDS.engineSecs)))}`); }
}
