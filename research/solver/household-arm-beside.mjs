// Beside step 8's arm read (HOUSEHOLD-ARM.md; EXPLORATORY, seed 7002), written after the read and deciding nothing:
//   A. the run's arms against the same arms of the earlier runs on the same units and paths, path by path: K2 against the
//      lead test's (results/household-7002) and the remedy read's (results/household-remedy-7002) on the lead test's 28;
//      HSP against the remedy read's; APP and K2 against step 5's (results/shapes-7002) on its 28 shapes. The code moved
//      between them (603eeb595679 to 71fb4271c681: the ISA allowance in a deposit year, D130 (1)), so an arm that differs is
//      named with its paths;
//   B. each unit's margin under HSP and HSPA by D34's rule in whole paths (the net paths lost against the unit's threshold);
//   C. the units where HSPA and HSP part most.
// Run: node research/solver/household-arm-beside.mjs > research/solver/results-household-arm-beside.txt
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDir } from './reduce-household-arm.mjs';
import { armOf as armOfOld } from './reduce-household.mjs';
import { compare } from './reduce-household-hsp.mjs';
import * as E from '../engine.mjs';
import { householdPlanFor } from './household.mjs';
import { unitsAll } from './audit-household-arm.mjs';
import { unitPlans } from './audit-household.mjs';
import { readShapesPanel, solverPlanOf } from './shapes-panel.mjs';
import { guardOf } from './household-hsp-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), R = d => join(HERE, 'results', d);
const KEYS = ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet'];
const loadOld = (dir, arms) => readdirSync(dir).filter(x => /\.json\.gz$/.test(x)).map(x => {
  const U = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString());
  for (const a of arms) if (U.arms[a]) U.arms[a] = armOfOld(U.arms[a]);
  return U;
});
const byId = us => Object.fromEntries(us.map(u => [u.id, u]));
/* two arms of one unit on the same paths: the paths whose survival differs, and those whose any stored figure differs */
function diff(a, b, n) {
  const surv = [], any = [];
  for (let i = 0; i < n; i++) {
    if (a.survived[i] !== b.survived[i]) surv.push(i);
    if (KEYS.some(k => a[k][i] !== b[k][i] && !(Number.isNaN(a[k][i]) && Number.isNaN(b[k][i])))) any.push(i);
  }
  return { surv, any };
}

const arm = loadDir(R('household-arm-7002')), A = byId(arm);
const lead = byId(loadOld(R('household-7002'), ['K2'])), remedy = byId(loadOld(R('household-remedy-7002'), ['K2', 'HSP'])), shapes = byId(loadOld(R('shapes-7002'), ['APP', 'K2']));
const out = [];
out.push('BESIDE STEP 8\'S ARM READ (EXPLORATORY; written after the read, deciding nothing): results-household-arm.txt');
out.push(`the run: code ${arm[0].stamp.code}, audit ${arm[0].stamp.audit}; the lead test's code ${Object.values(lead)[0].stamp.code}, the remedy read's ${Object.values(remedy)[0].stamp.code}, step 5's ${Object.values(shapes)[0].stamp.code}`);

