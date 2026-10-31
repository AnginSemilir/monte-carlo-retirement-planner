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
// lines folded into fewer (each group's first keeps its "- "), to keep STATE.md under its 300 lines; the figures unchanged
const fold = (out, groups) => groups.map(([a, b]) => out.slice(a, b === undefined ? out.length : b).map((x, k) => (k ? x.replace(/^- /, '') : x)).join(' ')).filter(Boolean);
const verdict = rel => pick(rel, /^(ALL PASS: \d+ checks|FAILED: \d+ of \d+ checks)/m, m => m[1]);
const failedBefore = rel => pick(rel, /must fail[\s\S]*?^(FAILED: \d+ of \d+ checks)/m, m => m[1]);

const BLOCKS = {
  // the candidate and the product baseline: their settings and a hash of each (the code's own objects)
  async candidate() {
    const C = await import('./candidate.mjs'), S = await import('../../src/solver/solve.js'), P = await import('./e3pcls-pin.mjs');
    const cand = { opts: C.CANDIDATE_OPTS, tiers: C.CANDIDATE_TIERS, reals: C.blendReals() };
    const opts = Object.entries(C.CANDIDATE_OPTS).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ');
    return [
      `- The candidate (\`research/solver/candidate.json\`, read by candidate.mjs: assembled for 7u-F with the adaptive package, D5, its hash then ${C.ASSEMBLED_HASH} (\`ASSEMBLED_OPTS\`); the third tier step and HR whole joined after the factorial, D28, D29, the table without the dealing cost after D30's check, and the failure year at what it can pay after Phase 4, D43): ${opts}; tiers ${C.CANDIDATE_TIERS} (O60's blend medians: ${Object.entries(cand.reals).map(([k, v]) => `${k} ${v}%`).join(', ')}). Hash ${C.CANDIDATE_HASH}${C.CANDIDATE_HASH === sha(cand) ? '' : ' (state.mjs reads ' + sha(cand) + ')'}; Phase 4's, failDelivered removed (\`PHASE4_OPTS\`): ${C.PHASE4_HASH}; before the assembly, the package's keys removed (\`FROZEN_OPTS\`, 7u's CAND): ${C.FROZEN_HASH}.`,
      `- 7u-F's decomposing arm (DECOMP, D5): the candidate on the plan reference, readerRef and its lattice removed (\`audit-7uf.mjs\`). Hash ${C.hashOf(Object.fromEntries(Object.entries(C.ASSEMBLED_OPTS).filter(([k]) => k !== 'readerRef' && k !== 'adaptiveLattice')))}.`,
      `- The product baseline (\`PRODUCT_BASELINE\`, src/solver/solve.js): ${Object.entries(S.PRODUCT_BASELINE).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join(', ')}. Hash ${sha(S.PRODUCT_BASELINE)}.`,
      `- The solver code the e3pcls pin last passed on: ${P.readPin().fingerprint} (${P.readPin().at}); the code now: ${P.fingerprint()}.`
    ];
  },
  // Step 1's results: each test's verdict on the fixed code and on the code before it, and the measurements
  step1() {
    const T = 'research/tests/', S = 'research/solver/';
    const tests = [['solver-invariants', 'O199, O200 and the guards (items 1 to 3)'], ['tier-above', 'F2a (item 5)'], ['solver-carry', 'F0 (item 6)'], ['tax-2026', 'F0a (item 7)'], ['table-guards', 'F0a under a table (item 8)']];
    const out = tests.map(([t, what]) => `- ${what}: \`${t}.test.mjs\` ${verdict(`${T}results-${t}.txt`)} on the fixed code, ${failedBefore(`${T}results-${t}.txt`)} before it (\`results-${t}.txt\`).`);
    out.push(`- F2a's cost, each household held at Medium Risk, the engine before and after (\`results-tier-above-cost.txt\`): ${['S070', 'S224', 'S380'].map(id => `${id} ${pick(`${S}results-tier-above-cost.txt`, new RegExp(`^${id}:[\\s\\S]*?before the fix ([\\d.]+)%, after ([\\d.]+)%: ([+-][\\d.]+) points \\(se ([\\d.]+); (\\d+) saved, (\\d+) lost\\)`, 'm'), m => `${m[1]}% to ${m[2]}%, ${m[3]} points (se ${m[4]}; ${m[5]} saved, ${m[6]} lost)`)}`).join('; ')}.`);
    const f0 = ['S330', 'S224', 'S070', 'S008', 'S172', 'S194'].map(id => {
      const before = pick('research/reviews/2026-10-21/results-exploratory.txt', new RegExp(`^${id}\\s+\\d+\\s+([\\d.]+)%\\s+([\\d.]+)%\\s+([+-]?[\\d.]+) \\(([\\d.]+)\\)\\s+(\\d+) / (\\d+)`, 'm'), m => `${m[3]} (${m[5]} / ${m[6]})`);
      const after = pick(`${S}results-engine-vs-fast.txt`, new RegExp(`"id":"${id}"[^}]*"fastMinusEngine":([+-]?[\\d.]+)[^}]*"fastOnly":(\\d+),"engineOnly":(\\d+)`), m => `${m[1]} (${m[2]} / ${m[3]})`);
      return `${id} before ${before}, after ${after}`;
    });
    out.push(`- F0, the solver's model less the engine in survival points (paths surviving only in the model / only in the engine), 2,000 paths: ${f0.join('; ')} (\`results-engine-vs-fast.txt\`).`);
    out.push(`- O200's reach (item 4), counted and then dropped: ${pick(`${S}results-reach-census.txt`, /^VERDICT: (.*)$/m, m => m[1])} (\`results-reach-census.txt\`).`);
    // after 7u-F (D20 (6) and the guardrail flag): the adaptive reference's and the couple's argmax loops, fast.js's lost year
    const G = `${T}results-solver-guards.txt`;
    out.push(`- After 7u-F, the argmax loops left (\`adaptive.js\`, \`couple.js\`) and \`fast.js\`'s lost-year flag: \`solver-guards.test.mjs\` ${verdict(G)} on the fixed code, ${pick(G, /must fail[\s\S]*?^(FAILED: \d+ of \d+ checks)/m, m => m[1])} with the guards out and the old flag line back (\`results-solver-guards.txt\`).`);
    // V2's state check (D20 (4)): the engine and a forward run in step, and the inventory of the engine's state
    const V = `${T}results-state-check.txt`;
    const lockstep = (rel, before) => pick(rel, new RegExp(`${before ? 'must fail[\\s\\S]*?' : ''}^(?:PASS|FAIL) {2}1\\. lockstep, (\\d+) household-years:.*?worst gaps: (.*)$`, 'm'), m => {
      // each gap as the test prints it: '£x' from a thousandth of a pound up, a bare exponent below it, 'differs' if not finite
      const gaps = m[2].split('; ').map(x => { const v = /differs/.test(x) ? Infinity : /£([\d.]+)/.exec(x) || / (\d[\d.]*e[-+]\d+)/.exec(x); return { x, v: v === Infinity ? v : v ? +v[1] : NaN }; });
      if (gaps.some(g => Number.isNaN(g.v))) throw new Error(`state.mjs: ${rel}: a lockstep gap it cannot read (${gaps.filter(g => Number.isNaN(g.v)).map(g => g.x).join('; ')})`);
      const over = gaps.filter(g => g.v > 1), top = gaps.reduce((a, g) => (g.v > a.v ? g : a));
      return `over ${m[1]} household-years, ${over.length ? `the gaps above a pound: ${over.map(g => g.x).join('; ')}` : `every gap within a pound (the largest ${top.v < 1e-3 ? top.v.toExponential(1) : top.v.toFixed(4)} pounds, ${top.x.replace(/ [^ ]+ \(.*$/, '')})`}`;
    });
    out.push(`- V2's state check (D20 (4)), the engine and a forward run in step on the light candidate: \`state-check.test.mjs --full\` ${verdict(V)} on the fixed code, ${failedBefore(V)} on the code before it (\`results-state-check.txt\`). Before, ${lockstep(V, true)}; after, ${lockstep(V, false)}. ${pick(V, /^ {2}the engine's taxable account empty with a basis left on it, in some year: (.*)$/m, m => `The engine's taxable account empty with a basis left on it, in some year: ${m[1]}`)}. ${pick(V, /^(?:PASS|FAIL) {2}1\. where the engine's own pick differs from the forward run's \((\d+) of (\d+) years\)[^:]*: the largest gap (\S+).*?, its tie tolerance (\S+)/m, m => `On the fixed code the engine's own pick differs from the forward run's in ${m[1]} of ${m[2]} years, the largest score gap ${m[3]} against the chooser's tie tolerance ${m[4]}: ties`)}.`);
    // folded again for Phase 4's read (STATE.md's 300 lines; the figures unchanged)
    // folded into one line for the dial's block (STATE.md's 300 lines; the figures unchanged)
    return fold(out, [[0]]);
  },
  // V3 and V4 on the ported code (EXPLORATORY, the tuning seed): each read's verdicts, from its results file
  v34() {
    const V3 = 'research/solver/results-v3.txt', V4 = 'research/solver/results-v4.txt', out = [];
    const t3 = read(V3), t4 = read(V4);
    if (t3 === null || t4 === null) return [`- pending: ${t3 === null ? V3 : V4}`];
    out.push(`- ${pick(V3, /^the gate: (.*)$/m, m => `V3's gate: ${m[1]}`)}; ${pick(V3, /^V1 on every unit: (.*)$/m, m => `V1 on every unit: ${m[1]}`)}.`);
    for (const w of ['0.02', '0.01']) {
      const sec = t3.split(`THE ACCEPTANCE AT W${w}:`)[1];
      if (!sec) throw new Error(`state.mjs: ${V3} has no acceptance at W${w}`);
      const rows = [...sec.split('\n\n')[0].matchAll(/^ {2}(.+?) \((\w+) -> (\w+)\): panel mean survival ([+-][\d.]+), whole score ([+-][\d.]+);.*: (the shipped setting stands|MOVES BEYOND THE TARGETS)$/gm)];
      const lad = pick(V3, new RegExp(`^ {2}the wealth ladder at W${w.replace('.', '\\.')}, each rung against the next finer by the same targets: (.*); the coarsest rung within the targets of every finer step: (.*)$`, 'm'), m => `the wealth ladder, each rung against the next finer (panel mean survival / whole score, then the largest household): ${m[1]}; the coarsest rung within the targets of every finer step: ${m[2]}`);
      out.push(`- V3 at estate weight ${w}, the next finer setting against the shipped one on the panel (survival points / whole score): ${rows.map(m => `${m[1]} ${m[4]} / ${m[5]}${m[6] === 'the shipped setting stands' ? '' : ' (BEYOND the targets)'}`).join('; ')}: ${rows.every(m => m[6] === 'the shipped setting stands') ? 'the shipped setting stands in every direction' : 'NOT in every direction'}. ${lad[0].toUpperCase()}${lad.slice(1)}.`);
    }
    out.push(`- ${pick(V3, /^THE ONE-POT ORACLE \(([\d.]+)%\), the table's opening at each wealth resolution: (.*)$/m, m => `The one-pot oracle (${m[1]}%), the table's opening error at 20, 30, 45, 60 and 90 wealth points: ${m[2]}`)}.`);
    const rungs = [...t3.matchAll(/^ {2}W(0\.0\d) (\d+) points: CAND ([\d.]+)% SHIP ([\d.]+)%; the change ([+-][\d.]+) \(se ([\d.]+)\), whole score ([+-][\d.]+) \(se ([\d.]+)\)$/gm)];
    out.push(`- S224's rungs, the candidate against SHIP on 32000 paths (the deep review's one test): ${rungs.map(m => `W${m[1]} ${m[2]} points ${m[5]} (se ${m[6]}), whole score ${m[7]} (se ${m[8]})`).join('; ')}.`);
    const v4 = ['0.02', '0.01'].map(w => {
      const best = [...t4.matchAll(new RegExp(`^ {2}(S\\d+) W${w.replace('.', '\\.')}: best (\\S+);`, 'gm'))], by = {};
      for (const m of best) (by[m[2]] = by[m[2]] || []).push(m[1]);
      return pick(V4, new RegExp(`^V4 at W${w.replace('.', '\\.')}: (.*)$`, 'm'), m => `at estate weight ${w} ${m[1]}, the best variant ${Object.entries(by).map(([v, ids]) => `${v} on ${ids.length} of ${best.length} households`).join(', ')}`);
    });
    out.push(`- V4: ${v4.join('; ')}. ${pick(V4, /^V4 ensemble: (.*)$/m, m => `Its verdict: ${m[1]}`)} (\`results-v3.txt\`, \`results-v4.txt\`).`);
    // folded again for Phase 4's read (STATE.md's 300 lines; the figures unchanged)
    // folded into one line for the failure year's read (STATE.md's 300 lines; the figures unchanged)
    return fold(out, [[0]]);
  },
  // N4's build (Step 6, n4-design.md): its test in the full form, and the product's path unchanged
  n4build() {
    const T = 'research/tests/results-n4-menu.txt', I = 'research/solver/results-n4-identity.txt', t = read(T);
    if (t === null || read(I) === null) return [`- pending: ${t === null ? T : I}`];
    const lock = [...t.matchAll(/^(?:PASS|FAIL) {2}3 {2}lockstep on menu (\S+): (\d+) households x (\d+) paths, (\d+) household-years, the largest gap £(\S+) \(/gm)].map(m => `${m[1]} ${m[4]} household-years, the largest gap £${m[5]}`);
    const plants = [...t.matchAll(/^(?:PASS|FAIL) {2}4 {2}planted '(\w+)' .*? by £([\d.]+) on menu/gm)].map(m => `'${m[1]}' £${m[2]}`);
    const s2 = [...t.matchAll(/^(?:PASS|FAIL) {2}5 {2}S2's shared scores equal scoreMoves' on \S+ under menu \S+: (\d+) scores checked/gm)].reduce((a, m) => a + Number(m[1]), 0);
    return fold([`- N4's build: \`n4-menu.test.mjs --full\` ${verdict(T)} (\`results-n4-menu.txt\`): the product's menu unchanged move for move; each new move against a hand calculation in the engine and the forward run; the two in step on each new menu (${lock.join('; ')}); each plant parts them (${plants.join(', ')}); S2's shared scores the same as scoreMoves' under the new menus (${s2} checked).`,
      `- N4's identity on the product's path: ${pick(I, /^VERDICT: (.*)$/m, m => m[1])} (\`results-n4-identity.txt\`).`], [[0]]);
  },
  // the third tier step's build (D28, THIRD-STEP.md step 2): its test in the full form, and the identity with the option unset
  tiersteps() {
    const T = 'research/tests/results-tier-steps.txt', I = 'research/solver/results-tier-steps-identity.txt', t = read(T);
    if (t === null || read(I) === null) return [`- pending: ${t === null ? T : I}`];
    const lists = pick(T, /^(?:PASS|FAIL) {2}1 {2}the option unset, every single household's tier lists the same as before \((\d+) households;/m, m => m[1]);
    const lock = [...t.matchAll(/^(?:PASS|FAIL) {2}3 {2}(S\d+) with tiersBelow 3 \(.*?\): the engine and a forward run in step over (\d+) years of (\d+) paths, the largest gap £(\S+) \(.*?\); years at the new rung (\d+)$/gm)].map(m => `${m[1]} ${m[2]} years of ${m[3]} paths, the largest gap £${m[4]}, ${m[5]} years at the new rung`);
    const thr = pick(T, /^(?:PASS|FAIL) {2}4 {2}planted: the engine's list built with two below while the table has three: (it throws|.*)/m, m => m[1]);
    const rung = pick(T, /^(?:PASS|FAIL) {2}4 {2}planted: the new rung grown at the second's rates in fast\.js only: the state parts by £([\d.]+)/m, m => `£${m[1]}`);
    const cash = /^PASS {2}4 {2}planted: the Cash Equivalents stop removed, the ladder check fails/m.test(t) ? 'fails the ladder check' : 'NOT CAUGHT';
    return fold([`- The third step's build: \`tier-steps.test.mjs --full\` ${verdict(T)} (\`results-tier-steps.txt\`): the option unset, the tier lists of ${lists} single households the same as before; with it, the ladder as THIRD-STEP.md gives it, a wrapper that cannot take the step keeping today's (D28); the engine and a forward run in step (${lock.join('; ')}); the plants: the engine's list two below while the table has three (${thr}), the new rung at the second's rates (the state parts by ${rung}), the cash stop removed (${cash}).`,
      `- Its identity, the option unset: ${pick(I, /^VERDICT: (.*)$/m, m => m[1])} (\`results-tier-steps-identity.txt\`).`], [[0]]);
  },
  // the third tier step's factorial (D28; EXPLORATORY; n4-menu.mjs --read-t3): the gate, each contrast on the panel, the decision
  n4t3() {
    const R = 'research/solver/results-n4t3.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const esc = c => c.replace(/[+]/g, '\\+'), C = ['T3 - CAND', 'HR+T3 - HR', 'HR - CAND', 'HR+T3 - CAND', 'interaction'];
    const panel = C.map(c => `${c} ${['0.02', '0.01'].map(w => pick(R, new RegExp(`^ {2}${esc(c)}\\s+W${w.replace('.', '\\.')}: survival (\\S+) \\(se (\\S+)\\) / score (\\S+) \\(se \\S+\\); on a household survival (\\S+) to (\\S+),`, 'm'), m => `W${w} ${m[1]} (se ${m[2]}) / ${m[3]}, a household ${m[4]} to ${m[5]}`)).join(', ')}`);
    const bars = C.slice(0, 4).map(c => pick(R, new RegExp(`^${esc(c)}: (.*)$`, 'm'), m => `${c}: ${m[1]}`));
    // folded into one line for D43's (STATE.md's 300 lines; the figures unchanged)
    return fold([`- The factorial's gate: ${pick(R, /^the gate: (.*)$/m, m => m[1])}; ${pick(R, /^N4's units reproduced on this code: (.*)$/m, m => `N4's units reproduced: ${m[1]}`)}; ${pick(R, /^THE SOLVE against CAND's \([^)]*\), (.*)$/m, m => `the solve against CAND's (four units at a time: a guide for gate 5), ${m[1]}`)} (\`results-n4t3.txt\`).`,
      `- The panel, survival points (se) / whole score, against the arm named second: ${panel.join('; ')}.`,
      `- ${bars.join('; ')}. ${pick(R, /^DECISION (.*)$/m, m => `DECISION ${m[1]}`)}.`], [[0]]);
  },
  // the candidate as D29 and D30 left it (THIRD-STEP.md and SPEED-PORT.md step 4): its pin with the decided defaults, V1 and V2 on it
  async cand29() {
    const T = 'research/tests/results-candidate.txt', V = 'research/solver/results-v-candidate-d43.txt', C = await import('./candidate.mjs');
    if (read(T) === null || read(V) === null) return [`- pending: ${read(T) === null ? T : V}`];
    const h = pick(T, /^PASS {2}7u-F's candidate reproduces its registered hash (\w+) \((\w+)\); the candidate (\w+) adds/m, m => ({ reg: m[1], got: m[2], cand: m[3] })), fz = pick(T, /^PASS {2}the candidate before the assembly reproduces its recorded hash (\w+) \((\w+)\)/m, m => m[2]);
    return [`- \`candidate.test.mjs\` ${pick(T, /^=+ (\d+ passed, \d+ failed) =+$/m, m => m[1])} (\`results-candidate.txt\`): the candidate ${h.cand} the same as the decided defaults key for key, 7u-F's ${h.got} and the frozen ${fz} reproduced, its smoke solve running the third step, HR whole, the table without the dealing cost (E5) and the failure year at what it can pay (D43); Phase 4's fcd8096217b7 reproduced. ${pick(V, /^V1 on .*$/m)}; ${pick(V, /^V2 on .*$/m)} (\`results-v-candidate-d43.txt\`; on D30's candidate, \`-d30.txt\`; on D29's, \`-d29.txt\`).`];
  },
  // the speed port's build (D30, SPEED-PORT.md step 2): its test in the full form
  speedport() {
    const T = 'research/tests/results-speed-port.txt', t = read(T);
    if (t === null || !/^(ALL PASS|FAILED)/m.test(t)) return [`- pending: ${T}`];   // the full form still running
    const ids = [...t.matchAll(/^PASS {2}1 {2}(S\d+ \w+) at \d+ points, the option unset: the same as before the port/gm)].map(m => m[1]);
    const e5 = [...t.matchAll(/^PASS {2}3 {2}(S\d+) at (\d+) points, tableDealing false: every table and layer the same bit for bit with E5 \(\S+; (\d+) s\) and the layer loop \(\S+; (\d+) s\)/gm)].map(m => `${m[1]} at ${m[2]} points (E5 ${m[3]} s, the loop ${m[4]} s)`);
    const lock = pick(T, /^PASS {2}4 {2}S370 with tableDealing false: the engine and a forward run in step over (\d+) years of (\d+) paths, the largest gap £(\S+) \(.*?\); years with a switch (\d+)/m, m => `${m[1]} years of ${m[2]} paths, the largest gap £${m[3]}, ${m[4]} with a switch`);
    const plants = [[/^PASS {2}2 {2}planted: the cache keyed on the plan's own vector parts them/m, 'the cache keyed on the wrong vector'], [/^PASS {2}3 {2}planted: E5 with the switch charge dropped parts them/m, 'the switch charge dropped from E5'], [/^PASS {2}4 {2}planted: the engine's policy without the dealing cost parts them by £([\d.]+)/m, 'the engine without the dealing cost']].map(([re, nm]) => { const m = re.exec(t); return `${nm} ${m ? (m[1] ? `(£${m[1]})` : 'caught') : 'NOT CAUGHT'}`; });
    const lean = [...t.matchAll(/^PASS {2}6 {2}(S\d+) at (\d+) points, tableDealing false: every table the same with the four cuts \((\d+) s\) and without \((\d+) s\): (\d+) of (\d+) values differ/gm)].map(m => `${m[1]} at ${m[2]} points ${m[5]} of ${m[6]} values (${m[3]} s with them, ${m[4]} s without)`);
    const lp = [...t.matchAll(/^PASS {2}6 {2}planted on S370 at \d+ points, (E\d+), [^:]*: (\d+) of (\d+) values differ/gm)].map(m => `${m[1]} ${m[2]} of ${m[3]}`);
    const memo = [...t.matchAll(/^PASS {2}6 {2}planted on (S\d+) at (\d+) points, the memo's world left out of its key: (\d+) of \d+ values differ with the four in, (\d+) of \d+ with them out/gm)].map(m => `${m[1]} at ${m[2]} points ${m[3]} in / ${m[4]} out`);
    const split = pick(T, /^PASS {2}6 {2}S370 at 4 points, the four on: split across (\d+) parts, (\d+) of (\d+) values differ/m, m => `${m[2]} of ${m[3]} values differ on ${m[1]} parts`);
    return [`- The port's build: \`speed-port.test.mjs --full\` ${verdict(T)} (\`results-speed-port.txt\`); the smaller cuts (D31): with tableDealing false, the four on against off, ${lean.join(', ')} differ; the plants on top of the other three: ${lp.join(', ')} values differ; the memo's world plant: ${memo.join('; ')}; the split with the four on: ${split}. The port: the option unset, ${ids.join(', ')} the same as before the port (tables, layers, S370's reference, the engine's outcomes); the \`realAt\` cache the same on and off; with tableDealing false, E5 the same as the layer loop bit for bit on ${e5.join(', ')}; the engine and a forward run in step under it (${lock}); the plants: ${plants.join(', ')}.`];
  },
  // D30's check (EXPLORATORY; n4-menu.mjs --read-nd): the identity, the gate and the solve; each household; the panel and the decision
  n4nd() {
    const R = 'research/solver/results-n4nd.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const hh = ['0.02', '0.01'].map(w => { const sec = (t.split(`AT W${w} `)[1] || '').split('\nAT W')[0].split('\nthe gate')[0]; return `W${w} ${[...sec.matchAll(/^ {2}(S\d+): HR\+T3 [\d.]+%, ND [\d.]+% \(\d+ moves\): survival (\S+) \((\S+)\) \/ score (\S+) \(\S+\)/gm)].map(m => `${m[1]} ${m[2]} (${m[3]}) / ${m[4]}`).join(', ')}`; });
    const panel = [...t.matchAll(/^ {2}the panel W(0\.0\d) (survival|score): (\S+) \(se (\S+)\), its 95% interval's lower end (\S+): (clears|does not clear)/gm)].map(m => `W${m[1]} ${m[2]} ${m[3]} (se ${m[4]}; lower end ${m[5]}, ${m[6]})`);
    // folded into one line for D43's (STATE.md's 300 lines; the figures unchanged)
    return fold([`- ${pick(R, /^THE IDENTITY \(step 2\.1\): (.*?), so the factorial's units stand as the first arm$/m, m => `The identity (step 2.1): ${m[1]}`)}; the gate: ${pick(R, /^the gate: (.*)$/m, m => m[1])}; ${pick(R, /^THE SOLVE, (.*)$/m, m => `the solve, ${m[1]}`)} (\`results-n4nd.txt\`).`,
      `- ND less HR+T3, survival points (se) / whole score: ${hh.join('; ')}.`,
      `- The panel: ${panel.join('; ')}; a household losing more than 0.5 beyond noise: ${pick(R, /^ {2}a household losing more than 0\.5 beyond noise: (.*)$/m, m => m[1])}. ${pick(R, /^DECISION (.*)$/m, m => `DECISION ${m[1]}`)}.`], [[0]]);
  },
  // gate 5 (D11, D25, D26; a measurement; reduce-gate5.mjs): the gate, each household's ratio, the verdicts
  gate5() {
    const R = 'research/solver/results-gate5.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const rows = [...t.matchAll(/^ {2}(.+?)\s+(\d+)\/(\d+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)$/gm)].map(m => `${m[1]} the product ${m[4]} s, the candidate ${m[5]} s on one core and ${m[6]} s split (x${m[8]} the product's; ${m[2]} of ${m[3]} values differ split)`);
    // folded into one line for D43's (STATE.md's 300 lines; the figures unchanged)
    return fold([`- ${pick(R, /^GATE: (passed[^,]*)/m, m => `The gate: ${m[1]}`)}; code ${pick(R, /one at a time, code (\w+);/m, m => m[1])} (\`results-gate5.txt\`). ${rows.join('; ')}; ${pick(R, /^ {2}(median: .*)$/m, m => m[1])}.`,
      `- ${pick(R, /^PLANTED: (.*)$/m, m => `The plant: ${m[1]}`)}. ${pick(R, /^(VERDICT E2: .*)$/m, m => m[1])}. ${pick(R, /^(VERDICT GATE 5 .*)$/m, m => m[1])}.`], [[0]]);
  },
  // N4's read (EXPLORATORY, 45 wealth points; n4-menu.mjs --read): the gate, the identity at full scale, each kind's verdict
  n4read() {
    const R = 'research/solver/results-n4.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const out = [`- ${pick(R, /^the gate: (.*)$/m, m => `N4's gate: ${m[1]}`)}; ${pick(R, /^the product's menu at full scale: (.*)$/m, m => `the product's menu at full scale: ${m[1]}`)} (\`results-n4.txt\`).`];
    for (const k of ['CAND+HR', 'CAND+MID', 'CAND+CGT']) {
      const esc = k.replace('+', '\\+');
      const mean = ['0.02', '0.01'].map(w => pick(R, new RegExp(`^ {2}${esc} at W${w.replace('.', '\\.')}: the panel mean gain ([+-][\\d.]+) score \\(se ([\\d.]+)\\) and ([+-][\\d.]+) survival \\(se ([\\d.]+)\\); the largest on a household ([+-][\\d.]+) and ([+-][\\d.]+), the smallest ([+-][\\d.]+) and ([+-][\\d.]+)$`, 'm'), m => `at W${w} the panel mean ${m[3]} survival (se ${m[4]}) / ${m[1]} score, a household from ${m[8]} to ${m[6]} survival`));
      const v = pick(R, new RegExp(`^${esc}: (PASSES N4's bar|does not pass N4's bar): beyond the targets (.*?); a household loss beyond 0\\.5 (.*)$`, 'm'), m => `${m[1]}${m[2] === 'nowhere' ? '' : ` (beyond the targets on ${[...new Set([...m[2].matchAll(/(S\d+|panel mean) W/g)].map(x => x[1]))].join(', ')})`}; a household loss beyond 0.5 ${m[3]}`);
      out.push(`- ${k}: ${v}; ${mean.join('; ')}.`);
    }
    // folded for D40's line, then into one for D42's (STATE.md's 300 lines; the figures unchanged)
    return fold(out, [[0]]);
  },
  // HR decomposed (D27; n4-menu.mjs --read-hr): each half alone against the candidate, and their interaction
  n4hr() {
    const R = 'research/solver/results-n4hr.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const rows = [];
    for (const w of ['0.02', '0.01']) {
      const sec = t.split(`AT W${w}:`)[1] || '';
      for (const m of sec.split('\nAT W')[0].matchAll(/^ {2}(S\d+): CAND ([\d.]+)%; against it, survival \(se\) \/ whole score \(se\): HR (\S+) \((\S+)\) \/ (\S+) \(\S+\) \| HRDRAW (\S+) \((\S+)\) \/ \S+ \(\S+\) \| HRWRAP (\S+) \((\S+)\) \/ \S+ \(\S+\) \| the interaction (\S+) \((\S+)\)/gm))
        rows.push(`${m[1]} W${w}: HR ${m[3]} (se ${m[4]}), the draw-first ceiling alone ${m[6]} (se ${m[7]}), the re-wrap alone ${m[8]} (se ${m[9]}), the interaction ${m[10]} (se ${m[11]})`);
    }
    return [`- HR decomposed (D27), survival points against the candidate: ${rows.join('; ')}. ${pick(R, /^N4's units reproduced on this code: (.*)$/m, m => `N4's units reproduced on this code: ${m[1]}`)} (\`results-n4hr.txt\`).`];
  },
  // the speed review's port (D24): each step's test on the ported code, and on the code before it or with its plant
  speed() {
    const T = 'research/tests/', S = `${T}results-solver-scratch.txt`, S1 = `${T}results-solver-memo.txt`, S3 = `${T}results-adaptive-dup.txt`, S2 = `${T}results-chooser-share.txt`, RT = 'research/solver/results-retime-port.txt';
    // S1: each household-arm's line, the memo off and on
    const memo = (() => { const t = read(S1); if (t === null) return `pending: ${S1}`; const rows = [...t.matchAll(/^PASS {2}(\S+) (\S+): the memo off and on, .*?the memo's hits (\d+), integrations (\d+) \(off: 0, 0\); (\d+) s off, (\d+) s on$/gm)]; if (!rows.length) throw new Error(`state.mjs: ${S1} has no household-arm line`); const sum = i => rows.reduce((a, m) => a + Number(m[i]), 0), h = sum(3), m = sum(4); return `${rows.length} household-arms (${[...new Set(rows.map(r => r[1]))].join(', ')} under ${[...new Set(rows.map(r => r[2]))].join(', ')}) the same bit for bit, their tables and every layer, with the memo off and on; the memo answered ${(100 * h / (h + m)).toFixed(1)}% of the expectations (${h} of ${h + m}); their solves at 6 points took ${sum(5)} s off and ${sum(6)} s on`; })();
    return fold([
      `- Finding 1, the chooser's scratch sized to the state it scores: \`solver-scratch.test.mjs\` ${verdict(S)} on the fixed code, ${failedBefore(S)} on the code before it, where ${pick(S, /must fail[\s\S]*?^FAIL {2}SHIP: chooseAction, the move and every mixture score the same bit for bit at (\d+) of (\d+) positions/m, m => `${m[2] - m[1]} of ${m[2]} SHIP positions`)} and ${pick(S, /must fail[\s\S]*?^FAIL {2}CAND: chooseAction, the move and every mixture score the same bit for bit at (\d+) of (\d+) positions/m, m => `${m[2] - m[1]} of ${m[2]} CAND positions`)} scored differently once the table had run forward paths (\`results-solver-scratch.txt\`).`,
      `- S1, the cell's expectation memo: \`solver-memo.test.mjs --full\` ${verdict(S1)}: ${memo}; ${pick(S1, /^PASS {2}planted: the key without the growth class changes (\S+) (\S+)'s tables/m, () => 'each plant (the growth class, the world left out of the key) changes a hash')} (\`results-solver-memo.txt\`).`,
      `- S3, the adaptive reference's duplicate moves: \`adaptive-dup.test.mjs --full\` ${verdict(S3)}: ${(() => { const t = read(S3); if (t === null) return `pending: ${S3}`; const rows = [...t.split('# node research/tests/adaptive-dup.test.mjs, the quick form')[0].matchAll(/^PASS {2}(\S+) at (na \d+ x nb \d+ x nz \d+)[^:]*: the reference's arrays with the duplicates off and on, \S+ \/ \S+; the duplicates taken (\d+) of (\d+) \(off: 0\); built in ([\d.]+) s off, ([\d.]+) s on$/gm)]; if (!rows.length) throw new Error(`state.mjs: ${S3} has no household line`); return `${rows.map(r => r[1]).join(', ')} at the candidate's lattice (${rows[0][2]}), the reference's arrays the same bit for bit with the duplicates off and on, ${rows.map(r => `${r[1]} ${(100 * r[3] / r[4]).toFixed(1)}% of its moves duplicates, built in ${r[5]} s off and ${r[6]} s on`).join('; ')}`; })()}; ${pick(S3, /^PASS {2}planted: the growth class left out of the match changes/m, () => 'the plant (the growth class left out of the match) changes the reference')}, and ${pick(S3, /^PASS {2}(S362), the candidate at 4 points on the small lattice: its tables with S3 off and on, (\S+) \/ \2/m, m => `${m[1]}'s solve gives the same tables with S3 off and on`)} (\`results-adaptive-dup.txt\`).`,
      `- S2, the chooser's shared year: \`chooser-share.test.mjs --full\` ${verdict(S2)}: ${(() => { const t = read(S2); if (t === null) return `pending: ${S2}`; const full = t.split('# node research/tests/chooser-share.test.mjs, the quick form')[0]; const sc = [...full.matchAll(/^PASS {2}(\S+) (\S+): every move's score, tax and estate at every decision of (\d+) paths the same bit for bit as scoreMoves's \((\d+) scores checked/gm)], en = [...full.matchAll(/^PASS {2}(\S+) (\S+): the engine's outcomes on (\d+) paths with the sharing off and on, (\S+) \/ \4 \(survives \d+\); ([\d.]+) ms a path off, ([\d.]+) on$/gm)]; if (!sc.length || sc.length !== en.length) throw new Error(`state.mjs: ${S2}: the household-arm lines do not pair`); return `on ${sc.length} household-arms (${sc.map(m => `${m[1]} ${m[2]}`).join(', ')}) every move's score, tax and estate at every decision of ${sc[0][3]} paths the same bit for bit as scoreMoves's (${sc.reduce((a, m) => a + Number(m[4]), 0)} scores), and the engine's outcomes on ${en[0][3]} paths the same with the sharing off and on, its path ${en.map(m => `${(Number(m[5]) / Number(m[6])).toFixed(1)}`).join(', ')} times as fast`; })()}; ${pick(S2, /^PASS {2}planted, \S+ \S+: a tier variant's switch charge skipped: the check throws/m, () => 'both plants (a tier variant\'s charge skipped, the growth class left out of the key) throw under the check')} (\`results-chooser-share.txt\`).`,
      `- The re-time (instruction 5), BASE (the code before the port) beside PORT, one process a core, nothing else running: ${(() => { const t = read(RT); if (t === null) return `pending: ${RT}`; const L = t.split('\n'), out = []; let pass = true; for (let i = 0; i < L.length; i++) { if (!L[i].startsWith('$ ')) continue; const b = JSON.parse(L[i + 1]), p = JSON.parse(L[i + 2]), sv = b.solveS / p.solveS, ev = b.engineMsPerPath / p.engineMsPerPath, same = b.tableHash === p.tableHash && b.layerHash === p.layerHash && b.runHash === p.runHash && (!p.runHashShareOff || p.runHashShareOff === b.runHash); if (!(same && sv >= 2 && ev >= 2)) pass = false; out.push(`${p.id} ${p.arm} at ${p.points} points, the solve ${b.solveS.toFixed(0)} s to ${p.solveS.toFixed(0)} s (${sv.toFixed(2)} times), the engine ${b.engineMsPerPath.toFixed(1)} to ${p.engineMsPerPath.toFixed(1)} ms a path (${ev.toFixed(2)} times), ${same ? 'every hash the same' : 'HASHES DIFFER'}`); } if (!out.length) throw new Error(`state.mjs: ${RT} has no pair`); return `${out.join('; ')}. Against the review's pass mark (every hash identical, the solve and the engine each at least twice as fast): ${pass ? 'PASS' : 'SHORT'}`; })()} (\`results-retime-port.txt\`, read by \`retime-port.mjs\`).`,
      `- Instruction 6 (D25), the adaptive reference's build split across E2's parts: \`e2.test.mjs\` ${(() => { const E2T = 'research/tests/results-e2-test.txt', t = read(E2T); if (t === null) return `pending: ${E2T}`; const pass = (t.match(/^PASS {2}/gm) || []).length, fail = (t.match(/^(?:FAIL|AssertionError)/gm) || []).length, refs = [...t.matchAll(/^PASS {2}(\S+) CANDIDATE \(?([^:]*?)\)?: the adaptive reference's arrays bit for bit the same split (\d+) ways \((\d+) arrays, (\d+) values, (\d+) differ\); its (\d+) cells each written once \((\d+)\), part 0 writing (\d+)$/gm)]; return `${fail ? `FAILED (${fail})` : `ALL PASS: ${pass} checks`}: the reference's arrays bit for bit the same split and unsplit on ${refs.map(m => `${m[1]} (${m[2].replace(/^CANDIDATE /, '')}, ${m[5]} values, its ${m[7]} cells each written once, part 0 writing ${m[9]})`).join(', ')}; every table the same as before; ${pick(E2T, /^PASS {2}planted: a part that claims the reference's cells and never writes them breaks identity \((.*)\)$/m, m => `the plant (a part that claims the reference's cells and drops them) caught: ${m[1]}`)} (\`results-e2-test.txt\`)`; })()}.`,
    // folded again for D39's line, then into one for D42's (STATE.md's 300 lines; the figures unchanged)
    ], [[0]]);
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
      `| FD-RAISE | the raise before ruin under the failure year at what it can pay (D43): gone from the year just before ruin, but a 110% year within three years of it remains, mostly two years before and then the floor (the read's reviewer and the deep review of 30 Oct) | ${pick(`${S}results-fail-delivered.txt`, /^P3 the raise before ruin, of the paths that run out: CANDD (\d+ of \d+) .*?; CAND (\d+ of \d+) /m, m => `in the year before ruin CANDD ${m[1]}, CAND ${m[2]}`)}; ${pick(`${S}results-fail-delivered.txt`, /a 110% year in any of the three years before ruin, CANDD (\d+ of \d+), CAND (\d+ of \d+)/m, m => `within three years CANDD ${m[1]}, CAND ${m[2]}`)}; survival and spending unchanged (\`results-fail-delivered.txt\`); CANDDP (D46), ${pick(`${S}results-curve-pay.txt`, /^ {2}CANDDP of (\d+) paths that run out: a 110% year in the three years before ruin (\d+) .*$/m, m => `within three years ${m[2]} of ${m[1]}`)} (\`results-curve-pay.txt\`) | the deep review's one test, CANDDP (EXPLORATORY, D46): by its rule the failing cells are not the cause; no new rule opens, and Part C shows no raise on a path heading for ruin | closed, reported |`,
      (() => {
        // D47's giaTiers look (gia-look.mjs): per block, the code, the gain axis, then the switches a path at no gain and at 40%
        const t = read(`${S}results-gia-look.txt`);
        if (t === null) return '| GAIN-BUCKET | pending: results-gia-look.txt | | | open |';
        const blocks = t.split(/^== code /m).slice(1).map(b => ({ code: b.slice(0, 7), interp: /gainInterp/.test(b), sw: [...b.matchAll(/^  gain (0|0\.4): ([\d.]+) GIA switches/gm)].map(m => m[2]) }));
        const at = (code, interp) => { const b = blocks.find(x => x.code === code && x.interp === interp); if (!b || b.sw.length !== 2) throw new Error(`state: results-gia-look.txt has no block for ${code}${interp ? ' interpolated' : ''}`); return `${b.sw[0]} / ${b.sw[1]}`; };
        return `| GAIN-BUCKET | the taxable account's gain share read at its nearest bucket (5, 25, 55%): a move that changes the share can flip the read across a bucket's edge, and since 136c477 taxes the sweep's gains the tables weigh the bucket more (D47's look) | giaTiers (research, off) on S330, the taxable account's switches a path with no gain / a 40% gain: the branch ${at('cfd4530', false)}, interpolated ${at('cfd4530', true)}; before 136c477 ${at('8bea086', false)} (\`results-gia-look.txt\`); the candidate's and the product's harvest moves: not measured | the candidate with and without gainInterp on the panel's households with a taxable account, sized after D48's port and brought to the maintainer before it runs (D49) | open |`;
      })(),
      '| T-GAPS | gaps between a table and simulation (sizes in the next block) | none measured on simulated outcomes | known limitations; 7u-F\'s by-world item reports them, and V3 and V4 measure what matters | not gates (D2) |'
    ];
  },
  // the known limitations: gaps between a table's forecast and simulation, with their sizes (Step 4's triage)
  limitations() {
    const S = 'research/solver/';
    return fold([
      `- O133, year-0 tables above simulation on the broad households below 95: ${pick(`${S}results-o133-scan.txt`, /^SHIP: (.*)$/m, m => `SHIP ${m[1]}`)}; ${pick(`${S}results-o133-scan.txt`, /^CAND: (.*)$/m, m => `CAND ${m[1]}`)} (\`results-o133-scan.txt\`).`,
      `- O139, S380's world 0 under the candidate: ${pick(`${S}results-neroot.txt`, /world 0 \(z -1\.732051, weight [\d.]+\): OWN table ([\d.]+) sim ([\d.]+)/, m => `table ${m[1]} against ${m[2]} simulated`)} (\`results-neroot.txt\`).`,
      `- O180, S370's bad world: ${pick(`${S}results-hodep-s370.txt`, /world 0: table ([\d.]+) runs (\d+)\/(\d+) \(([\d.]+)\), table less runs ([\d.]+)/, m => `table ${m[1]} against ${m[4]} run (${m[2]} of ${m[3]}), ${m[5]} points over`)} (\`results-hodep-s370.txt\`).`,
      `- O189, S128's bridge part: ${pick(`${S}results-copyb.txt`, /S128 CW world 0: GB ([\d.]+)/, m => `world 0 GB ${m[1]}`)}, ${pick(`${S}results-copyb.txt`, /S128 CW world 1: GB ([\d.]+)/, m => `world 1 GB ${m[1]}`)} points (\`results-copyb.txt\`).`,
      `- O198, the top-cell fix's year-1 residual under the plan reference, world 0: ${pick(`${S}results-copyx.txt`, /SNRX world 0: .*?by year 1: ([+-]?[\d.]+)/, m => m[1])} points (\`results-copyx.txt\`).`,
      '- TOP-CELL, AA-UR and FD-X: diagnostics of table reads, not run; dropped as gates (D2).'
    // folded for Phase 4's read (STATE.md's 300 lines; the figures unchanged)
    ], [[0, 2], [2, 4], [4]]);
  },
  // Step 2's re-check, when it has run
  step2() {
    const S = 'research/solver/';
    const t = read(`${S}results-recheck-7u.txt`);
    if (t === null) return [`- pending: ${S}results-recheck-7u.txt`];
    // the households in one line, each as the recheck prints it, then its verdict (results-recheck-7u.txt)
    const rows = t.split('\n').filter(l => /^  \S/.test(l)).map(l => l.trim().replace(/\s{2,}/, ' ')), v = t.split('\n').find(l => /^VERDICT/.test(l));
    return [`- ${rows.join(' || ')} (\`results-recheck-7u.txt\`). ${v}`];
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
    const sim = [...t.matchAll(/^  check by simulation \(([^)]*)\): (.*)$/gm)];
    if (sim.length) out.push(`- P2's approximation checked by simulation (${sim[0][1]}): ${sim.map(m => m[2]).join(' | ')}.`);
    // folded into four lines to keep STATE.md under its 300 (the figures unchanged): V1, V2 and the budget; the two
    // re-reads; P1's power at both weights; P2's power and its check by simulation
    // folded again for the tier test's block (STATE.md's 300 lines; the figures unchanged)
    // folded into one line for FD-RAISE's row (STATE.md's 300 lines; the figures unchanged)
    return [out.map((x, k) => (k ? x.replace(/^- /, '') : x)).join(' ')].filter(Boolean);
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
    // P1 at both weights on one line, and P2 with the outcome, to keep STATE.md under its 300 lines (the figures unchanged)
    // folded again for the tier test's block (STATE.md's 300 lines; the figures unchanged)
    return fold(out, [[0, 3], [3]]);
  },
  // Phase 4's read, once (reduce-phase4.mjs, results-phase4.txt): the gate, A1, A2 and S1 at both weights, the outcome; the
  // flags (D34); reported beside them: the replication, the whole score, spending against SHIP, the lump-sum split (D38 (2)),
  // S1's parts, FIXBR (7q), the worlds, history, runPolicy beside the engine and the solve
  phase4() {
    const R = 'research/solver/results-phase4.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const at = re => pick(R, re, m => m[1]), W = ['0.02', '0.01'], cap = x => (/^[a-z]+[A-Z]/.test(x) ? x : x[0].toUpperCase() + x.slice(1)), esc = w => w.replace('.', '\\.');
    const stamp = JSON.parse(at(/^PHASE 4 READ: .*? stamp (\{.*\})$/m));
    const compared = (t.match(/^ {2}S\d+F?\s+W[\d.]+ vs (?:APP |SHIP): /gm) || []).length;
    const out = [`- ${cap(at(/^(the gate: .*)$/m))}; code ${stamp.code}, audit ${stamp.audit}, candidate ${stamp.candidate} (\`results-phase4.txt\`).`];
    for (const w of W) out.push(`- ${pick(R, new RegExp(`^W${esc(w)}: A1 .*$`, 'm'))}.`);
    out.push(`- ${at(/^(OUTCOME: .*)$/m)}.`);
    out.push(`- The flags (D34: for investigation, none blocking on its own), harm against APP and against SHIP on ${compared} household-weight comparisons, and the spending flag: ${at(/^FLAGGED: (.*)$/m)}.`);
    for (const w of W) out.push(`- W${w} ${at(new RegExp(`^ {2}W${esc(w)} (the replication .*)$`, 'm'))}.`);
    for (const w of W) for (const re of ['the whole score: .*', 'spending delivered over every year, CAND less SHIP: .*', 'A1 and A2 where arm A takes the lump sum .*', 'A1 and A2 where arm A does not .*', "S1's parts, .*"]) out.push(`- W${w} ${at(new RegExp(`^ {2}W${esc(w)} (${re})$`, 'm'))}.`);
    for (const re of [/^ {2}(FIXBR \(7q, D35\): .*)$/m, /^ {2}(the world return-1 .*)$/m, /^ {2}(the world vol\+25: .*)$/m, /^ {2}(the world left-tail: .*)$/m, /^ {2}(history \(.*)$/m, /^ {2}(runPolicy beside the engine .*)$/m, /^ {2}(the solve, .*)$/m]) out.push(`- ${cap(at(re))}.`);
    // three lines (STATE.md's 300): the gate and the decision; the flags, the replication and what is reported at each
    // weight; FIXBR, the worlds, history, runPolicy and the solve
    // folded into one line for the dial's block (STATE.md's 300 lines; the figures unchanged)
    return fold(out, [[0]]);
  },
  // the tier test (D39; EXPLORATORY, seed 7002; reduce-tiers.mjs, results-tiers.txt): the gate, survival per arm, each arm
  // against the app's rules and the shipping solver, the tiers' share of SHIP's and the candidate's gain over the app's rules,
  // the spend by retired year and the years at the floor
  tiers() {
    const R = 'research/solver/results-tiers.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const at = re => pick(R, re, m => m[1]);
    const out = [`- The gate: ${at(/^THE GATE: (.*)$/m)} (\`results-tiers.txt\`). Survival: ${at(/^survival: (.*)$/m)}.`];
    for (const k of ['SHIP less APP', 'SHIPNC less APP', 'CAND less APP', 'CANDNC less APP', 'CANDNC less SHIPNC', 'CAND less SHIP']) out.push(`- ${k}: ${pick(R, new RegExp(`^${k}: (.*)$`, 'm'), m => m[1])}.`);
    for (const x of ['SHIP', 'CAND']) out.push(`- ${pick(R, new RegExp(`^(THE TIERS' SHARE of ${x}'s gain .*)$`, 'm'), m => m[1])}.`);
    const lv = [...t.matchAll(/^ {2}(APP|SHIP|SHIPNC|CAND|CANDNC)\s+([\d.]+ \/ [\d.]+ \/ [\d.]+); at the floor ([\d.]+), at 90% or below ([\d.]+)$/gm)];
    if (lv.length !== 5) throw new Error(`state.mjs: results-tiers.txt has ${lv.length} spend rows, not 5`);
    out.push(`- The spend as a share of target by retired year (0 to 4, 5 to 9, 10 on; paths not yet failed) and the retired years a path at the 80% floor: ${lv.map(m => `${m[1]} ${m[2]}, ${m[3]} at the floor`).join('; ')}. ${at(/^(runPolicy beside the engine: .*)$/m)}.`);
    // folded into one line for the dial's block (STATE.md's 300 lines; the figures unchanged)
    return fold(out, [[0]]);
  },
  // the failure year's held-out read (D43; registrations/fail-delivered.md, read once; reduce-curve.mjs --registered)
  faildelivered() {
    const R = 'research/solver/results-fail-delivered.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const at = re => pick(R, re, m => m[1]);
    const flags = [...t.matchAll(/^ {2}(S\d+F?)\s.*FLAG: (.*)$/gm)].map(m => `${m[1]} ${m[2]}`);
    return [`- The gate: ${at(/^THE GATE: (.*)$/m)}; ${at(/^(runPolicy beside the engine: .*)$/m)} (\`results-fail-delivered.txt\`). Survival: ${at(/^survival: (.*)$/m)}. ${at(/^(P1 .*)$/m)}. ${at(/^(P2 .*)$/m)}. ${at(/^(P3 .*)$/m)}. Beside, not deciding: ${at(/^beside \(not deciding\): (.*)$/m)}; the households flagged by D34's threshold: ${flags.join('; ') || 'none'}. ${at(/^(OUTCOME: .*)$/m)}.`];
  },
  // the dislike of cuts on the candidate (D44; EXPLORATORY, seed 7002; reduce-curve.mjs --dial)
  curvedial() {
    const R = 'research/solver/results-curve-dial.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const at = re => pick(R, re, m => m[1]);
    const arms = [...t.matchAll(/^ {2}(CANDD|DIAL3|DIAL10)\s+([\d.]+%); (first .*)$/gm)];
    const vs = [...t.matchAll(/^ {2}(DIAL3|DIAL10)\s+(survival .*)$/gm)];
    if (arms.length !== 3 || vs.length !== 2) throw new Error(`state.mjs: results-curve-dial.txt has ${arms.length} arm rows and ${vs.length} comparisons, not 3 and 2`);
    const eq1 = [...t.matchAll(/^ {2}(S\d+F?)\s+CANDD [\d.]+% \(([\d.]+), (\d+%)\)\s+DIAL3 [\d.]+% \(([\d.]+), (\d+%)\)\s+DIAL10 [\d.]+% \(([\d.]+), (\d+%)\)$/gm)].filter(m => m[3] !== m[5] || m[3] !== m[7]).map(m => `${m[1]} ${m[3]} / ${m[5]} / ${m[7]}`);
    return [`- The gate: ${at(/^THE GATE: (.*)$/m)}; ${at(/^(runPolicy beside the engine: .*)$/m)} (\`results-curve-dial.txt\`). Per arm (survival; the retirees' first year and years 1-5 (% of target); their average back at target, the median path back; from the 21st year; retired years at the floor / at 110%; the share of years a level changes, the mean step; the pension and ISA's equity share at years 1, 5, 10, 20, the retirees; all): ${arms.map(m => `${m[1]} ${m[2]}; ${m[3]}`).join(' || ')}. Against CANDD: ${vs.map(m => `${m[1]} ${m[2]}`).join(' || ')}. Where the year-1 equity moves (CANDD / DIAL3 / DIAL10): ${eq1.join('; ') || 'nowhere'}.`];
  },
  curvepay() {
    const R = 'research/solver/results-curve-pay.txt', t = read(R);
    if (t === null) return [`- pending: ${R}`];
    const at = re => pick(R, re, m => m[1]);
    const arms = [...t.matchAll(/^ {2}(CANDDP|DIAL6)\s+([\d.]+%); (first .*)$/gm)];
    const vs = [...t.matchAll(/^ {2}(CANDDP|DIAL6)\s+(survival .*)$/gm)];
    const br = [...t.matchAll(/^ {2}(CANDD|CANDDP)\s+(of \d+ paths that run out: .*)$/gm)];
    if (arms.length !== 2 || vs.length !== 2 || br.length !== 2) throw new Error(`state.mjs: results-curve-pay.txt has ${arms.length} arm rows, ${vs.length} comparisons and ${br.length} ruin rows, not 2, 2 and 2`);
    return [`- The gate: ${at(/^THE GATE: (.*)$/m)}; ${at(/^(runPolicy beside the engine: .*)$/m)}; ${at(/^(CANDD on this code \(the option unset\) against .*)$/m)} (\`results-curve-pay.txt\`). Per arm, as the dial's read: ${arms.map(m => `${m[1]} ${m[2]}; ${m[3]}`).join(' || ')}. Against CANDD: ${vs.map(m => `${m[1]} ${m[2]}`).join(' || ')}. Before ruin: ${br.map(m => `${m[1]} ${m[2]}`).join(' || ')}; CANDDP ${at(/^ {2}(survival .*lifetime spending .*)$/m)}; ${at(/^ {2}(the failure year, of .*)$/m)}. ${at(/^ {2}(by the review's rule: .*)$/m)}.`];
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
