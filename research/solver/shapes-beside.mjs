/*
 * BESIDE STEP 5'S READ (EXPLORATORY, written after the read, deciding nothing; the read is results-shapes.txt, made once by
 * reduce-shapes.mjs). From the same unit files, with the reducer's own cells and stats.mjs survivalChange:
 *   A. HS less K2 in survival, pooled and by shape, each with and without the unit that contributes most to it (by the size
 *      of its net paths saved);
 *   B. CEIL less HS by shape, each shape's mean with and without its largest unit (the rule's "a shape averages more than 1
 *      point" read that way too);
 *   C. spending on the paths both keep, HS against K2, pooled, with and without its largest unit;
 *   D. by unit, K2 less APP and HS less APP in survival (paired by path), and whether the app's own guard would hand the
 *      couple, as entered, to the solver (src/couplesSwitch.js coupleSolverOn: the pots' share in the band, or the elder
 *      holding more than 60% and at most 90%, and the age cap): where it would, the arm a user of the opt-in gets is K2, and
 *      where not, APP; the units where the guard hands the couple to K2 and K2's interval against APP lies wholly below 0.
 *   node research/solver/shapes-beside.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { armOf, cells, spendOn } from './reduce-household.mjs';
import { ARMS, SHAPES } from './reduce-shapes.mjs';
import { survivalChange } from './stats.mjs';
import { readShapesPanel } from './shapes-panel.mjs';
import { coupleSolverOn } from '../../src/couplesSwitch.js';

const HERE = dirname(fileURLToPath(import.meta.url)), DIR = join(HERE, 'results', 'shapes-7002');
const panel = readShapesPanel(), ids = panel.map(u => u.id);
const units = readdirSync(DIR).filter(f => /\.json\.gz$/.test(f)).map(f => { const U = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); for (const a of ARMS) U.arms[a] = armOf(U.arms[a]); return U; }).sort((p, q) => ids.indexOf(p.id) - ids.indexOf(q.id));
if (units.length !== 28) { console.error(`shapes-beside: ${units.length} units, not 28`); process.exit(2); }
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4);
const iv = r => `${f3(r.d)} (${f3(r.lo)} to ${f3(r.hi)})`;
const pair = (L, b, a) => { let lost = 0, saved = 0, n = 0; for (const U of L) { const c = cells(U.arms[b], U.arms[a]); lost += c.lost; saved += c.saved; n += c.N; } return survivalChange(lost, saved, n); };
const largest = (L, b, a) => { const by = L.map(U => { const c = cells(U.arms[b], U.arms[a]); return Math.abs(c.saved - c.lost); }); return L[by.indexOf(Math.max(...by))]; };
const without = (L, b, a) => { const big = largest(L, b, a); return `${iv(pair(L, b, a))} on ${L.length} units; without ${big.id} ${iv(pair(L.filter(U => U !== big), b, a))}`; };
console.log(`BESIDE STEP 5'S READ (EXPLORATORY, after the read, deciding nothing): 28 units, seed ${units[0].seed}, ${units[0].N} paths; survival in points, paired by path (stats.mjs survivalChange)`);
console.log('\nA. HS less K2, with and without its largest unit');
console.log(`  pooled: ${without(units, 'K2', 'HS')}`);
for (const s of SHAPES) console.log(`  ${s.padEnd(8)} ${without(units.filter(U => U.shape === s), 'K2', 'HS')}`);
console.log('\nB. CEIL less HS by shape: the mean over its units (the rule\'s measure), with and without its largest unit');
for (const s of SHAPES) {
  const L = units.filter(U => U.shape === s), d = L.map(U => { const c = cells(U.arms.HS, U.arms.CEIL); return { id: U.id, d: survivalChange(c.lost, c.saved, c.N).d }; });
  const m = x => x.reduce((t, q) => t + q.d, 0) / x.length, big = d.reduce((p, q) => (Math.abs(q.d) > Math.abs(p.d) ? q : p));
  console.log(`  ${s.padEnd(8)} ${f3(m(d))} (${d.map(q => `${q.id} ${f3(q.d)}`).join(', ')}); without ${big.id} ${f3(m(d.filter(q => q !== big)))}`);
}
console.log('\nC. spending delivered on the paths both keep, HS against K2, with and without its largest unit');
{
  const sp = spendOn(units.map(U => [U.arms.K2, U.arms.HS]), true), i = sp.by.map(q => Math.abs(q.D)).indexOf(Math.max(...sp.by.map(q => Math.abs(q.D))));
  const w = spendOn(units.filter((U, j) => j !== i).map(U => [U.arms.K2, U.arms.HS]), true).pooled;
  console.log(`  ${f4(sp.pooled.d)}% (${f4(sp.pooled.lo)} to ${f4(sp.pooled.hi)}); without ${units[i].id} ${f4(w.d)}% (${f4(w.lo)} to ${f4(w.hi)})`);
}
console.log('\nD. by unit, against the app\'s rules (APP): K2 less APP and HS less APP; and whether the app\'s guard hands the couple, as entered, to the solver (src/couplesSwitch.js)');
const harmed = [];
for (const U of units) {
  const P = panel.find(u => u.id === U.id), g = coupleSolverOn(P.plan), ck = cells(U.arms.APP, U.arms.K2), ch = cells(U.arms.APP, U.arms.HS);
  const k = survivalChange(ck.lost, ck.saved, ck.N), h = survivalChange(ch.lost, ch.saved, ch.N);
  if (g.on && k.hi < 0) harmed.push(`${U.id} ${iv(k)}`);
  console.log(`  ${U.id.padEnd(20)} K2 less APP ${iv(k)}; HS less APP ${iv(h)}; the guard: ${g.on ? `the solver (the pots' share ${g.share.toFixed(3)}${g.swap ? ', on its mirror' : ''})` : `the app's rules (${g.why}; the pots' share ${g.share.toFixed(3)})`}`);
}
console.log(`  the guard hands to the solver and K2's interval against APP lies wholly below 0: ${harmed.join('; ') || 'none'}`);
console.log(`  K2 less APP pooled over the units the guard hands to the solver: ${without(units.filter(U => coupleSolverOn(panel.find(u => u.id === U.id).plan).on), 'APP', 'K2')}`);
