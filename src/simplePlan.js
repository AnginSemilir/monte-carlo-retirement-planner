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
  taperPct: '',        // % a year that spending eases once the taper starts; blank means flat
  taperFromAge: '',
  region: 'ruk',
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
 * THE SPENDING TAPER, AS ONE BAND PER YEAR.
 *
 * Most people do not spend a flat figure for thirty years. Spending typically eases through the
 * seventies as travel and the second car go, before care costs can push it back up - the "retirement
 * smile". The page asks for the falling half of that in two numbers, a percent a year and an age to
 * start, because that is the part almost everyone recognises and the part that moves the answer.
 *
 * The engine takes spendBands: flat amounts over age ranges, first match wins. A smooth decline is
 * therefore expanded here into one band per year, each a compounding step below the last. It is more
 * rows than a taper field would be, but it needs no engine change and it reuses a path the full app
 * already exercises - so the two agree on the same inputs, which is the property this page is built on.
 */
function taperBands(s) {
  const pct = n(s.taperPct), from = n(s.taperFromAge), spend = n(s.spend);
  const terminal = n(s.terminalAge) || 95;
  if (!(pct > 0) || !(from > 0) || !(spend > 0) || from > terminal) return [];
  const bands = [];
  for (let age = Math.ceil(from), k = 1; age <= terminal; age++, k++) {
    bands.push({ fromAge: age, toAge: age, amount: Math.round(spend * Math.pow(1 - pct / 100, k)) });
  }
  return bands;
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
      // no salary and no employment: the page does not ask, so nothing is earned and nothing is paid in
      salarySelf: '', salaryPart: ''
    },
    spending: { targetSpend: s.spend, spendBands: taperBands(s) },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: bal(s.pen), contrib: '', risk: s.penRisk },
      { id: 'isa_self', owner: 'Myself', category: 'ISAs', balance: bal(s.isa), contrib: '', risk: s.isaRisk },
      { id: 'other_self', owner: 'Myself', category: 'General Investments', balance: bal(s.gia), contrib: '', risk: s.giaRisk },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: bal(s.cash), contrib: '', risk: s.cashRisk },
      ...(couple ? [
        { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: bal(s.penPart), contrib: '', risk: s.penPartRisk },
        { id: 'isa_part', owner: 'Partner', category: 'ISAs', balance: bal(s.isaPart), contrib: '', risk: s.isaPartRisk },
        { id: 'other_part', owner: 'Partner', category: 'General Investments', balance: bal(s.giaPart), contrib: '', risk: s.giaPartRisk },
        { id: 'cash_part', owner: 'Partner', category: 'Cash Savings', balance: bal(s.cashPart), contrib: '', risk: s.cashPartRisk }
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
