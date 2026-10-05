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
 * A research script first committed from E3_FROM on spreads RESEARCH_OPTS into its options, or carries a line
 * "// e3 off: <why>" (coverage refuses e3, 11 or 12 share points where E3's identity is unchecked, a run that must match
 * older records); research/tests/e3-default.test.mjs fails on one that does neither.
 */
export const RESEARCH_OPTS = Object.freeze({ e3: true });
export const E3_FROM = '2026-10-05T01:30:00+01:00';
