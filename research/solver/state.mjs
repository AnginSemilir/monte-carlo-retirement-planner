/*
 * STATE.md'S FIGURES (CHECKLIST.md item 6; the external review of 21 Oct, Part B Step 3). Every figure in
 * research/solver/STATE.md sits in a printed block, `<!-- printed:NAME -->` to `<!-- end printed:NAME -->`, whose text is
 * exactly what this script prints for NAME from the results files and the code. Nothing in a block is typed by hand.
 *   node research/solver/state.mjs [name]      print one block, or every block
 *   node research/solver/state.mjs --write     rewrite STATE.md's printed blocks in place
 *   node research/solver/state.mjs --check     exit 1 when any printed block differs from what the files give
 * A block whose results file does not exist yet prints "pending: <file>"; a file that exists but lacks the line asked for
 * is an error (the figure moved, or the file is not what the block thinks it is).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..'), STATE = join(HERE, 'STATE.md');
const sha = x => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex').slice(0, 12);
const read = rel => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : null);
/* the first match of `re` in the file, or the pending marker; a file without the match throws */
function pick(rel, re, fmt = m => m[0]) {
  const t = read(rel);
  if (t === null) return `pending: ${rel}`;
  const m = re.exec(t);
  if (!m) throw new Error(`state.mjs: ${rel} has no line matching ${re}`);
  return fmt(m);
}
const verdict = rel => pick(rel, /^(ALL PASS: \d+ checks|FAILED: \d+ of \d+ checks)/m, m => m[1]);
const failedBefore = rel => pick(rel, /must fail[\s\S]*?^(FAILED: \d+ of \d+ checks)/m, m => m[1]);

