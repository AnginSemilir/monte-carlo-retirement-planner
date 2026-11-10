import { repoRoot } from './root.mjs';
const R = repoRoot(import.meta.url);
const E = await import(R + '/research/engine.mjs');
const { buildScenarios } = await import(R + '/research/policy-study/scenarios.mjs');
const all = buildScenarios().map(s => E.normalizePlan(s.plan)).filter(p => p.demographics.planningMode !== 'single');
const sh = new Map(), penSh = new Map(), gap = new Map(), sp = new Map();
for (const p of all) { const b = (o, c) => p.accounts.filter(x => x.id.endsWith('_' + o) && (!c || x.id.startsWith(c + '_'))).reduce((t, x) => t + (Number(x.balance) || 0), 0);
  const k = (m, v) => m.set(v, (m.get(v) || 0) + 1); const tot = b('self') + b('part'), pen = b('self', 'pen') + b('part', 'pen');
  k(sh, (b('self') / tot).toFixed(2)); k(penSh, pen > 0 ? (b('self', 'pen') / pen).toFixed(2) : 'none'); k(gap, Number(p.demographics.currentAgeSelf) - Number(p.demographics.currentAgePart)); k(sp, `${p.demographics.statePensionSelf}/${p.demographics.statePensionPart}`.length > 0 ? (Number(p.demographics.statePensionPart) / Number(p.demographics.statePensionSelf)).toFixed(2) : ''); }
console.log('couples', all.length, '\n first person\'s share of all money:', JSON.stringify([...sh]), '\n first person\'s share of the pensions:', JSON.stringify([...penSh]), '\n age gap:', JSON.stringify([...gap]), '\n partner\'s state pension / first person\'s:', JSON.stringify([...sp]));
