/*
 * THE ONE-TIER FIX'S IDENTITY (risk-consent.test.mjs; the deep review after Phase 4, section 8 item 5). The fix touches only
 * a solve whose tier menu has one pair; every solve with two pairs or more must be the same bit for bit. Run once on the
 * code before the fix (--save), once after (--compare): the candidate and the product's settings, consent given, on S224,
 * S370 and S248 at 4 wealth points, their tables, their layers and the engine's run of each on 200 paths of 99001.
 *   node research/solver/consent-identity.mjs --save <file>        on the code before the fix
 *   node research/solver/consent-identity.mjs --compare <file> > research/solver/results-consent-identity.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solvePlan } from '../../src/solver/solve.js';
import { withTable } from '../../src/solver/bridge.js';
import { solveCandidate, candidatePlan } from './candidate.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { codeId } from './code-id.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const RUN = { lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02 }, IDS = ['S224', 'S370', 'S248'];
const all = buildScenarios();
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
const arraysHash = roots => {
  const h = createHash('sha256'), seen = new Set();
  const walk = o => { if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o); if (ArrayBuffer.isView(o)) { h.update(Buffer.from(o.buffer, o.byteOffset, o.byteLength)); return; } if (Array.isArray(o)) { o.forEach(walk); return; } for (const k of Object.keys(o).sort()) { if (k === 'g' || k === 'm' || k === 'c') continue; walk(o[k]); } };
  roots.forEach(walk); return h.digest('hex').slice(0, 16);
};
function unit(id, arm) {
  const plan = prep(JSON.parse(JSON.stringify(all.find(s => s.id === id).plan)));
  const r = arm === 'CAND' ? solveCandidate(E, M, plan, RUN) : solvePlan(E, M, candidatePlan(E, plan), RUN);
  const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), h = createHash('sha256');
  for (const zs of E.pathsForSeed(99001, 200, ctx.totalYears)) { const x = E.runTrial(ctx, Float64Array.from(zs)); h.update([x.survived, x.terminalPotNet, x.lifetimeTax, x.unmetTotal].join(':') + ';'); }
  return { table: arraysHash(r.mix ? r.mix.tables : [r.table]), layers: arraysHash([r.tablesW]), run: h.digest('hex').slice(0, 16), tierState: r.meta.tierState || 'off' };
}

const [mode, file] = process.argv.slice(2);
const cid = codeId(), code = cid ? cid.hash : 'unknown';
const now = {}; for (const id of IDS) for (const arm of ['SHIP', 'CAND']) now[`${id} ${arm}`] = unit(id, arm);
if (mode === '--save') { writeFileSync(file, JSON.stringify({ code, units: now }, null, 1)); console.log(`saved ${Object.keys(now).length} units on code ${code} to ${file}`); process.exit(0); }
if (mode !== '--compare') { console.error('usage: --save <file> | --compare <file>'); process.exit(2); }
const before = JSON.parse(readFileSync(file, 'utf8'));
console.log(`THE ONE-TIER FIX'S IDENTITY: consent given, 4 wealth points; before the fix code ${before.code}, after ${code}`);
let bad = 0;
for (const [k, a] of Object.entries(now)) {
  const b = before.units[k], same = b && b.table === a.table && b.layers === a.layers && b.run === a.run;
  if (!same) bad++;
  console.log(`${same ? 'SAME' : 'DIFFERENT'}  ${k}: table ${a.table} layers ${a.layers} the engine's run ${a.run} (tier state ${a.tierState})${same ? '' : `; before: table ${b && b.table} layers ${b && b.layers} run ${b && b.run}`}`);
}
console.log(bad ? `IDENTITY BROKEN: ${bad} of ${Object.keys(now).length} units differ` : `IDENTITY: ${Object.keys(now).length} of ${Object.keys(now).length} units the same bit for bit`);
process.exit(bad ? 1 : 0);
