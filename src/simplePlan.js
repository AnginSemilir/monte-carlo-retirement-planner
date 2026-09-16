/*
 * THE SMALL PLAN SHAPE, AND THE ADAPTER UP INTO THE ENGINE'S FULL ONE.
 *
 * The streamlined page holds about a dozen fields. The engine expects sixty-odd. Rather than let the
 * page inherit all of them - which is how a simple page stops being simple - it keeps its own shape and
 * normalises up through one function here.
 *
 * Everything the full app asks for and this page does not is left at the engine's own default: salary,
 * contributions, employment, risk profiles, return assumptions, the decumulation policy. That is the
 * whole point of the page - the pot is what it is today, and nothing is being paid in.
 */
import { normalizePlan, AUTO_DEPOSIT } from './App.jsx';

export const SIMPLE_BLANK = {
  couple: false,
  ageSelf: '', retireSelf: '',
  agePart: '', retirePart: '',
  terminalAge: 95,
  spend: '',
  salary: '', salaryPart: '',
  // contributions a year until the retirement date. The pension one may be a % of salary instead.
  penC: '', isaC: '', giaC: '', cashC: '',
  penCPart: '', isaCPart: '', giaCPart: '', cashCPart: '',
  // and a yearly increase on each contribution, as a percent - the engine's own account `growth`
  penG: '', isaG: '', giaG: '', cashG: '',
  penGPart: '', isaGPart: '', giaGPart: '', cashGPart: '',
  penCIsPct: false, penCIsPctPart: false,
  taperPct: '',        // % a year that spending eases once the taper starts; blank means flat
  taperFromAge: '',
  region: 'ruk',
  // Left blank and SUGGESTED in the field instead - see BLANK_PLAN in App.jsx. The full new State Pension
  // is the right prompt, but entitlement varies with the NI record, so it belongs in a placeholder rather
  // than typed into somebody's plan on their behalf.
  statePensionSelf: '', statePensionPart: '',
  // balances only. There are no contributions on this page, by design.
  pen: '', isa: '', gia: '', cash: '',
  penPart: '', isaPart: '', giaPart: '', cashPart: '',
  // risk per wrapper, same levels the full app offers
  penRisk: 'High Risk', isaRisk: 'High Risk', giaRisk: 'Medium Risk', cashRisk: 'Cash Equivalents',
  penPartRisk: 'High Risk', isaPartRisk: 'High Risk', giaPartRisk: 'Medium Risk', cashPartRisk: 'Cash Equivalents',
  oneOffs: [],         // { id, date, amount, direction: 'in' | 'out' }
  earnings: []         // { id, amount, startAge, endAge, owner } - work after the retirement date
};

export const oneOffId = () => `o_${Math.random().toString(36).slice(2, 10)}`;
export const earningId = () => `e_${Math.random().toString(36).slice(2, 10)}`;

const n = (v) => { const x = Number(v); return Number.isFinite(x) ? x : 0; };

/*
 * The one-off list is one row type covering deposits, withdrawals and a lump of income, because that is
 * how people think about them - "£40,000 arrives in 2031", "£25,000 goes out for the roof". The engine
 * keeps the two in separate arrays, so the split happens here rather than in the page's head.
 *
 * A deposit's destination is AUTO, which hands the choice to the same routing the full app uses instead
 * of asking a wrapper question this page exists not to ask.
 */
const splitOneOffs = (rows) => {
  const ins = [], outs = [];
  for (const r of rows || []) {
    const amount = Math.abs(n(r.amount));
    if (!(amount > 0) || !r.date) continue;
    if (r.direction === 'out') outs.push({ id: r.id, date: r.date, owner: 'Myself', amount, desc: r.desc || '' });
    else ins.push({ id: r.id, date: r.date, owner: 'Myself', amount, desc: r.desc || '', stagedTargetWrapper: AUTO_DEPOSIT });
  }
  return { ins, outs };
};

/*
 * THE SPENDING TAPER: ONE STEP DOWN, THEN FLAT.
 *
 * Most people do not spend a flat figure for thirty years - spending typically eases as travel and the
 * second car go. The page models that as a single cut at an age you choose, held for the rest of the
 * plan: spend £38,000 until 75, then £34,200 from 75 on.
 *
 * It was a compounding decline, a percent off every year, and one step is the better model of the two
 * for this page. A compounding taper is very sensitive to an input nobody can calibrate - 1% a year
 * versus 2% is a 20% difference in spending by 95, and no household knows which of those they are. One
 * cut at one age is a claim somebody can actually check against their own intentions.
 *
 * The engine takes spendBands: flat amounts over age ranges, first match wins. So this is now one band.
 */
