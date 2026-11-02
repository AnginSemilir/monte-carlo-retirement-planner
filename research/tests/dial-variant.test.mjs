/*
 * THE DIAL AT LAUNCH, PINNED TO L4'S READ (the launch plan's step L4, D52 R1 and R2; the full tier). L4's read of 2 Nov
 * (research/solver/results-levers.txt) decided by R1 that B3a ships at positions 3, 6 and 10, and by R2 that the dial at
 * launch keeps positions 1, 3, 6 and 10. The tests that read the app's dial build their expected values from the constants
 * themselves (the reviewer at the read, reviews/2026-11-02-read-L4.md, MINOR 1), so a change of variant or of the age
 * weights would pass them. This test reads the decision from the results file and the weights from what L4 ran
 * (audit-levers.mjs AW), and checks src/solverSettings.js against them:
 *   1. APP_DIAL_VARIANT is R1's variant;
 *   2. APP_DIAL is R2's positions;
 *   3. APP_AGE_WEIGHT is the age weights L4's B3a arms ran;
 *   4. aimsOptions at each position above 1 gives lambda times the position, the layer loop and (under B3a) those weights;
 *   5. dialSettings, the key's part (src/solverKey.js), names the variant and those weights at each position above 1.
 * Planted (DIAL_VARIANT_PLANT): 'b3b' runs the checks on a copy of src/solverSettings.js with the variant 'B3b', 'weight'
 * on a copy with the age weights' mode at 91; each fails.
 *   node research/tests/dial-variant.test.mjs
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { AW } from '../solver/audit-levers.mjs';

let n = 0, failed = 0;
const ok = (c, msg) => { if (c) { n++; console.log(`PASS  ${msg}`); } else { failed++; console.log(`FAIL  ${msg}`); } };
const SRC = fileURLToPath(new URL('../../src/solverSettings.js', import.meta.url));
const READ = readFileSync(fileURLToPath(new URL('../solver/results-levers.txt', import.meta.url)), 'utf8');

const PLANT = process.env.DIAL_VARIANT_PLANT || '';
const S = await (async () => {
  if (!PLANT) return import(pathToFileURL(SRC).href);
  const swap = { b3b: [/APP_DIAL_VARIANT = 'B3a'/, "APP_DIAL_VARIANT = 'B3b'"], weight: [/\{ mode: 90, disp: 9 \}/, '{ mode: 91, disp: 9 }'] }[PLANT];
  if (!swap) { console.error(`dial-variant: unknown plant ${PLANT}`); process.exit(2); }
  const text = readFileSync(SRC, 'utf8');
  if (!swap[0].test(text)) { console.error(`dial-variant: the plant ${PLANT} finds nothing to change`); process.exit(2); }
  const f = join(mkdtempSync(join(tmpdir(), 'dial-variant-')), 'solverSettings.mjs');
  writeFileSync(f, text.replace(swap[0], swap[1]));
  console.log(`(planted: ${PLANT})`);
  return import(pathToFileURL(f).href);
})();

const r1 = READ.match(/^.*R1: (B3a|B3b) SHIPS at positions ([\d, and]+)\./m), r2 = READ.match(/^R2: THE DIAL AT LAUNCH: (B3a|B3b) at ([\d, ]+)\./m);
if (!r1 || !r2) { console.error('dial-variant: results-levers.txt carries no R1 or R2 verdict'); process.exit(2); }
const variant = r1[1], positions = r2[2].split(',').map(Number);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// 1 to 3: the constants against the read and the run
ok(S.APP_DIAL_VARIANT === variant && r2[1] === variant, `1. the dial's variant ${S.APP_DIAL_VARIANT}; R1 and R2 decided ${variant}`);
ok(same([...S.APP_DIAL], positions), `2. the dial's positions ${S.APP_DIAL.join(', ')}; R2 kept ${positions.join(', ')}`);
ok(same({ ...S.APP_AGE_WEIGHT }, { ...AW }), `3. the age weights ${JSON.stringify(S.APP_AGE_WEIGHT)}; L4's B3a arms ran ${JSON.stringify(AW)}`);

// 4 and 5: what the app's solve and its key take at each position above 1
const planAt = cuts => ({ solver: { aims: { cuts, estate: 'standard', raises: 'capped', riskConsent: true } } });
const wantW = variant === 'B3a' ? { ...AW } : undefined;
const aims = positions.filter(p => p > 1).map(p => ({ p, o: S.aimsOptions(planAt(p)) }));
const badAims = aims.filter(({ p, o }) => Math.abs(o.lambda - S.APP_LAMBDA * p) > 1e-15 || o.tsOnce !== false || !same(o.ageWeight && { ...o.ageWeight }, wantW));
ok(aims.length === 3 && !badAims.length, `4. aimsOptions at ${aims.map(a => a.p).join(', ')}: lambda times the position, the layer loop, the age weights ${JSON.stringify(wantW)}${badAims.length ? `; differs at ${badAims.map(a => `${a.p} ${JSON.stringify(a.o)}`).join('; ')}` : ''}`);
const keys = positions.filter(p => p > 1).map(p => ({ p, d: S.dialSettings(planAt(p)).dial }));
const badKeys = keys.filter(({ d }) => !d || d.variant !== variant || d.lock !== 'base' || !same(d.ageWeight && { ...d.ageWeight }, wantW));
ok(keys.length === 3 && !badKeys.length && same(S.dialSettings(planAt(1)), {}), `5. the key's dial part at ${keys.map(k => k.p).join(', ')}: ${variant}, locked to the base, the age weights ${JSON.stringify(wantW)}; nothing at 1${badKeys.length ? `; differs at ${badKeys.map(k => `${k.p} ${JSON.stringify(k.d)}`).join('; ')}` : ''}`);

console.log(failed ? `FAILED: ${failed} of ${n + failed} checks` : `ALL PASS: ${n} checks`);
process.exit(failed ? 1 : 0);
