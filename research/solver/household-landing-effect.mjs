/*
 * THE LANDING FIX'S EFFECT ON THE HOUSEHOLD ROUTE (EXPLORATORY, the tuning seed; the reviewer on step 4's change of default,
 * finding 1). The registered couples test's pilot (results/couples-open-pilot: the registered panel's 44 household-route units,
 * 1,000 paths of seed 7002, 45 points; its ROUTE the app's own route on the code of 22 Nov, before the fix) holds each unit's
 * paths under the household route and the app's rules. For each of those units whose later retiree's saving the fix lands
 * otherwise (household-landing-scan.mjs's class: a listed deposit short under the plant 'roomclaim', the code before), the
 * app's route solved again on this code exactly as couples-open-port-identity.mjs solves it (the plan as the pilot handed it,
 * its mirror where swapped, the page's cut, the table at the app's points inside its bands, the assembly, the page's context)
 * and run on the pilot's own paths: survival after the fix against the pilot's ROUTE (before) and APP, the paths it saves and
 * loses against ROUTE, and the spending delivered and the pot. Decides nothing.
 *   node research/solver/household-landing-effect.mjs [unit ...] > research/solver/results-household-landing-effect.txt
 * HLE_PART=k/n every n-th unit from the k-th (a part's lines, the parts' lines then put in the panel's order).
 *   node research/solver/household-landing-effect.mjs --assemble part ... > research/solver/results-household-landing-effect.txt
 * puts the parts' lines (the effect's, then the control's) in the panel's order and prints the summary from them.
 * HLE_PLANT=roomclaim, the control: each unit solved and run under that plant (the household plan as before the fix), its
 * paths held to the pilot's ROUTE bit for bit (survival, spending delivered and the pot on every path), so the before arm is
 * this code without the fix and nothing else.
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { solveForApp } from '../../src/solverApp.js';
import { householdCut, householdSolved } from '../../src/solverCouple.js';
import { bandsAt, HOUSE } from '../../src/solver/household.js';
import { solvedContext } from '../../src/solverStrategy.js';
import { APP_COUPLE, appJoint, APP_POINTS } from '../../src/solverSettings.js';
import { swapOf } from '../../src/couplesSwitch.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { readOpenPanel } from './couples-open-panel.mjs';
import { solverPlanOf } from './shapes-panel.mjs';
import { runPath } from './audit-phase4.mjs';
import { KEYS } from './audit-couples-open.mjs';
import { codeId } from './code-id.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
if (process.argv[2] === '--assemble') {
  const lines = process.argv.slice(3).flatMap(f => readFileSync(f, 'utf8').split('\n').filter(Boolean));
  const order = readOpenPanel(join(HERE, 'couples-open-registered-panel.json')).map(u => u.id), at = l => order.indexOf(l.split(' ')[0]);
  const heads = lines.filter(l => l.startsWith('THE LANDING')), body = lines.filter(l => !l.startsWith('THE LANDING'));
  const effect = body.filter(l => / survival: /.test(l)).sort((a, b) => at(a) - at(b)), control = body.filter(l => /, against the pilot's ROUTE: /.test(l)).sort((a, b) => at(a) - at(b));
  const head = heads.find(l => !/THE CONTROL/.test(l));
  console.log(head.replace(/, part \d+\/\d+: .*$/, ''));
  effect.forEach(l => console.log(l));
  const num = (l, re) => Number(l.match(re)[1]);
  const saved = effect.reduce((s, l) => s + num(l, /\((\d+) saved/), 0), lost = effect.reduce((s, l) => s + num(l, /saved, (\d+) lost/), 0), n = effect.reduce((s, l) => s + num(l, /lost of (\d+)\)/), 0);
  const sp = effect.map(l => num(l, /spending delivered (-?[\d.]+)%/)), pot = effect.map(l => num(l, /the mean pot (-?[\d.]+)%/));
  console.log(`IN ALL: ${effect.length} units, ${n} paths: ${saved} saved, ${lost} lost against the household route before the fix; spending delivered from ${Math.min(...sp).toFixed(4)}% to ${Math.max(...sp).toFixed(4)}%, the mean pot from ${Math.min(...pot).toFixed(3)}% to ${Math.max(...pot).toFixed(3)}%`);
  if (control.length) {
    console.log(`THE CONTROL: each unit solved and run under the plant 'roomclaim' (the household plan as before the fix), held to the pilot's ROUTE path for path`);
    control.forEach(l => console.log(l));
    const same = control.filter(l => /THE SAME/.test(l)).length;
    console.log(`THE CONTROL IN ALL: ${same} of ${control.length} units the pilot's ROUTE on every path${same === control.length && control.length === effect.length ? ': the before arm is this code without the fix' : ''}`);
  }
  process.exit(0);
}
const DIR = join(HERE, 'results', 'couples-open-pilot'), only = process.argv.slice(2);
if (!existsSync(DIR)) { console.error(`household-landing-effect: the registered test's pilot is not here (${DIR})`); process.exit(2); }
const FORM = APP_COUPLE.household, joint = appJoint();
const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
/* whether the fix lands this plan's later-retiree saving otherwise: a listed deposit short under the code before */
const shortBefore = plan => {
  HOUSE.plant = 'roomclaim';
  try { const cut = householdCut(E, M, plan, FORM), ctx = E.buildContext(cut.hplan); return (cut.hplan.oneOffContributions || []).filter(x => /^dep_house_/.test(x.id)).some(d => { const s = ctx.oneOffStaging.get(d.id); return !s || !s.direct || Math.abs(s.amount - d.amount) > 0.005; }); }
  finally { HOUSE.plant = ''; }
};
const [partK, partN] = (process.env.HLE_PART || '0/1').split('/').map(Number), CONTROL = process.env.HLE_PLANT || '';
if (CONTROL && CONTROL !== 'roomclaim') { console.error(`household-landing-effect: HLE_PLANT '${CONTROL}' (want 'roomclaim')`); process.exit(2); }
const all = readOpenPanel(join(HERE, 'couples-open-registered-panel.json')).filter(u => u.route === 'household' && existsSync(join(DIR, `${u.id}.json.gz`)) && (!only.length || only.includes(u.id)));
const reached = all.filter(u => { const { hp } = solverPlanOf(u.plan, 'own'); return shortBefore(swapOf(hp) ? otherOrder(E, hp) : hp); });
const units = reached.filter((u, i) => i % partN === partK);
const cid = codeId();
console.log(`THE LANDING FIX'S EFFECT (EXPLORATORY, seed 7002, the registered test's pilot): code ${cid ? cid.hash : 'unknown'}; ${reached.length} of the pilot's ${all.length} household-route units reached by the fix${partN > 1 ? `, part ${partK}/${partN}: ${units.map(u => u.id).join(', ')}` : ''}${CONTROL ? `; THE CONTROL, under the plant '${CONTROL}'` : ''}`);
for (const U of units) {
  if (CONTROL) HOUSE.plant = CONTROL;
  const P = JSON.parse(gunzipSync(readFileSync(join(DIR, `${U.id}.json.gz`))).toString());
  const arr = (arm, k) => dec(P.arms[arm][k], KEYS[k]);
  const before = { survived: arr('ROUTE', 'survived'), delivered: arr('ROUTE', 'delivered'), pot: arr('ROUTE', 'pot') }, app = { survived: arr('APP', 'survived') };
  const { hp } = solverPlanOf(U.plan, 'own'), handed = swapOf(hp) ? otherOrder(E, hp) : hp;
  const t0 = Date.now(), cut = householdCut(E, M, handed, FORM), b = cut.bands;
  const H = bandsAt(E, b.k, b.paOne, () => solveForApp(E, M, cut.hplan, { points: APP_POINTS, ageWith: cut.ageWith }), b.paK);
  const cp = householdSolved(E, M, { household: cut.household, form: FORM, topK: 3, tieJoint: joint.tieJoint, holdPast: joint.holdPast }, { plan: cut.hplan, r: H });
  const ctx = solvedContext(E, cp), paths = E.pathsForSeed(P.seed, P.N, ctx.totalYears).map(zs => Float64Array.from(zs));
  let sB = 0, sA = 0, sApp = 0, saved = 0, lost = 0, dB = 0, dA = 0, pB = 0, pA = 0; const apart = [0, 0, 0];
  for (let i = 0; i < P.N; i++) {
    const r = runPath(ctx, paths[i], false), s = r.survived ? 1 : 0;
    sA += s; sB += before.survived[i]; sApp += app.survived[i];
    if (s && !before.survived[i]) saved++; if (!s && before.survived[i]) lost++;
    dA += r.delivered; dB += before.delivered[i]; pA += r.wealth; pB += before.pot[i];
    if (s !== before.survived[i]) apart[0]++; if (!Object.is(r.delivered, before.delivered[i])) apart[1]++; if (!Object.is(r.wealth, before.pot[i])) apart[2]++;
  }
  HOUSE.plant = '';
  const pc = x => (100 * x / P.N).toFixed(2);
  if (CONTROL) { console.log(`${U.id.padEnd(10)} under '${CONTROL}', against the pilot's ROUTE: paths apart in survival ${apart[0]}, spending delivered ${apart[1]}, the pot ${apart[2]} of ${P.N}: ${apart.every(x => x === 0) ? 'THE SAME' : 'APART'}; solved in ${((Date.now() - t0) / 1000).toFixed(0)} s`); continue; }
  console.log(`${U.id.padEnd(10)} survival: APP ${pc(sApp)}%, the household route before the fix ${pc(sB)}%, after it ${pc(sA)}% (${saved} saved, ${lost} lost of ${P.N}); spending delivered ${dB ? ((dA / dB - 1) * 100).toFixed(4) : '0.0000'}%, the mean pot ${pB ? ((pA / pB - 1) * 100).toFixed(3) : '0.000'}% against before; solved in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
