// What D4's 40 couples can show about finding 1.1 (a pension drawn beside a salary): plan inputs only, no run, no result.
//   node d4exp.mjs          each couple by its place in the panel (no id printed, so an output committed under
//                           research/reviews/ adds nothing to the held-out scan)
//   IDS=1 node d4exp.mjs    with the ids
// The panel is read from research/solver/couples-panel.json; the younger cohort retires at 52 (the registration).
import { readFileSync } from 'node:fs';
import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const all = buildScenarios(), panel = JSON.parse(readFileSync(R + '/research/solver/couples-panel.json', 'utf8')).panel;
const place = { lib: 0, young: 0 }, out = [];
let withWindow = 0;
for (const u of panel) {
  const force = u.cohort === 'young' ? 52 : null, k = place[u.cohort]++;
  const p = E.normalizePlan(all.find(s => s.id === u.base).plan), d = p.demographics;
  const a = [Number(d.currentAgeSelf), Number(d.currentAgePart)], r = force ? [force, force] : [Number(d.retireAgeSelf), Number(d.retireAgePart)], s = [Number(d.salarySelf) || 0, Number(d.salaryPart) || 0], nm = Number(d.privatePensionAge) || 57;
  const bal = (o, c) => p.accounts.filter(x => x.id === `${c}_${o}`).reduce((t, x) => t + (Number(x.balance) || 0), 0);
  let yrs = 0, workYrs = 0;
  for (let t = 0; t < 60; t++) for (const j of [0, 1]) { const me = a[j] + t, other = a[1 - j] + t; if (me < r[j] && s[j] > 0) { workYrs++; if (me >= nm && other >= r[1 - j]) yrs++; } }
  if (yrs > 0) withWindow++;
  out.push(`${u.cohort} ${String(k).padStart(2)}${process.env.IDS === '1' ? ' ' + u.id : ''}: ages ${a.join('/')} retire ${r.join('/')} salary ${s.join('/')} access ${nm}: person-years working ${workYrs}, of them with a pension drawable beside a salary while the other is retired ${yrs}; taxable accounts now ${Math.round(bal('self', 'other') + bal('part', 'other'))} cash ${Math.round(bal('self', 'cash') + bal('part', 'cash'))}`);
}
console.log(out.join('\n'));
console.log(`${withWindow} of ${panel.length} couples have at least one such year`);
