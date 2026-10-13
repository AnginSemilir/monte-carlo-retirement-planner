/*
 * NE-REF'S DERIVATION (predictions/diag-neref.md): NE-EDGE's S364 RS records (its 60-point table and runs at P, behind
 * NE-EDGE's own gate), the power of items 1-5 by simulation through reduce-neref.mjs's own items(), the credences from the
 * deep review's O150 cause credences (deep-review-log.md 13 Oct 11:00 UK, read from the receipt, not typed) and the judged
 * stories below, the decision table's rows, the points and 80% intervals, and the budget from NE-EDGE's logs.
 *   node research/solver/derive-neref.mjs > research/solver/results-derive-neref.txt
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as NE from './reduce-needge.mjs';
import { items, key, NPW } from './reduce-neref.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), DE = join(HERE, 'results', 'diagneedge');
const f4 = x => x.toFixed(4), f2 = x => x.toFixed(2);
let st = 7002; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const binom = (n, p) => Math.min(n, Math.max(0, Math.round(n * p + Math.sqrt(n * p * (1 - p)) * gauss())));
const DRAWS = 400, N = 1000000, FN = 40000;

// THE JUDGED INPUTS (written before this script's output)
export const JUDGED = {
  // the share of S364's log gap (worlds 1 and 2) the two measured terms carry, by the deep review's O150 cause.
  // REFMIX (the proportional mix blind to the state's pots and the move's order): MIX carries most, FLOW little;
  // REFFLOW (the engine's payment beyond the best fixed order): FLOW carries most; FORM (the closed form pessimistic):
  // neither; COPYC, UR, QUAD, OTHER: neither carries half
  share: {
    'O150-REFMIX': { MIX: { 0.9: 0.3, 0.7: 0.4, 0.5: 0.2, 0.3: 0.1 }, FLOW: { 0.1: 0.6, 0.3: 0.3, 0.5: 0.1 } },
    'O150-REFFLOW': { MIX: { 0.1: 0.5, 0.3: 0.4, 0.5: 0.1 }, FLOW: { 0.9: 0.3, 0.7: 0.4, 0.5: 0.2, 0.3: 0.1 } },
    'O150-FORM': { MIX: { 0.1: 0.5, 0.3: 0.5 }, FLOW: { 0.1: 0.5, 0.3: 0.5 } },
    other: { MIX: { 0.1: 0.4, 0.3: 0.4, 0.5: 0.2 }, FLOW: { 0.1: 0.4, 0.3: 0.4, 0.5: 0.2 } },
  },
  // item 3: the mix simulated over the closed form at the dominant reads. Declared: the design exploration of 13 Oct
  // printed the mix simulated at 200,000 draws at the fifteen states - 0.95 and 0.99 of the closed form at worlds 1 and
  // 2's dominant reads - so this story leans on a partial preview; FORM itself would lift it
  form: { 'O150-FORM': { 1.6: 0.6, 1.3: 0.4 }, other: { 0.95: 0.8, 1.0: 0.15, 1.3: 0.05 } },
  // item 4: the share of S364's world-2 under-read RS with readerRef 'order' removes (ORDER draws pot by pot at the
  // opening weights, so it carries MIXO, not MIXS): under REFMIX much, else little
  rso: { 'O150-REFMIX': { 1: 0.3, 0.75: 0.3, 0.5: 0.2, 0.25: 0.2 }, other: { 0.5: 0.2, 0.25: 0.4, 0: 0.4 } },
  // item 5: RS's deepening of S360's table under its runs, points (the review: RS should deepen O36's bridge-stage
  // pessimism; S360's tables are mid-range, where RS scales little)
  s360: { 0: 0.35, '-0.3': 0.25, '-1': 0.25, '-2': 0.15 },
  // the copied c at P, NE-EDGE's 60-point probe (RS: 0.655, 0.935, 0.990 by world, the review's reading), for COPY
  copyC: [0.655, 0.935, 0.99],
};

// 1. THE RECORDS: NE-EDGE's S364 RS at P, behind NE-EDGE's gate
const red = spawnSync('node', [join(HERE, 'reduce-needge.mjs'), DE], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (!/^GATE: passed/m.test(red.stdout || '')) { console.log('NE-EDGE\'s files did not pass NE-EDGE\'s gate'); process.exit(1); }
const logsE = readdirSync(DE).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(DE, f), 'utf8'));
const rs = logsE.flatMap(NE.parse).find(j => j.id === 'S364' && j.label === 'RS/P60S6Q5');
const T = [0, 1, 2].map(k => rs.tables[k].P), R = [0, 1, 2].map(k => ({ ok: rs.sims[`P${k}`].ok, n: rs.sims[`P${k}`].n }));
const G = [0, 1, 2].map(k => Math.log((R[k].ok / R[k].n) / (T[k] / 100)));
console.log('1. THE RECORDS (NE-EDGE, seed 7002; results/diagneedge behind NE-EDGE\'s gate: passed)');
console.log(`  S364 RS at 60 points, P: table ${T.map(f4).join(', ')} against runs ${R.map(r => `${r.ok}/${r.n}`).join(', ')} by world; log gap G ${G.map(f4).join(', ')}`);

// 2. THE POWER through items(): a synthetic NE-REF set per draw, NE-EDGE's RS figures as the edge
const ones = (n, ok) => { const b = new Uint8Array(n); for (let i = 0; i < ok; i++) b[i] = 1; return b; };
function setOf({ mix = 0.9, flow = 0.1, form = 0.95, rso = 0.5, dS = 0 } = {}) {
  const ledger = [], fl = [];
  for (let k = 0; k < 3; k++) {
    const t = T[k] / 100, ref = t / JUDGED.copyC[k], g = Math.log((R[k].ok / R[k].n) / ref);
    const fs = ref * form, os = fs * Math.exp(mix * G[k]), fb = os * Math.exp(flow * G[k]);
    const c = p => binom(N, Math.min(1, p));
    ledger.push([0, 1, 2, 3, 4].map(() => ({ z: 0, w: 0.2, acc: 1, pr: ref, form: c(fs), N, ow: [c(fs), 0], owN: N, os: [c(os), 0], osN: N })));
    const nb = binom(FN, Math.min(1, fb)); fl.push([{ ai: 12, bridge: nb, N: FN, survived: nb, N2: FN }, { ai: 57, bridge: 0, N: FN, survived: 0, N2: FN }]);
    void g;
  }
  const J = {};
  J[key('S364', 'L/P4S6Q5')] = { id: 'S364', arm: 'L', ledger, flow: fl, quad: [] };
  const truth2 = R[2].ok / R[2].n, ok2 = binom(NPW, truth2), d2 = T[2] - 100 * truth2;
  const tabs = (v) => [0, 1, 2].map(k => ({ k, P: v[k], D: v[k], OWN: v[k] }));
  J[key('S364', 'RSO/P60S6Q5')] = { id: 'S364', arm: 'RSO', own: { ai: 12 }, pair: { P: 12, D: 14 }, tables: tabs([T[0], T[1], 100 * ok2 / NPW + (1 - rso) * d2]), sims: { P2: { ok: ok2, n: NPW } }, bits: {} };
  const sB = [0.4, 0.45, 0.5].map(p => binom(NPW, p));
  J[key('S360', 'BASE/P60S6Q5')] = { id: 'S360', arm: 'BASE', tables: tabs([40, 45, 50]), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { ok: sB[k], n: NPW }])), bits: {} };
  J[key('S360', 'RS/P60S6Q5')] = { id: 'S360', arm: 'RS', tables: tabs([40 + dS, 45 + dS, 50 + dS]), sims: Object.fromEntries([0, 1, 2].map(k => [`OWN${k}`, { ok: sB[k], n: NPW }])), bits: {} };
  return { J, edge: { T, r: R }, bitsOf: (j, nm) => j.bits[nm] || ones(j.sims[nm].n, j.sims[nm].ok) };
}
const P = {}, cnt = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 });
const tally = (k, fn) => { const c = cnt(); for (let d = 0; d < DRAWS; d++) c[fn()]++; P[k] = Object.fromEntries(Object.entries(c).map(([x, v]) => [x, v / DRAWS])); };
const it = s => items(s.J, s.edge, s.bitsOf);
const SH = [0.1, 0.3, 0.5, 0.7, 0.9], FO = [0.95, 1.0, 1.3, 1.6], RO = [0, 0.25, 0.5, 0.75, 1], DS = [0, -0.3, -1, -2];
for (const f of SH) { tally(`mix|${f}`, () => it(setOf({ mix: f }))['1'].outcome); tally(`flow|${f}`, () => it(setOf({ mix: 0.1, flow: f }))['2'].outcome); }
for (const f of FO) tally(`form|${f}`, () => it(setOf({ form: f }))['3'].outcome);
for (const f of RO) tally(`rso|${f}`, () => it(setOf({ rso: f }))['4'].outcome);
for (const f of DS) tally(`s360|${f}`, () => it(setOf({ dS: f }))['5'].outcome);
const row = k => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f4(P[k][x])}`).join(' ');
console.log(`\n2. THE POWER (${DRAWS} draws a cell through reduce-neref.mjs's items(); NE-EDGE's RS table and runs as the edge; the copied c at the review's)`);
for (const f of SH) console.log(`  item 1, MIX carrying ${f} of G: ${row(`mix|${f}`)}; item 2, FLOW carrying ${f}: ${row(`flow|${f}`)}`);
for (const f of FO) console.log(`  item 3, the mix simulated at ${f} of the closed form: ${row(`form|${f}`)}`);
for (const f of RO) console.log(`  item 4, RSO removing ${f} of world 2's under-read: ${row(`rso|${f}`)}`);
for (const f of DS) console.log(`  item 5, RS deepening S360 by ${f} points: ${row(`s360|${f}`)}`);

// 3. THE CREDENCES: the receipt's O150 cause credences through the judged stories and section 2's power
const rec = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => /^- 13 Oct 11:00 UK \|/.test(l));
const cc = Object.fromEntries([...(/CAUSE CREDENCES: (.*)$/.exec(rec || '') || ['', ''])[1].matchAll(/(O150-[A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])]));
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
if (Object.keys(cc).length !== 7 || Math.abs(sum(cc) - 1) > 0.02) { console.log(`the receipt's O150 CAUSE CREDENCES did not read (${JSON.stringify(cc)})`); process.exit(1); }
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const outOf = p => { const u = rnd(); return u < p.HELD ? 'HELD' : u < p.HELD + p.INCONCLUSIVE ? 'INCONCLUSIVE' : 'FALSIFIED'; };
const near = (x, keys) => keys.reduce((b, k) => (Math.abs(k - x) < Math.abs(b - x) ? k : b), keys[0]);
const Cn = Object.fromEntries(['1', '2', '3', '4', '5'].map(i => [i, cnt()])), rows = { A: 0, B: 0, C: 0, D: 0, E: 0 }, Mn = 40000, R1 = [], R4 = [];
const d2 = T[2] - 100 * R[2].ok / R[2].n;
for (let d = 0; d < Mn; d++) {
  const c = pick(cc), sh = JUDGED.share[c] || JUDGED.share.other;
  const mix = Number(pick(sh.MIX)), flow = Number(pick(sh.FLOW)), form = Number(pick(JUDGED.form[c] || JUDGED.form.other));
  const rso = Number(pick(JUDGED.rso[c] || JUDGED.rso.other)), dS = Number(pick(JUDGED.s360));
  const o = { 1: outOf(P[`mix|${near(mix, SH)}`]), 2: outOf(P[`flow|${near(flow, SH)}`]), 3: outOf(P[`form|${near(form, FO)}`]), 4: outOf(P[`rso|${near(rso, RO)}`]), 5: outOf(P[`s360|${near(dS, DS)}`]) };
  for (const i of Object.keys(Cn)) Cn[i][o[i]]++;
  R1.push(mix + (rnd() - 0.5) * 0.1); R4.push((1 - rso) * d2 + (rnd() - 0.5) * 0.3);
  if (o[1] === 'HELD' && o[4] === 'HELD' && o[5] !== 'FALSIFIED') rows.A++;
  else if (o[1] === 'HELD') rows.B++;
  else if (o[2] === 'HELD') rows.C++;
  else if (o[5] === 'FALSIFIED') rows.D++;
  else rows.E++;
}
const pct = (xs, qq) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(qq * s.length))]; };
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
console.log(`\n3. THE CREDENCES (the receipt of 13 Oct 11:00 UK: ${Object.entries(cc).map(([k, v]) => `${k}=${v}`).join('; ')}; the judged stories in this script's JUDGED; ${Mn} draws)`);
for (const [i, c] of Object.entries(Cn)) console.log(`CREDENCE item ${i}: point ${i === '1' ? f4(mean(R1)) : i === '4' ? f4(mean(R4)) : '-'} HELD ${f2(c.HELD / Mn)} INCONCLUSIVE ${f2(c.INCONCLUSIVE / Mn)} FALSIFIED ${f2(c.FALSIFIED / Mn)}`);
console.log(`  POINT item 1: ${f4(mean(R1))} (80% interval ${f4(pct(R1, 0.1))} to ${f4(pct(R1, 0.9))}; MIX's share of world 1's log gap)`);
console.log(`  POINT item 4: ${f4(mean(R4))} (80% interval ${f4(pct(R4, 0.1))} to ${f4(pct(R4, 0.9))}; RSO's world-2 table less its runs at P, points)`);
console.log(`  DECISION ROWS: items 1 and 4 HELD, 5 not FALSIFIED ${f2(rows.A / Mn)}; item 1 HELD otherwise ${f2(rows.B / Mn)}; item 2 HELD (1 not) ${f2(rows.C / Mn)}; item 5 FALSIFIED (none above) ${f2(rows.D / Mn)}; else ${f2(rows.E / Mn)}`);

// 4. THE BUDGET: NE-EDGE's S364 RS log (solve plus runs, the forceIdentity line's time); the ledger's solve at 4 points from
// NE-EDGE's preflight is not on file, so it is NE-EDGE's 60-point solve over the points' ratio squared (judged), with its
// simulations judged at a quarter hour; S360 at S364's (judged)
const sec = re => { const x = logsE.find(t => /^S364\s+case \| job RS\/P60S6Q5 \|/m.test(t)); const m = re.exec(x); return m ? Number(m[1]) : NaN; };
const solveS = sec(/solve CAND RS\/P60S6Q5: table \S+ secs (\d+)/), runS = sec(/forceIdentity \d+\/\d+ secs (\d+)/), job60 = solveS + runS;
const ledger = solveS * (4 / 60) ** 2 + 900;
console.log('\n4. THE BUDGET (NE-EDGE\'s S364 RS/P60S6Q5 log: solve plus runs)');
console.log(`  S364 RSO, S360 BASE, S360 RS: about ${f2(job60 / 3600)} h each (NE-EDGE's S364 RS: solve ${solveS} s, runs ${runS} s; S360 judged alike); the ledger about ${f2(ledger / 3600)} h`);
console.log(`  total about ${f2((3 * job60 + ledger) / 3600)} core-hours; the four jobs at once, about ${f2(Math.max(job60, ledger) / 3600)} h wall`);
