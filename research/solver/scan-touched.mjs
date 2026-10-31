/*
 * WHICH LIBRARY HOUSEHOLDS HAD EARLIER RUNS TOUCHED, BY FOUR SCANS, AT 7U'S BROAD SELECTION (PLAN.md O129; the
 * plan-auditor's BLOCKING 1 and 2 on 63ece27: the counts behind O129 printed by a committed script, at the selection's
 * snapshot, since results/ is gitignored and 7u's own units will write the broad 30 into it).
 * The snapshot: files under results/ modified at or before CUTOFF (results-7u-broad.txt's own time, the selection's output),
 * Phase 4's band selection (results/p4-select) left out as both selectors leave it; the results-*.txt files as committed
 * at REV (53e80b0, the selection's commit), less results-p4-select.txt and results-7u-broad.txt.
 * The scans, each over the library's 210 single households:
 *   NAME     - select-phase4.mjs usedIds exactly: results/ only, an id from a file name /^(S\d+F?)[._]/ and the band files;
 *   MEANT    - the rule as meant: names and plain text of every file, a gzipped trace's own id field (not its payload), and
 *              the results-*.txt files;
 *   MEANT/R  - MEANT confined to results/ (select-phase4.mjs's walk), to show which misses are the walk's and which the names';
 *   PAYLOAD  - select-7u-broad.mjs usedIds as it ran: names and plain text, gzipped files read through (their base64
 *              payloads too), and the results-*.txt files.
 * Then each rule's pool (untouched and older than 44) and its 30 taken evenly, and the frozen panel against each scan.
 *   node research/solver/scan-touched.mjs > research/solver/results-scan-touched.txt
 *   node research/solver/scan-touched.mjs --planted
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { buildScenarios } from '../policy-study/scenarios.mjs';
import { pick, N_BROAD, MAX_FIRE_AGE } from './select-7u-broad.mjs';
import { BROAD } from './panel-7u.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CUTOFF = '2026-10-08T19:20:26.247Z', REV = '53e80b0';
const ID = /(?<![A-Za-z0-9])S\d{3}F?(?![0-9])/g;
export const idsIn = s => (String(s).match(ID) || []).map(m => m.replace(/F$/, ''));

function planted() {
  const cases = [
    ['a hyphenated trace name, an underscore name, an F id as its base', idsIn('S120-cand-x.json.gz S122_case S302F').join(','), 'S120,S122,S302'],
    ['not a four-digit run, not glued to a letter or digit', idsIn('S9999 xS100 2S101').join(','), ''],
    ['a base64-like payload matches by chance (why PAYLOAD overcounts)', idsIn('AAA+S482aZZ/S013=').join(','), 'S482,S013'],
  ];
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED: ${bad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  planted();
  if (process.argv.includes('--planted')) process.exit(0);
  const cut = new Date(CUTOFF).getTime(), S = { NAME: new Set(), MEANT: new Set(), MEANTR: new Set(), PAYLOAD: new Set() }, where = {};
  const add = (k, ids, src) => { for (const id of ids) { S[k].add(id); if (src) (where[id] ||= new Set()).add(src); } };
  let files = 0;
  const walk = d => {
    for (const f of readdirSync(d)) {
      const p = join(d, f), st = statSync(p);
      if (st.isDirectory()) { if (f !== 'p4-select') walk(p); continue; }
      if (st.mtimeMs > cut) continue;
      files++;
      const m = f.match(/^(S\d+F?)[._]/); if (m) S.NAME.add(m[1].replace(/F$/, ''));
      const buf = readFileSync(p);
      if (/^(couple-)?band-.*\.json$/.test(f)) JSON.parse(buf.toString('utf8')).forEach(r => r.id && S.NAME.add(r.id));
      for (const k of ['MEANT', 'MEANTR', 'PAYLOAD']) add(k, idsIn(f));
      if (f.endsWith('.gz')) {
        const txt = gunzipSync(buf).toString('latin1');
        add('PAYLOAD', idsIn(txt), 'gz');
        let j = null; try { j = JSON.parse(txt); } catch { j = null; }
        if (j && !Array.isArray(j) && j.id != null) { add('MEANT', idsIn(j.id)); add('MEANTR', idsIn(j.id)); }
      } else { const t = buf.toString('latin1'); for (const k of ['MEANT', 'MEANTR', 'PAYLOAD']) add(k, idsIn(t), k === 'PAYLOAD' ? 'plain' : null); }
    }
  };
  walk(join(HERE, 'results'));
  const txts = execFileSync('git', ['-C', HERE, 'ls-tree', '--name-only', REV, '.'], { encoding: 'utf8' }).split('\n').map(x => x.replace(/^.*\//, ''))
    .filter(f => /^results-.*\.txt$/.test(f) && f !== 'results-p4-select.txt' && f !== 'results-7u-broad.txt');
  for (const f of txts) { const t = f + '\n' + execFileSync('git', ['-C', HERE, 'show', `${REV}:research/solver/${f}`], { encoding: 'latin1', maxBuffer: 1 << 30 }); add('MEANT', idsIn(t)); add('PAYLOAD', idsIn(t), 'plain'); }
  const singles = buildScenarios().filter(s => s.plan.demographics.planningMode === 'single').map(s => ({ id: s.id, age: Number(s.plan.demographics.currentAgeSelf), name: s.name }));
  const ids = singles.map(s => s.id), cnt = k => ids.filter(id => S[k].has(id)).length;
  console.log(`THE SCANS at the selection's snapshot (results/ files modified at or before ${CUTOFF}, ${files} read, p4-select left out; ${txts.length} results-*.txt files as committed at ${REV}), over the library's ${singles.length} single households:`);
  console.log(`  NAME (select-phase4.mjs usedIds exactly): ${cnt('NAME')} touched`);
  console.log(`  MEANT (names, plain text, a gzipped trace's id field, the results-*.txt files): ${cnt('MEANT')} touched`);
  console.log(`  MEANT/R (MEANT confined to results/): ${cnt('MEANTR')} touched`);
  console.log(`  PAYLOAD (select-7u-broad.mjs as it ran, gzipped payloads read through): ${cnt('PAYLOAD')} touched`);
  const missN = ids.filter(id => S.MEANT.has(id) && !S.NAME.has(id));
  console.log(`  touched by MEANT, missed by NAME: ${missN.length} (${missN.map(id => `${id}${S.MEANTR.has(id) ? '' : ' (results-*.txt only: outside the results/ walk)'}`).join(', ')})`);
  const payOnly = ids.filter(id => S.PAYLOAD.has(id) && !S.MEANT.has(id));
  console.log(`  touched by PAYLOAD only (found only inside gzipped payloads): ${payOnly.length}`);
  const young = ids.filter(id => singles.find(s => s.id === id).age <= MAX_FIRE_AGE);
  console.log(`  aged ${MAX_FIRE_AGE} or under (Phase 4's FIRE bases): ${young.length} of the ${singles.length}; untouched by MEANT ${young.filter(id => !S.MEANT.has(id)).length}, by PAYLOAD ${young.filter(id => !S.PAYLOAD.has(id)).length}`);
  const asRun = pick(singles, S.PAYLOAD), asMeant = pick(singles, S.MEANT);
  console.log(`\nTHE POOLS (untouched and older than ${MAX_FIRE_AGE}) and ${N_BROAD} taken evenly:`);
  console.log(`  as run (PAYLOAD): ${asRun.pool.length}; its panel ${asRun.panel.map(s => s.id).join(' ')} - ${asRun.panel.map(s => s.id).join(' ') === BROAD.join(' ') ? 'the frozen panel (results-7u-broad.txt)' : 'NOT the frozen panel'}`);
  console.log(`  as meant (MEANT): ${asMeant.pool.length}; its panel ${asMeant.panel.map(s => s.id).join(' ')}; shared with the frozen panel: ${asMeant.panel.filter(s => BROAD.includes(s.id)).length} of ${N_BROAD}`);
  const stage = s => s.name.split('/')[0], tally = p => Object.entries(p.reduce((o, s) => ((o[stage(s)] = (o[stage(s)] || 0) + 1), o), {})).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(`  by life stage - frozen: ${tally(asRun.panel)}; as meant: ${tally(asMeant.panel)}`);
  console.log(`\nTHE FROZEN 30 against each scan: touched by NAME ${BROAD.filter(id => S.NAME.has(id)).length}, by MEANT ${BROAD.filter(id => S.MEANT.has(id)).length}, by PAYLOAD ${BROAD.filter(id => S.PAYLOAD.has(id)).length}`);
}
