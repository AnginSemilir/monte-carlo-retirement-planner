const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { couplesOf } = await import(R + 'couple-panel.mjs');
for (const id of ['S025', 'S037']) {
  const h = couplesOf().find(x => x.id === id), p = h.plan, d = p.demographics;
  console.log(id, h.name, `ages ${d.currentAgeSelf}/${d.currentAgePart} retire ${d.retireAgeSelf}/${d.retireAgePart} SP ${d.statePensionSelf}/${d.statePensionPart} end ${d.terminalAge} target ${p.spending.targetSpend} minpot ${p.config.solvencyFloor} policy ${p.spending.decumulationPolicy}`);
  console.log('  ', p.accounts.map(a => `${a.id}:${Math.round(a.balance)}:${a.risk}`).join(' | '), '| costs', JSON.stringify(p.oneOffCosts || p.costs || []).slice(0, 200));
}
