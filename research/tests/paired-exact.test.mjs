/*
 * A PAIRED SURVIVAL CHANGE AGAINST A BAR, EXACTLY (research/solver/paired-exact.mjs; the class OTHER-ORDER's read met,
 * research/solver/results-other-order-beside.txt A).
 *   1. the tie that read met: S129-90's cells under ELDER and YOUNGE (3,781 both, 25 lost, 5 saved, 189 neither, on 4,000
 *      paths; ELDER 95.15% and YOUNGE 94.65%, results-other-order.txt): survivalChangeU's change is below -0.5 in floating
 *      point, the misread; cmpCells and cmpBar put it at the bar, -20 paths of 4,000 being -0.5 points exactly;
 *   2. a sweep: on 1,000, 4,000, 8,000, 16,000 and 19,000 paths, every change from -5 to +5 points in whole paths, against
 *      ten bars from -1 to +1: cmpBar, and cmpCells on cells built with that change, agree on every case with this test's
 *      own exact comparison (the bar in hundredths, in BigInt); survivalChangeU's floating comparison is counted beside, and
 *      misreads some (the class is real);
 *   3. pairedCounts against a hand count on built arrays, and its refusals (arrays of unequal length, a value not 0 or 1);
 *   4. the refusals: a change or a path count not whole, no paths, a change larger than the paths, a bar not finite, one that
 *      prints with an exponent, one of more than 9 decimals.
 * Plant (--planted runs it and wants exactly its checks to fail): 'float' (paired-exact.mjs PLANT: cmpCells compares as
 * survivalChangeU forms the change): checks 1 and 2.
 *   node research/tests/paired-exact.test.mjs [--planted]
 */
import { cmpBar, cmpCells, pairedCounts, pointsOf, PLANT } from '../solver/paired-exact.mjs';
import { survivalChangeU } from '../solver/stats.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['float', ['1', '2']]]) {
    const r = spawnSync(process.execPath, [SELF], { env: { ...process.env, PAIRED_EXACT_PLANT: plant }, encoding: 'utf8' });
    const failed = [...new Set([...r.stdout.matchAll(/^FAIL {2}(\d)/gm)].map(m => m[1]))];
    const exact = failed.length === want.length && want.every(n => failed.includes(n));
    console.log(`plant ${plant} fails checks ${failed.join(', ') || 'none'} (expected ${want.join(', ')}): ${exact ? 'exact' : 'NOT EXACT'}`);
    if (!exact) { console.log(r.stdout + r.stderr); bad++; }
  }
  process.exit(bad ? 1 : 0);
}
if (process.env.PAIRED_EXACT_PLANT) PLANT.rule = process.env.PAIRED_EXACT_PLANT;
let passed = 0, failed = 0;
const ok = (n, label, c, detail = '') => { console.log(`${c ? 'PASS' : 'FAIL'}  ${n}  ${label}${detail ? '  -- ' + detail : ''}`); if (c) passed++; else failed++; };
const throws = f => { try { f(); return false; } catch (e) { return true; } };
console.log(`paired-exact: a paired survival change against a bar, in whole paths${PLANT.rule ? `; planted: ${PLANT.rule}` : ''}`);

// ---- 1. the tie OTHER-ORDER's read met ----
{
  const cells = { a: 3781, b: 25, c: 5, d: 189 }, N = 4000;
  const u = survivalChangeU(cells.a, cells.b, cells.c, cells.d);
  const surv = [100 * (cells.a + cells.b) / N, 100 * (cells.a + cells.c) / N];
  ok(1, `S129-90's cells (ELDER ${surv[0].toFixed(2)}%, YOUNGE ${surv[1].toFixed(2)}%, ${cells.b} lost, ${cells.c} saved, of ${N}): at the bar of -0.5 points exactly, where survivalChangeU's change (${u.d}) reads below it`,
    u.d < -0.5 && cmpCells(cells, -0.5) === 0 && cmpBar(cells.c - cells.b, N, -0.5) === 0 && pointsOf(cells.c - cells.b, N) === -0.5 && surv[0] === 95.15 && surv[1] === 94.65,
    `cmpCells ${cmpCells(cells, -0.5)}, cmpBar ${cmpBar(cells.c - cells.b, N, -0.5)}`);
}

