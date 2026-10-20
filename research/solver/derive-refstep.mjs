/*
 * REF-STEP'S DERIVATION (predictions/diag-refstep.md; the deep review after REF-B, deep-review-log.md 20 Oct 02:53 UK, adopted
 * in PLAN.md's 20 Oct 03:02 row): the records (REF-B's AN on S362 and S370 behind REF-B's gate, which runs COPY-B's and
 * COPY-X's over the plan reference's C; COPY-B's C on S362 and COPY-X's on S370 behind their own; S360's and S364's earlier
 * reads at other settings, results-an.txt, results-aor.txt and results-7u.txt, grade D as priors); the judged stories below for
 * the new arms AN3 and AR3 (grade D); the power of items 1 to 5 through reduce-refstep.mjs's own items() and pOf(), with C and
 * AN as the files hold them on S362 and S370 and AN3 drawn from AN path by path, S360's and S364's C and AR3 drawn from the
 * stories; the credences from the receipt's O191 CAUSE CREDENCES as stated (section 3), at the lead rate's lower bound
 * (section 3b, the registered ones) and at the settled-since rate (section 3c), read from results-scorecard.txt's LEAD RATE BY
 * POPULATION; the decision rows; the points and 80% intervals; the budget, from the records' timings.
 *   node research/solver/derive-refstep.mjs [--records] > research/solver/results-derive-refstep.txt
 * THE DESIGN MAP (DESIGN-MAP: written and committed with the JUDGED block, before this script's first output): each line, arm
 * and condition of the adopted design (PLAN.md's REF-STEP row; the receipt's (1), (3)(i) and (iii), (4)(b); PR29, PR31) to the
 * item that reads it, a reported line, or a declared departure:
 *   - "a research option in adaptive.js reading the step split exactly at every bridge year (off by default)": `stepAll`
 *     (adaptive.js; research/tests/adaptive-step.test.mjs, its plant 'stepramp'); armTook and stepTook in the audit;
 *   - "the build shows AN and C reproduce on the new code": the reducer's reproduction gate (AN's files equal REF-B's, C's
 *     COPY-B's and COPY-X's, byte for byte), not an item;
 *   - "AN3 against AN and C on S362 and S370 at 30 points, seed 7002": AN3's read error by year on S362 (item 1, PR29: the
 *     smear's removal read on the whole read error from each of years 1 to 3, WHOLE), O191's switch against AN's (item 2), AN3
 *     against C by the harm rule (item 3), AN3 less AN on S370's read error from year 3 on (item 5, the control: the smear
 *     there is a tenth of S362's by the receipt); AN3 against AN by the harm rule, reported (its own control: CONTROL);
 *   - "the package the reference choice would adopt against C on S360 and S364 (PR24's breadth: the adaptive reference with its
 *     fix, RS and AN3's exact steps)": the arm AR3; item 4 (its read error from year 1 within a point where C's is a point or
 *     more) and item 3 (AR3 against C by the harm rule);
 *   - "the chooser's split against A*_t printed (PR31)": the audit's pr31 lines, reported, not read (PR31's own falsifier is a
 *     print before the reference choice);
 *   - "after the O191 read is committed as a script with a plant": done in 0a7b35a (read-o191.mjs, READ_PLANT=y3); the reducer
 *     imports its read() for item 2 and reports it for C against AN (reproducing results-o191.txt) and C against AN3;
 *   - the receipt's O191 causes (SMEAR, TIE, TRADE, CLUCK, REFOTHER, OTHER): item 2 reads the switch's survival under AN3, the
 *     outcome that separates SMEAR (the switch largely gone) from its rivals (the switch stays); "FD-X ... if AN3 does not
 *     settle it": R2's action. DEPARTURE, declared: the receipt's own-move read error in the cell (AN 0.97, se 0.25) is printed,
 *     not read: once the smear is gone from AN3's tables every cause predicts a read error near nil there, so it separates none
 *     (CAUSES: an item credits a cause only where its outcome is likelier under it than under every rival);
 *   - the maintainer's ruling (PR30: harm by world or by the mixture) is not given: item 3 reads by world, RULES.md section 8 as
 *     written; the mixture's survival and whole-score change (read-o191.mjs's all-path read) reported beside;
 *   - UNMASK-REG: the register's pre-registered unmaskings by a reference or step-read fix (searched for 'fix will expose',
 *     'before any' and 'reference'): O191 (NOT SETTLED as the reference's until AN3 or FD-X reads it: items 1 and 2 with the
 *     cause reading); TOP-CELL's flag (S370's world-0 rise under the adaptive reference with the copy rule) does not apply: no
 *     arm here carries the copy rule or the top-cell work (the prediction's Unmasking field);
 *   - "about two and a half hours' wall" (the review's): ten jobs, the budget below (section 4).
 * AFTER THE FIRST OUTPUT (results-derive-refstep.txt sha256 138485588dec5763, 20 Oct 04:30 UK; declared in the prediction's
 * ORDER): its power section showed item 1, read on AN3's level, unable to tell no removal from a partial one (the read error's
 * per-path spread of 4 to 5 points), so item 1 was moved in the reducer onto the share of AN's smear (its year-3 dying paths'
 * residual) that leaves the read error from each of years 1 to 3, path by path (WHOLE, NETS); this script passes that residual
 * to pOf. No JUDGED input changed.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { items, causeOf, rowOf, pOf, POINT, EXPECT, NPW, dyingShare } from './reduce-refstep.mjs';
import { read as readO191, W as WMIX } from './read-o191.mjs';

// THE JUDGED INPUTS (committed before this script's output and before any REF-STEP run; grade D throughout).
export const JUDGED = {
  // item 1 (PR29): the share of the year-3 dying paths' residual that AN3 removes (the smear: by construction a read below
  // A*_3 is 0, so most of it goes; a dying path above the step keeps the live node's value), drawn once for both households
  f: { 0.7: 0.15, 0.9: 0.3, 1: 0.4, 1.1: 0.15 },
  // the flat read between the step and the first live node over-reads the live side a little, points added to the read error
  // from year 3 on (and so to years 1 and 2's); at S362's year 3 the cell is about 2 percent of A (the receipt)
  live: { 0: 0.4, 0.1: 0.3, 0.25: 0.2, 0.4: 0.1 },
  // years 1 and 2's own change through the split expectation (expectSplit), points added to the read error from years 1 and 2
  y12: { '-0.15': 0.25, 0: 0.5, 0.15: 0.25 },
  // AN3's per-path jitter about AN's on S362 and S370 (paths whose moves change), points
  e362: 0.5, e370: 0.3,
  // item 2 (O191): AN3's year-1 cell paths as a share of AN's, per cause (SMEAR: the smear tipped the near-ties, so most go back
  // to C's taxable-first move; TIE: near-ties broken either way by sub-point errors, re-broken; TRADE and CLUCK: the switch is
  // the mixture's or C's own pessimism, so it stays; REFOTHER: another adaptive error at the edge keeps most; OTHER between)
  cell: {
    SMEAR: { 0.05: 0.2, 0.2: 0.35, 0.4: 0.3, 0.6: 0.15 },
    TIE: { 0.4: 0.25, 0.7: 0.4, 1: 0.35 },
    TRADE: { 0.85: 0.3, 1: 0.5, 1.15: 0.2 },
    CLUCK: { 0.85: 0.3, 1: 0.5, 1.15: 0.2 },
    REFOTHER: { 0.6: 0.3, 0.9: 0.4, 1.1: 0.3 },
    OTHER: { 0.3: 0.25, 0.6: 0.35, 0.9: 0.4 },
  },
  // a world's share about the draw's
  cj: { '-0.1': 0.25, 0: 0.5, 0.1: 0.25 },
  // item 3: AN3 against C on S362 and S370: AN's lost and saved paths against C (REF-B's files) carried, the year-1 cell's share
  // of them scaled by the cell's draw (the switch's paths gone with it), the rest by this multiple; AR3 against C on S360: the
  // record's flips (A6RS against BO, AOR, other settings) times this; on S364 (survival near nil) each way a Poisson count
  flips: { 0.75: 0.3, 1: 0.4, 1.5: 0.3 },
  s360flips: { 0.5: 0.3, 1: 0.4, 2: 0.3 },
  s364flips: { 1: 0.4, 4: 0.4, 12: 0.2 },
  // S360's and S364's survival at the frozen candidate, percent by world (AOR's BO and A6RS; AOP's runs on S364), and the whole
  // score's alive less dead (S362's records: about 110)
  s360p: [28.7, 49.1, 70.5], s364p: [0.05, 0.3, 1.55], gap: 110,
  // item 4 (PR24): C's read error from year 1 on S360 and S364 at the frozen candidate, points by world (S360: NODE-AX's BN GB
  // -1.77, -2.07, -0.76, AN's results; S364: the candidate's table over its runs by 4.82 at 7u's settings, AOP's world tables
  // 1.84, 0.66 and 1.78 over runs of 2, 12 and 62 of 4,000 under the adaptive reference without RS), and AR3's removal of it
  // with the level it leaves (A6RS's GB 0.10, 0.28 and 0.11; ARS read S364 at its runs)
  c360: [{ '-1': 0.3, '-1.8': 0.4, '-2.6': 0.3 }, { '-1.2': 0.3, '-2.1': 0.4, '-3': 0.3 }, { '-0.4': 0.3, '-0.8': 0.4, '-1.2': 0.3 }],
  c364: [{ 2: 0.3, 4: 0.4, 6: 0.3 }, { 1: 0.3, 2.5: 0.4, 4: 0.3 }, { 0.5: 0.3, 1.5: 0.4, 3: 0.3 }],
  r4: { 1: 0.45, 0.9: 0.3, 0.6: 0.15, 0.3: 0.1 },
  d4: { '-0.3': 0.25, 0: 0.5, 0.3: 0.25 },
  // the per-path spread of C's and AR3's read error from year 1, points (BN's interval on S360 gives about 5; A6RS's sd 0.8 to 1)
  sdC: 5, sdA: 1,
  // item 5: S370's year-3 jitter of AN3 less AN beyond the smear, points
  j370: { '-0.05': 0.25, 0: 0.5, 0.05: 0.25 },
};

const HERE = dirname(fileURLToPath(import.meta.url)), R_ = d => join(HERE, 'results', d);
const f4 = x => (Number.isFinite(x) ? x.toFixed(4) : String(x)), f2 = x => x.toFixed(2);
let st = 17; const rnd = () => { st |= 0; st = (st + 0x6D2B79F5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rnd()))) * Math.cos(2 * Math.PI * rnd());
const pick = dist => { let u = rnd(), acc = 0; for (const [k, v] of Object.entries(dist)) { acc += v; if (u < acc) return k; } return Object.keys(dist).pop(); };
const pickN = dist => Number(pick(dist));
const pois = m => { if (m <= 0) return 0; if (m > 50) return Math.max(0, Math.round(m + Math.sqrt(m) * gauss())); let L = Math.exp(-m), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString()), cnt = b => { let c = 0; for (const x of b) c += x; return c; };
const dec = x => { const b = Buffer.from(x, 'base64'); return new Float64Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
const K = [0, 1, 2];

// 1. THE RECORDS
const gateOf = (script, dir) => /^GATE: passed/m.test(spawnSync('node', [join(HERE, script), R_(dir)], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '');
for (const [s, d] of [['reduce-refb.mjs', 'diagrefb'], ['reduce-copyb.mjs', 'diagcopyb'], ['reduce-copyx.mjs', 'diagcopyx']]) if (!gateOf(s, d)) { console.log(`${d}'s files did not pass ${s}'s gate`); process.exit(1); }
const full = f => ({ ...f, per: Object.fromEntries(Object.entries(f.per).map(([x, v]) => [x, dec(v)])), bits: Object.fromEntries(Object.entries(f.bits).map(([x, v]) => [x, dec8(v)])), mv: Object.fromEntries(Object.entries(f.moves).map(([x, v]) => [x, dec16(v)])) });
const F = { S362: { C: full(ld(join(R_('diagcopyb'), 'S362-C-P30S6Q5.json.gz'))), AN: full(ld(join(R_('diagrefb'), 'S362-AN-P30S6Q5.json.gz'))) }, S370: { C: full(ld(join(R_('diagcopyx'), 'S370-C-P30S6Q5.json.gz'))), AN: full(ld(join(R_('diagrefb'), 'S370-AN-P30S6Q5.json.gz'))) } };
const N = F.S362.C.NPW, HS = ['S362', 'S370'];
if (N !== NPW || HS.some(h => F[h].C.NPW !== N || F[h].AN.NPW !== N || F[h].C.seed !== 7002 || F[h].AN.seed !== 7002)) { console.log('the records did not read'); process.exit(1); }
const BR = Object.fromEntries(HS.map(h => [h, F[h].C.bridge]));
const P100 = (f, x, k) => Float64Array.from(f.per[`${x}${k}`], v => 100 * v);
const tailOfF = (f, k, t) => { const ga = P100(f, 'GA', k), y = f.bridge.filter(u => u >= t).map(u => P100(f, `Y${u}`, k)); return Float64Array.from(ga, (g, i) => y.reduce((s, a) => s + a[i], g)); };
const flipsOf = (c, x) => { let lost = 0, saved = 0; for (let i = 0; i < c.length; i++) { if (c[i] && !x[i]) lost++; else if (!c[i] && x[i]) saved++; } return { lost, saved }; };
// the year-3 dying paths under AN (their residual at year 3, per path, else 0)
const dyingY3 = (f, k) => { const Y = f.years, mv = f.mv[`MV${k}`], b = f.bits[`OWN${k}`], y = P100(f, 'Y3', k); return Float64Array.from(y, (v, i) => (mv[i * Y + 3] !== 65535 && mv[i * Y + 4] === 65535 && !b[i] ? v : 0)); };
const O191 = readO191(F.S362.C, F.S362.AN);
// the year-1 cell's paths (C taxable-first, AN ISA-first, first differing at year 1) among AN's lost and saved against C
const isaFirst = ai => Math.floor(Math.floor(ai / 15) / 3) % 2 === 1;
const cellPaths = k => { const A = F.S362.C, B = F.S362.AN, Y = A.years, mA = A.mv[`MV${k}`], mB = B.mv[`MV${k}`], out = new Uint8Array(N); for (let i = 0; i < N; i++) { let t0 = -1; for (let t = 0; t < Y; t++) if (mA[i * Y + t] !== mB[i * Y + t]) { t0 = t; break; } if (t0 === 1 && !isaFirst(mA[i * Y + 1]) && isaFirst(mB[i * Y + 1])) out[i] = 1; } return out; };
const REC = { S362: [], S370: [] };
console.log('REF-STEP\'S DERIVATION (predictions/diag-refstep.md)\n\n1. THE RECORDS');
console.log(`  seed 7002, ${N} paths a world: S362's C behind COPY-B's gate and S370's behind COPY-X's; AN on both behind REF-B's (the adaptive reference with its fix, no stepAll: REF-B's arm)`);
for (const h of HS) for (const k of K) {
  const C = F[h].C, A = F[h].AN, bc = C.bits[`OWN${k}`], ba = A.bits[`OWN${k}`], r = { pC: cnt(bc) / N, pA: cnt(ba) / N, fl: flipsOf(bc, ba) };
  r.tails = [1, 2, 3].map(t => mean(tailOfF(A, k, t))); r.tailsC = [1, 2, 3].map(t => mean(tailOfF(C, k, t)));
  { const t3 = tailOfF(A, k, 3), m3 = mean(t3); r.sd3 = Math.sqrt(t3.reduce((u, v) => u + (v - m3) ** 2, 0) / (N - 1)); }
  r.dyA = dyingShare(A.mv[`MV${k}`], A.years, ba, A.per[`Y3${k}`], 3); r.dyC = dyingShare(C.mv[`MV${k}`], C.years, bc, C.per[`Y3${k}`], 3);
  const ws = A.per[`WS${k}`]; let wa = 0, na = 0, wd = 0, nd = 0; for (let i = 0; i < N; i++) { if (ba[i]) { wa += ws[i]; na++; } else { wd += ws[i]; nd++; } } r.gap = (na ? wa / na : 0) - (nd ? wd / nd : 0);
  let line = `  ${h} world ${k}: survival C ${f4(100 * r.pC)}, AN ${f4(100 * r.pA)}; AN against C ${r.fl.lost} lost, ${r.fl.saved} saved; the read error from years 1, 2 and 3 on, AN ${r.tails.map(f4).join(', ')}, C ${r.tailsC.map(f4).join(', ')} (AN's per-path spread from year 3, sd ${f4(r.sd3)}); the year-3 dying paths' share of the world's year-3 residual, AN ${f4(r.dyA.share)} (${r.dyA.n} paths), C ${f4(r.dyC.share)} (${r.dyC.n})`;
  if (h === 'S362') { const cp = cellPaths(k); let cl = 0, cs = 0; for (let i = 0; i < N; i++) if (cp[i]) { if (bc[i] && !ba[i]) cl++; else if (!bc[i] && ba[i]) cs++; } r.cell = { n: O191.cell[k].n, lost: cl, saved: cs }; line += `; O191's year-1 cell (C taxable-first, AN ISA-first) ${r.cell.n} paths, ${cl} of AN's lost and ${cs} of its saved in it`; }
  console.log(`${line}; the whole score's alive less dead under AN ${f4(r.gap)}`);
  REC[h][k] = r;
}
console.log(`  O191's read (read-o191.mjs, C against AN on S362): the cell's own-move read error on the mixture AN ${f4(O191.mix.cell.eB)} (se ${f4(O191.mix.cell.seB)}), C ${f4(O191.mix.cell.eA)} (${f4(O191.mix.cell.seA)}); the cell's mixture survival change ${f4(O191.mix.cell.d)} (${f4(O191.mix.cell.se)}); all paths on the mixture ${f4(O191.mix.all.s)} (${f4(O191.mix.all.se)})`);
// S360 and S364 at other settings (grade D): AN's results (NODE-AX's BN against AN on S360), AOR's (A6RS against BO on S360; AOP
// and ARS on S364), 7u's (the candidate's table against its runs on S364)
const txt = f => readFileSync(join(HERE, f), 'utf8');
const an = txt('results-an.txt'), aor = txt('results-aor.txt'), u7 = txt('results-7u.txt');
const S360 = K.map(k => { const m = new RegExp(`world ${k}: AN OWN less runs \\S+ = T \\S+ \\+ GB (\\S+) \\+ GA \\S+; BN's GB (\\S+) .*?survival AN (\\S+) BN (\\S+)`).exec(an), fl = new RegExp(`A6RS against BO world ${k}: lost (\\d+) saved (\\d+) of`).exec(aor); return m ? { gbAN: Number(m[1]), gbBN: Number(m[2]), pAN: Number(m[3]), pBN: Number(m[4]), fl: fl ? { lost: Number(fl[1]), saved: Number(fl[2]) } : null } : null; });
const S364 = K.map(k => { const p = new RegExp(`AOP world ${k}: table (\\S+) = deletion \\S+ \\+ residual (\\S+) \\(R's part (\\S+)\\); P runs (\\d+)/(\\d+)`).exec(aor), r = new RegExp(`ARS world ${k}: table (\\S+) = deletion \\S+ \\+ residual (\\S+)`).exec(aor); return p && r ? { tabP: Number(p[1]), resP: Number(p[2]), rP: Number(p[3]), runs: Number(p[4]) / Number(p[5]), tabRS: Number(r[1]), resRS: Number(r[2]) } : null; });
const c7u = /S364 CAND\s+table (\S+) sim (\S+) error (\S+)/.exec(u7);
if (S360.some(x => !x) || S364.some(x => !x) || !c7u) { console.log('S360\'s or S364\'s records did not read (results-an.txt, results-aor.txt, results-7u.txt)'); process.exit(1); }
for (const k of K) console.log(`  S360 world ${k} (NODE-AX's settings, 15 shares, 60 points; results-an.txt): the plan reference's GB ${f4(S360[k].gbBN)}, the adaptive reference's ${f4(S360[k].gbAN)}, survival ${f4(S360[k].pBN)}; A6RS against BO (results-aor.txt) ${S360[k].fl ? `${S360[k].fl.lost} lost, ${S360[k].fl.saved} saved` : 'not printed'}`);
for (const k of K) console.log(`  S364 world ${k} (AO's settings; results-aor.txt): the read at P under the adaptive reference without RS: table ${f4(S364[k].tabP)} (residual ${f4(S364[k].resP)}, R's part ${f4(S364[k].rP)}) against runs ${f4(100 * S364[k].runs)}; with RS (ARS) table ${f4(S364[k].tabRS)}, residual ${f4(S364[k].resRS)}`);
console.log(`  S364 at 7u's candidate (results-7u.txt): table ${c7u[1]}, runs ${c7u[2]}, error ${c7u[3]}`);
console.log(`  KNOWN-LEG: no record shows AN3 or AR3 (new arms); AN3's reach at S362's year-3 step is shown by research/tests/adaptive-step.test.mjs at 4 points (every BELOW cell reads 0 under stepAll where the plant 'stepramp' reads 0.4618 just under the step) and printed in the run by the year-3 dying paths' share under AN3 (reduce-refstep.mjs's REPORTED); so item 2's FALSIFIED reads SMEAR's 'not' only with item 1 HELD (the whole in band: causeOf, a registered line), and item 2's HELD credits SMEAR only with item 1 HELD`);
if (process.argv.includes('--records')) process.exit(0);

// a synthetic draw in reduce-refstep.mjs pOf()'s shape: AN3 from AN path by path, S360's and S364's C and AR3 from the stories
const pickIdx = (bits, want, m) => { const ix = []; for (let i = 0; i < N; i++) if (bits[i] === want) ix.push(i); m = Math.min(m, ix.length); for (let j = 0; j < m; j++) { const r = j + Math.floor(rnd() * (ix.length - j)); [ix[j], ix[r]] = [ix[r], ix[j]]; } return ix.slice(0, m); };
const flipBits = (b0, lost, saved) => { const b = Uint8Array.from(b0); for (const j of pickIdx(b0, 1, lost)) b[j] = 0; for (const j of pickIdx(b0, 0, saved)) b[j] = 1; return b; };
const DY = Object.fromEntries(HS.map(h => [h, K.map(k => dyingY3(F[h].AN, k))]));
const bitsAtP = p => { const n = Math.round(p / 100 * N); return Uint8Array.from({ length: N }, (_, i) => (i < n ? 1 : 0)); };
function drawSet(s) {
  const per = { S362: { AN3: [] }, S370: { AN3: [] }, S364: { C: [], AR3: [] }, S360: { C: [], AR3: [] } }, bits = { S362: { AN3: [] }, S370: { AN3: [] }, S364: { C: [], AR3: [] }, S360: { C: [], AR3: [] } }, ws = { S364: { C: [], AR3: [] }, S360: { C: [], AR3: [] } };
  for (const h of HS) for (const k of K) {
    const A = F[h].AN, o = {}, e = h === 'S362' ? JUDGED.e362 : JUDGED.e370, dy = DY[h][k], sh = h === 'S370' ? s.j370[k] : 0;
    for (const t of BR[h]) o[`Y${t}`] = P100(A, `Y${t}`, k);
    o.GA = P100(A, 'GA', k);
    o.Y3 = Float64Array.from(o.Y3, (v, i) => v - s.f * dy[i] + s.live + sh + e * gauss());
    if (h === 'S362') o.Y2 = Float64Array.from(o.Y2, v => v + s.y12);
    per[h].AN3[k] = o;
    const bc = F[h].C.bits[`OWN${k}`], r = REC[h][k];
    // AN3's flips against C: AN's, the cell's share of them scaled by the cell's draw (S362), the rest by the multiple
    const cl = h === 'S362' ? r.cell.lost : 0, cs = h === 'S362' ? r.cell.saved : 0, fr = h === 'S362' ? s.cellW[k] : 1;
    bits[h].AN3[k] = flipBits(bc, pois(s.flips * (r.fl.lost - cl) + fr * cl), pois(s.flips * (r.fl.saved - cs) + fr * cs));
  }
  for (const k of K) {
    for (const [h, pp] of [['S360', JUDGED.s360p], ['S364', JUDGED.s364p]]) {
      const bc = bitsAtP(pp[k]), c = h === 'S360' ? s.c360[k] : s.c364[k], g = Float64Array.from({ length: N }, () => c + JUDGED.sdC * gauss());
      per[h].C[k] = { Y1: g, GA: new Float64Array(N) };
      per[h].AR3[k] = { Y1: Float64Array.from(g, v => (1 - s.r4[h]) * v + s.d4[h] + JUDGED.sdA * gauss()), GA: new Float64Array(N) };
      const fl = h === 'S360' ? (S360[k].fl || S360[1].fl) : null, ba = h === 'S360' ? flipBits(bc, pois(s.s360f * fl.lost), pois(s.s360f * fl.saved)) : flipBits(bc, pois(s.s364f), pois(s.s364f));
      bits[h].C[k] = bc; bits[h].AR3[k] = ba;
      ws[h].C[k] = Float64Array.from(bc, v => (v ? JUDGED.gap : 0) + 0.5 * gauss()); ws[h].AR3[k] = Float64Array.from(ws[h].C[k], (v, i) => v + (ba[i] - bc[i]) * JUDGED.gap);
    }
  }
  const bridge = { S362: BR.S362, S370: BR.S370, S364: [1], S360: [1] };
  const perP = (h, a, k, x) => (HS.includes(h) && a !== 'AN3' ? P100(F[h][a], x, k) : per[h][a][k][x]);
  const bitsF = (h, a, k) => (HS.includes(h) && a !== 'AN3' ? F[h][a].bits[`OWN${k}`] : bits[h][a][k]);
  const wsF = (h, a, k) => { if (!HS.includes(h)) return ws[h][a][k]; const w = F[h].C.per[`WS${k}`]; if (a === 'C') return w; const b = bitsF(h, a, k), c = F[h].C.bits[`OWN${k}`], g = REC[h][k].gap; return Float64Array.from(w, (v, i) => v + (b[i] - c[i]) * g); };
  const nAN = O191.cell.map(x => x.n), n3 = K.map(k => Math.max(0, Math.round(s.cellW[k] * nAN[k] + Math.sqrt(Math.max(1, s.cellW[k] * nAN[k]) * (1 - Math.min(0.99, s.cellW[k] * nAN[k] / N))) * gauss())));
  const o191 = { AN: { cell: nAN.map(n => ({ n })) }, AN3: { cell: n3.map(n => ({ n })), mix: { cell: { eB: NaN, seB: NaN } } }, N };
  return pOf(perP, bitsF, wsF, bridge, o191, (h, a, k) => DY[h][k]);
}
const drawOf = c191 => {
  const cw = pickN(JUDGED.cell[c191]);
  return { f: pickN(JUDGED.f), live: pickN(JUDGED.live), y12: pickN(JUDGED.y12), j370: K.map(() => pickN(JUDGED.j370)), cellW: K.map(() => Math.max(0, cw + pickN(JUDGED.cj))), flips: pickN(JUDGED.flips),
    s360f: pickN(JUDGED.s360flips), s364f: pickN(JUDGED.s364flips), c360: K.map(k => pickN(JUDGED.c360[k])), c364: K.map(k => pickN(JUDGED.c364[k])), r4: { S360: pickN(JUDGED.r4), S364: pickN(JUDGED.r4) }, d4: { S360: pickN(JUDGED.d4), S364: pickN(JUDGED.d4) } };
};
const cnt3 = () => ({ HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 }), tot = c => c.HELD + c.INCONCLUSIVE + c.FALSIFIED;
const row = c => ['HELD', 'INCONCLUSIVE', 'FALSIFIED'].map(x => `${x} ${f2(c[x] / tot(c))}`).join(' ');
const IT = ['1', '2', '3', '4', '5'];

// 2. THE POWER through items(): one input moved, the rest drawn from the JUDGED stories at O191-SMEAR
const DR = 40, at = over => items(drawSet({ ...drawOf('SMEAR'), ...over }));
const cell = (lab, over, i) => { const c = cnt3(); for (let q = 0; q < DR; q++) c[at(over)[i].outcome]++; console.log(`  item ${i}, ${lab}: ${row(c)}`); };
console.log(`\n2. THE POWER (${DR} draws a cell through reduce-refstep.mjs's items() and pOf(); C and AN as the files hold them on S362 and S370, every other input drawn from the JUDGED stories at O191-SMEAR)`);
for (const f of [0, 0.3, 0.6, 0.8, 1, 1.2]) cell(`AN3 removes ${f} of the year-3 dying paths' residual, no live-side over-read`, { f, live: 0, y12: 0 }, '1');
for (const live of [0.1, 0.25, 0.4]) cell(`AN3 removes all of it with a live-side over-read of ${live}`, { f: 1, live, y12: 0 }, '1');
for (const w of [0, 0.2, 0.4, 0.5, 0.6, 0.75, 0.9, 1]) cell(`AN3's cell ${w} of AN's in every world`, { cellW: [w, w, w] }, '2');
for (const fl of [0.75, 1.5, 3]) cell(`AN3's flips ${fl} times AN's outside the cell, the cell's own at its draw`, { flips: fl }, '3');
for (const r of [1, 0.75, 0.5, 0.3]) cell(`AR3 removes ${r} of C's read error on S360 and S364`, { r4: { S360: r, S364: r }, d4: { S360: 0, S364: 0 } }, '4');
for (const live of [0, 0.25, 0.5]) cell(`AN3's live-side over-read ${live} on S370 too, all of the smear removed`, { f: 1, live, j370: [0, 0, 0] }, '5');
{ const L = {}; for (let q = 0; q < DR; q++) for (const l of at({})['3'].legs) for (const x of l.per) { const key = `${l.arm} on ${x.h}`; L[key] = L[key] || cnt3(); L[key][x.outcome]++; }
  console.log(`  item 3 by leg at the stories (each leg's own reading; S364's margin marginRel at 0.05 to 1.55 percent survival): ${Object.entries(L).map(([k, c]) => `${k}: ${row(c)}`).join('; ')}`); }

// 3. THE CREDENCES
const RECEIPT = '20 Oct 02:53 UK', logT = readFileSync(join(HERE, 'deep-review-log.md'), 'utf8').split('\n').find(l => l.startsWith(`- ${RECEIPT} |`)) || '';
const credLine = (/CAUSE CREDENCES: (.*)$/.exec(logT) || ['', ''])[1];
const c191 = Object.fromEntries([...credLine.matchAll(/O191-([A-Z]+)=([0-9.]+)/g)].map(m => [m[1], Number(m[2])])), sumOf = c => Object.values(c).reduce((a, x) => a + x, 0);
if (Object.keys(c191).length !== 6 || Math.abs(sumOf(c191) - 1) > 0.02 || Object.keys(c191).some(k => !JUDGED.cell[k])) { console.log(`the receipt's O191 CAUSE CREDENCES did not read (${credLine.slice(0, 200)})`); process.exit(1); }
const LEAD = 'SMEAR';
const ND = 1000, qa = (a, p) => { const x = [...a].sort((u, v) => u - v); return x[Math.min(x.length - 1, Math.floor(p * x.length))]; };
const pickC = cmap => { const t2 = sumOf(cmap); let u = rnd() * t2, acc = 0; for (const [k, v] of Object.entries(cmap)) { acc += v; if (u < acc) return k; } return Object.keys(cmap).pop(); };
const WHAT = { 1: 'the least share of AN\'s smear leaving S362\'s read error from bridge years 1 to 3 under AN3, across the worlds', 2: 'AN3\'s year-1 cell as a share of AN\'s on the mixture', 3: 'the least survival change of any leg and world, points', 4: 'the largest read error from year 1 in size under AR3 across S364\'s and S360\'s worlds read, points', 5: 'the largest move of S370\'s read error from year 3 on, AN3 less AN, in size across the worlds, points' };
function credences(m191) {
  const I = Object.fromEntries(IT.map(i => [i, cnt3()])), R = { R1: 0, R2: 0, R3: 0, R4: 0, R5: 0, else: 0 }, pt = Object.fromEntries(IT.map(i => [i, []])), CZ = {};
  for (let q = 0; q < ND; q++) {
    const it = items(drawSet(drawOf(pickC(m191))));
    for (const i of IT) { I[i][it[i].outcome]++; const v = POINT[i](it); if (Number.isFinite(v)) pt[i].push(v); }
    R[rowOf(it)]++; const cz = causeOf(it); CZ[cz] = (CZ[cz] || 0) + 1;
  }
  return { I, R, pt, CZ };
}
const show = ({ I, R, pt, CZ }, tag) => {
  for (const i of IT) console.log(`  item ${i}: ${row(I[i])}`);
  console.log(`  decision rows: ${Object.entries(R).map(([k, v]) => `${k} ${f2(v / ND)}`).join(', ')}`);
  console.log(`  item 2's cause reading (reduce-refstep.mjs causeOf, with item 1's whole): ${Object.entries(CZ).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${f2(v / ND)}`).join('; ')}`);
  console.log(`  the chance the action changes (one less the likeliest row): ${f2(1 - Math.max(...Object.values(R)) / ND)}`);
  for (const i of IT) console.log(`  item ${i}'s point (${WHAT[i]}): median ${f4(qa(pt[i], 0.5))}, 80% interval ${f4(qa(pt[i], 0.1))} to ${f4(qa(pt[i], 0.9))} (${pt[i].length} of ${ND} draws read)`);
  if (tag) { for (const i of IT) console.log(`${tag}item ${i}: point ${f4(qa(pt[i], 0.5))} HELD ${f2(I[i].HELD / ND)} INCONCLUSIVE ${f2(I[i].INCONCLUSIVE / ND)} FALSIFIED ${f2(I[i].FALSIFIED / ND)}`); console.log(`${tag}else ${f2(R.else / ND)}`); }
};
console.log(`\n3. THE CREDENCES AS STATED (the receipt of ${RECEIPT}: ${Object.entries(c191).map(([k, v]) => `O191-${k}=${v}`).join('; ')}; ${ND} draws through items())`);
show(credences(c191), '');
const lp = /LEAD RATE BY POPULATION: .*?settled since (\d+) of (\d+) \(Laplace ([0-9.]+)\);.*? counted not held, (\d+) of (\d+) \(Laplace ([0-9.]+)\)/.exec(readFileSync(join(HERE, 'results-scorecard.txt'), 'utf8'));
if (!lp) { console.log('the scorecard\'s LEAD RATE BY POPULATION did not read (results-scorecard.txt)'); process.exit(1); }
const atRate = (c, top, rate) => { const rest = sumOf(c) - c[top]; return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, k === top ? rate : v * (1 - rate) / rest])); };
const lower = Number(lp[6]), since = Number(lp[3]);
console.log(`\n3b. THE CREDENCES WITH O191'S LEADING CAUSE AT THE LEAD RATE'S LOWER BOUND (results-scorecard.txt: ${lp[4]} of ${lp[5]}, Laplace ${lp[6]}; the registered ones; ${ND} draws through items())`);
show(credences(atRate(c191, LEAD, lower)), 'CREDENCE ');
console.log(`\n3c. THE SAME AT THE SETTLED-SINCE RATE (results-scorecard.txt: ${lp[1]} of ${lp[2]}, Laplace ${lp[3]}; printed beside)`);
show(credences(atRate(c191, LEAD, since)), '');

// 4. THE BUDGET (grade C on S362 and S370, D on S360 and S364: REF-B's AN logs for AN and, with the step thresholds' and split's
// cost judged at a fifth more, for AN3; REF-B's AR on S362 for AR3; COPY-B's and COPY-X's C logs for C, S362's for S360's and S364's)
const num = (re, t) => { const m = re.exec(t); return m ? Number(m[1]) : NaN; };
const logIn = (d, re) => { try { return readdirSync(R_(d)).filter(f => /^case\d+\.txt$/.test(f)).map(f => readFileSync(join(R_(d), f), 'utf8')).find(t => re.test(t)) || ''; } catch { return ''; } };
const tOf = (d, h, a) => { const t = logIn(d, new RegExp(`^${h}\\s+case \\| job ${a}/P30S6Q5`, 'm')), e = a.replace(/[/+.-]/g, m => `\\${m}`); return num(new RegExp(`solve CAND ${e}/P30S6Q5: table \\S+ secs (\\d+)`), t) + num(new RegExp(`checks ${e}/P30S6Q5: ownTook .* secs (\\d+)`), t); };
const T = { S362: { AN: tOf('diagrefb', 'S362', 'AN'), AR: tOf('diagrefb', 'S362', 'AR'), C: tOf('diagcopyb', 'S362', 'C') }, S370: { AN: tOf('diagrefb', 'S370', 'AN'), C: tOf('diagcopyx', 'S370', 'C') } };
if (![T.S362.AN, T.S362.AR, T.S362.C, T.S370.AN, T.S370.C].every(Number.isFinite)) { console.log(`the budget's inputs did not read (${JSON.stringify(T)})`); process.exit(1); }
const jobSecs = ([h, a]) => (a === 'AN3' ? 1.2 * T[h].AN : a === 'AN' ? T[h].AN : a === 'AR3' ? 1.2 * T.S362.AR : (T[h] || T.S362).C);
const secs = EXPECT.map(jobSecs), cores = [0, 0, 0, 0];
for (const s of secs) { const c = cores.indexOf(Math.min(...cores)); cores[c] += s; }
console.log(`\n4. THE BUDGET (grade C on S362 and S370, D on S364 and S360: REF-B's AN ${T.S362.AN} s on S362 and ${T.S370.AN} s on S370, its AR ${T.S362.AR} s on S362; C ${T.S362.C} s on S362 and ${T.S370.C} s on S370; AN3 and AR3 at a fifth more, judged)`);
console.log(`  the jobs in the batch's order: ${EXPECT.map((j, i) => `${j[0]} ${j[1]} ${f2(secs[i] / 3600)} h`).join('; ')}`);
console.log(`  ${f2(secs.reduce((a, x) => a + x, 0) / 3600)} job-hours; four at a time in that order, the wall about ${f2(Math.max(...cores) / 3600)} h`);
