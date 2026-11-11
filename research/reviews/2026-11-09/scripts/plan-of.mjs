// A touched library couple's plan for the couples' path scripts, by a name:
//   S007            the library plan as it stands
//   S303@52         each person retiring at 52 (how the panel's younger cohort is made from a library couple)
//   S303@52:land    and its target set where the plan's own rules keep it solvent about 85% of the time (a bisection on 500
//                   paths of seed 990, this script's own), the floor at 80% of it and a minimum pot of one year's target where
//                   the plan has none: how couple-panel.mjs planOf dresses a panel couple. The landing here is by the plan's
//                   own rules, not the panel's searched policy, and reads no panel file.
// Plan inputs and the app's rules only; no solver.
export function planOf(E, buildScenarios, name) {
  const [head, land] = name.split(':'), [id, retire] = head.split('@');
  const sc = buildScenarios().find(s => s.id === id);
  if (!sc) throw new Error(`no library plan ${id}`);
  const p = JSON.parse(JSON.stringify(sc.plan));
  if (p.demographics.planningMode === 'single') throw new Error(`${id} is not a couple`);
  if (retire) { p.demographics.retireAgeSelf = Number(retire); p.demographics.retireAgePart = Number(retire); }
  if (land !== 'land') return { plan: E.normalizePlan(p), note: retire ? `each person retiring at ${retire}` : 'the library plan' };
  const at = (target) => {
    const q = JSON.parse(JSON.stringify(p)), own = Math.max(0, E.num(q.config && q.config.solvencyFloor, 0));
    q.spending = { ...q.spending, targetSpend: target, floorSpend: Math.round(0.8 * target) };
    q.config = { ...q.config, solvencyFloor: own > 0 ? own : target };
    return E.normalizePlan(q);
  };
  const surv = (target) => { const pl = at(target), ctx = E.buildContext(pl), zs = E.pathsForSeed(990, 500, ctx.totalYears); let n = 0; for (const z of zs) if (E.runTrial(ctx, z).survived) n++; return n / 5; };
  let lo = 1000, hi = Number(p.spending.targetSpend) * 3;
  for (let i = 0; i < 18; i++) { const mid = Math.round((lo + hi) / 2 / 100) * 100; if (surv(mid) >= 85) lo = mid; else hi = mid; if (hi - lo <= 100) break; }
  return { plan: at(lo), note: `${retire ? `each person retiring at ${retire}, ` : ''}target £${lo} (the plan's own rules ${surv(lo).toFixed(1)}% on 500 paths), the floor at 80%` };
}
