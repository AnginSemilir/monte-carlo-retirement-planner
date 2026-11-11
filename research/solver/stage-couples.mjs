/*
 * THE RE-RUN'S STAGE GATE (registrations/couples-d4b.md, its Paths; the review of 9 Nov, item 9; D66). Once every unit's
 * first stage (its chunk 0: paths 0 to STAGE1 of the seed) is in, each couple and estate weight: d, CANDC's survival less
 * APP's on those paths in points, paired; at d >= STAGE_BAR (+0.5) the couple and weight stops there and is read as not harmed
 * against APP; below it, CANDC and SHIPC at that weight and APP (where either weight goes on) run to the couple's N. The
 * decision is written to <dir>/stage2.json (the couples and weights going on, the stamp it read, the rule); the gate prints
 * how many go on and nothing else of the run: no survival, no d, no couple's name. It refuses before deciding when a stage-1
 * chunk is missing, written twice, on another stamp or seed, or not on its first STAGE1 paths.
 *   node research/solver/stage-couples.mjs <dir>          the run's folder (results/d4b-run)
 *   node research/solver/stage-couples.mjs --planted      its own checks on planted chunks
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
export const STAGE1 = 5000, STAGE_BAR = 0.5, WEIGHTS = ['0.02', '0.01'];
const dec = s => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return c; };

/* the decision from the stage-1 chunks: ids, the panel's couples in order; files, each chunk 0's parsed record */
export function decideStage(ids, files, n1 = STAGE1, bar = STAGE_BAR) {
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
  const on = [];
  for (const id of ids) {
    const A = at[`${id}|APP|-`];
    if (!A) { P.push(`${id} APP: its stage-1 chunk missing`); continue; }
    for (const w of WEIGHTS) {
      const C = at[`${id}|CANDC|${w}`];
      if (!C) { P.push(`${id} CANDC ${w}: its stage-1 chunk missing`); continue; }
      for (const [nm, x] of [['CANDC', C], ['APP', A]]) if (x.lo !== 0 || x.hi !== Math.min(n1, x.N)) P.push(`${id} ${nm} ${x.w}: its stage-1 chunk paths ${x.lo} to ${x.hi}, not 0 to ${Math.min(n1, x.N)}`);
      if (C.inputs !== A.inputs) P.push(`${id} ${w}: CANDC and APP on different plans`);
      if (P.length) continue;
      const c = dec(C.main.survived), a = dec(A.main.survived), n = Math.min(c.length, a.length);
      let sc = 0, sa = 0; for (let i = 0; i < n; i++) { sc += c[i]; sa += a[i]; }
      const d = (100 * (sc - sa)) / n;
      // a couple whose N is no more than the first stage has nothing to go on to
      if (d < bar - 1e-12 && C.N > n1) on.push({ id, w });
    }
  }
  return { P, on, stamp: stamps.size === 1 ? JSON.parse([...stamps][0]) : null };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N1 = 1000, stamp = { code: 'c', audit: 'a' };
  // a couple's stage-1 chunks: APP surviving a of N1, CANDC at each weight c02 and c01
  const chunk = (id, arm, w, k, extra = {}) => { const s = new Uint8Array(N1); for (let i = 0; i < k; i++) s[i] = 1; return { id, arm, w, chunk: 0, lo: 0, hi: N1, N: 4000, seed: 7021, inputs: 'I', stamp, main: { survived: Buffer.from(s).toString('base64') }, ...extra }; };
  const couple = (id, a, c02, c01) => [chunk(id, 'APP', '-', a), chunk(id, 'CANDC', '0.02', c02), chunk(id, 'CANDC', '0.01', c01)];
  // +0.5 points of 1,000 paths is 5 paths: 855 against 850 stops; 854 goes on; a loss goes on
  const r = decideStage(['A', 'B', 'C'], [...couple('A', 850, 855, 854), ...couple('B', 850, 900, 840), ...couple('C', 850, 850, 860)], N1);
  check(`the edge: +0.5 exactly stops, +0.4 goes on; a loss goes on; no change goes on (on: ${r.on.map(x => `${x.id} ${x.w}`).join(', ')})`, r.P.length === 0 && r.on.map(x => `${x.id}${x.w}`).join() === 'A0.01,B0.01,C0.02');
  const miss = decideStage(['A'], couple('A', 850, 855, 854).slice(0, 2), N1);
  check('a stage-1 chunk missing is refused before any decision', miss.P.some(x => /CANDC 0.01: its stage-1 chunk missing/.test(x)));
  const two = decideStage(['A'], [...couple('A', 850, 855, 854), chunk('A', 'APP', '-', 850, { stamp: { code: 'd', audit: 'a' } })], N1);
  check('a chunk written twice, on another stamp, is refused', two.P.some(x => /written twice/.test(x)) && two.P.some(x => /2 stamps/.test(x)));
  const off = decideStage(['A'], [chunk('A', 'APP', '-', 850), chunk('A', 'CANDC', '0.02', 855, { lo: 1000, hi: 2000 }), chunk('A', 'CANDC', '0.01', 854)], N1);
  check('a chunk not on the first stage\'s paths is refused', off.P.some(x => /not 0 to 1000/.test(x)));
  const short = decideStage(['A'], couple('A', 850, 800, 800).map(c => ({ ...c, N: N1 })), N1);
  check('a couple whose N is no more than the first stage goes on to nothing', short.P.length === 0 && short.on.length === 0);
  // the CLI: it writes stage2.json and prints the count alone
  const dir = mkdtempSync(join(tmpdir(), 'stage-couples-'));
  try {
    for (const c of couple('A', 850, 855, 854)) writeFileSync(join(dir, `${c.id}-${c.arm.toLowerCase()}-w${c.w}-c0.json.gz`), gzipSync(JSON.stringify(c)));
    const out = run(dir, ['A'], N1, () => {});
    const j = JSON.parse(readFileSync(join(dir, 'stage2.json'), 'utf8'));
    check(`the CLI writes stage2.json and prints the count alone ("${out}")`, j.continue.length === 1 && j.continue[0].w === '0.01' && /^stage 2: 1 of 2 couple-weights go on$/.test(out));
  } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log('EDGES: a couple exactly +0.5 points up (stops), +0.4 (goes on), no change (goes on), a missing chunk, a chunk off the first stage, a couple with nothing past the first stage');
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

/* read the folder's stage-1 chunks, decide, write stage2.json; returns the one line it prints */
export function run(dir, ids, n1 = STAGE1, exit = code => process.exit(code)) {
  const files = readdirSync(dir).filter(x => /-c0\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()));
  const r = decideStage(ids, files, n1);
  if (r.P.length) { console.log(`STAGE GATE REFUSED (no decision):\n  ${r.P.join('\n  ')}`); exit(1); return null; }
  writeFileSync(join(dir, 'stage2.json'), JSON.stringify({ built: new Date().toISOString(), rule: `after ${n1} paths a couple and weight whose CANDC survival is ${STAGE_BAR} points or more above APP's stops; every other runs to its N`, n1, bar: STAGE_BAR, stamp: r.stamp, continue: r.on }, null, 1) + '\n');
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
