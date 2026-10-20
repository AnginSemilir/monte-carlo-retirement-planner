/*
 * START A PREDICTION FILE (RULES.md: "Before any run: a registered prediction").
 *
 *   node research/solver/new-prediction.mjs <name> [batch-script]      writes research/solver/predictions/<name>.md
 *
 * Fill every section and every "?" in the fair-test table, run check-prediction.mjs on it, commit and PUSH it, then
 * launch: PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh bash <batch-script>
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankTable } from './fair-variables.mjs';

const [name, batch = '<batch script>'] = process.argv.slice(2);
if (!name || !/^[a-z0-9][a-z0-9.-]*$/.test(name)) { console.error('usage: new-prediction.mjs <name: lower-case, digits, dots, dashes> [batch-script]'); process.exit(2); }
const dir = join(dirname(fileURLToPath(import.meta.url)), 'predictions');
mkdirSync(dir, { recursive: true });
const file = join(dir, `${name}.md`);
// the kinds' base rates as the scorecard last printed them (results-scorecard.txt; the maintainer's 'Yes' of 5 Oct): a new
// item's credence starts from its kind's rate, and the derivation's priors say why they move from it
const sc = join(dirname(fileURLToPath(import.meta.url)), 'results-scorecard.txt');
const baseRates = (existsSync(sc) && (/^KIND BASE RATES[^:]*: (.*)$/m.exec(readFileSync(sc, 'utf8')) || [])[1]) || 'NOT FOUND - run node research/solver/scorecard.mjs > research/solver/results-scorecard.txt';
if (existsSync(file)) { console.error(`${file} exists; a registered prediction is changed only under "Changes after seeing results"`); process.exit(1); }
const now = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
writeFileSync(file, `# Prediction: ${name}

- **Run:** \`${batch}\` - result tags ?
- **Kind:** test
- **Written:** ${now} UK, before the run
- **Seeds:** ? (each seed and its use, from the registry in RULES.md section 8 item 9, or "none: <why>")
- **Unmasking:** ? (RULES.md section 9: the known error the tested arm removes, the baseline behaviour that error drives, and the arm or item that tells a harmful change from one that unmasks another error. For each arm, name the arm pair that splits a harm under it and the households it runs on; where no pair exists, write that the harm is NOT SETTLED as that arm's until a named decomposing run reads it; a split test that divides a gain between parts runs the arm with every part changed beside each one-part arm and reads their interaction, since the parts need not add; or "none: <why the thing tested removes no known error>")
- **Plan section:** PLAN.md "?"

## Question

?

## Derivation

What the mathematics and the existing records say, with the scripts that computed any figure. Each line below came from a miss; lessons.md holds each one's case.
POWER: a power model draws every count its reducer reads from that count's own sampling distribution (lost and saved each, not only their churn), as the same statistic the reducer prints with the household's own parameters; its noise or flip parameters are computed by the derive script from named records (power also printed at two larger values), and each check it names is run once on a planted case of its claim, the output quoted here. Its stories go wherever the quantity can (a share or removal past the whole and across the runs; a table or rate kept in range by an assert), nested arms drawn coupled, an arm's own opening move sized from the family's openings. A quantity built from simulated paths, or a code bound, carries its sampling interval (and the bound's side) from the first draft, and the rule reads the interval's ends. A review's decision lines are run through the power model on the same draws as any replacement, both printed, before registration; a rule a review set is read as set, or the departure declared.
CAUSES: a cause map settles a cause 'not' only where the run prints that its arm reached the mechanism, and blames an arm read against a second reference only where that reference is shown clear of the error at the arm's states; otherwise the causes stay open. An item deciding between causes names each cause's outcome and credits a cause only where its outcome is likelier under it than under every rival, on arms whose gap that cause alone can carry; its reducer plants the cause's smallest move (a capped quantity: the cap). A Decision fed gives an arm's change to one part only when the item that splits it reads HELD (RULES.md section 9 rule 1); an over-correction is read for the cause, with its own row; a control reads only the arm whose failure would change the action.
SLICES: a statistic over a table's nodes is read only over the nodes the read weighs at the states the policy visits (the corners its records' reads use), never over every node of the grid. An arm that removes an error is read against the runs in every world, counted or not; a convergence item reads each market world apart from that world's own earlier moves. A share attributed to a subset of path-years (a tier layer, a state band) is read against that subset's share year by year (year-matched), never pooled across years, and a cause on it is held only with a state-matched read where the subset's states differ.
PREFLIGHT: it prints each arm's statistic beside its control's on every household read (an arm equal to its control everywhere is a design fault, not a null) and, for a cause on a ratio of table reads, the ratio's median and tail per cell before the credences are derived.
CARRY: a per-household record carries only to a test differing in the estate weight alone, within its paired band, except a part left out, a year-0 gap moved across the switch line, or a household with 15 or more saved or lost (each its own record); a whole score is re-scored on the record's traces with the policy held (O123); otherwise grade D, interval wide. Uncovered panel households carry from a record chosen by the same rule, never another panel's subset, else widened to the record's spread, grade D in the pre-mortem.
PRIOR: an earlier measurement of the same mechanism sets the stories' starting size, scaled to the new case, before any shading toward a track record.
STAMPS: a test run by more than one audit script registers the split, its reducer calls the fair-test gate on each audit's logs, and the preflight runs that split on its own logs (the reducer's preflight mode skips the gate).
CORNERS: an arm is judged equal to its control at the preflight only where the preflight's corners are alive (p and S above the clamp) at the reads the mechanism uses.
RATES: results-scorecard.txt is regenerated (scorecard.mjs) before a base rate or the lead rate is quoted, and a preflight's reported cells with intervals clear of zero are in the register before registration.
FIXTURES: an audit's household constants (floors, bills, inflow years) are computed from the scenario library by the product's own rule, never typed, and after any edit under src/solver the e3pcls pin is re-taken (node research/tests/solver-e3pcls.test.mjs 4 --pin) before a preflight.
PLANTS: a plant names the states where it changes a value, and the preflight shows its check reads one of them; a plant that can change only a value already at its floor or clamp at every read is inert by construction. A guard added ahead of a plant's own check is passed by the plant on purpose (declared, as HO-DEP's arm plant declares K1F unfixed), so each check is still shown failing on its own fault.
REACH: a screen that chooses households for a reference or reader change keeps only households where the mechanism can act (for the bridge reader, a bridge failure under the control) before it applies a survival band, and the reach step counts the moves the change makes.
PREVIEW: a preflight at a fraction of the points is not read for the direction or size of an effect that depends on the grid's resolution; its bearing is declared as such.
WHOLE: a fix aimed at one slice of a residual (a year, a layer, a cell) reads the whole residual beside the slice (the table less runs and the residual by year), so a residual that moves shows as moved, not removed; its power model draws the residual moving as well as falling (a share of the removed part reappearing elsewhere), so the row that reads a move can be drawn.
DISCORD: a power model's paired discordance in each world scales with the paths that can flip there (4p(1 - p) at the control's survival), never one share fixed across worlds.
CONTROL: a harm item reads each arm against its own control, the arm less the one thing tested; a leg against another arm carries every difference between them and is reported, and a power model draws an arm's paths from its control's saved paths where they exist.
UNMASK-REG: a fix's prediction names every open register row whose gate or status pre-registers an unmasking by that kind of fix (search the register for 'fix will expose', 'before any' and the fix's kind), and its Unmasking field says how each is read.
NESTED: a power model draws a slice and every whole it is part of from one draw, the slice's change carried into each whole path by path and into its table, never a slice and its whole drawn apart.
ORDER: a JUDGED input added or changed after any derivation output was seen is declared in the Derivation with each earlier output's time, credences and rows, the input's weights and their source named, and the derivation prints the credences without it beside the registered ones.
DESIGN-MAP: before the derivation's first output, every line, arm and condition of the adopted design is mapped to the item that reads it, a reported line, or a declared departure whose reason is checked against the design's own numbers (a conditional arm, 'only if', is decided at the preflight and written down).
REALISED: the reducer prints "REALISED item k: <value>" for each item's point in the derivation's own definition, so the scorecard scores every registered 80% interval.
KNOWN-LEG: before a row settles a cause on an item, the derivation prints whether the records already show the arm reaching the mechanism; where they do, a failure reads the interaction, not the cause's 'not', and a HELD credits the cause only with the whole it is part of in band; the Decision fed reads each item by the rows. It applies to every item whose arm the records show reaching its mechanism, not the first alone: the split between the cause's 'not' and the interaction is a registered line the reducer prints with the item's interval, and each HELD names its whole or why none can be in band.
NETS: a removal or share is read on a part that carries one error's sign (an increment, a band, a year's read error), never on a net of errors of opposite sign, on which a partial removal of both can read kept; the net is printed beside, and a review's line on a net is run through the power model before registration.

## Prediction

?

## Falsified if

?

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison). Rows that are SAME may be deleted: then keep the line "- **All other rows: SAME**" below the
table (every other status is written out, with its reason).

${blankTable()}

## Credence

Write the judged lines first and commit them, then run the derivation script, whose section computes each outcome's probability from stated priors over the Power section's stories through the decision bands (check-prediction.mjs refuses judged lines committed with or after its output). Each item starts from its kind's base rate (results-scorecard.txt, KIND BASE RATES, as of this file's writing: ${baseRates}); the priors state why they move from it, and an item resting on a deep review's ranked cause or story starts from that record's rate, not the review's own probability. Run scorecard.mjs on the prediction before registration: an item read but not scored is listed in its TESTS entry's unscored list and stays off the OUTCOME line.

- **Base rate, item 1:** ? (its kind's rate above, the starting credence for HELD)
- **Item 1:** HELD ?, INCONCLUSIVE ?, FALSIFIED ? (derived: the derivation script's section)
- **Judged, item 1:** HELD ?, INCONCLUSIVE ?, FALSIFIED ? (the author's judgement, written before the derivation)
- **Kinds:** 1 ? (NOHARM, EFFECT, ATTRIB, SIZE or CTRL)

## Changes after seeing results

None.
`);
console.log(`wrote ${file}`);
