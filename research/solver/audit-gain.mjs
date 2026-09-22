/* AUDIT, second axis: the unrealised-gain fraction. Buckets [0.05, 0.25, 0.55], nearest-snap, no
 * interpolation, so the boundaries sit at 0.15 and 0.40. Walks each household's own model forward and
 * records the true gain fraction each year against the bucket the grid would read it at. */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const IDS = 'S004 S020 S034 S054 S058 S070 S082 S100 S112 S118 S126 S142 S154 S162 S172 S178 S184 S194 S198 S206 S218 S222 S230 S234 S240 S252 S258 S268 S276 S292 S300 S318 S330 S342 S354 S374 S378 S390 S400 S410 S414'.split(' ');
const all = buildScenarios();
const G = [0.05, 0.25, 0.55];
const near = (v) => { let b = 0, bd = Infinity; for (let i = 0; i < G.length; i++) { const d = Math.abs(G[i] - v); if (d < bd) { bd = d; b = i; } } return b; };

let years = 0, giaYears = 0, far = 0, worst = 0, worstId = '', top = 0, topId = '';
const perTop = [];
for (const id of IDS) {
  const sc = all.find(s => s.id === id); if (!sc) continue;
  const plan = E.resolveMpaa(E.normalizePlan({ ...sc.plan, config: { ...sc.plan.config, guardrails: false, lookaheadYears: 0 } }));
  const m = M.prepare(E, plan, {});
  const act = M.actionFromContext(m.ctx);
  const st = M.initialState(m);
  let hiG = 0, hiErr = 0;
  for (let t = 0; t <= m.ctx.totalYears; t++) {
    M.step(m, st, act, t, null);
    // the state holds `pots` keyed by account id, and the GIA is the owner's `other` account
    const gia = m.ctx.owners.reduce((a, o) => a + (st.pots[o.ids.other] || 0), 0);
    const basis = m.ctx.owners.reduce((a, o) => a + (st.basis[o.key] || 0), 0);
    years++;
    if (!(gia > 1)) continue;
    giaYears++;
    const f = Math.max(0, Math.min(1, (gia - basis) / gia));
    const err = Math.abs(G[near(f)] - f);
    if (err > 0.05) far++;
    if (f > hiG) hiG = f;
    if (err > hiErr) hiErr = err;
    if (err > worst) { worst = err; worstId = `${id} y${t}`; }
    if (f > top) { top = f; topId = `${id} y${t}`; }
  }
  if (hiG > 0) perTop.push([id, hiG, hiErr]);
}
perTop.sort((a, b) => b[1] - a[1]);
console.log('households with a GIA, by the highest true gain fraction they reach');
console.log('id     peak gain  reads as   worst snap in the run');
for (const [id, f, e] of perTop.slice(0, 12)) console.log(`${id}   ${(100 * f).toFixed(1).padStart(6)}%    ${(100 * G[near(f)]).toFixed(0).padStart(3)}%       ${(100 * e).toFixed(1)} points`);
console.log(`\nhousehold-years with a GIA        ${giaYears} of ${years}`);
console.log(`snapped more than 5 points away   ${far} of ${giaYears}  (${(100 * far / Math.max(1, giaYears)).toFixed(0)}%)`);
console.log(`worst snap                        ${(100 * worst).toFixed(1)} points  (${worstId})`);
console.log(`highest gain fraction reached     ${(100 * top).toFixed(1)}%  (${topId}); top bucket is 55%`);
