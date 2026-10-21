/*
 * NE-EDGE'S CODE CHANGE, SHOWN INERT BY DEFAULT (checklist item 5): the RS arm (`readerSplit: 'rs'`, grid.js's read scales
 * each corner's residual by min(1, the query's chance / the corner's); off in every product path). This solves S364 at 4
 * wealth points under the candidate's options and compares every table bit for bit:
 *   1. the code before the change (a directory holding that commit's src/solver) against the code after it, defaults: SAME;
 *   2. the code after, readerSplit 'rs': DIFFERENT (the contrast showing the comparison can fail and the arm takes).
 *   git archive <rev> src/solver | tar -x -C <dir>; node research/solver/inert-needge.mjs <dir> <rev> > research/solver/results-needge-inert.txt
 */
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from '../engine.mjs';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { CANDIDATE_OPTS, candidatePlan } from './candidate.mjs';
// e3pcls guard: it compares two copies of the solver run with the same options, bit for bit; e3pcls is on in both, so its exactness is not what it measures

const [oldDir, rev] = process.argv.slice(2);
if (!oldDir || !rev) { console.error('usage: inert-needge.mjs <dir holding the old src/solver> <its rev>'); process.exit(2); }
const NEW = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'solver'), OLD = resolve(oldDir, 'src', 'solver');
const load = async d => ({ S: await import(join(d, 'solve.js')), M: await import(join(d, 'model.js')) });
const oldC = await load(OLD), newC = await load(NEW);
if (oldC.S === newC.S) { console.error('inert-needge: the old and new code are the same module'); process.exit(2); }

const h = buildScenarios().find(s => s.id === 'S364');
const plan = candidatePlan(E, E.resolveMpaa(E.normalizePlan({ ...h.plan, config: { ...h.plan.config, guardrails: false, lookaheadYears: 0 }, spending: { ...h.plan.spending, floorSpend: Math.round(0.8 * E.num(h.plan.spending.targetSpend, 0)) } })));
const OPTS = { ...CANDIDATE_OPTS, lambda: 0.0223606797749979, points: 4, bequestWeight: 0.02 };
// every typed array under the solve's world tables, in a fixed order, hashed together
function digest(cand) {
  const hs = createHash('sha256'); let n = 0;
  const walk = (x, depth) => {
    if (!x || depth > 5 || typeof x !== 'object') return;
    if (ArrayBuffer.isView(x)) { hs.update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)); n++; return; }
    for (const k of Object.keys(x).sort()) walk(x[k], depth + 1);
  };
  walk(cand.mix.tables, 0);
  return { sha: hs.digest('hex').slice(0, 16), arrays: n };
}
const run = (C, extra) => { const t0 = Date.now(); const cand = C.S.solvePlan(E, C.M, plan, { ...OPTS, ...extra }); const d = digest(cand); return { ...d, copied: cand.meta.reader ? cand.meta.reader.copied : null, nodes: cand.meta.reader ? cand.meta.reader.nodes : null, unsupported: cand.meta.reader ? cand.meta.reader.unsupported : null, line: cand.meta.readerSupportLine, secs: Math.round((Date.now() - t0) / 1000) }; };
const show = (nm, r) => console.log(`${nm}: tables ${r.sha} (${r.arrays} arrays) reader nodes ${r.nodes} copied ${r.copied} supported ${r.nodes - r.copied} unsupported ${r.unsupported} line ${r.line} secs ${r.secs}`);
console.log(`NE-EDGE's code change against ${rev} (S364, 4 wealth points, the candidate's options)`);
const a = run(oldC, {}), b = run(newC, {}), d = run(newC, { readerSplit: 'rs' });
show('old code, defaults', a); show('new code, defaults', b); show("new code, readerSplit 'rs'", d);
const ok = [
  ['1. old and new code alike at defaults', a.arrays > 0 && a.sha === b.sha && a.copied === b.copied && a.nodes === b.nodes],
  ["2. readerSplit 'rs' differs", d.sha !== b.sha],
];
for (const [nm, v] of ok) console.log(`${v ? 'PASS' : 'FAIL'} ${nm}`);
if (ok.some(([, v]) => !v)) process.exit(1);