function taperBands(s) {
  const pct = n(s.taperPct), from = n(s.taperFromAge), spend = n(s.spend);
  const terminal = n(s.terminalAge) || 95;
  if (!(pct > 0) || !(from > 0) || !(spend > 0) || from > terminal) return [];
  return [{ fromAge: Math.ceil(from), toAge: terminal, amount: Math.round(spend * (1 - pct / 100)) }];
}

/*
 * The pension contribution, in pounds, however it was entered.
 *
 * Separate from the yearly increase beside it: the amount is what goes in THIS year, the increase is how
 * much more goes in each year after. The engine applies the second to the first through the account's
 * own `growth` field, so neither needs expanding into a per-year table here.
 *
 * A percentage is how almost everyone knows their own pension contribution - it is what the payslip and
 * the scheme booklet both use - so the page takes it that way and converts here. It is a percent OF
 * SALARY, which is the only base that makes the figure mean what people expect, and it therefore needs a
 * salary to resolve against: with none entered the percentage has nothing to bite on and comes out zero.
 * The UI says so rather than letting a typed 8% quietly contribute nothing.
 */
function pensionContrib(s, isPartner) {
  const pct = isPartner ? s.penCIsPctPart : s.penCIsPct;
  const raw = isPartner ? s.penCPart : s.penC;
  if (!pct) return raw === '' || raw == null ? '' : n(raw);
  const salary = n(isPartner ? s.salaryPart : s.salary);
  return salary > 0 ? Math.round(salary * n(raw) / 100) : '';
}

export function toFullPlan(s) {
  const { ins, outs } = splitOneOffs(s.oneOffs);
  const couple = !!s.couple;
  const bal = (v) => (v === '' || v == null ? '' : n(v));
  return normalizePlan({
    demographics: {
      planningMode: couple ? 'couple' : 'single',
      currentAgeSelf: s.ageSelf, retireAgeSelf: s.retireSelf,
      currentAgePart: couple ? s.agePart : '', retireAgePart: couple ? s.retirePart : '',
      terminalAge: s.terminalAge,
      statePensionSelf: s.statePensionSelf,
      statePensionPart: couple ? s.statePensionPart : '',
      salarySelf: s.salary, salaryPart: couple ? s.salaryPart : ''
    },
    spending: { targetSpend: s.spend, spendBands: taperBands(s) },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: bal(s.pen), contrib: pensionContrib(s, false), growth: bal(s.penG), risk: s.penRisk },
      { id: 'isa_self', owner: 'Myself', category: 'ISAs', balance: bal(s.isa), contrib: bal(s.isaC), growth: bal(s.isaG), risk: s.isaRisk },
      { id: 'other_self', owner: 'Myself', category: 'General Investments', balance: bal(s.gia), contrib: bal(s.giaC), growth: bal(s.giaG), risk: s.giaRisk },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: bal(s.cash), contrib: bal(s.cashC), growth: bal(s.cashG), risk: s.cashRisk },
      ...(couple ? [
        { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: bal(s.penPart), contrib: pensionContrib(s, true), growth: bal(s.penGPart), risk: s.penPartRisk },
        { id: 'isa_part', owner: 'Partner', category: 'ISAs', balance: bal(s.isaPart), contrib: bal(s.isaCPart), growth: bal(s.isaGPart), risk: s.isaPartRisk },
        { id: 'other_part', owner: 'Partner', category: 'General Investments', balance: bal(s.giaPart), contrib: bal(s.giaCPart), growth: bal(s.giaGPart), risk: s.giaPartRisk },
        { id: 'cash_part', owner: 'Partner', category: 'Cash Savings', balance: bal(s.cashPart), contrib: bal(s.cashCPart), growth: bal(s.cashGPart), risk: s.cashPartRisk }
      ] : [])
    ],
    oneOffContributions: ins,
    oneOffCosts: outs,
    /*
     * Work after the retirement date, as relevant earnings. It goes through otherIncomes rather than the
     * salary fields because salary stops AT the retirement age by definition - this is the consultancy
     * day rate or the two days a week that carries on past it, which is a different thing and taxed as
     * earnings in its own right.
     */
    otherIncomes: (s.earnings || []).filter(e => n(e.amount) > 0 && e.startAge !== '').map(e => ({
      id: e.id, incomeType: 'earnings', amount: n(e.amount),
      owner: couple && e.owner === 'Partner' ? 'Partner' : 'Myself',
      startAge: e.startAge, endAge: e.endAge === '' ? '' : e.endAge
    })),
    config: { taxRegion: s.region }
  });
}