// ---- 2. a sweep against this test's own exact comparison ----
{
  const NS = [1000, 4000, 8000, 16000, 19000], BARS = [-1, -0.5, -0.3, -0.25, -0.1, 0, 0.1, 0.25, 0.5, 1];
  // the bar in hundredths as a BigInt: every bar here has at most two decimals
  const exact = (k, N, bar) => { const h = BigInt(Math.round(bar * 100)), l = 100n * 100n * BigInt(k), r = h * BigInt(N); return l < r ? -1 : l > r ? 1 : 0; };
  let cases = 0, wrongBar = 0, wrongCells = 0, floatWrong = 0, ties = 0; const first = [];
  for (const N of NS) for (let k = -N / 20; k <= N / 20; k++) {
    // cells with this change: some common discordance as well, every cell a whole number of at least nought
    const extra = Math.floor(N / 200), b = Math.max(0, -k) + extra, c = Math.max(0, k) + extra, a = Math.floor(0.9 * N) - b, d = N - a - b - c;
    const u = survivalChangeU(a, b, c, d);
    for (const bar of BARS) {
      cases++;
      const want = exact(k, N, bar), gotBar = cmpBar(k, N, bar), gotCells = cmpCells({ a, b, c, d }, bar), fl = u.d < bar ? -1 : u.d > bar ? 1 : 0;
      if (want === 0) ties++;
      if (gotBar !== want) wrongBar++;
      if (gotCells !== want) { wrongCells++; if (first.length < 3) first.push(`${k} of ${N} at ${bar}: ${gotCells} against ${want}`); }
      if (fl !== want) floatWrong++;
    }
  }
  ok(2, `the sweep: ${cases} cases (${ties} on a bar exactly); cmpBar and cmpCells each agree with the exact comparison on every one; survivalChangeU's floating comparison misreads ${floatWrong}`,
    wrongBar === 0 && wrongCells === 0 && floatWrong > 0 && ties > 0, `cmpBar wrong ${wrongBar}, cmpCells wrong ${wrongCells}${first.length ? ` (${first.join('; ')})` : ''}`);
}

// ---- 3. pairedCounts ----
{
  const sA = [1, 1, 1, 0, 0, 1, 0, 1], sB = [1, 0, 1, 1, 0, 0, 0, 1];
  const got = pairedCounts(sA, sB), hand = { a: 3, b: 2, c: 1, d: 2, N: 8, k: -1 };
  const typed = pairedCounts(Uint8Array.from(sA), Uint8Array.from(sB));
  ok(3, 'pairedCounts: the cells of built arrays as by hand (3 both, 2 lost, 1 saved, 2 neither; the change -1), from plain and typed arrays; refused on arrays of unequal length or a value not 0 or 1',
    JSON.stringify(got) === JSON.stringify(hand) && JSON.stringify(typed) === JSON.stringify(hand) && throws(() => pairedCounts([1, 0], [1])) && throws(() => pairedCounts([1, 2], [1, 0])),
    JSON.stringify(got));
}

// ---- 4. the refusals ----
{
  const cases = [['a change not whole', () => cmpBar(1.5, 100, 0)], ['paths not whole', () => cmpBar(1, 100.5, 0)], ['no paths', () => cmpBar(0, 0, 0)],
    ['a change larger than the paths', () => cmpBar(101, 100, 0)], ['a bar not finite', () => cmpBar(0, 100, NaN)], ['a bar printed with an exponent', () => cmpBar(0, 100, 1e-10)],
    ['a bar of more than 9 decimals', () => cmpBar(0, 100, 0.1234567891)], ['a negative cell', () => cmpCells({ a: 1, b: -1, c: 0, d: 0 }, 0)]];
  const missed = cases.filter(([, f]) => !throws(f)).map(([w]) => w);
  ok(4, `the refusals: ${cases.map(([w]) => w).join('; ')}`, missed.length === 0, missed.length ? `not refused: ${missed.join(', ')}` : 'each refused');
}

console.log(`\npaired-exact: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
