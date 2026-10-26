// The product's solve (solvePlan at 30 points, as gate 5 times it) on the speed checkout, timed, its tables hashed:
//   node prod-time.mjs <household> <PRODUCT | PRODUCTGFN (with E10, the gross-up without its list, as a port on every path would have it)>
// On the speed checkout the realAt cache is on in every path, the product's included.
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import { createHash } from 'crypto';
const imp = p => import(pathToFileURL(resolve(process.cwd(), p)).href);
const E = await imp('research/engine.mjs'), M = await imp('src/solver/model.js'), S = await imp('src/solver/solve.js');
const { buildScenarios } = await imp('research/policy-study/scenarios.mjs');
const [id, arm] = process.argv.slice(2);
if (arm !== 'PRODUCT' && arm !== 'PRODUCTGFN') throw new Error(`arm ${arm}?`);
const h = buildScenarios().find(s => s.id === id);
const plan = E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
const t0 = Date.now(), r = S.solvePlan(E, M, plan, { lambda: 0.0223606797749979, points: 30, ...(arm === 'PRODUCTGFN' ? { gfnFast: true } : {}) }), secs = (Date.now() - t0) / 1000;
const hh = createHash('sha256');
for (const key of ['surv', 'beq', 'resil', 'pol', 'short']) for (const a of r[key]) hh.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
console.log(JSON.stringify({ who: id, arm, points: 30, secs, moves: r.actions.length, hash: hh.digest('hex').slice(0, 16), realAt: process.env.REALAT_NOCACHE ? 'uncached' : 'cached' }));
