/*
 * 7U-F'S PANEL, ARMS AND UNITS, ONE SOURCE for audit-7uf.mjs and reduce-7uf.mjs (registrations/fresh-7uf.md; the external
 * review of 21 Oct, Part B Step 4.3; STATE.md D3, D5, D7). Every household named before seed 7014 is read, each by a rule
 * that reads no result on 7014:
 *   - 7u's unsettled households (results-7u.txt item 1): S224 and S380, and S364, reported (it survives under half a percent
 *     under either arm in 7u, so D3's band leaves it ungated);
 *   - the deposit households whose bridge is at risk: HO-DEP's screen (results-hodep-screen.txt: the deposit-mid households
 *     with world-0 survival between 20% and 80% under the order reference, seed 7004), S370, S382, S394, S406 and S418; and
 *     the two the adaptive reference's own tests ran on, S362 (O179, O191) and S366 (O195, unread at the frozen candidate);
 *   - a broad slice: every third household of 7u's broad 30 in its order, from the first (results-7u-broad.txt's BROAD line,
 *     chosen by a rule that never looks at the solver; panel-7u.mjs holds it to its hash): S002 S018 S044 S078 S144 S176
 *     S214 S248 S284, and S380, already named.
 * The arms (STATE.md D5; Part B Step 4.3):
 *   SHIP   the shipping default: solvePlan with the product's settings on the candidate's plan (O60's blend-median tiers),
 *          as 7u ran it, on the code with Step 1's fixes (both arms carry them);
 *   CAND   the assembled candidate (candidate.json: the frozen candidate with the adaptive package);
 *   DECOMP the assembled candidate on the plan reference (readerRef and adaptiveLattice removed, everything else, the RS
 *          split included, as CAND): CAND less DECOMP is the reference's part, read by the mixture. Run only on households
 *          with bridge years: without one the reader reads no year, so DECOMP is CAND (the preflight checks it on one).
 * Both estate weights, 0.02 and 0.01 (7u's). Seed 7014, used once; 16,000 paths; 30 points; lambda as 7u.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BROAD, gainOf } from './panel-7u.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const UNSETTLED = ['S224', 'S380', 'S364'];
export const REPORTED = ['S364'];
/* HO-DEP's screen: the deposit-mid households in its band, read from its results file (a missing line is an error) */
export function depositAtRisk(text = readFileSync(join(HERE, 'results-hodep-screen.txt'), 'utf8')) {
  const rows = [...text.matchAll(/^ {2}(S\d+): world-0 survival under the order reference (\d+\.\d+) on 400 paths( \(outside the band\))?$/gm)];
  if (rows.length !== 13) throw new Error(`results-hodep-screen.txt: ${rows.length} screen rows, not 13`);
  return rows.filter(m => !m[3]).map(m => m[1]);
}
export const DEPOSIT = [...depositAtRisk(), 'S362', 'S366'];
export const BROAD_SLICE = BROAD.filter((_, i) => i % 3 === 0);
export const PANEL = [...new Set([...UNSETTLED, ...DEPOSIT, ...BROAD_SLICE])];
export const WEIGHTS = ['0.02', '0.01'];
export const ARMS = ['CAND', 'DECOMP', 'SHIP'];
export const SEED = 7014, PRE_SEED = 7002, N = 16000, PTS = 30, LAMBDA = 0.0223606797749979;
/* runPolicy beside the engine on the first BESIDE paths (the fidelity check); the by-world item on NW paths a world */
export const BESIDE = 4000, NW = 2000;
/* the floor of the pooled primary (D3: 7u's item 4): the panel less 7u's gain set at the weight, named from 7u's records */
export const floorOf = w => { const g = new Set(gainOf(w)); return PANEL.filter(id => !g.has(id)); };
/* the households with bridge years (the pension out of reach at the start), from the plan alone */
export const bridgeYears = (E, plan) => { const ctx = E.buildContext(E.normalizePlan(plan)); return Math.max(0, ctx.nmpa - ctx.ageSelf0); };
/* the units, the candidate arms first (the longest); DECOMP only where `hasBridge(id)` */
export const unitsOf = hasBridge => ARMS.flatMap(arm => WEIGHTS.flatMap(w => PANEL.filter(id => arm !== 'DECOMP' || hasBridge(id)).map(id => [id, arm, w])));
