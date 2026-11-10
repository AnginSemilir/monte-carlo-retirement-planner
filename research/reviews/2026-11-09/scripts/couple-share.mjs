// EXPLORATORY: the couples' rollout against the plan's own rules on one library couple, as held and with the money re-held unevenly.
//   [GUARD=1] [SHARE=auto|<n>] [POINTS=45] [SEED=n] node couple-share.mjs <couple> <holding> [paths 200]
// holding: as-held | sixtyfive | seventyfive | ninety-ten | ten-ninety | all-one (the first person holds everything) |
//          pension-one (the first holds all the pension, the rest as held) | pen-vs-isa (the first all the pension, the second the rest)
// GUARD=1: the rules arm with guardrails, the 80% floor and the 5-year lookahead, as D4's arm A sets them (not its policy search).
// SHARE: the first person's share of the household's spending that their table is solved on (solveCouple's `share`; unset 0.5);
//        auto = their share of the household's pots, held to 0.05 to 0.95.
// The household's totals in every wrapper are kept; the target is landed so the rules arm survives about 85% on these paths.
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const SEED = Number(process.env.SEED || 4242);   // 4242 gives the outputs in results/; a new run names its own (EXPERIMENTS-AND-PORTS.md)
const E = await import(R + '/research/engine.mjs');
const M = await import(R + '/src/solver/model.js');
const { solveForApp } = await import(R + '/src/solverApp.js'); const { prepareForSolve } = await import(R + '/src/solverSettings.js');
const { solveCouple, withCouple } = await import(R + '/src/solver/couple.js');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const [id, mode, nS] = [process.argv[2], process.argv[3], Number(process.argv[4] || 200)];
const base = E.normalizePlan(buildScenarios().find(s => s.id === id).plan);
const CATS = ['pen', 'isa', 'other', 'cash', 'cashIsa'];
const tot = c => base.accounts.filter(a => a.id.startsWith(c + '_')).reduce((t, a) => t + (Number(a.balance) || 0), 0);
// the household's totals kept in every wrapper; only who holds them changes
const hold = (c) => mode === 'as-held' ? null : mode === 'pension-one' ? (c === 'pen' ? 1 : null) : mode === 'ninety-ten' ? 0.9 : mode === 'seventyfive' ? 0.75 : mode === 'sixtyfive' ? 0.65 : mode === 'all-one' ? 1 : mode === 'ten-ninety' ? 0.1 : mode === 'pen-vs-isa' ? (c === 'pen' ? 1 : 0) : null;
const accounts = base.accounts.map(a => { const c = CATS.find(k => a.id.startsWith(k + '_')), h = c ? hold(c) : null; if (h === null || !c) return a; const t = tot(c); return { ...a, balance: a.id.endsWith('_self') ? t * h : t * (1 - h) }; });
let plan = E.normalizePlan({ ...base, accounts });
const T = E.buildContext(plan).totalYears, paths = E.pathsForSeed(SEED, nS, T);
const GUARD = process.env.GUARD === '1';
const asRules = p => (GUARD ? E.normalizePlan({ ...p, config: { ...p.config, guardrails: true, lookaheadYears: 5 }, spending: { ...p.spending, floorSpend: Math.round(0.8 * Number(p.spending.targetSpend)) } }) : p);
const rulesSurv = (p) => { const ctx = E.buildContext(E.resolveMpaa(asRules(p))); let s = 0; for (const zs of paths) if (E.runTrial(ctx, zs).survived) s++; return 100 * s / nS; };
// land the target so the plan's own rules survive about 85% on these paths (as D4 lands its couples)
let lo = 0.3, hi = 3; const t0 = Number(plan.spending.targetSpend);
for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (rulesSurv(E.normalizePlan({ ...plan, spending: { ...plan.spending, targetSpend: t0 * mid } })) > 85) lo = mid; else hi = mid; }
plan = E.normalizePlan({ ...plan, spending: { ...plan.spending, targetSpend: Math.round(t0 * lo) } });
const own = b => CATS.map(c => `${c} ${Math.round(plan.accounts.filter(a => a.id === `${c}_${b}`).reduce((t, a) => t + (Number(a.balance) || 0), 0) / 1000)}k`).join(' ');
console.log(`${id} ${mode}: first person ${own('self')} | second ${own('part')} | target ${plan.spending.targetSpend}`);
const ctxR = E.buildContext(E.resolveMpaa(asRules(plan)));
const PTS = Number(process.env.POINTS || 4);
const LIGHT = PTS <= 6 ? { points: PTS, research: { adaptiveLattice: { na: 48, nb: 9, nz: 32, foot: true, stepAll: true } } } : { points: PTS };
let t1 = Date.now();
const potsOf = b => plan.accounts.filter(x => x.id.endsWith('_' + b)).reduce((t, x) => t + (Number(x.balance) || 0), 0);
const SHAREV = process.env.SHARE === 'auto' ? Math.min(0.95, Math.max(0.05, potsOf('self') / (potsOf('self') + potsOf('part')))) : process.env.SHARE ? Number(process.env.SHARE) : null;
const cp = solveCouple(E, M, prepareForSolve(E, plan), { ...(SHAREV !== null ? { share: SHAREV } : {}), solveOne: (p, o) => solveForApp(E, M, p, { ...LIGHT, ageWith: o.partnerAge0 }) });
const solveS = (Date.now() - t1) / 1000; t1 = Date.now();
const ctxS = E.buildContext(withCouple(cp.plan, cp));
let a = 0, b = 0, saved = 0, lost = 0, spR = 0, spS = 0;
for (const zs of paths) { const r = E.runTrial(ctxR, zs), s = E.runTrial(ctxS, zs); if (r.survived) a++; if (s.survived) b++; if (s.survived && !r.survived) saved++; if (!s.survived && r.survived) lost++; }
console.log(`${id} ${mode}: the plan's rules${GUARD ? ' with guardrails and the 80% floor' : ''} ${(100 * a / nS).toFixed(1)}% | the couples' rollout (${PTS} points${SHAREV !== null ? ', the first person\'s table on ' + SHAREV.toFixed(2) + ' of the spending' : ''}) ${(100 * b / nS).toFixed(1)}% | ${saved} saved, ${lost} lost of ${nS} | solve ${solveS.toFixed(0)} s, paths ${((Date.now() - t1) / nS).toFixed(0)} ms each`);
