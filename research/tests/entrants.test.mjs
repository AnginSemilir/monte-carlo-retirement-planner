// buildTournament: the five built-in players, and saved scenarios entered as extra players.
import * as E from '../engine.mjs';

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

const GIA = 'Other Investments (e.g. GIA)';
const mk = (over = {}) => E.normalizePlan({
  demographics: {
    planningMode: 'single', currentAgeSelf: 45, retireAgeSelf: 58, salarySelf: 90000,
    employmentSelf: 'employed', statePensionAge: 68, privatePensionAge: 58,
    statePensionSelf: 11500, terminalAge: 92, ...(over.demographics || {})
  },
  spending: { targetSpend: 30000, drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic', ...(over.spending || {}) },
  accounts: over.accounts || [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 260000, contrib: 14000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 90000, contrib: 5000, growth: 3, risk: 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 60000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ],
  otherIncomes: [], oneOffContributions: [], oneOffCosts: [], config: { valuationDate: '2026-01-01' }
});

console.log('=== the field ===');
{
  const t = E.buildTournament(mk(), { emergencyFloor: 25000, scope: 'full' });
  const ids = t.strategies.map(s => s.id);
  ok('six players', ids.length === 6, ids.join(', '));
  ok('Liquidity-First is gone', !ids.includes('liquidity'));
  ok('the other six are present', ['baseline', 'survival', 'bridged', 'relief', 'bracket', 'phased'].every(id => ids.includes(id)), ids.join(', '));
  const surv = t.strategies.find(s => s.id === 'survival');
  ok('the search still covers a 100% ISA split', surv.candidates.some(c => c.share === 1.0));
  ok('the search still covers a 100% pension split', surv.candidates.some(c => c.share === 0));
}

console.log('\n=== removing Liquidity-First loses no allocation ===');
// It was byte-identical to the search grid's 100%-ISA point, which is why it could go.
{
  for (const retireAge of [52, 55, 58, 62]) {
    const t = E.buildTournament(mk({ demographics: { retireAgeSelf: retireAge } }), { emergencyFloor: 25000, scope: 'full' });
    const surv = t.strategies.find(s => s.id === 'survival');
    const g = surv.candidates.find(c => c.share === 1.0);
    const isa = g.planState.accounts.find(a => a.id === 'isa_self');
    const pen = g.planState.accounts.find(a => a.id === 'pen_self');
    ok(`retiring at ${retireAge}: the 100% grid point is still all-ISA`, E.num(pen.contrib, 0) === 0 && E.num(isa.contrib, 0) > 0,
      `pension ${Math.round(E.num(pen.contrib, 0))}, ISA ${Math.round(E.num(isa.contrib, 0))}`);
  }
}

console.log('\n=== entrants ===');
{
  const saved = mk({ spending: { targetSpend: 40000 }, demographics: { retireAgeSelf: 62 } });
  const t = E.buildTournament(mk(), { emergencyFloor: 25000, scope: 'full', entrants: [{ id: 'scen_2', name: 'Retire later', plan: saved }] });
  ok('the entrant is added after the built-ins', t.strategies.length === 7);
  const ent = t.strategies[t.strategies.length - 1];
  ok('it goes last, after the built-ins', ent.id === 'entrant_scen_2', ent.id);
  ok('it is flagged as an entrant', ent.isEntrant === true);
  ok('it keeps its scenario name', ent.name === 'Retire later', ent.name);
  ok('it carries a runnable plan', !!ent.planState && Array.isArray(ent.planState.accounts));
  ok('its own spend survives untouched', E.num(ent.planState.spending.targetSpend, 0) === 40000, String(ent.planState.spending.targetSpend));
  ok('its own retirement age survives untouched', E.num(ent.planState.demographics.retireAgeSelf, 0) === 62);
  ok('it is not escalation-normalised', ent.escalation === null);
  ok('it reports its own outlay', ent.entrantOutlay > 0, String(Math.round(ent.entrantOutlay)));
  ok('and the baseline outlay to compare against', ent.baselineOutlay > 0, String(Math.round(ent.baselineOutlay)));
  ok('it reports its own contributions', Math.round(ent.penContrib) === 14000 && Math.round(ent.isaContrib) === 5000,
    `pension ${Math.round(ent.penContrib)}, ISA ${Math.round(ent.isaContrib)}`);
}

console.log('\n=== an entrant is run as saved, not normalised ===');
{
  // double the contributions: the outlay must come back higher, not be flattened to the baseline's
  const richer = mk({ accounts: [
    { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 260000, contrib: 28000, growth: 3, risk: 'High Risk' },
    { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 90000, contrib: 10000, growth: 3, risk: 'High Risk' },
    { id: 'other_self', owner: 'Myself', category: GIA, balance: 60000, contrib: 0, growth: 0, risk: 'Medium Risk' },
    { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: 30000, contrib: 0, growth: 0, risk: 'Cash Equivalents' }
  ] });
  const t = E.buildTournament(mk(), { emergencyFloor: 25000, scope: 'full', entrants: [{ id: 'rich', name: 'Save harder', plan: richer }] });
  const ent = t.strategies.find(s => s.isEntrant);
  ok('a bigger-contribution scenario keeps its bigger outlay', ent.entrantOutlay > ent.baselineOutlay * 1.5,
    `${Math.round(ent.entrantOutlay)} vs baseline ${Math.round(ent.baselineOutlay)}`);
  ok('its contributions are not rewritten', E.num(ent.planState.accounts.find(a => a.id === 'pen_self').contrib, 0) === 28000);
  // the built-ins are still held to the baseline, so the entrant cannot drag them
  const relief = t.strategies.find(s => s.id === 'relief');
  const reliefOutlay = E.accumulationOutlay(E.buildContext(relief.planState));
  ok('the built-in players stay pinned to the baseline outlay', Math.abs(reliefOutlay - ent.baselineOutlay) / ent.baselineOutlay < 0.02,
    `${Math.round(reliefOutlay)} vs ${Math.round(ent.baselineOutlay)}`);
}

console.log('\n=== entrants are defensive ===');
{
  const t = E.buildTournament(mk(), { emergencyFloor: 25000, scope: 'full', entrants: [
    { id: 'junk', name: 'Broken', plan: null },
    { id: 'ok', name: 'Fine', plan: mk() }
  ] });
  ok('a null plan is normalised rather than thrown', t.strategies.filter(s => s.isEntrant).length === 2);
  const junk = t.strategies.find(s => s.id === 'entrant_junk');
  ok('the empty entrant still has the canonical account set', junk.planState.accounts.length === 8);
  ok('and a zero outlay rather than NaN', Number.isFinite(junk.entrantOutlay), String(junk.entrantOutlay));

  const noName = E.buildTournament(mk(), { entrants: [{ plan: mk() }] }).strategies.find(s => s.isEntrant);
  ok('a nameless entrant gets a fallback name', noName.name === 'Scenario 1', noName.name);
  ok('an empty entrant list changes nothing', E.buildTournament(mk(), { entrants: [] }).strategies.length === 6);
  ok('omitting entrants entirely changes nothing', E.buildTournament(mk()).strategies.length === 6);
}

console.log('\n=== an entrant can be scored and ranked alongside the rest ===');
{
  const saved = mk({ spending: { targetSpend: 60000 } });   // deliberately unaffordable
  const t = E.buildTournament(mk(), { emergencyFloor: 25000, scope: 'full', entrants: [{ id: 's', name: 'Spend more', plan: saved }] });
  const scored = t.strategies.filter(s => !s.candidates).map(s => ({ ...s, stats: E.monteCarlo(s.planState, { trials: 300, seed: 99 }) }));
  const ent = scored.find(s => s.isEntrant);
  const base = scored.find(s => s.id === 'baseline');
  ok('the entrant produces real statistics', Number.isFinite(ent.stats.successRate), `${ent.stats.successRate}%`);
  ok('a much higher spend scores worse than the baseline', ent.stats.successRate < base.stats.successRate,
    `${ent.stats.successRate.toFixed(1)}% vs ${base.stats.successRate.toFixed(1)}%`);
  const best = E.pickBest(scored);
  ok('pickBest ranks across the mixed field without choking', !!best && typeof best.id === 'string', best.id);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
