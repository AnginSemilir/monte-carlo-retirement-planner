/*
 * NO CHECK IN THE TESTS READS THE WALL CLOCK (3 Nov; the class of solver-fast's C2 on 1 Nov and solver-tiers' C2 on 3 Nov).
 *
 * The engine suites run beside other work by design: the full tier two files at once (run-shard.mjs -j 2), the gate beside
 * the batches. A speed check that reads the wall clock then fails on a neighbour's load, not on the code's own cost
 * (solver-fast.test.mjs C2 read 925 to 1,915 ns a year under load against 830 alone, 1 Nov; solver-tiers.test.mjs C2 failed
 * in Full 63 on code that passed in Full 61, 3 Nov). A speed check times the thread's CPU instead (cpu-time.mjs). The
 * pattern search of 1 Nov was by eye and missed solver-tiers' C2; this is that search as a test, over every .mjs in
 * research/tests: each value computed from a clock reading (Date.now, performance.now, process.hrtime) is followed through
 * the assignments that use it, and any ok() whose condition reads one fails here. A clock read for a printed duration is
 * fine; only a check's condition counts.
 *   CLOCK_CHECKS_PLANT=old adds solver-tiers' C2 as it was before 3 Nov to the scan, and the test must fail on it.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLOCK = /Date\.now\(\)|performance\.now\(\)|process\.hrtime/;
const esc = n => n.replace(/\$/g, '\\$');
const reads = (name, text) => new RegExp(`(^|[^\\w$.'"])${esc(name)}(?![\\w$])`).test(text);

// split at the commas outside brackets and strings
function topLevel(text, stopAtClose = false) {
  const parts = []; let depth = 0, cur = '', q = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { cur += ch; if (ch === '\\') { cur += text[++i] || ''; continue; } if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) { if (depth === 0) { if (stopAtClose) break; } else depth--; }
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

// the checks in one file's source whose condition reads a clock-derived value
export function clockChecks(src) {
  if (!CLOCK.test(src)) return [];
  const asg = [];
  for (const stmt of src.split(/;|\n/)) {
    const d = stmt.match(/^\s*(?:export\s+)?(?:const|let|var)\s+(.*)$/s);
    const decls = d ? topLevel(d[1]) : [stmt];
    for (const x of decls) {
      const m = x.match(/^\s*([A-Za-z_$][\w$]*)\s*(?:[+\-*/]|\?\?|\|\||&&)?=(?!=)\s*(.+)$/s);
      if (m) asg.push([m[1], m[2]]);
      // a name raised by a later step: `x = Math.max(x, y)` is caught above; `x += y` too
    }
  }
  const tainted = new Set(asg.filter(([, r]) => CLOCK.test(r)).map(([n]) => n));
  for (let changed = true; changed;) {
    changed = false;
    for (const [n, r] of asg) if (!tainted.has(n) && [...tainted].some(t => reads(t, r))) { tainted.add(n); changed = true; }
  }
  const out = [];
  src.split('\n').forEach((line, i) => {
    const m = line.match(/\bok\(\s*(['"`])((?:\\.|(?!\1).)*)\1\s*,\s*(.*)$/);
    if (!m) return;
    const cond = topLevel(m[3], true)[0];
    const hits = [...tainted].filter(t => reads(t, cond)).concat(CLOCK.test(cond) ? ['a clock call'] : []);
    if (hits.length) out.push({ line: i + 1, name: m[2].slice(0, 90), hits });
  });
  return out;
}

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

// solver-tiers.test.mjs's C2 before 3 Nov, as the plant and as the search's own known case
const OLD_C2 = `  let worse = 0, ratioMax = 0, used = 0;
  for (const sc of picks) {
    const t0 = Date.now(); const a = solve(E, M, plan, { points: 16, skipLump: true }); const tA = Date.now() - t0;
    const t1 = Date.now(); const b = solve(E, M, plan, { points: 16, skipLump: true, tiers: true }); const tB = Date.now() - t1;
    if (vb < va - 1e-9) worse++;
    ratioMax = Math.max(ratioMax, tB / tA);
  }
  ok('C1  on the same grid, more moves never lower the opening value', worse === 0);
  ok('C2  the joint tier moves cost less than two and a half times the phase 2 solve (the flow is shared)', ratioMax < 2.5, \`worst \${ratioMax.toFixed(2)}x\`);
  const t9 = Date.now(); run(); console.log(\`\${Date.now() - t9} ms\`);
  ok('C3  a printed duration is not a check', Number.isFinite(used));
`;
const NEW_C2 = `  let worse = 0, ratioMax = 0, used = 0;
  const tA = Math.round(cpuNs(() => { a = solve(E, M, plan, {}); }, 1, 1).first / 1e6);
  const w0 = Date.now(); run(); console.log(\`\${Date.now() - w0} ms\`);
  ratioMax = Math.max(ratioMax, tB / tA);
  ok('C2  ...', ratioMax < 2.5, \`worst \${ratioMax.toFixed(2)}x, \${Date.now() - w0} ms\`);
`;

console.log('=========== THE SEARCH ON ITS KNOWN CASES ===========');
{
  const old = clockChecks(OLD_C2);
  ok('1  solver-tiers\' C2 as it was is found, through the two steps from the clock to the check', old.length === 1 && old[0].name.startsWith('C2') && old[0].hits.includes('ratioMax'), old.map(x => `${x.name.slice(0, 3)} [${x.hits.join(', ')}]`).join('; '));
  ok('2  ...and neither C1 (declared beside it) nor C3 (beside a printed duration) is', !old.some(x => /^C[13]/.test(x.name)));
  ok('3  the CPU-clock form is not found, a printed duration in its message beside it', clockChecks(NEW_C2).length === 0);
  ok('4  a clock call in the condition itself is found', clockChecks(`const q = 1;\nok('Z  direct', Date.now() - q < 5);\n`).length === 1);
}

console.log('=========== EVERY TEST FILE ===========');
{
  const files = readdirSync(HERE).filter(f => f.endsWith('.mjs') && f !== 'clock-checks.test.mjs').sort();
  const found = [];
  for (const f of files) for (const x of clockChecks(readFileSync(join(HERE, f), 'utf8'))) found.push(`${f}:${x.line} ${x.name.slice(0, 60)} [${x.hits.join(', ')}]`);
  if (process.env.CLOCK_CHECKS_PLANT === 'old') for (const x of clockChecks(OLD_C2)) found.push(`(planted) solver-tiers.test.mjs as before 3 Nov:${x.line} ${x.name.slice(0, 60)} [${x.hits.join(', ')}]`);
  const withClock = files.filter(f => CLOCK.test(readFileSync(join(HERE, f), 'utf8'))).length;
  ok('5  no check in research/tests reads a value from the wall clock', found.length === 0, found.length ? found.join(' | ') : `${files.length} files, ${withClock} reading a clock`);
}

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
