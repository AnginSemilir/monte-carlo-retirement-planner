/*
 * O22'S TRACE, READ AGAINST ITS PREDICTION (predictions/o22-trace.md; PLAN.md O22). Reads the four arms audit-s126.mjs's
 * trace mode wrote (results/o22-trace/<case>-<arm>.json.gz): 5 or 15 return points, each with the final year averaged
 * (q5, q15 - 7i's own arms) or exact (q5x, q15x), F1 off, the tier above allowed, on the same 1,000 paths.
 * THE FAIR-TEST GATE comes first, and nothing is scored if it fails: each pairing's two "ran" lines must be identical but
 * for the one thing it tests (quad, or finalIntegral), at the settings the prediction names.
 * Then: the reproduction check against 7i (results-bridgequad.txt), the paired survival differences (whole counts; the tie
 * rule: beyond two se is net^2 > 4 x discordant, exactly two se is AT THE LINE, 0 of 0 is no change), each item and the
 * falsifier, and - descriptive, not an item - where the paths 15 points save first move differently.
 *   node research/solver/reduce-o22.mjs [case=S360]
 */
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ID = process.argv[2] || 'S360';
const un = (b, T) => { const u = Buffer.from(b, 'base64'); return new T(u.buffer, u.byteOffset, u.byteLength / T.BYTES_PER_ELEMENT); };
const load = arm => {
  const p = join(HERE, 'results', 'o22-trace', `${ID}-${arm}.json.gz`);
  if (!existsSync(p)) { console.error(`reduce-o22: missing ${p}`); process.exit(1); }
  const j = JSON.parse(gunzipSync(readFileSync(p)).toString());
  return { ...j, survived: un(j.survived, Uint8Array), level: un(j.level, Uint8Array), tier: un(j.tier, Uint8Array), wealth: un(j.wealth, Float32Array), penShare: un(j.penShare, Uint8Array), failYear: un(j.failYear, Int16Array) };
};
const A = { q5: load('q5'), q15: load('q15'), q5x: load('q5x'), q15x: load('q15x') };

// THE FAIR-TEST GATE
const field = (ran, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(ran || ''); return m ? m[1] : null; };
const strip = (ran, k) => ran.replace(new RegExp(` ${k} \\S+`), '');
const want = { mix: '3', pts: '16', grid: 'total16x6x6', lambda: '0.0223606797749979', raiseSurv: 'true', failShort: 'floor', tiersAbove: '1', minPot: '5000', bridgeRead: 'false' };
const armWant = { q5: ['5', 'false'], q15: ['15', 'false'], q5x: ['5', 'true'], q15x: ['15', 'true'] };
const PAIRS = [['q5', 'q15', 'quad'], ['q5', 'q5x', 'finalIntegral'], ['q5x', 'q15x', 'quad'], ['q15', 'q15x', 'finalIntegral']];
const gate = (arms, pairs) => {
  const bad = [];
  for (const [k, x] of Object.entries(arms)) {
    for (const [f, v] of Object.entries(want)) if (field(x.ran, f) !== v) bad.push(`${k}: ${f} is ${field(x.ran, f)}, the prediction names ${v}`);
    if (field(x.ran, 'quad') !== armWant[k][0] || field(x.ran, 'finalIntegral') !== armWant[k][1]) bad.push(`${k}: quad ${field(x.ran, 'quad')} finalIntegral ${field(x.ran, 'finalIntegral')}, the arm is ${armWant[k].join(' / ')}`);
    if (x.N !== arms.q5.N) bad.push(`${k}: ${x.N} paths against ${arms.q5.N}`);
  }
  for (const [a, b, k] of pairs) if (strip(arms[a].ran, k) !== strip(arms[b].ran, k)) bad.push(`${a} / ${b}: the ran lines differ beyond ${k}`);
  return bad;
};
{ // planted: a copy of the arms with q15x's lambda changed must fail the gate
  const P = JSON.parse(JSON.stringify({ q5: { ran: A.q5.ran, N: 1 }, q15: { ran: A.q15.ran, N: 1 }, q5x: { ran: A.q5x.ran, N: 1 }, q15x: { ran: A.q15x.ran.replace(/lambda \S+/, 'lambda 0.5'), N: 1 } }));
  if (!gate(P, PAIRS).length) { console.log('PLANTED CHECK FAILED: the gate passed a changed lambda'); process.exit(1); }
}
console.log(`O22 TRACE, ${ID}, READ AGAINST predictions/o22-trace.md`);
const bad = gate(A, PAIRS);
if (bad.length) { console.log(`\nFAIR-TEST GATE: FAILED - nothing is scored\n  ${bad.join('\n  ')}`); process.exit(1); }
console.log('\nFAIR-TEST GATE: passed - each pairing\'s two arms ran the same settings but the one tested (quad or finalIntegral), at the named settings\n');

