/*
 * THE FAIR-TEST VARIABLES: the single list (RULES.md "Every test is a fair test"). Every prediction file carries a
 * row for each of these, marked SAME, TESTED or ONE ARM ONLY; fair-gate.mjs checks the ones a result file records;
 * RULES.md's table is generated from here (check-plan.mjs fails if it drifts).
 *
 *   node research/solver/fair-variables.mjs --markdown     the table for RULES.md
 */
import { fileURLToPath } from 'node:url';

export const GROUPS = {
  A: 'Who and what is tested',
  B: 'The market',
  C: "The user's rules - equal on every arm, always",
  D: "The solver's own settings - equal between solver arms unless tested",
  E: 'The rival arms',
  F: 'The code',
  G: 'The measurement'
};

export const VARIABLES = [
  { n: 1, g: 'A', name: 'The households, and how they were chosen (by a rule that never looks at the solver; tuning set, never the held-out panel)', where: 'band file, `ONLY`', example: "Phase 2's first draft picked households where the solver had already won" },
  { n: 2, g: 'A', name: "Changes the test makes to a household's inputs", where: '`PLANTIER`, `GIAGAIN`, `audit-s126.mjs` variants, added costs', example: '' },
  { n: 3, g: 'A', name: 'The target spend and the spending floor, and whether each arm honours the floor', where: '`target`, `FLOOR`, `floorSpend`; `gk` against `gkFloor`', example: "K5's first draft used the guardrails WITHOUT the floor" },
  { n: 4, g: 'A', name: 'The survival asked for, when a run lands', where: '`CONF` (a number, `+n` or `gkFloor`)', example: '`CONF=gkFloor` takes the ask from a rival arm; SOLVERONLY refuses it' },
  { n: 5, g: 'A', name: 'The held-out paths: seed and count, and the SAME paths for every arm (paired)', where: '`seedHeld`, `held`', example: '' },
  { n: 6, g: 'A', name: "The search paths (landings, and the rival arms' choice of order), and that nothing chosen on them is reported from them", where: '`seedSearch`, `SEARCH`, `VERIFY`', example: 'the floor landing searched on 7001 and promised on 7002, as the app\'s spend finder had before it' },
  { n: 7, g: 'B', name: 'The market world: single-table fold (`MIX=0`), three-world mixture (`MIX=3`), five-world (`MIX=5`) - for the table AND for how every arm is simulated', where: '`mixture`', example: "K5's target (mixture) against the cells (fold), 24 Sep" },
  { n: 8, g: 'B', name: "How each year's return is averaged (quadrature points)", where: '`QUAD`, `quadNodes` (5); the final year: `FINALINT`, `finalIntegral` (off: 5 nodes)', example: '' },
  { n: 9, g: 'B', name: "The engine's return, volatility and charge assumptions, and the engine build", where: '`research/engine.mjs` (rebuilt from `App.jsx`); `code.hash`', example: '' },
  { n: 10, g: 'C', name: 'The minimum pot', where: '`MINPOTYEARS` (absent: the plan\'s own)', example: "K5's target: the one-year pot moved the guardrails' cutting on 4 of 12" },
  { n: 11, g: 'C', name: 'The raise cap', where: '`RAISECAP` (solver), `GUARDCAP` (guardrails)', example: "K5's target predated M23" },
  { n: 12, g: 'C', name: 'The estate preference', where: '`WB`, `BEQSHAPE`, the estate cap, `ESTATESCALE`', example: 'Phase 2: a bequest weight given to one arm only' },
  { n: 13, g: 'C', name: 'The risk tier chosen, consent to change it, risk above', where: '`PLANTIER`, `TIERS`, `TIERSABOVE`', example: 'M14 on the library tests only the top tier (M21)' },
  { n: 14, g: 'C', name: 'The one-off cost lookahead', where: '`lookaheadYears` (0 on every rival arm)', example: '' },
  { n: 15, g: 'C', name: 'The tax-free lump sum rule', where: '`lump`, `PCLSSTRICT`', example: '' },
  { n: 16, g: 'C', name: "The taxable account's tier", where: '`GIATIERS`', example: '' },
  { n: 17, g: 'D', name: 'The grid: points, shares, gain buckets', where: '`POINTS`, `coords`, `SHARES`, `GAINB`, `GAININT`', example: '' },
  { n: 18, g: 'D', name: 'The spending menu and the tier menu', where: '`LEVELS`, `TIERS`', example: "research runs overrode the code's own menu (which has 0.95)" },
  { n: 19, g: 'D', name: 'The switch margin and switching cost', where: '`MARGIN`, `SWITCH`', example: "R1: the margin decided M15 v1's result" },
  { n: 20, g: 'D', name: "The dislike of cuts: lambda (held or landed) and the trim curve's exponent (together, c)", where: '`LAMBDA`, `EXP`; `solver.lambda`, `solver.landed`', example: '' },
  { n: 21, g: 'D', name: 'The raise credit, and whether it is weighted by survival', where: '`RAISE` (mu), `RAISESURV`', example: 'mu was calibrated in 2d.4 with resilience on and the old objective' },
  { n: 22, g: 'D', name: 'The price of a year with no money', where: '`FAILSHORT`', example: "M14's evidence predates it (M14b)" },
  { n: 23, g: 'D', name: 'Resilience and drift', where: '`WR`, `RESIL`, `DRIFT`', example: '' },
  { n: 24, g: 'D', name: 'The read and edge handling: final year exact, dead corners, the bridge read (F1), block trim', where: '`FINALEXACT`, `SHAREDEAD`, `BRIDGEREAD`, `BLOCKTRIM`', example: '' },
  { n: 25, g: 'D', name: 'How it lands: bisection steps, level search', where: '`BISECT`, `TERNARY`', example: 'M6: five steps where eight were derived' },
  { n: 26, g: 'E', name: "Which rivals, and each one's rule and parameters (the guardrails' thresholds, Vanguard's bands, ARVA's rate)", where: '`ARMS`; engine config', example: '' },
  { n: 27, g: 'E', name: "How a fixed arm's withdrawal order is picked (the app's picker on the search paths)", where: '`pickFixed`; `label`', example: '' },
  { n: 28, g: 'F', name: 'Every file of a comparison made by the same code, or the change between them is the thing tested', where: '`code.hash`, `code.commit`; `solverVersion` is hand-set and was not bumped through the M17 fix or F1', example: 'the flex-mix pilot split across solver versions (21 Sep), hence `run-from-snapshot.sh`' },
  { n: 29, g: 'G', name: 'The statistic and its definition (survival is the floor rate or fully funded; years below target; total cut; failure includes falling below the minimum pot; the table\'s reading or the simulated outcome)', where: 'the reducer', example: '`audit-s126.mjs` subtracted the years above target twice; the V2 prediction read a simulated match as a table match' },
  { n: 30, g: 'G', name: 'The reducer and its version', where: 'script name, commit', example: '' },
  { n: 31, g: 'G', name: 'Paired or not, and the standard error used', where: 'the reducer', example: '' },
  { n: 32, g: 'G', name: "The table's number is never the result: survival is simulated", where: 'the reducer', example: "M16: the table reads 3-5 points optimistic" },
  { n: 33, g: 'G', name: 'For timings: what else the machine was running', where: '`uptime` in the log', example: "K5's 385 s median inflated by contention; the `solver-fast` speed check flaky under load" }
];

export const STATUSES = ['SAME', 'TESTED', 'ONE ARM ONLY', 'N/A'];

export function markdownTable() {
  const out = ['| # | Variable | Where | A time it went wrong |', '|---|---|---|---|'];
  for (const g of Object.keys(GROUPS)) {
    out.push(`| **${g}** | **${GROUPS[g]}** | | |`);
    for (const v of VARIABLES.filter(x => x.g === g)) out.push(`| ${v.n} | ${v.name} | ${v.where} | ${v.example || '-'} |`);
  }
  return out.join('\n');
}

/* the blank fair-test table a new prediction file starts from */
export function blankTable() {
  const out = ['| # | Variable | Arm A | Arm B | Status (SAME / TESTED / ONE ARM ONLY / N/A) and why |', '|---|---|---|---|---|'];
  for (const v of VARIABLES) out.push(`| ${v.n} | ${v.name.replace(/\|/g, '/')} | ? | ? | ? |`);
  return out.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--markdown') console.log(markdownTable());
  else if (process.argv[2] === '--blank') console.log(blankTable());
  else console.log(VARIABLES.map(v => `${v.n}. [${v.g}] ${v.name}`).join('\n'));
}
