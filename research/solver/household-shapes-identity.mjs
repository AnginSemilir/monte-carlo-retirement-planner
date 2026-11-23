/*
 * STEP 4'S IDENTITY (research/solver/STEP4-SHAPES.md: "with the option unset, every household plan is the code before's,
 * byte for byte"). Every couple run on the household route and the library's couples, each as handed over and on its mirror,
 * their household plan built at the couples' default form ('pensionsPA') by this tree's householdPlanFor with opts.takeShapes
 * unset, and by the code before step 4 (src/solver/household.js in the tree given, a checkout without it), compared as JSON;
 * a plan refused must be refused by both, with the same message. No path is run.
 *   node research/solver/household-shapes-identity.mjs <the tree before> > research/solver/results-household-shapes-identity.txt
 */
import * as E from '../engine.mjs';
import { householdPlanFor } from '../../src/solver/household.js';
import { householdPlan } from '../../src/solverCouple.js';
import { otherOrder } from '../../src/coupleOrder.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readOpenPanel } from './couples-open-panel.mjs';
import { readHspPanel } from './household-hsp-panel.mjs';
import { readShapesPanel } from './shapes-panel.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { readPanel } from './couple-panel.mjs';
import { codeId } from './code-id.mjs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const before = process.argv[2];
if (!before) { console.error('household-shapes-identity: give the tree before step 4'); process.exit(2); }
const old = await import(join(resolve(before), 'src/solver/household.js'));
const rev = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: resolve(before) }).toString().trim(); } catch { return 'unknown'; } })();
const build = (fn, hp) => { try { return { plan: JSON.stringify(fn(E, hp, { scale: 'pensionsPA' })) }; } catch (e) { if (/^householdPlanFor: /.test(e.message)) return { refused: e.message }; throw e; } };
const SETS = [
  ['the registered couples panel (couples-open-registered-panel.json)', () => readOpenPanel(new URL('./couples-open-registered-panel.json', import.meta.url).pathname).map(u => [u.id, u.plan])],
  ['the dress rehearsal\'s panel (couples-open-panel.json)', () => readOpenPanel(new URL('./couples-open-panel.json', import.meta.url).pathname).map(u => [u.id, u.plan])],
  ['step 8\'s panel (household-hsp-panel.json)', () => readHspPanel().map(u => [u.id, u.plan])],
  ['step 5\'s shapes (shapes-panel.json)', () => readShapesPanel().map(u => [u.id, u.plan])],
  ['the share rules\' panel (share-rules-panel.json)', () => readSharePanel().map(u => [u.id, u.plan])],
  ['the couples\' re-run panel (couples-panel-d4b.json)', () => readPanel().map(u => [u.id, u.plan])],
  ['the library\'s couples', () => buildScenarios().filter(s => s.plan.demographics.planningMode === 'couple').map(s => [s.id, s.plan])]
];
const cid = codeId();
console.log(`STEP 4'S IDENTITY: this tree (code ${cid ? cid.hash : 'unknown'}) with the shapes unset, against the code before step 4 (${resolve(before)} at ${rev}); the household plan at 'pensionsPA'. No path run.`);
let total = 0, refusedAll = 0, differAll = 0;
for (const [name, unitsOf] of SETS) {
  let n = 0, refused = 0, differ = 0; const first = [];
  for (const [id, plan] of unitsOf()) for (const [order, p] of [['as handed over', plan], ['its mirror', otherOrder(E, plan)]]) {
    const hp = householdPlan(E, p), a = build(householdPlanFor, hp), b = build(old.householdPlanFor, hp);
    n++; if (a.refused) refused++;
    if (JSON.stringify(a) !== JSON.stringify(b)) { differ++; if (first.length < 3) first.push(`${id} (${order})`); }
  }
  total += n; refusedAll += refused; differAll += differ;
  console.log(`${name}: ${n} household plans asked for (both orders), ${refused} refused by both; differing ${differ}${first.length ? ` (${first.join('; ')})` : ''}`);
}
console.log(`\nIN ALL: ${total} household plans asked for, ${refusedAll} refused; differing from the code before ${differAll}: ${differAll === 0 ? 'THE SAME, BYTE FOR BYTE' : 'NOT THE SAME'}`);
