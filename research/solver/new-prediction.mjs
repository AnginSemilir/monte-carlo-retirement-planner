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

What the mathematics and the existing records say, with the scripts that computed any figure.
Every check this prediction names (a gate, a count, a power model) is run once on a planted case of exactly its claim before registration, and that output is quoted here. A pace or rate is derived with the household's own parameters and as the same statistic the reducer prints (a mean over paths at the same horizon), not a borrowed parameter or an expected point.
A cause test decides only on arms whose gap the named cause alone can carry; its reducer plants the hypothesis's own geometry (the smallest move the cause makes) as a case, and any gate on a forced or capped quantity plants the cap itself.
A noise or flip parameter in the power model is computed by the derive script from the records it names, never typed from a receipt or a review's prose, and the power is printed at two larger values as sensitivity rows.
A cause that turns on a ratio of table reads has that ratio's distribution (its median and its tail, not its mean) previewed per cell at the preflight's grid before the credences are derived; where the bulk sits at 1 the cause cannot act there (NS-COND: S370's cell means of rho above 100 came from 150 near-dead reads, its median 1.0001e+0, results-nscond-rho.txt).
A panel's households that no record covers are carried into the power and the intervals from a record of households chosen by the same rule, never from another panel's subset; where none exists, each interval is widened to the spread across the record's households and the carry is named grade D in the pre-mortem (7u: the broad 30 drawn from the 25's no-gain households put six of eight points outside their 80% intervals, the broad floor +0.360 against the 25's +0.162, results-7u.txt).
An out-of-sample household is an item with its own falsifier, not a report, when the test's deciding household is the one where the mechanism was first found.
A net or estate item names which of the mean, the capped mean or the median it reads, and why the score or the app reads that one; the others are reported beside it (above the bequest cap the score is flat, so an uncapped mean follows the unscored tail: DT-O97).

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

The maintainer's 'Go ahead' of 5 Oct on the deep review of the prediction record (deep-review-log.md 5 Oct 10:16 UK): write
the judged lines first, then run the derivation script, whose section computes each outcome's probability from stated
priors over the Power section's stories (the split, one-flip and band stories included) through the decision bands. No cap
taken from the scorecard. An item that needs every household carries a line per household, its reducer printing
"LEGS: N/<household> <OUTCOME>" beside "OUTCOME: ...".

Start from the base rate of the item's kind (results-scorecard.txt, KIND BASE RATES, as of this file's writing: ${baseRates}).
The derivation's priors begin there and state why they move from it; an item resting on a deep review's ranked cause or
story starts from that record's rate, not the review's own probability.

- **Base rate, item 1:** ? (its kind's rate above, the starting credence for HELD)
- **Item 1:** HELD ?, INCONCLUSIVE ?, FALSIFIED ? (derived: the derivation script's section)
- **Judged, item 1:** HELD ?, INCONCLUSIVE ?, FALSIFIED ? (the author's judgement, written before the derivation)
- **Kinds:** 1 ? (NOHARM, EFFECT, ATTRIB, SIZE or CTRL)

## Changes after seeing results

None.
`);
console.log(`wrote ${file}`);
