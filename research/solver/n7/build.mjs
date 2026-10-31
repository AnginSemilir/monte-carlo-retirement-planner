/*
 * N7 (D20 (10), D41 (1)): THE DEVICE TIMING PAGE'S DATA. The page (index.html, page.mjs, worker.mjs) times the solve on a
 * laptop or a phone: today's product solve at 30 wealth points and the candidate at 45, one core, on gate 5's four
 * households (audit-e2x.mjs's PANEL: bridge 4, S126, S370, share 0.50), so each device's time reads against gate 5's
 * quiet-machine times on the research container (results-gate5.txt). This script makes what the page needs, in Node:
 *   node research/solver/n7/build.mjs case <i>   solves household i under both arms, as the page will (the plan as the
 *                                                page receives it, through JSON), into results/n7/ref-<i>.json: Node's
 *                                                time, each solve's table digest and size
 *   node research/solver/n7/build.mjs check      the same for the page's check (the product at 4 points on S126)
 *   node research/solver/n7/build.mjs data       research/solver/n7/data.json: the plans, the settings, Node's digests,
 *                                                gate 5's times and the code fingerprint; refuses a ref made on other code
 * The page checks every device solve against Node's digest (the same tables bit for bit, or not) and its loaded code
 * against the fingerprint. Run by batch.sh. EXPLORATORY: a measurement; it changes no default, gate or candidate.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadavg } from 'node:os';
import * as E from '../../engine.mjs';
import * as M from '../../../src/solver/model.js';
import { solvePlan } from '../../../src/solver/solve.js';
import { candidatePlan, CANDIDATE_OPTS, CANDIDATE_HASH } from '../candidate.mjs';
import { checkE3pclsPin } from '../e3pcls-pin.mjs';
import { buildScenarios } from '../../policy-study/scenarios.mjs';
import { CODE_FILES, tablesOf, digestOf, sizeOf, codeOf } from './digest.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../../..'), OUT = join(HERE, '../results/n7');
const PANEL = ['bridge 4', 'S126', 'S370', 'share 0.50'], LAMBDA = 0.0223606797749979, PRODUCT_POINTS = 30, CAND_POINTS = 45;

// audit-e2x.mjs's cases, copied (it runs on import): S126 with its pension share or bridge length changed
const all = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single');
const s126 = all.find(s => s.id === 'S126');
const LIQ = /^S&S ISA|^Other Investments|^Cash/;
function variant(name, { a0 = 0.85, bridge = 2 } = {}) {
  const p = JSON.parse(JSON.stringify(s126.plan));
  const Wt = p.accounts.reduce((t, a) => t + E.num(a.balance, 0), 0);
  const liq0 = p.accounts.filter(a => LIQ.test(a.category)).reduce((t, a) => t + E.num(a.balance, 0), 0);
  p.accounts = p.accounts.map(a => {
    const b = E.num(a.balance, 0);
    if (/^Pensions/.test(a.category) && b > 0) return { ...a, balance: Math.round(a0 * Wt) };
    if (LIQ.test(a.category) && b > 0) return { ...a, balance: Math.round(b / liq0 * (1 - a0) * Wt) };
    return a;
  });
  const age = E.num(p.demographics.privatePensionAge, 58) - bridge;
  p.demographics = { ...p.demographics, currentAgeSelf: age, retireAgeSelf: Math.min(age, E.num(p.demographics.retireAgeSelf, 55)) };
  return { id: name, plan: p };
}
const BUILT = { 'bridge 4': { bridge: 4 }, 'share 0.50': { a0: 0.5 } };
const caseOf = id => (BUILT[id] ? variant(id, BUILT[id]) : all.find(s => s.id === id));
const planOf = h => E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } }));
// what the page receives: the plan through JSON, and each arm's settings (the candidate's as solveCandidate passes them)
const viaJson = x => JSON.parse(JSON.stringify(x));
function arms(id) {
  const plan = planOf(caseOf(id));
  return {
    product: { plan: viaJson(plan), opts: { lambda: LAMBDA, points: PRODUCT_POINTS } },
    cand: { plan: viaJson(candidatePlan(E, plan)), opts: viaJson({ ...CANDIDATE_OPTS, lambda: LAMBDA, points: CAND_POINTS }) }
  };
}
const CHECK = { id: 'S126', points: 4 };
const code = () => codeOf(CODE_FILES.map(p => [p, readFileSync(join(ROOT, p))]));
async function timed({ plan, opts }) {
  const load = loadavg()[0].toFixed(2), t0 = performance.now();
  const r = solvePlan(E, M, plan, opts);
  const secs = (performance.now() - t0) / 1000, A = tablesOf(r);
  return { secs: +secs.toFixed(2), load, ...sizeOf(A), moves: r.actions.length, digest: await digestOf(A) };
}

const [mode, arg] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
if (mode === 'case' || mode === 'check') {
  checkE3pclsPin(CANDIDATE_OPTS);   // the candidate's e3pcls is exact only on the code its pin passed on
  const fp = await code();
  if (mode === 'case') {
    const id = PANEL[Number(arg)];
    if (!id) { console.error(`n7 build: no household ${arg}`); process.exit(2); }
    const a = arms(id), product = await timed(a.product), cand = await timed(a.cand);
    writeFileSync(join(OUT, `ref-${arg}.json`), JSON.stringify({ id, code: fp, candidate: CANDIDATE_HASH, product, cand }, null, 1));
    console.log(`n7 ${id}: product ${product.secs} s (load ${product.load}), candidate ${cand.secs} s (load ${cand.load}), code ${fp}`);
  } else {
    const c = arms(CHECK.id).product; c.opts = { ...c.opts, points: CHECK.points };
    const r = await timed(c);
    writeFileSync(join(OUT, 'ref-check.json'), JSON.stringify({ id: CHECK.id, code: fp, product: r }, null, 1));
    console.log(`n7 check ${CHECK.id} at ${CHECK.points} points: ${r.secs} s, code ${fp}`);
  }
} else if (mode === 'data') {
  const fp = await code(), refs = PANEL.map((id, i) => JSON.parse(readFileSync(join(OUT, `ref-${i}.json`), 'utf8')));
  const chk = JSON.parse(readFileSync(join(OUT, 'ref-check.json'), 'utf8'));
  for (const r of [...refs, chk]) if (r.code !== fp) { console.error(`n7 build: ${r.id}'s ref was made on code ${r.code}, the tree is ${fp}: rebuild it`); process.exit(1); }
  for (const r of refs) if (r.candidate !== CANDIDATE_HASH) { console.error(`n7 build: ${r.id}'s ref is of candidate ${r.candidate}, not ${CANDIDATE_HASH}`); process.exit(1); }
  // gate 5's quiet-machine times (results-gate5.txt), the reference every device time reads against
  const g5 = readFileSync(join(HERE, '../results-gate5.txt'), 'utf8');
  const g5code = (/code (\w+)/.exec(g5) || [])[1], speedup = +(/the split's speed-up x([\d.]+)/.exec(g5) || [])[1];
  const gate5 = id => { const m = new RegExp(`^  ${id.replace('.', '\\.')}\\s+\\S+\\s+([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)`, 'm').exec(g5); if (!m) throw new Error(`n7 build: results-gate5.txt has no row for ${id}`); return { product: +m[1], cand: +m[2], split: +m[3] }; };
  const check = arms(CHECK.id).product; check.opts = { ...check.opts, points: CHECK.points };
  const data = {
    built: new Date().toISOString(), code: { fingerprint: fp, files: CODE_FILES }, candidate: CANDIDATE_HASH,
    gate5: { code: g5code, speedup, parts: 4 },
    cases: PANEL.map((id, i) => { const a = arms(id); return { id, product: { ...a.product, ref: refs[i].product }, cand: { ...a.cand, ref: refs[i].cand }, gate5: gate5(id) }; }),
    check: { id: CHECK.id, points: CHECK.points, ...check, ref: chk.product }
  };
  writeFileSync(join(HERE, 'data.json'), JSON.stringify(data));
  console.log(`n7 data.json: ${PANEL.length} households, code ${fp}, candidate ${CANDIDATE_HASH}, gate 5's code ${g5code} (speed-up x${speedup})`);
} else { console.error('usage: node research/solver/n7/build.mjs case <0-3> | check | data'); process.exit(2); }
