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
  region: 'ruk',
  statePensionSelf: '', statePensionPart: '',
  // balances only. There are no contributions on this page, by design.
  pen: '', isa: '', gia: '', cash: '',
  penPart: '', isaPart: '', giaPart: '', cashPart: '',
  oneOffs: []          // { id, date, amount, direction: 'in' | 'out' }
};

export const oneOffId = () => `o_${Math.random().toString(36).slice(2, 10)}`;

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
    spending: { targetSpend: s.spend },
    accounts: [
      { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: bal(s.pen), contrib: '' },
      { id: 'isa_self', owner: 'Myself', category: 'ISAs', balance: bal(s.isa), contrib: '' },
      { id: 'other_self', owner: 'Myself', category: 'General Investments', balance: bal(s.gia), contrib: '' },
      { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: bal(s.cash), contrib: '' },
      ...(couple ? [
        { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: bal(s.penPart), contrib: '' },
        { id: 'isa_part', owner: 'Partner', category: 'ISAs', balance: bal(s.isaPart), contrib: '' },
        { id: 'other_part', owner: 'Partner', category: 'General Investments', balance: bal(s.giaPart), contrib: '' },
        { id: 'cash_part', owner: 'Partner', category: 'Cash Savings', balance: bal(s.cashPart), contrib: '' }
      ] : [])
    ],
    oneOffContributions: ins,
    oneOffCosts: outs,
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