const N = A.q5.N, Y = A.q5.Y;
const pair = (a, b) => { let disc = 0, net = 0; for (let i = 0; i < N; i++) if (a.survived[i] !== b.survived[i]) { disc++; net += b.survived[i] ? 1 : -1; } return { d: 100 * net / N, se: 100 * Math.sqrt(disc) / N, net, disc }; };
const V = x => (x.net !== 0 && x.net * x.net === 4 * x.disc ? 'AT THE LINE' : x.net * x.net > 4 * x.disc ? 'beyond two se' : 'within');
if (V({ net: -4, disc: 4 }) !== 'AT THE LINE' || V({ net: 20, disc: 22 }) !== 'beyond two se' || V({ net: 3, disc: 7 }) !== 'within' || V({ net: 0, disc: 0 }) !== 'within') { console.log('PLANTED CHECK FAILED: the tie rule'); process.exit(1); }
const sg = x => (x >= 0 ? '+' : '') + x.toFixed(2), show = x => `${sg(x.d)} +/- ${x.se.toFixed(2)} (net ${x.net} of ${x.disc} discordant; ${V(x)})`;
for (const k of ['q5', 'q15', 'q5x', 'q15x']) console.log(`  ${k.padEnd(5)} table ${A[k].table.toFixed(1).padStart(5)} sim ${A[k].sim.toFixed(1).padStart(5)}`);
const P = { all: pair(A.q5, A.q15), fin5: pair(A.q5, A.q5x), early: pair(A.q5x, A.q15x), fin15: pair(A.q15, A.q15x) };
console.log(`\n  15 - 5 points, the final year averaged (7i's pairing): ${show(P.all)}`);
console.log(`  exact - averaged final year, 5 points:               ${show(P.fin5)}`);
console.log(`  15 - 5 points, the final year exact:                  ${show(P.early)}`);
console.log(`  exact - averaged final year, 15 points:              ${show(P.fin15)}`);

// the reproduction check: q5 / q15 against 7i's S360 line
let rep = 'not checked (no 7i line)';
try {
  const L = readFileSync(join(HERE, 'results-bridgequad.txt'), 'utf8').split('\n').find(l => new RegExp(`^${ID}\\s+\\| Q5 table`).test(l));
  const m = L && /Q5 table\s+([\d.]+) sim\s+([\d.]+).*Q15 table\s+([\d.]+) sim\s+([\d.]+).*\(net (-?\d+) of (\d+) discordant\)/.exec(L);
  if (m) {
    const okT = [[A.q5.table, m[1]], [A.q5.sim, m[2]], [A.q15.table, m[3]], [A.q15.sim, m[4]]].every(([x, y]) => Math.abs(x - Number(y)) <= 0.1);
    rep = `7i ${m[1]} / ${m[2]} and ${m[3]} / ${m[4]}, net ${m[5]} of ${m[6]}; now ${A.q5.table.toFixed(1)} / ${A.q5.sim.toFixed(1)} and ${A.q15.table.toFixed(1)} / ${A.q15.sim.toFixed(1)}, net ${P.all.net} of ${P.all.disc} -> ${okT && P.all.net === Number(m[5]) && P.all.disc === Number(m[6]) ? 'reproduced' : 'DIFFERS'}`;
  }
} catch { rep = 'results-bridgequad.txt not found'; }
console.log(`\nCHECK - q5 and q15 reproduce 7i (table / sim to 0.1, the whole counts exactly): ${rep}`);

console.log('\nPREDICTION CHECK');
console.log(`  1. the final year: exact against averaged at 5 points raises survival beyond two se: ${P.fin5.net > 0 && V(P.fin5) === 'beyond two se' ? 'HELD' : P.fin5.net > 0 && V(P.fin5) === 'AT THE LINE' ? 'AT THE LINE' : 'MISSED'}`);
console.log(`  2. the earlier years: 15 against 5 points with the final year exact is within two se: ${V(P.early) === 'within' ? 'HELD' : V(P.early) === 'AT THE LINE' ? 'AT THE LINE' : 'MISSED'}`);
console.log(`\nFALSIFIER - 15 points raise survival beyond two se with the final year exact: ${P.early.net > 0 && V(P.early) === 'beyond two se' ? 'FALSIFIED (the earlier years\' averaging matters on S360)' : P.early.net > 0 && V(P.early) === 'AT THE LINE' ? 'AT THE LINE' : 'not fired'}`);

// descriptive, not an item: on the paths 15 points save (q5 fails, q15 survives), the first year the two runs differ
const saved = []; for (let i = 0; i < N; i++) if (!A.q5.survived[i] && A.q15.survived[i]) saved.push(i);
const firstDiff = i => { for (let t = 0; t < Y; t++) { const k = i * Y + t; if (A.q5.tier[k] !== A.q15.tier[k] || A.q5.level[k] !== A.q15.level[k]) return { t, what: A.q5.tier[k] !== A.q15.tier[k] ? 'tier' : 'level', fail: A.q5.failYear[i], share: A.q5.penShare[k], w: A.q5.wealth[k] }; } return null; };
const D = saved.map(firstDiff);
const med = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const got = D.filter(Boolean);
console.log(`\nDESCRIPTIVE (not an item) - the ${saved.length} paths 15 points save (final year averaged): the first year the runs differ`);
console.log(`  no difference before the 5-point run fails: ${D.length - got.length}; a tier first: ${got.filter(x => x.what === 'tier').length}; a spending level first: ${got.filter(x => x.what === 'level').length}`);
console.log(`  first-difference year: median ${med(got.map(x => x.t))} of ${Y - 1}; years before the 5-point run fails: median ${med(got.map(x => (x.fail >= 0 ? x.fail : Y - 1) - x.t))}; the 5-point run fails in its last year on ${saved.filter(i => A.q5.failYear[i] < 0 || A.q5.failYear[i] >= Y - 2).length} of ${saved.length}`);
console.log(`  at that year: pension share median ${med(got.map(x => x.share))}%, wealth median ${Math.round(med(got.map(x => x.w)))}`);
