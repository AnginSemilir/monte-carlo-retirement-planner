/*
 * THE SAVINGS SPLIT'S COPIES OUTSIDE THE WORKING YEARS, ON ANCHORS (EXPLORATORY, written after the savings factorial's read,
 * deciding nothing; the reviewer at that read, finding 1, reviews/2026-11-19-read-save.md). No path is run.
 *
 * B7-FACTORIALS.md item 2 says that on anchors the copies' skip is not exact, so a split arm also differs a little outside its
 * own years. That was measured on the windfall's copies (S026; the D73 reviewer's MINOR 4). On anchors a copy can reach a year
 * without a choice in one way: the move the cell stored the year after (solve.js coarseMask, source 'T'), which a year without
 * a choice refuses when it is a copy. So the skip should be exact where no year without a choice comes before a year with one.
 *
 * For each household of the savings factorial's panel, CANDD and CANDS are solved as audit-save.mjs solves them (the plan arm
 * A's pick routes, the candidate's own menu, 45 points, the estate weight 0.02), one solve held at a time, and compared:
 *   - the years with a choice (audit-save.mjs choiceYears), the first retired year, and whether a year without a choice comes
 *     before a year with one;
 *   - each year's layer tables (every world, layer and table), digested year by year: the years whose tables differ, and the
 *     entries of the years without a choice;
 *   - the bridge reader's tables, digested year by year, and its adaptive reference (its arrays and its moves), whole.
 * Where every year without a choice has the same tables and reader in both arms, each arm's chooser scores the same moves (the
 * menu before the copies, solve.js movesAt) on the same tables there: in those years the two arms run one policy, and part only
 * through the state each brings to them.
 * The control: the same comparison for the windfall split (`windfallSplit: true`, its years the deposit years) on a household
 * of the windfall factorial, where a year without a choice comes before the deposit year, so a difference outside it is
 * expected (the D73 reviewer's 31 entries on S026, at the light settings).
 *   node research/solver/save-skip-probe.mjs <id>             one household's block (the savings split)
 *   node research/solver/save-skip-probe.mjs --control <id>   one household's block (the windfall split)
 *   node research/solver/save-skip-probe.mjs --ids            the savings panel's households (audit-save.mjs saveIds)
 *   node research/solver/save-skip-probe.mjs --summary <dir>  the blocks in <dir>/<id>.txt in the panel's order, the control's
 *                                                             in <dir>/control.txt, and the count
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { solveCandidate } from './candidate.mjs';
import { readPanel, appPlan } from './phase4-panel.mjs';
import { armA } from './select-phase4.mjs';
import { solverPlanOf, LAMBDA, CAND_PTS } from './audit-phase4.mjs';
import { saveIds, choiceYears, W } from './audit-save.mjs';
import { codeId } from './code-id.mjs';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEYS = ['surv', 'lsurv', 'resil', 'lresil', 'beq', 'short', 'pol'];
const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
/* every typed array, number, string and flag under x, in a fixed order (keys sorted; functions, Maps and timings left out) */
function feed(h, x, seen = new Set()) {
  if (x === null || x === undefined) { h.update('~'); return; }
  if (ArrayBuffer.isView(x)) { h.update(`v${x.constructor.name}${x.length}:`); h.update(Buffer.from(x.buffer, x.byteOffset, x.byteLength)); return; }
  if (typeof x === 'number') { const b = Buffer.alloc(8); b.writeDoubleLE(x); h.update(b); return; }
  if (typeof x === 'string' || typeof x === 'boolean') { h.update(`${typeof x}:${x};`); return; }
  if (typeof x !== 'object' || seen.has(x)) return;
  seen.add(x);
  if (Array.isArray(x)) { h.update(`[${x.length}`); for (const y of x) feed(h, y, seen); h.update(']'); return; }
  if (x instanceof Map) return;
  for (const k of Object.keys(x).sort()) { if (k === 'secs' || k === 'ms' || typeof x[k] === 'function') continue; h.update(`${k}=`); feed(h, x[k], seen); }
}
const digestOf = (...xs) => { const h = createHash('sha256'); for (const x of xs) feed(h, x); return h.digest('hex').slice(0, 16); };
function tablesByYear(r) {
  const L = r.tablesW.layW, Y = r.m.ctx.totalYears + 1, out = [];
  for (let t = 0; t < Y; t++) { const h = createHash('sha256'); let n = 0; for (let k = 0; k < L.length; k++) for (let j = 0; j < L[k].length; j++) for (const key of KEYS) { const u = L[k][j][key][t]; if (u) { h.update(Buffer.from(u.buffer, u.byteOffset, u.byteLength)); n += u.length; } } out.push([h.digest('hex').slice(0, 16), n]); }
  return out;
}
function readerByYear(r) {   // the reader's tables, year by year (each entry's year, layer and arrays)
  const rd = r.g.reader, by = {};
  if (!rd) return { years: [], by };
  for (const e of [...rd.of.values()].sort((a, b) => a.t - b.t || a.k - b.k)) (by[e.t] ||= []).push(e);
  return { years: Object.keys(by).map(Number), by: Object.fromEntries(Object.entries(by).map(([t, es]) => [t, digestOf(es.map(e => ({ t: e.t, k: e.k, c: e.c, R: e.R, p: e.p, chance: e.chance })))])) };
}
const PTS = Number(process.env.SKIP_PTS) || CAND_PTS;   // SKIP_PTS: a smoke only
function solveOne(plan, extra) {
  const t0 = Date.now(), r = solveCandidate(E, M, structuredClone(plan), { lambda: LAMBDA, points: PTS, bequestWeight: W, ...extra });
  const ad = r.g.reader && r.g.reader.adaptive, ctx = r.m.ctx, self = ctx.owners.find(o => o.key === 'self');
  return { pts: r.g.np, actions: r.actions.length, menu: r.meta.coarse && !r.meta.coarse.off ? 'anchors' : 'whole', split: r.meta.saveSplit || r.meta.windfallSplit || 'off', retireT: self.retireAge - ctx.ageSelf0, Y: ctx.totalYears + 1,
    tables: tablesByYear(r), reader: readerByYear(r), adaptive: ad ? digestOf(ad.ref.arrays(), ad.ref.moveList, ad.lattice) : null, secs: (Date.now() - t0) / 1000 };
}
const span = ts => { if (!ts.length) return 'none'; const out = []; let a = ts[0], b = ts[0]; for (const t of ts.slice(1)) { if (t === b + 1) b = t; else { out.push(a === b ? `${a}` : `${a}-${b}`); a = b = t; } } out.push(a === b ? `${a}` : `${a}-${b}`); return out.join(','); };

