/*
 * THE COUPLES' RE-RUN'S SHARD FILTER (registrations/couples-d4b.md; its design review's MINOR 5, reviews/2026-11-11-couples-d4b-design.md:
 * the filter's own test before a worker session starts). batch-couples.sh runs, under D4_SHARD=i/n, only the chunks whose
 * number leaves i when divided by n. Checked on the script's own lines (its D4_SHARD checks and its shard() function, taken from
 * the file and run in bash, so the test reads what the batch runs):
 *   1. for n = 1 to 6, the n shards of 0..599 are disjoint and together every chunk exactly once;
 *   2. unset or empty, D4_SHARD is 0/1: every chunk;
 *   3. the bad values are refused before anything runs: i >= n, n = 0, a sign, a letter, a missing part, three parts;
 *   4. the good values are taken: 0/1, 0/4, 3/4, 10/11.
 * Plant D4B_SHARD_PLANT=offbyone runs `$1 % n == i + 1` in place of the filter: check 1 fails (a chunk run twice or never).
 *   node research/tests/d4b-shard.test.mjs
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '../solver/batch-couples.sh'), 'utf8').split('\n');
let pass = 0, fail = 0;
const ok = (name, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${name}${extra ? '  -- ' + extra : ''}`); };

// the script's own lines: SHARD's default, its two checks, and shard()
const pick = re => { const l = SRC.find(x => re.test(x)); if (!l) throw new Error(`d4b-shard: batch-couples.sh has no line matching ${re}`); return l; };
let lines = [pick(/^SHARD="\$\{D4_SHARD:-0\/1\}"$/), pick(/^case "\$SHARD" in /), pick(/^\[ "\$\{SHARD%\/\*\}" -lt "\$\{SHARD#\*\/\}" \]/), pick(/^shard\(\) \{ awk /)];
if (process.env.D4B_SHARD_PLANT === 'offbyone') lines = lines.map(l => l.replace("'NF && $1 % n == i'", "'NF && $1 % n == i + 1'"));
const bash = (shard, input) => {
  const env = { ...process.env }; if (shard === undefined) delete env.D4_SHARD; else env.D4_SHARD = shard;
  try { return { code: 0, out: execFileSync('bash', ['-c', `${lines.join('\n')}\nshard`], { env, input, encoding: 'utf8' }) }; }
  catch (e) { return { code: e.status, out: `${e.stdout || ''}${e.stderr || ''}` }; }
};
const ALL = Array.from({ length: 600 }, (_, k) => k), INPUT = ALL.join('\n') + '\n';
const nums = out => out.split('\n').filter(Boolean).map(Number);

// 1. every chunk exactly once over n shards
{
  const bad = [];
  for (let n = 1; n <= 6; n++) {
    const seen = new Map();
    for (let i = 0; i < n; i++) { const r = bash(`${i}/${n}`, INPUT); if (r.code) { bad.push(`${i}/${n} refused`); continue; } for (const k of nums(r.out)) seen.set(k, (seen.get(k) || 0) + 1); }
    const twice = ALL.filter(k => (seen.get(k) || 0) > 1).length, never = ALL.filter(k => !seen.get(k)).length;
    if (twice || never) bad.push(`n ${n}: ${twice} run twice, ${never} never`);
  }
  ok('1. for n = 1 to 6, the shards of chunks 0 to 599 are disjoint and cover every chunk once', bad.length === 0, bad.join('; '));
}
// 2. unset: all
{ const r = bash(undefined, INPUT), e = bash('', INPUT); ok('2. D4_SHARD unset or empty runs every chunk', [r, e].every(x => x.code === 0 && nums(x.out).join() === ALL.join()), `${nums(r.out).length} and ${nums(e.out).length} of 600`); }
// 3. refused
{
  const wrong = ['4/4', '5/4', '0/0', '-1/4', '1/-4', 'a/4', '1/b', '1/', '/4', '1', '1/2/3'].filter(v => { const r = bash(v, INPUT); return !(r.code === 2 && /D4_SHARD must be i\/n/.test(r.out)); });
  ok('3. a bad D4_SHARD is refused before any chunk is named (i >= n, n 0, a sign, a letter, a part missing, three parts)', wrong.length === 0, wrong.length ? `taken: ${wrong.map(v => `'${v}'`).join(', ')}` : '11 refused');
}
// 4. taken
{
  const refused = ['0/1', '0/4', '3/4', '10/11'].filter(v => bash(v, INPUT).code !== 0);
  ok('4. the good values are taken (0/1, 0/4, 3/4, 10/11)', refused.length === 0, refused.join(', '));
}
console.log('EDGES: the last shard (3/4, 10/11) and i one below n taken, i equal to n refused, n of 0 refused, D4_SHARD empty or unset meaning all');
console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
