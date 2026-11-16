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
 *   E. the means' share against the pots' (MEANS less FLAT) by kind of unit.
 *   node research/solver/share-rules-beside.mjs <the run's folder> > research/solver/results-share-rules-beside.txt
 */
import { join } from 'node:path';
import { loadDir } from './reduce-share-rules.mjs';
import { readSharePanel } from './share-rules-panel.mjs';

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
  rows.push({ id: u.id, kind: kindOf(u.id), T, F, M });
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
