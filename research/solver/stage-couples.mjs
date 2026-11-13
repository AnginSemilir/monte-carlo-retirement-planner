/*
 * THE RE-RUN'S STAGE GATE (registrations/couples-d4b.md, its Paths; the review of 9 Nov, item 9; D66). Once every unit's
 * first stage (its chunk 0: paths 0 to STAGE1 of the seed) is in, each couple and estate weight: d, CANDC's survival less
 * APP's on those paths in points, paired; at d >= STAGE_BAR (+0.5) the couple and weight stops there and is read as not harmed
 * against APP; below it, CANDC at that weight and APP (where either weight goes on) run to the couple's N. SHIPC (reported, not
 * deciding: D78; the external review's answer of 11 Nov, section 3) has no part in the decision and none in what follows it:
 * each of its units is its first SHIP_N paths, in the first stage, and stops there whatever is decided. The
 * decision is written to <dir>/stage2.json (the couples and weights going on, the stamp it read, the rule); the gate prints
 * how many go on and nothing else of the run: no survival, no d, no couple's name. It refuses before deciding when a stage-1
 * chunk is missing, written twice, on another stamp or seed, or not on its first STAGE1 paths (SHIPC's: its first SHIP_N).
 * AMENDMENT 1 (13 Nov 2026; D94 (1); registrations/couples-d4b-amendment-1.md; couples-d4b-amendment.mjs): the gate as
 * registered refused on S293, whose solver arms and APP ran on plans that differ in the second person's MPAA age alone, a
 * derived label that moves no money on that couple (results-d4b-plan-check.txt). A couple's stage-1 units are on one plan
 * when they carry one inputs hash, or are that one known difference whole (onePlan): S293, APP on arm A's hash and every
 * solver unit on the solver arms'. Anything else is refused as before. The rule, the bar and the paths are unchanged.
 *   node research/solver/stage-couples.mjs <dir>          the run's folder (results/d4b-run)
 *   node research/solver/stage-couples.mjs --planted      its own checks on planted chunks
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { onePlan, usedFor } from './couples-d4b-amendment.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const STAGE1 = 5000, STAGE_BAR = 0.5, SHIP_N = 1000, WEIGHTS = ['0.02', '0.01'];
const dec = s => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return c; };

/* the decision from the stage-1 chunks: ids, the panel's couples in order; files, each chunk 0's parsed record; ship, the
   paths of a SHIPC unit (its one chunk) */