/*
 * Enough to answer with, rather than enough to be complete. The page shows its figures the moment these
 * hold, and says what is missing until they do - it does not gate behind a form.
 */
export function readiness(s) {
  const missing = [];
  if (!(n(s.ageSelf) > 0)) missing.push('your age');
  if (!(n(s.retireSelf) > 0)) missing.push('when you stop working');
  if (!(n(s.spend) > 0)) missing.push('what you want to spend');
  const pot = n(s.pen) + n(s.isa) + n(s.gia) + n(s.cash) +
    (s.couple ? n(s.penPart) + n(s.isaPart) + n(s.giaPart) + n(s.cashPart) : 0);
  if (!(pot > 0)) missing.push('what you have saved');
  return { ready: missing.length === 0, missing, pot };
}

/*
 * THE ADAPTER BACK DOWN: A FULL PLAN INTO THE SMALL SHAPE.
 *
 * `toFullPlan` widens; this narrows, so that switching between the two pages carries what you typed
 * instead of handing you an empty form. The two are NOT inverses and cannot be: the full planner holds
 * things the small page has nowhere to put, and the honest response is to carry what maps and SAY what
 * did not, rather than to drop it silently or to refuse the whole switch.
 *
 * What maps exactly: ages, retirement ages, terminal age, spend, salaries, state pensions, tax region,
 * and all eight wrapper accounts - balance, contribution, escalation and risk. The account set is the
 * same four categories by two owners on both sides, so no balance is ever lost in this direction.
 *
 * What is approximated: the spending taper. The engine takes any number of bands over age ranges; the
 * small page models one step down at one age. A single band that starts below the terminal age and cuts
 * spending becomes that step. Anything more elaborate is reported as dropped rather than flattened into
 * a shape that would quietly mean something different.
 *
 * Returns { simple, dropped } - `dropped` being plain-English lines for the UI to show. A caller that
 * ignores it is lying to the user by omission, which is why it is returned rather than logged.
 */
