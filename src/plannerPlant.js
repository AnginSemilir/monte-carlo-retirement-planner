/*
 * THE NEW PLANNER'S PLANTED FAULTS (step U; research/ui-harnesses/solver-planner-ui.cjs and its plants, LAYOUT.md section
 * 11.1). Empty in every build but a harness's preview built with PLANNER_PLANT set (vite.config.js solver-preview), so the
 * site's own build carries none: each `PLANNER_PLANT.has(...)` folds to false. A comma-separated list, each plant breaking one
 * check of the harness.
 */
const LIST = '';
export const PLANNER_PLANT = { has: name => LIST.split(',').includes(name) };