const BLOCKS = {
  // the candidate and the product baseline: their settings and a hash of each (the code's own objects)
  async candidate() {
    const C = await import('./candidate.mjs'), S = await import('../../src/solver/solve.js'), P = await import('./e3pcls-pin.mjs');
    const cand = { opts: C.CANDIDATE_OPTS, tiers: C.CANDIDATE_TIERS, reals: C.blendReals() };
    const opts = Object.entries(C.CANDIDATE_OPTS).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ');
    return [
      `- The candidate (\`research/solver/candidate.json\`, read by candidate.mjs: assembled for 7u-F with the adaptive package, D5, and frozen until 7u-F reads): ${opts}; tiers ${C.CANDIDATE_TIERS} (O60's blend medians: ${Object.entries(cand.reals).map(([k, v]) => `${k} ${v}%`).join(', ')}). Hash ${C.CANDIDATE_HASH}${C.CANDIDATE_HASH === sha(cand) ? '' : ' (state.mjs reads ' + sha(cand) + ')'}; before the assembly, the package's keys removed (\`FROZEN_OPTS\`, 7u's CAND): ${C.FROZEN_HASH}.`,
      `- The product baseline (\`PRODUCT_BASELINE\`, src/solver/solve.js): ${Object.entries(S.PRODUCT_BASELINE).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ')}. Hash ${sha(S.PRODUCT_BASELINE)}.`,
      `- The solver code the e3pcls pin last passed on: ${P.readPin().fingerprint} (${P.readPin().at}); the code now: ${P.fingerprint()}.`
    ];
  },
  // Step 1's results: each test's verdict on the fixed code and on the code before it, and the measurements
  step1() {
    const T = 'research/tests/', S = 'research/solver/';
    const tests = [['solver-invariants', 'O199, O200 and the guards (items 1 to 3)'], ['tier-above', 'F2a (item 5)'], ['solver-carry', 'F0 (item 6)'], ['tax-2026', 'F0a (item 7)'], ['table-guards', 'F0a under a table (item 8)']];
    const out = tests.map(([t, what]) => `- ${what}: \`${t}.test.mjs\` ${verdict(`${T}results-${t}.txt`)} on the fixed code, ${failedBefore(`${T}results-${t}.txt`)} before it (\`results-${t}.txt\`).`);
    for (const id of ['S070', 'S224', 'S380']) out.push(`- F2a's cost, ${id} held at Medium Risk, the engine before and after (\`results-tier-above-cost.txt\`): ${pick(`${S}results-tier-above-cost.txt`, new RegExp(`^${id}:[\\s\\S]*?before the fix ([\\d.]+)%, after ([\\d.]+)%: ([+-][\\d.]+) points \\(se ([\\d.]+); (\\d+) saved, (\\d+) lost\\)`, 'm'), m => `${m[1]}% to ${m[2]}%, ${m[3]} points (se ${m[4]}; ${m[5]} saved, ${m[6]} lost)`)}.`);
    for (const id of ['S330', 'S224', 'S070', 'S008', 'S172', 'S194']) {
      const before = pick('research/reviews/2026-10-21/results-exploratory.txt', new RegExp(`^${id}\\s+\\d+\\s+([\\d.]+)%\\s+([\\d.]+)%\\s+([+-]?[\\d.]+) \\(([\\d.]+)\\)\\s+(\\d+) / (\\d+)`, 'm'), m => `${m[3]} (${m[5]} / ${m[6]})`);
      const after = pick(`${S}results-engine-vs-fast.txt`, new RegExp(`"id":"${id}"[^}]*"fastMinusEngine":([+-]?[\\d.]+)[^}]*"fastOnly":(\\d+),"engineOnly":(\\d+)`), m => `${m[1]} (${m[2]} / ${m[3]})`);
      out.push(`- F0, ${id}, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: before ${before}, after ${after} (\`results-engine-vs-fast.txt\`).`);
    }
    out.push(`- O200's reach on the frozen candidate, 7u's 55 households: ${pick(`${S}results-reach-census.txt`, /^VERDICT: .*$/m)} (\`results-reach-census.txt\`).`);
    return out;
  },
  // the open items' measured effects on simulated outcomes
  items() {
    const S = 'research/solver/';
    const u7 = id => pick(`${S}results-7u.txt`, new RegExp(`^ {5}${id}\\s+(\\d+) saved/(\\d+) lost of (\\d+).*?change ([+-]?[\\d.]+) \\(exact ([+-]?[\\d.]+) to ([+-]?[\\d.]+);`, 'm'), m => `${m[4]} points (exact ${m[5]} to ${m[6]}; ${m[1]} saved, ${m[2]} lost of ${m[3]})`);
    return [
      '| id | the item | measured effect on simulated outcomes (results file) | what closes it | status |',
      '|---|---|---|---|---|',
      `| U-S224 | 7u: CAND against SHIP on S224 at estate weight 0.02, inconclusive | ${u7('S224')} (\`results-7u.txt\` item 1) | 7u-F | open |`,
      `| U-S380 | the same on S380, inconclusive | ${u7('S380')} (\`results-7u.txt\` item 1) | 7u-F | open |`,
      `| U-S364 / O132 | the same on S364, a plan that survives under half a percent under either arm | ${u7('S364')} (\`results-7u.txt\` item 1) | reported in 7u-F, not gated (SHIP below 5%) | open |`,
      `| O191 | the adaptive reference against the plan reference, S362's bad world | ${pick(`${S}results-refb.txt`, /^ +AN against C on S362 world 0: survival ([+-][\d.]+) exact \(([+-]?[\d.]+) to ([+-]?[\d.]+)\)/m, m => `${m[1]} points (exact ${m[2]} to ${m[3]})`)} (\`results-refb.txt\`) | reported in 7u-F's by-world item; below the 1-point gate | open, not a gate |`,
      `| O179 | the fixed reference against the unfixed on S362's bad world | ${pick(`${S}results-foot-s362.txt`, /world 0: .*?lost (\d+) saved (\d+) of (\d+), change ([+-][\d.]+) \(([+-]?[\d.]+) to ([+-]?[\d.]+)\)/, m => `${m[4]} points (${m[5]} to ${m[6]}; ${m[2]} saved, ${m[1]} lost of ${m[3]})`)} (\`results-foot-s362.txt\`) | as O191 | open, not a gate |`,
      '| O195 | S366 unread at the frozen candidate | none yet: a missing read | 7u-F\'s panel reads it | open |',
      '| O194 | the bridge reader\'s reference, undecided | none: a choice | the assembly carries it (D5: the adaptive package in candidate.json) | closed by the assembly |',
      `| PR35 | the twelve-point rule on each side of a bridge split, under the package | its worst miss against the 4,000-return reference, in score units (survival as a fraction): ${pick(`${S}results-pr31-split.txt`, /NEAR: where the split acts.*?the worst ([\d.e-]+) \(([^)]*)\)/, m => `${m[1]} (${m[2]})`)} (\`results-pr31-split.txt\`) | below a tenth of a point of survival whatever its sign: not a bug (Step 4's rule) | closed, reported |`,
      '| PR24, PR29, PR31 | premises naming 7u-F: the order reference standing in for the candidate\'s, the adaptive reference\'s exact steps, the chooser\'s split at the reference\'s own step | carried by D5: the adaptive package, with PR31\'s split, is the reference the assembled candidate takes, and 7u-F\'s decomposing arm reads the reference\'s part | 7u-F | not gates |',
      '| T-GAPS | gaps between a table and simulation (sizes in the next block) | none measured on simulated outcomes | known limitations; 7u-F\'s by-world item reports them, and V3 and V4 measure what matters | not gates (D2) |'
    ];
  },
  // the known limitations: gaps between a table's forecast and simulation, with their sizes (Step 4's triage)
  limitations() {
    const S = 'research/solver/';
    return [
      `- O133, year-0 tables above simulation on the broad households below 95: ${pick(`${S}results-o133-scan.txt`, /^SHIP: (.*)$/m, m => `SHIP ${m[1]}`)}; ${pick(`${S}results-o133-scan.txt`, /^CAND: (.*)$/m, m => `CAND ${m[1]}`)} (\`results-o133-scan.txt\`).`,
      `- O139, S380's world 0 under the candidate: ${pick(`${S}results-neroot.txt`, /world 0 \(z -1\.732051, weight [\d.]+\): OWN table ([\d.]+) sim ([\d.]+)/, m => `table ${m[1]} against ${m[2]} simulated`)} (\`results-neroot.txt\`).`,
      '- O145, the under-read left when the wealth axis is refined (S224, S380): a deep review\'s extrapolation, in no results file (archive/deep-review-log.md, 11 Oct).',
      `- O180, S370's bad world: ${pick(`${S}results-hodep-s370.txt`, /world 0: table ([\d.]+) runs (\d+)\/(\d+) \(([\d.]+)\), table less runs ([\d.]+)/, m => `table ${m[1]} against ${m[4]} run (${m[2]} of ${m[3]}), ${m[5]} points over`)} (\`results-hodep-s370.txt\`).`,
      `- O189, S128's bridge part: ${pick(`${S}results-copyb.txt`, /S128 CW world 0: GB ([\d.]+)/, m => `world 0 GB ${m[1]}`)}, ${pick(`${S}results-copyb.txt`, /S128 CW world 1: GB ([\d.]+)/, m => `world 1 GB ${m[1]}`)} points (\`results-copyb.txt\`).`,
      `- O198, the top-cell fix's year-1 residual under the plan reference, world 0: ${pick(`${S}results-copyx.txt`, /SNRX world 0: .*?by year 1: ([+-]?[\d.]+)/, m => m[1])} points (\`results-copyx.txt\`).`,
      '- TOP-CELL, AA-UR and FD-X: diagnostics of table reads, not run; dropped as gates (D2).'
    ];
  },
  // Step 2's re-check, when it has run
  step2() {
    const S = 'research/solver/';
    const t = read(`${S}results-recheck-7u.txt`);
    if (t === null) return [`- pending: ${S}results-recheck-7u.txt`];
    return t.split('\n').filter(l => /^  \S|^VERDICT/.test(l)).map(l => `- ${l.trim()}`);
  },
  // Step 4: 7u's item 4 re-read by path, and 7u-F's power from 7u's records (reread-7u-item4.mjs)
  step4() {
    const R = 'research/solver/results-reread-7u-item4.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const out = [];
    for (const [w, item] of [['0.02', 4], ['0.01', 8]]) {
      const re = new RegExp(`^weight ${w.replace('.', '\\.')}: (\\d+) households[\\s\\S]*?the point: (-?[\\d.]+)[\\s\\S]*?7u's interval \\(pooled cells, pairs independent\\): (-?[\\d.]+) to (-?[\\d.]+)\\n  BY PATH \\(per-path means, paths independent\\): (-?[\\d.]+) to (-?[\\d.]+); se [\\d.]+, ([\\d.]+) times 7u's\\n  item 4's rule \\(lower end above -0\\.1\\): (\\w+) by path`, 'm');
      out.push(pick(R, re, m => `- 7u's item ${item} (the pooled floor at W${w}, ${m[1]} households) re-read by path: ${m[2]} points, by path ${m[5]} to ${m[6]} (7u's pooled cells ${m[3]} to ${m[4]}; ${m[7]} times as wide): ${m[8]} (\`${R.split('/').pop()}\`).`));
    }
    for (const w of ['0.02', '0.01']) out.push(pick(R, new RegExp(`^P1 at W${w.replace('.', '\\.')}: (\\d+) of the (\\d+) floor households have records; se by path [\\d.]+ at \\d+, about ([\\d.]+) at (\\d+): the interval's half-width about ([\\d.]+) points, so a true pooled change above (-?[\\d.]+) reads HELD`, 'm'),
      m => `- 7u-F's power at W${w} (from 7u's records on ${m[1]} of the ${m[2]} floor households): P1's se by path about ${m[3]} at ${m[4]} paths, its half-width about ${m[5]}: a true pooled change above ${m[6]} reads HELD.`));
    const pw = [...t.matchAll(/^  (\S+)\s+W([\d.]+): SHIP ([\d.]+)%, discordant ([\d.]+)% of paths; power for a true 1-point loss at \d+ paths ([\d.]+)$/gm)].filter(m => +m[3] >= 5 && +m[3] <= 99.5);
    if (!pw.length) throw new Error(`state.mjs: ${R} has no power lines`);
    const least = pw.reduce((a, m) => (+m[5] < +a[5] ? m : a));
    out.push(`- 7u-F's power under P2 (households in the band that 7u ran, both weights): the least ${least[5]} (${least[1]} at W${least[2]}, ${least[4]}% of paths discordant) for a true 1-point loss.`);
    return out;
  }
};

