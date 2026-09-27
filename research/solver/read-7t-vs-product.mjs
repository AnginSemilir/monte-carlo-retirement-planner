/*
 * 7T'S ARMS AGAINST 7T'S OFF (27 Sep, for the deep review after 7t and 7u's design; reported, not a test).
 * 7t's rule reads each cause against the reader as solved (g) and against off with the same cause removed (h); it does not
 * read the reader with a fix against off unchanged (OFF), the nearest 7t comes to the comparison a default would face.
 * OFF IS NOT THE PRODUCT AS IT SHIPS (the ninetieth review, BLOCKING 1): it is the product's solver at 7t's settings -
 * 16 wealth points where the product solves at 30, and lambda held at S126's 0.0224 on every case (S194's own is 2); the
 * tier above offers the same menu as 'auto' on these cases (the pension already at the top tier). This prints it for every
 * arm 7t ran, on the same 8,000 paths: survival (saved and lost against OFF, the registered exact interval and the
 * unconditional one with the count check, read-7t-unconditional.mjs leg()) and the realised whole score (reduce-7t.mjs
 * scorePaths(), configured as its reducer configures it, paired against OFF, mean and standard error). Old files for a new
 * question (checklist item 3): the logs' stamp gate, reduce-7t.mjs's own gate and every trace's count, seed, arm and stamp,
 * as reduce-7t.mjs checks them. Grade C: unregistered comparisons on one seed.
 * And, on the harmed cases, how many of the reader's lost paths against OFF are paths OFF itself loses at switch margin 0
 * (the pre-mortem's third scenario and the Unmasking field's item 9: off made safe by the margin; the eighty-ninth review,
 * BLOCKING 3).
 *   node research/solver/read-7t-vs-product.mjs > research/solver/results-7t-vs-product.txt
 *   node research/solver/read-7t-vs-product.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { PRED, PANEL, parse, gate, allRunsOf, traceName, traceAgrees, decode, scorePaths, paired } from './reduce-7t.mjs';
import { leg } from './read-7t-unconditional.mjs';

const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
// the arms read against OFF, in the order printed: the reader alone, the reader with each fix, then each fix alone
// the paths the reader loses against OFF (A survives, the reader fails) and how many OFF/M0 also fails - one function,
// read by the planted check and by the report
export function overlap(off, rd, m0) { let n = 0, k = 0; for (let i = 0; i < off.length; i++) if (off[i] && !rd[i]) { n++; if (!m0[i]) k++; } return { n, k }; }
const ORDER = ['READER', 'READER+J', 'READER+L', 'READER+O', 'READER5+L', 'READER/M0', 'READER+J/M0', 'OFF+J', 'OFF+L', 'OFF+O', 'OFF5+L', 'OFF/M0', 'OFF+J/M0'];

function planted() {
  const cases = [];
  // survival against OFF follows the arms' order: 3 paths, OFF survives the first two, the arm the first and third
  const A = Uint8Array.from([1, 1, 0]), B = Uint8Array.from([1, 0, 1]), x = leg('h', A, B);
  cases.push(['the arm against OFF: 1 lost, 1 saved', `${x.b} ${x.c}`, '1 1']);
  // the whole score's pairing is the arm minus OFF
  const p = paired(Float64Array.from([1, 2, 3]), Float64Array.from([2, 2, 5]));
  cases.push(['the whole score paired as the arm minus OFF', p.d.toFixed(3), '1.000']);
  // the overlap: paths the reader loses against OFF that OFF/M0 also fails; path 0 both, path 1 the reader only, path 2 neither
  // four paths: OFF survives all; the reader loses the first three; OFF/M0 fails the first two and survives the third
  const o = overlap(Uint8Array.from([1, 1, 1, 1]), Uint8Array.from([0, 0, 0, 1]), Uint8Array.from([0, 0, 1, 0]));
  cases.push(['the reader\'s lost paths that off at margin 0 also fails', `${o.k} of ${o.n}`, '2 of 3']);
  cases.push(['every arm printed is one 7t ran on the harmed cases', ORDER.filter(l => !allRunsOf('S126').includes(l)).join(',') || 'none', 'none']);
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
  console.log('7T\'S ARMS AGAINST 7T\'S OFF, on the same 8,000 paths of seed 7002 (reported, not a test; grade C; the logs\' stamp gate, reduce-7t.mjs\'s gate and every trace\'s stamp checked)');
  console.log('OFF is the product\'s solver at 7t\'s settings - 16 wealth points (the product solves at 30) and lambda held at S126\'s on every case - not the product as it ships');
  console.log('survival: saved/lost against OFF, the change in points, the registered exact 95% interval and the unconditional one with the count check; the realised whole score against OFF, points, mean +/- se\n');
  for (const c of cases) {
    const ran = c.ran[PANEL[c.id][0]], jn = c.joint[PANEL[c.id][0]];
    const cfg = { lambda: Number(field(ran, 'lambda')), floor: Math.min(...field(ran, 'levels').split(',').map(Number)), scale: jn.scale, cap: jn.cap };
    const ref = traces[`${c.id}|OFF`];
    cfg.spendYears = Array.from({ length: ref.Y }, (_, t) => { for (let i = 0; i < ref.N; i++) if (ref.level[i * ref.Y + t] > 0) return true; return false; });
    const sOff = scorePaths(ref, cfg);
    console.log(c.id);
    for (const l of ORDER.filter(x => allRunsOf(c.id).includes(x))) {
      const T = traces[`${c.id}|${l}`], x = leg('h', ref.survived, T.survived), w = paired(sOff, scorePaths(T, cfg));
      const pm = v => `${v >= 0 ? '+' : ''}${v.toFixed(3)}`;
      console.log(`  ${l.padEnd(12)} ${String(x.c).padStart(4)}/${String(x.b).padEnd(4)} ${pm(x.reg.d)} (registered ${x.reg.lo.toFixed(3)} to ${x.reg.hi.toFixed(3)}; unconditional ${x.un.lo.toFixed(3)} to ${x.un.hi.toFixed(3)})   whole score ${pm(w.d)} +/- ${w.se.toFixed(3)}`);
    }
    if (allRunsOf(c.id).includes('READER') && allRunsOf(c.id).includes('OFF/M0')) {
      const { n, k } = overlap(ref.survived, traces[`${c.id}|READER`].survived, traces[`${c.id}|OFF/M0`].survived);
      if (n) console.log(`  of the reader's ${n} paths lost against OFF, OFF at margin 0 also fails ${k}`);
    }
  }
}
