/*
 * A BETTER TIE RULE FOR COUPLES: BEFORE THE LAUNCH, S311F'S TWO DECIDING PATHS (TIE-C2.md, "Before the launch, deciding
 * nothing (seed 7002)"; EXPLORATORY). S311F solved as audit-tie-couple.mjs solved it for the first read (the same plan, arm A's
 * policy name and MPAA ages, the couples' candidate at 45 points), its two deciding paths of that read (4468 and 5461 of seed
 * 7002) run by the engine year by year under CANDS, HOLD, LOOKHOLD and TIE4 (audit-tie-c2.mjs OPTS). CANDS's and TIE4's pot and
 * lifetime tax are first held to the first read's stored arrays (results/tie-couple-7002/S311F.json.gz, when there). Printed for each path: the plan year TIE4's tiers first part from CANDS's (the first read: 53, the first person 90);
 * there, the first person's wealth against twice their table's top, and the score gap of the step at the clamped read (the
 * best joint move with the step against the best keeping the tiers held, each person's twelve best moves on offer at that
 * state, TIE4's tables and margin); for each arm, the decisions
 * where a person past the limit steps down (HOLD and LOOKHOLD: by construction none), and its pot and lifetime tax against
 * CANDS's.
 *   node research/solver/tie-c2-precheck.mjs [stored dir] > research/solver/results-tie-c2-precheck.txt
 */
