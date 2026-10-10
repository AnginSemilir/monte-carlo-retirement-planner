/*
 * NE-SPLIT'S DERIVATION (predictions/diag-nesplit.md): what 7u's records say about S364's opening, the power of items 1
 * and 4 by simulation through reduce-nesplit.mjs's own items(), the credences from the deep review's cause credences
 * (deep-review-log.md 10 Oct 04:17 UK, read from the receipt, not typed) and the judged conditionals below, and the budget
 * from 7u's own logs. Reads 7u's files behind 7u's gate (requireFairLogs over results/diag7u, its registered prediction).
 *   node research/solver/derive-nesplit.mjs > research/solver/results-derive-nesplit.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { items } from './reduce-nesplit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), D7U = join(HERE, 'results', 'diag7u');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
// a seeded generator (mulberry32) and a Poisson draw, so the output is reproducible
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pois = lam => { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const DRAWS = 4000, N = 8000;

// THE JUDGED LINES (written before the derivation was run; the prediction's Credence section quotes them)
export const JUDGED = {
  // P(the table's survival part favours CAND's own opening over SS at both weights | cause)
  dTpos: { 'NE-SURV': 0.9, 'NE-TS': 0.4, 'NE-NS': 0.3, 'NE-OTHER': 0.5 },
  // P(that survival part covers the whole chooser gap at both weights | cause)
  covers: { 'NE-SURV': 0.7, 'NE-TS': 0.1, 'NE-NS': 0.1, 'NE-OTHER': 0.3 },
  // P(the swapped year-1 layer leaves no gap at both weights | cause), and P(it leaves at least half at both)
  swapGone: { 'NE-SURV': 0.15, 'NE-TS': 0.6, 'NE-NS': 0.15, 'NE-OTHER': 0.25 },
  swapHalf: { 'NE-SURV': 0.6, 'NE-TS': 0.2, 'NE-NS': 0.6, 'NE-OTHER': 0.4 },
  // the forced own-against-SS loss on the tuning seed: 7u's (SAME), half of it (HALF), none beyond churn (NULL)
  lossStories: { SAME: 0.45, HALF: 0.35, NULL: 0.2 },
  // where the simulated loss sits: the de-risk (DERISK), the spend (SPEND), both alike (BOTH)
  splitStories: { DERISK: 0.45, SPEND: 0.25, BOTH: 0.3 },
  // the control (bridge 4 at 0.02, CAND's year-0 table near its simulation in 7u): HELD, INCONCLUSIVE, FALSIFIED
  control: [0.8, 0.12, 0.08],
};

// 1. THE RECORDS: 7u's files through 7u's gate
const logs = Object.fromEntries(readdirSync(D7U).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(D7U, f), 'utf8')]));
requireFairLogs(logs, 'research/solver/predictions/confirm-7u.md');
console.log(`FAIR-TEST GATE: passed (requireFairLogs over ${Object.keys(logs).length} logs of results/diag7u, 7u's registered prediction)`);
const r7u = readFileSync(join(HERE, 'results-7u.txt'), 'utf8');
const trace = f => { const j = JSON.parse(gunzipSync(readFileSync(join(D7U, f))).toString()); return { j, ok: Buffer.from(j.survived, 'base64'), level: Buffer.from(j.level, 'base64'), tier: Buffer.from(j.tier, 'base64'), fy: new Int16Array(new Uint8Array(Buffer.from(j.failYear, 'base64')).buffer) }; };
console.log('\n1. THE RECORDS (7u, seed 7013, 8,000 paths; results-7u.txt and results/diag7u)');
const LEG = {};
for (const w of ['0.02', '0.01']) {
  const c = trace(`S364-cand-candidate@w${w}.json.gz`), s = trace(`S364-ship-product@w${w}.json.gz`), Y = c.j.Y;
  let saved = 0, lost = 0; for (let i = 0; i < N; i++) { if (c.ok[i] && !s.ok[i]) saved++; else if (!c.ok[i] && s.ok[i]) lost++; }
  LEG[w] = { saved, lost };
  const lv0 = c.level[0], t0 = c.tier[0], sl0 = s.level[0], st0 = s.tier[0];
  let rerisk = 0, alive1 = 0; for (let i = 0; i < N; i++) { if (c.fy[i] >= 0 && c.fy[i] <= 1) continue; alive1++; if (c.tier[i * Y + 1] !== c.tier[i * Y]) rerisk++; }
  // a run-out sets the trace's fail year (runPolicy); the plan's end below its minimum pot leaves it unset (-1)
  const split = t => { let end = 0, early = 0; for (let i = 0; i < N; i++) { if (t.ok[i]) continue; if (t.fy[i] < 0) end++; else early++; } return { end, early }; };
  const cs = split(c), ss = split(s);
  console.log(`  S364 W${w}: CAND against SHIP ${saved} saved/${lost} lost; CAND's year 0 level ${(lv0 / 100).toFixed(2)} tier code ${t0} (pension ${t0 >> 2}, ISA ${t0 & 3}); SHIP's level ${(sl0 / 100).toFixed(2)} tier code ${st0}; CAND moves tier in year 1 on ${rerisk} of ${alive1} paths alive; failures at the plan's end below its minimum pot / by running out: CAND ${cs.end}/${cs.early}, SHIP ${ss.end}/${ss.early}`);
}
const tab = (id, arm, w) => { const m = new RegExp(`^  ${id.replace(/ /g, ' ')}\\s+${arm}\\s+table (\\S+) sim (\\S+) error (\\S+)`, 'm'); const sec = w === '0.02' ? r7u.split('EVERY UNIT AT 0.01')[0] : r7u.split('EVERY UNIT AT 0.01')[1]; const x = m.exec(sec || ''); return x ? { table: +x[1], sim: +x[2], error: +x[3] } : null; };
for (const w of ['0.02', '0.01']) for (const id of ['S364', 'bridge 4']) for (const arm of ['CAND', 'SHIP']) { const t = tab(id, arm, w); console.log(`  ${id} ${arm} W${w}: year-0 table ${t ? t.table : '?'} sim ${t ? t.sim : '?'} error ${t ? t.error : '?'} (results-7u.txt)`); }

// 2. THE POWER, by simulation through reduce-nesplit.mjs's items()
const P = (sv, chooser) => ({ sv, bq: 0, rs: 0, h: 0, wB: 0.02, wR: 0, score: chooser, charge: 0, chooser });
const pair = (saved, lost) => ({ saved, lost, n: N, d: 100 * (saved - lost) / N });
const unit = ({ ownSS, SCSS, CSSS }) => ({ own: 'CC', openings: { SS: { tiers: '0,0' }, SC: { tiers: '2,2' }, CS: { tiers: '0,0' }, CC: { tiers: '2,2' } },
  parts: { SS: P(0.5, 0.02), SC: P(1, 0), CS: P(1, 0), CC: P(4.8, 0.06) }, swap: { SS: P(0.5, 0.02), SC: P(1, 0), CS: P(1, 0), CC: P(4.8, 0.06) },
  pairs: { ownSS, SCSS, CSSS, ownPartner: pair(0, 0), own: ownSS } });
const ctl = unit({ ownSS: pair(0, 0), SCSS: pair(0, 0), CSSS: pair(0, 0) });
const lossRate = { SAME: w => LEG[w].lost, HALF: w => LEG[w].lost / 2, NULL: () => 0 }, CHURN = 0.5;
console.log('\n2. THE POWER (the share of draws where the loss reads at both weights, Holm over the two; item 1\'s simulated half; the stories\' own-against-SS loss from 7u\'s S364 legs, a carry from CAND-against-SHIP to own-against-SS, grade D)');
const powerLoss = {}, dDraws = [];
for (const [s] of Object.entries(JUDGED.lossStories)) {
  let reads = 0;
  for (let k = 0; k < DRAWS; k++) {
    const u = ['0.02', '0.01'].map(w => { const lost = pois(lossRate[s](w) + CHURN), saved = pois(CHURN); return unit({ ownSS: pair(saved, lost), SCSS: pair(0, 0), CSSS: pair(0, 0) }); });
    const o = items({ 'S364 NE/W0.02': u[0], 'S364 NE/W0.01': u[1], 'bridge 4 NE/W0.02': ctl });
    if (o[1].legs.every(x => x.loss)) reads++;
    if (rnd() < JUDGED.lossStories[s] * 3) dDraws.push(o[1].legs[0].pair.d);
  }
  powerLoss[s] = reads / DRAWS;
  console.log(`  ${s.padEnd(5)}: loss reads at both ${f4(powerLoss[s])}`);
}
for (const [s, v] of [['SAME x2', 2], ['SAME x3', 3]]) {   // sensitivity: the churn at two larger values
  let reads = 0; for (let k = 0; k < DRAWS; k++) { const u = ['0.02', '0.01'].map(w => unit({ ownSS: pair(pois(CHURN * v * 4), pois(LEG[w].lost + CHURN * v * 4)), SCSS: pair(0, 0), CSSS: pair(0, 0) })); const o = items({ 'S364 NE/W0.02': u[0], 'S364 NE/W0.01': u[1], 'bridge 4 NE/W0.02': ctl }); if (o[1].legs.every(x => x.loss)) reads++; }
  console.log(`  sensitivity, SAME with the churn ${v * 4} times larger (${s}): loss reads at both ${f4(reads / DRAWS)}`);
}
const split = { DERISK: [0.9, 0.1], SPEND: [0.1, 0.9], BOTH: [0.5, 0.5] }, item4 = {}, d4 = [];
console.log('  item 4 (the de-risk against the spend, Holm over four; the loss of the SAME story split as the story says, each pair\'s churn added):');
for (const s of Object.keys(JUDGED.splitStories)) {
  const c = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 };
  for (let k = 0; k < DRAWS; k++) {
    const u = ['0.02', '0.01'].map(w => unit({ ownSS: pair(0, 31), SCSS: pair(pois(CHURN), pois(LEG[w].lost * split[s][0] + CHURN)), CSSS: pair(pois(CHURN), pois(LEG[w].lost * split[s][1] + CHURN)) }));
    const o = items({ 'S364 NE/W0.02': u[0], 'S364 NE/W0.01': u[1], 'bridge 4 NE/W0.02': ctl });
    c[o[4].outcome]++;
    if (rnd() < JUDGED.splitStories[s] * 3) d4.push(o[4].legs[0].D.d);
  }
  item4[s] = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / DRAWS]));
  console.log(`    ${s.padEnd(6)}: HELD ${f4(item4[s].HELD)} INCONCLUSIVE ${f4(item4[s].INCONCLUSIVE)} FALSIFIED ${f4(item4[s].FALSIFIED)}`);
}

// 3. THE CREDENCES
const dr = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8');
const rec = dr.split('\n').find(l => l.startsWith('- 10 Oct 04:17 UK'));
const cc = rec && /CAUSE CREDENCES: ([^|]*)/.exec(rec);
if (!cc) { console.error('derive-nesplit: no CAUSE CREDENCES in the receipt of 10 Oct 04:17 UK'); process.exit(2); }
const all = Object.fromEntries(cc[1].split(';').map(x => x.trim().split('=')).filter(x => /^NE-/.test(x[0])).map(([k, v]) => [k, +v]));
const z = Object.values(all).reduce((t, v) => t + v, 0), CAUSE = Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v / z]));
console.log(`\n3. THE CREDENCES (the receipt of 10 Oct 04:17 UK: ${Object.entries(all).map(([k, v]) => `${k}=${v}`).join('; ')}, normalised over the NE causes; the judged conditionals in this script's JUDGED)`);
const mix = f => Object.entries(CAUSE).reduce((t, [k, p]) => t + p * f(k), 0);
const pLoss = Object.entries(JUDGED.lossStories).reduce((t, [s, p]) => t + p * powerLoss[s], 0);
const dPos = mix(k => JUDGED.dTpos[k]);
const c1 = { HELD: dPos * pLoss, FALSIFIED: (1 - dPos) * 0.8 }; c1.INCONCLUSIVE = 1 - c1.HELD - c1.FALSIFIED;
const cov = mix(k => JUDGED.dTpos[k] * JUDGED.covers[k]);
const c2 = { HELD: cov, FALSIFIED: (1 - dPos) * 0.8 }; c2.INCONCLUSIVE = 1 - c2.HELD - c2.FALSIFIED;
const c3 = { HELD: mix(k => JUDGED.swapGone[k]), FALSIFIED: mix(k => JUDGED.swapHalf[k]) }; c3.INCONCLUSIVE = 1 - c3.HELD - c3.FALSIFIED;
const c4 = Object.fromEntries(['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(o => [o, Object.entries(JUDGED.splitStories).reduce((t, [s, p]) => t + p * item4[s][o], 0)]));
const c5 = { HELD: JUDGED.control[0], INCONCLUSIVE: JUDGED.control[1], FALSIFIED: JUDGED.control[2] };
console.log(`  item 1: P(dT above 0 at both) ${f4(dPos)}, P(the loss reads at both) ${f4(pLoss)}; FALSIFIED takes 0.8 of P(dT not above 0), the rest a split by weight`);
console.log(`  item 2: P(the survival part covers the gap at both) ${f4(cov)}`);
const pt = (arr, q) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.max(0, Math.floor(q * a.length)))]; };
const out = [[1, c1, pt(dDraws, 0.5)], [2, c2, NaN], [3, c3, NaN], [4, c4, pt(d4, 0.5)], [5, c5, NaN]];
for (const [i, c, p] of out) console.log(`CREDENCE item ${i}: point ${Number.isFinite(p) ? f4(p) : '-'} HELD ${f2(c.HELD)} INCONCLUSIVE ${f2(c.INCONCLUSIVE)} FALSIFIED ${f2(c.FALSIFIED)}`);
console.log(`  POINT item 1: ${f4(pt(dDraws, 0.5))} (80% interval ${f4(pt(dDraws, 0.1))} to ${f4(pt(dDraws, 0.9))}; own against SS at 0.02 over the loss stories)`);
console.log(`  POINT item 4: ${f4(pt(d4, 0.5))} (80% interval ${f4(pt(d4, 0.1))} to ${f4(pt(d4, 0.9))}; the de-risk against SS at 0.02 over the split stories)`);
// the decision table's rows (items 1 and 3 read as independent, judged)
const rowA = c1.HELD, rowB = c1.FALSIFIED * c3.HELD, rowC = c1.FALSIFIED * c3.FALSIFIED;
console.log(`  DECISION ROWS: item 1 HELD ${f2(rowA)}; item 1 FALSIFIED and 3 HELD ${f2(rowB)}; items 1 and 3 FALSIFIED ${f2(rowC)}; else ${f2(1 - rowA - rowB - rowC)}`);

// 4. THE BUDGET, from 7u's own logs (S364 and bridge 4: each arm's solve and its 8,000-path forward)
console.log('\n4. THE BUDGET (7u\'s logs: each unit\'s solve and its 8,000 paths forward, results/diag7u)');
const secs = {};
for (const t of Object.values(logs)) for (const m of t.matchAll(/^(S364|bridge 4)\s+case \| unit (CAND|SHIP)\/\w+\/W(0\.0[12])[\s\S]*?solve \2\/\w+\/W\3: table \S+ secs (\d+)[\s\S]*?run \2\/\w+\/W\3: .* secs (\d+)/gm)) secs[`${m[1]} ${m[2]} ${m[3]}`] = { solve: +m[4], fwd: +m[5] };
let tot = 0;
for (const [id, w] of [['S364', '0.02'], ['S364', '0.01'], ['bridge 4', '0.02']]) {
  const c = secs[`${id} CAND ${w}`], s = secs[`${id} SHIP ${w}`];
  if (!c || !s) { console.error(`derive-nesplit: no 7u timing for ${id} at ${w}`); process.exit(2); }
  const u = c.solve + s.solve + 5 * c.fwd + s.fwd + 3 * c.fwd;   // four forced openings and CAND's own, SHIP's own, three worlds of 2,000 paths for four openings (24,000 paths, three of CAND's 8,000)
  tot += u;
  console.log(`  ${id} W${w}: CAND solve ${c.solve} s, SHIP solve ${s.solve} s, CAND 8,000 paths ${c.fwd} s, SHIP ${s.fwd} s: the unit about ${f2(u / 3600)} core-hours`);
}
console.log(`  total about ${f2(tot / 3600)} core-hours; the three units run at once, so the wall time is the longest unit's`);