export function probe(id, option = 'saveSplit') {
  const h = readPanel().find(x => x.id === id);
  if (!h) throw new Error(`save-skip-probe: no household ${id} in the panel`);
  const a = armA(appPlan(h.plan), { tournament: false }), plan = prep(solverPlanOf(h.plan, { decumulationPolicy: a.planState.spending.decumulationPolicy }));
  const ctx0 = E.buildContext(plan), T = ctx0.totalYears;
  const live = option === 'saveSplit' ? choiceYears(ctx0) : [...(ctx0.autoSplit || new Map()).keys()].map(y => y - ctx0.baseYear).filter(t => t >= 0 && t <= T).sort((x, y) => x - y);
  const D = solveOne(plan, {});
  if (global.gc) global.gc();
  const S = solveOne(plan, { [option]: true });
  const L = new Set(live), outside = D.tables.map((x, t) => t).filter(t => !L.has(t)), before = [];
  for (let t = 0; t + 1 < D.Y; t++) if (!L.has(t) && L.has(t + 1)) before.push(t);
  const differ = D.tables.map((x, t) => (x[0] !== S.tables[t][0] ? t : -1)).filter(t => t >= 0), outDiffer = differ.filter(t => !L.has(t));
  const nOut = outside.reduce((x, t) => x + D.tables[t][1], 0);
  const rYears = [...new Set([...D.reader.years, ...S.reader.years])].sort((x, y) => x - y), rDiffer = rYears.filter(t => D.reader.by[t] !== S.reader.by[t]), rOut = rDiffer.filter(t => !L.has(t));
  const same = !outDiffer.length && !rOut.length && D.adaptive === S.adaptive;
  const what = option === 'saveSplit' ? 'working years with a choice' : 'deposit years';
  return [`${id}${option === 'saveSplit' ? '' : ' (the control: the windfall split)'}: retired from year ${D.retireT}; ${what} ${span(live)}; a year without a choice before one with a choice: ${before.length ? `yes (${span(before)})` : 'none'}`,
    `  CANDD ${D.actions} moves, the split's arm ${S.actions} (${option} ${S.split}); menu ${D.menu} / ${S.menu}; ${D.pts} points; the solves ${D.secs.toFixed(1)} s and ${S.secs.toFixed(1)} s`,
    `  the layer tables differ in years ${span(differ)}; outside the ${what}, years ${span(outside)} (${nOut} entries): ${outDiffer.length ? `DIFFER in ${span(outDiffer)}` : 'the same to the bit'}`,
    `  the reader's tables in years ${span(rYears)}: ${rDiffer.length ? `differ in ${span(rDiffer)}` : 'the same in every year'}; the adaptive reference ${D.adaptive === null ? 'none' : D.adaptive === S.adaptive ? 'the same' : 'DIFFERS'}`,
    `  ${same ? 'THE SAME OUTSIDE THE YEARS WITH A CHOICE' : 'NOT THE SAME OUTSIDE THE YEARS WITH A CHOICE'}`].join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv[2];
  if (arg === '--ids') { console.log(saveIds(readPanel()).join('\n')); process.exit(0); }
  if (arg === '--control') { console.log(probe(process.argv[3], 'windfallSplit')); process.exit(0); }
  if (arg === '--summary') {
    const dir = process.argv[3], ids = saveIds(readPanel()), blocks = ids.map(id => (existsSync(join(dir, `${id}.txt`)) ? readFileSync(join(dir, `${id}.txt`), 'utf8').trim() : `${id}: NO BLOCK`));
    const cid = codeId(), isSame = b => /\n {2}THE SAME OUTSIDE THE YEARS WITH A CHOICE$/.test(b), none = blocks.filter(b => /a year without a choice before one with a choice: none/.test(b));
    const control = existsSync(join(dir, 'control.txt')) ? readFileSync(join(dir, 'control.txt'), 'utf8').trim() : 'the control: NO BLOCK';
    console.log(`THE SAVINGS SPLIT'S COPIES OUTSIDE THE WORKING YEARS, ON ANCHORS (EXPLORATORY, after the savings factorial's read, deciding nothing; no path run): ${ids.length} households of the savings factorial's panel, each solved as audit-save.mjs solves it, CANDD and CANDS; code ${cid ? cid.hash : 'unknown'}`);
    for (const b of blocks) console.log(b);
    console.log(`THE CONTROL (a difference outside the years with a choice is expected where a year without one comes first):\n${control}`);
    console.log(`SUMMARY: no year without a choice before one with a choice on ${none.length} of ${ids.length} households; outside the years with a choice the layer tables, the reader's tables and the adaptive reference the same to the bit in both arms on ${blocks.filter(isSame).length} of ${ids.length}${blocks.filter(isSame).length < ids.length ? ` (not: ${ids.filter((id, i) => !isSame(blocks[i])).join(', ')})` : ''}; the control ${isSame(control) ? 'THE SAME (it does not show the difference expected)' : /NOT THE SAME/.test(control) ? 'NOT THE SAME, as expected' : 'not read'}`);
    process.exit(0);
  }
  if (!arg) { console.error('save-skip-probe: <id> | --control <id> | --ids | --summary <dir>'); process.exit(2); }
  console.log(probe(arg));
}
