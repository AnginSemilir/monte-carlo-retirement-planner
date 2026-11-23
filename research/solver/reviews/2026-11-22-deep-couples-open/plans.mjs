process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = readOpenPanel().filter(u => u.route === 'household');
const pick = process.argv[2] ? new Set(process.argv[2].split(',')) : null;
for (const u of panel) {
  if (pick && !pick.has(u.id)) continue;
  const p = u.plan, d = p.demographics;
  console.log(`== ${u.id} target ${u.target} floor ${p.spending.floorSpend} minpot ${p.config.solvencyFloor} policy ${p.spending.decumulationPolicy}`);
  console.log('  demo', JSON.stringify(Object.fromEntries(Object.entries(d).filter(([k]) => /Age|age|salary|state|Sp|sp|mpaa|planning/i.test(k)))));
  console.log('  accounts', p.accounts.map(a => `${a.id}:${Math.round(a.balance)}:${a.risk}${a.contribution ? ':c' + a.contribution : ''}`).join(' | '));
  console.log('  incomes', JSON.stringify(p.otherIncomes || []));
  console.log('  costs', JSON.stringify((p.oneOffCosts || p.costs || p.expenses || [])).slice(0, 400));
  console.log('  spending', JSON.stringify(p.spending).slice(0, 600));
}
