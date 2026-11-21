/*
 * TEST K, BESIDE THE READ (written after the read, deciding nothing; the reviewer at the read's findings 1 to 3,
 * reviews/2026-11-21-read-save-k.md). From test K's units (results/save-k-7025) and the registered units they read (the
 * units' own tree, results/save-v2-run), over the 30 employees:
 *   A. the working years from April 2029, when the cap on salary sacrifice's NIC relief starts, and each plan's own pension
 *      saving in its first working year (every plan's above the £2,000 the cap relieves: the reviewer's finding 1);
 *   B. K by working years (the fifteen-year employees and the five-year), each group's share of the registered gain;
 *   C. the registered read's two guards at K's price (reduce-save-v2.mjs compare: D34's harm rule in whole paths, part 3's
 *      spending by household, Holm over the 30, and pooled), CANDSA-T against CANDDA, beside the registered CANDSA's;
 *   D. S336F, the one household below nought at K's price: its change by path, and its share of working-year decisions
 *      taking the ISA first under CANDSA and CANDSA-T (runPolicy's first paths).
 *   node research/solver/save-k-beside.mjs [dir] > research/solver/results-save-k-beside.txt
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { byPath } from './reduce-phase4.mjs';
import { KEYS } from './audit-save-v2.mjs';
import { compare } from './reduce-save-v2.mjs';
import { loadK, ratio, pathSeries } from './reduce-save-k.mjs';
import { EMPLOYEES, readRegistered, dec } from './save-k.mjs';
import { readSaveV2Panel } from './save-v2-panel.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), N = 4000, FROM = 2029, CAP = 2000;
const dir = process.argv[2] || join(HERE, 'results', 'save-k-7025');
const units = loadK(dir), byId = Object.fromEntries(units.map(u => [u.id, u])), tree = units[0].stamp.tree;
const reg = Object.fromEntries(EMPLOYEES.map(id => [id, readRegistered(tree, id, KEYS)]));
const f3 = x => (x >= 0 ? '+' : '') + x.toFixed(3), f4 = x => (x >= 0 ? '+' : '') + x.toFixed(4), iv = (r, f = f3) => `${f(r.d)} (${f(r.lo)} to ${f(r.hi)})`;
const mean = a => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i]; return s / a.length; };
const T = id => byId[id].arms['CANDSA-T'], S = id => reg[id].arms.CANDSA, D = id => reg[id].arms.CANDDA;
console.log(`TEST K, BESIDE THE READ (written after the read, deciding nothing): the 30 employees, ${N} paths of seed 7025; the units' tree ${tree}`);

// A. the working years from 2029, and each plan's own pension saving in its first working year
{
  const panel = Object.fromEntries(readSaveV2Panel().map(u => [u.id, u]));
  let years = 0, from = 0, lo = Infinity, hi = 0;
  for (const id of EMPLOYEES) {
    const a = T(id); years += a.workT.length; from += a.workT.filter(t => a.baseYear + t >= FROM).length;
    const pen = panel[id].plan.accounts.find(x => x.id === 'pen_self'), c = pen ? Number(pen.contrib) : NaN;
    if (Number.isFinite(c)) { lo = Math.min(lo, c); hi = Math.max(hi, c); }
  }
  console.log(`\nA. The working years with a saving to place from ${FROM}: ${from} of ${years} (${(100 * from / years).toFixed(1)}%); each plan's own pension saving in its first working year from £${Math.round(lo)} to £${Math.round(hi)}, every one above the £${CAP} a year the cap relieves of NIC`);
}

// B. K by working years, and each group's share of the registered gain
{
  const groups = [['fifteen working years', EMPLOYEES.filter(id => T(id).workT.length === 15)], ['five working years', EMPLOYEES.filter(id => T(id).workT.length === 5)]];
  const gainOf = id => { let s = 0; for (let i = 0; i < N; i++) s += 100 * (S(id).survived[i] - D(id).survived[i]); return s / N; };
  const total = EMPLOYEES.reduce((t, id) => t + gainOf(id), 0);
  console.log('\nB. K by working years (post hoc, a lead and not a result), its 95% interval by the delta method, and each group\'s share of the registered gain over the 30:');
  for (const [name, ids] of groups) {
    const k = ratio(pathSeries(ids.map(id => [T(id), D(id)]), N), pathSeries(ids.map(id => [S(id), D(id)]), N)), share = ids.reduce((t, id) => t + gainOf(id), 0) / total;
    console.log(`  ${name} (${ids.length}, ${ids.filter(id => T(id).workT.some(t => T(id).baseYear + t >= FROM)).length} of them working from ${FROM}): K ${k.K.toFixed(3)} (${k.lo.toFixed(3)} to ${k.hi.toFixed(3)}); ${(100 * share).toFixed(1)}% of the registered gain`);
  }
}

// C. the registered read's two guards at K's price, beside the registered CANDSA's
{
  const mk = arm => EMPLOYEES.map(id => ({ id, cohort: reg[id].cohort, status: reg[id].status, N: reg[id].N, arms: { CANDDA: D(id), CANDSA: arm(id) } }));
  console.log('\nC. The registered read\'s guards (reduce-save-v2.mjs compare: D34\'s harm rule in whole paths; part 3\'s spending by household, Holm over the 30, its bar 0.1%; the pooled change) on the 30 employees\' first 4,000 paths, against CANDDA:');
  for (const [name, arm] of [['CANDSA-T, at income tax relief alone', T], ['CANDSA, the registered price', S]]) {
    const C = compare(mk(arm), 'CANDDA', 'CANDSA'), flags = C.rows.filter(r => r.flag), beyond = C.spend.rows.filter(r => r.holmLoss < 0.05);
    console.log(`  ${name}: flagged by D34 ${flags.length ? flags.map(r => `${r.id} (${r.lost - r.saved} net against ${r.j})`).join('; ') : 'none'}; spending lower beyond noise ${beyond.length ? beyond.map(r => `${r.id} ${f4(r.pct)}% (Holm ${r.holmLoss.toExponential(2)})${r.fails ? ', PAST THE BAR' : ', inside the bar'}`).join('; ') : 'none'}; pooled spending ${iv(C.spend.pooled, f4)}%`);
  }
  const C = compare(mk(T), 'CANDDA', 'CANDSA'), s336 = C.rows.find(r => r.id === 'S336F');
  console.log(`  S336F at K's price: ${s336.lost} lost and ${s336.saved} saved, ${s336.lost - s336.saved} net against its threshold of ${s336.j}`);
}

// D. S336F: its change by path, and its share of working-year decisions taking the ISA first
{
  const id = 'S336F', ch = byPath([i => 100 * (T(id).survived[i] - D(id).survived[i])], N);
  const isaShare = a => { const b = a.beside, sv = dec(b.save, Uint8Array); let k = 0; for (const v of sv) if (v === 2) k++; return 100 * k / sv.length; };
  console.log(`\nD. S336F at K's price: ${iv(ch)} points by path; the ISA first on ${isaShare(S(id)).toFixed(1)}% of its working-year decisions under CANDSA and ${isaShare(T(id)).toFixed(1)}% under CANDSA-T (runPolicy's first paths)`);
}