export function fromFullPlan(plan, base = SIMPLE_BLANK) {
  const p = normalizePlan(plan);
  const d = p.demographics || {}, sp = p.spending || {}, cfg = p.config || {};
  const couple = d.planningMode === 'couple';
  const acc = (id) => (p.accounts || []).find(a => a.id === id) || {};
  const val = (v) => (v === '' || v == null ? '' : Number(v));
  const dropped = [];

  const ins = (p.oneOffContributions || []).map(o => ({ id: o.id || oneOffId(), date: o.date, amount: Math.abs(n(o.amount)), direction: 'in', desc: o.desc || '' }));
  const outs = (p.oneOffCosts || []).map(o => ({ id: o.id || oneOffId(), date: o.date, amount: Math.abs(n(o.amount)), direction: 'out', desc: o.desc || '' }));
  // the taper: one band that cuts spending from an age is the shape this page has
  let taperPct = '', taperFromAge = '';
  const bands = (sp.spendBands || []).filter(b => Number(b.amount) > 0);
  const spend = Number(sp.targetSpend) || 0;
  if (bands.length === 1 && spend > 0 && Number(bands[0].amount) < spend) {
    taperPct = Math.round((1 - Number(bands[0].amount) / spend) * 1000) / 10;
    taperFromAge = bands[0].fromAge;
  } else if (bands.length) {
    dropped.push(`${bands.length} spending band${bands.length === 1 ? '' : 's'} — the simple page has one step down at one age, so these stay in the full planner`);
  }

  // earnings after the retirement date carry; every other income type has nowhere to go
  const incomes = p.otherIncomes || [];
  const earnings = incomes.filter(i => i.incomeType === 'earnings');
  const otherKinds = incomes.length - earnings.length;
  if (otherKinds > 0) dropped.push(`${otherKinds} income stream${otherKinds === 1 ? '' : 's'} that are not earnings (a DB pension, an annuity, rent and so on)`);

  /*
   * A deposit's DESTINATION cannot survive, and cannot be detected either. normalizePlan resolves the
   * auto setting into whatever wrapper the policy picked, so by the time any saved plan is read back, a
   * deposit the user left on auto is indistinguishable from one they routed by hand. Rather than guess -
   * a check against AUTO_DEPOSIT fires on every plan, including ones that came from the simple page in
   * the first place - this says what is true whenever there are deposits at all: over there, the policy
   * chooses. AUTO_DEPOSIT stays imported because toFullPlan sets it on the way up.
   */
  if (ins.length) dropped.push(`where ${ins.length === 1 ? 'a one-off deposit lands' : `${ins.length} one-off deposits land`} — the simple page always lets the policy choose the wrapper`);

  if ((p.accounts || []).some(a => Array.isArray(a.contribByYear) && a.contribByYear.length))
    dropped.push('per-year contribution schedules — the simple page takes one figure and a yearly increase');
  if (d.salaryGrowthSelf || d.salaryGrowthPart) dropped.push('real salary growth');
  if (d.employmentSelf === 'self-employed' || d.employmentPart === 'self-employed') dropped.push('self-employed status, which changes National Insurance');
  // An edited return matrix is what CLEARS riskSource; `riskProfiles` is always present, so testing it
  // reported an edit on every plan ever made.
  if (!p.riskSource) dropped.push('your edits to the return matrix');
  dropped.push('the decumulation policy, the seed and the rest of Config — the simple page picks the policy for you');

  const wrap = (cat, owner) => {
    const a = acc(`${cat}_${owner}`);
    return { balance: val(a.balance), contrib: val(a.contrib), growth: val(a.growth), risk: a.risk };
  };
  const me = { pen: wrap('pen', 'self'), isa: wrap('isa', 'self'), gia: wrap('other', 'self'), cash: wrap('cash', 'self') };
  const pt = { pen: wrap('pen', 'part'), isa: wrap('isa', 'part'), gia: wrap('other', 'part'), cash: wrap('cash', 'part') };

  return {
    dropped,
    simple: {
      ...base,
      couple,
      ageSelf: val(d.currentAgeSelf), retireSelf: val(d.retireAgeSelf),
      agePart: couple ? val(d.currentAgePart) : '', retirePart: couple ? val(d.retireAgePart) : '',
      terminalAge: val(d.terminalAge) || 95,
      spend: val(sp.targetSpend),
      salary: val(d.salarySelf), salaryPart: couple ? val(d.salaryPart) : '',
      statePensionSelf: val(d.statePensionSelf), statePensionPart: couple ? val(d.statePensionPart) : '',
      region: cfg.taxRegion || 'ruk',
      taperPct, taperFromAge,
      // a pension contribution arrives in pounds, so the percent-of-salary switch goes off
      penCIsPct: false, penCIsPctPart: false,
      pen: me.pen.balance, isa: me.isa.balance, gia: me.gia.balance, cash: me.cash.balance,
      penC: me.pen.contrib, isaC: me.isa.contrib, giaC: me.gia.contrib, cashC: me.cash.contrib,
      penG: me.pen.growth, isaG: me.isa.growth, giaG: me.gia.growth, cashG: me.cash.growth,
      penRisk: me.pen.risk || base.penRisk, isaRisk: me.isa.risk || base.isaRisk,
      giaRisk: me.gia.risk || base.giaRisk, cashRisk: me.cash.risk || base.cashRisk,
      penPart: pt.pen.balance, isaPart: pt.isa.balance, giaPart: pt.gia.balance, cashPart: pt.cash.balance,
      penCPart: pt.pen.contrib, isaCPart: pt.isa.contrib, giaCPart: pt.gia.contrib, cashCPart: pt.cash.contrib,
      penGPart: pt.pen.growth, isaGPart: pt.isa.growth, giaGPart: pt.gia.growth, cashGPart: pt.cash.growth,
      penPartRisk: pt.pen.risk || base.penPartRisk, isaPartRisk: pt.isa.risk || base.isaPartRisk,
      giaPartRisk: pt.gia.risk || base.giaPartRisk, cashPartRisk: pt.cash.risk || base.cashPartRisk,
      oneOffs: [...ins, ...outs].filter(o => o.date && o.amount > 0),
      earnings: earnings.map(e => ({ id: e.id || earningId(), amount: n(e.amount), startAge: e.startAge, endAge: e.endAge === '' || e.endAge == null ? '' : e.endAge, owner: e.owner === 'Partner' ? 'Partner' : 'Myself' }))
    }
  };
}

/*
 * Has anything actually been typed? The switch only carries a plan across when there is one to carry:
 * writing a blank over the other page's saved work would be the worst possible outcome of a button that
 * promises not to make you re-enter anything.
 */
export function simpleHasInput(s) {
  if (!s) return false;
  const keys = ['ageSelf', 'retireSelf', 'spend', 'pen', 'isa', 'gia', 'cash', 'penPart', 'isaPart', 'giaPart', 'cashPart', 'salary'];
  return keys.some(k => n(s[k]) > 0) || (s.oneOffs || []).length > 0 || (s.earnings || []).length > 0;
}
