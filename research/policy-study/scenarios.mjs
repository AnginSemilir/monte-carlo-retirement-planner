/*
 * A library of UK households to test the decumulation policies against.
 *
 * The point is coverage, not realism in any single case: a policy that wins on the four plans we happen
 * to have written by hand has told us nothing about the plans it will actually meet. So the four axes
 * that plausibly change which policy is right are crossed exhaustively -
 *
 *   stage   how far from drawdown, which decides whether a pre-access bridge exists at all
 *   mix     where the money sits, which is the whole subject of a decumulation policy
 *   wealth  the absolute level, which decides where the household sits in the tax bands
 *   spend   withdrawal intensity, which decides whether tax efficiency or survival dominates
 *
 * - and the secondary axes (household shape, one-off flows, employment, tax region) are cycled across
 * the resulting index so each appears across the whole of the primary space rather than clustering.
 *
 * Spend is set as a fraction of the pot AT RETIREMENT, not today. A £180k pot 28 years from drawdown and
 * a £180k pot already in drawdown are not the same household, and pinning both to the same cash spend
 * would make the far-off ones trivially safe and tell us nothing.
 */
import * as E from '../engine.mjs';

const GIA = 'Other Investments (e.g. GIA)';
// Keys are the engine's own category keys, not friendly names: an account whose id does not match
// `${cat}_${owner}` is silently dropped, which quietly deletes a chunk of the household's wealth.
const CATS = { pen: 'Pensions', isa: 'S&S ISAs', other: GIA, cash: 'Cash Savings' };
const RISK = { pen: 'High Risk', isa: 'Medium/High Risk', other: 'Medium Risk', cash: 'Cash Equivalents' };

// --- primary axes -------------------------------------------------------------------------------
const STAGES = [
  { key: 'in-drawdown',   age: 68, retire: 66, terminal: 95, salary: 0,      note: 'already retired, state pension running' },
  { key: 'just-retired',  age: 61, retire: 60, terminal: 96, salary: 0,      note: 'just stopped, seven years to state pension' },
  { key: 'early-bridge',  age: 56, retire: 55, terminal: 95, salary: 0,      note: 'retired before pension access: a live bridge' },
  { key: 'near',          age: 55, retire: 60, terminal: 95, salary: 62000,  note: 'five years out, still contributing' },
  { key: 'mid',           age: 45, retire: 60, terminal: 96, salary: 68000,  note: 'mid-career' },
  { key: 'far',           age: 37, retire: 65, terminal: 97, salary: 54000,  note: 'decades out' }
];

const MIXES = [
  { key: 'pension-heavy', w: { pen: 0.85, isa: 0.08, other: 0.02, cash: 0.05 } },
  { key: 'isa-heavy',     w: { pen: 0.25, isa: 0.60, other: 0.05, cash: 0.10 } },
  { key: 'gia-heavy',     w: { pen: 0.30, isa: 0.15, other: 0.45, cash: 0.10 } },
  { key: 'balanced',      w: { pen: 0.50, isa: 0.30, other: 0.10, cash: 0.10 } },
  { key: 'cash-heavy',    w: { pen: 0.35, isa: 0.15, other: 0.05, cash: 0.45 } }
];

const WEALTH = [
  { key: 'lean',        total: 180000,  salaryMul: 0.55 },
  { key: 'modest',      total: 450000,  salaryMul: 0.85 },
  { key: 'comfortable', total: 950000,  salaryMul: 1.25 },
  { key: 'wealthy',     total: 2400000, salaryMul: 2.30 }
];

// withdrawal intensity, as a share of the pot at the point drawdown starts
const SPENDS = [
  { key: 'light',    rate: 0.030 },
  { key: 'moderate', rate: 0.042 },
  { key: 'heavy',    rate: 0.055 }
];

// --- secondary axes, cycled ---------------------------------------------------------------------
const HOUSEHOLDS = ['single', 'couple'];
const FLOWS = ['none', 'cost-early', 'deposit-mid', 'both'];
const EMPLOY = ['employed', 'self-employed'];
const REGIONS = ['ruk', 'ruk', 'scotland'];   // Scotland every third, so it is present but not dominant

/*
 * A minimum bequest, on some households and not others. It matters to the policy question specifically:
 * without a floor, whatever is left at the end is only a tie-break, so a policy can win by keeping the
 * household barely solvent. With one, the pot at the end becomes a hard survival constraint, and a policy
 * that preserves wealth can win outright rather than on a tie. Both regimes need to be in the library or
 * the study only measures one of them. Sized off the household's own wealth, not a flat figure - £250k is
 * a rounding error to one of these households and unreachable for another.
 */
const BEQUESTS = [
  { key: 'none',   share: 0 },
  { key: 'none',   share: 0 },
  { key: 'modest', share: 0.20 },
  { key: 'none',   share: 0 },
  { key: 'large',  share: 0.45 }
];

const acct = (owner, cat, balance, contrib) => ({
  id: `${cat}_${owner === 'Partner' ? 'part' : 'self'}`,
  owner, category: CATS[cat], balance: Math.round(balance), contrib: Math.round(contrib),
  growth: 3, risk: RISK[cat]
});

