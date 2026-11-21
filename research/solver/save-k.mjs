/*
 * TEST K, THE AUDIT (SAVE-K.md, its rule committed before any unit runs; D137 (4); the deep review of the savings split's v2,
 * reviews/2026-11-21-deep-save-v2.md section 3). EXPLORATORY.
 *
 * On the read's own code: the launch worktree at a83cd90b (code 71fb4271c681), given as <tree>. Every module of the solve and
 * the run is taken from it, and so are the registered audit's own functions (audit-save-v2.mjs): each arm is solved and run as
 * the registered audit solved and ran CANDDA and CANDSA. The registered units are read from <tree>'s results/save-v2-run.
 *
 * For one household of save-v2-panel.json, an employee or S280 (the control, self-employed):
 *   CANDDA-T  the candidate on anchors (the registered CANDDA's configuration) on the flipped plan (demographics.employmentSelf
 *             'self-employed', nothing else changed), on the first IDENT paths. Its table digest, its settings line and every
 *             array on those paths must be the registered CANDDA's (survival, failure year, pot, estate, lifetime tax, spending
 *             delivered, unmet), else a STOP (exit 4). Not run for the control.
 *   CANDSA-T  the split on anchors (the registered CANDSA's configuration) on the flipped plan, on the first ANCHORS_N paths,
 *             recorded as the registered audit records an arm: every path's arrays and each year's level; on runPolicy's first
 *             BESIDE paths each working year's save and tier pair, and the pots at the top of the first retired year. For the
 *             control its digest, its settings line and every array on every path must be the registered CANDSA's, else a STOP.
 * Checked before any path, a failure ending the unit (exit 3): the tree's own audit stamp the registered run's (its files
 * unchanged); arm A's pick on the plan as entered the landing's (the solver plan takes arm A's policy, as registered); the
 * flipped plan's inputs hash the registered arms' once the flag is set back (the flip moves nothing else that is hashed); each
 * arm's horizon, retirement year and working years with a save to choose the registered arms'; the registered audit's checks of
 * each solve (armProblems) and of its settings line on anchors (settingsProblems). Each arm's first CHECK paths are held to
 * E.runTrial, and its tables must not change while its paths run. The log carries no outcome: its stamp, the checks, the
 * timings and its done line.
 *   node research/solver/save-k.mjs <tree> <id>       one household, at the read's settings, into results/save-k-7025
 *   node research/solver/save-k.mjs --units           the households, the longest first, one a line
 *   SK_SMOKE=1 node research/solver/save-k.mjs <tree> <id>
 *       the machinery at light settings on seed 7002 and SK_N paths (20 unless set), into results/save-k-smoke: nothing is
 *       held to the registered units (they are at 45 points on seed 7025), and nothing is read
 */
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { gunzipSync, gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { cpus, hostname } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url)), REPO = join(HERE, '../..');
export const TREE_COMMIT = 'a83cd90b', TREE_CODE = '71fb4271c681', TREE_AUDIT = 'ffc59974f036';
export const SEED = 7025, SMOKE_SEED = 7002, IDENT = 500, CONTROL = 'S280';
/* the groups (SAVE-K.md, frozen before any unit runs): the three that save ISA first most; the basic-rate employees outside
   them; the higher-rate employees */
