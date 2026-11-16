/*
 * BESIDE THE SHARE RULES' READ (registrations/share-rules.md, read once by reduce-share-rules.mjs: NEITHER, today's split stays;
 * results-share-rules.txt). EXPLORATORY, written after the read, deciding nothing. The registration's "reported, deciding nothing"
 * items the read pools or leaves out, from the run's own arrays (seed 7023, 16,000 paths a unit):
 *   A. each unit's three shares and their figures in each arm (survival, spending delivered, the mean pot left, lifetime tax),
 *      FLAT's figures TODAY's where its share is TODAY's (the 90 units, where FLAT did not run);
 *   B. by kind of unit, each rule against TODAY: the share's move and the survival change, unit by unit and as a mean;
 *   C. the direction: where a rule's share differs from TODAY's, whether it moves the elder's part up or down (every panel
 *      couple's first person is the elder, three years older) against the sign of the survival change; the counts, and the
 *      units that go against the majority;
 *   D. the spending part's fall under FLAT, unit by unit (each in percent of TODAY's mean spending delivered, as the read's
 *      part 3 weighs them, equally);
 *   E. the means' share against the pots' (MEANS less FLAT) by kind of unit;
 * and, for the reviewer at the read (reviews/2026-11-16-read-share-rules.md, its four MINORs):
 *   C (cont.). each comparison beyond noise or not (a two-sided exact McNemar test at 5% on its lost and saved paths,
 *      unadjusted); the direction counted once a unit and direction where FLAT and MEANS move the same way from the same
 *      TODAY run; the direction on the paths that run short alone, and the paths below the minimum pot;
 *   F. what the lost and saved paths are: a failing path runs short in some year (the engine's rule: a year's unmet spending
 *      over FAIL_TOLERANCE, £1) or else ends the plan below the household's minimum pot; every comparison, its paths of each
 *      kind in both arms, and the totals; checked: each path read as the minimum pot's fails in the last year below the floor;
 *   G. S061-dbpart, whose losses are the largest: its failing paths by the year they fail, the partner's age then, and the
 *      pot those paths end the plan with, in each arm;
 *   H. each run's solve and its engine's time a path, the arms having run in a fixed order (audit-share-rules.mjs unitsOf:
 *      every TODAY, then every MEANS, then FLAT) beside the day's other work.
 *   node research/solver/share-rules-beside.mjs <the run's folder> > research/solver/results-share-rules-beside.txt
 */
import * as E from '../engine.mjs';
import { loadDir } from './reduce-share-rules.mjs';
import { readSharePanel } from './share-rules-panel.mjs';
import { binomUpperHalf } from './stats.mjs';

const dir = process.argv[2];
if (!dir) { console.error('usage: share-rules-beside.mjs <the run folder (results/share-rules-run in the launch worktree)>'); process.exit(2); }
const U = loadDir(dir), units = readSharePanel();
const mean = a => a.reduce((t, x) => t + x, 0) / a.length;
// as the read computes it (reduce-share-rules.mjs: 100 times the count, over the paths), so a figure at a rounding edge prints alike
const surv = m => 100 * m.survived.reduce((t, x) => t + x, 0) / m.survived.length;
const fig = r => ({ share: r.share, s: surv(r.main), del: mean(Array.from(r.main.delivered)), pot: mean(Array.from(r.main.wealth)), tax: mean(Array.from(r.main.tax)), n: r.main.survived.length });
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d), gbp = x => `£${Math.round(x).toLocaleString('en-GB')}`;
const kindOf = id => id.split('-').slice(1).join('-');
const KINDS = ['45', '55', '90', 'db', 'dbpart', 'sppart'];
const HOLD = { 45: '45/55', 55: '55/45', 90: '90/10', db: '60/40', dbpart: '60/40', sppart: '60/40' };
const WHAT = { 45: 'the elder holds 45%', 55: 'the elder holds 55%', 90: 'the elder holds 90%', db: "the elder's DB pension", dbpart: "the partner's DB pension", sppart: "the partner's state pension at 60%" };

