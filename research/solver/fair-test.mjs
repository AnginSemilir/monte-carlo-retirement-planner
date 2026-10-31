/*
 * THE FAIR-TEST CHECK, by hand (RULES.md "Every test is a fair test"). The logic lives in fair-gate.mjs, which the
 * reducers also call before printing any figure.
 *
 *   node research/solver/fair-test.mjs <tagA>[:arm] <tagB>[:arm] [--tested=n,n] [--all]
 *   FAIR_ACCEPT="28=why" node research/solver/fair-test.mjs ...      accept a named difference, with its reason
 *
 * Prints what differs first (the signal); --all prints every variable. Exit code 1 when the test is not fair.
 * Examples:
 *   node research/solver/fair-test.mjs k5-c0.001-x2 flex-tiers:gkFloor     K5 as first planned (fails on 7, 10, 11)
 *   node research/solver/fair-test.mjs k5-c0.001-x2 k5t-fold-cap:gkFloor   K5 as corrected
 *   node research/solver/fair-test.mjs s2-fnewex m17-floor --tested=21,22  the M17 floor fix
 */
import { compareTags, formatReport, parseAccept } from './fair-gate.mjs';
const args = process.argv.slice(2);
const opt = name => { const a = args.find(x => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3).split(',').map(s => s.trim()).filter(Boolean) : []; };
const [a, b] = args.filter(x => !x.startsWith('--'));
if (!a || !b) { console.error('usage: fair-test.mjs <tagA>[:arm] <tagB>[:arm] [--tested=n,n] [--all]'); process.exit(2); }
try {
  const res = compareTags(a, b, { tested: opt('tested'), accept: parseAccept() });
  console.log(formatReport(res, { all: args.includes('--all') }));
  process.exit(res.bad ? 1 : 0);
} catch (e) { console.error(e.message); process.exit(2); }
