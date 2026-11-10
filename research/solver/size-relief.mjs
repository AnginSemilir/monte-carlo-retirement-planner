/*
 * ITEM 4'S SIZING (the review of 9 Nov, item 4; D69, the review's answer 1, addition 1; EXPLORATORY, seed 7002, deciding
 * nothing): every household of the two `touched` lists (phase4-orders.json, couples-orders.json) whose plan carries an Auto
 * deposit, the plan as entered and its own rules, 1,000 paths, the engine before item 4 (item 3's code alone, BEFORE) against
 * the engine after (this tree, AFTER_ROOT to override). Relief only adds money. The STOP: any household's survival falling by
 * more than 1 point, or moving by more than 3 either way: that is not this change.
 *   BEFORE=<a tree with item 3's code alone> node research/solver/size-relief.mjs [paths 1000]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AFTER = process.env.AFTER_ROOT || join(dirname(fileURLToPath(import.meta.url)), '../..'), SD = join(AFTER, 'research/solver'), SEED = 7002;
if (!process.env.BEFORE) { console.error('size-relief: BEFORE=<a tree with item 3\'s code alone>'); process.exit(2); }
const nP = Number(process.argv[2] || 1000);
const engineOf = R => import(pathToFileURL(join(R, 'research/engine.mjs')).href);
const V = { before: await engineOf(process.env.BEFORE), after: await engineOf(AFTER) };
const { buildScenarios } = await import(pathToFileURL(join(AFTER, 'research/policy-study/scenarios.mjs')).href);
const touched = new Set([...JSON.parse(readFileSync(join(SD, 'phase4-orders.json'), 'utf8')).touched.ids, ...JSON.parse(readFileSync(join(SD, 'couples-orders.json'), 'utf8')).touched.ids]);
const f1 = v => (v >= 0 ? '+' : '') + v.toFixed(2);
const rows = [];
for (const s of buildScenarios()) {
  if (!touched.has(s.id)) continue;
  const autos = (s.plan.oneOffContributions || []).filter(x => x.category === V.after.AUTO_DEPOSIT);
  if (!autos.length) continue;
  const r = { id: s.id, deposits: autos.map(x => `${x.year || String(x.date).slice(0, 4)} £${Math.round(Number(x.amount)).toLocaleString('en-GB')}`).join(', ') };
  for (const k of ['before', 'after']) {
    const E = V[k], plan = E.resolveMpaa(E.normalizePlan(s.plan)), ctx = E.buildContext(plan), paths = E.pathsForSeed(SEED, nP, ctx.totalYears);
    r[k] = paths.map(zs => (E.runTrial(ctx, zs).survived ? 1 : 0));
    // what the Auto deposits put in the pension and what they cost the household, by the plan's own routing
    const pen = [...ctx.oneOffContribs.values()].flat().filter(x => x.auto && x.id.startsWith('pen_')).reduce((t, x) => t + x.amount, 0);
    const out = [...ctx.oneOffContribs.values()].flat().filter(x => x.auto && !x.id.startsWith('pen_') && !x.id.startsWith('cash_')).reduce((t, x) => t + x.amount, 0);
    const refund = [...ctx.oneOffContribs.values()].flat().filter(x => x.auto && x.id.startsWith('cash_')).reduce((t, x) => t + x.amount, 0);
    r[`pen_${k}`] = pen; r[`out_${k}`] = out; r[`refund_${k}`] = refund;
    if (k === 'after') { const d = plan.demographics; r.couple = d.planningMode !== 'single'; r.working = Number(d.currentAgeSelf) < Number(d.retireAgeSelf); }
  }
  r.d = 100 * (r.after.reduce((a, b) => a + b, 0) - r.before.reduce((a, b) => a + b, 0)) / nP;
  r.lost = r.before.filter((x, i) => x && !r.after[i]).length; r.saved = r.before.filter((x, i) => !x && r.after[i]).length;
  r.sBefore = 100 * r.before.reduce((a, b) => a + b, 0) / nP;
  rows.push(r);
}
const n = rows.length, by = [...rows].sort((x, y) => x.d - y.d), mean = rows.reduce((t, r) => t + r.d, 0) / n, cnt = g => rows.filter(g).length;
console.log(`item 4's sizing, the plan's own rules (EXPLORATORY, D69): ${n} households of the two touched lists with an Auto deposit (${cnt(r => r.couple)} couples, ${cnt(r => r.working)} still working at the start), ${nP} paths of seed ${SEED}; items 3 and 4 less item 3 alone, survival in points`);
console.log(`  mean ${f1(mean)}; median ${f1(by[Math.floor(n / 2)].d)}; the lowest ${f1(by[0].d)} (${by[0].id}); the highest ${f1(by[n - 1].d)} (${by[n - 1].id})`);
console.log(`  falling by more than 1 point ${cnt(r => r.d < -1)}, moving by more than 3 ${cnt(r => Math.abs(r.d) > 3)}; any loss ${cnt(r => r.d < 0)}; any gain ${cnt(r => r.d > 0)}; unmoved ${cnt(r => r.d === 0)}`);
const relieved = rows.filter(r => Math.abs(r.out_after - r.out_before) > 0.005 || r.refund_after > 0.005);
console.log(`  the Auto route into a pension relieved on ${relieved.length}: the money kept from the pension's cost £${Math.round(relieved.reduce((t, r) => t + (r.out_after - r.out_before), 0) / Math.max(1, relieved.length)).toLocaleString('en-GB')} a household on average, refunds to cash on ${cnt(r => r.refund_after > 0.005)} (£${Math.round(rows.reduce((t, r) => t + r.refund_after, 0)).toLocaleString('en-GB')} in all)`);
console.log('  the twelve that move most:');
[...rows].sort((x, y) => Math.abs(y.d) - Math.abs(x.d) || x.id.localeCompare(y.id)).slice(0, 12).forEach(r => console.log(`    ${r.id}${r.couple ? ' (couple)' : ''}${r.working ? ' working' : ' retired'}: ${r.sBefore.toFixed(1)}% before, ${f1(r.d)} (${r.saved} saved, ${r.lost} lost); Auto ${r.deposits}; into the pension £${Math.round(r.pen_after).toLocaleString('en-GB')}, the rest on £${Math.round(r.out_before).toLocaleString('en-GB')} to £${Math.round(r.out_after).toLocaleString('en-GB')}, a refund £${Math.round(r.refund_after).toLocaleString('en-GB')}`));
const stop = rows.some(r => r.d < -1 || Math.abs(r.d) > 3);
console.log(`THE STOP (any household's survival falling by more than 1 point, or moving by more than 3): ${stop ? `STOP: ${rows.filter(r => r.d < -1 || Math.abs(r.d) > 3).map(r => `${r.id} ${f1(r.d)}`).join(', ')}` : 'not met'}`);