// each unit's figures in each arm (FLAT standing as TODAY where it did not run: the same share on the same plan)
const rows = [];
for (const u of units) {
  const R = U[u.id] || {};
  if (!R.TODAY || !R.MEANS) { console.error(`${u.id}: an arm missing`); process.exit(1); }
  const T = fig(R.TODAY), M = fig(R.MEANS), F = R.FLAT ? fig(R.FLAT) : { ...T, standing: true };
  if (T.n !== M.n || T.n !== F.n) { console.error(`${u.id}: the arms' paths differ`); process.exit(1); }
  rows.push({ id: u.id, kind: kindOf(u.id), T, F, M, R, u });
}
console.log(`BESIDE THE SHARE RULES' READ (EXPLORATORY, written after the read, deciding nothing): ${rows.length} units of ${dir.split('/').slice(-1)[0]}, ${rows[0].T.n} paths each`);

console.log('\nA. Each unit: the three shares (the first person\'s part of the household\'s spending; the first person the elder), survival, and spending delivered, the mean pot left and lifetime tax a path, in TODAY / FLAT / MEANS (FLAT\'s TODAY\'s where its share is TODAY\'s: "=")');
for (const r of rows) {
  const a = (k, g) => `${g(r.T[k])} / ${r.F.standing ? '=' : g(r.F[k])} / ${g(r.M[k])}`;
  console.log(`  ${r.id.padEnd(12)} ${HOLD[r.kind].padEnd(6)} shares ${a('share', x => x.toFixed(3))}; survival ${a('s', x => x.toFixed(2) + '%')}; spending ${a('del', gbp)}; pot ${a('pot', gbp)}; tax ${a('tax', gbp)}`);
}

console.log('\nB. By kind of unit, each rule against TODAY where its share differs: the share\'s move and the survival change (points), unit by unit, then the units\' mean');
for (const k of KINDS) {
  const ks = rows.filter(r => r.kind === k);
  for (const [X, key] of [['FLAT', 'F'], ['MEANS', 'M']]) {
    const d = ks.filter(r => Math.abs(r[key].share - r.T.share) > 1e-12);
    if (!d.length) { console.log(`  ${k.padEnd(7)} ${X.padEnd(5)} (${WHAT[k]}): its share is TODAY's on every unit`); continue; }
    const parts = d.map(r => `${r.id.split('-')[0]} ${f(r[key].share - r.T.share, 3)} ${f(r[key].s - r.T.s, 2)}`);
    console.log(`  ${k.padEnd(7)} ${X.padEnd(5)} (${WHAT[k]}): ${parts.join('; ')} | mean share ${f(mean(d.map(r => r[key].share - r.T.share)), 3)}, survival ${f(mean(d.map(r => r[key].s - r.T.s)), 3)}`);
  }
}

console.log('\nC. The direction: each rule against TODAY where its share differs, the elder\'s part moved up or down, against the sign of the survival change');
const cmp = [];
for (const r of rows) for (const [X, key] of [['FLAT', 'F'], ['MEANS', 'M']]) {
  const ds = r[key].share - r.T.share; if (Math.abs(ds) <= 1e-12) continue;
  cmp.push({ id: r.id, X, ds, dv: r[key].s - r.T.s });
}
const cell = (up, gain) => cmp.filter(c => (c.ds > 0) === up && (gain ? c.dv > 0 : c.dv < 0));
const tie = cmp.filter(c => c.dv === 0);
console.log(`  ${cmp.length} comparisons (FLAT ${cmp.filter(c => c.X === 'FLAT').length}, MEANS ${cmp.filter(c => c.X === 'MEANS').length}):`);
console.log(`    the elder's part up:   survival up ${cell(true, true).length}, down ${cell(true, false).length}`);
console.log(`    the elder's part down: survival up ${cell(false, true).length}, down ${cell(false, false).length}`);
console.log(`    no change in survival: ${tie.length}`);
const against = [...cell(true, false), ...cell(false, true)];
console.log(`  against the majority (the part up and survival down, or down and up): ${against.length ? against.map(c => `${c.id} ${c.X} share ${f(c.ds, 3)} survival ${f(c.dv, 2)}`).join('; ') : 'none'}`);

