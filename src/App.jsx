import React, { useState, useMemo, useRef, useEffect, useCallback, useDeferredValue, lazy, Suspense } from 'react';
/*
 * FOUR FUNCTIONS, NOT THIRTY PACKAGES.
 *
 * `import * as d3 from 'd3'` pulls the meta-package, which re-exports about thirty modules - geo
 * projections, force simulation, chord diagrams, hierarchies, brush, zoom, drag, delimiter parsing,
 * fetch. This app calls exactly four of them, listed below, and a namespace import is the shape a
 * bundler can do least with.
 *
 * Rebuilt as a local object rather than four bare names so the hundred-odd `d3.scaleLinear(...)` call
 * sites did not have to change, and - more to the point - so `line` and `area` do not become bare
 * identifiers in a file that has its own `line` and `area` variables. That would have been a rename with
 * a silent shadowing bug in it.
 */
import { scaleLinear } from 'd3-scale';
import { area, line, curveMonotoneX } from 'd3-shape';
const d3 = { scaleLinear, area, line, curveMonotoneX };
import {
  Layers, Check, Users, Wallet, Coins, Settings, Plus, Trash2, Table, FileSpreadsheet,
  CheckCircle2, AlertTriangle, Pencil, HelpCircle, BookOpen, History, Info, ChevronUp, ChevronDown, Maximize2, Target,
  User, GitBranch
} from 'lucide-react';
import { ThemeToggle } from './theme.jsx';
import { BottomNav } from './nav.jsx';
// `T` at module scope, not a wrapper defined inside the render: a component redeclared every render
// remounts, which would shut a tooltip the moment a worker result came back underneath it.
import { Term as T } from './glossary.jsx';
import { Boundary } from './boundary.jsx';
// step U: the new planner's status strip and its words, in the entry (they show before any solver chunk arrives)
import { PLANNER_PLANT } from './plannerPlant.js';
import { ChartFullscreen, Fine, PhoneCollapse, FieldRow, RiskChips, CollapsedRow, PercentInput, toBody } from './phone.jsx';
import { fieldCls as inputCls, smallFieldCls as smallInputCls, parseTierLabel } from './ui.js';
import { openActionPlan } from './actionPlan.js';
import { MoneyInput } from './numberFormat.jsx';
import { SectionTabs } from './tabs.jsx';
import { useSwipe } from './swipe.js';
import EditMode from './EditMode.jsx';
import { useSolverState } from './solverState.js';
import { coupleSolverOn, PLANT as COUPLES_SWITCH_PLANT } from './couplesSwitch.js';
// ============================================================================================
// Monte-Carlo Retirement Planner v3.4 — single-file build (engine + UI).
// The engine section is framework-free and unit-tested; the UI section starts at "export default function App".
// ============================================================================================
/* =====================================================================================
   Monte-Carlo Retirement Planner — projection engine (pure, framework-free, unit-testable)
   -------------------------------------------------------------------------------------
   Everything in this section is deterministic given its inputs. No React, no DOM, no
   randomness other than the explicitly seeded generator used by the Monte Carlo runner.
   ===================================================================================== */

// ---------------------------------------------------------------- numeric helpers
const num = (v, d = 0) => {
  if (v === '' || v === null || v === undefined || typeof v === 'boolean') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const isBlank = (v) => v === '' || v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v));
const round250 = (v) => Math.round(v / 250) * 250;
/*
 * WHICH WAY ROUND THE SEPARATORS GO, DECIDED IN ONE PLACE.
 *
 * Two conventions, because a plan shared with somebody in Amsterdam or Madrid should not read as a
 * different number to them:
 *
 *   uk   1,234.56   group with a comma, decimal point
 *   eu   1.234,56   group with a point, decimal comma
 *
 * PARSING IS THE EXACT INVERSE OF DISPLAY, and it has to be: under the European convention "1.234" means
 * one thousand two hundred and thirty-four, and under the British one it means one and a bit. A parser
 * that assumed either would read a typed figure as a different number from the one on screen, which is
 * the kind of bug that never announces itself.
 *
 * This lives HERE, in the engine half of the file, rather than beside the input component that uses it,
 * because engine code writes money into its own warnings and policy blurbs - and research/build-engine.py
 * strips every import line when it slices this file for the test suites, so anything the engine calls has
 * to be defined in the slice rather than imported into it.
 *
 * Module state rather than React context: it is a display setting read by a hundred call sites that are
 * not components, and the thing that changes it is the plan's own config, so a change re-renders
 * everything regardless and a context would buy nothing.
 */
const NUMBER_FORMATS = {
  uk: { id: 'uk', locale: 'en-GB', group: ',', decimal: '.', sample: '1,234.56', label: 'Comma for thousands' },
  eu: { id: 'eu', locale: 'de-DE', group: '.', decimal: ',', sample: '1.234,56', label: 'Point for thousands' },
};
const DEFAULT_NUMBER_FORMAT = 'uk';
let activeNumberFormat = NUMBER_FORMATS[DEFAULT_NUMBER_FORMAT];
const setNumberFormat = (id) => { activeNumberFormat = NUMBER_FORMATS[id] || NUMBER_FORMATS[DEFAULT_NUMBER_FORMAT]; };
const numberFormat = () => activeNumberFormat;
/* Every formatted number on the site comes through here, so one setting reaches all of them. */
const fmtNum = (v, opts) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n.toLocaleString(activeNumberFormat.locale, opts) : String(v ?? '');
};
/*
 * Strip the grouping, normalise the decimal, keep at most one of it. A second decimal separator makes
 * Number() return NaN and would wipe a field somebody is halfway through typing, so it is dropped here
 * rather than passed on.
 */
const parseFormatted = (raw) => {
  const s = String(raw ?? '');
  let out = '';
  let seenDecimal = false;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') { out += ch; continue; }
    if (ch === '-' && out === '') { out += ch; continue; }
    if (ch === activeNumberFormat.decimal && !seenDecimal) { out += '.'; seenDecimal = true; }
    // anything else, the group separator included, is display and not value
  }
  return out;
};
/*
 * The display form of a figure somebody is still typing.
 *
 * fmtNum goes through Number(), which cannot carry a half-finished number: "1234." comes back as "1,234"
 * and the decimal mark vanishes from under the caret, "1234.50" loses its trailing zero. So while a field
 * has focus the DIGIT STRING is grouped rather than the value, which means what is shown is always what
 * was typed with the separators added and nothing else changed. parseFormatted is its exact inverse.
 */
const groupDigits = (plain) => {
  const s = String(plain ?? '');
  if (!s) return '';
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const dot = body.indexOf('.');
  const whole = dot === -1 ? body : body.slice(0, dot);
  const frac = dot === -1 ? null : body.slice(dot + 1);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, activeNumberFormat.group);
  return (neg ? '-' : '') + grouped + (frac === null ? '' : activeNumberFormat.decimal + frac);
};
const formatGBP = (v) => fmtNum(Number.isFinite(v) ? v : 0, { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const isPlainObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o);

// ---------------------------------------------------------------- empirical dataset
// Real S&P 500 total return (s) and real 50/50 Govt/Corp bond return (b), % per year.
const HISTORICAL_TUPLES = [
  [1928,45.49,3.22],[1929,-8.83,3.01],[1930,-20.01,9.55],[1931,-38.07,0.22],[1932,1.82,29.49],[1933,48.85,6.6],
  [1934,-2.66,11.7],[1935,42.49,5.73],[1936,30.06,6.66],[1937,-37.13,-4.25],[1938,32.98,9.77],[1939,-1.1,6.2],
  [1940,-11.31,6.27],[1941,-20.65,-7.67],[1942,9.3,-4.86],[1943,21.47,2.24],[1944,16.36,2.22],[1945,32.84,2.99],
  [1946,-22.48,-12.96],[1947,-3.34,-7.58],[1948,2.63,-0.29],[1949,20.81,7.25],[1950,23.48,-3.4],[1951,16.68,-5.89],
  [1952,17.27,2.58],[1953,-1.94,2.12],[1954,53.71,5.51],[1955,32.1,-0.02],[1956,4.33,-5.14],[1957,-12.98,0.14],
  [1958,41.23,0.4],[1959,10.15,-2.23],[1960,-1.01,7.69],[1961,25.79,2.89],[1962,-10.01,4.7],[1963,20.63,1.9],
  [1964,15.3,3.44],[1965,10.28,0.03],[1966,-12.98,-3.6],[1967,20.15,-3.28],[1968,5.82,-0.63],[1969,-13.6,-9.15],
  [1970,-1.9,5.33],[1971,10.61,8.35],[1972,14.84,3.59],[1973,-21.17,-4.34],[1974,-34.04,-12.05],[1975,28.11,0.37],
  [1976,18.09,12.4],[1977,-12.82,-1.01],[1978,-2.3,-7.19],[1979,4.61,-12.32],[1980,17.08,-13.93],[1981,-12.51,-0.54],
  [1982,15.98,26.1],[1983,17.87,5.69],[1984,2.11,10.32],[1985,26.43,20.22],[1986,17.21,21.55],[1987,1.32,-5.52],
  [1988,11.6,6.94],[1989,25.64,11.56],[1990,-8.64,0.08],[1991,26.36,12.97],[1992,4.46,7.64],[1993,7.03,12.24],
  [1994,-1.31,-7.16],[1995,33.8,18.8],[1996,18.74,-0.21],[1997,30.88,9.03],[1998,26.3,9.67],[1999,17.72,-6.22],
  [2000,-12.01,9.29],[2001,-13.2,5.07],[2002,-23.78,11.01],[2003,25.99,4.98],[2004,7.25,3.81],[2005,1.37,0.46],
  [2006,12.75,1.92],[2007,1.35,2.5],[2008,-36.61,7.42],[2009,22.6,3.3],[2010,13.13,6.81],[2011,-0.84,11.02],
  [2012,13.91,4.72],[2013,30.19,-6.48],[2014,12.67,9.74],[2015,0.64,-0.43],[2016,9.5,3.38],[2017,19.09,4.07],
  [2018,-6.02,-3.24],[2019,28.28,9.97],[2020,16.44,9.38],[2021,19.95,-8.26],[2022,-22.96,-21.22],[2023,22.2,3.73],
  [2024,21.51,0.98],[2025,14.78,2.86]
];
const HISTORICAL_DATA = HISTORICAL_TUPLES.map(d => ({ y: d[0], s: d[1], b: d[2] }));
const HISTORICAL_MAP = new Map(HISTORICAL_DATA.map(d => [d.y, d]));
const HISTORICAL_FIRST_YEAR = HISTORICAL_DATA[0].y;
const HISTORICAL_LAST_YEAR = HISTORICAL_DATA[HISTORICAL_DATA.length - 1].y;
const getHistoricalPoint = (startYear, t) => HISTORICAL_MAP.get(num(startYear, 0) + t) || null;

// Equity weight used to blend the historical stock/bond series for each risk tier.
const RISK_EQUITY_WEIGHTS = {
  'High Risk': 0.90, 'Medium/High Risk': 0.70, 'Medium Risk': 0.50,
  'Medium/Low Risk': 0.30, 'Low Risk': 0.10, 'Cash Equivalents': 0.00
};
// research/tests/household-risks.test.mjs only (buildContext's ladders): 'noladderadd' adds none of the household's tiers;
// 'ladderinsert' puts them among a person's own tiers, before their riskier ones, so the person's own indices move
const LADDER_PLANT = { rule: '' };
/*
 * HOW AN EMPLOYEE PAYS INTO THEIR PENSION (D154 (3)): research/tests/pension-route.test.mjs's plants, never set by the page:
 * 'ignored' every employee priced as a sacrificer (the code before), 'unsure' not sure priced as salary sacrifice, 'allnet'
 * salary sacrifice priced as net pay, 'nowarn' the pass-through's warning for a net-pay employee dropped, 'enginepay' the
 * engine's taxable pay priced by the NIC class, 'classic' the classic planner's contribution strategies priced by it.
 */
const ROUTE_PLANT = { rule: '' };
/*
 * How a person pays into their pension, from the employment type's answer (D154 (3)): the self-employed, and an employee
 * paying from net pay or by relief at source ('employed-net') or not sure how ('employed-unsure', the cautious reading), are
 * relieved of income tax alone with no employer NIC passed through (true); an employee by salary sacrifice ('employed', the
 * default and the app's assumption until now, and any answer the app does not know) of income tax and NIC (false).
 * Relief at source is priced as net pay: the pension is credited the gross contribution and the take-home pays it less the
 * income tax it saves. For a low earner that can lean either way (the second look on D154 (3), MINOR 2): where the pay less
 * the contribution falls below the personal allowance, relief at source still gives its basic-rate relief, which this does
 * not (net pay gives none there); but this also takes the contribution off the pay that the personal allowance and the
 * starting rate for savings are set against, where relief at source leaves the pay whole and widens the bands instead, so
 * savings interest can be taxed less than relief at source would tax it. Under either route the pension figure, entered
 * gross with the employer's part included, is priced as the employee's own contribution.
 */
function reliefTaxOnlyOf(emp) {
  if (emp === 'self-employed') return true;
  if (ROUTE_PLANT.rule === 'ignored') return false;
  if (emp === 'employed-net') return true;
  if (emp === 'employed-unsure') return ROUTE_PLANT.rule !== 'unsure';
  return ROUTE_PLANT.rule === 'allnet';
}
/* the classic planner's contribution strategies read the route as the engine does (ROUTE_PLANT 'classic': the NIC class) */
const strategyRelief = o => (ROUTE_PLANT.rule === 'classic' ? o.selfEmployed : o.reliefTaxOnly);
/* the employment type's answers and each one's line (D154 (3); the agent's draft, the maintainer's to change) */
const EMPLOYMENT_KINDS = ['employed', 'employed-net', 'employed-unsure', 'self-employed'];
const PASS_WORDS = ', and the employer NIC pass-through in Details, Assumptions does not apply';
const EMPLOYMENT_WORDS = {
  employed: () => 'Pension contributions are priced as salary sacrifice: income tax and employee NIC relief.',
  'employed-net': pass => `Pension contributions get income tax relief only: National Insurance is paid on the whole salary${pass ? PASS_WORDS : ''}.`,
  'employed-unsure': pass => `Priced as net pay, the more cautious: income tax relief only, with no National Insurance saving${pass ? PASS_WORDS : ''}. Your payslip or your pension provider can tell you which applies.`,
  'self-employed': pass => `The salary box above is read as annual trading profit. Pension contributions get income tax relief only, with no NIC saving${pass ? PASS_WORDS : ''}.`
};

/*
 * `real` is the median (geometric) annual real return; `volatility` is the annual σ of the log return.
 * The lucky/unlucky bounds shown in the Config matrix are not stored here: they are derived from these
 * figures and the plan's own horizon by luckyBand, so the percentile they claim is true.
 *
 * `sigmaParam` is uncertainty about the expected return ITSELF, as distinct from the year-to-year
 * scatter around it. The two behave completely differently over a long horizon: volatility averages out
 * as σ/√T, while being wrong about the long-run average never averages out at all. Institutional capital
 * market assumptions carry both — BlackRock's own bands are 1.06x our width at five years but 1.56x at
 * thirty, and the gap is exactly this term. It is drawn once per simulated path rather than once per
 * year, giving an annualised variance of sigmaParam² + σ²/T.
 *
 * It defaults to zero in every built-in tier, so the shipped model is unchanged until a set of
 * assumptions that quantifies it is loaded. Zero is a real claim, not a placeholder: it says we are
 * certain of the long-run average and only unsure of the path, which is the assumption this model made
 * implicitly before the field existed.
 */
const DEFAULT_RISK_PROFILES = {
  'High Risk': { label: 'Highest: 80–100% Equities', real: 4.44, nominal: 7.05, volatility: 15.5, sigmaParam: 0 },
  'Medium/High Risk': { label: 'High: 60–80% Equities', real: 3.72, nominal: 6.31, volatility: 11.5, sigmaParam: 0 },
  'Medium Risk': { label: 'Medium: 40–60% Equities', real: 3.00, nominal: 5.58, volatility: 8.0, sigmaParam: 0 },
  'Medium/Low Risk': { label: 'Medium/Low: 20–40% Equities', real: 2.28, nominal: 4.84, volatility: 5.5, sigmaParam: 0 },
  'Low Risk': { label: 'Low: High interest Cash Savings, Fixed Income, Bonds', real: 1.56, nominal: 4.10, volatility: 3.0, sigmaParam: 0 },
  'Cash Equivalents': { label: 'Instant cash savings/money market', real: -0.50, nominal: 1.99, volatility: 0.5, sigmaParam: 0 }
};

/*
 * Published capital market assumptions, offered as an alternative to the built-in defaults.
 *
 * Stored in NOMINAL terms because that is how they are published, and deflated to real at the plan's
 * own inflation setting when applied. The engine is real throughout and deflates nothing by itself, so
 * putting a nominal figure straight into `real` would overstate every projection by inflation
 * compounded over the horizon — the deflation is the whole reason this is a table of source figures
 * rather than a table of tier values.
 *
 * Figures are a two-asset blend at each tier's equity weight, using the provider's own correlation, at
 * the 30-year horizon. `sigmaParam` is fitted from the provider's published percentile band, in log
 * space to match how the engine consumes it; see scratchpad/cma-import.py, which regenerates this table
 * from the source workbook. Each set carries the date it was published and the date it expires, because
 * a stale assumption that looks current is worse than an obviously old one.
 */
/*
 * The matrix a brand-new plan starts on.
 *
 * It is a published set rather than the built-in figures, because a sourced assumption a user can check
 * beats a house number they cannot, and because the band drawn on the trajectory is measurably more
 * accurate on it (mean error against the simulation 1.6% versus 2.8%): the fitted sigmaParam carries
 * forecast uncertainty that does not diversify away with time, which is the term a volatility-only band
 * is missing. The cost is that it carries an expiry - see the notice the Config tab shows once it passes.
 *
 * Only NEW plans get it. normalizePlan leaves a saved plan's own riskProfiles alone, so nobody's stored
 * assumptions change underneath them on upgrade; the Config picker is how an existing plan moves over.
 */
const DEFAULT_RISK_SOURCE = 'blackrock2026';

const CMA_PRESETS = {
  blackrock2026: {
    name: 'BlackRock CMA',
    detail: 'GBP · data as of 30 June 2026',
    published: 'August 2026',
    expires: 'August 2027',
    note: 'Global ex-UK equities blended with UK gilts at each tier\u2019s equity weight, 30-year horizon.',
    nominal: {
      'High Risk': { nominal: 7.41, volatility: 17.10, sigmaParam: 2.14 },
      'Medium/High Risk': { nominal: 6.85, volatility: 13.42, sigmaParam: 1.69 },
      'Medium Risk': { nominal: 6.28, volatility: 9.93, sigmaParam: 1.31 },
      'Medium/Low Risk': { nominal: 5.72, volatility: 6.89, sigmaParam: 1.03 },
      'Low Risk': { nominal: 5.16, volatility: 5.19, sigmaParam: 0.97 },
      'Cash Equivalents': { nominal: 3.54, volatility: 0.00, sigmaParam: 1.57 }
    }
  }
};

// Fisher, by division. The built-in defaults already satisfy this at 2.5% to the stored two decimals.
function realFromNominal(nominal, inflationPct) {
  return ((1 + num(nominal, 0) / 100) / (1 + num(inflationPct, 0) / 100) - 1) * 100;
}

/*
 * A preset resolved into the app's tier shape at a given inflation rate. Labels stay with the built-in
 * tiers so a preset cannot rename them out from under a saved plan, and any tier the preset does not
 * mention keeps its built-in figures rather than silently becoming zero.
 */
function applyCmaPreset(presetKey, inflationPct) {
  const preset = CMA_PRESETS[presetKey];
  if (!preset) return null;
  const out = {};
  Object.keys(DEFAULT_RISK_PROFILES).forEach(k => {
    const src = preset.nominal[k];
    out[k] = src
      ? { label: DEFAULT_RISK_PROFILES[k].label, nominal: src.nominal, real: Math.round(realFromNominal(src.nominal, inflationPct) * 100) / 100, volatility: src.volatility, sigmaParam: src.sigmaParam }
      : { ...DEFAULT_RISK_PROFILES[k] };
  });
  return out;
}

// 90th percentile of the standard normal. The 10th is its negative.
const Z90 = 1.2815515655446004;
// 75th percentile. The quartiles matter because they are what BlackRock actually publish: the decile band
// is our extrapolation out from their interquartile range, so anything claiming to be "as published" has
// to be drawn here rather than at Z90.
const Z75 = 0.6744897501960817;
// the bands the UI will draw, each with the share of outcomes it claims to sit outside
/*
 * `expected` carries no z, and that is the whole of it: no band is drawn, and the axis is then free to
 * follow the line. It is the default because of what the other two do to a small change. A good upper
 * quartile compounded over forty years ends several times the median, so the axis is set by an edge the
 * plan may never see - and a £2,000 change in spending, which is the thing somebody came to test, moves
 * the line by a pixel or two inside it. With the band off the same change is plainly visible, and the
 * range is one tap away for when the question is how wide it is rather than which way it moved.
 */
const BAND_QUANTILES = {
  // `tiny` is the same three for a 390px screen, where the full names wrap to two lines each and the
  // control row alone was 120px of a card whose point is the picture underneath it.
  expected: { z: null, button: 'Expected only', tiny: 'Middle', short: 'Expected only', label: 'Expected', lowPct: null, highPct: null },
  quartile: { z: Z75, button: 'Upper/lower quartiles', tiny: 'Quartiles', short: 'Upper/lower quartiles', label: '1 in 4', lowPct: '25th', highPct: '75th' },
  decile: { z: Z90, button: '10th/90th percentiles', tiny: '10th/90th', short: '10th/90th percentiles', label: '1 in 10', lowPct: '10th', highPct: '90th' }
};

/*
 * The constant annual real rate whose compounded result over `years` lands on the 90th (lucky) and 10th
 * (unlucky) percentile of wealth at the end of that horizon.
 *
 * Monte Carlo draws each year's return as exp(ln(1+real) + sp·z_path + σ·z_year) − 1, where z_path is
 * fixed for a whole path and z_year is redrawn annually. Over T years the annualised log return is
 * therefore normal with standard deviation √(sp² + σ²/T), and this band is that spread at the 90th and
 * 10th percentile. The two terms age differently and that is the point: the σ²/T half diversifies away
 * as the horizon lengthens, the sp² half does not, because no amount of time tells you the long-run
 * average you assumed was right. With sp = 0 this reduces to σ/√T, the PRIIPs convention for favourable
 * and unfavourable scenarios, which is what the model used before it could carry the first term.
 *
 * No single simulated path follows one of these lines. Each is a percentile of the outcome at the end,
 * which is a different claim from "the 90th percentile happened every year" — that would be 0.1^T.
 */
function quantileRate(real, vol, years, sigmaParam, z) {
  const T = Math.max(1, num(years, 1));
  const m = Math.log(1 + clamp(real, -0.99, 50));
  const sp = Math.max(0, num(sigmaParam, 0));
  return Math.exp(m + z * Math.sqrt(sp * sp + (vol * vol) / T)) - 1;
}
function luckyBand(real, vol, years, sigmaParam = 0) {
  return {
    lucky: quantileRate(real, vol, years, sigmaParam, Z90),
    unlucky: quantileRate(real, vol, years, sigmaParam, -Z90)
  };
}

/*
 * The lucky / unlucky CURVE: the pot held at each age if returns arrived evenly at that age's own
 * quantile rate.
 *
 * The horizon is the whole difficulty. quantileRate's spread is √(sp² + σ²/T), which narrows as T grows,
 * so no single rate can describe the whole chart — compounding a 45-year rate across the first five years
 * understates the early spread by about a factor of three. Measured against the simulation, a fixed-rate
 * band is 24–29% out at age 50 in pure accumulation, where sequence risk cannot possibly be the cause.
 * Re-deriving the rate at every age brings that to 2–3% across accumulation and most of drawdown.
 *
 * Cost is O(T²) step-years: one deterministic run per horizon, keeping only that horizon's own row. About
 * 19ms for both edges of a 45-year plan, which is inside a frame and cheap enough to recompute as the
 * user types.
 *
 * The known bias, and the reason this never replaces the simulation: a smooth path cannot run dry. Once a
 * real share of simulated paths fail, the true lower quantile is dragged toward zero by ruin and this
 * curve sits above it. The error tracks how stressed the plan is rather than which phase it is in —
 * measured at the terminal age, +5.5% at 99.5% survival, +16.2% at 97.3%, +98.0% at 91.3%. `failAge`
 * reports where the unlucky path itself runs dry, which is the cue the UI uses to say the line has
 * stopped being trustworthy. bandcurve.test.mjs pins all of this.
 */
/*
 * Standard normal CDF, via the Zelen & Severo 26.2.17 rational approximation (|error| < 7.5e-8). Needed
 * to turn a z back into "what share of outcomes is this", which is the only way to state a rate-based
 * result as a survival PERCENTAGE rather than as a count of the handful of lines that happen to be drawn.
 */
function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

/*
 * The share of outcomes a smooth compounded plan survives.
 *
 * Every quantile curve either lasts to the terminal age or runs dry, and worse quantiles fail first, so
 * there is a single crossing: bisect on z for the unluckiest rate that still survives, then read off how
 * much of the distribution sits at or above it. That is directly comparable to the simulation's survival
 * rate, which is what makes the side-by-side table honest - a count of "4 of 5 lines" is an artefact of
 * how many lines were drawn, not a property of the plan.
 *
 * Expect it to flatter: a smooth path cannot run dry mid-way and recover, and cannot be forced to sell
 * into a crash, so it survives rates a real sequence would not.
 */
function smoothSurvivalRate(plan, { steps = 9 } = {}) {
  const survives = (z) => quantileCurve(plan, z).failAge === null;
  let lo = -3.5, hi = 3.5;                       // beyond these, the normal has nothing left to say
  if (survives(lo)) return 100;
  if (!survives(hi)) return 0;
  for (let i = 0; i < steps; i++) {
    const mid = (lo + hi) / 2;
    if (survives(mid)) hi = mid; else lo = mid;
  }
  return (1 - normalCdf(hi)) * 100;
}

function quantileCurve(plan, z) {
  const base = resolveMpaa(plan);
  const profiles = isPlainObject(base.riskProfiles) ? base.riskProfiles : DEFAULT_RISK_PROFILES;
  const probe = buildContext(base);
  const n = probe.totalYears;
  // all three totals, so the drawn band can follow the Combined / Myself / Partner view the way the
  // expected line does rather than silently showing a household figure next to one person's
  const pot = Array.from({ length: n + 1 });
  for (let t = 0; t <= n; t++) {
    const flat = {};
    // t + 1, not t: stepYear applies a year's growth AT row t, so by the time row t is read the plan has
    // compounded t + 1 times. Row 0 is already one year old. Using t understates the horizon by a year
    // everywhere, which widens the band - most visibly at the start, where one year in three is a third.
    Object.entries(profiles).forEach(([k, v]) => {
      flat[k] = { ...v, real: quantileRate(num(v.real, 0) / 100, num(v.volatility, 12) / 100, t + 1, num(v.sigmaParam, 0) / 100, z) * 100, volatility: 0, sigmaParam: 0 };
    });
    const c = buildContext({ ...base, riskProfiles: flat });
    const row = simulateDeterministic(c, 'expected')[t];
    pot[t] = { ageSelf: row.ageSelf, totalCombined: row.totalCombined, totalSelf: row.totalSelf, totalPart: row.totalPart };
  }
  // Where the drawn line itself reaches zero, which is the only failure claim this curve can honestly
  // make - and the point past which it is certainly optimistic, since it cannot go below zero and the
  // simulation's lower quantile can stay there.
  const zeroAt = pot.findIndex(v => v.totalCombined <= 0);
  // the rate worth quoting is the one over the whole plan, which is the horizon the last row used
  const rate = {};
  Object.entries(profiles).forEach(([k, v]) => {
    rate[k] = quantileRate(num(v.real, 0) / 100, num(v.volatility, 12) / 100, n + 1, num(v.sigmaParam, 0) / 100, z) * 100;
  });
  return { pot, rate, failAge: zeroAt < 0 ? null : probe.ageSelf0 + zeroAt, years: n };
}

// ---------------------------------------------------------------- plan shape & defaults
const OWNERS = ['self', 'part'];
const OWNER_LABEL = { self: 'Myself', part: 'Partner' };
const CATEGORIES = ['pen', 'isa', 'other', 'cash'];
const CATEGORY_LABEL = { pen: 'Pensions', isa: 'S&S ISAs', other: 'Other Investments (e.g. GIA)', cash: 'Cash Savings' };
const accountId = (cat, owner) => `${cat}_${owner}`;

// Income stream types. `taxable` drives income tax; `relevantEarnings` drives the pension annual-allowance
// earnings test — under UK rules only employment/self-employment income supports pension contributions,
// so DB pensions, annuities, rent, dividends and interest are taxed but do not raise the pension limit.
const INCOME_TYPES = {
  earnings: { label: 'Earnings (employment / self-employment)', taxable: true, relevantEarnings: true },
  otherTaxable: { label: 'Other taxable income (e.g. DB pensions, annuities)', taxable: true, relevantEarnings: false },
  taxFree: { label: 'Tax-free income', taxable: false, relevantEarnings: false }
};
const incomeTypeOf = (key) => INCOME_TYPES[key] || INCOME_TYPES.otherTaxable;

/*
 * Where income tax bands are set. Wales has the power to vary its rates under the Welsh Rates of Income
 * Tax but has set them equal to rUK every year since devolution, so it is an alias rather than a second
 * table — choosing it confirms the answer rather than changing it, and the Config note says so.
 */
const TAX_REGION_LABELS = {
  ruk: 'England & Northern Ireland',
  wales: 'Wales',
  scotland: 'Scotland'
};

/*
 * The FULL new State Pension, 2026/27: £241.30 a week after the 4.8% earnings uprating on 6 April 2026.
 * It takes 35 qualifying NI years to earn, which is why the retirement-age solver quotes it back at
 * anyone whose answer is to stop work a long way early.
 */
const STATE_PENSION_FULL = 12548;
const STATE_PENSION_QUALIFYING_YEARS = 35;
const NI_RECORD_START_AGE = 18;    // the earliest an unbroken NI record is normally assumed to begin

const DEFAULT_CONFIG = {
  valuationDate: '',                 // '' => today (resolved at run time)
  inflation: 2.5,
  // Income tax (rUK 2025/26; thresholds frozen to 2028)
  personalAllowance: 12570,
  paTaperThreshold: 100000,
  paTaperRate: 50,                   // % of income over threshold that removes allowance (£1 per £2 = 50%)
  basicBandLimit: 50270,             // income level at which higher rate starts (with full allowance)
  basicTaxRate: 20,
  higherBandLimit: 125140,           // income level at which additional rate starts
  higherTaxRate: 40,
  additionalTaxRate: 45,
  // Where you are tax resident. Income tax bands are devolved; National Insurance, capital gains tax,
  // the personal allowance and its taper are not, and do not follow this setting.
  taxRegion: 'ruk',                  // 'ruk' | 'scotland' | 'wales'
  // Scottish bands (2026/27). Six of them, and a higher rate that starts £6,608 earlier than rUK.
  // Each limit is the income at which the *next* band starts, matching basicBandLimit's convention.
  scotStarterRate: 19,
  scotStarterLimit: 16537,
  scotBasicRate: 20,
  scotBasicLimit: 29526,
  scotIntermediateRate: 21,
  scotIntermediateLimit: 43662,
  scotHigherRate: 42,
  scotHigherLimit: 75000,
  scotAdvancedRate: 45,
  scotAdvancedLimit: 125140,
  scotTopRate: 48,
  // Employee National Insurance (Class 1, 2025/26)
  nicPrimaryThreshold: 12570,
  nicUpperEarningsLimit: 50270,
  nicMainRate: 8,
  nicUpperRate: 2,
  // Self-employed National Insurance (Class 4). The lower and upper profits limits currently coincide with
  // the Class 1 primary threshold and upper earnings limit, so those fields are shared; only the rates differ.
  // Class 2 is not modelled: it stopped being a mandatory charge above the Small Profits Threshold in 2024.
  class4MainRate: 6,
  class4UpperRate: 2,
  // Salary sacrifice: employer NIC saving (15% from April 2025) and how much of it is passed into the pension
  employerNicRate: 15,
  employerNicPassThrough: 0,         // % of employer NIC saving added to the pension
  // Pension tax-free cash
  pclsProportion: 25,
  pclsMaxCap: 268275,                // Lump Sum Allowance
  // Annual wrapper allowances (per person)
  isaAnnualAllowance: 20000,
  pensionAnnualAllowance: 60000,
  pensionNoEarningsLimit: 3600,      // gross pension contribution allowed with no relevant UK earnings
  mpaaLimit: 10000,                  // money purchase annual allowance once a pension is flexibly accessed
  // Tapered annual allowance for high earners. HMRC tapers on *adjusted* income (net income plus employer
  // contributions); the model only knows earnings, so earnings stand in for it — see the documentation tab.
  pensionTaperThreshold: 260000,     // adjusted income above which the annual allowance starts to taper
  pensionTaperRate: 50,              // % of income above the threshold removed from the allowance (£1 per £2)
  pensionTaperFloor: 10000,          // the allowance cannot taper below this
  // Capital gains tax on the GIA (realisation-based; gains are wiped on death so nothing is charged at the terminal age)
  cgtEnabled: true,
  cgtAnnualExempt: 3000,
  cgtBasicRate: 18,
  cgtHigherRate: 24,
  // Tax on savings interest. Cash Savings earns its NOMINAL rate (real plus inflation) and that interest is
  // taxed as income above the personal savings allowance and the starting rate for savings; switch off to
  // treat all cash as a cash ISA. The tax is a cost the year has to fund, like any other bill.
  cashInterestTaxed: true,
  savingsAllowanceBasic: 1000,       // personal savings allowance for a basic-rate taxpayer
  savingsAllowanceHigher: 500,       // ...for a higher-rate taxpayer; nil for additional rate
  startingRateSavingsBand: 5000,     // 0% band for savings income where non-savings income is below the allowance plus this
  // The cash ISA: its own annual cap inside the overall ISA allowance, and the lower cap for the under-65s
  // announced for April 2027. Whatever allowance the year's S&S subscriptions leave is used to shelter cash.
  cashIsaAllowance: 20000,
  cashIsaAllowanceUnder65: 12000,
  cashIsaAllowanceUnder65From: 2027,
  // Tax on dividends inside the GIA. The GIA is assumed to pay `giaDividendYield` % of its value a year as
  // dividends OUT OF its stated return (total return is unchanged); the dividends are taxed above the
  // allowance at the dividend rates of the band they fall in, and the tax is a cost the year funds.
  giaDividendYield: 2.0,             // % of the GIA's value a year, an approximation across the tiers
  dividendAllowance: 500,
  dividendBasicRate: 10.75,          // 2026/27: the ordinary and upper rates rose two points from 6 April 2026
  dividendHigherRate: 35.75,
  dividendAdditionalRate: 39.35,
  // Behavioural / modelling assumptions
  cashBufferMonths: 6,               // months of spending kept in cash before surplus income is swept to ISA
  harvestPersonalAllowance: true,    // in retirement draw pension to fill unused 0% allowance and move it to ISA
  /*
   * Guyton-Klinger guardrails: spending reacts to the portfolio instead of being taken regardless.
   * Off by default, because every figure the app has ever shown was computed with spending held fixed,
   * and switching the rule on makes the survival rate rise for a reason the number alone does not
   * show - that the household cut its spending to get there. The parameters live in GUARDRAILS.
   */
  guardrails: false,
  /*
   * How many years ahead of a known one-off cost the plan starts setting money aside for it, drawing
   * the pension up to the basic-rate limit and parking the proceeds where the cost will be paid from.
   * Zero is off: the cost lands in its year and is met from whatever is there, as it always was.
   */
  lookaheadYears: 5,
  /*
   * How far up the bands that harvest goes: 'pa' stops at the tax-free allowance, 'basic' keeps drawing
   * to the basic-rate limit and pays 20% on the way. The second is a bequest strategy rather than a
   * spending one - it moves a pension that will be taxed twice after 2027 (inheritance tax, then the
   * heir's own rate) into wrappers that are taxed once, at a rate you choose now.
   */
  harvestCeiling: 'pa',
  pensionDeathTaxRate: 0,            // % haircut applied to any pension left at the terminal age when reporting "net" pots (IHT / beneficiary income tax)
  /*
   * Inheritance tax. Published figures for 2026/27; every one is overridable because three of the four
   * regimes here changed between 2025 and 2027 and the next Budget may change them again.
   *
   * `pensionsInEstateFrom` is the one to understand. Until 6 April 2027 an unused pension sat OUTSIDE
   * the estate, which is why the conventional advice was to spend everything else first. From that date
   * it is inside, so a pension left to a non-exempt beneficiary after a death at 75 or over can take
   * 40% IHT and then the beneficiary's own income tax on the remainder - roughly 67% at the additional
   * rate, against 40% for the same pound held in an ISA. The advice inverts, and the model has to know
   * which side of the date the death falls on rather than assuming.
   */
  ihtNrb: 325000,                    // nil-rate band, frozen to 5 April 2031
  ihtRnrb: 175000,                   // residence nil-rate band; only if a home passes to direct descendants
  ihtRnrbTaperFrom: 2000000,         // RNRB tapers away above this estate value...
  ihtRnrbTaperRate: 50,              // ...losing £1 of band for every £2 over it
  ihtRate: 40,                       // headline rate above the available bands
  ihtCharityRate: 36,                // reduced rate where the charitable legacy clears the test below
  ihtCharityThresholdPct: 10,        // % of the baseline estate that must go to charity to earn 36%
  pensionsInEstateFrom: 2027,
  /*
   * The window for giving exempt compensation away. Two years from the day it was paid - and for money
   * received before the relief was announced on 4 December 2025, two years from that date instead, so
   * nobody who was already holding an award lost the chance before it existed.
   */
  compensationGiftWindowYears: 2,
  compensationGiftWindowFrom: '2025-12-04',        // tax year from which unused pensions count as estate (Finance Act 2026)
  pensionIncomeTaxFromAge: 75,       // death at or above this age makes inherited pension taxable on the beneficiary
  /*
   * Quick succession relief (s.141 IHTA 1984). Where someone inherits assets on which inheritance tax
   * was paid and then dies within five years, the tax on the SECOND death is reduced by reference to the
   * tax paid on the first, tapering by whole years elapsed. It is not applied automatically - an
   * executor has to claim it - so a household unaware of it loses it outright, which is exactly why it
   * is worth surfacing.
   */
  qsrScale: [100, 80, 60, 40, 20],
  /*
   * BUSINESS AND AGRICULTURAL PROPERTY RELIEF, as reformed at the 2024 Budget with effect from 6 April
   * 2026. Relief is no longer unlimited: one allowance per person covers business and agricultural
   * property together at 100%, and everything above it drops to 50%. Shares not listed on a recognised
   * exchange - AIM among them - get 50% flat and do not touch the allowance. The allowance IS
   * transferable between spouses, like the nil-rate band: whatever the first death left unused passes
   * to the survivor as a percentage, so there is a percentage box for it under "widowed".
   *
   * Every one of these reliefs also needs the asset OWNED FOR TWO YEARS at death, which is why the tab
   * asks when it was acquired rather than assuming.
   */
  brAprFrom: 2026,                   // tax year the reformed regime bites; before it, relief was 100% flat
  brAprAllowance: 2500000,           // combined 100% allowance for business and agricultural property
  brAprReducedRatePct: 50,           // relief above the allowance
  aimReliefRatePct: 50,              // unquoted/AIM shares, which never touch the allowance
  brAprMinYearsOwned: 2,             // ownership test; below it there is no relief at all
  /*
   * Taper relief on gifts, as the EFFECTIVE rate by whole years between gift and death: no relief at all
   * for the first three years, then tapering to nothing at seven. It reduces the tax on the gift, and
   * only ever on the part of it that exceeds the nil-rate band - which is why a modest gift sees no
   * benefit from taper no matter how long ago it was made.
   */
  giftTaperRates: [40, 40, 40, 32, 24, 16, 8],
  giftAnnualExemption: 3000,         // immediately exempt each year, before the seven-year clock matters
  /*
   * Years a beneficiary is assumed to spread an inherited pension over. Nobody sensible draws a large
   * pot in one tax year, and assuming they do overstates the tax badly - but the figure only holds if
   * their income situation stays roughly as it is, which the tab says on screen.
   */
  inheritedPensionSpreadYears: 5,
  statePensionAgeForHeirs: 68,       // age at which a beneficiary is assumed to be drawing a state pension
  // ...and roughly what it is worth, since it consumes their allowance.
  assumedStatePensionForHeirs: STATE_PENSION_FULL,
  bridgeSafetyMargin: 30,            // % uplift on the pre-access "bridge" reserve the tournament targets
  solvencyFloor: 0                   // minimum pot at terminal age (bequest floor)
};

const defaultAccounts = () => [
  { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: '', contrib: '', growth: '', risk: 'Low Risk', unrealisedGain: '' },
  { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: '', contrib: '', growth: '', risk: 'Low Risk' },
  { id: 'cashIsa_self', owner: 'Myself', category: 'Cash ISA', balance: '', contrib: '', growth: '', risk: 'Low Risk' },
  { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'isa_part', owner: 'Partner', category: 'S&S ISAs', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'other_part', owner: 'Partner', category: 'Other Investments (e.g. GIA)', balance: '', contrib: '', growth: '', risk: 'Low Risk', unrealisedGain: '' },
  { id: 'cash_part', owner: 'Partner', category: 'Cash Savings', balance: '', contrib: '', growth: '', risk: 'Low Risk' },
  { id: 'cashIsa_part', owner: 'Partner', category: 'Cash ISA', balance: '', contrib: '', growth: '', risk: 'Low Risk' }
];

/*
 * WHAT THE HOUSEHOLD IS ACTUALLY OPTIMISING FOR.
 *
 * Measured across 420 households, the ranking objective moves the recommended policy far more than the
 * choice of policies does: ranking on expected pot instead of survival changes the answer for 75% of
 * them, and takes Sequential from winning 1% to winning 46%. Nothing about the policies changes - only
 * the question being asked of them. So the priority order is a first-class input, not a preference.
 *
 * `epsilon` is what makes a RANKING different from a tie-break: a lower priority may only choose among
 * candidates that are near-equal on every higher one. Set it too low and the top priority decides
 * everything, because exact ties are rare; too high and a real sacrifice gets waved through.
 *
 * The money metrics use 3% relative. The two rate metrics use 1 percentage point rather than 3, and the
 * difference is deliberate: those are already probabilities, so three points of survival (90% to 87%) is
 * a far larger concession than 3% of a pot. Whether one point clears the sampling noise is exactly what
 * sets the path count: at TOURNAMENT_TRIALS the survival estimate's seed-to-seed standard deviation is
 * about 0.56 points on the noisiest plan in the library, so the tolerance does clear it - by a factor of
 * two, not an order of magnitude, and the old 1,500-path search did not clear it at all. Raising the
 * tolerance instead of the path count would let a real sacrifice through, which is the worse of the two
 * errors.
 */
const RATE_EPSILON_PTS = 1.0;
const MONEY_EPSILON_REL = 0.03;
/*
 * A purely relative tolerance collapses as its reference approaches zero, and one of these metrics
 * routinely does. Lifetime tax is MINIMISED, so the reference is the smallest achievable figure - and
 * on a household where some policy gets tax near zero, 3% of it is near zero too, making the tax
 * priority infinitely strict: every rival becomes "meaningfully worse" by an unbounded multiple. The
 * same collapse inflates the downside-pot tolerance on plans that end close to broke.
 *
 * So every money tolerance has a floor. £1,000 over a whole retirement is not a difference anyone
 * should re-plan around, which makes it a safe floor rather than an arbitrary one.
 */
const MONEY_EPSILON_FLOOR = 1000;
const moneyEpsilon = (v) => Math.max(MONEY_EPSILON_FLOOR, Math.abs(v) * MONEY_EPSILON_REL);

/*
 * A HARD LIMIT ON WHAT A STATED PREFERENCE MAY COST IN SAFETY.
 *
 * The ranking is lexicographic, and nothing in that mechanism protects a priority ranked lower. Put
 * inheritance first and survival is only consulted among candidates that were already
 * inheritance-optimal - so in principle the recommendation could be far more fragile than the best
 * available, and the household would never be told they had bought that.
 *
 * Measured across 420 households with each priority promoted to first in turn. The ordinary trade is a
 * reasonable one: where ranking the pot first changed the pick at all (357 of 420), it gave up 1.1
 * points of survival on average for 20% more pot; ranking tax first gave up a similar 1.2 points for
 * roughly a third less lifetime tax. UNGUARDED, a few households pay far more - promoting resilience in
 * poor markets or lifetime tax can cost up to 14.4 points of survival in about 3% of households (12 and
 * 13 of 420 respectively), an unusual case where several priorities happen to disagree at once. That is
 * exactly what the guard exists to catch, and at 420 households it now visibly does: the guarded worst
 * case sits right at the 5-point cap rather than below it, which earlier, smaller runs of this same
 * study did not have enough households to show.
 *
 * So five points is chosen above the typical cost of a genuine preference and below the unguarded worst
 * case. It never overrides a trade this library calls reasonable, and it catches the households where
 * the ranking would otherwise do real damage. It is precautionary rather than corrective, which is the
 * honest description, and the number is a config value so it can be tightened by anyone who disagrees.
 *
 * There is deliberately NO absolute survival floor alongside it. A plan whose best available outcome is
 * 69% is fragile because the plan is fragile, not because of how the priorities were ordered, and
 * overriding the ranking for a reason unrelated to the ranking would be the wrong remedy.
 */
const MAX_SURVIVAL_SACRIFICE_PTS = 5;

const PRIORITY_METRICS = {
  survive: {
    label: 'Avoiding depletion',
    why: 'Ranks on the share of simulated lifetimes that stay solvent to your final age.',
    serves: 'Favours filling the tax-free allowance from the pension early, which keeps ISAs and cash intact as the buffer that survives a bad decade.',
    get: (st) => st.successRate, higherIsBetter: true, unit: 'pts', epsilon: () => RATE_EPSILON_PTS
  },
  /*
   * Bequest ranks on what the heirs actually RECEIVE, not on the pot left behind.
   *
   * It used to rank on `medianTerminalNet` - the gross pot less a flat death-tax percentage that
   * defaults to zero - and measurement showed that was not a rough proxy but an actively wrong one.
   * Across 60 households, ranking "leave as much behind" that way delivered LESS real inheritance than
   * not asking for it at all (£1,537,606 against £1,557,039), produced answers identical to "biggest
   * pot", and picked the genuinely best policy in 4 cases out of 60. The gross figure cannot know about
   * the nil-rate bands, the residence allowance, the 2027 pension rule or the beneficiary's own income
   * tax, and those are exactly what decide the answer.
   *
   * `postTaxInheritance` is computed per candidate by whoever evaluates it. Where the household has not
   * said who inherits there is nothing to compute, so it falls back to the old proxy - and `why` says
   * so, because a priority that quietly measures something else is how this went wrong the first time.
   */
  bequest: {
    label: 'Maximising the inheritance',
    why: 'Ranks on what your heirs actually receive after inheritance tax and their own income tax, where beneficiaries have been entered. With none entered it falls back to the pot left at your final age, which makes it behave much like the pot priority above.',
    serves: 'Favours keeping wealth in wrappers that are taxed once rather than twice, which since 2027 means not leaving an oversized pension behind for heirs who would pay income tax on it as well.',
    get: (st) => st.postTaxInheritance ?? st.medianTerminalNet ?? st.medianTerminal, higherIsBetter: true, unit: 'pct', epsilon: moneyEpsilon
  },
  pot: {
    label: 'The largest expected portfolio',
    why: 'Ranks on the typical pot at your final age, before any death tax.',
    serves: 'Favours deferring the pension, because money left inside it compounds untaxed - which is also why this can flatter a pot that still owes income tax on the way out.',
    get: (st) => st.medianTerminal, higherIsBetter: true, unit: 'pct', epsilon: moneyEpsilon
  },
  downside: {
    label: 'Resilience in poor markets',
    why: 'Ranks on what is left in the worst one lifetime in ten, rather than the typical one.',
    serves: 'Favours steady tax smoothing over anything that concentrates a tax bill or a capital gain into a single year.',
    /*
     * Ranks on the pot LESS the spending that was never afforded, not on the pot alone. A pot floors
     * at zero, so once the tenth-percentile lifetime runs dry every policy scores an identical zero
     * and this priority goes blind - measured across the scenario library, inert for 92.8% of the
     * households whose best available survival is under 90%, against 10.1% of the rest. That is
     * backwards: it failed precisely where the bad case was worst. Netting off the shortfall restores
     * the ordering among failures and leaves plans that hold completely untouched.
     */
    get: (st) => st.p10TerminalAdj ?? st.p10TerminalNet ?? st.p10Terminal, higherIsBetter: true, unit: 'pct', epsilon: moneyEpsilon
  },
  bridge: {
    label: 'Solvency until pension access',
    why: 'Ranks on how often the plan runs dry BEFORE the pension can be touched, which is the one failure no later good luck can undo.',
    serves: 'Favours holding accessible money back and leaning on the pension only once it unlocks.',
    get: (st) => st.preNmpaFailRate, higherIsBetter: false, unit: 'pts', epsilon: () => RATE_EPSILON_PTS
  },
  tax: {
    label: 'Minimising lifetime tax',
    why: 'Ranks on total income tax paid across the whole plan.',
    serves: 'Favours spreading pension income thinly across many years instead of a few large withdrawals. Worth knowing this is a poor proxy for wealth: paying 20% now often beats deferring to 40% later.',
    get: (st) => st.medianLifetimeTax ?? 0, higherIsBetter: false, unit: 'pct', epsilon: moneyEpsilon
  }
};

/*
 * What a threshold on each priority is actually counting. The panel used to show only the priority's
 * name beside a box reading "pts" or "%", which leaves "0.25 points of what?" unanswered - and the unit
 * differs by row, so there was no way to reason about it from the label alone.
 */
const TOLERANCE_MEANS = {
  survive: 'points of survival rate — 1 pt means 90% and 91% count as the same',
  bequest: '% of what your heirs receive',
  pot: '% of the pot left at your final age',
  downside: '% of what is left in the worst one lifetime in ten',
  bridge: 'points of pre-pension failure rate',
  tax: '% of total lifetime tax'
};

const PRIORITY_KEYS = Object.keys(PRIORITY_METRICS);
// Survival first, then what is left behind. Reproduces the ranking the app used before priorities existed.
const DEFAULT_PRIORITIES = ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'];

/*
 * Tolerance overrides, cleaned. A blank, zero or nonsense entry falls back to the metric's default
 * rather than being honoured: a zero tolerance would make that priority decide every household alone,
 * which is a footgun rather than a preference.
 */
const normalizeTolerances = (obj) => {
  const out = {};
  if (!isPlainObject(obj)) return out;
  Object.keys(PRIORITY_METRICS).forEach(k => {
    const v = num(obj[k], 0);
    if (v > 0) out[k] = v;
  });
  return out;
};

// the tolerance actually applied to a metric: the household's override, or the metric's own default
const toleranceFor = (key, bestValue, overrides) => {
  const m = PRIORITY_METRICS[key];
  const o = overrides && overrides[key];
  if (!(o > 0)) return m.epsilon(bestValue);
  // rate metrics are stated in points, money metrics as a percentage of the best value
  return m.unit === 'pts' ? o : Math.max(MONEY_EPSILON_FLOOR, Math.abs(bestValue) * (o / 100));
};

const normalizePriorities = (list) => {
  const seen = [];
  (Array.isArray(list) ? list : []).forEach(k => { if (PRIORITY_METRICS[k] && !seen.includes(k)) seen.push(k); });
  DEFAULT_PRIORITIES.forEach(k => { if (!seen.includes(k)) seen.push(k); });
  return seen;
};

const BLANK_PLAN = Object.freeze({
  activeProfileView: 'Combined',
  demographics: {
    planningMode: 'couple',
    currentAgeSelf: '', currentAgePart: '',
    retireAgeSelf: '', retireAgePart: '',
    salarySelf: '', salaryPart: '',
    // real salary growth, i.e. on top of inflation. Blank or 0 means pay keeps pace with inflation, which
    // is flat in today's money because the whole projection runs in real terms.
    salaryGrowthSelf: '', salaryGrowthPart: '',
    // 'employed' (Class 1 NIC, salary sacrifice relief) or 'self-employed' (Class 4 NIC, income tax relief only)
    employmentSelf: 'employed', employmentPart: 'employed',
    cgtGainsUsedSelf: '', cgtGainsUsedPart: '',
    cfBroughtForwardSelf: '', cfBroughtForwardPart: '',
    // derived by resolveMpaa from the projection, not user-editable
    mpaaAgeSelf: '', mpaaAgePart: '',
    statePensionAge: 68, privatePensionAge: 58,
    /*
     * LEFT BLANK, AND SUGGESTED IN THE FIELD RATHER THAN FILLED IN.
     *
     * The full new State Pension is the right prompt - most people qualify for it or close to it, and a
     * plan silently missing £12,548 a year of guaranteed lifelong income understates every answer. But a
     * real value typed in on the household's behalf is a figure they never claimed, sitting in a field
     * they may never scroll to, and entitlement genuinely varies with the NI record. So the amount goes
     * in the input's PLACEHOLDER, where it prompts without asserting.
     */
    statePensionSelf: '', statePensionPart: '',
    terminalAge: 100
  },
  spending: {
    targetSpend: '',
    // spendBands: [{ id, fromAge, toAge, amount }] in "Myself" ages. Any year not covered by a band falls
    // back to targetSpend, so an empty list means a flat spend for the whole retirement.
    spendBands: [],
    drawdownStrategy: 'Phased Drawdown',
    decumulationPolicy: 'Bracket Fill Basic',
    // ranked, most important first; see PRIORITY_METRICS
    priorities: [...DEFAULT_PRIORITIES],
    /*
     * Optional per-priority tolerance overrides, keyed by priority. Blank means "use the default".
     *
     * These are deliberately NOT derived from the ranking. Measurement showed that tightening the top
     * priority's tolerance makes every priority below it matter LESS - lower priorities decided 14 of 40
     * households at a 0.05pt tolerance against 29 of 40 at 1pt - so "rank it higher, tolerate less"
     * would mean the more strongly someone feels about their first choice, the less their other stated
     * preferences count. Rank and tolerance are separate questions: rank is the order things are
     * considered in, tolerance is what counts as a meaningful difference in that particular quantity.
     */
    priorityTolerances: {},
    // 'ranked' walks the priority list in order; 'balanced' blends every metric at once
    priorityMode: 'ranked'
  },
  /*
   * Inheritance facts. These live apart from `demographics` on purpose: `terminalAge` there is a
   * PLANNING HORIZON, chosen pessimistically so the money does not run out, while `deathAge` here is a
   * PREDICTION, and using the pessimistic one to value an estate would model twenty more years of
   * drawdown than is likely and understate the bequest badly.
   */
  inheritance: {
    deathAge: '', homeValue: '', homeToDescendants: true,
    homeSold: false, homeSaleAge: '', otherAssets: [],
    widowed: false, transferredNrbPct: '', transferredRnrbPct: '', transferredBrAprPct: '',
    // quick succession relief: an inheritance received within five years of death, and the tax paid on it
    qsrInheritedValue: '', qsrTaxPaid: '', qsrYearsBefore: '',
    // s.154 IHTA 1984: a full exemption, not a relief
    activeServiceExempt: false,
    /*
     * Compensation from a government scheme that is disregarded for inheritance tax - the infected blood
     * scheme run by IBCA is the one most people will be entering, and Post Office Horizon, Windrush,
     * Grenfell, the Troubles and vaccine damage payments carry their own exemptions. Held as an amount
     * rather than a flag because only what is still HELD is exempt: spend it and there is nothing to
     * disregard.
     */
    compensationPayment: '', compensationDate: '',
    // gifts already made: { id, amount, year, desc }
    gifts: [],
    /*
     * s.21 IHTA 1984, normal expenditure out of income: a gift that is habitual, paid out of income
     * rather than capital, and leaves the giver's standard of living intact is exempt IMMEDIATELY - no
     * seven-year wait, no allowance consumed, and no upper limit. It is the only gift that works for
     * someone who does not expect to live seven years, and the one most people never claim.
     */
    surplusGift: { annual: '', fromYear: '', toYear: '' },
    beneficiaries: []
  },
  accounts: defaultAccounts(),
  riskProfiles: applyCmaPreset(DEFAULT_RISK_SOURCE, DEFAULT_CONFIG.inflation) || DEFAULT_RISK_PROFILES,
  riskSource: DEFAULT_RISK_SOURCE,
  otherIncomes: [],
  oneOffContributions: [],
  oneOffCosts: [],
  config: { ...DEFAULT_CONFIG }
});

// Where a one-off capital cost is funded from, when a policy does not say otherwise. This is the order
// the model used unconditionally before policies could name their own.
const DEFAULT_COST_STEPS = ['cash', 'other', 'isa', 'penAny'];

/*
 * A deposit whose wrapper is left as AUTO_DEPOSIT is routed by the policy rather than by the user: the
 * policy's `depositOrder` is walked and the first wrapper with headroom this year takes it. An
 * inheritance is the case that matters - £120k arriving with nowhere obvious to go, where the difference
 * between the pension (relief now, locked, and in the estate from 2027) and the ISA (no relief, free
 * forever, but capped each year) is worth more than most contribution decisions a household ever makes.
 */
const AUTO_DEPOSIT = 'Auto (policy decides)';

// Used when the chosen policy has no depositOrder of its own. Mirrors the "Choose for me" button:
// the pension first for the relief, then the ISA, then wrappers with no annual limit at all. Walked
// by headroom, so it never dumps a windfall into a wrapper that has no room left this year.
const DEFAULT_DEPOSIT_ORDER = ['pen', 'isa', 'other', 'cash'];

/*
 * Each policy carries its own one-line explanation. It used to live in a ternary chain in the Config
 * tab that handled exactly three cases and fell through to the Sequential wording, so adding a fourth
 * policy would have silently mislabelled it - describing one strategy while running another.
 */
const DECUMULATION_POLICIES = {
  'Bracket Fill Basic': {
    label: 'Tax Smoothing (fill 0% allowance, then pension to the basic-rate limit, preserve ISAs)',
    blurb: (P) => `Fills the £${fmtNum(P.pa)} allowance, then draws pension income up to £${fmtNum(P.higherRateStartsAt)} before touching cash, GIA and ISAs.`,
    steps: ['penPA', 'penBasic', 'cash', 'other', 'isa', 'penAny'], harvest: true
  },
  'Bracket Fill': {
    label: 'UK FIRE Bracket Fill (fill 0% allowance only, then cash/GIA/ISA, pension last)',
    blurb: (P) => `Draws pension only up to £${fmtNum(P.pa)} (0% tax), then cash, GIA and ISAs; pension income above the allowance is the last resort.`,
    steps: ['penPA', 'cash', 'other', 'isa', 'penBasic', 'penAny'], harvest: true
  },
  'Sequential': {
    label: 'Sequential (Cash → GIA → ISA → Pension, no bracket management)',
    blurb: () => 'Liquidates each wrapper to zero in rigid sequential order.',
    steps: ['cash', 'other', 'isa', 'penAny'], harvest: false
  },
  /*
   * The two below were found by running every policy against 360 test households, then re-testing every
   * apparent win on three independent seeds at 20,000 paths. Nearly a third of the first-pass findings
   * reversed on a different seed; these did not. Each is here because it is the best answer for
   * households NO shipped policy serves - not because it wins most often, which it does not.
   *
   * Two others that also survived confirmation are deliberately absent: "Wrapper Aware" won 24
   * households but none of them uniquely (Windfall to ISA already covers every one), and "Cash Last"
   * likewise added nothing of its own. A policy that is never the only right answer is a longer menu
   * and a slower search for nothing.
   */
  'ISA First': {
    label: 'ISA First (spend the tax-free wrapper early, leave the GIA and pension to grow)',
    blurb: (P) => `Fills the £${fmtNum(P.pa)} allowance from the pension, then spends the ISA before cash or the GIA. Best where a large GIA would otherwise be sold at a gain to fund spending.`,
    steps: ['penPA', 'isa', 'cash', 'other', 'penBasic', 'penAny'], harvest: true
  },
  'Windfall to ISA': {
    label: 'Windfall to ISA (as Tax Smoothing, but unassigned deposits fill the ISA first)',
    blurb: (P) => `Draws like Tax Smoothing — pension income to £${fmtNum(P.higherRateStartsAt)} first — but routes a deposit marked "${AUTO_DEPOSIT}" into the ISA before the GIA rather than into the pension. Best where an inheritance would otherwise hit the pension annual allowance.`,
    steps: ['penPA', 'penBasic', 'cash', 'other', 'isa', 'penAny'], harvest: true,
    depositOrder: ['isa', 'other', 'cash', 'pen']
  }
};

/*
 * GUYTON-KLINGER GUARDRAILS, in the model's own terms.
 *
 * Guyton & Klinger (2006) is a set of rules for HOW MUCH to take each year, which is a different question
 * from the decumulation policies above, which say WHERE to take it from. The two compose: the policy
 * still decides the order, and this decides the amount the order has to cover.
 *
 *   band        the current withdrawal rate may drift this far either side of the rate on the first
 *               year the portfolio was drawn on before a rule fires: 20% each way, so a 5% start has
 *               rails at 4% and 6%
 *   cut         the capital preservation rule: above the upper rail, spending falls by this much
 *   raise       the prosperity rule: below the lower rail, spending rises by this much
 *   freezeYears the cut is not applied in the final years of the plan, where there is no long horizon
 *               left to protect - 15, as the paper had it. The raise applies throughout.
 *
 * The inflation rule needs no parameter: in a year the portfolio lost money, the rise that would have
 * kept spending level is skipped and never made up. This model runs in today's money, so "no rise" is
 * spending falling by the inflation assumption in real terms, which is why ctx.inflation is read here.
 *
 * WHAT THE RATE IS MEASURED ON. The paper's withdrawal rate is the portfolio draw over the portfolio,
 * and a household with a state pension draws less than it spends. So the rule governs the draw, not
 * the spend: the multiplier applies to whatever the guaranteed income does not cover, the rate is that
 * draw over the combined pot, and the rails are set on the first year the draw is above zero. One
 * consequence worth knowing about: when the state pension starts, the draw falls, the rate falls with
 * it, and the prosperity rule can grant a rise - which is the paper's own behaviour with Social
 * Security, and is also true, since the household genuinely can afford more from that year.
 *
 * These are held constant rather than exposed: the point of the toggle is one decision, and four
 * numbers under it would turn it into a tuning exercise before the first decision has been made.
 */
const GUARDRAILS = Object.freeze({ band: 0.20, cut: 0.10, raise: 0.10, freezeYears: 15 });

// today's date where the user is, as YYYY-MM-DD (toISOString gives the UTC date, a day out either side of midnight)
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// Fraction of the calendar year remaining after the valuation date (0.01..1).
const calculateYearFraction = (dateStr) => {
  // a YYYY-MM-DD date is read as a local date, as the year's bounds below are: `new Date('2026-01-01')` is UTC midnight,
  // which west of Greenwich falls in the year before and gave a 1 January plan a 1% first year (F0a, 21 Oct)
  const ymd = typeof dateStr === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr) : null;
  const d = ymd ? new Date(+ymd[1], +ymd[2] - 1, +ymd[3]) : dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return calculateYearFraction('');
  const year = d.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return clamp((end - d.getTime()) / (end - start), 0.01, 1.0);
};

// Deep-normalise anything (old localStorage plans, imported JSON, undefined) into a valid plan object.
/*
 * Spending bands, and the migration from the two lifestyle tapers they replaced.
 *
 * Tapers could only ever step spending down by a percentage at two fixed ages. Bands say what a stretch of
 * years actually costs, so a plan can rise as well as fall: a heavy early retirement, a quieter stretch,
 * then care costs. A saved plan carrying tapers is converted to the identical set of bands here rather
 * than being silently dropped, because the two tapers compounded and reproducing that by hand is a trap.
 */
function normaliseSpendBands(s, d) {
  const clean = (arr) => arr.filter(isPlainObject).map(x => ({
    id: String(x.id || 'sb_' + Math.random().toString(36).slice(2)),
    fromAge: x.fromAge ?? '',
    toAge: x.toAge ?? '',
    amount: x.amount ?? ''
  }));
  if (Array.isArray(s.spendBands)) return clean(s.spendBands);

  // legacy: rebuild the exact schedule the two tapers produced
  const base = num(s.targetSpend, 0);
  const t1Age = num(s.taper1Age, 0), t1Rate = clamp(num(s.taper1Rate, 0), 0, 100) / 100;
  const t2Age = num(s.taper2Age, 0), t2Rate = clamp(num(s.taper2Rate, 0), 0, 100) / 100;
  const hasT1 = t1Age > 0 && t1Rate > 0;
  const hasT2 = t2Age > 0 && t2Rate > 0;
  if (!base || (!hasT1 && !hasT2)) return [];
  const terminal = num(d.terminalAge, 100);
  const bands = [];
  // taper 2 compounds on the post-taper-1 figure, which is what makes this worth migrating rather than
  // leaving to the user to redo
  const afterT1 = hasT1 ? base * (1 - t1Rate) : base;
  const afterT2 = hasT2 ? afterT1 * (1 - t2Rate) : afterT1;
  if (hasT1 && hasT2 && t2Age > t1Age) {
    bands.push({ fromAge: t1Age, toAge: t2Age - 1, amount: Math.round(afterT1) });
    bands.push({ fromAge: t2Age, toAge: terminal, amount: Math.round(afterT2) });
  } else if (hasT1 && hasT2) {
    // both set to the same age, or taper 2 earlier: they collapse to one step at the earlier age
    bands.push({ fromAge: Math.min(t1Age, t2Age), toAge: terminal, amount: Math.round(afterT2) });
  } else if (hasT1) {
    bands.push({ fromAge: t1Age, toAge: terminal, amount: Math.round(afterT1) });
  } else {
    bands.push({ fromAge: t2Age, toAge: terminal, amount: Math.round(base * (1 - t2Rate)) });
  }
  return bands.map((b, i) => ({ id: 'sb_migrated_' + i, ...b }));
}

/*
 * THE SOLVER'S LOCKS (Part C Phase 7c, research/solver/PHASE-7.md): what the solver may not change. `pensionBefore` an age
 * (whole years) or null; `tierCeiling` per wrapper the riskiest tier the pension and the ISA may hold, or null; `lumpSum`
 * 'free', 'never' or 'now'. Anything else reads as no lock. src/solverSettings.js applies them as the solver prepares a plan.
 */
function normalizeSolverLocks(src) {
  const l = isPlainObject(src.locks) ? src.locks : {}, tc = isPlainObject(l.tierCeiling) ? l.tierCeiling : {};
  const age = l.pensionBefore === null || l.pensionBefore === '' || l.pensionBefore === undefined ? NaN : num(l.pensionBefore, NaN);
  const tier = v => (typeof v === 'string' && DEFAULT_RISK_PROFILES[v] ? v : null);
  // a couple's partner's own ceilings (Part D, D5: the limits per person; src/solverSettings.js lockedPlan), kept only where
  // the plan carries them, so every other plan normalises as before
  const part = isPlainObject(l.tierCeilingPart) ? { tierCeilingPart: { pen: tier(l.tierCeilingPart.pen), isa: tier(l.tierCeilingPart.isa) } } : {};
  return { locks: { pensionBefore: Number.isFinite(age) ? clamp(Math.round(age), 0, 120) : null, tierCeiling: { pen: tier(tc.pen), isa: tier(tc.isa) }, lumpSum: ['never', 'now'].includes(l.lumpSum) ? l.lumpSum : 'free', ...part } };
}
/*
 * WHAT THE SOLVER AIMS FOR (Part C Phase 8, research/solver/PHASE-8.md): `plan.solver.aims`, kept only where a plan carries it.
 * `cuts` the dislike of spending cuts as a multiple of today's (the dial's positions, src/solverSettings.js APP_DIAL; pinned
 * by solver-aims.test.mjs), `estate` 'standard' or 'lower', `raises` 'capped' (to 110% of target) or 'blocked', `riskConsent`
 * true or false. Anything off those reads as the default, the first of each. src/solverSettings.js aimsOptions maps them.
 */
const SOLVER_DIAL = [1, 3, 6, 10];
function normalizeSolverAims(a) {
  return { cuts: SOLVER_DIAL.includes(a.cuts) ? a.cuts : 1, estate: a.estate === 'lower' ? 'lower' : 'standard', raises: a.raises === 'blocked' ? 'blocked' : 'capped', riskConsent: a.riskConsent !== false };
}

function normalizePlan(raw) {
  const src = isPlainObject(raw) ? raw : {};
  const d = isPlainObject(src.demographics) ? src.demographics : {};
  const s = isPlainObject(src.spending) ? src.spending : {};
  const c = isPlainObject(src.config) ? src.config : {};
  const plan = {
    activeProfileView: ['Combined', 'Myself', 'Partner'].includes(src.activeProfileView) ? src.activeProfileView : 'Combined',
    demographics: { ...BLANK_PLAN.demographics, ...d },
    spending: { ...BLANK_PLAN.spending, ...s, spendBands: normaliseSpendBands(s, d) },
    inheritance: {
      ...BLANK_PLAN.inheritance, ...(isPlainObject(src.inheritance) ? src.inheritance : {}),
      beneficiaries: normalizeBeneficiaries(src.inheritance?.beneficiaries),
      gifts: normalizeGifts(src.inheritance?.gifts),
      otherAssets: normalizeEstateAssets(src.inheritance?.otherAssets),
      surplusGift: { ...BLANK_PLAN.inheritance.surplusGift, ...(isPlainObject(src.inheritance?.surplusGift) ? src.inheritance.surplusGift : {}) },
      // renamed once the relief turned out to be a credit against the tax rather than a hole in the estate
      compensationPayment: src.inheritance?.compensationPayment ?? src.inheritance?.exemptCompensation ?? '',
      compensationDate: src.inheritance?.compensationDate ?? src.inheritance?.exemptCompensationDate ?? '',
      /*
       * The flag postdates the two percentages it governs, so a plan saved before it existed has to be
       * read for what it plainly means: a household that entered a transferred band was telling us it
       * was widowed. Defaulting the flag to false without this would silently delete up to £500,000 of
       * allowance from every plan already saved - a change nobody made, showing up as a larger tax bill.
       */
      widowed: typeof src.inheritance?.widowed === 'boolean'
        ? src.inheritance.widowed
        : (num(src.inheritance?.transferredNrbPct, 0) > 0 || num(src.inheritance?.transferredRnrbPct, 0) > 0 ||
           num(src.inheritance?.transferredBrAprPct, 0) > 0)
    },
    accounts: [],
    riskProfiles: {},
    /*
     * Which published set the matrix came from, '' once any field has been edited by hand.
     *
     * A plan that names a preset keeps it. A plan that carries its own saved matrix but no preset name is
     * an existing user, and keeps their figures untouched - changing someone's return assumptions on
     * upgrade would silently rewrite every number in their plan. Only a plan with neither, i.e. a genuinely
     * new one, starts on the published default.
     */
    riskSource: CMA_PRESETS[src.riskSource] ? src.riskSource
      : (src.riskSource === undefined && !isPlainObject(src.riskProfiles)) ? DEFAULT_RISK_SOURCE : '',
    // legacy plans carried taxTreatment: 'Taxable' | 'Tax-free'; 'Taxable' migrates to otherTaxable so an
    // upgrade can never silently raise someone's pension headroom.
    otherIncomes: Array.isArray(src.otherIncomes) ? src.otherIncomes.filter(isPlainObject).map(i => ({ id: String(i.id || 'inc_' + Math.random().toString(36).slice(2)), name: i.name ?? '', owner: i.owner === 'Partner' ? 'Partner' : 'Myself', startAge: i.startAge ?? '', endAge: i.endAge ?? '', amount: i.amount ?? '', incomeType: INCOME_TYPES[i.incomeType] ? i.incomeType : (i.taxTreatment === 'Tax-free' ? 'taxFree' : 'otherTaxable'), notes: i.notes ?? '' })) : [],
    oneOffContributions: Array.isArray(src.oneOffContributions) ? src.oneOffContributions.filter(isPlainObject).map(x => {
      // AUTO_DEPOSIT is a real, storable choice - "let the policy decide" - so it has to survive
      // normalisation rather than being coerced into a wrapper the user never picked
      const category = (x.category === AUTO_DEPOSIT || Object.values(CATEGORY_LABEL).includes(x.category)) ? x.category : 'Pensions';
      return {
        id: String(x.id || 'c_' + Math.random().toString(36).slice(2)),
        date: x.date || (x.year ? `${x.year}-01-01` : ''),
        year: num(x.year, x.date ? parseInt(String(x.date).slice(0, 4)) : ''),
        owner: x.owner === 'Partner' ? 'Partner' : 'Myself',
        category,
        amount: x.amount ?? '',
        desc: x.desc ?? '',
        transferredFrom: ['External', ...Object.values(CATEGORY_LABEL)].includes(x.transferredFrom) ? x.transferredFrom : 'External',
        stagedTargetWrapper: Object.values(CATEGORY_LABEL).includes(x.stagedTargetWrapper) ? x.stagedTargetWrapper : (category === AUTO_DEPOSIT ? CATEGORY_LABEL.other : category),
        // a working person's regular contribution written as a dated deposit (the household plan's later retiree,
        // src/solver/household.js), which lands whole and claims no room (buildContext's ledger); kept only where it is true
        ...(x.asContribution === true ? { asContribution: true } : {})
      };
    }) : [],
    oneOffCosts: Array.isArray(src.oneOffCosts) ? src.oneOffCosts.filter(isPlainObject).map(x => ({ id: String(x.id || 'cost_' + Math.random().toString(36).slice(2)), date: x.date || (x.year ? `${x.year}-01-01` : ''), year: num(x.year, x.date ? parseInt(String(x.date).slice(0, 4)) : ''), owner: x.owner === 'Partner' ? 'Partner' : 'Myself', amount: x.amount ?? '', desc: x.desc ?? '' })) : [],
    config: { ...DEFAULT_CONFIG, ...c }
  };
  // React inputs need strings/numbers, never null/undefined/objects. `keep` names the fields that are
  // legitimately structured (spendBands is a list, not an input) and must survive the scrub.
  const scrub = (obj, keep = []) => {
    Object.keys(obj).forEach(k => {
      if (keep.includes(k)) return;
      const v = obj[k];
      if (v === null || v === undefined || typeof v === 'object') obj[k] = '';
    });
  };
  // a dated salary schedule (research/solver/COUPLES-ANY.md B: the household plan's, which no page shows or edits) is a list
  scrub(plan.demographics, ['salaryByYearSelf', 'salaryByYearPart']); scrub(plan.spending, ['spendBands', 'policyOverride']); scrub(plan.config);
  if (typeof plan.config.harvestPersonalAllowance !== 'boolean') plan.config.harvestPersonalAllowance = plan.config.harvestPersonalAllowance === '' ? true : !!plan.config.harvestPersonalAllowance;
  // A plan saved before the rule existed has no field, and no field means what it always meant: fixed.
  if (typeof plan.config.guardrails !== 'boolean') plan.config.guardrails = false;
  // A plan saved before the field existed takes the default, as every other config field does.
  plan.config.lookaheadYears = clamp(Math.round(num(plan.config.lookaheadYears, DEFAULT_CONFIG.lookaheadYears)), 0, 15);
  if (!plan.config.valuationDate || isNaN(new Date(plan.config.valuationDate).getTime())) plan.config.valuationDate = todayISO();
  if (plan.demographics.planningMode !== 'single') plan.demographics.planningMode = 'couple';
  if (!DECUMULATION_POLICIES[plan.spending.decumulationPolicy]) plan.spending.decumulationPolicy = 'Bracket Fill Basic';
  // an unknown, duplicated or missing priority is repaired rather than rejected: a saved plan from
  // before priorities existed simply gets the default order
  plan.spending.priorities = normalizePriorities(plan.spending.priorities);
  plan.spending.priorityTolerances = normalizeTolerances(plan.spending.priorityTolerances);
  plan.spending.priorityMode = plan.spending.priorityMode === 'balanced' ? 'balanced' : 'ranked';
  if (!TAX_REGION_LABELS[plan.config.taxRegion]) plan.config.taxRegion = DEFAULT_CONFIG.taxRegion;
  if (!['Phased Drawdown', 'Full 25% Lump Sum'].includes(plan.spending.drawdownStrategy)) plan.spending.drawdownStrategy = 'Phased Drawdown';
  // accounts: always the ten canonical wrappers (four pots plus a cash ISA per owner), in canonical order, keeping any user values
  const rawAccounts = Array.isArray(src.accounts) ? src.accounts.filter(isPlainObject) : [];
  plan.accounts = defaultAccounts().map(def => {
    const found = rawAccounts.find(a => a.id === def.id);
    if (!found) return def;
    const merged = { ...def, ...found, id: def.id, owner: def.owner, category: def.category };
    ['balance', 'contrib', 'growth', 'unrealisedGain'].forEach(k => { const v = merged[k]; if (v === null || v === undefined || typeof v === 'object' || typeof v === 'boolean') merged[k] = ''; });
    if (!def.id.startsWith('other_')) delete merged.unrealisedGain; // only the GIA carries a cost basis
    if (typeof merged.risk !== 'string') merged.risk = def.risk;
    if (Array.isArray(found.contribByYear)) merged.contribByYear = found.contribByYear.map(v => num(v, 0));
    else delete merged.contribByYear;
    return merged;
  });
  // risk profiles: keep the six canonical tiers (custom values preserved), ignore unknown keys. A new plan
  // has no saved matrix, so it takes the published default deflated at its own inflation setting.
  const rp = isPlainObject(src.riskProfiles) ? src.riskProfiles
    : (plan.riskSource ? applyCmaPreset(plan.riskSource, plan.config.inflation) || {} : {});
  Object.keys(DEFAULT_RISK_PROFILES).forEach(k => {
    plan.riskProfiles[k] = { ...DEFAULT_RISK_PROFILES[k], ...(isPlainObject(rp[k]) ? rp[k] : {}) };
  });
  plan.accounts.forEach(a => { if (!plan.riskProfiles[a.risk]) a.risk = 'High Risk'; });
  // the solver's locks, only where the plan carries them: a plan without them normalises exactly as before (Part C Phase 7c).
  // `speed` 'fast', the speed mode (D97 (3): the chooser's shortlist on the paths that only count, src/solverSettings.js
  // speedOptions), kept only where the plan carries it, so every other plan normalises as before
  if (isPlainObject(src.solver)) plan.solver = { ...normalizeSolverLocks(src.solver), ...(isPlainObject(src.solver.aims) ? { aims: normalizeSolverAims(src.solver.aims) } : {}), ...(src.solver.speed === 'fast' ? { speed: 'fast' } : {}) };
  return plan;
}

// ---------------------------------------------------------------- tax & NIC (config driven)
function taxParams(cfgIn) {
  if (cfgIn && cfgIn.__isParams) return cfgIn;
  const cfg = isPlainObject(cfgIn) ? cfgIn : DEFAULT_CONFIG;
  const pa = Math.max(0, num(cfg.personalAllowance, DEFAULT_CONFIG.personalAllowance));
  const thr = Math.max(0, num(cfg.paTaperThreshold, DEFAULT_CONFIG.paTaperThreshold));
  const taperRate = clamp(num(cfg.paTaperRate, DEFAULT_CONFIG.paTaperRate), 0, 100) / 100;
  const basicLimit = Math.max(pa, num(cfg.basicBandLimit, DEFAULT_CONFIG.basicBandLimit));
  const higherLimit = Math.max(basicLimit, num(cfg.higherBandLimit, DEFAULT_CONFIG.higherBandLimit));
  const basicRate = clamp(num(cfg.basicTaxRate, DEFAULT_CONFIG.basicTaxRate), 0, 99) / 100;
  const higherRate = clamp(num(cfg.higherTaxRate, DEFAULT_CONFIG.higherTaxRate), 0, 99) / 100;
  const addRate = clamp(num(cfg.additionalTaxRate, DEFAULT_CONFIG.additionalTaxRate), 0, 99) / 100;
  const nicPT = Math.max(0, num(cfg.nicPrimaryThreshold, DEFAULT_CONFIG.nicPrimaryThreshold));
  const nicUEL = Math.max(nicPT, num(cfg.nicUpperEarningsLimit, DEFAULT_CONFIG.nicUpperEarningsLimit));
  const nicMain = clamp(num(cfg.nicMainRate, DEFAULT_CONFIG.nicMainRate), 0, 99) / 100;
  const nicUpper = clamp(num(cfg.nicUpperRate, DEFAULT_CONFIG.nicUpperRate), 0, 99) / 100;
  const c4Main = clamp(num(cfg.class4MainRate, DEFAULT_CONFIG.class4MainRate), 0, 99) / 100;
  const c4Upper = clamp(num(cfg.class4UpperRate, DEFAULT_CONFIG.class4UpperRate), 0, 99) / 100;
  const erNic = clamp(num(cfg.employerNicRate, DEFAULT_CONFIG.employerNicRate), 0, 99) / 100;
  const erPass = clamp(num(cfg.employerNicPassThrough, DEFAULT_CONFIG.employerNicPassThrough), 0, 100) / 100;
  const pclsProp = clamp(num(cfg.pclsProportion, DEFAULT_CONFIG.pclsProportion), 0, 100) / 100;
  const lsa = Math.max(0, num(cfg.pclsMaxCap, DEFAULT_CONFIG.pclsMaxCap));
  const isaAllowance = Math.max(0, num(cfg.isaAnnualAllowance, DEFAULT_CONFIG.isaAnnualAllowance));
  const pensionAllowance = Math.max(0, num(cfg.pensionAnnualAllowance, DEFAULT_CONFIG.pensionAnnualAllowance));
  const pensionNoEarningsLimit = clamp(num(cfg.pensionNoEarningsLimit, DEFAULT_CONFIG.pensionNoEarningsLimit), 0, pensionAllowance);
  const mpaaLimit = clamp(num(cfg.mpaaLimit, DEFAULT_CONFIG.mpaaLimit), 0, pensionAllowance);
  const aaTaperThr = Math.max(0, num(cfg.pensionTaperThreshold, DEFAULT_CONFIG.pensionTaperThreshold));
  const aaTaperRate = clamp(num(cfg.pensionTaperRate, DEFAULT_CONFIG.pensionTaperRate), 0, 100) / 100;
  const aaTaperFloor = clamp(num(cfg.pensionTaperFloor, DEFAULT_CONFIG.pensionTaperFloor), 0, pensionAllowance);
  // annual allowance at a given adjusted income (earnings stand in for adjusted income in this model)
  const aaAt = (income) => (aaTaperRate > 0 && income > aaTaperThr)
    ? Math.max(aaTaperFloor, pensionAllowance - (income - aaTaperThr) * aaTaperRate)
    : pensionAllowance;
  const cgtEnabled = cfg.cgtEnabled === undefined ? DEFAULT_CONFIG.cgtEnabled : !!cfg.cgtEnabled;
  const cgtAnnualExempt = Math.max(0, num(cfg.cgtAnnualExempt, DEFAULT_CONFIG.cgtAnnualExempt));
  const cgtBasicRate = clamp(num(cfg.cgtBasicRate, DEFAULT_CONFIG.cgtBasicRate), 0, 99) / 100;
  const cgtHigherRate = clamp(num(cfg.cgtHigherRate, DEFAULT_CONFIG.cgtHigherRate), 0, 99) / 100;
  const cashInterestTaxed = cfg.cashInterestTaxed === undefined ? DEFAULT_CONFIG.cashInterestTaxed : !!cfg.cashInterestTaxed;
  const psaBasic = Math.max(0, num(cfg.savingsAllowanceBasic, DEFAULT_CONFIG.savingsAllowanceBasic));
  const psaHigher = Math.max(0, num(cfg.savingsAllowanceHigher, DEFAULT_CONFIG.savingsAllowanceHigher));
  const srBand = Math.max(0, num(cfg.startingRateSavingsBand, DEFAULT_CONFIG.startingRateSavingsBand));
  const cashIsaCap = Math.max(0, num(cfg.cashIsaAllowance, DEFAULT_CONFIG.cashIsaAllowance));
  const cashIsaCapU65 = Math.max(0, num(cfg.cashIsaAllowanceUnder65, DEFAULT_CONFIG.cashIsaAllowanceUnder65));
  const cashIsaU65From = num(cfg.cashIsaAllowanceUnder65From, DEFAULT_CONFIG.cashIsaAllowanceUnder65From);
  // the cash ISA's own cap for an owner of `age` in `year`, never above the overall ISA allowance
  const cashIsaCapAt = (age, year) => Math.min(isaAllowance, (year >= cashIsaU65From && age < 65) ? Math.min(cashIsaCap, cashIsaCapU65) : cashIsaCap);
  const giaDividendYield = clamp(num(cfg.giaDividendYield, DEFAULT_CONFIG.giaDividendYield), 0, 100) / 100;
  const divAllowance = Math.max(0, num(cfg.dividendAllowance, DEFAULT_CONFIG.dividendAllowance));
  const divBasic = clamp(num(cfg.dividendBasicRate, DEFAULT_CONFIG.dividendBasicRate), 0, 99) / 100;
  const divHigher = clamp(num(cfg.dividendHigherRate, DEFAULT_CONFIG.dividendHigherRate), 0, 99) / 100;
  const divAdditional = clamp(num(cfg.dividendAdditionalRate, DEFAULT_CONFIG.dividendAdditionalRate), 0, 99) / 100;
  // allowance remaining at a given income
  const paAt = (income) => taperRate > 0 && income > thr ? Math.max(0, pa - (income - thr) * taperRate) : pa;
  const basicWidth = Math.max(0, basicLimit - pa);                 // basic band measured in taxable income
  const higherTop = Math.max(basicWidth, higherLimit - paAt(higherLimit)); // higher band upper limit in taxable income
  const taperEnd = taperRate > 0 ? thr + pa / taperRate : Infinity;

  /*
   * The band ladder. Income tax bands are devolved, so which set applies depends on where you live —
   * but only the bands are: National Insurance, capital gains tax, the personal allowance and its taper
   * are reserved and are read from their own fields above, untouched by the region.
   *
   * Wales sets its own rates under the Welsh Rates of Income Tax but has matched rUK every year since
   * the power was devolved, so it is an alias rather than a separate table. If that ever changes it
   * becomes a table here and nothing else moves.
   *
   * `grossLimits` are incomes at which the next band starts, the convention basicBandLimit already used.
   * `ladder` converts them to taxable income — income less whatever allowance survives the taper at that
   * income — because that is the space incomeTax slices in. The running max keeps it non-decreasing even
   * if someone types a lower threshold above a higher one in Config.
   */
  const region = ['ruk', 'scotland', 'wales'].includes(cfg.taxRegion) ? cfg.taxRegion : DEFAULT_CONFIG.taxRegion;
  const rate = (key) => clamp(num(cfg[key], DEFAULT_CONFIG[key]), 0, 99) / 100;
  const limit = (key) => Math.max(0, num(cfg[key], DEFAULT_CONFIG[key]));
  const bandSpec = region === 'scotland'
    ? [[limit('scotStarterLimit'), rate('scotStarterRate')], [limit('scotBasicLimit'), rate('scotBasicRate')],
      [limit('scotIntermediateLimit'), rate('scotIntermediateRate')], [limit('scotHigherLimit'), rate('scotHigherRate')],
      [limit('scotAdvancedLimit'), rate('scotAdvancedRate')], [Infinity, rate('scotTopRate')]]
    : [[basicLimit, basicRate], [higherLimit, higherRate], [Infinity, addRate]];
  const grossLimits = bandSpec.map(([l]) => l).filter(l => Number.isFinite(l));
  let running = 0;
  const ladder = bandSpec.map(([l, r]) => {
    const top = Number.isFinite(l) ? Math.max(running, l - paAt(l)) : Infinity;
    if (Number.isFinite(top)) running = top;
    return { top, rate: r };
  });
  // The income at which the first materially higher rate begins: where "fill the basic-rate band" should
  // stop. rUK's basic band ends where the higher rate starts, but Scotland's does not — three bands sit
  // below its 42% rate — so this is derived rather than read off a band name.
  const higherRateStartsAt = region === 'scotland' ? limit('scotIntermediateLimit') : basicLimit;
  // Capital gains tax charges the basic rate up to the *UK* basic-rate band even for a Scottish taxpayer,
  // so this is deliberately computed from the rUK figures and does not follow the region.
  const cgtBandWidth = Math.max(0, Math.max(pa, num(DEFAULT_CONFIG.basicBandLimit)) - pa);
  // Relief at source is given at the statutory 20% to everyone, including a Scottish starter-rate payer.
  const reliefAtSource = clamp(num(DEFAULT_CONFIG.basicTaxRate), 0, 99) / 100;

  const params = { __isParams: true, pa, thr, taperRate, basicLimit, higherLimit, basicRate, higherRate, addRate, nicPT, nicUEL, nicMain, nicUpper, c4Main, c4Upper, erNic, erPass, pclsProp, lsa, isaAllowance, pensionAllowance, pensionNoEarningsLimit, mpaaLimit, aaTaperThr, aaTaperRate, aaTaperFloor, aaAt, cgtEnabled, cgtAnnualExempt, cgtBasicRate, cgtHigherRate, paAt, basicWidth, higherTop, taperEnd, region, ladder, grossLimits, higherRateStartsAt, cgtBandWidth, reliefAtSource, cashInterestTaxed, psaBasic, psaHigher, srBand, giaDividendYield, divAllowance, divBasic, divHigher, divAdditional, cashIsaCap, cashIsaCapU65, cashIsaU65From, cashIsaCapAt };
  // Savings interest and dividends are taxed at the UK's rates and bands whatever the region (they are not devolved): a
  // Scottish taxpayer's interest was charged on the Scottish ladder before 21 Oct (42% where the UK charges 20%).
  const ukLadder = region === 'scotland' ? [[basicLimit, basicRate], [higherLimit, higherRate], [Infinity, addRate]].reduce((acc, [l, r]) => {
    const top = Number.isFinite(l) ? Math.max(acc.running, l - paAt(l)) : Infinity;
    if (Number.isFinite(top)) acc.running = top;
    acc.list.push({ top, rate: r });
    return acc;
  }, { running: 0, list: [] }).list : ladder;
  const divLadder = [{ top: basicWidth, rate: divBasic }, { top: higherTop, rate: divHigher }, { top: Infinity, rate: divAdditional }];
  // the tax on the slice of taxable income from `lo` to `hi` on a ladder of band tops
  const sliceTax = (lo, hi, lad) => {
    let tax = 0, a = 0;
    for (const b of lad) { const w = Math.min(hi, b.top) - Math.max(lo, a); if (w > 0) tax += w * b.rate; a = b.top; if (a >= hi) break; }
    return tax;
  };
  /*
   * ONE PERSON'S YEAR IN HMRC'S ORDER (ITA 2007 s23; the review of 9 Nov, item 3, D66). The allowance, tapered on ALL the
   * year's income, is set against non-savings income first (pay, pensions, rent), then interest, then dividends. Non-savings
   * income is taxed on the region's ladder, interest and dividends on the UK's bands above it. The starting rate band
   * (`srBand` less the taxable non-savings income) and the savings allowance (by the band the whole taxable income ends in)
   * are 0% at the bottom of the TAXABLE interest, and the dividend allowance 0% at the bottom of the TAXABLE dividends; both
   * still use band space. Before it, interest and dividends were taxed on what was known before the year's pension draw and
   * a worker's pay, the two 0% slices were placed over unused allowance, and the taper read non-savings income alone.
   * research/tests/engine-hmrc.test.mjs holds it to a reference written apart from it.
   */
  params.personTax = ({ nonSavings = 0, interest = 0, dividends = 0 } = {}) => {
    const ns = Math.max(0, nonSavings), i = Math.max(0, interest), d = Math.max(0, dividends);
    const allowance = paAt(ns + i + d);
    let left = allowance;
    const tns = Math.max(0, ns - left); left = Math.max(0, left - ns);
    const ti = Math.max(0, i - left); left = Math.max(0, left - i);
    const td = Math.max(0, d - left);
    const all = tns + ti + td;
    const onNonSavings = sliceTax(0, tns, ladder);
    const psa = all <= basicWidth ? psaBasic : (all <= higherTop ? psaHigher : 0);
    const zeroI = cashInterestTaxed ? Math.min(ti, Math.max(0, srBand - tns) + psa) : ti;
    const onInterest = sliceTax(tns + zeroI, tns + ti, ukLadder);
    const onDividends = sliceTax(tns + ti + Math.min(td, divAllowance), all, divLadder);
    return { allowance, onNonSavings, onInterest, onDividends, total: onNonSavings + onInterest + onDividends };
  };
  // the tax on the year's interest and on its dividends, each with the person's non-savings income below them
  params.savingsTax = (nonSavings, interest) => (!cashInterestTaxed || !(interest > 0) ? 0 : params.personTax({ nonSavings, interest }).onInterest);
  params.dividendTax = (nonSavings, interest, dividends) => (!(dividends > 0) ? 0 : params.personTax({ nonSavings, interest, dividends }).onDividends);
  return params;
}

// The marginal rate on the next pound of income, used where a decision depends on which band someone is in.
function marginalRateAt(income, cfg) {
  const p = taxParams(cfg);
  const g = Math.max(0, num(income, 0));
  const taxable = Math.max(0, g - p.paAt(g));
  if (taxable <= 0) return 0;
  for (const b of p.ladder) if (taxable <= b.top) return b.rate;
  return p.ladder[p.ladder.length - 1].rate;
}

function incomeTax(gross, cfg) {
  const p = taxParams(cfg);
  const g = Math.max(0, num(gross, 0));
  if (g <= 0) return 0;
  const taxable = Math.max(0, g - p.paAt(g));
  // Walks whichever ladder the region gave us: three bands for rUK and Wales, six for Scotland.
  let tax = 0, prev = 0;
  for (const b of p.ladder) {
    if (taxable <= prev) break;
    tax += (Math.min(taxable, b.top) - prev) * b.rate;
    prev = b.top;
  }
  return tax;
}
function calculateUKNetIncome(gross, cfg) { const g = Math.max(0, num(gross, 0)); return g - incomeTax(g, cfg); }
/*
 * National Insurance on earned income. Employees pay Class 1; the self-employed pay Class 4, which shares
 * the same two thresholds but charges a lower main rate. Pass `selfEmployed` to price trading profit.
 */
function nicFor(gross, cfg, selfEmployed = false) {
  const p = taxParams(cfg);
  const g = Math.max(0, num(gross, 0));
  const main = selfEmployed ? p.c4Main : p.nicMain;
  const upper = selfEmployed ? p.c4Upper : p.nicUpper;
  let nic = 0;
  if (g > p.nicPT) nic += (Math.min(g, p.nicUEL) - p.nicPT) * main;
  if (g > p.nicUEL) nic += (g - p.nicUEL) * upper;
  return nic;
}
function calculateUKTaxAndNIC(income, cfg, selfEmployed = false) { return incomeTax(income, cfg) + nicFor(income, cfg, selfEmployed); }

/*
 * Income-tax breakpoints (gross income) where the marginal rate changes; used by the analytic solver in
 * grossPensionNeededForNet, which relies on its objective being linear *between* consecutive breakpoints.
 * Missing one does not raise an error, it silently bends a line the solver assumes is straight — so every
 * band the ladder has must contribute its own point, which is why this is generated rather than listed.
 * The ladder is derived from these same gross limits, so each limit is exactly where its band ends.
 */
function taxBreakpoints(p) {
  const pts = [p.pa, ...p.grossLimits, p.thr, p.taperEnd];
  return pts.filter(x => Number.isFinite(x) && x > 0).sort((a, b) => a - b);
}

/*
 * Pension contribution economics, for both ways of getting relief.
 *
 * Employed (salary sacrifice): `sacrifice` is the gross salary given up, so relief comes at the marginal
 * rate of income tax AND employee NIC, and the pension receives the sacrifice plus any employer NIC saving
 * passed through.
 *
 * Self-employed (relief at source): a personal contribution cannot be sacrificed out of trading profit, so
 * Class 4 NIC is charged on the profit either way and the only relief is income tax — at the marginal rate,
 * plus any personal allowance restored, which is what differencing the income tax charge captures. There is
 * no employer, so the pass-through factor is forced to 1 whatever the config says.
 */
function passThroughFactor(p, selfEmployed = false) { return selfEmployed ? 1 : 1 + p.erNic * p.erPass; }

/*
 * THE CAP ON SALARY SACRIFICE'S NIC RELIEF (D138; D137 (4) and test K, research/solver/results-save-k.txt): from April 2029
 * an employee's salary sacrifice is relieved of employee NIC on its first £2,000 a year alone, the rest relieved of income tax
 * only. The app holds the £2,000 constant in real terms, as it holds a threshold the law fixes in cash. Only the savings
 * split's routes take it (saveSplitRoutes, an employee's moved saving from 2029): a plan's own contributions are not priced
 * while working, and the app's contribution strategies keep the relief uncapped. `nicCap` below is the cap in pounds of
 * sacrifice (Infinity, the default, is no cap, by the same code as before it). SAVE_NIC_CAP.on false (research only)
 * prices the split's routes without it, as the split's v2 registered them. What it leaves (the reviewer on D138's change of
 * default, MINOR 4): (a) the employer's NIC passed to the pension (Config's pass-through) is still credited on the whole
 * sacrifice, where from April 2029 the employer saves NIC on its first £2,000 alone; pricing it here alone would part the
 * routes' sacrifice from the engine's taxable pay (taxablePayOf takes a contribution over the whole pass-through factor in
 * every year), and the cap for a plan's own contributions is queued as its own engine change (D134 (3)); (b) the cap counts
 * the whole pension figure, the employer's part included, as the employee's own sacrifice, which the plan does not record,
 * so where the employee's own sacrifice is under £2,000 it binds earlier than the law's; (c) a blank salary takes the
 * assumed rate, uncapped.
 */
const SAVE_NIC_CAP = { from: 2029, amount: 2000, on: true };
function calculateMarginalRelief(salaryInput, sacrificeInput, cfg, selfEmployed = false, nicCap = Infinity) {
  const p = taxParams(cfg);
  const sacrifice = Math.max(0, num(sacrificeInput, 0));
  const passFactor = passThroughFactor(p, selfEmployed);
  // used when earnings are unknown: income tax only for the self-employed, tax + NIC for an employee
  const assumedRate = selfEmployed ? p.higherRate : p.higherRate + p.nicUpper;
  if (sacrifice <= 0) return { netCost: 0, taxSaved: 0, reliefRate: assumedRate * 100, pensionCredit: 0, sacrifice: 0 };
  const salary = num(salaryInput, 0);
  if (salary <= 0) {
    const taxSaved = sacrifice * assumedRate;
    return { netCost: sacrifice - taxSaved, taxSaved, reliefRate: assumedRate * 100, pensionCredit: sacrifice * passFactor, sacrifice, assumed: true };
  }
  const g = Math.min(sacrifice, salary);
  // an employee's NIC relief on the first nicCap of the sacrifice alone, where the cap binds (SAVE_NIC_CAP); below it, as before
  const taxSaved = selfEmployed
    ? incomeTax(salary, p) - incomeTax(salary - g, p)
    : g > nicCap
      ? (incomeTax(salary, p) - incomeTax(salary - g, p)) + (nicFor(salary, p) - nicFor(salary - Math.max(0, nicCap), p))
      : calculateUKTaxAndNIC(salary, p) - calculateUKTaxAndNIC(salary - g, p);
  return { netCost: g - taxSaved, taxSaved, reliefRate: g > 0 ? (taxSaved / g) * 100 : 0, pensionCredit: g * passFactor, sacrifice: g, capped: g < sacrifice };
}
// Net take-home cost of a pension contribution (the amount landing in the pension, incl. employer pass-through).
function netCostOfPensionContrib(contrib, salaryInput, cfg, selfEmployed = false, nicCap = Infinity) {
  const p = taxParams(cfg);
  const passFactor = passThroughFactor(p, selfEmployed);
  return calculateMarginalRelief(salaryInput, Math.max(0, num(contrib, 0)) / passFactor, cfg, selfEmployed, nicCap).netCost;
}
/*
 * The pay income tax is charged on (the review of 9 Nov, item 3, D66): the salary less what is given up to the pension, as
 * calculateMarginalRelief prices either route (an employee's sacrifice, the self-employed's relief at source), never below
 * nothing. It sits at the bottom of the person's stack (stepYear step 4); the solver's model takes the same rule.
 */
function taxablePayOf(pay, penContrib, cfg, selfEmployed = false) {
  const g = num(pay, 0);
  if (!(g > 0)) return 0;
  return Math.max(0, g - Math.min(Math.max(0, num(penContrib, 0)) / passThroughFactor(taxParams(cfg), selfEmployed), g));
}
// Pension credit obtainable for a given net take-home cost (inverse of the above), capped at maxCredit.
function grossUpNet(netAmount, salaryInput, cfg, maxCredit = Infinity, selfEmployed = false, nicCap = Infinity) {
  const net = Math.max(0, num(netAmount, 0));
  if (net <= 0) return 0;
  const p = taxParams(cfg);
  const passFactor = passThroughFactor(p, selfEmployed);
  const salary = num(salaryInput, 0);
  let credit;
  if (salary <= 0) {
    credit = (net / Math.max(0.01, 1 - (selfEmployed ? p.higherRate : p.higherRate + p.nicUpper))) * passFactor;
  } else {
    // netCost(sacrifice) is increasing; bisection on sacrifice in [0, salary]
    let lo = 0, hi = salary;
    if (calculateMarginalRelief(salary, hi, p, selfEmployed, nicCap).netCost <= net) credit = hi * passFactor;
    else {
      for (let i = 0; i < 48; i++) {
        const mid = (lo + hi) / 2;
        if (calculateMarginalRelief(salary, mid, p, selfEmployed, nicCap).netCost < net) lo = mid; else hi = mid;
      }
      credit = ((lo + hi) / 2) * passFactor;
    }
  }
  return Math.min(credit, Math.max(0, maxCredit));
}
// Additional pension credit purchasable for `netAmount` on top of an existing `baseCredit` (marginal pricing).
function grossUpNetIncremental(netAmount, salaryInput, cfg, baseCredit = 0, maxAdditional = Infinity, selfEmployed = false) {
  const net = Math.max(0, num(netAmount, 0));
  if (net <= 0 || !(maxAdditional > 0)) return 0;
  const base = Math.max(0, num(baseCredit, 0));
  if (base <= 0) return grossUpNet(net, salaryInput, cfg, maxAdditional, selfEmployed);
  const p = taxParams(cfg);
  const passFactor = passThroughFactor(p, selfEmployed);
  const salary = num(salaryInput, 0);
  const costBase = netCostOfPensionContrib(base, salaryInput, p, selfEmployed);
  const maxTotal = salary > 0 ? Math.min(base + maxAdditional, salary * passFactor) : base + maxAdditional;
  if (maxTotal <= base) return 0;
  if (netCostOfPensionContrib(maxTotal, salaryInput, p, selfEmployed) - costBase <= net) return maxTotal - base;
  let lo = base, hi = maxTotal;
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    if (netCostOfPensionContrib(mid, salaryInput, p, selfEmployed) - costBase < net) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2 - base;
}

/*
 * Analytic "gross pension withdrawal needed for a net amount".
 * A gross withdrawal G yields taxFree = min(p*G, headroom) (unless fully crystallised) and taxable G - taxFree,
 * which is taxed on top of `otherTaxable`. The taxable part may not push income above `ceiling`.
 * Returns the smallest G that delivers `target` net, or the largest G allowed by the ceiling if the target
 * cannot be reached within it. Exact (piecewise-linear) and cheap.
 * `above` ({ interest, dividends }, the review of 9 Nov's item 3): the year's interest and dividends, which HMRC stacks above
 * the draw; the draw then pays for the rise in their tax and the taper's (grossWithSavingsAbove), in the same one pass.
 */
function grossPensionNeededForNet(netTarget, otherTaxableIncome = 0, cfg, isFullyCrystallized = false, pclsHeadroom = Infinity, maxTaxableCeiling = Infinity, above = null) {
  const target = num(netTarget, 0);
  if (target <= 0) return 0;
  const p = taxParams(cfg);
  if (above && (above.interest > 0 || above.dividends > 0)) return grossWithSavingsAbove(target, Math.max(0, num(otherTaxableIncome, 0)), p, isFullyCrystallized, pclsHeadroom, maxTaxableCeiling, above.interest || 0, above.dividends || 0, above.billAt || null);
  const T0 = Math.max(0, num(otherTaxableIncome, 0));
  const headroom = isFullyCrystallized ? 0 : Math.max(0, num(pclsHeadroom, 0));
  const prop = isFullyCrystallized ? 0 : p.pclsProp;
  const room = Math.max(0, num(maxTaxableCeiling, Infinity) - T0);
  if (!(room > 0) && (prop <= 0 || headroom <= 0)) return 0;

  const Gh = prop > 0 ? headroom / prop : Infinity;             // gross at which the tax-free cap binds
  const taxFreeOf = (G) => Math.min(prop * G, headroom);
  const taxableOf = (G) => G - taxFreeOf(G);
  // largest gross whose taxable part is <= x
  const gMaxForTaxable = (x) => {
    if (prop >= 1) return Gh + x;
    const g1 = x / (1 - prop);
    return g1 <= Gh ? g1 : headroom + x;
  };
  const netBase = calculateUKNetIncome(T0, p);
  const f = (G) => taxFreeOf(G) + calculateUKNetIncome(T0 + taxableOf(G), p) - netBase;

  const Gmax = Number.isFinite(room) ? gMaxForTaxable(room) : Infinity;
  if (Number.isFinite(Gmax) && f(Gmax) <= target) return Gmax;

  // breakpoints of f in gross space
  const bps = [];
  if (Number.isFinite(Gh)) bps.push(Gh);
  taxBreakpoints(p).forEach(B => { if (B > T0) bps.push(gMaxForTaxable(B - T0)); });
  bps.push(Number.isFinite(Gmax) ? Gmax : Math.max(target * 4, 1000));
  bps.sort((a, b) => a - b);

  let ga = 0, fa = 0;
  for (const gb of bps) {
    if (gb <= ga) continue;
    const fb = f(gb);
    if (fb >= target) {
      // f is linear on [ga, gb]; interpolate, then polish with a few secant/bisection steps for safety
      let lo = ga, hi = gb, flo = fa, fhi = fb;
      let G = fhi > flo ? lo + (target - flo) * (hi - lo) / (fhi - flo) : hi;
      for (let i = 0; i < 25; i++) {
        const fg = f(G);
        if (Math.abs(fg - target) < 1e-6) break;
        if (fg < target) { lo = G; flo = fg; } else { hi = G; fhi = fg; }
        const sec = fhi > flo ? lo + (target - flo) * (hi - lo) / (fhi - flo) : (lo + hi) / 2;
        G = (sec > lo && sec < hi) ? sec : (lo + hi) / 2;
      }
      return Math.min(G, Number.isFinite(Gmax) ? Gmax : G);
    }
    ga = gb; fa = fb;
  }
  // beyond the last breakpoint the marginal net rate is constant: extend linearly
  const gProbe = ga * 2 + 1000;
  const fProbe = f(gProbe);
  const slope = (fProbe - fa) / (gProbe - ga);
  if (!(slope > 1e-9)) return Number.isFinite(Gmax) ? Gmax : ga;
  const G = ga + (target - fa) / slope;
  return Number.isFinite(Gmax) ? Math.min(G, Gmax) : G;
}

/*
 * The gross draw that delivers `target` net with the year's interest `i` and dividends `d` stacked above it (HMRC's order, the
 * review of 9 Nov's item 3): the net is the tax-free part plus the rise in the person's net income, every tax of the year in
 * it (taxParams' personTax: the draw's own income tax, the taper on all income, and the interest's and dividends' tax moving
 * up). That net has kinks wherever a slice of the year crosses an edge (the allowance, the starting rate band, a band's top,
 * the taper), each met by the non-savings income alone, with the interest, and with the dividends; and it steps down where
 * the savings allowance halves at the basic band's top. The edges bracket it; inside a bracket the low end always delivers
 * less than the target and the high end at least it, so the high end is returned: never less than asked, and the smallest
 * gross that delivers it.
 */
function grossWithSavingsAbove(target, T0, p, isFullyCrystallized, pclsHeadroom, maxTaxableCeiling, i, d, billAt = null) {
  const headroom = isFullyCrystallized ? 0 : Math.max(0, num(pclsHeadroom, 0));
  const prop = isFullyCrystallized ? 0 : p.pclsProp;
  const room = Math.max(0, num(maxTaxableCeiling, Infinity) - T0);
  if (!(room > 0) && (prop <= 0 || headroom <= 0)) return 0;
  const Gh = prop > 0 ? headroom / prop : Infinity;
  const taxFreeOf = (G) => Math.min(prop * G, headroom);
  const gMaxForTaxable = (x) => { if (prop >= 1) return Gh + x; const g1 = x / (1 - prop); return g1 <= Gh ? g1 : headroom + x; };
  // `billAt` (a caller's memo of personTax at this interest and these dividends, fast.js) or personTax itself
  const netAt = (N) => N - (billAt ? billAt(N) : p.personTax({ nonSavings: N, interest: i, dividends: d })).total;
  const netBase = netAt(T0);
  const f = (G) => taxFreeOf(G) + netAt(T0 + G - taxFreeOf(G)) - netBase;
  const Gmax = Number.isFinite(room) ? gMaxForTaxable(room) : Infinity;
  if (Number.isFinite(Gmax) && f(Gmax) <= target) return Gmax;
  const levels = new Set();
  for (const B of [...taxBreakpoints(p), p.pa + p.srBand]) for (const off of [0, i, i + d, i + Math.min(d, p.divAllowance)]) { const n = B - off; if (n > T0) levels.add(n); }
  const bps = [];
  if (Number.isFinite(Gh)) bps.push(Gh);
  for (const n of levels) bps.push(gMaxForTaxable(n - T0));
  bps.push(Number.isFinite(Gmax) ? Gmax : Math.max(target * 4, 1000));
  bps.sort((a, b) => a - b);
  let lo = 0, flo = 0, hi = NaN, fhi = NaN;
  for (const gb of bps) {
    if (gb <= lo) continue;
    const fb = f(gb);
    if (fb >= target) { hi = gb; fhi = fb; break; }
    lo = gb; flo = fb;
  }
  // past the last edge the net rises at a constant rate: step out until it reaches the target
  if (!(hi > lo)) { hi = Math.max(lo * 2, lo + 1000); fhi = f(hi); for (let k = 0; k < 60 && fhi < target; k++) { lo = hi; flo = fhi; hi *= 2; fhi = f(hi); } }
  // secant steps inside the bracket, every third a halving, so a kink or the allowance's step cannot stall it
  for (let k = 0; k < 80 && hi - lo > 1e-9 * Math.max(1, hi); k++) {
    const sec = fhi > flo ? lo + (target - flo) * (hi - lo) / (fhi - flo) : (lo + hi) / 2;
    const G = k % 3 === 2 || !(sec > lo && sec < hi) ? (lo + hi) / 2 : sec;
    const fg = f(G);
    if (fg >= target) { hi = G; fhi = fg; if (fg - target < 1e-7) break; } else { lo = G; flo = fg; }
  }
  return Number.isFinite(Gmax) ? Math.min(hi, Gmax) : hi;
}

/*
 * WHERE A PENSION DRAW WITH A CEILING STOPS, GIVEN THE YEAR'S INTEREST AND DIVIDENDS (the review of 11 Nov, ANSWERS.md section 5;
 * D72's question, D79, D91). A ceiling is on the year's WHOLE taxable income, not on the non-savings part of it: HMRC stacks
 * interest and dividends above the draw (item 3), so a draw that fills a band to its top pushes every pound of them over it.
 * Returns the non-savings income a draw may take the person to, never past `ceiling`: the larger of
 *   (a) the ceiling less the year's interest and dividends. The basic step's test is against the UK's threshold whatever the
 *       region (savings income is taxed on the UK's bands), so a Scottish draw stops at its own ceiling or at the UK threshold
 *       less the interest and dividends, whichever comes first;
 *   (b) the furthest a draw can go inside the allowance with the year's whole bill unchanged: the allowance itself while the
 *       starting rate band and the savings allowance still cover the interest and the dividend allowance the dividends, short
 *       of it where they do not. Nothing is counted as free once the whole income is at the UK threshold.
 * So the allowance's ceiling is (b), and a band's ceiling is (a) or whatever of the draw is free. With no interest and no
 * dividends it is `ceiling` itself, to the bit. research/tests/engine-hmrc.test.mjs section E holds it to hand cases and to a
 * search over a reference bill written apart from the engine's.
 */
function pensionCeiling(cfg, ceiling, otherTaxableIncome, interest, dividends) {
  const i = Math.max(0, num(interest, 0)), d = Math.max(0, num(dividends, 0));
  if (!(i > 0 || d > 0) || !Number.isFinite(ceiling)) return ceiling;
  const p = taxParams(cfg), T0 = Math.max(0, num(otherTaxableIncome, 0)), U = p.basicLimit;
  if (T0 >= ceiling) return ceiling;   // already at it: no draw
  const a = Math.min(ceiling, (ceiling === p.higherRateStartsAt ? U : ceiling) - i - d);
  let free = T0;
  if (T0 + i + d < U) {
    let top = Math.min(ceiling, p.pa, U - i - d);
    if (i > 0 && p.cashInterestTaxed) top = Math.min(top, p.pa + p.srBand + p.psaBasic - i);
    if (d > p.divAllowance && T0 + i < p.pa) top = Math.min(top, p.pa + p.divAllowance - i - d);
    free = Math.max(T0, top);
  }
  return Math.max(a, free);
}

// ---------------------------------------------------------------- seeded randomness
function mulberry32(seed) {
  let a = (seed >>> 0) || 0x9E3779B9;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gaussianPath(seed, n) {
  const rng = mulberry32(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let u1 = rng(), u2 = rng();
    while (u1 <= 1e-12) u1 = rng();
    out[i] = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }
  return out;
}

// ---------------------------------------------------------------- simulation context
/*
 * buildContext converts a (possibly messy) plan into fully sanitised numbers once, so the per-year
 * engine never touches raw strings. It also collects validation warnings for the UI.
 */
function buildContext(rawPlan) {
  const plan = normalizePlan(rawPlan);
  const warnings = [];
  const d = plan.demographics, s = plan.spending, c = plan.config;
  const isCouple = d.planningMode !== 'single';
  const P = taxParams(c);
  // resolved up here because deposit routing (below) needs the policy's depositOrder, and that runs
  // long before the context object itself is assembled
  /*
   * A policy is normally one of the named five. A search that composes its own draw order hands it in as
   * `spending.policyOverride` - steps, harvest, and optionally the deposit and cost orders - and the
   * context runs it exactly as it would a named one. Nothing else in the plan changes, so a winner found
   * this way is a plan the rest of the app can already simulate, chart and print.
   */
  const ov = s.policyOverride;
  const policyForDeposits = (ov && Array.isArray(ov.steps) && ov.steps.length)
    ? { steps: ov.steps, harvest: !!ov.harvest, depositOrder: Array.isArray(ov.depositOrder) ? ov.depositOrder : null,
        costSteps: Array.isArray(ov.costSteps) ? ov.costSteps : null, custom: true }
    : (DECUMULATION_POLICIES[s.decumulationPolicy] || DECUMULATION_POLICIES['Bracket Fill Basic']);

  const req = (label, v, fallback, lo, hi) => {
    if (isBlank(v)) { warnings.push(`${label} is blank; using ${fallback}.`); return fallback; }
    const n = clamp(num(v, fallback), lo, hi);
    if (n !== num(v, fallback)) warnings.push(`${label} clamped to ${n}.`);
    return n;
  };
  const ageSelf0 = req('Current age (Myself)', d.currentAgeSelf, 40, 0, 120);
  const agePart0 = isCouple ? req('Current age (Partner)', d.currentAgePart, ageSelf0, 0, 120) : 0;
  const retireSelf = req('Retirement age (Myself)', d.retireAgeSelf, 60, 0, 120);
  const retirePart = isCouple ? req('Retirement age (Partner)', d.retireAgePart, 60, 0, 120) : 999;
  // D150 (research/solver/COUPLES-ANY.md amendment 3, D): a plan the solver derives from a couple's plan as entered (the
  // mirror, src/coupleOrder.js otherOrder, and the household and single plans cut from it, which carry its demographics)
  // keeps the plan's own years where its end age passes 120, marked `derivedEnd`; a plan as entered stops at 120 as before
  let terminalAge = clamp(num(d.terminalAge, 100), 1, d.derivedEnd === true ? 240 : 120);
  if (terminalAge <= ageSelf0) { warnings.push(`Terminal age (${terminalAge}) must exceed current age; using ${ageSelf0 + 1}.`); terminalAge = ageSelf0 + 1; }
  const nmpa = clamp(num(d.privatePensionAge, 58), 0, 120);
  const spa = clamp(num(d.statePensionAge, 68), 0, 120);
  const targetSpend = Math.max(0, num(s.targetSpend, 0));
  if (targetSpend <= 0) warnings.push('Net living spend is blank or zero. No retirement spending is being modelled.');
  // the spending floor (Part D): the least the household will live on, as a fraction of the year's target so
  // spend bands keep their shape; blank or equal to the target means fixed spending, exactly today's question
  const floorSpend = clamp(num(s.floorSpend, 0), 0, targetSpend);
  const floorFrac = targetSpend > 0 && floorSpend > 0 ? floorSpend / targetSpend : 0;
  // how sure the household wants to be of never spending below the floor, as a fraction (Part D)
  const floorConfidence = clamp(num(s.floorConfidence, 90), 50, 99) / 100;
  const totalYears = Math.max(1, Math.round(terminalAge - ageSelf0));
  const valuationDate = c.valuationDate || todayISO();
  const yf = calculateYearFraction(valuationDate);
  const baseYear = parseInt(String(valuationDate).slice(0, 4)) || new Date().getFullYear();

  const riskOf = (key) => plan.riskProfiles[key] || DEFAULT_RISK_PROFILES['High Risk'];
  const accountsAll = plan.accounts.filter(a => isCouple || a.owner === 'Myself').map(a => {
    const prof = riskOf(a.risk);
    const [cat, owner] = a.id.split('_');
    const real = clamp(num(prof.real, 0), -50, 50) / 100;
    const vol = clamp(num(prof.volatility, 12), 0, 100) / 100;
    // uncertainty about the expected return itself, drawn once per path rather than once per year
    const sigmaParam = clamp(num(prof.sigmaParam, 0), 0, 100) / 100;
    return {
      id: a.id, cat, owner, ownerLabel: a.owner,
      balance: Math.max(0, num(a.balance, 0)),
      // embedded gain in today's GIA balance; blank means the balance is treated as all cost
      unrealisedGain: clamp(num(a.unrealisedGain, 0), 0, Math.max(0, num(a.balance, 0))),
      contrib: Math.max(0, num(a.contrib, 0)),
      growth: clamp(num(a.growth, 0), -100, 100) / 100,
      contribByYear: Array.isArray(a.contribByYear) ? a.contribByYear.map(v => Math.max(0, num(v, 0))) : null,
      risk: a.risk,
      real: real,
      vol,
      sigmaParam,
      equityWeight: RISK_EQUITY_WEIGHTS[a.risk] !== undefined ? RISK_EQUITY_WEIGHTS[a.risk] : 0.9,
      isCash: a.risk === 'Cash Equivalents'
    };
  });
  /*
   * THE CASH ISA IS A WRAPPER THE PERSON SEES AND A POT THE ENGINE DOES NOT. A cash ISA and taxable cash
   * are the same asset with one difference, the tax on the interest, so the engine keeps one cash pot per
   * owner and remembers how much of it is sheltered (`state.cashIsa`). The balance entered here becomes
   * that sheltered portion; the contribution is folded into the cash pot's and counts against the ISA
   * allowance. Documented as a modelling choice: it keeps the solver's grid to three pots.
   */
  const cashIsaByOwner = {};
  accountsAll.filter(a => a.cat === 'cashIsa').forEach(r => {
    cashIsaByOwner[r.owner] = { balance: r.balance, contrib: r.contrib };
    const cashAcc = accountsAll.find(a => a.cat === 'cash' && a.owner === r.owner);
    if (cashAcc) { cashAcc.balance += r.balance; cashAcc.contrib += r.contrib; }
  });
  const accounts = accountsAll.filter(a => a.cat !== 'cashIsa');
  const acc = {};
  accounts.forEach(a => { acc[a.id] = a; });
  const owners = (isCouple ? OWNERS : ['self']).map(o => ({
    key: o, label: OWNER_LABEL[o],
    age0: o === 'self' ? ageSelf0 : agePart0,
    retireAge: o === 'self' ? retireSelf : retirePart,
    salary: Math.max(0, num(o === 'self' ? d.salarySelf : d.salaryPart, 0)),
    // a dated schedule of pay by plan year (research/solver/COUPLES-ANY.md B: the household plan's, its two people's salaries
    // added, each at its own growth), which salaryAtYear reads in place of the salary and its growth; no page sets it
    ...(v => (Array.isArray(v) ? { salaryByYear: v.map(x => Math.max(0, num(x, 0))) } : {}))(o === 'self' ? d.salaryByYearSelf : d.salaryByYearPart),
    // growth on top of inflation; 0 leaves pay flat in today's money
    salaryGrowth: clamp(num(o === 'self' ? d.salaryGrowthSelf : d.salaryGrowthPart, 0), -100, 100) / 100,
    // trading profit rather than salary: Class 4 NIC, and pension relief at the income tax rate only
    selfEmployed: (o === 'self' ? d.employmentSelf : d.employmentPart) === 'self-employed',
    // how they pay into their pension (D154 (3)), which every price of a contribution reads: the self-employed, and an employee
    // paying from net pay or by relief at source ('employed-net') or not sure how ('employed-unsure', the cautious reading), are
    // relieved of income tax alone with no employer NIC passed through; an employee by salary sacrifice ('employed', the
    // default, the app's assumption until now) of income tax and NIC. The NIC charged on the pay is the employment's, above
    reliefTaxOnly: reliefTaxOnlyOf(o === 'self' ? d.employmentSelf : d.employmentPart),
    cgtGainsUsed: Math.max(0, num(o === 'self' ? d.cgtGainsUsedSelf : d.cgtGainsUsedPart, 0)),
    // unused annual allowance from the three tax years before the projection starts
    cfBroughtForward: Math.max(0, num(o === 'self' ? d.cfBroughtForwardSelf : d.cfBroughtForwardPart, 0)),
    // age from which the MPAA applies; NaN when the owner has not flexibly accessed a pension
    mpaaAge: num(o === 'self' ? d.mpaaAgeSelf : d.mpaaAgePart, NaN),
    statePension: Math.max(0, num(o === 'self' ? d.statePensionSelf : d.statePensionPart, 0)),
    ids: { pen: accountId('pen', o), isa: accountId('isa', o), other: accountId('other', o), cash: accountId('cash', o) },
    // the sheltered part of the cash pot at the start, and the yearly cash ISA subscription while working
    cashIsa0: cashIsaByOwner[o] ? cashIsaByOwner[o].balance : 0,
    cashIsaContrib: cashIsaByOwner[o] ? cashIsaByOwner[o].contrib : 0
  }));
  owners.forEach(o => {
    const pen = acc[o.ids.pen]; const isa = acc[o.ids.isa];
    const ownerAA = P.aaAt(o.salary);
    if (pen && pen.contrib > ownerAA) warnings.push(`${o.label}: pension contribution £${fmtNum(Math.round(pen.contrib))} exceeds the annual allowance £${fmtNum(Math.round(ownerAA))}${ownerAA < P.pensionAllowance ? ` (tapered from £${fmtNum(P.pensionAllowance)} because earnings exceed £${fmtNum(P.aaTaperThr)})` : ''}.`);
    if (isa && isa.contrib > P.isaAllowance) warnings.push(`${o.label}: ISA contribution £${fmtNum(Math.round(isa.contrib))} exceeds the ISA allowance £${fmtNum(P.isaAllowance)}.`);
    if (o.salary > 0 && pen && pen.contrib > o.salary) warnings.push(`${o.label}: pension contribution exceeds ${o.selfEmployed ? 'trading profit' : 'salary'}.`);
    // the pass-through only exists because an employer saves NIC on sacrificed salary; a sole trader has neither
    if (o.selfEmployed && P.erPass > 0) warnings.push(`${o.label}: employer NIC pass-through is set to ${Math.round(P.erPass * 100)}% in Details, Assumptions, but the self-employed have no employer, so it is ignored for this person.`)
    // an employer saves NIC only on salary sacrifice, so a net-pay contribution has none to pass through (D154 (3))
    else if (o.reliefTaxOnly && P.erPass > 0 && ROUTE_PLANT.rule !== 'nowarn') warnings.push(`${o.label}: employer NIC pass-through is set to ${Math.round(P.erPass * 100)}% in Details, Assumptions, but it applies only to salary sacrifice, so it is ignored for this person.`);
    const gia = acc[o.ids.other];
    if (P.cgtEnabled && gia && gia.balance > 0 && isBlank(plan.accounts.find(a => a.id === o.ids.other)?.unrealisedGain)) {
      // One line. Three sentences of explanation in a banner that lists five of these is a paragraph
      // nobody reads; what a reader needs here is which figure is being assumed and where to change it.
      warnings.push(`${o.label}: no unrealised gain on Other Investments, so only future growth is taxed (Advanced inputs).`);
    }
    // the plan draws taxable pension income while still paying in, so the MPAA is triggered and the excess
    // would face an annual allowance charge (which the model does not itself levy)
    if (Number.isFinite(o.mpaaAge) && pen && pen.contrib > P.mpaaLimit && o.mpaaAge < o.retireAge) {
      warnings.push(`${o.label}: the plan draws taxable pension income from age ${o.mpaaAge} while still contributing £${fmtNum(Math.round(pen.contrib))}/yr, which permanently cuts the annual allowance to £${fmtNum(P.mpaaLimit)} (the money purchase annual allowance). Contributions above that would face an annual allowance charge.`);
    }
    if (o.retireAge < o.age0 && o.age0 < 120) { /* already retired: fine */ }
  });
  if (isCouple) {
    const firstRetire = Math.min(...owners.map(o => o.retireAge));
    const stillWorking = owners.filter(o => o.retireAge > firstRetire && o.salary <= 0);
    if (stillWorking.length) warnings.push(`${stillWorking.map(w => w.label).join(', ')} keeps working after the first retirement but has no salary entered, so the full joint spend will be drawn from the portfolio in those years.`);
  }

  /*
   * NOT BEFORE THE OWNER RETIRES.
   *
   * Nothing is drawn while somebody is still working - the model's accumulation phase is driven by the
   * contributions you enter, not by a household budget - so a stream that starts earlier was computed,
   * taxed, shown in the year-by-year table and then dropped on the floor. Measured: £20,000 a year from
   * 45 to 59 moved the survival rate by 0.0 points and the pot at 95 by £0. The input will not take an
   * earlier age now; this clamp is for a plan imported or saved before it would not.
   */
  const incomeFloor = (i) => {
    const o = owners.find(x => x.key === (i.owner === 'Partner' ? 'part' : 'self')) || owners[0];
    return o ? o.retireAge : 0;
  };
  plan.otherIncomes.filter(i => isCouple || i.owner === 'Myself').forEach(i => {
    const floor = incomeFloor(i);
    const from = Math.max(0, num(i.startAge, 0));
    if (from < floor) warnings.push(`${i.name ? `${i.name}: ` : ''}income starting at ${from} is counted from ${floor}, the age ${i.owner === 'Partner' ? 'your partner retires' : 'you retire'} — nothing is drawn or saved before then.`);
  });
  // a blank end age runs the income "to the end of the plan" (the field's own hint) in its owner's age: the first person's end
  // age for the first person's, and for the partner's their age in the plan's last year where they are the older, so a partner
  // older than the first person keeps it to the end (the reviewer of 15 Nov; research/tests/income-end.test.mjs). A partner
  // younger keeps the first person's end age, as before, past the plan's end
  const planEndAge = (owner) => (owner === 'Partner' ? Math.max(terminalAge, agePart0 + terminalAge - ageSelf0) : terminalAge);
  const otherIncomes = plan.otherIncomes.filter(i => isCouple || i.owner === 'Myself').map(i => ({
    owner: i.owner === 'Partner' ? 'part' : 'self',
    startAge: Math.max(incomeFloor(i), num(i.startAge, 0)),
    endAge: isBlank(i.endAge) ? planEndAge(i.owner) : num(i.endAge, planEndAge(i.owner)),
    amount: Math.max(0, num(i.amount, 0)),
    taxFree: !incomeTypeOf(i.incomeType).taxable,
    isEarnings: incomeTypeOf(i.incomeType).relevantEarnings
  }));
  const yearOf = (x) => x.date ? parseInt(String(x.date).slice(0, 4)) : num(x.year, NaN);
  const oneOffContribs = new Map();
  const oneOffDeductions = new Map();
  const stagedTransfers = new Map();
  const oneOffStaging = new Map();
  const autoSplit = new Map();   // the windfall split (research, D37): by year, where splits 1 to 3 put the year's Auto money
  let saveSplitAt = null;   // the savings split (research, D38 (4)): t -> where saves 1 and 2 put the year's saving
  {
    // Shared per-owner/wrapper/year claim ledger: every deposit and staged drip tranche competes for the
    // same headroom, so two deposits for the same owner/wrapper can never double-claim one year's allowance.
    const claimed = new Map(); // `${ownerKey}|${cat}|${t}` -> £ already claimed this pass
    // the windfall split (research, D37): what the Auto deposits claimed in their own year, and their amounts by year
    const autoClaimed = new Map(), autoAmt = new Map();
    const headroomCtx = { P, owners, acc, otherIncomes };
    // relief on the pension routes the plan makes from the household's own money (the review of 9 Nov, item 4; pensionRelief)
    const relief = { rate: P.reliefAtSource, of: (ownerKey, t, gross) => { const o = owners.find(x => x.key === ownerKey); return pensionRelief(P, relevantEarningsAtYear(headroomCtx, o, t), gross, o.age0 + t); } };
    const claim = (ownerKey, cat, t, want, auto = false) => {
      const key = `${ownerKey}|${cat}|${t}`;
      const already = claimed.get(key) || 0;
      const avail = Math.max(0, wrapperHeadroomAtYear(headroomCtx, ownerKey, cat, t) - already);
      const take = Math.min(want, avail);
      claimed.set(key, already + take);
      if (auto) autoClaimed.set(key, (autoClaimed.get(key) || 0) + take);
      return take;
    };

    const ordered = plan.oneOffContributions
      .filter(x => isCouple || x.owner !== 'Partner')
      .map((x, i) => ({ x, i, y: yearOf(x) }))
      .filter(e => Number.isFinite(e.y))
      .sort((a, b) => (a.y - b.y) || (a.i - b.i));

    ordered.forEach(({ x, y }) => {
      const t = y - baseYear;
      const ownerKey = x.owner === 'Partner' ? 'part' : 'self';
      /*
       * A deposit marked AUTO_DEPOSIT has no wrapper of its own: the policy picks. Walk the policy's
       * order and take the first wrapper with room this year, so a large windfall lands where the
       * policy believes it belongs rather than defaulting into the pension and hitting the annual
       * allowance. Falling back to the last entry (rather than 'pen') means the fallback is the
       * policy's own choice of overflow, which for every policy here is the uncapped GIA.
       */
      const policyRoute = () => {
        const order = policyForDeposits.depositOrder || DEFAULT_DEPOSIT_ORDER;
        for (const cat of order) if (wrapperHeadroomAtYear(headroomCtx, ownerKey, cat, y - baseYear) > 0) return cat;
        return order[order.length - 1];
      };
      const targetCat = x.category === AUTO_DEPOSIT
        ? policyRoute()
        : (Object.keys(CATEGORY_LABEL).find(k => CATEGORY_LABEL[k] === x.category) || 'pen');
      const targetId = accountId(targetCat, ownerKey);
      const otherId = accountId('other', ownerKey);
      const amt = Math.max(0, num(x.amount, 0));
      if (amt <= 0) return;

      // source deduction (independent of staging outcome; deducts the full deposit amount D)
      if (x.transferredFrom && x.transferredFrom !== 'External') {
        const srcCat = Object.keys(CATEGORY_LABEL).find(k => CATEGORY_LABEL[k] === x.transferredFrom);
        if (srcCat) {
          const sourceId = accountId(srcCat, ownerKey);
          if (!oneOffDeductions.has(y)) oneOffDeductions.set(y, []);
          oneOffDeductions.get(y).push({ id: sourceId, amount: amt });
          if (t === 0) {
            const startBal = acc[sourceId] ? acc[sourceId].balance : 0;
            if (amt > startBal) warnings.push(
              `${OWNER_LABEL[ownerKey]}: one-off deposit of £${fmtNum(Math.round(amt))} exceeds available ${CATEGORY_LABEL[srcCat]} balance (£${fmtNum(Math.round(startBal))}); the deduction will be capped to the available balance.`
            );
          }
        }
      }

      // headroom resolution: direct deposit if within headroom, otherwise stage the surplus (Option A)
      // yearHeadroom is this year's raw allowance (before other deposits' claims), shown on the row
      const yearHeadroom = wrapperHeadroomAtYear(headroomCtx, ownerKey, targetCat, t);
      const isAuto = x.category === AUTO_DEPOSIT;
      // an Auto deposit the policy puts in a pension is the plan's own route, relieved: its room taken gross for the net it
      // costs, any refund to cash. A deposit typed into a pension lands as typed (M3)
      const relieved = isAuto && targetCat === 'pen';
      // a deposit marked `asContribution` is a working person's regular contribution written as a dated deposit (the household
      // plan's later retiree, src/solver/household.js householdPlanFor): it lands whole in its wrapper and claims no room, as
      // step 2 lands a regular contribution, which no allowance caps (the reviewer on step 4's change of default, finding 1:
      // claimed against the household person's room, the no-earnings limit, the MPAA and nothing from 75, part landed in the
      // GIA); an Auto deposit is never one
      const asContribution = !!x.asContribution && !isAuto;
      const H0 = asContribution ? amt : relieved ? claim(ownerKey, targetCat, t, amt / (1 - relief.rate), true) : claim(ownerKey, targetCat, t, amt, isAuto);
      const rel0 = relieved ? relief.of(ownerKey, t, H0) : null, net0 = relieved ? Math.min(amt, rel0.net) : H0;
      if (!oneOffContribs.has(y)) oneOffContribs.set(y, []);
      // an Auto deposit's own entries are marked, so a table's move can put that money elsewhere (the windfall split)
      const entry = (id, amount) => (isAuto ? { id, amount, auto: true } : { id, amount });
      if (relieved && rel0.refund > 0) oneOffContribs.get(y).push(entry(accountId('cash', ownerKey), rel0.refund));
      if (isAuto) autoAmt.set(`${y}|${ownerKey}`, (autoAmt.get(`${y}|${ownerKey}`) || 0) + amt);
      if (amt <= net0 + 1e-6) {
        oneOffContribs.get(y).push(entry(targetId, relieved ? H0 : amt));
        oneOffStaging.set(x.id, { direct: true, targetId, otherId, stagedId: targetId, amount: amt, H0: relieved ? H0 : amt, yearHeadroom, surplus0: 0, tranches: [], unresolvedRemainder: 0, ...(relieved ? { relief: { gross: H0, net: net0, refund: rel0.refund } } : {}) });
        return;
      }

      const surplus0 = amt - net0;
      if (H0 > 0) oneOffContribs.get(y).push(entry(targetId, H0));
      oneOffContribs.get(y).push(entry(otherId, surplus0));

      const stagedCat = Object.keys(CATEGORY_LABEL).find(k => CATEGORY_LABEL[k] === x.stagedTargetWrapper) || targetCat;
      const stagedId = accountId(stagedCat, ownerKey);
      const tranches = [];
      let remaining = surplus0;
      if (stagedCat !== 'other') {
        for (let dt = t + 1; dt <= totalYears && remaining > 0.005; dt++) {
          // a transfer into a pension is relieved (the review of 9 Nov, item 4): the room taken gross, the taxable account
          // paying the net; the move the engine makes is grossed up by `uplift`, and a refund paid to cash pro rata
          if (stagedCat === 'pen') {
            const gross = claim(ownerKey, stagedCat, dt, remaining / (1 - relief.rate));
            if (gross <= 0) continue;
            const rel = relief.of(ownerKey, dt, gross), net = Math.min(remaining, rel.net), dy = baseYear + dt;
            if (!stagedTransfers.has(dy)) stagedTransfers.set(dy, []);
            stagedTransfers.get(dy).push({ fromId: otherId, toId: stagedId, amount: net, uplift: 1 / (1 - relief.rate), refundId: accountId('cash', ownerKey), refundPer: rel.refund / net });
            tranches.push({ year: dy, amount: net, gross, refund: rel.refund });
            remaining -= net;
            continue;
          }
          const tranche = claim(ownerKey, stagedCat, dt, remaining);
          if (tranche <= 0) continue;
          const dy = baseYear + dt;
          if (!stagedTransfers.has(dy)) stagedTransfers.set(dy, []);
          stagedTransfers.get(dy).push({ fromId: otherId, toId: stagedId, amount: tranche });
          tranches.push({ year: dy, amount: tranche });
          remaining -= tranche;
        }
      } else {
        remaining = 0;
      }
      if (remaining > 0.005) warnings.push(
        `${OWNER_LABEL[ownerKey]}: £${fmtNum(Math.round(remaining))} of the ${y} one-off deposit could not be fully staged into ${CATEGORY_LABEL[stagedCat]} within the plan horizon and will remain in Other Investments.`
      );
      oneOffStaging.set(x.id, { direct: false, targetId, otherId, stagedId, amount: amt, H0, yearHeadroom, surplus0, tranches, unresolvedRemainder: Math.max(0, remaining) });
    });
    autoSplitRoutes(autoSplit, autoAmt, { baseYear, acc, claimed, autoClaimed, room: (o, cat, t) => wrapperHeadroomAtYear(headroomCtx, o, cat, t), relief });
    saveSplitAt = saveSplitRoutes({ P, owners, acc, otherIncomes, claimed, baseYear, totalYears });
  }
  const oneOffCosts = new Map();
  plan.oneOffCosts.forEach(x => {
    const y = yearOf(x); if (!Number.isFinite(y)) return;
    const amt = Math.max(0, num(x.amount, 0));
    if (amt <= 0) return;
    oneOffCosts.set(y, (oneOffCosts.get(y) || 0) + amt);
  });
  /*
   * A gift you have not made yet is money that leaves the plan on the day you make it, so it belongs in
   * the projection as well as in the estate. Folding planned gifts in here rather than duplicating them
   * as one-off costs keeps a single source of truth: change the year on the Inheritance tab and both the
   * drawdown and the tax move together. A gift dated this year or earlier has already gone: the balances
   * the plan starts from are what is left after it, so charging it again would spend the same money twice.
   */
  (plan.inheritance?.gifts || []).forEach(g => {
    const y = num(g.year, NaN); const amt = Math.max(0, num(g.amount, 0));
    if (!Number.isFinite(y) || amt <= 0 || y <= baseYear) return;
    oneOffCosts.set(y, (oneOffCosts.get(y) || 0) + amt);
  });
  /*
   * A regular gift out of surplus income is the same thing every year, so it is folded in year by year.
   * It never appears in the estate and never touches an allowance - that is the whole point of s.21 -
   * but it is unmistakably money the household no longer has, and leaving it out of the projection would
   * let someone give away an income they were also spending.
   */
  const sg = plan.inheritance?.surplusGift || {};
  const sgAnnual = Math.max(0, num(sg.annual, 0));
  if (sgAnnual > 0) {
    const from = Math.max(baseYear + 1, Number.isFinite(num(sg.fromYear, NaN)) ? num(sg.fromYear, 0) : baseYear + 1);
    const to = Number.isFinite(num(sg.toYear, NaN)) && num(sg.toYear, 0) > 0 ? num(sg.toYear, 0) : baseYear + totalYears;
    for (let y = from; y <= Math.min(to, baseYear + totalYears); y++) {
      oneOffCosts.set(y, (oneOffCosts.get(y) || 0) + sgAnnual);
    }
  }
  /*
   * Spending bands, resolved once so the per-year lookup stays a cheap scan. Sorted by start age, with a
   * blank end age running to the terminal age. Overlaps are reported rather than silently resolved: the
   * lookup takes the first match, so an unnoticed overlap would quietly apply the wrong figure for years.
   */
  const spendBands = (s.spendBands || [])
    .map(b => ({
      fromAge: Math.round(num(b.fromAge, NaN)),
      toAge: isBlank(b.toAge) ? terminalAge : Math.round(num(b.toAge, NaN)),
      amount: Math.max(0, num(b.amount, 0))
    }))
    .filter(b => Number.isFinite(b.fromAge) && Number.isFinite(b.toAge))
    .sort((a, b) => a.fromAge - b.fromAge);
  spendBands.forEach((b, i) => {
    if (b.toAge < b.fromAge) {
      warnings.push(`Spending band starting at age ${b.fromAge} ends at ${b.toAge}, before it begins, so it is never applied.`);
      return;
    }
    const prev = spendBands[i - 1];
    if (prev && prev.toAge >= b.fromAge && prev.toAge >= prev.fromAge) {
      warnings.push(`Spending bands overlap between ages ${b.fromAge} and ${Math.min(prev.toAge, b.toAge)}; the earlier band (£${fmtNum(Math.round(prev.amount))}) wins for those years.`);
    }
  });

  const policy = policyForDeposits;
  /*
   * THE SOLVER'S BRIDGE (solver plan, Phase 3). `spending.policyOverride = { kind: 'table', choose }` hands
   * the year's choice to a solved table: at the top of every year `choose(state, t, tiersHeld)` returns the
   * move (draw order, cost order, harvesting, the lump sum, the spend level and the tier each wrapper holds)
   * and the engine executes it through its own machinery, so tax, MPAA, CGT, the audit row and everything
   * else keep happening exactly; the table only chooses. Each account's tiers are the solver's list in the
   * solver's order (src/solver/fast.js tiersFor): the one set on Plan Inputs, up to two below it (three under a table
   * solved with `tiersBelow: 3`, D28, where both the person's pension and ISA can take the third step without stepping into
   * Cash Equivalents; otherwise two), then - only when all of those below exist - the tiers above it, with the plan's own
   * assumptions for each. A table's tier index then means the same tier on both sides: before, the list stopped below
   * the plan's tier, so the solver's "one above" (index 3) was clamped to the lowest tier here (the external review of
   * 21 Oct, F2a). The table also names its tier, and a name that disagrees with this list throws (tierOf, below).
   */
  const tableOverride = ov && ov.kind === 'table' && typeof ov.choose === 'function' ? ov : null;
  // A solved table chooses the year's spend level and draw itself: guardrails would overwrite its level and the cost
  // lookahead would set aside money it never planned for, so the combination is refused (the external review of 21 Oct,
  // F0a). src/solver/bridge.js withTable switches both off.
  if (tableOverride && (c.guardrails || clamp(Math.round(num(c.lookaheadYears, DEFAULT_CONFIG.lookaheadYears)), 0, 15) > 0)) {
    throw new Error('a solved table runs with guardrails and the cost lookahead off: attach it with withTable (src/solver/bridge.js), which switches both off');
  }
  const TIER_ORDER = Object.keys(RISK_EQUITY_WEIGHTS);
  const tierProfiles = {};
  // the table's steps below (D28: 3 under `tiersBelow: 3`), the household's own: two where the person's pension or ISA cannot
  // take the third step, a step beyond the second never stepping into Cash Equivalents (fast.js tiersFor, the same rule)
  const stepOk = (k0, d) => k0 >= 0 && k0 + d < TIER_ORDER.length && !(d > 2 && TIER_ORDER[k0 + d] === 'Cash Equivalents');
  // each person by their own wrappers (Part D, D2: a couple's two tables each take the rule on their own person; before it the
  // second person's lists took the first person's); a single's lists as before
  const wanted = tableOverride && tableOverride.tiersBelow === 3 ? 3 : 2;
  const belowOf = (owner) => (wanted > 2 && accounts.some(a => a.owner === owner && (a.cat === 'pen' || a.cat === 'isa') && !stepOk(TIER_ORDER.indexOf(a.risk), wanted)) ? 2 : wanted);
  const tierAt = (name) => { const prof = riskOf(name); return { name, real: clamp(num(prof.real, 0), -50, 50) / 100, vol: clamp(num(prof.volatility, 12), 0, 100) / 100, sigmaParam: clamp(num(prof.sigmaParam, 0), 0, 100) / 100, equityWeight: RISK_EQUITY_WEIGHTS[name], isCash: name === 'Cash Equivalents' }; };
  accounts.forEach(a => {
    const below = belowOf(a.owner);
    const k0 = TIER_ORDER.indexOf(a.risk);
    const list = [{ name: a.risk, real: a.real, vol: a.vol, sigmaParam: a.sigmaParam, equityWeight: a.equityWeight, isCash: a.isCash }];
    for (let d = 1; d <= below && stepOk(k0, d); d++) list.push(tierAt(TIER_ORDER[k0 + d]));
    if (list.length === 1 + below) for (let d = 1; k0 - d >= 0; d++) list.push(tierAt(TIER_ORDER[k0 - d]));
    tierProfiles[a.id] = list;
  });
  /*
   * EACH PERSON'S LADDER GAINS THE HOUSEHOLD'S TIERS (research/solver/COUPLES-ANY.md A, amendment 1). Where a couple's two
   * pensions, or two ISAs, hold different risks, the household plan holds that wrapper at the more cautious of the two
   * (src/solver/household.js householdPlanFor), so its table's tiers run from the cautious risk, with as many steps below as
   * both wrappers' cautious risks allow (the rule above, as src/solver/fast.js tiersFor reads the household plan). Each
   * person's ladder for that wrapper is their own with the household's tiers it lacks added at its end, so the household's
   * move can name its tier and each person take that name's index in their own ladder. A person's own risk stays index 0,
   * the tier they hold at the start, and every index of their own ladder means what it meant, so nothing a table of
   * today's routes asks moves. LADDER_PLANT 'noladderadd': none added; 'ladderinsert': put before the riskier tiers
   */
  if (isCouple && LADDER_PLANT.rule !== 'noladderadd') {
    const pairOf = cat => ['self', 'part'].map(k => accounts.find(a => a.owner === k && a.cat === cat)).filter(Boolean);
    const cautiousOf = cat => pairOf(cat).reduce((r, a) => (r === null || TIER_ORDER.indexOf(a.risk) > TIER_ORDER.indexOf(r) ? a.risk : r), null);
    const apart = ['pen', 'isa'].filter(cat => { const p = pairOf(cat); return p.length === 2 && p[0].risk !== p[1].risk; });
    if (apart.length) {
      const hBelow = wanted > 2 && ['pen', 'isa'].some(cat => { const r = cautiousOf(cat); return r !== null && !stepOk(TIER_ORDER.indexOf(r), wanted); }) ? 2 : wanted;
      for (const cat of apart) {
        const c0 = TIER_ORDER.indexOf(cautiousOf(cat)), names = [TIER_ORDER[c0]];
        for (let d = 1; d <= hBelow && stepOk(c0, d); d++) names.push(TIER_ORDER[c0 + d]);
        if (names.length === 1 + hBelow) for (let d = 1; c0 - d >= 0; d++) names.push(TIER_ORDER[c0 - d]);
        for (const a of pairOf(cat)) {
          const list = tierProfiles[a.id];
          for (const n of names) {
            if (list.some(p => p.name === n)) continue;
            // the plant 'ladderinsert': the household's tier put among the person's own, before their first riskier tier
            const at = LADDER_PLANT.rule === 'ladderinsert' ? list.findIndex((p, i) => i > 0 && TIER_ORDER.indexOf(p.name) < TIER_ORDER.indexOf(list[0].name)) : -1;
            if (at > 0) list.splice(at, 0, tierAt(n)); else list.push(tierAt(n));
          }
        }
      }
    }
  }
  const ctx = {
    plan, warnings, isCouple, P, owners, accounts, acc,
    policyOverride: tableOverride, tierProfiles,
    ageSelf0, agePart0, terminalAge, totalYears, nmpa, spa, targetSpend,
    spendBands,
    fullLumpSum: s.drawdownStrategy === 'Full 25% Lump Sum',
    policyKey: policy.custom ? 'Custom' : s.decumulationPolicy, policySteps: policy.steps, harvestPA: policy.harvest && !!c.harvestPersonalAllowance,
    harvestCeiling: c.harvestCeiling === 'basic' ? 'basic' : 'pa',
    costSteps: policy.costSteps || DEFAULT_COST_STEPS, depositOrder: policy.depositOrder || null,
    pensionDeathTaxRate: clamp(num(c.pensionDeathTaxRate, 0), 0, 100) / 100,
    cashBufferYears: clamp(num(c.cashBufferMonths, 6), 0, 120) / 12,
    solvencyFloor: Math.max(0, num(c.solvencyFloor, 0)),
    floorSpend, floorFrac, floorConfidence,
    // the user's raise cap as a multiple of target (0: none). The solver's menu honours it; so do the guardrails, so
    // a comparison holds both sides to the same rule (PLAN.md M23). Unset in every shipped plan today.
    raiseCapFrac: Math.max(0, num(c.raiseCap, 0)),
    inflation: clamp(num(c.inflation, 2.5), -50, 100) / 100,
    guardrails: c.guardrails ? GUARDRAILS : null,
    lookaheadYears: clamp(Math.round(num(c.lookaheadYears, DEFAULT_CONFIG.lookaheadYears)), 0, 15),
    yf, baseYear, valuationDate,
    otherIncomes, oneOffContribs, oneOffCosts, oneOffDeductions, stagedTransfers, oneOffStaging, autoSplit, saveSplitAt
  };
  return ctx;
}

/*
 * Living-cost target at a given age of "Myself". The first band covering the age wins, and any year no
 * band covers falls back to the headline spend, so a partial set of bands only overrides the years it
 * names. Bands are pre-sorted in buildContext, which is what makes "first match" stable and cheap here:
 * this runs for every year of every Monte Carlo trial.
 */
function spendTargetAtAge(ctx, ageSelf) {
  const bands = ctx.spendBands;
  for (let i = 0; i < bands.length; i++) {
    if (ageSelf >= bands[i].fromAge && ageSelf <= bands[i].toAge) return bands[i].amount;
  }
  return ctx.targetSpend;
}

const freshState = (ctx) => {
  const pots = {};
  ctx.accounts.forEach(a => { pots[a.id] = a.balance; });
  // GIA cost basis is path-dependent (it falls as units are sold), so it lives in per-trial state
  const giaBasis = { self: 0, part: 0 };
  ctx.accounts.forEach(a => { if (a.cat === 'other') giaBasis[a.owner] = Math.max(0, a.balance - a.unrealisedGain); });
  // gains realised while settling a CGT bill are taxed the following year, so they carry forward
  /*
   * The guardrail's memory: the rate the rails were set from, the cumulative multiplier every rule has
   * applied so far, and whether the portfolio lost money last year. Path-dependent like the GIA basis,
   * which is why it lives here and not on the context.
   */
  const guard = { rate0: null, mult: 1, lostLastYear: false, lastBaseDraw: 0 };
  // how much of each owner's cash pot is inside a cash ISA: path-dependent, so it lives with the pots
  const cashIsa = { self: 0, part: 0 };
  ctx.owners.forEach(o => { cashIsa[o.key] = Math.min(o.cashIsa0 || 0, pots[o.ids.cash] || 0); });
  // the tier each wrapper holds under a solved table (0 is the one on Plan Inputs), so a change can be charged
  const tierHeld = { self: { pen: 0, isa: 0 }, part: { pen: 0, isa: 0 } };
  return { pots, giaBasis, cgtCarry: { self: 0, part: 0 }, cumPcls: { self: 0, part: 0 }, lumpSumTaken: { self: false, part: false }, guard, cashIsa, tierHeld };
};

// Money paid into the GIA is added at cost, so it creates no gain.
const giaAddBasis = (state, ownerKey, amount) => { if (amount > 0) state.giaBasis[ownerKey] += amount; };

/*
 * N4 (research only, research/solver/n4-design.md): the extra ceilings a research table's moves may name, each the gross
 * income its pension draw stops at. The taper threshold is the schedule's last rising corner (40% to 60%); the midpoints
 * sit inside the bands the product's menu stops at. Draw tokens first, re-wrap ceilings second; the product's own menu and
 * policies never name one, so nothing here runs outside a research table.
 */
/* D98 (research only, research/solver/ALLOWANCE-BOTH.md): the allowance's ceiling at its old place as well as its new, the
   solver choosing. 'penPAr' draws and 'paraw' re-wraps to the personal allowance as given, on the year's non-savings income
   alone (N4_RAW: pensionCeiling is not applied), where 'penPA' and 'pa' stop where the year's whole bill would first rise. With
   no interest and no dividends the two are the same to the bit. No policy of the app's names either. */
const N4_PEN = { penHR: P => P.thr, penPAm: P => P.pa / 2, penBm: P => (P.pa + P.higherRateStartsAt) / 2, penPAr: P => P.pa };
const N4_HARVEST = { hr: N4_PEN.penHR, pam: N4_PEN.penPAm, bm: N4_PEN.penBm, paraw: N4_PEN.penPAr };
const N4_RAW = { penPAr: true, paraw: true };

// A disposal realises gain pro-rata against the whole holding and reduces basis by the cost portion.
const giaDispose = (state, balanceBefore, ownerKey, amount) => {
  if (amount <= 0 || balanceBefore <= 0) return 0;
  const basis = state.giaBasis[ownerKey] || 0;
  const gain = amount * (Math.max(0, balanceBefore - basis) / balanceBefore);
  state.giaBasis[ownerKey] = Math.max(0, basis - (amount - gain));
  return gain;
};

/*
 * market: 'expected' | { historical: true, startYear } | { z: number, zPath?: number }
 * Advances `state` by one year (index t) and returns the audit row for that year.
 */
function stepYear(ctxBase, state, t, market = 'expected', spendOverride = null) {
  /*
   * Under a solved table the year's settings come from the table's choice for this exact position; the
   * rest of the year runs unchanged on a context that carries them. Without one, ctx is the plan's own.
   */
  const table = ctxBase.policyOverride;
  const chosen = table ? table.choose(state, t, state.tierHeld ? state.tierHeld.self : null) : null;
  // a couple's joint move (Part D, D2; src/solver/couple.js chooseJoint): the share of the year's net need the first person
  // funds and each person's own draw order, harvest and ceiling, applied as the exact model's year (src/solver/model.js step)
  // applies them; a single's move, and a couple's year with no table, run as before
  const joint = chosen && chosen.perOwner && ctxBase.isCouple ? { split: chosen.split, perOwner: chosen.perOwner } : null;
  const ctx = chosen ? {
    ...ctxBase,
    policySteps: chosen.steps || ctxBase.policySteps, costSteps: chosen.costSteps || ctxBase.costSteps,
    harvestPA: !!chosen.harvest || (!!joint && ctxBase.owners.some(o => joint.perOwner[o.key] && joint.perOwner[o.key].harvest)),
    harvestCeiling: chosen.harvestCeil === 'basic' ? 'basic' : N4_HARVEST[chosen.harvestCeil] ? chosen.harvestCeil : 'pa',
    fullLumpSum: !!chosen.lump, joint
  } : ctxBase;
  const { P, owners, acc } = ctx;
  const pots = state.pots;
  const isYearZero = t === 0;
  const frac = isYearZero ? ctx.yf : 1.0;
  const year = ctx.baseYear + t;
  const ageSelf = ctx.ageSelf0 + t;
  const agePart = ctx.isCouple ? ctx.agePart0 + t : 0;
  const ageOf = (o) => (o === 'self' ? ageSelf : agePart);
  const isHistorical = typeof market === 'object' && market !== null && market.historical;
  const histPoint = isHistorical ? getHistoricalPoint(market.startYear, t) : null;

  const working = {}; const access = {};
  owners.forEach(o => { working[o.key] = ageOf(o.key) < o.retireAge; access[o.key] = ageOf(o.key) >= ctx.nmpa; });
  const anyAccess = owners.some(o => access[o.key]);
  const anyRetired = owners.some(o => !working[o.key]);

  // Gains realised during this tax year, per owner (GIA disposals only), opening with anything
  // carried over from settling last year's bill. Charged at year end.
  const realisedGains = { self: state.cgtCarry.self, part: state.cgtCarry.part };
  state.cgtCarry = { self: 0, part: 0 };
  const cgtOn = P.cgtEnabled;
  const ownerOfId = (id) => (String(id).endsWith('_part') ? 'part' : 'self');
  // Sell `amount` from an owner's GIA, booking the pro-rata gain. Returns what was actually sold.
  const sellGia = (id, amount) => {
    const before = pots[id] || 0;
    const sold = Math.min(before, Math.max(0, amount));
    if (sold <= 0) return 0;
    pots[id] = before - sold;
    if (cgtOn) realisedGains[ownerOfId(id)] += giaDispose(state, before, ownerOfId(id), sold);
    return sold;
  };

  // 0. one-off deposit source-pot deductions (full D, this year only; internal-source deposits)
  let oneOffDeductionShortfall = 0;
  const deductions = ctx.oneOffDeductions.get(year);
  if (deductions) deductions.forEach(x => {
    if (pots[x.id] === undefined) return;
    let take;
    if (x.id.startsWith('other_')) {
      take = sellGia(x.id, x.amount); // funding a deposit out of the GIA is a disposal
    } else {
      take = Math.min(pots[x.id], x.amount);
      pots[x.id] -= take;
    }
    oneOffDeductionShortfall += Math.max(0, x.amount - take);
  });

  // each owner's ISA subscriptions this tax year, counted from the first money into an ISA: a dated deposit (1), a staged
  // transfer (1.5) and the regular contributions (2). Every flow the year itself sends into the ISA reads its room here
  // (2a, the sweep, the re-wraps, N4's CGT move, 7e). Before 19 Nov steps 1 and 1.5 were not counted, so those flows could
  // put a whole allowance on top of a deposit (the windfall read's reviewer, finding 1; D130 (1); isa-allowance.test.mjs).
  const isaContribThisYear = { self: 0, part: 0 };
  // 1. one-off deposits (dated: not pro-rated) — includes staged deposits' year-0 immediate tranche + parked surplus
  const deposits = ctx.oneOffContribs.get(year);
  // the windfall split (research, D37): a table's move may put this year's Auto money elsewhere than the plan's routing
  const split = chosen && chosen.windfall > 0 && ctx.autoSplit ? ctx.autoSplit.get(year) : null;
  const deposit = x => {
    if (pots[x.id] === undefined) return;
    pots[x.id] += x.amount;
    if (cgtOn && x.id.startsWith('other_')) giaAddBasis(state, ownerOfId(x.id), x.amount);
    if (x.id.startsWith('isa_')) isaContribThisYear[ownerOfId(x.id)] += x.amount;   // a subscription (above)
  };
  if (deposits) deposits.forEach(x => { if (!(split && x.auto)) deposit(x); });
  if (split) split.variants[chosen.windfall].forEach(deposit);

  // 1.5 staged multi-year drip transfers (t>=1): drain GIA into the (possibly redirected) staged target,
  // capped at whatever remains in GIA — this naturally handles a market-crash-depleted GIA.
  // Moving out of the GIA is a real disposal (Bed & ISA), so it realises gain pro-rata.
  const drips = ctx.stagedTransfers.get(year);
  if (drips) drips.forEach(x => {
    const move = sellGia(x.fromId, x.amount);
    if (move <= 0) return;
    // a transfer into a pension lands grossed up, its refund to cash in proportion to what moved (the review's item 4)
    pots[x.toId] = (pots[x.toId] || 0) + (x.uplift ? move * x.uplift : move);
    if (x.refundPer > 0 && pots[x.refundId] !== undefined) pots[x.refundId] += move * x.refundPer;
    if (cgtOn && x.toId.startsWith('other_')) giaAddBasis(state, ownerOfId(x.toId), move);
    if (x.toId.startsWith('isa_')) isaContribThisYear[ownerOfId(x.toId)] += move;   // Bed & ISA: a subscription (above)
  });

  // 2. regular contributions while the owner works (year 0 pro-rated); a table's move may put the pension and ISA saving
  // elsewhere at the same net cost (the savings split, research, D38 (4); saveSplitRoutes)
  const contribThisYear = { self: 0, part: 0 };
  const saved = chosen && chosen.save > 0 && ctx.saveSplitAt ? ctx.saveSplitAt(t) : null, sv = saved ? saved.variants[chosen.save] : null;
  ctx.accounts.forEach(a => {
    if (!working[a.owner]) return;
    const amt = sv && a.id in sv ? sv[a.id] : contribAtYear(a, t);
    if (amt > 0) {
      pots[a.id] += amt * frac;
      if (cgtOn && a.cat === 'other') giaAddBasis(state, a.owner, amt * frac);
      contribThisYear[a.owner] += amt * frac;
      if (a.cat === 'isa') isaContribThisYear[a.owner] += amt * frac;
    }
  });
  // 2a. the cash ISA subscription: the wrapper's own contribution shelters that much of the cash paid in,
  // within the cash ISA's cap and whatever overall ISA allowance the S&S subscription left
  const cashIsaSubscribed = { self: 0, part: 0 };
  owners.forEach(o => {
    if (!working[o.key] || !(o.cashIsaContrib > 0)) return;
    const room = Math.min(P.cashIsaCapAt(ageOf(o.key), year), Math.max(0, P.isaAllowance - isaContribThisYear[o.key]));
    const sub = Math.min(o.cashIsaContrib * frac, room, Math.max(0, (pots[o.ids.cash] || 0) - state.cashIsa[o.key]));
    if (sub > 0) { state.cashIsa[o.key] += sub; isaContribThisYear[o.key] += sub; cashIsaSubscribed[o.key] += sub; }
  });

  // 3. full tax-free lump sum on first access (if selected)
  if (ctx.fullLumpSum) {
    owners.forEach(o => {
      if (state.lumpSumTaken[o.key] || !access[o.key] || working[o.key]) return;
      const pot = pots[o.ids.pen] || 0;
      if (pot <= 0) return;
      const pcls = Math.min(pot * P.pclsProp, Math.max(0, P.lsa - state.cumPcls[o.key]));
      pots[o.ids.pen] -= pcls;
      pots[o.ids.cash] = (pots[o.ids.cash] || 0) + pcls;
      state.cumPcls[o.key] += pcls;
      state.lumpSumTaken[o.key] = true;
    });
  }

  // 4. guaranteed incomes (state pension, DB, rental...) and salary of a still-working partner
  const taxable = { self: 0, part: 0 };
  const taxFreeIncome = { self: 0, part: 0 };
  ctx.otherIncomes.forEach(inc => {
    const age = ageOf(inc.owner);
    if (age >= inc.startAge && age <= inc.endAge) {
      if (inc.taxFree) taxFreeIncome[inc.owner] += inc.amount * frac; else taxable[inc.owner] += inc.amount * frac;
    }
  });
  const statePension = { self: 0, part: 0 };
  owners.forEach(o => { if (ageOf(o.key) >= ctx.spa) { statePension[o.key] = o.statePension * frac; taxable[o.key] += statePension[o.key]; } });
  /*
   * The taxable pay of each person still working (the review of 9 Nov, item 3): the pay the take-home below taxes, after
   * salary sacrifice or a net-pay contribution (calculateMarginalRelief's sacrifice), at the bottom of the person's stack.
   * Every other tax of the year stands on it: the interest and dividends, a pension draw and its ceiling, the gains' band.
   * The take-home pays the tax on it, so `taxPaid` is the person's whole bill less the tax on the pay alone.
   */
  const taxablePay = { self: 0, part: 0 };
  owners.forEach(o => {
    if (!working[o.key] || !(o.salary > 0)) return;
    const pen = acc[o.ids.pen];
    const penContrib = pen ? (sv && pen.id in sv ? sv[pen.id] : contribAtYear(pen, t)) : 0;
    taxablePay[o.key] = taxablePayOf(salaryAtYear(o, t), penContrib, P, ROUTE_PLANT.rule === 'enginepay' ? o.selfEmployed : o.reliefTaxOnly) * frac;
  });
  /*
   * 4a. Tax on the year's savings interest. Cash Savings grows at its real rate in step 8 as it always
   * has (that growth IS the interest, net of inflation); what is new is that HMRC taxes the NOMINAL
   * interest - real plus inflation - as savings income above the starting rate and the personal savings
   * allowance. Measured on the cash held at this point in the year, before any draw, so it is knowable
   * when the draws are sized, and charged as a cost the year must fund like any other bill. Interest is
   * savings income, stacked on top of the non-savings income known here (the taxable pay among it); a pension
   * draw later in the year re-prices it in HMRC's order (drawPension, taxParams' personTax).
   */
  const savingsInterest = { self: 0, part: 0 }, savingsTax = { self: 0, part: 0 };
  if (P.cashInterestTaxed) owners.forEach(o => {
    const a = ctx.acc[o.ids.cash];
    if (!a) return;
    const nominal = (1 + a.real) * (1 + ctx.inflation) - 1;
    savingsInterest[o.key] = Math.max(0, ((pots[o.ids.cash] || 0) - state.cashIsa[o.key]) * nominal * frac);
    savingsTax[o.key] = P.savingsTax(taxablePay[o.key] + taxable[o.key], savingsInterest[o.key]);
  });
  /*
   * 4b. Tax on the year's dividends inside the GIA, on the same footing: the GIA is assumed to pay its
   * dividend yield out of its stated return, so growth in step 8 is unchanged and only the tax is new.
   * Dividends are the top slice of income, above the interest; the allowance is a 0% band that still
   * uses up band space; the rate is the dividend rate of the band the slice sits in.
   */
  const giaDividends = { self: 0, part: 0 }, dividendTax = { self: 0, part: 0 };
  if (P.giaDividendYield > 0) owners.forEach(o => {
    giaDividends[o.key] = Math.max(0, (pots[o.ids.other] || 0) * P.giaDividendYield * frac);
    dividendTax[o.key] = P.dividendTax(taxablePay[o.key] + taxable[o.key], savingsInterest[o.key], giaDividends[o.key]);
    // the dividends are reinvested (the GIA's total return includes them), so they buy units at cost (F0a, 21 Oct)
    if (cgtOn && giaDividends[o.key] > 0) giaAddBasis(state, o.key, giaDividends[o.key]);
  });
  const netGuaranteed = {};
  /*
   * Taxable income BEFORE any pension is drawn - state pension, post-retirement earnings, rent, a DB
   * pension, anything at line 1658 above. Captured here because this is the last point at which it is
   * knowable: everything added after this is a pension withdrawal, and the two band ceilings are
   * measured against the running total, so this is what decides how much of each band is actually free.
   * Without it the tab can only say "up to whatever is left" and leave the household to guess.
   */
  const otherTaxable = { self: taxable.self, part: taxable.part };
  // the tax on the guaranteed income with the pay below it and the year's interest and dividends above it (the taper too)
  const billOf = (key) => P.personTax({ nonSavings: taxablePay[key] + taxable[key], interest: savingsInterest[key], dividends: giaDividends[key] });
  const payTax = (key) => (taxablePay[key] > 0 ? incomeTax(taxablePay[key], P) : 0);
  // the interest and the dividends each priced with the whole year in the stack: the savings allowance reads the whole taxable
  // income and the taper all of it, so 4a's interest is re-priced once 4b's dividends are known
  owners.forEach(o => { const b = billOf(o.key); savingsTax[o.key] = b.onInterest; dividendTax[o.key] = b.onDividends; });
  // (written as the old net less a correction that is exactly 0 with no pay, interest or dividends, so such a year is the
  // same to the bit as before: calculateUKNetIncome and personTax take the same steps there)
  owners.forEach(o => { const b = billOf(o.key); netGuaranteed[o.key] = taxFreeIncome[o.key] + calculateUKNetIncome(taxable[o.key], P) - ((b.onNonSavings - payTax(o.key)) - incomeTax(taxable[o.key], P)) - savingsTax[o.key] - dividendTax[o.key]; });
  let totalNetGuaranteed = owners.reduce((sum, o) => sum + netGuaranteed[o.key], 0);
  // take-home of a partner who is still working after the household has started drawing (offsets living costs)
  let workingTakeHome = 0;
  if (anyRetired) {
    owners.forEach(o => {
      if (!working[o.key] || o.salary <= 0) return;
      const pen = acc[o.ids.pen];
      const penContrib = pen ? (sv && pen.id in sv ? sv[pen.id] : contribAtYear(pen, t)) : 0;
      const pay = salaryAtYear(o, t);
      // pay less tax, NIC and the net cost of the pension contribution — which prices sacrifice for an
      // employee and relief at source for the self-employed, whose NIC is charged on the whole profit
      const takeHome = pay - calculateUKTaxAndNIC(pay, P, o.selfEmployed) - netCostOfPensionContrib(penContrib, pay, P, o.reliefTaxOnly);
      const nonPensionContribs = (contribThisYear[o.key] / frac) - penContrib;
      workingTakeHome += Math.max(0, takeHome - nonPensionContribs) * frac;
    });
  }

  let drawdownPensions = 0;
  // taxable pension income per owner — the MPAA trigger is personal, so it cannot use the combined figure
  const taxablePensionDrawn = { self: 0, part: 0 };
  let harvested = 0;
  const pclsHeadroom = (o) => Math.max(0, P.lsa - state.cumPcls[o]);
  const ownerByKey = {}; owners.forEach(o => { ownerByKey[o.key] = o; });

  // draw `netNeeded` net from an owner's pension without taking taxable income above `ceiling`; returns net delivered. `raw`
  // (D98's 'penPAr' and 'paraw', research only) takes the ceiling as given, on the non-savings income alone
  const drawPension = (oKey, netNeeded, ceiling = Infinity, raw = false) => {
    const o = ownerByKey[oKey];
    if (!o || netNeeded <= 0 || !access[oKey]) return 0;
    const pot = pots[o.ids.pen] || 0;
    if (pot <= 0) return 0;
    const fully = ctx.fullLumpSum && state.lumpSumTaken[oKey];
    const headroom = fully ? 0 : pclsHeadroom(oKey);
    const T0 = taxablePay[oKey] + taxable[oKey];
    // the ceiling is on the year's whole taxable income: the interest and dividends above the draw count towards it
    if (!raw) ceiling = pensionCeiling(P, ceiling, T0, savingsInterest[oKey], giaDividends[oKey]);
    if (T0 >= ceiling) return 0;
    const grossNeeded = grossPensionNeededForNet(netNeeded, T0, P, fully, headroom, ceiling, { interest: savingsInterest[oKey], dividends: giaDividends[oKey] });
    const gross = Math.min(pot, grossNeeded);
    if (gross <= 0) return 0;
    pots[o.ids.pen] = pot - gross;
    drawdownPensions += gross;
    const taxFree = fully ? 0 : Math.min(gross * P.pclsProp, headroom);
    state.cumPcls[oKey] += taxFree;
    const taxablePart = gross - taxFree;
    taxablePensionDrawn[oKey] += taxablePart;
    // the net it delivers: the tax-free part and the rise in the person's net income, every tax of the year in it (the old
    // net less a correction that is exactly 0 with no pay, interest or dividends, so such a draw is the same to the bit)
    const was = billOf(oKey), before = calculateUKNetIncome(taxable[oKey], P), taxBefore = incomeTax(taxable[oKey], P);
    taxable[oKey] += taxablePart;
    const now = billOf(oKey), after = calculateUKNetIncome(taxable[oKey], P), taxAfter = incomeTax(taxable[oKey], P);
    savingsTax[oKey] = now.onInterest; dividendTax[oKey] = now.onDividends;
    return taxFree + (after - before) - ((now.total - was.total) - (taxAfter - taxBefore));
  };
  const drawPot = (id, need) => {
    if (need <= 0) return 0;
    // GIA draws are disposals, so they book a gain and reduce the cost basis
    if (id.startsWith('other_')) return sellGia(id, need);
    const pull = Math.min(pots[id] || 0, need);
    if (pull <= 0) return 0;
    pots[id] -= pull;
    return pull;
  };

  /*
   * 5. one-off capital costs.
   *
   * Which wrapper pays for a £40k roof is a real decision with a real cost, and it is not the same
   * decision as which wrapper funds the weekly shop. A lump sum is large enough to push pension income
   * through a tax band in a single year, or to realise a year's worth of gains at once, so the cheapest
   * source for it can differ from the cheapest source for ordinary spending. The policy therefore names
   * its own order here, in the same six-token vocabulary as the drawdown steps.
   *
   * The default reproduces the original fixed order exactly: cash -> GIA -> ISA -> accessible pension.
   */
  let unmetCost = 0;
  const cost = ctx.oneOffCosts.get(year) || 0;
  if (cost > 0) {
    let rem = cost;
    for (const step of ctx.costSteps) {
      if (rem <= 0) break;
      if (step === 'penPA') { for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem, P.pa); } }
      else if (step === 'penBasic') { for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem, P.higherRateStartsAt); } }
      else if (step === 'penAny') { for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem); } }
      else if (N4_PEN[step]) { const cap = N4_PEN[step](P), raw = !!N4_RAW[step]; for (const o of owners) { if (rem > 0) rem -= drawPension(o.key, rem, cap, raw); } }
      else { for (const o of owners) { if (rem > 0) rem -= drawPot(o.ids[step], rem); } }
    }
    unmetCost = Math.max(0, rem);
  }

  // 6. living-cost demand
  const spendBase = spendOverride !== null ? spendOverride : null;
  let annualLivingTarget = 0;
  let guardrail = null;          // what the spending rule did this year, named for the audit table
  if (anyRetired) {
    let scheduled;
    if (spendBase !== null) {
      const ratio = ctx.targetSpend > 0 ? spendTargetAtAge(ctx, ageSelf) / ctx.targetSpend : 1;
      scheduled = Math.max(0, spendBase) * ratio;
    } else scheduled = spendTargetAtAge(ctx, ageSelf);
    annualLivingTarget = scheduled;
    // a solved table may spend below the target (a trim) or above it (a raise) this year
    if (chosen && chosen.spendLevel !== undefined && chosen.spendLevel !== 1) annualLivingTarget = scheduled * chosen.spendLevel;
    /*
     * THE GUARDRAILS, applied to the draw the portfolio is asked for rather than to the whole spend.
     *
     * `scheduled` is what the plan says to spend this year in today's money, bands and solver override
     * included. `covered` is what arrives without touching the pots. The difference is the draw, and
     * the draw is what the rails watch. Everything is in full-year terms here - the guaranteed figures
     * above were pro-rated for year zero, so they are un-scaled - and the fraction is put back at the
     * end as it always was, so a plan with the rule off computes exactly what it did before.
     *
     * The rails are set the first year the draw is above zero, not the first year of retirement: a
     * household living on a DB pension for a while is not yet drawing, and a rate of zero is not a rate.
     * From the next year on, three rules in the paper's order: skip the inflation rise after a losing
     * year; then cut if the rate has drifted above the upper rail and the plan still has more than
     * freezeYears to run; else raise if it has drifted below the lower rail.
     */
    if (ctx.guardrails) {
      const g = ctx.guardrails, gs = state.guard;
      const covered = (totalNetGuaranteed + workingTakeHome) / frac;
      const baseDraw = Math.max(0, scheduled - covered);
      const potNow = owners.reduce((s, o) => s + CATEGORIES.reduce((t2, cat) => t2 + (pots[o.ids[cat]] || 0), 0), 0);
      if (baseDraw > 0 && potNow > 0) {
        const did = [];
        /*
         * THE RAILS FOLLOW THE PLAN, NOT JUST THE FIRST YEAR OF IT.
         *
         * Measured against the first year's rate alone, the rule mistakes the household's own schedule
         * for market news. The state pension starting halves the draw, a spend band the household
         * chose for its eighties lowers it again, and to a rate test both look like prosperity - on a
         * perfectly smooth path the prosperity rule raised spending to 2.1x by 80, undoing a cut the
         * household had planned on purpose. So whenever the scheduled draw moves for a reason that is
         * not the market - it is computed before the multiplier, so the market cannot move it - the
         * rails are re-set on the current footing: the rate the plan now implies, with every cut and
         * rise earned so far carried into it. That year applies the inflation rule and nothing else,
         * and from the next year the rule is back to watching the pots.
         */
        const replanned = gs.rate0 !== null && Math.abs(baseDraw - gs.lastBaseDraw) > 0.01 * Math.max(1, gs.lastBaseDraw);
        if (gs.rate0 !== null && gs.lostLastYear) { gs.mult /= (1 + ctx.inflation); did.push('no rise'); }
        if (gs.rate0 === null) gs.rate0 = baseDraw / potNow;
        else if (replanned) { gs.rate0 = (baseDraw * gs.mult) / potNow; did.push('rails re-set'); }
        else {
          const rate = (baseDraw * gs.mult) / potNow;
          if (rate > gs.rate0 * (1 + g.band) && (ctx.totalYears - t) > g.freezeYears) { gs.mult *= (1 - g.cut); did.push('cut'); }
          else if (rate < gs.rate0 * (1 - g.band)) { gs.mult *= (1 + g.raise); did.push('raise'); }
        }
        /*
         * THE FLOOR. Guyton-Klinger's cuts compound with no bottom of their own; with a floor set, the
         * multiplier can never take the year's spend below it. The floor scales with the band, so a
         * household that planned a leaner stretch keeps a proportionally leaner floor there.
         */
        /* THE CAP, the floor's mirror (M23): with a raise cap set, the multiplier can never take the year's spend above it. */
        if (ctx.raiseCapFrac > 0) {
          const maxMult = Math.max(0, scheduled * ctx.raiseCapFrac - covered) / baseDraw;
          if (gs.mult > maxMult) { gs.mult = maxMult; did.push('held at cap'); }
        }
        if (ctx.floorFrac > 0) {
          const minMult = Math.max(0, scheduled * ctx.floorFrac - covered) / baseDraw;
          if (gs.mult < minMult) { gs.mult = minMult; did.push('held at floor'); }
        }
        gs.lastBaseDraw = baseDraw;
        annualLivingTarget = covered + baseDraw * gs.mult;
        if (did.length) guardrail = did.join(', ');
      }
    }
    annualLivingTarget *= frac;
  }
  const netDemand = Math.max(0, annualLivingTarget - totalNetGuaranteed - workingTakeHome);
  const demand = { self: 0, part: 0 };

  // 7. surplus guaranteed income is swept to cash (buffer) then ISA
  if (annualLivingTarget > 0 && totalNetGuaranteed + workingTakeHome >= annualLivingTarget) {
    const surplus = totalNetGuaranteed + workingTakeHome - annualLivingTarget;
    const bufferEach = (annualLivingTarget / frac) * ctx.cashBufferYears / owners.length;
    owners.forEach(o => {
      const share = surplus / owners.length;
      pots[o.ids.cash] = (pots[o.ids.cash] || 0) + share;
      if (pots[o.ids.cash] > bufferEach) {
        let excess = pots[o.ids.cash] - bufferEach;
        const isaRoom = Math.max(0, P.isaAllowance - isaContribThisYear[o.key]);
        const toIsa = Math.min(excess, isaRoom);
        pots[o.ids.isa] = (pots[o.ids.isa] || 0) + toIsa;
        isaContribThisYear[o.key] += toIsa;
        excess -= toIsa;
        pots[o.ids.cash] = bufferEach + excess; // remainder stays in cash once the ISA allowance is used
      }
    });
  } else if (netDemand > 0 && ctx.joint) {
    /*
     * A couple's joint move (Part D, D2): the first person funds `split` of the net need, the second the rest; at each step
     * index each draws their own k-th pot for their own need, then covers the other's shortfall from it, each in their own
     * order. With both orders the household's and an even split this is the year below exactly.
     */
    const J = ctx.joint;
    const shareOf = (o) => (J.split !== undefined && owners.length === 2 ? (o.key === 'self' ? J.split : 1 - J.split) : 1 / owners.length);
    owners.forEach(o => { demand[o.key] = netDemand * shareOf(o); });
    const remaining = () => owners.reduce((s, o) => s + demand[o.key], 0);
    const stepsOf = (o) => (J.perOwner[o.key] && J.perOwner[o.key].steps ? J.perOwner[o.key].steps : ctx.policySteps);
    const drawFrom = (o, cat, need) => (cat === 'penPA' ? drawPension(o.key, need, P.pa) : cat === 'penBasic' ? drawPension(o.key, need, P.higherRateStartsAt)
      : cat === 'penAny' ? drawPension(o.key, need, Infinity) : N4_PEN[cat] ? drawPension(o.key, need, N4_PEN[cat](P), !!N4_RAW[cat]) : drawPot(o.ids[cat], need));
    const K = Math.max(...owners.map(o => stepsOf(o).length));
    for (let k = 0; k < K; k++) {
      if (remaining() <= 0.005) break;
      owners.forEach(o => { const cat = stepsOf(o)[k]; if (cat && demand[o.key] > 0) demand[o.key] = Math.max(0, demand[o.key] - drawFrom(o, cat, demand[o.key])); });
      owners.forEach(o => owners.forEach(x => { const cat = stepsOf(o)[k]; if (cat && x.key !== o.key && demand[x.key] > 0) demand[x.key] = Math.max(0, demand[x.key] - drawFrom(o, cat, demand[x.key])); }));
    }
  } else if (netDemand > 0) {
    owners.forEach(o => { demand[o.key] = netDemand / owners.length; });
    const remaining = () => owners.reduce((s, o) => s + demand[o.key], 0);
    // each wrapper tier: own pot first, then cross-cover the other owner
    const tier = (cat) => {
      owners.forEach(o => { demand[o.key] -= drawPot(o.ids[cat], demand[o.key]); });
      owners.forEach(o => owners.forEach(x => { if (x.key !== o.key && demand[x.key] > 0) demand[x.key] -= drawPot(o.ids[cat], demand[x.key]); }));
    };
    const pensionTier = (ceilingOf, raw = false) => {
      owners.forEach(o => { if (demand[o.key] > 0) demand[o.key] = Math.max(0, demand[o.key] - drawPension(o.key, demand[o.key], ceilingOf(o), raw)); });
      owners.forEach(o => owners.forEach(x => { if (x.key !== o.key && demand[x.key] > 0) demand[x.key] = Math.max(0, demand[x.key] - drawPension(o.key, demand[x.key], ceilingOf(o), raw)); }));
    };
    for (const step of ctx.policySteps) {
      if (remaining() <= 0.005) break;
      if (step === 'penPA') pensionTier(() => P.pa);
      else if (step === 'penBasic') pensionTier(() => P.higherRateStartsAt);
      else if (step === 'penAny') pensionTier(() => Infinity);
      else if (N4_PEN[step]) { const cap = N4_PEN[step](P); pensionTier(() => cap, !!N4_RAW[step]); }
      else tier(step);
    }
  }

  /*
   * 7a. SET MONEY ASIDE FOR A COST THE PLAN CAN SEE COMING.
   *
   * A one-off cost used to arrive as a surprise: read from the map in its own year and met by the cost
   * order, cash then GIA then ISA then pension with no ceiling. A large one therefore landed on the
   * pension in a single year and went straight through the higher and additional bands, when the same
   * money drawn over the years before would have come out at the basic rate.
   *
   * So, from `lookaheadYears` ahead, the plan prepares. Each year it looks at every known cost inside
   * the horizon, nearest first, sets the liquid wrappers against them, and takes this year's share of
   * whatever is still short - the shortfall spread over the years remaining until that cost - from the
   * pension, with the basic-rate limit as the ceiling. drawPension enforces the ceiling on TOTAL taxable
   * income, so a state pension that already fills the band stops this, as it should.
   *
   * It is recomputed from the balances every year rather than planned once, which is what makes it
   * self-correcting: a market rise that lifts the ISA stops the reserve growing, a living draw that eats
   * the cash is refilled the next year, and there is nothing to earmark, because the cost order spends
   * liquid first when the year comes. The proceeds go to the ISA up to the allowance and then to cash,
   * not the GIA as the harvest's do: this money is for spending within a few years, and a disposal on
   * the way out would realise a gain for nothing.
   *
   * What it costs: money leaves the pension's tax-free growth and death-tax shelter a few years early,
   * and the cash half earns cash's return meanwhile. That trade against twenty points of tax is what the
   * lookahead study measures, and it is why the horizon is a setting rather than a constant.
   */
  let reserved = 0, reservedFor = null;
  if (ctx.lookaheadYears > 0 && anyRetired && anyAccess) {
    /*
     * The liquid wrappers are projected forward at the real rate they earn, not counted at today's
     * balance: money that will have grown to cover the cost by the time it lands does not need topping
     * up, and counting it flat made the plan draw at 20% for shortfalls that growth alone erased.
     */
    let free = owners.reduce((s2, o) => s2 + (pots[o.ids.cash] || 0) + (pots[o.ids.isa] || 0) + (pots[o.ids.other] || 0), 0);
    const g = 1 + liquidRealRate(ctx);
    let share = 0;
    for (let k = 1; k <= ctx.lookaheadYears; k++) {
      const c = ctx.oneOffCosts.get(year + k) || 0;
      if (!(c > 0)) continue;
      if (reservedFor === null) reservedFor = year + k;
      const grown = Math.pow(g, k);
      const covered = Math.min(free * grown, c);
      free -= covered / grown;
      const short = c - covered;
      if (short > 0) share += short / k;
    }
    share *= frac;
    if (share > 0) {
      let need = share;
      owners.forEach(o => {
        if (need <= 0 || working[o.key] || !access[o.key] || (pots[o.ids.pen] || 0) <= 0) return;
        const net = drawPension(o.key, need, P.higherRateStartsAt);
        if (net > 0) {
          const isaRoom = Math.max(0, P.isaAllowance - isaContribThisYear[o.key]);
          const toIsa = Math.min(net, isaRoom);
          pots[o.ids.isa] = (pots[o.ids.isa] || 0) + toIsa;
          isaContribThisYear[o.key] += toIsa;
          pots[o.ids.cash] = (pots[o.ids.cash] || 0) + (net - toIsa);
          reserved += net; need -= net;
        }
      });
    }
  }

  /*
   * 7b. Harvest from the pension beyond what the year needs, and re-wrap it.
   *
   * The ceiling decides what this is FOR. Stopping at the personal allowance is free money: income drawn
   * at 0% that would otherwise sit in a pension. Going on to the basic-rate limit costs 20% now, and is
   * a bequest trade rather than a spending one - after 2027 a pension left behind is taxed twice, by the
   * estate and then by the heir at their own rate, so paying 20% today can beat both.
   *
   * The surplus fills the ISA first and lands in the GIA after that. At the personal-allowance ceiling
   * the ISA almost always absorbs the whole thing, so this matters mainly at the basic-rate ceiling,
   * where leaving tens of thousands a year in cash would understate the strategy by its own drag.
   */
  if (ctx.harvestPA && anyRetired) {
    const ceilOf = (c) => (c === 'basic' ? P.higherRateStartsAt : N4_HARVEST[c] ? N4_HARVEST[c](P) : P.pa);
    const harvestCeil = ceilOf(ctx.harvestCeiling);
    owners.forEach(o => {
      // a couple's joint move (Part D, D2): each person's own harvest switch and ceiling, as the exact model's year
      const own = ctx.joint && ctx.joint.perOwner[o.key] ? ctx.joint.perOwner[o.key] : null;
      if (own && !own.harvest) return;
      const ceil = own ? ceilOf(own.harvestCeil) : harvestCeil, raw = !!N4_RAW[own ? own.harvestCeil : ctx.harvestCeiling];
      if (working[o.key] || !access[o.key]) return;
      if ((pots[o.ids.pen] || 0) <= 0 || taxable[o.key] >= ceil) return;
      const net = drawPension(o.key, 1e12, ceil, raw);
      if (net > 0) {
        const isaRoom = Math.max(0, P.isaAllowance - isaContribThisYear[o.key]);
        const toIsa = Math.min(net, isaRoom);
        pots[o.ids.isa] = (pots[o.ids.isa] || 0) + toIsa;
        isaContribThisYear[o.key] += toIsa;
        const toGia = net - toIsa;
        pots[o.ids.other] = (pots[o.ids.other] || 0) + toGia;
        if (cgtOn && toGia > 0) giaAddBasis(state, o.key, toGia);   // deposited at cost: no gain created
        harvested += net;
      }
    });
  }

  /*
   * 7b''. N4's CGT move (research only, research/solver/n4-design.md): under a research table's move, sell the GIA so the
   * year's realised gains reach the exempt amount; the proceeds fill the ISA's room left this year and the rest is bought
   * back at cost, so the basis rises by the gain taken. The product's menu never sets it.
   */
  if (chosen && chosen.cgtSale && cgtOn) {
    owners.forEach(o => {
      const id = o.ids.other, before = pots[id] || 0, basis = state.giaBasis[o.key] || 0;
      const room = Math.max(0, P.cgtAnnualExempt - (t === 0 ? o.cgtGainsUsed : 0)) - realisedGains[o.key];
      if (!(room > 0) || !(before > basis)) return;
      const sold = sellGia(id, Math.min(before, room * before / (before - basis)));
      const toIsa = Math.min(sold, Math.max(0, P.isaAllowance - isaContribThisYear[o.key]));
      pots[o.ids.isa] = (pots[o.ids.isa] || 0) + toIsa;
      isaContribThisYear[o.key] += toIsa;
      pots[id] = (pots[id] || 0) + (sold - toIsa);
      giaAddBasis(state, o.key, sold - toIsa);
    });
  }

  // 7c. capital gains tax on the year's GIA disposals. Gains stack on top of income for the band split.
  // The bill is settled from cash -> GIA -> ISA -> accessible pension, mirroring one-off costs. A sale made
  // to pay the bill books its own gain, which falls into next year's tally (CGT is due the following January).
  let cgtPaid = 0;
  let unmetCgt = 0;
  if (cgtOn) {
    owners.forEach(o => {
      const exempt = Math.max(0, P.cgtAnnualExempt - (t === 0 ? o.cgtGainsUsed : 0));
      const taxableGain = Math.max(0, realisedGains[o.key] - exempt);
      if (taxableGain <= 0) return;
      // Unused personal allowance cannot be set against capital gains, so the band available to gains is
      // the basic-rate width less TAXABLE income (income after PA) — never the full gross-income headroom.
      const allIncome = taxablePay[o.key] + taxable[o.key] + savingsInterest[o.key] + giaDividends[o.key];
      const taxableIncome = Math.max(0, allIncome - P.paAt(allIncome));
      const basicRoom = Math.max(0, P.cgtBandWidth - taxableIncome);
      const atBasic = Math.min(taxableGain, basicRoom);
      const bill = atBasic * P.cgtBasicRate + (taxableGain - atBasic) * P.cgtHigherRate;
      if (bill <= 0) return;
      cgtPaid += bill;
      const gainsBeforeSettling = realisedGains[o.key];
      let rem = bill;
      for (const cat of ['cash', 'other', 'isa']) { if (rem > 0) rem -= drawPot(o.ids[cat], rem); }
      for (const x of owners) { if (rem > 0) rem -= drawPot(x.ids.cash, rem); }
      if (rem > 0) rem -= drawPension(o.key, rem);
      // 13 Nov 2026 (the deep review of the couples' read): a couple pays a bill from the household's money. Where the
      // person's own pots, either person's cash and their own open pension leave it unpaid, the partner's taxable
      // account, ISA and open pension pay it. Before, a second person whose pension was still locked could owe a few
      // hundred pounds that nothing might pay, and the path was counted as failed beside a partner's ISA of any size
      // (research/tests/couple-cgt-bill.test.mjs). A sale of the partner's taxable account for it books its gain to
      // the partner's next year, as the person's own sale does. A single has no partner: nothing changes.
      for (const x of owners) {
        if (x === o || !(rem > 0)) continue;
        const gainsX = realisedGains[x.key];
        for (const cat of ['other', 'isa']) { if (rem > 0) rem -= drawPot(x.ids[cat], rem); }
        if (rem > 0) rem -= drawPension(x.key, rem);
        state.cgtCarry[x.key] += realisedGains[x.key] - gainsX;
        realisedGains[x.key] = gainsX;
      }
      unmetCgt += Math.max(0, rem);
      // selling to pay the bill realises further gain — defer it to next year rather than recursing
      state.cgtCarry[o.key] += realisedGains[o.key] - gainsBeforeSettling;
      realisedGains[o.key] = gainsBeforeSettling;
    });
  }

  const unmetDemand = owners.reduce((s, o) => s + Math.max(0, demand[o.key]), 0) + unmetCost + oneOffDeductionShortfall + unmetCgt;
  const lockedPensionWealth = owners.reduce((s, o) => s + (access[o.key] ? 0 : (pots[o.ids.pen] || 0)), 0);
  const preNmpaInsolvent = unmetDemand > 1 && (!anyAccess || lockedPensionWealth > 0);

  /*
   * 7d. THE SWEEP, under a solved table: cash is kept at the buffer (sized on the plan's target, whatever
   * this year's level) and the rest sits in the GIA at cost; a shortfall is topped up from the GIA and
   * books its gain like any disposal, into next year's tally since this year's bill is settled.
   */
  // what the sweep moved, by owner, for the pages (the review of 9 Nov, item 5, part 1): cash to the taxable account, and back
  const swept = { toGia: { self: 0, part: 0 }, fromGia: { self: 0, part: 0 }, toIsa: { self: 0, part: 0 } };
  if (chosen && chosen.sweepCash) {
    const bufferEach = spendTargetAtAge(ctx, ageSelf) * ctx.cashBufferYears / owners.length;
    owners.forEach(o => {
      const cash = pots[o.ids.cash] || 0;
      if (cash > bufferEach) {
        const excess = cash - bufferEach;
        pots[o.ids.cash] = bufferEach;
        // the sweepCashIsaTo option ('isa'; research, off; the review of 9 Nov, item 5): the part of the excess that is cash ISA
        // money (the buffer keeps the sheltered cash first, as 7e does) transfers to the stocks and shares ISA where the person
        // holds one, which uses no allowance; the rest goes to the taxable account
        const fromIsa = chosen.sweepIsa && pots[o.ids.isa] !== undefined ? Math.min(excess, Math.max(0, state.cashIsa[o.key] - bufferEach)) : 0;
        if (fromIsa > 0) {
          pots[o.ids.isa] += fromIsa;
          pots[o.ids.other] = (pots[o.ids.other] || 0) + (excess - fromIsa);
          if (cgtOn) giaAddBasis(state, o.key, excess - fromIsa);
        } else {
          pots[o.ids.other] = (pots[o.ids.other] || 0) + excess;
          if (cgtOn) giaAddBasis(state, o.key, excess);
        }
        swept.toGia[o.key] = excess - fromIsa; swept.toIsa[o.key] = fromIsa;
      } else if (cash < bufferEach) {
        const before = realisedGains[o.key];
        const got = sellGia(o.ids.other, bufferEach - cash);
        pots[o.ids.cash] = cash + got;
        state.cgtCarry[o.key] += realisedGains[o.key] - before;
        swept.fromGia[o.key] = got;
      }
    });
  }

  /*
   * 7e. The cash ISA at the end of the year's flows. Money drawn from cash this year is taken from the
   * taxable part first (nobody spends sheltered cash while unsheltered cash sits beside it), so the
   * sheltered portion is capped at what is left; then whatever ISA allowance the year's subscriptions
   * have not used shelters more of the taxable cash, up to the cash ISA's own cap. This is the "act
   * logically" assumption the Cash ISA wrapper makes, and it is why it needs no decision of its own.
   */
  owners.forEach(o => {
    const cashNow = pots[o.ids.cash] || 0;
    state.cashIsa[o.key] = Math.min(state.cashIsa[o.key], cashNow);
    const cap = Math.max(0, P.cashIsaCapAt(ageOf(o.key), year) - cashIsaSubscribed[o.key]);
    const room = Math.min(cap, Math.max(0, P.isaAllowance - isaContribThisYear[o.key]));
    const move = Math.min(room, Math.max(0, cashNow - state.cashIsa[o.key]));
    if (move > 0) { state.cashIsa[o.key] += move; isaContribThisYear[o.key] += move; cashIsaSubscribed[o.key] += move; }
  });
  const cashBeforeGrowth = {};
  owners.forEach(o => { cashBeforeGrowth[o.key] = pots[o.ids.cash] || 0; });

  /*
   * 7f. THE TIER, under a solved table. A wrapper that changes tier this year is charged the round trip
   * on the slice traded (the difference in equity weight, times the wrapper, times the table's rate),
   * and then grows at the tier it now holds; the tiers held are remembered for next year's charge.
   */
  let switchPaid = 0;
  // whose tiers a wrapper takes: a single's move for the first person; a couple's joint move each person's own (Part D, D2)
  const tierMoveOf = (owner) => (joint ? joint.perOwner[owner] || null : owner === 'self' ? chosen : null);
  const tierOf = (a) => {
    if (!chosen || (a.cat !== 'pen' && a.cat !== 'isa')) return a;
    const mv = tierMoveOf(a.owner); if (!mv) return a;
    const profs = ctx.tierProfiles[a.id]; if (!profs) return a;
    const k = a.cat === 'pen' ? (mv.tierPen || 0) : (mv.tierIsa || 0), name = a.cat === 'pen' ? mv.tierPenName : mv.tierIsaName;
    const p = profs[Math.min(k, profs.length - 1)];
    if (name != null && p.name !== name) throw new Error(`table move: tier ${k} of ${a.id} is ${p.name} in the engine but ${name} in the table`);
    return p;
  };
  if (chosen && state.tierHeld) {
    const rate = table.switchCost || 0;
    for (const o of (joint ? owners : [ownerByKey.self])) {
      const mv = tierMoveOf(o.key), held = state.tierHeld[o.key]; if (!mv || !held) continue;
      for (const cat of ['pen', 'isa']) {
        const id = o.ids[cat], profs = ctx.tierProfiles[id]; if (!profs) continue;
        const k = Math.min(cat === 'pen' ? (mv.tierPen || 0) : (mv.tierIsa || 0), profs.length - 1);
        if (k !== held[cat]) {
          const d = Math.abs(profs[k].equityWeight - profs[held[cat]].equityWeight);
          const x = (pots[id] || 0) * rate * d;
          pots[id] = Math.max(0, (pots[id] || 0) - x); switchPaid += x; held[cat] = k;
        }
      }
    }
  }

  // 8. compounding (year 0 pro-rated)
  // The guardrail's inflation rule asks one thing of this step: did the portfolio lose money this year.
  const potBeforeGrowth = ctx.guardrails ? ctx.accounts.reduce((s2, a) => s2 + (pots[a.id] || 0), 0) : 0;
  const grownAt = { pen: null, isa: null };   // under a table: the tier each of the person's wrappers grew at this year
  ctx.accounts.forEach(a => {
    const p = tierOf(a);
    if (chosen && a.owner === 'self' && (a.cat === 'pen' || a.cat === 'isa')) grownAt[a.cat] = p.name;
    let g = p.real;
    if (isHistorical) g = (histPoint && !p.isCash) ? (p.equityWeight * histPoint.s + (1 - p.equityWeight) * histPoint.b) / 100 : p.real;
    else if (typeof market === 'object' && market !== null && market.z !== undefined) {
      // Log-return with median equal to the stated expected (geometric) real return. The sigmaParam
      // term shifts that median for the whole path at once, so it compounds instead of averaging out.
      const zp = market.zPath || 0;
      g = Math.exp(Math.log(1 + p.real) + p.sigmaParam * zp + p.vol * market.z) - 1;
    }
    pots[a.id] = Math.max(0, (pots[a.id] || 0) * (1 + g * frac));
  });
  if (ctx.guardrails) state.guard.lostLastYear = ctx.accounts.reduce((s2, a) => s2 + (pots[a.id] || 0), 0) < potBeforeGrowth;
  // the sheltered part of the cash pot grows with the pot
  owners.forEach(o => {
    const before = cashBeforeGrowth[o.key], after = pots[o.ids.cash] || 0;
    state.cashIsa[o.key] = before > 0 ? Math.min(after, state.cashIsa[o.key] * (after / before)) : 0;
  });

  const sumOwner = (o) => CATEGORIES.reduce((s, cat) => s + (pots[o.ids[cat]] || 0), 0);
  const totalSelf = sumOwner(ownerByKey.self);
  const totalPart = ctx.isCouple ? sumOwner(ownerByKey.part) : 0;
  const totalCombined = totalSelf + totalPart;
  const incomeTaxOf = {};
  owners.forEach(o => { incomeTaxOf[o.key] = billOf(o.key).total - payTax(o.key); });
  const taxPaid = owners.reduce((s, o) => s + incomeTaxOf[o.key], 0);
  const byCat = {};
  CATEGORIES.forEach(cat => { byCat[cat] = owners.reduce((s, o) => s + (pots[o.ids[cat]] || 0), 0); });

  return {
    year, t, ageSelf, agePart,
    histYear: histPoint ? histPoint.y : null,
    histStockReturn: histPoint ? histPoint.s : null,
    histBondReturn: histPoint ? histPoint.b : null,
    workingSelf: working.self ? 1 : 0, workingPart: working.part ? 1 : 0,
    targetSpend: annualLivingTarget, spSelf: statePension.self, spPart: statePension.part,
    netGuaranteed: totalNetGuaranteed, workingTakeHome,
    netDrawdown: netDemand, totalSelf, totalPart, totalCombined,
    pots: { ...pots },
    pensions: byCat.pen, isas: byCat.isa, other: byCat.other, cash: byCat.cash,
    preNmpaLiquid: byCat.isa + byCat.other + byCat.cash,
    drawdownPensions, taxablePensionSelf: taxablePensionDrawn.self, taxablePensionPart: taxablePensionDrawn.part, harvested, taxPaid, cgtPaid,
    otherTaxableSelf: otherTaxable.self, otherTaxablePart: otherTaxable.part,
    savingsInterest: savingsInterest.self + savingsInterest.part, savingsTax: savingsTax.self + savingsTax.part,
    taxablePaySelf: taxablePay.self, taxablePayPart: taxablePay.part, savingsInterestSelf: savingsInterest.self, savingsInterestPart: savingsInterest.part,
    giaDividendsSelf: giaDividends.self, giaDividendsPart: giaDividends.part, incomeTaxSelf: incomeTaxOf.self || 0, incomeTaxPart: incomeTaxOf.part || 0,
    giaDividends: giaDividends.self + giaDividends.part, dividendTax: dividendTax.self + dividendTax.part,
    cashIsa: owners.reduce((s2, o) => s2 + state.cashIsa[o.key], 0),
    realisedGains: realisedGains.self + realisedGains.part,
    preNmpaInsolvent, unmetDemand,
    // the spending rule: what it did this year, and the multiplier now in force on the draw (1 = as planned)
    guardrail, spendMult: ctx.guardrails ? state.guard.mult : 1,
    // set aside this year for a cost the plan can see coming, and which year's cost it was for
    reserved, reservedFor,
    // the year's own one-off cost, so the bridge can size for one that falls before the pension unlocks
    oneOffCost: cost,
    // under a solved table: what it chose this year, the tiers held, and what a tier change cost
    action: chosen ? (chosen.code || null) : null, spendLevel: chosen && chosen.spendLevel !== undefined ? chosen.spendLevel : 1,
    tierPen: state.tierHeld ? state.tierHeld.self.pen : 0, tierIsa: state.tierHeld ? state.tierHeld.self.isa : 0, switchPaid,
    tierPenName: grownAt.pen, tierIsaName: grownAt.isa,
    // the year's sweep (7d): cash above the buffer moved to the taxable account, and a shortfall topped up from it
    sweptToGia: swept.toGia.self + swept.toGia.part, sweptFromGia: swept.fromGia.self + swept.fromGia.part, sweptToIsa: swept.toIsa.self + swept.toIsa.part
  };
}

// ---------------------------------------------------------------- simulation drivers
function simulateDeterministic(planOrCtx, regime = 'expected') {
  const ctx = planOrCtx && planOrCtx.P ? planOrCtx : buildContext(planOrCtx);
  const state = freshState(ctx);
  const rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(stepYear(ctx, state, t, regime));
  return rows;
}

/*
 * The MPAA trigger is a consequence of the plan rather than an input: it starts the first year an owner
 * takes taxable pension income (tax-free cash alone does not count). Resolved once on the expected path
 * and written back into the plan, so headroom, staging, Monte Carlo and the backtest all agree.
 * Single pass by design — staged pension deposits are sized by headroom, so iterating could oscillate,
 * and the trigger year is driven by retirement age and spending rather than by deposit staging.
 */
function resolveMpaa(plan) {
  const ctx0 = buildContext(plan);
  if (!ctx0.P.mpaaLimit) return plan;
  const rows = simulateDeterministic(ctx0, 'expected');
  const demographics = { ...ctx0.plan.demographics };
  ctx0.owners.forEach(o => {
    const hit = rows.find(r => (o.key === 'self' ? r.taxablePensionSelf : r.taxablePensionPart) > 0);
    demographics[o.key === 'self' ? 'mpaaAgeSelf' : 'mpaaAgePart'] = hit ? (o.key === 'self' ? hit.ageSelf : hit.agePart) : '';
  });
  return { ...ctx0.plan, demographics };
}

function simulateHistorical(planOrCtx, startYear) {
  const ctx = planOrCtx && planOrCtx.P ? planOrCtx : buildContext(planOrCtx);
  const state = freshState(ctx);
  const rows = [];
  for (let t = 0; t <= ctx.totalYears; t++) rows.push(stepYear(ctx, state, t, { historical: true, startYear }));
  return rows;
}

const FAIL_TOLERANCE = 1; // £ of unmet demand in a year that counts as failure

function evaluateRows(ctx, rows) {
  const failedStep = rows.find(r => r.unmetDemand > FAIL_TOLERANCE || r.preNmpaInsolvent);
  const terminal = rows[rows.length - 1];
  const belowFloor = ctx.solvencyFloor > 0 && terminal.totalCombined < ctx.solvencyFloor;
  const survived = !failedStep && !belowFloor;
  return {
    survived,
    failAge: failedStep ? failedStep.ageSelf : (belowFloor ? terminal.ageSelf : null),
    failYear: failedStep ? failedStep.year : (belowFloor ? terminal.year : null),
    failReason: failedStep ? (failedStep.preNmpaInsolvent ? 'pre-access' : 'shortfall') : (belowFloor ? 'floor' : null),
    preNmpaFailed: !!(failedStep && failedStep.preNmpaInsolvent),
    terminalPot: Math.max(0, terminal.totalCombined),
    terminalPension: Math.max(0, terminal.pensions),
    terminalPotNet: Math.max(0, terminal.totalCombined - terminal.pensions * ctx.pensionDeathTaxRate),
    minPot: Math.min(...rows.map(r => r.totalCombined)),
    lifetimeTax: rows.reduce((s, r) => s + r.taxPaid + (r.cgtPaid || 0), 0)
  };
}

// One Monte Carlo path. `zs` is the pre-drawn standard-normal shock per year (common random numbers).
function runTrial(ctx, zs, spendOverride = null, collectPath = false) {
  const state = freshState(ctx);
  let failed = false, failAge = null, preNmpaFailed = false, minPot = Infinity, lifetimeTax = 0, unmetTotal = 0;
  let terminalRow = null;
  // what was actually spent across the retired years, and the rule's footprint on this path
  let spentTotal = 0, retiredYears = 0, cutYears = 0, raiseYears = 0, multMin = 1;
  /*
   * Opt-in, and the default matters: optimizeSpend calls this a few hundred times while bisecting and
   * buildTournament runs a full simulation per player plus two candidate searches. None of them wants
   * to pay for a path it will not read, so only the fan chart asks.
   */
  const path = collectPath ? new Float64Array(ctx.totalYears + 1) : null;
  /*
   * Fixed for the whole path: this is "the long-run average turned out to be better or worse than we
   * assumed", which is decided once and then lived with, unlike the annual shock which is redrawn.
   * Absent for a caller that supplied only per-year draws, in which case it is simply zero.
   */
  const zPath = zs.length > ctx.totalYears + 1 ? zs[ctx.totalYears + 1] : 0;
  for (let t = 0; t <= ctx.totalYears; t++) {
    const row = stepYear(ctx, state, t, { z: zs[t], zPath }, spendOverride);
    lifetimeTax += row.taxPaid + (row.cgtPaid || 0);
    if (row.totalCombined < minPot) minPot = row.totalCombined;
    // floored the same way terminalPot is, so the last entry of a path is exactly the terminal pot
    if (path) path[t] = Math.max(0, row.totalCombined);
    // every pound of spending the plan could not meet, kept whether or not it has already failed
    unmetTotal += Math.max(0, row.unmetDemand || 0);
    if (row.targetSpend > 0) { spentTotal += row.targetSpend; retiredYears++; }
    if (row.guardrail && row.guardrail.includes('cut')) cutYears++;
    if (row.guardrail && row.guardrail.includes('raise')) raiseYears++;
    if (row.spendMult < multMin) multMin = row.spendMult;
    if (!failed && (row.unmetDemand > FAIL_TOLERANCE || row.preNmpaInsolvent)) {
      failed = true; failAge = row.ageSelf; preNmpaFailed = row.preNmpaInsolvent || !ctx.owners.some(o => (o.key === 'self' ? row.ageSelf : row.agePart) >= ctx.nmpa);
    }
    terminalRow = row;
  }
  const terminalPot = Math.max(0, terminalRow.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && terminalPot < ctx.solvencyFloor) { failed = true; failAge = terminalRow.ageSelf; }
  const terminalPotNet = Math.max(0, terminalPot - Math.max(0, terminalRow.pensions) * ctx.pensionDeathTaxRate);
  /*
   * The net position of this lifetime: what was left, less what was never afforded.
   *
   * Zero is the floor of a pot, so once a path runs dry every failing path looks identical - and the
   * 10th percentile of a set of zeros is zero, which is why "protecting the bad case" went blind
   * exactly when the bad case was real. Subtracting the unmet spending puts the failures back in
   * order: running dry at 80 carries more unmet years than running dry at 90, so it scores worse.
   * For a path that never falls short this is exactly terminalPotNet, so nothing changes for a plan
   * that holds.
   */
  const out = { survived: !failed, failAge, preNmpaFailed, terminalPot, terminalPotNet, minPot, lifetimeTax,
    unmetTotal, terminalPotShortfallAdj: terminalPotNet - unmetTotal,
    realisedSpend: retiredYears ? spentTotal / retiredYears : 0, cutYears, raiseYears, multMin };
  if (path) out.path = path;
  return out;
}

/*
 * One shock series per trial. The array is one longer than the projection: indices 0..years are the
 * per-year market shocks and the final entry is the path's expected-return shock, used when a tier
 * carries a non-zero sigmaParam.
 *
 * The extra draw is appended rather than prepended deliberately. gaussianPath fills sequentially from a
 * seeded generator, so asking it for one more normal leaves every earlier value untouched — which is
 * what lets this change be verified as a no-op at sigmaParam = 0 rather than merely argued to be one.
 */
function pathsForSeed(seed, trials, years) {
  const out = new Array(trials);
  for (let i = 0; i < trials; i++) out[i] = gaussianPath((seed + i * 7919) >>> 0, years + 2);
  return out;
}

// How many real trials to keep for the chart to draw. See samplePaths below.
const SAMPLE_PATHS = 60;

function summarizeTrials(results) {
  const n = results.length;
  if (!n) return null;
  const pots = results.map(r => r.terminalPot).sort((a, b) => a - b);
  const potsNet = results.map(r => r.terminalPotNet).sort((a, b) => a - b);
  // the same pots with unmet spending netted off, so failing paths keep an order among themselves
  const potsAdj = results.map(r => r.terminalPotShortfallAdj).sort((a, b) => a - b);
  const fails = results.filter(r => !r.survived).map(r => r.failAge).filter(a => a !== null).sort((a, b) => a - b);
  const q = (arr, p) => arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0;
  const successCount = results.filter(r => r.survived).length;
  const successRate = (successCount / n) * 100;
  /*
   * Per-year percentile bands, when the caller asked runTrial to keep each path. Deliberately the same
   * `q` as the terminal figures below: the right-hand edge of the fan is then the same number as the
   * p10/median/p90 tiles, rather than merely close to it, and a reader can check one against the other.
   *
   * Paths that run dry sit at zero and stay there, which is the point. The p10 line reaching the axis
   * at some age is the plain statement that one plan in ten is broke by then.
   */
  let bands = null, samplePaths = null;
  if (results[0] && results[0].path) {
    const years = results[0].path.length;
    const col = new Float64Array(n);
    bands = [];
    for (let t = 0; t < years; t++) {
      for (let i = 0; i < n; i++) col[i] = results[i].path[t];
      col.sort();                       // typed-array sort is numeric, and in place costs nothing
      // quartiles as well as deciles: the chart draws the quartile band by default so it can be read
      // like for like against the rate-based one, which is quoted at quartiles because that is what the
      // published assumptions give
      bands.push({ t, p10: q(col, 0.10), p25: q(col, 0.25), p50: q(col, 0.50), p75: q(col, 0.75), p90: q(col, 0.90) });
    }
    /*
     * A handful of the ACTUAL trials, kept so the chart can draw real simulated futures rather than a
     * reveal of the summary. Evenly spaced by index rather than randomly picked, so the same run always
     * shows the same faces and the sample is not quietly reweighted toward anything; the trials are
     * already in seed order, which has no relation to outcome, so evenly spaced is an unbiased sample.
     *
     * 60 of them: enough to show the spread has texture, few enough that the eye can still follow one.
     */
    const want = Math.min(SAMPLE_PATHS, n);
    const stride = Math.max(1, Math.floor(n / want));
    samplePaths = [];
    for (let i = 0; i < n && samplePaths.length < want; i += stride) samplePaths.push(results[i].path.slice());
  }
  return {
    trials: n,
    successRate,
    bands,
    samplePaths,
    standardError: Math.sqrt(Math.max(0, successRate * (100 - successRate) / n)),
    p10Terminal: q(pots, 0.10), p25Terminal: q(pots, 0.25), medianTerminal: q(pots, 0.50),
    p75Terminal: q(pots, 0.75), p90Terminal: q(pots, 0.90),
    p10TerminalNet: q(potsNet, 0.10), medianTerminalNet: q(potsNet, 0.50), p90TerminalNet: q(potsNet, 0.90),
    p10TerminalAdj: q(potsAdj, 0.10),
    medianFailAge: fails.length ? q(fails, 0.5) : null,
    earliestFailAge: fails.length ? fails[0] : null,
    preNmpaFailRate: (results.filter(r => !r.survived && r.preNmpaFailed).length / n) * 100,
    medianLifetimeTax: q(results.map(r => r.lifetimeTax).sort((a, b) => a - b), 0.5),
    /*
     * WHAT THE HOUSEHOLD ACTUALLY LIVED ON. With the guardrails off these repeat the plan; with them on
     * they are the figures that keep the survival rate honest. A path that survives by cutting three
     * times counts as a success, so the rate rises for a reason it cannot show on its own. These say
     * what it cost: the typical year's spending after the rules, the unlucky tenth, and how many paths
     * were ever cut at all.
     */
    medianRealisedSpend: q(results.map(r => r.realisedSpend).sort((a, b) => a - b), 0.5),
    p10RealisedSpend: q(results.map(r => r.realisedSpend).sort((a, b) => a - b), 0.10),
    cutPathShare: (results.filter(r => r.cutYears > 0).length / n) * 100,
    raisePathShare: (results.filter(r => r.raiseYears > 0).length / n) * 100,
    medianCutYears: q(results.map(r => r.cutYears).sort((a, b) => a - b), 0.5)
  };
}

// Synchronous Monte Carlo. For UI responsiveness call runTrial in chunks instead (see App).
function monteCarlo(planOrCtx, { trials = 5000, seed = 12345, spendOverride = null, collectPaths = false } = {}) {
  const ctx = planOrCtx && planOrCtx.P ? planOrCtx : buildContext(planOrCtx);
  const paths = pathsForSeed(seed, trials, ctx.totalYears);
  const results = paths.map(zs => runTrial(ctx, zs, spendOverride, collectPaths));
  return { ...summarizeTrials(results), spend: spendOverride !== null ? spendOverride : ctx.targetSpend };
}

/*
 * Safe maximum spend: largest spend (rounded to £250) whose success rate meets targetRate.
 *
 * Two stages, and the second one is not optional. A cheap bisection on a few hundred paths finds the
 * neighbourhood; a verification pass on the full sample then walks the answer down until the rate we are
 * going to PRINT actually clears the target.
 *
 * The second stage exists because searching and reporting on different samples is how a solver quietly
 * lies. Bisecting on a small sample selects, among the spends near the boundary, whichever one that
 * sample happened to flatter - the winner's curse - so re-measuring on a fresh sample regresses, and
 * always downward, because the selection was upward. Measured on the earlier version, which searched on
 * 400 paths with `seed` and reported on 5,000 with `seed + 1`: all twelve of twelve test fixtures came
 * back 0.5 to 2.4 points BELOW the target the user had asked for. A "95% safe spend" surviving 92.6% of
 * paths is not a rounding error, it is the wrong answer to the question.
 *
 * So: one seed throughout (pathsForSeed builds path i from seed + i·7919, so the search set is a genuine
 * prefix of the final set, not a different draw), and the returned stats are the ones that were checked.
 * The contract is that successRate >= targetRate, or spend is 0 and `note` says why.
 */
/*
 * THE EARLIEST RETIREMENT AGE THE PLAN STILL SURVIVES, holding the spending as planned.
 *
 * The safe-spend solver asks "given when I stop, how much can I draw". This asks the other one: "given
 * what I intend to draw, when can I stop". Same target survival rate, so the two answers are readable
 * against each other.
 *
 * WHAT MOVES WITH RETIREMENT, AND WHAT DOES NOT. Three of these fall out of the engine already and
 * need no rule; the fourth is the one that needs deciding.
 *
 *   SALARY            stops at retireAge, so it follows on its own.
 *   CONTRIBUTIONS     stop at retirement, so they follow too - which is why retiring five years early
 *                     is a triple hit and not a single one: five more years of full spending, five
 *                     fewer of earning, and five fewer of paying in.
 *   STATE PENSION     starts at the state pension age and is not tied to stopping work, so it stays.
 *   PENSION ACCESS    the NMPA is a statutory age; retiring earlier cannot unlock a pension sooner, it
 *                     just lengthens the bridge that has to be funded without one.
 *
 *   OTHER INCOMES     the decision. An EARNINGS stream is work, so it travels with the retirement age
 *                     in both directions. Everything else - a DB pension, an annuity, anything tax-free
 *                     - has a date of its own that stopping work does not move, so it stays exactly
 *                     where it is. A stream already running is not dragged back before the owner's
 *                     current age, because work already done cannot be un-done.
 *
 * COUPLES move together, by the same number of years. Any gap the household planned between the two
 * retirements is theirs and survives the shift; collapsing both to one age would silently discard it.
 *
 * THE CURVE IS SCANNED, NOT BISECTED. Later is usually safer and is not guaranteed to be: an earnings
 * stream ending can move the household across a tax band, and the money-purchase annual allowance
 * turns on flexible access rather than on retiring. A bisection assumes one crossing; a scan finds the
 * real one. Coarse in two-year steps for the shape, then a one-year refinement across the boundary.
 */
function shiftRetirement(plan, delta) {
  if (!delta) return plan;
  const d = plan.demographics || {};
  const shiftOwner = (v) => isBlank(v) ? v : num(v, 0) + delta;
  return {
    ...plan,
    demographics: { ...d, retireAgeSelf: shiftOwner(d.retireAgeSelf), retireAgePart: shiftOwner(d.retireAgePart) },
    otherIncomes: (plan.otherIncomes || []).map((i) => {
      // only work travels with the retirement age; a DB pension has a date of its own
      if (!incomeTypeOf(i.incomeType).relevantEarnings) return i;
      const floorAge = num(i.owner === 'Partner' ? d.currentAgePart : d.currentAgeSelf, 0);
      return { ...i,
        startAge: isBlank(i.startAge) ? i.startAge : Math.max(floorAge, num(i.startAge, 0) + delta),
        endAge: isBlank(i.endAge) ? i.endAge : num(i.endAge, 0) + delta };
    })
  };
}

function safeRetirementAge(rawPlan, { targetRate = 90, seed = 12345, searchTrials = 400, finalTrials = 5000,
                                      maxYearsLater = 20, onProgress = null } = {}) {
  const base0 = normalizePlan(rawPlan);
  /*
   * THE AGES COME FROM THE CONTEXT, NOT THE RAW DEMOGRAPHICS.
   *
   * A blank age is filled in by buildContext - 40 for current, 60 for retirement - and is left blank by
   * normalizePlan. Reading the demographics directly made this solver the one component on the tab that
   * disagreed with every other: on a plan with the ages not yet entered it read 0 and 0 and answered
   * "you are already retired", while the slide above it was projecting from 40 to 60.
   *
   * The resolved ages are then written back onto the plan the shift works from, because shiftRetirement
   * deliberately leaves a blank field blank - which would have made every shift a no-op.
   */
  const ctx0 = buildContext(resolveMpaa(base0));
  const currentAge = ctx0.ageSelf0;
  const planned = ctx0.owners[0].retireAge;
  const terminal = ctx0.terminalAge;
  const base = { ...base0, demographics: { ...base0.demographics,
    currentAgeSelf: currentAge, retireAgeSelf: planned, terminalAge: terminal,
    ...(ctx0.isCouple ? { currentAgePart: ctx0.agePart0, retireAgePart: ctx0.owners[1].retireAge } : {}) } };
  // you cannot retire in the past, and retiring in the final year of the plan is not a retirement
  const lo = Math.max(Math.ceil(currentAge), 0);
  const hi = Math.min(terminal - 1, Math.max(planned, lo) + maxYearsLater);
  if (hi < lo) return null;
  if (planned <= currentAge) {
    return { alreadyRetired: true, planned, currentAge, targetRate, curve: [], age: null };
  }

  const rateFor = (age, trials) => {
    const variant = shiftRetirement(base, age - planned);
    const st = monteCarlo(buildContext(resolveMpaa(variant)), { trials, seed });
    return { age, rate: st.successRate, preNmpaFailRate: st.preNmpaFailRate, stats: st };
  };

  const seen = new Map();
  const at = (age, trials) => {
    const key = `${age}:${trials}`;
    if (!seen.has(key)) seen.set(key, rateFor(age, trials));
    return seen.get(key);
  };

  // coarse pass for the shape of the curve
  const coarse = [];
  const steps = Math.floor((hi - lo) / 2) + 1;
  for (let i = 0, age = lo; age <= hi; i++, age += 2) {
    if (onProgress) onProgress({ label: `Testing retirement at ${age}`, value: i / Math.max(1, steps) });
    coarse.push(at(age, searchTrials));
  }
  // and the last age, if the step skipped it
  if (coarse[coarse.length - 1].age !== hi) coarse.push(at(hi, searchTrials));

  /*
   * The first age that clears the target, then walk BACK a year at a time to make sure nothing between
   * it and the previous coarse point clears it sooner. Scanning down rather than bisecting is what
   * copes with a curve that is not monotone.
   */
  const firstHit = coarse.find(p => p.rate >= targetRate) || null;
  let answer = firstHit;
  if (firstHit) {
    for (let age = firstHit.age - 1; age >= lo; age--) {
      const p = at(age, searchTrials);
      if (p.rate < targetRate) break;
      answer = p;
    }
  }

  const curve = [...seen.values()].sort((a, b) => a.age - b.age).map(p => ({ age: p.age, rate: p.rate, preNmpaFailRate: p.preNmpaFailRate }));
  if (!answer) {
    const best = curve.reduce((a, b) => (b.rate > a.rate ? b : a), curve[0]);
    return { age: null, planned, currentAge, targetRate, curve, best,
      note: `No retirement age up to ${hi} reaches ${targetRate}%. The best available is ${best.rate.toFixed(1)}% at ${best.age}.` };
  }

  /*
   * VERIFIED AT FULL PRECISION, AND MOVED LATER UNTIL IT HOLDS.
   *
   * A few hundred paths decide the bracket; they do not settle it. The safe-spend solver had exactly
   * this defect once - a "90% safe spend" that came back at 88.4% when it was re-run properly - and
   * this one reproduced it on the first fixture tried: 91.0% on 400 paths at 58, 88.75% on 2,000.
   *
   * Quoting an age that fails its own target is worse than quoting a later one, so the answer steps
   * LATER until the full run agrees, which is the conservative direction here in the same way that
   * spending LESS is for the other solver. If it runs out of room, the shortfall is reported rather
   * than buried.
   */
  let chosen = answer.age;
  let variant = shiftRetirement(base, chosen - planned);
  let full = monteCarlo(buildContext(resolveMpaa(variant)), { trials: finalTrials, seed });
  let verifySteps = 0;
  while (full.successRate < targetRate && chosen < hi && verifySteps < 12) {
    chosen++; verifySteps++;
    if (onProgress) onProgress({ label: `Verifying retirement at ${chosen}`, value: 0.9 });
    variant = shiftRetirement(base, chosen - planned);
    full = monteCarlo(buildContext(resolveMpaa(variant)), { trials: finalTrials, seed });
  }
  answer = { ...answer, age: chosen };
  /*
   * WHAT ACTUALLY STOPPED THEM GOING EARLIER. A plan that fails a year sooner because the pot runs out
   * at 90 is a different problem from one that fails because there is no way to reach the pension at
   * all, and the second is far more common on an early retirement. The year below the answer says which.
   */
  const below = answer.age > lo ? at(answer.age - 1, searchTrials) : null;
  const verified = full.successRate >= targetRate;
  const boundBy = !below ? 'current age'
    : below.preNmpaFailRate > (below.rate < targetRate ? 0.5 : Infinity) ? 'bridge to pension access'
    : 'the money running out';

  return {
    age: answer.age, planned, currentAge, targetRate, curve, boundBy, verified, verifySteps,
    yearsEarlier: planned - answer.age,
    rate: full.successRate, stats: full, plan: variant,
    below: below ? { age: below.age, rate: below.rate, preNmpaFailRate: below.preNmpaFailRate } : null,
    ...(verified ? {} : { note: `No retirement age up to ${hi} holds ${targetRate}% when re-run at full precision; ${answer.age} reaches ${full.successRate.toFixed(1)}%.` })
  };
}

function optimizeSpend(planOrCtx, { targetRate = 90, seed = 12345, searchTrials = 400, finalTrials = 5000, verifySteps = 6, onProgress = null } = {}) {
  const ctx = planOrCtx && planOrCtx.P ? planOrCtx : buildContext(planOrCtx);
  const paths = pathsForSeed(seed, searchTrials, ctx.totalYears);
  const rateAt = (spend) => { let s = 0; for (const zs of paths) if (runTrial(ctx, zs, spend).survived) s++; return (s / searchTrials) * 100; };
  const full = (spend) => monteCarlo(ctx, { trials: finalTrials, seed, spendOverride: spend });

  if (rateAt(0) < targetRate) return { spend: 0, ...full(0), targetRate, note: 'Even zero spending fails the target (pre-SIPP access gap or one-off costs).' };

  // stage 1: cheap bracket
  let low = 0, high = Math.max(20000, ctx.targetSpend * 2, 150000), guard = 0;
  while (rateAt(high) >= targetRate && guard++ < 8) { low = high; high *= 2; }
  for (let iter = 0; iter < 14; iter++) {
    const mid = round250((low + high) / 2);
    if (mid <= low || mid >= high) break;
    if (rateAt(mid) >= targetRate) low = mid; else high = mid;
    if (onProgress) onProgress(0.6 * ((iter + 1) / 14));
  }

  // stage 2: bisect down on the full sample until the printed rate clears the target
  let hi = round250(low);                       // believed to pass, unverified
  let stats = full(hi);
  if (stats.successRate >= targetRate) {
    if (onProgress) onProgress(1);
    // Zero can legitimately BE the answer: spending nothing clears the target but nothing above it does.
    // That is a different statement from "not even zero works", and saying £0 without which one it is
    // leaves the tab showing a bare zero with no reason attached.
    return hi > 0
      ? { spend: hi, ...stats, targetRate }
      : { spend: 0, ...stats, targetRate, note: `No spending above zero clears ${targetRate}%. The plan holds only while nothing is drawn from it.` };
  }
  let lo = 0, best = { spend: 0, stats: full(0) };
  for (let i = 0; i < verifySteps; i++) {
    const mid = round250((lo + hi) / 2);
    if (mid <= lo || mid >= hi) break;
    const s = full(mid);
    if (s.successRate >= targetRate) { lo = mid; best = { spend: mid, stats: s }; } else hi = mid;
    if (onProgress) onProgress(0.6 + 0.4 * ((i + 1) / verifySteps));
  }
  if (onProgress) onProgress(1);
  return best.stats.successRate >= targetRate
    ? { spend: best.spend, ...best.stats, targetRate }
    : { spend: 0, ...best.stats, targetRate, note: 'Even zero spending fails the target (pre-SIPP access gap or one-off costs).' };
}

// ---------------------------------------------------------------- financial helpers used by the tournament
const annuityFactor = (r, n) => (Math.abs(r) < 1e-9 ? n : (1 - Math.pow(1 + r, -n)) / r);
// FV at end of n years of contributions paid at the start of each year, escalating at g, growing at r (engine convention)
const fvContribStream = (C, r, g, n) => { let fv = 0; for (let t = 0; t < n; t++) fv = (fv + C * Math.pow(1 + g, t)) * (1 + r); return fv; };

/*
 * Real return the bridge pot can be expected to earn: the balance-weighted rate across the wrappers that
 * are actually allowed to fund it. With nothing liquid held yet there is nothing to weight, so fall back
 * to the ISA tier, which is where new bridge money would go.
 */
function liquidRealRate(ctx) {
  let w = 0, s = 0;
  ctx.accounts.forEach(a => { if (a.cat !== 'pen' && a.balance > 0) { w += a.balance; s += a.balance * a.real; } });
  if (w > 0) return s / w;
  const isa = ctx.accounts.find(a => a.cat === 'isa');
  return isa ? isa.real : 0;
}

/*
 * Pre-access bridge: years in which the household draws on the portfolio but nobody can touch a pension.
 * Spending is net of guaranteed income (and a working partner's take-home).
 *
 * Two sizes come back. `netNeeded` is the plain sum of those years' drawdowns, which assumes the money
 * sits at 0% real from the day it is set aside: deliberately conservative, and what the bridge safety
 * margin in Config is applied to. `pvNeeded` discounts each year back to the retirement date at the rate
 * the liquid pot actually earns, because only the first year's spending is needed on day one; the rest
 * keeps compounding while it waits. The gap between the two grows with the length of the bridge.
 */
function bridgeRequirement(ctx) {
  const rows = simulateDeterministic(ctx, 'expected');
  const rate = liquidRealRate(ctx);
  let years = 0, needed = 0, pv = 0;
  for (const r of rows) {
    const anyAccess = ctx.owners.some(o => (o.key === 'self' ? r.ageSelf : r.agePart) >= ctx.nmpa);
    if (anyAccess) break;
    /*
     * A one-off cost inside the gap has to come out of the same bridge: the pension cannot be reached
     * for it, so it is the liquid wrappers or nothing. It used to be left out, which sized the bridge
     * for the weekly shop and let a roof at 55 become a pre-access failure the tournament never saw.
     */
    if (r.targetSpend > 0) { const need = r.netDrawdown + (r.oneOffCost || 0); pv += need / Math.pow(1 + rate, years); years++; needed += need; }
  }
  return { gapYears: years, netNeeded: needed, pvNeeded: pv, rate };
}

/*
 * How much has to go into the ISA each year for the bridge to be funded by the time it is needed, once
 * growth is counted on both sides: what is already held keeps compounding until retirement, and so does
 * each new contribution.
 *
 * `margin` scales the target (1 = exactly the discounted requirement). `overYears` is how many of the
 * remaining years carry the contributions: passing fewer than the full run to retirement back-loads them,
 * which raises the annual figure but leaves the pension compounding on its own for longer first.
 *
 * This is the honest version of the figure Relief-First uses. That one ignores growth entirely and then
 * divides by every year to retirement, which over a long run to retirement asks for several times more
 * ISA than the bridge will need, and starves the pension of relief to pay for it.
 */
function bridgeIsaAnnual(ctx, { emergencyFloor = 0, margin = 1, overYears = null } = {}) {
  const bridge = bridgeRequirement(ctx);
  if (!(bridge.gapYears > 0) || !(bridge.pvNeeded > 0)) {
    return { annual: 0, target: 0, shortfall: 0, spareAtRetire: 0, years: 0, bridge };
  }
  const g = bridge.rate;
  const yearsToRetire = Math.max(1, Math.min(...ctx.owners.map(o => o.retireAge - o.age0)));
  const liquidToday = ctx.accounts.reduce((t, a) => (a.cat === 'pen' ? t : t + a.balance), 0);
  const spareAtRetire = Math.max(0, liquidToday - emergencyFloor) * Math.pow(1 + g, yearsToRetire);
  const target = bridge.pvNeeded * Math.max(0, margin);
  const shortfall = Math.max(0, target - spareAtRetire);
  const years = clamp(Math.round(overYears || yearsToRetire), 1, yearsToRetire);
  const isa = ctx.accounts.find(a => a.cat === 'isa');
  const fv = fvContribStream(1, g, isa ? isa.growth : 0, years);
  return { annual: fv > 0 ? shortfall / fv : 0, target, shortfall, spareAtRetire, years, yearsToRetire, bridge };
}

// Regular-contribution amount for account `a` in projection-year index t (post-escalation, or a phased schedule).
function contribAtYear(a, t) {
  return a.contribByYear ? (a.contribByYear[t] || 0) : a.contrib * Math.pow(1 + a.growth, t);
}

/*
 * Salary, or trading profit for the self-employed, in projection-year t. The projection is in today's
 * money, so a rate of 0 is not a frozen wage: it is pay rising exactly with inflation. `salaryGrowth` is
 * whatever is expected on top of that, and can be negative for a career winding down.
 */
function salaryAtYear(o, t) {
  if (o.salaryByYear) return o.salaryByYear[t] || 0;
  if (!(o.salary > 0)) return 0;
  return o.salary * Math.pow(1 + (o.salaryGrowth || 0), t);
}

// Relevant UK earnings for pension purposes in projection-year t: salary while still working, plus any
// earnings-type income streams active at that age. Pension income, annuities and rent do not count.
function relevantEarningsAtYear(ctx, o, t) {
  const age = o.age0 + t;
  const salary = age < o.retireAge ? salaryAtYear(o, t) : 0;
  return (ctx.otherIncomes || []).reduce((s, i) =>
    (i.owner === o.key && i.isEarnings && age >= i.startAge && age <= i.endAge) ? s + i.amount : s, salary);
}

// Money Purchase Annual Allowance. Flexibly accessing a pension (drawing taxable income, as opposed to
// taking only tax-free cash or buying an annuity) permanently cuts the DC allowance, with no carry-forward.
// The trigger is a real-world event, so the age is declared per owner rather than inferred.
function mpaaAppliesAtYear(P, o, t) {
  return P.mpaaLimit > 0 && Number.isFinite(o.mpaaAge) && (o.age0 + t) >= o.mpaaAge;
}

// Unused annual allowance carried forward from the previous three tax years. Years inside the projection
// are computed from the contribution schedule; years before it come from the declared opening figure,
// which decays out of the three-year window as the projection advances. Not consumed when used — see docs.
function carryForwardAtYear(ctx, o, t) {
  const { P, acc } = ctx;
  const a = acc[o.ids.pen];
  let total = 0;
  for (let k = 1; k <= 3; k++) {
    const j = t - k;
    if (j < 0) { total += o.cfBroughtForward / 3; continue; }
    const contributed = ((o.age0 + j) < o.retireAge && a) ? contribAtYear(a, j) : 0;
    // a year spent above the taper threshold only ever banked its tapered allowance, so a consistently
    // high earner must not carry forward the headline figure
    total += Math.max(0, P.aaAt(relevantEarningsAtYear(ctx, o, j)) - contributed);
  }
  return total;
}

// Remaining annual ISA/pension headroom for `ownerKey` in year index t, net of that owner's own regular
// (escalating) contribution to the same wrapper. Other Investments / Cash Savings have no HMRC cap.
/*
 * Where a one-off deposit should go, decided the way the plan's own decumulation policy would.
 *
 * Order of preference is the order the money is worth the most, not the order the wrappers are listed:
 * a pension first, because tax relief on the way in is the largest single uplift available and nothing
 * else competes with it; then an ISA, tax-free thereafter with no exit charge; then a GIA, taxable but
 * uncapped; and cash last, because holding a lump there is a decision to earn the least.
 *
 * Each step is taken only up to the headroom actually available in that year, so the answer respects the
 * annual allowance, the MPAA, tapering, relevant earnings and whatever regular contributions are already
 * committed. If nothing has room the answer is the GIA, which always does.
 *
 * Returns the wrapper that takes the LARGEST share, which is the one worth naming as the destination; the
 * staging machinery already handles a deposit too big for the wrapper it names.
 */
function suggestOneOffDestination(ctx, ownerKey, t, amount) {
  const want = Math.max(0, num(amount, 0));
  if (!want) return 'pen';
  let best = { cat: 'other', take: 0 };
  let left = want;
  for (const cat of ['pen', 'isa', 'other', 'cash']) {
    const room = wrapperHeadroomAtYear(ctx, ownerKey, cat, t);
    const take = Math.min(left, Number.isFinite(room) ? room : left);
    if (take > best.take) best = { cat, take };
    left -= take;
    if (left <= 0) break;
  }
  return best.cat;
}

/*
 * THE WINDFALL SPLIT (research, off unless a table's move asks for it; STATE.md D37, research/solver/WINDFALL-SPLIT.md).
 * For each year with Auto deposits, where splits 1 to 3 put that year's Auto money, by owner: 1 the pension up to its room,
 * relieved (pensionRelief: its room gross, the windfall paying the net, any refund to cash), then the ISA up to its allowance,
 * the rest taxable; 2 the ISA up to its allowance, the rest taxable; 3 all taxable. The
 * room is what the claim ledger left this year once every other deposit, transfer and contribution claimed, the Auto
 * deposits' own claims for the year given back. A wrapper the household does not hold takes nothing. Split 0 is the plan's
 * own routing (the marked entries in oneOffContribs), so nothing here changes a year whose move carries no split.
 */
function autoSplitRoutes(out, autoAmt, { baseYear, acc, claimed, autoClaimed, room, relief }) {
  autoAmt.forEach((A, key) => {
    const [ys, ownerKey] = key.split('|');
    const y = Number(ys), t = y - baseYear;
    const left = cat => {
      if (!acc[accountId(cat, ownerKey)]) return 0;
      const k = `${ownerKey}|${cat}|${t}`;
      return Math.max(0, room(ownerKey, cat, t) - ((claimed.get(k) || 0) - (autoClaimed.get(k) || 0)));
    };
    const penRoom = left('pen'), isaRoom = left('isa');
    // split 1's pension is relieved (the review of 9 Nov, item 4): its room taken gross, for the net it costs the windfall,
    // a higher-rate payer's refund to their cash
    const penGross = Math.min(penRoom, A / (1 - relief.rate)), rel = penGross > 0 ? relief.of(ownerKey, t, penGross) : { net: 0, refund: 0 };
    const pen1 = Math.min(A, rel.net), isa1 = Math.min(A - pen1, isaRoom), isa2 = Math.min(A, isaRoom);
    // the rest goes to the taxable account, or to cash where the household holds no taxable account
    const restId = acc[accountId('other', ownerKey)] ? accountId('other', ownerKey) : accountId('cash', ownerKey);
    const ent = pairs => pairs.filter(([, a]) => a > 0).map(([id, a]) => ({ id, amount: a }));
    if (!out.has(y)) out.set(y, { variants: [null, [], [], []], room: [] });
    const e = out.get(y);
    e.variants[1].push(...ent([[accountId('pen', ownerKey), penGross], [accountId('isa', ownerKey), isa1], [restId, A - pen1 - isa1], [accountId('cash', ownerKey), rel.refund]]));
    e.variants[2].push(...ent([[accountId('isa', ownerKey), isa2], [restId, A - isa2]]));
    e.variants[3].push(...ent([[restId, A]]));
    e.room.push({ owner: ownerKey, amount: A, pen: penRoom, isa: isaRoom });
  });
}

/*
 * THE SAVINGS SPLIT (research, off by default; STATE.md D38 (4), research/solver/SAVINGS-SPLIT.md): where a working year's
 * pension and ISA saving goes, at the plan's net cost, when a solved table's move asks (`save`). Save 1 puts the net budget
 * in the pension first, grossed up to its room, then the ISA up to its room; save 2 the ISA first, then the pension; what fits
 * neither goes to the taxable account at its net amount (allocateBudget's cascade). The budget is the plan's pension
 * contribution at its net cost plus its ISA contribution; the taxable and cash contributions stay as the plan has them. The
 * pension's room is the year's annual allowance (tapered, or the MPAA) capped at relevant earnings, without carry-forward
 * (an earlier year's choice may have used what it counts), less what the plan's dated deposits and staged transfers claim
 * that year; the ISA's room is the allowance less those claims and the plan's cash ISA subscription; neither falls below the
 * plan's own contribution. Returns t -> null (nothing to choose that year) or { variants: [null, v1, v2] (account id -> the
 * full-year contribution, every account of each working owner), owners: [{ owner, budget, pen, isa }] }, memoised and
 * computed only when asked, so the app's own runs never pay for it.
 */
function saveSplitRoutes({ P, owners, acc, otherIncomes, claimed, baseYear, totalYears }) {
  const memo = new Map(), hctx = { P, owners, acc, otherIncomes };
  const at = t => {
    if (!(t >= 0 && t <= totalYears)) return null;
    const v1 = {}, v2 = {}, rooms = [];
    let any = false, d1 = false, d2 = false;
    for (const o of owners) {
      if ((o.age0 + t) >= o.retireAge) continue;
      const ids = o.ids, pa = acc[ids.pen], ia = acc[ids.isa], ga = acc[ids.other], ca = acc[ids.cash];
      const P0 = pa ? contribAtYear(pa, t) : 0, I0 = ia ? contribAtYear(ia, t) : 0, G0 = ga ? contribAtYear(ga, t) : 0, C0 = ca ? contribAtYear(ca, t) : 0;
      const plan = { [ids.pen]: P0, [ids.isa]: I0, [ids.other]: G0, [ids.cash]: C0 };
      const put = (v, amts) => { for (const id of Object.keys(amts)) if (acc[id]) v[id] = amts[id]; };
      // priced by how they pay in (D154 (3)): income tax relief alone for the self-employed and a net-pay employee
      const salary = salaryAtYear(o, t), se = !!o.reliefTaxOnly;
      // D138: from April 2029 an employee's sacrifice is relieved of NIC on its first £2,000 a year alone (SAVE_NIC_CAP)
      const nicCap = !se && SAVE_NIC_CAP.on && baseYear + t >= SAVE_NIC_CAP.from ? SAVE_NIC_CAP.amount : Infinity;
      const netOf = g => (g > 0 ? netCostOfPensionContrib(g, salary, P, se, nicCap) : 0);
      const budget = netOf(P0) + I0;
      // nothing to move, or no taxable account to take what fits neither wrapper: the plan's own contributions
      if (!(budget > 0) || !ga) { put(v1, plan); put(v2, plan); continue; }
      const earnings = relevantEarningsAtYear(hctx, o, t);
      const allowance = mpaaAppliesAtYear(P, o, t) ? P.mpaaLimit : P.aaAt(earnings);
      const cap = (o.salary <= 0 && earnings <= 0) ? allowance : Math.min(allowance, Math.max(P.pensionNoEarningsLimit, earnings));
      const claim = cat => claimed.get(`${o.key}|${cat}|${t}`) || 0;
      const cashIsa = o.cashIsaContrib > 0 ? Math.min(o.cashIsaContrib, P.cashIsaCapAt(o.age0 + t, baseYear + t)) : 0;
      const penRoom = pa ? Math.max(P0, cap - claim('pen')) : 0;
      const isaRoom = ia ? Math.max(I0, P.isaAllowance - claim('isa') - cashIsa) : 0;
      const grossOf = n => (n > 0 && penRoom > 0 ? grossUpNet(n, salary, P, penRoom, se, nicCap) : 0);
      // what the gross-up leaves: under half a penny is the bisection's residue, not money
      const rest = x => (x > 0.005 ? x : 0);
      const pen1 = grossOf(budget), left1 = rest(budget - netOf(pen1)), isa1 = Math.min(left1, isaRoom);
      const isa2 = Math.min(budget, isaRoom), pen2 = grossOf(budget - isa2), left2 = rest(budget - isa2 - netOf(pen2));
      // within a penny of the plan's contributions is the plan's (the gross-up's bisection leaves a residue)
      const snap = amts => (Object.keys(plan).every(id => Math.abs(amts[id] - plan[id]) < 0.01) ? plan : amts);
      const s1 = snap({ [ids.pen]: pen1, [ids.isa]: isa1, [ids.other]: G0 + left1 - isa1, [ids.cash]: C0 });
      const s2 = snap({ [ids.pen]: pen2, [ids.isa]: isa2, [ids.other]: G0 + left2, [ids.cash]: C0 });
      put(v1, s1); put(v2, s2);
      if (s1 !== plan || s2 !== plan) any = true;
      // which routes differ from the plan this year (D138): the solver offers a year's copies only where a route it offers
      // does (src/solver/solve.js saveOn, src/solver/fast.js the live years); a pension-only saver's pension first, or one
      // whose pension saving fills its room, is the plan's own
      if (s1 !== plan) d1 = true;
      if (s2 !== plan) d2 = true;
      rooms.push({ owner: o.key, budget, pen: penRoom, isa: isaRoom });
    }
    return any ? { variants: [null, v1, v2], owners: rooms, differs: [false, d1, d2] } : null;
  };
  return t => { if (!memo.has(t)) memo.set(t, at(t)); return memo.get(t); };
}

// relief on a person's own pension contributions stops at their 75th birthday (the review of 9 Nov, item 4; D69)
const PENSION_RELIEF_TO_AGE = 75;
function wrapperHeadroomAtYear(ctx, ownerKey, category, t) {
  const { P, acc, owners } = ctx;
  if (category === 'other' || category === 'cash') return Infinity;
  const o = owners.find(x => x.key === ownerKey);
  if (!o) return 0;
  // relief on a person's own pension contributions stops at 75 (the review of 9 Nov, item 4; D69): from then a one-off deposit
  // has no room in the pension, so an Auto deposit's route walks on to the ISA
  if (category === 'pen' && o.age0 + t >= PENSION_RELIEF_TO_AGE) return 0;
  const a = acc[o.ids[category]];
  // regular contributions stop at retirement (mirrors stepYear), so they only consume headroom while working
  const retired = (o.age0 + t) >= o.retireAge;
  const regContrib = (a && !retired) ? contribAtYear(a, t) : 0;
  if (category === 'isa') return Math.max(0, P.isaAllowance - regContrib);
  const earnings = relevantEarningsAtYear(ctx, o, t);
  // carry forward is unavailable against the MPAA, and never lifts the relevant-earnings limit
  const mpaa = mpaaAppliesAtYear(P, o, t);
  // high earners have a tapered annual allowance; carry forward still stacks on the tapered figure
  const allowance = mpaa ? P.mpaaLimit : P.aaAt(earnings) + carryForwardAtYear(ctx, o, t);
  // a blank salary while still working means "earnings unknown" — leave the allowance unconstrained
  const cap = (!retired && o.salary <= 0 && earnings <= 0)
    ? allowance
    : Math.min(allowance, Math.max(P.pensionNoEarningsLimit, earnings));
  return Math.max(0, cap - regContrib);
}

/*
 * Allocate a net take-home budget between ISA (net) and pension (grossed up per owner, capped by the annual
 * allowance and by salary where known). Overflow beyond caps cascades ISA -> pension -> GIA so that the
 * same net budget is always invested. `isaShare` is the target ISA fraction of the net budget.
 */
function allocateBudget(ctx, netBudget, isaShare, { isaMin = 0, balance = 'proportional', penFloorGross = null } = {}) {
  const { P, owners, acc } = ctx;
  const budget = Math.max(0, netBudget);
  const n = owners.length;
  const isaCapTotal = P.isaAllowance * n;
  let isaNet = clamp(Math.max(budget * clamp(isaShare, 0, 1), Math.min(isaMin, budget)), 0, Math.min(budget, isaCapTotal));
  let penNet = budget - isaNet;

  // owner split
  const curPen = owners.map(o => acc[o.ids.pen] ? acc[o.ids.pen].contrib : 0);
  const curIsa = owners.map(o => acc[o.ids.isa] ? acc[o.ids.isa].contrib : 0);
  const sumPen = curPen.reduce((a, b) => a + b, 0), sumIsa = curIsa.reduce((a, b) => a + b, 0);
  let penW = owners.map((_, i) => (sumPen > 0 ? curPen[i] / sumPen : (i === 0 ? 1 : 0)));
  let isaW = owners.map((_, i) => (sumIsa > 0 ? curIsa[i] / sumIsa : (i === 0 ? 1 : 0)));
  if (balance === 'balanced' && n > 1) {
    // steer new money to the owner with the smaller projected pension so both allowances are usable in retirement
    const fv = owners.map(o => { const a = acc[o.ids.pen]; const yrs = Math.max(0, o.retireAge - o.age0); return a ? a.balance * Math.pow(1 + a.real, yrs) : 0; });
    const tot = fv.reduce((a, b) => a + b, 0);
    penW = tot > 0 ? fv.map(v => (tot - v) / (tot * (n - 1))) : owners.map(() => 1 / n);
    isaW = owners.map(() => 1 / n);
  }
  // pension gross per owner with caps; overflow cascades to the other owner
  const penGross = owners.map(() => 0);
  const penNetUsed = owners.map(() => 0);
  // the self-employed have no employer, so no pass-through can inflate the earnings cap for them
  const capOf = (o) => Math.min(
    mpaaAppliesAtYear(P, o, 0) ? P.mpaaLimit : P.aaAt(o.salary),
    o.salary > 0 ? o.salary * passThroughFactor(P, strategyRelief(o)) : P.pensionAllowance
  );
  let penNetRemaining = penNet;
  const order = owners.map((o, i) => i).sort((a, b) => penW[b] - penW[a]);
  // price every top-up at the owner's marginal rate given what is already going into that pension
  const allocate = (i, netAmt) => {
    if (netAmt <= 0) return 0;
    const o = owners[i];
    const cap = Math.max(0, capOf(o) - penGross[i]);
    if (cap <= 0) return 0;
    const credit = grossUpNetIncremental(netAmt, o.salary, P, penGross[i], cap, strategyRelief(o));
    if (credit <= 0) return 0;
    penGross[i] += credit;
    const total = netCostOfPensionContrib(penGross[i], o.salary, P, strategyRelief(o));
    const delta = total - penNetUsed[i];
    penNetUsed[i] = total;
    return delta;
  };
  owners.forEach((o, i) => { penNetRemaining -= allocate(i, penNet * penW[i]); });
  for (const i of order) { if (penNetRemaining > 0.5) penNetRemaining -= allocate(i, penNetRemaining); }
  // pension floor (used by bracket-smoothing): never exceed a specified gross per owner
  if (penFloorGross) {
    owners.forEach((o, i) => {
      if (penGross[i] > penFloorGross[i]) {
        const excessNet = penNetUsed[i] - netCostOfPensionContrib(penFloorGross[i], o.salary, P, strategyRelief(o));
        penGross[i] = penFloorGross[i]; penNetUsed[i] -= excessNet; penNetRemaining += excessNet;
      }
    });
  }
  // leftover net -> ISA (to cap) -> GIA
  let isaLeft = isaNet + Math.max(0, penNetRemaining);
  const isaNetByOwner = owners.map(() => 0);
  owners.forEach((o, i) => { const want = Math.min(isaLeft, isaNet * isaW[i], P.isaAllowance); isaNetByOwner[i] += want; isaLeft -= want; });
  for (const i of order) { if (isaLeft > 0.5) { const room = Math.max(0, P.isaAllowance - isaNetByOwner[i]); const take = Math.min(room, isaLeft); isaNetByOwner[i] += take; isaLeft -= take; } }
  const giaNet = Math.max(0, isaLeft);
  const totalPenGross = penGross.reduce((a, b) => a + b, 0);
  const totalPenNet = penNetUsed.reduce((a, b) => a + b, 0);
  return {
    isaContrib: isaNetByOwner.reduce((a, b) => a + b, 0), isaByOwner: isaNetByOwner,
    penContrib: totalPenGross, penByOwner: penGross, penNet: totalPenNet,
    giaContrib: giaNet, taxReliefSaved: Math.max(0, totalPenGross - totalPenNet)
  };
}

// Escalation (contrib growth %) entered by the user is preserved so every player is treated alike.
function applyAllocationToPlan(plan, ctx, alloc, { contribByYear = null, transfer = null } = {}) {
  const cloned = normalizePlan(JSON.parse(JSON.stringify(plan)));
  ctx.owners.forEach((o, i) => {
    cloned.accounts.forEach(a => {
      if (a.id === o.ids.pen) { a.contrib = Math.round(alloc.penByOwner[i]); delete a.contribByYear; }
      if (a.id === o.ids.isa) { a.contrib = Math.round(alloc.isaByOwner[i]); delete a.contribByYear; }
      /*
       * The GIA and cash standing orders are part of the budget now, so a strategy that has spent them
       * on a pension or an ISA must stop paying them too - otherwise the same money is invested twice
       * and every entrant but Current Plan quietly costs more take-home than the plan it is compared to.
       * What the allocation could not fit into a wrapper comes back to the GIA as overflow.
       */
      if (a.id === o.ids.other) { a.contrib = Math.round(alloc.giaContrib / ctx.owners.length); delete a.contribByYear; }
      if (a.id === o.ids.cash) { a.contrib = 0; delete a.contribByYear; }
    });
  });
  if (contribByYear) Object.entries(contribByYear).forEach(([id, arr]) => { const a = cloned.accounts.find(x => x.id === id); if (a) { a.contribByYear = arr.map(v => Math.round(v)); a.contrib = Math.round(arr[0] || 0); } });
  if (transfer && transfer.net > 0) {
    cloned.accounts.forEach(a => {
      if (a.id === transfer.fromId) a.balance = Math.max(0, num(a.balance, 0) - transfer.net);
      if (a.id === transfer.toId) a.balance = num(a.balance, 0) + transfer.gross;
      if (transfer.refund > 0 && a.id === transfer.refundId) a.balance = num(a.balance, 0) + transfer.refund;
    });
  }
  return cloned;
}

/*
 * Total net take-home cost of the regular contribution schedule across each owner's accumulation years.
 * Pension contributions are held gross, so they are priced at their net cost; ISA, GIA and cash are
 * already net. `rateOverride` re-prices the same year-0 amounts under a different escalation.
 */
function accumulationOutlay(rawPlan, rateOverride = null) {
  const ctx = rawPlan && rawPlan.P ? rawPlan : buildContext(rawPlan);
  const cfg = ctx.plan.config;
  let net = 0;
  ctx.owners.forEach(o => {
    const yrs = Math.max(0, o.retireAge - o.age0);
    CATEGORIES.forEach(cat => {
      const a = ctx.acc[o.ids[cat]];
      if (!a) return;
      for (let t = 0; t < yrs; t++) {
        let c;
        if (rateOverride === null) c = contribAtYear(a, t);
        else {
          const raw = a.contribByYear ? a.contribByYear[t] : a.contrib;
          // a pre-built schedule already carries the account's own escalation; strip it before re-applying
          const stripped = (a.contribByYear && a.growth > -0.999) ? raw / Math.pow(1 + a.growth, t) : raw;
          c = stripped * Math.pow(1 + rateOverride, t);
        }
        if (!(c > 0)) continue;
        net += cat === 'pen' ? netCostOfPensionContrib(c, salaryAtYear(o, t), cfg, strategyRelief(o)) : c;
      }
    });
  });
  return net;
}

/*
 * Every strategy inherits the user's per-wrapper escalation, so shifting money into a faster-escalating
 * wrapper quietly raises total lifetime contributions — the tournament would then reward paying in more
 * rather than allocating better (measured at up to +44% of outlay). This solves for the single escalation
 * that holds a strategy's total net outlay equal to the current plan's, so "same take-home cost" is true
 * across the whole accumulation period and not just in year one.
 */
function solveEscalation(planState, targetOutlay, { tol = 1, maxIter = 60 } = {}) {
  // the bisection below prices the same plan ~120 times, so build its context once and reuse it:
  // rebuilding per evaluation cost ~90ms per tournament, paid on every keystroke through the preview memo
  const ctx = planState && planState.P ? planState : buildContext(planState);
  const before = accumulationOutlay(ctx);
  if (!(targetOutlay > 0) || !(before > 0)) return { rate: null, before, after: before };
  const at = (r) => accumulationOutlay(ctx, r);
  let lo = -0.9, hi = 1.0;
  // outlay rises monotonically with the escalation rate, so bisection is sound
  if (at(lo) > targetOutlay || at(hi) < targetOutlay) return { rate: null, before, after: before };
  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2;
    const outlay = at(mid);
    if (outlay < targetOutlay) lo = mid; else hi = mid;
    if (Math.abs(outlay - targetOutlay) <= tol) { lo = hi = mid; break; }
  }
  // round to the precision the plan actually stores (0.01pp) and re-price there, so the figure reported
  // to the user is the one the projection runs on — at 0.1pp the rounding alone drifts ~0.5% of outlay
  const rate = Math.round(((lo + hi) / 2) * 10000) / 10000;
  return { rate, before, after: at(rate) };
}

// Rewrite a plan's contribution escalation to a single rate, rescaling any pre-built yearly schedule.
function applyEscalationToPlan(plan, rate) {
  const out = normalizePlan(JSON.parse(JSON.stringify(plan)));
  out.accounts.forEach(a => {
    const old = clamp(num(a.growth, 0), -100, 100) / 100;
    if (Array.isArray(a.contribByYear)) {
      a.contribByYear = a.contribByYear.map((v, t) => {
        const stripped = old > -0.999 ? v / Math.pow(1 + old, t) : v;
        return Math.round(stripped * Math.pow(1 + rate, t));
      });
      a.contrib = a.contribByYear[0] || 0;
    }
    a.growth = Math.round(rate * 10000) / 100;
  });
  return out;
}

/*
 * Reports what a tournament strategy actually changes versus the baseline plan, by diffing the two
 * plan states account by account. Figures keep their native units — pension contributions are gross,
 * ISA and GIA contributions net — so a shift of take-home from ISA to pension shows a larger rise
 * than fall, the difference being tax and NIC relief.
 */
function diffStrategyPlans(basePlan, strategyPlan, { threshold = 50 } = {}) {
  const byId = (p) => { const m = {}; (p?.accounts || []).forEach(a => { m[a.id] = a; }); return m; };
  const base = byId(basePlan), next = byId(strategyPlan);
  const contribDeltas = [], balanceDeltas = [], byCat = {};
  Object.keys(next).forEach(id => {
    const b = base[id], n = next[id];
    if (!b || !n) return;
    const [cat, ownerKey] = id.split('_');
    const from = num(b.contrib, 0), to = num(n.contrib, 0);
    const balFrom = num(b.balance, 0), balTo = num(n.balance, 0);
    const cd = to - from, bd = balTo - balFrom;
    byCat[cat] = byCat[cat] || { contrib: 0, balance: 0, owners: [] };
    if (Math.abs(cd) >= threshold) {
      contribDeltas.push({ id, cat, ownerKey, from, to, delta: cd });
      byCat[cat].contrib += cd;
      byCat[cat].owners.push(ownerKey);
    }
    if (Math.abs(bd) >= threshold) {
      balanceDeltas.push({ id, cat, ownerKey, from: balFrom, to: balTo, delta: bd });
      byCat[cat].balance += bd;
    }
  });
  return { contribDeltas, balanceDeltas, byCat, hasChange: contribDeltas.length > 0 || balanceDeltas.length > 0 };
}

/*
 * Run a searching player's candidates on one set of market paths and return the winner as an ordinary
 * strategy. Every candidate carries its own `label` and `describe`, so this knows nothing about what is
 * being searched: the Survival Maximizer varies the ISA share of the budget, Bridge-Sized Relief varies
 * how much cover the bridge is given. Sharing one resolver is what keeps the two rankings comparable.
 */
function resolveSearchPlayer(strategy, { trials = 400, seed = 12345, preAccessCap = Infinity, priorities = null, tolerances = null, onCandidate = null } = {}) {
  const evaluated = strategy.candidates.map((c, i) => {
    const stats = monteCarlo(c.planState, { trials, seed });
    if (onCandidate) onCandidate(i, strategy.candidates.length, c.label, stats);
    return { ...c, stats };
  });
  const best = pickBest(evaluated, { preAccessCap, priorities, tolerances });
  return {
    ...strategy,
    chosenShare: best.share, chosenCover: best.cover ?? null, chosenLabel: best.label,
    searchAxis: strategy.searchAxis || 'Candidate',
    searchResults: evaluated.map(e => ({ label: e.label, successRate: e.stats.successRate, preAccess: e.stats.preNmpaFailRate, p10: e.stats.p10Terminal, median: e.stats.medianTerminal })),
    isaContrib: best.alloc.isaContrib, penContrib: best.alloc.penContrib, giaContrib: best.alloc.giaContrib,
    taxReliefSaved: best.alloc.taxReliefSaved + (best.reliefExtra || 0),
    transferNet: Math.round(best.transferNet || 0), transferGross: Math.round(best.transferGross || 0),
    planState: best.planState, phase: best.phase || null,
    description: best.describe || strategy.description
  };
}

/*
 * Strategy tournament — builds the six players. Every player invests the same net take-home budget.
 *   1 Current Plan            : as entered
 *   2 Survival Maximizer      : grid search over the ISA share (evaluated by the caller with common random numbers)
 *   3 Bridge-Sized Relief     : pension-first, bridge carved out at a growth-aware size, cover level searched
 *   4 Relief-First            : pension first (subject to the pre-access bridge minimum), + Bed & SIPP in full scope
 *   5 Bracket-Smoothed Sizing : pension sized so retirement withdrawals + state pension stay inside the basic band
 *   6 Relief-First, Bridge-Last: pension-max early, switch to ISA-max for the final years to build the bridge
 *
 * There used to be a sixth, Liquidity-First, which put the whole budget into ISAs. It was removed because
 * it was a duplicate rather than a strategy: its plan is byte-identical to the Survival Maximizer's
 * 100%-ISA grid point, so the search already covers that allocation and reports it in the split table.
 * Across a 106-scenario sweep it also finished last in 88 of them and never won.
 *
 * `entrants` adds saved scenarios as extra players. Those are NOT held to the baseline outlay: a saved
 * scenario differs in more than allocation, so normalising it would rewrite the thing being compared.
 * Each carries its own accumulation outlay instead, for the UI to show alongside the baseline's.
 */
/*
 * THE ACCUMULATION VOCABULARY, SHARED.
 *
 * The tournament used to build its candidates inside closures - the budget sweep, the bridge sizing, the
 * Bed & SIPP move, the back-loaded schedule - which meant nothing else could build one. A search that
 * wants to try "1.35x cover, back-loaded, with the SIPP move" had to be the tournament. These three take
 * that vocabulary out so the tournament and any other search speak it: accumulationEnv works out what the
 * household has to play with, accumulationCandidate turns a few choices into a plan, and bedAndSippFor is
 * the one-off capital move both of them may add. The tournament's own candidates are built through them,
 * and a test pins that they are byte-identical to what the closures produced.
 */
function bedAndSippFor(ctx, alloc, spare, scope) {
  const { P, owners, acc } = ctx;
  if (scope !== 'full' || !(spare > 0)) return null;
  const o = owners[0];
  // no relief on a person's own contributions from 75 (D69), so no Bed and SIPP: before, it moved the ISA in, relieved
  if (o.age0 >= PENSION_RELIEF_TO_AGE) return null;
  const isaSelfBal = acc[o.ids.isa] ? acc[o.ids.isa].balance : 0;
  // relief is due on contributions up to the person's relevant UK earnings, or the no-earnings limit where they have less
  // (wrapperHeadroomAtYear's rule; a blank salary while still working leaves it unconstrained); a non-earner gets the
  // basic rate at source and nothing to reclaim (it gave £60,000 relieved at the higher rate, the review of 27 Oct)
  const earnings = relevantEarningsAtYear(ctx, o, 0), retired = o.age0 >= o.retireAge;
  const cap = (!retired && o.salary <= 0 && earnings <= 0) ? P.aaAt(earnings) : Math.min(P.aaAt(earnings), Math.max(P.pensionNoEarningsLimit, earnings));
  const aaRoom = Math.max(0, cap - alloc.penByOwner[0]);
  const gross = Math.min(aaRoom, spare / (1 - P.reliefAtSource), isaSelfBal / (1 - P.reliefAtSource));
  if (!(gross > 250)) return null;
  const { net, refund } = pensionRelief(P, earnings, gross, o.age0);
  return { transfer: { net, gross, refund, fromId: o.ids.isa, toId: o.ids.pen, refundId: o.ids.cash }, reliefExtra: gross - net + refund };
}

/*
 * RELIEF ON A PERSONAL PENSION CONTRIBUTION (the review of 9 Nov, item 4): money a person pays into a pension from their own
 * funds is relieved at source at the basic rate (£80 buys £100); a payer above the basic band gets the rest of their relief
 * back (`refund`, paid to their cash), worked on the contribution's gross against the year's relevant earnings. A non-earner
 * gets the basic rate at source and nothing to reclaim. Shared by bedAndSippFor and every route the plan itself makes into a
 * pension (an Auto deposit, the windfall split's pension-first variant, a staged transfer); the room the gross may take is the
 * caller's (wrapperHeadroomAtYear). A deposit typed into a pension stays at face value (M3: the maintainer's wording question).
 */
function pensionRelief(P, earnings, gross, age = 0) {
  if (age >= PENSION_RELIEF_TO_AGE) return { net: gross, refund: 0 };   // none from 75 (wrapperHeadroomAtYear gives no room either)
  const net = gross * (1 - P.reliefAtSource);
  const reliefTotal = earnings > 0 ? incomeTax(earnings, P) - incomeTax(Math.max(0, earnings - gross), P) : gross * P.reliefAtSource;
  return { net, refund: Math.max(0, reliefTotal - gross * P.reliefAtSource) };
}

function accumulationEnv(ctx, { emergencyFloor = 25000, scope = 'contributions', netBudgetOverride = null, balance = 'proportional' } = {}) {
  const plan = ctx.plan;
  const { owners, acc } = ctx;
  const cfg = plan.config;
  const margin = 1 + clamp(num(cfg.bridgeSafetyMargin, 30), 0, 500) / 100;
  /*
   * WHAT THE HOUSEHOLD PUTS ASIDE EACH YEAR - ALL OF IT, WHEREVER IT LANDS.
   *
   * The budget used to count pension and ISA contributions only, which made the tournament read as
   * broken to anyone whose saving goes anywhere else: money into a GIA or into cash savings each year is
   * money being put aside, and "take-home budget: £0" beside a plan that pays in £18,000 is simply
   * wrong. Worse, those are exactly the households this exists to help - moving a standing order from a
   * GIA into an ISA is the cheapest wrapper decision there is, and it could not even be tested.
   *
   * So all four wrappers are swept. The strategies then zero the GIA and cash contributions they have
   * taken into the budget (`applyAllocationToPlan`), so nothing is spent twice and every entrant still
   * costs the same take-home. `Current Plan` keeps its own mix untouched, which is what makes the
   * comparison mean anything.
   *
   * A phased schedule counts at its first year, like every other year-0 figure here.
   */
  const contribNow = (a) => (a ? contribAtYear(a, 0) : 0);
  const currentPen = owners.map(o => contribNow(acc[o.ids.pen]));
  const currentIsa = owners.map(o => contribNow(acc[o.ids.isa]));
  const currentGia = owners.map(o => contribNow(acc[o.ids.other]));
  const currentCash = owners.map(o => contribNow(acc[o.ids.cash]));
  const currentPenNet = owners.reduce((s, o, i) => s + netCostOfPensionContrib(currentPen[i], o.salary, cfg, strategyRelief(o)), 0);
  const currentIsaNet = currentIsa.reduce((a, b) => a + b, 0);
  const sweptGia = currentGia.reduce((a, b) => a + b, 0);
  const sweptCash = currentCash.reduce((a, b) => a + b, 0);
  const derivedBudget = currentIsaNet + currentPenNet + sweptGia + sweptCash;
  const netBudget = netBudgetOverride !== null && netBudgetOverride !== '' ? Math.max(0, num(netBudgetOverride, 0)) : derivedBudget;

  const liquidToday = owners.reduce((s, o) => s + ['isa', 'other', 'cash'].reduce((t, cat) => t + (acc[o.ids[cat]] ? acc[o.ids[cat]].balance : 0), 0), 0);
  const bridge = bridgeRequirement(ctx);
  const yearsToFirstRetire = Math.max(1, Math.min(...owners.map(o => o.retireAge - o.age0)));
  const bridgeCapital = bridge.gapYears > 0 ? bridge.netNeeded * margin : 0;
  const bridgeShortfall = Math.max(0, bridgeCapital - Math.max(0, liquidToday - emergencyFloor));
  const annualIsaNeeded = bridge.gapYears > 0 ? bridgeShortfall / yearsToFirstRetire : 0;
  const lateYears = Math.max(1, Math.ceil(yearsToFirstRetire / 2));
  const canBackLoad = bridge.gapYears > 0 && lateYears < yearsToFirstRetire;

  const salaryKnown = owners.some(o => o.salary > 0);
  const meta = { netBudget, derivedBudget, bridge, bridgeCapital, bridgeShortfall, annualIsaNeeded, liquidToday, salaryKnown, yearsToFirstRetire,
    sweptGia, sweptCash, penIsaNet: currentIsaNet + currentPenNet };
  return { plan, cfg, margin, emergencyFloor, scope, balance, currentPen, currentIsa, currentGia, currentCash, currentPenNet, currentIsaNet,
    sweptGia, sweptCash, derivedBudget, netBudget, liquidToday, bridge, yearsToFirstRetire, bridgeCapital, bridgeShortfall, annualIsaNeeded,
    lateYears, canBackLoad, salaryKnown, meta };
}

/*
 * One accumulation plan from a few choices. `cover` is the bridge multiple (0 = nothing set aside; null
 * = no bridge sizing at all, split the budget by `isaShare` instead, which is the Survival Maximizer's
 * shape); `backLoad` pays the bridge in over the final years rather than level; `sipp` allows the one-off
 * capital move, which still needs the tournament to have been asked for `scope: 'full'`.
 */
function accumulationCandidate(ctx, env, { cover = 0, isaShare = 0, backLoad = false, sipp = true } = {}) {
  const { plan, netBudget, emergencyFloor, margin, balance, liquidToday, yearsToFirstRetire, lateYears } = env;
  const { owners, acc } = ctx;
  const scope = sipp ? env.scope : 'contributions';
  /*
   * Capital that can be moved into the pension today without stranding the bridge. Relief-First only
   * attempts this when there is no gap at all; knowing the size of the bridge means this player can
   * reserve exactly what the gap needs and still move the rest. `target` is the requirement measured at
   * the retirement date, so it is discounted back before being held out of today's balances.
   */
  const spareForSipp = (sized) => {
    const g = sized.bridge.rate;
    const reserved = sized.target > 0 ? sized.target / Math.pow(1 + g, sized.yearsToRetire || yearsToFirstRetire) : 0;
    return Math.max(0, liquidToday - emergencyFloor - reserved);
  };
  const x = (m) => m.toFixed(2).replace(/0$/, '');
  if (cover === null) {
    const sized = bridgeIsaAnnual(ctx, { emergencyFloor, margin: 0 });
    const alloc = allocateBudget(ctx, netBudget, isaShare, { balance });
    const bs = bedAndSippFor(ctx, alloc, spareForSipp(sized), scope);
    return {
      share: isaShare, cover: null, label: `${Math.round(isaShare * 100)}% ISA`, alloc, sized,
      transferNet: bs ? bs.transfer.net : 0, transferGross: bs ? bs.transfer.gross : 0, reliefExtra: bs ? bs.reliefExtra : 0,
      describe: `${Math.round(isaShare * 100)}% of the budget to the ISA and the rest to the pension.` + (bs ? ' Spare ISA capital is moved into the pension as well.' : ''),
      planState: applyAllocationToPlan(plan, ctx, alloc, bs ? { transfer: bs.transfer } : {})
    };
  }
  const m = cover;
  if (!backLoad) {
    const sized = bridgeIsaAnnual(ctx, { emergencyFloor, margin: m * margin });
    const alloc = allocateBudget(ctx, netBudget, 0, { isaMin: sized.annual, balance });
    const bs = bedAndSippFor(ctx, alloc, spareForSipp(sized), scope);
    return {
      share: null, cover: m, label: m === 0 ? 'No bridge' : `${x(m)}x level`, alloc, sized,
      transferNet: bs ? bs.transfer.net : 0, transferGross: bs ? bs.transfer.gross : 0, reliefExtra: bs ? bs.reliefExtra : 0,
      describe: (m === 0
        ? 'Everything to the pension, with nothing set aside for the bridge: on these paths that survived better than funding one.'
        : `Everything to the pension except the bridge, sized at ${x(m)}x the growth-adjusted target (${formatGBP(sized.annual)}/yr to the ISA) and paid in level over ${sized.years} years.`)
        + (bs ? ` Spare ISA capital above the bridge reserve is moved into the pension as well.` : ''),
      planState: applyAllocationToPlan(plan, ctx, alloc, bs ? { transfer: bs.transfer } : {})
    };
  }
  const sized = bridgeIsaAnnual(ctx, { emergencyFloor, margin: m * margin, overYears: lateYears });
  const early = allocateBudget(ctx, netBudget, 0, { balance });
  const late = allocateBudget(ctx, netBudget, 0, { isaMin: sized.annual, balance });
  const contribByYear = {};
  const horizon = ctx.totalYears + 1;
  const switchAt = yearsToFirstRetire - lateYears;
  owners.forEach((o, i) => {
    const penArr = [], isaArr = [];
    const gPen = acc[o.ids.pen] ? acc[o.ids.pen].growth : 0, gIsa = acc[o.ids.isa] ? acc[o.ids.isa].growth : 0;
    for (let t = 0; t < horizon; t++) {
      const src = t >= switchAt ? late : early;
      penArr.push(src.penByOwner[i] * Math.pow(1 + gPen, t));
      isaArr.push(src.isaByOwner[i] * Math.pow(1 + gIsa, t));
    }
    contribByYear[o.ids.pen] = penArr; contribByYear[o.ids.isa] = isaArr;
  });
  const bs = bedAndSippFor(ctx, late, spareForSipp(sized), scope);
  return {
    share: null, cover: m, label: `${x(m)}x last ${lateYears}y`, alloc: late, sized,
    phase: { switchYears: lateYears, yearsToFirstRetire, early, late },
    transferNet: bs ? bs.transfer.net : 0, transferGross: bs ? bs.transfer.gross : 0, reliefExtra: bs ? bs.reliefExtra : 0,
    describe: `Pension-max for ${switchAt} year${switchAt === 1 ? '' : 's'}, then ${formatGBP(sized.annual)}/yr to the ISA over the final ${lateYears} to build the bridge, sized at ${x(m)}x the growth-adjusted target.`
      + (bs ? ' Spare ISA capital above the bridge reserve is moved into the pension as well.' : ''),
    planState: applyAllocationToPlan(plan, ctx, late, bs ? { contribByYear, transfer: bs.transfer } : { contribByYear })
  };
}

function buildTournament(rawPlan, { emergencyFloor = 25000, scope = 'contributions', netBudgetOverride = null, balance = 'proportional', entrants = [] } = {}) {
  const ctx = buildContext(rawPlan);
  const plan = ctx.plan;
  const { P, owners, acc } = ctx;
  const cfg = plan.config;
  const env = accumulationEnv(ctx, { emergencyFloor, scope, netBudgetOverride, balance });
  const { margin, currentPen, currentIsa, currentGia, currentCash, currentPenNet, currentIsaNet, sweptGia, sweptCash, derivedBudget, netBudget,
    liquidToday, bridge, yearsToFirstRetire, bridgeCapital, bridgeShortfall, annualIsaNeeded, salaryKnown, meta } = env;


  /*
   * Bed & SIPP: a one-off personal contribution funded from ISA capital that is genuinely spare. Relief at
   * source adds the basic rate inside the pension; any higher or additional-rate relief comes back as cash
   * (this route saves no NIC). `spare` is the caller's judgement of what can be moved without leaving the
   * household short, which is the only part the two players disagree about.
   */
  const bedAndSipp = (alloc, spare) => bedAndSippFor(ctx, alloc, spare, scope);

  const mk = (id, name, description, alloc, extra = {}) => ({
    id, name, description,
    isaContrib: alloc.isaContrib, penContrib: alloc.penContrib, giaContrib: alloc.giaContrib, taxReliefSaved: alloc.taxReliefSaved,
    transferNet: 0, transferGross: 0,
    planState: applyAllocationToPlan(plan, ctx, alloc, extra.planOpts || {}),
    ...extra
  });

  const strategies = [];
  // 1 baseline
  strategies.push({
    id: 'baseline', name: 'Current Plan', description: 'Your existing contribution mix and wrapper balances, unchanged.',
    isaContrib: currentIsaNet, penContrib: currentPen.reduce((a, b) => a + b, 0), giaContrib: 0,
    taxReliefSaved: Math.max(0, currentPen.reduce((a, b) => a + b, 0) - currentPenNet), transferNet: 0, transferGross: 0,
    planState: normalizePlan(JSON.parse(JSON.stringify(plan)))
  });
  // 2 survival maximizer: candidate grid, chosen by the caller
  const grid = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(share => {
    const alloc = allocateBudget(ctx, netBudget, share, { balance });
    return {
      share, alloc, label: `${Math.round(share * 100)}% ISA`,
      describe: `Searched every ISA/pension split of the same budget; best survival at ${Math.round(share * 100)}% ISA / ${Math.round((1 - share) * 100)}% pension (net budget).`,
      planState: applyAllocationToPlan(plan, ctx, alloc)
    };
  });
  strategies.push({
    id: 'survival', name: 'Survival Maximizer', searchAxis: 'ISA share',
    description: 'Searches every ISA/pension split of the same budget (0%–100% in 10% steps) and keeps the split with the highest survival rate, tie-broken by the 10th-percentile pot.',
    candidates: grid, isaContrib: null, penContrib: null, taxReliefSaved: null, transferNet: 0, transferGross: 0, planState: null
  });
  /*
   * 3 bridge-sized relief. Relief-First's weakness is the one number it cannot get right: how much of the
   * budget the pre-access bridge really needs. It sizes that at 0% real growth and then spreads it over
   * every year to retirement, which on a twenty-year run asks for several times more ISA than the bridge
   * will ever use, and pays for it out of pension relief. Taken to the other extreme, funding no bridge at
   * all can cost seven points of survival.
   *
   * So this player does not pick a number. It works out the growth-aware requirement, then puts a handful
   * of cover levels around it through the simulation and keeps whichever actually survives best, on the
   * same paths as everyone else. The back-loaded candidates pay the bridge money in over the final years
   * only, so the pension compounds alone for longer first.
   */
  {
    // Multiples of the bridge target, which already carries the Config safety margin, so 1.0x is
    // "exactly what Config asks for" and the rest bracket it either side.
    const cover = [0, 0.75, 1.0, 1.35, 1.8, 2.4];
    const { lateYears, canBackLoad } = env;
    const candidates = [];
    const pushLevel = (m) => candidates.push(accumulationCandidate(ctx, env, { cover: m, backLoad: false }));
    const pushLate = (m) => candidates.push(accumulationCandidate(ctx, env, { cover: m, backLoad: true }));
    if (bridge.gapYears > 0) {
      cover.forEach(pushLevel);
      if (canBackLoad) [1.0, 1.35, 1.8].forEach(pushLate);
    } else {
      pushLevel(0);
      candidates[0].describe = 'No pre-SIPP access gap to bridge, so there is nothing to size and the whole budget goes to the pension.';
    }
    strategies.push({
      id: 'bridged', name: 'Bridge-Sized Relief', searchAxis: 'Bridge cover',
      description: 'Pension-first, with only the bridge carved out. The requirement is worked out with growth counted on both what you already hold and what you add, then a range of cover levels is run through the simulation and the best-surviving one kept.',
      candidates, isaContrib: null, penContrib: null, taxReliefSaved: null, transferNet: 0, transferGross: 0, planState: null
    });
  }
  // 4 relief-first (+ bed & SIPP)
  {
    const alloc = allocateBudget(ctx, netBudget, 0, { isaMin: annualIsaNeeded, balance });
    // This player only reaches for the transfer when there is no bridge to strand, so all spare liquid
    // capital is fair game. Bridge-Sized Relief reserves the bridge and moves whatever is left over.
    const bs = bridge.gapYears === 0 ? bedAndSipp(alloc, Math.max(0, liquidToday - emergencyFloor)) : null;
    const transfer = bs ? bs.transfer : null;
    const reliefExtra = bs ? bs.reliefExtra : 0;
    strategies.push(mk('relief', 'Relief-First' + (transfer ? ' + Bed & SIPP' : ''),
      `Routes the budget to pension first (subject to the pre-SIPP access bridge minimum) to capture maximum upfront ${owners.every(strategyRelief) ? 'tax relief' : 'tax and NIC relief'}` + (transfer ? '; also moves spare ISA capital into the pension.' : '.'),
      alloc, { transferNet: transfer ? Math.round(transfer.net) : 0, transferGross: transfer ? Math.round(transfer.gross) : 0, taxReliefSaved: alloc.taxReliefSaved + reliefExtra, planOpts: { transfer } }));
  }
  // 5 bracket-smoothed pension sizing
  {
    const penFloor = owners.map(o => {
      const a = acc[o.ids.pen]; if (!a) return 0;
      const accessAge = Math.max(o.retireAge, ctx.nmpa);
      const drawYears = Math.max(1, ctx.terminalAge - accessAge);
      const guaranteedTaxable = o.statePension + ctx.otherIncomes.filter(i => i.owner === o.key && !i.taxFree).reduce((s, i) => s + i.amount, 0);
      // (a pot-sizing rule of thumb on guaranteed income alone: the year's interest and dividends are not known here, so
      // pensionCeiling's subtraction is not taken; the draw itself takes it)
      const taxableRoom = Math.max(0, P.higherRateStartsAt - guaranteedTaxable);
      const grossWithdrawal = taxableRoom / Math.max(0.01, 1 - P.pclsProp);
      const targetPot = grossWithdrawal * annuityFactor(a.real, drawYears);
      const yrs = Math.max(0, o.retireAge - o.age0);
      const fvBalance = a.balance * Math.pow(1 + a.real, yrs);
      const need = Math.max(0, targetPot - fvBalance);
      const fvPerPound = fvContribStream(1, a.real, a.growth, yrs);
      return fvPerPound > 0 ? need / fvPerPound : 0;
    });
    const alloc = allocateBudget(ctx, netBudget, 0, { isaMin: annualIsaNeeded, balance, penFloorGross: penFloor });
    strategies.push(mk('bracket', 'Bracket-Smoothed Sizing',
      'Funds each pension only up to the pot whose sustainable withdrawal, alongside state pension, fills the basic-rate band; everything else goes to ISA so later-life withdrawals never hit 40%.',
      alloc, { penTargetGross: penFloor }));
  }
  // 6 relief-first, bridge-last (time-phased)
  {
    const reliefAlloc = allocateBudget(ctx, netBudget, 0, { balance });
    const isaAlloc = allocateBudget(ctx, netBudget, 1.0, { balance });
    const switchYears = bridge.gapYears > 0 && isaAlloc.isaContrib > 0 ? Math.min(yearsToFirstRetire, Math.ceil(bridgeShortfall / isaAlloc.isaContrib)) : 0;
    const contribByYear = {};
    const horizon = ctx.totalYears + 1;
    owners.forEach((o, i) => {
      const penArr = [], isaArr = [];
      const gPen = acc[o.ids.pen] ? acc[o.ids.pen].growth : 0, gIsa = acc[o.ids.isa] ? acc[o.ids.isa].growth : 0;
      for (let t = 0; t < horizon; t++) {
        const late = t >= yearsToFirstRetire - switchYears;
        penArr.push((late ? isaAlloc.penByOwner[i] : reliefAlloc.penByOwner[i]) * Math.pow(1 + gPen, t));
        isaArr.push((late ? isaAlloc.isaByOwner[i] : reliefAlloc.isaByOwner[i]) * Math.pow(1 + gIsa, t));
      }
      contribByYear[o.ids.pen] = penArr; contribByYear[o.ids.isa] = isaArr;
    });
    const blended = {
      isaContrib: switchYears > 0 ? (reliefAlloc.isaContrib * (yearsToFirstRetire - switchYears) + isaAlloc.isaContrib * switchYears) / yearsToFirstRetire : reliefAlloc.isaContrib,
      penContrib: switchYears > 0 ? (reliefAlloc.penContrib * (yearsToFirstRetire - switchYears) + isaAlloc.penContrib * switchYears) / yearsToFirstRetire : reliefAlloc.penContrib,
      giaContrib: Math.max(reliefAlloc.giaContrib, isaAlloc.giaContrib), taxReliefSaved: switchYears > 0 ? (reliefAlloc.taxReliefSaved * (yearsToFirstRetire - switchYears) + isaAlloc.taxReliefSaved * switchYears) / yearsToFirstRetire : reliefAlloc.taxReliefSaved,
      isaByOwner: reliefAlloc.isaByOwner, penByOwner: reliefAlloc.penByOwner
    };
    strategies.push(mk('phased', 'Relief-First, Bridge-Last',
      switchYears > 0
        ? `Pension-max for ${yearsToFirstRetire - switchYears} years so the tax uplift compounds longest, then ISA-max for the final ${switchYears} years to build the pre-SIPP access bridge.`
        : bridge.gapYears > 0
          ? 'Existing liquid assets already cover the bridge reserve, so this collapses to Relief-First (shown for completeness).'
          : 'No pre-SIPP access gap, so this collapses to Relief-First (shown for completeness).',
      blended, { phase: { switchYears, yearsToFirstRetire, early: reliefAlloc, late: isaAlloc }, planOpts: { contribByYear } }));
  }

  // Hold every player to the baseline's total accumulation outlay. Without this, reallocating towards a
  // faster-escalating wrapper compounds a bigger base and the strategy wins by spending more, not by
  // allocating better — so the "same take-home budget" the tournament advertises only held in year one.
  const baselineOutlay = accumulationOutlay(ctx);
  meta.baselineOutlay = baselineOutlay;
  const normalise = (planState) => {
    const solved = solveEscalation(planState, baselineOutlay);
    if (solved.rate === null) return { planState, escalation: null };
    return {
      planState: applyEscalationToPlan(planState, solved.rate),
      escalation: { rate: solved.rate, before: solved.before, after: solved.after, target: baselineOutlay }
    };
  };
  strategies.forEach(s => {
    if (s.id === 'baseline') return;
    if (s.candidates) { s.candidates = s.candidates.map(c => ({ ...c, ...normalise(c.planState) })); return; }
    if (s.planState) Object.assign(s, normalise(s.planState));
  });

  /*
   * 6 THE EVOLVED PLAN - only where there is a bridge to fund.
   *
   * The five players above each fix most of the plan and search one thing: an ISA share, a bridge cover,
   * a switch year. That is right when the best way to save does not depend on the way the money will be
   * drawn. Measured across the household library it usually does not - but where retirement starts
   * before the pension unlocks, it does, and the gap between searching the two together and searching
   * them in turn was worth one to three points of survival on every household that had one.
   *
   * So this player exists exactly there. It is declared here and searched by the caller, because unlike
   * the others it is not a list of candidates to score but a search to run: src/evolve.js breeds
   * accumulation choices against draw orders, warm-started from whatever the players above found, so it
   * cannot come back with less than they did. Where there is no bridge it is not offered at all - it
   * found nothing the named players had not, and a player that never wins is a slower run for nothing.
   *
   * It carries no planState: until the search runs there is no plan to show.
   */
  if (bridge.gapYears > 0 && netBudget > 0) {
    strategies.push({
      id: 'evolved', name: 'Evolved Plan', searchAxis: 'Generation', evolve: true,
      description: 'Searches the way of saving and the way of drawing together rather than one at a time: the bridge cover, the ISA split, the timing, the draw order and where a windfall goes, bred against each other on the same market paths. It starts from the plans the players above found, and it is the one player scored on paths it never searched on - so where it wins, it has won on figures nothing selected for.',
      candidates: null, isaContrib: null, penContrib: null, taxReliefSaved: null, transferNet: 0, transferGross: 0, planState: null
    });
  }

  // Saved scenarios enter after the normalisation above, deliberately: they run exactly as saved.
  entrants.forEach((ent, i) => {
    let entPlan, outlay = null;
    try { entPlan = normalizePlan(JSON.parse(JSON.stringify(ent.plan))); } catch (e) { return; }
    try { outlay = accumulationOutlay(buildContext(entPlan)); } catch (e) { outlay = null; }
    const entCouple = entPlan.demographics.planningMode === 'couple';
    const sumCat = (cat) => entPlan.accounts
      .filter(a => a.id.startsWith(cat + '_') && (entCouple || a.owner === 'Myself'))
      .reduce((t, a) => t + num(a.contrib, 0), 0);
    strategies.push({
      id: `entrant_${ent.id || i}`, name: ent.name || `Scenario ${i + 1}`, isEntrant: true,
      description: 'A saved scenario, run exactly as saved. It is not held to the same take-home budget as the other players, so read its outlay before its survival rate.',
      entrantOutlay: outlay, baselineOutlay,
      isaContrib: sumCat('isa'), penContrib: sumCat('pen'), giaContrib: sumCat('other'),
      taxReliefSaved: null, transferNet: 0, transferGross: 0, escalation: null,
      planState: entPlan
    });
  });
  return { ctx, meta, strategies };
}

/*
 * Every meaningful combination of the three decumulation methodology settings, each as a ready-to-run
 * plan. The harvest flag only takes effect on policies that declare `harvest`, so policies that ignore it
 * (Sequential) emit a single variant instead of a duplicate pair that would waste a simulation and
 * show up as a phantom tie.
 */
function buildPolicyCandidates(rawPlan) {
  const plan = normalizePlan(rawPlan);
  const out = [];
  Object.entries(DECUMULATION_POLICIES).forEach(([policyKey, policy]) => {
    ['Phased Drawdown', 'Full 25% Lump Sum'].forEach(drawdownStrategy => {
      // harvest-off first so that an exact tie leaves the simpler setting alone rather than
      // switching on a behaviour that showed no measured benefit
      (policy.harvest ? [false, true] : [false]).forEach(harvest => {
        out.push({
          id: `${policyKey}|${drawdownStrategy}|${harvest ? 'h1' : 'h0'}`,
          decumulationPolicy: policyKey,
          drawdownStrategy,
          harvestPersonalAllowance: harvest,
          harvestApplies: !!policy.harvest,
          planState: {
            ...plan,
            spending: { ...plan.spending, decumulationPolicy: policyKey, drawdownStrategy },
            config: { ...plan.config, harvestPersonalAllowance: harvest }
          }
        });
      });
    });
  });
  return out;
}


/*
 * Pick the best candidate by working DOWN the priority list. At each priority the pool is narrowed to
 * the candidates within that metric's epsilon of the best, so a later priority only ever breaks a
 * near-tie on the earlier ones - it can never buy a gain in what you care about less by sacrificing
 * something you care about more.
 *
 * The pre-access cap stays a hard filter ahead of all of it: it is a constraint the household stated,
 * not a preference to be traded off.
 */
/*
 * Drop candidates that are more than the cap below the best survival available. Applied BEFORE the
 * ranking so no ordering of priorities can out-vote it, and never allowed to empty the pool: if
 * nothing clears the bar the field is left alone rather than returning nothing.
 */
function applySurvivalGuard(pool, capPts) {
  const cap = capPts === undefined || capPts === null ? MAX_SURVIVAL_SACRIFICE_PTS : capPts;
  if (!Number.isFinite(cap) || !pool.length) return pool;
  const best = Math.max(...pool.map(c => c.stats.successRate));
  const kept = pool.filter(c => c.stats.successRate >= best - cap);
  return kept.length ? kept : pool;
}

/*
 * BALANCED: score everything at once instead of working down a list.
 *
 * Ranking is lexicographic - a later priority only breaks a near-tie on the earlier ones. That is the
 * right shape for someone who genuinely has an order. It is the wrong shape for someone who does not,
 * because it cannot express "a modest gain in three things outweighs a small loss in one": whatever
 * sits first decides, and the rest only tidy up afterwards.
 *
 * Balanced blends every metric instead. The blend needs the metrics on a common scale first, because
 * survival is in percentage points and pots are in pounds and adding them directly would let whichever
 * has bigger numbers dominate by accident. Each is min-max scaled WITHIN the candidate field, so the
 * best available scores 1 and the worst 0, and the blend is over positions rather than magnitudes.
 *
 * A field where every candidate ties on a metric contributes nothing rather than dividing by zero,
 * which is the common case for bridge risk on a plan with no bridge at all.
 */
function balancedScore(cands, weights = null) {
  const keys = PRIORITY_KEYS;
  const scaled = cands.map(() => ({ total: 0, n: 0 }));
  for (const key of keys) {
    const m = PRIORITY_METRICS[key];
    const w = weights && weights[key] > 0 ? weights[key] : 1;
    const vals = cands.map(c => m.get(c.stats));
    const lo = Math.min(...vals), hi = Math.max(...vals);
    if (!(hi - lo > 1e-9)) continue;                       // everything ties: this metric says nothing
    cands.forEach((c, i) => {
      const unit = (m.get(c.stats) - lo) / (hi - lo);      // 0..1 within this field
      scaled[i].total += w * (m.higherIsBetter ? unit : 1 - unit);
      scaled[i].n += w;
    });
  }
  return scaled.map(s => (s.n > 0 ? s.total / s.n : 0));
}

/*
 * How much of the blended 0..1 score the leader must hold over the runner-up before the difference is
 * treated as real. Below it the two are the same plan wearing different names, and an argmax is reading
 * Monte Carlo noise - the same defect explainPick had at its tail.
 */
const BALANCED_MARGIN = 0.02;

/*
 * A STABLE ORDER OVER CANDIDATES, FOR WHEN NOTHING MEASURABLE SEPARATES THEM.
 *
 * Intrinsic to the candidate, never its array index, so ranking the same field twice cannot disagree
 * with itself. It is the model's own preference: policies in the order DECUMULATION_POLICIES declares
 * them, then phased ahead of the lump sum, then harvesting on. Arbitrary in the sense that any
 * tie-break is, but fixed, explainable and free of sampling noise - which the alternative was not.
 */
const POLICY_ORDER = Object.keys(DECUMULATION_POLICIES);
function fallbackRank(c) {
  const p = POLICY_ORDER.indexOf(c.decumulationPolicy);
  return (p < 0 ? POLICY_ORDER.length : p) * 4
    + (c.drawdownStrategy === 'Full 25% Lump Sum' ? 2 : 0)
    + (c.harvestApplies && !c.harvestPersonalAllowance ? 1 : 0);
}
/*
 * ...and a name to settle the rest, because the rank above ties whenever two candidates share a policy
 * and a strategy, or - as every synthetic fixture does - carry no policy fields at all. Without this
 * last step the sort is stable and array position decides after all, which is the exact property this
 * was written to remove.
 */
const fallbackKey = (c) => String(c.id ?? c.label ??
  `${c.decumulationPolicy}|${c.drawdownStrategy}|${c.harvestApplies ? 1 : 0}${c.harvestPersonalAllowance ? 1 : 0}`);
const byFallback = (x, y) => (fallbackRank(x) - fallbackRank(y)) || (fallbackKey(x) < fallbackKey(y) ? -1 : fallbackKey(x) > fallbackKey(y) ? 1 : 0);

function pickBalanced(cands, opts = {}) {
  const pool = applySurvivalGuard(cands, opts.maxSurvivalSacrificePts);
  const scores = balancedScore(pool, opts.weights);
  let best = 0;
  scores.forEach((v, i) => { if (v > scores[best]) best = i; });
  // ...and only if it leads by enough to mean something. Otherwise the earliest in generation order,
  // which is stable across re-runs where the argmax is not.
  const runnerUp = Math.max(...scores.filter((_, i) => i !== best), -Infinity);
  return (scores[best] - runnerUp >= BALANCED_MARGIN) ? pool[best]
    : [...pool].sort(byFallback)[0];
}

function pickBest(cands, opts = {}, legacyCap = Infinity) {
  // Balanced is a different mechanism, not another priority, so it short-circuits the ranked walk.
  if (opts && opts.mode === 'balanced') return pickBalanced(cands, opts);
  // tolerated for the old positional form pickBest(cands, tol, preAccessCap)
  const o = typeof opts === 'number' ? { tol: opts, preAccessCap: legacyCap } : opts;
  const preAccessCap = o.preAccessCap ?? Infinity;
  const priorities = normalizePriorities(o.priorities);

  const eligible = cands.filter(c => c.stats.preNmpaFailRate <= preAccessCap);
  // if nothing meets the cap, fall back to the lowest achievable bridge risk rather than ignoring the cap
  const minPre = Math.min(...cands.map(c => c.stats.preNmpaFailRate));
  let pool = eligible.length ? eligible : cands.filter(c => c.stats.preNmpaFailRate <= minPre + RATE_EPSILON_PTS);
  pool = applySurvivalGuard(pool, o.maxSurvivalSacrificePts);

  for (const key of priorities) {
    if (pool.length <= 1) break;
    const m = PRIORITY_METRICS[key];
    const vals = pool.map(c => m.get(c.stats));
    const best = m.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const eps = toleranceFor(key, best, o.tolerances);
    pool = pool.filter(c => m.higherIsBetter ? m.get(c.stats) >= best - eps : m.get(c.stats) <= best + eps);
  }
  // still tied on everything the household said it cared about: keep the earliest candidate, which
  // buildPolicyCandidates emits harvest-off first, so an exact tie leaves the simpler setting alone
  return pool[0];
}

/*
 * Why a given priority order produced a given policy - the explanation the Config tab shows. Reports
 * only the priorities that actually narrowed the field, because a priority that never bit did not
 * influence the answer and saying otherwise would be a just-so story.
 */
function explainPick(cands, opts = {}) {
  const priorities = normalizePriorities(opts.priorities);
  const preAccessCap = opts.preAccessCap ?? Infinity;
  const eligible = cands.filter(c => c.stats.preNmpaFailRate <= preAccessCap);
  const minPre = Math.min(...cands.map(c => c.stats.preNmpaFailRate));
  let poolBeforeGuard = eligible.length ? eligible : cands.filter(c => c.stats.preNmpaFailRate <= minPre + RATE_EPSILON_PTS);
  let pool = applySurvivalGuard(poolBeforeGuard, opts.maxSurvivalSacrificePts);
  const guardBound = pool.length < poolBeforeGuard.length;
  const steps = [];
  /*
   * `steps` records only the priorities that NARROWED the field, because that is what explains the
   * winner. But a priority can fail to narrow in two quite different ways, and a household reading its
   * own result needs them apart:
   *
   *   CONSULTED AND TIED  every remaining candidate was within its tolerance, so it declared a tie and
   *                       passed the decision down. This says "your plan does not differ on this" - and
   *                       `spread`, the gap between best and worst measured in multiples of that
   *                       priority's own tolerance, says how close the tie actually was. A spread of
   *                       0.1 means the options were barely distinguishable; 0.9 means it was near
   *                       enough to matter and the tolerance still swallowed it.
   *   NOT REACHED         the pool was already down to one before its turn came. This says nothing
   *                       about the plan, only that what was ranked above it had already settled it.
   *
   * `consulted` carries every priority the loop actually looked at, in order, so the two can be told
   * apart: anything in `priorities` and absent from `consulted` was never reached. `steps` keeps its
   * old contents and meaning, so nothing reading it has to change.
   */
  const consulted = [];
  let settledAfter = null;
  for (const key of priorities) {
    const before = pool.length;
    if (before <= 1) { settledAfter = consulted.length; break; }
    const m = PRIORITY_METRICS[key];
    const vals = pool.map(c => m.get(c.stats));
    const best = m.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const worst = m.higherIsBetter ? Math.min(...vals) : Math.max(...vals);
    const eps = toleranceFor(key, best, opts.tolerances);
    pool = pool.filter(c => m.higherIsBetter ? m.get(c.stats) >= best - eps : m.get(c.stats) <= best + eps);
    const ruledOut = before - pool.length;
    consulted.push({ key, label: m.label, serves: m.serves, best, worst, eps,
      // in multiples of this priority's own tolerance, so points and pounds are comparable
      spread: eps > 0 ? Math.abs(best - worst) / eps : 0,
      ruledOut, left: pool.length, decided: ruledOut > 0 });
    if (ruledOut > 0) steps.push({ key, label: m.label, serves: m.serves, best, ruledOut, left: pool.length });
  }
  /*
   * Report the guard only when it actually removed something. A limit that never bound did not shape
   * the answer, and listing it as a reason would be the same just-so storytelling the steps avoid.
   */
  /*
   * THE LAST TIE GOES TO WHAT THEY RANKED FIRST.
   *
   * If several candidates survive every priority, each one has been declared equivalent by all six -
   * so the choice between them was `pool[0]`, meaning whichever the candidate grid happened to build
   * first. That is not a preference, it is an accident, and it is how a household could rank tax top
   * and be handed a candidate a shade worse on tax than one sitting beside it in the same pool.
   *
   * This does not undo the design. Lower priorities still choose freely inside the band the higher
   * ones leave, which is the whole point of ranking them; this only settles what is left when every
   * priority has had its say and none of them can separate the survivors.
   */
  /*
   * A POOL THAT NEVER RESOLVED IS A TIE, AND IS TAKEN AS ONE.
   *
   * This used to finish with an argmax on the first priority, which is not a decision. Everything still
   * in the pool got there by being within one epsilon of the best on that metric - that is precisely
   * what put it there - so picking the largest among them is a choice made INSIDE the tolerance the
   * ranking has just declared immaterial. On Monte Carlo estimates it is worse than arbitrary: it reads
   * sampling noise as a preference, and duly flips on a re-run at a different trial count. Measured on
   * the reference plan: 16 candidates tied on survival, and the "winner" changed between 1,500 and 8,000
   * paths on identical inputs while the figures behind it moved by £1,750 a year.
   *
   * The fallback is the model's own preference order over the policies, read off the candidate rather
   * than off its position in the array. Position would have been simpler and is a trap: it makes the
   * answer depend on the order the candidates were handed in, so the same field ranked twice could
   * disagree with itself. Where the difference is real the pool has already narrowed to one and none of
   * this runs.
   */
  const winner = [...pool].sort(byFallback)[0];
  return { winner, steps, consulted, settledAfter, priorities,
    guardBound, guardCapPts: opts.maxSurvivalSacrificePts ?? MAX_SURVIVAL_SACRIFICE_PTS,
    guardRuledOut: poolBeforeGuard.length - pool.length };
}

/*
 * THE TRADE-OFFS A HOUSEHOLD COULD MAKE, PRICED IN THEIR OWN NUMBERS.
 *
 * Ranking six priorities cold asks people to weigh things they have never seen a figure for. The sweep
 * has the figures. So: recommend the survival-first winner, then for every other priority find the
 * candidate that is best on it and say what switching would gain and what it would cost - "£85,000
 * more typical pot, for 1.8 points less survival". A card only exists where the gain clears that
 * priority's own tie threshold, because a difference the ranking itself would call a tie is not a
 * choice, it is noise with a button on it. Nothing outside the survival guard is ever offered.
 *
 * Cards are keyed by candidate, not by priority: one candidate that is best on both pot and bequest is
 * one decision, and listing it twice would make one option look like two.
 *
 * The base is ALWAYS the survival-first ranking, whatever order the household has set, so a card means
 * the same thing every time it appears.
 */
function buildTradeoffs(cands, opts = {}) {
  const empty = { recommended: null, cards: [] };
  if (!Array.isArray(cands) || !cands.length) return empty;
  const tolerances = opts.tolerances;
  const recommended = explainPick(cands, { priorities: DEFAULT_PRIORITIES, tolerances, preAccessCap: opts.preAccessCap, maxSurvivalSacrificePts: opts.maxSurvivalSacrificePts }).winner;
  if (!recommended) return empty;
  const pool = applySurvivalGuard(cands, opts.maxSurvivalSacrificePts);
  const score = (key, c) => PRIORITY_METRICS[key].get(c.stats);
  const gainOn = (key, from, to) => (PRIORITY_METRICS[key].higherIsBetter ? 1 : -1) * (score(key, to) - score(key, from));
  const bestOn = (key) => {
    const m = PRIORITY_METRICS[key];
    return [...pool].sort((a, b) => ((m.higherIsBetter ? -1 : 1) * (score(key, a) - score(key, b))) || byFallback(a, b))[0];
  };

  const byId = new Map();
  for (const key of PRIORITY_KEYS) {
    if (key === 'survive') continue;
    // with nobody named as an heir the bequest metric IS the pot metric, and one difference is one card
    if (key === 'bequest' && recommended.stats.postTaxInheritance == null) continue;
    const alt = bestOn(key);
    if (!alt || alt === recommended || alt.id === recommended.id) continue;
    if (gainOn(key, recommended, alt) <= toleranceFor(key, score(key, alt), tolerances)) continue;
    const id = alt.id ?? fallbackKey(alt);
    if (!byId.has(id)) byId.set(id, alt);
  }
  const cards = [...byId.values()].map(alt => tradeoffCard(cands, recommended, alt, opts));
  // free lunches first, then the cheapest in survival; the fallback order settles the rest
  cards.sort((a, b) => (a.survivePts - b.survivePts) || byFallback(a.candidate, b.candidate));
  return { recommended, cards };
}

/*
 * ONE CANDIDATE PRICED AGAINST ANOTHER: what switching gains and costs, each only where it clears that
 * priority's own tie threshold. Used for the trade-off cards and for the "other run's pick" a close
 * call offers, so the two are priced identically.
 */
function tradeoffCard(cands, recommended, alt, opts = {}) {
  const tolerances = opts.tolerances;
  const score = (key, c) => PRIORITY_METRICS[key].get(c.stats);
  const gainOn = (key, from, to) => (PRIORITY_METRICS[key].higherIsBetter ? 1 : -1) * (score(key, to) - score(key, from));
  const card = { candidate: alt, gains: [], costs: [], survivePts: score('survive', recommended) - score('survive', alt) };
  for (const key of PRIORITY_KEYS) {
    if (key === 'survive') continue;
    if (key === 'bequest' && recommended.stats.postTaxInheritance == null) continue;
    const gain = gainOn(key, recommended, alt);
    if (gain > toleranceFor(key, score(key, alt), tolerances)) card.gains.push({ key, from: score(key, recommended), to: score(key, alt), delta: gain });
    else if (-gain > toleranceFor(key, score(key, recommended), tolerances)) card.costs.push({ key, from: score(key, recommended), to: score(key, alt), delta: -gain });
  }
  if (card.survivePts > toleranceFor('survive', score('survive', recommended), tolerances)) {
    card.costs.unshift({ key: 'survive', from: score('survive', recommended), to: score('survive', alt), delta: card.survivePts });
  }
  return card;
}

/*
 * THE MEAN OF SEVERAL RUNS OF THE SAME PLAN.
 *
 * The policy search scores every candidate on two seeds at half the paths each, so it can tell a
 * stable answer from a close call (the seeds disagree) at no extra cost. The estimate it ranks on is
 * the mean of the two: every scalar is averaged, a curve is kept from the first run because the
 * ranking never reads curves, `trials` is pooled and the standard error recomputed from the pooled
 * count. A field that is null in any run (a fail age on a plan that never failed) keeps its first value.
 */
function averageStats(runs) {
  const list = (runs || []).filter(Boolean);
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  const out = { ...list[0] };
  for (const k of Object.keys(list[0])) {
    const vals = list.map(r => r[k]);
    if (vals.every(v => typeof v === 'number' && Number.isFinite(v))) out[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
  }
  out.trials = list.reduce((a, r) => a + (r.trials || 0), 0);
  out.standardError = Math.sqrt(Math.max(0, out.successRate * (100 - out.successRate) / Math.max(1, out.trials)));
  return out;
}

/*
 * ================================ INHERITANCE TAX ================================
 *
 * What an estate is actually worth to the people who receive it, which is not the same as the terminal
 * pot the projection reports. Two things separate them, and both are new:
 *
 *   1. From 6 April 2027 an unused pension is INSIDE the estate. Before that date it was outside, which
 *      is the entire basis of the conventional "spend everything else first" advice.
 *   2. If death is at 75 or over, the beneficiary then pays their OWN income tax on what they draw from
 *      an inherited pension - on top of the IHT already charged on it. 40% then a 45% marginal rate
 *      leaves 33p in the pound. The same pound in an ISA is taxed once and leaves 60p.
 *
 * So "which wrapper is it in" now changes the answer, and a gross terminal pot cannot express that.
 *
 * COUPLES are two events, not one. The first death is normally spouse-exempt and passes the unused
 * percentage of both bands to the survivor; the tax lands on the second. For the ESTATE arithmetic that
 * collapses neatly - the survivor's estate with doubled bands - which is what `transferredNrbPct` and
 * `transferredRnrbPct` express. What it does NOT collapse is the projection: after a first death the
 * survivor loses a personal allowance, a set of bands and a state pension, and modelling that is a
 * change to stepYear rather than to this function.
 */
/*
 * `exempt` is about INHERITANCE tax. `incomeTaxpayer` is a separate question, and conflating the two was
 * a real error here: a spouse is exempt from inheritance tax but still pays their own income tax on
 * money drawn from an inherited pension, so a widow was being shown a pension as tax-free when it is
 * not. A charity genuinely pays neither.
 */
/*
 * WHAT ELSE IS IN THE ESTATE, and why the kind matters rather than just the number.
 *
 * The main home has its own box because only one property can carry the residence band. Everything else
 * divides into things the tax treats differently: a second home or a buy-to-let is taxed in full and
 * unlocks nothing, chattels the same, while business and agricultural property carry a relief - and
 * unquoted shares a smaller one - that a plan ignoring them would overstate the bill by six figures on.
 *
 * `relievable` assets ask for the year they were acquired, because every one of these reliefs needs two
 * years' ownership at death. That test is the reason this tab still does not SUGGEST moving money into
 * relievable assets: it is the wrong tool for a short prognosis, and it carries investment risk the
 * model does not price. Valuing what a household already owns is a different question, and this answers
 * that one.
 */
const ESTATE_ASSET_KINDS = {
  property: { label: 'Second home, buy-to-let or land', relievable: false, usesAllowance: false,
    who: 'Any property other than the home you live in. Taxed in full - only one property can carry the residence allowance, and that is the box above.' },
  chattels: { label: 'Art, cars, jewellery or other possessions', relievable: false, usesAllowance: false,
    who: 'Personal possessions of real value. Taxed in full. Everyday household contents are rarely worth listing.' },
  otherMoney: { label: 'Other savings or investments held elsewhere', relievable: false, usesAllowance: false,
    who: 'Money outside the wrappers on Plan Inputs - a foreign account, a bond, a crowdfunding stake. Taxed in full, and not drawn on to fund your spending.' },
  business: { label: 'A business, or shares in an unquoted trading company', relievable: true, usesAllowance: true,
    who: 'Business Property Relief: 100% up to the allowance, 50% above it, and nothing at all unless you have owned it two years at death. Investment businesses - letting property, holding shares - do not qualify.' },
  agricultural: { label: 'Farmland or farm buildings (agricultural value)', relievable: true, usesAllowance: true,
    who: 'Agricultural Property Relief, sharing one allowance with business property. Only the agricultural value qualifies; development value above it does not.' },
  aim: { label: 'AIM or other shares not on a recognised exchange', relievable: true, usesAllowance: false,
    who: 'Half relief from 6 April 2026, where these used to get the lot. They do not use up the allowance, and they still need two years of ownership.' }
};

const normalizeEstateAssets = (list) => (Array.isArray(list) ? list : [])
  .filter(isPlainObject)
  .map((a, i) => ({
    id: String(a.id || `asset_${i}`),
    name: String(a.name ?? '').slice(0, 60),
    kind: ESTATE_ASSET_KINDS[a.kind] ? a.kind : 'property',
    value: Math.max(0, num(a.value, 0)),
    // blank rather than 0: an unanswered ownership year must not read as "bought in year zero"
    ownedFrom: isBlank(a.ownedFrom) ? '' : clamp(num(a.ownedFrom, 0), 1900, 2200)
  }));

/*
 * The relief on those assets, priced at a given death. Returns the relief and the reason there is none,
 * because "£0" on a farm worth two million is a finding the household has to be able to check.
 */
function businessReliefFor(cfg, assets, deathYear, transferredAllowancePct = 0) {
  const c = { ...DEFAULT_CONFIG, ...(cfg || {}) };
  const reformed = deathYear >= num(c.brAprFrom, 2026);
  const minYears = Math.max(0, num(c.brAprMinYearsOwned, 2));
  // transferable between spouses since the reform, on the same percentage basis as the nil-rate band
  const allowance = Math.max(0, num(c.brAprAllowance, 2500000)) *
    (1 + clamp(num(transferredAllowancePct, 0), 0, 100) / 100);
  let pool = reformed ? allowance : Infinity;
  let relief = 0, tooNew = 0, aboveAllowance = 0;
  // the allowance is spent in the order given, so the largest holding is offered it first
  [...assets].sort((a, b) => b.value - a.value).forEach(a => {
    const kind = ESTATE_ASSET_KINDS[a.kind];
    if (!kind || !kind.relievable || a.value <= 0) return;
    const owned = a.ownedFrom === '' ? Infinity : deathYear - num(a.ownedFrom, deathYear);
    if (owned < minYears) { tooNew += a.value; return; }
    if (!reformed) { relief += a.value; return; }
    if (kind.usesAllowance) {
      const at100 = Math.min(a.value, pool);
      pool -= at100;
      aboveAllowance += a.value - at100;
      relief += at100 + (a.value - at100) * (clamp(num(c.brAprReducedRatePct, 50), 0, 100) / 100);
    } else {
      relief += a.value * (clamp(num(c.aimReliefRatePct, 50), 0, 100) / 100);
    }
  });
  return { relief, tooNew, aboveAllowance, allowanceLeft: Number.isFinite(pool) ? Math.max(0, pool) : null, reformed };
}

const IHT_RELATIONSHIPS = {
  spouse: {
    label: 'Spouse or civil partner', exempt: true, incomeTaxpayer: true, descendant: false,
    note: 'No inheritance tax \u2014 but income tax still applies to an inherited pension.',
    /*
     * The most expensive misunderstanding in UK estate planning. An unmarried partner, however long you
     * have lived together, is NOT a spouse for inheritance tax: nothing passes exempt and none of their
     * allowances transfer. Picking this row for a cohabiting partner would silently wipe out a bill that
     * is really there.
     */
    who: 'Married or in a civil partnership only. A long-term unmarried partner does not count, however many years you have been together.'
  },
  descendant: {
    label: 'Child or grandchild (direct descendant)', exempt: false, incomeTaxpayer: true, descendant: true,
    note: 'Taxable, but unlocks the residence band if your home passes to them.',
    /*
     * Children and grandchildren are treated identically here because the rules treat them identically:
     * "direct descendant" covers the whole lineal line and several people who are not blood relations at
     * all, while excluding some who feel like close family. Getting the category wrong is worth the whole
     * residence band either way, so the exclusions are named rather than left to intuition.
     */
    who: 'Children, grandchildren and further down the line, including step-, adopted and foster children, and a child you were appointed guardian of. Also their husbands, wives and civil partners, if they have not remarried. NOT nieces, nephews, siblings, parents, aunts or uncles \u2014 those are "someone else".'
  },
  other: {
    label: 'Someone else', exempt: false, incomeTaxpayer: true, descendant: false,
    note: 'Taxable, with no additional relief.',
    who: 'Anyone outside the two rows above: a sibling, niece, nephew, parent, friend, or an unmarried partner.'
  },
  charity: {
    label: 'A charity', exempt: true, incomeTaxpayer: false, descendant: false,
    note: 'Exempt \u2014 and 10% of the estate to charity cuts the rate on the rest to 36%.',
    who: 'A registered charity. It pays neither inheritance tax nor income tax on anything it receives.'
  }
};

/*
 * What an inherited pension actually costs the person who receives it.
 *
 * The old model multiplied the pot by the beneficiary's CURRENT marginal rate, which is wrong in both
 * directions and badly so. Someone with no income was charged nothing at all on any size of pot -
 * because their marginal rate at zero income is zero - when drawing £400,000 in a year would really
 * cost them £166,203. Someone on £70,000 was charged a flat 40% on the whole pot, when spreading it
 * would have kept much of it in the basic band.
 *
 * This charges the real thing: the EXTRA tax they pay on their own income plus a share of the pension,
 * each year, for as many years as they spread it over. That gives a non-earner their personal allowance
 * every year - which is exactly why leaving a pension to someone without an income is so much less
 * punishing than leaving it to a higher-rate taxpayer.
 *
 * Everything is in today's money, so a salary assumed to rise with inflation is a salary held flat here.
 */
function inheritedPensionTax(amount, beneficiaryIncome, cfg, years) {
  const n = Math.max(1, Math.round(num(years, 5)));
  const pot = Math.max(0, num(amount, 0));
  if (pot <= 0) return 0;
  const income = Math.max(0, num(beneficiaryIncome, 0));
  const perYear = pot / n;
  const baseline = incomeTax(income, cfg);
  return Math.max(0, (incomeTax(income + perYear, cfg) - baseline) * n);
}

const normalizeGifts = (list) => (Array.isArray(list) ? list : [])
  .filter(isPlainObject)
  .map((g, i) => ({
    id: String(g.id || `gift_${i}`),
    amount: Math.max(0, num(g.amount, 0)),
    year: g.year === '' || g.year === undefined || g.year === null ? '' : Math.round(num(g.year, 0)),
    /*
     * Whether the gift came out of a compensation award. Blank means "work it out" - a gift inside the
     * window is presumed to have come from the award while any of it remains - and 'no' is the override
     * for money that came from somewhere else. 'yes' is what plans saved before this was derived carry.
     */
    // 'no' was an override a household could leave in a costly state without knowing - one plan sat on it
    // for £122,000 - so it is dropped on load rather than honoured. 'yes' still asserts, for plans saved
    // before this was derived and for the candidate the optimiser builds.
    fromCompensation: (g.fromCompensation === 'yes' || g.exemptCompensation === true) ? 'yes' : '',
    desc: String(g.desc ?? '').slice(0, 60)
  }));

const normalizeBeneficiaries = (list) => (Array.isArray(list) ? list : [])
  .filter(isPlainObject)
  .map((b, i) => ({
    id: String(b.id || `ben_${i}`),
    name: String(b.name ?? '').slice(0, 60),
    relationship: IHT_RELATIONSHIPS[b.relationship] ? b.relationship : 'descendant',
    sharePct: clamp(num(b.sharePct, 0), 0, 100),
    /*
     * The pension has its own percentages because it passes by nomination, not by the will. Blank means
     * "the same as everything else", which is both the commonest intention and what the model assumed
     * for everyone before the two were told apart - so an old saved plan reads identically.
     */
    pensionSharePct: isBlank(b.pensionSharePct) ? '' : clamp(num(b.pensionSharePct, 0), 0, 100),
    penPct: isBlank(b.pensionSharePct) ? clamp(num(b.sharePct, 0), 0, 100) : clamp(num(b.pensionSharePct, 0), 0, 100),
    // blank stays blank, like age and spreadYears: a row that opens on a 0 turns the next keystroke into
    // 0200000. Everything that does arithmetic on this reads it through num().
    income: isBlank(b.income) ? '' : Math.max(0, num(b.income, 0)),
    // years they would draw an inherited pension over; blank follows the config default
    spreadYears: isBlank(b.spreadYears) ? '' : clamp(num(b.spreadYears, 0), 1, 40),
    age: b.age === '' || b.age === undefined || b.age === null ? '' : clamp(num(b.age, 0), 0, 120)
  }));

/*
 * The estate at a single death.
 *
 * `wrappers` is { pen, isa, other, cash } at death, `homeValue` the residence still owned.
 *
 * The estate splits two ways, because in life it does: everything except the pension passes under the
 * WILL, and the pension passes by NOMINATION to the scheme - a separate form, with its own percentages,
 * which most people never think of as part of their will at all. Keeping them apart is not a detail: an
 * inherited pension is taxed at the RECIPIENT's marginal rate, so nominating it to the grandchild with
 * an unused personal allowance and leaving the ISA to the higher-rate children is worth more than any
 * other choice on this tab. A single set of shares across every wrapper cannot express that.
 *
 * A beneficiary who leaves the pension share blank simply follows their share of everything else, which
 * is what most people mean and what the model used to assume for everyone.
 */
function estateAtDeath(cfg, wrappers, opts = {}) {
  const c = { ...DEFAULT_CONFIG, ...(cfg || {}) };
  const deathAge = num(opts.deathAge, 90);
  const deathYear = num(opts.deathYear, new Date().getFullYear());
  const homeValue = Math.max(0, num(opts.homeValue, 0));
  const homeToDescendants = !!opts.homeToDescendants;
  const bens = normalizeBeneficiaries(opts.beneficiaries);

  const pen = Math.max(0, num(wrappers.pen, 0));
  const liquid = ['isa', 'other', 'cash'].reduce((t, k) => t + Math.max(0, num(wrappers[k], 0)), 0);
  const pensionCounts = deathYear >= num(c.pensionsInEstateFrom, 2027);
  /*
   * Everything owned that is not a wrapper and not the main home: a second property, a business, a farm,
   * possessions. These pass under the will like the rest of it, and they count at FULL value towards the
   * residence-band taper - s.8D(5) measures the net estate before reliefs and exemptions, so a farm with
   * full agricultural relief still pushes the residence band away.
   */
  const estateAssets = normalizeEstateAssets(opts.otherAssets);
  const estateAssetsValue = estateAssets.reduce((t, a) => t + a.value, 0);
  const willEstate = liquid + homeValue + estateAssetsValue;   // what the will divides
  const grossEstate = willEstate + (pensionCounts ? pen : 0);

  /*
   * Shares are normalised so a table that does not total 100 still produces a coherent answer, and the
   * caller is told rather than silently corrected. The pension is normalised separately, over its own
   * nominated percentages, so a plan that nominates only one person to the pension gives them all of it
   * without also giving them the house.
   */
  const declared = bens.reduce((t, b) => t + b.sharePct, 0);
  const declaredPen = bens.reduce((t, b) => t + b.penPct, 0);
  const shareOf = (b) => (declared > 0 ? b.sharePct / declared : 0);
  const penShareOf = (b) => (declaredPen > 0 ? b.penPct / declaredPen : 0);
  // what each person receives, and the part of it the estate is taxed on
  const grossOf = (b) => willEstate * shareOf(b) + pen * penShareOf(b);
  const chargeableOf = (b) => willEstate * shareOf(b) + (pensionCounts ? pen * penShareOf(b) : 0);

  const exemptValue = bens.filter(b => IHT_RELATIONSHIPS[b.relationship].exempt).reduce((t, b) => t + chargeableOf(b), 0);
  const charityValue = bens.filter(b => b.relationship === 'charity').reduce((t, b) => t + chargeableOf(b), 0);

  const nrbFull = Math.max(0, num(c.ihtNrb, 325000)) * (1 + clamp(num(opts.transferredNrbPct, 0), 0, 100) / 100);

  /*
   * GIFTS MADE BEFORE DEATH.
   *
   * The seven-year rule is usually explained as "survive seven years and the gift is tax-free", which is
   * true and misses the part that actually costs money. A gift made within seven years is set against
   * the nil-rate band FIRST, in the order it was made - so a £300,000 gift two years before death does
   * not generate a tax bill of its own, it quietly consumes £300,000 of the £325,000 band, leaving
   * £25,000 to shelter the entire estate. The cost lands on the estate, not the gift.
   *
   * Taper relief is the other half of the misunderstanding. It reduces the tax ON THE GIFT, and only on
   * the part exceeding the band - so a modest gift sees no benefit from taper however long ago it was
   * made, because there was never any tax on it to taper.
   *
   * The annual exemption is one allowance per tax year, taken by the earliest gifts in that year - not a
   * discount on every gift. Three gifts in one year share one £3,000 between them. Carry-forward of an
   * unused previous year is not modelled, so this is the cautious reading.
   */
  const taper = Array.isArray(c.giftTaperRates) ? c.giftTaperRates : [40, 40, 40, 32, 24, 16, 8];
  const annualExempt = Math.max(0, num(c.giftAnnualExemption, 3000));
  /*
   * A gift of exempt compensation is not a transfer of value at all: the infected blood scheme gives a
   * recipient two years from payment to pass it on with no inheritance tax, which means no seven-year
   * clock and no nil-rate band consumed. Such a gift is therefore dropped from this machinery entirely
   * rather than given a special rate inside it - it has already left the plan on the projection side.
   */
  /*
   * The two-year window for giving the compensation itself away is a separate relief from the credit
   * above: it stops the GIFT being a transfer of value, where the credit reduces the tax on the death.
   * Both can apply, and neither is netted off the other.
   */
  /*
   * WHICH GIFTS CAME OUT OF THE COMPENSATION - WORKED OUT, NOT TICKED.
   *
   * The plan already knows the award and the day it was paid, so it knows the window and how much money
   * there is to give. Asking the household to tick a box as well is asking them to tell it something it
   * can already work out, and the box gets forgotten - which prices the gift as an ordinary transfer and
   * quietly costs them the nil-rate band.
   *
   * So a gift dated inside the window is presumed to come from the award, EARLIEST FIRST, until the award
   * runs out. Beyond that there is nothing left for a gift to have come from, and the rest is ordinary.
   * A gift larger than what remains is split rather than judged all one way: £400,000 given with £300,000
   * of award left is £300,000 of exempt gift and £100,000 of ordinary one.
   *
   * There is no opting out. A household holding an award alongside other money and giving some away
   * inside the window can always say the gift was the award - money does not carry a label - so an
   * override could only ever be wrong in the expensive direction, and one plan sat unticked at a cost of
   * £122,000 with nothing on screen to say so. 'yes' remains, for plans saved before this was derived and
   * for the candidate gift the optimiser builds.
   */
  const compWindowEndYr = num(opts.compensationWindowEndYear, NaN);
  const compAvailable = Math.max(0, num(opts.compensationPayment, 0));
  const windowOpen = (g) => Number.isFinite(compWindowEndYr) && num(g.year, Infinity) <= compWindowEndYr;
  const giftList = (Array.isArray(opts.gifts) ? opts.gifts : [])
    .map((g, i) => ({ raw: g, i, amount: Math.max(0, num(g.amount, 0)), year: num(g.year, NaN) }))
    .filter(g => g.amount > 0 && Number.isFinite(g.year) && deathYear - g.year >= 0);

  let compLeft = compAvailable;
  const alloc = new Map();
  /*
   * Allocated only where it HELPS, which is the difference between a presumption and a trap. Treating a
   * gift as coming from the award spends part of the credit, so doing it to a gift that has already
   * survived seven years - and is therefore out of the estate anyway - buys nothing and costs the credit.
   * On one case that made the household £80,000 worse off for money they had given away years earlier.
   *
   * So the award is matched to the gifts that need it: those still inside the seven years at this death
   * age, earliest first. Which gifts those are changes with the death age, which is exactly why the tab
   * prices several. Marking a gift 'yes' asserts it regardless.
   */
  const survivesAnyway = (g) => deathYear - g.year >= taper.length;
  [...giftList].sort((a, b) => a.year - b.year).forEach(g => {
    const asserted = g.raw.fromCompensation === 'yes' || g.raw.exemptCompensation === true;
    const helps = !survivesAnyway(g);
    const eligible = windowOpen(g) && (asserted || (compAvailable > 0 && helps));
    const take = eligible ? Math.min(compLeft, g.amount) : 0;
    compLeft -= take;
    alloc.set(g.i, take);
  });
  const compGifted = [...alloc.values()].reduce((t, x) => t + x, 0);

  const gifts = giftList
    // only the part that did NOT come from the award goes through the seven-year machinery
    .map(g => ({ amount: g.amount - (alloc.get(g.i) || 0), year: g.year, desc: g.raw.desc,
      compensationPart: alloc.get(g.i) || 0,
      // ticked as compensation but dated after the window, so the tick bought nothing
      windowMissed: (g.raw.fromCompensation === 'yes' || g.raw.exemptCompensation === true) && !windowOpen(g) }))
    .filter(g => g.amount > 0 || g.compensationPart > 0)
    .map(g => ({ ...g, yearsBefore: deathYear - g.year }))
    .sort((a, b) => a.year - b.year);

  let nrbLeft = nrbFull;
  let giftTax = 0;
  const exemptLeft = new Map();                          // one annual exemption per year, first gift first
  const giftRows = gifts.map(g => {
    if (g.amount <= 0) {
      // wholly out of the award and inside its window: no clock, no band, no tax
      return { ...g, exemptAmount: g.compensationPart, survived: true, againstNrb: 0, taxed: 0, tax: 0, ratePct: 0, fromCompensation: true };
    }
    if (g.yearsBefore >= taper.length) {
      // survived the full period: outside the estate entirely, and it costs no band or exemption
      return { ...g, exemptAmount: g.amount, survived: true, againstNrb: 0, taxed: 0, tax: 0, ratePct: 0 };
    }
    const left = exemptLeft.has(g.year) ? exemptLeft.get(g.year) : annualExempt;
    const used = Math.min(left, g.amount);
    exemptLeft.set(g.year, left - used);
    const chargeableAmt = Math.max(0, g.amount - used);
    const against = Math.min(nrbLeft, chargeableAmt);
    nrbLeft -= against;
    const taxed = chargeableAmt - against;
    const ratePct = num(taper[Math.max(0, Math.floor(g.yearsBefore))], 40);
    const tax = taxed * (ratePct / 100);
    giftTax += tax;
    return { ...g, exemptAmount: used, survived: false, againstNrb: against, taxed, tax, ratePct };
  });
  const nrb = nrbLeft;
  /*
   * The residence band is three constraints at once, and dropping any one of them overstates it: it
   * needs a home passing to a direct descendant, it can never exceed the home's own value, and it
   * tapers away by £1 for every £2 of estate above £2m.
   */
  const anyDescendant = bens.some(b => IHT_RELATIONSHIPS[b.relationship].descendant && b.sharePct > 0);
  const rnrbFull = Math.max(0, num(c.ihtRnrb, 175000)) * (1 + clamp(num(opts.transferredRnrbPct, 0), 0, 100) / 100);
  const taperLoss = Math.max(0, grossEstate - Math.max(0, num(c.ihtRnrbTaperFrom, 2000000))) * (clamp(num(c.ihtRnrbTaperRate, 50), 0, 100) / 100);
  /*
   * THE DOWNSIZING ADDITION. Selling the home does not forfeit the band: where a home was sold, given
   * away or downsized from on or after 8 July 2015, the band it would have given is still available as
   * an addition, provided assets of at least that value pass to direct descendants instead. Without this
   * the model would charge up to £350,000 of tax to anyone who sold up to pay for care, which is exactly
   * the household most likely to have done so.
   *
   * What is modelled is the simple and common case: the whole home sold, and the band restored up to its
   * value when sold, capped by what the descendants actually receive. A partial downsizing - moving to a
   * cheaper home - would need the value of both properties and is not asked for.
   */
  const formerHome = Math.max(0, num(opts.formerHomeValue, 0));
  const descendantValue = bens
    .filter(b => IHT_RELATIONSHIPS[b.relationship].descendant)
    .reduce((t, b) => t + chargeableOf(b), 0);
  const downsizingAsset = homeValue > 0 ? 0 : Math.min(formerHome, descendantValue);
  const rnrbAsset = homeValue > 0 ? homeValue : downsizingAsset;
  const rnrb = (homeToDescendants && anyDescendant && rnrbAsset > 0)
    ? Math.max(0, Math.min(rnrbFull - taperLoss, rnrbAsset))
    : 0;
  const rnrbFromDownsizing = homeValue > 0 ? 0 : rnrb;

  /*
   * Death on active service (s.154 IHTA 1984) is a full exemption rather than a relief: the estate of a
   * member of the armed forces who dies from a wound, accident or disease contracted on service - and,
   * since 2014, emergency services personnel and anyone deliberately targeted because of their job -
   * pays no inheritance tax at all. So it short-circuits the arithmetic rather than adjusting it.
   */
  const activeServiceExempt = !!opts.activeServiceExempt;

  /*
   * BUSINESS AND AGRICULTURAL RELIEF reduces the taxable value, after exemptions and before the bands.
   *
   * Relief given on property that passes to an exempt beneficiary is wasted - a spouse pays no tax on it
   * either way - so it is scaled by the share of the will going to people who are actually chargeable.
   * That is an approximation: a will can leave the business to one child and the house to another, and
   * this tab divides everything by one percentage. It errs neither way, which is the best a single set
   * of shares can do, and it is disclosed.
   */
  const exemptWillShare = bens.filter(b => IHT_RELATIONSHIPS[b.relationship].exempt).reduce((t, b) => t + shareOf(b), 0);
  const brRaw = businessReliefFor(c, estateAssets, deathYear, opts.transferredBrAprPct);
  const businessRelief = Math.min(brRaw.relief * clamp(1 - exemptWillShare, 0, 1), Math.max(0, grossEstate - exemptValue));

  const afterExempt = Math.max(0, grossEstate - exemptValue - businessRelief);
  const chargeable = Math.max(0, afterExempt - nrb - rnrb);
  // the charity test is against the estate after exemptions and bands but BEFORE the charitable gift
  const baseline = Math.max(0, grossEstate - (exemptValue - charityValue) - businessRelief - nrb - rnrb);
  const charityQualifies = charityValue > 0 && baseline > 0 &&
    charityValue >= baseline * (clamp(num(c.ihtCharityThresholdPct, 10), 0, 100) / 100);
  const rate = (charityQualifies ? num(c.ihtCharityRate, 36) : num(c.ihtRate, 40)) / 100;
  const ihtBeforeRelief = activeServiceExempt ? 0 : chargeable * rate + giftTax;

  /*
   * Quick succession relief reduces the TAX, not the estate, so it is applied after the rate. The credit
   * is the tax paid on the earlier death, scaled by the share of that inheritance still represented in
   * this estate, then tapered by the whole years between the two deaths. It can never exceed the tax
   * actually due here - the relief reduces a bill, it does not create a refund.
   */
  const qsrValue = Math.max(0, num(opts.qsrInheritedValue, 0));
  const qsrTax = Math.max(0, num(opts.qsrTaxPaid, 0));
  const qsrYears = Math.max(0, Math.floor(num(opts.qsrYearsBefore, 99)));
  const scale = Array.isArray(c.qsrScale) ? c.qsrScale : [100, 80, 60, 40, 20];
  const qsrPct = qsrYears < scale.length ? num(scale[qsrYears], 0) : 0;
  const qsrRelief = (qsrValue > 0 && qsrTax > 0 && qsrPct > 0 && !activeServiceExempt)
    ? Math.min(ihtBeforeRelief, qsrTax * (qsrPct / 100))
    : 0;

  /*
   * COMPENSATION FROM A GOVERNMENT SCHEME - A CREDIT AGAINST THE TAX, NOT A HOLE IN THE ESTATE.
   *
   * Para 5 of Sch 15 FA 2020: the machinery the infected blood scheme runs through, and the same one used
   * for Post Office Horizon, Windrush and the rest. Where a qualifying payment "is at any time received",
   * the tax chargeable on the death is reduced by the death rate applied to the amount of the payment,
   * capped at the tax that would otherwise be due.
   *
   * Three things follow, and getting any of them wrong moves the answer by six figures on a large award:
   *
   *   - WHAT HAPPENED TO THE MONEY DOES NOT MATTER. "At any time received" carries no tracing test, so an
   *     award that was spent, invested, paid into a pension or used to clear a mortgage still earns the
   *     credit in full. Modelling it as a slice of the estate to disregard - which this did at first -
   *     denies it to exactly the people who did something sensible with it.
   *   - THE ESTATE IS UNCHANGED. The £2m residence-band taper and the 10% charity test are both measured
   *     on the estate as it stands, credit or no credit.
   *   - IT CANNOT CREATE A REFUND. Capped at the bill, alongside quick succession relief, which works the
   *     same way.
   */
  const compPayment = Math.max(0, num(opts.compensationPayment, 0));
  /*
   * THE CREDIT AND THE WINDOW ARE INDEPENDENT, and this went the other way first.
   *
   * The cautious instinct is one relief per pound: net the gifts off the credit, so a household cannot
   * both give the award away and still be credited for it. Measured, that reading makes the window worth
   * about £1,200 - the annual exemption at the death rate - because relieving the gift and losing the
   * credit costs almost exactly what letting the gift fail the seven years costs. A relief Parliament
   * created at the 2025 Budget, specifically because secondary transfers were being taxed, cannot be
   * worth £1,200 by design.
   *
   * So the credit is taken on the whole payment. It sits on the statute - para 5 relieves tax on a death
   * where a payment "is at any time received", with no netting of anything - and on the Budget note,
   * which grants the credit and then says the recipient "will ALSO have two years" to pass the money on.
   * Two reliefs for two different events: one on the death, one on the gift.
   *
   * This is still a reading rather than a quotation, and the tab says so. It is the more generous of the
   * two, and it is the one to revisit if HMRC's guidance disagrees.
   */
  const compCreditable = compPayment;
  const compCredit = (compCreditable > 0 && !activeServiceExempt)
    ? Math.min(Math.max(0, ihtBeforeRelief - qsrRelief), compCreditable * (num(c.ihtRate, 40) / 100))
    : 0;
  const iht = Math.max(0, ihtBeforeRelief - qsrRelief - compCredit);

  /*
   * Who bears it. IHT is charged on the estate, not the recipient, so it falls on the non-exempt
   * residue: a spouse's share is untouched and the taxable beneficiaries carry the whole bill between
   * them, pro rata.
   */
  const taxableBase = bens.filter(b => !IHT_RELATIONSHIPS[b.relationship].exempt).reduce((t, b) => t + chargeableOf(b), 0);
  /*
   * Income tax on an inherited pension turns on the age at death alone. It is charged whether or not the
   * pension is in the estate for inheritance tax: the 2027 change added a second charge, it did not
   * create the first one, and gating this on that date would hand a pre-2027 death a tax-free pension it
   * never had.
   */
  const pensionTaxable = deathAge >= num(c.pensionIncomeTaxFromAge, 75);

  const beneficiaries = bens.map(b => {
    const rel = IHT_RELATIONSHIPS[b.relationship];
    const gross = grossOf(b);
    const chargeable_b = chargeableOf(b);
    const ihtBorne = rel.exempt || taxableBase <= 0 ? 0 : iht * (chargeable_b / taxableBase);
    const afterIht = Math.max(0, gross - ihtBorne);
    /*
     * Income tax on an inherited pension. Charged on the person who RECEIVES it, at their own rates, on
     * the money as they draw it - which is why the exemption tested here is `incomeTaxpayer` and not
     * `exempt`. A spouse pays no inheritance tax and still pays this; only a charity escapes both.
     *
     * A beneficiary already at state pension age is assumed to have that income too, because it uses up
     * the personal allowance that would otherwise shelter the first slice of what they draw.
     */
    const penGross = pen * penShareOf(b);
    // the inheritance tax this person's pension share carries, so the income tax is charged on what is
    // actually left to draw rather than on a figure the estate has already paid tax out of
    const ihtOnPension = (rel.exempt || taxableBase <= 0 || !pensionCounts) ? 0 : iht * (penGross / taxableBase);
    const pensionPart = Math.max(0, penGross - ihtOnPension);
    const atSpa = b.age !== '' && num(b.age, 0) >= num(c.statePensionAgeForHeirs, 68);
    const assumedIncome = num(b.income, 0) + (atSpa ? num(c.assumedStatePensionForHeirs, 12548) : 0);
    /*
     * How long they take it over is theirs to choose, and it matters more than almost anything else on
     * this tab: the same pot drawn over twenty years instead of five can more than halve the tax, because
     * each year gets its own personal allowance and basic-rate band. A young grandchild has that runway
     * and a sixty-year-old child largely does not, so it is asked per person rather than assumed once.
     */
    const spread = b.spreadYears === '' ? c.inheritedPensionSpreadYears : b.spreadYears;
    const incomeTaxOnPension = (rel.incomeTaxpayer && pensionTaxable)
      ? inheritedPensionTax(pensionPart, assumedIncome, c, spread)
      : 0;
    const net = Math.max(0, afterIht - incomeTaxOnPension);
    return {
      ...b, sharePct: shareOf(b) * 100, penSharePct: penShareOf(b) * 100, gross, ihtBorne,
      incomeTaxOnPension, net, pensionPart, assumedIncome, atSpa, spreadYears: spread,
      effectiveRatePct: gross > 0 ? 100 * (1 - net / gross) : 0   // gross here is already what they receive
    };
  });

  const totalNet = beneficiaries.reduce((t, b) => t + b.net, 0);
  const totalIncomeTax = beneficiaries.reduce((t, b) => t + b.incomeTaxOnPension, 0);
  /*
   * WHAT THE HEIRS HAVE ALREADY BEEN HANDED.
   *
   * A gift is money that reaches them early, not money that vanishes. Counting only the estate makes
   * every gift look like a loss of its own size against a few pounds of tax saved, so nothing that
   * involves giving anything away can ever win a comparison - which is wrong, and wrong in the one
   * direction that matters when the question is how to get the most to your family.
   *
   * Only gifts from `giftsFromYear` onward count. Money handed over before the plan starts is already
   * theirs and has nothing to do with the choices being compared; including it would flatter every
   * candidate by the same amount and mislead anyone reading the total.
   */
  const giftsFrom = num(opts.giftsFromYear, NaN);
  const giftsToHeirs = Number.isFinite(giftsFrom)
    ? (Array.isArray(opts.gifts) ? opts.gifts : []).reduce((t, g) => {
      const y = num(g.year, NaN), amt = Math.max(0, num(g.amount, 0));
      if (!Number.isFinite(y) || y < giftsFrom || y > deathYear || amt <= 0) return t;
      const row = giftRows.find(r => r.year === y && Math.abs(r.amount - amt) < 1);
      return t + amt - (row ? row.tax : 0);
    }, 0)
    : 0;
  /*
   * Who got the gifts. The plan records what was given and when, not to whom - one recipient field
   * would be a fourth place for the shares to disagree with each other - so a lifetime gift is
   * attributed by the same will percentages that divide everything else, and the tab says so. It is
   * the only assumption available, and it is right whenever the gifts follow the will, which is the
   * common case and the one the optimiser recommends.
   */
  const withGifts = beneficiaries.map(b => ({
    ...b,
    giftsReceived: giftsToHeirs * (declared > 0 ? b.sharePct / 100 : 0),
    netWithGifts: b.net + giftsToHeirs * (declared > 0 ? b.sharePct / 100 : 0)
  }));
  return {
    grossEstate, liquid, pension: pen, pensionCounts, homeValue,
    nrb, nrbFull, nrbUsedByGifts: nrbFull - nrb, giftTax, gifts: giftRows,
    rnrb,
    // what the taper actually cost: the band this estate would have had without it, less what it has.
    // Measuring the taper on its own would report a loss to an estate with no home to claim it against.
    rnrbTaperLoss: (homeToDescendants && anyDescendant && rnrbAsset > 0)
      ? Math.max(0, Math.min(rnrbFull, rnrbAsset) - rnrb) : 0,
    rnrbFromDownsizing,
    // the pieces a line-by-line working needs: the band before the taper, what the taper withdrew, and
    // what the home itself could carry - any of the three can be the one that binds
    rnrbFull, rnrbAsset, rnrbTaperWithdrawn: Math.min(taperLoss, rnrbFull),
    nrbBase: Math.max(0, num(c.ihtNrb, 325000)),
    rnrbBase: Math.max(0, num(c.ihtRnrb, 175000)),
    homeToDescendants, anyDescendant,
    estateAssets, estateAssetsValue,
    businessRelief, businessReliefRaw: brRaw.relief,
    businessReliefTooNew: brRaw.tooNew, businessReliefAboveAllowance: brRaw.aboveAllowance,
    businessReliefAllowanceLeft: brRaw.allowanceLeft, businessReliefReformed: brRaw.reformed,
    exemptValue, charityValue, charityQualifies, ratePct: rate * 100,
    chargeable, iht, ihtBeforeRelief, qsrRelief, qsrPct, activeServiceExempt,
    incomeTaxOnPensions: totalIncomeTax,
    totalTax: iht + totalIncomeTax, netToBeneficiaries: totalNet,
    giftsToHeirs, netIncludingLifetimeGifts: totalNet + giftsToHeirs,
    /*
     * Measured against what the heirs actually RECEIVE, not against the taxable estate. Those are
     * different numbers whenever a pension sits outside the estate - a pre-2027 death - and dividing the
     * larger by the smaller produced effective rates below zero, which is not a rate at all.
     */
    effectiveRatePct: (willEstate + pen) > 0 ? 100 * (1 - totalNet / (willEstate + pen)) : 0,
    compensationPayment: compPayment, compensationCredit: compCredit,
    // the credit is capped at the bill, so a large award against a small estate is worth less than the rate
    compensationCreditCapped: compCreditable > 0 && compCredit < compCreditable * (num(c.ihtRate, 40) / 100) - 0.5,
    compensationWindowEndYear: Number.isFinite(compWindowEndYr) ? compWindowEndYr : null,
    compensationGifted: compGifted,
    // a gift ticked as compensation but made too late is an ordinary gift, and has to be said out loud
    compensationGiftsMissed: gifts.some(g => g.windowMissed),
    compensationGiftsCovered: compGifted, compensationLeftToGive: Math.max(0, compLeft),
    sharesDeclaredPct: declared, pensionSharesDeclaredPct: declaredPen, beneficiaries: withGifts,
    // what the heirs actually receive between them, which includes a pension the estate is not taxed on
    inheritedTotal: willEstate + pen,
    deathAge, deathYear
  };
}

/*
 * How much there is to give away out of income, which is the one gift that needs no seven years.
 *
 * s.21 exempts a gift that is habitual, made out of INCOME rather than capital, and leaves the giver's
 * standard of living intact. The first and third conditions are facts about a person; the second is
 * arithmetic, and this is it: guaranteed income and earnings, less what the plan says they live on.
 *
 * Drawdown taken from a pension is deliberately NOT counted as income here, even though HMRC will often
 * accept regular pension income as exactly that. It is the cautious reading: a household that gives away
 * its drawdown is giving away the pot, and if the executors lose the argument the gift becomes an
 * ordinary transfer with a seven-year clock attached. The binding figure is the LEANEST year, not the
 * average, because the exemption asks whether the gift could be made every year without eating capital.
 */
/*
 * THE TAX, LINE BY LINE.
 *
 * The tab could say what the bill was and not how it got there, which leaves a household unable to
 * check the one number that matters or to see which allowance it lost and to what. This turns a priced
 * estate into the working: what is being taxed, what comes off before the bands, what each band is and
 * what ate it, and how the bill is arrived at from the chargeable amount.
 *
 * Every row carries a signed `amount` and the running total after it, so the table cannot disagree with
 * the figure above it - a test walks the rows and checks the last one is the tax the engine charged.
 */
function ihtWorkings(est, cfg) {
  if (!est) return null;
  const c = { ...DEFAULT_CONFIG, ...(cfg || {}) };
  const rows = [];
  let run = 0;
  const add = (key, label, amount, opts = {}) => {
    if (opts.skipIfZero !== false && Math.abs(num(amount, 0)) < 0.5 && !opts.always) return;
    if (opts.kind !== 'note') run += num(amount, 0);
    rows.push({ key, label, note: opts.note || '', amount: num(amount, 0), kind: opts.kind || 'item', running: run });
  };
  const total = (key, label, note) => rows.push({ key, label, note: note || '', amount: run, kind: 'total', running: run });

  // ---- 1. what is in the estate
  add('liquid', 'Savings, ISAs and investments', est.liquid, { always: true });
  add('pension', est.pensionCounts ? 'Pension' : 'Pension (outside the estate at this age)',
    est.pensionCounts ? est.pension : 0,
    { always: est.pension > 0, note: est.pensionCounts
      ? `unused pensions count towards the estate from ${num(c.pensionsInEstateFrom, 2027)}`
      : `${'—'} death before ${num(c.pensionsInEstateFrom, 2027)}, so the ${'£'}${fmtNum(Math.round(est.pension))} is not taxed here` });
  add('home', 'Your home', est.homeValue);
  add('assets', 'Everything else you own', est.estateAssetsValue,
    { note: (est.estateAssets || []).map(a => a.name || ESTATE_ASSET_KINDS[a.kind].label).join(', ') });
  total('gross', 'Estate for inheritance tax');

  // ---- 2. what comes off before the bands
  const spouseExempt = Math.max(0, num(est.exemptValue, 0) - num(est.charityValue, 0));
  add('spouse', 'Less: passing to a spouse or civil partner', -spouseExempt, { note: 'exempt without limit' });
  add('charity', 'Less: passing to charity', -num(est.charityValue, 0),
    { note: est.charityQualifies ? `enough to earn the ${est.ratePct}% rate` : 'exempt, but below the 10% test for the reduced rate' });
  add('relief', 'Less: business and agricultural relief', -num(est.businessRelief, 0));
  if (rows.some(r => ['spouse', 'charity', 'relief'].includes(r.key))) total('taxable', 'Taxable estate');

  // ---- 3. the allowances, and what consumed them
  add('nrb', 'Nil-rate band', -num(est.nrbBase, 0), { always: true });
  add('nrbT', 'Nil-rate band from a late spouse', -Math.max(0, num(est.nrbFull, 0) - num(est.nrbBase, 0)));
  add('nrbGifts', 'Less: nil-rate band eaten by gifts in the last seven years', num(est.nrbUsedByGifts, 0));
  /*
   * A gift that ate nothing still has to appear, or the reader is left looking for money they know they
   * gave away. Saying which relief absorbed it is the difference between a table that reconciles and
   * one that looks like it has lost a line.
   */
  const gl = Array.isArray(est.gifts) ? est.gifts : [];
  if (gl.length) {
    const given = gl.reduce((t, g) => t + num(g.amount, 0) + num(g.compensationPart, 0), 0);
    const fromComp = gl.reduce((t, g) => t + num(g.compensationPart, 0), 0);
    const outlived = gl.filter(g => g.survived && !num(g.compensationPart, 0)).reduce((t, g) => t + num(g.amount, 0), 0);
    const why = [
      fromComp > 0 ? `${'£'}${fmtNum(Math.round(fromComp))} came from the compensation, which costs no band` : '',
      outlived > 0 ? `${'£'}${fmtNum(Math.round(outlived))} was made more than seven years ago` : '',
      num(est.nrbUsedByGifts, 0) > 0 ? `${'£'}${fmtNum(Math.round(num(est.nrbUsedByGifts, 0)))} ate the band` : ''
    ].filter(Boolean).join('; ');
    rows.push({ key: 'giftsNote', kind: 'note', amount: 0, running: run,
      label: `Gifts you have made: ${'£'}${fmtNum(Math.round(given))}`, note: why || 'none of it reduced your allowances' });
  }
  const rnrbT = Math.max(0, num(est.rnrbFull, 0) - num(est.rnrbBase, 0));
  const bandBlocked = !(est.homeToDescendants && est.anyDescendant && num(est.rnrbAsset, 0) > 0);
  if (bandBlocked) {
    rows.push({ key: 'rnrbNone', kind: 'note', amount: 0, running: run, label: 'No residence band',
      note: num(est.homeValue, 0) <= 0 ? 'there is no home in the estate'
        : !est.homeToDescendants ? 'the home is not passing to a child, grandchild or step-child'
        : 'nobody inheriting is a direct descendant' });
  } else {
    add('rnrb', 'Residence band', -num(est.rnrbBase, 0), { always: true });
    add('rnrbT', 'Residence band from a late spouse', -rnrbT);
    add('rnrbTaper', `Less: residence band withdrawn by the ${'£'}${fmtNum(Math.round(num(c.ihtRnrbTaperFrom, 2000000)))} taper`,
      num(est.rnrbTaperWithdrawn, 0),
      { note: `${'£'}1 of band for every ${'£'}2 the estate is over the line` });
    // after the taper the band can still be more than the home is worth, and then the home is the cap
    const afterTaper = Math.max(0, num(est.rnrbFull, 0) - num(est.rnrbTaperWithdrawn, 0));
    const capped = Math.max(0, afterTaper - num(est.rnrb, 0));
    add('rnrbCap', 'Less: residence band capped at the value of the home', capped,
      { note: `the band cannot exceed the ${'£'}${fmtNum(Math.round(num(est.rnrbAsset, 0)))} the home is worth` });
  }
  total('chargeable', 'Chargeable to inheritance tax');

  // ---- 4. from the chargeable amount to the bill
  const out = [...rows];
  const chargeable = Math.max(0, run);
  out.push({ key: 'rate', kind: 'rate', label: `Tax at ${est.ratePct}%`,
    note: est.charityQualifies ? 'reduced from 40% because a tenth of the estate goes to charity' : '',
    amount: chargeable * num(est.ratePct, 40) / 100, running: chargeable * num(est.ratePct, 40) / 100 });
  let bill = chargeable * num(est.ratePct, 40) / 100;
  const push = (key, label, amount, note) => {
    if (Math.abs(num(amount, 0)) < 0.5) return;
    bill += num(amount, 0);
    out.push({ key, label, note: note || '', amount: num(amount, 0), kind: 'item', running: bill });
  };
  push('giftTax', 'Plus: tax on gifts made within seven years', num(est.giftTax, 0),
    'charged on the gift itself, after taper, where it runs past the band');
  if (est.activeServiceExempt) {
    out.push({ key: 'service', kind: 'item', label: 'Less: death on active service', note: 'a full exemption, whatever the estate is worth',
      amount: -bill, running: 0 });
    bill = 0;
  }
  push('qsr', 'Less: quick succession relief', -num(est.qsrRelief, 0),
    `${est.qsrPct}% of the tax paid on what you inherited`);
  push('comp', 'Less: compensation credit', -num(est.compensationCredit, 0),
    `${num(c.ihtRate, 40)}% of the ${'£'}${fmtNum(Math.round(num(est.compensationPayment, 0)))} payment`);
  out.push({ key: 'iht', kind: 'total', label: 'Inheritance tax payable', note: '', amount: Math.max(0, bill), running: Math.max(0, bill) });

  /*
   * AND ON TO WHAT THEY ACTUALLY GET. Stopping at the inheritance tax answers half the question: an
   * inherited pension is taxed AGAIN, at the recipient's own rate, and a household comparing routes
   * needs the number at the end of that. So the working carries on from the estate, through both
   * taxes, to the money in their hands - and adds what was handed over in life, which never went
   * through either.
   */
  let hand = num(est.inheritedTotal, 0);
  const hpush = (key, label, amount, note, kind) => {
    if (kind !== 'total' && Math.abs(num(amount, 0)) < 0.5) return;
    if (kind !== 'total') hand += num(amount, 0);
    out.push({ key, label, note: note || '', amount: kind === 'total' ? hand : num(amount, 0), kind: kind || 'item', running: hand });
  };
  out.push({ key: 'handsTop', kind: 'note', amount: 0, running: hand,
    label: 'What reaches your heirs', note: 'from here down, the same money seen from their side' });
  out.push({ key: 'inherited', kind: 'item', label: 'Everything passing to them',
    note: est.pensionCounts ? '' : 'including the pension, which the estate was not taxed on',
    amount: num(est.inheritedTotal, 0), running: hand });
  hpush('ihtOut', 'Less: the inheritance tax above', -Math.max(0, bill), '');
  if (num(est.incomeTaxOnPensions, 0) > 0) {
    hpush('heirTax', 'Less: their income tax on the inherited pension', -num(est.incomeTaxOnPensions, 0),
      `charged at each person's own rate, spread over the years they draw it`);
  } else {
    // a zero here is the single largest thing the death age decides, so it is stated rather than omitted
    out.push({ key: 'heirTax', kind: 'note', amount: 0, running: hand,
      label: 'Their income tax on the inherited pension: none',
      note: `death before ${num(c.pensionIncomeTaxFromAge, 75)} leaves an inherited pension tax-free to them; at ${num(c.pensionIncomeTaxFromAge, 75)} or over it is taxed at their own rate` });
  }
  hpush('netEstate', 'They keep, from the estate', 0, '', 'total');
  hpush('lifetime', 'Plus: handed over in your lifetime', num(est.giftsToHeirs, 0),
    'gifts still to be made under this plan, which no tax touches once they are outside seven years or covered by a relief');
  hpush('handsTotal', 'In their hands', 0, '', 'total');
  return out;
}

function surplusIncome(rows) {
  const years = (Array.isArray(rows) ? rows : []).filter(r => num(r.t, 0) > 0).map(r => ({
    year: r.year, age: r.ageSelf,
    surplus: num(r.netGuaranteed, 0) + num(r.workingTakeHome, 0) - num(r.targetSpend, 0)
  }));
  if (!years.length) return null;
  const sorted = years.map(y => y.surplus).sort((a, b) => a - b);
  return {
    years,
    min: sorted[0],
    median: sorted[Math.floor(sorted.length / 2)],
    // what could be given away every single year without touching capital
    sustainable: Math.max(0, sorted[0])
  };
}

/*
 * A gift worth suggesting, and why this particular one.
 *
 * The residence allowance is withdrawn £1 for every £2 of estate above £2m, so an estate a little over
 * the threshold is losing allowance pound for pound. The useful part is a rule most people never meet:
 * the £2m test looks at what you OWNED AT DEATH, and a gift is not owned at death - so lifetime gifts
 * are excluded from it even when they fail the seven-year test. Gifting the excess therefore restores
 * the allowance immediately, and keeps it if you are run over the next morning.
 *
 * That is the only gift this suggests, because it is the only one where the arithmetic is unambiguous.
 * Gifting to reduce the estate generally is roughly tax-neutral inside seven years - the gift consumes
 * the nil-rate band the estate would have used anyway - so presenting it as a saving would be wrong.
 *
 * Sizing it is the part that is easy to get wrong. The excess is measured at the DEATH age; the gift is
 * made NOW, and money given away also stops growing - so the estate falls by more than the gift, and
 * suggesting the excess itself would suggest roughly twice what is needed. Nor is the relationship a
 * fixed multiple: giving cash away early means later spending comes out of the pension instead, taxed
 * on the way, so each pound given can cost the estate anything from £1 to £2. The only honest way to
 * size it is to run the plan, which is what `opts.project` does - hand it a gift and it returns the
 * wrappers that plan reaches the death age with, and whether it still survives. This then searches for
 * the smallest gift that brings the estate back to the line, and refuses to go past the point where the
 * plan stops working: an allowance is no use to someone who ran out at 84.
 *
 * Inheritance tax charges a failed gift at its value WHEN GIVEN, never at what it would have grown
 * into, which is a second reason the early gift wins - and the reason estateAtDeath is handed the
 * gift's own figure rather than the hole it leaves.
 */
const SUGGEST_GIFT_STEPS = 12;                           // 1/4096 of liquid wealth: pounds on a £500k gift

function suggestGift(cfg, wrappers, opts = {}) {
  const c = { ...DEFAULT_CONFIG, ...(cfg || {}) };
  const before = estateAtDeath(c, wrappers, opts);
  const threshold = Math.max(0, num(c.ihtRnrbTaperFrom, 2000000));
  if (!(before.grossEstate > threshold) || before.rnrbTaperLoss <= 0) return null;

  const giftYear = Number.isFinite(num(opts.giftYear, NaN)) ? num(opts.giftYear, 0) : num(opts.deathYear, 0);
  /*
   * The cap is what sits in the liquid wrappers TODAY, in the order a gift would realistically come
   * from. A gift cannot come out of a pension without being drawn and taxed first, which is a different
   * decision entirely, so what the pension holds is deliberately not counted.
   */
  const pool = opts.liquidToday || wrappers;
  const cap = ['cash', 'other', 'isa'].reduce((t, k) => t + Math.max(0, num(pool[k], 0)), 0);
  if (!(cap > 1000)) return null;

  // default projection: the gift simply leaves the death-age wrappers, with no growth forgone. Callers
  // that can run the plan pass the real thing; this keeps the function usable (and testable) without it.
  const project = typeof opts.project === 'function' ? opts.project : (g) => {
    let left = g; const w = { ...wrappers };
    for (const k of ['cash', 'other', 'isa']) {
      const take = Math.min(left, Math.max(0, num(w[k], 0)));
      w[k] = Math.max(0, num(w[k], 0)) - take; left -= take;
      if (left <= 0) break;
    }
    return w;
  };
  const priceAt = (g) => {
    const w = project(g) || {};
    const est = estateAtDeath(c, w, { ...opts, gifts: [...(opts.gifts || []), { amount: g, year: giftYear }] });
    return { g, est, safe: w.survived !== false, clears: est.grossEstate <= threshold + 1 };
  };

  /*
   * Both properties move one way with the size of the gift - a bigger gift always brings the estate
   * nearer the line, and always leaves less to live on - so each is found by bisection rather than by
   * stepping through gift sizes. Twelve halvings of the liquid wealth is precision to a few hundred
   * pounds on any realistic estate, at about a dozen runs of the projection.
   */
  const bisect = (want) => {                             // smallest g in (0, cap] satisfying want()
    let lo = 0, hi = cap;
    for (let i = 0; i < SUGGEST_GIFT_STEPS; i++) {
      const mid = (lo + hi) / 2;
      if (want(priceAt(mid))) hi = mid; else lo = mid;
    }
    return hi;
  };
  // bisecting on "breaks the plan" returns the smallest gift that DOES break it, so step just inside it
  const largestAffordable = () => priceAt(bisect(p => !p.safe) * 0.999);
  const atCap = priceAt(cap);
  let chosen;
  if (!atCap.clears) {
    // even giving away everything liquid cannot clear the line; give what is affordable instead
    chosen = atCap.safe ? atCap : largestAffordable();
  } else {
    const needed = priceAt(bisect(p => p.clears));
    chosen = needed.safe ? needed : largestAffordable();
  }
  if (!(chosen.g > 1000) || !chosen.safe) return null;   // nothing worth suggesting, or nothing affordable
  /*
   * The claim this makes is about the residence band, so if the gift does not bring any of it back there
   * is nothing here worth saying. The estate is of course smaller for having given money away, and on
   * these figures that looks like a saving - but it is the ordinary gift effect, it needs the seven
   * years, and dressing it up as advice would be exactly the overreach this function exists to avoid.
   */
  const bandRestored = chosen.est.rnrb - before.rnrb;
  if (!(bandRestored > 0)) return null;

  const saving = before.totalTax - chosen.est.totalTax;
  const giftRow = chosen.est.gifts.find(g => g.year === giftYear && Math.abs(g.amount - chosen.g) < 1);
  return {
    amount: chosen.g, giftYear,
    clearsLine: chosen.clears,
    limitedBy: chosen.clears ? null : (atCap.safe ? 'liquid' : 'solvency'),
    estateBefore: before.grossEstate, estateAfter: chosen.est.grossEstate,
    // how much the estate falls per pound given: the gift itself plus the growth it no longer earns
    costPerPound: chosen.g > 0 ? (before.grossEstate - chosen.est.grossEstate) / chosen.g : 1,
    // whether it has cleared the seven years by the death age, which frees it from the nil-rate band
    // as well as from the £2m test
    outsideEstate: giftRow ? giftRow.survived === true : false,
    bandRestored,
    /*
     * The part of the saving that is certain. Restored allowance is yours from the day the gift is made;
     * the remainder of the drop in tax is the money itself being outside the estate, which needs the
     * seven years. The two are worth showing apart, because only one of them is a sure thing.
     */
    bandSaving: bandRestored * (chosen.est.ratePct / 100),
    taxBefore: before.totalTax, taxAfter: chosen.est.totalTax, saving,
    worthwhile: saving > 0
  };
}

/*
 * A couple: two deaths. The first passes everything to the survivor tax-free and hands over whatever
 * percentage of each band went unused (100% when the whole estate passes to them, which is the normal
 * case). The tax lands entirely on the second death, with the bands doubled.
 */
function estateForCouple(cfg, wrappers, opts = {}) {
  const first = estateAtDeath(cfg, wrappers, {
    ...opts, beneficiaries: [{ id: 'survivor', name: 'Surviving partner', relationship: 'spouse', sharePct: 100, income: 0 }]
  });
  // unused band percentages transfer; a wholly exempt first estate uses none of either
  const usedNrbPct = first.nrb > 0 ? Math.min(100, 100 * first.chargeable / first.nrb) : 0;
  const second = estateAtDeath(cfg, wrappers, {
    ...opts,
    transferredNrbPct: Math.max(0, 100 - usedNrbPct),
    transferredRnrbPct: 100
  });
  return { first, second, iht: second.iht, netToBeneficiaries: second.netToBeneficiaries };
}

/*
 * Post-tax inheritance for one candidate plan, for the bequest priority to rank on.
 *
 * Deterministic rather than Monte Carlo on purpose: which WRAPPER the money ends in is a tax question,
 * and draw order controls that while barely touching sequence risk. It also keeps the tournament to one
 * extra cheap run per candidate instead of a second simulation.
 *
 * Returns null when the household has not said who inherits - there is genuinely nothing to rank on,
 * and inventing a default heir would silently answer a question they never asked.
 */
/*
 * The transferred bands, read through the flag that governs them.
 *
 * Unticking "widowed" has to remove the allowance, not merely hide the boxes: leaving the stored
 * percentages live behind a collapsed section would price an estate on an allowance the household had
 * just told us it does not have, and nothing on screen would say why the bill had not moved.
 * Clearing the numbers on untick instead would lose what they typed if they ticked it back.
 */
function transferredPct(inh, key) {
  return inh && inh.widowed ? clamp(num(inh[key], 0), 0, 100) : 0;
}

function estateForPlanAt(plan, ctx, rows) {
  const inh = plan?.inheritance || {};
  const bens = normalizeBeneficiaries(inh.beneficiaries);
  if (!bens.length) return null;
  const age = clamp(num(inh.deathAge, ctx.terminalAge), 0, 120);
  const deathIdx = rows.findIndex(r => r.ageSelf >= age);
  const row = deathIdx >= 0 ? rows[deathIdx] : rows[rows.length - 1];
  /*
   * Solvency is tested to the DEATH AGE, not to the plan's terminal age.
   *
   * These are two different inputs and they routinely disagree: a household that tells the Inheritance
   * tab it dies at 71 still has Plan to Age at the default 100. Evaluating the full rows then rejects a
   * gift because the projection falls short at 98 - twenty-seven years after the estate it is valuing
   * has already been distributed. That is not a affordability finding, it is a question nobody asked.
   *
   * Slicing at the death row makes evaluateRows answer the question this function exists to answer:
   * did the household reach the death age with its spending met. It also moves the bequest-floor test
   * onto the death row, which is where a floor is meant to bite - "leave at least £X behind" is a
   * statement about the estate, not about a pot thirty years after the funeral.
   *
   * When death age is blank it defaults to the terminal age, so the full-horizon test is unchanged for
   * anyone who has not answered the question. And the wider plan's own survival is untouched: the
   * Projection tab and the tournament's successRate still run to the terminal age, so a plan that fails
   * after death still reports it where that finding belongs.
   */
  const ev = evaluateRows(ctx, deathIdx >= 0 ? rows.slice(0, deathIdx + 1) : rows);
  /*
   * The wider plan's verdict, kept alongside rather than instead of. Narrowing the test must not make
   * the consequence invisible: a route that is affordable to 71 and leaves the plan short at 98 is a
   * real trade-off, and the household chose the death age without necessarily meaning "and I am certain".
   * The tab discloses this where it recommends the route, so the decision stays theirs.
   */
  const full = deathIdx >= 0 && deathIdx < rows.length - 1 ? evaluateRows(ctx, rows) : ev;
  const soldBy = !!inh.homeSold && num(inh.homeSaleAge, 999) <= age;
  const res = (ctx.isCouple ? estateForCouple : estateAtDeath)(
    plan.config, { pen: row.pensions, isa: row.isas, other: row.other, cash: row.cash },
    { deathAge: age, deathYear: row.year, homeValue: soldBy ? 0 : Math.max(0, num(inh.homeValue, 0)),
      // a home sold still carries its residence band through the downsizing addition
      formerHomeValue: soldBy ? Math.max(0, num(inh.homeValue, 0)) : 0,
      homeToDescendants: inh.homeToDescendants !== false,
      transferredNrbPct: transferredPct(inh, 'transferredNrbPct'), transferredRnrbPct: transferredPct(inh, 'transferredRnrbPct'),
      transferredBrAprPct: transferredPct(inh, 'transferredBrAprPct'),
      qsrInheritedValue: num(inh.qsrInheritedValue, 0), qsrTaxPaid: num(inh.qsrTaxPaid, 0),
      qsrYearsBefore: num(inh.qsrYearsBefore, 99), activeServiceExempt: !!inh.activeServiceExempt,
      compensationPayment: num(inh.compensationPayment, 0),
      compensationWindowEndYear: (compensationWindow(plan.config, inh.compensationDate) || {}).endYear,
      otherAssets: inh.otherAssets,
      giftsFromYear: ctx.baseYear + 1,
      gifts: inh.gifts, beneficiaries: bens });
  const est = ctx.isCouple ? res.second : res;
  /*
   * Two totals, because two questions. `net` is what comes out of the estate, which is what the tab
   * reports and what the bequest priority ranks policies on - none of which change the gifts. `netWithGifts`
   * adds what the heirs were handed during the household's lifetime, and is what the optimiser ranks on,
   * because it compares candidates that DO change the gifts and would otherwise treat every one of them
   * as money thrown away.
   *
   * A plan that ran dry leaves nothing either way: the money was needed before the estate was ever valued.
   */
  return { est, row, survived: ev.survived, failAge: ev.failAge, failReason: ev.failReason,
    deathAge: age, fullSurvived: full.survived, fullFailAge: full.failAge, terminalAge: ctx.terminalAge,
    net: ev.survived ? est.netToBeneficiaries : 0,
    netWithGifts: ev.survived ? est.netIncludingLifetimeGifts : 0 };
}

function postTaxInheritanceFor(plan, ctx) {
  const r = estateForPlanAt(plan, ctx, simulateDeterministic(ctx, 'expected'));
  return r ? r.net : null;
}

/*
 * When the door closes on giving exempt compensation away.
 *
 * Holding it is safe: it is outside the estate either way. Giving it to somebody else is the part with a
 * deadline - two years from the day the money was paid, or two years from 4 December 2025 for anyone who
 * was already holding an award when the relief was announced, whichever is later. Miss it and the same
 * gift becomes an ordinary transfer with a seven-year clock and a nil-rate band to eat.
 *
 * Returned as a date as well as a year, because a plan that works in whole years would otherwise imply
 * the deadline is the end of December when it is an anniversary.
 */
function compensationWindow(cfg, receivedDate) {
  const c = { ...DEFAULT_CONFIG, ...(cfg || {}) };
  if (!receivedDate) return null;
  const received = new Date(receivedDate);
  if (Number.isNaN(received.getTime())) return null;
  const floor = new Date(c.compensationGiftWindowFrom || '2025-12-04');
  const start = received > floor ? received : floor;
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + Math.max(0, Math.round(num(c.compensationGiftWindowYears, 2))));
  return {
    receivedDate: received.toISOString().slice(0, 10),
    startsFrom: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    endYear: end.getFullYear(),
    // the last year in which the whole year is safe: a gift in endYear must beat the anniversary
    lastFullYear: end.getFullYear() - 1
  };
}

/*
 * THE BEST SPLIT OF THE PENSION ACROSS THE PEOPLE INHERITING IT.
 *
 * Worth doing properly, because the obvious answer is wrong. "Leave it to whoever earns least" fails as
 * soon as the pot is large: £1.5m drawn over five years is £300,000 a year, which reaches the additional
 * rate whoever receives it, while splitting the same pot between two people uses two sets of allowances
 * and two basic-rate bands. On one household here, half to a four-year-old and half to a £150,000 earner
 * beat all of it to the four-year-old by £18,842 - a result no rule of thumb produces.
 *
 * It is also nearly free to search. The nomination changes NOTHING about the projection - the money is
 * spent the same way while the household is alive - so each candidate is one estate calculation rather
 * than a full run. That affords an exhaustive sweep in 5% steps for two or three heirs, and a hill-climb
 * for four or more, where the exhaustive grid would run to tens of thousands of combinations.
 *
 * Only heirs who actually pay income tax on an inherited pension are moved. A charity pays none and a
 * spouse's own tax position is their own; shuffling shares between people the tax does not distinguish
 * would produce a different-looking answer worth exactly the same, which is worse than saying nothing.
 */
const PENSION_SPLIT_STEP = 5;

function bestPensionSplit(cfg, wrappers, opts = {}) {
  const bens = normalizeBeneficiaries(opts.beneficiaries);
  if (bens.length < 2) return null;
  const price = (pcts) => estateAtDeath(cfg, wrappers, {
    ...opts, beneficiaries: bens.map((b, i) => ({ ...b, pensionSharePct: pcts[i] }))
  }).netToBeneficiaries;

  const start = bens.map(b => b.penPct);
  const total = start.reduce((t, x) => t + x, 0);
  const asEntered = total > 0 ? start.map(x => Math.round(100 * x / total)) : bens.map(() => Math.round(100 / bens.length));
  const n = bens.length;
  let best = { pcts: asEntered, net: price(asEntered) };
  const consider = (pcts) => { const net = price(pcts); if (net > best.net + 0.5) best = { pcts, net }; };

  if (n <= 3) {
    // exhaustive in 5% steps: 21 combinations for two heirs, 231 for three
    const steps = 100 / PENSION_SPLIT_STEP;
    const walk = (i, left, acc) => {
      if (i === n - 1) { consider([...acc, left * PENSION_SPLIT_STEP]); return; }
      for (let k = 0; k <= left; k++) walk(i + 1, left - k, [...acc, k * PENSION_SPLIT_STEP]);
    };
    walk(0, steps, []);
  } else {
    /*
     * Hill-climb from three seeds - as entered, an even split, and everything to the lowest earner -
     * moving 5% at a time between every pair and keeping any move that helps. Multiple seeds because a
     * single one can settle in a local dip: the even split and the concentrated one fail in opposite
     * directions, so between them they bracket the answer.
     */
    const lowest = bens.map((b, i) => ({ i, income: num(b.income, 0) })).sort((a, b) => a.income - b.income)[0].i;
    const seeds = [asEntered, bens.map(() => Math.round(100 / n)), bens.map((_, i) => i === lowest ? 100 : 0)];
    seeds.forEach(seed => {
      let cur = { pcts: seed, net: price(seed) };
      if (cur.net > best.net) best = cur;
      for (let pass = 0; pass < 40; pass++) {
        let moved = false;
        for (let a = 0; a < n && !moved; a++) for (let b = 0; b < n && !moved; b++) {
          if (a === b || cur.pcts[a] < PENSION_SPLIT_STEP) continue;
          const trial = [...cur.pcts];
          trial[a] -= PENSION_SPLIT_STEP; trial[b] += PENSION_SPLIT_STEP;
          const net = price(trial);
          if (net > cur.net + 0.5) { cur = { pcts: trial, net }; moved = true; }
        }
        if (!moved) break;
      }
      if (cur.net > best.net) best = cur;
    });
  }

  const asEnteredNet = price(asEntered);
  return {
    pcts: best.pcts, net: best.net, asEnteredNet, gain: best.net - asEnteredNet,
    shares: bens.map((b, i) => ({ id: b.id, name: b.name, pct: best.pcts[i] })),
    changed: best.pcts.some((x, i) => Math.abs(x - asEntered[i]) > 0.5)
  };
}

/*
 * THE MOST EFFICIENT ALLOCATION, SEARCHED RATHER THAN ASSERTED.
 *
 * Everything else on the Inheritance tab prices what the household typed. This searches the choices
 * they actually control and ranks them on one number: WHAT THE HEIRS KEEP, after inheritance tax and
 * after their own income tax on drawing an inherited pension down over the assumed period.
 *
 * Six levers. It began as three and grew as the tab learned to price more; the list is the whole of
 * what is searched, and anything not on it is either priced alongside or excluded below.
 *
 *   1 WITHDRAWAL ORDER - which wrapper funds the spending, whether the tax-free lump sum is taken in
 *     one go, and whether the personal allowance is harvested. Eighteen combinations.
 *   2 HOW FAR UP THE BANDS TO DRAW - to the personal allowance, or on to the basic-rate limit. Its own
 *     question because the answer flips sign at 75: below it an inherited pension carries no income
 *     tax, so paying 20% now to move money out is a straight loss; above it the pension is taxed
 *     twice and paying 20% now can beat both charges.
 *   3 A GIFT now - how much, given next year, subject to the plan still surviving.
 *   4 A GIFT OF THE EXEMPT COMPENSATION - how much of what is LEFT of the award, and in which year of
 *     the window. Searched separately from lever 3 because it eats no nil-rate band, and searched in
 *     both orders against it because the two compete for the same money.
 *   5 MOVING MONEY BETWEEN WRAPPERS - pension top-ups to the annual allowance, unwrapped money into
 *     the ISA, or both, spread over the years remaining and held back from an emergency floor.
 *   6 THE PENSION NOMINATION - which heir the pension goes to, which matters because they pay income
 *     tax on it at their own rate.
 *
 * What is NOT searched, and why it would be dishonest to search it:
 *
 *   - How long the heirs take the pension over. A twenty-year draw-down beats a five-year one every
 *     time, but that is the HEIR's choice made after the death, not an allocation the household can
 *     make. Every candidate is therefore scored on the same draw-down assumption the plan already
 *     holds, so nothing can win by assuming better behaviour from someone else. It is reported
 *     separately as a sensitivity.
 *   - Leaving money to charity. Giving 10% away cuts the rate from 40% to 36%, which never leaves the
 *     FAMILY better off - it leaves them less and the charity a great deal. Ranking it against
 *     net-to-heirs would score a donation as a loss and bury a decision that is about values rather
 *     than arithmetic, so it is priced alongside instead.
 *
 * The search is coordinate descent - best order, then the best gift given that order, then transfers,
 * then the compensation gift, then the nomination - rather than the full product of six levers, which
 * would be thousands of projections for a result that in testing never differed. Two departures from a
 * plain descent, both earning their keep: the two gifts are searched in BOTH orders, since only one of
 * them is free and the free one should get first refusal on the money; and the winner is the maximum
 * over every candidate evaluated rather than the end of the chain, because a lever that looks strong on
 * its own can do less once the best order is in place and leave the chain below something already
 * priced. Each lever also reports what it is worth ON ITS OWN, so a household can see which ones are
 * dead ends for them: a residence band already out of reach, or a nomination that cannot matter because
 * death before 75 carries no income tax at all.
 */
const GIFT_SEARCH_FRACTIONS = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];

function optimizeInheritance(rawPlan, opts = {}) {
  const plan = normalizePlan(rawPlan);
  const inh = plan.inheritance || {};
  const bens = normalizeBeneficiaries(inh.beneficiaries);
  if (!bens.length) return null;                         // nothing to rank without an heir

  const onStep = typeof opts.onStep === 'function' ? opts.onStep : null;
  const baseCtx = buildContext(resolveMpaa(plan));
  const P = taxParams({ ...DEFAULT_CONFIG, ...(plan.config || {}) });
  const giftYear = baseCtx.baseYear + 1;
  const liquidToday = ['isa', 'other', 'cash'].reduce((t, cat) =>
    t + baseCtx.accounts.filter(a => a.cat === cat).reduce((u, a) => u + Math.max(0, num(a.balance, 0)), 0), 0);

  /*
   * One candidate: apply the variant to the plan, run the projection, price the estate at the chosen
   * death age. A variant that breaks a plan which otherwise survives is rejected outright rather than
   * ranked - the household has to live on this money first.
   */
  const gbp0 = (x) => '£' + fmtNum(Math.round(x));
  let runs = 0;
  const evaluate = (variant) => {
    const p = {
      ...plan,
      spending: { ...plan.spending, decumulationPolicy: variant.policy, drawdownStrategy: variant.drawdown },
      oneOffContributions: variant.recycle && variant.recycle.length
        ? [...(plan.oneOffContributions || []), ...variant.recycle]
        : plan.oneOffContributions,
      inheritance: {
        ...inh,
        gifts: [
          ...(inh.gifts || []),
          ...(variant.gift > 0 ? [{ id: '__opt', amount: variant.gift, year: giftYear, desc: 'Gift' }] : []),
          ...(variant.compGift ? [variant.compGift] : [])
        ],
        beneficiaries: variant.split
          ? bens.map((b, i) => ({ ...b, pensionSharePct: variant.split[i] }))
          : bens
      },
      config: { ...plan.config, harvestPersonalAllowance: variant.harvest,
        harvestCeiling: variant.ceiling || plan.config.harvestCeiling || 'pa' }
    };
    const ctx = buildContext(resolveMpaa(p));
    runs++;
    const rows = simulateDeterministic(ctx, 'expected');
    const r = estateForPlanAt(p, ctx, rows);
    return { ...variant, net: r.netWithGifts, estateNet: r.net, est: r.est, row: r.row,
      survived: r.survived, failAge: r.failAge,
      fullSurvived: r.fullSurvived, fullFailAge: r.fullFailAge, deathAge: r.deathAge,
      plan: p, ctx, rows };
  };

  /*
   * The nomination is free to search on top of any candidate: it changes who receives the pension, not
   * how the household spends its money, so the projection is identical and only the estate has to be
   * priced again. bestPensionSplit sweeps the splits in 5% steps off the wrappers this candidate reaches.
   */
  const withBestSplit = (c) => {
    if (bens.length < 2 || !c.row) return null;
    const soldBy = !!inh.homeSold && num(inh.homeSaleAge, 999) <= clamp(num(inh.deathAge, baseCtx.terminalAge), 0, 120);
    const split = bestPensionSplit(plan.config,
      { pen: c.row.pensions, isa: c.row.isas, other: c.row.other, cash: c.row.cash },
      { deathAge: clamp(num(inh.deathAge, baseCtx.terminalAge), 0, 120), deathYear: c.row.year,
        homeValue: soldBy ? 0 : Math.max(0, num(inh.homeValue, 0)),
        formerHomeValue: soldBy ? Math.max(0, num(inh.homeValue, 0)) : 0,
        homeToDescendants: inh.homeToDescendants !== false,
        transferredNrbPct: transferredPct(inh, 'transferredNrbPct'), transferredRnrbPct: transferredPct(inh, 'transferredRnrbPct'),
      transferredBrAprPct: transferredPct(inh, 'transferredBrAprPct'),
        qsrInheritedValue: num(inh.qsrInheritedValue, 0), qsrTaxPaid: num(inh.qsrTaxPaid, 0),
        qsrYearsBefore: num(inh.qsrYearsBefore, 99), activeServiceExempt: !!inh.activeServiceExempt,
        compensationPayment: num(inh.compensationPayment, 0),
        compensationWindowEndYear: (compensationWindow(plan.config, inh.compensationDate) || {}).endYear,
        otherAssets: inh.otherAssets, gifts: inh.gifts, beneficiaries: bens });
    if (!split || !split.changed || !(split.gain > 0)) return null;
    return evaluate({ ...c, split: split.pcts, splitShares: split.shares,
      label: joined(c.label === baseline.label ? baseline.label : c.label, splitLabel(split)) });
  };

  const giftYearWrappersOf = (c) => {
    const r = (c.rows || []).find(x => x.year === giftYear);
    return r ? { isa: r.isas, other: r.other, cash: r.cash } : null;
  };

  const baseline = evaluate({
    policy: plan.spending.decumulationPolicy, drawdown: plan.spending.drawdownStrategy,
    harvest: !!plan.config.harvestPersonalAllowance, ceiling: plan.config.harvestCeiling || 'pa',
    gift: 0, split: null, label: 'Your plan as it stands'
  });
  const viable = (c) => c.net > 0 && (c.survived || !baseline.survived);
  /*
   * Ties are broken by GIVING AWAY LESS.
   *
   * Sorting on net alone made the winner whichever equal-scoring candidate the grid happened to
   * evaluate first. On a household three years from the death age that is a wide field: past the
   * exempt window an ordinary gift cannot clear seven years, so it eats nil-rate band pound for pound
   * and the estate and the band fall together - every size between the window and the liquid ceiling
   * scores identically. The search was recommending £634,200 where £595,000 produced the same figure
   * to the pound, and £39,200 of somebody's money was being given away to buy nothing.
   *
   * A pound not given is a pound still theirs, reversible, and still able to become a gift later. So
   * among candidates within a pound of the best, the smallest gift wins.
   */
  const givenBy = (c) => num(c.gift, 0) + (c.compGift ? num(c.compGift.amount, 0) : 0);
  const bestOf = (list) => list.filter(viable)
    // within a pound is a tie: the candidates differ by pennies of rounding, not by anything real
    .sort((a, b) => (Math.abs(a.net - b.net) < 1 ? givenBy(a) - givenBy(b) : b.net - a.net))[0] || baseline;

  /*
   * MOVING MONEY BETWEEN WRAPPERS, UP TO THE ALLOWANCES THAT CAP IT.
   *
   * Two transfers are worth testing for a household that is already retired and cannot contribute out of
   * earnings:
   *
   *   - INTO THE PENSION. Even with no earnings at all, £2,880 a year buys £3,600 of pension: basic-rate
   *     relief is added at source whether or not any tax was paid. Since 2027 that pension sits in the
   *     estate like anything else, so the relief is not a loophole, it is simply 25% more money for the
   *     same outlay. Where there ARE relevant earnings the allowance is larger, and wrapperHeadroomAtYear
   *     already knows the whole rule - annual allowance, taper, MPAA, carry forward and the earnings cap.
   *   - INTO THE ISA. Up to the annual allowance, moving an unwrapped holding takes future growth out of
   *     capital gains tax. Selling to do it realises the gain now, which the projection charges, so the
   *     trade genuinely has to earn its place.
   *
   * Relief is modelled as what it is: the household pays the net cost out of one wrapper, and HMRC adds
   * the rest. Two entries rather than one, because a single transfer would take the gross amount out of
   * the source and quietly lose the relief - which would make recycling look like a bad idea every time.
   */
  const CAT_LABEL_OF = { pen: CATEGORY_LABEL.pen, isa: CATEGORY_LABEL.isa, other: CATEGORY_LABEL.other, cash: CATEGORY_LABEL.cash };
  const emergencyFloor = Math.max(0, num(opts.emergencyFloor, 25000));
  const recycleYears = Math.max(0, Math.min(num(opts.recycleYears, 10),
    Math.round(clamp(num(inh.deathAge, baseCtx.terminalAge), 0, 120) - Math.min(...baseCtx.owners.map(o => o.age0)))));
  const basicRate = clamp(num(plan.config.basicTaxRate, 20), 0, 100) / 100;

  const buildRecycle = (kinds) => {
    const out = [];
    let budget = Math.max(0, liquidToday - emergencyFloor);
    if (!(budget > 0) || recycleYears <= 0) return out;
    const perYear = budget / recycleYears;
    for (let t = 1; t <= recycleYears; t++) {
      const year = baseCtx.baseYear + t;
      let left = perYear;
      baseCtx.owners.forEach(o => {
        // the source is whichever liquid wrapper holds the most today; the engine caps the deduction at
        // the balance actually there in that year and warns if it falls short
        const balOf = (cat) => { const a = baseCtx.acc[o.ids[cat]]; return a ? Math.max(0, num(a.balance, 0)) : 0; };
        const src = ['cash', 'other', 'isa'].sort((a, b) => balOf(b) - balOf(a))[0];
        if (kinds.includes('pen')) {
          const room = wrapperHeadroomAtYear(baseCtx, o.key, 'pen', t);
          const gross = Math.min(Number.isFinite(room) ? room : 0, left / Math.max(0.01, 1 - basicRate));
          const net = gross * (1 - basicRate);
          if (gross > 100 && src !== 'pen') {
            out.push({ id: `__rc_p_${o.key}_${year}`, date: `${year}-01-01`, year, owner: OWNER_LABEL[o.key],
              category: CAT_LABEL_OF.pen, amount: net, desc: 'Recycle to pension', transferredFrom: CAT_LABEL_OF[src] });
            out.push({ id: `__rc_r_${o.key}_${year}`, date: `${year}-01-01`, year, owner: OWNER_LABEL[o.key],
              category: CAT_LABEL_OF.pen, amount: gross - net, desc: 'Basic-rate relief', transferredFrom: 'External' });
            left -= net;
          }
        }
        if (kinds.includes('isa') && left > 100) {
          const room = wrapperHeadroomAtYear(baseCtx, o.key, 'isa', t);
          const from = ['cash', 'other'].sort((a, b) => balOf(b) - balOf(a))[0];
          const amt = Math.min(Number.isFinite(room) ? room : 0, left, balOf(from));
          if (amt > 100) {
            out.push({ id: `__rc_i_${o.key}_${year}`, date: `${year}-01-01`, year, owner: OWNER_LABEL[o.key],
              category: CAT_LABEL_OF.isa, amount: amt, desc: 'Bed and ISA', transferredFrom: CAT_LABEL_OF[from] });
            left -= amt;
          }
        }
      });
    }
    return out;
  };
  /*
   * GIVING THE COMPENSATION AWAY BEFORE THE WINDOW CLOSES.
   *
   * Holding it is already safe - it is outside the estate either way - so this only wins where the money
   * would otherwise be eaten: the exemption is capped at what is still HELD at death, and a household
   * that lives on the compensation arrives with less of it to disregard. Handing it over inside the
   * window locks the whole amount away from both the tax and the spending, at the cost of not having it.
   * Whether that trade is worth taking is exactly what the search is for.
   */
  const compAmount = Math.max(0, num(inh.compensationPayment, 0));
  const compWin = compensationWindow(plan.config, inh.compensationDate);
  const compYears = compWin
    ? [...Array(Math.max(0, compWin.endYear - baseCtx.baseYear)).keys()].map(i => baseCtx.baseYear + 1 + i)
    : [];
  /*
   * Only what is LEFT of the award is on offer, and it is searched in slices rather than all-or-nothing.
   *
   * Both halves of that were wrong, and both cost real money. Offering the whole award ignored gifts
   * already made from it, so a household that had given some away was told to give the same pounds
   * twice. And testing only the full amount hid the shape of the trade: on a plan holding £575,000
   * outside the pension, giving £900,000 means withdrawing the difference at the marginal rate, and the
   * best answer was £629,000 - £6,185 better than the whole award and £45,000 better than the tab could
   * previously see. The slices are the same fractions the ordinary gift search uses.
   */
  const compLeft = Math.max(0, num(baseline.est.compensationLeftToGive, compAmount));
  const COMP_GIFTS = (compLeft > 1000 && compYears.length)
    ? compYears.flatMap(y => GIFT_SEARCH_FRACTIONS
        .map(fr => Math.round(compLeft * fr))
        .filter(a => a > 1000)
        .map(a => ({
          year: y, amount: a,
          entry: { id: `__compgift_${a}`, amount: a, year: y, desc: 'Gift of exempt compensation', fromCompensation: 'yes' },
          label: a >= compLeft - 1
            ? `give the ${gbp0(compLeft)} of compensation away in ${y}`
            : `give ${gbp0(a)} of the compensation away in ${y}`
        })))
    : [];

  const RECYCLES = [
    { key: ['pen'], label: 'top up the pension to its allowance each year' },
    { key: ['isa'], label: 'move unwrapped money into the ISA each year' },
    { key: ['pen', 'isa'], label: 'top up the pension, then the ISA, to their allowances' }
  ].map(r => ({ ...r, entries: buildRecycle(r.key) })).filter(r => r.entries.length);

  // ---- how every candidate is described, in one place so the search and the words cannot drift
  const giftLabel = (amt) => amt > 0 ? `gift ${gbp0(amt)} in ${giftYear}` : '';
  const recycleLabel = (r) => r ? r.label : '';
  const splitLabel = (sp) => sp ? 'pension ' + sp.shares.filter(x => x.pct > 0).map(x => `${x.pct}% ${x.name || 'heir'}`).join(' / ') : '';
  const ceilingLabel = (c) => c === 'basic' ? 'draw the pension to the basic-rate limit each year' : 'draw the pension only to the tax-free allowance';
  const joined = (...parts) => parts.filter(Boolean).join(' + ') || baseline.label;

  // ---- lever 1: the withdrawal order
  if (onStep) onStep({ label: 'Testing withdrawal orders', value: 0 });
  const orderLabel = (c) => `${c.decumulationPolicy}${c.drawdownStrategy === 'Full 25% Lump Sum' ? ', lump sum' : ''}${c.harvestApplies && c.harvestPersonalAllowance ? ', harvest on' : ''}`;
  const baseCeiling = plan.config.harvestCeiling === 'basic' ? 'basic' : 'pa';
  const otherCeiling = baseCeiling === 'basic' ? 'pa' : 'basic';
  const policyCands = buildPolicyCandidates(plan);
  const orders = policyCands.map(c => evaluate({
    policy: c.decumulationPolicy, drawdown: c.drawdownStrategy, harvest: c.harvestPersonalAllowance,
    ceiling: baseCeiling, gift: 0, split: null, label: orderLabel(c)
  }));
  /*
   * How far up the bands to draw the pension is its own question, and the answer flips sign on the death
   * age: below 75 an inherited pension carries no income tax, so paying 20% now to move it out is a
   * straight loss; above 75 it is taxed twice, and paying 20% now can beat both charges.
   */
  if (onStep) onStep({ label: 'Testing how much pension to draw early', value: 0.25 });
  const ceilings = policyCands.map(c => evaluate({
    policy: c.decumulationPolicy, drawdown: c.drawdownStrategy, harvest: c.harvestPersonalAllowance,
    ceiling: otherCeiling, gift: 0, split: null,
    label: joined(orderLabel(c), ceilingLabel(otherCeiling))
  }));
  const soloCeilings = ceilings.filter(c => c.policy === baseline.policy && c.drawdown === baseline.drawdown && c.harvest === baseline.harvest);
  const bestOrder = bestOf([...orders, ...ceilings]);


  /*
   * Each lever is measured TWICE. Once on its own against the plan as it stands, which is what the
   * household needs to know - crediting the first lever searched with everything the later ones also
   * deliver would send them after the wrong one. And once stacked on the best found so far, which is
   * what actually gets recommended. The two answers differ whenever levers overlap, and that difference
   * is worth the extra dozen runs.
   */
  /*
   * The grid is fractions of what is liquid, which never lands on the one size that matters most: the
   * LARGEST FULLY EXEMPT GIFT. Past the compensation window plus the annual exemption, a gift made
   * inside seven years eats nil-rate band pound for pound and buys nothing, so that boundary is the
   * efficient point - and on the reference household it sat £39,200 below anything the search had
   * priced. Every size above it tied, so the winner was whichever fraction happened to be evaluated.
   */
  const exemptBoundary = Math.round(compLeft + Math.max(0, num(plan.config.giftAnnualExemption, 3000)));
  /*
   * Measured against what is liquid IN THE GIFT YEAR, not today. The fractions are struck on today's
   * balances, which on this household is £575,000 - but a one-off contribution lands before the gift is
   * made, so £689,839 is actually available, and the boundary at £595,000 was being thrown away as
   * unaffordable when it was nothing of the sort.
   */
  const liquidAtGift = (() => { const w = giftYearWrappersOf(baseline); return w ? w.isa + w.other + w.cash : liquidToday; })();
  const giftAmounts = liquidToday > 1000
    ? [...new Set([
        ...GIFT_SEARCH_FRACTIONS.map(fr => Math.round(liquidToday * fr)),
        ...(exemptBoundary > 1000 && exemptBoundary <= liquidAtGift ? [exemptBoundary] : [])
      ])].filter(a => a > 0).sort((a, b) => a - b)
    : [];
  if (onStep) onStep({ label: 'Testing gifts', value: 0.35 });
  const soloGifts = giftAmounts.map(amt => evaluate({ ...baseline, gift: amt, split: null,
    label: joined(baseline.label, giftLabel(amt)) }));
  if (onStep) onStep({ label: 'Testing pension nominations', value: 0.5 });
  const soloSplit = withBestSplit(baseline);
  const soloNoms = soloSplit ? [soloSplit] : [];
  if (onStep) onStep({ label: 'Testing wrapper transfers', value: 0.6 });
  const soloRecycles = RECYCLES.map(r => evaluate({ ...baseline, gift: 0, split: null,
    recycle: r.entries, recycleKey: r.key.join('+'), label: joined(baseline.label, recycleLabel(r)) }));
  const soloCompGifts = COMP_GIFTS.map(g => evaluate({ ...baseline, gift: 0, split: null,
    compGift: g.entry, label: joined(baseline.label, g.label) }));

  // ---- stacked: the best order, then the best gift on top of it, then the best nomination on top again
  if (onStep) onStep({ label: 'Combining the best of each', value: 0.75 });
  const gifts = giftAmounts.map(amt => evaluate({ ...bestOrder, gift: amt, split: null,
    label: joined(bestOrder.label, giftLabel(amt)) }));
  const bestGift = bestOf([bestOrder, ...gifts]);
  const recycles = RECYCLES.map(r => evaluate({ ...bestGift, recycle: r.entries, recycleKey: r.key.join('+'),
    label: joined(bestGift.label, recycleLabel(r)) }));
  const bestRecycle = bestOf([bestGift, ...recycles]);
  const compGifts = COMP_GIFTS.map(g => evaluate({ ...bestRecycle, compGift: g.entry,
    label: joined(bestRecycle.label, g.label) }));
  /*
   * The two gifts have to be searched in BOTH orders, because they compete for the same money and only
   * one of them is free. Committing to the ordinary gift first leaves whatever is affordable for the
   * compensation - and the compensation is the one that eats no nil-rate band, so it should get first
   * refusal. Re-running the ordinary search on top of the best compensation gift lets the descent find
   * that, and on a plan holding £575,000 outside the pension it is worth four figures.
   */
  const compFirst = COMP_GIFTS.map(g => evaluate({ ...bestOrder, gift: 0, compGift: g.entry,
    label: joined(bestOrder.label, g.label) }));
  const bestCompFirst = bestOf([bestOrder, ...compFirst]);
  const giftsAfterComp = bestCompFirst.compGift
    ? giftAmounts.map(amt => evaluate({ ...bestCompFirst, gift: amt,
        label: joined(bestCompFirst.label, giftLabel(amt)) }))
    : [];
  const bestComp = bestOf([bestRecycle, ...compGifts, ...compFirst, ...giftsAfterComp]);
  // the split goes last because it is free: it re-prices the estate the winner already reaches
  const stackedSplit = withBestSplit(bestComp);
  const noms = stackedSplit ? [stackedSplit] : [];
  /*
   * The winner is the best of EVERYTHING evaluated, not the end of the stacking chain. Coordinate descent
   * can walk away from a better answer: it commits to the best withdrawal order first, and if a lever
   * that looked strong on its own does less once that order is in place, the chain ends below a candidate
   * already measured. Taking the maximum over every candidate costs nothing - they have all been priced -
   * and makes it impossible for the search to report less than something it has already seen.
   */
  const best = bestOf([baseline, ...orders, ...ceilings, ...soloGifts, ...soloNoms, ...soloRecycles,
    ...soloCompGifts, ...gifts, ...recycles, ...compGifts, ...compFirst, ...giftsAfterComp, ...noms]);

  /*
   * What each lever is worth ON ITS OWN, from the plan as it stands.
   */
  const alone = (list) => Math.max(0, (list.length ? bestOf(list).net : baseline.net) - baseline.net);
  const pickOf = (list, none) => {
    if (!list.length) return none;
    const w = bestOf(list);
    return w.net > baseline.net ? w.label.replace(`${baseline.label} + `, '') : none;
  };
  const levers = [
    { key: 'order', label: 'Withdrawal order', gain: alone(orders), pick: pickOf(orders, 'No change: you already hold the best order') },
    { key: 'ceiling', label: 'How much pension to draw early', gain: alone(soloCeilings),
      pick: pickOf(soloCeilings, `No change: ${ceilingLabel(baseCeiling)}`) },
    { key: 'gift', label: 'A gift now', gain: alone(soloGifts), pick: pickOf(soloGifts, giftAmounts.length ? 'No gift helps here' : 'Nothing liquid to give') },
    { key: 'nomination', label: 'Who the pension goes to', gain: alone(soloNoms),
      pick: soloSplit ? splitLabel({ shares: soloSplit.splitShares }) : (bens.length > 1 ? 'No split beats the one you have' : 'Only one heir') },
    { key: 'compGift', label: 'Giving the exempt compensation away', gain: alone(soloCompGifts),
      pick: COMP_GIFTS.length
        ? pickOf(soloCompGifts, `No: the credit for it applies whatever you do with the money${compWin ? `, and the gifting window closes ${compWin.endDate}` : ''}`)
        : (compAmount > 1000 ? 'The two-year window has closed' : 'No exempt compensation entered') },
    { key: 'recycle', label: 'Moving money between wrappers', gain: alone(soloRecycles),
      pick: pickOf(soloRecycles, RECYCLES.length ? 'No transfer helps here' : 'Nothing spare to move, or no years left to move it') }
  ].sort((a, b) => b.gain - a.gain);

  /*
   * Why a lever is a dead end, said plainly. A figure of zero invites the reading "the app did not try",
   * and the reasons here are specific and checkable: an inherited pension carries no income tax at all
   * below 75, and a residence band already tapered past what the household could ever gift back is gone
   * whatever they do.
   */
  const deathAge = clamp(num(inh.deathAge, baseCtx.terminalAge), 0, 120);
  const e = baseline.est;
  const rnrbFull = Math.max(0, num(plan.config.ihtRnrb, 175000)) * (1 + transferredPct(inh, 'transferredRnrbPct') / 100);
  const toClear = Math.max(0, e.grossEstate - num(plan.config.ihtRnrbTaperFrom, 2000000) - 2 * rnrbFull);
  const reasons = [];
  if (deathAge < num(plan.config.pensionIncomeTaxFromAge, 75)) {
    reasons.push({ key: 'nomination', text: `Priced at death at ${deathAge}, an inherited pension carries no income tax at all, so it makes no difference who is nominated. Price a death at ${num(plan.config.pensionIncomeTaxFromAge, 75)} or over and this becomes the largest choice on the tab.` });
  }
  /*
   * The question everyone asks about the will, answered rather than left implicit. Inheritance tax is
   * charged on the estate BEFORE it is divided, so among heirs who are all taxable it makes no difference
   * to the total who receives the house and who receives the ISA - only the pension split moves the
   * number, because that alone is taxed on the recipient. It is different the moment somebody exempt is
   * named, and then it is a decision about who benefits rather than about tax.
   */
  const anyExempt = bens.some(b => IHT_RELATIONSHIPS[b.relationship].exempt);
  /*
   * Only a question when there is somebody to divide between. With one heir the paragraph was answering
   * "who gets the house rather than the ISA" for a household that has nobody to choose between - 62
   * words of it, on every scenario, including one where the whole tab reads zero.
   */
  if (bens.length > 1) {
    reasons.push(anyExempt
      ? { key: 'will', text: 'Who receives which asset does change the bill here, because one of your beneficiaries is exempt: anything left to a spouse or a charity passes free of inheritance tax, so moving shares towards them lowers the total and moves money away from everyone else. That is a decision about who you want to benefit, so it is not searched.' }
      : { key: 'will', text: 'Who receives which asset does not change the total. Inheritance tax is charged on the estate before it is divided, and all your beneficiaries are taxable, so giving one the house and another the ISA moves who gets what without changing what survives. Only the pension split moves the number, because that alone is taxed on whoever receives it.' });
  }
  /*
   * A nomination that scores zero for a reason other than age. One heir means there is no split to
   * make; several heirs on the same income means every split is the same bill. Both read as "not
   * tried" without a line saying otherwise.
   */
  if (deathAge >= num(plan.config.pensionIncomeTaxFromAge, 75)) {
    if (bens.length === 1) {
      reasons.push({ key: 'nomination', text: `Only one person inherits, so there is no pension nomination to choose: all of it goes to ${bens[0].name || 'them'} whatever you do. Naming a second beneficiary would make this a real decision, because an inherited pension is taxed at each recipient's own rate.` });
    } else if (bens.length > 1 && new Set(bens.map(b => Math.round(num(b.income, 0) / 100))).size === 1) {
      reasons.push({ key: 'nomination', text: `Everyone inheriting the pension is on the same income (${gbp0(num(bens[0].income, 0))}), so every way of splitting it is taxed identically. It becomes a real decision as soon as their incomes differ.` });
    }
  }
  if (e.rnrb <= 0 && toClear > liquidToday) {
    /*
     * Said once. The taper card below carries the same finding with a table of gift sizes against the
     * estate each leaves, so repeating it here as a paragraph was the reader's second encounter with
     * an answer they had not asked twice. The short form stays for the case the card cannot cover -
     * an estate over the line with no ladder to draw, which happens when fewer than two gift sizes
     * survive the affordability test.
     */
    reasons.push({ key: 'gift', text: `The residence allowance is fully withdrawn and out of reach: bringing any of it back needs the estate to fall ${gbp0(toClear)}, against ${gbp0(liquidToday)} outside your pension.` });
  }

  // ---- priced alongside, not ranked: the charity rate, and how long the heirs take the pension
  const withCharity = (() => {
    const pct = clamp(num(plan.config.ihtCharityThresholdPct, 10), 0, 100);
    const scaled = bens.map(b => ({ ...b, sharePct: b.sharePct * (100 - pct) / 100 }));
    const p = { ...best.plan, inheritance: { ...best.plan.inheritance,
      beneficiaries: [...scaled, { id: '__charity', name: 'Charity', relationship: 'charity', sharePct: pct }] } };
    const ctx = buildContext(resolveMpaa(p));
    runs++;
    const r = estateForPlanAt(p, ctx, simulateDeterministic(ctx, 'expected'));
    if (!r) return null;
    const charity = r.est.beneficiaries.find(b => b.id === '__charity');
    const toCharity = charity ? charity.net : 0;
    // measured on the same total the ranking uses, so the cost quoted is comparable with the gain above
    const toFamily = r.netWithGifts - toCharity;
    return { pct, ratePct: r.est.ratePct, toCharity, toFamily, costToFamily: best.net - toFamily };
  })();

  const spread = (() => {
    if (!(best.est.pension > 0) || deathAge < num(plan.config.pensionIncomeTaxFromAge, 75)) return null;
    const at = (yrs) => {
      const p = { ...best.plan, inheritance: { ...best.plan.inheritance,
        beneficiaries: normalizeBeneficiaries(best.plan.inheritance.beneficiaries).map(b => ({ ...b, spreadYears: yrs })) } };
      const ctx = buildContext(resolveMpaa(p));
      runs++;
      return estateForPlanAt(p, ctx, simulateDeterministic(ctx, 'expected')).netWithGifts;
    };
    const slow = num(opts.slowSpreadYears, 20);
    return { years: slow, net: at(slow), gain: at(slow) - best.net };
  })();

  /*
   * WHY THIS MUCH AND NOT MORE.
   *
   * A recommendation to give away a specific number invites exactly one question, and "consider giving
   * more" is not an answer to it. The search has already priced every larger gift it could make; this
   * reports the next one up, what it would cost, and which of the three things stopped it - the
   * nil-rate band a failed gift eats, the income tax on withdrawing the balance from a pension, or the
   * plan simply not surviving. Where no gift is recommended at all, the same question needs answering
   * in reverse.
   */
  const deathAgeForGift = clamp(num(inh.deathAge, baseCtx.terminalAge), 0, 120);
  const giftRationale = (() => {
    const given = givenBy(best);
    const priced = [...soloGifts, ...soloCompGifts, ...gifts, ...compGifts, ...compFirst, ...giftsAfterComp];
    if (!priced.length) return null;
    // what the gifts in the winning plan are worth: the same plan with them taken out
    const without = given > 0 ? evaluate({ ...best, gift: 0, compGift: null, label: 'no gift' }) : null;
    /*
     * A meaningfully larger gift, not the next rung. The search prices fractions of liquid and of the
     * award, so the next candidate up can be £1,700 more - true, and useless as an explanation. The
     * step has to be big enough that a household would recognise it as the alternative they had in mind.
     */
    const step = Math.max(25000, given * 0.15);
    const bigger = priced.map(c => ({ c, amt: givenBy(c) }))
      .filter(x => x.amt >= given + step)
      .sort((a, b) => a.amt - b.amt)[0]
      || priced.map(c => ({ c, amt: givenBy(c) })).filter(x => x.amt > given + 1000).sort((a, b) => b.amt - a.amt)[0];
    const largest = priced.map(c => ({ c, amt: givenBy(c) })).sort((a, b) => b.amt - a.amt)[0];
    /*
     * WHY NOT MORE, as arithmetic rather than as an adjective.
     *
     * The four cases below already knew the quantity that decided them and threw it away, leaving a
     * sentence. The weakest - "the estate is already below the point where giving more buys anything" -
     * is a correct conclusion asked to be taken on faith, attached to a decision worth six figures of
     * somebody's money. Each now returns the rows that prove it, and the UI renders rows rather than
     * parsing a sentence.
     *
     * `sum` is not prose about a calculation. It IS the calculation.
     */
    let why = '', cost = 0, whySum = null, whyNote = '';
    if (bigger) {
      cost = best.net - bigger.c.net;
      const bandUp = num(bigger.c.est.nrbUsedByGifts, 0) - num(best.est.nrbUsedByGifts, 0);
      const outside = giftYearWrappersOf(baseline);
      const liquid = outside ? outside.isa + outside.other + outside.cash : 0;
      const short = bigger.amt - liquid;
      const taxSaved = num(best.est.iht, 0) - num(bigger.c.est.iht, 0);
      const extra = bigger.amt - given;
      if (!bigger.c.survived) {
        /*
         * Not a valuation, so not a sum. A candidate that runs the plan dry is rejected rather than
         * priced - "£2.9m worse off" would only be true in the sense that running out loses you
         * everything, which is not a comparison anyone should be shown.
         */
        why = 'it runs the plan short before the age you said you die';
        whySum = [
          { k: 'Gift', v: gbp0(bigger.amt) },
          { k: 'Runs short at age', v: String(bigger.c.failAge || '?') },
          { k: 'You said you die at', v: String(deathAgeForGift) }
        ];
        whyNote = 'money you would have needed to live on, so it never reaches the estate';
      } else {
        /*
         * THE SUM RECONCILES, which is the whole point of showing one.
         *
         * The obvious decomposition - extra given away, less tax saved - does NOT add up to the change
         * in what the heirs hold: the money given away also stops earning, and a gift inside seven
         * years is only partly out of the estate. Printing those two lines above a total they do not
         * produce is worse than printing prose, because a reader who checks it finds the page wrong.
         *
         * So the sum is the comparison itself, which reconciles exactly, and the driver goes in a note.
         */
        why = short > 1000
          ? `the extra would have to come out of the pension, and the income tax on withdrawing it costs more than the ${num(plan.config.ihtRate, 40)}% it saves`
          : bandUp > 1000
            ? `it uses another ${gbp0(bandUp)} of nil-rate band, with no taper to soften it`
            : 'the extra given away is more than the tax it saves';
        whySum = [
          { k: 'Heirs keep, this plan', v: gbp0(best.net) },
          { k: `Heirs keep, giving ${gbp0(bigger.amt)}`, v: gbp0(bigger.c.net) },
          { k: 'Difference', v: (cost < 0 ? '+' : '−') + gbp0(Math.abs(cost)), total: true }
        ];
        whyNote = short > 1000
          ? `${gbp0(short)} of it would have to be drawn from the pension and taxed on the way out`
          : bandUp > 1000
            ? `it uses another ${gbp0(bandUp)} of nil-rate band, and a gift this late has no taper`
            : `the extra ${gbp0(extra)} given away saves only ${gbp0(Math.max(0, taxSaved))} of tax`;
      }
    }
    /*
     * How much of the saving does NOT depend on surviving seven years. The residence-band taper is
     * measured on what you OWNED AT DEATH, so money given away restores that band the day it leaves,
     * whatever happens next. The rest of the saving is the ordinary effect of the gift being outside
     * the estate, and that part does need the seven years. Households ask about the seven years first,
     * so the answer has to be on the card rather than in a footnote.
     */
    const bandBack = Math.max(0, num(best.est.rnrb, 0) - num(without ? without.est.rnrb : best.est.rnrb, 0));
    const certain = bandBack * (num(plan.config.ihtRate, 40) / 100);
    return {
      given, giftedNow: num(best.gift, 0), fromCompensation: best.compGift ? num(best.compGift.amount, 0) : 0,
      worth: without ? best.net - without.net : 0,
      bandBack, certain, needsSeven: Math.max(0, (without ? best.net - without.net : 0) - certain),
      // a candidate that breaks the plan is a rejection, not a valuation: "£2.9m worse off" is only
      // true in the sense that running out of money loses you everything, which is not a comparison
      nextUp: bigger ? bigger.amt : null, nextUpCost: bigger ? cost : 0, why, whySum, whyNote,
      /*
       * WHEN it runs short, not just that it does. "Would not leave you enough to live on" reads as
       * destitution; the truth is often a shortfall in the last year or two of a plan that runs to 100,
       * and a household told the former will discount the whole recommendation.
       */
      nextUpFails: bigger ? !bigger.c.survived : false,
      nextUpFailAge: bigger && !bigger.c.survived ? bigger.c.failAge : null,
      largest: largest && largest.amt > given + 1000 ? largest.amt : null,
      largestCost: largest && largest.amt > given + 1000 ? best.net - largest.c.net : 0,
      largestSurvives: largest ? !!largest.c.survived : true,
      // the horizon a rejected gift is measured against: affordability is tested to the age the
      // household said it dies, so quoting Plan to Age here would name a boundary nothing was checked at
      terminalAge: clamp(num(rawPlan?.inheritance?.deathAge, baseCtx.terminalAge), 0, 120),
      liquidAtGiftYear: (() => { const w = giftYearWrappersOf(baseline); return w ? w.isa + w.other + w.cash : 0; })(),
      /*
       * WHY IT STOPS THERE when nothing bigger was priced at all.
       *
       * When the recommended gift is every penny outside the pension, there is no larger candidate to
       * compare against, so `bigger` is null and the card fell silent - it said what the gift was worth
       * and nothing about its ceiling. The ceiling is the household's own liquidity, and saying so is
       * the whole answer.
       */
      /*
       * THE PLATEAU, and what the surplus is really buying.
       *
       * Past the exempt window an ordinary gift made inside seven years eats nil-rate band pound for
       * pound: the estate falls, the taxable band falls with it, and the tax does not move. So a whole
       * range of gift sizes scores identically, and the search reporting one of them as "the answer"
       * hides that the top of the range gives away tens of thousands more to reach the same figure.
       *
       * It is not nothing, though, and saying so would be the opposite error: every pound above the
       * window is a bet on outliving the seven years. Priced here at the survival date rather than
       * asserted, so the household can see both halves of the trade.
       */
      plateau: (() => {
        const ties = priced.map(c => ({ c, amt: givenBy(c) }))
          .filter(x => x.c.survived && Math.abs(x.c.net - best.net) < 1 && x.amt > given + 1000)
          .sort((a, b) => b.amt - a.amt)[0];
        if (!ties) return null;
        /*
         * What the extra would be worth if the seven years were survived: the same plan priced at a
         * death age past the gift's seventh anniversary, both sizes, and the difference between them.
         */
        const sevenAt = giftYear + 7;
        const ageAtSeven = clamp(baseCtx.ageSelf0 + (sevenAt - baseCtx.baseYear), 0, 120);
        const atAge = (amt, age) => {
          const p2 = { ...plan, inheritance: { ...inh, deathAge: age,
            gifts: [...(inh.gifts || []), { id: '__plateau', amount: amt, year: giftYear }] } };
          try {
            const c2 = buildContext(resolveMpaa(p2));
            const r2 = estateForPlanAt(p2, c2, simulateDeterministic(c2, 'expected'));
            return r2 ? r2.netWithGifts : null;
          } catch { return null; }
        };
        const hiLate = atAge(ties.amt, ageAtSeven), loLate = atAge(given, ageAtSeven);
        return {
          upTo: ties.amt, surplus: ties.amt - given,
          survivalAge: ageAtSeven, survivalYear: sevenAt,
          worthIfSurvived: (hiLate !== null && loLate !== null) ? Math.max(0, hiLate - loLate) : null
        };
      })(),
      liquidCeiling: (() => {
        if (bigger || given <= 0) return null;
        /*
         * Measured against what is liquid TODAY, because that is what the search builds its gift sizes
         * from. Measuring against the gift-year wrappers instead left this silent on exactly the
         * households it exists for: a year of growth makes them larger than the grid's own ceiling, so
         * "is this gift everything you have" answered no when the true answer was yes.
         */
        if (!(liquidToday > 0) || given < liquidToday - 1000) return null;
        const w = giftYearWrappersOf(baseline);
        const atGift = w ? w.isa + w.other + w.cash : liquidToday;
        return {
          liquid: liquidToday, given, left: Math.max(0, atGift - given),
          sum: [
            { k: 'Outside your pension today', v: gbp0(liquidToday) },
            { k: 'This gift takes', v: gbp0(given) },
            // measured in the gift year, not today: a year of growth is why giving "everything" still
            // leaves something, and the label has to say so or the two rows look like a contradiction
            { k: 'Left by then, after growth', v: gbp0(Math.max(0, atGift - given)) }
          ],
          note: 'anything more would have to be drawn from the pension and taxed on the way out'
        };
      })(),
      // and when nothing is given, the best gift that WAS tried and what it lost
      bestRejected: given > 0 ? null : (() => {
        const top = priced.filter(c => givenBy(c) > 0).sort((a, b) => b.net - a.net)[0];
        return top ? { amount: givenBy(top), cost: best.net - top.net } : null;
      })()
    };
  })();

  /*
   * THE £2M QUESTION, priced rather than asserted.
   *
   * "Why not keep gifting until the estate is under the taper threshold" is the first thing anyone asks
   * of an estate over it, and prose cannot settle it: the answer turns on how much band comes back
   * against how much is given away to get there, and those are pounds. So this is a ladder of gift
   * sizes the search ALREADY priced - no extra runs - showing for each one the estate it leaves, the
   * residence band that survives the taper, the tax, and what the heirs end up with.
   *
   * Only built for an estate the taper actually bites on. Below the threshold there is no question to
   * answer, and a table of identical rows would imply there was.
   */
  const taperLadder = (() => {
    const threshold = Math.max(0, num(plan.config.ihtRnrbTaperFrom, 2000000));
    if (!(num(baseline.est.grossEstate, 0) > threshold)) return null;
    if (!(num(baseline.est.rnrbTaperLoss, 0) > 0)) return null;      // nothing to win back
    const priced = [baseline, ...soloGifts, ...soloCompGifts, ...gifts, ...compGifts, ...compFirst, ...giftsAfterComp]
      .filter(c => c && c.est && c.survived);
    // one row per gift size, keeping the best-scoring candidate at that size
    const bySize = new Map();
    priced.forEach(c => {
      const amt = Math.round(givenBy(c) / 1000) * 1000;
      const cur = bySize.get(amt);
      if (!cur || c.net > cur.net) bySize.set(amt, c);
    });
    const all = [...bySize.entries()].sort((a, b) => a[0] - b[0])
      .map(([amt, c]) => ({
        amt, net: c.net, estate: num(c.est.grossEstate, 0), iht: num(c.est.iht, 0),
        rnrb: num(c.est.rnrb, 0), rnrbLost: num(c.est.rnrbTaperLoss, 0),
        under: num(c.est.grossEstate, 0) <= threshold
      }));
    if (all.length < 2) return null;
    const givenNow = Math.round(givenBy(best) / 1000) * 1000;
    /*
     * Six rows at most, chosen so the shape of the curve is visible rather than a slice of it: nothing,
     * the recommendation, the first size that actually clears the threshold if any does, the largest
     * priced, and two spread between to show which way it is heading.
     */
    const wanted = new Set([all[0].amt, givenNow, all[all.length - 1].amt]);
    const clears = all.find(r => r.under);
    if (clears) wanted.add(clears.amt);
    const mid = all.filter(r => !wanted.has(r.amt));
    if (mid.length) {
      wanted.add(mid[Math.floor(mid.length / 3)].amt);
      wanted.add(mid[Math.floor(2 * mid.length / 3)].amt);
    }
    const rows = all.filter(r => wanted.has(r.amt))
      .map(r => ({ ...r, recommended: r.amt === givenNow, cost: best.net - r.net }));
    /*
     * WHICH QUESTION IS ACTUALLY BEING ASKED. Three different states, and conflating them produced a
     * negative pound figure: when the recommended route ALREADY clears the line, the first row marked
     * `under` sits BELOW the recommendation, so "how much more must you give" came out as −£540,000 and
     * the card asked why you would not do something you were already doing.
     *
     * `clearing` is therefore searched above the recommendation only, and is null when the route is
     * already under - in which case there is nothing to weigh and the card says so instead.
     */
    const recRow = rows.find(r => r.recommended);
    const recommendedUnder = !!(recRow && recRow.under);
    const clearing = recommendedUnder ? null : (rows.find(r => r.under && r.amt > givenNow) || null);
    return {
      threshold, rows, recommendedUnder,
      clearing: clearing ? { amt: clearing.amt, extra: clearing.amt - givenNow, cost: clearing.cost } : null,
      reachable: !!clears,
      // what it would take to get there at all, when nothing priced does
      shortBy: clears ? 0 : Math.max(0, num(all[all.length - 1].estate, 0) - threshold),
      maxGift: all[all.length - 1].amt,
      bandAtStake: num(baseline.est.rnrbTaperLoss, 0)
    };
  })();

  /*
   * WHY NOT ONE OF THE OTHERS. The ranking says which strategies lost; it does not say what they were
   * or by how much, and a household asked to give away six figures is owed both. These are the routes a
   * person would actually have considered - do nothing, move money but give none away, give but change
   * nothing else, give everything you could - each priced on the same measure as the winner.
   */
  const alternatives = (() => {
    const noGift = givenBy(best) > 0 ? evaluate({ ...best, gift: 0, compGift: null, label: 'x' }) : null;
    const giftOnly = givenBy(best) > 0
      ? evaluate({ policy: plan.spending.decumulationPolicy, drawdown: plan.spending.drawdownStrategy,
          harvest: !!plan.config.harvestPersonalAllowance, ceiling: plan.config.harvestCeiling || 'pa',
          gift: num(best.gift, 0), compGift: best.compGift || null, split: null, recycle: null, label: 'y' })
      : null;
    const everything = [...soloGifts, ...soloCompGifts, ...gifts, ...compGifts, ...compFirst, ...giftsAfterComp]
      .filter(c => c.survived).map(c => ({ c, amt: givenBy(c) })).sort((a, b) => b.amt - a.amt)[0];
    // the winning route with only the draw-down ceiling flipped, so the comparison isolates that choice
    const otherCeiling = (() => {
      const flip = best.ceiling === 'basic' ? 'pa' : 'basic';
      const c = evaluate({ ...best, ceiling: flip, harvest: true, label: 'z' });
      return c && c.survived ? c : null;
    })();
    const out = [
      { key: 'nothing', label: 'Change nothing at all', net: baseline.net,
        why: 'the plan exactly as you have it now' },
      noGift && { key: 'nogift', label: 'Reallocate, but give nothing away', net: noGift.net,
        why: 'every change above except the gift - the withdrawal order, the nomination, the transfers' },
      giftOnly && { key: 'giftonly', label: 'Give the money away and change nothing else', net: giftOnly.net,
        why: 'the gift on its own, drawn from the plan as it stands' },
      everything && everything.amt > givenBy(best) + 1000 && { key: 'max', label: `Give away as much as the plan can stand (${gbp0(everything.amt)})`, net: everything.c.net,
        why: 'the largest gift that still leaves you solvent to the end' },
      /*
       * The ceiling, which was missing and is the LARGEST lever on some households - worth £50,755 on
       * one of the scenarios this list is written for, and never named in it. Without a row the reader
       * is shown a gift they must decide about and no sign that the bigger choice was even considered.
       */
      otherCeiling && { key: 'ceiling',
        label: (best.ceiling === 'basic' ? 'Stop drawing the pension at the personal allowance' : `Draw the pension to the ${gbp0(P.higherRateStartsAt)} basic-rate limit`),
        net: otherCeiling.net,
        why: best.ceiling === 'basic'
          ? 'draw less each year and pay no income tax on it, leaving more in the pension to be taxed on death'
          : 'draw more each year, pay 20% now, and move it out of the pension before it is taxed twice' }
    ].filter(Boolean)
      .map(x => ({ ...x, cost: best.net - x.net }))
      .filter(x => Math.abs(x.cost) > 500)
      .sort((a, b) => a.cost - b.cost)
      // where no reallocation was recommended, "change nothing" and "reallocate but do not gift" are the
      // same plan under two names; listing both invents a choice that was never there
      .filter((x, i, all) => all.findIndex(y => Math.abs(y.net - x.net) < 500) === i);
    return out.length ? out : null;
  })();

  const ranked = [baseline, ...orders, ...ceilings, ...soloGifts, ...soloNoms, ...soloRecycles, ...soloCompGifts,
    ...gifts, ...noms, ...recycles, ...compGifts, ...compFirst, ...giftsAfterComp]
    .filter(viable)
    .sort((a, b) => b.net - a.net)
    .filter((c, i, all) => i === 0 || Math.abs(c.net - all[i - 1].net) > 1)   // drop exact duplicates
    .slice(0, 8)
    .map(c => ({ label: c.label, net: c.net, iht: c.est.iht, incomeTax: c.est.incomeTaxOnPensions,
      qsrRelief: c.est.qsrRelief,
      policy: c.policy, drawdown: c.drawdown, harvest: c.harvest, ceiling: c.ceiling, gift: c.gift,
      split: c.split || null, recycleKey: c.recycleKey || null, compGift: c.compGift || null }));

  return {
    deathAge, runs, liquidToday, giftYear, compensationWindow: compWin, exemptCompensation: compAmount,
    compensationLeftToGive: compLeft,
    /*
     * What the plan holds in the gift year, before any gift, so the action plan can say which account a
     * gift should come out of and what the shortfall costs to withdraw. Carried as four numbers rather
     * than the whole projection: the caller needs the wrappers, not the rows.
     */
    giftYearWrappers: (() => {
      const r = (baseline.rows || []).find(x => x.year === giftYear);
      // taxable income, not the pot: totalSelf is a balance, and using it read every withdrawal as
      // additional-rate. State pension plus whatever taxable pension income the year already draws.
      return r ? { isa: r.isas, other: r.other, cash: r.cash, pen: r.pensions,
        income: num(r.spSelf, 0) + num(r.taxablePensionSelf, 0) } : null;
    })(),
    /*
     * How much of each band is actually free, across the years the household is alive to use it.
     *
     * The withdrawal order's first step is "pension income up to whatever is left of the personal
     * allowance". For anyone with a state pension and post-retirement earnings there is nothing left,
     * and the step is a no-op the engine skips - correctly, it has always measured the ceiling against
     * the year's taxable income. But the instruction still read as something to go and do. Measuring it
     * here lets the action plan say so instead of leaving the household to work it out.
     *
     * The maximum over the drawdown years, not one year's: a band that opens up later (earnings stop,
     * a fixed-term annuity ends) makes the step live, and reporting a single year would hide that.
     */
    bandHeadroom: (() => {
      /*
       * t === 0 is excluded: it is the stub between the valuation date and the next tax-year start, so
       * its income is pro-rated and its apparent headroom is the part of the year that has not happened
       * yet, not an allowance going spare. Left in, a household with £22,500 of income every full year
       * was told it had £5,789 of personal allowance free - the one case this measurement exists to
       * rule out.
       */
      const rows = (baseline.rows || []).filter(r => r.t > 0 && r.ageSelf >= baseCtx.owners[0].retireAge && r.ageSelf <= deathAge);
      if (!rows.length) return null;
      const other = (r) => num(r.otherTaxableSelf, 0) + num(r.otherTaxablePart, 0);
      // the ceilings are on the year's whole taxable income (pensionCeiling): the row's interest and dividends count too
      const above = (r) => [num(r.savingsInterestSelf, 0) + num(r.savingsInterestPart, 0), num(r.giaDividendsSelf, 0) + num(r.giaDividendsPart, 0)];
      const pa = Math.max(0, ...rows.map(r => pensionCeiling(P, P.pa, other(r), ...above(r)) - other(r)));
      const basic = Math.max(0, ...rows.map(r => pensionCeiling(P, P.higherRateStartsAt, other(r), ...above(r)) - other(r)));
      const typical = other(rows[Math.min(1, rows.length - 1)]);
      return { pa: Math.max(0, pa), basic: Math.max(0, basic), otherIncome: typical };
    })(),
    baseline: { label: baseline.label, net: baseline.net, iht: baseline.est.iht,
      incomeTax: baseline.est.incomeTaxOnPensions, qsrRelief: baseline.est.qsrRelief, qsrPct: baseline.est.qsrPct },
    best: { label: best.label, net: best.net, iht: best.est.iht, incomeTax: best.est.incomeTaxOnPensions,
      policy: best.policy, drawdown: best.drawdown, harvest: best.harvest, ceiling: best.ceiling,
      gift: best.gift, split: best.split || null, splitShares: best.splitShares || null,
      recycle: best.recycle || null, recycleKey: best.recycleKey || null, compGift: best.compGift || null,
      recycleLabel: best.recycleKey ? (RECYCLES.find(r => r.key.join('+') === best.recycleKey) || {}).label : null },
    gain: best.net - baseline.net,
    // the winner's own priced estate, so the tab can show the working for what it is RECOMMENDING
    // rather than only for the plan as it stands
    bestEst: best.est, baselineEst: baseline.est, giftRationale, alternatives, taperLadder,
    /*
     * NOTHING TO OPTIMISE, and which of the two reasons it is.
     *
     * A household that spends its pot before the death age leaves nothing, so every candidate scores
     * zero and every tile on the tab reads £0 - which looks like a broken screen rather than a finding.
     * A household whose estate sits inside its own allowances has a real estate but no tax to save, so
     * every candidate scores the SAME and the search has nothing to offer either. Different facts,
     * both worth saying, and neither was said.
     *
     * Both are reported with their arithmetic, and either can be true on its own.
     */
    nothingToLeave: (() => {
      const ranOut = baseline.survived === false;
      const allow = num(baseline.est.nrb, 0) + num(baseline.est.rnrb, 0);
      const noTax = num(baseline.est.iht, 0) <= 0 && num(baseline.est.incomeTaxOnPensions, 0) <= 0;
      if (!ranOut && !noTax) return null;
      return {
        ranOut, noTax, failAge: baseline.failAge || null, deathAge,
        potAtDeath: Math.max(0, num(baseline.row ? baseline.row.totalCombined : 0, 0)),
        sum: ranOut
          ? [{ k: 'Your plan runs short at age', v: String(baseline.failAge || '?') },
             { k: 'You said you die at', v: String(deathAge) },
             { k: 'Left in the pot at that age', v: gbp0(0) },
             { k: 'So there is nothing to pass on', v: 'and nothing a tax choice can change' }]
          : [{ k: 'Your estate at death', v: gbp0(num(baseline.est.grossEstate, 0)) },
             { k: 'Allowances cover', v: gbp0(allow) },
             { k: 'Inheritance tax due', v: gbp0(num(baseline.est.iht, 0)) },
             /*
              * Precise rather than sweeping. "Nothing to save" was wrong: with no inheritance tax to
              * play for the search can still be worth thousands, because the withdrawal order changes
              * the INCOME tax paid while alive and so the size of the pot that is left. Saying
              * otherwise next to a non-zero gain is the kind of contradiction that costs a reader
              * their trust in every other figure on the page.
              */
             { k: best.net - baseline.net > 500 ? 'Still worth' : 'Nothing to gain', v: best.net - baseline.net > 500
               ? gbp0(best.net - baseline.net) + ' — from income tax while you are alive, not from the estate'
               : 'every route leaves the same amount' }]
      };
    })(),
    /*
     * Disclosed, not enforced. The route is affordable for as long as the household said it would live,
     * which is the test it is now held to - but if it leaves the wider plan short afterwards the tab says
     * so and names both ages, because the death age is an assumption and this is what rests on it.
     * Reported only when the baseline would have lasted: a plan already short at that age is the plan's
     * problem, not something this recommendation did.
     */
    afterDeath: (best.deathAge && best.fullSurvived === false && baseline.fullSurvived !== false)
      ? { failAge: best.fullFailAge, deathAge: best.deathAge, terminalAge: baseCtx.terminalAge } : null,
    levers, reasons, ranked, charity: withCharity, spread,
    spreadYears: num(plan.config.inheritedPensionSpreadYears, 5)
  };
}

/*
 * WHAT FOLLOWING THIS POLICY ACTUALLY MEANS, IN ORDER.
 *
 * Generated from the policy's own `steps`, `costSteps`, `depositOrder` and `harvest` rather than
 * written out per policy. Hand-written copy drifts: the Config tab explained the selected policy with a
 * ternary covering three cases, and adding a fourth would have described one strategy while running
 * another. Deriving it means the instructions cannot say something the engine does not do.
 */
const WRAPPER_PHRASE = {
  pen: 'your pension', isa: 'your ISAs', other: 'your general investment account', cash: 'your cash savings',
  /*
   * "up to the personal allowance" reads as though a whole allowance is waiting, and for anyone with a
   * state pension or post-retirement earnings most of it is already spent. The engine has always
   * measured the ceiling against the year's taxable income, so the step draws nothing when there is no
   * room - the phrasing is what implied otherwise.
   */
  penPA: 'pension income up to whatever is left of the personal allowance',
  penBasic: 'pension income up to whatever is left of the basic-rate band',
  penAny: 'the pension, at whatever tax rate applies'
};
const phraseFor = (tok) => WRAPPER_PHRASE[tok] || tok;

// Whether the plan holds a cost the lookahead could prepare for: a one-off cost, or a planned gift,
// which buildContext folds into the same map.
const planHasKnownCost = (plan) => (plan?.oneOffCosts || []).some(c => num(c.amount, 0) > 0) || (plan?.inheritance?.gifts || []).some(g => num(g.amount, 0) > 0);

function policyPlaybook(policyKey, P, opts = {}) {
  const pol = DECUMULATION_POLICIES[policyKey];
  if (!pol) return [];
  /*
   * The guardrails are a rule the household follows, not just one the simulation does, so when they are
   * on the playbook says how - in the same plain steps as the drawdown order, and without a plan figure,
   * because the rate is theirs to work out each year from that year's numbers.
   */
  const guardrailStep = opts.guardrails ? {
    title: 'Each year, before you decide how much to take',
    body: `Divide what you plan to draw from the pots this year by what the pots are worth today. If that rate is more than ${Math.round(GUARDRAILS.band * 100)}% above where it stood the first year you drew, take ${Math.round(GUARDRAILS.cut * 100)}% less than planned this year. If it is more than ${Math.round(GUARDRAILS.band * 100)}% below, take ${Math.round(GUARDRAILS.raise * 100)}% more.`,
    detail: `After any year the pots fell, skip the inflation rise and do not make it up later. In the last ${GUARDRAILS.freezeYears} years of the plan, never cut. When the plan itself changes what you draw - the State Pension starting, a spending band beginning - measure from that new footing rather than the first year's.`
  } : null;
  /*
   * The cost lookahead is likewise a rule the household follows with a calendar in hand, so it gets a
   * step naming the horizon and the ceiling, and no figure, since the shortfall is theirs to re-measure
   * each year against the balances they actually have.
   */
  const lookaheadStep = opts.lookahead > 0 ? {
    title: `Each year, look ${opts.lookahead} year${opts.lookahead === 1 ? '' : 's'} ahead for a one-off cost`,
    body: `For every large cost you know is coming inside that window, set today's cash, GIA and ISA balances against it, grown at the rate they earn. Whatever would still be short, divide by the years left until it lands and take that share from the pension this year, on top of the living draw, but only while your total taxable income stays under ${formatGBP(P.higherRateStartsAt)}. Put it in the ISA up to the allowance and the rest in cash.`,
    detail: 'Re-measure every year rather than following a schedule: a good year in the markets shrinks the shortfall and a bad one grows it. Once the cost has been paid, stop. If the living draw already reaches the basic-rate limit there is no room, and the rule correctly does nothing.'
  } : null;
  const list = (steps) => steps.map(phraseFor);
  const out = [];

  out.push({
    title: 'Each year, to cover your spending',
    body: `Take from ${list(pol.steps).join(', then ')}. Stop as soon as the year's spending is covered — everything further down the list is left untouched.`,
    detail: pol.steps.includes('penPA')
      ? `The two pension steps are ceilings on TOTAL taxable income for the year, not on the pension alone: ${formatGBP(P.pa)} for the first and ${formatGBP(P.higherRateStartsAt)} for the second. A state pension, post-retirement earnings or any other taxable income counts towards them first, so where those already exceed ${formatGBP(P.pa)} the first step draws nothing at all and the order moves straight on. The year's interest and dividends count too: they are taxed above the pension, so each step stops short of its figure by whatever a larger draw would push into tax or into the next band.`
      : 'This policy does not manage tax bands: each wrapper is emptied before the next is touched.'
  });
  if (guardrailStep) out.push(guardrailStep);
  if (lookaheadStep) out.push(lookaheadStep);

  out.push({
    title: 'When a one-off cost lands',
    body: `Fund it from ${list(pol.costSteps || DEFAULT_COST_STEPS).join(', then ')}.`,
    detail: (pol.costSteps || DEFAULT_COST_STEPS)[0] === 'isa'
      ? 'Reaching for the ISA first avoids selling investments at a gain to pay for it, which is what makes a lump-sum cost expensive in a year you had not planned to realise one.'
      : 'A lump-sum cost lands in a single tax year, so it can push pension income through a band or realise a year of gains at once. That is why it has its own order.'
  });

  out.push({
    title: 'When money arrives — an inheritance, a windfall, a sale',
    body: pol.depositOrder
      ? `Put it into ${list(pol.depositOrder).join(', then ')}, taking the first that still has room this year.`
      : `Choose the wrapper yourself, or mark the deposit "${AUTO_DEPOSIT}" and it goes to ${list(DEFAULT_DEPOSIT_ORDER).join(', then ')} — the first with room.`,
    detail: 'Room means the annual allowance left: £20,000 a year for ISAs, and for pensions whatever your annual allowance and earnings permit. The GIA has no limit, so it takes whatever does not fit.'
  });

  if (pol.harvest) {
    out.push({
      title: 'Each year once the pension is accessible',
      body: `If you have not used your ${formatGBP(P.pa)} personal allowance, draw that much pension income anyway and move it straight into an ISA (or cash once the ISA is full).`,
      detail: 'It costs no tax to take, and it moves money out of a wrapper that will be taxed on the way out into one that will not. Switched on and off in Config as "harvest the personal allowance".'
    });
  }

  out.push({
    title: 'What this policy is trying to do',
    body: pol.blurb ? pol.blurb(P) : '',
    detail: null
  });
  return out.filter(x => x.body);
}

/*
 * WHAT TO ACTUALLY DO, IN THE ORDER TO DO IT.
 *
 * The optimiser's answer is a label - "Bracket Fill, lump sum, harvest on + pension 5/65/30" - and a
 * label is not an instruction. This turns the winning allocation into the actions a person takes, each
 * one naming the thing they have to open, the figure they have to enter and the year they have to do it
 * in. Written from the result rather than from a template, so it cannot describe a plan the search did
 * not choose.
 *
 * Only what CHANGES appears. An action list that restates what the household already does buries the
 * two things they have to go and arrange among six things they do not.
 */
function estateActionPlan(plan, result) {
  if (!result || !result.best) return [];
  const c = { ...DEFAULT_CONFIG, ...(plan?.config || {}) };
  const P = taxParams(c);
  const gbp = (x) => '£' + fmtNum(Math.round(x));
  const b = result.best, base = result.baseline;
  const out = [];

  /*
   * A step the plan already holds is not a step. The order and the ceiling drop out on their own by
   * comparing against the plan; the gifts and the transfers were written with random ids and so never
   * did, which left the list telling a household to make a gift it had already made. Declared up here
   * because the transfers are step 3 and the gifts are step 5.
   */
  const heldGift = (id) => (plan?.inheritance?.gifts || []).some(g => g.id === id);
  const heldRecycle = (b.recycle || []).length > 0
    && (b.recycle || []).every(x => (plan?.oneOffContributions || []).some(c => c.id === x.id));

  // 1. the withdrawal order, in the words of the policy itself rather than its name
  const orderChanged = b.policy !== plan?.spending?.decumulationPolicy
    || b.drawdown !== plan?.spending?.drawdownStrategy
    || !!b.harvest !== !!plan?.config?.harvestPersonalAllowance;
  if (orderChanged) {
    const play = policyPlaybook(b.policy, P);
    /*
     * A step that draws nothing is not a step to follow. "Pension income up to whatever is left of the
     * personal allowance" is the first instruction in most orders, and for a household with a state
     * pension and post-retirement earnings there is nothing left of it: the engine has always skipped
     * the step, but the chip still read as something to go and do, and it was being read that way.
     *
     * So the measured headroom is put into the words. A live band keeps its figure; a band already
     * spent says so and says by what, which is the fact the household needs in order to agree with it.
     */
    const hr = result.bandHeadroom;
    const stepPhrase = (tok) => {
      if (!hr) return phraseFor(tok);
      if (tok === 'penPA') {
        return hr.pa > 0
          ? `pension income up to the ${gbp(P.pa)} personal allowance (${gbp(hr.pa)} of it free)`
          : `pension income up to the personal allowance — nothing free, your other income already uses it`;
      }
      if (tok === 'penBasic') {
        return hr.basic > 0
          ? `pension income up to the ${gbp(P.higherRateStartsAt)} basic-rate limit (${gbp(hr.basic)} of it free)`
          : `pension income up to the basic-rate limit — nothing free, your other income already uses it`;
      }
      return phraseFor(tok);
    };
    const steps = (DECUMULATION_POLICIES[b.policy] || { steps: [] }).steps;
    out.push({
      key: 'order', group: 'reallocate',
      /*
       * "Draw money in this order" never said where to. A household reading it next to the step below -
       * which draws pension income and moves it into an ISA - cannot tell whether this is money to live
       * on or money being shuffled between wrappers, and those are opposite actions. The title names
       * the purpose and the first fact names the destination.
       */
      title: 'Each year, take the money you live on in this order',
      // the order IS the instruction, so it is a sequence to be read at a glance, not a sentence to parse
      sequence: steps.map(stepPhrase),
      facts: [
        { k: 'Where it goes', v: 'your bank account, to spend — this step is not moving money between wrappers' },
        ...(hr && steps.includes('penPA')
          ? [{ k: 'Other income', v: `${gbp(hr.otherIncome)} a year before any pension — state pension, earnings and anything else taxable. Both ceilings above are measured after it.` }]
          : []),
        { k: 'Tax-free cash', v: b.drawdown === 'Full 25% Lump Sum' ? 'take it all in one lump' : 'take it a slice at a time' }],
      why: 'Work down the list until the year\u2019s spending is covered, then stop. Everything below is left where it is.',
      /*
       * No prose restatement of the list. `body` used to spell the same six steps out again as a
       * sentence - and did it in the wording the steps carried BEFORE they were given their measured
       * headroom, so the fold contradicted the list it sat under.
       */
      detail: 'Nothing to arrange with anyone: it is how you choose which account to sell from each year. The Config tab explains the order in full.'
    });
  }

  // 2. the draw-down ceiling, which is a standing instruction rather than a one-off
  if ((b.ceiling || 'pa') !== (plan?.config?.harvestCeiling === 'basic' ? 'basic' : 'pa')) {
    out.push({
      key: 'ceiling', group: 'reallocate',
      /*
       * Named by where the money ENDS UP, so it cannot be confused with the step above it. Both used
       * the word "draw" and only one of them meant spending; this one is a transfer between your own
       * wrappers and the title should say so before the facts do.
       */
      title: b.ceiling === 'basic'
        ? `Each year, move pension into your ISA — up to the ${gbp(P.higherRateStartsAt)} band`
        : `Stop drawing pension income at ${gbp(P.pa)} a year`,
      // the title carries the band, so the facts carry what it does not: the cost, and the destination
      facts: b.ceiling === 'basic'
        ? [{ k: 'Tax on it', v: `${num(c.basicTaxRate, 20)}% — this is the cost of moving it` },
           { k: 'Put the net into', v: `your ISA, up to ${gbp(P.isaAllowance)} a year, then your GIA` }]
        : [{ k: 'Each year', v: `stop once your taxable income reaches ${gbp(P.pa)}` }],
      why: b.ceiling === 'basic'
        ? `From ${num(c.pensionsInEstateFrom, 2027)} a pension left behind is taxed twice — by your estate at ${num(c.ihtRate, 40)}%, then by whoever inherits it at their own rate. Paying ${num(c.basicTaxRate, 20)}% now beats both.`
        : 'Drawing past the personal allowance costs tax today for a benefit that may never arrive.',
      detail: b.ceiling === 'basic'
        ? `It stops being worth it if you die before ${num(c.pensionIncomeTaxFromAge, 75)}, when an inherited pension carries no income tax at all.`
        : `It only arrives if you die at ${num(c.pensionIncomeTaxFromAge, 75)} or over, and you would have paid the tax either way.`
    });
  }

  // 3. the transfers, with the figures and the years spelled out
  if (b.recycle && b.recycle.length && !heldRecycle) {
    const years = [...new Set(b.recycle.map(x => x.year))].sort();
    const own = b.recycle.filter(x => x.transferredFrom !== 'External');
    const relief = b.recycle.filter(x => x.transferredFrom === 'External');
    const sum = (list) => list.reduce((t, x) => t + num(x.amount, 0), 0);
    /*
     * The per-year figure is only quotable as "a year" when it really is the same every year - the
     * allowance and what is spare both move. Where it varies, the total and the first year are the two
     * numbers that can be acted on without lying about the rest.
     */
    const level = own.length > 0 && own.every(x => Math.abs(num(x.amount, 0) - num(own[0].amount, 0)) < 1);
    const eachOwn = level ? `${gbp(own[0].amount)} a year` : `${gbp(sum(own))} in total, starting with ${gbp(own[0].amount)} in ${own[0].year}`;
    const nameOf = (label) => WRAPPER_PHRASE[Object.keys(CATEGORY_LABEL).find(k => CATEGORY_LABEL[k] === label)] || label;
    out.push({
      key: 'recycle', group: 'reallocate',
      title: relief.length
        ? `Pay ${eachOwn} into your pension`
        : `Move ${eachOwn} into ${nameOf(own.length ? own[0].category : CATEGORY_LABEL.isa)}`,
      // the title already carries the amount and the destination, so the facts carry the rest
      facts: [
        { k: 'From', v: nameOf(own.length ? own[0].transferredFrom : CATEGORY_LABEL.other) },
        { k: 'When', v: years.length > 1 ? `each year, ${years[0]} to ${years[years.length - 1]}` : String(years[0]) },
        ...(relief.length ? [{ k: 'HMRC adds', v: `${level ? gbp(relief[0].amount) + ' a year' : gbp(sum(relief))}, so ${gbp(sum(own) + sum(relief))} lands for ${gbp(sum(own))} of your own money` }] : [])
      ],
      why: relief.length
        ? 'Basic-rate relief is added whether or not you paid tax, which is why this is worth doing at all.'
        : `Sheltered from tax from then on, up to the ${gbp(P.isaAllowance)} an ISA can take.`,
      detail: relief.length
        ? `The amount is capped by your annual allowance - if you have already taken taxable pension income the limit is the ${gbp(P.mpaaLimit)} money purchase annual allowance, and the figure above already respects it.`
        : `Capped by the ${gbp(P.isaAllowance)} a year an ISA can take. Selling to do it can realise a capital gain, which the projection has already charged.`
    });
  }

  // 4. the nomination, which is a different form from a will and the one people forget
  if (b.split && b.splitShares) {
    const list = b.splitShares.filter(x => x.pct > 0).map(x => `${x.pct}% to ${x.name || 'that heir'}`).join(', ');
    const dropped = b.splitShares.filter(x => x.pct === 0).map(x => x.name || 'one heir');
    out.push({
      key: 'nomination', group: 'reallocate',
      title: `Nominate the pension ${list}`,
      // the title states the split; "Set it to" said it again, and `detail` opened on `why` verbatim
      facts: [
        { k: 'The form', v: 'beneficiary nomination — often called an expression of wish' },
        { k: 'Ask', v: 'each pension provider separately' },
        ...(dropped.length ? [{ k: 'Nothing to', v: `${dropped.join(' or ')} from the pension — they keep their share of everything else` }] : [])
      ],
      why: 'Your pension does not pass under your will, and your will cannot override this form.',
      detail: 'The single most valuable change on the list, because an inherited pension is taxed at the rate of whoever receives it — and the one that costs nothing to make.'
    });
  }

  /*
   * WHERE THE MONEY COMES FROM. "Give away £900,000" is not an instruction anyone can follow while
   * holding £575,000 outside a pension: the rest has to be withdrawn as income first, and at the
   * marginal rate that is the most expensive pound in the plan. The optimiser already prices that - it
   * is why the best answer is usually smaller than the whole award - but the action has to say it, or
   * the household finds out at the bank.
   */
  const giftYearRow = result.giftYearWrappers;
  /*
   * WHERE THE MONEY COMES FROM, as a table rather than a sentence.
   *
   * "Give away £900,000" is not an instruction anyone can follow while holding £575,000 outside a
   * pension: the rest has to be withdrawn as income first, and at the marginal rate that is the most
   * expensive pound in the plan. The optimiser already prices that - it is why the best answer is
   * usually smaller than the whole award - but the action has to say it, or the household finds out
   * at the bank.
   *
   * It walks the policy's OWN cost order. The sentence this replaces sorted the wrappers by size,
   * largest first, and so named an order the projection never used: a gift is funded as a one-off
   * cost through ctx.costSteps, which is cash then the general investment account then ISAs then the
   * pension, for every policy in the table. Telling a household to sell their ISA first when the
   * model sold their cash first is a small lie that a table makes impossible to keep.
   */
  const GIFT_COST_ORDER = (DECUMULATION_POLICIES[b.policy] || {}).costSteps || DEFAULT_COST_STEPS;
  const SOURCE_LABEL = { cash: 'Cash savings', other: 'General investment account', isa: 'ISAs' };
  const fundingTable = (amount) => {
    if (!giftYearRow || !(amount > 0)) return null;
    let left = amount;
    const rows = [];
    for (const step of GIFT_COST_ORDER) {
      if (!SOURCE_LABEL[step]) continue;                      // the pension steps are handled below
      const bal = Math.max(0, num(giftYearRow[step], 0));
      if (bal <= 1) continue;
      const taken = Math.min(left, bal);
      rows.push({ source: SOURCE_LABEL[step], balance: bal, taken, left: bal - taken });
      left -= taken;
    }
    /*
     * The pension row exists only when the liquid wrappers fall short, and it is the one row where
     * "taken" and "delivered" differ: the gift is the NET, so the withdrawal has to be grossed up at
     * the marginal rate on top of whatever income the year already carries.
     */
    let pension = null;
    if (left > 1) {
      const rate = marginalRateAt(num(giftYearRow.income, 0) + left, c);
      pension = { net: left, gross: rate < 1 ? left / (1 - rate) : left, ratePct: Math.round(rate * 100) };
    }
    const covered = rows.reduce((t, r) => t + r.taken, 0);
    return { total: amount, rows, pension, coveredFromLiquid: covered };
  };
  /*
   * One table where there are two gifts, because they come out of the same accounts and cannot both
   * spend the same ISA pound. It is attached to the first gift card and its total is the pair, which
   * is why the total row is labelled rather than assumed to match the title above it.
   */
  const fundingFor = (own, combined) => {
    const t = fundingTable(combined);
    return t ? { ...t, covers: combined > own + 1 ? 'both gifts together' : null } : null;
  };

  // 5. the gift
  if (b.gift > 0 && !heldGift(`estate_gift_${result.giftYear}`)) {
    out.push({
      key: 'gift', group: 'gift',
      // the title carries the amount and the year, so no fact repeats either
      title: `Gift ${gbp(b.gift)} in ${result.giftYear}`,
      facts: [{ k: 'Record', v: 'the date, the amount and who received it — your executors need all three' }],
      fundingTable: fundingFor(b.gift, b.gift + (b.compGift ? num(b.compGift.amount, 0) : 0)),
      why: `Out of your estate from the day you give it for the ${gbp(num(c.ihtRnrbTaperFrom, 2000000))} residence-allowance test; seven years to leave it entirely.`,
      detail: 'It leaves your plan that year, so it is money you no longer have to live on. A pound of ISA or investment money leaves at face value; a pension pound has to be drawn as income first, which is why the amount suggested is usually less than everything you could give.'
    });
  }

  // 5b. the compensation gift, which has a deadline nothing else here has
  if (b.compGift && !heldGift(`estate_comp_${b.compGift.year}`)) {
    const w = result.compensationWindow;
    const more = num(result.compensationLeftToGive, 0) > num(b.compGift.amount, 0) + 1;
    out.push({
      key: 'compGift', group: 'gift',
      // amount and deadline both live in the title; the facts below add only what it does not say
      title: `Gift ${gbp(b.compGift.amount)} of the compensation${w ? ` before ${w.endDate}` : ` in ${b.compGift.year}`}`,
      facts: [
        ...(more ? [{ k: 'Of the award', v: `${gbp(result.compensationLeftToGive)} is still giftable under the window` }]
                 : [{ k: 'Of the award', v: 'all that is left of it' }]),
        { k: 'Record', v: 'what the payment was and when you received it' }
      ],
      fundingTable: b.gift > 0 ? null : fundingFor(num(b.compGift.amount, 0), num(b.compGift.amount, 0)),
      why: 'Inside the window it uses no allowance and starts no seven-year clock. After it, an ordinary gift that eats your nil-rate band and needs you to survive seven years.',
      detail: (more
        ? `Giving more than this is possible but costs more than it saves, because the balance would have to come out of the pension. `
        : '')
        + (w ? `The window is two years from the day you were paid, or from 4 December 2025 if you were already holding it when the relief was announced. ` : '')
        + 'Worth doing because the money would otherwise be spent before it could be left to anyone.'
    });
  }

  /*
   * No paperwork step. It told every household to leave a note with the will saying where the
   * nomination form and the gift record are kept - true, untailored, and the same words whatever the
   * search found. A step that never varies is not a finding, and it was taking a numbered slot from
   * the ones that are.
   */

  if (!out.length) {
    out.push({
      key: 'none', group: 'reallocate',
      title: 'Nothing to change',
      body: `The search could not beat what you already have: ${gbp(base.net)} to your heirs.`,
      detail: 'That is a finding, not a failure. Some households are already holding the best allocation available to them.'
    });
  }
  return out;
}

/*
 * ==========================================================================================
 * THE AGE AGAINST THE SPENDING, AS A GRID.
 * ==========================================================================================
 *
 * The two solved answers - the most you could spend, the earliest you could retire - are the same
 * question asked from two ends, and each is one number. A number is a poor answer to a trade: it says
 * what you could do at the age you happened to enter, and nothing about what a year either way is worth.
 * This runs the plan at every combination of a retirement age and a spending level and reports the
 * survival rate of each, so the trade can be read off a picture rather than inferred from two figures.
 *
 * THREE THINGS MAKE IT AFFORDABLE.
 *
 * One path set per ROW. Every cell in a row is the same plan at the same retirement age, differing only
 * in how much is drawn - which `runTrial` already takes as an override - so the context is built once
 * and the gaussian draws are made once for the whole row. Drawing 1,000 paths costs 4ms and running a
 * cell costs 292ms, so this is not the saving it looks like; what it buys is that neighbouring cells
 * differ by the PLAN rather than by luck, which is what makes the grid readable at all.
 *
 * A row per worker. Rows are independent, so the pool runs as many abreast as there are cores.
 *
 * A small window. Eight ages by eight spends around what you entered is 64 cells; the whole 15-by-12
 * board is 180 and is what "wider" is for.
 *
 * WHAT IS NOT DONE: pruning. Survival can only fall as spending rises, so in principle every cell
 * cheaper than one reading 100% must also be 100% and could be filled without running. Measured over
 * the 180-cell board that skipped 11 cells - 6% - in exchange for an assumption about the engine's
 * monotonicity that nothing else here relies on. Not worth it: every cell is a real run.
 */

/*
 * A round number near the asked-for size, so the columns are £5,000 apart on a £50,000 plan and £2,000
 * apart on a £20,000 one. A fixed step would give the first household eight columns covering a tenth of
 * its range and the second a grid where every cell is identical.
 */
const NICE_STEPS = [250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000];
function niceStep(x) {
  for (const s of NICE_STEPS) if (x <= s * 1.25) return s;
  return NICE_STEPS[NICE_STEPS.length - 1];
}

/*
 * The window: your own age and your own spending are IN it, and so is the answer.
 *
 * Centring the columns on the entered spending alone is what the first version did, and on a plan that
 * is comfortably inside its means every cell came back green - a table that says nothing, because the
 * interesting edge was two columns off the right of it. So the columns are spanned between the spending
 * ENTERED and the safe maximum SOLVED for that age, which are the two numbers the cards above the grid
 * carry: whichever is larger sets the right-hand end, whichever is smaller the left, and the step is
 * chosen so that eight columns cover both with room either side. Where the solved figure is not known
 * yet, the entered spending is used alone and the window is recomputed when it arrives.
 */
function gridWindow(ctx, { rowsBefore = 4, rowsAfter = 3, cols = 8, step = null, anchor = null } = {}) {
  const age0 = Math.round(num(ctx.owners?.[0]?.age0 ?? ctx.currentAge, 40));
  const planned = Math.round(num(ctx.owners?.[0]?.retireAge, age0 + 20));
  const terminal = Math.round(num(ctx.terminalAge, 100));
  const lo = Math.max(age0, planned - rowsBefore);
  const hi = Math.min(terminal - 1, Math.max(lo + 1, planned + rowsAfter));
  const ages = [];
  for (let a = lo; a <= hi; a++) ages.push(a);

  const target = Math.max(1000, Math.round(num(ctx.targetSpend, 30000)));
  const other = anchor && anchor > 0 ? Math.round(anchor) : target;
  const from = Math.min(target, other), to = Math.max(target, other);
  /*
   * A margin each side of the pair, so the window shows what is beyond the answer as well as the answer:
   * two columns where there are eight or more, one on the phone's five. `cols` columns must then cover
   * the gap plus twice the margin, which is step >= (to - from) / (cols - 1 - 2 * margin). Scaling the
   * margin with the count matters - fixed at two, a five-column window had nothing left to divide by and
   * fell back to a £10,000 step on a plan whose whole range was £8,500 wide.
   *
   * The floor keeps a plan whose two figures are almost equal from collapsing to a step of nothing.
   */
  const margin = cols >= 8 ? 2 : 1;
  const st = step || niceStep(Math.max(target * 0.06, (to - from) / Math.max(1, cols - 1 - 2 * margin)));
  const base = Math.max(st, Math.round(from / st) * st - margin * st);
  const spends = [];
  for (let i = 0; i < cols; i++) spends.push(base + i * st);
  return { ages, spends, step: st, planned, target, age0, anchor: anchor || null };
}

/*
 * One row: the same plan at one retirement age, run at each spending level on one draw of paths. The
 * caller passes a plan (a worker cannot be handed a context) or a context (the main-thread fallback
 * already has one).
 */
function spendRow(planOrCtx, { spends, trials = 1000, seed = 12345 } = {}) {
  const ctx = planOrCtx && planOrCtx.P ? planOrCtx : buildContext(planOrCtx);
  const paths = pathsForSeed(seed, trials, ctx.totalYears);
  return spends.map(spend => {
    let lived = 0, preNmpa = 0;
    for (const zs of paths) {
      const r = runTrial(ctx, zs, spend);
      if (r.survived) lived++; else if (r.preNmpaFailed) preNmpa++;
    }
    return { spend, rate: (lived / trials) * 100, preNmpa: (preNmpa / trials) * 100 };
  });
}

/*
 * Where the row crosses the target, read between the two cells that straddle it.
 *
 * NOT the solver. `optimizeSpend` bisects to the pound and costs about ten runs of its own, which is
 * three seconds per row - more than the row itself. Interpolating between neighbouring cells lands
 * within a few hundred pounds of the solved figure on a £5,000 step (£58,750 against a solved £58,500
 * on the household this was measured against), and the card above the grid still carries the solved
 * number for the age you actually entered. The line is labelled as read off the cells, because it is.
 */
function frontierSpend(row, targetRate = 90) {
  const cells = [...row].sort((a, b) => a.spend - b.spend);
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].rate >= targetRate) continue;
    if (i === 0) return null;                                  // even the cheapest column misses
    const lo = cells[i - 1], hi = cells[i];
    const span = lo.rate - hi.rate;
    if (span <= 0) return lo.spend;
    return lo.spend + (hi.spend - lo.spend) * ((lo.rate - targetRate) / span);
  }
  return null;                                                 // every column clears it
}

// Namespace used by the UI (mirrors the modular engine.js exports)
const E = { LADDER_PLANT, ROUTE_PLANT, EMPLOYMENT_KINDS, EMPLOYMENT_WORDS, pensionCeiling, niceStep, gridWindow, spendRow, frontierSpend, num, clamp, isBlank, transferredPct, round250, compensationWindow, ihtWorkings, ESTATE_ASSET_KINDS, normalizeEstateAssets, businessReliefFor, estateActionPlan, bestPensionSplit, optimizeInheritance, estateForPlanAt, surplusIncome, suggestGift, normalizeGifts, inheritedPensionTax, balancedScore, pickBalanced, policyPlaybook, planHasKnownCost, DEFAULT_DEPOSIT_ORDER, postTaxInheritanceFor, IHT_RELATIONSHIPS, normalizeBeneficiaries, estateAtDeath, estateForCouple, RATE_EPSILON_PTS, MONEY_EPSILON_REL, MONEY_EPSILON_FLOOR, MAX_SURVIVAL_SACRIFICE_PTS, normalizeTolerances, toleranceFor, applySurvivalGuard, PRIORITY_METRICS, PRIORITY_KEYS, DEFAULT_PRIORITIES, normalizePriorities, explainPick, buildTradeoffs, tradeoffCard, averageStats, AUTO_DEPOSIT, DEFAULT_COST_STEPS, HISTORICAL_DATA, HISTORICAL_FIRST_YEAR, HISTORICAL_LAST_YEAR, getHistoricalPoint, RISK_EQUITY_WEIGHTS, DEFAULT_RISK_PROFILES, DEFAULT_RISK_SOURCE, BAND_QUANTILES, CMA_PRESETS, applyCmaPreset, realFromNominal, luckyBand, quantileRate, quantileCurve, normalCdf, smoothSurvivalRate, OWNERS, OWNER_LABEL, CATEGORIES, CATEGORY_LABEL, accountId, DEFAULT_CONFIG, BLANK_PLAN, DECUMULATION_POLICIES, GUARDRAILS, todayISO, calculateYearFraction, normalizePlan, taxParams, incomeTax, marginalRateAt, taxBreakpoints, TAX_REGION_LABELS, calculateUKNetIncome, nicFor, calculateUKTaxAndNIC, calculateMarginalRelief, netCostOfPensionContrib, grossUpNet, grossUpNetIncremental, grossPensionNeededForNet, taxablePayOf, mulberry32, gaussianPath, buildContext, spendTargetAtAge, freshState, stepYear, simulateDeterministic, simulateHistorical, FAIL_TOLERANCE, evaluateRows, runTrial, pathsForSeed, summarizeTrials, monteCarlo, optimizeSpend, shiftRetirement, safeRetirementAge, annuityFactor, fvContribStream, bridgeRequirement, contribAtYear, salaryAtYear, relevantEarningsAtYear, mpaaAppliesAtYear, carryForwardAtYear, resolveMpaa, wrapperHeadroomAtYear, suggestOneOffDestination, INCOME_TYPES, incomeTypeOf, allocateBudget, applyAllocationToPlan, accumulationOutlay, solveEscalation, applyEscalationToPlan, diffStrategyPlans, resolveSearchPlayer, bridgeIsaAnnual, liquidRealRate, buildTournament, buildPolicyCandidates, pickBest, accumulationEnv, accumulationCandidate, bedAndSippFor };
/*
 * The engine's public surface. Simple.jsx consumes it from here rather than from a module of its own,
 * which is a deliberate and temporary coupling: with one entrance both pages ship in the same bundle
 * anyway, so importing across costs nothing today. It stops being free the moment the two are split -
 * at which point these lines move to src/engine.js and both pages import that instead. See
 * PLAN-streamlined.md, "Build shape".
 */
export { GUARDRAILS, planHasKnownCost, accumulationEnv, accumulationCandidate, DECUMULATION_POLICIES, DEFAULT_DEPOSIT_ORDER, DEFAULT_COST_STEPS, mulberry32, NUMBER_FORMATS, DEFAULT_NUMBER_FORMAT, setNumberFormat, numberFormat, fmtNum, formatGBP, parseFormatted, groupDigits, pathsForSeed, runTrial, summarizeTrials, spendRow, num, isBlank, clamp, BLANK_PLAN, DEFAULT_CONFIG, STATE_PENSION_FULL, TAX_REGION_LABELS, AUTO_DEPOSIT, resolveMpaa, explainPick, buildTradeoffs, tradeoffCard, averageStats, pickBalanced, suggestOneOffDestination, DEFAULT_PRIORITIES, PRIORITY_METRICS, PRIORITY_KEYS, toleranceFor, postTaxInheritanceFor, spendTargetAtAge, evaluateRows, HISTORICAL_DATA, RISK_EQUITY_WEIGHTS, getHistoricalPoint, DEFAULT_RISK_PROFILES, DEFAULT_RISK_SOURCE, BAND_QUANTILES, CMA_PRESETS, applyCmaPreset, realFromNominal, luckyBand, quantileRate, quantileCurve, normalCdf, smoothSurvivalRate, calculateUKTaxAndNIC, calculateMarginalRelief, grossUpNet, normalizePlan, buildContext, simulateDeterministic, simulateHistorical, monteCarlo, optimizeSpend, shiftRetirement, safeRetirementAge, buildTournament, diffStrategyPlans, buildPolicyCandidates, pickBest, accumulationOutlay, solveEscalation, applyEscalationToPlan, N4_PEN, N4_HARVEST, N4_RAW, SAVE_NIC_CAP, E };


const STORAGE_KEY = 'rp_plan_full_v28';          // unchanged: old saved plans are migrated by normalizePlan
const SCENARIOS_STORAGE_KEY = 'rp_saved_scenarios_v3';
const APP_VERSION = 'v0.8 beta';

/*
 * THE SOLVER IN THE APP (Part C, research/solver/PART-C-PLAN.md; Phase 7, research/solver/PHASE-7.md): the plan on screen is solved
 * by the research candidate (src/solverApp.js), its solve state kept beside it (src/useSolver.js). The new planner is the app's
 * only planner since D155 (27 Nov 2026, the maintainer: "We don't need the classic anymore, just the new one"); the classic
 * planner, the choice between the two (rp_planner) and the rollback to the classic planner (PLANNER_BETA) retired with it. The
 * line below stays exactly as written: vite.config.js reads it false in the engine's workers, so the page's solver branches
 * (each behind solverOn) fold away there and the workers never reach the solver's client.
 */
const SOLVER = true;
// the solve's settings beside the switch: null in the app; a harness's light settings in a harness's build only (vite.config.js
// solver-harness, research/solver/PHASE-8.md), so the site's own build never reads anything else here
const SOLVER_OPTS = null;
// the engine the solve's key reads, for the harness's way in (research/ui-harnesses/solver-progress-ui.cjs); the hook gets it from
// the planner (src/useSolver.js). Below the export line, so research/build-engine.py leaves it out of the engine.
if (typeof window !== 'undefined') window.__solverEngine = E;
// The Documentation tab is prose, and prose can arrive when it is asked for rather than with the engine.
// It sits here, below the export line, because research/build-engine.py takes everything above it as the
// engine and strips the imports - a lazy() up there breaks engine.mjs.
const Docs = /* @__PURE__ */ lazy(() => import('./Docs.jsx'));
// Part C Phase 8's cards (src/SolverConfig.jsx), fetched only when the solver's cards are shown
// the page's own pieces the solver's cards use, handed in rather than imported there (src/SolverConfig.jsx says why)
const SOLVER_UI = { Fine, PhoneCollapse, MoneyInput, fieldCls: inputCls };
const SolverAimsCard = /* @__PURE__ */ lazy(() => import('./SolverConfig.jsx').then(m => ({ default: m.SolverAims })));
// Phase 10, item 7: the history tab's out-of-model check, loaded when there is a solved plan's run through history to show
const SolverHistoryCard = /* @__PURE__ */ lazy(() => import('./SolverFigures.jsx').then(m => ({ default: m.SolverHistory })));
const HistoryStripCard = /* @__PURE__ */ lazy(() => import('./PlannerMore.jsx').then(m => ({ default: m.HistoryStrip })));
const SolverLocksCard = /* @__PURE__ */ lazy(() => import('./SolverConfig.jsx').then(m => ({ default: m.SolverLocks })));
// step U: Your plan, the new planner's first place (src/PlannerPlan.jsx), its other cards (src/PlannerCards.jsx: the couples
// card, What if with the age, target and limits cards and the scenarios, the solver's settings, how it decides) and its quick
// start, each fetched only in the new planner
const PlannerPlanCard = /* @__PURE__ */ lazy(() => import('./PlannerPlan.jsx').then(m => ({ default: m.PlannerPlan })));
const PlannerCouples = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.Couples })));
const PlannerWhatIf = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.WhatIf })));
const PlannerSettings = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.SolverSettings })));
const PlannerDocs = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.DocsSolver })));
const PlannerDetails = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.Details })));
const PlannerYouNav = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.YouNav })));
const PlannerYouHeader = /* @__PURE__ */ lazy(() => import('./PlannerCards.jsx').then(m => ({ default: m.YouHeader })));
// the status strip (src/StatusStrip.jsx and its src/solveStatus.js), shown only in the new planner
const StatusStripCard = /* @__PURE__ */ lazy(() => import('./StatusStrip.jsx').then(m => ({ default: m.StatusStrip })));
const QuickStartCard = /* @__PURE__ */ lazy(() => import('./PlannerStart.jsx').then(m => ({ default: m.QuickStart })));
/*
 * The four that live on the bottom bar. Chosen as the path through the app: where you start, where you
 * type, where you read the answer, and where you compare. Everything else is reference material and sits
 * one tap further away behind More - reachable, just not competing for the four best positions.
 */
/*
 * THE PLAN INPUTS TAB, AS SECTIONS A PHONE SHOWS ONE AT A TIME.
 *
 * Parallel, not sequential - nothing in Income depends on having finished You - which is what makes
 * them tabs rather than steps. On a desktop all five (and the advanced fold) render stacked as before;
 * `showSection` is what gates them on a phone. The short names are the tab labels and are all a 390px
 * screen has room for; the long titles stay on the desktop headings.
 */
const INPUT_SECTIONS = [
  { id: 'you',      short: 'You',      title: 'Demographics, salaries & retirement targets' },
  { id: 'money',    short: 'Portfolio', title: 'Current balances, annual contributions & risk profiles' },
  /*
   * The two one-off sections say so in their labels. On a desktop the numbered heading carries that -
   * "4. One-off deposits (by wrapper)" - and on a phone that heading is the tab, so a bare "Deposits"
   * sat next to "Income" with nothing to tell you which was the recurring one. Income keeps its name
   * because it is NOT one-off: those are streams with a start and an end age.
   */
  { id: 'income',   short: 'Income',   title: 'Expected other income streams' },
  { id: 'deposits', short: 'One-off deposits', title: 'One-off deposits' },
  { id: 'costs',    short: 'One-off costs',    title: 'One-off capital costs' },
  { id: 'advanced', short: 'Advanced', title: 'Advanced inputs' },
];
const INPUT_SECTION_KEY = 'rp_input_section';
// You, in the new planner (step U, LAYOUT.md section 3.2): the same sections, Limits on the solver added before Advanced
// the new planner's names for You's sections (the desktop's list beside them says the same: YOU_NAMES below)
const PLANNER_SECTIONS = [...INPUT_SECTIONS.filter(x => x.id !== 'advanced').map(x => (x.id === 'money' ? { ...x, short: 'Your money' } : x)), { id: 'limits', short: 'Limits', title: 'Limits on the solver' }, INPUT_SECTIONS.find(x => x.id === 'advanced')];
/*
 * THE NEW PLANNER'S FOUR PLACES (step U; LAYOUT.md section 2.2), the answer first. All four sit on a phone's bottom bar, with no
 * More. Older code and links still name the classic planner's tabs (retired, D155), so each maps to its place.
 */
const PLANNER_TABS = [
  { id: 'plan',    Icon: Target,    label: 'Your plan', short: 'Your plan' },
  { id: 'you',     Icon: User,      label: 'You',       short: 'You' },
  { id: 'whatif',  Icon: GitBranch, label: 'What if',   short: 'What if' },
  { id: 'details', Icon: BookOpen,  label: 'Details',   short: 'Details' },
];
const PLANNER_PRIMARY = PLANNER_TABS.map(t => t.id);
const PLACE_OF = { home: 'plan', strategy: 'plan', projection: 'plan', config: 'plan', inheritance: 'plan', inputs: 'you', historical: 'details', audit: 'details', docs: 'details' };
// a place's root (LAYOUT.md section 10: each place a <main>), with You's section list beside it on a desktop
function PlaceFrame({ place, nav, children }) {
  return <main data-place={place} className={nav ? 'grid grid-cols-[220px_minmax(0,1fr)] gap-6 items-start' : 'space-y-6'}>{nav}{children}</main>;
}
const YOU_NAMES = { you: 'You', money: 'Your money', income: 'Income', deposits: 'One-off deposits', costs: 'One-off costs', limits: 'Limits on the solver', advanced: 'Advanced' };
const DETAILS_SECTIONS = [{ id: 'ledger', short: 'Year by year' }, { id: 'history', short: 'History check' }, { id: 'assumptions', short: 'Assumptions' }, { id: 'docs', short: 'How the solver decides' }];
const DIAL_NAMES = { 1: 'Low', 3: 'Medium', 6: 'High', 10: 'Very high' };
const MC_TRIALS = 5000;


/*
 * The two range charts are deliberately different colours. They answer the same question by different
 * means and a reader flicking between them needs to see at a glance which one they are looking at, so
 * the rate-based chart is a cool blue and the Monte Carlo a warmer violet in every theme.
 */
/*
 * The chart palettes are keyed by theme, and there are two of them for three themes. Sepia is a paper
 * theme - a warm light ground - so it reads the light chart palette rather than needing a third set. This
 * one function is what stops `PALETTE[resolvedTheme]` coming back undefined the moment a third theme
 * exists, which is a blank chart rather than a wrong colour.
 */
const chartKey = (t) => (t === 'dark' ? 'dark' : 'light');
const CHART_PALETTE = {
  light:  { gridMajor: '#E3E6EB', gridMinor: '#F0F2F5', axisText: '#8A93A3', hoverCrosshair: '#A8B0BD', sandboxDash: '#E3B505', sandboxSim: '#8C5000', sandboxSheen: '#FFC83D', historicalLine: '#6D5BD0', trajectoryHoverFill: '#2148B8', historicalHoverFill: '#6D5BD0', hoverDotStroke: '#FFFFFF',
            fanBand: 'rgba(109, 91, 208, 0.14)', fanEdge: 'rgba(109, 91, 208, 0.5)', fanMedian: '#6D5BD0', fanOuter: 'rgba(109, 91, 208, 0.75)',
            rateBand: 'rgba(14, 159, 110, 0.14)', rateEdge: 'rgba(14, 159, 110, 0.55)', rateOuter: 'rgba(14, 159, 110, 0.8)' },
  dark:   { gridMajor: '#262C35', gridMinor: '#1D222A', axisText: '#6B7480', hoverCrosshair: '#4A5361', sandboxDash: '#FFE870', sandboxSim: '#E08A00', sandboxSheen: '#FFF3C4', historicalLine: '#9C8CF0', trajectoryHoverFill: '#7B9CF2', historicalHoverFill: '#9C8CF0', hoverDotStroke: '#171B21',
            fanBand: 'rgba(156, 140, 240, 0.20)', fanEdge: 'rgba(156, 140, 240, 0.55)', fanMedian: '#9C8CF0', fanOuter: 'rgba(156, 140, 240, 0.8)',
            rateBand: 'rgba(63, 219, 199, 0.18)', rateEdge: 'rgba(63, 219, 199, 0.5)', rateOuter: 'rgba(63, 219, 199, 0.78)' },
};


const MARKER_PALETTE = {
  light: {
    retireSelf: { line: '#A8701A', fill: '#FBF1DC', stroke: '#EDCE8E', text: '#8A5B16' },
    retirePart: { line: '#8A5B16', fill: '#FBF1DC', stroke: '#EDCE8E', text: '#6E4811' },
    nmpa: { line: '#1C7ED6', fill: '#E4F0FB', stroke: '#B7D7F2', text: '#1866AD' },
    statePension: { line: '#1B8A5A', fill: '#E6F4EC', stroke: '#9CD6B5', text: '#15734A' },
  },
  dark: {
    retireSelf: { line: '#E0A64A', fill: '#3A2C13', stroke: '#6B5220', text: '#F1CC8E' },
    retirePart: { line: '#C99A3F', fill: '#3A2C13', stroke: '#6B5220', text: '#F1CC8E' },
    nmpa: { line: '#4FC3F0', fill: '#10293A', stroke: '#1B4055', text: '#A9DCF5' },
    statePension: { line: '#4CC08A', fill: '#14302A', stroke: '#1E6B54', text: '#8FE0BB' },
  },
};

const HISTORICAL_PRESETS = [
  { label: '1929 Crash (Great Depression)', year: 1929 },
  { label: '1945 Post-War', year: 1945 },
  { label: '1955 Mid-Century', year: 1955 },
  { label: '1965 Stagflation', year: 1965 },
  { label: '1973 Oil Shock', year: 1973 },
  { label: '2000 Dot-Com Bust', year: 2000 },
  { label: '2008 Global Financial Crisis', year: 2008 }
];

const parseInputNumber = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  return String(val).replace(/^0+(?=\d)/, '');
};
/*
 * A percentage that cannot leave its own range.
 *
 * `max="100"` on a number input constrains the spinner and nothing else: typing straight into the box
 * sails past it, and 150% of a late partner's nil-rate band invents an allowance that does not exist.
 * The other four percentage boxes on the tab had the same hole - a beneficiary taking 150% of an estate,
 * a pension haircut over 100%.
 *
 * Clamped here rather than at read time on purpose: a figure that is silently corrected downstream
 * leaves the household looking at 150 in a box while the sums use 100, which is worse than either.
 */
const parsePercent = (val) => {
  const v = parseInputNumber(val);
  if (v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? String(clamp(n, 0, 100)) : '';
};

const tick = () => new Promise(r => setTimeout(r, 0));
const clone = (o) => JSON.parse(JSON.stringify(o));
const safeStorageGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const safeStorageSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* quota / private mode */ } };
const safeStorageRemove = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

/*
 * THE PROJECTION'S OWN WORKER.
 *
 * Every other heavy thing on this page had already been moved off the main thread; the Projection tab,
 * which is the thing most people press first, had not. Measured by phone-perf-ui.cjs on a Pixel 7 at 4x
 * CPU throttle - a mid-tier phone - one run took 30.6 seconds and spent 28,398ms of that inside long
 * tasks, which is the browser's own name for "this page is not responding to you". No amount of chunking
 * fixes that. The 250-path chunks below yield to the event loop, so the progress bar does paint, but the
 * arithmetic owns the thread between yields and on a throttled phone the yields cost more than they buy:
 * through the worker the same run takes 6.0 seconds with about 0.7s of long tasks, so the wall clock
 * improved as well as the responsiveness.
 *
 * PERSISTENT, not a pool spun up per call. A module worker loads the whole bundle before it can answer
 * anything - a few hundred milliseconds on a phone - and one projection asks this thing twenty or more
 * questions in a row. `scoreInWorkers` is right to use a fresh pool: it has one big batch and then
 * nothing. This has a long conversation, so the worker stays.
 *
 * Every question carries a key, because progress frames and answers share one channel and a late frame
 * from an abandoned job must not be mistaken for this one's.
 */
let projWorker = null;
let projSeq = 0;
const projPending = new Map();
function projectionWorker() {
  if (projWorker) return projWorker;
  projWorker = new Worker(new URL('./mcWorker.js', import.meta.url), { type: 'module' });
  projWorker.onmessage = (e) => {
    const d = e.data || {};
    const p = projPending.get(d.key);
    if (!p) return;
    if (d.progress !== undefined) { if (p.onProgress) p.onProgress(d.progress, d.label); return; }
    projPending.delete(d.key);
    if (d.error) p.reject(new Error(d.error)); else p.resolve(d);
  };
  projWorker.onerror = (e) => killProjectionWorker((e && e.error) || new Error((e && e.message) || 'projection worker failed'));
  return projWorker;
}
/*
 * Stop means stop. A worker cannot be interrupted politely, so cancelling terminates it and the next
 * question builds a new one. Pending questions RESOLVE NULL rather than rejecting, because a cancel is
 * not a failure: every caller already checks the cancel flag or a null result and returns. A genuine
 * worker failure passes a reason, which rejects instead, and that is what puts the caller on the
 * main-thread path.
 */
function killProjectionWorker(reason = null) {
  if (projWorker) { try { projWorker.terminate(); } catch (err) { /* already gone */ } projWorker = null; }
  const waiting = [...projPending.values()];
  projPending.clear();
  for (const p of waiting) { if (reason) p.reject(reason); else p.resolve(null); }
}
function runInProjectionWorker(job, { onProgress } = {}) {
  const w = projectionWorker();
  const key = `p${++projSeq}`;
  return new Promise((resolve, reject) => {
    projPending.set(key, { resolve, reject, onProgress });
    w.postMessage({ ...job, key });
  });
}
/*
 * A development escape hatch, and the only way to prove the worker did not change the answer: the same
 * run with ?forceMain=1 takes the main-thread path, and the two survival figures have to match to the
 * digit. Read defensively because this module is also imported INSIDE a worker, where the shimmed
 * window has no meaningful location.
 */
const MAIN_THREAD_ONLY = (() => {
  try { return new URLSearchParams(window.location.search).has('forceMain'); } catch (err) { return false; }
})();
const workersUsable = () => typeof Worker !== 'undefined' && !MAIN_THREAD_ONLY;

// Chunked Monte Carlo so the UI can repaint a progress bar between batches.
// `shouldStop` is checked between chunks, so a cancel lands within a chunk rather than at the end of the
// run. The partial result is still summarised and returned, because the caller discards it either way.
//
// Pass a `plan` and it goes to the projection worker instead, which is the same arithmetic on the same
// seed and so the same numbers; `ctx` is still required because it is what the fallback runs on, and a
// context holds functions and cannot cross a worker boundary. `forceMain` is for `scoreInWorkers`, whose
// own fallback lands here and must not bounce back into a worker.
async function runMonteCarloAsync(ctx, { trials, seed, spendOverride = null, onProgress, shouldStop = null, collectPaths = false, plan = null, resolve = true, inheritance = false, forceMain = false }) {
  if (plan && !forceMain && workersUsable()) {
    try {
      const d = await runInProjectionWorker(
        { kind: 'stats', plan, trials, seed, resolve, spendOverride, collectPaths, inheritance },
        { onProgress });
      if (d === null) return null;             // cancelled: the worker was terminated mid-question
      if (d.stats) { if (onProgress) onProgress(1); return d.stats; }
    } catch (err) {
      console.warn('the projection worker failed, finishing on the main thread:', err);
      killProjectionWorker();
    }
  }
  const paths = E.pathsForSeed(seed, trials, ctx.totalYears);
  const results = [];
  const CHUNK = 250;
  for (let i = 0; i < trials; i += CHUNK) {
    const end = Math.min(trials, i + CHUNK);
    for (let j = i; j < end; j++) results.push(E.runTrial(ctx, paths[j], spendOverride, collectPaths));
    if (onProgress) onProgress(results.length / trials);
    await tick();
    if (shouldStop && shouldStop()) break;
  }
  return { ...E.summarizeTrials(results), spend: spendOverride !== null ? spendOverride : ctx.targetSpend };
}



/*
 * One input recipe, and a smaller one for the tables that hold dozens of them.
 *
 * `tabular-nums` rather than `font-mono`: the only thing mono was buying was digits of equal width, and
 * a whole form set in a typewriter face reads like a terminal. Plex Sans has proper tabular figures, so
 * the columns still line up. Mono stays where the content really is code - the audit table, the seed,
 * an exported JSON blob.
 *
 * The focus ring is drawn INSIDE the control (`ring-inset`) so a focused field in a tight grid does not
 * overlap its neighbour.
 *
 * THE FIELD IS THE SURFACE COLOUR, NOT A GREY FILL. A filled box reads as a thing you look at; an
 * outlined one on the page's own ground reads as a space you write in. It matters most under the sepia
 * theme, where `bg-slate-50` came out as a beige panel a shade off its own background and a column of
 * them made the form look like a table of read-only values. The simple page has always been outline-only
 * and is the version that reads better, so the full planner matches it.
 */
// inputCls and smallInputCls come from src/ui.js, shared with the simple planner


/*
 * A CONFIG SECTION THAT STARTS SHUT.
 *
 * Config carries four panels, and three of them are reference data a plan almost never needs to touch -
 * tax thresholds, the return matrix, the economic constants. Left open they bury the one panel that is
 * a decision: which decumulation policy to run. So those three fold, and the policy panel does not.
 *
 * `<details>` rather than state, deliberately: the browser keeps the open/closed flag, ctrl-F finds text
 * inside a closed panel in Chrome, and nothing has to be persisted for the page to behave sensibly on
 * reload. `subtitle` sits in the summary so a shut panel still says what is inside it.
 */
function CollapsibleCard({ title, subtitle, icon: Icon, children }) {
  return (
    <details className="group bg-surface border border-slate-200/90 rounded-xl">
      <summary className="p-5 cursor-pointer list-none flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-blue-600 shrink-0" />}{title}
          </h2>
          {subtitle && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5 space-y-4">{children}</div>
    </details>
  );
}







/*
 * The warnings are plain strings from the engine, which runs in node for the test suites and cannot
 * carry JSX or tags. This is the one place that needs to tell a class of them apart, so the class is
 * named here rather than threaded through the engine: anything about a gain that has not been entered.
 */
const CGT_WARNING = /unrealised gain|realised gain|capital gains/i;

function WarningsBanner({ warnings }) {
  if (!warnings || !warnings.length) return null;
  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
      <div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4 text-amber-600" /> Inputs the engine is substituting or flagging</div>
      <ul className="list-disc pl-5 space-y-0.5">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}





/*
 * The theme arrives as props because the shell owns it: the streamlined page needs the same control, and
 * the switch between the two apps unmounts whichever one is not showing. See src/theme.jsx.
 */
export default function App({ theme = 'system', setTheme = () => {}, resolvedTheme = 'light',
  numFormat = DEFAULT_NUMBER_FORMAT, setNumFormat = () => {},
  isPhone = false, isCoarse = false, viewport = { width: 1280, height: 800 } }) {
  // plants 'nogapguard', 'noopen' and 'notake' (research/ui-harnesses/solver-planner-ui.cjs check 19, a harness build's
  // PLANNER_PLANT): the couples' guard running a couple more than three years apart with other taxable income, as before D128;
  // the guard before D143, no class of the household route's open; the guard before step 4's change of default (D145), reading
  // the shapes the household plan takes as refused; 'beforeany' the guard before COUPLES-ANY's (D148), reading the shapes it
  // takes as refused, step 4's three alone taken; 'beforeall' the guard before D150, nobody retiring within the plan refused
  // and the age cap on. Set here, in the page's own render before any reader of the guard renders:
  // src/couplesSwitch.js has no imports, and a statement at this file's top level would be a side effect every worker importing
  // the engine from it would carry (the guard's plants combine)
  { const rule = ['nogapguard', 'noopen', 'notake', 'beforeany', 'beforeall'].filter(x => PLANNER_PLANT.has(x)).join(','); if (rule) COUPLES_SWITCH_PLANT.rule = rule; }
  // the new planner, the only one (D155), lands on Your plan (the quick start there for an empty plan). SOLVER spelled out: with
  // the line false (the engine's workers' build) the bundler folds solverOn to false and drops the solver's cards, so the workers
  // (which import this file) never reach the solver client and its worker
  const solverOn = SOLVER;
  const [activeTab, setActiveTabRaw] = useState('plan');
  // an older id names its place (LAYOUT.md section 2.2's table): a link to the docs, say, opens Details
  const setActiveTab = useCallback(id => setActiveTabRaw(PLACE_OF[id] || id), []);
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [selectedHistoricalYear, setSelectedHistoricalYear] = useState(1965);
  const [mcSeed, setMcSeed] = useState(12345);

  const [plan, setPlan] = useState(() => E.normalizePlan(safeStorageGet(STORAGE_KEY) ? (() => { try { return JSON.parse(safeStorageGet(STORAGE_KEY)); } catch (e) { return null; } })() : null));
  // Part C Phase 7: the plan's solve state, nothing with the switch off (Phases 8 to 10 read it). A single household's plan, and
  // a couple's where couples are on (Part D, D5 and D6: src/couplesSwitch.js COUPLES, on since D99) and the couple is inside
  // the guard (its first person holding 40% to 60% of the pots, or its elder by age more than 60% and at most 90%: item 6's
  // stage C, D99; and since D128 not more than three years apart with other taxable income), and since D143 any couple outside
  // it whose plan's shape the household plan takes (on the household route alone: src/couplesSwitch.js HOUSEHOLD_OPEN); any
  // other couple's plan keeps the app's rules and is not solved (D42), the couples card saying why
  const coupleState = plan?.demographics?.planningMode === 'couple' ? coupleSolverOn(plan) : null;
  const solverRules = solverOn && (plan?.demographics?.planningMode === 'single' || !!(coupleState && coupleState.on));
  // the navigation: the new planner's four places
  const navTabs = PLANNER_PLANT.has('fifthplace') ? [...PLANNER_TABS, { id: 'more', Icon: Layers, label: 'More', short: 'More' }] : PLANNER_TABS;
  const youOn = solverOn && activeTab === 'you';
  // You's money in the new planner: each pot's contribution styled like its balance and its increase named as the contribution's
  const youMoney = youOn && !PLANNER_PLANT.has('contribold');
  // Your plan's paths in two steps (a harness's light settings may name fewer), and whether they are in (the strip's simulating)
  const plannerSteps = SOLVER_OPTS && SOLVER_OPTS.strategySteps ? SOLVER_OPTS.strategySteps : [2000, 5000];
  const [planPhase, setPlanPhase] = useState({ simulating: false, trials: 5000 });
  const [planFigures, setPlanFigures] = useState(null);
  const [leversOpen, setLeversOpen] = useState(false);
  const [leversSeen, setLeversSeen] = useState(false);
  const [detailsSection, setDetailsSection] = useState('ledger');
  const [docsOpen, setDocsOpen] = useState(false);
  // on a phone the solve runs when asked (the launch plan's B10), and the request is per version of the plan (step U, LAYOUT.md
  // section 4.1): an edit after it holds the solver, which marks the solve in hand stale and starts nothing until asked again
  const [askedPlan, setAskedPlan] = useState(null);
  const asked = !isPhone || askedPlan === plan;
  const askSolve = useCallback(() => setAskedPlan(plan), [plan]);
  // enough has been entered for the rest of the app to say something meaningful
  const planStarted = E.num(plan?.spending?.targetSpend, 0) > 0
    || (plan?.accounts || []).some(a => E.num(a.balance, 0) > 0 || E.num(a.contrib, 0) > 0);
  /*
   * NO SOLVE BEFORE THERE IS A PLAN (22 Nov 2026, the reviewer on the new planner as the default, BLOCKING 1). An empty plan
   * shows the quick start; solving it meant every fresh visitor's first minute went on a solve of nothing, thrown away when the
   * quick start handed over a plan, and on GitHub Pages the isolation's one reload, which loses what was typed into the quick
   * start. So the solver, its chunk and the isolation wait for a plan. research/ui-harnesses/solver-planner-ui.cjs check 13, its
   * plant 'blanksolve' (the empty plan solved, as before)
   */
  const solveOn = solverRules && (planStarted || PLANNER_PLANT.has('blanksolve'));
  const solve = useSolverState(plan, solveOn, E, SOLVER_OPTS, solveOn && !asked && !PLANNER_PLANT.has('phonesolve'));
  // the cards' cost lines read this device's last solve (src/solveStatus.js timings)
  useEffect(() => {
    if (solve.solveState === 'solved' && solve.solveMeta && !solve.solveMeta.error) {
      const { restored, secs } = solve.solveMeta;
      import('./solveStatus.js').then(({ timings }) => { timings.restored = !!restored; timings.solve = restored ? null : secs || null; });
    }
  }, [solve.solveState, solve.key]);   // eslint-disable-line react-hooks/exhaustive-deps
  // a failed solve tries again on a copy of the plan (the hook takes it as a change); on a phone, asked for at once
  const retrySolve = () => setPlan(p => { const q = { ...p }; if (isPhone) setAskedPlan(q); return q; });
  const stripAction = a => (a === 'retry' ? retrySolve() : askSolve());

  const [scenarios, setScenarios] = useState(() => {
    try {
      const cached = safeStorageGet(SCENARIOS_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(s => s && typeof s === 'object').map((s, i) => ({ id: String(s.id || 'scen_' + i), name: String(s.name || `Scenario ${i + 1}`), data: E.normalizePlan(s.data) }));
      }
    } catch (e) { /* fall through */ }
    return [{ id: 'scen_default', name: 'Scenario 1', data: E.normalizePlan(null) }];
  });
  const [activeScenarioId, setActiveScenarioId] = useState(() => scenarios[0]?.id || 'scen_default');
  const [scenarioNameInput, setScenarioNameInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const flash = (msg, ms = 3000) => { setSaveSuccessMsg(msg); setTimeout(() => setSaveSuccessMsg(''), ms); };



  useEffect(() => { safeStorageSet(STORAGE_KEY, JSON.stringify(plan)); }, [plan]);
  useEffect(() => { safeStorageSet(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios)); }, [scenarios]);

  const fileInputRef = useRef(null);
  const isCouple = plan?.demographics?.planningMode !== 'single';
  // a couple's plan the solver does not run (above, solverRules): the couples card on Your plan, What if and Details
  const coupleCard = isCouple && (!solverRules || PLANNER_PLANT.has('couplecard'));   // plant 'couplecard': solver-planner-ui check 19

  // ------------------------------------------------------------ engine context & projections
  /*
   * THE FIELDS ARE URGENT; THE PROJECTION IS NOT.
   *
   * Every keystroke in an input rewrote `plan`, and everything the engine derives hung off it directly:
   * resolveMpaa, buildContext and a full deterministic run for the plan, then the same again for the
   * sandbox. Profiled on a couple's plan with eight wrappers, one keypress cost 130ms of stepYear and
   * simulateDeterministic before the character appeared - which is what "laggy typing" is.
   *
   * useDeferredValue splits the two. The character is painted from `plan` at once; the engine chain
   * re-renders behind it from `deferredPlan`, at low priority, and React throws that work away when the
   * next keystroke lands - so a burst of typing costs one projection at the end rather than one per key.
   * The figures are never wrong, only a frame late, and nothing that RUNS anything reads this: the
   * simulation stages take `plan` itself, so pressing Run straight after typing uses what was typed.
   */
  const deferredPlan = useDeferredValue(plan);
  // MPAA is derived from the projection, so resolve it once and let everything downstream read the result
  const resolvedPlan = useMemo(() => E.resolveMpaa(deferredPlan), [deferredPlan]);
  const ctx = useMemo(() => E.buildContext(resolvedPlan), [resolvedPlan]);
  const P = ctx.P;
  const terminalAge = ctx.terminalAge;
  const currentAge = ctx.ageSelf0;
  const nmpa = ctx.nmpa;

  const spanYears = ctx.totalYears;
  const maxHistoricalStartYear = useMemo(() => Math.max(E.HISTORICAL_FIRST_YEAR, E.HISTORICAL_LAST_YEAR - spanYears), [spanYears]);
  const activeHistoricalStartYear = useMemo(() => Math.min(Math.max(E.HISTORICAL_FIRST_YEAR, selectedHistoricalYear), maxHistoricalStartYear), [selectedHistoricalYear, maxHistoricalStartYear]);

  // the history chart runs to the plan's end (the classic planner's horizon slider retired with it, D155)
  const effectiveMaxVisibleAge = terminalAge;
  const [hoveredHistPoint, setHoveredHistPoint] = useState(null);

  // One run, three stages. `simResult` is always the plan exactly as entered; `safeMaxResult` is the
  // solve, which describes a different spend and so cannot share the same card. Keeping them apart is
  // what stops the metric tiles quietly changing meaning depending on which button was pressed last.
  const [simResult, setSimResult] = useState(null);

  const mcCancelRef = useRef(false);
  // The projection worker is deliberately long-lived - it answers twenty questions per run - but long-lived
  // is not the same as immortal: it goes when the app does.
  useEffect(() => () => killProjectionWorker(), []);
  const [showAdvanced, setShowAdvanced] = useState(false);
  /*
   * Which section the phone is showing. sessionStorage rather than state alone, so leaving You for
   * another place and coming back lands on the section you were editing, and rather than localStorage
   * so a fresh visit starts at You. `showSection` is true for everything on a desktop.
   */
  const [inputSection, setInputSection] = useState(() => {
    try { const v = sessionStorage.getItem(INPUT_SECTION_KEY); return PLANNER_SECTIONS.some(x => x.id === v) ? v : 'you'; }
    catch { return 'you'; }
  });
  const selectSection = (id) => {
    setInputSection(id);
    try { sessionStorage.setItem(INPUT_SECTION_KEY, id); } catch { /* private mode */ }
    window.scrollTo({ top: 0 });
  };
  const showSection = (id) => !isPhone || inputSection === id;
  /*
   * ONE WAY TO GET TO ADVANCED INPUTS, FROM EITHER LAYOUT.
   *
   * On a phone it is a section of its own, reached through the strip; on a desktop it is a fold at the
   * foot of the first card. The prompts that point at it should not have to know which.
   */
  const goToAdvanced = () => {
    if (isPhone) { selectSection('advanced'); window.scrollTo({ top: 0 }); return; }
    setShowAdvanced(true);
    setTimeout(() => { const el = document.getElementById('advanced-inputs'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60);
  };
  const stepSection = (by) => {
    const list = PLANNER_SECTIONS;   // You's sections, Limits on the solver among them (step U)
    const i = list.findIndex(x => x.id === inputSection);
    const j = Math.min(list.length - 1, Math.max(0, i + by));
    if (j !== i) selectSection(list[j].id);
  };
  const inputsSwipeRef = useRef(null);
  useSwipe(inputsSwipeRef, { enabled: isPhone && youOn, onLeft: () => stepSection(1), onRight: () => stepSection(-1) });
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [expandedOneOff, setExpandedOneOff] = useState(() => new Set());
  const toggleOneOffExpand = (id) => setExpandedOneOff(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleFocus = (e) => e.target.select();
  const activeRiskMatrix = plan?.riskProfiles || E.DEFAULT_RISK_PROFILES;
  const scrollToDocSection = (id) => {
    const el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: 'smooth' });
    // The Documentation tab fills in its contents list after first paint, which moves every card once the
    // scroll is already under way, and when that happens depends on how fast the page loads: one look at
    // 700ms left the card 30 to 40px past the top on a slow machine (4x CPU throttling, 2 runs in 6). So
    // for the next two and a half seconds, each time the card has come to rest away from the top, put it
    // back; a wheel, touch or key from the reader ends it.
    let stop = false, last = null, n = 0;
    const quit = () => { stop = true; };
    const evs = ['wheel', 'touchstart', 'keydown'];
    evs.forEach(t => window.addEventListener(t, quit, { passive: true }));
    const look = () => {
      const e = document.getElementById(id);
      if (stop || !e || ++n > 25) { evs.forEach(t => window.removeEventListener(t, quit)); return; }
      const top = Math.round(e.getBoundingClientRect().top);
      if (top === last && Math.abs(top) > 2) e.scrollIntoView({ behavior: 'auto' });
      last = top;
      setTimeout(look, 100);
    };
    setTimeout(look, 300);
  };
  /*
   * WHAT IS IN THE REFERENCE, BEFORE YOU SCROLL THROUGH IT.
   *
   * Measured: the Documentation tab is 7,143px on a desktop with nothing folded, so you cannot see the
   * shape of it without scrolling past all of it. On a phone the cards fold and their eleven headings fit
   * in about two screens, which is the same job done a different way - so this list is desktop-only
   * rather than a second copy of something the phone already has.
   *
   * Read off the rendered cards instead of kept as a second hand-written list: a new card joins the
   * contents by itself, and one that stops leading with a heading goes visibly missing rather than
   * quietly dropping out of a list nobody re-checks. The equality test is what stops the effect looping.
   */
  const [docSections, setDocSections] = useState([]);
  // the tab reports its cards once it has rendered (Docs.jsx); the equality test is what stops it looping
  const onDocSections = useCallback((found) => {
    setDocSections(prev => (prev.length === found.length && prev.every((x, i) => x.id === found[i].id) ? prev : found));
  }, []);
  // the tab is a lazy chunk, so on its first opening the card may not exist for a moment: keep looking
  const goToDoc = (id) => {
    // in the new planner the documentation opens inside Details' "How the solver decides" (step U)
    if (solverOn) { setDetailsSection('docs'); setDocsOpen(true); }
    setActiveTab('docs');
    let tries = 0;
    const attempt = () => { if (document.getElementById(id)) scrollToDocSection(id); else if (tries++ < 25) setTimeout(attempt, 80); };
    setTimeout(attempt, 80);
  };

  const timelineData = useMemo(() => {
    const exp = E.simulateDeterministic(ctx, 'expected');
    return exp.map(r => ({ ...r, nominal: r.totalCombined * Math.pow(1 + ctx.inflation, r.t) }));
  }, [ctx]);







  /*
   * Part C Phase 10, item 7: under the switch, with a solve of this plan in hand, the audit table is the solved plan's
   * expected-return ledger with each year's action, and the history tab runs the solved plan through real history: the
   * out-of-model check (the solver worked the plan out on the model's markets; history is outside them), with your plan's
   * verdict beside it. Asked of the solver's worker when the tab is open; where its run fails, your plan's figures stand.
   */
  const [solvedRows, setSolvedRows] = useState({ key: null, expected: null, hist: {} });
  const solvedInHand = solverRules && solve.solveState === 'solved' && !!solve.ask && !!solve.solveMeta && !solve.solveMeta.error;
  const haveExpected = solvedRows.key === solve.key && !!solvedRows.expected;
  useEffect(() => {
    if (!solvedInHand) return undefined;
    // Details (step U) shows the ledger and the history check together: the ledger first, then the start year's run
    const inDetails = activeTab === 'details';
    const key = solve.key, want = !inDetails ? null : !haveExpected ? 'expected' : activeHistoricalStartYear;
    if (want === null || (solvedRows.key === key && (want === 'expected' ? solvedRows.expected : solvedRows.hist[want]))) return undefined;
    let live = true;
    // asked again after a failure (another place, another start year): the line says it is being worked out until this answer
    if (want === 'expected' && solvedRows.key === key && solvedRows.expectedFailed) setSolvedRows(s => ({ ...s, expectedFailed: false }));
    // the ledger's action words come with it: solverWords.js loads then, in a chunk of its own, not with the page
    const asked = solve.ask('rows', { market: want === 'expected' ? 'expected' : { historical: true, startYear: want } });
    (want === 'expected'
      ? Promise.all([asked, import('./solverWords.js')]).then(([a, w]) => ({ ...a, rows: a.rows && { ...a.rows, words: a.rows.parts.map((pt, i) => (a.rows.couple ? w.coupleLedgerWords : w.ledgerWords)(pt, a.rows.rows[i].targetSpend > 0, a.rows.rows[i])) } }))
      : asked)
      .then(({ rows: run }) => {
        if (!live) return;
        if (!run) throw new Error('the solved plan\'s run came back without its rows');
        setSolvedRows(s => { const kept = s.key === key ? s : { key, expected: null, hist: {} }; return want === 'expected' ? { ...kept, expected: run, expectedFailed: false } : { ...kept, hist: { ...kept.hist, [want]: run } }; });
      })
      // the solved plan's run failed: your plan's figures stand, and the ledger's line says the solved plan's could not be worked
      // out, not that it is being (the reviewer's third look at D155, finding 5: until then the line stayed up). A solve let go
      // ('closed', 'cancelled') is not a failure: the next solve asks again
      .catch(e => {
        if (!live || PLANNER_PLANT.has('stuckwait') || (e && (e.message === 'closed' || e.message === 'cancelled'))) return;
        if (want === 'expected') setSolvedRows(s => ({ ...(s.key === key ? s : { key, expected: null, hist: {} }), expectedFailed: true }));
      });
    return () => { live = false; };
  }, [solvedInHand, solve.key, activeTab, activeHistoricalStartYear, haveExpected]); // eslint-disable-line react-hooks/exhaustive-deps
  const solvedLedger = solvedInHand && solvedRows.key === solve.key ? solvedRows.expected : null;
  const solvedHistory = solvedInHand && solvedRows.key === solve.key ? solvedRows.hist[activeHistoricalStartYear] || null : null;
  // every start year at once (the UI pass of 20 Nov): the solved plan's verdicts from the worker, your current approach's here
  const [histAll, setHistAll] = useState({ key: null, list: null });
  const histYears = useMemo(() => { const a = []; for (let y = E.HISTORICAL_FIRST_YEAR; y <= maxHistoricalStartYear; y++) a.push(y); return a; }, [maxHistoricalStartYear]);
  useEffect(() => {
    if (!solvedInHand || activeTab !== 'details' || histAll.key === solve.key) return undefined;
    let live = true;
    const key = solve.key;
    solve.ask('history', { years: histYears })
      .then(({ history }) => { if (!live) return; if (!history) throw new Error('the solved plan\'s history came back empty'); setHistAll({ key, list: history }); })
      // the strip shows your current approach alone, and says the solved plan's could not be worked out (the reviewer's third look
      // at D155, finding 5); a solve let go is not a failure
      .catch(e => { if (!live || PLANNER_PLANT.has('stuckwait') || (e && (e.message === 'closed' || e.message === 'cancelled'))) return; setHistAll({ key, list: null, failed: true }); });
    return () => { live = false; };
  }, [solvedInHand, solve.key, activeTab, histYears]); // eslint-disable-line react-hooks/exhaustive-deps
  const yourHistAll = useMemo(() => (solverOn && activeTab === 'details' ? histYears.map(y => { const v = E.evaluateRows(ctx, E.simulateHistorical(ctx, y)); return { y, ok: !!v.survived, failYear: v.failYear }; }) : null), [solverOn, activeTab, ctx, histYears]);
  // the audit table: the solved plan's ledger where one is in hand (your plan's a click away), else your plan's
  const [auditView, setAuditView] = useState('solved');
  const auditRun = solvedLedger && auditView === 'solved' ? solvedLedger : null;
  const auditRows = auditRun ? auditRun.rows : timelineData;
  const yourHistoricalTimeline = useMemo(() => E.simulateHistorical(ctx, activeHistoricalStartYear), [ctx, activeHistoricalStartYear]);
  const historicalTimeline = solvedHistory ? solvedHistory.rows : yourHistoricalTimeline;
  const yourHistoricalVerdict = useMemo(() => (solvedHistory ? E.evaluateRows(ctx, yourHistoricalTimeline) : null), [solvedHistory, ctx, yourHistoricalTimeline]);



  const historicalMetrics = useMemo(() => {
    if (!historicalTimeline.length) return null;
    // the solved plan's run is judged on its own context, as the worker ran it (its minimum pot)
    const ev = solvedHistory ? solvedHistory.verdict : E.evaluateRows(ctx, historicalTimeline);
    /*
     * A floor failure funds every year of the plan and only then ends below the bequest floor, and
     * evaluateRows reports its failAge as the terminal age. Counting years off that failAge would read
     * as "ran dry after 47 of 47 years", so the floor case is counted as a full span and worded apart.
     */
    const fundedYears = ev.survived || ev.failReason === 'floor'
      ? ctx.totalYears
      : Math.max(0, ev.failAge - historicalTimeline[0].ageSelf);
    /*
     * Working years cannot run a pot dry: the living target only starts at the first retirement
     * (stepYear gates it on `anyRetired`), so before then nothing is being withdrawn and every year
     * is trivially "funded". Counting the whole span therefore flatters an unaffordable plan - a
     * £5m/yr spend on a normal pot reported "ran dry after 22 of 65 years" when what actually
     * happened is that it failed in the very first year of drawdown, 22 years from now. So the
     * headline counts drawdown years, and says so when the failure lands before drawdown starts.
     */
    const drawdownStart = Math.max(historicalTimeline[0].ageSelf, Math.min(...ctx.owners.map(o => o.retireAge)));
    const drawdownYears = Math.max(0, ctx.terminalAge - drawdownStart);
    const fundedDrawdownYears = ev.survived || ev.failReason === 'floor'
      ? drawdownYears
      : Math.max(0, Math.min(drawdownYears, ev.failAge - drawdownStart));
    const failedBeforeDrawdown = !ev.survived && ev.failReason !== 'floor' && ev.failAge < drawdownStart;
    /*
     * Say what killed it. A one-off cost landing in the failure year is overwhelmingly the cause, and
     * without naming it the verdict is a riddle: enter a £5m repair bill and the tab reports a plan that
     * ran dry seven years into drawdown, leaving the reader to work out that their own entry did it.
     */
    const failCost = !ev.survived && ev.failYear ? (ctx.oneOffCosts.get(ev.failYear) || 0) : 0;
    return { ...ev, fundedYears, unfundedYears: Math.max(0, ctx.totalYears - fundedYears), drawdownStart, drawdownYears, fundedDrawdownYears, failedBeforeDrawdown, failCost, startVal: historicalTimeline[0]?.totalCombined || 0, terminalVal: ev.terminalPot, minVal: ev.minPot, startHistoricalYear: activeHistoricalStartYear, beyondData: historicalTimeline.some(r => r.histYear === null) };
  }, [historicalTimeline, solvedHistory, ctx, activeHistoricalStartYear]);







  // ------------------------------------------------------------ chart scales
  /*
   * The viewBox is chosen for the screen, not fixed.
   *
   * A 960x420 box scaled into a phone is about 400x175 of actual pixels: a letterbox that squashes a
   * forty-five year range into less height than the text beside it, and the one chart on the tab that
   * most needs room. On a narrow screen the box goes taller than it is wide (560x620), which fills the
   * portrait space the device actually has. The margins shrink with it, since an 80px left gutter is a
   * seventh of a phone's width.
   *
   * Everything downstream reads innerWidth/innerHeight, so the scales, the paths and the markers all
   * follow without knowing about any of this.
   */
  /*
   * When a chart is open fullscreen, the overlay measures its own area and reports it here; the box
   * below then uses it verbatim, so one chart definition serves both the inline and the fullscreen copy.
   */
  /*
   * `touch` is a different question from `isPhone`: it asks whether a finger is doing the pointing, and
   * it governs control SIZES. A tablet is not a phone but still needs 44px targets.
   */
  const touch = isPhone || isCoarse;
  const [fullscreenChart, setFullscreenChart] = useState(null);   // 'rate' | 'mc' | 'hist' | null
  const [overlayBox, setOverlayBox] = useState(null);

  /*
   * THE CHART BOX.
   *
   * There used to be a private width listener here with its own 640px breakpoint. It is gone: the shell
   * owns one viewport subscription now (src/viewport.js) and hands the answer down, so a `md:` class and
   * this code can never disagree about where a phone starts.
   *
   * On a phone the viewBox width EQUALS the CSS width the SVG is painted at, which is the whole point:
   * SVG text then renders 1:1, so the fontSize numbers below mean what they say. The old box was 560
   * wide inside a ~318px column, which shrank every 12px label to 6.8px - legible on a desktop monitor
   * at a glance, not on a phone.
   */
  const isNarrow = isPhone;
  // the box sets the chart's proportions, not its pixels: the history chart's, inline or at full screen
  const chartBox = overlayBox || (isPhone
    ? { w: viewport.width, h: Math.min(Math.round(viewport.width * 0.8), 340, Math.round(viewport.height * 0.34)) }
    : { w: 1200, h: 420 });
  const chartWidth = chartBox.w, chartHeight = chartBox.h;



  const margin = isNarrow ? { top: 14, right: 10, bottom: 34, left: 48 } : { top: 25, right: 35, bottom: 45, left: 80 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const histXScale = useMemo(() => d3.scaleLinear().domain([currentAge, Math.max(currentAge + 1, terminalAge)]).range([0, innerWidth]), [currentAge, terminalAge, innerWidth]);


  /*
   * Sequence risk, priced.
   *
   * A published return band - ours, or an institutional one - is a statement about the annualised return
   * of a holding left alone. It is silent about withdrawals, because the information simply is not in a
   * marginal return distribution: once money is coming out, the outcome depends on the ORDER returns
   * arrive in. This measures that gap in pounds, which is the most useful thing the simulation knows
   * that a rate band does not.
   *
   * Take each tier's 10th-percentile annualised rate, compound it smoothly to the terminal age, and
   * compare against the 10th-percentile pot the simulation actually produced. Three things to note:
   *
   *  - The horizon is totalYears + 1. stepYear runs t = 0..totalYears inclusive, so a plan reporting
   *    thirty years compounds thirty-one times; using totalYears understates every rate by ~3% of
   *    itself, which reads as model error rather than an off-by-one.
   *  - Every tier moves to its own 10th percentile at once. That is coherent rather than doubly
   *    pessimistic: the engine draws a single market factor per year, so the wrappers are perfectly
   *    correlated and a bad market is bad for all of them simultaneously.
   *  - resolvedPlan, not plan, so the smooth run carries the same resolved MPAA state the simulation
   *    had. riskProfiles is a top-level key that resolveMpaa never touches.
   */




  const histMaxY = useMemo(() => Math.max(Math.max(0, ...historicalTimeline.map(d => d.totalCombined)) * 1.12, 100000), [historicalTimeline]);
  const histYScale = useMemo(() => d3.scaleLinear().domain([0, histMaxY]).range([innerHeight, 0]).nice(), [histMaxY, innerHeight]);
  const histLinePath = useMemo(() => d3.line().x(d => histXScale(d.ageSelf)).y(d => histYScale(d.totalCombined)).curve(d3.curveMonotoneX)(historicalTimeline), [historicalTimeline, histXScale, histYScale]);

  // ------------------------------------------------------------ plan mutators
  const updateAccountField = (id, field, value) => setPlan(prev => ({ ...prev, accounts: (prev.accounts || []).map(a => a.id === id ? { ...a, [field]: field === 'risk' ? value : parseInputNumber(value) } : a) }));
  /*
   * Applying a preset writes the resolved tier table AND records which preset it came from, so a later
   * change to the inflation setting can re-derive `real` from the stored nominal figures. Without that
   * the two drift apart silently: the published nominal stays put while the real rate it implies moves.
   * Editing any field by hand clears the marker, because the table is then no longer the preset.
   */
  /*
   * A preset stores published NOMINAL figures; the engine runs on real. If inflation changes while a
   * preset is active the real rates it implies change with it, so re-derive rather than leave the two
   * disagreeing. This is the one place the app maintains the Fisher relationship as an invariant rather
   * than a convention — outside a preset, `real` and `nominal` remain independent fields as before.
   */
  useEffect(() => {
    if (!plan?.riskSource || !E.CMA_PRESETS[plan.riskSource]) return;
    const infl = E.num(plan?.config?.inflation, E.DEFAULT_CONFIG.inflation);
    const want = E.applyCmaPreset(plan.riskSource, infl);
    if (!want) return;
    const stale = Object.keys(want).some(k => Math.abs(E.num(want[k].real, 0) - E.num(plan.riskProfiles?.[k]?.real, 0)) > 0.005);
    if (stale) setPlan(prev => ({ ...prev, riskProfiles: want, riskSource: prev.riskSource }));
  }, [plan?.config?.inflation, plan?.riskSource]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyRiskPreset = (key) => setPlan(prev => {
    const infl = E.num(prev?.config?.inflation, E.DEFAULT_CONFIG.inflation);
    return key === 'builtin'
      ? { ...prev, riskProfiles: { ...E.DEFAULT_RISK_PROFILES }, riskSource: '' }
      : { ...prev, riskProfiles: E.applyCmaPreset(key, infl) || prev.riskProfiles, riskSource: key };
  });

  const updateRiskField = (riskKey, field, value) => setPlan(prev => ({ ...prev, riskSource: '', riskProfiles: { ...(prev.riskProfiles || E.DEFAULT_RISK_PROFILES), [riskKey]: { ...(prev.riskProfiles || E.DEFAULT_RISK_PROFILES)[riskKey], [field]: parseInputNumber(value) } } }));
  const updateDemographics = (field, value) => setPlan(prev => ({ ...prev, demographics: { ...(prev.demographics || {}), [field]: field === 'planningMode' ? value : parseInputNumber(value) } }));
  /*
   * THE FULL AWARD IN ONE TAP, AND STILL NOT AN ASSUMPTION.
   *
   * Most people reaching State Pension age on a full National Insurance record get the full new State
   * Pension, and typing it means looking up a five-digit figure. But prefilling it is wrong, and was
   * tried and reverted: how many qualifying years stand behind somebody's award is not something this
   * plan holds, and a number that appears on its own reads as a fact about them rather than a suggestion.
   *
   * So the placeholder still only suggests, and this button is the shortcut. It is pressed when the field
   * already holds the full figure, and pressing it again CLEARS the field rather than leaving it filled,
   * because the next thing somebody does after deciding they are not on the full award is type their own
   * number - over a blank, not backspacing through someone else's.
   *
   * And it sits INSIDE the field, flush against its right edge, rather than in a box beside it. Beside
   * it, the shortcut was the same size and weight as the field itself, which made one number look like
   * two things to fill in - and in the phone's 152px control column it took a quarter of the width from
   * the digits. Inside, it is plainly part of this one field. It spans the field's full height so it
   * keeps a 44px touch target, and the field's right padding keeps six digits clear of it.
   */
  const statePensionField = (key) => {
    const v = plan?.demographics?.[key] ?? '';
    const isFull = String(v) !== '' && E.num(v, -1) === STATE_PENSION_FULL;
    return (
      <div className="relative flex">
        <MoneyInput min="0" step="250" placeholder={`e.g. ${fmtNum(STATE_PENSION_FULL)}`}
          onFocus={handleFocus} value={v} onChange={(e) => updateDemographics(key, e.target.value)}
          /* the placeholder is set smaller than the field's own 16px: the typed figure needs six digits
             and the suggestion needs eleven characters, and only the typed one has to stay at 16px (a
             phone browser zooms the page on focus below that, the placeholder is never focused) */
          className={`${inputCls} ${isPhone ? 'pr-[54px] placeholder:text-[13px]' : 'pr-[50px]'}`} />
        <button type="button" aria-pressed={isFull} data-full-state-pension
          onClick={() => updateDemographics(key, isFull ? '' : String(STATE_PENSION_FULL))}
          title={`The full new State Pension, \u00a3${fmtNum(STATE_PENSION_FULL)} a year`}
          className={`absolute inset-y-0 right-0 flex items-center justify-center rounded-r-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer transition-colors ${isPhone ? 'w-11' : 'w-10'} ${isFull ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'}`}>
          Full
        </button>
      </div>
    );
  };
  /*
   * Fields on `spending` that are NOT numbers. Anything missing from this list is passed through
   * parseInputNumber, which does String(v).replace(...) - so priorityTolerances, an object, was being
   * stored as the literal "[object Object]". Every tolerance field then read back undefined and the
   * boxes could not be typed into at all.
   */
  const NON_NUMERIC_SPENDING = ['drawdownStrategy', 'decumulationPolicy', 'priorities', 'priorityTolerances', 'spendBands'];
  const updateSpending = (field, value) => setPlan(prev => ({ ...prev, spending: { ...(prev.spending || {}), [field]: NON_NUMERIC_SPENDING.includes(field) ? value : parseInputNumber(value) } }));

  const updateConfig = (field, value) => setPlan(prev => ({ ...prev, config: { ...(prev.config || {}), [field]: (field === 'valuationDate' || field === 'taxRegion' || typeof value === 'boolean') ? value : parseInputNumber(value) } }));
  const updateListItem = (listKey, id, patch) => setPlan(p => ({ ...p, [listKey]: (p[listKey] || []).map(i => i.id === id ? { ...i, ...patch } : i) }));
  // spending bands live under plan.spending rather than at the top level, so they get their own helpers
  // instead of teaching updateListItem to walk a nested path
  const addSpendBand = () => setPlan(prev => {
    const bands = prev.spending?.spendBands || [];
    // a new band starts where the last one ended, which is what a person adding a second phase means
    const last = bands[bands.length - 1];
    const startAt = last && !E.isBlank(last.toAge) ? E.num(last.toAge, 0) + 1 : '';
    return { ...prev, spending: { ...prev.spending, spendBands: [...bands, { id: 'sb_' + Date.now(), fromAge: startAt, toAge: '', amount: '' }] } };
  });
  const deleteSpendBand = (id) => setPlan(prev => ({ ...prev, spending: { ...prev.spending, spendBands: (prev.spending?.spendBands || []).filter(b => b.id !== id) } }));
  const updateSpendBand = (id, patch) => setPlan(prev => ({ ...prev, spending: { ...prev.spending, spendBands: (prev.spending?.spendBands || []).map(b => b.id === id ? { ...b, ...patch } : b) } }));
  /*
   * A stream cannot start before its owner retires: nothing is drawn or saved while somebody is still
   * working, so an earlier age was money entered and then ignored. The field will not take one, and
   * buildContext clamps anything that arrives from an older saved plan or an import.
   */
  const incomeStartFloor = (owner) => {
    const o = ctx.owners.find(x => x.key === (owner === 'Partner' ? 'part' : 'self')) || ctx.owners[0];
    return o ? o.retireAge : 0;
  };
  const clampIncomeStart = (inc) => {
    const floor = incomeStartFloor(inc.owner);
    if (E.isBlank(inc.startAge)) return;
    if (E.num(inc.startAge, floor) < floor) updateListItem('otherIncomes', inc.id, { startAge: floor });
  };
  const addOtherIncome = () => setPlan(prev => ({ ...prev, otherIncomes: [...(prev.otherIncomes || []), { id: 'inc_' + Date.now(), name: '', owner: 'Myself', startAge: '', endAge: '', amount: '', incomeType: 'otherTaxable', notes: '' }] }));
  const deleteOtherIncome = (id) => setPlan(prev => ({ ...prev, otherIncomes: (prev.otherIncomes || []).filter(i => i.id !== id) }));
  /*
   * New deposits default to AUTO_DEPOSIT. A household receiving a windfall rarely has a considered view
   * on which wrapper it belongs in, and defaulting to Pensions quietly made that consequential choice
   * for them - one that is capped by the annual allowance, locked until 58, and in the estate from 2027.
   * Letting the policy decide at least makes the choice deliberately, against the plan's own numbers.
   */
  const addOneOffContrib = () => { const y = new Date().getFullYear() + 1; setPlan(prev => ({ ...prev, oneOffContributions: [...(prev.oneOffContributions || []), { id: 'c_' + Date.now(), date: `${y}-01-01`, year: y, owner: 'Myself', category: AUTO_DEPOSIT, amount: '', desc: '', transferredFrom: 'External', stagedTargetWrapper: CATEGORY_LABEL.other }] })); };
  const deleteOneOffContrib = (id) => setPlan(prev => ({ ...prev, oneOffContributions: (prev.oneOffContributions || []).filter(c => c.id !== id) }));
  const addOneOffCost = () => { const y = new Date().getFullYear() + 1; setPlan(prev => ({ ...prev, oneOffCosts: [...(prev.oneOffCosts || []), { id: 'cost_' + Date.now(), date: `${y}-06-01`, year: y, owner: 'Myself', amount: '', desc: '' }] })); };
  const deleteOneOffCost = (id) => setPlan(prev => ({ ...prev, oneOffCosts: (prev.oneOffCosts || []).filter(c => c.id !== id) }));





  const handleSaveAsNewScenario = () => {
    const trimmed = scenarioNameInput.trim();
    const finalName = trimmed !== '' ? trimmed : `Scenario ${scenarios.length + 1}`;
    const newId = 'scen_' + Date.now();
    setScenarios(prev => [...prev, { id: newId, name: finalName, data: clone(plan) }]);
    setActiveScenarioId(newId); setScenarioNameInput(''); flash(`Saved as "${finalName}"`);
  };
  const handleSelectScenario = (id) => {
    const selected = scenarios.find(s => s.id === id);
    if (!selected) return;
    const data = E.normalizePlan(selected.data);
    setActiveScenarioId(id); setPlan(data); setSimResult(null);
  };
  const handleDeleteScenario = (idToDelete) => {
    if (scenarios.length <= 1) { window.alert('At least one scenario must be retained.'); return; }
    const remaining = scenarios.filter(s => s.id !== idToDelete);
    setScenarios(remaining);
    if (activeScenarioId === idToDelete) { setActiveScenarioId(remaining[0].id); setPlan(E.normalizePlan(remaining[0].data)); }
  };




  // ------------------------------------------------------------ import / export / reset
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(plan, null, 2));
    const a = document.createElement('a'); a.setAttribute('href', dataStr); a.setAttribute('download', `retirement_plan_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a); a.click(); a.remove();
  };
  const handleImportJSON = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
        if (!parsed.demographics && !parsed.accounts && !parsed.spending) throw new Error('not a plan');
        setPlan(E.normalizePlan(parsed)); setSimResult(null);
        flash(`Imported ${file.name}`);
      } catch (err) {
        // The picker no longer filters by type, so a wrong file is a realistic outcome and the message
        // has to say which wrong it is rather than leaving the user guessing at their own file.
        window.alert(err.message === 'not a plan'
          ? `${file.name} is valid JSON but does not look like a plan export: it has no demographics, accounts or spending. Use a file saved with Export JSON.`
          : `${file.name} could not be read as JSON. Check it is the file you exported from this planner and that it downloaded completely.`);
      }
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };
  const handleResetDefaults = () => {
    if (window.confirm('Reset all inputs back to blank?')) { setPlan(E.normalizePlan(null)); safeStorageRemove(STORAGE_KEY); setSimResult(null); }
  };
  const handleExportCSV = () => {
    if (!auditRows.length) return;
    const headers = ['Year', 'Age (Myself)', 'Age (Partner)', 'Working (Myself)', 'Working (Partner)', 'Target Spend (£)', 'Net Guaranteed Income (£)', 'Working Partner Take-home (£)', 'State Pension (Myself £)', 'State Pension (Partner £)', 'Net Drawdown Demand (£)', 'Pension Withdrawals Gross (£)', 'PA Harvested (£)', 'Income Tax (£)', 'CGT (£)', 'Realised Gains (£)', 'Pensions (£)', 'ISAs (£)', 'Other Investments (£)', 'Cash Savings (£)', 'Total Combined Pot (£)', 'Pre-SIPP access Liquid (£)', 'Unmet (£)', 'Status', ...(auditRun ? ['Action (the solved plan)'] : [])];
    const rows = auditRows.map((r, i) => [r.year, r.ageSelf, isCouple ? r.agePart : 'N/A', r.workingSelf ? 'Yes' : 'No', isCouple ? (r.workingPart ? 'Yes' : 'No') : 'N/A', r.targetSpend.toFixed(0), r.netGuaranteed.toFixed(0), r.workingTakeHome.toFixed(0), r.spSelf.toFixed(0), isCouple ? r.spPart.toFixed(0) : '0', r.netDrawdown.toFixed(0), r.drawdownPensions.toFixed(0), r.harvested.toFixed(0), r.taxPaid.toFixed(0), (r.cgtPaid || 0).toFixed(0), (r.realisedGains || 0).toFixed(0), r.pensions.toFixed(0), r.isas.toFixed(0), r.other.toFixed(0), r.cash.toFixed(0), r.totalCombined.toFixed(0), r.preNmpaLiquid.toFixed(0), r.unmetDemand.toFixed(0), r.preNmpaInsolvent ? 'Pre-SIPP access gap' : r.unmetDemand > E.FAIL_TOLERANCE ? 'Shortfall' : 'Solvent', ...(auditRun ? [`"${auditRun.words[i] || ''}"`] : [])]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a'); link.setAttribute('href', encodeURI(csvContent)); link.setAttribute('download', `retirement_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };


  // ------------------------------------------------------------ Monte Carlo
  // Stage 1: the plan exactly as entered. Fast, and the only stage that always runs.
  const runStageTest = async () => {
    await tick();
    const stats = await runMonteCarloAsync(ctx, {
      trials: MC_TRIALS, seed: mcSeed, shouldStop: () => mcCancelRef.current, collectPaths: true,
      // already resolved: `ctx` was built from this very plan, so resolving again would be wasted work
      plan: resolvedPlan, resolve: false
    });
    if (mcCancelRef.current || !stats) return null;
    const res = { ...stats, spend: ctx.targetSpend };
    setSimResult(res);
    return res;
  };

  // the new planner's failure view: your current approach under the app's own rules, the projection's first stage, run once
  const solveFailed = solverRules && !!(solve.solveMeta && solve.solveMeta.error);
  useEffect(() => { if (solveFailed && !simResult) runStageTest(); }, [solveFailed]);   // eslint-disable-line react-hooks/exhaustive-deps













  const displayedAccounts = isCouple ? (plan?.accounts || []) : (plan?.accounts || []).filter(a => a.owner === 'Myself');
  /*
   * A tab is text with a rule under the current one, not a pill in a tray.
   *
   * The pills read as eight buttons of equal weight, which is what a toolbar looks like; an underline
   * reads as "you are here", which is what navigation looks like. It is also shorter, which matters on
   * a bar that has to hold eight labels and still wrap onto a phone.
   *
   * `-mb-px` pulls each tab down over the container's hairline so the active rule replaces that line
   * rather than sitting under it.
   */
  const tabBtn = (id, Icon, label, accent = 'blue') => (
    <button key={id} onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
      className={`px-3 py-2 -mb-px text-xs flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
        activeTab === id
          ? (accent === 'indigo' ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-blue-600 text-blue-600 font-semibold')
          : 'border-transparent text-slate-600 hover:text-slate-900 font-medium'}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
    </button>
  );
  const ageMarker = (age, label, color, fill, stroke, textColor, y, scale, shownAge = age) => (age <= effectiveMaxVisibleAge && age >= currentAge) ? (
    <g transform={`translate(${scale(age)}, 0)`}>
      <line y2={innerHeight} stroke={color} strokeWidth="1.5" strokeDasharray="4,4" />
      <rect x={-46} y={y} width={92} height={20} rx={4} fill={fill} stroke={stroke} />
      <text y={y + 14} textAnchor="middle" fill={textColor} fontSize="10" fontWeight="bold">{label} ({shownAge})</text>
    </g>
  ) : null;
  const mp = MARKER_PALETTE[chartKey(resolvedTheme)];
  const cp = CHART_PALETTE[chartKey(resolvedTheme)];
  const markers = (scale) => (
    <>
      {ageMarker(ctx.owners[0].retireAge, 'Retire M', mp.retireSelf.line, mp.retireSelf.fill, mp.retireSelf.stroke, mp.retireSelf.text, 10, scale)}
      {isCouple && ageMarker(ctx.owners[1].retireAge + (currentAge - ctx.agePart0), 'Retire P', mp.retirePart.line, mp.retirePart.fill, mp.retirePart.stroke, mp.retirePart.text, 32, scale, ctx.owners[1].retireAge)}
      {ageMarker(nmpa, 'NMPA', mp.nmpa.line, mp.nmpa.fill, mp.nmpa.stroke, mp.nmpa.text, 54, scale)}
      {ageMarker(ctx.spa, 'State Pen', mp.statePension.line, mp.statePension.fill, mp.statePension.stroke, mp.statePension.text, 76, scale)}
    </>
  );














  /*
   * `animate` is the reveal, and only the Monte Carlo STEP asks for it. Step 7 draws the same chart
   * beneath the sandbox controls, where replaying a 1.5s sweep on every nudge of a contribution would be
   * an animation you have to sit through rather than one you watched.
   */
  /*
   * The historical chart, as a function so the fullscreen overlay can render the same thing. It shares
   * the projection's chart box, so it follows the phone sizing without a second set of rules.
   */
  /*
   * NO SIDEWAYS SCROLLER ON A PHONE, in this chart wrapper and the projection's. The chart bleeds to the
   * full width and has nothing to scroll, and a scroll container is where a browser stops computing
   * touch-action: the deck's pan-y would never reach the chart, and a swipe across it would be cancelled
   * as a scroll. Measured: it was, until overflow-x-auto became desktop-only.
   */
  const renderHistoricalChart = ({ inOverlay = false } = {}) => (
                <div className={`relative ${isPhone && !inOverlay ? 'bleed swipe-x' : 'overflow-x-auto'} ${!isPhone && !inOverlay ? 'chart-holder' : ''} ${inOverlay ? 'h-full' : ''}`}>
                  {isPhone && !inOverlay && (
              <button type="button" data-chart-expand aria-label="Expand chart" onClick={() => setFullscreenChart('hist')}
                className="absolute top-1 right-1 z-10 min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-surface/90 border border-slate-200 text-slate-600 cursor-pointer">
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className={inOverlay ? 'w-full h-full select-none' : 'w-full h-auto select-none'}
              preserveAspectRatio={inOverlay ? 'xMidYMid meet' : undefined} onMouseLeave={() => setHoveredHistPoint(null)}>
                    <g transform={`translate(${margin.left}, ${margin.top})`}>
                      {histYScale.ticks(isNarrow ? 5 : 6).map((t, i) => <g key={i} transform={`translate(0, ${histYScale(t)})`}><line x2={innerWidth} stroke={cp.gridMajor} strokeDasharray="3,3" /><text x={-10} dy="0.32em" fill={cp.axisText} fontSize="10" textAnchor="end" fontFamily="monospace">£{(t / 1000).toFixed(0)}k</text></g>)}
                      {histXScale.ticks(isNarrow ? 5 : 10).map((t, i) => <g key={i} transform={`translate(${histXScale(t)}, 0)`}><line y2={innerHeight} stroke={cp.gridMinor} /><text y={innerHeight + 20} fill={cp.axisText} fontSize="11" textAnchor="middle" fontFamily="monospace">{t}</text></g>)}
                      {markers(histXScale)}
                      {histLinePath && <path d={histLinePath} fill="none" stroke={cp.historicalLine} strokeWidth="3" strokeLinecap="round" />}
                      <rect width={innerWidth} height={innerHeight} fill="transparent" onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const age = Math.round(histXScale.invert((e.clientX - rect.left) * (innerWidth / Math.max(1, rect.width)))); setHoveredHistPoint(historicalTimeline.find(d => d.ageSelf === age) || null); }} />
                      {hoveredHistPoint && <g transform={`translate(${histXScale(hoveredHistPoint.ageSelf)}, 0)`}><line y2={innerHeight} stroke={cp.hoverCrosshair} strokeWidth="1" strokeDasharray="2,2" /><circle cy={histYScale(hoveredHistPoint.totalCombined)} r="4" fill={cp.historicalHoverFill} stroke={cp.hoverDotStroke} strokeWidth="2" /></g>}
                    </g>
                  </svg>
                  {hoveredHistPoint && (
                    <div className="absolute top-4 left-24 bg-surface/95 border border-slate-200 p-3 rounded-lg shadow-lg text-xs space-y-1 backdrop-blur-md pointer-events-none">
                      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex justify-between gap-4"><span>Age {hoveredHistPoint.ageSelf} (Simulated {hoveredHistPoint.histYear ?? 'beyond data'})</span><span className="text-slate-500">Plan Year: {hoveredHistPoint.year}</span></div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 font-mono">
                        <div className="text-indigo-600 font-bold">Total Pot: {formatGBP(hoveredHistPoint.totalCombined)}</div>
                        <div className="text-slate-600">Living Target: {formatGBP(hoveredHistPoint.targetSpend)}</div>
                        {hoveredHistPoint.histStockReturn !== null && <div className={hoveredHistPoint.histStockReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>Equity Return: {hoveredHistPoint.histStockReturn.toFixed(1)}%</div>}
                        {hoveredHistPoint.histBondReturn !== null && <div className={hoveredHistPoint.histBondReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}>Bond Return: {hoveredHistPoint.histBondReturn.toFixed(1)}%</div>}
                      </div>
                    </div>
                  )}
                </div>
  );







  /*
   * THE TWO SOLVED ANSWERS, DEFINED ONCE.
   *
   * A desktop shows them side by side on one step; a phone keeps them as two steps of its own, which is
   * what a 390px screen has room for. Same contents either way - written here rather than twice, because
   * the version that is edited is never the one somebody is reading.
   */
  // Part C Phase 10, item 2's rest: under the switch, the solved plan's own highest target and earliest age at the survival
  // this step is set to, searched for over solves when asked (src/SolverSimple.jsx SolverPlanAnswers); the figures beside it
  // follow your plan's rules
  /*
   * THE CONFIG TAB'S CONTROLS AS PIECES (step U): the classic Config tab renders them where they always were; the new planner
   * renders the app's rules for the plan in You (Your current approach) and the tax rules in Details (Assumptions).
   */
  const ctlPolicy = () => (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1"><T k="decumulation">Decumulation</T> policy</label>
                  <select aria-label="Decumulation policy" value={plan?.spending?.decumulationPolicy} onChange={(e) => updateSpending('decumulationPolicy', e.target.value)} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-xs text-blue-700 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                    {Object.entries(E.DECUMULATION_POLICIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <Fine isPhone={isPhone} label="What this policy does">
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {(E.DECUMULATION_POLICIES[plan?.spending?.decumulationPolicy]?.blurb || (() => ''))(P)}
                    </span>
                  </Fine>
                </div>
                
  );
  const ctlDrawdown = () => (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Pension drawdown strategy</label>
                  <select aria-label="Pension drawdown strategy" value={plan?.spending?.drawdownStrategy} onChange={(e) => updateSpending('drawdownStrategy', e.target.value)} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-xs text-blue-700 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                    <option value="Phased Drawdown">Phased Drawdown (Ongoing {Math.round(P.pclsProp * 100)}% tax-free proportion)</option>
                    <option value="Full 25% Lump Sum">Full Lump Sum (Upfront statutory PCLS into Cash)</option>
                  </select>
                  <Fine isPhone={isPhone} label="What each one does">
                    <span className="text-[10px] text-slate-400 mt-1 block">Phased crystallises {Math.round(P.pclsProp * 100)}% tax-free with each draw; Lump Sum moves the tax-free cash (capped at £{fmtNum(P.lsa)}) into cash savings at retirement.</span>
                  </Fine>
                </div>
                
  );
  const ctlGuardrails = () => (
                <div id="config-guardrails">
                  <label className="text-slate-600 font-semibold block mb-1">Spending guardrails</label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" data-guardrails-toggle checked={!!plan?.config?.guardrails} onChange={(e) => updateConfig('guardrails', e.target.checked)} className="accent-blue-600" />
                    <span className="text-slate-700 font-semibold">Let simulated spending react to the pots (Guyton-Klinger): cut {Math.round(E.GUARDRAILS.cut * 100)}% when the withdrawal rate drifts {Math.round(E.GUARDRAILS.band * 100)}% above where it started, raise {Math.round(E.GUARDRAILS.raise * 100)}% when it drifts that far below, and skip the inflation rise after a losing year.</span>
                  </label>
                  <Fine isPhone={isPhone} label="What it changes">
                    <span className="text-[10px] text-slate-400 mt-1 block">Off, every simulated year spends the plan whatever the markets did, which is the strict test. On, the survival rate rises because bad runs are answered with cuts, so read it beside the spending figures it adds: what the typical run lived on, and what the unlucky tenth did. No cuts in the final {E.GUARDRAILS.freezeYears} years. <button type="button" onClick={() => goToDoc('doc-guardrails')} className="text-blue-600 hover:underline font-semibold cursor-pointer">Documentation &rarr;</button></span>
                  </Fine>
                </div>
  );
  const ctlLookahead = () => (
                <div id="config-lookahead">
                  <label htmlFor="config-lookahead-years" className="text-slate-600 font-semibold block mb-1">Prepare for one-off costs, years ahead</label>
                  <input id="config-lookahead-years" type="number" min="0" max="15" step="1" data-lookahead-years value={plan?.config?.lookaheadYears ?? 0} onChange={(e) => updateConfig('lookaheadYears', e.target.value)} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-slate-800 font-bold" />
                  <Fine isPhone={isPhone} label="What it changes">
                    <span className="text-[10px] text-slate-400 mt-1 block">0 is off: a one-off cost is met in its own year, and whatever the liquid wrappers cannot cover comes out of the pension in one go, through the higher bands. From this many years ahead the plan instead draws the shortfall a share at a time, never past the basic-rate limit ({formatGBP(P.higherRateStartsAt)}), and parks it in the ISA then cash to pay the cost when it lands. Only once retired and past the pension access age; Details, Year by year, shows the years it acted. <button type="button" onClick={() => goToDoc('doc-lookahead')} className="text-blue-600 hover:underline font-semibold cursor-pointer">Documentation &rarr;</button></span>
                  </Fine>
                </div>
                
  );
  const ctlHarvest = () => (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Harvest unused 0% allowance</label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={!!plan?.config?.harvestPersonalAllowance} onChange={(e) => updateConfig('harvestPersonalAllowance', e.target.checked)} className="accent-blue-600" />
                    <span className="text-slate-700 font-semibold">Draw pension beyond what the year needs and re-wrap it; proceeds fill the ISA first, then the GIA.</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">Applies to the two bracket-fill policies once retired and past the access age.</span>
                  {/* How far up the bands that harvest runs. The second setting is a bequest trade, not a
                      spending one, so it is offered here rather than assumed by a policy. */}
                  <label className="text-slate-600 font-semibold block mb-1 mt-2">…and draw up to</label>
                  <select aria-label="Harvest ceiling" value={plan?.config?.harvestCeiling === 'basic' ? 'basic' : 'pa'} onChange={(e) => updateConfig('harvestCeiling', e.target.value)} disabled={!plan?.config?.harvestPersonalAllowance} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-slate-800 font-bold cursor-pointer disabled:opacity-50">
                    <option value="pa">the tax-free personal allowance ({formatGBP(P.pa)}) — costs nothing</option>
                    <option value="basic">the basic-rate limit ({formatGBP(P.higherRateStartsAt)}) — pays 20% now</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Drawing to the basic-rate limit costs 20% today and is a <strong>bequest</strong> trade: from 2027 a pension left behind is taxed twice, by your estate and again by the heir at their own rate. It wins for a later death and loses for an early one{solverOn ? '.' : ', so let the estate optimiser on the Strategy tab decide it rather than guessing.'}</span>
                </div>
                
  );
  const ctlTaxRules = () => (
                <div>
                  <label className="text-slate-600 font-semibold block mb-1"><T k="CGT">Capital gains tax</T> on the <T k="GIA">GIA</T></label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={!!plan?.config?.cgtEnabled} onChange={(e) => updateConfig('cgtEnabled', e.target.checked)} className="accent-blue-600" />
                    <span className="text-slate-700 font-semibold">Tax gains realised when Other Investments are sold, using the cost basis of each holding.</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">Off treats the GIA as tax-free. Gains are wiped on death, so nothing is charged at the terminal age.</span>
                  <label className="text-slate-600 font-semibold block mb-1 mt-3">Tax cash interest</label>
                  <label className="flex items-center gap-2 p-2 bg-surface border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={plan?.config?.cashInterestTaxed !== false} onChange={(e) => updateConfig('cashInterestTaxed', e.target.checked)} className="accent-blue-600" />
                    <span className="text-slate-700 font-semibold">Tax the nominal interest on Cash Savings as savings income above the starting rate and the personal savings allowance.</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">Off treats all cash as a cash ISA. The allowances are set below.</span>
                  <button type="button" onClick={() => goToDoc('doc-cgt')} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer mt-1"><HelpCircle className="w-3.5 h-3.5" /> How capital gains are tracked &amp; taxed &rarr;</button>
                </div>
  );
  const floorShare = (() => { const t = E.num(plan?.spending?.targetSpend, 0), f = E.num(plan?.spending?.floorSpend, 0); return f > 0 && t > 0 ? Math.min(f, t) / t : 0.8; })();
  const aims = (plan && plan.solver && plan.solver.aims) || {};
  const leversSummary = `Dislike of cuts: ${DIAL_NAMES[aims.cuts] || 'Low'} · Estate: ${aims.estate === 'lower' ? 'lower' : 'standard'} · Raises: ${aims.raises === 'blocked' ? 'never above target' : 'up to 10%'} · Risk: ${aims.riskConsent === false ? 'kept as you chose' : 'may change'}`;
  const policyName = (E.DECUMULATION_POLICIES[plan?.spending?.decumulationPolicy] || {}).label || 'the plain draw order';
  const rulesLine = `Your current approach is your plan run by the app's own rules: ${policyName}, guardrails ${plan?.config?.guardrails ? 'on' : 'off'}. Change them in You, under Your current approach.`;
  const openLevers = () => { setLeversSeen(true); setLeversOpen(true); };
  // the solved plan's sheet (LAYOUT.md section 3.1), from Your plan's own figures, its words from the table (a chunk of its own)
  const printSolvedPlan = async () => {
    if (!planFigures) return;
    const { solvedSheetHtml } = await import('./solvedSheet.js');
    const ok = openActionPlan(solvedSheetHtml(planFigures, { fmt: formatGBP, levers: leversSummary, rulesLine, code: APP_VERSION }));
    if (!ok) flash('The browser blocked the new window: allow pop-ups for this site to print the plan.');
  };
  useEffect(() => {
    if (!leversOpen) return undefined;
    const onKey = e => { if (e.key === 'Escape') setLeversOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leversOpen]);
  const aimsPanel = (inSheet = false) => (
    <Suspense fallback={null}>
      <SolverAimsCard plan={plan} setPlan={setPlan} solve={solve} isPhone={isPhone} fmt={formatGBP} updateConfig={updateConfig} terminalAge={terminalAge} ui={SOLVER_UI}
        seed={mcSeed} upto={plannerSteps[0]} engine={E} opts={SOLVER_OPTS} solveLine={false} collapse={!inSheet} />
    </Suspense>
  );
  // the new planner's cards come in a chunk of their own (src/PlannerCards.jsx; LAYOUT.md section 11.2)
  const couplesCard = () => (
    <Suspense fallback={null}><PlannerCouples isPhone={isPhone} why={coupleState ? coupleState.why : 'off'} share={coupleState ? coupleState.share : null} shape={coupleState ? coupleState.shape || null : null} onDetails={() => { setActiveTab('details'); window.scrollTo(0, 0); }} onOnePerson={() => { setActiveTab('you'); selectSection('you'); }} /></Suspense>
  );
  const youNav = () => <Suspense fallback={null}><PlannerYouNav sections={PLANNER_SECTIONS} names={YOU_NAMES} /></Suspense>;
  const youHeader = () => <Suspense fallback={null}><PlannerYouHeader isPhone={isPhone} onSave={handleSaveAsNewScenario} /></Suspense>;
  // You's last card (LAYOUT.md section 3.2): the app's rules for the plan, each control saying whether it works the plan out again
  const RESOLVES = 'Changing this works your plan out again: the solved plan uses it too.';
  const KEEPS = 'The solved plan does not use this: changing it re-runs the comparison.';
  const currentApproachCard = () => (
    <section data-current-approach className="pt-4 border-t border-slate-100 space-y-3">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">Your current approach</h3>
        <p className="text-xs text-slate-500 mt-1">The app&apos;s own rules for your plan. The solved plan is compared with them (Your plan, the last card). The solver makes its own choices, but it also works from some of these.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {[['policy', ctlPolicy, RESOLVES], ['drawdown', ctlDrawdown, RESOLVES], ['harvest', ctlHarvest, RESOLVES], ['guardrails', ctlGuardrails, KEEPS], ['lookahead', ctlLookahead, KEEPS]].map(([k, ctl, line]) => (
          <div key={k} data-approach-control={k} data-approach-resolves={line === RESOLVES ? 'yes' : 'no'} className="space-y-1">
            {ctl()}
            <p className="text-[11px] text-slate-600">{line}</p>
          </div>
        ))}
      </div>
    </section>
  );
  // What if's scenarios (LAYOUT.md section 3.3): the current plan first, each saved one with what differs, its solved line, Load
  // and Delete; a couple's keeps the app's rules
  const solverSettingsCard = () => (
    <Suspense fallback={null}><PlannerSettings points={(SOLVER_OPTS && SOLVER_OPTS.points) || 45} paths={plannerSteps[plannerSteps.length - 1]} solve={solve} plan={plan} isPhone={isPhone} /></Suspense>
  );
  const docsSolverCard = () => (
    <Suspense fallback={null}>
      <PlannerDocs isPhone={isPhone} open={docsOpen} onOpen={() => setDocsOpen(true)} points={(SOLVER_OPTS && SOLVER_OPTS.points) || 45} paths={plannerSteps[plannerSteps.length - 1]} comparePaths={plannerSteps[0]}>
        {docsOpen && (
          <Suspense fallback={<div className="text-sm text-slate-400">Loading the documentation&hellip;</div>}>
            <Docs E={E} P={P} plan={plan} nmpa={nmpa} activeRiskMatrix={activeRiskMatrix} isPhone={isPhone}
              docSections={docSections} onSections={onDocSections} scrollToDocSection={scrollToDocSection}
              formatGBP={formatGBP} fmtNum={fmtNum}
              solverFacts={{ points: (SOLVER_OPTS && SOLVER_OPTS.points) || 45, paths: plannerSteps[plannerSteps.length - 1], comparePaths: plannerSteps[0] }} />
          </Suspense>
        )}
      </PlannerDocs>
    </Suspense>
  );
  // the history and audit tabs as pieces (step U): the classic tabs render them as before, the new planner's Details too
  const historyView = () => (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs text-slate-700 space-y-2">
              <Fine isPhone={isPhone} label="How the backtest works"
                head={<div className="flex items-center gap-2 font-bold text-indigo-900 text-sm"><History className="w-4 h-4 text-indigo-600" /> Empirical Historical Backtest ({E.HISTORICAL_FIRST_YEAR}–{E.HISTORICAL_LAST_YEAR})</div>}>
              <p>Feeds actual historical real returns (US large-cap equities and a 50/50 government/corporate bond blend, weighted by each wrapper's risk tier) into your plan, <strong>starting from today (Age {currentAge})</strong> through to Age {terminalAge}.</p>
              <p className="text-slate-500">Selectable start years are capped at <strong>{maxHistoricalStartYear}</strong> so your {spanYears}-year plan runs within recorded history through {E.HISTORICAL_LAST_YEAR}.{historicalMetrics?.beyondData && ' Years beyond the dataset use the expected return.'}</p>
              <p className="text-slate-500">Your working years cannot run the pot dry, because your living spend is only drawn from the first retirement onwards. The verdict below therefore counts <strong>drawdown years</strong>, not calendar years — a plan that fails the moment you stop working has funded nothing, however far away that moment is.</p>
              </Fine>
            </div>
            {/* every start year first (the UI pass, 21 Nov): the overview a year is picked from, above the picker */}
            {solverOn && yourHistAll && (
              <Suspense fallback={null}>
                <HistoryStripCard solved={histAll.key === solve.key ? histAll.list : null} failed={histAll.key === solve.key && !!histAll.failed} yours={yourHistAll} selected={activeHistoricalStartYear} onPick={setSelectedHistoricalYear} isPhone={isPhone} />
              </Suspense>
            )}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div><h3 className="text-sm font-semibold text-slate-900">Select a historical scenario or start year</h3>{!isPhone && <span className="text-[11px] text-slate-500">Select an iconic crisis preset or slide to any year between {E.HISTORICAL_FIRST_YEAR} and {maxHistoricalStartYear}.</span>}</div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-indigo-700"><span>Start Year:</span><input aria-label="Start year" type="number" min={E.HISTORICAL_FIRST_YEAR} max={maxHistoricalStartYear} value={activeHistoricalStartYear} onChange={(e) => setSelectedHistoricalYear(Math.max(E.HISTORICAL_FIRST_YEAR, Math.min(maxHistoricalStartYear, Number(e.target.value) || E.HISTORICAL_FIRST_YEAR)))} className="w-16 p-1 bg-surface border border-slate-300 rounded text-center text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {HISTORICAL_PRESETS.map(p => {
                  const isValid = p.year <= maxHistoricalStartYear;
                  return (
                    <button key={p.year} onClick={() => isValid && setSelectedHistoricalYear(p.year)} disabled={!isValid} className={`p-2.5 rounded-lg border text-left transition-all ${!isValid ? 'bg-slate-50 text-slate-400 border-slate-200/50 cursor-not-allowed opacity-50' : activeHistoricalStartYear === p.year ? 'bg-accent text-onaccent border-accent cursor-pointer' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer'}`}>
                      <div className="flex items-center justify-between"><span className="font-bold text-xs">{p.year}</span>{!isValid && <span className="text-[9px] text-slate-400 font-sans">Over {E.HISTORICAL_LAST_YEAR}</span>}</div>
                      <div className={`text-[10px] leading-tight truncate mt-0.5 ${!isValid ? 'text-slate-400' : activeHistoricalStartYear === p.year ? 'text-onaccent' : 'text-slate-500'}`}>{p.label.split('(')[0]}</div>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 flex items-center gap-3"><span className="text-xs font-mono text-slate-400">{E.HISTORICAL_FIRST_YEAR}</span><input aria-label="Start year" type="range" min={E.HISTORICAL_FIRST_YEAR} max={maxHistoricalStartYear} value={activeHistoricalStartYear} onChange={(e) => setSelectedHistoricalYear(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" /><span className="text-xs font-mono text-slate-600 font-bold">{maxHistoricalStartYear}</span></div>
            </div>
            {/* Part C Phase 10, item 7: under the switch the backtest runs the solved plan, and says what it is: the check outside
                the model the plan was solved in, with your plan's verdict on the same history beside it */}
            {solvedHistory && (
              <Suspense fallback={null}>
                <SolverHistoryCard verdict={solvedHistory.verdict} start={activeHistoricalStartYear} yours={yourHistoricalVerdict} floor={ctx.solvencyFloor} fmt={formatGBP} />
              </Suspense>
            )}
            {/* One column of four cards is 470px on a phone for three numbers and a verdict. The verdict
                keeps the full width - it is a sentence - and the three figures go three across, which is
                what they are: a row of readings. */}
            {historicalMetrics && (
              <div className={`grid grid-cols-1 sm:grid-cols-4 ${isPhone ? 'gap-2' : 'gap-4'}`}>
                <div className={`p-4 rounded-xl border ${historicalMetrics.survived ? 'bg-emerald-50/90 border-emerald-200' : 'bg-rose-50/90 border-rose-200'}`}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] block text-slate-500 mb-1">Backtest verdict</span>
                  <div className="flex items-center gap-2">{historicalMetrics.survived ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />}<div><div className={`text-base font-black ${historicalMetrics.survived ? 'text-emerald-800' : 'text-rose-800'}`}>{historicalMetrics.survived ? `Survived all ${spanYears} years` : historicalMetrics.failReason === 'floor' ? `All ${spanYears} years funded, below floor` : historicalMetrics.failedBeforeDrawdown ? `Ran dry before retirement, at Age ${historicalMetrics.failAge}` : historicalMetrics.fundedDrawdownYears <= 0 ? `Ran dry in year 1 of ${historicalMetrics.drawdownYears} drawdown years` : `Ran dry after ${historicalMetrics.fundedDrawdownYears} of ${historicalMetrics.drawdownYears} drawdown years`}</div><span className="text-[11px] text-slate-500">{historicalMetrics.survived ? `Age ${currentAge} to ${terminalAge}, no shortfall in any year`
                    : historicalMetrics.failReason === 'floor' ? `Ends below the ${formatGBP(ctx.solvencyFloor)} bequest floor at Age ${terminalAge}`
                      : `${historicalMetrics.failReason === 'pre-access' ? `Pension still locked at Age ${historicalMetrics.failAge}` : `Age ${historicalMetrics.failAge}`} (${historicalMetrics.failYear}) · ${historicalMetrics.unfundedYears} of ${spanYears} plan years unfunded${historicalMetrics.failCost > 0 ? ` · a ${formatGBP(historicalMetrics.failCost)} one-off cost falls that year` : ''}`}</span></div></div>
                </div>
                <div className={isPhone ? 'col-span-1 grid grid-cols-3 gap-2' : 'contents'}>
                  <div className={`bg-surface border border-slate-200/90 rounded-xl min-w-0 ${isPhone ? 'p-2' : 'p-4'}`}><span className="text-[11px] font-semibold uppercase tracking-[0.08em] block text-slate-500 mb-1 leading-tight">Starting balance</span><div className={`font-bold font-mono text-slate-900 mt-1 truncate ${isPhone ? 'text-sm' : 'text-xl'}`}>{formatGBP(historicalMetrics.startVal)}</div>{!isPhone && <span className="text-[11px] text-slate-400">After year-0 flows, at Age {currentAge}</span>}</div>
                  <div className={`bg-surface border border-slate-200/90 rounded-xl min-w-0 ${isPhone ? 'p-2' : 'p-4'}`}><span className="text-[11px] font-semibold uppercase tracking-[0.08em] block text-slate-500 mb-1 leading-tight">Lowest trough</span><div className={`font-bold font-mono text-amber-700 mt-1 truncate ${isPhone ? 'text-sm' : 'text-xl'}`}>{formatGBP(historicalMetrics.minVal)}</div>{!isPhone && <span className="text-[11px] text-slate-400">Lowest total experienced</span>}</div>
                  <div className={`bg-surface border border-slate-200/90 rounded-xl min-w-0 ${isPhone ? 'p-2' : 'p-4'}`}><span className="text-[11px] font-semibold uppercase tracking-[0.08em] block text-slate-500 mb-1 leading-tight">Pot @ {terminalAge}</span><div className={`font-bold font-mono mt-1 truncate ${isPhone ? 'text-sm' : 'text-xl'} ${historicalMetrics.terminalVal > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatGBP(historicalMetrics.terminalVal)}</div>{!isPhone && <span className="text-[11px] text-slate-400">Real purchasing power remaining · lifetime tax {formatGBP(historicalMetrics.lifetimeTax)}</span>}</div>
                </div>
              </div>
            )}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
              <div><h3 className="text-base font-semibold text-slate-900">Historical Wealth Path (Simulating {activeHistoricalStartYear}–{activeHistoricalStartYear + spanYears})</h3><span className="text-xs text-slate-500">Real purchasing power across accumulation and <T k="decumulation">decumulation</T></span></div>
            {renderHistoricalChart()}
            </div>
          </div>
        
  );
  const auditCard = () => (
          <div className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div><h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Table className="w-4 h-4 text-blue-600" /> {auditRun ? 'Year by year, on the expected returns' : solverOn ? 'Your current approach, year by year, on the expected returns' : <>Year-by-Year Cash Flow &amp; Wrapper Ledger</>}</h2>{solverOn && solvedInHand && !solvedLedger && (solvedRows.key === solve.key && solvedRows.expectedFailed
                ? <p data-audit-wait="failed" className="text-xs text-slate-600 mt-1">The solved plan&apos;s year by year could not be worked out; your current approach&apos;s is shown.</p>
                : <p data-audit-wait="pending" className="text-xs text-slate-600 mt-1">The solved plan&apos;s year by year is being worked out; your current approach&apos;s is shown until it is in.</p>)}<span className="text-xs text-slate-500">{auditRun ? <>One steady market, not a forecast: every year&apos;s figures as raw numbers, so you can check the arithmetic.</> : <>Expected-return path: contributions, guaranteed income, <T k="decumulation">decumulation</T> waterfall, tax and wrapper balances (end of year).</>}</span>
                {solvedLedger && <div className="mt-2 inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs" role="group" aria-label="Whose ledger" data-audit-view={auditView}>
                  {[['solved', 'The solved plan'], ['yours', 'Your current approach']].map(([v, l]) => <button key={v} type="button" aria-pressed={auditView === v} onClick={() => setAuditView(v)} className={`px-3 py-1.5 min-h-9 font-semibold cursor-pointer ${auditView === v ? 'bg-accent text-onaccent' : 'bg-surface text-slate-600 hover:bg-slate-100'}`}>{l}</button>)}
                </div>}</div>
              <button onClick={handleExportCSV} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer self-start sm:self-auto"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV spreadsheet</button>
            </div>
            {/* A fifty-year ledger is 2,160px of table, and on a phone that was 2,160px of PAGE: the head
                of the tab scrolled away and the column names with it. Capped at 60% of the screen with
                its own scroll and a stuck header, the tab is one screen and the table is still all there
                - which is the shape a table wants on a phone anyway. The desktop box is unchanged. */}
            <div tabIndex={0} className={`overflow-x-auto border border-slate-200 rounded-lg ${isPhone ? 'max-h-[60vh] overflow-y-auto' : ''}`}>
              <table className="w-full text-left text-xs border-collapse" data-audit-ledger={auditRun ? 'solved' : 'yours'}>
                <thead className={`bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold font-sans ${isPhone ? 'sticky top-0 z-10' : ''}`}><tr><th className="p-2.5">Year</th><th className="p-2.5">Age (M)</th>{isCouple && <th className="p-2.5">Age (P)</th>}<th className="p-2.5">Spend target</th>{auditRun && <th className="p-2.5">The year&apos;s move</th>}{!auditRun && !!plan?.config?.guardrails && <th className="p-2.5">Guardrail</th>}{!auditRun && plan?.config?.lookaheadYears > 0 && <th className="p-2.5">Set aside</th>}<th className="p-2.5">Guaranteed + Take-home (net)</th><th className="p-2.5">Net drawdown</th><th className="p-2.5">Pension draw (gross)</th><th className="p-2.5">Tax</th>{P.cgtEnabled && <th className="p-2.5">CGT</th>}<th className="p-2.5">Pensions</th><th className="p-2.5">ISAs</th><th className="p-2.5">Other inv</th><th className="p-2.5">Cash</th><th className="p-2.5">Total combined</th><th className="p-2.5">Pre-SIPP access Liquid</th><th className="p-2.5 text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditRows.map((r, i) => (
                    <tr key={r.year} className="hover:bg-slate-50/80 transition-colors" data-audit-total={r.totalCombined}>
                      <td className="p-2 font-bold text-slate-800">{r.year}</td><td className="p-2">{r.ageSelf}</td>{isCouple && <td className="p-2">{r.agePart}</td>}
                      <td className="p-2 font-sans font-medium text-slate-700">{formatGBP(r.targetSpend)}</td>
                      {/* the solved plan's action this year (Phase 10, item 7): the spending level where the year has a target,
                          then what the move does beyond it, in the Strategy tab's words, shortened */}
                      {auditRun && <td className="p-2 font-sans text-slate-700 min-w-[12rem]" data-audit-action={auditRun.parts[i] ? JSON.stringify(auditRun.parts[i]) : ''}>{auditRun.words[i] || <span className="text-slate-300">&mdash;</span>}</td>}
                      {/* What the spending rule did this year, and the multiplier it has left on the draw. Only
                          the rows where it acted carry a label, so the column reads as a list of events. */}
                      {!auditRun && !!plan?.config?.guardrails && <td className="p-2 font-sans" data-guardrail-cell>
                        {r.guardrail
                          ? <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${/cut/.test(r.guardrail) ? 'bg-rose-100 text-rose-800' : /raise/.test(r.guardrail) ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{r.guardrail}</span>
                          : <span className="text-slate-300">&mdash;</span>}
                        {r.spendMult !== 1 && <span className="text-[9px] text-slate-400 block">draw &times;{r.spendMult.toFixed(2)}</span>}
                      </td>}
                      {/* Pension drawn at the basic rate ahead of a known cost and parked to pay it. Only the
                          years it acted carry a figure, each naming the cost year it is for. */}
                      {!auditRun && plan?.config?.lookaheadYears > 0 && <td className="p-2 font-sans" data-lookahead-cell>
                        {r.reserved > 0
                          ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">{formatGBP(r.reserved)} <span className="font-normal">for {r.reservedFor}</span></span>
                          : <span className="text-slate-300">&mdash;</span>}
                      </td>}
                      <td className="p-2 text-emerald-700">{formatGBP(r.netGuaranteed + r.workingTakeHome)}</td>
                      <td className="p-2 text-rose-600 font-medium">{formatGBP(r.netDrawdown)}</td>
                      <td className="p-2 text-sky-700">{formatGBP(r.drawdownPensions)}{r.harvested > 0 && <span className="text-[9px] text-slate-400 block">incl. {formatGBP(r.harvested)} harvested</span>}</td>
                      <td className="p-2 text-slate-600">{formatGBP(r.taxPaid)}</td>
                      {P.cgtEnabled && <td className="p-2 text-amber-700">{formatGBP(r.cgtPaid || 0)}{r.realisedGains > 0 && <span className="text-[9px] text-slate-400 block">on {formatGBP(r.realisedGains)} gains</span>}</td>}
                      <td className="p-2 text-sky-700">{formatGBP(r.pensions)}</td><td className="p-2 text-teal-700">{formatGBP(r.isas)}</td><td className="p-2 text-amber-700">{formatGBP(r.other)}</td><td className="p-2 text-slate-700">{formatGBP(r.cash)}</td>
                      <td className="p-2 font-bold text-blue-700">{formatGBP(r.totalCombined)}</td><td className="p-2 text-slate-600">{formatGBP(r.preNmpaLiquid)}</td>
                      <td className="p-2 text-right">{r.preNmpaInsolvent ? <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-sans text-[10px] font-bold">Pre-SIPP access Gap</span> : r.unmetDemand > E.FAIL_TOLERANCE ? <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-sans text-[10px] font-bold">Shortfall {formatGBP(r.unmetDemand)}</span> : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans text-[10px] font-bold">Solvent</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
  );
  // the reference cards of Details (Assumptions); the region's select is in You (a fact about the person)
  const ctlRegion = () => (
              <div className="pb-1">
                <label className="text-slate-600 font-semibold block mb-1 text-xs">Where you pay income tax</label>
                <select aria-label="Where you pay tax" value={plan?.config?.taxRegion ?? 'ruk'} onChange={(e) => updateConfig('taxRegion', e.target.value)} className="w-full sm:w-80 p-2 bg-surface border border-slate-300 rounded-lg text-xs text-blue-700 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                  {Object.entries(E.TAX_REGION_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {plan?.config?.taxRegion === 'scotland'
                    ? 'Scotland sets six bands, and its higher rate starts at £43,662 rather than £50,270. Only income tax is devolved: National Insurance, capital gains tax, the personal allowance and its taper are the same everywhere, and relief at source on a pension contribution is 20% for everyone.'
                    : plan?.config?.taxRegion === 'wales'
                      ? 'Wales can vary its rates under the Welsh Rates of Income Tax but has set them equal to England and Northern Ireland every year so far, so this returns the same figures. It is here so the answer is confirmed rather than assumed.'
                      : 'Three bands at 20, 40 and 45%. Choose Scotland for its six-band set, or Wales, whose rates currently match these.'}
                </span>
              </div>
  );
  const assumptionCards = () => (<>
            <CollapsibleCard icon={Settings} title="Global Economic & Calculation Configuration"
              subtitle="Valuation date, inflation, access ages, the pension death-tax haircut and the Monte Carlo seed.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                <div><label className="text-slate-600 font-semibold block mb-1">Valuation date (today)</label><input type="date" value={plan?.config?.valuationDate ?? ''} onChange={(e) => updateConfig('valuationDate', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Year 0 flows are pro-rated to the {(ctx.yf * 100).toFixed(0)}% of the year remaining.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Headline inflation <T k="CPI">CPI</T> (% pa)</label><input type="number" step="0.1" placeholder="2.5" onFocus={handleFocus} value={plan?.config?.inflation ?? ''} onChange={(e) => updateConfig('inflation', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Only used for the nominal display series.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Personal pension access age (<T k="NMPA">NMPA</T>)</label><input type="number" min="0" max="120" placeholder="58" onFocus={handleFocus} value={plan?.demographics?.privatePensionAge ?? ''} onChange={(e) => updateDemographics('privatePensionAge', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Statutory NMPA is 55 today and 57 from April 2028.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">State Pension start age</label><input type="number" min="0" max="120" placeholder="68" onFocus={handleFocus} value={plan?.demographics?.statePensionAge ?? ''} onChange={(e) => updateDemographics('statePensionAge', e.target.value)} className={inputCls} /></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Pension death-tax haircut (%)</label><input type="number" min="0" max="100" step="5" placeholder="0" onFocus={handleFocus} value={plan?.config?.pensionDeathTaxRate ?? ''} onChange={(e) => updateConfig('pensionDeathTaxRate', parsePercent(e.target.value))} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Applied to pension left at age {terminalAge} for the "net" pot figures only (<T k="IHT">IHT</T> from April 2027 / beneficiary income tax).</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1"><T k="Monte Carlo">Monte Carlo</T> seed</label><div className="flex gap-1"><input type="number" value={mcSeed} onChange={(e) => setMcSeed(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} /><button type="button" onClick={() => setMcSeed(Math.floor(Math.random() * 1e9) + 1)} className="px-2 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-slate-200">Reseed</button></div><span className="text-[10px] text-slate-400 mt-1 block">Same seed = same market paths (reproducible, fair comparisons).</span></div>
              </div>
            </CollapsibleCard>

            <CollapsibleCard title="Asset allocations, return matrix & volatilities (σ)"
              subtitle="The expected real return, volatility and forecast uncertainty behind every projection.">
              <div tabIndex={0} className="overflow-x-auto space-y-4">
              <div className="flex justify-between items-start gap-3">
                <span className="text-[11px] text-slate-500">Expected real return is treated as the median (geometric) annual rate; <T k="Monte Carlo">Monte Carlo</T> paths are log-normal around it with the stated σ, one market factor for all wrappers. The lucky and unlucky columns are calculated from the expected rate, σ, forecast uncertainty and your {ctx.totalYears}-year horizon, so they are not editable.</span>
                <button onClick={() => setIsEditingRisk(!isEditingRisk)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${isEditingRisk ? 'bg-accent text-onaccent border-blue-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}><Pencil className="w-3.5 h-3.5" />{isEditingRisk ? 'Done Editing' : 'Edit Matrix'}</button>
              </div>

              {/*
                  ONE SET OF ASSUMPTIONS, NAMED.
                  There was a picker here offering the house figures alongside the published set. It was a
                  choice nobody could make well - the two differ in whether a forecast-uncertainty term
                  exists at all, which is not a preference - and it let a plan sit on undated figures
                  without saying so. The published set is simply what the model runs on now, and this says
                  where it came from and when it needs refreshing. Editing any cell still makes the table
                  your own, and the note below says so once that happens.
              */}
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-1 text-[11px] text-slate-500">
                <span className="text-xs text-slate-600 font-semibold whitespace-nowrap">Source:</span>
                {plan?.riskSource && E.CMA_PRESETS[plan.riskSource] ? (
                  <span>
                    <strong className="text-slate-700">{E.CMA_PRESETS[plan.riskSource].name}</strong> &mdash; {E.CMA_PRESETS[plan.riskSource].detail},
                    published {E.CMA_PRESETS[plan.riskSource].published}. {E.CMA_PRESETS[plan.riskSource].note} Published
                    figures are nominal and are shown here deflated at your {E.num(plan?.config?.inflation, 2.5)}% inflation
                    setting, so changing that changes these. <strong className="text-slate-700">Expires {E.CMA_PRESETS[plan.riskSource].expires}</strong> &mdash;
                    refresh from the source after that. Editing any cell below makes the table your own.
                  </span>
                ) : (
                  <span>
                    <strong className="text-slate-700">Your own figures.</strong> These started as the {E.CMA_PRESETS[E.DEFAULT_RISK_SOURCE].name} set
                    and have been edited, so they are no longer that source and no longer track your inflation setting.
                    <button type="button" onClick={() => applyRiskPreset(E.DEFAULT_RISK_SOURCE)}
                      className="ml-1.5 font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer">Restore the published figures</button>
                  </span>
                )}
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-2">Allocation category</th><th className="pb-2">Expected real return (% pa)</th><th className="pb-2">Unlucky, 10th <T k="percentile">%ile</T> (% pa)</th><th className="pb-2">Lucky, 90th %ile (% pa)</th><th className="pb-2">Nominal return (% pa)</th><th className="pb-2">Annual <T k="volatility">Volatility</T> (σ % pa)</th><th className="pb-2">Forecast uncertainty (% pa)</th></tr></thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {Object.entries(activeRiskMatrix).map(([key, val]) => {
                    // totalYears + 1, not totalYears: stepYear runs t = 0..totalYears inclusive, so the plan
                    // compounds one more time than its stated length. Matching it here is what lets the rate
                    // in this column actually compound to the pot quoted under the Monte Carlo fan.
                    const band = E.luckyBand(E.num(val.real, 0) / 100, E.num(val.volatility, 12) / 100, ctx.totalYears + 1, E.num(val.sigmaParam, 0) / 100);
                    return (
                    <tr key={key} className="hover:bg-slate-50/80">
                      <td className="py-2.5 font-sans font-bold text-slate-800">{val.label || key}</td>
                      {[['real', 'text-blue-700', 0.05], ['unlucky', 'text-rose-700', 0.05], ['lucky', 'text-emerald-700', 0.05], ['nominal', 'text-purple-700', 0.05], ['volatility', 'text-amber-700', 0.5], ['sigmaParam', 'text-slate-600', 0.05]].map(([field, color, step]) => (
                        <td key={field} className="py-2.5">
                          {field === 'lucky' || field === 'unlucky' ? (
                            <span className={`${color} font-bold`}>{(band[field] * 100).toFixed(2)}%</span>
                          ) : isEditingRisk ? (
                            <input type="number" step={step} min={field === 'volatility' || field === 'sigmaParam' ? 0 : undefined} onFocus={handleFocus} value={val[field] ?? ''} onChange={(e) => updateRiskField(key, field, e.target.value)} className={`w-20 p-1 bg-surface border border-slate-300 rounded font-mono ${color} font-bold focus:bg-surface focus:ring-1 focus:ring-blue-500`} />
                          ) : <span className={`${color} font-bold`}>{E.num(val[field], 0).toFixed(field === 'volatility' ? 1 : 2)}%</span>}
                        </td>
                      ))}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </CollapsibleCard>

            <CollapsibleCard title="UK Income Tax, National Insurance & Pension Allowances"
              subtitle="Defaults are 2026/27 (frozen to April 2031), and all thresholds are held constant in real terms. Not modelled: the higher tax rates on savings income from April 2027 (22%, 42% and 47%), and the £2,000 cap on National Insurance relief for salary sacrifice from April 2029, except on an employee's own National Insurance where the solver chooses where a year's saving goes; and because the thresholds are held in real terms where the law freezes them in cash, tax before April 2031 may be a little higher than shown.">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                {[
                  ['personalAllowance', 'Personal Allowance (£)'], ['paTaperThreshold', 'PA Taper Threshold (£)'], ['paTaperRate', 'PA Taper Rate (% of excess)'],
                  ...(plan?.config?.taxRegion === 'scotland' ? [
                    ['scotStarterRate', 'Starter Rate (%)'], ['scotStarterLimit', 'Basic Rate Starts At (£ income)'],
                    ['scotBasicRate', 'Basic Rate (%)'], ['scotBasicLimit', 'Intermediate Rate Starts At (£ income)'],
                    ['scotIntermediateRate', 'Intermediate Rate (%)'], ['scotIntermediateLimit', 'Higher Rate Starts At (£ income)'],
                    ['scotHigherRate', 'Higher Rate (%)'], ['scotHigherLimit', 'Advanced Rate Starts At (£ income)'],
                    ['scotAdvancedRate', 'Advanced Rate (%)'], ['scotAdvancedLimit', 'Top Rate Starts At (£ income)'],
                    ['scotTopRate', 'Top Rate (%)']
                  ] : [
                    ['basicBandLimit', 'Higher Rate Starts At (£ income)'], ['basicTaxRate', 'Basic Rate (%)'],
                    ['higherBandLimit', 'Additional Rate Starts At (£ income)'], ['higherTaxRate', 'Higher Rate (%)'], ['additionalTaxRate', 'Additional Rate (%)']
                  ]),
                  ['nicPrimaryThreshold', 'NIC Primary Threshold (£)'], ['nicUpperEarningsLimit', 'NIC Upper Earnings Limit (£)'], ['nicMainRate', 'NIC Main Rate (%)'], ['nicUpperRate', 'NIC Upper Rate (%)'],
                  ['class4MainRate', 'Class 4 Main Rate (%, self-employed)'], ['class4UpperRate', 'Class 4 Upper Rate (%, self-employed)'],
                  ['employerNicRate', 'Employer NIC Rate (%)'], ['pclsProportion', 'PCLS Tax-Free (%)'], ['pclsMaxCap', 'Lump Sum Allowance (£ LSA)'],
                  ['isaAnnualAllowance', 'ISA Allowance (£/person/yr)'], ['pensionAnnualAllowance', 'Pension Annual Allowance (£/person/yr)'], ['pensionNoEarningsLimit', 'Pension Limit With No Earnings (£/person/yr)'], ['mpaaLimit', 'Money Purchase Annual Allowance (£/person/yr)'], ['pensionTaperThreshold', 'Annual Allowance Taper Threshold (£ earnings)'], ['pensionTaperRate', 'Annual Allowance Taper Rate (%)'], ['pensionTaperFloor', 'Tapered Annual Allowance Floor (£)'], ['cgtAnnualExempt', 'CGT Annual Exempt Amount (£/person/yr)'], ['cgtBasicRate', 'CGT Rate: Basic Band (%)'], ['cgtHigherRate', 'CGT Rate: Higher/Additional Band (%)'],
                  ['savingsAllowanceBasic', 'Personal Savings Allowance: Basic Rate (£)'], ['savingsAllowanceHigher', 'Personal Savings Allowance: Higher Rate (£)'], ['startingRateSavingsBand', 'Starting Rate for Savings Band (£)'], ['cashIsaAllowance', 'Cash ISA Cap (£/person/yr)'], ['cashIsaAllowanceUnder65', 'Cash ISA Cap Under 65 (£, from the year below)'], ['cashIsaAllowanceUnder65From', 'Cash ISA Under-65 Cap Applies From (year)'],
                  ['giaDividendYield', 'GIA Dividend Yield (% of value a year, 0 = off)'], ['dividendAllowance', 'Dividend Allowance (£)'], ['dividendBasicRate', 'Dividend Rate: Basic Band (%)'], ['dividendHigherRate', 'Dividend Rate: Higher Band (%)'], ['dividendAdditionalRate', 'Dividend Rate: Additional Band (%)']
                ].map(([field, label]) => (
                  <div key={field}><span className="text-slate-600 font-sans font-semibold block mb-1">{label}</span><input type="number" min="0" placeholder={String(E.DEFAULT_CONFIG[field])} onFocus={handleFocus} value={plan?.config?.[field] ?? ''} onChange={(e) => updateConfig(field, e.target.value)} className={smallInputCls} /></div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdvancedConfig(v => !v)} className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 uppercase tracking-[0.08em] flex items-center gap-1.5 cursor-pointer">
                  <Settings className="w-3.5 h-3.5" /> Advanced inputs {showAdvancedConfig ? '▾' : '▸'}
                  <span className="font-normal normal-case tracking-normal text-slate-400">(niche settings most plans leave at the default)</span>
                </button>
                {showAdvancedConfig && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono mt-3">
                    <div><span className="text-slate-600 font-sans font-semibold block mb-1">Employer NIC passed to pension (%)</span><input type="number" min="0" placeholder={String(E.DEFAULT_CONFIG.employerNicPassThrough)} onFocus={handleFocus} value={plan?.config?.employerNicPassThrough ?? ''} onChange={(e) => updateConfig('employerNicPassThrough', e.target.value)} className={smallInputCls} /><span className="text-[10px] text-slate-400 font-sans mt-1 block">Share of the employer's NIC saving added to a salary-sacrifice contribution.</span></div>
                  </div>
                )}
              </div>
            </CollapsibleCard>
  </>);
  const numberFormatCard = () => (
            <div data-number-format className="bg-surface border border-slate-200/90 p-5 rounded-xl flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Table className="w-4 h-4 text-blue-600" /> Decimal choice</h2>
                <p className="text-xs text-slate-500 mt-1">Applies everywhere, to what is shown and to what you type. Amounts group in thousands either way; this is only which mark does the grouping and which the decimal.</p>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                {Object.values(NUMBER_FORMATS).map(f => (
                  <button key={f.id} type="button" onClick={() => setNumFormat(f.id)} aria-pressed={numFormat === f.id}
                    title={f.label}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold tabular-nums cursor-pointer transition-colors ${numFormat === f.id ? 'bg-surface text-blue-700 border border-blue-300' : 'text-slate-600 hover:text-slate-900'}`}>
                    {f.sample}
                  </button>
                ))}
              </div>
            </div>
  );






  /*
   * The advanced inputs, rendered in two homes. On a desktop they are the fold at the foot of the first
   * section, as they always were. On a phone they are their own section tab - the fold's button is not
   * shown, and the contents are simply there.
   */
  // Which list item is open on a phone (a band, an income stream); one at a time is plenty.
  const [openRow, setOpenRow] = useState(null);
  const toggleRow = (id) => setOpenRow(v => (v === id ? null : id));
  /*
   * THE WRAPPER NAME, WITH ITS ACRONYM EXPLAINED.
   *
   * `acc.category` is a plain string because it is also a key, an aria-label and a dial label. Wherever
   * it is READ rather than used, the acronym inside it gets the shimmering underline the rest of the app
   * gives its jargon: "S&S ISA" and "GIA" are exactly the words somebody meets here for the first time,
   * and the portfolio is where they meet them.
   */
  const wrapperName = (category) => {
    if (category === 'S&S ISAs') return <T k="S&S ISA">S&amp;S ISAs</T>;
    if (/GIA/.test(category)) return <>Other Investments (e.g. <T k="GIA">GIA</T>)</>;
    return category;
  };
  /*
   * THE FIRST SECTION AS ROWS, FOR A PHONE.
   *
   * The desktop grid is label-above-field in four columns. Collapsed to one column it was a label, a
   * half-width input and a seven-line helper in a half-width column, which is what your screenshot of
   * "Minimum pot at age 100" showed. These are the same fields as rows: label left, control right,
   * explanation behind a "?".
   *
   * The ages had a -/+ stepper beside the field, on the argument that an age moves by one. It cost those
   * rows their alignment: every other control on the tab is one 152px box, and the two with steppers
   * were a narrower box plus a pair of buttons, so the column zig-zagged down the form. The number pad
   * is one tap away on a phone and the field is a number input on a desktop, so the stepper was buying
   * a little convenience for two rows at the cost of the shape of all of them.
   */
  const renderYouRows = () => {
    const d = plan?.demographics || {};
    const ageRow = (label, field, lo = 0) => (
      <FieldRow key={field} label={label}>
        <input type="number" min={lo} max="120" onFocus={handleFocus} value={d[field] ?? ''} onChange={(e) => updateDemographics(field, e.target.value)} className={`${inputCls} text-right`} />
      </FieldRow>
    );
    /*
     * `key` separately from `label`, because three of these labels are no longer strings: the word that
     * needs explaining carries the definition itself now, on the shimmering underline, rather than a "?"
     * opening a paragraph under the row.
     */
    const money = (label, value, onChange, opts = {}) => (
      <FieldRow key={opts.key || label} label={label} hint={opts.hint} wide={opts.wide}>
        <MoneyInput min="0" step={opts.step || 1000} placeholder={opts.placeholder || '0'} onFocus={handleFocus} value={value ?? ''} onChange={onChange} className={`${inputCls} text-right ${opts.cls || ''}`} />
      </FieldRow>
    );
    const seSelf = d.employmentSelf === 'self-employed', sePart = d.employmentPart === 'self-employed';
    return (
      <div data-you-rows>
        {ageRow('Age now', 'currentAgeSelf')}
        {isCouple && ageRow('Partner: age now', 'currentAgePart')}
        {ageRow('Retire at', 'retireAgeSelf')}
        {isCouple && ageRow('Partner: retire at', 'retireAgePart')}
        {money(seSelf ? 'Profit a year' : <T k="gross salary">Gross salary</T>, d.salarySelf, (e) => updateDemographics('salarySelf', e.target.value),
          { key: 'salarySelf', placeholder: 'a year' })}
        {isCouple && money(sePart ? 'Partner: profit a year' : 'Partner: gross salary', d.salaryPart, (e) => updateDemographics('salaryPart', e.target.value), { placeholder: 'a year' })}
        {/* not `wide`: the Full shortcut used to sit beside the field and needed the extra 32px. Inside
            it, the row goes back to the same 152px control column as every other row on this tab. */}
        <FieldRow label="State Pension a year">{statePensionField('statePensionSelf')}</FieldRow>
        {isCouple && <FieldRow label="Partner: State Pension">{statePensionField('statePensionPart')}</FieldRow>}
        {money(<>{isCouple ? 'Joint ' : ''}<T k="living spend">living spend</T></>, plan?.spending?.targetSpend, (e) => updateSpending('targetSpend', e.target.value),
          { key: 'targetSpend', placeholder: 'e.g. 30,000' })}
        {ageRow('Plan to age', 'terminalAge', 1)}
        {money(<><T k="minimum pot">Minimum pot</T> at {terminalAge}</>, plan?.config?.solvencyFloor, (e) => updateConfig('solvencyFloor', e.target.value),
          { key: 'solvencyFloor', step: 5000, cls: 'text-amber-700' })}
      </div>
    );
  };
  const phoneBandRow = (band, { badRange, yrs }) => {
    const blank = E.isBlank(band.fromAge);
    const toLabel = E.isBlank(band.toAge) ? terminalAge : band.toAge;
    return (
      <CollapsedRow key={band.id} warn={badRange} open={openRow === band.id || blank} onToggle={() => toggleRow(band.id)}
        summary={blank ? 'New band' : `Age ${band.fromAge} to ${toLabel} · ${E.isBlank(band.amount) ? 'no amount' : formatGBP(E.num(band.amount, 0))}`}
        sub={badRange ? 'Ends before it starts' : yrs !== null ? `${yrs} year${yrs === 1 ? '' : 's'}` : 'Set a start age'}
        onDelete={() => deleteSpendBand(band.id)} deleteLabel="Remove this band">
        <FieldRow label="From age"><input type="number" min="0" max="120" placeholder="From" onFocus={handleFocus} value={band.fromAge} onChange={(e) => updateSpendBand(band.id, { fromAge: parseInputNumber(e.target.value) })} className={`${inputCls} text-right`} /></FieldRow>
        <FieldRow label="To age"><input type="number" min="0" max="120" placeholder={String(terminalAge)} onFocus={handleFocus} value={band.toAge} onChange={(e) => updateSpendBand(band.id, { toAge: parseInputNumber(e.target.value) })} className={`${inputCls} text-right`} /></FieldRow>
        <FieldRow label="Spend a year"><MoneyInput min="0" step="1000" placeholder="0" onFocus={handleFocus} value={band.amount} onChange={(e) => updateSpendBand(band.id, { amount: parseInputNumber(e.target.value) })} className={`${inputCls} text-right text-blue-700`} /></FieldRow>
      </CollapsedRow>
    );
  };
  const phoneIncomeRow = (inc) => {
    const blank = !inc.name && E.isBlank(inc.amount);
    const typeOptions = Object.keys(E.INCOME_TYPES).map(k => ({ key: k, title: E.INCOME_TYPES[k].label.split(' (')[0], sub: '', long: E.INCOME_TYPES[k].label }));
    return (
      <CollapsedRow key={inc.id} open={openRow === inc.id || blank} onToggle={() => toggleRow(inc.id)}
        summary={blank ? 'New income stream' : `${inc.name || 'Unnamed'} · ${formatGBP(E.num(inc.amount, 0))} a year`}
        sub={`Age ${E.isBlank(inc.startAge) ? '?' : inc.startAge} to ${E.isBlank(inc.endAge) ? 'plan end' : inc.endAge} · ${E.incomeTypeOf(inc.incomeType).label.split(' (')[0]}${isCouple ? ` · ${inc.owner}` : ''}`}
        onDelete={() => deleteOtherIncome(inc.id)} deleteLabel="Remove this income stream">
        <FieldRow label="Name" wide><input type="text" placeholder="e.g. DB pension" onFocus={handleFocus} value={inc.name} onChange={(e) => updateListItem('otherIncomes', inc.id, { name: e.target.value })} className={inputCls} /></FieldRow>
        {isCouple && (
          <div className="py-1.5 border-b border-slate-100"><RiskChips name="Whose income" value={inc.owner} onChange={(v) => updateListItem('otherIncomes', inc.id, { owner: v })}
            options={[{ key: 'Myself', title: 'Myself' }, { key: 'Partner', title: 'Partner' }]} /></div>
        )}
        <FieldRow label="From age" hint={`Not before ${inc.owner === 'Partner' ? 'your partner retires' : 'you retire'} at ${incomeStartFloor(inc.owner)}: nothing is drawn or saved while somebody is still working, so an earlier age would be entered and then ignored.`}>
          <input type="number" min={incomeStartFloor(inc.owner)} max="120" placeholder={String(incomeStartFloor(inc.owner))} onFocus={handleFocus}
            value={inc.startAge} onChange={(e) => updateListItem('otherIncomes', inc.id, { startAge: parseInputNumber(e.target.value) })}
            onBlur={() => clampIncomeStart(inc)} className={`${inputCls} text-right`} />
        </FieldRow>
        <FieldRow label="To age" hint="Leave blank to run to the end of the plan."><input type="number" min="0" max="120" placeholder="plan end" onFocus={handleFocus} value={inc.endAge} onChange={(e) => updateListItem('otherIncomes', inc.id, { endAge: parseInputNumber(e.target.value) })} className={`${inputCls} text-right`} /></FieldRow>
        <FieldRow label="Amount a year"><MoneyInput min="0" step="500" placeholder="0" onFocus={handleFocus} value={inc.amount} onChange={(e) => updateListItem('otherIncomes', inc.id, { amount: parseInputNumber(e.target.value) })} className={`${inputCls} text-right`} /></FieldRow>
        <div className="py-1.5">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5">How it is taxed</div>
          <RiskChips name="Income type" value={inc.incomeType} options={typeOptions} onChange={(v) => updateListItem('otherIncomes', inc.id, { incomeType: v })} />
        </div>
      </CollapsedRow>
    );
  };
  const phoneCostRow = (cost) => {
    const blank = !cost.desc && E.isBlank(cost.amount);
    const year = cost.date ? String(cost.date).slice(0, 4) : (cost.year || '');
    return (
      <CollapsedRow key={cost.id} open={openRow === cost.id || blank} onToggle={() => toggleRow(cost.id)}
        summary={blank ? 'New cost' : `${cost.desc || 'Unnamed'} · ${formatGBP(E.num(cost.amount, 0))}`} sub={year ? `In ${year}` : 'No date yet'}
        onDelete={() => deleteOneOffCost(cost.id)} deleteLabel="Remove this cost">
        <FieldRow label="When" wide><input type="date" value={cost.date || (cost.year ? `${cost.year}-01-01` : '')} onChange={(e) => { const d = e.target.value; updateListItem('oneOffCosts', cost.id, { date: d, year: parseInt(d.slice(0, 4)) || '' }); }} className={`${inputCls} text-right`} /></FieldRow>
        <FieldRow label="Purpose" wide><input type="text" placeholder="e.g. new roof" onFocus={handleFocus} value={cost.desc} onChange={(e) => updateListItem('oneOffCosts', cost.id, { desc: e.target.value })} className={inputCls} /></FieldRow>
        <FieldRow label="Amount"><MoneyInput min="0" step="1000" placeholder="0" onFocus={handleFocus} value={cost.amount} onChange={(e) => updateListItem('oneOffCosts', cost.id, { amount: parseInputNumber(e.target.value) })} className={`${inputCls} text-right text-rose-700`} /></FieldRow>
      </CollapsedRow>
    );
  };
  const renderAdvancedInputs = (standalone = false) => (
              <div id="advanced-inputs" className={standalone ? '' : 'pt-3 border-t border-slate-100'}>
                {!standalone && <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 uppercase tracking-[0.08em] flex items-center gap-1.5 cursor-pointer">
                  <Settings className="w-3.5 h-3.5" /> Advanced inputs {showAdvanced ? '▾' : '▸'}
                  <span className="font-normal normal-case tracking-normal text-slate-400">(optional; sensible defaults are assumed if left blank)</span>
                </button>}
                {(standalone || showAdvanced) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs mt-3">
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Cash buffer kept from surplus income (months)</label>
                      <input type="number" min="0" step="1" placeholder="6" onFocus={handleFocus} value={plan?.config?.cashBufferMonths ?? ''} onChange={(e) => updateConfig('cashBufferMonths', e.target.value)} className={inputCls} />
                      <span className="text-[10px] text-slate-400 mt-1 block">Months of spending held back in cash before surplus income is swept into the ISA.</span>
                    </div>
                    {ctx.owners.map(o => {
                      const field = o.key === 'self' ? 'employmentSelf' : 'employmentPart';
                      // how an employee pays into their pension, asked here (D154 (3)); the words the agent's draft and the
                      // maintainer's to change. A value the app does not know shows as salary sacrifice, as the engine reads it
                      const emp = EMPLOYMENT_KINDS.includes(plan?.demographics?.[field]) ? plan.demographics[field] : 'employed';
                      return (
                        <div key={`emp_${o.key}`}>
                          <label className="text-slate-600 font-semibold block mb-1">Employment type ({o.label})</label>
                          <select aria-label="Employment type" value={emp} onChange={(e) => updateDemographics(field, e.target.value)} className={`${inputCls} cursor-pointer`}>
                            <option value="employed">Employed, pension paid by salary sacrifice</option>
                            <option value="employed-net">Employed, pension paid from net pay or by relief at source</option>
                            <option value="employed-unsure">Employed, not sure how the pension is paid</option>
                            <option value="self-employed">Self-employed (Class 4 NIC, relief at source)</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block" data-employment-words={emp}>{EMPLOYMENT_WORDS[emp](P.erPass > 0)}</span>
                        </div>
                      );
                    })}
                    {ctx.owners.map(o => {
                      const field = o.key === 'self' ? 'salaryGrowthSelf' : 'salaryGrowthPart';
                      const isSE = plan?.demographics?.[o.key === 'self' ? 'employmentSelf' : 'employmentPart'] === 'self-employed';
                      const rate = E.num(plan?.demographics?.[field], 0);
                      return (
                        <div key={`sg_${o.key}`}>
                          <label className="text-slate-600 font-semibold block mb-1">{isSE ? 'Profit' : 'Salary'} growth above inflation ({o.label} %/yr)</label>
                          <input type="number" step="0.25" placeholder="0" onFocus={handleFocus}
                            value={plan?.demographics?.[field] ?? ''}
                            onChange={(e) => updateDemographics(field, e.target.value)} className={inputCls} />
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Default is 0, which holds{isSE ? ' profit' : ' pay'} flat in real terms rather than freezing it in
                            cash terms. Enter 1 for a 1% real rise a year; a negative figure winds earnings down.
                            {rate !== 0 && ` At ${rate}%, ${formatGBP(o.salary)} today becomes ${formatGBP(o.salary * Math.pow(1 + rate / 100, Math.max(0, o.retireAge - o.age0)))} by retirement.`}
                          </span>
                        </div>
                      );
                    })}
                    {ctx.owners.map(o => (
                      <div key={`cf_${o.key}`}>
                        <label className="text-slate-600 font-semibold block mb-1">Pension allowance carried forward ({o.label} £)</label>
                        <MoneyInput min="0" step="1000" placeholder="blank = £0" onFocus={handleFocus}
                          value={plan?.demographics?.[o.key === 'self' ? 'cfBroughtForwardSelf' : 'cfBroughtForwardPart'] ?? ''}
                          onChange={(e) => updateDemographics(o.key === 'self' ? 'cfBroughtForwardSelf' : 'cfBroughtForwardPart', e.target.value)} className={inputCls} />
                        <span className="text-[10px] text-slate-400 mt-1 block">Unused annual allowance from the last three tax years. Cannot be used once a pension is flexibly accessed, and never lifts the earnings limit.</span>
                      </div>
                    ))}
                    {P.cgtEnabled && ctx.owners.map(o => (
                      <div key={`cg_${o.key}`}>
                        <label className="text-slate-600 font-semibold block mb-1">Capital gains already used ({o.label} £)</label>
                        <MoneyInput min="0" step="500" placeholder="blank = full allowance" onFocus={handleFocus}
                          value={plan?.demographics?.[o.key === 'self' ? 'cgtGainsUsedSelf' : 'cgtGainsUsedPart'] ?? ''}
                          onChange={(e) => updateDemographics(o.key === 'self' ? 'cgtGainsUsedSelf' : 'cgtGainsUsedPart', e.target.value)} className={inputCls} />
                        <span className="text-[10px] text-slate-400 mt-1 block">Gains already realised this tax year: reduces the {formatGBP(P.cgtAnnualExempt)} exemption in the current year only.</span>
                      </div>
                    ))}
                    {P.cgtEnabled && ctx.owners.map(o => {
                      const acc = (plan?.accounts || []).find(a => a.id === o.ids.other);
                      return (
                        <div key={`ug_${o.key}`}>
                          <label className="text-slate-600 font-semibold block mb-1">Other Investments: unrealised gain ({o.label} £)</label>
                          <MoneyInput min="0" step="500" placeholder="blank = balance is all cost" onFocus={handleFocus}
                            value={acc?.unrealisedGain ?? ''} onChange={(e) => updateAccountField(o.ids.other, 'unrealisedGain', e.target.value)} className={inputCls} />
                          <span className="text-[10px] text-slate-400 mt-1 block">How much of today's <T k="GIA">GIA</T> balance is profit. Left blank, only future growth is taxed, which understates <T k="CGT">CGT</T> on long-held holdings.</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
  );

  /*
   * pb-4.5rem on a phone, not 3.5: the bottom bar is 3.5rem and the extra rem is clearance. With the
   * footer gone from the phone build the page's last line ended exactly where the bar begins, which
   * reads as content cut off rather than content finished.
   */
  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans ${touch ? 'touch-ui' : ''} ${isPhone ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''}`}>
      {/*
        * THE NEW PLANNER'S MEASURE (step U): 80rem in every place, a column the answer, the form and the
        * tables are read in.
        */}
      <div data-app-content className={`max-w-7xl mx-auto ${isPhone ? 'space-y-3' : 'space-y-6'}`}>
        {/* THE NEW PLANNER'S HEADER (step U, LAYOUT.md section 2.2): the name and the theme; under it the four places and, at
            the strip's right end, the status strip; both stay at the top as the page scrolls. On a phone: the top bar (the name and
            the theme) and the status line under it. */}
        {solverOn && !isPhone && (
          <div data-planner-header className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-4 sm:px-6 lg:px-8 bg-slate-50/95 backdrop-blur border-b border-slate-200">
            <div className="h-14 flex items-center gap-3">
              <span className="text-base font-bold tracking-tight text-slate-900">Monte Carlo Retirement Planner</span>
              <span className="flex-1" />
              <ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} touch={touch} />
            </div>
            <nav data-tabbar aria-label="Places" className="h-12 flex items-end gap-1">
              {navTabs.map(t => tabBtn(t.id, t.Icon, t.label, t.accent))}
              <span className="flex-1" />
              <div className="self-center min-w-0 max-w-[55%]">
                <Suspense fallback={null}><StatusStripCard solve={solve} isPhone={false} asked={asked} simulating={planPhase.simulating} trials={planPhase.trials} place={activeTab} onAction={stripAction} /></Suspense>
              </div>
            </nav>
          </div>
        )}
        {solverOn && isPhone && (
          <div data-planner-phonebar className="sticky top-0 z-30 -mx-4 -mt-4">
            <header data-phone-bar className="flex items-center gap-1 pl-3 pr-1 h-11 bg-surface border-b border-slate-200">
              <span className="text-[13px] font-bold tracking-tight text-slate-900">Retirement planner</span>
              <span className="flex-1" />
              <ThemeToggle compact theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} />
            </header>
            {/* on the solve's own condition: with no plan yet the strip's "Solve my plan" had nothing to solve (the reviewer on the
                default, second round, MINOR 1) */}
            {solveOn && <Suspense fallback={null}><StatusStripCard solve={solve} isPhone asked={asked} simulating={planPhase.simulating} trials={planPhase.trials} place={activeTab} onAction={stripAction} /></Suspense>}
          </div>
        )}

        {/*
          * THE TAB STRIP IS ALWAYS IN THE DOM, EVEN WHERE IT IS NEVER SEEN.
          *
          * It is invisible on a phone - the bottom bar is the navigation there - but it is also how the
          * in-app editor and six harnesses reach a tab, because click() fires on a display:none element.
          * It used to live inside the title card, so confining that card to Start Here took the strip
          * with it and left every one of them unable to navigate past the first tab. Rendered here
          * instead, once, outside the card that no longer always exists.
          */}
        {isPhone && (
          <div data-tabbar className="hidden">
            {navTabs.map(t => tabBtn(t.id, t.Icon, t.label, t.accent))}
          </div>
        )}
        {/*
          * Everything below the header sits inside one error boundary, keyed on the tab. A render error on
          * a tab shows a message and a way back in the tab's place; the header, the tab strip and the
          * bottom bar stay alive, and switching tabs remounts the boundary so the next screen is clean.
          */}
        <Boundary resetKey={activeTab}>

        {/*
          * The warnings, in every place: worth reading before you trust a number, and in You beside the fields
          * they are about.
          */}
        {/*
          * NOT THE CGT ONES.
          *
          * "No unrealised gain on Other Investments, so only future growth is taxed" is a true and
          * useful note, and as a banner it is amber above whatever you came to read - repeated per
          * owner, on every tab, on a phone three lines of it. It is a prompt to fill in a field, so it
          * belongs under the field: the GIA balance in You asks for it there, once, while there
          * is a balance and no figure.
          */}
        <WarningsBanner warnings={ctx.warnings.filter(w => !CGT_WARNING.test(w))} />


        {/* You (step U, LAYOUT.md section 3.2) */}
        {youOn && (
          <PlaceFrame place="you" nav={!isPhone ? youNav() : null}>
          <div ref={inputsSwipeRef} className={`${isPhone ? 'space-y-3 swipe-x' : 'space-y-6'}`}>
            {youHeader()}
            {/* Last, not first. It draws nothing, but as the first child of a `space-y` container it
                still took the strip below it off the top of the screen by a row's worth of margin. */}

            {/* The one thing to know before typing an amount, said once and quietly under the tabs. It
                was a bold blue line in a box of its own, which spent 40px of a 664px screen on a caption. */}
            {/*
              * FLUSH UNDER THE APP BAR.
              *
              * The strip is navigation - it belongs against the bar above it, the way the tab bar at the
              * foot belongs against the bottom. It sat 28px below instead: the page's own 16px top
              * padding, plus 12px of the container's row gap. On a 390px screen that is a band of empty
              * grey between two rows of controls, above the fold, on every visit. The negative margin
              * cancels both for this one element; it is sticky at top-0, so it then stays there as the
              * form scrolls under it.
              *
              * 28px is measured, not derived, so phone-ui asserts the strip's top against the bar's
              * bottom: anything that changes either number fails there rather than on somebody's screen.
              */}
            {isPhone && (
              <SectionTabs sections={PLANNER_SECTIONS} active={inputSection} onSelect={selectSection} top="top-[76px]" />
            )}
            <input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />
            {/* Demographics & Targets */}
            {showSection('you') && (
            <div data-section="you" className={`bg-surface border border-slate-200/90 rounded-xl space-y-4 ${isPhone ? 'p-3' : 'p-5'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  {!isPhone && <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> {solverOn ? 'About you, and what you want to spend' : <>1. Demographics, salaries &amp; retirement targets</>}</h3>}
                  {!isPhone && <span className="text-xs text-slate-500">Choose whether this plan is for an individual or a couple.</span>}
                </div>
                {/* Two options, which is exactly what a segmented control is for; full width on a phone,
                    where it is the first thing in the section and has no heading beside it. */}
                <div className={`flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs ${isPhone ? 'w-full' : ''}`} role="radiogroup" aria-label="Who this plan is for">
                  <button type="button" role="radio" aria-checked={!isCouple} onClick={() => updateDemographics('planningMode', 'single')} className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${isPhone ? 'flex-1' : ''} ${!isCouple ? 'bg-surface text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>Single</button>
                  <button type="button" role="radio" aria-checked={isCouple} onClick={() => updateDemographics('planningMode', 'couple')} className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${isPhone ? 'flex-1' : ''} ${isCouple ? 'bg-surface text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>With partner</button>
                </div>
              </div>
              {isPhone ? renderYouRows() : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><label className="text-slate-600 font-semibold block mb-1">Current age (Myself)</label><input type="number" min="0" max="120" placeholder="e.g. 40" onFocus={handleFocus} value={plan?.demographics?.currentAgeSelf ?? ''} onChange={(e) => updateDemographics('currentAgeSelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">Current age (Partner)</label><input type="number" min="0" max="120" placeholder="e.g. 40" onFocus={handleFocus} value={plan?.demographics?.currentAgePart ?? ''} onChange={(e) => updateDemographics('currentAgePart', e.target.value)} className={inputCls} /></div>}
                <div><label className="text-slate-600 font-semibold block mb-1">Retirement age (Myself)</label><input type="number" min="0" max="120" placeholder="e.g. 60" onFocus={handleFocus} value={plan?.demographics?.retireAgeSelf ?? ''} onChange={(e) => updateDemographics('retireAgeSelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">Retirement age (Partner)</label><input type="number" min="0" max="120" placeholder="e.g. 60" onFocus={handleFocus} value={plan?.demographics?.retireAgePart ?? ''} onChange={(e) => updateDemographics('retireAgePart', e.target.value)} className={inputCls} /></div>}
                <div><label className="text-slate-600 font-semibold block mb-1">{plan?.demographics?.employmentSelf === 'self-employed' ? 'Annual Profit: self-employment (Myself £/yr)' : <><T k="gross salary">Gross salary</T> (Myself £/yr)</>}</label><MoneyInput min="0" step="1000" placeholder="for tax relief & bridging" onFocus={handleFocus} value={plan?.demographics?.salarySelf ?? ''} onChange={(e) => updateDemographics('salarySelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">{plan?.demographics?.employmentPart === 'self-employed' ? 'Annual Profit: self-employment (Partner £/yr)' : <><T k="gross salary">Gross salary</T> (Partner £/yr)</>}</label><MoneyInput min="0" step="1000" placeholder="for tax relief & bridging" onFocus={handleFocus} value={plan?.demographics?.salaryPart ?? ''} onChange={(e) => updateDemographics('salaryPart', e.target.value)} className={inputCls} /></div>}
                <div><label className="text-slate-600 font-semibold block mb-1">Expected State Pension (Myself £/yr)</label>{statePensionField('statePensionSelf')}</div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">Expected State Pension (Partner £/yr)</label>{statePensionField('statePensionPart')}</div>}
                <div className="sm:col-span-2">
                  {/*
                    * The sentence under this field is now the definition behind the word, not a line of
                    * grey text under every field forever. Same explanation, one hover away, and the form
                    * is a form rather than a form with a commentary running down it.
                    */}
                  <label className="text-slate-600 font-semibold block mb-1">{isCouple ? 'Joint net ' : 'Net '}<T k="living spend">living spend</T> (£/yr)</label>
                  <MoneyInput min="0" step="1000" placeholder="e.g. 30000" onFocus={handleFocus} value={plan?.spending?.targetSpend ?? ''} onChange={(e) => updateSpending('targetSpend', e.target.value)} className={inputCls} />
                </div>
                <div><label className="text-slate-600 font-semibold block mb-1">Plan to age</label><input type="number" min="1" max="120" placeholder="100" onFocus={handleFocus} value={plan?.demographics?.terminalAge ?? ''} onChange={(e) => updateDemographics('terminalAge', e.target.value)} className={inputCls} /></div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1"><T k="minimum pot">Minimum pot</T> at age {terminalAge} (£)</label>
                  <MoneyInput min="0" step="5000" placeholder="0" onFocus={handleFocus} value={plan?.config?.solvencyFloor ?? ''} onChange={(e) => updateConfig('solvencyFloor', e.target.value)} className={`${inputCls} text-amber-700`} />
                </div>
              </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-700">{isCouple ? 'Joint net living spend' : 'Net living spend'} by age (optional)</span>
                  <button onClick={addSpendBand} className={`bg-accent hover:bg-accent-hover text-onaccent rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${isPhone ? 'w-full min-h-11 justify-center' : 'px-2.5 py-1'}`}><Plus className="w-3.5 h-3.5" /> Add band</button>
                </div>
                <Fine isPhone={isPhone} label="What is a band?">
                <p className="text-[11px] text-slate-500 mb-2 max-w-3xl">
                  Set what a stretch of years actually costs, instead of one figure for the whole
                  retirement. Ages are &quot;Myself&quot; ages. Any year you do not cover falls back to the {isCouple ? 'joint ' : ''}living
                  spend above, so you can name only the years that differ. Spending can rise as well as fall.
                </p>
                </Fine>
                {(plan?.spending?.spendBands || []).length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    No bands set, so {formatGBP(E.num(plan?.spending?.targetSpend, 0))}/yr applies for the whole retirement.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(plan.spending.spendBands || []).map(band => {
                      const from = E.num(band.fromAge, NaN);
                      const to = E.isBlank(band.toAge) ? terminalAge : E.num(band.toAge, NaN);
                      const badRange = Number.isFinite(from) && Number.isFinite(to) && to < from;
                      const yrs = (Number.isFinite(from) && Number.isFinite(to) && !badRange) ? (to - from + 1) : null;
                      return isPhone ? phoneBandRow(band, { badRange, yrs }) : (
                        <div key={band.id} className={`grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 border rounded-lg text-xs items-center ${badRange ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Age</span>
                            <input type="number" min="0" max="120" placeholder="From" onFocus={handleFocus} value={band.fromAge}
                              onChange={(e) => updateSpendBand(band.id, { fromAge: parseInputNumber(e.target.value) })}
                              className="w-14 p-1 bg-surface border border-slate-300 rounded tabular-nums text-center font-bold" />
                            <span className="text-slate-400">to</span>
                            <input type="number" min="0" max="120" placeholder={String(terminalAge)} onFocus={handleFocus} value={band.toAge}
                              onChange={(e) => updateSpendBand(band.id, { toAge: parseInputNumber(e.target.value) })}
                              className="w-14 p-1 bg-surface border border-slate-300 rounded tabular-nums text-center font-bold" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Spend</span>
                            <MoneyInput min="0" step="1000" placeholder="£/yr" onFocus={handleFocus} value={band.amount}
                              onChange={(e) => updateSpendBand(band.id, { amount: parseInputNumber(e.target.value) })}
                              className="w-28 p-1.5 bg-surface border border-slate-300 rounded tabular-nums text-blue-700 font-bold" />
                          </div>
                          <div className="text-[11px] text-slate-500 sm:col-span-1">
                            {badRange
                              ? <span className="text-rose-700 font-semibold">Ends before it starts</span>
                              : yrs !== null ? `${yrs} year${yrs === 1 ? '' : 's'}${E.isBlank(band.toAge) ? ` (to age ${terminalAge})` : ''}` : 'Set a start age'}
                          </div>
                          <div className="flex justify-end">
                            <button onClick={() => deleteSpendBand(band.id)} title="Remove this band" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div data-tax-region-you className="pt-3 border-t border-slate-100 text-xs">{ctlRegion()}</div>
            </div>
            )}

            {/* Balances & Contributions */}
            {showSection('money') && (
            <div data-section="money" className={`bg-surface border border-slate-200/90 rounded-xl space-y-4 ${isPhone ? 'p-3' : 'p-5 overflow-x-auto'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {!isPhone && <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-600" /> {solverOn ? 'Your money: balances, contributions and risk' : <>2. Current balances, annual contributions &amp; risk profiles</>}</h3>}
                <button type="button" onClick={() => goToDoc('doc-risk-profiles')} className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"><HelpCircle className="w-3.5 h-3.5" /> Guide to investment allocations &amp; fund types &rarr;</button>
              </div>
              <Fine isPhone={isPhone} label="What counts as a contribution?">
              <p className="text-[11px] text-slate-500">Pension contributions are gross (including tax relief and employer amounts); <T k="S&S ISA">ISA</T>, <T k="GIA">GIA</T> and cash contributions are net. Contributions stop at each owner's retirement age. Allowances: ISA £{fmtNum(P.isaAllowance)}, pension £{fmtNum(P.pensionAllowance)} per person (Details, Assumptions).</p>
              {/* Said where the balance is typed, not only in the documentation: the wrapper earns its
                  tier's return with nothing charged on it, which is a cash ISA or savings inside the
                  personal savings allowance - and taxable cash above that has no wrapper of its own. */}
              <p className="text-[11px] text-slate-500">Cash Savings earns its nominal rate (the real rate plus inflation) and that interest is <strong className="text-slate-700">taxed as savings income</strong> above the starting rate for savings and the personal savings allowance, at the band your other income puts you in. The tax is a cost the year has to fund. Money entered under <strong className="text-slate-700">Cash ISA</strong> pays no tax on its interest; inside the projection it is merged with Cash Savings (same rate, same role) with the sheltered part tracked, and each year whatever ISA allowance the S&amp;S subscription leaves shelters more of the taxable cash, up to the cash ISA cap (Details, Assumptions; the lower under-65 cap applies from 2027). That "you will act logically" assumption is what lets the two stay one pot. Switch <em>Tax cash interest</em> off in Details, Assumptions to treat all cash as a cash ISA. <T k="GIA">Other Investments</T> is assumed to pay a dividend yield (Details, Assumptions, 2% by default) out of its return, taxed above the dividend allowance at the dividend rate of your band; set the yield to 0 to switch that off.</p>
              </Fine>
              {/*
                * ON A PHONE, A CARD PER WRAPPER; ON A DESKTOP, THE TABLE.
                *
                * The table scrolls sideways on a phone - four of its five columns were off the right edge,
                * the risk select among them at 410px wide - and a thing that scrolls sideways cannot also be
                * swiped between sections. One card per wrapper puts every field of one account on one
                * screen, in rows, with the risk tier as six visible chips instead of a drop-down.
                */}
              {isPhone ? (
                <div className="space-y-2.5">
                  {displayedAccounts.map(acc => {
                    const isaTotal = E.num(acc.contrib, 0) + E.num((plan?.accounts || []).find(x => x.owner === acc.owner && x.id.startsWith(acc.id.startsWith('isa') ? 'cashIsa' : 'isa'))?.contrib, 0);
                    const over = ((acc.id.startsWith('isa') || acc.id.startsWith('cashIsa')) && isaTotal > P.isaAllowance) || (acc.id.startsWith('pen') && E.num(acc.contrib, 0) > P.pensionAllowance);
                    const riskOptions = Object.keys(activeRiskMatrix).map(rk => {
                      const { name, rest, long } = parseTierLabel(activeRiskMatrix[rk].label, rk);
                      return { key: rk, title: name, sub: rest ? rest.replace(/\s*Equities/i, ' eq.') : '', long };
                    });
                    return (
                      <div key={acc.id} data-wrapper-card className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 pt-2 pb-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-800">{wrapperName(acc.category)}{isCouple && <span className="text-slate-500 font-normal"> &middot; {acc.owner}</span>}</span>
                          {Array.isArray(acc.contribByYear) && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px]">phased schedule</span>}
                        </div>
                        <FieldRow label="Balance today">
                          <MoneyInput min="0" step="500" placeholder="0" onFocus={handleFocus} value={acc.balance} onChange={(e) => updateAccountField(acc.id, 'balance', e.target.value)} className={`${inputCls} text-right`} />
                        </FieldRow>
                        {/* Where the phone says what the amber banner used to: only on the wrapper it is
                            about, only once there is a balance, and only while the figure is missing. */}
                        {acc.id.startsWith('other_') && P.cgtEnabled && E.num(acc.balance, 0) > 0 && E.isBlank(acc.unrealisedGain) && (
                          <div data-gia-gain-hint className="-mt-1 pb-1.5">
                            <button type="button" onClick={goToAdvanced}
                              className="text-[11px] text-blue-700 font-semibold underline underline-offset-2 cursor-pointer text-left leading-snug">
                              Add unrealised and realised gain in Advanced inputs &rarr;
                            </button>
                          </div>
                        )}
                        <FieldRow label="Annual contribution" hint={over ? 'This is above the annual allowance set in Details, Assumptions.' : 'Pension contributions are gross, including tax relief and employer amounts. ISA, GIA and cash are net. Contributions stop at retirement.'}>
                          <MoneyInput min="0" step="250" placeholder="0" onFocus={handleFocus} value={acc.contrib}
                            onChange={(e) => { updateAccountField(acc.id, 'contrib', e.target.value); if (acc.contribByYear) setPlan(prev => ({ ...prev, accounts: prev.accounts.map(a => a.id === acc.id ? { ...a, contribByYear: undefined } : a) })); }}
                            className={`${inputCls} text-right ${over ? 'border-rose-400 text-rose-700' : ''}`} />
                        </FieldRow>
                        <FieldRow label={youMoney ? 'Contribution increase' : 'Percentage increase'} hint="How much the annual contribution rises each year, in real terms.">
                          <PercentInput value={acc.growth ?? ''} onChange={(v) => updateAccountField(acc.id, 'growth', v)} className={`${inputCls} text-right`} />
                        </FieldRow>
                        <div className="pb-1">
                          {acc.id.startsWith('cashIsa')
                            ? <span className="text-[11px] text-slate-500 block py-1">Grows at the Cash Savings rate; interest is tax-free. Merged with Cash Savings inside the projection.</span>
                            : <RiskChips collapsible name="Asset allocation" value={acc.risk} options={riskOptions} onChange={(rk) => updateAccountField(acc.id, 'risk', rk)} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Account wrapper</th>{isCouple && <th className="pb-2">Owner</th>}<th className="pb-2">Balance today (£)</th><th className="pb-2">Annual contribution (£)</th><th className="pb-2">{youMoney ? 'Contribution increase (%/yr)' : 'Percentage increase (%/yr)'}</th><th className="pb-2">Asset allocation (<T k="volatility">risk tier</T>)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {displayedAccounts.map(acc => {
                    const isaTotal = E.num(acc.contrib, 0) + E.num((plan?.accounts || []).find(x => x.owner === acc.owner && x.id.startsWith(acc.id.startsWith('isa') ? 'cashIsa' : 'isa'))?.contrib, 0);
                    const over = ((acc.id.startsWith('isa') || acc.id.startsWith('cashIsa')) && isaTotal > P.isaAllowance) || (acc.id.startsWith('pen') && E.num(acc.contrib, 0) > P.pensionAllowance);
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-sans font-bold text-slate-800">{wrapperName(acc.category)}{Array.isArray(acc.contribByYear) && <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-normal">phased schedule</span>}</td>
                        {isCouple && <td className="py-2.5 font-sans text-slate-500">{acc.owner}</td>}
                        <td className="py-2.5">
                          <MoneyInput min="0" step="500" placeholder="0" onFocus={handleFocus} value={acc.balance} onChange={(e) => updateAccountField(acc.id, 'balance', e.target.value)} className="w-32 p-1.5 bg-surface border border-slate-300 rounded font-bold text-slate-900 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                          {/* The same prompt the phone card carries, for the same reason: it asks for a
                              figure, so it belongs under the figure it is about rather than in a banner
                              on another tab. */}
                          {acc.id.startsWith('other_') && P.cgtEnabled && E.num(acc.balance, 0) > 0 && E.isBlank(acc.unrealisedGain) && (
                            <button type="button" data-gia-gain-hint onClick={goToAdvanced}
                              className="block mt-1 font-sans text-[10px] text-blue-700 font-semibold underline underline-offset-2 cursor-pointer text-left leading-snug max-w-32">
                              Add unrealised and realised gain in Advanced inputs &rarr;
                            </button>
                          )}
                        </td>
                        <td className="py-2.5"><MoneyInput min="0" step="250" placeholder="0" onFocus={handleFocus} value={acc.contrib} onChange={(e) => { updateAccountField(acc.id, 'contrib', e.target.value); if (acc.contribByYear) setPlan(prev => ({ ...prev, accounts: prev.accounts.map(a => a.id === acc.id ? { ...a, contribByYear: undefined } : a) })); }} className={`w-28 p-1.5 ${youMoney ? 'bg-surface' : 'bg-slate-50'} border rounded text-slate-800 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none ${over ? 'border-rose-400 text-rose-700' : 'border-slate-300'}`} title={over ? 'Exceeds the annual allowance set in Details, Assumptions' : ''} /></td>
                        <td className="py-2.5"><input type="number" step="0.5" placeholder="0" onFocus={handleFocus} value={acc.growth} onChange={(e) => updateAccountField(acc.id, 'growth', e.target.value)} className="w-20 p-1.5 bg-surface border border-slate-300 rounded text-slate-800 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none" /></td>
                        <td className="py-2.5">
                          {acc.id.startsWith('cashIsa') ? <span className="text-[11px] text-slate-500">as Cash Savings; interest tax-free</span> : <select aria-label={`${acc.category} risk tier`} value={acc.risk} onChange={(e) => updateAccountField(acc.id, 'risk', e.target.value)} className="p-1.5 bg-surface border border-slate-300 rounded text-xs text-blue-700 font-semibold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                            {Object.keys(activeRiskMatrix).map(rk => <option key={rk} value={rk}>{activeRiskMatrix[rk].label || rk}</option>)}
                          </select>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
            </div>
            )}

            {/* Other income */}
            {showSection('income') && (
            <div data-section="income" className={`bg-surface border border-slate-200/90 rounded-xl space-y-4 ${isPhone ? 'p-3' : 'p-5'}`}>
              <div className="flex justify-between items-center">
                <div>
                  {!isPhone && <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Coins className="w-4 h-4 text-blue-600" /> {solverOn ? 'Other income (a DB pension, part-time work, rent)' : '3. Expected other income streams (e.g. defined benefit pensions, part-time work, rental income)'}</h3>}
                  <Fine isPhone={isPhone} label="How income streams are taxed">
                  <span className="text-[11px] text-slate-500">Taxable streams count towards the personal allowance and tax bands; tax-free streams directly reduce net drawdown demand. Blank end age = plan end.</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-500 mt-1 leading-relaxed max-w-3xl space-y-0.5">
                    <li><strong>Earnings</strong> (employment / self-employment) are taxed <em>and</em> count as relevant UK earnings, so they raise how much you can pay into a pension that year.</li>
                    <li><strong>Other taxable income</strong> (<T k="DB">DB</T> pensions, <T k="annuity">annuities</T>, rent, dividends, interest) is taxed at income-tax rates but does <strong>not</strong> support pension contributions.</li>
                    <li><strong>Tax-free income</strong> is neither taxed nor counted.</li>
                  </ul>
                  <span className="text-[11px] text-slate-500 mt-1 block">With no relevant earnings the pension limit is {formatGBP(P.pensionNoEarningsLimit)}/yr.</span>
                  </Fine>
                </div>
                {!isPhone && <button onClick={addOtherIncome} className="px-2.5 py-1 bg-accent hover:bg-accent-hover text-onaccent rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add stream</button>}
              </div>
              {isPhone && <button onClick={addOtherIncome} className="w-full min-h-11 justify-center bg-accent hover:bg-accent-hover text-onaccent rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add stream</button>}
              {(plan?.otherIncomes || []).length === 0 ? (
                <div className="text-xs text-slate-400 p-3 bg-slate-50 border border-slate-200 rounded-lg">No additional income streams registered.</div>
              ) : (
                <div className="space-y-2">
                  {plan.otherIncomes.map(inc => isPhone ? phoneIncomeRow(inc) : (
                    <div key={inc.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs items-center">
                      <input type="text" onFocus={handleFocus} value={inc.name} onChange={(e) => updateListItem('otherIncomes', inc.id, { name: e.target.value })} className="p-1.5 bg-surface border border-slate-300 rounded font-bold text-slate-800 sm:col-span-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Description" />
                      {isCouple ? (
                        <select aria-label="Whose income" value={inc.owner} onChange={(e) => updateListItem('otherIncomes', inc.id, { owner: e.target.value })} className="p-1.5 bg-surface border border-slate-300 rounded text-slate-700"><option value="Myself">Myself</option><option value="Partner">Partner</option></select>
                      ) : <div className="p-1.5 text-slate-500 font-semibold">Myself</div>}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Age</span>
                        <input type="number" min={incomeStartFloor(inc.owner)} max="120" placeholder={String(incomeStartFloor(inc.owner))} onFocus={handleFocus}
                          title={`Not before ${inc.owner === 'Partner' ? 'your partner retires' : 'you retire'} at ${incomeStartFloor(inc.owner)}: nothing is drawn or saved while somebody is still working.`}
                          value={inc.startAge} onChange={(e) => updateListItem('otherIncomes', inc.id, { startAge: parseInputNumber(e.target.value) })}
                          onBlur={() => clampIncomeStart(inc)} className="w-12 p-1 bg-surface border border-slate-300 rounded tabular-nums text-center font-bold" />
                        <span className="text-slate-400">to</span>
                        <input type="number" min="0" max="120" placeholder="End" onFocus={handleFocus} value={inc.endAge} onChange={(e) => updateListItem('otherIncomes', inc.id, { endAge: parseInputNumber(e.target.value) })} className="w-12 p-1 bg-surface border border-slate-300 rounded tabular-nums text-center font-bold" />
                      </div>
                      <div className="flex items-center gap-2">
                        <MoneyInput min="0" step="500" placeholder="£/yr" onFocus={handleFocus} value={inc.amount} onChange={(e) => updateListItem('otherIncomes', inc.id, { amount: parseInputNumber(e.target.value) })} className="w-24 p-1.5 bg-surface border border-slate-300 rounded tabular-nums text-emerald-700 font-bold" />
                        <select aria-label="Type of income" value={inc.incomeType} onChange={(e) => updateListItem('otherIncomes', inc.id, { incomeType: e.target.value })} className="p-1.5 bg-surface border border-slate-300 rounded text-xs font-semibold text-amber-700" title="Drives both income tax and whether this counts as relevant earnings for pension contributions">
                          {Object.keys(E.INCOME_TYPES).map(k => <option key={k} value={k}>{E.INCOME_TYPES[k].label}</option>)}
                        </select>
                      </div>
                      <div className="flex justify-end"><button onClick={() => deleteOtherIncome(inc.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* One-offs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showSection('deposits') && (
              <div data-section="deposits" className={`bg-surface border border-slate-200/90 rounded-xl space-y-4 ${isPhone ? 'p-3' : 'p-5'}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    {!isPhone && <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> {solverOn ? 'One-off deposits' : '4. One-off deposits (by wrapper)'}</h3>}
                    {!isPhone && <span className="text-[11px] text-slate-500 block mt-0.5">Lump sums into a chosen wrapper. Anything above that year's allowance is parked in Other Investments and fed in over later years. Into a pension, the amount lands as you enter it: tax relief is not added, so enter any relief as its own deposit from External.</span>}
                    <button type="button" onClick={() => goToDoc('doc-one-off-deposits')} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer mt-0.5"><HelpCircle className="w-3.5 h-3.5" /> How one-off deposits &amp; multi-year staging work &rarr;</button>
                  </div>
                  <button onClick={addOneOffContrib} className={`${isPhone ? 'w-full min-h-11 justify-center' : 'px-2.5 py-1'} bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200 self-start sm:self-auto`}><Plus className="w-3.5 h-3.5" /> Add lump sum</button>
                </div>
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm"><Info className="w-4 h-4 text-indigo-600" /> Annual Allowance Headroom: {ctx.baseYear} tax year</div>
                  {ctx.owners.map(o => (
                    <div key={o.key} className="flex flex-wrap gap-x-4">
                      <span className="font-semibold">{o.label}:</span>
                      <span><T k="S&amp;S ISA">S&amp;S ISA</T> remaining <strong>{formatGBP(E.wrapperHeadroomAtYear(ctx, o.key, 'isa', 0))}</strong>/yr</span>
                      <span>Pension remaining <strong>{formatGBP(E.wrapperHeadroomAtYear(ctx, o.key, 'pen', 0))}</strong>/yr</span>
                    </div>
                  ))}
                  <Fine isPhone={isPhone} label="How staging works">
                  <p className="text-slate-500 text-[11px] leading-relaxed">A one-off deposit that exceeds remaining headroom is auto-staged: the allowed amount deposits now, the rest parks in Other Investments and drip-feeds into the target wrapper as future years' allowance opens up.</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">These are <strong>this year's</strong> figures. Headroom changes in later years as regular contributions escalate, and again once contributions stop at retirement. Each deposit below shows the headroom for its own year.</p>
                  </Fine>
                </div>
                {(plan?.oneOffContributions || []).length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 border border-slate-200 rounded-lg">No one-off contributions scheduled.</div>
                ) : (
                  <div className="space-y-2">
                    {plan.oneOffContributions.map(c => {
                      const st = ctx.oneOffStaging.get(c.id);
                      const isExpanded = expandedOneOff.has(c.id);
                      // the engine drops any deposit whose year will not parse, so flag it rather than
                      // letting it silently vanish from the projection
                      const depYear = c.date ? parseInt(String(c.date).slice(0, 4)) : E.num(c.year, NaN);
                      const missingDate = !Number.isFinite(depYear);
                      const missingDest = !c.category;
                      /*
                       * On AUTO the destination is not known until the context is built, so read it back
                       * off the resolved staging rather than printing "Auto (policy decides) headroom",
                       * which would tell the reader nothing about where their money went.
                       */
                      const stForLabel = ctx.oneOffStaging.get(c.id);
                      const destLabel = c.category === E.AUTO_DEPOSIT
                        ? (stForLabel ? `${E.CATEGORY_LABEL[String(stForLabel.targetId).split('_')[0]] || 'the chosen wrapper'} (chosen by policy)` : 'the wrapper your policy picks')
                        : c.category;
                      const incomplete = missingDate || missingDest;
                      const body = (
                        <div key={c.id} className={`p-2.5 rounded-lg text-xs space-y-2 border ${incomplete ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <input type="date" value={c.date || (c.year ? `${c.year}-01-01` : '')} onChange={(e) => { const d = e.target.value; updateListItem('oneOffContributions', c.id, { date: d, year: parseInt(d.slice(0, 4)) || '' }); }} className={`p-1 bg-surface border rounded font-mono text-slate-800 text-xs ${missingDate ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'}`} />
                            {isCouple ? (
                              <select aria-label="Whose deposit" value={c.owner} onChange={(e) => updateListItem('oneOffContributions', c.id, { owner: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700"><option value="Myself">Myself</option><option value="Partner">Partner</option></select>
                            ) : <span className="text-slate-500 font-semibold px-1">Myself</span>}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-400 leading-none">Funding source: new capital or internal transfer?</span>
                              <select aria-label="Paid from" value={c.transferredFrom} onChange={(e) => updateListItem('oneOffContributions', c.id, { transferredFrom: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700" title="Transferred from">
                                <option value="External">External (new capital)</option>
                                {Object.values(E.CATEGORY_LABEL).map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-400 leading-none flex items-center gap-1.5">Funding destination
                                <button type="button" onClick={() => { const cat = E.suggestOneOffDestination(ctx, c.owner === 'Partner' ? 'part' : 'self', Math.max(0, (depYear || ctx.baseYear) - ctx.baseYear), E.num(c.amount, 0)); const category = E.CATEGORY_LABEL[cat]; updateListItem('oneOffContributions', c.id, { category, ...(c.stagedTargetWrapper === c.category ? { stagedTargetWrapper: category } : {}) }); }}
                                  className="text-blue-600 hover:text-blue-800 hover:underline font-semibold cursor-pointer" title="Pick the wrapper this money is worth most in, given the allowance room left that year">Choose for me</button>
                              </span>
                              {/* AUTO hands the choice to the decumulation policy, which is the only way a
                                  windfall-routing policy can ever fire for a real plan rather than only in a study */}
                              <select aria-label="Into which wrapper" value={c.category} onChange={(e) => { const category = e.target.value; const patch = { category }; if (c.stagedTargetWrapper === c.category) patch.stagedTargetWrapper = category; updateListItem('oneOffContributions', c.id, patch); }} className={`p-1 bg-surface border rounded text-blue-700 font-semibold ${missingDest ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'}`}>
                                {Object.values(E.CATEGORY_LABEL).map(l => <option key={l} value={l}>{l}</option>)}
                                <option value={E.AUTO_DEPOSIT}>{E.AUTO_DEPOSIT}</option>
                              </select>
                            </div>
                            <MoneyInput min="0" step="1000" placeholder="Amount (£)" title="The amount that lands in the wrapper. Into a pension, tax relief is not added: enter any relief as its own deposit from External." onFocus={handleFocus} value={c.amount} onChange={(e) => updateListItem('oneOffContributions', c.id, { amount: parseInputNumber(e.target.value) })} className="w-24 p-1 bg-surface border border-slate-300 rounded tabular-nums text-emerald-700 font-bold" />
                            {st && !st.direct && (
                              <button onClick={() => toggleOneOffExpand(c.id)} className="px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:bg-amber-100 border border-amber-200 bg-amber-50 cursor-pointer transition-colors flex items-center gap-1" title="This deposit is larger than the year's allowance, so it is staged over several years">
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                {isExpanded ? 'Hide details' : 'See more details'}
                              </button>
                            )}
                            <button onClick={() => deleteOneOffContrib(c.id)} className="p-1 ml-auto text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          {incomplete && (
                            <div className="flex items-start gap-1.5 text-[11px] text-rose-700 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                              <span>{missingDate ? 'Add a date' : ''}{missingDate && missingDest ? ' and a destination wrapper' : missingDest ? 'Choose a destination wrapper' : ''} ; this deposit is excluded from the projection until you do.</span>
                            </div>
                          )}
                          {st && (
                            <div className="flex flex-wrap items-center gap-2">
                              {st.direct ? (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans text-[10px] font-bold">Direct Deposit (£{fmtNum(Math.round(st.amount))} within headroom)</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-sans text-[10px] font-bold">Staged (Option A): £{fmtNum(Math.round(st.H0))} now &rarr; {destLabel}, £{fmtNum(Math.round(st.surplus0))} parked in Other Investments</span>
                              )}
                              <span className="text-slate-500 font-sans text-[10px]">
                                {Number.isFinite(st.yearHeadroom)
                                  ? `${destLabel} headroom in ${c.year}: ${formatGBP(st.yearHeadroom)}`
                                  : `${destLabel} has no annual limit`}
                              </span>
                            </div>
                          )}
                          {st && !st.direct && isExpanded && (
                            <div className="w-full p-2.5 bg-surface border border-amber-200 rounded-lg text-[11px] space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-600">Staged destination:</span>
                                <select aria-label="Staged into" value={c.stagedTargetWrapper} onChange={(e) => updateListItem('oneOffContributions', c.id, { stagedTargetWrapper: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700">
                                  {Object.values(E.CATEGORY_LABEL).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                              </div>
                              <div className="space-y-0.5 text-slate-600">
                                <div>Year {c.year}: £{fmtNum(Math.round(st.H0))} direct to {c.category} + £{fmtNum(Math.round(st.surplus0))} parked in Other Investments</div>
                                {st.tranches.map((tr, i) => (
                                  <div key={i}>Year {tr.year}: £{fmtNum(Math.round(tr.amount))} transferred to {c.stagedTargetWrapper}{tr.gross ? `, £${fmtNum(Math.round(tr.gross))} with tax relief` : ''}</div>
                                ))}
                                {st.unresolvedRemainder > 0 && (
                                  <div className="text-amber-700">£{fmtNum(Math.round(st.unresolvedRemainder))} remains parked in Other Investments beyond the plan horizon.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                      if (!isPhone) return body;
                      return (
                        <CollapsedRow key={c.id} warn={incomplete} open={openRow === c.id || incomplete || isExpanded} onToggle={() => toggleRow(c.id)}
                          summary={incomplete ? (missingDate ? 'New deposit: needs a date' : 'New deposit: needs a destination') : `${formatGBP(E.num(c.amount, 0))} into ${destLabel}`}
                          sub={`${Number.isFinite(depYear) ? depYear : 'no date'}${isCouple ? ` · ${c.owner}` : ''}`}>
                          {body}
                        </CollapsedRow>
                      );
                    })}
                  </div>
                )}
              </div>
              )}
              {showSection('costs') && (
              <div data-section="costs" className={`bg-surface border border-slate-200/90 rounded-xl space-y-4 ${isPhone ? 'p-3' : 'p-5'}`}>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    {!isPhone && <h3 className="text-sm font-semibold text-rose-700 flex items-center gap-2"><Trash2 className="w-4 h-4 text-rose-600" /> {solverOn ? 'One-off costs' : '5. One-off capital costs'}</h3>}
                    <button type="button" onClick={() => goToDoc('doc-one-offs')} className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer mt-0.5"><HelpCircle className="w-3.5 h-3.5" /> How costs are liquidated from your wrappers &rarr;</button>
                  </div>
                  <button onClick={addOneOffCost} className={`${isPhone ? 'w-full min-h-11 justify-center' : 'px-2.5 py-1'} bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200 self-start sm:self-auto`}><Plus className="w-3.5 h-3.5" /> Add cost</button>
                </div>
                {(plan?.oneOffCosts || []).length === 0 ? (
                  <div className="text-xs text-slate-400 p-3 bg-slate-50 border border-slate-200 rounded-lg">No one-off capital expenses scheduled.</div>
                ) : (
                  <div className="space-y-2">
                    {plan.oneOffCosts.map(cost => isPhone ? phoneCostRow(cost) : (
                      <div key={cost.id} className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                        <input type="date" value={cost.date || (cost.year ? `${cost.year}-01-01` : '')} onChange={(e) => { const d = e.target.value; updateListItem('oneOffCosts', cost.id, { date: d, year: parseInt(d.slice(0, 4)) || '' }); }} className="p-1 bg-surface border border-slate-300 rounded tabular-nums text-slate-800 text-xs" />
                        <input type="text" onFocus={handleFocus} value={cost.desc} onChange={(e) => updateListItem('oneOffCosts', cost.id, { desc: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700 flex-1" placeholder="Purpose" />
                        <MoneyInput min="0" step="1000" placeholder="Amount (£)" onFocus={handleFocus} value={cost.amount} onChange={(e) => updateListItem('oneOffCosts', cost.id, { amount: parseInputNumber(e.target.value) })} className="w-24 p-1 bg-surface border border-slate-300 rounded tabular-nums text-rose-700 font-bold" />
                        <button onClick={() => deleteOneOffCost(cost.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}
            </div>
            {showSection('limits') && (
              <div data-section="limits" className="space-y-2">
                <Suspense fallback={null}>
                  <SolverLocksCard plan={plan} setPlan={setPlan} isPhone={isPhone} ui={SOLVER_UI} />
                </Suspense>
              </div>
            )}
            {showSection('advanced') && (
              <div data-section="advanced" className={`bg-surface border border-slate-200/90 rounded-xl space-y-4 ${isPhone ? 'p-3' : 'p-5'}`}>
                {!isPhone && <h3 className="text-sm font-semibold text-slate-900">{solverOn ? 'Advanced' : '7. Advanced inputs'}</h3>}
                {renderAdvancedInputs(isPhone)}
                {currentApproachCard()}
              </div>
            )}
          </div>
          </PlaceFrame>
        )}








        {/* ---------------- THE NEW PLANNER'S PLACES (step U; LAYOUT.md section 3) ---------------- */}
        {solverOn && activeTab === 'plan' && (
          <main data-place="plan" className="space-y-6">
            <h1 className="sr-only">Your plan</h1>
            {!planStarted ? (
              <Suspense fallback={null}>
                <QuickStartCard onStart={p => { setPlan(p); setAskedPlan(p); }} onFillAll={() => { setActiveTab('you'); selectSection('you'); }}
                  isPhone={isPhone} regions={E.TAX_REGION_LABELS} statePensionFull={E.STATE_PENSION_FULL} fmt={formatGBP} />
              </Suspense>
            ) : coupleCard ? couplesCard() : (
              <Suspense fallback={<div data-plan-answer="loading" className="p-5 bg-surface border border-indigo-200 rounded-xl text-sm text-slate-600">Loading your plan&hellip;</div>}>
                <PlannerPlanCard plan={plan} solve={solve} seed={mcSeed} fmt={formatGBP} isPhone={isPhone} steps={plannerSteps}
                  {...(SOLVER_OPTS && SOLVER_OPTS.strategyActionsN ? { actionsN: SOLVER_OPTS.strategyActionsN } : {})}
                  aside={isPhone ? null : aimsPanel()} onPhase={setPlanPhase} onRetry={retrySolve} points={(SOLVER_OPTS && SOLVER_OPTS.points) || 45}
                  onSolveRequest={isPhone && !asked ? askSolve : null} failedFigures={simResult ? { survival: simResult.successRate, bands: simResult.bands, age0: ctx.owners[0].age0 } : null}
                  rulesLine={rulesLine} onPrint={planFigures ? printSolvedPlan : null} levers={leversSummary} onOpenLevers={openLevers}
                  floorShare={floorShare} minPot={E.num(plan?.config?.solvencyFloor, 0)} onFigures={setPlanFigures} />
              </Suspense>
            )}
          </main>
        )}
        {solverOn && activeTab === 'whatif' && (
          <main data-place="whatif" className="space-y-6">
            <h1 className="text-[22px] font-semibold text-slate-900">What if</h1>
            {!planStarted ? <p className="text-sm text-slate-600">Fill in your plan first, on Your plan or in You.</p>
              : coupleCard ? couplesCard() : (
                <Suspense fallback={null}>
                  <PlannerWhatIf solvedInHand={solvedInHand} plan={plan} solve={solve} ageNow={ctx.owners[0].age0} last={terminalAge - 1} seed={mcSeed} upto={plannerSteps[0]}
                    engine={E} opts={SOLVER_OPTS} fmt={formatGBP} scenarios={{ scenarios, activeScenarioId, isPhone, onLoad: handleSelectScenario, onDelete: handleDeleteScenario }} />
                </Suspense>
              )}
          </main>
        )}
        {solverOn && activeTab === 'details' && (
          <main data-place="details" className="space-y-6">
          <Suspense fallback={null}>
            <PlannerDetails isPhone={isPhone} sections={DETAILS_SECTIONS} section={detailsSection} onSection={setDetailsSection}
              onPrint={planFigures ? printSolvedPlan : null} onExport={handleExportJSON} onImport={() => fileInputRef.current?.click()} onClear={handleResetDefaults}
              fileInput={<input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />}
              couple={coupleCard ? couplesCard : null} ledger={auditCard} history={historyView} taxRules={ctlTaxRules} assumptions={assumptionCards}
              theme={<ThemeToggle theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme} touch={touch} />} numberFormat={numberFormatCard}
              settings={solverSettingsCard} docs={docsSolverCard} />
          </Suspense>
          </main>
        )}


        </Boundary>
      </div>
      {/*
        * Edit mode is an authoring tool, not a feature: it rewrites copy in the source through a dev-only
        * endpoint, which does not exist in a built site. Shipping its button to visitors would offer them
        * a control that cannot work. import.meta.env.DEV is replaced with a literal at build time, so the
        * component tree-shakes out of the production bundle rather than merely being hidden.
        */}
      {import.meta.env.DEV && <EditMode />}

      {/* a whole-plan action's word ("Saved as", "Imported", a print the browser blocked): shown in the new planner since D155, where
          before only the classic planner's pages showed it */}
      {saveSuccessMsg && (
        <div role="status" data-flash className={`fixed left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-4 py-2 rounded-lg bg-surface border border-emerald-200 shadow-lg text-xs font-bold text-emerald-700 flex items-center gap-1.5 ${isPhone ? 'bottom-20' : 'bottom-6'}`}>
          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />{saveSuccessMsg}
        </div>
      )}
      {/* the history check's chart at full screen (Details, on a phone), the inline copy kept mounted underneath */}
      {fullscreenChart === 'hist' && (
        <ChartFullscreen
          open
          title="Historical backtest"
          toolbar={null}
          onBox={setOverlayBox}
          onClose={() => { setFullscreenChart(null); setOverlayBox(null); }}>
          {renderHistoricalChart({ inOverlay: true })}
        </ChartFullscreen>
      )}

      {/* The bar is only rendered on a phone, and is ALSO md:hidden. Belt and braces on purpose: the
          JS boundary and the CSS boundary are the same 767px, and if they ever drift the CSS wins, which
          is the safer failure - a bar that hides itself rather than two navigations at once. */}
      {/* the phone's levers sheet (LAYOUT.md section 9): full screen, "Close" and Escape shut it, kept mounted once opened */}
      {isPhone && solverOn && leversSeen && toBody(
        <div role="dialog" aria-modal="true" aria-label="What matters to you" data-levers-sheet={leversOpen ? 'open' : 'closed'}
          className={`fixed inset-0 z-[55] bg-surface flex flex-col ${leversOpen ? '' : 'hidden'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-between gap-2 px-3 py-1 border-b border-slate-200 shrink-0">
            <span className="text-sm font-semibold text-slate-900">What matters to you</span>
            <button type="button" data-levers-close onClick={() => setLeversOpen(false)} className="min-h-11 px-3 text-sm font-semibold text-slate-700 cursor-pointer">Close</button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3">{aimsPanel(true)}</div>
        </div>
      )}
      {isPhone && (
        <>
          <BottomNav tabs={navTabs} primaryIds={PLANNER_PRIMARY} activeTab={activeTab} more={false}
            onSelect={(id) => { setActiveTab(id); window.scrollTo(0, 0); }} />
        </>
      )}
    </div>
  );
}
