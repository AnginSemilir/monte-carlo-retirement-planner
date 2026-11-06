/*
 * THE READINESS CHECKLIST (Phase 12 item 5; the launch plan's section 4, Phase 12, and R6: "The agent puts the opt-in on `main`,
 * off by default, when the readiness checklist prints all PASS"). Each line PASS or FAIL, read from the results files, on the
 * release commit: a results file names the code it ran on by its stamp (research/solver/launch-stamp.mjs), and a line passes only
 * where that stamp is the release's own, so a result from other code never counts.
 *   1. run-all.sh ALL REQUIRED GREEN in both modes, the classic planner and the new (results-gate-classic.txt, -new.txt);
 *   2. both CI tiers green on the release commit (results-ci.txt, the runs as GitHub reports them: research/solver/ci-record.mjs);
 *   3. the full-scale browser solve: 45 points, the real settings, the floor at 80%, one household, its tables Node's bit for bit,
 *      its time recorded (results-fullscale.txt, solver-fullscale-ui.cjs);
 *   4. the library sweep: every single normalises, prepares and solves at light settings without a throw, and a sample with every
 *      lever off its default (results-library-sweep.txt, library-sweep.test.mjs checks 1 and 2);
 *   5. L4 and L5 read, R1 to R3 applied, and the reads sent to the maintainer (results-levers.txt, results-costs.txt, their
 *      reviews, and STATE.md's record of each read and its report);
 *   6. old exports import (results-library-sweep.txt, check 3);
 *   7. the isolation, failure-path, phone and new-planner harnesses green (the gate's files: solver-isolation, solver-planner
 *      (its check 11, the failure path), phone and phone-perf, each a pass in its mode);
 *   8. the opt-in switched on and off without losing a plan (the gate's solver-planner pass, whose check 15 it is).
 * The launch plan's line on a solve in Safari and in Firefox is not here: the maintainer excluded it (D60, 6 Nov: "exclude
 * safari and firefox checks").
 *   node research/solver/launch-ready.mjs [--dir <results dir>] [--stamp <stamp>]     (the two options for its own test only)
 * Exit 0 only when every line is PASS.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stamp as stampOf, stampAt } from './launch-stamp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, '../..');
const args = process.argv.slice(2), opt = k => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const DIR = opt('--dir') || HERE, STAMP = opt('--stamp') || stampOf(ROOT);
const read = f => (existsSync(join(DIR, f)) ? readFileSync(join(DIR, f), 'utf8') : null);
const stampIn = t => (t && (/the code: (code-stamp:[0-9a-f]{16})/.exec(t) || [])[1]) || null;
const lines = [];
const line = (n, label, pass, why) => lines.push({ n, label, pass: !!pass, why });
const fresh = (t, f) => (!t ? `${f} missing` : stampIn(t) !== STAMP ? `${f} ran on ${stampIn(t) || 'no stamped code'}, not ${STAMP}` : null);
// a harness's row in a gate file: 'pass', or what it says
const row = (t, name) => { const m = t && new RegExp(`^${name}\\s+required\\s+(.+)$`, 'm').exec(t); return m ? m[1].trim() : 'absent'; };

// 1. the gate in both modes
const gc = read('results-gate-classic.txt'), gn = read('results-gate-new.txt');
{ const why = fresh(gc, 'results-gate-classic.txt') || fresh(gn, 'results-gate-new.txt');
  const green = t => /^ALL REQUIRED GREEN$/m.test(t || '') && !/SOMETHING REQUIRED FAILED/.test(t || '');
  line(1, 'run-all.sh ALL REQUIRED GREEN in both modes (the classic planner, the new)', !why && green(gc) && green(gn), why || `classic ${green(gc) ? 'green' : 'NOT green'}, new ${green(gn) ? 'green' : 'NOT green'}`); }

// 2. CI on the release commit: each run's commit stamped as this code
{ const t = read('results-ci.txt'), runs = t ? [...t.matchAll(/^(Verify|Full) run (\d+) on ([0-9a-f]{40}): (\w+)$/gm)].map(m => ({ wf: m[1], n: m[2], sha: m[3], c: m[4] })) : [];
  const mine = runs.filter(x => { try { return stampAt(ROOT, x.sha) === STAMP; } catch (e) { return false; } });
  const tier = wf => mine.filter(x => x.wf === wf);
  const ok = ['Verify', 'Full'].every(wf => tier(wf).length > 0 && tier(wf).every(x => x.c === 'success'));
  line(2, 'both CI tiers green on the release commit', ok, !t ? 'results-ci.txt missing' : ['Verify', 'Full'].map(wf => `${wf} ${tier(wf).map(x => `${x.n} ${x.c}`).join(', ') || 'none on this code'}`).join('; ')); }

// 3. the full-scale browser solve
{ const t = read('results-fullscale.txt'), why = fresh(t, 'results-fullscale.txt');
  const m = t && /the page: solved in ([\d.]+) s, split (\d+) ways/.exec(t);
  line(3, 'the full-scale browser solve: 45 points, the real settings, the floor at 80%, its tables Node\'s bit for bit, its time recorded',
    !why && /ok +the site as it ships solves S116 at 45 wealth points, its tables Node's bit for bit/.test(t) && /\nall ok\s*$/.test(t) && !!m, why || (m ? `S116 in ${m[1]} s split ${m[2]} ways` : 'no time recorded')); }

// 4 and 7. the library sweep and old exports
const sw = read('results-library-sweep.txt'), swWhy = fresh(sw, 'results-library-sweep.txt');
line(4, 'the library sweep: every single, and a sample with every lever off its default, solves at light settings without a throw',
  !swWhy && /^ {2}ok {3}1\. /m.test(sw) && /^ {2}ok {3}2\. /m.test(sw), swWhy || ((sw.match(/^ {2}(ok {2}|FAIL) [12]\. .*$/gm) || []).map(s => s.slice(0, 60)).join(' | ')));

// 5. L4 and L5
{ const lev = read('results-levers.txt'), cost = read('results-costs.txt');
  const rev = f => existsSync(join(HERE, 'reviews', f)) && /\bPASS\b/.test(readFileSync(join(HERE, 'reviews', f), 'utf8'));
  const state = existsSync(join(HERE, 'STATE.md')) ? readFileSync(join(HERE, 'STATE.md'), 'utf8') : '';
  const ok = !!lev && !!cost && rev('2026-11-02-read-L4.md') && rev('2026-11-01-read-L5.md') && /L4 read/.test(state) && /L5 read/.test(state) && /by R1 B3a ships/.test(state) && /by R3 no cell loses survival/.test(state);
  line(5, 'L4 and L5 read, R1 to R3 applied, the reads sent to the maintainer', ok, ok ? 'results-levers.txt, results-costs.txt, their reviews PASS, STATE.md records R1 to R3 and the reports' : 'a read, its review or its record missing'); }

line(6, 'old exports import', !swWhy && /^ {2}ok {3}3\. /m.test(sw), swWhy || ((sw.match(/^ {2}(ok {2}|FAIL) 3\. .*$/m) || [''])[0].slice(0, 80)));

// 7 and 8. the harnesses, from the gate's files
{ const why = fresh(gc, 'results-gate-classic.txt') || fresh(gn, 'results-gate-new.txt');
  const r = { isolation: row(gn, 'solver-isolation'), planner: row(gn, 'solver-planner'), phone: row(gc, 'phone'), perfClassic: row(gc, 'phone-perf'), perfNew: row(gn, 'phone-perf') };
  line(7, 'the isolation, failure-path, phone and new-planner harnesses green', !why && Object.values(r).every(x => x === 'pass'), why || Object.entries(r).map(([k, v]) => `${k} ${v}`).join(', '));
  line(8, 'the opt-in switched on and off without losing a plan (solver-planner check 15)', !why && r.planner === 'pass', why || `solver-planner ${r.planner}`); }

console.log(`THE READINESS CHECKLIST, the code ${STAMP}`);
for (const l of lines) console.log(`${l.pass ? 'PASS' : 'FAIL'}  ${l.n}. ${l.label}${l.why ? `   (${l.why})` : ''}`);
const all = lines.every(l => l.pass);
console.log(all ? '\nALL PASS: the opt-in may go on main, off by default (R6)' : `\n${lines.filter(l => !l.pass).length} of ${lines.length} FAIL: the opt-in waits (R6)`);
process.exit(all ? 0 : 1);
