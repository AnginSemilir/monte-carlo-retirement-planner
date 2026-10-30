/*
 * WHERE AN APP ARM'S INPUTS DIFFER (EXPLORATORY; LEVERS.md): the read refuses a household whose arms differ in the inputs
 * hash. An app pick with the full lump sum ('Full 25% Lump Sum', the app's own drawdown strategy) stages the lump sum as a
 * transfer, and the engine sets the pension's MPAA age (E.resolveMpaa) from when the pick first takes pension income; the
 * hash counts both. This checks that those two are the whole difference: the pick hashed with its drawdown strategy set
 * back to the household's own and the MPAA age set to the other arms' must give the other arms' hash; and that the MPAA age
 * is inert. The MPAA only caps pension contributions once it applies (the engine's mpaaLimit, a year), so it is inert where
 * no year's contribution to the pension, regular or one-off, exceeds that cap. Planted: the same with the target moved by
 * £100 must not match.
 *   node inputs-check.mjs <unit dir> <id> <arm>        (from the root of the code under test)
 */
import { resolve, join } from 'path';
import { pathToFileURL } from 'url';
import { readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs');
const { readPanel } = await imp('research/solver/phase4-panel.mjs');
const { armA } = await imp('research/solver/select-phase4.mjs');
const { inputsHash } = await imp('research/solver/audit-phase4.mjs');
const [dir, id, arm] = process.argv.slice(2);
const h = readPanel().find(x => x.id === id);
const unit = a => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}-${a.toLowerCase()}.json.gz`))));
const u = unit(arm), others = ['FIXHOLD', 'FIXCAND', 'FLEXHOLD', 'CAND', 'APP'].map(a => unit(a).inputs);
const fixed = arm.startsWith('FIX'), plan = fixed ? E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 5, raiseCap: 1 } }) : null;
if (!fixed) { console.error('inputs-check: written for the fixed-spending app arms'); process.exit(2); }
const pick = armA(plan, { tournament: false }).planState;
const hashOf = ps => inputsHash(E.buildContext(E.resolveMpaa(ps)));
const asRun = hashOf(pick), own = { ...pick, spending: { ...pick.spending, drawdownStrategy: h.plan.spending.drawdownStrategy } };
const otherMpaa = E.buildContext(E.resolveMpaa(armA(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: true, lookaheadYears: 5, raiseCap: 1.1 } }), { tournament: false }).planState)).owners[0].mpaaAge;
const hashAt = (ps, mpaa) => { const c = E.buildContext(E.resolveMpaa(ps)); const was = c.owners[0].mpaaAge; c.owners[0].mpaaAge = mpaa; return { hash: inputsHash(c), was }; };
const backed = hashAt(own, otherMpaa), back = backed.hash;
const planted = hashAt({ ...own, spending: { ...own.spending, targetSpend: Number(own.spending.targetSpend) + 100 } }, otherMpaa).hash;
const c0 = E.buildContext(E.resolveMpaa(pick)), pen = c0.accounts.filter(a => a.cat === 'pen'), penIds = new Set(pen.map(a => a.id));
// the largest year's pension contribution: the regular contribution, plus the one-off contributions routed to a pension
const byYear = new Map();
for (const [yr, list] of (c0.oneOffContribs instanceof Map ? c0.oneOffContribs : new Map())) for (const o of list) if (penIds.has(o.id)) byYear.set(yr, (byYear.get(yr) || 0) + Math.abs(Number(o.amount) || 0));
const regular = pen.reduce((t, a) => t + Math.abs(Number(a.contrib) || 0), 0);
const largest = regular + Math.max(0, ...byYear.values()), cap = c0.P.mpaaLimit;
let failed = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) failed++; };
ok(asRun === u.inputs, `${id} ${arm}: its pick (${u.ran.label}; drawdown '${pick.spending.drawdownStrategy}') hashes ${asRun}, as its unit recorded (${u.inputs})`);
ok(new Set(others).size === 1 && back === others[0], `${id} ${arm}: with the drawdown set back to the household's own ('${h.plan.spending.drawdownStrategy}') and the MPAA age at the other arms' (${otherMpaa}, the pick's ${backed.was}) it hashes ${back}, every other arm's (${[...new Set(others)].join(', ')})`);
ok(pen.length > 0 && largest <= cap, `${id}: the largest year's pension contribution is £${largest} (regular £${regular}; one-off ${[...byYear].map(([y, v]) => `£${v} in ${y}`).join(', ') || 'none'}), within the MPAA's £${cap}, so the MPAA age cannot bind`);
ok(planted !== back, `planted: the target moved by £100 hashes ${planted}, not ${back}`);
console.log(failed ? `FAILED: ${failed} checks` : 'ALL PASS: 4 checks');
process.exit(failed ? 1 : 0);