export const GROUPS = Object.freeze({
  three: ['S300F', 'S302F', 'S336F'],
  basic: ['S312F', 'S324F', 'S348F', 'S180', 'S182', 'S192', 'S218', 'S230', 'S242', 'S254', 'S264', 'S266', 'S276'],
  higher: ['S318F', 'S330F', 'S342F', 'S354F', 'S186', 'S198', 'S212', 'S222', 'S234', 'S248', 'S258', 'S270', 'S282', 'S296'],
});
export const EMPLOYEES = Object.freeze([...GROUPS.three, ...GROUPS.basic, ...GROUPS.higher]);
export const groupOf = id => Object.keys(GROUPS).find(g => GROUPS[g].includes(id)) || (id === CONTROL ? 'control' : null);
/* the units, the longest first (the fifteen-year households, then the five), the control last */
export const UNITS = Object.freeze([...EMPLOYEES.filter(id => /F$/.test(id) || Number(id.slice(1)) >= 242), ...EMPLOYEES.filter(id => !/F$/.test(id) && Number(id.slice(1)) < 242), CONTROL]);
/* the lever: the plan with its first person self-employed, nothing else changed */
export const flip = plan => ({ ...plan, demographics: { ...plan.demographics, employmentSelf: 'self-employed' } });
/* this test's own files: its stamp */
export const K_FILES = ['research/solver/SAVE-K.md', 'research/solver/save-k.mjs', 'research/solver/reduce-save-k.mjs', 'research/solver/batch-save-k.sh'];
export function kStamp(root = REPO) {
  const h = createHash('sha256');
  for (const f of K_FILES) h.update(f).update(existsSync(join(root, f)) ? readFileSync(join(root, f)) : 'missing');
  return h.digest('hex').slice(0, 12);
}
const js = x => JSON.stringify(x);
const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
export const dec = (str, Ty) => { const b = Buffer.from(str, 'base64'), c = new Uint8Array(b.length); c.set(b); return new Ty(c.buffer, 0, b.length / Ty.BYTES_PER_ELEMENT); };
/* a registered unit, its arms' arrays decoded */
export function readRegistered(tree, id, KEYS) {
  const U = JSON.parse(gunzipSync(readFileSync(join(tree, 'research/solver/results/save-v2-run', `${id}.json.gz`))).toString());
  for (const a of Object.keys(U.arms)) for (const [k, Ty] of Object.entries(KEYS)) U.arms[a][k] = dec(U.arms[a][k], Ty);
  return U;
}
/* the arrays of an arm on its first n paths against a reference's, key by key: the paths that differ, a count a key */
export function differs(A, R, n, KEYS) {
  const out = {};
  for (const k of Object.keys(KEYS)) { let d = 0; for (let i = 0; i < n; i++) if (!Object.is(A[k][i], R[k][i])) d++; out[k] = d; }
  return out;
}
export const anyDiffer = D => Object.values(D).some(v => v > 0);

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args[0] === '--units') { UNITS.forEach(id => console.log(id)); process.exit(0); }
  if (args.length < 2) { console.error('save-k: <tree> <id>, or --units'); process.exit(2); }
  const TREE = resolve(args[0]), ID = args[1], SMOKE = process.env.SK_SMOKE === '1';
  if (!UNITS.includes(ID)) { console.error(`save-k: ${ID} is not a household of the test (save-k.mjs UNITS)`); process.exit(2); }
  const imp = rel => import(pathToFileURL(join(TREE, rel)).href);
  const E = await imp('research/engine.mjs');
  const M = await imp('src/solver/model.js');
  const F = await imp('src/solver/fast.js');
  const { runPolicy } = await imp('src/solver/solve.js');
  const { withTable } = await imp('src/solver/bridge.js');
  const { tablesOf, digestOf } = await imp('src/solverDigest.js');
  const { solveCandidate, CANDIDATE_HASH } = await imp('research/solver/candidate.mjs');
  const { appPlan } = await imp('research/solver/phase4-panel.mjs');
  const { armA } = await imp('research/solver/select-phase4.mjs');
  const { runPath, solverPlanOf, inputsHash, LAMBDA } = await imp('research/solver/audit-phase4.mjs');
  const { choiceYears } = await imp('research/solver/audit-save.mjs');
  const { settingsOf } = await imp('research/solver/audit-couples-share.mjs');
  const { readSaveV2Panel } = await imp('research/solver/save-v2-panel.mjs');
  const { codeId } = await imp('research/solver/code-id.mjs');
  const V2 = await imp('research/solver/audit-save-v2.mjs');
  const { KEYS, BASE, configOf, armProblems, settingsProblems, ANCHORS_N, CHECK, BESIDE, WARM, PTS, W } = V2;
  const cid = codeId(), treeAudit = V2.stampFilesHash();
  const STAMP = { code: cid ? cid.hash : 'unknown', treeAudit, k: kStamp(), node: process.version, tree: TREE };
  console.log(`stamp: code ${STAMP.code} tree-audit ${STAMP.treeAudit} k ${STAMP.k} node ${STAMP.node}`);
  const stop = (code, msg) => { console.error(`save-k: ${ID}: ${msg}`); process.exit(code); };
  if (!SMOKE && (STAMP.code !== TREE_CODE || treeAudit !== TREE_AUDIT || CANDIDATE_HASH !== '17ff82379838')) stop(3, `the tree is not the read's: code ${STAMP.code} (want ${TREE_CODE}), its audit stamp ${treeAudit} (want ${TREE_AUDIT}), the candidate ${CANDIDATE_HASH}`);
  const U = readSaveV2Panel().find(u => u.id === ID);
  const R = SMOKE ? null : readRegistered(TREE, ID, KEYS);
  const employed = U.plan.demographics.employmentSelf !== 'self-employed';
  if (employed !== (ID !== CONTROL)) stop(3, `employment ${U.plan.demographics.employmentSelf}, not the test's (${ID === CONTROL ? 'the control is self-employed' : 'an employee'})`);
  const seed = SMOKE ? SMOKE_SEED : SEED, pts = SMOKE ? 6 : PTS, N = SMOKE ? Number(process.env.SK_N) || 20 : ANCHORS_N, NI = Math.min(IDENT, N);
  const light = SMOKE ? { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } : {};
  const OUT = join(HERE, 'results', SMOKE ? 'save-k-smoke' : 'save-k-7025');
  mkdirSync(OUT, { recursive: true });
  const t0 = Date.now(), PROC = `${hostname()}:${process.pid}:${t0}`;
  console.log(`TEST K (EXPLORATORY${SMOKE ? ', THE SMOKE: light settings, no identity' : ''}): ${ID} (${groupOf(ID)}, ${U.cohort}, place ${U.place}), salary ${U.plan.demographics.salarySelf}, ${U.plan.config.taxRegion}; seed ${seed}, ${N} paths (the identity on ${ID === CONTROL ? 'all' : `the first ${NI}`}), ${pts} points`);
  // arm A's pick on the plan as entered, as the registered audit took it; the solver plan takes its policy, flipped
  const a = armA(appPlan(U.plan), { tournament: false });
  if (a.label !== U.label) stop(3, `arm A's pick ${a.label} differs from the landing's ${U.label}`);
  const prep = plan => E.resolveMpaa(E.normalizePlan({ ...plan, config: { ...plan.config, guardrails: false, lookaheadYears: 0 } }));
  const plan = prep(solverPlanOf(flip(U.plan), { decumulationPolicy: a.planState.spending.decumulationPolicy }));
  const solveArm = arm => solveCandidate(E, M, plan, { lambda: LAMBDA, points: pts, bequestWeight: W, ...(arm === 'CANDSA' ? { saveSplit: true } : {}), ...light }, BASE[arm]);
  // the paths as the registered audit drew them (on its horizon, each a Float64Array); the smoke's on each arm's own horizon
  const paths = SMOKE ? null : E.pathsForSeed(seed, N, R.T).map(z => Float64Array.from(z));
  let pathsT = null;
  // the salary against the region's higher-rate threshold (the read checks the groups by it): rUK's basic band's top, Scotland's
  // intermediate band's
  const cfg = U.plan.config, higherFrom = cfg.taxRegion === 'scotland' ? cfg.scotIntermediateLimit : cfg.basicBandLimit;
  const out = { id: ID, group: groupOf(ID), employed, salary: U.plan.demographics.salarySelf, region: cfg.taxRegion, higherFrom, cohort: U.cohort, place: U.place, seed, N, ident: ID === CONTROL ? N : NI, pts, W, smoke: SMOKE, stamp: STAMP, arms: {}, checks: {} };
  // the arms: the identity first (an employee), then the split; the control runs the split alone, held to its CANDSA
  for (const [name, arm] of ID === CONTROL ? [['CANDSA-T', 'CANDSA']] : [['CANDDA-T', 'CANDDA'], ['CANDSA-T', 'CANDSA']]) {
    const s0 = Date.now(), r = solveArm(arm), solveSecs = (Date.now() - s0) / 1000;
    const ctx = E.buildContext(withTable(r.m.ctx.plan, r)), T = ctx.totalYears, self = ctx.owners.find(x => x.key === 'self');
    const retireT = Math.max(0, Math.min(T + 1, self.retireAge - ctx.ageSelf0)), workT = choiceYears(ctx), line = settingsOf(r), inputs = inputsHash(ctx);
    const setBack = inputsHash({ ...ctx, owners: ctx.owners.map(o => (o.key === 'self' ? { ...o, selfEmployed: !employed } : o)) });
    // the settings line held to the candidate's on anchors, as the registered audit holds it (not at the smoke's settings)
    const off = [...armProblems(arm, r), ...(SMOKE ? [] : settingsProblems(arm, line))];
    if (!SMOKE) {
      const reg = R.arms[arm];
      if (setBack !== reg.inputs) off.push(`its inputs hash with the flag set back ${setBack}, not the registered ${reg.inputs}: the flip moves more than the flag`);
      if (!employed && inputs !== reg.inputs) off.push(`the control's inputs hash ${inputs} is not its registered ${reg.inputs}`);
      for (const k of ['T', 'retireT']) if ({ T, retireT }[k] !== reg[k]) off.push(`its ${k} ${({ T, retireT })[k]}, not the registered ${reg[k]}`);
      if (js(workT) !== js(reg.workT)) off.push('its working years with a save to choose are not the registered arm\'s');
      if (configOf(arm) !== reg.config) off.push(`its configuration ${configOf(arm)}, not the registered ${reg.config}`);
    }
    if (off.length) stop(3, `${name}: ${off.join('; ')}`);
    if (pathsT === null) { pathsT = T; if (!SMOKE && T !== R.T) stop(3, `the horizon ${T}, not the registered ${R.T}`); }
    const zs = SMOKE ? E.pathsForSeed(seed, N, T).map(z => Float64Array.from(z)) : paths;
    const before = await digestOf(tablesOf(r)), n = name === 'CANDDA-T' ? NI : N, Y = T + 1;
    const tiers = F.tiersFor(r.m), tierNames = { pen: tiers.pen.map(x => x.name), isa: tiers.isa.map(x => x.name) };
    console.log(`${''.padEnd(8)} solved ${name}: ${Math.round(solveSecs)} s; ${r.actions.length} moves; saveSplit ${r.meta.saveSplit || 'off'}; menu ${r.meta.coarse ? (r.meta.coarse.off ? `whole (${r.meta.coarse.off})` : 'anchors') : 'whole'}; working years to choose ${workT.length ? `${workT[0]}-${workT[workT.length - 1]}` : 'none'}`);
    // the identity before any path (the digest and the settings line), for CANDDA-T and the control's CANDSA-T
    const held = !SMOKE && (name === 'CANDDA-T' || ID === CONTROL);
    if (held) {
      const reg = R.arms[arm], P = [];
      if (before !== reg.digest) P.push(`its table digest ${before.slice(0, 16)}, not the registered ${arm}'s ${reg.digest.slice(0, 16)}`);
      if (line !== reg.settings) P.push(`its settings line is not the registered ${arm}'s`);
      if (P.length) { out.checks[name] = { digest: before === reg.digest, settings: line === reg.settings }; stop(4, `STOP (the identity): ${name}: ${P.join('; ')}`); }
    }
    for (let k = 0; k < Math.min(WARM, n); k++) runPath(ctx, zs[k], false);
    const A = Object.fromEntries(Object.entries(KEYS).map(([k, Ty]) => [k, new Ty(n)])), L = new Uint8Array(n * Y), c0 = process.cpuUsage(), w0 = performance.now();
    for (let k = 0; k < n; k++) {
      const q = runPath(ctx, zs[k], true);
      L.set(q.level, k * Y);
      A.survived[k] = q.survived ? 1 : 0; A.failYear[k] = q.failYear; A.pot[k] = q.wealth; A.estate[k] = q.estate; A.tax[k] = q.tax; A.delivered[k] = q.delivered; A.unmet[k] = q.unmet;
    }
    const cu = process.cpuUsage(c0), wallMs = performance.now() - w0;
    let bad = 0;
    for (let k = 0; k < Math.min(CHECK, n); k++) { const q = E.runTrial(ctx, zs[k]); if (q.survived !== !!A.survived[k] || q.terminalPotNet !== A.estate[k] || q.unmetTotal !== A.unmet[k] || q.lifetimeTax !== A.tax[k]) bad++; }
    if (bad) stop(3, `${name}: runPath differs from E.runTrial on ${bad} of the first ${Math.min(CHECK, n)} paths`);
    if (held) {
      const D = differs(A, R.arms[arm], n, KEYS);
      out.checks[name] = { digest: true, settings: true, paths: n, differ: D };
      console.log(`${''.padEnd(8)} the identity: ${name} against the registered ${arm}: the table digest and the settings line the same; on ${n} paths, differing ${Object.entries(D).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      if (anyDiffer(D)) stop(4, `STOP (the identity): ${name} differs from the registered ${arm} on its first ${n} paths (${js(D)})`);
    }
    // runPolicy beside the engine on the split's first BESIDE paths: the save and the tier pair at each working year, the pots
    // at the top of the first retired year, and the paths the two part on in survival (as the registered audit records them)
    let beside = null;
    if (name === 'CANDSA-T') {
      const NB = Math.min(n, BESIDE), nw = workT.length, save = new Uint8Array(NB * nw), tierPen = new Uint8Array(NB * nw), tierIsa = new Uint8Array(NB * nw);
      const pots = { pen: new Float64Array(NB), isa: new Float64Array(NB), gia: new Float64Array(NB) }, pb = new Uint8Array(NB), b0 = Date.now();
      let engineOnly = 0, policyOnly = 0;
      for (let k = 0; k < NB; k++) {
        const q = runPolicy(r, zs[k], { visit: (t, s, h, ai) => {
          const d = workT.indexOf(t), act = r.actions[ai];
          if (d >= 0) { save[k * nw + d] = act.save || 0; tierPen[k * nw + d] = act.tierPen || 0; tierIsa[k * nw + d] = act.tierIsa || 0; }
          if (t === retireT) { pots.pen[k] = s[0]; pots.isa[k] = s[1]; pots.gia[k] = s[2]; }
        } });
        pb[k] = q.survived ? 1 : 0; if (A.survived[k] && !pb[k]) engineOnly++; if (pb[k] && !A.survived[k]) policyOnly++;
      }
      beside = { N: NB, years: nw, survived: b64(pb), engineOnly, policyOnly, save: b64(save), tierPen: b64(tierPen), tierIsa: b64(tierIsa), pots: Object.fromEntries(Object.entries(pots).map(([k, v]) => [k, b64(v)])), secs: (Date.now() - b0) / 1000 };
    }
    const after = await digestOf(tablesOf(r));
    if (after !== before) stop(3, `${name}: the tables changed while the paths ran`);
    out.arms[name] = { arm, config: configOf(arm), n, settings: line, digest: before, inputs, setBack, T, retireT, workT, baseYear: ctx.baseYear, tierNames, saveSplit: r.meta.saveSplit || 'off', actions: r.actions.length,
      solveSecs, cpuUs: cu.user + cu.system, wallMs, cpu: cpus()[0].model, proc: PROC, estateCap: r.estateCap, Y, level: b64(L), beside, ...Object.fromEntries(Object.entries(A).map(([k, v]) => [k, b64(v)])) };
    console.log(`${''.padEnd(8)} done ${name}: config ${configOf(arm)}; ${n} paths; CPU ${((cu.user + cu.system) / 1e3 / n).toFixed(1)} ms a path${beside ? `; runPolicy beside ${beside.N} paths in ${Math.round(beside.secs)} s` : ''}`);
  }
  // the control: every array on every path its registered CANDSA's (checked above with the digest and the settings line)
  out.TIER_ORDER = F.TIER_ORDER;
  const tmp = join(OUT, `${ID}.json.gz.tmp`);
  writeFileSync(tmp, gzipSync(js(out)));
  renameSync(tmp, join(OUT, `${ID}.json.gz`));
  console.log(`${''.padEnd(8)} done unit ${ID} secs ${Math.round((Date.now() - t0) / 1000)}`);
}