const block = async name => (await BLOCKS[name]()).join('\n');
const blocksIn = text => [...text.matchAll(/<!-- printed:(\w+) -->\n([\s\S]*?)\n?<!-- end printed:\1 -->/g)].map(m => ({ name: m[1], body: m[2], whole: m[0] }));
export async function checkBlocks(text) {
  const P = [];
  for (const b of blocksIn(text)) {
    if (!BLOCKS[b.name]) { P.push(`STATE.md prints a block "${b.name}" that state.mjs does not know`); continue; }
    const want = await block(b.name);
    if (b.body.trimEnd() !== want) P.push(`STATE.md's printed block "${b.name}" is not what state.mjs prints from the files now (run: node research/solver/state.mjs --write)`);
  }
  return P;
}
export { blocksIn, BLOCKS };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv[2];
  if (arg === '--write' || arg === '--check') {
    let text = readFileSync(STATE, 'utf8');
    if (arg === '--check') { const P = await checkBlocks(text); if (P.length) { console.log(P.join('\n')); process.exit(1); } console.log(`STATE.md's ${blocksIn(text).length} printed blocks match the files`); process.exit(0); }
    for (const b of blocksIn(text)) text = text.replace(b.whole, `<!-- printed:${b.name} -->\n${await block(b.name)}\n<!-- end printed:${b.name} -->`);
    writeFileSync(STATE, text);
    console.log(`STATE.md: ${blocksIn(text).length} printed blocks written`);
  } else for (const name of arg ? [arg] : Object.keys(BLOCKS)) console.log(`<!-- printed:${name} -->\n${await block(name)}\n<!-- end printed:${name} -->`);
}
