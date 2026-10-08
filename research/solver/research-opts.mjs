/*
 * THE RESEARCH DEFAULTS: the options a research script passes to solve or solvePlan unless its registration says why not.
 * The product's defaults are solve.js's (PRODUCT_BASELINE, PRODUCT_DEFAULTS) and PLAN.md's decided-defaults block; these
 * are the research runs' only, decided by a registered check, and never reach solvePlan's defaults.
 *
 *   e3: true - E3, the empty-pot copy (solve.js `e3`): a cell whose pot is empty takes its zero-gain twin's values instead
 *       of being solved. E3c (predictions/measure-e3c.md; results-e3c.txt: EXACT) held every table bit for bit the same
 *       with it on and off on the 25 panel households in SHIP, PRODUCT and TSJ at the default 6 share points, a planted
 *       wrong copy caught; about 18% off the solve. By the 30 Sep 09:49 mechanism (PLAN.md, the E3 paragraph) it is a
 *       research default only: PRODUCT_BASELINE carries e3: false, pinned with this file by research/tests/e3-default.test.mjs.
 *
 * E3c's scope: SHIP, PRODUCT and TSJ at 6 share points, without pclsInterp and on code from before readerTax. Outside it -
 * the interpolated allowance axis (PCLSI, the unit PMAP, 7an and COV-B-STEP use), readerTax, Q's fix (bridgeStep 'exact'),
 * the switch charge (switchCharge, margin 0) - the research candidate's (candidate.mjs) - 11 or 12 share points - the
 * identity was NOT CHECKED by a run; the deep review of 5 Oct 01:49 UK argues it holds by construction (the copied cells
 * have an exactly empty taxable pot, and the flow rebuilds the gain basis from the pot; grade B, from the code). Under the
 * research candidate (readerTax off) E3-CAND has since checked it: every table bit for bit the same with e3 on and off at
 * 30 points on share 0.95 and S130 (PLAN.md's 6 Oct 23:49 row, results-e3cand.txt; grade A on those two, B elsewhere);
 * readerTax and 11 or 12 share points remain unchecked.
 *   pclsInterp: true - the interpolated allowance axis (PCLSI), the fix of O71's snap: the maintainer, 6 Oct ('yes make the
 *       fix the default' for the research candidate, not the app; the 4 Oct step-read condition replaced, 'Yes, replace it').
 *       ADOPT-PI (results-adoptpi.txt): no material harm to survival on 25 households, the gain on S130 and S370 - with the
 *       reader off only; with the reader on (the candidate, candidate.mjs) untested (O76). Its named caveats: O76, and PR5 (a
 *       pension death tax of 0 on the library households, under which PCLSI's lucky-tail net falls: O97, DT-O97). With e3,
 *       outside E3c's checked scope but checked by E3-CAND on share 0.95 and S130 (above). PRODUCT_BASELINE does not carry it: the app stays on
 *       the snapped axis until after Phase 4. Pinned with PLAN.md's "pclsInterpResearch" by research/tests/candidate.test.mjs.
 *       An arm that needs the snap sets pclsInterp: false AFTER spreading RESEARCH_OPTS; a pclsStrict arm must too (grid.js
 *       refuses the two together).
 *
 *   e3pcls: true - E3's lump-sum half (solve.js `e3pcls`): a cell whose pension is empty, in a year after the last one
 *       money can enter a pension, takes its zero allowance bucket's values. E3-PCLS-C (predictions/measure-e3pclsc.md;
 *       results-e3pclsc.txt: EXACT) held every table, the reader's counters and 2,000 forward paths bit for bit the same
 *       on and off under the research candidate at 30 points on nine households (four clause types), every plant caught,
 *       about 12% fewer moves evaluated. A research default by the maintainer's decision of 7 Oct ('yes, go ahead'), with
 *       a guard, the identity test run on every solver change: its exactness rests on the lists of pension inflows
 *       and allowance reads staying complete, so solveCandidate and solveSplit refuse it while e3pcls-pin.mjs's pin (a
 *       hash of the whole of src/solver and the candidate's research files) is stale, re-pinned only by
 *       research/tests/solver-e3pcls.test.mjs --pin passing. PRODUCT_BASELINE does not carry it. Both pinned with PLAN.md's
 *       "e3pclsResearch" and "e3pcls" by research/tests/e3pcls-guard.test.mjs. It refuses the coverage axis (solve.js), so a coverage
 *       arm sets e3pcls: false after spreading RESEARCH_OPTS.
 *
 * A research script first committed from E3_FROM on spreads RESEARCH_OPTS into its options, or carries a line
 * "// e3 off: <why>" (coverage refuses e3; a unit outside E3c's scope above; a run that must match older records);
 * research/tests/e3-default.test.mjs fails on one that does neither.
 */
export const RESEARCH_OPTS = Object.freeze({ e3: true, pclsInterp: true, e3pcls: true });
export const E3_FROM = '2026-10-05T01:30:00+01:00';
