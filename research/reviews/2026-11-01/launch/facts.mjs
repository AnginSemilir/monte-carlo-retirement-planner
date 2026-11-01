/*
 * THE LAUNCH PLAN'S FACTS (the external review of 1 Nov, LAUNCH-PLAN.md sections 1 and 2): every figure the plan cites
 * about where the work stands, printed from its source. Nothing here is a research result; each line names its source.
 *   node facts.mjs --cc <the agent's worktree> --ref <commit> --ci <fetch-ci.sh's directory> --review <the review repo>
 * The agent's files are read at the commit (git show <ref>:<path>), the review's from its working tree, the CI's from the
 * raw answers fetch-ci.sh saved outside git. A line that cannot be found stops the script: no figure is printed blank.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const arg = k => { const i = process.argv.indexOf(k); if (i < 0 || !process.argv[i + 1]) throw new Error(`facts: ${k} is required`); return process.argv[i + 1]; };
const CC = arg('--cc'), REF = arg('--ref'), CI = arg('--ci'), REV = arg('--review');
const git = (...a) => execFileSync('git', ['-C', CC, ...a], { maxBuffer: 1 << 28 }).toString();
const at = p => git('show', `${REF}:${p}`);
const has = p => { try { execFileSync('git', ['-C', CC, 'cat-file', '-e', `${REF}:${p}`], { stdio: 'ignore' }); return true; } catch { return false; } };
const need = (m, what) => { if (!m) throw new Error(`facts: not found: ${what}`); return m; };
const json = f => JSON.parse(readFileSync(join(CI, f), 'utf8'));
const out = [];
const say = s => out.push(s);
const ukTime = iso => new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/London', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const head = git('log', '-1', '--format=%h %cd %s', '--date=format:%d %b %H:%M', REF).trim();
say(`# node facts.mjs --ref ${REF} (the agent's branch at ${head})`);
say('');

// A. the code at the commit
say('## A. The code');
const app = at('src/App.jsx').split('\n');
const sw = need(app.findIndex(l => l === 'const SOLVER = false;'), 'the switch line') + 1;
const exp = need(app.findIndex(l => l.startsWith('export {')), "the engine's export line") + 1;
say(`- The switch: src/App.jsx line ${sw} reads "const SOLVER = false;"; the engine slice (research/build-engine.py) ends at line ${exp} of ${app.length}, so the switch and the UI below it are outside the engine the tests import.`);
for (const p of ['src/solver/diff.js', 'src/solver/distil.js', 'src/solver/couple.js', 'research/ui-harnesses/solver-strategy-ui.cjs']) say(`- ${p}: ${has(p) ? 'present' : 'absent'}`);
const couple = at('src/solver/couple.js');
say(`- src/solver/couple.js: ${couple.split('\n').length} lines; "${need(couple.match(/Tiers are off for couples[^.]*\./), "couple.js's tiers line")[0]}"`);
const runAll = at('research/tests/run-all.mjs');
const fast = need(runAll.match(/export const FAST = \[([\s\S]*?)\];/), 'the FAST list')[1].match(/'[^']+\.test\.mjs'/g).map(s => s.slice(1, -1));
const all = git('ls-tree', '--name-only', `${REF}:research/tests`).split('\n').filter(f => f.endsWith('.test.mjs'));
const outside = all.filter(f => !fast.includes(f));
say(`- The verification suite: ${all.length} test files, ${fast.length} in FAST, ${outside.length} in the nightly tier only; among the latter: ${['solver-aims.test.mjs', 'lock-tiers.test.mjs', 'solver-couple.test.mjs', 'windfall-split.test.mjs', 'save-split.test.mjs', 'gaps-sweep.test.mjs'].filter(f => outside.includes(f)).join(', ')}.`);
const ra = at('research/ui-harnesses/run-all.sh');
const req = need(ra.match(/^REQUIRED=\(([^)]*)\)/m), 'the REQUIRED harnesses')[1].trim().split(/\s+/);
const solverBuild = /SOLVER_PREVIEW/.test(ra);
say(`- The harness gate (research/ui-harnesses/run-all.sh): ${req.length} REQUIRED harnesses, the solver's ${req.filter(n => n.startsWith('solver')).join(' and ')}; the gate builds the site once with \`npm run build\` (the switch off)${solverBuild ? '' : ', and has no mode that builds it with the switch on'}.`);
const vy = at('.github/workflows/verify.yml');
const cron = need(vy.match(/cron: '([^']+)'/), 'the nightly cron')[1], tmo = need(vy.match(/timeout-minutes: (\d+)/), 'the timeout')[1], j = need(vy.match(/run-all\.mjs "\$TIER" -j (\d+)/), 'the -j')[1];
say(`- CI (.github/workflows/verify.yml): the fast tier on every push and pull request; the full tier on workflow_dispatch and nightly at cron '${cron}' (UTC); one job, timeout ${tmo} minutes, the tests ${j} at a time; it checks out the commit that triggered it (a scheduled run: the default branch's).`);
const pc = at('.githooks/pre-commit');
say(`- The pre-commit hook: the fast tier, -j ${need(pc.match(/run-all\.mjs fast -j (\d+)/), "the hook's -j")[1]}, whenever a commit touches ${need(pc.match(/grep -qE '\^\((.*)\)'/), "the hook's trigger")[1].replace(/\\/g, '')}.`);
const vite = at('vite.config.js');
say(`- Cross-origin isolation: vite.config.js sends COOP and COEP on ${['server', 'preview'].filter(k => new RegExp(`${k}: \\{ headers: ISOLATED \\}`).test(vite)).join(' and ')} only; .github/workflows/deploy.yml publishes dist to GitHub Pages${/headers/i.test(at('.github/workflows/deploy.yml')) ? ' (with a headers step)' : ' with no headers step'}.`);
const dep = at('.github/workflows/deploy.yml').replace(/\n#\s*/g, ' ');
say(`- The live site's saved plans (.github/workflows/deploy.yml): "${need(dep.match(/Visitors' saved plans live in their own browser keyed to that origin[^.]*\. See DEPLOY\.md\./), "deploy.yml's origin note")[0]}"`);
const vc = at('vite.config.js').replace(/\n\s*\*\s*/g, ' ');
say(`- vite.config.js on the headers: "${need(vc.match(/Every asset the app loads is its own, so `require-corp` blocks nothing\./), "vite's require-corp note")[0]}"`);
const sw0 = at('src/solverWorker.js');
need(sw0.match(/^import \* as App from '\.\/App\.jsx';$/m), "the worker's import of App.jsx");
const codeLine = need(sw0.match(/^const CODE = [^\n]*$/m), "the worker's cache key")[0];
say(`- The solver's worker imports the whole of App.jsx ("import * as App from './App.jsx';") and keys the stored solves on its own URL: \`${codeLine}\` (src/solverWorker.js).`);
const client = at('src/solverClient.js');
say(`- The page's solve: "${need(client.match(/Elsewhere the solve runs whole in one worker\./), "the client's fallback line")[0]}" (src/solverClient.js); the simulation of the solved plan runs in the owner worker alone (src/solverWorker.js 'simulate').`);
const mcTrials = need(app.join('\n').match(/function monteCarlo\(planOrCtx, \{ trials = (\d+)/), "monteCarlo's default trials")[1];
say(`- The engine's monteCarlo runs ${mcTrials} paths by default (src/App.jsx).`);
const aims = at('research/solver/results-solver-aims.txt');
const aimsLine = need(aims.match(/^.*ALL PASS[^\n]*$/m), "solver-aims' summary")[0].trim();
const cfgMsg = git('log', '-1', '--format=%B', '91cd38e');
say(`- Phase 8's tests: research/solver/results-solver-aims.txt "${aimsLine.slice(0, 120)}"; the Phase 8 commit (91cd38e) on research/ui-harnesses/solver-config-ui.cjs: "${need(cfgMsg.match(/all 23 checks ok on this code/), "Phase 8's harness line")[0]}" (a commit message, not a results file).`);
say(`- Commits on the branch not on main: ${git('rev-list', '--count', `origin/main..${REF}`).trim()} (main at ${git('log', '-1', '--format=%h %s', 'origin/main').trim().slice(0, 90)}).`);
say('');

// B. CI, from the raw answers
say('## B. CI and the repository (GitHub REST, fetched ' + readFileSync(join(CI, 'fetched-at.txt'), 'utf8').trim() + ')');
const repo = json('repo.json'), sched = json('schedule-runs.json'), pr2 = json('pr2.json');
say(`- Default branch ${repo.default_branch}; public ${repo.visibility === 'public'}; a fork ${repo.fork}; Pages ${repo.has_pages}.`);
const merged = new Date(pr2.merged_at), fetched = new Date(readFileSync(join(CI, 'fetched-at.txt'), 'utf8').trim());
const [cm, ch] = cron.split(' ').map(Number);
let n = 0, first = null;
for (let d = new Date(Date.UTC(merged.getUTCFullYear(), merged.getUTCMonth(), merged.getUTCDate(), ch, cm)); d <= fetched; d = new Date(d.getTime() + 864e5)) if (d > merged) { n++; first = first || d; }
say(`- The nightly schedule reached main with pull request 2, merged ${ukTime(pr2.merged_at)} UK; scheduled times since then: ${n}${first ? ` (the first ${ukTime(first.toISOString())} UK)` : ''}; scheduled runs GitHub lists for the repository: ${sched.total_count}.`);
const timing = (f) => {
  const lines = readFileSync(join(CI, f), 'utf8').split('\n').map(l => l.replace(/^\S+ /, '')).filter(l => /^(ok  |FAIL) \S+\.test\.mjs \(\d+ s\)/.test(l));
  const rows = lines.map(l => { const m = l.match(/^(ok  |FAIL) (\S+) \((\d+) s\)/); return { f: m[2], s: Number(m[3]), ok: m[1] === 'ok  ' }; });
  const summary = need(readFileSync(join(CI, f), 'utf8').match(/run-all (fast|all): .*/), `${f}'s summary`)[0];
  return { rows, cpu: rows.reduce((a, r) => a + r.s, 0), top: [...rows].sort((a, b) => b.s - a.s), summary };
};
const span = (f) => { const jb = json(f).jobs[0]; return { start: jb.started_at, end: jb.completed_at, mins: (new Date(jb.completed_at) - new Date(jb.started_at)) / 60000 }; };
for (const [k, label] of [['fast', 'the fast tier on a push'], ['all', 'the full tier by hand (workflow_dispatch)']]) {
  const t = timing(`log-${k}.txt`), s = span(`jobs-${k}.json`), run = json(`run-${k}.json`);
  const top = t.top.slice(0, k === 'fast' ? 2 : 4);
  say(`- ${label}, run ${run.id} on ${run.head_sha.slice(0, 7)} (${run.event}): "${t.summary.replace(/^run-all \w+: /, '')}"; ${t.rows.length} files, ${t.cpu} CPU seconds (${(t.cpu / 3600).toFixed(2)} CPU-hours); the job ${ukTime(s.start)} to ${ukTime(s.end)} UK, ${Math.floor(s.mins / 60)} h ${Math.round(s.mins % 60)} min${k === 'all' ? `, against the job's ${tmo}-minute limit (${(100 * (1 - s.mins / Number(tmo))).toFixed(0)}% to spare)` : ''}; the longest: ${top.map(r => `${r.f} ${r.s} s`).join(', ')} (${(100 * top.reduce((a, r) => a + r.s, 0) / t.cpu).toFixed(0)}% of the tier's CPU).`);
}
{ const t = timing('log-all.txt'); say(`- The full tier over four parallel slots (two shards at -j 2): ${(t.cpu / 3600 / 4).toFixed(1)} hours a shard if balanced; its longest file ${t.top[0].f} ${(t.top[0].s / 60).toFixed(0)} minutes.`); }
say('');

// C. the timings and the levers in the agent's results files
say("## C. The solve's cost, from the agent's results files");
const g5 = at('research/solver/results-gate5.txt');
const g5rows = [...g5.matchAll(/^\s+(bridge 4|S126|S370|share 0\.50)\s+\S+\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/gm)].map(m => ({ h: m[1], prod: +m[2], cand: +m[3], split: +m[4] }));
need(g5rows.length === 4 && g5rows, "gate 5's four rows");
const mm = (a) => `${Math.min(...a).toFixed(1)} to ${Math.max(...a).toFixed(1)}`;
say(`- Gate 5 (research/solver/results-gate5.txt, ${need(g5.match(/code (\w{12})/), "gate 5's code")[1]}): the candidate at 45 points on one core ${mm(g5rows.map(r => r.cand))} s (${(Math.min(...g5rows.map(r => r.cand)) / 60).toFixed(1)} to ${(Math.max(...g5rows.map(r => r.cand)) / 60).toFixed(1)} min), split across 4 cores ${mm(g5rows.map(r => r.split))} s; "${need(g5.match(/median: [^\n]+/), "gate 5's median")[0]}".`);
const n7 = at('research/solver/results-n7-check.txt');
const n7c = need(n7.match(/S370 cand at 45 points: ([\d.]+) s[^;]*;[^\n]*?tables (\d+) MB/), "N7's S370 line");
say(`- Six solves split four ways at gate 5's split times (the age dial's three years either way, D18): ${(6 * Math.min(...g5rows.map(r => r.split)) / 60).toFixed(1)} to ${(6 * Math.max(...g5rows.map(r => r.split)) / 60).toFixed(1)} minutes.`);
say(`- In this container's Chromium (research/solver/results-n7-check.txt, the commit's suite running beside it): S370, the candidate at 45 points in one worker, ${n7c[1]} s (${(+n7c[1] / 60).toFixed(1)} min); its tables ${n7c[2]} MB.`);
const lc = at('research/solver/results-lock-check.txt');
const lcr = ['S090', 'S328F'].map(h => ({ h, base: +need(lc.match(new RegExp(`${h} CANDLK[^\\n]*?solve (\\d+) s`)), `${h}'s base solve`)[1], lock: +need(lc.match(new RegExp(`${h} D10MLK[^\\n]*?solve (\\d+) s`)), `${h}'s locked solve`)[1] }));
say(`- The locked dial at ten against its base, on the agent's port (research/solver/results-lock-check.txt): ${lcr.map(r => `${r.h} ${r.lock} s against ${r.base} s (x${(r.lock / r.base).toFixed(2)})`).join('; ')}.`);
const cd = at('research/solver/results-curve-dial.txt');
const eq = a => need(cd.match(new RegExp(`^\\s+${a}\\s+[\\d.]+%;[^\\n]*?equity ([\\d.]+) /`, 'm')), `${a}'s equity`)[1];
say(`- The dial as built (lambda alone) moves the risk: the retirees' pension and ISA equity share at retired year 1, CANDD ${eq('CANDD')}%, DIAL3 ${eq('DIAL3')}%, DIAL10 ${eq('DIAL10')}% (research/solver/results-curve-dial.txt, 8 households, seed 7002, 4,000 paths).`);
const p4 = at('research/solver/results-phase4-sizing.txt');
say(`- Phase 4's budget (research/solver/results-phase4-sizing.txt): "${need(p4.match(/THE BUDGET \(D21\)[^:]*: [\d.]+ core-hours, about [\d.]+ hours on 4 cores \(the solves [\d.]+, the engine [\d.]+\)/), "Phase 4's budget")[0]}".`);
const ws = at('research/solver/WINDFALL-SPLIT.md');
const wsl = need(ws.match(/0\.115 core-hours of solve\s+and 0\.163 of engine a household/), "WINDFALL-SPLIT.md's cost line").map(x => x.replace(/\s+/g, ' '));
say(`- The engine under the candidate's table: "${wsl[0]}" at 8,000 paths (research/solver/WINDFALL-SPLIT.md, from the tier test's units): ${(0.163 * 3600 * 1000 / 8000).toFixed(0)} ms a path, so ${mcTrials} paths about ${(0.163 * 3600 / 8000 * Number(mcTrials) / 60).toFixed(1)} min in one worker.`);
say('');

// D. the review's lever figures and the locked run's solve times
say("## D. The review's locked run (research/reviews/2026-10-30/lock, EXPLORATORY, seed 7002, 1,000 paths a household, 8 households)");
const lr = readFileSync(join(REV, 'research/reviews/2026-10-30/lock/results-lock-run.txt'), 'utf8');
for (const a of ['CAND', 'D10MLK']) {
  const m = need(lr.match(new RegExp(`^  ${a}\\s+survival ([\\d.]+)%; the first retired year [\\d.]+% \\(the retirees ([\\d.]+)%\\); by retired years 1-5 ([\\d.]+)%[^;]*; at the floor 1-5 (\\d+)%[^\\n]*?equity share at retired years 1, 5, 10, 20 [^(]*\\(the retirees ([\\d.]+) /`, 'm')), `${a}'s pooled line`);
  say(`- ${a}: survival ${m[1]}%; the retirees' first year ${m[2]}% of target; retired years 1-5 ${m[3]}%; at the floor in years 1-5 ${m[4]}%; the retirees' equity at retired year 1 ${m[5]}%.`);
}
say(`- ${need(lr.match(/D10MLK less CAND: [^;]*;[^;]*;/), 'D10MLK less CAND')[0].replace(/;$/, '')}).`);
say(`- ${need(lr.match(/D10MLK less DIAL10M: [^;]*;[^;]*;/), 'D10MLK less DIAL10M')[0].replace(/;$/, '')}).`);
const wk = readFileSync(join(REV, 'research/reviews/2026-10-30/lock/results-lock-run-workers.txt'), 'utf8');
const seen = new Set(), pairs = [];
for (const m of wk.matchAll(/^(S\d+F?) candlk[^\n]*?solve (\d+) s\n\1 d10mlk[^\n]*?solve (\d+) s/gm)) if (!seen.has(m[1])) { seen.add(m[1]); pairs.push({ h: m[1], base: +m[2], lock: +m[3] }); }
need(pairs.length >= 6 && pairs, "the workers' solve pairs");
say(`- The locked solve against its base, two households at a time (results-lock-run-workers.txt): ${pairs.map(p => `${p.h} ${p.lock}/${p.base} s`).join(', ')}; the ratio ${Math.min(...pairs.map(p => p.lock / p.base)).toFixed(2)} to ${Math.max(...pairs.map(p => p.lock / p.base)).toFixed(2)}.`);

say('');

// E. the spending floor: what the app hands the solver, and what every test of the candidate set
say("## E. The spending floor");
const srcFiles = git('ls-tree', '-r', '--name-only', `${REF}:src`).split('\n').filter(f => /\.(js|jsx)$/.test(f));
const hits = [];
for (const f of srcFiles) at(`src/${f}`).split('\n').forEach((l, i) => { if (/floorSpend/.test(l)) hits.push(`src/${f}:${i + 1}`); });
say(`- Every line under src/ that names the plan's spending floor (floorSpend): ${hits.join(', ')}; no screen asks for it and the solver's preparation (src/solverSettings.js prepareForSolve) sets none.`);
const sv = at('src/solver/solve.js');
say(`- The candidate's menu (src/solver/solve.js productLevels): "${need(sv.match(/The menu for a floor, as a fraction of target: [^*]*?\*\//), 'productLevels\' line')[0].replace(/\s*\*\/$/, '')}"; with no floor the rule is \`${need(sv.match(/const f = floorFrac > 0 \? Math\.min\(1, floorFrac\) : 1;/), 'the no-floor rule')[0]}\`, so the levels are the target and the raises only.`);
const pp = at('research/solver/phase4-panel.mjs').split('\n');
const fl = need(pp.findIndex(l => /floorSpend: Math\.round\(0\.8 \* target\)/.test(l)), "Phase 4's floor") + 1;
need(at('research/solver/audit-e2x.mjs').match(/floorSpend: Math\.round\(0\.8 \* E\.num\(h\.plan\.spending\.targetSpend, 0\)\)/), "gate 5's floor");
say(`- Phase 4's panel (research/solver/phase4-panel.mjs line ${fl}): "${pp[fl - 1].trim()}"; gate 5's audit (research/solver/audit-e2x.mjs) sets floorSpend at 0.8 of the target too.`);
const users = ['research/solver/audit-curve.mjs', 'research/solver/audit-tiers.mjs', 'research/solver/lock-check.mjs'].filter(f => /phase4-panel\.mjs/.test(at(f)));
const revLock = readFileSync(join(REV, 'research/reviews/2026-10-30/lock/lock-run.mjs'), 'utf8');
say(`- The curve, dial, tier and lock runs build their households from that panel: ${users.join(', ')} import phase4-panel.mjs${/phase4-panel\.mjs/.test(revLock) ? ', and so does the review\'s lock run (research/reviews/2026-10-30/lock/lock-run.mjs)' : ''}.`);
const head12 = execFileSync('git', ['-C', CC, 'rev-parse', '--short=7', 'HEAD']).toString().trim();
if (!git('rev-parse', REF).startsWith(git('rev-parse', 'HEAD').trim()) || execFileSync('git', ['-C', CC, 'status', '--porcelain', '--', 'research/policy-study', 'src']).toString().trim()) throw new Error(`facts: the worktree is not clean at ${REF} (HEAD ${head12}); the library is read from it`);
const { buildScenarios } = await import(join(CC, 'research/policy-study/scenarios.mjs'));
const lib = buildScenarios(), singles = lib.filter(x => x.plan.demographics.planningMode === 'single');
const withFloor = singles.filter(x => Number(x.plan.spending.floorSpend) > 0).length;
say(`- The library (research/policy-study/scenarios.mjs at ${head12}): ${lib.length} households, ${singles.length} single; ${withFloor} of the singles carry a floor.`);
say('');

// F. V3's wealth ladder, for the phone's grid and any preview grid
say("## F. The wealth points' cost (research/solver/results-v3.txt, V3's ladder: survival points / whole score on the panel mean, then the largest household)");
const v3 = at('research/solver/results-v3.txt');
for (const w of ['0.02', '0.01']) {
  const lad = need(v3.match(new RegExp(`the wealth ladder at W${w.replace('.', '\\.')}, each rung against the next finer by the same targets: ([^\\n]*)`)), `V3's ladder at ${w}`)[1];
  for (const r of ['20 -> 30', '30 -> 45', '45 -> 60']) say(`- the estate weight ${w}, ${r} points: ${need(lad.match(new RegExp(`${r} points: ([^;]*)`)), r)[1].trim()}`);
}

say('');

// G. what the plan's fixes rest on: the cache, the bridge margin, one-off costs, the archive's couples notes
say('## G. The cache, the bridge margin, one-off costs and couples');
const cache = at('src/solverCache.js');
need(cache.match(/s\.clear\(\); s\.put\(\{ \.\.\.record, key, code, stored: Date\.now\(\) \}, 'latest'\)/), "the cache's one-solve store");
say(`- The cache (src/solverCache.js) keeps one solve: storing clears the store and puts the new solve as 'latest' ("${need(cache.replace(/\n \* ?/g, ' ').match(/The latest plan only: [^)]*\)[^.]*\./), "the cache's note")[0]}").`);
const bsm = app.findIndex(l => /Tournament bridge safety margin/.test(l)) + 1;
const solverReads = srcFiles.filter(f => f.startsWith('solver/') || /^solver\w*\.js$/.test(f)).filter(f => /bridgeSafetyMargin/.test(at(`src/${f}`)));
say(`- The bridge safety margin: src/App.jsx line ${need(bsm, 'the margin field')} labels it "Tournament bridge safety margin (%)", in the Config card that stays under the switch; files of the solver that read it: ${solverReads.length ? solverReads.join(', ') : 'none'}. D18 (STATE.md): "${need(at('research/solver/STATE.md').match(/the bridge\s+safety\s+margin\s+stays as a lock/), "D18's lock")[0].replace(/\s+/g, ' ')}".`);
const { readPanel } = await import(join(CC, 'research/solver/phase4-panel.mjs'));
const pr = await readPanel(), ph = (Array.isArray(pr) ? pr : (pr.households || pr.panel || Object.values(pr))).map(h => h.plan || h).filter(p => p && p.spending);
const costs = a => a.filter(p => (p.oneOffCosts || []).length > 0).length;
const couples = lib.filter(x => x.plan.demographics.planningMode !== 'single');
say(`- One-off costs: on Phase 4's panel ${costs(ph)} of ${ph.length} households; the library's singles ${costs(singles.map(x => x.plan))} of ${singles.length}; its couples ${costs(couples.map(x => x.plan))} of ${couples.length}.`);
const arch = at('research/solver/archive/PLAN.md');
say(`- The archive on couples: O11, "${need(arch.match(/60 of the library's 210 couples have a bridge for at least one partner/), 'O11')[0]}"; M4, "${need(arch.match(/\*\*The couples rollout has three gaps\.\*\* [^|]*?\./), 'M4')[0].replace(/\*\*/g, '')}"; M12, "${need(arch.match(/\*\*The solver's handling of one-off COSTS has never been tested on a single household\.\*\*/), 'M12')[0].replace(/\*\*/g, '')}"; and "${need(arch.match(/\| \*\*Mortality\*\* \| No death probabilities\.[^|]*\|/), 'the mortality line')[0].replace(/\*\*/g, '').replace(/^\| | \|$/g, '').replace(' | ', ': ')}"`);
const aw = at('src/solver/solve.js').replace(/\n \* ?/g, ' ');
say(`- The age weights (src/solver/solve.js): "${need(aw.match(/`ageWeight` = \{ mode, disp \} weights each year's cost of a cut, and its credit for a raise, by a Gompertz chance of being alive from the plan's age/), 'the age weights')[0]}"; "${need(aw.match(/Survival stays the currency and nothing else moves\./), "the age weights' note")[0]}"`);

console.log(out.join('\n'));