out.push('\nA. THE RUN\'S ARMS AGAINST THE EARLIER RUNS\' ON THE SAME UNITS AND PATHS (4,000 paths of seed 7002 each)');
const tally = {}, moved = {};
const line = (tag, u, a, b) => {
  const n = Math.min(u.N, a.survived.length, b.survived.length), d = diff(a, b, n);
  tally[tag] = tally[tag] || { units: 0, same: 0, surv: 0, any: 0 };
  tally[tag].units++; if (!d.any.length) tally[tag].same++; else (moved[u.id] = moved[u.id] || new Set()).add(tag.split(' ')[0]); tally[tag].surv += d.surv.length; tally[tag].any += d.any.length;
  return d.any.length ? `  ${u.id.padEnd(20)} ${tag}: ${d.any.length} of ${n} paths differ in some stored figure, ${d.surv.length} in survival${d.surv.length ? ` (paths ${d.surv.slice(0, 8).join(', ')}${d.surv.length > 8 ? ', ...' : ''})` : ''}` : null;
};
const leadIds = arm.filter(u => lead[u.id]).map(u => u.id).sort(), shapeIds = arm.filter(u => shapes[u.id]).map(u => u.id).sort();
for (const id of leadIds) {
  const u = A[id];
  for (const l of [line('K2 against the lead test\'s K2', u, u.arms.K2, lead[id].arms.K2),
    remedy[id] ? line('K2 against the remedy read\'s K2', u, u.arms.K2, remedy[id].arms.K2) : null,
    remedy[id] ? line('HSP against the remedy read\'s HSP', u, u.arms.HSP, remedy[id].arms.HSP) : null]) if (l) out.push(l);
}
for (const id of shapeIds) {
  const u = A[id];
  for (const l of [line('APP against step 5\'s APP', u, u.arms.APP, shapes[id].arms.APP), line('K2 against step 5\'s K2', u, u.arms.K2, shapes[id].arms.K2)]) if (l) out.push(l);
}
const tabDiff = leadIds.filter(id => remedy[id] && A[id].digests.HSP !== remedy[id].digests.pensions);
out.push(`  HSP's household table here against the remedy read's (its digest whole; the remedy read keys it 'pensions', HSP's form), on the lead test's 28: the same on ${leadIds.filter(id => remedy[id]).length - tabDiff.length}, differing on ${tabDiff.length}: ${tabDiff.join(', ') || 'none'}`);
for (const id of tabDiff) out.push(`    ${id.padEnd(20)} here ${A[id].digests.HSP}; the remedy read ${remedy[id].digests.pensions}`);
for (const [tag, t] of Object.entries(tally)) out.push(`  ${tag}: ${t.same} of ${t.units} units the same in every stored figure on every path; ${t.surv} paths differ in survival, ${t.any} in some stored figure`);

/* A2. what the fix (D130 (1): a dated deposit or staged transfer into an ISA counted against the year's subscription) can
   reach on each unit, read from its plans: the household plan's dated deposits into an ISA (householdPlanFor as built: the
   later retiree's ISA contributions, as yearly deposits until they retire), and the couple's own deposits into an ISA or an
   Auto deposit that arm A's pick routes to the ISA (Windfall to ISA; every arm routes it as arm A does, D37) */
