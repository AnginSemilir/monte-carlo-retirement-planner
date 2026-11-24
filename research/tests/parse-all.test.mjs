/*
 * THE TESTS, RESEARCH SCRIPTS AND HARNESSES PARSE (CHECKLIST 7). On 23 Nov step 4's build (43391a75) re-pinned
 * household.test.mjs check (7d) with a label carrying an unescaped apostrophe in a single-quoted string, so the file no longer
 * parsed. The fast tier does not run that test, so the pre-commit hook and the Verify workflow passed, and only the full tier
 * found it, on batch 15's pull request, with the batch gated and its CI under way. A file that does not parse fails before
 * any check of it runs, whatever tier it sits in; this reads, in the fast tier:
 *   1. every .mjs file directly in research/tests and in research/solver, and every .cjs file directly in
 *      research/ui-harnesses and in research/ui-harnesses/lib, parses (`node --check`, which compiles a file without running
 *      it). Not their subfolders (research/solver/archive, which no check reads, n7, qa and the rest) nor the review
 *      folders' and research/policy-study's scripts: every research file a test loads is in these four folders or is loaded
 *      by a test of the fast tier, which fails on it;
 *   2. check 1 shown failing on its plant: its own scan, over a list holding a planted file with the fault's own shape (a
 *      single-quoted label with an apostrophe left unescaped, written to a scratch folder) beside three files that parse,
 *      reads the planted file as not parsing, and it alone.
 *   node research/tests/parse-all.test.mjs
 */
import { readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir, availableParallelism } from 'node:os';
import { spawn } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const filesIn = (dir, ext) => readdirSync(join(ROOT, dir), { withFileTypes: true }).filter(d => d.isFile() && d.name.endsWith(ext)).map(d => join(ROOT, dir, d.name));
const files = [...filesIn('research/tests', '.mjs'), ...filesIn('research/solver', '.mjs'), ...filesIn('research/ui-harnesses', '.cjs'), ...filesIn('research/ui-harnesses/lib', '.cjs')];
/* check 1's scan: each file compiled in its own process, several at a time; the files that do not parse */
const parses = f => new Promise(res => spawn(process.execPath, ['--check', f], { stdio: 'ignore' }).on('close', code => res(code === 0)));
async function scan(list) {
  const bad = []; let next = 0;
  const lanes = Math.max(2, Math.min(8, availableParallelism ? availableParallelism() : 4));
  await Promise.all(Array.from({ length: lanes }, async () => { while (next < list.length) { const f = list[next++]; if (!(await parses(f))) bad.push(f); } }));
  return bad;
}
const bad = await scan(files);
ok('1. every .mjs directly in research/tests and research/solver and every .cjs directly in research/ui-harnesses and its lib parses', files.length > 0 && bad.length === 0, `${files.length} files; not parsing: ${bad.length ? bad.map(f => relative(ROOT, f)).join(', ') : 'none'}`);
{ const dir = mkdtempSync(join(tmpdir(), 'parse-all-')), planted = join(dir, 'planted.test.mjs');
  writeFileSync(planted, "const check = (n, c) => c;\ncheck('(7d) the solver\\'s code id (then step 4's shapes)', true);\n");
  const beside = files.slice(0, 3), got = await scan([...beside, planted]);
  rmSync(dir, { recursive: true, force: true });
  const caught = got.length === 1 && got[0] === planted;
  ok('2. check 1 shown failing on its plant: its scan reads a label with an unescaped apostrophe in a single-quoted string as not parsing, and nothing beside it', caught, `over ${beside.length + 1} files, not parsing: ${got.length ? got.map(f => (f === planted ? 'the planted file' : relative(ROOT, f))).join(', ') : 'none'}`); }
console.log(fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`);
process.exit(fail ? 1 : 0);
