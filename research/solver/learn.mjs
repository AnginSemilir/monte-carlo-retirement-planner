/*
 * 7T'S LEARNING CHOOSER (the first deep review, 26 Sep 17:12 UK: "a forward-only chooser that updates the world weights
 * along each path from its realised returns, run on the existing tables"). The product's chooser (solve.js chooseAction)
 * weighs the mixture's worlds by fixed weights every year (1/6, 2/3, 1/6 for three worlds), so a path deep in a bad world
 * still plans 2/3 on the normal one. This chooser keeps the tables and the rule and changes only the weights: each year
 * they are the posterior over the worlds given the returns the path has realised so far.
 *
 * The model the tables use: in world k the path's long-run shift is the node z_k, so a pot's log return in year t is
 * ln(1 + R_i) + S_i z_k + V_i e_t with e_t standard normal (solve.js realAt, with the move's rates R, S, V). The household
 * sees its returns, so it sees x_t = S_i zPath + V_i e_t for each pot; every pot carries the same zPath and e_t, so one pot
 * holds all the information, and the one with the largest S_i / V_i is used. The log likelihood of world k gains
 * -(x_t - S_i z_k)^2 / (2 V_i^2) a year; the posterior is the prior weights times exp of it, normalised. Year t's move uses
 * the returns of years 0..t-1. A research chooser for runPolicy's `choose` hook; the product is untouched.
 */
import { chooseAction } from '../../src/solver/solve.js';

// the most informative pot of a move in year t: [S, V] of the pot with the largest S/V (V > 0, S > 0), or null
export function signalPot(act, t) {
  let best = null, ratio = 0;
  for (let i = 0; i < 4; i++) {
    const S = act.sigma[i], V = act.volEffAt[t][i];
    if (!(S > 0) || !(V > 0)) continue;
    if (S / V > ratio) { ratio = S / V; best = [S, V, i]; }
  }
  return best;
}
// one year's update of the log likelihoods, given the pot's deviation x = S zPath + V e
export function update(logL, nodes, S, V, x) { for (let k = 0; k < nodes.length; k++) logL[k] -= (x - S * nodes[k]) ** 2 / (2 * V * V); return logL; }
export function posterior(prior, logL) {
  const m = Math.max(...logL.map((l, k) => (prior[k] > 0 ? l : -Infinity)));
  const w = prior.map((p, k) => p * Math.exp(logL[k] - m)), s = w.reduce((a, b) => a + b, 0);
  return w.map(x => x / s);
}

export function learningChooser(r, zs) {
  if (!r.mix) throw new Error('learn: the learning chooser needs a mixture (worlds to learn between)');
  if (r.c.tiers.gia) throw new Error('learn: the taxable account\'s tier is not modelled here');
  const T = r.m.ctx.totalYears, zPath = zs.length > T + 1 ? zs[T + 1] : 0;
  if (zs.length <= T + 1) throw new Error('learn: the path carries no long-run shift (a fold path)');
  const nodes = r.mix.nodes, prior = r.mix.weights.slice(), logL = nodes.map(() => 0);
  const n = { updates: 0, last: prior.slice() };
  let lastAi = null, lastT = -1;
  const choose = (t, s, held) => {
    // year t-1's return is known now: update on the move that was held through it
    if (lastAi !== null && lastT === t - 1) {
      const pot = signalPot(r.c.acts[lastAi], t - 1);
      if (pot) { const [S, V] = pot; update(logL, nodes, S, V, S * zPath + V * zs[t - 1]); n.updates++; }
    }
    const w = posterior(prior, logL), w0 = r.mix.weights;
    r.mix.weights = w;
    let ai;
    try { ai = chooseAction(r, s, t, held); } finally { r.mix.weights = w0; }
    lastAi = ai; lastT = t; n.last = w;
    return ai;
  };
  return { choose, n };
}
