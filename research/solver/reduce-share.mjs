/*
 * COUPLES WHO HOLD THEIR MONEY UNEVENLY, STAGE A'S READ (the review of 9 Nov, item 6; D66; SHARE-A.md; EXPLORATORY, deciding
 * nothing). audit-share.mjs's units: in each, the couples' rollout under each share rule against the plan's own rules, paired
 * on the unit's paths. The stamps first (fair-gate.mjs requireFairLogs), then the gate: every unit in, one code, one audit
 * (this test's files as they are), each unit on its own seed and count of paths, its arms on the same plan and the same
 * paths, the two share rules' tables the same but for `share`, each share the rule's. Then the reproduction of the review's
 * run (unit 0) beside the review's figures, every unit's d (the rollout's survival less the rules', in points, with
 * stats.mjs survivalChangeU's paired 95% interval), the six couples' mean d at each holding, and SHARE-A.md's rule, its
 * three parts and the outcome they give.
 *   node research/solver/reduce-share.mjs [dir]        node research/solver/reduce-share.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// the design (audit-share.mjs holds the same; the reducer keeps its own copy so its rule reads without the engine)
export const COUPLES = ['S007', 'S079', 'S127', 'S187', 'S391', 'S267'];
export const HOLDINGS = ['as-held', 'sixtyfive', 'seventyfive', 'ninety-ten', 'all-one'];
export const UNEVEN = ['sixtyfive', 'seventyfive', 'ninety-ten', 'all-one'];
export const REVIEW = { rules: 85.3, rollout: 53.0, saved: 0, lost: 97, N: 300 };   // results/out-share-S091.txt, 45 points
export const RULE = { fault: -5, faultCount: 4, within: 3 };
const dec = (b64, T) => { const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
export const survOf = arm => dec(arm.survived, Uint8Array);

/* the paired change of arm B against arm A, in points: cells and survivalChangeU's interval */
export function pairOf(A, B) {
  let a = 0, b = 0, c = 0, d = 0;
  for (let k = 0; k < A.length; k++) { if (A[k] && B[k]) a++; else if (A[k]) b++; else if (B[k]) c++; else d++; }
  const u = survivalChangeU(a, b, c, d);
  // d from the counts (exact: survivalChangeU's d subtracts two rates and carries their rounding into the rule's edges)
  return { N: A.length, sA: 100 * (a + b) / A.length, sB: 100 * (a + c) / A.length, saved: c, lost: b, d: 100 * (c - b) / A.length, lo: u.lo, hi: u.hi };
}
/* the pot share's value from the unit's recorded holdings (audit-share.mjs shareOf: every wrapper, held to 0.05 to 0.95) */
export const potShare = H => { const s = Object.values(H).reduce((t, x) => t + x.self, 0), p = Object.values(H).reduce((t, x) => t + x.part, 0); return Math.min(0.95, Math.max(0.05, s / (s + p))); };

/* the gate: what makes the comparison fair; [] when it is. `want`: the units the design asks for, as audit-share.mjs UNITS */
export function gate(units, want, filesAudit) {
  const P = [], key = u => `${u.id} ${u.holding} ${u.seed}`;
  const got = new Map(units.map(u => [key(u), u]));
  const missing = want.filter(w => !got.has(key(w))).map(key), extra = units.filter(u => !want.some(w => key(w) === key(u))).map(key);
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  if (extra.length) P.push(`units not in the design: ${extra.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); return vs[0]; };
  one('code', u => u.stamp && u.stamp.code); const audit = one('audit', u => u.stamp && u.stamp.audit); one('count of points', u => u.pts);
  if (filesAudit !== undefined && audit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  for (const u of units) {
    const w = want.find(x => key(x) === key(u));
    if (!w) continue;
    if (u.N !== w.N) P.push(`${key(u)}: ${u.N} paths, not ${w.N}`);
    const need = ['RULES', ...w.shares.map(s => (s === 'half' ? 'HALF' : 'POTS'))], have = Object.keys(u.arms || {});
    if (need.some(a => !have.includes(a)) || have.length !== need.length) { P.push(`${key(u)}: arms ${have.join(', ') || 'none'}, not ${need.join(', ')}`); continue; }
    for (const a of need) {
      if (u.arms[a].inputs !== u.inputs) P.push(`${key(u)}: ${a} ran other inputs`);
      if (survOf(u.arms[a]).length !== u.N) P.push(`${key(u)}: ${a} holds ${survOf(u.arms[a]).length} paths, not ${u.N}`);
    }
    if (u.arms.HALF && u.arms.HALF.share !== 0.5) P.push(`${key(u)}: HALF solved on ${u.arms.HALF.share}, not 0.5`);
    if (u.arms.POTS && Math.abs(u.arms.POTS.share - potShare(u.holdings)) > 1e-12) P.push(`${key(u)}: POTS solved on ${u.arms.POTS.share}, not the pots' ${potShare(u.holdings)}`);
    if (u.arms.HALF && u.arms.POTS) {
      // the spending levels to three decimals: the floor's level is each person's floor over their target, each rounded to a
      // pound on their share of the spending, so it moves in the fifth decimal with the share, the tested variable
      const strip = r => r.replace(/^share \S+ \| /, '').replace(/levels (\S+)/g, (m, v) => `levels ${v.split(',').map(x => (+x).toFixed(3)).join(',')}`);
      if (strip(u.arms.HALF.ran) !== strip(u.arms.POTS.ran)) P.push(`${key(u)}: the share rules' tables differ besides share`);
    }
  }
  return P;
}