console.log('\nD. FLAT\'s spending delivered against TODAY\'s, unit by unit where its share differs (percent of TODAY\'s mean spending delivered; the read\'s part 3 weighs the units equally), lowest first');
const sp = rows.filter(r => !r.F.standing).map(r => ({ id: r.id, ds: r.F.share - r.T.share, pct: 100 * (r.F.del - r.T.del) / r.T.del })).sort((x, y) => x.pct - y.pct);
console.log(`  ${sp.map(x => `${x.id} ${f(x.pct, 4)}% (share ${f(x.ds, 3)})`).join('; ')}`);
console.log(`  the mean over these ${sp.length}: ${f(mean(sp.map(x => x.pct)), 4)}%; where the elder's part goes up ${f(mean(sp.filter(x => x.ds > 0).map(x => x.pct)), 4)}% (${sp.filter(x => x.ds > 0).length}), down ${f(mean(sp.filter(x => x.ds < 0).map(x => x.pct)), 4)}% (${sp.filter(x => x.ds < 0).length})`);

console.log('\nE. The means\' share against the pots\' (MEANS less FLAT, FLAT\'s share the pots\' own), by kind of unit');
for (const k of KINDS) {
  const ks = rows.filter(r => r.kind === k);
  console.log(`  ${k.padEnd(7)} (${WHAT[k]}): ${ks.map(r => `${r.id.split('-')[0]} ${f(r.M.share - r.F.share, 3)}`).join('; ')}`);
}

// ------------------------------------------------------------------------------------------------ the reviewer's MINORs
// each comparison's paired counts and the failing paths' kinds (F); a failing path with a year's unmet spending over the
// engine's tolerance ran short, any other ended the plan below the household's minimum pot (runPath: failYear the last year)
const floorOf = r => { const m = /hhMinPot (\S+)/.exec(r.ran || ''); if (!m) throw new Error(`${r.id} ${r.arm}: no minimum pot recorded`); return Number(m[1]); };
const kindsOf = r => { const m = r.main, n = m.survived.length, short = new Uint8Array(n), pot = new Uint8Array(n); for (let i = 0; i < n; i++) if (!m.survived[i]) { if (m.unmet[i] > E.FAIL_TOLERANCE) short[i] = 1; else pot[i] = 1; } return { short, pot }; };
const sum = a => a.reduce((t, x) => t + x, 0);
const p2 = (b, c) => { const n = b + c; return n ? Math.min(1, 2 * Math.min(binomUpperHalf(b, n), binomUpperHalf(n - b, n))) : 1; };
let odd = 0, potPaths = 0;
const C2 = [];
for (const r of rows) {
  const T = r.R.TODAY, ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(r.u.plan))), last = ctx.totalYears;
  const kT = kindsOf(T);
  for (const rec of [T, r.R.FLAT, r.R.MEANS].filter(Boolean)) {   // the check: every path read as the minimum pot's fails in the last year below the floor
    const k = kindsOf(rec), fl = floorOf(rec);
    for (let i = 0; i < k.pot.length; i++) if (k.pot[i]) { potPaths++; if (rec.main.failYear[i] !== last || !(rec.main.wealth[i] < fl)) odd++; }
  }
  for (const [X, key] of [['FLAT', 'F'], ['MEANS', 'M']]) {
    const XR = r.R[X]; if (!XR) continue;
    const ds = r[key].share - r.T.share; if (Math.abs(ds) <= 1e-12) continue;
    const kX = kindsOf(XR), a = T.main.survived, x = XR.main.survived;
    let b = 0, c = 0, bS = 0, bP = 0, cS = 0, cP = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] && !x[i]) { b++; if (kX.short[i]) bS++; else bP++; }
      else if (!a[i] && x[i]) { c++; if (kT.short[i]) cS++; else cP++; }
    }
    C2.push({ id: r.id, kind: r.kind, X, ds, dv: r[key].s - r.T.s, b, c, bS, bP, cS, cP, p: p2(b, c), shortT: sum(kT.short), shortX: sum(kX.short), potT: sum(kT.pot), potX: sum(kX.pot) });
  }
}

