/*
 * THE READ (EXPLORATORY; research/reviews/2026-10-30/LEVERS.md): the eight arms on the same households and paths. Each
 * household counts once; a pooled difference's se is by path (the households' paired variances summed). It refuses an
 * unfair set: one code, candidate, seed and path count on every unit; each household's arms on one inputs hash and one
 * minimum pot; the fixed-spending arms at the target in every year before a failure (the harness exits otherwise).
 *   node levers-reduce.mjs <unit dir> <household list, comma-separated> > results-levers.txt
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
const [dir, list] = process.argv.slice(2);
const IDS = list.split(','), ARMS = ['FIXAPP', 'FIXAPPT', 'APP', 'APPT', 'FIXHOLD', 'FIXCAND', 'FLEXHOLD', 'CAND'];
const TYPES = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, wealth: Float32Array, failYear: Int16Array, level: Uint8Array };
const dec = (b64, T) => { const b = Buffer.from(b64, 'base64'); return new T(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const U = {};
for (const f of readdirSync(dir).filter(x => x.endsWith('.json.gz'))) {
  const u = JSON.parse(gunzipSync(readFileSync(join(dir, f))).toString());
  u.m = Object.fromEntries(Object.entries(u.main).map(([k, v]) => [k, dec(v, TYPES[k])]));
  (U[u.id] = U[u.id] || {})[u.arm] = u;
}
const L = [];
const missing = IDS.flatMap(id => ARMS.filter(a => !(U[id] && U[id][a])).map(a => `${id} ${a}`));
if (missing.length) { console.log(`NOT COMPLETE: missing ${missing.join(', ')}`); process.exit(1); }
const all = IDS.flatMap(id => ARMS.map(a => U[id][a]));
const one = k => new Set(all.map(u => JSON.stringify(u[k])));
const unfair = ['code', 'candidate', 'seed', 'N'].filter(k => one(k).size > 1);
// a declared exception (LEVERS_INPUTS_DECLARED="id:ARM,ARM;...", its evidence named in LEVERS_INPUTS_WHY): the named arms of a
// household share one hash between them, and the rest of its arms another; the evidence shows the difference is the app's
// own pick (results-inputs-check.txt)
const DECL = Object.fromEntries((process.env.LEVERS_INPUTS_DECLARED || '').split(';').filter(Boolean).map(x => { const [id, arms] = x.split(':'); return [id, arms.split(',')]; }));
const inputsOff = IDS.filter(id => {
  const d = DECL[id] || [];
  const rest = new Set(ARMS.filter(a => !d.includes(a)).map(a => U[id][a].inputs)), named = new Set(d.map(a => U[id][a].inputs));
  return rest.size > 1 || named.size > 1;
});
const potOff = IDS.filter(id => new Set(ARMS.map(a => Math.round(U[id][a].ran.minPot))).size > 1);
const offTarget = all.filter(u => u.arm.startsWith('FIX') && u.offTarget > 0).map(u => `${u.id} ${u.arm}`);
L.push(`BETTER DECISIONS, OR MORE LEVERS? (EXPLORATORY): ${IDS.length} households of Phase 4's panel (${IDS.join(', ')}); eight arms`);
if (unfair.length || inputsOff.length || potOff.length || offTarget.length) {
  L.push(`NOT FAIR: the units differ in ${unfair.join(', ') || '-'}; inputs differ on ${inputsOff.join(', ') || 'none'}; minimum pots differ on ${potOff.join(', ') || 'none'}; fixed-spending years off the target on ${offTarget.join(', ') || 'none'}`);
  console.log(L.join('\n')); process.exit(1);
}
L.push(`fair: one code (${all[0].code}), candidate ${all[0].candidate}, seed ${all[0].seed}, ${all[0].N} paths a unit; each household's arms on one inputs hash${Object.keys(DECL).length ? ` (declared: ${Object.entries(DECL).map(([id, a]) => `${id}'s ${a.join(' and ')} on their own, ${process.env.LEVERS_INPUTS_WHY || 'no evidence named'}`).join('; ')})` : ''} and one minimum pot; every fixed-spending year at the target before a failure`);
const beside = all.filter(u => u.beside);
L.push(`runPolicy beside the engine: paths that differ ${beside.reduce((a, u) => a + u.beside.engineOnly + u.beside.policyOnly, 0)} of ${beside.reduce((a, u) => a + u.beside.N, 0)} (${beside.length} solver units)`);
L.push('');
L.push('What each arm ran (from the units):');
for (const id of IDS) {
  const r = a => U[id][a].ran;
  L.push(`  ${id.padEnd(6)} FIXAPP ${r('FIXAPP').label}; FIXAPPT step ${r('FIXAPPT').k} (${r('FIXAPPT').search.map(x => `${x.k}: ${x.survival.toFixed(1)}`).join(', ')} on the search seed), ${r('FIXAPPT').label}; APP ${r('APP').label}; APPT step ${r('APPT').k} (${r('APPT').search.map(x => `${x.k}: ${x.survival.toFixed(1)}`).join(', ')}), ${r('APPT').label}; the solver's tier moves ${r('FIXCAND').tierMoves.join(' ')} (held: ${r('FIXHOLD').tierMoves.join(' ')})`);
}
const f1 = x => (Number.isFinite(x) ? x.toFixed(1) : '-'), f2 = x => x.toFixed(2), sg = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
function stats(u) {
  const { N, target, accessT, ageSelf0 } = u, m = u.m;
  let sv = 0, fails = 0, pot = 0, bridge = 0, ages = 0;
  const w = [];
  for (let k = 0; k < N; k++) {
    sv += m.survived[k];
    if (m.failYear[k] >= 0) { if (m.unmet[k] > 1) { fails++; ages += ageSelf0 + m.failYear[k]; if (m.failYear[k] < accessT) bridge++; } else pot++; }
    w.push(m.wealth[k] / target);
  }
  w.sort((a, b) => a - b);
  return { surv: 100 * sv / N, fails, pot, bridge, age: fails ? ages / fails : NaN, med: w[Math.floor(N / 2)], p10: w[Math.floor(N / 10)] };
}
const S = {};
for (const id of IDS) for (const a of ARMS) S[`${id} ${a}`] = stats(U[id][a]);
const mean = f => IDS.reduce((p, id) => p + f(id), 0) / IDS.length;
L.push('');
L.push('Per arm, the households\' mean (survival; paths that run out, at a mean age, before pension access; paths below the minimum pot; median and unlucky tenth\'s end wealth in years of target; the pension and ISA\'s equity share in years 1, 10 and 20 on the solver\'s paths beside):');
for (const a of ARMS) {
  const xs = IDS.map(id => S[`${id} ${a}`]), eq = t => { const v = IDS.map(id => U[id][a].tierYears && U[id][a].tierYears[U[id][a].retireT + t]).filter(x => x !== null && x !== undefined); return v.length ? `${(100 * v.reduce((p, x) => p + x, 0) / v.length).toFixed(0)}%` : '-'; };
  L.push(`  ${a.padEnd(8)} ${f2(mean(id => S[`${id} ${a}`].surv)).padStart(6)}%  run out ${xs.reduce((p, x) => p + x.fails, 0)} (age ${f1(xs.filter(x => x.fails).reduce((p, x) => p + x.age * x.fails, 0) / Math.max(1, xs.reduce((p, x) => p + x.fails, 0)))}, before access ${xs.reduce((p, x) => p + x.bridge, 0)})  below the minimum pot ${xs.reduce((p, x) => p + x.pot, 0)}  end wealth ${f1(mean(id => S[`${id} ${a}`].med))} / ${f1(mean(id => S[`${id} ${a}`].p10))}${U[IDS[0]][a].tierYears ? `  equity ${eq(0)} / ${eq(9)} / ${eq(19)}` : ''}`);
}
// a paired comparison, x less y: survival in points, spending delivered in % of y's; per household and pooled
function cmp(x, y) {
  let ds = 0, vs = 0, dd = 0, vd = 0;
  const per = [];
  for (const id of IDS) {
    const a = U[id][x].m, b = U[id][y].m, N = a.survived.length, base = b.delivered.reduce((p, v) => p + v, 0) / N;
    let s1 = 0, s2 = 0, q1 = 0, q2 = 0;
    for (let k = 0; k < N; k++) { const d = a.survived[k] - b.survived[k]; s1 += d; s2 += d * d; const e = (a.delivered[k] - b.delivered[k]) / base; q1 += e; q2 += e * e; }
    const md = s1 / N, me = q1 / N, v = 1e4 * (s2 / N - md * md) / N;
    per.push({ id, d: 100 * md, se: Math.sqrt(v) });
    ds += 100 * md; vs += v; dd += 100 * me; vd += 1e4 * (q2 / N - me * me) / N;
  }
  const H = IDS.length;
  return { surv: ds / H, se: Math.sqrt(vs) / H, spend: dd / H, spse: Math.sqrt(vd) / H, per };
}
const line = (label, x, y, judge) => {
  const c = cmp(x, y), lo = c.surv - 1.96 * c.se, hi = c.surv + 1.96 * c.se, slo = c.spend - 1.96 * c.spse;
  const behind = c.per.filter(p => p.d < -1 && p.d + 2 * p.se < 0).map(p => p.id), ahead = c.per.filter(p => p.d - 2 * p.se > 0).map(p => p.id);
  let verdict = '';
  if (judge) verdict = lo > 0 && slo > -1 && !behind.length ? 'BETTER' : lo > 0 && !behind.length ? 'MORE SURVIVAL, LESS SPENDING' : hi < 0 ? 'WORSE' : 'NOT SHOWN';
  L.push(`  ${label.padEnd(58)} ${x} less ${y}: survival ${sg(c.surv, 3)} (95% ${sg(lo)} to ${sg(hi)}), spending ${sg(c.spend, 3)}% (se ${c.spse.toFixed(3)}); ahead beyond 2 se on ${ahead.length} of ${IDS.length}, behind by a point beyond 2 se on ${behind.length}${behind.length ? ` (${behind.join(', ')})` : ''}${judge ? `  => ${verdict}` : ''}`);
  L.push(`  ${''.padEnd(58)} per household: ${c.per.map(p => `${p.id} ${sg(p.d, 1)}`).join(', ')}`);
};
L.push('');
L.push('THE DECISIONS, ON THE SAME LEVERS (the rule, fixed before the runs: BETTER if the pooled survival interval is above zero, spending\'s 95% lower end above -1%, and no household behind by more than a point beyond 2 se; WORSE if the interval is below zero; else NOT SHOWN):');
line('fixed spending, the plan\'s tiers (the draws alone)', 'FIXHOLD', 'FIXAPP', true);
line('fixed spending, the tier menu (the draws and the tiers)', 'FIXCAND', 'FIXAPPT', true);
line('flexible spending, the plan\'s tiers (the spending and the draws)', 'FLEXHOLD', 'APP', true);
line('flexible spending, the tier menu (all three)', 'CAND', 'APPT', true);
L.push('');
L.push('THE LEVERS, EACH DECISION-MAKER (what a lever adds, used statically by the app and dynamically by the solver):');
line('the tiers, the app (fixed spending)', 'FIXAPPT', 'FIXAPP');
line('the tiers, the app (flexible spending)', 'APPT', 'APP');
line('the tiers, the solver (fixed spending)', 'FIXCAND', 'FIXHOLD');
line('the tiers, the solver (flexible spending)', 'CAND', 'FLEXHOLD');
line('the spending, the app (the plan\'s tiers)', 'APP', 'FIXAPP');
line('the spending, the app (the best tier)', 'APPT', 'FIXAPPT');
line('the spending, the solver (the plan\'s tiers)', 'FLEXHOLD', 'FIXHOLD');
line('the spending, the solver (the tier menu)', 'CAND', 'FIXCAND');
L.push('');
L.push('THE FIRST QUESTION AND PHASE 4\'S (the solver with every lever it has against the app as it is):');
line('no flexibility in spending: the solver against the app\'s fixed policy', 'FIXCAND', 'FIXAPP');
line('flexible spending: the solver against the app (Phase 4\'s comparison)', 'CAND', 'APP');
console.log(L.join('\n'));
