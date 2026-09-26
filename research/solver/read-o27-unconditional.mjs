/*
 * O27: THE PAST "NO MATERIAL HARM" AND "NO MATERIAL GAIN" READS, RE-READ BY THE UNCONDITIONAL INTERVAL (PLAN.md's register
 * O27 and O28; the eighty-fourth and eighty-fifth reviews, 26 Sep). The registered exact interval (stats.mjs
 * survivalChange) conditions on the number of paths that differ, so a one-sided change reads "no material harm" or "no
 * material gain" too readily, and with no path differing its interval is 0 to 0 whatever the path count.
 * The unconditional one (stats.mjs survivalChangeU, Newcombe 1998 method 10; calibration in results-sim-unconditional.txt)
 * does not. Reported, not a test: each experiment was read as registered, and its verdict stands as recorded; this says
 * which of its reads, and which verdicts built on them, would move. The harm reads rest on the sound side and are not
 * re-read. Old files for a new question (checklist item 3), so each set goes through its reducer's own gates first:
 *   7r (results/diag7r, traces): requireFairLogs over the logs' stamps, one stamp across them, every trace's count, seed,
 *     arm and stamp against the logs' (as read-7r-lost-paths.mjs does). Exact cells. RTIER and RREST against off on S126
 *     and bridge 4 ("carries none" is the no-harm read, reduce-7r.mjs carriesNone) and the outcome built on them, with
 *     reduce-7r.mjs's readCase and decide copied here (it runs its report on import): the copy must reproduce
 *     results-7r.txt's registered outcome and every count, or the gate fails.
 *   7s (results/diag7s, logs): requireFairLogs, reduce-7s.mjs's own gate and reproduction check. g (the reader at 15
 *     points against the reader at 5, "no material gain"), h (the reader at 15 against off at 15, "no material harm"),
 *     item 3 (off at 15 against off at 5, inside +/-0.25) and the outcome; reduce-7s.mjs's decide is copied with the
 *     interval as a parameter, and the copy must reproduce reduce-7s.mjs's own decide on the same rows.
 *   7e (results/bridge7e, logs): requireFairLogs over the files reduce-7e.mjs gates; every row's counts, path count and
 *     registered outcome must reproduce results-7e.txt's. Each case at its latest look (1,000 paths at 0.005, or 3,000 or
 *     8,000 at 0.045), the 30-point cases and no-bridge controls at 0.05; and the pooled floor over the 16 pool cases, the
 *     registered fixed-effect read beside O28's candidate (the cells summed into one unconditional interval).
 * The logs give each arm's survival to 0.1 of a point, not its count: the unconditional interval needs the reference
 * arm's survivors (a + b). Every count consistent with both arms' printed survival and the paired counts is tried, and
 * the read taken at the least favourable one; a read that differs across them is flagged ROUNDING. At 1,000 paths the
 * printed figure fixes the count exactly.
 * THE COUNT CHECK. The unconditional interval is itself too kind where few paths differ and survival is well below 100%
 * (results-sim-unconditional.txt: up to 1.1% at 70% survival and 1,000 paths, nominal 0.25%; with no path differing its
 * half-width shrinks as survival nears 50%: +/-0.31 at 68.8% and 1,000 paths at 0.005, where no loss below about 0.6 points
 * could be ruled out by 0 of 1,000). A bound that needs no approximation: the change B - A is at least minus B's lost share
 * (saves only help) and at most B's saved share, each share's exact one-sided end at level / 2 by Clopper-Pearson. Where
 * the arm loses at least as many paths as it saves the lower bound is nearly exact, and the lower end read is the lower
 * of it and the unconditional one (the least favourable, as for rounding); likewise the upper end where it saves at least
 * as many as it loses. Where the other side's count is larger the bound, which ignores it, is not informative and is not
 * applied. A read the check changes is flagged COUNT CHECK.
 *   node research/solver/read-o27-unconditional.mjs > research/solver/results-o27-unconditional.txt
 *   node research/solver/read-o27-unconditional.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { requireFairLogs } from './fair-gate.mjs';
import { survivalChange, survivalChangeU, clopperPearson, mcnemarHarmP, holm, outcome, marginFor, pooledFE, MARGINS } from './stats.mjs';
import { decode } from './reduce-7t.mjs';
import { cells } from './read-7t-unconditional.mjs';
import * as S7 from './reduce-7s.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), RES = join(HERE, 'results');
const fail = why => { console.log(`FAIR-TEST GATE: FAILED\n  ${why}`); process.exit(1); };

// every survivor count k of N whose printed survival (100 k / N to 0.1) is `sim`
export function countsFor(sim, N) {
  const out = [];
  for (let k = Math.max(0, Math.floor((sim - 0.1) * N / 100)); k <= Math.min(N, Math.ceil((sim + 0.1) * N / 100)); k++) if ((100 * k / N).toFixed(1) === sim.toFixed(1)) out.push(k);
  return out;
}
// the reference arm A's survivor counts consistent with both arms' printed survival, B losing b of A's survivors and saving c
export const refCounts = (simA, simB, b, c, N) => { const kB = new Set(countsFor(simB, N)); return countsFor(simA, N).filter(k => kB.has(k - b + c)); };
// the unconditional interval over every consistent count: its lowest lower end and highest upper end, and whether a read
// (a function of the interval) differs between them
export function unconditionalOver(ks, b, c, N, level, read) {
  if (!ks.length) return null;
  const ivs = ks.map(k => survivalChangeU(k - b, b, c, N - k - c, level));
  const reads = new Set(ivs.map(read));
  return { d: ivs[0].d, lo: Math.min(...ivs.map(x => x.lo)), hi: Math.max(...ivs.map(x => x.hi)), rounding: reads.size > 1, ks };
}
// the count check: the interval's ends widened, where they apply, to the exact bounds from the one-sided counts
const cpMemo = new Map();
const cpUpper = (k, N, level) => { const key = `${k}|${N}|${level}`; if (!cpMemo.has(key)) cpMemo.set(key, clopperPearson(k, N, level)[1]); return cpMemo.get(key); };
export function guarded(u, lost, saved, N, level) {
  const bh = -100 * cpUpper(lost, N, level), bg = 100 * cpUpper(saved, N, level);
  const lo = saved <= lost ? Math.min(u.lo, bh) : u.lo, hi = lost <= saved ? Math.max(u.hi, bg) : u.hi;
  return { ...u, lo, hi, m10: { lo: u.lo, hi: u.hi } };
}
const checked = (g, read) => (read(g) !== read(g.m10) ? '; COUNT CHECK' : '');
const f2 = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`, iv = x => `${x.lo.toFixed(2)} to ${x.hi.toFixed(2)}`;

// reduce-7r.mjs's readCase and decide (lines 167-181), with "carries none" as a parameter; checked against results-7r.txt
const readCase7r = (T, R, pT, pR, none) => { const t = T.lost > T.saved && pT < 0.05, r = R.lost > R.saved && pR < 0.05, tn = none(T), rn = none(R); return t && r ? 'both' : t && rn ? 'tier' : r && tn ? 'method' : tn && rn ? 'neither' : 'unresolved'; };
function decide7r(swaps, reproduced, none) {
  const ps = holm(['S126', 'bridge 4'].flatMap(id => [mcnemarHarmP(swaps[id].RTIER.lost, swaps[id].RTIER.saved), mcnemarHarmP(swaps[id].RREST.lost, swaps[id].RREST.saved)]));
  const reads = ['S126', 'bridge 4'].map((id, j) => readCase7r(swaps[id].RTIER, swaps[id].RREST, ps[2 * j], ps[2 * j + 1], none));
  const counted = reads.filter((_, j) => reproduced[j]);
  const outcome7r = !counted.length ? 'INCONCLUSIVE' : counted.includes('tier') && !counted.some(x => x === 'method' || x === 'both') ? 'HELD'
    : counted.includes('method') && !counted.some(x => x === 'tier' || x === 'both') ? 'FALSIFIED' : 'INCONCLUSIVE';
  return { outcome: outcome7r, reads };
}
// reduce-7s.mjs's decide (lines 109-121; reduce-7t.mjs's decide is the same rule), with the g and h intervals given per row
export function decide7s(rows, gIv, hIv) {
  const pGain = holm(rows.map(r => mcnemarHarmP(r.g.saved, r.g.lost))), pHarm = holm(rows.map(r => mcnemarHarmP(r.h.lost, r.h.saved)));
  const reads = rows.map((r, j) => {
    const gi = gIv(r), hi = hIv(r);
    const gains = r.g.saved > r.g.lost && pGain[j] < S7.ALPHA, noGain = gi.hi < S7.MARGIN;
    const harms = r.h.lost > r.h.saved && pHarm[j] < S7.ALPHA && -hi.d >= S7.MARGIN, noHarm = hi.lo > -S7.MARGIN;
    return { id: r.id, read: gains && noHarm ? 'cures' : !gains && noGain && harms ? 'does not cure' : 'partial', gi, hi, noGain, noHarm };
  });
  return { outcome: reads.every(x => x.read === 'cures') ? 'HELD' : reads.every(x => x.read === 'does not cure') ? 'FALSIFIED' : 'INCONCLUSIVE', reads };
}
// one 7e log's cases, as reduce-7e.mjs parses them (its CELL; up and dn are against the case's first arm)
const CELL = /(\S+) table\s+(-?[\d.]+) sim\s+(-?[\d.]+) gap\s+(-?[\d.]+) tier-below\s+(-?[\d.]+) below\s+(-?[\d.]+) (\d+) s(?: d ([+-]?[\d.]+) se ([\d.]+) \((\d+)\/(\d+)\))?/;
export function parse7e(text) {
  const cases = [];
  for (const line of (text || '').split('\n')) {
    if (!/ \| \S+ table /.test(line)) continue;
    const parts = line.split(' | '), arms = {};
    for (const p of parts.slice(1)) { const m = CELL.exec(p); if (m) arms[m[1]] = { sim: +m[3], up: m[10] !== undefined ? +m[10] : 0, dn: m[11] !== undefined ? +m[11] : 0 }; }
    cases.push({ id: parts[0].slice(0, 16).trim(), arms });
  }
  return cases;
}

// PLANTED, before any real file (rule 6)
function planted() {
  const cases = [];
  cases.push(['99.3 of 1,000 is exactly 993', countsFor(99.3, 1000).join(','), '993']);
  cases.push(['99.3 of 3,000 is 2,978 to 2,980', countsFor(99.3, 3000).join(','), '2978,2979,2980']);
  // S126 in 7s: the reader at 5 points 99.3, at 15 points 99.3, the 15 losing 1 and saving 0: A's count must be one B's count allows
  cases.push(['both arms constrain the reference count', refCounts(99.3, 99.3, 1, 0, 3000).join(','), '2979,2980']);
  cases.push(['no consistent count is refused (null), not read', String(unconditionalOver(refCounts(99.3, 90.0, 1, 0, 3000), 1, 0, 3000, 0.05, x => x.lo > -0.25)), 'null']);
  // 0 of 1,000 differing at 99%: the registered interval is 0 to 0 (no material harm), the unconditional one is not
  const z = unconditionalOver([990], 0, 0, 1000, 0.005, x => x.lo > -0.25);
  cases.push(['0 of 1,000 at 0.005: registered no material harm, unconditional not', `${survivalChange(0, 0, 1000, 0.005).lo > -0.25} ${z.lo > -0.25}`, 'true false']);
  // a read that flips inside the band of counts is flagged: at 3,000 paths, 0.045, 4 lost, the lower end runs from about
  // -0.29 (2,400 survivors) to -0.35 (2,999), so a bound of -0.3 is crossed inside it
  const band = [2400, 2700, 2999].map(k => survivalChangeU(k - 4, 4, 0, 3000 - k, 0.045).lo);
  const flip = band.some(x => x > -0.3) && band.some(x => x <= -0.3);
  const ov = unconditionalOver([2400, 2700, 2999], 4, 0, 3000, 0.045, x => x.lo > -0.3);
  cases.push(['a read that differs across the counts is flagged ROUNDING, and the least favourable end is kept', flip ? `${ov.rounding} ${ov.lo === Math.min(...band)}` : 'no flip planted', 'true true']);
  // the count check: 0 of 1,000 differing at 68.8% survival (S128 in 7e), 0.005, margin 0.5: the unconditional interval
  // reads no material harm, the exact bound (0 lost of 1,000: -0.60) does not; at 99.8% and 3,000 paths, 2 lost, 0.05,
  // margin 0.25 (7r's bridge 4 RREST): both read none
  const s128 = guarded(survivalChangeU(688, 0, 0, 312, 0.005), 0, 0, 1000, 0.005), h = y => y.lo > -0.5;
  cases.push(['the count check overrules the unconditional interval at 0 of 1,000 and 68.8%', `${h(s128.m10)} ${h(s128)} ${s128.lo.toFixed(2)} ${checked(s128, h) !== ''}`, 'true false -0.60 true']);
  const rr = guarded(survivalChangeU(2992, 2, 0, 6, 0.05), 2, 0, 3000, 0.05), h2 = y => y.lo > -0.25;
  cases.push(['the count check agrees at 2 lost of 3,000 and 99.8%', `${h2(rr.m10)} ${h2(rr)} ${checked(rr, h2) === ''}`, 'true true true']);
  const gain = guarded(survivalChangeU(900, 0, 36, 64, 0.005), 0, 36, 1000, 0.005);
  cases.push(['the lower bound is not applied where the arm saves more than it loses', `${gain.lo === gain.m10.lo}`, 'true']);
  // the 7e parse: a READER cell's (up/dn)
  const p = parse7e('S126             a0 | OFF table  55.8 sim  99.6 gap  -44.0 tier-below 40.0 below  1.6 430 s | READER table  99.6 sim  99.3 gap    0.2 tier-below  8.7 below  2.7 432 s d -0.3 se 0.1 (1/4)');
  cases.push(['the 7e parse reads the case, its arms and the reader\'s saved/lost', `${p[0].id} ${p[0].arms.OFF.sim} ${p[0].arms.READER.sim} ${p[0].arms.READER.up} ${p[0].arms.READER.dn}`, 'S126 99.6 99.3 1 4']);
  // the 7r copy: the tier carries it on both cases (RTIER harms, RREST carries none) -> HELD; bridge 4's RREST (2 lost)
  // not "none" -> bridge 4 unresolved, and HELD still (reduce-7r.mjs's decide asks for a tier on some case and a method
  // or both on none); no RREST "none" -> both unresolved -> INCONCLUSIVE
  const x = (lost, saved) => ({ lost, saved, N: 3000 });
  const sw = { S126: { RTIER: x(14, 0), RREST: x(0, 0) }, 'bridge 4': { RTIER: x(10, 0), RREST: x(2, 0) } };
  const d7 = none => { const r = decide7r(sw, [true, true], none); return `${r.outcome} ${r.reads.join('/')}`; };
  cases.push(['the 7r copy: both tier -> HELD', d7(() => true), 'HELD tier/tier']);
  cases.push(['the 7r copy: bridge 4 RREST not "none" -> tier/unresolved, HELD', d7(w => w.lost === 0), 'HELD tier/unresolved']);
  cases.push(['the 7r copy: no RREST "none" -> INCONCLUSIVE', d7(() => false), 'INCONCLUSIVE unresolved/unresolved']);
  // the 7s copy reproduces reduce-7s.mjs's decide on its own planted-style rows
  const rows = [{ id: 'S126', g: { saved: 0, lost: 1 }, h: { saved: 0, lost: 16 } }, { id: 'bridge 4', g: { saved: 30, lost: 2 }, h: { saved: 0, lost: 2 } }];
  const reg = r => survivalChange(r.lost, r.saved, S7.N, S7.ALPHA), mine = decide7s(rows, r => reg(r.g), r => reg(r.h)), theirs = S7.decide(rows);
  cases.push(['the 7s copy agrees with reduce-7s.mjs\'s decide', `${mine.outcome} ${mine.reads.map(r => r.read).join('/')}`, `${theirs.outcome} ${theirs.reads.map(r => r.read).join('/')}`]);
  // and where g saves as many as it loses (not a gain) and h loses nothing (partial, not a cure)
  const rows2 = [{ id: 'S126', g: { saved: 1, lost: 1 }, h: { saved: 0, lost: 0 } }, { id: 'bridge 4', g: { saved: 3, lost: 0 }, h: { saved: 0, lost: 20 } }];
  const mine2 = decide7s(rows2, r => reg(r.g), r => reg(r.h)), theirs2 = S7.decide(rows2);
  cases.push(['the 7s copy agrees on a tie and a harm', `${mine2.outcome} ${mine2.reads.map(r => r.read).join('/')}`, `${theirs2.outcome} ${theirs2.reads.map(r => r.read).join('/')}`]);
  let bad = 0;
  for (const [name, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED: ${bad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

// 7R: exact cells from the traces
function read7r() {
  const DIR = join(RES, 'diag7r'), PRED = 'research/solver/predictions/diag-7r.md', N = 3000, SEED = '7002';
  const logs = Object.fromEntries(readdirSync(DIR).filter(f => /^part\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  if (Object.keys(logs).length !== 5) fail(`7r: ${Object.keys(logs).length} of 5 logs`);
  requireFairLogs(logs, PRED);
  const stampOf = t => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(t); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
  const ST = stampOf(Object.values(logs)[0]);
  if (!ST || Object.values(logs).some(t => JSON.stringify(stampOf(t)) !== JSON.stringify(ST))) fail("7r: the logs' stamp lines are missing or differ");
  const load = (cs, arm) => {
    const f = join(DIR, `${cs}-${arm.toLowerCase()}.json.gz`);
    if (!existsSync(f)) fail(`7r: no trace ${f}`);
    const j = JSON.parse(gunzipSync(readFileSync(f)).toString());
    if (j.N !== N || String(j.seed) !== SEED || j.arm !== arm || !['code', 'audit', 'prediction', 'sha'].every(k => j.stamp && j.stamp[k] === ST[k])) fail(`7r: ${f}: count, seed, arm or stamp is not the logs'`);
    return decode(j).survived;
  };
  // results-7r.txt's counts and outcome, which the copy must reproduce
  const txt = readFileSync(join(HERE, 'results-7r.txt'), 'utf8'), want = {};
  let cur = null;
  for (const l of txt.split('\n')) {
    const h = /^(S126|bridge 4|S366) \((\S+) against OFF.*?: saved (\d+), lost (\d+)/.exec(l);
    if (h) { cur = h[1]; want[`${cur}|${h[2]}`] = `${h[3]}/${h[4]}`; continue; }
    const s = /^\s+(RTIER|RREST) \(.*\) against OFF: saved (\d+), lost (\d+)/.exec(l);
    if (s && cur) want[`${cur}|${s[1]}`] = `${s[2]}/${s[3]}`;
  }
  const regOut = /^OUTCOME: (\S+) - .*\(S126 (\w+); bridge 4 (\w+)\)/m.exec(txt);
  if (!regOut || Object.keys(want).length !== 7) fail(`7r: results-7r.txt does not give the 7 counts and the outcome (${Object.keys(want).length} counts)`);
  const leg = (id, arm, base = 'OFF') => { const k = cells(load(id.replace(/ /g, '_'), base), load(id.replace(/ /g, '_'), arm)); return { ...k, lost: k.b, saved: k.c }; };
  const got = {};
  for (const id of ['S126', 'bridge 4']) for (const arm of ['READER', 'RTIER', 'RREST']) got[`${id}|${arm}`] = leg(id, arm);
  got['S366|V1'] = leg('S366', 'V1');
  for (const [k, w] of Object.entries(want)) if (!got[k] || `${got[k].saved}/${got[k].lost}` !== w) fail(`7r: ${k} saved/lost ${got[k] ? `${got[k].saved}/${got[k].lost}` : 'missing'}, results-7r.txt ${w}`);
  const hp = holm(['S126', 'bridge 4'].map(id => mcnemarHarmP(got[`${id}|READER`].lost, got[`${id}|READER`].saved)));
  const reproduced = ['S126', 'bridge 4'].map((id, j) => got[`${id}|READER`].lost > got[`${id}|READER`].saved && hp[j] < 0.05);
  const swaps = Object.fromEntries(['S126', 'bridge 4'].map(id => [id, { RTIER: got[`${id}|RTIER`], RREST: got[`${id}|RREST`] }]));
  const noneR = w => survivalChange(w.lost, w.saved, w.N, 0.05).lo > -0.25, gU = w => guarded(survivalChangeU(w.a, w.b, w.c, w.d, 0.05), w.lost, w.saved, w.N, 0.05), noneU = w => gU(w).lo > -0.25;
  const R = decide7r(swaps, reproduced, noneR), U = decide7r(swaps, reproduced, noneU);
  if (R.outcome !== regOut[1] || R.reads.join(',') !== `${regOut[2]},${regOut[3]}`) fail(`7r: the copy reads ${R.outcome} (${R.reads.join(', ')}), results-7r.txt ${regOut[1]} (${regOut[2]}, ${regOut[3]})`);
  console.log(`7R (results/diag7r; the logs' stamp gate, every trace's count, seed, arm and stamp, and results-7r.txt's ${Object.keys(want).length} counts and outcome reproduced): ${N} paths, 0.05, margin 0.25`);
  const moves = [];
  for (const id of ['S126', 'bridge 4']) for (const arm of ['RTIER', 'RREST']) {
    const w = got[`${id}|${arm}`], r = survivalChange(w.lost, w.saved, N, 0.05), u = gU(w), rn = r.lo > -0.25, un = u.lo > -0.25;
    console.log(`  ${id.padEnd(9)} ${arm} against OFF: ${w.lost} lost, ${w.saved} saved: ${f2(r.d)}; registered (${iv(r)}), unconditional (${iv(u)}${checked(u, x => x.lo > -0.25)}); carries none: registered ${rn ? 'yes' : 'no'}, unconditional ${un ? 'yes' : 'no'}${rn !== un ? '  <-- MOVES' : ''}`);
    if (rn !== un) moves.push(`7r ${id} ${arm} "carries none" ${rn ? 'yes -> no' : 'no -> yes'}`);
  }
  const s366 = got['S366|V1'], q = survivalChangeU(s366.a, s366.b, s366.c, s366.d, 0.05);
  console.log(`  S366 V1 against OFF (O23): ${s366.lost} lost, ${s366.saved} saved: read "replicated" on the harm side, which stands; unconditional (${iv(q)}) reported`);
  console.log(`  the outcome: registered ${R.outcome} (S126 ${R.reads[0]}; bridge 4 ${R.reads[1]}), unconditional ${U.outcome} (S126 ${U.reads[0]}; bridge 4 ${U.reads[1]})${R.outcome !== U.outcome ? '  <-- MOVES' : ''}\n`);
  if (R.outcome !== U.outcome) moves.push(`7r's outcome ${R.outcome} -> ${U.outcome}`);
  return moves;
}

// 7S: the logs, with each reference arm's count over the rounding band
function read7s() {
  const DIR = join(RES, 'diag7s');
  const logs = Object.fromEntries(readdirSync(DIR).filter(f => /\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(DIR, f), 'utf8')]));
  requireFairLogs(logs, S7.PRED);
  const cs = Object.values(logs).flatMap(S7.parse), bad = S7.gate(cs);
  if (bad.length) fail(`7s: ${bad.join('; ')}`);
  for (const id of S7.CASES) { const c = cs.find(x => x.id === id); if (!c) fail(`7s: no ${id}`); const why = S7.reproduced(c); if (why.length) fail(`7s: ${id} does not reproduce 7r: ${why.join('; ')}`); }
  const rows = S7.rowsOf(cs), theirs = S7.decide(rows);
  const reg = x => survivalChange(x.lost, x.saved, S7.N, S7.ALPHA);
  const mineR = decide7s(rows, r => reg(r.g), r => reg(r.h));
  if (mineR.outcome !== theirs.outcome || mineR.reads.map(r => r.read).join() !== theirs.reads.map(r => r.read).join()) fail(`7s: the copy reads ${mineR.outcome}, reduce-7s.mjs ${theirs.outcome}`);
  const sim = (id, arm) => cs.find(x => x.id === id).arms.find(a => a.label === arm).sim;
  // B against A: the pair's saved/lost, A's count over the band both arms' printed survival allow
  const U = (id, A, B, x, read) => { const u = unconditionalOver(refCounts(sim(id, A), sim(id, B), x.lost, x.saved, S7.N), x.lost, x.saved, S7.N, S7.ALPHA, read); if (!u) fail(`7s: ${id} ${B}-${A}: no count agrees with both arms' survival`); return guarded(u, x.lost, x.saved, S7.N, S7.ALPHA); };
  const gRead = x => x.hi < S7.MARGIN, hRead = x => x.lo > -S7.MARGIN;
  const mineU = decide7s(rows, r => U(r.id, 'READER', 'READER@15', r.g, gRead), r => U(r.id, 'OFF@15', 'READER@15', r.h, hRead));
  console.log(`7S (results/diag7s; the logs' stamp gate, reduce-7s.mjs's gate and reproduction check, and its decide reproduced): ${S7.N} paths, ${S7.ALPHA}, margin ${S7.MARGIN}`);
  const moves = [];
  for (const [j, r] of rows.entries()) {
    const a = mineR.reads[j], b = mineU.reads[j];
    const gm = a.noGain !== b.noGain, hm = a.noHarm !== b.noHarm;
    console.log(`  ${r.id.padEnd(9)} g READER@15 against READER: ${r.g.lost} lost, ${r.g.saved} saved: registered (${iv(a.gi)}), unconditional (${iv(b.gi)}${b.gi.rounding ? '; ROUNDING' : ''}${checked(b.gi, gRead)}); no material gain: registered ${a.noGain ? 'yes' : 'no'}, unconditional ${b.noGain ? 'yes' : 'no'}${gm ? '  <-- MOVES' : ''}`);
    console.log(`  ${''.padEnd(9)} h READER@15 against OFF@15: ${r.h.lost} lost, ${r.h.saved} saved: registered (${iv(a.hi)}), unconditional (${iv(b.hi)}${b.hi.rounding ? '; ROUNDING' : ''}${checked(b.hi, hRead)}); no material harm: registered ${a.noHarm ? 'yes' : 'no'}, unconditional ${b.noHarm ? 'yes' : 'no'}${hm ? '  <-- MOVES' : ''}`);
    const o = cs.find(x => x.id === r.id).pairs['OFF@15-OFF'], ro = reg(o), uo = U(r.id, 'OFF', 'OFF@15', o, x => x.lo > -S7.MARGIN && x.hi < S7.MARGIN);
    const inside = x => x.lo > -S7.MARGIN && x.hi < S7.MARGIN, rIn = inside(ro), uIn = inside(uo);
    console.log(`  ${''.padEnd(9)} item 3, OFF@15 against OFF: ${o.lost} lost, ${o.saved} saved: registered (${iv(ro)}), unconditional (${iv(uo)}${uo.rounding ? '; ROUNDING' : ''}${checked(uo, inside)}); inside +/-${S7.MARGIN}: registered ${rIn ? 'yes' : 'no'}, unconditional ${uIn ? 'yes' : 'no'}${rIn !== uIn ? '  <-- MOVES' : ''}`);
    console.log(`  ${''.padEnd(9)} the case: registered ${a.read}, unconditional ${b.read}${a.read !== b.read ? '  <-- MOVES' : ''}`);
    if (gm) moves.push(`7s ${r.id} g "no material gain" ${a.noGain ? 'yes -> no' : 'no -> yes'}`);
    if (hm) moves.push(`7s ${r.id} h "no material harm" ${a.noHarm ? 'yes -> no' : 'no -> yes'}`);
    if (rIn !== uIn) moves.push(`7s ${r.id} item 3 ${rIn ? 'held -> missed' : 'missed -> held'}`);
  }
  console.log(`  the outcome: registered ${mineR.outcome}, unconditional ${mineU.outcome}${mineR.outcome !== mineU.outcome ? '  <-- MOVES' : ''}\n`);
  if (mineR.outcome !== mineU.outcome) moves.push(`7s's outcome ${mineR.outcome} -> ${mineU.outcome}`);
  return moves;
}

// 7E: the logs, each case at its latest look
function read7e() {
  const DIR = join(RES, 'bridge7e'), PRED = 'research/solver/predictions/bridge-reader.md';
  const rd = f => (existsSync(join(DIR, f)) ? readFileSync(join(DIR, f), 'utf8') : null);
  const files = ['part0.txt', 'part1.txt', 'part2.txt', 'part3.txt', 'controls.txt', 's360-quad.txt', 'p30.txt', 'time30.txt', 'look2.txt'];
  const logs = Object.fromEntries(files.map(f => [f, rd(f)]));
  const missing = files.filter(f => logs[f] === null);
  if (missing.length) fail(`7e: missing ${missing.join(', ')}`);
  requireFairLogs(logs, PRED);
  const main = ['part0.txt', 'part1.txt', 'part2.txt', 'part3.txt'].flatMap(f => parse7e(logs[f])), look2 = parse7e(logs['look2.txt']);
  const LONG = ['bridge 4', 'wealth x0.5', 'S130', 'S128'];
  const row = (c, N, level, tag = '') => { const o = c.arms.OFF, r = c.arms.READER; if (!o || !r) fail(`7e: ${c.id} lacks OFF or READER`); return { id: `${c.id}${tag}`, b: r.dn, c: r.up, N, level, simA: o.sim, simB: r.sim, margin: marginFor(o.sim) }; };
  const fam = rows => { const adj = holm(rows.map(x => mcnemarHarmP(x.b, x.c))); rows.forEach((x, i) => { x.pHolm = adj[i]; x.res = outcome({ b: x.b, c: x.c, N: x.N, margin: x.margin, pHolm: x.pHolm, level: x.level }); }); return rows; };
  const prim = fam(main.map(c => { const l2 = look2.find(k => k.id === c.id); return l2 ? { ...row(l2, LONG.includes(c.id) ? 8000 : 3000, 0.045), look: 2 } : { ...row(c, 1000, 0.005), look: 1 }; }));
  const r30 = fam(parse7e(logs['p30.txt']).map(c => row(c, 1000, 0.05, ' @30'))), ctl = fam(parse7e(logs['controls.txt']).map(c => row(c, 1000, 0.05, ' (control)')));
  const all = [...prim, ...r30, ...ctl];
  // results-7e.txt's rows, which these must reproduce
  const want = {};
  for (const l of readFileSync(join(HERE, 'results-7e.txt'), 'utf8').split('\n')) { const m = /^ {3}(.+?)\s+(\d+) lost\s+(\d+) saved of (\d+)\s+p .* -> ([a-z ]+?)( \(look 2\))?$/.exec(l); if (m) want[m[1]] = `${m[2]}/${m[3]}/${m[4]}/${m[5]}`; }
  if (Object.keys(want).length !== all.length) fail(`7e: results-7e.txt has ${Object.keys(want).length} rows, the logs ${all.length}`);
  for (const x of all) { const g = `${x.b}/${x.c}/${x.N}/${x.res.outcome}`; if (want[x.id] !== g) fail(`7e: ${x.id} reads ${g}, results-7e.txt ${want[x.id] || 'no row'}`); }
  console.log(`7E (results/bridge7e; the logs' stamp gate, and results-7e.txt's ${all.length} rows reproduced: counts, path counts and registered outcomes)`);
  console.log('  each case at its latest look (1,000 paths at 0.005, or look 2: 3,000 or 8,000 at 0.045); the 30-point cases and the controls at 0.05');
  const moves = [], flips = [];
  for (const x of all) {
    const u0 = unconditionalOver(refCounts(x.simA, x.simB, x.b, x.c, x.N), x.b, x.c, x.N, x.level, y => y.lo > -x.margin);
    if (!u0) fail(`7e: ${x.id}: no count agrees with both arms' survival`);
    const u = guarded(u0, x.b, x.c, x.N, x.level);
    x.u = u;
    const uo = u.lo > -x.margin ? 'no material harm' : x.res.outcome === 'harm' ? 'harm' : 'inconclusive';
    x.uo = uo;
    const mv = uo !== x.res.outcome;
    console.log(`  ${x.id.padEnd(20)} ${String(x.b).padStart(3)} lost ${String(x.c).padStart(3)} saved of ${String(x.N).padStart(4)} at ${x.level}, margin ${x.margin}: registered (${iv(x.res)}) ${x.res.outcome}; unconditional (${iv(u)}${u.rounding ? '; ROUNDING' : ''}${checked(u, y => y.lo > -x.margin)}) ${uo}${mv ? '  <-- MOVES' : ''}`);
    if (mv) flips.push(x);
  }
  const byLook = k => flips.filter(x => (k === 1 ? x.look === 1 : k === 2 ? x.look === 2 : x.look === undefined));
  if (flips.length) moves.push(`7e: ${flips.length} of ${all.length} reads move from "${flips[0].res.outcome}" to "${flips[0].uo}"${flips.some(x => x.res.outcome !== flips[0].res.outcome || x.uo !== flips[0].uo) ? ' (not all the same way: see the rows)' : ''} - ${byLook(1).length} at look 1 (1,000 paths), ${byLook(2).length} at look 2, ${byLook(0).length} of the 30-point cases and controls (1,000 paths at 0.05)`);
  // the pooled floor over the 16 pool cases at their latest look: the registered fixed-effect read, and O28's candidate
  const POOL = ['S126', 'share 0.90', 'bridge 1', 'bridge 4', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'bridge 6', 'S366', 'S162', 'S172', 'S168'];
  const pc = POOL.map(id => prim.find(x => x.id === id));
  if (pc.some(x => !x)) fail('7e: a pool case is missing');
  const fe = pooledFE(pc.map(x => ({ b: x.b, c: x.c, N: x.N })));
  const summed = end => { let a = 0, b = 0, c = 0, d = 0; for (const x of pc) { const k = end(x.u.ks); a += k - x.b; b += x.b; c += x.c; d += x.N - k - x.c; } return survivalChangeU(a, b, c, d, 0.05); };
  const s1 = summed(ks => Math.min(...ks)), s2 = summed(ks => Math.max(...ks)), lo = Math.min(s1.lo, s2.lo), hi = Math.max(s1.hi, s2.hi), floor = -MARGINS.pooled;
  console.log(`  POOLED over the ${pc.length} pool cases, the floor ${floor}: registered fixed effect ${f2(fe.mean)} (${fe.lo.toFixed(3)} to ${fe.hi.toFixed(3)}) ${fe.lo > floor ? 'holds' : 'fires'}; O28's candidate (the cells summed, unconditional, 95%) ${f2(s1.d)} (${lo.toFixed(3)} to ${hi.toFixed(3)}) ${lo > floor ? 'holds' : 'fires'}${(fe.lo > floor) !== (lo > floor) ? '  <-- MOVES' : ''}`);
  console.log(`  7e's verdict (FALSIFIED: harm on S126 and bridge 4) rests on the harm side and stands\n`);
  if ((fe.lo > floor) !== (lo > floor)) moves.push(`7e's pooled floor ${fe.lo > floor ? 'holds -> fires' : 'fires -> holds'} under O28's candidate`);
  return moves;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  console.log('O27: THE PAST NO-HARM AND NO-GAIN READS, THE REGISTERED INTERVAL BESIDE THE UNCONDITIONAL ONE (reported, not a test: each experiment stands as read)\n');
  const moves = [...read7r(), ...read7s(), ...read7e()];
  console.log(`WHAT MOVES (${moves.length}):${moves.length ? `\n  ${moves.join('\n  ')}` : ' nothing'}`);
}