export function decideStage(ids, files, n1 = STAGE1, bar = STAGE_BAR, ship = SHIP_N, known = undefined) {
  const P = [], at = {};
  for (const f of files) {
    if (f.chunk !== 0) continue;
    const k = `${f.id}|${f.arm}|${f.w}`;
    if (at[k]) P.push(`${f.id} ${f.arm} ${f.w}: its stage-1 chunk written twice`);
    at[k] = f;
  }
  const stamps = new Set(Object.values(at).map(f => JSON.stringify(f.stamp))), seeds = new Set(Object.values(at).map(f => f.seed));
  if (stamps.size > 1) P.push(`the stage-1 chunks carry ${stamps.size} stamps`);
  if (seeds.size > 1) P.push(`the stage-1 chunks carry ${seeds.size} seeds`);
  const on = [], amended = [];
  for (const id of ids) {
    const A = at[`${id}|APP|-`];
    if (!A) { P.push(`${id} APP: its stage-1 chunk missing`); continue; }
    // one plan: the couple's stage-1 units on one inputs hash, or the amendment's one known difference, whole
    const mine = [A, ...WEIGHTS.flatMap(w => [at[`${id}|SHIPC|${w}`], at[`${id}|CANDC|${w}`]])].filter(Boolean).map(f => ({ arm: f.arm, inputs: f.inputs }));
    const one = onePlan(id, mine, known);
    if (usedFor(id, mine, known)) amended.push(id);
    // SHIPC decides nothing, but the first stage is not in until its chunk is: there, on its own paths, and its only one
    for (const w of WEIGHTS) {
      const S = at[`${id}|SHIPC|${w}`];
      if (!S) P.push(`${id} SHIPC ${w}: its chunk missing`);
      else if (S.lo !== 0 || S.hi !== Math.min(ship, S.N)) P.push(`${id} SHIPC ${w}: its chunk paths ${S.lo} to ${S.hi}, not 0 to ${Math.min(ship, S.N)} (SHIPC runs its first ${ship} paths and no more)`);
      else if (S.chunks !== undefined && S.chunks !== 1) P.push(`${id} SHIPC ${w}: written as one of ${S.chunks} chunks (SHIPC has one)`);
      else if (!one && S.inputs !== A.inputs) P.push(`${id} ${w}: SHIPC and APP on different plans`);
    }
    for (const w of WEIGHTS) {
      const C = at[`${id}|CANDC|${w}`];
      if (!C) { P.push(`${id} CANDC ${w}: its stage-1 chunk missing`); continue; }
      for (const [nm, x] of [['CANDC', C], ['APP', A]]) if (x.lo !== 0 || x.hi !== Math.min(n1, x.N)) P.push(`${id} ${nm} ${x.w}: its stage-1 chunk paths ${x.lo} to ${x.hi}, not 0 to ${Math.min(n1, x.N)}`);
      if (!one && C.inputs !== A.inputs) P.push(`${id} ${w}: CANDC and APP on different plans`);
      if (P.length) continue;
      const c = dec(C.main.survived), a = dec(A.main.survived), n = Math.min(c.length, a.length);
      let sc = 0, sa = 0; for (let i = 0; i < n; i++) { sc += c[i]; sa += a[i]; }
      const d = (100 * (sc - sa)) / n;
      // a couple whose N is no more than the first stage has nothing to go on to
      if (d < bar - 1e-12 && C.N > n1) on.push({ id, w });
    }
  }
  return { P, on, amended, stamp: stamps.size === 1 ? JSON.parse([...stamps][0]) : null };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N1 = 1000, SH = 200, stamp = { code: 'c', audit: 'a' };
  // a couple's stage-1 chunks: APP surviving a of N1, CANDC at each weight c02 and c01, and SHIPC's one chunk at each weight,
  // its first SH paths (a fifth of the planted first stage, as the run's 1,000 are of 5,000), surviving all or none (sh)
  const chunk = (id, arm, w, k, extra = {}) => { const s = new Uint8Array(N1); for (let i = 0; i < k; i++) s[i] = 1; return { id, arm, w, chunk: 0, lo: 0, hi: N1, N: 4000, seed: 7021, inputs: 'I', stamp, main: { survived: Buffer.from(s).toString('base64') }, ...extra }; };
  const ship = (id, w, extra = {}, sh = SH) => chunk(id, 'SHIPC', w, sh, { hi: SH, chunks: 1, ...extra });
  const couple = (id, a, c02, c01, sh = SH) => [chunk(id, 'APP', '-', a), chunk(id, 'CANDC', '0.02', c02), chunk(id, 'CANDC', '0.01', c01), ship(id, '0.02', {}, sh), ship(id, '0.01', {}, sh)];
  const KN = { id: 'B', app: 'I', solver: 'J' };   // the planted known difference: couple B, APP on I, its solver units on J
  const D = (ids, files, kn = KN) => decideStage(ids, files, N1, STAGE_BAR, SH, kn), onOf = r => r.on.map(x => `${x.id}${x.w}`).join();
  // +0.5 points of 1,000 paths is 5 paths: 855 against 850 stops; 854 goes on; a loss goes on
  const r = D(['A', 'B', 'C'], [...couple('A', 850, 855, 854), ...couple('B', 850, 900, 840), ...couple('C', 850, 850, 860)]);
  check(`the edge: +0.5 exactly stops, +0.4 goes on; a loss goes on; no change goes on (on: ${r.on.map(x => `${x.id} ${x.w}`).join(', ')})`, r.P.length === 0 && onOf(r) === 'A0.01,B0.01,C0.02');
  // SHIPC has no part in the decision: the same couples with SHIPC surviving no path decide the same
  const r0 = D(['A', 'B', 'C'], [...couple('A', 850, 855, 854, 0), ...couple('B', 850, 900, 840, 0), ...couple('C', 850, 850, 860, 0)]);
  check('SHIPC has no part in the decision: whatever its paths did, the same couples and weights go on', r0.P.length === 0 && onOf(r0) === onOf(r));
  // the amendment (D94 (1)): the known difference, whole, decides as one plan would; anything else is refused as before
  const solverOn = (cs, h, only = () => true) => cs.map(c => (c.arm !== 'APP' && only(c) ? { ...c, inputs: h } : c));
  const kn = D(['A', 'B', 'C'], [...couple('A', 850, 855, 854), ...solverOn(couple('B', 850, 900, 840), 'J'), ...couple('C', 850, 850, 860)]);
  check('the known difference (couple B: APP on I, every solver unit on J) is one plan and decides as before, and the decision names B as amended and no other', kn.P.length === 0 && onOf(kn) === onOf(r) && kn.amended.join() === 'B' && r.amended.length === 0);
  const other = D(['A'], solverOn(couple('A', 850, 855, 854), 'J'));
  check('the same two hashes on another couple are refused, each solver unit named', other.on.length === 0 && ['A 0.02: SHIPC and APP on different plans', 'A 0.01: SHIPC and APP on different plans', 'A 0.02: CANDC and APP on different plans', 'A 0.01: CANDC and APP on different plans'].every(x => other.P.includes(x)));
  const wrong = D(['B'], solverOn(couple('B', 850, 900, 840), 'K'));
  check('the known couple on any other hash is refused', wrong.on.length === 0 && wrong.P.some(x => /^B 0\.02: CANDC and APP on different plans$/.test(x)));
  const swapped = D(['B'], solverOn(couple('B', 850, 900, 840), 'I').map(c => (c.arm === 'APP' ? { ...c, inputs: 'J' } : c)));
  check('the known couple with the two hashes the other way round is refused', swapped.on.length === 0 && swapped.P.some(x => /different plans/.test(x)));
  const mix = D(['B'], solverOn(couple('B', 850, 900, 840), 'J', c => c.arm === 'SHIPC'));
  check('the known couple with only its SHIPC units on the other hash (a mix) is refused, the SHIPC units named', mix.on.length === 0 && mix.P.some(x => /^B 0\.02: SHIPC and APP on different plans$/.test(x)) && !mix.P.some(x => /CANDC and APP/.test(x)));
  const none = D(['B'], solverOn(couple('B', 850, 900, 840), 'J'), { id: 'Z', app: 'I', solver: 'J' });
  check('with the amendment naming another couple, the gate is the registered one: B is refused', none.on.length === 0 && none.P.filter(x => /different plans/.test(x)).length === 4);
  const miss = D(['A'], couple('A', 850, 855, 854).filter(c => !(c.arm === 'CANDC' && c.w === '0.01')));
  check('a stage-1 chunk missing is refused before any decision', miss.P.some(x => /CANDC 0.01: its stage-1 chunk missing/.test(x)) && miss.on.length === 0);
  const two = D(['A'], [...couple('A', 850, 855, 854), chunk('A', 'APP', '-', 850, { stamp: { code: 'd', audit: 'a' } })]);
  check('a chunk written twice, on another stamp, is refused', two.P.some(x => /written twice/.test(x)) && two.P.some(x => /2 stamps/.test(x)));
  const off = D(['A'], [chunk('A', 'APP', '-', 850), chunk('A', 'CANDC', '0.02', 855, { lo: 1000, hi: 2000 }), chunk('A', 'CANDC', '0.01', 854), ship('A', '0.02'), ship('A', '0.01')]);
  check('a chunk not on the first stage\'s paths is refused', off.P.some(x => /not 0 to 1000/.test(x)));
  // SHIPC's own chunk (D78): missing, run on the first stage's paths in place of its own, or written as one of two
  const noShip = D(['A'], couple('A', 850, 855, 854).filter(c => !(c.arm === 'SHIPC' && c.w === '0.02')));
  check('a SHIPC chunk missing is refused before any decision (the first stage is not in without it)', noShip.P.some(x => /^A SHIPC 0\.02: its chunk missing$/.test(x)) && noShip.on.length === 0);
  const longShip = D(['A'], [...couple('A', 850, 855, 854).filter(c => !(c.arm === 'SHIPC' && c.w === '0.01')), ship('A', '0.01', { hi: N1 })]);
  check('a SHIPC chunk on the first stage\'s 1,000 paths, not its own first 200, is refused', longShip.P.some(x => /^A SHIPC 0\.01: its chunk paths 0 to 1000, not 0 to 200 /.test(x)) && longShip.on.length === 0);
  const twoShip = D(['A'], [...couple('A', 850, 855, 854).filter(c => !(c.arm === 'SHIPC' && c.w === '0.01')), ship('A', '0.01', { chunks: 2 })]);
  check('a SHIPC unit written as one of two chunks (a second stage laid out for it) is refused', twoShip.P.some(x => /^A SHIPC 0\.01: written as one of 2 chunks/.test(x)));
  const short = D(['A'], couple('A', 850, 800, 800).map(c => ({ ...c, N: N1, hi: Math.min(c.hi, N1) })));
  check('a couple whose N is no more than the first stage goes on to nothing', short.P.length === 0 && short.on.length === 0);
  // the CLI: it writes stage2.json and prints the count alone
  const dir = mkdtempSync(join(tmpdir(), 'stage-couples-'));
  try {
    for (const c of couple('A', 850, 855, 854)) writeFileSync(join(dir, `${c.id}-${c.arm.toLowerCase()}-w${c.w}-c0.json.gz`), gzipSync(JSON.stringify(c)));
    const out = run(dir, ['A'], N1, () => {}, SH);
    const j = JSON.parse(readFileSync(join(dir, 'stage2.json'), 'utf8'));
    check(`the CLI writes stage2.json (the couples and weights going on, SHIPC's paths, nothing naming a SHIPC unit) and prints the count alone ("${out}")`, j.continue.length === 1 && j.continue[0].w === '0.01' && Object.keys(j.continue[0]).join() === 'id,w' && j.shipN === SH && /^stage 2: 1 of 2 couple-weights go on$/.test(out));
  } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log('AMENDMENT 1: the known difference whole, on another couple, on another hash, the other way round, a mix, and the amendment naming no couple of the run');
  console.log('EDGES: a couple exactly +0.5 points up (stops), +0.4 (goes on), no change (goes on), a missing chunk, a chunk off the first stage, a couple with nothing past the first stage, SHIPC surviving no path, a SHIPC chunk missing, on the wrong paths, laid out in two chunks');
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

/* read the folder's stage-1 chunks, decide, write stage2.json; returns the one line it prints */
export function run(dir, ids, n1 = STAGE1, exit = code => process.exit(code), ship = SHIP_N) {
  const files = readdirSync(dir).filter(x => /-c0\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()));
  const r = decideStage(ids, files, n1, STAGE_BAR, ship);
  if (r.P.length) { console.log(`STAGE GATE REFUSED (no decision):\n  ${r.P.join('\n  ')}`); exit(1); return null; }
  writeFileSync(join(dir, 'stage2.json'), JSON.stringify({ built: new Date().toISOString(), rule: `after ${n1} paths a couple and weight whose CANDC survival is ${STAGE_BAR} points or more above APP's stops; every other runs CANDC at that weight, and APP, to its N; SHIPC stops at its first ${ship} paths whatever is decided`, n1, bar: STAGE_BAR, shipN: ship, stamp: r.stamp, continue: r.on,
    // amendment 1 (D94 (1)): the couples whose units were taken as one plan by the one known difference; none, the gate as registered
    amendment: r.amended.length ? { doc: 'research/solver/registrations/couples-d4b-amendment-1.md', couples: r.amended } : null }, null, 1) + '\n');
  const line = `stage 2: ${r.on.length} of ${ids.length * WEIGHTS.length} couple-weights go on`;
  console.log(line);
  return line;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const dir = process.argv[2];
  if (!dir || !existsSync(dir)) { console.error('stage-couples: <the run\'s folder>'); process.exit(2); }
  const { readPanel } = await import('./couple-panel.mjs'), { PANEL_FILE } = await import('./audit-couples.mjs');
  run(dir, readPanel(PANEL_FILE).map(h => h.id));
}
