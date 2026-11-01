/*
 * THE FULL TIER IN SHARDS (the launch plan of 1 Nov, B14; .github/workflows/full.yml). Every *.test.mjs in research/tests,
 * as `run-all.mjs all` finds them, split into N shards by a fixed split balanced on the last full run's times
 * (research/tests/shard-times.json): the files longest first, each to the shard with the least time so far, ties to the
 * lower shard; a file the times do not know is counted at NEW_SECS. The split is a function of the file list and the
 * times alone, so the shards partition the tier (checked here before anything runs). This shard's files run longest
 * first, J at a time, each as its own process; it exits 1 unless every one ran to exit 0, as run-all.mjs does, and prints
 * a GitHub warning if the shard passes four hours.
 *   node research/tests/run-shard.mjs <shard 1..N> <N> [-j J]     run one shard
 *   node research/tests/run-shard.mjs --plan <N>                  print the split, run nothing
 */
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const NEW_SECS = 300;

/* the split: files -> shard index (0-based), with each shard's expected seconds */
export function split(files, times, n) {
  const secs = f => (Number.isFinite(times[f]) ? times[f] : NEW_SECS);
  const order = [...files].sort((a, b) => secs(b) - secs(a) || (a < b ? -1 : a > b ? 1 : 0));
  const load = Array(n).fill(0), shards = Array.from({ length: n }, () => []);
  for (const f of order) { let k = 0; for (let i = 1; i < n; i++) if (load[i] < load[k]) k = i; shards[k].push(f); load[k] += secs(f); }
  return { shards, load, secs };
}
export const tierFiles = (dir = HERE) => readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort();
export const loadTimes = (dir = HERE) => JSON.parse(readFileSync(join(dir, 'shard-times.json'), 'utf8')).times;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2), jAt = args.indexOf('-j'), J = jAt >= 0 ? Math.max(1, Number(args[jAt + 1]) || 1) : 1;
  const planOnly = args[0] === '--plan', N = Number(planOnly ? args[1] : args[1]), K = planOnly ? null : Number(args[0]);
  if (!(N >= 1) || (!planOnly && !(K >= 1 && K <= N))) { console.error('run-shard: usage: run-shard.mjs <shard 1..N> <N> [-j J] | --plan <N>'); process.exit(2); }
  const files = tierFiles(), times = loadTimes(), { shards, load, secs } = split(files, times, N);
  const all = shards.flat();
  if (all.length !== files.length || new Set(all).size !== files.length || !files.every(f => all.includes(f))) { console.error('run-shard: the shards do not partition the tier'); process.exit(2); }
  const unknown = files.filter(f => !Number.isFinite(times[f]));
  shards.forEach((s, i) => console.log(`shard ${i + 1} of ${N}: ${s.length} files, about ${(load[i] / 3600).toFixed(2)} CPU-hours by the last full run's times`));
  if (unknown.length) console.log(`counted at ${NEW_SECS} s, not in shard-times.json: ${unknown.join(', ')}`);
  if (planOnly) { shards.forEach((s, i) => console.log(`${i + 1}: ${s.join(' ')}`)); process.exit(0); }

  const mine = shards[K - 1], t0 = Date.now(), results = [];
  console.log(`this shard (${K}): ${mine.length} of ${files.length} files, ${J} at a time`);
  const warn = setTimeout(() => console.log(`::warning::the full tier's shard ${K} of ${N} has run past four hours`), 4 * 3600e3);
  warn.unref();
  const runOne = f => new Promise(res => {
    const t1 = Date.now();
    if (!existsSync(join(HERE, f))) { results.push({ f, code: 'missing' }); return res(); }
    const p = spawn(process.execPath, [join(HERE, f)], { cwd: join(HERE, '../..'), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', d => { out = (out + d).slice(-4000); }); p.stderr.on('data', d => { out = (out + d).slice(-4000); });
    p.on('close', code => {
      const s = Math.round((Date.now() - t1) / 1000), tail = out.trim().split('\n').slice(-3).join(' | ');
      results.push({ f, code });
      console.log(`${code === 0 ? 'ok  ' : 'FAIL'} ${f} (${s} s; ${secs(f)} s last run)${code === 0 ? '' : `: ${tail.slice(0, 300)}`}`);
      res();
    });
  });
  const queue = [...mine];
  await Promise.all(Array.from({ length: Math.min(J, queue.length) }, async () => { while (queue.length) await runOne(queue.shift()); }));
  const bad = results.filter(r => r.code !== 0), hrs = (Date.now() - t0) / 3600e3;
  if (hrs > 4) console.log(`::warning::the full tier's shard ${K} of ${N} took ${hrs.toFixed(2)} hours`);
  console.log(`run-shard ${K} of ${N}: ${mine.length} files, ${results.length} run, ${results.length - bad.length} passed in ${hrs.toFixed(2)} hours${bad.length ? `, FAILED: ${bad.map(r => `${r.f} (${r.code})`).join(', ')}` : ''}`);
  process.exit(bad.length === 0 && results.length === mine.length ? 0 : 1);
}
