/*
 * THE PATTERN SEARCH FOR A HELD-OUT SCAN TAKEN WITHOUT ITS RESULTS (CHECKLIST 7; EXPLORATORY). On 22 Nov a freeze run in a
 * worktree, which has no research/solver/results (git does not track it), scanned without every id only the results name and
 * took S033, landed as a reserve of step 8's panel, as untouched; held-out.mjs touchedAll now refuses such a tree. Here every
 * frozen scan the research has taken (each *.json in research/solver with a `touched` list and a `built` time) is read against
 * the main tree's results as they stood at its freeze: the ids named by a results file last written before the freeze (its
 * name, and its contents as phase4-panel.mjs touched() reads them), each such id the freeze's touched list lacks printed, with
 * whether the freeze's own record names it beyond that list (an order or a panel taking it). A file written before a freeze
 * and rewritten after it is not counted, so the search can miss, never invent.
 *   node research/solver/held-out-pattern.mjs > research/solver/results-held-out-pattern.txt     (from the main tree)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { idsIn } from './scan-touched.mjs';
import { resultsProblem } from './held-out.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), RES = join(HERE, 'results');
const p = resultsProblem(HERE);
if (p) { console.error(`held-out-pattern: ${p}`); process.exit(2); }
// every results file with its last write and the ids it names, as phase4-panel.mjs touched() reads them (its own panel's
// files skipped as touched() skips them)
const OWN = /^(phase4-panel\.json|phase4-orders\.json)$/;
const files = [];
const walk = d => {
  for (const f of readdirSync(d)) {
    const q = join(d, f); let st; try { st = statSync(q); } catch { continue; }
    if (OWN.test(f)) continue;
    if (st.isDirectory()) { walk(q); continue; }
    const ids = new Set(idsIn(f));
    const buf = readFileSync(q);
    if (f.endsWith('.gz')) { let j = null; try { j = JSON.parse(gunzipSync(buf).toString('latin1')); } catch { j = null; } if (j && !Array.isArray(j) && j.id != null) idsIn(String(j.id)).forEach(x => ids.add(x)); }
    else idsIn(buf.toString('latin1')).forEach(x => ids.add(x));
    files.push({ path: q.slice(RES.length + 1), mtime: st.mtimeMs, ids });
  }
};
walk(RES);
const freezes = readdirSync(HERE).filter(f => f.endsWith('.json')).map(f => { try { return [f, JSON.parse(readFileSync(join(HERE, f), 'utf8'))]; } catch { return null; } })
  .filter(x => x && x[1] && x[1].touched && x[1].built).sort((a, b) => Date.parse(a[1].built) - Date.parse(b[1].built));
console.log(`THE PATTERN SEARCH: a held-out scan taken without its results (EXPLORATORY; CHECKLIST 7): ${files.length} results files read; ${freezes.length} frozen scans`);
let bad = 0;
for (const [f, j] of freezes) {
  const at = Date.parse(j.built), seen = new Set(j.touched.ids || []), before = files.filter(x => x.mtime < at);
  const named = new Set(); for (const x of before) for (const id of x.ids) named.add(id);
  const missed = [...named].filter(id => !seen.has(id)).sort();
  const rest = JSON.stringify({ ...j, touched: null });
  const taken = missed.filter(id => new RegExp(`\\b${id}F?\\b`).test(rest));
  if (taken.length) bad++;
  console.log(`${f} (frozen ${j.built}, ${seen.size} touched): results files written before it ${before.length}, the ids they name ${named.size}; named there but not in its touched list: ${missed.length ? missed.join(', ') : 'none'}${missed.length ? `; of those, named in its own order or panel: ${taken.length ? taken.join(', ') : 'none'}` : ''}`);
}
console.log(bad ? `FOUND: ${bad} frozen scans took a household the results already named` : 'NONE: no frozen scan took a household the results named before it was taken');
