/*
 * THE FINAL YEAR'S SURVIVAL IS A STAIRCASE (a lead from the outside review of blurred-lines-brief.md, 24 Sep 19:31 UK).
 * The solver scores the last year as sum_q w_q * [grown wealth at node q >= the minimum pot] (src/solver/solve.js, the
 * `t === T` branch: `s += QW[zi] * (alive ? 1 : 0)`) - each node exact, their weighted sum a staircase. This compares
 * that 5-node sum with the exact normal probability for one pot at one tier, in the three worlds the solver uses, at a
 * range of pots (as a multiple of the minimum pot K, after the year's spending). The tiers are the solver's own
 * (the preset the library tests ran: engine.mjs's CMA preset, as real returns, with its sigmaParam as the persistent
 * shift; blurred-lines-brief.md's table). The growth is the solver's:
 * exp(ln(1+R) + V z + S zeta), no -V^2/2. One pot, one tier, no tax: it isolates the integration rule, nothing else.
 * Planted: at a pot where every node survives, both methods must be within 0.1 of 100; one node's step must be 53.3.
 *
 *   node research/solver/final-year-staircase.mjs > research/solver/results-final-year-staircase.txt
 */
const TIERS = [['Low', 0.0260, 0.0519, 0.0097], ['Medium/Low', 0.0314, 0.0689, 0.0103], ['Medium', 0.0369, 0.0993, 0.0131],
  ['Medium/High', 0.0424, 0.1342, 0.0169], ['High', 0.0479, 0.171, 0.0214]];
const ZQ = [-2.856970, -1.355626, 0, 1.355626, 2.856970], WQ = [0.011257, 0.222076, 0.533333, 0.222076, 0.011257];
const WORLDS = [-Math.sqrt(3), 0, Math.sqrt(3)], PW = [1 / 6, 2 / 3, 1 / 6];
const erf = x => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
const Phi = x => 0.5 * (1 + erf(x / Math.SQRT2));
const exact = (c, [, R, V, S]) => WORLDS.reduce((a, z, j) => a + PW[j] * Phi((Math.log(c) + Math.log1p(R) + S * z) / V), 0);
const gh5 = (c, [, R, V, S]) => WORLDS.reduce((a, z, j) => a + PW[j] * ZQ.reduce((b, zq, q) => b + (Math.log(c) + Math.log1p(R) + S * z + V * zq >= 0 ? WQ[q] : 0), 0), 0);

console.log('# The final year: survival by the solver\'s 5-node rule against the exact normal probability (three worlds, one pot)');
const C = [1.00, 1.05, 1.10, 1.15, 1.20, 1.22, 1.25, 1.30, 1.35, 1.40, 1.50, 1.60];
console.log('pot/K  ' + TIERS.map(t => `${t[0].padStart(11)} exact/GH5  `).join(''));
for (const c of C) console.log(c.toFixed(2).padEnd(7) + TIERS.map(t => `${(100 * exact(c, t)).toFixed(2).padStart(7)} / ${(100 * gh5(c, t)).toFixed(2).padStart(6)}   `).join(''));
console.log('\nOne tier up, Medium -> Medium/High: the survival it costs, exact against the 5-node rule');
for (const c of C) {
  const dx = 100 * (exact(c, TIERS[3]) - exact(c, TIERS[2])), dg = 100 * (gh5(c, TIERS[3]) - gh5(c, TIERS[2]));
  console.log(`  pot/K ${c.toFixed(2)}:  exact ${dx >= 0 ? '+' : ''}${dx.toFixed(2)}   5-node ${dg >= 0 ? '+' : ''}${dg.toFixed(2)}${Math.abs(dx - dg) > 1 ? '   <- the rule misprices the step by ' + Math.abs(dx - dg).toFixed(2) : ''}`);
}
const top = 100 * gh5(3, TIERS[2]), topX = 100 * exact(3, TIERS[2]);
const step = 100 * (WQ[2]);
console.log(`\nPLANTED: at pot/K 3 (every node survives) 5-node ${top.toFixed(2)}, exact ${topX.toFixed(2)}: ${Math.abs(top - 100) < 0.1 && Math.abs(topX - 100) < 0.1 ? 'ok' : 'FAILED'}; the middle node's step ${step.toFixed(1)}: ${Math.abs(step - 53.3) < 0.1 ? 'ok' : 'FAILED'}`);
