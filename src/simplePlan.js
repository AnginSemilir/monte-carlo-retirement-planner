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
  penCIsPct: false, penCIsPctPart: false,
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
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: bal(s.pen), contrib: pensionContrib(s, false), risk: s.penRisk },
      { id: 'isa_self', owner: 'Myself', category: 'ISAs', balance: bal(s.isa), contrib: bal(s.isaC), risk: s.isaRisk },
      { id: 'other_self', owner: 'Myself', category: 'General Investments', balance: bal(s.gia), contrib: bal(s.giaC), risk: s.giaRisk },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: bal(s.cash), contrib: bal(s.cashC), risk: s.cashRisk },
      ...(couple ? [
        { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: bal(s.penPart), contrib: pensionContrib(s, true), risk: s.penPartRisk },
        { id: 'isa_part', owner: 'Partner', category: 'ISAs', balance: bal(s.isaPart), contrib: bal(s.isaCPart), risk: s.isaPartRisk },
        { id: 'other_part', owner: 'Partner', category: 'General Investments', balance: bal(s.giaPart), contrib: bal(s.giaCPart), risk: s.giaPartRisk },
        { id: 'cash_part', owner: 'Partner', category: 'Cash Savings', balance: bal(s.cashPart), contrib: bal(s.cashCPart), risk: s.cashPartRisk }
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