import * as E from '../engine.mjs';
import * as M from '../../src/solver/model.js';
import * as CPL from '../../src/solver/couple.js';
import { TIER_ORDER } from '../../src/solver/fast.js';
import { vecOf } from '../../src/solver/grid.js';
import { solveForApp } from '../../src/solverApp.js';
import { readPanel, appPlan } from './couple-panel.mjs';
import { armA } from './select-phase4.mjs';
import { PANEL_FILE, solverPlan } from './audit-couples.mjs';
import { OPTS, LIMIT } from './audit-tie-c2.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ID = 'S311F', SEED = 7002, N = 8000, PTS = 45, W = 0.02, PATHS = [4468, 5461];
const HERE = dirname(fileURLToPath(import.meta.url)), STORED = process.argv[2] || join(HERE, 'results', 'tie-couple-7002');
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`;
const tiersOf = th => ['self', 'part'].map(w => `${th && th[w] ? th[w].pen || 0 : 0}/${th && th[w] ? th[w].isa || 0 : 0}`).join(' and ');
const moveTiers = j => ['self', 'part'].map(w => `${(j.perOwner[w] && j.perOwner[w].tierPen) || 0}/${(j.perOwner[w] && j.perOwner[w].tierIsa) || 0}`).join(' ');

const h = readPanel(PANEL_FILE).find(x => x.id === ID);
const a = armA(appPlan(h.plan), { tournament: false }), aPol = { decumulationPolicy: a.planState.spending.decumulationPolicy, drawdownStrategy: a.planState.spending.drawdownStrategy };
const hp = solverPlan('CANDC', h.plan, aPol, W), aDemo = E.resolveMpaa(a.planState).demographics;
const memo = new Map();
const solveOne = (p, o) => { const k = JSON.stringify([p, o.partnerAge0]); if (!memo.has(k)) memo.set(k, solveForApp(E, M, p, { points: PTS, ageWith: o.partnerAge0, research: { tieAboveCap: undefined } })); return memo.get(k); };
const t0 = Date.now();
const cps = Object.fromEntries(Object.entries(OPTS).map(([arm, o]) => [arm, CPL.solveCouple(E, M, hp, { shareRule: 'pots', solveOne, ...o })]));
const base = cps.CANDS, tops = ['self', 'part'].map(w => base.tables[w].g.axes.W.hi);
const stored = existsSync(join(STORED, `${ID}.json.gz`)) ? JSON.parse(gunzipSync(readFileSync(join(STORED, `${ID}.json.gz`))).toString()) : null;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
console.log(`TIE-C2, BEFORE THE LAUNCH: ${ID}'S TWO DECIDING PATHS OF THE FIRST READ (EXPLORATORY, seed ${SEED}, deciding nothing): solved in ${((Date.now() - t0) / 1000).toFixed(0)} s; caps ${gbp(base.tables.self.estateCap)} and ${gbp(base.tables.part.estateCap)}; the tables' tops ${gbp(tops[0])} and ${gbp(tops[1])}, so the limit (${LIMIT} times) ${gbp(LIMIT * tops[0])} and ${gbp(LIMIT * tops[1])}`);

const ctxOf = cp => E.buildContext(CPL.withCouple({ ...cp.plan, demographics: { ...cp.plan.demographics, mpaaAgeSelf: aDemo.mpaaAgeSelf, mpaaAgePart: aDemo.mpaaAgePart } }, cp));
const place = (cp, w, cat, k) => TIER_ORDER.indexOf(cp.tables[w].c.tiers[cat][k] ? cp.tables[w].c.tiers[cat][k].name : null);
const wealthOf = (cp, st, w) => { const s = vecOf(cp.tables[w].m, CPL.ownerState(st, w)); return s[0] + s[1] + s[2]; };
// one arm on one path by the engine, year by year: each year's move, the model's state before it, the tiers held after it
function trace(arm, k) {
  const cp = cps[arm], ctx = ctxOf(cp), T = ctx.totalYears, zs = Float64Array.from(E.pathsForSeed(SEED, N, T)[k]), Y = T + 1, zPath = zs.length > Y ? zs[Y] : 0;
  const pol = ctx.policyOverride, choose = pol.choose.bind(pol), years = [];
  let move = null, mstate = null;
  pol.choose = (s, t) => { move = choose(s, t); return move; };
  const state = E.freshState(ctx);
  let tax = 0, last = null, downPast = 0;
  for (let t = 0; t <= T; t++) {
    const heldBefore = JSON.parse(JSON.stringify(state.tierHeld || {})), before = JSON.parse(JSON.stringify(state));
    move = null;
    const row = E.stepYear(ctx, state, t, { z: zs[t], zPath });
    tax += row.taxPaid + (row.cgtPaid || 0); last = row;
    // the model's state the chooser read (couple.js couplePolicy's mapping), for the limit's test
    if (move && t < T) {
      const th = {}; for (const o of cp.m.ctx.owners) { const x = before.tierHeld && before.tierHeld[o.key]; th[o.key] = { pen: x ? x.pen || 0 : 0, isa: x ? x.isa || 0 : 0 }; }
      mstate = { pots: { ...before.pots }, basis: { ...before.giaBasis }, cgtCarry: { ...before.cgtCarry }, cumPcls: { ...before.cumPcls }, lumpTaken: { ...before.lumpSumTaken }, cashIsa: { ...(before.cashIsa || {}) }, guard: null, tierHeld: th };
      for (const w of ['self', 'part']) {
        if (!(wealthOf(base, mstate, w) > LIMIT * base.tables[w].g.axes.W.hi)) continue;
        for (const [cat, key] of [['pen', 'tierPen'], ['isa', 'tierIsa']]) { const from = th[w][cat], to = move.perOwner[w][key] || 0; if (to !== from && place(base, w, cat, to) > place(base, w, cat, from)) downPast++; }
      }
    }
    years.push({ t, move, mstate, heldBefore, heldAfter: JSON.parse(JSON.stringify(state.tierHeld || {})), age: row.ageSelf });
  }
  pol.choose = choose;
  return { years, wealth: Math.max(0, last.totalCombined), tax, downPast };
}

for (const k of PATHS) {
  const r = Object.fromEntries(Object.keys(OPTS).map(arm => [arm, trace(arm, k)]));
  const held = arm => { if (!stored || !stored.arms[arm]) return 'no stored array'; const sp = dec(stored.arms[arm].pot, Float64Array)[k], st = dec(stored.arms[arm].tax, Float64Array)[k]; return r[arm].wealth === sp && r[arm].tax === st ? 'the first read\'s stored arrays to the penny' : `NOT the first read's (${gbp(sp)}, ${gbp(st)})`; };
  console.log(`\npath ${k}: CANDS's pot ${gbp(r.CANDS.wealth)} and lifetime tax ${gbp(r.CANDS.tax)} (${held('CANDS')}); TIE4's ${gbp(r.TIE4.wealth)} and ${gbp(r.TIE4.tax)} (${held('TIE4')})`);
  const t = r.TIE4.years.findIndex((y, u) => tiersOf(y.heldAfter) !== tiersOf(r.CANDS.years[u].heldAfter));
  if (t >= 0) {
    const y = r.TIE4.years[t], st = y.mstate;
    console.log(`  TIE4's tiers first part from CANDS's in plan year ${t} (the first person ${y.age}): TIE4 holds ${tiersOf(y.heldAfter)} after it, CANDS ${tiersOf(r.CANDS.years[t].heldAfter)}; both held ${tiersOf(y.heldBefore)}`);
    if (st) {
      const ws = ['self', 'part'].map(w => wealthOf(base, st, w));
      console.log(`  there, each person's wealth as their table reads it: ${ws.map((v, i) => `${gbp(v)} against twice the top ${gbp(LIMIT * tops[i])} (${(v / tops[i]).toFixed(1)} times the top)`).join('; ')}`);
      // the joint moves on offer at that state, each person's twelve best-ranked (TIE4's tables and margin; topK 2 in the run
      // offers too few to hold a move keeping the tiers held)
      const wide = CPL.solveCouple(E, M, hp, { shareRule: 'pots', solveOne, tieJoint: 1e-4, topK: 12 }), out = {}; CPL.chooseJoint(wide, st, t, out);
      if (out.tie && out.tie.length) {
        const hk = moveTiers({ perOwner: { self: { tierPen: st.tierHeld.self.pen, tierIsa: st.tierHeld.self.isa }, part: { tierPen: st.tierHeld.part.pen, tierIsa: st.tierHeld.part.isa } } });
        let keep = out.tie.filter(c => moveTiers(c.joint) === hk).reduce((m, c) => (c.score > m ? c.score : m), -Infinity);
        // none on offer: the best move with the first person's tiers held, scored as couple.js chooseJoint scores a joint move,
        // the replication held first to the best move's own score, bit for bit
        if (!Number.isFinite(keep)) {
          const scoreOf = j => {
            const A = wide.tables.self, B = wide.tables.part, post = M.cloneState(st);
            M.step(wide.m, post, j, t, null, true);
            if (wide._flat) wide._flat.nm = 0;
            const ev = new Float64Array(2), cst = CPL.cutCostOf(wide, j.spendLevel !== undefined ? j.spendLevel : 1, t), rz = !!A.raiseSurvival && cst < 0;
            const leaves = w => (j.perOwner[w].tierPen || 0) !== (st.tierHeld[w].pen || 0) || (j.perOwner[w].tierIsa || 0) !== (st.tierHeld[w].isa || 0);
            const swc = (leaves('self') ? A.switchCharge || 0 : 0) + (leaves('part') ? B.switchCharge || 0 : 0);
            const v = CPL.expectedValue(wide, post, t, ev, { ia: j.ia, ib: j.ib });
            return v - (rz ? cst * ev[0] : cst) - swc;
          };
          const bj = out.best.joint, A = wide.tables.self, a0 = A.actions[bj.ia], key = x => JSON.stringify([x.steps, !!x.harvest, x.harvestCeil || 'pa', x.spendLevel, !!x.cgtSale, !!x.lump]);
          const h0 = st.tierHeld.self, ia2 = A.actions.findIndex(x => key(x) === key(a0) && (x.tierPen || 0) === h0.pen && (x.tierIsa || 0) === h0.isa);
          const tn = (cat, k) => (A.c.tiers[cat][k] ? A.c.tiers[cat][k].name : null);
          const again = scoreOf(bj);
          if (ia2 < 0) console.log('  the best move with the first person\'s tiers held: not on the menu');
          else if (!Object.is(again, out.best.score)) console.log(`  the scoring not reproduced (${again} against ${out.best.score}): no gap printed`);
          else {
            const j2 = { ...bj, ia: ia2, perOwner: { ...bj.perOwner, self: { ...bj.perOwner.self, tierPen: h0.pen, tierIsa: h0.isa, ...('tierPenName' in bj.perOwner.self ? { tierPenName: tn('pen', h0.pen), tierIsaName: tn('isa', h0.isa) } : {}) } } };
            keep = scoreOf(j2);
            console.log(`  the best move with the first person's tiers held, scored as the chooser scores it (its scoring reproducing the best's own score bit for bit): ${keep.toFixed(9)}`);
          }
        }
        console.log(`  the score gap of the step at the clamped read (each person's twelve best moves on offer): the best ${out.best.score.toFixed(9)} at tiers ${moveTiers(out.best.joint)}, the best keeping the tiers held (${hk}) ${Number.isFinite(keep) ? keep.toFixed(9) : 'none on offer'}: a gap of ${Number.isFinite(keep) ? (out.best.score - keep).toExponential(3) : 'n/a'} in score units (the switch charge ${(cps.TIE4.tables.self.switchCharge || 0)})`);
      } else console.log('  no tie list there (not above both caps)');
    }
  } else console.log('  TIE4\'s tiers never part from CANDS\'s on this path');
  for (const arm of ['HOLD', 'LOOKHOLD', 'TIE4']) {
    const x = r[arm];
    console.log(`  ${arm}: a person past the limit stepping down at ${x.downPast} decisions; its pot ${gbp(x.wealth)} (${(100 * (x.wealth / r.CANDS.wealth - 1)).toFixed(2)}% of CANDS's) and lifetime tax ${gbp(x.tax)} (${x.tax >= r.CANDS.tax ? '+' : ''}${gbp(x.tax - r.CANDS.tax)})`);
  }
  console.log(`  CANDS: a person past the limit stepping down at ${r.CANDS.downPast} decisions`);
}
