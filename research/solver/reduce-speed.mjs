/*
 * THE CHOOSER'S SHORTLIST AND THE SOLVE ON ANCHORS: THE READ (SPEED-A.md; the review of 9 Nov, items 7 and 10; EXPLORATORY,
 * deciding nothing). The stamps first (fair-gate.mjs requireFairLogs), then the gate: every unit in; one code, one audit, one
 * seed, one count of paths, one count of points; within a household every unit on the same plan (its inputs hash) and every
 * arm's recorded settings the same but the option it tests (the bridge reference's lattice, the anchors' setting, the
 * chooser's width); unit B's ON tables the same as unit A's (their digests); unit R's bridge probe agreeing with unit A's
 * 45-point solve, and where it has a bridge year its OFF tables the same as unit A's. Then the rules, X against its base on
 * the households it covers, d = survival under X less under the base in points, paired:
 *   1. the pooled mean of d, its 95% interval from the households' paired variances: lower end above -0.1;
 *   2. no household's paired 95% interval (survivalChangeU) wholly below -0.3;
 *   3. the pooled spending delivered (points of target, X less base) within 0.05;
 *   4. the pooled mean pot left (X over base, averaged over households) within 0.5%;
 * item 7: each width on OFF's tables against OFF, the review's eight; item 10: ON against OFF on the twelve, with 5. the solve
 * at least 5 times as fast on one core on every household without a bridge year (unit A's times; gate 5's with --gate5);
 * REF and ON+REF against OFF on the households with a bridge year; ON with a width that passed item 7, the eight.
 *   node research/solver/reduce-speed.mjs [dir] [--gate5 <the block as it is>,<with ON>] [--gate5-bridge <file>] > research/solver/results-speed-a.txt
 *   node research/solver/reduce-speed.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, zFor } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooledLo: -0.1, household: -0.3, spend: 0.05, pot: 0.5, speed: 5 };
export const ON_NAME = 'w2a3b3g2c2-NT-LRVOH-h3', THIN_NAME = '80x21x64';
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const arr = (b64, T) => (typeof b64 === 'string' ? new T(Buffer.from(b64, 'base64').buffer.slice(0)) : b64);
export const armOf = a => ({ survived: arr(a.survived, Uint8Array), delivered: arr(a.delivered, Float64Array), target: arr(a.target, Float64Array), pot: arr(a.pot, Float64Array), ms: a.ms, listed: a.listed, decisions: a.decisions, fallback: a.fallback });
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
/* one household's paired survival, X against base: d (points), its interval, its variance (points squared) */
export function pairOf(B, X) {
  let a = 0, b = 0, c = 0, d = 0;
  for (let k = 0; k < B.length; k++) { if (B[k] && X[k]) a++; else if (B[k] && !X[k]) b++; else if (!B[k] && X[k]) c++; else d++; }
  const n = B.length, u = survivalChangeU(a, b, c, d), diff = (c - b) / n;
  const v = (1e4 * ((b + c) / n - diff * diff)) / n;
  return { ...u, v, saved: c, lost: b, sB: (100 * (a + b)) / n, sX: (100 * (a + c)) / n, n };
}
/* parts 1 to 4 over pairs { id, B, X } (the arms' arrays) */
export function rule4(pairs) {
  const del = x => (100 * x.delivered.reduce((s, y) => s + y, 0)) / Math.max(1e-9, x.target.reduce((s, y) => s + y, 0));
  const H = pairs.map(q => ({ id: q.id, p: pairOf(q.B.survived, q.X.survived), delB: del(q.B), delX: del(q.X), potB: mean(Array.from(q.B.pot)), potX: mean(Array.from(q.X.pot)), msB: q.B.ms, msX: q.X.ms }));
  const k = H.length, z = zFor(0.05);
  const pooled = H.reduce((s, h) => s + h.p.d, 0) / k, se = Math.sqrt(H.reduce((s, h) => s + h.p.v, 0)) / k;
  const lo = pooled - z * se, hi = pooled + z * se;
  const harmed = H.filter(h => h.p.hi < RULE.household);
  const spend = H.reduce((s, h) => s + h.delX - h.delB, 0) / k;
  const potB = mean(H.map(h => h.potB)), potX = mean(H.map(h => h.potX)), pot = 100 * (potX / potB - 1);
  const part1 = lo > RULE.pooledLo, part2 = harmed.length === 0, part3 = Math.abs(spend) <= RULE.spend + 1e-9, part4 = Math.abs(pot) <= RULE.pot + 1e-9;   // each edge inclusive, past a sum's rounding
  return { H, pooled, se, lo, hi, harmed, spend, pot, part1, part2, part3, part4, pass: part1 && part2 && part3 && part4, ms: mean(H.map(h => h.msX)), msB: mean(H.map(h => h.msB)) };
}
/* item 7's outcome from its widths' reads (each rule4's) */
export function item7(W) {
  const pass = ['structure', 'cells-held@0.005'].filter(w => W[w] && W[w].pass);
  if (pass.length === 2) { const w = W.structure.ms <= W['cells-held@0.005'].ms ? 'structure' : 'cells-held@0.005'; return { width: w, outcome: `BOTH PASS: the faster, ${w} (a path ${W[w].ms.toFixed(2)} ms against ${W[w === 'structure' ? 'cells-held@0.005' : 'structure'].ms.toFixed(2)})` }; }
  if (pass.length === 1) return { width: pass[0], outcome: `ONE PASSES: ${pass[0]}` };
  return { width: null, outcome: `NEITHER PASSES: order read by the same rule (${W.order ? (W.order.pass ? 'it passes' : 'it fails') : 'not run'}), reported; the item stops` };
}
/* item 10's part 5 from the units' own times (unit A's OFF over ON on one core) and gate 5's, households without a bridge year */
export function speed5(units, gate5) {
  const own = units.filter(u => !u.bridge).map(u => ({ id: u.id, x: u.solves.OFF.cpu / u.solves.ON.cpu }));
  const g = gate5 ? gate5.filter(h => !h.bridge).map(h => ({ id: h.name, x: h.off / h.on })) : null;
  const ownOk = own.length > 0 && own.every(h => h.x >= RULE.speed), gOk = g ? g.length > 0 && g.every(h => h.x >= RULE.speed) : null;
  return { own, g, ownOk, gOk, pass: ownOk && gOk === true, pending: gOk === null };
}
/* gate 5's block (reduce-gate5.mjs's line): each household's candidate on one core */
export function parseGate5(text) {
  const out = [];
  for (const m of text.matchAll(/(bridge \d+|S\d+F?|share [\d.]+) the product ([\d.]+) s, the candidate ([\d.]+) s on one core and ([\d.]+) s split/g)) out.push({ name: m[1], product: +m[2], cand: +m[3], split: +m[4] });
  return out;
}
const fields = ran => { const p = ran.split(' | '); return { coarse: p[0], reference: p[1], chooser: p[2], rest: p.slice(3).join(' | ') }; };
/* the gate: refusals, each a line. raw: the unit files; units: SPEED-A's list { id, part }; eight: the review's eight */
export function gate(raw, units, eight, audit) {
  const P = [], at = (id, part) => raw.find(x => x.id === id && x.part === part);
  const missing = units.filter(u => !at(u.id, u.part));
  if (missing.length) P.push(`units missing: ${missing.map(u => `${u.id} ${u.part}`).join(', ')}`);
  const one = (what, f0) => { const vs = [...new Set(raw.map(f0))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && raw.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  for (const id of [...new Set(units.map(u => u.id))]) {
    const A = at(id, 'A'), B = at(id, 'B'), R = at(id, 'R');
    if (!A || !B || !R) continue;
    if (new Set([A.inputs, B.inputs, R.inputs]).size > 1) P.push(`${id}: its units ran on different plans`);
    const want = {
      A: ['OFF', ...(eight.includes(id) ? ['OFF:structure', 'OFF:cells-held@0.005', 'OFF:order'] : [])],
      B: ['ON', ...(eight.includes(id) ? ['ON:structure', 'ON:cells-held@0.005', 'ON:order'] : [])],
      R: R.bridge ? ['REF', 'ONREF'] : []
    };
    for (const [part, U] of [['A', A], ['B', B], ['R', R]]) {
      const got = Object.keys(U.arms || {}).sort().join(), w = [...want[part]].sort().join();
      if (got !== w) P.push(`${id} ${part}: the arms ${got || 'none'}, not ${w || 'none'}`);
    }
    if (!A.arms || !A.arms.OFF) continue;
    const base = fields(A.arms.OFF.ran);
    for (const [part, U] of [['A', A], ['B', B], ['R', R]]) for (const [name, x] of Object.entries(U.arms || {})) {
      const g = fields(x.ran), isOn = name.startsWith('ON'), isRef = name === 'REF' || name === 'ONREF', w = name.includes(':') ? name.split(':')[1] : 'whole';
      if (x.inputs !== A.inputs) P.push(`${id} ${name}: not on the household's plan`);
      if (g.rest !== base.rest) P.push(`${id} ${name}: its settings differ from OFF's beyond the option it tests`);
      if (g.coarse !== `coarse ${isOn ? ON_NAME : 'off'}`) P.push(`${id} ${name}: ${g.coarse}, not ${isOn ? ON_NAME : 'off'}`);
      if (g.reference !== (isRef ? `reference ${THIN_NAME}` : base.reference)) P.push(`${id} ${name}: ${g.reference}, not ${isRef ? THIN_NAME : base.reference}`);
      if (g.chooser !== `chooser ${w}`) P.push(`${id} ${name}: ${g.chooser}, not ${w}`);
      for (const k of ['survived', 'pot', 'delivered', 'target']) if (arr(x[k], k === 'survived' ? Uint8Array : Float64Array).length !== U.N) P.push(`${id} ${name}: ${k} not one a path`);
    }
    if (B.solves && A.solves && B.solves.ON && A.solves.ON && B.solves.ON.digest !== A.solves.ON.digest) P.push(`${id}: unit B's ON tables are not unit A's (${B.solves.ON.digest.slice(0, 12)} against ${A.solves.ON.digest.slice(0, 12)})`);
    if (R.bridge !== A.bridge) P.push(`${id}: unit R's bridge probe (${R.bridge}) disagrees with unit A's solve (${A.bridge})`);
    if (R.bridge && R.solves && R.solves.OFF && A.solves && R.solves.OFF.digest !== A.solves.OFF.digest) P.push(`${id}: unit R's OFF tables are not unit A's`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 10000;
  // a household with b lost and c saved of N, the spending delivered and the pot given (X's; the base's 100 and 100)
  const pair = (id, b, c, delX = 100, potX = 100, ms = 1) => {
    const B = new Uint8Array(N).fill(1), X = new Uint8Array(N).fill(1);
    for (let k = 0; k < b; k++) X[k] = 0;
    for (let k = 0; k < c; k++) B[N - 1 - k] = 0;
    const flat = v => new Float64Array(N).fill(v);
    return { id, B: { survived: B, delivered: flat(100), target: flat(100), pot: flat(100), ms: 10 }, X: { survived: X, delivered: flat(delX), target: flat(100), pot: flat(potX), ms } };
  };
  const set = xs => xs.map(a => pair(...a));
  check('all four hold: no change anywhere', rule4(set([['A', 0, 0], ['B', 0, 0]])).pass);
  const r1 = rule4(set([['A', 20, 0], ['B', 20, 0]]));
  check(`part 1 fails on a pooled loss of 0.2 points (its lower end ${r1.lo.toFixed(3)})`, !r1.part1 && r1.part2);
  const r2 = rule4(set([['A', 60, 0], ['B', 0, 60], ['C', 0, 60]]));
  check(`part 2 fails on one household wholly below -0.3 (A: d ${r2.H[0].p.d.toFixed(2)}, upper end ${r2.H[0].p.hi.toFixed(3)}), the pooled change ${f(r2.pooled)} passing part 1`, r2.part1 && !r2.part2 && r2.harmed.map(h => h.id).join() === 'A');
  const r2e = rule4(set([['A', 20, 0], ['B', 0, 20], ['C', 0, 20]]));
  check(`part 2 at its edge: 20 lost of 10,000 (upper end ${r2e.H[0].p.hi.toFixed(3)}, not below -0.3) is not harmed`, r2e.part2);
  check('part 3 fails on spending delivered 0.06 points below', !rule4(set([['A', 0, 0, 99.94]])).part3);
  check('part 3 at its edge: 0.05 points below holds', rule4(set([['A', 0, 0, 99.95]])).part3);
  check('part 4 fails on the pot 0.6% lower', !rule4(set([['A', 0, 0, 100, 99.4]])).part4);
  check('part 4 at its edge: the pot 0.5% higher holds', rule4(set([['A', 0, 0, 100, 100.5]])).part4);
  const W = { structure: rule4(set([['A', 0, 0, 100, 100, 3]])), 'cells-held@0.005': rule4(set([['A', 0, 0, 100, 100, 1]])), order: rule4(set([['A', 0, 0]])) };
  check('item 7: both pass, the faster taken (cells at 1 ms against structure at 3)', item7(W).width === 'cells-held@0.005');
  check('item 7: one passes, that one', item7({ ...W, 'cells-held@0.005': rule4(set([['A', 60, 0]])) }).width === 'structure');
  check('item 7: neither passes, order read and the item stops', item7({ ...W, structure: rule4(set([['A', 60, 0]])), 'cells-held@0.005': rule4(set([['A', 60, 0]])) }).width === null);
  const sp = (offs, ons, bridges = offs.map(() => false)) => offs.map((o, i) => ({ id: `H${i}`, bridge: bridges[i], solves: { OFF: { cpu: o }, ON: { cpu: ons[i] } } }));
  check('item 10 part 5: 5.0 times on every household without a bridge year holds (the units\' own; gate 5 pending)', speed5(sp([50, 60], [10, 12])).ownOk && speed5(sp([50, 60], [10, 12])).pending);
  check('item 10 part 5: 4.9 times on one household fails', !speed5(sp([49, 60], [10, 12])).ownOk);
  check('item 10 part 5: a bridge household slower is not counted', speed5(sp([50, 30], [10, 12], [false, true])).ownOk);
  const g5 = parseGate5('bridge 4 the product 135.9 s, the candidate 409.4 s on one core and 116.7 s split (x0.859); S126 the product 139.4 s, the candidate 386.9 s on one core and 106.5 s split');
  check(`gate 5's block read: ${g5.map(h => `${h.name} ${h.cand}`).join(', ')}`, g5.length === 2 && g5[1].name === 'S126' && g5[1].cand === 386.9);
  check('item 10 part 5 by gate 5: 5 times holds, 4 fails', speed5(sp([50], [10]), [{ name: 'S126', bridge: false, off: 400, on: 80 }]).pass && !speed5(sp([50], [10]), [{ name: 'S126', bridge: false, off: 400, on: 100 }]).pass);
  // the gate
  const stamp = { code: 'c', audit: 'a' }, ran = (coarse, ref, w) => `coarse ${coarse} | reference ${ref} | chooser ${w} | pts 45`;
  const armX = (r) => ({ ran: r, inputs: 'h', survived: new Uint8Array(2), pot: new Float64Array(2), delivered: new Float64Array(2), target: new Float64Array(2) });
  const ws = ['structure', 'cells-held@0.005', 'order'];
  const mkU = (id, bridge, over = {}) => {
    const e = id === 'E', ref = bridge ? '160x41x128' : 'none';
    const A = { id, part: 'A', inputs: 'h', seed: 7002, N: 2, pts: 45, stamp, bridge, solves: { OFF: { digest: 'o' }, ON: { digest: 'n' } }, arms: { OFF: armX(ran('off', ref, 'whole')), ...(e ? Object.fromEntries(ws.map(w => [`OFF:${w}`, armX(ran('off', ref, w))])) : {}) } };
    const B = { id, part: 'B', inputs: 'h', seed: 7002, N: 2, pts: 45, stamp, bridge, solves: { ON: { digest: 'n' } }, arms: { ON: armX(ran(ON_NAME, ref, 'whole')), ...(e ? Object.fromEntries(ws.map(w => [`ON:${w}`, armX(ran(ON_NAME, ref, w))])) : {}) } };
    const R = { id, part: 'R', inputs: 'h', seed: 7002, N: 2, pts: 45, stamp, bridge, solves: bridge ? { OFF: { digest: 'o' } } : {}, arms: bridge ? { REF: armX(ran('off', THIN_NAME, 'whole')), ONREF: armX(ran(ON_NAME, THIN_NAME, 'whole')) } : {} };
    return [A, B, R].map(u => ({ ...u, ...(over[u.part] || {}) }));
  };
  const U = [{ id: 'E', part: 'A' }, { id: 'E', part: 'B' }, { id: 'E', part: 'R' }, { id: 'F', part: 'A' }, { id: 'F', part: 'B' }, { id: 'F', part: 'R' }];
  check('the gate passes fair units (one of the eight, one with a bridge year)', gate([...mkU('E', false), ...mkU('F', true)], U, ['E'], 'a').length === 0);
  check('the gate refuses a missing unit', gate([...mkU('E', false), ...mkU('F', true).slice(0, 2)], U, ['E'], 'a').some(x => /missing: F R/.test(x)));
  check('the gate refuses two codes', gate([...mkU('E', false), ...mkU('F', true, { B: { stamp: { code: 'd', audit: 'a' } } })], U, ['E'], 'a').some(x => /more than one code/.test(x)));
  check('the gate refuses unit B\'s ON tables not unit A\'s', gate([...mkU('E', false, { B: { solves: { ON: { digest: 'x' } } } }), ...mkU('F', true)], U, ['E'], 'a').some(x => /unit B's ON tables/.test(x)));
  check('the gate refuses a bridge probe disagreeing with unit A', gate([...mkU('E', false), ...mkU('F', true, { R: { bridge: false, arms: {}, solves: {} } })], U, ['E'], 'a').some(x => /bridge probe/.test(x)));
  const d1 = mkU('E', false); d1[1].arms.ON = armX('coarse ' + ON_NAME + ' | reference none | chooser whole | pts 30');
  check('the gate refuses an arm whose settings differ beyond its option', gate([...d1, ...mkU('F', true)], U, ['E'], 'a').some(x => /beyond the option/.test(x)));
  const d2 = mkU('F', true); d2[2].arms.REF = armX(ran('off', '160x41x128', 'whole'));
  check('the gate refuses a REF arm on the candidate\'s own reference', gate([...mkU('E', false), ...d2], U, ['E'], 'a').some(x => /F REF: reference 160x41x128/.test(x)));
  console.log('EDGES: a household losing 20 of 10,000 (its interval reaching above -0.3: not harmed) against 60 (wholly below: harmed), spending 0.05 points below (holds) against 0.06 (fails), the pot 0.5% higher (holds) against 0.6% lower (fails), a solve 5.0 times as fast (holds) against 4.9 (fails), a bridge household not counted in part 5, a missing unit (refused)');
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'speed-7002');
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  const { UNITS, EIGHT, HOUSEHOLDS, WIDTHS, stampFilesHash } = await import('./audit-speed.mjs');
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const P = gate(raw, UNITS, EIGHT, stampFilesHash());
  if (P.length) { console.log(`SPEED-A GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const at = (id, part) => raw.find(x => x.id === id && x.part === part), u0 = raw[0];
  const A = id => at(id, 'A'), B = id => at(id, 'B'), R = id => at(id, 'R');
  const bridged = HOUSEHOLDS.filter(id => A(id).bridge);
  console.log(`SPEED-A (EXPLORATORY, D66, D68; SPEED-A.md): ${raw.length} units, ${HOUSEHOLDS.length} households (a bridge year: ${bridged.join(', ') || 'none'}), code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair`);
  const show = (title, r) => {
    console.log(`\n${title}`);
    for (const h of r.H) console.log(`  ${h.id.padEnd(6)} survival ${h.p.sB.toFixed(2)}% / ${h.p.sX.toFixed(2)}%, d ${f(h.p.d)} (${f(h.p.lo)} to ${f(h.p.hi)}; ${h.p.saved} saved, ${h.p.lost} lost) | spending ${h.delB.toFixed(3)}% / ${h.delX.toFixed(3)}% | pot £${Math.round(h.potB).toLocaleString('en-GB')} / £${Math.round(h.potX).toLocaleString('en-GB')} | a path ${h.msB.toFixed(2)} / ${h.msX.toFixed(2)} ms`);
    console.log(`  1. pooled survival ${f(r.pooled)} (95% ${f(r.lo)} to ${f(r.hi)}, se ${r.se.toFixed(4)}); its lower end above ${RULE.pooledLo}: ${r.part1 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  2. no household wholly below ${RULE.household}: ${r.harmed.length ? r.harmed.map(h => `${h.id} (${f(h.p.lo)} to ${f(h.p.hi)})`).join(', ') : 'none'}: ${r.part2 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  3. pooled spending delivered ${f(r.spend, 4)} points of target; within ${RULE.spend}: ${r.part3 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  4. pooled mean pot left ${f(r.pot, 3)}%; within ${RULE.pot}%: ${r.part4 ? 'HOLDS' : 'FAILS'}`);
    console.log(`  a path ${r.msB.toFixed(2)} ms to ${r.ms.toFixed(2)} ms pooled (${(r.msB / r.ms).toFixed(2)} times); ${r.pass ? 'PASSES 1 to 4' : 'FAILS'}`);
  };
  // ---- item 7 ----
  console.log('\n==== ITEM 7: THE CHOOSER\'S SHORTLIST (the review\'s eight; each width on OFF\'s tables against OFF) ====');
  const W = Object.fromEntries(WIDTHS.map(w => [w, rule4(EIGHT.map(id => ({ id, B: armOf(A(id).arms.OFF), X: armOf(A(id).arms[`OFF:${w}`]) })))]));
  for (const w of WIDTHS) show(`${w}${w === 'order' ? ' (read only if neither of the first two passes)' : ''}:`, W[w]);
  console.log('\nThe replay (the first 100 paths; at each decision of the whole menu\'s own path, each width\'s choice; score in points):');
  for (const w of WIDTHS) {
    const t = { decisions: 0, miss: 0, m4: 0, m3: 0, m2: 0, regret: 0, worst: 0, listed: 0 };
    for (const id of EIGHT) { const r = A(id).replay[w]; for (const k of Object.keys(t)) t[k] = k === 'worst' ? Math.max(t[k], r[k]) : t[k] + r[k]; }
    console.log(`  ${w}: ${(t.listed / t.decisions).toFixed(1)} moves listed; a different move at ${t.miss} of ${t.decisions} decisions (over 0.01 points given up at ${t.m4}, over 0.1 at ${t.m3}, over 1 at ${t.m2}); the score given up ${(100 * t.regret / t.decisions).toFixed(5)} points a decision on average, the worst ${(100 * t.worst).toFixed(3)}; by household ${EIGHT.map(id => `${id} ${A(id).replay[w].miss}/${A(id).replay[w].decisions}`).join(', ')}`);
  }
  const o7 = item7(W);
  console.log(`ITEM 7 OUTCOME: ${o7.outcome}`);
  // ---- item 10 ----
  console.log('\n==== ITEM 10: THE SOLVE ON ANCHORS (ON against OFF, the twelve) ====');
  const ON = rule4(HOUSEHOLDS.map(id => ({ id, B: armOf(A(id).arms.OFF), X: armOf(B(id).arms.ON) })));
  show('ON against OFF:', ON);
  console.log('\nThe solves, unit A, back to back on one core (CPU seconds; the bridge reference\'s beside):');
  for (const id of HOUSEHOLDS) { const s = A(id).solves; console.log(`  ${id.padEnd(6)} OFF ${s.OFF.cpu.toFixed(1)} s (reference ${s.OFF.ref.toFixed(1)}), ON ${s.ON.cpu.toFixed(1)} s (reference ${s.ON.ref.toFixed(1)}): ${(s.OFF.cpu / s.ON.cpu).toFixed(2)} times; ${s.ON.stats.fine} cells on a shortlist, ${(s.ON.stats.listed / Math.max(1, s.ON.stats.fine)).toFixed(1)} moves listed${A(id).bridge ? '; a bridge year' : ''}`); }
  let g5 = null;
  if (opt('--gate5')) {
    const [fOff, fOn] = opt('--gate5').split(','), br = opt('--gate5-bridge') ? Object.fromEntries(readFileSync(opt('--gate5-bridge'), 'utf8').split('\n').map(l => /^gate5-bridge: (.+) (yes|no)$/.exec(l)).filter(Boolean).map(m => [m[1], m[2] === 'yes'])) : {};
    const off = parseGate5(readFileSync(fOff, 'utf8')), on = parseGate5(readFileSync(fOn, 'utf8'));
    g5 = off.map(h => ({ name: h.name, bridge: br[h.name] !== undefined ? br[h.name] : null, off: h.cand, on: (on.find(x => x.name === h.name) || {}).cand }));
    if (g5.some(h => h.bridge === null || !(h.on > 0))) { console.log(`SPEED-A: gate 5's households without a bridge record or an ON time: ${g5.filter(h => h.bridge === null || !(h.on > 0)).map(h => h.name).join(', ')}`); process.exit(1); }
  }
  const s5 = speed5(HOUSEHOLDS.map(id => ({ id, bridge: A(id).bridge, solves: A(id).solves })), g5);
  console.log(`  5. the solve at least ${RULE.speed} times as fast on one core on every household without a bridge year: the units' own ${s5.own.map(h => `${h.id} ${h.x.toFixed(2)}`).join(', ')}: ${s5.ownOk ? 'HOLDS' : 'FAILS'}; gate 5's ${s5.g ? `${s5.g.map(h => `${h.id} ${h.x.toFixed(2)}`).join(', ')}: ${s5.gOk ? 'HOLDS' : 'FAILS'}` : 'not yet measured'}`);
  const onOut = !ON.pass ? 'ON FAILS 1 TO 4: w2a2b2g2c2-NT-LRVOH-h3 once, by the same rule, in a batch of its own' : s5.pending ? (s5.ownOk ? 'ON PASSES 1 TO 4 AND 5 BY THE UNITS\' OWN TIMES: gate 5\'s measurement to come' : 'ON PASSES 1 TO 4 AND FAILS 5 BY THE UNITS\' OWN TIMES: the times to the maintainer; nothing ported') : s5.pass ? 'ON PASSES: to the maintainer, for the ruling naming the run; then stage B' : 'ON PASSES 1 TO 4 AND FAILS 5: the times to the maintainer; nothing ported';
  // REF and ON+REF
  let refOut = 'no household with a bridge year';
  if (bridged.length) {
    const REF = rule4(bridged.map(id => ({ id, B: armOf(A(id).arms.OFF), X: armOf(R(id).arms.REF) }))), ONREF = rule4(bridged.map(id => ({ id, B: armOf(A(id).arms.OFF), X: armOf(R(id).arms.ONREF) })));
    show(`REF against OFF (${bridged.join(', ')}):`, REF);
    show(`ON+REF against OFF (${bridged.join(', ')}):`, ONREF);
    const sp = bridged.map(id => { const s = R(id).solves; return { id, x: s.OFF.cpu / s.ONREF.cpu, off: s.OFF, ref: s.REF, onref: s.ONREF }; });
    for (const h of sp) console.log(`  ${h.id.padEnd(6)} unit R on one core: OFF ${h.off.cpu.toFixed(1)} s (reference ${h.off.ref.toFixed(1)}), REF ${h.ref.cpu.toFixed(1)} s (reference ${h.ref.ref.toFixed(1)}), ON+REF ${h.onref.cpu.toFixed(1)} s (reference ${h.onref.ref.toFixed(1)}): ON+REF ${h.x.toFixed(2)} times`);
    const fast = sp.every(h => h.x >= RULE.speed);
    console.log(`  ON+REF at least ${RULE.speed} times as fast as OFF on each: ${fast ? 'HOLDS' : 'FAILS'}`);
    refOut = REF.pass && ONREF.pass && fast ? 'REF PASSES' : 'REF FAILS: the bridge reference stays as it is; households with a bridge year get ON alone';
  }
  // ON with item 7's width
  let wOut = 'no width of item 7 passed: not read';
  if (o7.width) { const OW = rule4(EIGHT.map(id => ({ id, B: armOf(A(id).arms.OFF), X: armOf(B(id).arms[`ON:${o7.width}`]) }))); show(`ON's tables with ${o7.width} against OFF (the eight):`, OW); wOut = OW.pass ? `ON with ${o7.width} PASSES 1 to 4: the two may ship together` : `ON with ${o7.width} FAILS: the two do not ship together`; }
  console.log(`ITEM 10 OUTCOME: ${onOut}. ${refOut}. ${wOut}.`);
  const secs = raw.flatMap(u => Object.values(u.solves || {}).map(s => s.cpu)).reduce((a, b) => a + b, 0);
  console.log(`The run: the solves ${(secs / 3600).toFixed(1)} core-hours; the paths ${(raw.flatMap(u => Object.values(u.arms || {}).map(a => a.ms * u.N / 1000)).reduce((a, b) => a + b, 0) / 3600).toFixed(1)}; the hosts: ${[...new Set(raw.map(u => u.cpu))].join('; ')}`);
}
