/*
 * THE SECOND DEEP REVIEW'S READS OF 7T'S TRACES (27 Sep 02:07 UK, deep-review-log.md; saved as a script so the plan can cite
 * them, as the first deep review's were in read-7r-lost-paths.mjs; reported, not a test, grade C). Over 7t's gated traces
 * (the logs' stamp gate, reduce-7t.mjs's gate, every trace's count, seed, arm and stamp):
 *   1. per harmed case and arm: pension switches a path, years below the plan's tier, and the realised whole score against
 *      OFF split into its parts - survival, the capped estate, the dislike of cuts, the raise credit (reduce-7t.mjs
 *      scorePaths()'s own terms; the parts must sum to scorePaths(), a check on every arm) - with the paths lost and saved
 *      against OFF by long-run shift bin;
 *   2. the switching pattern (switches a path; the share reversed the next year and within three years) for OFF, OFF/M0,
 *      READER, READER/M0 and READER+J/M0 on all five cases;
 *   3. on the harmed cases, the mean pension risk step (0 the plan's tier, -1 and -2 below) on paths whose long-run shift is
 *      below -sqrt 3, by stage of the plan, and the survival there.
 *   node research/solver/read-7t-deep.mjs > research/solver/results-7t-deep.txt
 *   node research/solver/read-7t-deep.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { pathsForSeed } from '../engine.mjs';
import { PRED, PANEL, parse, gate, allRunsOf, traceName, traceAgrees, decode, scorePaths, riskStep, lostAgainst, binOf, WB, MU } from './reduce-7t.mjs';

const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const lastYear = (X, i) => (X.failYear[i] >= 0 ? X.failYear[i] - 1 : X.Y - 1);
// the whole score's parts per path, in points (reduce-7t.mjs scorePaths()'s terms, kept apart)
export function parts(X, cfg) {
  const s = [], e = [], cu = [], ra = [];
  for (let i = 0; i < X.N; i++) {
    let cut = 0, raise = 0;
    for (let t = 0; t < X.Y; t++) { const lv = X.level[i * X.Y + t] / 100; if (lv > 0 && lv < 1) cut += cfg.lambda * (1 - lv) ** 2; else if (lv > 1) raise += MU * Math.sqrt(Math.min(0.2, lv - 1)); }
    if (X.failYear[i] >= 0) for (let t = X.failYear[i]; t < X.Y; t++) if (cfg.spendYears[t]) cut += cfg.lambda * (1 - cfg.floor) ** 2;
    const alive = X.survived[i] === 1;
    s.push(alive ? 100 : 0); e.push(alive ? 100 * WB * Math.min(X.wealth[i * X.Y + X.Y - 1], cfg.cap) / cfg.scale : 0); cu.push(-100 * cut); ra.push(alive ? 100 * raise : 0);
  }
  return { s, e, cu, ra };
}
// pension switches a path, and how many are reversed the next year and within three years
export function switching(X) {
  let sw = 0, rev1 = 0, rev3 = 0;
  for (let i = 0; i < X.N; i++) {
    const last = lastYear(X, i), st = t => riskStep(X.tier[i * X.Y + t] >> 2);
    for (let t = 1; t <= last; t++) {
      if (st(t) === st(t - 1)) continue;
      sw++;
      if (t + 1 <= last && st(t + 1) === st(t - 1)) rev1++;
      for (let u = t + 1; u <= Math.min(last, t + 3); u++) if (st(u) === st(t - 1)) { rev3++; break; }
    }
  }
  return { perPath: sw / X.N, rev1: sw ? rev1 / sw : 0, rev3: sw ? rev3 / sw : 0 };
}
const yearsBelow = X => { let b = 0; for (let i = 0; i < X.N; i++) for (let t = 0; t <= lastYear(X, i); t++) if (riskStep(X.tier[i * X.Y + t] >> 2) < 0) b++; return b / X.N; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

function planted() {
  const cases = [];
  // one path, three years, the plan's tier (code 0), then two below (code 2 << 2 = 8), then back: 2 switches, 1 reversed next year
  const X = { N: 1, Y: 3, tier: Uint8Array.from([0, 8, 0]), failYear: Int16Array.from([-1]), survived: Uint8Array.from([1]), level: Uint8Array.from([100, 90, 110]), wealth: Float32Array.from([0, 0, 500000]) };
  const sw = switching(X);
  cases.push(['switches and reversals on a planted path', `${sw.perPath} ${sw.rev1} ${sw.rev3}`, '2 0.5 0.5']);
  const cfg = { lambda: 0.02, floor: 0.8, scale: 1000000, cap: 400000, spendYears: [true, true, true] }, p = parts(X, cfg);
  cases.push(['the parts sum to scorePaths()', (p.s[0] + p.e[0] + p.cu[0] + p.ra[0]).toFixed(9), scorePaths(X, cfg)[0].toFixed(9)]);
  cases.push(['years below the plan\'s tier', String(yearsBelow(X)), '1']);
  let bad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED: ${bad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const DIR = join(dirname(fileURLToPath(import.meta.url)), 'results', 'diag7t');
  const files = existsSync(DIR) ? readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort() : [];
  if (files.length !== 5) { console.log(`INCOMPLETE - ${files.length} of 5 logs in ${DIR}`); process.exit(1); }
  const logs = Object.fromEntries(files.map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  requireFairLogs(logs, PRED);
  const cases = Object.values(logs).flatMap(parse), bad = gate(cases);
  const st = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(Object.values(logs)[0]);
  const ST = st ? { code: st[1], audit: st[2], prediction: st[3], sha: st[4] } : null;
  const traces = {};
  const load = (id, label) => {
    const f = join(DIR, traceName(id, label));
    if (!existsSync(f)) { bad.push(`no trace ${f}`); return null; }
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (!traceAgrees(j, ST, label)) bad.push(`${f}: count, seed, arm or stamp is not the logs'`);
    return decode(j);
  };
  if (!bad.length) for (const c of cases) for (const l of allRunsOf(c.id)) traces[`${c.id}|${l}`] = load(c.id, l);
  if (bad.length) { console.log(`FAIR-TEST GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log('THE SECOND DEEP REVIEW\'S READS OF 7T\'S TRACES (reported, not a test; grade C; the logs\' stamp gate, reduce-7t.mjs\'s gate and every trace\'s stamp checked; 8,000 paths of seed 7002)\n');
  console.log('1. PER ARM ON THE HARMED CASES: pension switches a path, years below the plan\'s tier, and the whole score against OFF by its parts (points); lost and saved against OFF by long-run shift bin (below -sqrt 3 / -sqrt 3 to -1 / -1 to 0 / 0 and above)');
  for (const id of ['S126', 'bridge 4']) {
    const c = cases.find(x => x.id === id), ran = c.ran[PANEL[id][0]], jn = c.joint[PANEL[id][0]], ref = traces[`${id}|OFF`];
    const cfg = { lambda: Number(field(ran, 'lambda')), floor: Math.min(...field(ran, 'levels').split(',').map(Number)), scale: jn.scale, cap: jn.cap };
    cfg.spendYears = Array.from({ length: ref.Y }, (_, t) => { for (let i = 0; i < ref.N; i++) if (ref.level[i * ref.Y + t] > 0) return true; return false; });
    const z = pathsForSeed(7002, ref.N, ref.Y - 1).map(zs => zs[ref.Y]), P0 = parts(ref, cfg);
    console.log(id);
    for (const l of allRunsOf(id)) {
      const X = traces[`${id}|${l}`], P = parts(X, cfg), sc = scorePaths(X, cfg);
      for (let i = 0; i < X.N; i++) if (Math.abs(P.s[i] + P.e[i] + P.cu[i] + P.ra[i] - sc[i]) > 1e-6) { console.log(`STOP: ${id} ${l} path ${i}: the parts do not sum to scorePaths()`); process.exit(1); }
      const d = k => { const v = mean(P[k]) - mean(P0[k]); return `${v >= 0 ? '+' : ''}${v.toFixed(3)}`; };
      const lost = lostAgainst(X, ref), saved = lostAgainst(ref, X), bins = ix => [0, 1, 2, 3].map(k => ix.filter(i => binOf(z[i]) === k).length).join('/');
      console.log(`  ${l.padEnd(12)} switches ${switching(X).perPath.toFixed(2)}, years below ${yearsBelow(X).toFixed(1)} | against OFF: survival ${d('s')} estate ${d('e')} cuts ${d('cu')} raise ${d('ra')} | lost ${lost.length} (${bins(lost)}) saved ${saved.length} (${bins(saved)})`);
    }
  }
  console.log('\n2. THE SWITCHING PATTERN (pension switches a path; the share reversed the next year and within three years)');
  for (const id of ['S126', 'bridge 4', 'S360', 'share 0.95', 'S194']) {
    const row = ['OFF', 'OFF/M0', 'READER', 'READER/M0', 'READER+J/M0'].filter(l => traces[`${id}|${l}`]).map(l => { const s = switching(traces[`${id}|${l}`]); return `${l} ${s.perPath.toFixed(2)} (${(100 * s.rev1).toFixed(0)}%, ${(100 * s.rev3).toFixed(0)}%)`; });
    console.log(`  ${id.padEnd(10)} ${row.join('; ')}`);
  }
  console.log('\n3. THE DEEP BAD WORLD (paths whose long-run shift is below -sqrt 3): the mean pension risk step by years of the plan, and survival there');
  for (const id of ['S126', 'bridge 4']) {
    const ref = traces[`${id}|OFF`], z = pathsForSeed(7002, ref.N, ref.Y - 1).map(zs => zs[ref.Y]);
    for (const l of ['OFF', 'READER', 'READER+L', 'READER+O', 'OFF/M0', 'READER+J/M0']) {
      const X = traces[`${id}|${l}`], stages = [[0, 5], [5, 10], [10, 20], [20, 30], [30, X.Y]];
      const steps = stages.map(([a, b]) => { let s = 0, n = 0; for (let i = 0; i < X.N; i++) if (z[i] < -Math.sqrt(3)) for (let t = a; t < Math.min(b, lastYear(X, i) + 1); t++) { s += riskStep(X.tier[i * X.Y + t] >> 2); n++; } return n ? (s / n).toFixed(2) : '-'; });
      let nd = 0, sv = 0; for (let i = 0; i < X.N; i++) if (z[i] < -Math.sqrt(3)) { nd++; sv += X.survived[i]; }
      console.log(`  ${id.padEnd(9)} ${l.padEnd(12)} risk step by years ${stages.map(s => s.join('-')).join(', ')}: ${steps.join(' ')}; survival ${(100 * sv / nd).toFixed(1)}% of ${nd}`);
    }
  }
}
