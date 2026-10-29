/*
 * THE CURVE'S PRICES BY GAMMA (EXPLORATORY; SPENDING-CURVE.md section 8): what a year at the floor and a year of ruin cost on
 * the CRRA curve u(l) = (l^(1 - gamma) - 1) / (1 - gamma) at each gamma tested, in the curve's own units and as years at the
 * floor; ruin at 10% of target (the least the objective allows, before the State Pension on S090) and at 22% (S090 from it,
 * results-kink-check.txt); and each arm's switch charge, the candidate's 0.001 times the exchange u(1) - u(0.8) / (lambda x 0.04).
 *   node gamma-prices.mjs
 */
const LAMBDA = 0.0223606797749979;
const u = (l, g) => (Math.abs(g - 1) < 1e-12 ? Math.log(l) : (Math.pow(l, 1 - g) - 1) / (1 - g));
for (const g of [2, 3, 5]) {
  const fl = u(1, g) - u(0.8, g), r10 = u(1, g) - u(0.1, g), r22 = u(1, g) - u(0.22, g), c90 = u(1, g) - u(0.9, g), r110 = u(1, g) - u(1.1, g);
  console.log(`gamma ${g}: a year at the floor ${fl.toFixed(4)}; at 90% ${c90.toFixed(4)} (${(100 * c90 / fl).toFixed(0)}% of a floor year); at 110% ${r110.toFixed(4)}; ruin at 10% ${r10.toFixed(1)} a year (${(r10 / fl).toFixed(0)} floor years), at 22% ${r22.toFixed(2)} (${(r22 / fl).toFixed(0)}); switch charge ${(0.001 * fl / (LAMBDA * 0.04)).toFixed(6)}`);
}
console.log(`the candidate: a year at the floor ${(LAMBDA * 0.04).toFixed(6)} (0.089 points); at 90% ${(LAMBDA * 0.01).toFixed(6)} (25% of a floor year); ruin a floor year a year`);
