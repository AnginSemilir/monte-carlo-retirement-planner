/*
 * The third sweep's timings, read (the external review's speed work, 25 Oct; EXPLORATORY: this machine, two jobs sharing
 * two cores, not gate 5's quiet four-core machine). From timeq-sweep.sh's files (and timeq-e6.sh's for the packed reads):
 *   1. the packed reads (E6) against E5, one process a core, side by side;
 *   2. the five smaller cuts (E7 to E11) together against E5, on each household, and each cut's share on S370 (all five,
 *      then each left out);
 *   3. the product on this code (the realAt cache in every path), with and without E10;
 *   4. gate 5 read from these: the candidate with all five against the product with the cache and E10 (a port on every
 *      path), one core, then over four cores at E2X's 4.3 to 3.7, and at the four-way split the two-way check implies;
 *   5. the split's check (split-time.mjs, alone on the machine): one core against two parts, the serial share that
 *      implies (Amdahl: s = 2 / speed-up - 1) and the four-way speed-up it implies (1 / (s + (1 - s) / 4)).
 *   3 also reads the product's pairs (pairq.sh: with and without E10 started together on the two cores), E10's effect on it.
 *   node sweep-read.mjs <time7 dir> [time6 dir] [split dir] [pair dir]
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
const [t7, t6, tsplit, tpair] = process.argv.slice(2);
const load = (dir) => {
  const out = [];
  if (!dir || !existsSync(dir)) return out;
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue;
    const last = readFileSync(join(dir, f), 'utf8').trim().split('\n').pop();
    if (!last || last[0] !== '{') { out.push({ file: f, failed: true }); continue; }
    out.push({ file: f, ...JSON.parse(last) });
  }
  return out;
};
const f1 = x => x.toFixed(1), f2 = x => x.toFixed(2), pc = x => `${(100 * x).toFixed(1)}%`;
const pairs = load(tpair), runs = load(t7).concat(pairs), six = load(t6);
const failed = runs.filter(r => r.failed).map(r => r.file);
if (failed.length) console.log(`NOT IN (failed or still going): ${failed.join(', ')}`);
const pick = (rs, who, arm) => rs.filter(r => !r.failed && r.who === who && r.arm === arm);
const one = (rs, who, arm) => { const x = pick(rs, who, arm); return x.length ? x[x.length - 1] : null; };
// a repeated solve's mean (the product is timed twice on S370), its hashes all checked the same
const meanOf = (rs, who, arm) => { const x = pick(rs, who, arm); if (!x.length) return null; return { ...x[0], secs: x.reduce((t, y) => t + y.secs, 0) / x.length, n: x.length, all: x.map(y => y.secs), sameHash: x.every(y => y.hash === x[0].hash) }; };
// 1. the packed reads
if (six.length) {
  console.log('1. THE PACKED READS (E6) AGAINST E5, 45 points, one process a core, side by side: household | E5 (s) | E6 (s) | E6 against E5 | the tables');
  for (const who of [...new Set(six.map(r => r.who))].sort()) {
    const a = one(six, who, 'HRT3-E5'), b = one(six, who, 'HRT3-E6');
    if (a && b) console.log(`  ${who} | ${f1(a.secs)} | ${f1(b.secs)} | ${b.secs > a.secs ? '+' : ''}${pc(b.secs / a.secs - 1)} | ${a.hash === b.hash ? `the same (hash ${a.hash})` : `DIFFERENT (${a.hash} against ${b.hash})`}`);
  }
}
// 2. the five together, then each one's share on S370
console.log('2. THE FIVE SMALLER CUTS (E7 to E11) TOGETHER AGAINST E5, 45 points: household | E5 (s) | all five (s) | the solve cut by | the tables');
const whos = [...new Set(runs.filter(r => !r.failed && r.arm === 'HRT3-ALL').map(r => r.who))].sort();
for (const who of whos) {
  const a = one(runs, who, 'HRT3-E5'), alls = pick(runs, who, 'HRT3-ALL');
  if (!a || !alls.length) continue;
  const mean = alls.reduce((s, x) => s + x.secs, 0) / alls.length, same = alls.every(x => x.hash === a.hash);
  console.log(`  ${who} | ${f1(a.secs)} | ${alls.map(x => f1(x.secs)).join(' and ')} | ${pc(1 - mean / a.secs)}${alls.length > 1 ? ' (their mean)' : ''} | ${same ? `the same (hash ${a.hash})` : `DIFFERENT (${a.hash} against ${alls.map(x => x.hash).join(', ')})`}`);
}
{
  const who = 'S370', alls = pick(runs, who, 'HRT3-ALL'), a = one(runs, who, 'HRT3-E5');
  if (alls.length && a) {
    const all = alls.reduce((s, x) => s + x.secs, 0) / alls.length;
    console.log(`   each cut's share on ${who}, all five then that one left out (all five ${f1(all)} s${alls.length > 1 ? `, the mean of ${alls.length} solves` : ''}; E5 alone ${f1(a.secs)} s): cut | without it (s) | what it saves, of E5's solve | the tables`);
    for (const e of ['E7', 'E8', 'E9', 'E10', 'E11']) {
      const x = one(runs, who, `HRT3-ALL-${e}`);
      if (x) console.log(`  ${e} | ${f1(x.secs)} | ${pc((x.secs - all) / a.secs)} | ${x.hash === a.hash ? 'the same' : `DIFFERENT (${x.hash})`}`);
    }
  }
}
// 2b. the four in E5's path alone (all but E10, which reaches the product's path too): the port proposed
console.log("2b. THE FOUR IN E5'S PATH (E7, E8, E9 and E11: all but E10) AGAINST E5, 45 points: household | E5 (s) | the four (s) | the solve cut by | the tables");
const fwhos = [...new Set(runs.filter(r => !r.failed && r.arm === 'HRT3-ALL-E10').map(r => r.who))].sort();
for (const who of fwhos) {
  const a = one(runs, who, 'HRT3-E5'), x = meanOf(runs, who, 'HRT3-ALL-E10');
  if (a && x) console.log(`  ${who} | ${f1(a.secs)} | ${f1(x.secs)} | ${pc(1 - x.secs / a.secs)} | ${x.hash === a.hash && x.sameHash ? `the same (hash ${a.hash})` : `DIFFERENT (${a.hash} against ${x.hash})`}`);
}
// 3. the product on this code
console.log('3. THE PRODUCT ON THIS CODE (solvePlan, 30 points, the realAt cache in): household | as it stands (s) | with E10 (s) | the tables');
const pwhos = [...new Set(runs.filter(r => !r.failed && (r.arm === 'PRODUCT' || r.arm === 'PRODUCTGFN')).map(r => r.who))].sort();
for (const who of pwhos) {
  const a = meanOf(runs, who, 'PRODUCT'), b = meanOf(runs, who, 'PRODUCTGFN');
  const show = x => (x ? `${f1(x.secs)}${x.n > 1 ? ` (the mean of ${x.all.map(f1).join(' and ')})` : ''}` : 'not run');
  console.log(`  ${who} | ${show(a)} | ${show(b)} | ${a && b ? (a.hash === b.hash && a.sameHash && b.sameHash ? `the same (hash ${a.hash})` : `DIFFERENT (${a.hash} against ${b.hash})`) : '-'}`);
}
// 5 first (gate 5 reads its implied four-way speed-up): the split's check
const sp = load(tsplit), implied = {};
const spLines = [];
for (const who of [...new Set(sp.filter(r => !r.failed).map(r => r.who))].sort()) for (const arm of [...new Set(sp.filter(r => !r.failed && r.who === who).map(r => r.arm))].sort()) {
  const a = sp.filter(r => !r.failed && r.who === who && r.arm === arm && r.parts === 1).pop(), b = sp.filter(r => !r.failed && r.who === who && r.arm === arm && r.parts === 2).pop();
  if (!a || !b) continue;
  const S2 = a.secs / b.secs, sh = 2 / S2 - 1, S4 = 1 / (sh + (1 - sh) / 4);
  if (!implied[who] || arm === 'SPLIT-ALL') implied[who] = S4;
  spLines.push(`  ${who} | ${arm.slice(6)} | ${f1(a.secs)} | ${f1(b.secs)} | ${f2(S2)} | ${pc(sh)} | ${f2(S4)} | ${a.hash === b.hash ? `the same (hash ${a.hash})` : `DIFFERENT (${a.hash} against ${b.hash})`}`);
}
if (pairs.length) {
  console.log('   E10 on the product, the pairs alone (the two arms started together, one on each core): household | as it stands (s) | with E10 (s) | E10 cuts its solve by');
  for (const who of [...new Set(pairs.filter(r => !r.failed).map(r => r.who))].sort()) {
    const a = one(pairs, who, 'PRODUCT'), b = one(pairs, who, 'PRODUCTGFN');
    if (a && b) console.log(`  ${who} | ${f1(a.secs)} | ${f1(b.secs)} | ${pc(1 - b.secs / a.secs)}${a.hash === b.hash ? '' : ' (THE TABLES DIFFER)'}`);
  }
}
// 4. gate 5
const S = process.env.SPLIT ? Number(process.env.SPLIT) : null;
const four = r => (S ? f2(r / S) : `${f2(r / 4.3)} to ${f2(r / 3.7)}`);
console.log(`4. GATE 5 AFTER THE FIRST PORT ALONE (E5 and the cache), against the product as it stands on this code (each timing the mean of its solves): household | E5 (s) | the product (s) | one core | over four cores (${S ? `the split at ${S}` : 'E2 at 4.3 to 3.7'})${Object.keys(implied).length ? ' | at the four-way split the two-way check implies' : ''}`);
for (const who of [...new Set(runs.filter(r => !r.failed && r.arm === 'HRT3-E5' && r.points === 45).map(r => r.who))].sort()) {
  const x = meanOf(runs, who, 'HRT3-E5'), p0 = meanOf(runs, who, 'PRODUCT'), imp = implied[who] || implied.S370;
  if (!x || !p0) continue;
  const r = x.secs / p0.secs;
  console.log(`  ${who} | ${f1(x.secs)} | ${f1(p0.secs)} | ${f2(r)} | ${four(r)}${imp ? ` | ${f2(imp)}${implied[who] ? '' : ' (S370\'s)'}: ${f2(r / imp)}` : ''}`);
}
console.log(`4a. GATE 5 FOR THE PORT PROPOSED (the four, E10 left out), against the product as it stands on this code (each timing the mean of its solves): household | the four (s) | the product (s) | one core | over four cores (${S ? `the split at ${S}` : 'E2 at 4.3 to 3.7'})${Object.keys(implied).length ? ' | at the four-way split the two-way check implies' : ''}`);
for (const who of fwhos) {
  const x = meanOf(runs, who, 'HRT3-ALL-E10'), p0 = meanOf(runs, who, 'PRODUCT'), imp = implied[who] || implied.S370;
  if (!x || !p0) continue;
  const r = x.secs / p0.secs;
  console.log(`  ${who} | ${f1(x.secs)} | ${f1(p0.secs)} | ${f2(r)} | ${four(r)}${imp ? ` | ${f2(imp)}${implied[who] ? '' : ' (S370\'s)'}: ${f2(r / imp)}` : ''}`);
}
console.log(`4b. GATE 5 WITH ALL FIVE (each timing the mean of its solves): household | the candidate with all five (s) | the product with E10 / without (s) | one core, against each | over four cores (${S ? `the split at ${S}` : 'E2 at 4.3 to 3.7'}), against each${Object.keys(implied).length ? ' | at the four-way split the two-way check implies' : ''}`);
for (const who of whos) {
  const alls = pick(runs, who, 'HRT3-ALL'), pg = meanOf(runs, who, 'PRODUCTGFN'), p0 = meanOf(runs, who, 'PRODUCT');
  if (!alls.length || !(pg || p0)) continue;
  const c = alls.reduce((s, x) => s + x.secs, 0) / alls.length, imp = implied[who] || implied.S370;
  const ps = [pg, p0].filter(Boolean), rs = ps.map(p => c / p.secs);
  console.log(`  ${who} | ${f1(c)} | ${ps.map(p => f1(p.secs)).join(' / ')} | ${rs.map(f2).join(' / ')} | ${rs.map(four).join(' / ')}${imp ? ` | ${f2(imp)}${implied[who] ? '' : ' (S370\'s)'}: ${rs.map(r => f2(r / imp)).join(' / ')}` : ''}`);
}
console.log('gate 5: at most 1.25 on each household');
if (spLines.length) {
  console.log('5. THE SPLIT\'S CHECK (split-time.mjs, alone on the machine; e3pcls off in both arms, declared): household | arm | one core (s) | two parts (s) | the speed-up | the serial share it implies | the four-way speed-up it implies | the tables');
  for (const l of spLines) console.log(l);
  console.log('   E2X (6 Oct, a quiet four-core machine, the candidate then at 30 points): the four-way speed-up 3.69 to 4.29');
}
