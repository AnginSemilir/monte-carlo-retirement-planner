/*
 * 7U'S BROAD PANEL: 30 LIBRARY HOUSEHOLDS CHOSEN BY A RULE THAT NEVER LOOKS AT THE SOLVER (PLAN.md 7u: "a broad panel of
 * ordinary library households chosen by a rule that never looks at the solver"). The rule, fixed here before any 7u unit
 * runs:
 *   1. the library's single households (policy-study/scenarios.mjs buildScenarios), in library order;
 *   2. less every household any earlier run has touched: an id (S + three digits, with or without F) in the name or the
 *      text of any file under results/ (gzipped traces read through) or in any results-*.txt, except Phase 4's band
 *      selection (results/p4-select and results-p4-select.txt, which ran the app's own pipeline on every candidate to
 *      draw Panel H, and which select-phase4.mjs's own rule leaves out the same way). A content scan, not names alone:
 *      select-phase4.mjs usedIds reads names alone and misses ids that appear only inside logs (S120's traces are named
 *      'S120-cand-...'; the case logs carry ids in their text), so it lists 7e's own S120, S122, S168 and S360 as free;
 *   3. less every household aged 44 or under: Phase 4's FIRE cohort is built from them (select-phase4.mjs, retiring at
 *      52; 30 in the library for 20 places), and a base household 7u ran would go to the back of that list;
 *   4. of what remains, in library order, 30 taken evenly: index floor(i x n / 30), i = 0 to 29.
 * The scan reads the tree as it stands, so the answer holds only until a later run touches one of the 30 (7u's own logs
 * will touch all of them): the selection is made once, its output committed (results-7u-broad.txt), and 7u's audit and
 * reducer hold the panel to that file's BROAD line.
 * Phase 4's library half needs no other exclusion: its rule takes the first 20 free households at its own selection,
 * after excluding every id under results/, which 7u's logs will then hold.
 * A FLAW IN STEP 2, FOUND AFTER THE SELECTION (8 Oct, building 7u's prediction; PLAN.md O129): reading gzipped traces
 * through also reads their base64 payloads, where an id-like string ('+S482a') matches by chance. Of the 156 singles the
 * header line counts as touched, 65 are found only inside gzipped payloads; a scan of names and plain text finds 91. So the
 * pool was 48 households where the rule meant about 113, and "touched" overstates. The 30 are untouched by either scan
 * (0 of 30 by the plain one), the extra exclusions fall at random with respect to the solver, and nothing outcome-related
 * was seen before or after, so the panel is kept as selected and frozen (results-7u-broad.txt). A later selector (P4-LAND,
 * 8f) reads a gzipped trace's id field, not its payload. This script is left as it ran, so it reproduces the frozen panel.
 *   node research/solver/select-7u-broad.mjs > research/solver/results-7u-broad.txt
 *   node research/solver/select-7u-broad.mjs --planted
 */
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
export const N_BROAD = 30, MAX_FIRE_AGE = 44;
const ID = /(?<![A-Za-z0-9])S\d{3}F?(?![0-9])/g;   // not glued to a letter or digit before, no fourth digit after ('S120_' and 'S120-' both read)
// left out of the scan: Phase 4's band selection (see 2. above), and this script's own output, whose planted lines name ids
const SKIP_DIR = 'p4-select', SKIP_FILES = new Set(['results-p4-select.txt', 'results-7u-broad.txt']);

/* every id a run has touched: names and texts under results/ (gzip read through), and the results-*.txt files */
export function usedIds(root = HERE) {
  const ids = new Set(), add = s => { for (const m of s.match(ID) || []) ids.add(m.replace(/F$/, '')); };
  const walk = d => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { if (f !== SKIP_DIR) walk(p); continue; }
      add(f);
      const buf = readFileSync(p);
      add((f.endsWith('.gz') ? gunzipSync(buf) : buf).toString('latin1'));
    }
  };
  if (existsSync(join(root, 'results'))) walk(join(root, 'results'));
  for (const f of readdirSync(root).filter(f => /^results-.*\.txt$/.test(f) && !SKIP_FILES.has(f))) add(f + '\n' + readFileSync(join(root, f), 'utf8'));
  return ids;
}
/* the rule's steps 1, 3 and 4, on a list of { id, age } in library order and a used set */
export function pick(singles, used, n = N_BROAD) {
  const pool = singles.filter(s => !used.has(s.id) && s.age > MAX_FIRE_AGE);
  if (pool.length < n) throw new Error(`only ${pool.length} households left for ${n} places`);
  return { pool, panel: Array.from({ length: n }, (_, i) => pool[Math.floor(i * pool.length / n)]) };
}

function planted() {
  const L = Array.from({ length: 12 }, (_, i) => ({ id: `S${String(2 * i).padStart(3, '0')}`, age: i < 2 ? 40 : 60 }));
  const cases = [];
  { const { pool, panel } = pick(L, new Set(['S004']), 3);
    cases.push(['the young and the used left out', pool.map(x => x.id).join(','), 'S006,S008,S010,S012,S014,S016,S018,S020,S022']);
    cases.push(['three taken evenly in library order (indices 0, 3, 6 of 9)', panel.map(x => x.id).join(','), 'S006,S012,S018']); }
  { let threw = 'no'; try { pick(L, new Set(), 11); } catch { threw = 'threw'; } cases.push(['fewer left than places is an error', threw, 'threw']); }
  cases.push(['an age of exactly 44 is a FIRE base, 45 is not', pick([{ id: 'S100', age: 44 }, { id: 'S102', age: 45 }], new Set(), 1).panel[0].id, 'S102']);
  { const s = 'x S120-cand-candidate@w0.01.json.gz S302F y\nS9999 xS100 S101_'; const ids = new Set(); for (const m of s.match(ID) || []) ids.add(m.replace(/F$/, ''));
    cases.push(['ids read from text: a hyphenated trace name, an F id as its base, not a four-digit or glued id', [...ids].sort().join(','), 'S101,S120,S302']); }
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED: ${bad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\nEDGES: an age of exactly 44, fewer households than places`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single').map(s => ({ id: s.id, age: Number(s.plan.demographics.currentAgeSelf), name: s.name }));
  const used = usedIds(), { pool, panel } = pick(singles, used);
  console.log(`\n7U'S BROAD PANEL (select-7u-broad.mjs; the rule in its header): ${singles.length} single households; ${singles.filter(s => used.has(s.id)).length} touched by an earlier run (a content scan of results/ and results-*.txt, Phase 4's band selection left out); ${singles.filter(s => !used.has(s.id) && s.age <= MAX_FIRE_AGE).length} more aged ${MAX_FIRE_AGE} or under (Phase 4's FIRE bases); ${pool.length} left; ${N_BROAD} taken evenly`);
  for (const s of panel) console.log(`  ${s.id} age ${s.age} ${s.name}`);
  console.log(`BROAD: ${panel.map(s => s.id).join(' ')}`);
  console.log(`BROAD sha256 ${createHash('sha256').update(panel.map(s => s.id).join(' ')).digest('hex').slice(0, 16)}`);
}