function build({ stage, mix, wealth, spend, household, flow, employ, region, bequest }, idx) {
  const isCouple = household === 'couple';
  const working = stage.salary > 0;
  const salary = working ? Math.round(stage.salary * wealth.salaryMul / 500) * 500 : 0;
  // a couple holds the same total, split 60/40, with the partner three years younger
  const selfShare = isCouple ? 0.60 : 1;
  const accounts = [];
  Object.entries(mix.w).forEach(([cat, w]) => {
    const bal = wealth.total * w;
    // contributions only while working: 12% of salary into pension, 6% into ISA, nothing elsewhere
    const contribSelf = !working ? 0 : cat === 'pen' ? salary * 0.12 : cat === 'isa' ? salary * 0.06 : 0;
    accounts.push(acct('Myself', cat, bal * selfShare, contribSelf));
    if (isCouple) accounts.push(acct('Partner', cat, bal * (1 - selfShare), contribSelf * 0.6));
  });

  const baseYear = 2026;
  const oneOffCosts = [], oneOffContributions = [];
  if (flow === 'cost-early' || flow === 'both') {
    // a real, dateable expense early enough to bite: roof, car, a parent's care top-up
    oneOffCosts.push({ id: 'c1', date: `${baseYear + 3}-06-01`, year: baseYear + 3, owner: 'Myself', amount: Math.round(wealth.total * 0.06), desc: 'Major repair / care cost' });
  }
  if (flow === 'deposit-mid' || flow === 'both') {
    /*
     * An inheritance, left UNASSIGNED so that whichever policy is under test gets to route it. A
     * household receiving £120k rarely has a considered view on which wrapper it should sit in, which
     * is exactly why the choice is worth testing as policy rather than assuming the GIA.
     */
    const yr = baseYear + Math.max(4, Math.round((stage.retire - stage.age) / 2) + 4);
    oneOffContributions.push({ id: 'd1', date: `${yr}-03-01`, year: yr, owner: 'Myself', category: E.AUTO_DEPOSIT, amount: Math.round(wealth.total * 0.18), desc: 'Inheritance', transferredFrom: 'External' });
  }

  const draft = {
    demographics: {
      planningMode: isCouple ? 'couple' : 'single',
      currentAgeSelf: stage.age, retireAgeSelf: stage.retire,
      currentAgePart: isCouple ? stage.age - 3 : '', retireAgePart: isCouple ? stage.retire : '',
      salarySelf: salary, salaryPart: isCouple ? Math.round(salary * 0.65 / 500) * 500 : '',
      employmentSelf: working ? employ : 'employed',
      employmentPart: isCouple && working ? 'employed' : 'employed',
      statePensionAge: 68, privatePensionAge: 58,
      // a full new state pension for the comfortable and up, a partial record below that
      statePensionSelf: wealth.key === 'lean' ? 8200 : wealth.key === 'modest' ? 10400 : 11976,
      statePensionPart: isCouple ? (wealth.key === 'lean' ? 6800 : 9800) : '',
      terminalAge: stage.terminal
    },
    spending: { targetSpend: 30000, spendBands: [], drawdownStrategy: 'Phased Drawdown', decumulationPolicy: 'Bracket Fill Basic' },
    accounts, otherIncomes: [], oneOffContributions, oneOffCosts,
    config: {
      valuationDate: `${baseYear}-01-01`, taxRegion: region,
      solvencyFloor: Math.round(wealth.total * bequest.share / 5000) * 5000
    }
  };

  /*
   * Set the spend off the pot the plan actually reaches at drawdown. One deterministic run answers that,
   * and the run has to happen with SOME spend in place or the contribution and tax machinery differs -
   * so the draft above carries a placeholder that this immediately overwrites.
   */
  const ctx = E.buildContext(draft);
  const rows = E.simulateDeterministic(ctx, 'expected');
  const atRetire = rows.find(r => r.ageSelf >= stage.retire) || rows[rows.length - 1];
  const potAtRetire = Math.max(50000, atRetire.totalCombined);
  draft.spending.targetSpend = Math.round(potAtRetire * spend.rate / 500) * 500;

  return {
    id: `S${String(idx).padStart(3, '0')}`,
    name: `${stage.key}/${mix.key}/${wealth.key}/${spend.key}`,
    tags: { stage: stage.key, mix: mix.key, wealth: wealth.key, spend: spend.key, household, flow, employ: working ? employ : 'retired', region, bequest: bequest.key },
    solvencyFloor: Math.round(wealth.total * bequest.share / 5000) * 5000,
    potAtRetire: Math.round(potAtRetire),
    targetSpend: draft.spending.targetSpend,
    plan: E.normalizePlan(draft)
  };
}

export function buildScenarios() {
  const out = [];
  let i = 0;
  for (const stage of STAGES) for (const mix of MIXES) for (const wealth of WEALTH) for (const spend of SPENDS) {
    out.push(build({
      stage, mix, wealth, spend,
      household: HOUSEHOLDS[i % HOUSEHOLDS.length],
      flow: FLOWS[i % FLOWS.length],
      employ: EMPLOY[Math.floor(i / 3) % EMPLOY.length],
      region: REGIONS[i % REGIONS.length],
      bequest: BEQUESTS[i % BEQUESTS.length]
    }, i));
    i++;
  }
  return out;
}

export const AXES = { STAGES, MIXES, WEALTH, SPENDS, HOUSEHOLDS, FLOWS, EMPLOY, REGIONS, BEQUESTS };
