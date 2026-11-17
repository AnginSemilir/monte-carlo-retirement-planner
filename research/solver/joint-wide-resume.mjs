/*
 * JOINT-WIDE'S RESUME CHECK (JOINT-WIDE.md's amendment 2; CHECKLIST 5): a unit stopped part-way, as a container restart stops
 * it, and run again picks up from its last saved chunk and gives the unit a straight run gives, to the bit. At a smoke's
 * settings (6 points, 60 paths of seed 7002, chunks of 20, the replays on 2), one unit (S023-90 unless named):
 *   STRAIGHT  run once to its end;
 *   RESUMED   stopped after four chunks (JW_STOP_AFTER: K2's three and K4's first), then run again to its end.
 * Compared: each arm's seven arrays (survival, failure year, pot, estate, lifetime tax, spending delivered, unmet spending)
 * byte for byte, each person's table digests, the replays; and that the resumed unit's K4 ran in two processes (it did resume)
 * and left no saved part behind. Its plant (--plant offbyone: a path skipped on resuming) must fail the arrays. No outcome is
 * printed: the audit's own lines go to the scratch folders, and at a smoke's settings it prints none.
 *   node research/solver/joint-wide-resume.mjs [unit id] [--plant offbyone]
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { UNITS, ARMS } from './audit-joint-wide.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), AUDIT = join(HERE, 'audit-joint-wide.mjs');
const args = process.argv.slice(2), plant = args.includes('--plant') ? args[args.indexOf('--plant') + 1] : null;
const id = args.find(a => !a.startsWith('--') && a !== plant) || 'S023-90', k = UNITS.findIndex(u => u.id === id);
if (k < 0) { console.error(`joint-wide-resume: no unit ${id}`); process.exit(2); }
const base = { ...process.env, JW_PTS: '6', JW_N: '60', JW_REPLAY: '2', JW_CHUNK: '20' };
delete base.JW_STOP_AFTER; delete base.JW_PLANT;
const run = (dir, extra, log) => {
  try { execFileSync(process.execPath, [AUDIT, 'part', `${k}/${UNITS.length}`], { env: { ...base, JW_OUT: dir, ...extra }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }); return 0; }
  catch (e) { writeFileSync(join(dir, log), String(e.stdout || '') + String(e.stderr || '')); return e.status; }
};
const root = mkdtempSync(join(tmpdir(), 'jw-resume-')), A = join(root, 'straight'), B = join(root, 'resumed');
execFileSync('mkdir', ['-p', A, B]);
const s0 = run(A, {}, 'straight.err'), s1 = run(B, { JW_STOP_AFTER: '4' }, 'stopped.err'), s2 = run(B, plant ? { JW_PLANT: plant } : {}, 'resumed.err');
const read = dir => JSON.parse(gunzipSync(readFileSync(join(dir, `${id}.json.gz`))).toString());
const checks = [];
const check = (label, ok) => { checks.push([label, ok]); console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}`); };
console.log(`JOINT-WIDE'S RESUME CHECK: ${id} (unit ${k}) at a smoke's settings${plant ? `, the plant ${plant}` : ''}`);
check(`the straight run ends cleanly (exit ${s0}), the stopped one stops as a restart would (exit ${s1}, want 75), and the run again ends cleanly (exit ${s2})`, s0 === 0 && s1 === 75 && s2 === 0);
if (s0 === 0 && s2 === 0) {
  const X = read(A), Y = read(B), KEYS = ['survived', 'failYear', 'pot', 'estate', 'tax', 'delivered', 'unmet'];
  const differ = ARMS.flatMap(a => KEYS.filter(key => X.arms[a][key] !== Y.arms[a][key]).map(key => `${a}.${key}`));
  check(`each arm's seven arrays the same byte for byte (differing: ${differ.join(', ') || 'none'})`, differ.length === 0);
  check('each person\'s table digests the same', JSON.stringify(X.digests) === JSON.stringify(Y.digests));
  check('the replays the same', JSON.stringify(X.along) === JSON.stringify(Y.along) && JSON.stringify(X.own) === JSON.stringify(Y.own));
  check(`the resumed unit's K4 ran in two processes and K2 in one (${Y.arms.K4.procs.length} and ${Y.arms.K2.procs.length})`, Y.arms.K4.procs.length === 2 && Y.arms.K2.procs.length === 1);
  check('no saved part is left behind', !existsSync(join(B, 'parts')) || readdirSync(join(B, 'parts')).length === 0);
}
const bad = checks.filter(([, ok]) => !ok).length;
console.log(bad ? `RESUME CHECK FAILED: ${bad} of ${checks.length}` : `RESUME CHECK: ALL PASS (${checks.length})`);
process.exit(bad ? 1 : 0);
