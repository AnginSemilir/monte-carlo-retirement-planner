/*
 * START A PREDICTION FILE (RULES.md: "Before any run: a registered prediction").
 *
 *   node research/solver/new-prediction.mjs <name> [batch-script]      writes research/solver/predictions/<name>.md
 *
 * Fill every section and every "?" in the fair-test table, run check-prediction.mjs on it, commit and PUSH it, then
 * launch: PREDICTION=research/solver/predictions/<name>.md research/solver/run-from-snapshot.sh bash <batch-script>
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { blankTable } from './fair-variables.mjs';

const [name, batch = '<batch script>'] = process.argv.slice(2);
if (!name || !/^[a-z0-9][a-z0-9.-]*$/.test(name)) { console.error('usage: new-prediction.mjs <name: lower-case, digits, dots, dashes> [batch-script]'); process.exit(2); }
const dir = join(dirname(fileURLToPath(import.meta.url)), 'predictions');
mkdirSync(dir, { recursive: true });
const file = join(dir, `${name}.md`);
if (existsSync(file)) { console.error(`${file} exists; a registered prediction is changed only under "Changes after seeing results"`); process.exit(1); }
const now = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
writeFileSync(file, `# Prediction: ${name}

- **Run:** \`${batch}\` - result tags ?
- **Kind:** test
- **Written:** ${now} UK, before the run
- **Seeds:** ? (each seed and its use, from the registry in RULES.md section 8 item 9, or "none: <why>")
- **Unmasking:** ? (RULES.md section 9: the known error the tested arm removes, the baseline behaviour that error drives, and the arm or item that tells a harmful change from one that unmasks another error; or "none: <why the thing tested removes no known error>")
- **Plan section:** PLAN.md "?"

## Question

?

## Derivation

What the mathematics and the existing records say, with the scripts that computed any figure.

## Prediction

?

## Falsified if

?

## Fair-test table

Arm A and arm B as the batch script sets them. SAME, TESTED (the one thing that differs), ONE ARM ONLY (a setting
only one arm has - say why that is fair), N/A (does not apply here - say why) or ACCEPTED (differs, and why that
does not bias the comparison).

${blankTable()}

## Changes after seeing results

None.
`);
console.log(`wrote ${file}`);