console.log('\nC (cont.). The same 56 comparisons: beyond noise (a two-sided exact McNemar test at 5% on the lost and saved paths, unadjusted), counted once a unit and direction, and on the paths that run short alone');
const beyond = C2.filter(c => c.p < 0.05);
const by = (list, up, gain) => list.filter(c => (c.ds > 0) === up && (gain ? c.dv > 0 : c.dv < 0)).length;
console.log(`  beyond noise ${beyond.length} of ${C2.length}: the elder's part up, survival up ${by(beyond, true, true)} and down ${by(beyond, true, false)}; down, survival down ${by(beyond, false, false)} and up ${by(beyond, false, true)}`);
const groups = {};
for (const c of C2) (groups[`${c.id} ${c.ds > 0 ? 'up' : 'down'}`] = groups[`${c.id} ${c.ds > 0 ? 'up' : 'down'}`] || []).push(c);
let once = 0, withP = 0, againstP = 0, split = 0, pairs = 0;
for (const g of Object.values(groups)) {
  const signs = new Set(g.map(c => Math.sign(c.dv)));
  if (g.length > 1) pairs++;
  if (signs.size > 1) { split++; for (const c of g) { once++; ((c.ds > 0) === (c.dv > 0) ? withP++ : againstP++); } continue; }
  once++; const c = g[0]; ((c.ds > 0) === (c.dv > 0) ? withP++ : againstP++);
}
console.log(`  once a unit and direction: ${pairs} units where FLAT and MEANS move the share the same way from the same TODAY run (their signs ${split ? `parting on ${split}` : 'agreeing on every one'}); ${once} entries, ${withP} with the direction (the elder's part up and survival up, or down and down) and ${againstP} against`);
const exc = C2.filter(c => ['S061', 'S109'].includes(c.id.split('-')[0]) && ['45', '55'].includes(c.kind) && (c.ds > 0) !== (c.dv > 0));
console.log(`  the exceptions on S061 and S109 at 45/55 and 55/45: ${exc.map(c => `${c.id} ${c.X} ${f(c.dv, 2)} (${c.b} lost, ${c.c} saved, p ${c.p.toExponential(1)}${c.p < 0.05 ? ', beyond noise' : ''})`).join('; ')}`);
const fewer = (up) => C2.filter(c => (c.ds > 0) === up && c.shortX < c.shortT).length, more = (up) => C2.filter(c => (c.ds > 0) === up && c.shortX > c.shortT).length;
console.log(`  the paths that run short alone: the elder's part up, fewer run short on ${fewer(true)} and more on ${more(true)} of ${C2.filter(c => c.ds > 0).length}; down, fewer on ${fewer(false)} and more on ${more(false)} of ${C2.filter(c => c.ds < 0).length}`);
console.log(`  the paths below the minimum pot: more on ${C2.filter(c => c.potX > c.potT).length} of the ${C2.length} comparisons, fewer on ${C2.filter(c => c.potX < c.potT).length}`);