/* SHARE-A.md's rule over the 30 units of the design (unit 0 apart): each part and the outcome */
export function rule(units) {
  const at = (id, h) => units.find(u => u.id === id && u.holding === h && u.seed !== 4242);
  const D = {};
  for (const id of COUPLES) for (const h of HOLDINGS) {
    const u = at(id, h), R = survOf(u.arms.RULES);
    D[`${id} ${h}`] = { half: pairOf(R, survOf(u.arms.HALF)), pots: pairOf(R, survOf(u.arms.POTS)), share: u.arms.POTS.share };
  }
  const mean = (h, which) => COUPLES.reduce((t, id) => t + D[`${id} ${h}`][which].d, 0) / COUPLES.length;
  const base = mean('as-held', 'half');
  const below = COUPLES.filter(id => D[`${id} ninety-ten`].half.d < RULE.fault);
  const part1 = below.length >= RULE.faultCount;
  const wholly = UNEVEN.flatMap(h => COUPLES.filter(id => D[`${id} ${h}`].pots.hi < 0).map(id => `${id} ${h}`));
  const EPS = 1e-9;   // a mean of six exact d's, to the rule's edge without its rounding
  const far = UNEVEN.filter(h => Math.abs(mean(h, 'pots') - base) > RULE.within + EPS);
  const part2 = wholly.length === 0 && far.length === 0;
  const part3 = Math.abs(mean('sixtyfive', 'pots') - base) <= RULE.within + EPS;
  const outcome = !part1 ? 'PART 1 FAILS: the fault did not hold at 45 points on these couples; reported, and item 6 stops'
    : part2 && part3 ? 'ALL THREE HOLD: stage B now (shareRule pots, a research option, off), stage C after the re-run\'s read'
    : `PART 1 HOLDS, ${[!part2 && 'PART 2', !part3 && 'PART 3'].filter(Boolean).join(' AND ')} FAILS: the guard alone (D66, M4); a better remedy is a new design for the maintainer`;
  return { D, base, means: Object.fromEntries(HOLDINGS.map(h => [h, { half: mean(h, 'half'), pots: mean(h, 'pots') }])), below, part1, wholly, far, part2, part3, outcome };
}
const f = (x, p = 1) => (x >= 0 ? '+' : '') + x.toFixed(p);
const iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)}; ${c.saved} saved, ${c.lost} lost)`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) {
    // planted units: the gate's refusals, and each part of the rule read each way
    let bad = 0;
    const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
    const enc = a => Buffer.from(Uint8Array.from(a)).toString('base64');
    const n = 200, H = sh => ({ pen: { self: 100 * sh, part: 100 * (1 - sh), total: 100 } }), stamp = { code: 'c', audit: 'a' };
    // rules survive 85%; the rollout's survival set by its own count of paths alive, paired on the first paths
    const arm = (alive, share, inputs = 'i') => ({ share, inputs, ran: `share ${share} | self: s | part: p`, survived: enc(Array.from({ length: n }, (_, k) => (k < alive ? 1 : 0))) });
    const unit = (id, holding, halfAlive, potsAlive, sh = 0.6, extra = {}) => ({ id, holding, seed: 7002, N: n, pts: 45, inputs: 'i', holdings: H(sh), stamp,
      arms: { RULES: { inputs: 'i', ran: 'rules', survived: enc(Array.from({ length: n }, (_, k) => (k < 170 ? 1 : 0))) }, HALF: arm(halfAlive, 0.5), POTS: arm(potsAlive, potShare(H(sh))) }, ...extra });
    const shOf = h => ({ 'as-held': 0.6, sixtyfive: 0.65, seventyfive: 0.75, 'ninety-ten': 0.9, 'all-one': 1 })[h];
    const design = COUPLES.flatMap(id => HOLDINGS.map(h => ({ id, holding: h, seed: 7002, N: n, shares: ['half', 'pots'] })));
    const build = (fn) => COUPLES.flatMap(id => HOLDINGS.map(h => unit(id, h, ...fn(id, h), shOf(h))));
    // the review's picture: +8 points as held; 90/10 under 0.5 -30 points; the pot share near +8 everywhere
    const good = build((id, h) => [h === 'ninety-ten' ? 110 : h === 'all-one' ? 120 : 186, 186]);
    check('the planted design passes the gate', gate(good, design, 'a').length === 0);
    check('a unit missing is refused', gate(good.slice(1), design, 'a').some(p => /units missing/.test(p)));
    check('two codes are refused', gate([...good.slice(1), { ...good[0], stamp: { code: 'd', audit: 'a' } }], design, 'a').some(p => /more than one code/.test(p)));
    check('the files\' audit differing is refused', gate(good, design, 'b').some(p => /not the files'/.test(p)));
    check('a POTS arm on a share not its pots\' is refused', gate([{ ...good[0], arms: { ...good[0].arms, POTS: { ...good[0].arms.POTS, share: 0.5 } } }, ...good.slice(1)], design, 'a').some(p => /not the pots'/.test(p)));
    check('share arms whose tables differ besides share are refused', gate([{ ...good[0], arms: { ...good[0].arms, POTS: { ...good[0].arms.POTS, ran: `share ${good[0].arms.POTS.share} | self: other | part: p` } } }, ...good.slice(1)], design, 'a').some(p => /besides share/.test(p)));
    const lv = (u, a, v) => ({ ...u, arms: { ...u.arms, [a]: { ...u.arms[a], ran: `share ${u.arms[a].share} | self: levels 1,0.9,${v} | part: p` } } });
    check('share arms whose floor levels differ past the third decimal pass (each person\'s floor rounded on their share)', gate([lv(lv(good[0], 'HALF', '0.800022'), 'POTS', '0.799985'), ...good.slice(1)], design, 'a').length === 0);
    check('share arms whose levels differ at the third decimal are refused', gate([lv(lv(good[0], 'HALF', '0.800'), 'POTS', '0.810'), ...good.slice(1)], design, 'a').some(p => /besides share/.test(p)));
    check('an arm on other inputs is refused', gate([{ ...good[0], arms: { ...good[0].arms, HALF: { ...good[0].arms.HALF, inputs: 'j' } } }, ...good.slice(1)], design, 'a').some(p => /other inputs/.test(p)));
    check('an arm short of its paths is refused (an empty arm at the edge)', gate([{ ...good[0], arms: { ...good[0].arms, HALF: { ...good[0].arms.HALF, survived: enc([]) } } }, ...good.slice(1)], design, 'a').some(p => /holds 0 paths/.test(p)));
    const r = rule(good);
    check(`the review's picture: all three parts hold (${r.outcome})`, r.part1 && r.part2 && r.part3);
    // part 1 at its edge: three couples below -5 is not four
    const three = build((id, h) => [h === 'ninety-ten' && COUPLES.indexOf(id) < 3 ? 110 : 186, 186]);
    check('part 1 at its edge: three couples below -5 fails part 1', !rule(three).part1 && /PART 1 FAILS/.test(rule(three).outcome));
    // part 1 at its value: d exactly -5 is not below -5 (170 -> 160 alive of 200 is -5.0)
    const at5 = build((id, h) => [h === 'ninety-ten' ? 160 : 186, 186]);
    check('part 1 at its value: d of exactly -5 on every couple is not below -5', !rule(at5).part1);
    // part 2's first test: one couple's interval wholly below 0 under the pot share at one uneven holding
    const oneBad = build((id, h) => [h === 'ninety-ten' ? 110 : 186, id === 'S079' && h === 'all-one' ? 120 : 186]);
    check('part 2: one couple wholly below 0 under the pot share fails part 2 and names it', !rule(oneBad).part2 && rule(oneBad).wholly.includes('S079 all-one') && /PART 2 FAILS/.test(rule(oneBad).outcome));
    // part 2's second test: the mean at one holding 4 points off as held (its intervals not wholly below 0)
    const offMean = build((id, h) => [h === 'ninety-ten' ? 110 : 186, h === 'seventyfive' ? 178 : 186]);
    check('part 2: a holding\'s mean 4 points from as held fails part 2', !rule(offMean).part2 && rule(offMean).far.includes('seventyfive'));
    // within 3 is two-sided as written: a mean 4 points above as held fails too
    const overMean = build((id, h) => [h === 'ninety-ten' ? 110 : 186, h === 'seventyfive' ? 194 : 186]);
    check('part 2: a holding\'s mean 4 points above as held fails it too (within 3, either way)', !rule(overMean).part2);
    // exactly 3 points off is within 3
    const at3 = build((id, h) => [h === 'ninety-ten' ? 110 : 186, h === 'seventyfive' ? 180 : 186]);
    check('part 2 at its value: a mean exactly 3 points off is within 3', rule(at3).part2);
    // part 3: 65/35 alone 4 points off fails parts 2 and 3
    const edge = build((id, h) => [h === 'ninety-ten' ? 110 : 186, h === 'sixtyfive' ? 178 : 186]);
    check('part 3: 65/35 alone 4 points off fails part 3 (and part 2 with it)', !rule(edge).part3 && !rule(edge).part2 && /PART 2 AND PART 3 FAILS/.test(rule(edge).outcome));
    console.log('EDGES: d of exactly -5 at 90/10 (not below), three couples below -5 (not four), a mean exactly 3 points off (within), an empty arm');
    console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
    process.exit(bad ? 1 : 0);
  }
  const DIR = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : join(HERE, 'results', 'share-7002');
  // the stamps first (CHECKLIST 3; fair-gate.mjs requireFairLogs): every log stamped, one code and one audit across them
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  const { UNITS, stampFilesHash } = await import('./audit-share.mjs');
  const units = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const P = gate(units, UNITS, stampFilesHash());
  if (P.length) { console.log(`SHARE-A GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const u0 = units.find(u => u.seed === 4242), r0 = pairOf(survOf(u0.arms.RULES), survOf(u0.arms.HALF));
  console.log(`SHARE-A (EXPLORATORY, D66; SHARE-A.md): ${units.length} units, code ${u0.stamp.code}, audit ${u0.stamp.audit}, ${u0.pts} points; the gate: fair`);
  const same = Math.abs(r0.sA - REVIEW.rules) < 0.05 && Math.abs(r0.sB - REVIEW.rollout) < 0.05 && r0.saved === REVIEW.saved && r0.lost === REVIEW.lost;
  console.log(`The review's run reproduced (unit 0: S091 at 90/10, share 0.5, ${r0.N} paths of seed 4242): the rules ${r0.sA.toFixed(1)}%, the rollout ${r0.sB.toFixed(1)}% (${r0.saved} saved, ${r0.lost} lost); the review printed ${REVIEW.rules}% and ${REVIEW.rollout}% (${REVIEW.saved} saved, ${REVIEW.lost} lost): ${same ? 'THE SAME' : 'DIFFERENT'}`);
  const R = rule(units);
  console.log(`\nEach couple and holding: d, the rollout's survival less the rules', in points (paired 95% interval; saved, lost of 500), under 0.5 and under the pot share (its value)`);
  for (const id of COUPLES) for (const h of HOLDINGS) {
    const x = R.D[`${id} ${h}`], u = units.find(v => v.id === id && v.holding === h);
    console.log(`  ${id} ${h.padEnd(11)} rules ${x.half.sA.toFixed(1)}% (target ${u.target}) | 0.5: ${x.half.sB.toFixed(1)}%, d ${iv(x.half)} | pots ${x.share.toFixed(3)}: ${x.pots.sB.toFixed(1)}%, d ${iv(x.pots)}`);
  }
  console.log(`\nThe six couples' mean d at each holding (0.5 / the pot share): ${HOLDINGS.map(h => `${h} ${f(R.means[h].half, 2)} / ${f(R.means[h].pots, 2)}`).join('; ')}`);
  console.log(`\nSHARE-A.md's rule:`);
  console.log(`  1. the fault is real (at 90/10 under 0.5, d below ${RULE.fault} on at least ${RULE.faultCount} of 6): ${R.below.length} of 6 (${R.below.join(', ') || 'none'}): ${R.part1 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  2. the remedy works (under the pot share, at every uneven holding: no couple's interval wholly below 0; each holding's mean within ${RULE.within} of as held under 0.5, ${f(R.base, 2)}): wholly below 0 ${R.wholly.join(', ') || 'none'}; means more than ${RULE.within} off ${R.far.map(h => `${h} (${f(R.means[h].pots - R.base, 2)})`).join(', ') || 'none'}: ${R.part2 ? 'HOLDS' : 'FAILS'}`);
  console.log(`  3. the band's edge is safe (at 65/35 the mean under the pot share within ${RULE.within} of as held under 0.5): ${f(R.means.sixtyfive.pots - R.base, 2)}: ${R.part3 ? 'HOLDS' : 'FAILS'}`);
  console.log(`OUTCOME: ${R.outcome}`);
  const secs = units.flatMap(u => Object.values(u.arms).map(a => (a.solveSecs || 0) + a.secs));
  console.log(`The run: ${(secs.reduce((a, b) => a + b, 0) / 3600).toFixed(1)} core-hours over the units' arms; the hosts: ${[...new Set(units.map(u => u.cpu))].join('; ')}`);
}