out.push('\nA2. WHAT THE FIX CAN REACH ON EACH UNIT, FROM ITS PLANS, BESIDE WHERE THE RUN\'S ARMS MOVED (the household arms HSP and HSPA share one household plan as built; K2 and APP the couple\'s)');
const ISA = E.CATEGORY_LABEL ? E.CATEGORY_LABEL.isa : 'S&S ISAs', AUTO = 'Auto (policy decides)';
const reach = {}, entered = {};
for (const u of unitsAll()) {
  let a, hp;
  if (u.src === 'lead') { const UP = unitPlans(u); ({ a, hp } = UP); entered[u.id] = UP.U.plan; }
  else { const S = readShapesPanel().find(x => x.id === u.id); ({ a, hp } = solverPlanOf(S.plan, S.shape)); entered[u.id] = S.plan; }
  const own = (hp.oneOffContributions || []), house = (householdPlanFor(E, hp).oneOffContributions || []);
  const houseIsa = house.filter(c => c.category === ISA && /^dep_house_/.test(c.id || '')), ownIsa = own.filter(c => c.category === ISA);
  const autoIsa = /^Windfall to ISA/.test(a.label) ? own.filter(c => c.category === AUTO) : [];
  const hplan = householdPlanFor(E, hp), hctx = E.buildContext(E.resolveMpaa(E.normalizePlan(hplan)));
  const ages = houseIsa.map(c => hctx.ageSelf0 + Number(String(c.id).split('_').pop()));
  const r = reach[u.id] = { house: houseIsa.length, houseAmt: houseIsa.reduce((x, c) => x + c.amount, 0), own: ownIsa.length, auto: autoIsa.length, label: a.label, ages, nmpa: hctx.nmpa };
  const m = moved[u.id] ? [...moved[u.id]].join(', ') : 'none';
  if (r.house || r.own || r.auto || moved[u.id]) out.push(`  ${u.id.padEnd(20)} the household plan's deposits into an ISA ${r.house}${r.house ? ` (${Math.round(r.houseAmt)} pounds in all, at the household's ages ${r.ages.join(', ')}; its pension access ${r.nmpa})` : ''}; the couple's own ${r.own}; an Auto deposit routed to the ISA by arm A's pick ${r.auto} (${a.label}); arms moved: ${m}`);
}
const reachH = id => reach[id] && (reach[id].house > 0 || reach[id].own > 0 || reach[id].auto > 0), reachC = id => reach[id] && (reach[id].own > 0 || reach[id].auto > 0);
const movedH = Object.keys(moved).filter(id => moved[id].has('HSP')), movedK = Object.keys(moved).filter(id => moved[id].has('K2')), movedP = Object.keys(moved).filter(id => moved[id].has('APP'));
const leadSet = new Set(leadIds), shapeSet = new Set(shapeIds);
const notMovedH = Object.keys(reach).filter(id => leadSet.has(id) && reachH(id) && !moved[id]?.has('HSP')), notReachH = movedH.filter(id => !reachH(id));
const notMovedK = Object.keys(reach).filter(id => (leadSet.has(id) || shapeSet.has(id)) && reachC(id) && !moved[id]?.has('K2')), notReachK = movedK.filter(id => !reachC(id));
const notMovedP = Object.keys(reach).filter(id => shapeSet.has(id) && reachC(id) && !moved[id]?.has('APP')), notReachP = movedP.filter(id => !reachC(id));
out.push(`  HSP (compared on the lead test's 28): moved on ${movedH.length} units, the fix reaching ${Object.keys(reach).filter(id => leadSet.has(id) && reachH(id)).length}; moved where it cannot reach: ${notReachH.join(', ') || 'none'}; reached and not moved: ${notMovedH.join(', ') || 'none'}`);
out.push(`  K2 (compared on all 56: the lead test's and the remedy read's on its 28, step 5's on its 28): moved on ${movedK.length} units, the fix reaching ${Object.keys(reach).filter(id => reachC(id)).length}; moved where it cannot reach: ${notReachK.join(', ') || 'none'}; reached and not moved: ${notMovedK.join(', ') || 'none'}`);
out.push(`  APP (compared on step 5's 28 alone: the lead test and the remedy read stored no APP arm): moved on ${movedP.length} units, the fix reaching ${Object.keys(reach).filter(id => shapeSet.has(id) && reachC(id)).length} of them; moved where it cannot reach: ${notReachP.join(', ') || 'none'}; not compared where the fix can reach: ${Object.keys(reach).filter(id => leadSet.has(id) && reachC(id)).join(', ') || 'none'}`);
out.push('  HSPA: no earlier run to compare with.');

/* S191-90's HSP path by path against the remedy read's, where they differ */
const s = A['S191-90'], sr = remedy['S191-90'];
if (s && sr) {
  const d = diff(s.arms.HSP, sr.arms.HSP, s.N);
  out.push(`\n  S191-90, HSP here and in the remedy read, each differing path (survived, fail year, pot left, lifetime tax, spending delivered):`);
  for (const i of d.any.slice(0, 12)) out.push(`    path ${i}: here ${s.arms.HSP.survived[i]}, ${s.arms.HSP.failYear[i]}, ${Math.round(s.arms.HSP.pot[i])}, ${Math.round(s.arms.HSP.tax[i])}, ${Math.round(s.arms.HSP.delivered[i])}; the remedy read ${sr.arms.HSP.survived[i]}, ${sr.arms.HSP.failYear[i]}, ${Math.round(sr.arms.HSP.pot[i])}, ${Math.round(sr.arms.HSP.tax[i])}, ${Math.round(sr.arms.HSP.delivered[i])}; K2 here ${s.arms.K2.survived[i]}`);
  if (d.any.length > 12) out.push(`    ... ${d.any.length - 12} more`);
  out.push(`  its household table: here HSP ${s.digests.HSP}; the remedy read's HSP ('pensions') ${sr.digests.pensions}`);
}

out.push('\nB. EACH UNIT\'S MARGIN BY D34\'S RULE IN WHOLE PATHS (the net paths lost, lost less saved, against the unit\'s threshold j in whole paths; flagged where the net exceeds j)');
const C = { HSP: compare(arm, 'K2', 'HSP'), HSPA: compare(arm, 'K2', 'HSPA') };
const near = [];
for (const r of C.HSPA.rows) {
  const h = C.HSP.rows.find(x => x.id === r.id);
  const netA = r.cells.lost - r.cells.saved, netH = h.cells.lost - h.cells.saved;
  near.push({ id: r.id, netA, netH, thrA: r.j, thrH: h.j, flagA: r.flag, flagH: h.flag });
}
near.sort((p, q) => (q.netA - (q.thrA ?? 0)) - (p.netA - (p.thrA ?? 0)));
for (const x of near.slice(0, 12)) out.push(`  ${x.id.padEnd(20)} HSPA net lost ${String(x.netA).padStart(4)} (threshold ${x.thrA ?? '?'})${x.flagA ? ' FLAGGED' : ''}; HSP net lost ${String(x.netH).padStart(4)} (threshold ${x.thrH ?? '?'})${x.flagH ? ' FLAGGED' : ''}`);
out.push(`  units with any net loss: HSPA ${near.filter(x => x.netA > 0).length} of ${near.length}, HSP ${near.filter(x => x.netH > 0).length} of ${near.length}`);

out.push('\nC. WHERE HSPA AND HSP PART MOST (HSPA less HSP, survival points on the unit; the paths each saves and loses against K2)');
const part = arm.map(u => { const a = C.HSPA.rows.find(r => r.id === u.id), h = C.HSP.rows.find(r => r.id === u.id); return { id: u.id, k: u.split.k, d: 100 * ((a.cells.saved - a.cells.lost) - (h.cells.saved - h.cells.lost)) / u.N }; });
part.sort((p, q) => Math.abs(q.d) - Math.abs(p.d));
for (const x of part.slice(0, 12)) out.push(`  ${x.id.padEnd(20)} k ${x.k.toFixed(3)}: HSPA less HSP ${x.d >= 0 ? '+' : ''}${x.d.toFixed(3)}`);
const byK = {};
for (const x of part) { const k = x.k.toFixed(3); (byK[k] = byK[k] || []).push(x.d); }
out.push(`  over the 56: HSPA higher on ${part.filter(x => x.d > 0).length}, lower on ${part.filter(x => x.d < 0).length}, the same on ${part.filter(x => x.d === 0).length}`);
for (const [k, ds] of Object.entries(byK)) out.push(`  k ${k}: ${ds.length} units, HSPA less HSP on average ${(ds.reduce((p, q) => p + q, 0) / ds.length).toFixed(3)} points, higher on ${ds.filter(d => d > 0).length}, lower on ${ds.filter(d => d < 0).length}`);
out.push('\nD. EACH TABLE\'S FORECAST AGAINST WHAT THE ENGINE DELIVERS (the forecast at the start less the survival on the 4,000 paths, points)');
for (const a of ['HSP', 'HSPA']) {
  const d = arm.map(u => ({ id: u.id, x: 100 * u.arms[a].forecast - 100 * u.arms[a].survived.reduce((p, q) => p + q, 0) / u.N }));
  const xs = d.map(z => z.x), lo = d.reduce((p, q) => (q.x < p.x ? q : p)), hi = d.reduce((p, q) => (q.x > p.x ? q : p));
  out.push(`  ${a}: the mean over the 56 ${(xs.reduce((p, q) => p + q, 0) / xs.length).toFixed(3)}; from ${lo.x.toFixed(3)} (${lo.id}) to ${hi.x.toFixed(3)} (${hi.id}); above the survival on ${xs.filter(x => x > 0).length}, below on ${xs.filter(x => x < 0).length}; more than a point away on ${xs.filter(x => Math.abs(x) > 1).length}`);
}
out.push('\nE. WHERE TODAY\'S COUPLES\' DEFAULT (K2) SURVIVES BELOW THE APP\'S RULES (APP) ON THESE PATHS, AND WHAT THE APP\'S GUARD DOES WITH THE COUPLE (src/couplesSwitch.js, on the plan as entered: on, the app runs the solver for it; off, the app\'s rules)');
for (const u of arm) {
  const n = u.N, sk = u.arms.K2.survived.reduce((p, q) => p + q, 0), sa = u.arms.APP.survived.reduce((p, q) => p + q, 0);
  if (sk >= sa) continue;
  const g = guardOf(entered[u.id]);
  out.push(`  ${u.id.padEnd(20)} K2 less APP ${(100 * (sk - sa) / n).toFixed(3)} points (K2 ${(100 * sk / n).toFixed(2)}%, APP ${(100 * sa / n).toFixed(2)}%); the guard ${g.on ? 'ON: the app runs the solver for it' : `off (${g.why}): the app keeps its own rules`}; HSPA less APP ${(100 * (u.arms.HSPA.survived.reduce((p, q) => p + q, 0) - sa) / n).toFixed(3)}`);
}
out.push('\nF. D34\'S THRESHOLD AND ITS RATES AT EACH UNIT\'S REALISED DISCORDANCE, THESE 4,000 PATHS (reduce-share-rules.mjs harmExact: j the threshold in whole paths, t in points; tp the chance a true 1-point loss is flagged)');
for (const a of ['HSP', 'HSPA']) {
  const rows = C[a].rows, js_ = rows.map(r => r.j), ts = rows.map(r => r.t), lo = rows.reduce((p, q) => (q.j < p.j ? q : p)), hi = rows.reduce((p, q) => (q.j > p.j ? q : p));
  const out23 = rows.filter(r => r.j < 21 || r.j > 23), low = rows.filter(r => r.tp < 0.90), net = r => 100 * (r.cells.saved - r.cells.lost) / r.cells.N;
  out.push(`  ${a}: the threshold from ${lo.j} paths (${lo.t.toFixed(3)} points, ${lo.id}) to ${hi.j} (${hi.t.toFixed(3)}, ${hi.id}); outside 21 to 23 paths on ${out23.length} of ${rows.length}`);
  out.push(`  ${a}: the 1-point rate below 0.90 on ${low.length} of ${rows.length}${low.length ? `, from ${Math.min(...low.map(r => r.tp)).toFixed(3)}; their change against K2 from ${Math.min(...low.map(net)).toFixed(3)} to ${Math.max(...low.map(net)).toFixed(3)} points` : ''}`);
  out.push(`  ${a}: on the units within 0.5 points of no change the threshold from ${Math.min(...rows.filter(r => Math.abs(net(r)) <= 0.5).map(r => r.j))} to ${Math.max(...rows.filter(r => Math.abs(net(r)) <= 0.5).map(r => r.j))} paths, the 1-point rate from ${Math.min(...rows.filter(r => Math.abs(net(r)) <= 0.5).map(r => r.tp)).toFixed(3)}`);
}
console.log(out.join('\n'));
