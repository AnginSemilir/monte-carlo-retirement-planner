// post hoc, read only: the registered panel's plans as readAnyPanel builds them (no context, no path, no solve)
const R = new URL('../../../../', import.meta.url).pathname; // the repository's root, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { readAnyPanel } = await import(R + 'research/solver/couples-any-panel.mjs');
const panel = readAnyPanel();
const want = process.argv.slice(2);
for (const U of panel) {
  if (want.length && !want.some(w => U.id === w || (w.endsWith('*') && U.id.startsWith(w.slice(0, -1))))) continue;
  const p = U.plan, d = p.demographics, sp = p.spending, c = p.config || {};
  console.log(`${U.id} cls ${U.cls} target ${U.target} label ${U.label}`);
  console.log(`  ages ${d.currentAgeSelf}/${d.currentAgePart} retire ${d.retireAgeSelf}/${d.retireAgePart} end ${d.terminalAge} ppa ${d.privatePensionAge} spa ${d.statePensionAge} sp ${d.statePensionSelf}/${d.statePensionPart} sal ${d.salarySelf}/${d.salaryPart} g ${d.salaryGrowthSelf}/${d.salaryGrowthPart} emp ${d.employmentSelf}/${d.employmentPart} mpaa ${d.mpaaAgeSelf}/${d.mpaaAgePart}`);
  console.log(`  spending policy ${sp.decumulationPolicy} draw ${sp.drawdownStrategy} floor ${sp.floorSpend} target ${sp.targetSpend} bands ${JSON.stringify(sp.spendBands || null)} harvestPA ${c.harvestPersonalAllowance} floorPot ${c.solvencyFloor} region ${c.taxRegion || ''}`);
  for (const a of p.accounts) if (a.balance || a.contrib) console.log(`  ${a.id.padEnd(14)} ${a.category.padEnd(30)} ${a.owner.padEnd(8)} bal ${Math.round(a.balance)} risk ${a.risk} contrib ${a.contrib || 0} growth ${a.growth || 0}${a.contribByYear ? ' sched' : ''}`);
  for (const i of p.otherIncomes || []) console.log(`  income ${i.owner} ${i.incomeType} ${i.amount} ${i.startAge}-${i.endAge}`);
  for (const x of p.oneOffContributions || []) console.log(`  deposit ${x.owner} ${x.category} ${x.amount} ${x.date || x.year} from ${x.transferredFrom}`);
  for (const x of p.oneOffCosts || []) console.log(`  cost ${x.amount} ${x.date || x.year}`);
  if (p.solver) console.log(`  solver ${JSON.stringify(p.solver)}`);
}