console.log('\nF. What the lost and saved paths are: each comparison, its lost paths (running short / below the minimum pot) and saved paths (the same), and in TODAY and the rule the paths that run short and those that end below the minimum pot');
for (const c of C2) console.log(`  ${c.X.padEnd(5)} ${c.id.padEnd(12)} lost ${c.b} (${c.bS} / ${c.bP}), saved ${c.c} (${c.cS} / ${c.cP}); running short ${c.shortT} to ${c.shortX}, below the minimum pot ${c.potT} to ${c.potX}`);
console.log(`  over the ${C2.length} comparisons: lost ${sum(C2.map(c => c.b))}, of them below the minimum pot ${sum(C2.map(c => c.bP))}; saved ${sum(C2.map(c => c.c))}, of them below the minimum pot in TODAY ${sum(C2.map(c => c.cP))}`);
const m90 = C2.filter(c => c.X === 'MEANS' && c.kind === '90');
console.log(`  90/10 under MEANS: fewer paths run short on ${m90.filter(c => c.shortX < c.shortT).length} of ${m90.length} couples and more on ${m90.filter(c => c.shortX > c.shortT).length}; more end below the minimum pot on ${m90.filter(c => c.potX > c.potT).length} and fewer on ${m90.filter(c => c.potX < c.potT).length}`);
console.log(`  checked: of the ${potPaths} failing paths read as the minimum pot's in the 88 runs, ${odd} fail other than in the plan's last year below the household's floor`);
// the minimum pot each unit's plan sets (each run's record), against the unit's landed target
const floors = {};
for (const r of rows) { const fs = [...new Set([r.R.TODAY, r.R.FLAT, r.R.MEANS].filter(Boolean).map(floorOf))]; if (fs.length !== 1) throw new Error(`${r.id}: the arms' minimum pots differ`); (floors[r.id.split('-')[0]] = floors[r.id.split('-')[0]] || []).push({ fl: fs[0], target: r.R.TODAY.target }); }
console.log(`  the household's minimum pot by couple (its four units): ${Object.entries(floors).map(([b, l]) => l.every(x => x.fl === x.target) ? `${b} the unit's target (${gbp(Math.min(...l.map(x => x.fl)))} to ${gbp(Math.max(...l.map(x => x.fl)))})` : `${b} ${[...new Set(l.map(x => gbp(x.fl)))].join(', ')}`).join('; ')}`);

console.log("\nG. S061-dbpart: its failing paths by the year they fail (the run's year from 0), the partner's age then, and the pot they end the plan with (the median), in each arm");
{ const r = rows.find(x => x.id === 'S061-dbpart'), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(r.u.plan)));
  const inc = (r.u.plan.otherIncomes || []).filter(i => i.owner === 'Partner').map(i => `£${Number(i.amount).toLocaleString('en-GB')} a year from age ${i.startAge} (year ${Number(i.startAge) - ctx.agePart0})`).join(', ');
  console.log(`  the elder ${ctx.ageSelf0} and the partner ${ctx.agePart0} at the start; the partner's DB pension ${inc || 'none'}; the state pension age ${E.num(r.u.plan.demographics.statePensionAge, 68)}`);
  for (const arm of ['TODAY', 'FLAT', 'MEANS']) {
    const rec = r.R[arm], m = rec.main, k = kindsOf(rec), years = {}, pots = [];
    for (let i = 0; i < m.survived.length; i++) if (!m.survived[i]) { years[m.failYear[i]] = (years[m.failYear[i]] || 0) + 1; pots.push(m.wealth[i]); }
    pots.sort((x, y) => x - y);
    const med = pots.length ? (pots.length % 2 ? pots[(pots.length - 1) / 2] : (pots[pots.length / 2 - 1] + pots[pots.length / 2]) / 2) : 0;
    console.log(`  ${arm.padEnd(5)} share ${rec.share.toFixed(3)}: ${pots.length} failing (${sum(k.short)} running short, ${sum(k.pot)} below the minimum pot); by year ${Object.entries(years).sort((x, y) => x[0] - y[0]).map(([t, n]) => `${t} (the partner ${ctx.agePart0 + Number(t)}) ${n}`).join(', ')}; the median pot at the plan's end ${gbp(med)}`);
  } }

console.log('\nH. Each run\'s solve (s) and its engine\'s time a path (ms), unit by unit: TODAY / FLAT / MEANS (the arms ran every TODAY, then every MEANS, then FLAT; "-" where FLAT did not run)');
for (const r of rows) {
  const t = rec => (rec ? `${Math.round(rec.solveSecs)} s, ${(1000 * rec.engineSecs / rec.N).toFixed(0)} ms` : '-');
  console.log(`  ${r.id.padEnd(12)} ${t(r.R.TODAY)} / ${t(r.R.FLAT)} / ${t(r.R.MEANS)}`);
}
