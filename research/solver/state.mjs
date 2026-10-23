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
      `- 7u-F's decomposing arm (DECOMP, D5): the candidate on the plan reference, readerRef and its lattice removed (\`audit-7uf.mjs\`). Hash ${C.hashOf(Object.fromEntries(Object.entries(C.CANDIDATE_OPTS).filter(([k]) => k !== 'readerRef' && k !== 'adaptiveLattice')))}.`,
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
    out.push(`- O200's reach (item 4), counted and then dropped: ${pick(`${S}results-reach-census.txt`, /^VERDICT: (.*)$/m, m => m[1])} (\`results-reach-census.txt\`).`);
    // after 7u-F (D20 (6) and the guardrail flag): the adaptive reference's and the couple's argmax loops, fast.js's lost year
    const G = `${T}results-solver-guards.txt`;
    out.push(`- After 7u-F, the argmax loops left (\`adaptive.js\`, \`couple.js\`) and \`fast.js\`'s lost-year flag: \`solver-guards.test.mjs\` ${verdict(G)} on the fixed code, ${pick(G, /must fail[\s\S]*?^(FAILED: \d+ of \d+ checks)/m, m => m[1])} with the guards out and the old flag line back (\`results-solver-guards.txt\`).`);
    return out;
  },
  // the open items' measured effects on simulated outcomes
  items() {
    const S = 'research/solver/';
    const u7 = id => pick(`${S}results-7u.txt`, new RegExp(`^ {5}${id}\\s+(\\d+) saved/(\\d+) lost of (\\d+).*?change ([+-]?[\\d.]+) \\(exact ([+-]?[\\d.]+) to ([+-]?[\\d.]+);`, 'm'), m => `${m[4]} points (exact ${m[5]} to ${m[6]}; ${m[1]} saved, ${m[2]} lost of ${m[3]})`);
    // 7u-F's reading of a household at both weights (results-7uf.txt's P2 rows; the engine's figures, 16,000 paths)
    const uf = id => ['0.02', '0.01'].map(w => pick(`${S}results-7uf.txt`, new RegExp(`^  ${id}\\s+W${w.replace('.', '\\.')}: SHIP [\\d.]+ CAND [\\d.]+ change ([+-][\\d.]+) \\(([+-]?[\\d.]+) to ([+-]?[\\d.]+); (\\d+) saved, (\\d+) lost\\)`, 'm'), m => `W${w} ${m[1]} (${m[2]} to ${m[3]}; ${m[4]} saved, ${m[5]} lost)`)).join(', ');
    return [
      '| id | the item | measured effect on simulated outcomes (results file) | what closes it | status |',
      '|---|---|---|---|---|',
      `| U-S224 | 7u: CAND against SHIP on S224 at estate weight 0.02, inconclusive | 7u ${u7('S224')} (\`results-7u.txt\` item 1); 7u-F ${uf('S224')} (\`results-7uf.txt\`) | 7u-F | closed by 7u-F: no harm by D3 |`,
      `| U-S380 | the same on S380, inconclusive | 7u ${u7('S380')} (\`results-7u.txt\` item 1); 7u-F ${uf('S380')} (\`results-7uf.txt\`) | 7u-F | closed by 7u-F: no harm by D3 |`,
      `| U-S364 / O132 | the same on S364, a plan that survives under half a percent under either arm | 7u ${u7('S364')} (\`results-7u.txt\` item 1); 7u-F ${uf('S364')} (\`results-7uf.txt\`) | reported in 7u-F, not gated (SHIP below 5%) | closed by 7u-F: reported |`,
      `| O191 | the adaptive reference against the plan reference, S362's bad world | ${pick(`${S}results-refb.txt`, /^ +AN against C on S362 world 0: survival ([+-][\d.]+) exact \(([+-]?[\d.]+) to ([+-]?[\d.]+)\)/m, m => `${m[1]} points (exact ${m[2]} to ${m[3]})`)} (\`results-refb.txt\`) | 7u-F's decomposing arm stopped unread on the PASS (D21); V4's ensemble carries the candidate on the plan reference (D20 (8)) | open, not a gate |`,
      `| O179 | the fixed reference against the unfixed on S362's bad world | ${pick(`${S}results-foot-s362.txt`, /world 0: .*?lost (\d+) saved (\d+) of (\d+), change ([+-][\d.]+) \(([+-]?[\d.]+) to ([+-]?[\d.]+)\)/, m => `${m[4]} points (${m[5]} to ${m[6]}; ${m[2]} saved, ${m[1]} lost of ${m[3]})`)} (\`results-foot-s362.txt\`) | as O191 | open, not a gate |`,
      `| O195 | S366 unread at the frozen candidate | 7u-F ${uf('S366')} (\`results-7uf.txt\`) | 7u-F's panel reads it | closed by 7u-F |`,
      '| O194 | the bridge reader\'s reference, undecided | none: a choice | the assembly carries it (D5: the adaptive package in candidate.json) | closed by the assembly |',
      `| PR35 | the twelve-point rule on each side of a bridge split, under the package | its worst miss against the 4,000-return reference, in score units (survival as a fraction): ${pick(`${S}results-pr31-split.txt`, /NEAR: where the split acts.*?the worst ([\d.e-]+) \(([^)]*)\)/, m => `${m[1]} (${m[2]})`)} (\`results-pr31-split.txt\`) | below a tenth of a point of survival whatever its sign: not a bug (Step 4's rule) | closed, reported |`,
      '| PR24, PR29, PR31 | premises naming 7u-F: the order reference standing in for the candidate\'s, the adaptive reference\'s exact steps, the chooser\'s split at the reference\'s own step | carried by D5: the adaptive package, with PR31\'s split, is the reference the assembled candidate takes | 7u-F | closed by 7u-F\'s PASS on the candidate as assembled, not by a measurement: the decomposing arm\'s read was waived by D21, and PR29\'s and PR31\'s premises stay untested (no decision rests on them) |',
      '| T-GAPS | gaps between a table and simulation (sizes in the next block) | none measured on simulated outcomes | known limitations; 7u-F\'s by-world item reports them, and V3 and V4 measure what matters | not gates (D2) |'
    ];
  },
  // the known limitations: gaps between a table's forecast and simulation, with their sizes (Step 4's triage)
  limitations() {
    const S = 'research/solver/';
    return [
      `- O133, year-0 tables above simulation on the broad households below 95: ${pick(`${S}results-o133-scan.txt`, /^SHIP: (.*)$/m, m => `SHIP ${m[1]}`)}; ${pick(`${S}results-o133-scan.txt`, /^CAND: (.*)$/m, m => `CAND ${m[1]}`)} (\`results-o133-scan.txt\`).`,
      `- O139, S380's world 0 under the candidate: ${pick(`${S}results-neroot.txt`, /world 0 \(z -1\.732051, weight [\d.]+\): OWN table ([\d.]+) sim ([\d.]+)/, m => `table ${m[1]} against ${m[2]} simulated`)} (\`results-neroot.txt\`).`,
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
    // V1 and V2 on the assembled candidate (v-candidate.mjs), and 7u-F's budget (budget-7uf.mjs)
    for (const re of [/^V1 on the assembled candidate: .*$/m, /^V2 on the assembled candidate: .*$/m]) out.push(`- ${pick('research/solver/results-v-candidate.txt', re)} (\`results-v-candidate.txt\`).`);
    out.push(`- 7u-F's ${pick('research/solver/results-budget-7uf.txt', /^BUDGET: .*$/m).replace(/^BUDGET/, 'budget')} (\`results-budget-7uf.txt\`).`);
    for (const [w, item] of [['0.02', 4], ['0.01', 8]]) {
      const re = new RegExp(`^weight ${w.replace('.', '\\.')}: (\\d+) households[\\s\\S]*?the point: (-?[\\d.]+)[\\s\\S]*?7u's interval \\(pooled cells, pairs independent\\): (-?[\\d.]+) to (-?[\\d.]+)\\n  BY PATH \\(per-path means, paths independent\\): (-?[\\d.]+) to (-?[\\d.]+); se [\\d.]+, ([\\d.]+) times 7u's\\n  item 4's rule \\(lower end above -0\\.1\\): (\\w+) by path`, 'm');
      out.push(pick(R, re, m => `- 7u's item ${item} (the pooled floor at W${w}, ${m[1]} households) re-read by path: ${m[2]} points, by path ${m[5]} to ${m[6]} (7u's pooled cells ${m[3]} to ${m[4]}; ${m[7]} times as wide): ${m[8]} (\`${R.split('/').pop()}\`).`));
    }
    for (const w of ['0.02', '0.01']) out.push(pick(R, new RegExp(`^P1 at W${w.replace('.', '\\.')}: (\\d+) of the (\\d+) floor households have records \\(([^)]*) none\\); the read averages all \\d+: se by path at (\\d+) paths about ([\\d.]+) \\([^)]*\\) to ([\\d.]+) \\(each with S370's per-path spread, ([\\d.]+)% of its paths discordant, [^)]*within (-?[\\d.]+) to (-?[\\d.]+)\\): HELD with chance ([\\d.]+) to ([\\d.]+) at no true change, and 80% of the time at a true change of (-?[\\d.]+) to (-?[\\d.]+) points or more`, 'm'),
      m => `- 7u-F's power under P1 at W${w} (7u's records on ${m[1]} of the ${m[2]} floor households; ${m[3]} have none): its se by path at ${m[4]} paths about ${m[5]} (those four unchanged) to ${m[6]} (each with S370's spread, ${m[7]}% discordant, independent; the recorded households correlate pairwise within ${m[8]} to ${m[9]}); HELD with chance ${m[10]} to ${m[11]} at no true change, and 80% of the time at a true pooled change of ${m[12]} to ${m[13]} points or more.`));
    // P2: the in-band households 7u ran (the not-gated lines left out), the four without a record, S366 at the band's top
    const pw = [...t.matchAll(/^  (\S+)\s+W([\d.]+): SHIP ([\d.]+)%, in the band on \d+ paths with chance ([\d.]+), discordant ([\d.]+)% of paths; P2 reads harm at a true loss of 1 point with chance ([\d.]+); 80% of the time at a true loss of ([\d.]+) points, 90% at ([\d.]+)$/gm)];
    if (!pw.length) throw new Error(`state.mjs: ${R} has no P2 power lines`);
    const lo = k => pw.reduce((a, m) => (+m[k] < +a[k] ? m : a)), hi = k => pw.reduce((a, m) => (+m[k] > +a[k] ? m : a));
    const four = pick(R, /^  the 4 without a record \(([^)]*)\): at a discordance of ([^,]+), [^,]+, ([^,]+), P2 reads harm 80% of the time at a true loss of ([\d.]+), [\d.]+, ([\d.]+) points, 90% at ([\d.]+), [\d.]+, ([\d.]+)$/m, m => m);
    const edge = pw.filter(m => +m[4] < 0.99).map(m => `${m[1]} at W${m[2]} (SHIP ${m[3]}%) with chance ${m[4]}`);
    out.push(`- 7u-F's power under P2 (D3: harm needs the Holm-adjusted p AND an observed loss of at least 1 point): a true loss of exactly 1 point reads as harm with chance ${pw[0][6]} on every household; on the in-band households 7u ran, 80% of the time from a true loss of ${lo(7)[7]} to ${hi(7)[7]} points and 90% from ${lo(8)[8]} to ${hi(8)[8]} (the widest ${hi(8)[1]} at W${hi(8)[2]}, ${hi(8)[5]}% discordant); the four without a record (${four[1]}), at ${four[2]} to ${four[3]} discordant, 80% from ${four[4]} to ${four[5]} and 90% from ${four[6]} to ${four[7]}.${edge.length ? ` Near the band's top, in the band on 16,000 paths only by chance: ${edge.join(', ')}; outside it the change is reported, not gated.` : ''}`);
    const sim = [...t.matchAll(/^  check by simulation .*$/gm)].map(m => m[0].trim());
    sim.forEach(l => out.push(`- ${l}.`));
    return out;
  },
  // 7u-F's read, once (reduce-7uf.mjs, results-7uf.txt): the gate, P1, P2, the outcome; the in-band losses at an unadjusted
  // one-sided p below 0.05 (the registration's "floor households that lose most"); DECOMP as D21 left it
  sevenuf() {
    const R = 'research/solver/results-7uf.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const out = [`- ${pick(R, /^THE GATE: (fair|NOT FAIR)[^(]*/m, m => `the gate: ${m[1]}`).trim()}; ${pick(R, /^7U-F READ: .*?; (\d+) households; seed (\d+), (\d+) paths/m, m => `${m[1]} households, seed ${m[2]}, ${m[3]} paths a unit, scored by the engine`)} (\`results-7uf.txt\`).`];
    for (const w of ['0.02', '0.01']) out.push(`- ${pick(R, new RegExp(`^P1 at W${w.replace('.', '\\.')}: .*$`, 'm'))}.`);
    out.push(`- ${pick(R, /^P2: .*$/m)}.`, `- ${pick(R, /^OUTCOME: .*$/m)}.`);
    const lose = [...t.matchAll(/^  (\S+)\s+W([\d.]+): SHIP [\d.]+ CAND [\d.]+ change (-[\d.]+) \(([+-]?[\d.]+) to ([+-]?[\d.]+); (\d+) saved, (\d+) lost\) p ([\d.e+-]+) Holm ([\d.e+-]+); at the margins 0\.25 (clear|not clear), 0\.5 (clear|not clear)/gm)].filter(m => +m[8] < 0.05);
    // each one's whole score (the solver's own objective, runPolicy's trace) from the reported part (the read's review, MINOR 1)
    // the whole score is read on runPolicy's first paths only (the beside set), so its path count is printed with it (the
    // deep review after 7u-F: on those paths S224's survival part alone differs from the 16,000-path figure)
    const whole = (id, w) => pick(R, new RegExp(`^  ${id}\\s+W${w.replace('.', '\\.')}: estate .*?whole score ([+-][\\d.]+) \\(se ([\\d.]+)\\) on (\\d+) paths`, 'm'), m => `whole score ${m[1]} (se ${m[2]}) on the first ${m[3]} paths only`);
    out.push(`- In the band with a loss at an unadjusted one-sided p below 0.05, none harm by D3: ${lose.length ? lose.map(m => `${m[1]} W${m[2]} ${m[3]} (${m[4]} to ${m[5]}; ${m[6]} saved, ${m[7]} lost; p ${m[8]}, Holm ${m[9]}; the 0.25 margin ${m[10]}, the 0.5 margin ${m[11]}; ${whole(m[1], m[2])})`).join('; ') : 'none'}.`);
    const dn = (t.match(/^  DECOMP not read for /gm) || []).length, fid = (t.match(/FIDELITY GAP/g) || []).length;
    out.push(`- DECOMP not read for ${dn} household-weights (D21: stopped on the PASS); fidelity gaps between the engine and runPolicy: ${fid}.`);
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
