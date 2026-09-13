import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp, Layers, Check, RotateCcw, Dices, Zap, ShieldCheck, Sliders, Download, Upload, Users, Wallet, Coins,
  Settings, Plus, Trash2, Table, FileSpreadsheet, CheckCircle2, AlertTriangle, Pencil, HelpCircle, BookOpen, History, Bookmark,
  Save, Sparkles, ArrowUpRight, ArrowDownRight, Trophy, Info, Sun, Moon, Monitor, ChevronUp, ChevronDown, Home, Gift
} from 'lucide-react';
import EditMode from './EditMode.jsx';
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
const formatGBP = (v) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0);
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
const BAND_QUANTILES = {
  quartile: { z: Z75, button: 'Upper/lower quartiles', short: 'Upper/lower quartiles', label: '1 in 4', lowPct: '25th', highPct: '75th' },
  decile: { z: Z90, button: '10th/90th percentiles', short: '10th/90th percentiles', label: '1 in 10', lowPct: '10th', highPct: '90th' }
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
  // Scottish bands (2025/26). Six of them, and a higher rate that starts £6,608 earlier than rUK.
  // Each limit is the income at which the *next* band starts, matching basicBandLimit's convention.
  scotStarterRate: 19,
  scotStarterLimit: 15397,
  scotBasicRate: 20,
  scotBasicLimit: 27491,
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
  // Behavioural / modelling assumptions
  cashBufferMonths: 6,               // months of spending kept in cash before surplus income is swept to ISA
  harvestPersonalAllowance: true,    // in retirement draw pension to fill unused 0% allowance and move it to ISA
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
  pensionsInEstateFrom: 2027,        // tax year from which unused pensions count as estate (Finance Act 2026)
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
  assumedStatePensionForHeirs: 11976,// ...and roughly what it is worth, since it consumes their allowance
  bridgeSafetyMargin: 30,            // % uplift on the pre-access "bridge" reserve the tournament targets
  solvencyFloor: 0                   // minimum pot at terminal age (bequest floor)
};

const defaultAccounts = () => [
  { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: '', contrib: '', growth: '', risk: 'Low Risk', unrealisedGain: '' },
  { id: 'cash_self', owner: 'Myself', category: 'Cash Savings', balance: '', contrib: '', growth: '', risk: 'Low Risk' },
  { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'isa_part', owner: 'Partner', category: 'S&S ISAs', balance: '', contrib: '', growth: '', risk: 'High Risk' },
  { id: 'other_part', owner: 'Partner', category: 'Other Investments (e.g. GIA)', balance: '', contrib: '', growth: '', risk: 'Low Risk', unrealisedGain: '' },
  { id: 'cash_part', owner: 'Partner', category: 'Cash Savings', balance: '', contrib: '', growth: '', risk: 'Low Risk' }
];

/*
 * WHAT THE HOUSEHOLD IS ACTUALLY OPTIMISING FOR.
 *
 * Measured across 360 households, the ranking objective moves the recommended policy far more than the
 * choice of policies does: ranking on expected pot instead of survival changes the answer for 64% of
 * them, and takes Sequential from winning 1% to winning 55%. Nothing about the policies changes - only
 * the question being asked of them. So the priority order is a first-class input, not a preference.
 *
 * `epsilon` is what makes a RANKING different from a tie-break: a lower priority may only choose among
 * candidates that are near-equal on every higher one. Set it too low and the top priority decides
 * everything, because exact ties are rare; too high and a real sacrifice gets waved through.
 *
 * The money metrics use 3% relative. The two rate metrics use 1 percentage point rather than 3, and the
 * difference is deliberate: those are already probabilities, so three points of survival (90% to 87%) is
 * a far larger concession than 3% of a pot, and one point sits comfortably above Monte Carlo noise at
 * the trial counts used here.
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
 * Measured across 120 households with each priority promoted to first in turn, the worst any stated
 * preference actually costs is 4.33 points of survival, and nothing exceeds 5. The trades are mostly
 * good ones: ranking the pot first gives up 2.6 points on average to gain 37% more pot, and ranking tax
 * first gives up 2.7 points to cut lifetime tax by 72%.
 *
 * So five points is chosen to sit just above the observed worst case. It never overrides a trade this
 * library says is reasonable, and it catches anything worse in a plan nobody thought to test. It is
 * precautionary rather than corrective, which is the honest description, and the number is a config
 * value so it can be tightened by anyone who disagrees.
 *
 * There is deliberately NO absolute survival floor alongside it. A plan whose best available outcome is
 * 69% is fragile because the plan is fragile, not because of how the priorities were ordered, and
 * overriding the ranking for a reason unrelated to the ranking would be the wrong remedy.
 */
const MAX_SURVIVAL_SACRIFICE_PTS = 5;

const PRIORITY_METRICS = {
  survive: {
    label: 'Not running out of money',
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
    label: 'Leaving as much behind as possible',
    why: 'Ranks on what your heirs actually receive after inheritance tax and their own income tax. Needs the Inheritance tab filled in; without it, falls back to the pot left at your final age.',
    serves: 'Favours keeping wealth in wrappers that are taxed once rather than twice, which since 2027 means not leaving an oversized pension behind for heirs who would pay income tax on it as well.',
    get: (st) => st.postTaxInheritance ?? st.medianTerminalNet ?? st.medianTerminal, higherIsBetter: true, unit: 'pct', epsilon: moneyEpsilon
  },
  pot: {
    label: 'The biggest expected pot',
    why: 'Ranks on the typical pot at your final age, before any death tax.',
    serves: 'Favours deferring the pension, because money left inside it compounds untaxed - which is also why this can flatter a pot that still owes income tax on the way out.',
    get: (st) => st.medianTerminal, higherIsBetter: true, unit: 'pct', epsilon: moneyEpsilon
  },
  downside: {
    label: 'Protecting the bad case',
    why: 'Ranks on the pot in the worst one lifetime in ten, rather than the typical one.',
    serves: 'Favours steady tax smoothing over anything that concentrates a tax bill or a capital gain into a single year.',
    get: (st) => st.p10TerminalNet ?? st.p10Terminal, higherIsBetter: true, unit: 'pct', epsilon: moneyEpsilon
  },
  bridge: {
    label: 'Getting safely to pension age',
    why: 'Ranks on how often the plan runs dry BEFORE the pension can be touched, which is the one failure no later good luck can undo.',
    serves: 'Favours holding accessible money back and leaning on the pension only once it unlocks.',
    get: (st) => st.preNmpaFailRate, higherIsBetter: false, unit: 'pts', epsilon: () => RATE_EPSILON_PTS
  },
  tax: {
    label: 'Paying the least tax over your lifetime',
    why: 'Ranks on total income tax paid across the whole plan.',
    serves: 'Favours spreading pension income thinly across many years instead of a few large withdrawals. Worth knowing this is a poor proxy for wealth: paying 20% now often beats deferring to 40% later.',
    get: (st) => st.medianLifetimeTax ?? 0, higherIsBetter: false, unit: 'pct', epsilon: moneyEpsilon
  }
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
    homeSold: false, homeSaleAge: '',
    transferredNrbPct: '', transferredRnrbPct: '',
    // quick succession relief: an inheritance received within five years of death, and the tax paid on it
    qsrInheritedValue: '', qsrTaxPaid: '', qsrYearsBefore: '',
    // s.154 IHTA 1984: a full exemption, not a relief
    activeServiceExempt: false,
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
    blurb: (P) => `Fills the £${P.pa.toLocaleString()} allowance, then draws pension income up to £${P.higherRateStartsAt.toLocaleString()} before touching cash, GIA and ISAs.`,
    steps: ['penPA', 'penBasic', 'cash', 'other', 'isa', 'penAny'], harvest: true
  },
  'Bracket Fill': {
    label: 'UK FIRE Bracket Fill (fill 0% allowance only, then cash/GIA/ISA, pension last)',
    blurb: (P) => `Draws pension only up to £${P.pa.toLocaleString()} (0% tax), then cash, GIA and ISAs; pension income above the allowance is the last resort.`,
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
    blurb: (P) => `Fills the £${P.pa.toLocaleString()} allowance from the pension, then spends the ISA before cash or the GIA. Best where a large GIA would otherwise be sold at a gain to fund spending.`,
    steps: ['penPA', 'isa', 'cash', 'other', 'penBasic', 'penAny'], harvest: true
  },
  'Windfall to ISA': {
    label: 'Windfall to ISA (as Tax Smoothing, but unassigned deposits fill the ISA first)',
    blurb: (P) => `Draws like Tax Smoothing — pension income to £${P.higherRateStartsAt.toLocaleString()} first — but routes a deposit marked "${AUTO_DEPOSIT}" into the ISA before the GIA rather than into the pension. Best where an inheritance would otherwise hit the pension annual allowance.`,
    steps: ['penPA', 'penBasic', 'cash', 'other', 'isa', 'penAny'], harvest: true,
    depositOrder: ['isa', 'other', 'cash', 'pen']
  }
};

const todayISO = () => new Date().toISOString().slice(0, 10);

// Fraction of the calendar year remaining after the valuation date (0.01..1).
const calculateYearFraction = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
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
      surplusGift: { ...BLANK_PLAN.inheritance.surplusGift, ...(isPlainObject(src.inheritance?.surplusGift) ? src.inheritance.surplusGift : {}) }
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
        stagedTargetWrapper: Object.values(CATEGORY_LABEL).includes(x.stagedTargetWrapper) ? x.stagedTargetWrapper : (category === AUTO_DEPOSIT ? CATEGORY_LABEL.other : category)
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
  scrub(plan.demographics); scrub(plan.spending, ['spendBands']); scrub(plan.config);
  if (typeof plan.config.harvestPersonalAllowance !== 'boolean') plan.config.harvestPersonalAllowance = plan.config.harvestPersonalAllowance === '' ? true : !!plan.config.harvestPersonalAllowance;
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
  // accounts: always the eight canonical wrappers, in canonical order, keeping any user values
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

  return { __isParams: true, pa, thr, taperRate, basicLimit, higherLimit, basicRate, higherRate, addRate, nicPT, nicUEL, nicMain, nicUpper, c4Main, c4Upper, erNic, erPass, pclsProp, lsa, isaAllowance, pensionAllowance, pensionNoEarningsLimit, mpaaLimit, aaTaperThr, aaTaperRate, aaTaperFloor, aaAt, cgtEnabled, cgtAnnualExempt, cgtBasicRate, cgtHigherRate, paAt, basicWidth, higherTop, taperEnd, region, ladder, grossLimits, higherRateStartsAt, cgtBandWidth, reliefAtSource };
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

function calculateMarginalRelief(salaryInput, sacrificeInput, cfg, selfEmployed = false) {
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
  const taxSaved = selfEmployed
    ? incomeTax(salary, p) - incomeTax(salary - g, p)
    : calculateUKTaxAndNIC(salary, p) - calculateUKTaxAndNIC(salary - g, p);
  return { netCost: g - taxSaved, taxSaved, reliefRate: g > 0 ? (taxSaved / g) * 100 : 0, pensionCredit: g * passFactor, sacrifice: g, capped: g < sacrifice };
}
// Net take-home cost of a pension contribution (the amount landing in the pension, incl. employer pass-through).
function netCostOfPensionContrib(contrib, salaryInput, cfg, selfEmployed = false) {
  const p = taxParams(cfg);
  const passFactor = passThroughFactor(p, selfEmployed);
  return calculateMarginalRelief(salaryInput, Math.max(0, num(contrib, 0)) / passFactor, cfg, selfEmployed).netCost;
}
// Pension credit obtainable for a given net take-home cost (inverse of the above), capped at maxCredit.
function grossUpNet(netAmount, salaryInput, cfg, maxCredit = Infinity, selfEmployed = false) {
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
    if (calculateMarginalRelief(salary, hi, p, selfEmployed).netCost <= net) credit = hi * passFactor;
    else {
      for (let i = 0; i < 48; i++) {
        const mid = (lo + hi) / 2;
        if (calculateMarginalRelief(salary, mid, p, selfEmployed).netCost < net) lo = mid; else hi = mid;
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
 */
function grossPensionNeededForNet(netTarget, otherTaxableIncome = 0, cfg, isFullyCrystallized = false, pclsHeadroom = Infinity, maxTaxableCeiling = Infinity) {
  const target = num(netTarget, 0);
  if (target <= 0) return 0;
  const p = taxParams(cfg);
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
  const policyForDeposits = DECUMULATION_POLICIES[s.decumulationPolicy] || DECUMULATION_POLICIES['Bracket Fill Basic'];

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
  let terminalAge = clamp(num(d.terminalAge, 100), 1, 120);
  if (terminalAge <= ageSelf0) { warnings.push(`Terminal age (${terminalAge}) must exceed current age; using ${ageSelf0 + 1}.`); terminalAge = ageSelf0 + 1; }
  const nmpa = clamp(num(d.privatePensionAge, 58), 0, 120);
  const spa = clamp(num(d.statePensionAge, 68), 0, 120);
  const targetSpend = Math.max(0, num(s.targetSpend, 0));
  if (targetSpend <= 0) warnings.push('Net living spend is blank or zero. No retirement spending is being modelled.');
  const totalYears = Math.max(1, Math.round(terminalAge - ageSelf0));
  const valuationDate = c.valuationDate || todayISO();
  const yf = calculateYearFraction(valuationDate);
  const baseYear = parseInt(String(valuationDate).slice(0, 4)) || new Date().getFullYear();

  const riskOf = (key) => plan.riskProfiles[key] || DEFAULT_RISK_PROFILES['High Risk'];
  const accounts = plan.accounts.filter(a => isCouple || a.owner === 'Myself').map(a => {
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
  const acc = {};
  accounts.forEach(a => { acc[a.id] = a; });
  const owners = (isCouple ? OWNERS : ['self']).map(o => ({
    key: o, label: OWNER_LABEL[o],
    age0: o === 'self' ? ageSelf0 : agePart0,
    retireAge: o === 'self' ? retireSelf : retirePart,
    salary: Math.max(0, num(o === 'self' ? d.salarySelf : d.salaryPart, 0)),
    // growth on top of inflation; 0 leaves pay flat in today's money
    salaryGrowth: clamp(num(o === 'self' ? d.salaryGrowthSelf : d.salaryGrowthPart, 0), -100, 100) / 100,
    // trading profit rather than salary: Class 4 NIC, and pension relief at the income tax rate only
    selfEmployed: (o === 'self' ? d.employmentSelf : d.employmentPart) === 'self-employed',
    cgtGainsUsed: Math.max(0, num(o === 'self' ? d.cgtGainsUsedSelf : d.cgtGainsUsedPart, 0)),
    // unused annual allowance from the three tax years before the projection starts
    cfBroughtForward: Math.max(0, num(o === 'self' ? d.cfBroughtForwardSelf : d.cfBroughtForwardPart, 0)),
    // age from which the MPAA applies; NaN when the owner has not flexibly accessed a pension
    mpaaAge: num(o === 'self' ? d.mpaaAgeSelf : d.mpaaAgePart, NaN),
    statePension: Math.max(0, num(o === 'self' ? d.statePensionSelf : d.statePensionPart, 0)),
    ids: { pen: accountId('pen', o), isa: accountId('isa', o), other: accountId('other', o), cash: accountId('cash', o) }
  }));
  owners.forEach(o => {
    const pen = acc[o.ids.pen]; const isa = acc[o.ids.isa];
    const ownerAA = P.aaAt(o.salary);
    if (pen && pen.contrib > ownerAA) warnings.push(`${o.label}: pension contribution £${Math.round(pen.contrib).toLocaleString()} exceeds the annual allowance £${Math.round(ownerAA).toLocaleString()}${ownerAA < P.pensionAllowance ? ` (tapered from £${P.pensionAllowance.toLocaleString()} because earnings exceed £${P.aaTaperThr.toLocaleString()})` : ''}.`);
    if (isa && isa.contrib > P.isaAllowance) warnings.push(`${o.label}: ISA contribution £${Math.round(isa.contrib).toLocaleString()} exceeds the ISA allowance £${P.isaAllowance.toLocaleString()}.`);
    if (o.salary > 0 && pen && pen.contrib > o.salary) warnings.push(`${o.label}: pension contribution exceeds ${o.selfEmployed ? 'trading profit' : 'salary'}.`);
    // the pass-through only exists because an employer saves NIC on sacrificed salary; a sole trader has neither
    if (o.selfEmployed && P.erPass > 0) warnings.push(`${o.label}: employer NIC pass-through is set to ${Math.round(P.erPass * 100)}% in Config, but the self-employed have no employer, so it is ignored for this person.`);
    const gia = acc[o.ids.other];
    if (P.cgtEnabled && gia && gia.balance > 0 && isBlank(plan.accounts.find(a => a.id === o.ids.other)?.unrealisedGain)) {
      warnings.push(`${o.label}: no unrealised gain entered for Other Investments, so the £${Math.round(gia.balance).toLocaleString()} balance is treated as all cost and only future growth is taxed. Set it under Advanced inputs if the holding has an embedded gain.`);
    }
    // the plan draws taxable pension income while still paying in, so the MPAA is triggered and the excess
    // would face an annual allowance charge (which the model does not itself levy)
    if (Number.isFinite(o.mpaaAge) && pen && pen.contrib > P.mpaaLimit && o.mpaaAge < o.retireAge) {
      warnings.push(`${o.label}: the plan draws taxable pension income from age ${o.mpaaAge} while still contributing £${Math.round(pen.contrib).toLocaleString()}/yr, which permanently cuts the annual allowance to £${P.mpaaLimit.toLocaleString()} (the money purchase annual allowance). Contributions above that would face an annual allowance charge.`);
    }
    if (o.retireAge < o.age0 && o.age0 < 120) { /* already retired: fine */ }
  });
  if (isCouple) {
    const firstRetire = Math.min(...owners.map(o => o.retireAge));
    const stillWorking = owners.filter(o => o.retireAge > firstRetire && o.salary <= 0);
    if (stillWorking.length) warnings.push(`${stillWorking.map(w => w.label).join(', ')} keeps working after the first retirement but has no salary entered, so the full joint spend will be drawn from the portfolio in those years.`);
  }

  const otherIncomes = plan.otherIncomes.filter(i => isCouple || i.owner === 'Myself').map(i => ({
    owner: i.owner === 'Partner' ? 'part' : 'self',
    startAge: Math.max(0, num(i.startAge, 0)),
    endAge: isBlank(i.endAge) ? terminalAge : num(i.endAge, terminalAge),
    amount: Math.max(0, num(i.amount, 0)),
    taxFree: !incomeTypeOf(i.incomeType).taxable,
    isEarnings: incomeTypeOf(i.incomeType).relevantEarnings
  }));
  const yearOf = (x) => x.date ? parseInt(String(x.date).slice(0, 4)) : num(x.year, NaN);
  const oneOffContribs = new Map();
  const oneOffDeductions = new Map();
  const stagedTransfers = new Map();
  const oneOffStaging = new Map();
  {
    // Shared per-owner/wrapper/year claim ledger: every deposit and staged drip tranche competes for the
    // same headroom, so two deposits for the same owner/wrapper can never double-claim one year's allowance.
    const claimed = new Map(); // `${ownerKey}|${cat}|${t}` -> £ already claimed this pass
    const headroomCtx = { P, owners, acc, otherIncomes };
    const claim = (ownerKey, cat, t, want) => {
      const key = `${ownerKey}|${cat}|${t}`;
      const already = claimed.get(key) || 0;
      const avail = Math.max(0, wrapperHeadroomAtYear(headroomCtx, ownerKey, cat, t) - already);
      const take = Math.min(want, avail);
      claimed.set(key, already + take);
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
              `${OWNER_LABEL[ownerKey]}: one-off deposit of £${Math.round(amt).toLocaleString()} exceeds available ${CATEGORY_LABEL[srcCat]} balance (£${Math.round(startBal).toLocaleString()}); the deduction will be capped to the available balance.`
            );
          }
        }
      }

      // headroom resolution: direct deposit if within headroom, otherwise stage the surplus (Option A)
      // yearHeadroom is this year's raw allowance (before other deposits' claims), shown on the row
      const yearHeadroom = wrapperHeadroomAtYear(headroomCtx, ownerKey, targetCat, t);
      const H0 = claim(ownerKey, targetCat, t, amt);
      if (!oneOffContribs.has(y)) oneOffContribs.set(y, []);
      if (amt <= H0 + 1e-6) {
        oneOffContribs.get(y).push({ id: targetId, amount: amt });
        oneOffStaging.set(x.id, { direct: true, targetId, otherId, stagedId: targetId, amount: amt, H0: amt, yearHeadroom, surplus0: 0, tranches: [], unresolvedRemainder: 0 });
        return;
      }

      const surplus0 = amt - H0;
      if (H0 > 0) oneOffContribs.get(y).push({ id: targetId, amount: H0 });
      oneOffContribs.get(y).push({ id: otherId, amount: surplus0 });

      const stagedCat = Object.keys(CATEGORY_LABEL).find(k => CATEGORY_LABEL[k] === x.stagedTargetWrapper) || targetCat;
      const stagedId = accountId(stagedCat, ownerKey);
      const tranches = [];
      let remaining = surplus0;
      if (stagedCat !== 'other') {
        for (let dt = t + 1; dt <= totalYears && remaining > 0.005; dt++) {
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
        `${OWNER_LABEL[ownerKey]}: £${Math.round(remaining).toLocaleString()} of the ${y} one-off deposit could not be fully staged into ${CATEGORY_LABEL[stagedCat]} within the plan horizon and will remain in Other Investments.`
      );
      oneOffStaging.set(x.id, { direct: false, targetId, otherId, stagedId, amount: amt, H0, yearHeadroom, surplus0, tranches, unresolvedRemainder: Math.max(0, remaining) });
    });
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
      warnings.push(`Spending bands overlap between ages ${b.fromAge} and ${Math.min(prev.toAge, b.toAge)}; the earlier band (£${Math.round(prev.amount).toLocaleString()}) wins for those years.`);
    }
  });

  const policy = policyForDeposits;
  const ctx = {
    plan, warnings, isCouple, P, owners, accounts, acc,
    ageSelf0, agePart0, terminalAge, totalYears, nmpa, spa, targetSpend,
    spendBands,
    fullLumpSum: s.drawdownStrategy === 'Full 25% Lump Sum',
    policyKey: s.decumulationPolicy, policySteps: policy.steps, harvestPA: policy.harvest && !!c.harvestPersonalAllowance,
    harvestCeiling: c.harvestCeiling === 'basic' ? 'basic' : 'pa',
    costSteps: policy.costSteps || DEFAULT_COST_STEPS, depositOrder: policy.depositOrder || null,
    pensionDeathTaxRate: clamp(num(c.pensionDeathTaxRate, 0), 0, 100) / 100,
    cashBufferYears: clamp(num(c.cashBufferMonths, 6), 0, 120) / 12,
    solvencyFloor: Math.max(0, num(c.solvencyFloor, 0)),
    inflation: clamp(num(c.inflation, 2.5), -50, 100) / 100,
    yf, baseYear, valuationDate,
    otherIncomes, oneOffContribs, oneOffCosts, oneOffDeductions, stagedTransfers, oneOffStaging
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
  return { pots, giaBasis, cgtCarry: { self: 0, part: 0 }, cumPcls: { self: 0, part: 0 }, lumpSumTaken: { self: false, part: false } };
};

// Money paid into the GIA is added at cost, so it creates no gain.
const giaAddBasis = (state, ownerKey, amount) => { if (amount > 0) state.giaBasis[ownerKey] += amount; };

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
function stepYear(ctx, state, t, market = 'expected', spendOverride = null) {
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

  // 1. one-off deposits (dated: not pro-rated) — includes staged deposits' year-0 immediate tranche + parked surplus
  const deposits = ctx.oneOffContribs.get(year);
  if (deposits) deposits.forEach(x => {
    if (pots[x.id] === undefined) return;
    pots[x.id] += x.amount;
    if (cgtOn && x.id.startsWith('other_')) giaAddBasis(state, ownerOfId(x.id), x.amount);
  });

  // 1.5 staged multi-year drip transfers (t>=1): drain GIA into the (possibly redirected) staged target,
  // capped at whatever remains in GIA — this naturally handles a market-crash-depleted GIA.
  // Moving out of the GIA is a real disposal (Bed & ISA), so it realises gain pro-rata.
  const drips = ctx.stagedTransfers.get(year);
  if (drips) drips.forEach(x => {
    const move = sellGia(x.fromId, x.amount);
    if (move <= 0) return;
    pots[x.toId] = (pots[x.toId] || 0) + move;
    if (cgtOn && x.toId.startsWith('other_')) giaAddBasis(state, ownerOfId(x.toId), move);
  });

  // 2. regular contributions while the owner works (year 0 pro-rated)
  const contribThisYear = { self: 0, part: 0 };
  const isaContribThisYear = { self: 0, part: 0 };
  ctx.accounts.forEach(a => {
    if (!working[a.owner]) return;
    const amt = contribAtYear(a, t);
    if (amt > 0) {
      pots[a.id] += amt * frac;
      if (cgtOn && a.cat === 'other') giaAddBasis(state, a.owner, amt * frac);
      contribThisYear[a.owner] += amt * frac;
      if (a.cat === 'isa') isaContribThisYear[a.owner] += amt * frac;
    }
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
  const netGuaranteed = {};
  owners.forEach(o => { netGuaranteed[o.key] = taxFreeIncome[o.key] + calculateUKNetIncome(taxable[o.key], P); });
  let totalNetGuaranteed = owners.reduce((sum, o) => sum + netGuaranteed[o.key], 0);
  // take-home of a partner who is still working after the household has started drawing (offsets living costs)
  let workingTakeHome = 0;
  if (anyRetired) {
    owners.forEach(o => {
      if (!working[o.key] || o.salary <= 0) return;
      const pen = acc[o.ids.pen];
      const penContrib = pen ? contribAtYear(pen, t) : 0;
      const pay = salaryAtYear(o, t);
      // pay less tax, NIC and the net cost of the pension contribution — which prices sacrifice for an
      // employee and relief at source for the self-employed, whose NIC is charged on the whole profit
      const takeHome = pay - calculateUKTaxAndNIC(pay, P, o.selfEmployed) - netCostOfPensionContrib(penContrib, pay, P, o.selfEmployed);
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

  // draw `netNeeded` net from an owner's pension without taking taxable income above `ceiling`; returns net delivered
  const drawPension = (oKey, netNeeded, ceiling = Infinity) => {
    const o = ownerByKey[oKey];
    if (!o || netNeeded <= 0 || !access[oKey]) return 0;
    const pot = pots[o.ids.pen] || 0;
    if (pot <= 0) return 0;
    const fully = ctx.fullLumpSum && state.lumpSumTaken[oKey];
    const headroom = fully ? 0 : pclsHeadroom(oKey);
    if (taxable[oKey] >= ceiling) return 0;
    const grossNeeded = grossPensionNeededForNet(netNeeded, taxable[oKey], P, fully, headroom, ceiling);
    const gross = Math.min(pot, grossNeeded);
    if (gross <= 0) return 0;
    pots[o.ids.pen] = pot - gross;
    drawdownPensions += gross;
    const taxFree = fully ? 0 : Math.min(gross * P.pclsProp, headroom);
    state.cumPcls[oKey] += taxFree;
    const taxablePart = gross - taxFree;
    taxablePensionDrawn[oKey] += taxablePart;
    const before = calculateUKNetIncome(taxable[oKey], P);
    taxable[oKey] += taxablePart;
    const after = calculateUKNetIncome(taxable[oKey], P);
    return taxFree + (after - before);
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
      else { for (const o of owners) { if (rem > 0) rem -= drawPot(o.ids[step], rem); } }
    }
    unmetCost = Math.max(0, rem);
  }

  // 6. living-cost demand
  const spendBase = spendOverride !== null ? spendOverride : null;
  let annualLivingTarget = 0;
  if (anyRetired) {
    if (spendBase !== null) {
      const ratio = ctx.targetSpend > 0 ? spendTargetAtAge(ctx, ageSelf) / ctx.targetSpend : 1;
      annualLivingTarget = Math.max(0, spendBase) * ratio;
    } else annualLivingTarget = spendTargetAtAge(ctx, ageSelf);
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
  } else if (netDemand > 0) {
    owners.forEach(o => { demand[o.key] = netDemand / owners.length; });
    const remaining = () => owners.reduce((s, o) => s + demand[o.key], 0);
    // each wrapper tier: own pot first, then cross-cover the other owner
    const tier = (cat) => {
      owners.forEach(o => { demand[o.key] -= drawPot(o.ids[cat], demand[o.key]); });
      owners.forEach(o => owners.forEach(x => { if (x.key !== o.key && demand[x.key] > 0) demand[x.key] -= drawPot(o.ids[cat], demand[x.key]); }));
    };
    const pensionTier = (ceilingOf) => {
      owners.forEach(o => { if (demand[o.key] > 0) demand[o.key] = Math.max(0, demand[o.key] - drawPension(o.key, demand[o.key], ceilingOf(o))); });
      owners.forEach(o => owners.forEach(x => { if (x.key !== o.key && demand[x.key] > 0) demand[x.key] = Math.max(0, demand[x.key] - drawPension(o.key, demand[x.key], ceilingOf(o))); }));
    };
    for (const step of ctx.policySteps) {
      if (remaining() <= 0.005) break;
      if (step === 'penPA') pensionTier(() => P.pa);
      else if (step === 'penBasic') pensionTier(() => P.higherRateStartsAt);
      else if (step === 'penAny') pensionTier(() => Infinity);
      else tier(step);
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
    const harvestCeil = ctx.harvestCeiling === 'basic' ? P.higherRateStartsAt : P.pa;
    owners.forEach(o => {
      if (working[o.key] || !access[o.key]) return;
      if ((pots[o.ids.pen] || 0) <= 0 || taxable[o.key] >= harvestCeil) return;
      const net = drawPension(o.key, 1e12, harvestCeil);
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
      const taxableIncome = Math.max(0, taxable[o.key] - P.paAt(taxable[o.key]));
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
      unmetCgt += Math.max(0, rem);
      // selling to pay the bill realises further gain — defer it to next year rather than recursing
      state.cgtCarry[o.key] += realisedGains[o.key] - gainsBeforeSettling;
      realisedGains[o.key] = gainsBeforeSettling;
    });
  }

  const unmetDemand = owners.reduce((s, o) => s + Math.max(0, demand[o.key]), 0) + unmetCost + oneOffDeductionShortfall + unmetCgt;
  const lockedPensionWealth = owners.reduce((s, o) => s + (access[o.key] ? 0 : (pots[o.ids.pen] || 0)), 0);
  const preNmpaInsolvent = unmetDemand > 1 && (!anyAccess || lockedPensionWealth > 0);

  // 8. compounding (year 0 pro-rated)
  ctx.accounts.forEach(a => {
    let g = a.real;
    if (isHistorical) g = (histPoint && !a.isCash) ? (a.equityWeight * histPoint.s + (1 - a.equityWeight) * histPoint.b) / 100 : a.real;
    else if (typeof market === 'object' && market !== null && market.z !== undefined) {
      // Log-return with median equal to the stated expected (geometric) real return. The sigmaParam
      // term shifts that median for the whole path at once, so it compounds instead of averaging out.
      const zp = market.zPath || 0;
      g = Math.exp(Math.log(1 + a.real) + a.sigmaParam * zp + a.vol * market.z) - 1;
    }
    pots[a.id] = Math.max(0, (pots[a.id] || 0) * (1 + g * frac));
  });

  const sumOwner = (o) => CATEGORIES.reduce((s, cat) => s + (pots[o.ids[cat]] || 0), 0);
  const totalSelf = sumOwner(ownerByKey.self);
  const totalPart = ctx.isCouple ? sumOwner(ownerByKey.part) : 0;
  const totalCombined = totalSelf + totalPart;
  const taxPaid = owners.reduce((s, o) => s + incomeTax(taxable[o.key], P), 0);
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
    realisedGains: realisedGains.self + realisedGains.part,
    preNmpaInsolvent, unmetDemand
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
  let failed = false, failAge = null, preNmpaFailed = false, minPot = Infinity, lifetimeTax = 0;
  let terminalRow = null;
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
    if (!failed && (row.unmetDemand > FAIL_TOLERANCE || row.preNmpaInsolvent)) {
      failed = true; failAge = row.ageSelf; preNmpaFailed = row.preNmpaInsolvent || !ctx.owners.some(o => (o.key === 'self' ? row.ageSelf : row.agePart) >= ctx.nmpa);
    }
    terminalRow = row;
  }
  const terminalPot = Math.max(0, terminalRow.totalCombined);
  if (!failed && ctx.solvencyFloor > 0 && terminalPot < ctx.solvencyFloor) { failed = true; failAge = terminalRow.ageSelf; }
  const terminalPotNet = Math.max(0, terminalPot - Math.max(0, terminalRow.pensions) * ctx.pensionDeathTaxRate);
  const out = { survived: !failed, failAge, preNmpaFailed, terminalPot, terminalPotNet, minPot, lifetimeTax };
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
    medianFailAge: fails.length ? q(fails, 0.5) : null,
    earliestFailAge: fails.length ? fails[0] : null,
    preNmpaFailRate: (results.filter(r => !r.survived && r.preNmpaFailed).length / n) * 100,
    medianLifetimeTax: q(results.map(r => r.lifetimeTax).sort((a, b) => a - b), 0.5)
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
    if (r.targetSpend > 0) { pv += r.netDrawdown / Math.pow(1 + rate, years); years++; needed += r.netDrawdown; }
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

function wrapperHeadroomAtYear(ctx, ownerKey, category, t) {
  const { P, acc, owners } = ctx;
  if (category === 'other' || category === 'cash') return Infinity;
  const o = owners.find(x => x.key === ownerKey);
  if (!o) return 0;
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
    o.salary > 0 ? o.salary * passThroughFactor(P, o.selfEmployed) : P.pensionAllowance
  );
  let penNetRemaining = penNet;
  const order = owners.map((o, i) => i).sort((a, b) => penW[b] - penW[a]);
  // price every top-up at the owner's marginal rate given what is already going into that pension
  const allocate = (i, netAmt) => {
    if (netAmt <= 0) return 0;
    const o = owners[i];
    const cap = Math.max(0, capOf(o) - penGross[i]);
    if (cap <= 0) return 0;
    const credit = grossUpNetIncremental(netAmt, o.salary, P, penGross[i], cap, o.selfEmployed);
    if (credit <= 0) return 0;
    penGross[i] += credit;
    const total = netCostOfPensionContrib(penGross[i], o.salary, P, o.selfEmployed);
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
        const excessNet = penNetUsed[i] - netCostOfPensionContrib(penFloorGross[i], o.salary, P, o.selfEmployed);
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
      if (a.id === o.ids.other && alloc.giaContrib > 0) { a.contrib = Math.round((num(a.contrib, 0)) + alloc.giaContrib / ctx.owners.length); }
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
        net += cat === 'pen' ? netCostOfPensionContrib(c, salaryAtYear(o, t), cfg, o.selfEmployed) : c;
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
    chosenShare: best.share, chosenLabel: best.label,
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
function buildTournament(rawPlan, { emergencyFloor = 25000, scope = 'contributions', netBudgetOverride = null, balance = 'proportional', entrants = [] } = {}) {
  const ctx = buildContext(rawPlan);
  const plan = ctx.plan;
  const { P, owners, acc } = ctx;
  const cfg = plan.config;
  const margin = 1 + clamp(num(cfg.bridgeSafetyMargin, 30), 0, 500) / 100;

  const currentPen = owners.map(o => acc[o.ids.pen] ? acc[o.ids.pen].contrib : 0);
  const currentIsa = owners.map(o => acc[o.ids.isa] ? acc[o.ids.isa].contrib : 0);
  const currentPenNet = owners.reduce((s, o, i) => s + netCostOfPensionContrib(currentPen[i], o.salary, cfg, o.selfEmployed), 0);
  const currentIsaNet = currentIsa.reduce((a, b) => a + b, 0);
  const derivedBudget = currentIsaNet + currentPenNet;
  const netBudget = netBudgetOverride !== null && netBudgetOverride !== '' ? Math.max(0, num(netBudgetOverride, 0)) : derivedBudget;

  const liquidToday = owners.reduce((s, o) => s + ['isa', 'other', 'cash'].reduce((t, cat) => t + (acc[o.ids[cat]] ? acc[o.ids[cat]].balance : 0), 0), 0);
  const bridge = bridgeRequirement(ctx);
  const yearsToFirstRetire = Math.max(1, Math.min(...owners.map(o => o.retireAge - o.age0)));
  const bridgeCapital = bridge.gapYears > 0 ? bridge.netNeeded * margin : 0;
  const bridgeShortfall = Math.max(0, bridgeCapital - Math.max(0, liquidToday - emergencyFloor));
  const annualIsaNeeded = bridge.gapYears > 0 ? bridgeShortfall / yearsToFirstRetire : 0;

  const salaryKnown = owners.some(o => o.salary > 0);
  const meta = { netBudget, derivedBudget, bridge, bridgeCapital, bridgeShortfall, annualIsaNeeded, liquidToday, salaryKnown, yearsToFirstRetire };

  /*
   * Bed & SIPP: a one-off personal contribution funded from ISA capital that is genuinely spare. Relief at
   * source adds the basic rate inside the pension; any higher or additional-rate relief comes back as cash
   * (this route saves no NIC). `spare` is the caller's judgement of what can be moved without leaving the
   * household short, which is the only part the two players disagree about.
   */
  const bedAndSipp = (alloc, spare) => {
    if (scope !== 'full' || !(spare > 0)) return null;
    const o = owners[0];
    const isaSelfBal = acc[o.ids.isa] ? acc[o.ids.isa].balance : 0;
    const aaRoom = Math.max(0, Math.min(P.aaAt(o.salary), o.salary > 0 ? o.salary : P.pensionAllowance) - alloc.penByOwner[0]);
    const gross = Math.min(aaRoom, spare / (1 - P.reliefAtSource), isaSelfBal / (1 - P.reliefAtSource));
    if (!(gross > 250)) return null;
    const net = gross * (1 - P.reliefAtSource);
    const reliefTotal = o.salary > 0 ? incomeTax(o.salary, P) - incomeTax(Math.max(0, o.salary - gross), P) : gross * P.higherRate;
    const refund = Math.max(0, reliefTotal - gross * P.reliefAtSource);
    return { transfer: { net, gross, refund, fromId: o.ids.isa, toId: o.ids.pen, refundId: o.ids.cash }, reliefExtra: gross - net + refund };
  };

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
    const lateYears = Math.max(1, Math.ceil(yearsToFirstRetire / 2));
    const canBackLoad = bridge.gapYears > 0 && lateYears < yearsToFirstRetire;
    const candidates = [];
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
    const pushLevel = (m) => {
      const sized = bridgeIsaAnnual(ctx, { emergencyFloor, margin: m * margin });
      const alloc = allocateBudget(ctx, netBudget, 0, { isaMin: sized.annual, balance });
      const bs = bedAndSipp(alloc, spareForSipp(sized));
      candidates.push({
        share: null, cover: m, label: m === 0 ? 'No bridge' : `${m.toFixed(2).replace(/0$/, '')}x level`, alloc, sized,
        transferNet: bs ? bs.transfer.net : 0, transferGross: bs ? bs.transfer.gross : 0, reliefExtra: bs ? bs.reliefExtra : 0,
        describe: (m === 0
          ? 'Everything to the pension, with nothing set aside for the bridge: on these paths that survived better than funding one.'
          : `Everything to the pension except the bridge, sized at ${m.toFixed(2).replace(/0$/, '')}x the growth-adjusted target (${formatGBP(sized.annual)}/yr to the ISA) and paid in level over ${sized.years} years.`)
          + (bs ? ` Spare ISA capital above the bridge reserve is moved into the pension as well.` : ''),
        planState: applyAllocationToPlan(plan, ctx, alloc, bs ? { transfer: bs.transfer } : {})
      });
    };
    const pushLate = (m) => {
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
      const bs = bedAndSipp(late, spareForSipp(sized));
      candidates.push({
        share: null, cover: m, label: `${m.toFixed(2).replace(/0$/, '')}x last ${lateYears}y`, alloc: late, sized,
        phase: { switchYears: lateYears, yearsToFirstRetire, early, late },
        transferNet: bs ? bs.transfer.net : 0, transferGross: bs ? bs.transfer.gross : 0, reliefExtra: bs ? bs.reliefExtra : 0,
        describe: `Pension-max for ${switchAt} year${switchAt === 1 ? '' : 's'}, then ${formatGBP(sized.annual)}/yr to the ISA over the final ${lateYears} to build the bridge, sized at ${m.toFixed(2).replace(/0$/, '')}x the growth-adjusted target.`
          + (bs ? ' Spare ISA capital above the bridge reserve is moved into the pension as well.' : ''),
        planState: applyAllocationToPlan(plan, ctx, late, bs ? { contribByYear, transfer: bs.transfer } : { contribByYear })
      });
    };
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
      `Routes the budget to pension first (subject to the pre-SIPP access bridge minimum) to capture maximum upfront ${owners.every(o => o.selfEmployed) ? 'tax relief' : 'tax and NIC relief'}` + (transfer ? '; also moves spare ISA capital into the pension.' : '.'),
      alloc, { transferNet: transfer ? Math.round(transfer.net) : 0, transferGross: transfer ? Math.round(transfer.gross) : 0, taxReliefSaved: alloc.taxReliefSaved + reliefExtra, planOpts: { transfer } }));
  }
  // 5 bracket-smoothed pension sizing
  {
    const penFloor = owners.map(o => {
      const a = acc[o.ids.pen]; if (!a) return 0;
      const accessAge = Math.max(o.retireAge, ctx.nmpa);
      const drawYears = Math.max(1, ctx.terminalAge - accessAge);
      const guaranteedTaxable = o.statePension + ctx.otherIncomes.filter(i => i.owner === o.key && !i.taxFree).reduce((s, i) => s + i.amount, 0);
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

function pickBalanced(cands, opts = {}) {
  const pool = applySurvivalGuard(cands, opts.maxSurvivalSacrificePts);
  const scores = balancedScore(pool, opts.weights);
  let best = 0;
  scores.forEach((v, i) => { if (v > scores[best]) best = i; });
  return pool[best];
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
  for (const key of priorities) {
    const before = pool.length;
    if (before <= 1) break;
    const m = PRIORITY_METRICS[key];
    const vals = pool.map(c => m.get(c.stats));
    const best = m.higherIsBetter ? Math.max(...vals) : Math.min(...vals);
    const eps = toleranceFor(key, best, opts.tolerances);
    pool = pool.filter(c => m.higherIsBetter ? m.get(c.stats) >= best - eps : m.get(c.stats) <= best + eps);
    if (pool.length < before) steps.push({ key, label: m.label, serves: m.serves, best, ruledOut: before - pool.length, left: pool.length });
  }
  /*
   * Report the guard only when it actually removed something. A limit that never bound did not shape
   * the answer, and listing it as a reason would be the same just-so storytelling the steps avoid.
   */
  return { winner: pool[0], steps, guardBound, guardCapPts: opts.maxSurvivalSacrificePts ?? MAX_SURVIVAL_SACRIFICE_PTS,
    guardRuledOut: poolBeforeGuard.length - pool.length };
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
    income: Math.max(0, num(b.income, 0)),
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
  const willEstate = liquid + homeValue;                 // what the will divides
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
  const gifts = (Array.isArray(opts.gifts) ? opts.gifts : [])
    .map(g => ({ amount: Math.max(0, num(g.amount, 0)), year: num(g.year, NaN), desc: g.desc }))
    .filter(g => g.amount > 0 && Number.isFinite(g.year))
    .map(g => ({ ...g, yearsBefore: deathYear - g.year }))
    .filter(g => g.yearsBefore >= 0)
    .sort((a, b) => a.year - b.year);

  let nrbLeft = nrbFull;
  let giftTax = 0;
  const exemptLeft = new Map();                          // one annual exemption per year, first gift first
  const giftRows = gifts.map(g => {
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

  const afterExempt = Math.max(0, grossEstate - exemptValue);
  const chargeable = Math.max(0, afterExempt - nrb - rnrb);
  // the charity test is against the estate after exemptions and bands but BEFORE the charitable gift
  const baseline = Math.max(0, grossEstate - (exemptValue - charityValue) - nrb - rnrb);
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
  const iht = Math.max(0, ihtBeforeRelief - qsrRelief);

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
    const assumedIncome = b.income + (atSpa ? num(c.assumedStatePensionForHeirs, 11976) : 0);
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
      effectiveRatePct: gross > 0 ? 100 * (1 - net / gross) : 0
    };
  });

  const totalNet = beneficiaries.reduce((t, b) => t + b.net, 0);
  const totalIncomeTax = beneficiaries.reduce((t, b) => t + b.incomeTaxOnPension, 0);
  return {
    grossEstate, liquid, pension: pen, pensionCounts, homeValue,
    nrb, nrbFull, nrbUsedByGifts: nrbFull - nrb, giftTax, gifts: giftRows,
    rnrb,
    // what the taper actually cost: the band this estate would have had without it, less what it has.
    // Measuring the taper on its own would report a loss to an estate with no home to claim it against.
    rnrbTaperLoss: (homeToDescendants && anyDescendant && rnrbAsset > 0)
      ? Math.max(0, Math.min(rnrbFull, rnrbAsset) - rnrb) : 0,
    rnrbFromDownsizing,
    exemptValue, charityValue, charityQualifies, ratePct: rate * 100,
    chargeable, iht, ihtBeforeRelief, qsrRelief, qsrPct, activeServiceExempt,
    incomeTaxOnPensions: totalIncomeTax,
    totalTax: iht + totalIncomeTax, netToBeneficiaries: totalNet,
    effectiveRatePct: grossEstate > 0 ? 100 * (1 - totalNet / grossEstate) : 0,
    sharesDeclaredPct: declared, pensionSharesDeclaredPct: declaredPen, beneficiaries,
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
function estateForPlanAt(plan, ctx, rows) {
  const inh = plan?.inheritance || {};
  const bens = normalizeBeneficiaries(inh.beneficiaries);
  if (!bens.length) return null;
  const ev = evaluateRows(ctx, rows);
  const age = clamp(num(inh.deathAge, ctx.terminalAge), 0, 120);
  const row = rows.find(r => r.ageSelf >= age) || rows[rows.length - 1];
  const soldBy = !!inh.homeSold && num(inh.homeSaleAge, 999) <= age;
  const res = (ctx.isCouple ? estateForCouple : estateAtDeath)(
    plan.config, { pen: row.pensions, isa: row.isas, other: row.other, cash: row.cash },
    { deathAge: age, deathYear: row.year, homeValue: soldBy ? 0 : Math.max(0, num(inh.homeValue, 0)),
      // a home sold still carries its residence band through the downsizing addition
      formerHomeValue: soldBy ? Math.max(0, num(inh.homeValue, 0)) : 0,
      homeToDescendants: inh.homeToDescendants !== false,
      transferredNrbPct: num(inh.transferredNrbPct, 0), transferredRnrbPct: num(inh.transferredRnrbPct, 0),
      qsrInheritedValue: num(inh.qsrInheritedValue, 0), qsrTaxPaid: num(inh.qsrTaxPaid, 0),
      qsrYearsBefore: num(inh.qsrYearsBefore, 99), activeServiceExempt: !!inh.activeServiceExempt,
      gifts: inh.gifts, beneficiaries: bens });
  const est = ctx.isCouple ? res.second : res;
  // a plan that ran dry leaves its heirs nothing, whatever the estate arithmetic says about the year it
  // was priced in - the money was needed before then
  return { est, row, survived: ev.survived, net: ev.survived ? est.netToBeneficiaries : 0 };
}

function postTaxInheritanceFor(plan, ctx) {
  const r = estateForPlanAt(plan, ctx, simulateDeterministic(ctx, 'expected'));
  return r ? r.net : null;
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
    const lowest = bens.map((b, i) => ({ i, income: b.income })).sort((a, b) => a.income - b.income)[0].i;
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
 * Three levers, and deliberately only three:
 *
 *   1 WITHDRAWAL ORDER - which wrapper funds the spending, whether the tax-free lump sum is taken in
 *     one go, and whether the personal allowance is harvested. Eighteen combinations.
 *   2 A GIFT now - how much, given next year, subject to the plan still surviving.
 *   3 THE PENSION NOMINATION - which heir the pension goes to, which matters because they pay income
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
 * The search is coordinate descent - best order, then best gift given that order, then best nomination
 * given both, then one confirming pass - rather than the full product of the three, which would be some
 * hundreds of projections for a result that in testing never differed. Each lever reports what it is
 * worth ON ITS OWN, so a household can see which ones are dead ends for them: a residence band already
 * out of reach, or a nomination that cannot matter because death before 75 carries no income tax at all.
 */
const GIFT_SEARCH_FRACTIONS = [0, 0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1];

function optimizeInheritance(rawPlan, opts = {}) {
  const plan = normalizePlan(rawPlan);
  const inh = plan.inheritance || {};
  const bens = normalizeBeneficiaries(inh.beneficiaries);
  if (!bens.length) return null;                         // nothing to rank without an heir

  const onStep = typeof opts.onStep === 'function' ? opts.onStep : null;
  const baseCtx = buildContext(resolveMpaa(plan));
  const giftYear = baseCtx.baseYear + 1;
  const liquidToday = ['isa', 'other', 'cash'].reduce((t, cat) =>
    t + baseCtx.accounts.filter(a => a.cat === cat).reduce((u, a) => u + Math.max(0, num(a.balance, 0)), 0), 0);

  /*
   * One candidate: apply the variant to the plan, run the projection, price the estate at the chosen
   * death age. A variant that breaks a plan which otherwise survives is rejected outright rather than
   * ranked - the household has to live on this money first.
   */
  const gbp0 = (x) => '£' + Math.round(x).toLocaleString();
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
        gifts: variant.gift > 0
          ? [...(inh.gifts || []), { id: '__opt', amount: variant.gift, year: giftYear, desc: 'Gift' }]
          : inh.gifts,
        beneficiaries: variant.split
          ? bens.map((b, i) => ({ ...b, pensionSharePct: variant.split[i] }))
          : bens
      },
      config: { ...plan.config, harvestPersonalAllowance: variant.harvest,
        harvestCeiling: variant.ceiling || plan.config.harvestCeiling || 'pa' }
    };
    const ctx = buildContext(resolveMpaa(p));
    runs++;
    const r = estateForPlanAt(p, ctx, simulateDeterministic(ctx, 'expected'));
    return { ...variant, net: r.net, est: r.est, row: r.row, survived: r.survived, plan: p, ctx };
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
        transferredNrbPct: num(inh.transferredNrbPct, 0), transferredRnrbPct: num(inh.transferredRnrbPct, 0),
        qsrInheritedValue: num(inh.qsrInheritedValue, 0), qsrTaxPaid: num(inh.qsrTaxPaid, 0),
        qsrYearsBefore: num(inh.qsrYearsBefore, 99), activeServiceExempt: !!inh.activeServiceExempt,
        gifts: inh.gifts, beneficiaries: bens });
    if (!split || !split.changed || !(split.gain > 0)) return null;
    return evaluate({ ...c, split: split.pcts, splitShares: split.shares,
      label: joined(c.label === baseline.label ? baseline.label : c.label, splitLabel(split)) });
  };

  const baseline = evaluate({
    policy: plan.spending.decumulationPolicy, drawdown: plan.spending.drawdownStrategy,
    harvest: !!plan.config.harvestPersonalAllowance, ceiling: plan.config.harvestCeiling || 'pa',
    gift: 0, split: null, label: 'Your plan as it stands'
  });
  const viable = (c) => c.net > 0 && (c.survived || !baseline.survived);
  const bestOf = (list) => list.filter(viable).sort((a, b) => b.net - a.net)[0] || baseline;

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
  const giftAmounts = liquidToday > 1000 ? GIFT_SEARCH_FRACTIONS.map(fr => Math.round(liquidToday * fr)).filter(a => a > 0) : [];
  if (onStep) onStep({ label: 'Testing gifts', value: 0.35 });
  const soloGifts = giftAmounts.map(amt => evaluate({ ...baseline, gift: amt, split: null,
    label: joined(baseline.label, giftLabel(amt)) }));
  if (onStep) onStep({ label: 'Testing pension nominations', value: 0.5 });
  const soloSplit = withBestSplit(baseline);
  const soloNoms = soloSplit ? [soloSplit] : [];
  if (onStep) onStep({ label: 'Testing wrapper transfers', value: 0.6 });
  const soloRecycles = RECYCLES.map(r => evaluate({ ...baseline, gift: 0, split: null,
    recycle: r.entries, recycleKey: r.key.join('+'), label: joined(baseline.label, recycleLabel(r)) }));

  // ---- stacked: the best order, then the best gift on top of it, then the best nomination on top again
  if (onStep) onStep({ label: 'Combining the best of each', value: 0.75 });
  const gifts = giftAmounts.map(amt => evaluate({ ...bestOrder, gift: amt, split: null,
    label: joined(bestOrder.label, giftLabel(amt)) }));
  const bestGift = bestOf([bestOrder, ...gifts]);
  const recycles = RECYCLES.map(r => evaluate({ ...bestGift, recycle: r.entries, recycleKey: r.key.join('+'),
    label: joined(bestGift.label, recycleLabel(r)) }));
  const bestRecycle = bestOf([bestGift, ...recycles]);
  // the split goes last because it is free: it re-prices the estate the winner already reaches
  const stackedSplit = withBestSplit(bestRecycle);
  const noms = stackedSplit ? [stackedSplit] : [];
  const best = bestOf([bestRecycle, ...noms]);

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
  const rnrbFull = Math.max(0, num(plan.config.ihtRnrb, 175000)) * (1 + clamp(num(inh.transferredRnrbPct, 0), 0, 100) / 100);
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
  reasons.push(anyExempt
    ? { key: 'will', text: 'Who receives which asset does change the bill here, because one of your beneficiaries is exempt: anything left to a spouse or a charity passes free of inheritance tax, so moving shares towards them lowers the total and moves money away from everyone else. That is a decision about who you want to benefit, so it is not searched.' }
    : { key: 'will', text: 'Who receives which asset does not change the total. Inheritance tax is charged on the estate before it is divided, and all your beneficiaries are taxable, so giving one the house and another the ISA moves who gets what without changing what survives. Only the pension split moves the number, because that alone is taxed on whoever receives it.' });
  if (e.rnrb <= 0 && toClear > liquidToday) {
    reasons.push({ key: 'gift', text: `The residence allowance is fully withdrawn and out of reach: bringing any of it back needs the estate to fall ${gbp0(toClear)}, against ${gbp0(liquidToday)} outside your pension. A gift still reduces the estate, but not enough to restore the band.` });
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
    return { pct, ratePct: r.est.ratePct, toCharity: charity ? charity.net : 0,
      toFamily: r.net - (charity ? charity.net : 0), costToFamily: best.net - (r.net - (charity ? charity.net : 0)) };
  })();

  const spread = (() => {
    if (!(best.est.pension > 0) || deathAge < num(plan.config.pensionIncomeTaxFromAge, 75)) return null;
    const at = (yrs) => {
      const p = { ...best.plan, inheritance: { ...best.plan.inheritance,
        beneficiaries: normalizeBeneficiaries(best.plan.inheritance.beneficiaries).map(b => ({ ...b, spreadYears: yrs })) } };
      const ctx = buildContext(resolveMpaa(p));
      runs++;
      return estateForPlanAt(p, ctx, simulateDeterministic(ctx, 'expected')).net;
    };
    const slow = num(opts.slowSpreadYears, 20);
    return { years: slow, net: at(slow), gain: at(slow) - best.net };
  })();

  const ranked = [baseline, ...orders, ...ceilings, ...soloGifts, ...soloNoms, ...soloRecycles, ...gifts, ...noms, ...recycles]
    .filter(viable)
    .sort((a, b) => b.net - a.net)
    .filter((c, i, all) => i === 0 || Math.abs(c.net - all[i - 1].net) > 1)   // drop exact duplicates
    .slice(0, 8)
    .map(c => ({ label: c.label, net: c.net, iht: c.est.iht, incomeTax: c.est.incomeTaxOnPensions,
      qsrRelief: c.est.qsrRelief,
      policy: c.policy, drawdown: c.drawdown, harvest: c.harvest, ceiling: c.ceiling, gift: c.gift,
      split: c.split || null, recycleKey: c.recycleKey || null }));

  return {
    deathAge, runs, liquidToday, giftYear,
    baseline: { label: baseline.label, net: baseline.net, iht: baseline.est.iht,
      incomeTax: baseline.est.incomeTaxOnPensions, qsrRelief: baseline.est.qsrRelief, qsrPct: baseline.est.qsrPct },
    best: { label: best.label, net: best.net, iht: best.est.iht, incomeTax: best.est.incomeTaxOnPensions,
      policy: best.policy, drawdown: best.drawdown, harvest: best.harvest, ceiling: best.ceiling,
      gift: best.gift, split: best.split || null, splitShares: best.splitShares || null,
      recycle: best.recycle || null, recycleKey: best.recycleKey || null,
      recycleLabel: best.recycleKey ? (RECYCLES.find(r => r.key.join('+') === best.recycleKey) || {}).label : null },
    gain: best.net - baseline.net,
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
  penPA: 'pension income up to the tax-free personal allowance',
  penBasic: 'pension income up to the basic-rate limit',
  penAny: 'the pension, at whatever tax rate applies'
};
const phraseFor = (tok) => WRAPPER_PHRASE[tok] || tok;

function policyPlaybook(policyKey, P) {
  const pol = DECUMULATION_POLICIES[policyKey];
  if (!pol) return [];
  const list = (steps) => steps.map(phraseFor);
  const out = [];

  out.push({
    title: 'Each year, to cover your spending',
    body: `Take from ${list(pol.steps).join(', then ')}. Stop as soon as the year's spending is covered — everything further down the list is left untouched.`,
    detail: pol.steps.includes('penPA')
      ? `"Up to the personal allowance" means the first ${formatGBP(P.pa)} of pension income, which is taxed at 0%. "Up to the basic-rate limit" means up to ${formatGBP(P.higherRateStartsAt)} of total taxable income.`
      : 'This policy does not manage tax bands: each wrapper is emptied before the next is touched.'
  });

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
  const gbp = (x) => '£' + Math.round(x).toLocaleString();
  const b = result.best, base = result.baseline;
  const out = [];

  // 1. the withdrawal order, in the words of the policy itself rather than its name
  const orderChanged = b.policy !== plan?.spending?.decumulationPolicy
    || b.drawdown !== plan?.spending?.drawdownStrategy
    || !!b.harvest !== !!plan?.config?.harvestPersonalAllowance;
  if (orderChanged) {
    const play = policyPlaybook(b.policy, P);
    out.push({
      key: 'order',
      title: 'Change the order you draw money in',
      body: (play[0] ? play[0].body : `Follow the ${b.policy} order.`)
        + (b.drawdown === 'Full 25% Lump Sum'
          ? ' Take the tax-free lump sum in one go rather than a slice at a time with each withdrawal.'
          : ' Take the tax-free cash a slice at a time with each withdrawal, not in one lump.'),
      detail: 'Nothing to arrange with anyone: it is how you choose which account to sell from each year. Applying this writes it into the plan, and the Config tab explains the order in full.'
    });
  }

  // 2. the draw-down ceiling, which is a standing instruction rather than a one-off
  if ((b.ceiling || 'pa') !== (plan?.config?.harvestCeiling === 'basic' ? 'basic' : 'pa')) {
    out.push({
      key: 'ceiling',
      title: b.ceiling === 'basic'
        ? `Each year, draw pension income up to ${gbp(P.higherRateStartsAt)} even if you do not need it`
        : `Each year, draw pension income only up to ${gbp(P.pa)}`,
      body: b.ceiling === 'basic'
        ? `Take enough taxable pension income to reach ${gbp(P.higherRateStartsAt)} in total, pay the 20%, and put the net straight back into your ISA up to ${gbp(P.isaAllowance)} a year, then into your general investment account. You are not spending it - you are moving it.`
        : `Stop drawing once your taxable income reaches ${gbp(P.pa)}. Anything beyond that costs tax you do not need to pay.`,
      detail: b.ceiling === 'basic'
        ? `Worth doing because from ${num(c.pensionsInEstateFrom, 2027)} a pension left behind is taxed twice - by your estate at ${num(c.ihtRate, 40)}%, then by whoever inherits it at their own rate. Paying ${num(c.basicTaxRate, 20)}% now beats both. It stops being worth it if you die before ${num(c.pensionIncomeTaxFromAge, 75)}, when an inherited pension carries no income tax at all.`
        : 'Drawing further costs tax today for a benefit that only arrives if you die at 75 or over.'
    });
  }

  // 3. the transfers, with the figures and the years spelled out
  if (b.recycle && b.recycle.length) {
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
      key: 'recycle',
      title: `Move money between your own accounts, ${years.length > 1 ? `each year from ${years[0]} to ${years[years.length - 1]}` : `in ${years[0]}`}`,
      body: relief.length
        ? `Pay ${eachOwn} into your pension out of ${nameOf(own[0].transferredFrom)}. Your provider claims ${level ? gbp(relief[0].amount) + ' a year' : gbp(sum(relief))} back from HMRC on top, so ${gbp(sum(own) + sum(relief))} reaches the pension for ${gbp(sum(own))} of your own money.`
        : `Move ${eachOwn} from ${nameOf(own.length ? own[0].transferredFrom : CATEGORY_LABEL.other)} into ${nameOf(own.length ? own[0].category : CATEGORY_LABEL.isa)}.`,
      detail: relief.length
        ? `Basic-rate relief is added whether or not you paid tax, which is why this is worth doing at all. The amount is capped by your annual allowance - if you have already taken taxable pension income the limit is the ${gbp(P.mpaaLimit)} money purchase annual allowance, and the figure above already respects it.`
        : `Capped by the ${gbp(P.isaAllowance)} a year an ISA can take. Selling to do it can realise a capital gain, which the projection has already charged.`
    });
  }

  // 4. the nomination, which is a different form from a will and the one people forget
  if (b.split && b.splitShares) {
    const list = b.splitShares.filter(x => x.pct > 0).map(x => `${x.pct}% to ${x.name || 'that heir'}`).join(', ');
    const dropped = b.splitShares.filter(x => x.pct === 0).map(x => x.name || 'one heir');
    out.push({
      key: 'nomination',
      title: 'Change who your pension is nominated to',
      body: `Ask each pension provider for their beneficiary nomination form - it is often called an expression of wish - and set it to ${list}.`
        + (dropped.length ? ` That leaves nothing from the pension to ${dropped.join(' or ')}, who still take their share of everything else under your will.` : ''),
      detail: 'Your pension does not pass under your will and your will cannot override the form. This is the single most valuable change on the list, because an inherited pension is taxed at the rate of whoever receives it - and it is the one that costs nothing to make.'
    });
  }

  // 5. the gift
  if (b.gift > 0) {
    out.push({
      key: 'gift',
      title: `Give away ${gbp(b.gift)} in ${result.giftYear}`,
      body: `Make the gift and write down the date, the amount and who received it. Your executors will need all three.`,
      detail: `It leaves your plan that year, so it is money you no longer have to live on - check the survival rate afterwards. The ${gbp(num(c.ihtRnrbTaperFrom, 2000000))} residence-allowance test looks at what you owned at death, so this part works from the day you give it; the gift itself still needs seven years to leave your estate entirely.`
    });
  }

  // 6. keeping the paperwork consistent, which is the step that gets skipped
  if (b.split || b.gift > 0) {
    out.push({
      key: 'paperwork',
      title: 'Tell whoever holds your will',
      body: 'The nomination form and the gift record sit outside your will, and none of them is any use if nobody can find them. Keep a note with the will saying where each one is.',
      detail: 'This tool models the tax. It cannot draft a will, witness a signature, or tell you whether a gift is wise for reasons that have nothing to do with tax.'
    });
  }

  if (!out.length) {
    out.push({
      key: 'none',
      title: 'Nothing to change',
      body: `The search could not beat what you already have: ${gbp(base.net)} to your heirs.`,
      detail: 'That is a finding, not a failure. Some households are already holding the best allocation available to them.'
    });
  }
  return out;
}

// Namespace used by the UI (mirrors the modular engine.js exports)
const E = { num, clamp, isBlank, round250, estateActionPlan, bestPensionSplit, optimizeInheritance, estateForPlanAt, surplusIncome, suggestGift, normalizeGifts, inheritedPensionTax, balancedScore, pickBalanced, policyPlaybook, DEFAULT_DEPOSIT_ORDER, postTaxInheritanceFor, IHT_RELATIONSHIPS, normalizeBeneficiaries, estateAtDeath, estateForCouple, RATE_EPSILON_PTS, MONEY_EPSILON_REL, MONEY_EPSILON_FLOOR, MAX_SURVIVAL_SACRIFICE_PTS, normalizeTolerances, toleranceFor, applySurvivalGuard, PRIORITY_METRICS, PRIORITY_KEYS, DEFAULT_PRIORITIES, normalizePriorities, explainPick, AUTO_DEPOSIT, DEFAULT_COST_STEPS, HISTORICAL_DATA, HISTORICAL_FIRST_YEAR, HISTORICAL_LAST_YEAR, getHistoricalPoint, RISK_EQUITY_WEIGHTS, DEFAULT_RISK_PROFILES, DEFAULT_RISK_SOURCE, BAND_QUANTILES, CMA_PRESETS, applyCmaPreset, realFromNominal, luckyBand, quantileRate, quantileCurve, normalCdf, smoothSurvivalRate, OWNERS, OWNER_LABEL, CATEGORIES, CATEGORY_LABEL, accountId, DEFAULT_CONFIG, BLANK_PLAN, DECUMULATION_POLICIES, todayISO, calculateYearFraction, normalizePlan, taxParams, incomeTax, marginalRateAt, taxBreakpoints, TAX_REGION_LABELS, calculateUKNetIncome, nicFor, calculateUKTaxAndNIC, calculateMarginalRelief, netCostOfPensionContrib, grossUpNet, grossUpNetIncremental, grossPensionNeededForNet, mulberry32, gaussianPath, buildContext, spendTargetAtAge, freshState, stepYear, simulateDeterministic, simulateHistorical, FAIL_TOLERANCE, evaluateRows, runTrial, pathsForSeed, summarizeTrials, monteCarlo, optimizeSpend, annuityFactor, fvContribStream, bridgeRequirement, contribAtYear, salaryAtYear, relevantEarningsAtYear, mpaaAppliesAtYear, carryForwardAtYear, resolveMpaa, wrapperHeadroomAtYear, suggestOneOffDestination, INCOME_TYPES, incomeTypeOf, allocateBudget, applyAllocationToPlan, accumulationOutlay, solveEscalation, applyEscalationToPlan, diffStrategyPlans, resolveSearchPlayer, bridgeIsaAnnual, liquidRealRate, buildTournament, buildPolicyCandidates, pickBest };
export { HISTORICAL_DATA, RISK_EQUITY_WEIGHTS, getHistoricalPoint, DEFAULT_RISK_PROFILES, DEFAULT_RISK_SOURCE, BAND_QUANTILES, CMA_PRESETS, applyCmaPreset, realFromNominal, luckyBand, quantileRate, quantileCurve, normalCdf, smoothSurvivalRate, calculateUKTaxAndNIC, calculateMarginalRelief, grossUpNet, normalizePlan, buildContext, simulateDeterministic, simulateHistorical, monteCarlo, optimizeSpend, buildTournament, diffStrategyPlans, buildPolicyCandidates, pickBest, accumulationOutlay, solveEscalation, applyEscalationToPlan };


const STORAGE_KEY = 'rp_plan_full_v28';          // unchanged: old saved plans are migrated by normalizePlan
const SCENARIOS_STORAGE_KEY = 'rp_saved_scenarios_v3';
const THEME_STORAGE_KEY = 'rp_theme_v1';
const APP_VERSION = 'v3.4';
const MC_TRIALS = 5000;
const TOURNAMENT_TRIALS = 1500;
// Death ages the Inheritance tab always prices, chosen to straddle the age-75 boundary that decides
// whether an inherited pension is taxable on the beneficiary. Module scope so the memo stays stable.
const INHERITANCE_AGES = [70, 74, 80, 90];
const SEARCH_TRIALS = 400;

// Three themes: 'classic' (the original stock look, kept as an opt-in third option),
// 'light' (Riviera Ledger) and 'dark' (Control Room).
const SERIES_CONFIG = [
  { id: 'expected', label: 'Expected (Real)', colors: { classic: '#2563eb', light: '#2C5C8F', dark: '#3D74E8' }, strokeWidth: 3, dash: 'none', defaultActive: true },
  { id: 'nominal', label: 'Combined (Nominal)', colors: { classic: '#7c3aed', light: '#6D28D9', dark: '#8B7CF6' }, strokeWidth: 2, dash: '4,3', defaultActive: false },
  { id: 'pensions', label: 'Combined Pensions', colors: { classic: '#0284c7', light: '#0284C7', dark: '#4FC3F0' }, strokeWidth: 2, dash: 'none', defaultActive: true },
  { id: 'isas', label: 'Combined ISAs', colors: { classic: '#0d9488', light: '#0D9488', dark: '#3FDBC7' }, strokeWidth: 2, dash: 'none', defaultActive: true },
  { id: 'other', label: 'Combined Other', colors: { classic: '#d97706', light: '#B0631E', dark: '#E89A4A' }, strokeWidth: 1.5, dash: 'none', defaultActive: false },
  { id: 'cash', label: 'Combined Cash', colors: { classic: '#475569', light: '#5C6B72', dark: '#8A939B' }, strokeWidth: 1.5, dash: '3,3', defaultActive: false }
];

/*
 * The two range charts are deliberately different colours. They answer the same question by different
 * means and a reader flicking between them needs to see at a glance which one they are looking at, so
 * the rate-based chart is a cool blue and the Monte Carlo a warmer violet in every theme.
 */
const CHART_PALETTE = {
  classic: { gridMajor: '#f1f5f9', gridMinor: '#f8fafc', axisText: '#64748b', hoverCrosshair: '#94a3b8', sandboxDash: '#f59e0b', historicalLine: '#6366f1', trajectoryHoverFill: '#2563eb', historicalHoverFill: '#6366f1', hoverDotStroke: '#ffffff',
             fanBand: 'rgba(124, 58, 237, 0.16)', fanEdge: 'rgba(124, 58, 237, 0.5)', fanMedian: '#6d28d9', fanOuter: 'rgba(124, 58, 237, 0.75)',
             rateBand: 'rgba(13, 148, 136, 0.16)', rateEdge: 'rgba(13, 148, 136, 0.55)', rateOuter: 'rgba(13, 148, 136, 0.8)' },
  light:   { gridMajor: '#DCDFD2', gridMinor: '#E6E8DE', axisText: '#5C6B72', hoverCrosshair: '#8A9098', sandboxDash: '#B0631E', historicalLine: '#A9781F', trajectoryHoverFill: '#2C5C8F', historicalHoverFill: '#A9781F', hoverDotStroke: '#FBFAF4',
             fanBand: 'rgba(107, 74, 138, 0.18)', fanEdge: 'rgba(107, 74, 138, 0.55)', fanMedian: '#6B4A8A', fanOuter: 'rgba(107, 74, 138, 0.8)',
             rateBand: 'rgba(13, 116, 110, 0.16)', rateEdge: 'rgba(13, 116, 110, 0.6)', rateOuter: 'rgba(13, 116, 110, 0.85)' },
  dark:    { gridMajor: '#1e232b', gridMinor: '#171b21', axisText: '#8a939b', hoverCrosshair: '#5b636c', sandboxDash: '#e89a4a', historicalLine: '#8b7cf6', trajectoryHoverFill: '#3D74E8', historicalHoverFill: '#8b7cf6', hoverDotStroke: '#14171B',
             fanBand: 'rgba(192, 132, 252, 0.22)', fanEdge: 'rgba(192, 132, 252, 0.55)', fanMedian: '#C084FC', fanOuter: 'rgba(192, 132, 252, 0.8)',
             rateBand: 'rgba(63, 219, 199, 0.18)', rateEdge: 'rgba(63, 219, 199, 0.5)', rateOuter: 'rgba(63, 219, 199, 0.78)' },
};

/*
 * Colours for scenarios overlaid on the Projection chart. Deliberately clear of the six SERIES_CONFIG
 * hues and of the amber sandbox dash, since all of them can be on screen at once: the three series that
 * default to on are blue, sky and teal, so these are pink, olive, red and purple.
 */
const COMPARE_PALETTE = {
  classic: ['#db2777', '#65a30d', '#b91c1c', '#6b21a8'],
  light: ['#A63D5E', '#5F7A28', '#99342B', '#6B4A8A'],
  dark: ['#F472B6', '#A3D65C', '#F87171', '#C084FC'],
};
const MAX_COMPARE = 4;

const MARKER_PALETTE = {
  classic: {
    retireSelf: { line: '#f59e0b', fill: '#fef3c7', stroke: '#fde68a', text: '#b45309' },
    retirePart: { line: '#d97706', fill: '#fef3c7', stroke: '#fde68a', text: '#b45309' },
    nmpa: { line: '#0284c7', fill: '#e0f2fe', stroke: '#bae6fd', text: '#0369a1' },
    statePension: { line: '#059669', fill: '#d1fae5', stroke: '#a7f3d0', text: '#065f46' },
  },
  light: {
    retireSelf: { line: '#A9781F', fill: '#F3E9CE', stroke: '#D9C48A', text: '#6B4E12' },
    retirePart: { line: '#855D18', fill: '#F3E9CE', stroke: '#D9C48A', text: '#6B4E12' },
    nmpa: { line: '#2C5C8F', fill: '#DCE6EF', stroke: '#AFC2D6', text: '#1B3A57' },
    statePension: { line: '#2F7A4F', fill: '#DCEEE1', stroke: '#A9D3B8', text: '#1F5636' },
  },
  dark: {
    retireSelf: { line: '#D4A537', fill: '#2E2209', stroke: '#47350D', text: '#F5DFA9' },
    retirePart: { line: '#E2BC5E', fill: '#2E2209', stroke: '#47350D', text: '#F5DFA9' },
    nmpa: { line: '#3D74E8', fill: '#16233A', stroke: '#223756', text: '#B9D3FF' },
    statePension: { line: '#3FD68C', fill: '#0F2E20', stroke: '#17472F', text: '#A3EBC7' },
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

const fmtK = (v) => `£${Math.round((Number.isFinite(v) ? v : 0) / 1000).toLocaleString()}k`;
const parseInputNumber = (val) => {
  if (val === '' || val === null || val === undefined) return '';
  return String(val).replace(/^0+(?=\d)/, '');
};
const tick = () => new Promise(r => setTimeout(r, 0));
const clone = (o) => JSON.parse(JSON.stringify(o));
const safeStorageGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const safeStorageSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* quota / private mode */ } };
const safeStorageRemove = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

// Chunked Monte Carlo so the UI can repaint a progress bar between batches.
// `shouldStop` is checked between chunks, so a cancel lands within a chunk rather than at the end of the
// run. The partial result is still summarised and returned, because the caller discards it either way.
async function runMonteCarloAsync(ctx, { trials, seed, spendOverride = null, onProgress, shouldStop = null, collectPaths = false }) {
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

const inputCls = 'w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none';
const smallInputCls = 'w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none';

function ProgressBar({ value, label }) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>{label}</span><span>{Math.round(value * 100)}%</span></div>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

/*
 * Pencil-sketch motifs for the landing page. Drawn as open paths rather than primitives so the strokes
 * wobble, overshoot their corners and double back the way a pencil line does — an <ellipse> would read as
 * a diagram. They inherit `currentColor` so each theme tints them, and are decorative only (aria-hidden).
 */
function SketchCards({ className = '' }) {
  // Card faces are filled with the page surface so a fanned card hides the one behind it. The fade comes
  // from the caller's text colour (currentColor carries its own alpha), not from group opacity, which
  // would make the fills translucent and lose the occlusion.
  const face = 'rgb(var(--surface))';
  return (
    <svg viewBox="0 0 150 125" className={className} fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {/* back card, fanned left */}
      <g transform="rotate(-19 55 72)">
        <path fill={face} d="M27 32 Q48 29 70 28 Q73 29 73 33 L76 97 Q76 101 72 101 Q50 104 30 104 Q26 104 26 100 L24 36 Q24 32 27 32" />
        {/* diamond */}
        <path d="M43 51 L50 40 L57 52 L49 62 Z" strokeOpacity="0.8" />
      </g>
      {/* middle card */}
      <g transform="rotate(-5 76 68)">
        <path fill={face} d="M55 24 Q77 22 99 23 Q102 23 102 27 Q103 60 103 94 Q103 98 99 98 Q77 100 56 99 Q52 99 52 95 Q51 61 51 28 Q51 24 55 24" />
        {/* club: three lobes and a flared stem */}
        <path d="M77 40 q7 0 7 6 q0 5 -6 6 q7 -2 9 4 q2 6 -3 8 q-5 2 -7 -4 q-2 6 -7 4 q-5 -2 -3 -8 q2 -6 9 -4 q-6 -1 -6 -6 q0 -6 7 -6" />
        <path d="M77 64 q-1 5 -5 8 q5 -2 10 0 q-4 -3 -5 -8" />
      </g>
      {/* front card, fanned right, with a second searching stroke down its long edge */}
      <g transform="rotate(15 101 66)">
        <path fill={face} d="M84 19 Q106 20 127 23 Q131 24 130 28 Q128 60 125 93 Q124 97 120 96 Q99 94 79 93 Q75 92 76 88 Q79 55 81 23 Q81 19 84 19" />
        <path d="M86 21 Q105 22 125 25" strokeOpacity="0.35" />
        {/* spade */}
        <path d="M104 41 Q96 50 93 55 q-4 6 1 9 q5 3 9 -3 q4 6 9 3 q5 -3 1 -9 Q110 50 104 41" />
        <path d="M104 62 q-1 6 -5 9 q5 -2 10 0 q-4 -3 -5 -9" />
      </g>
    </svg>
  );
}
// True when the browser is set to reduce motion, so the decorative animations can sit still.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

function SketchRoulette({ className = '', spin = false }) {
  const still = usePrefersReducedMotion();
  const live = spin && !still;
  // The wheel is drawn in perspective, so the spokes are squashed about the centre (85, 56) and the
  // rotation happens inside that squash: turning first and flattening second is what a real wheel does.
  // The ball runs the other way round an ellipse of its own, the way it does before it drops.
  return (
    <svg viewBox="0 0 170 130" className={className} fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {/* outer rim: an open path that overshoots where it closes, so the line looks drawn round once */}
      <path d="M87 27 Q133 28 136 56 Q137 82 85 85 Q33 85 32 57 Q32 30 84 27 Q99 27 108 29" />
      {/* the depth of the bowl, and a lighter repeat of the near edge */}
      <path d="M32 58 Q34 74 85 76 Q136 75 136 57" opacity="0.55" />
      <path d="M35 61 Q40 74 85 77" opacity="0.3" />
      {/* inner track and hub */}
      <path d="M85 37 Q122 38 123 56 Q123 73 84 74 Q46 74 46 57 Q46 39 84 37" opacity="0.7" />
      <path d="M85 50 q13 0 13 6 q0 6 -13 6 q-13 0 -13 -6 q0 -6 13 -6" />
      {/* spokes, drawn unevenly, turning as one */}
      <g transform="translate(85 56) scale(1 0.487) translate(-85 -56)" strokeWidth="2.2">
        {live && <animateTransform attributeName="transform" type="rotate" additive="sum"
          from="0 85 56" to="360 85 56" dur="5.2s" repeatCount="indefinite" />}
        <path d="M98 56 L121 56 M85 69 L85 92 M72 56 L49 56 M85 43 L85 20" opacity="0.6" />
        <path d="M94.9 65.9 L109 80 M75.1 65.9 L61 80 M75.1 46.1 L61 32 M94.9 46.1 L109 32" opacity="0.35" />
      </g>
      {/* the ball, with a scuff of motion behind it */}
      <g transform={live ? undefined : 'translate(110 47)'}>
        {live && <animateMotion dur="2.3s" repeatCount="indefinite" rotate="auto"
          path="M130 56 A45 22 0 1 0 40 56 A45 22 0 1 0 130 56" />}
        <g>
          {live && <animateTransform attributeName="transform" type="translate" additive="sum"
            values="0 0; 0.8 -0.6; -0.5 0.9; 0.9 0.4; -0.4 -0.7; 0 0" dur="0.55s" repeatCount="indefinite" />}
          <path d="M0 -3.5 q4.6 -0.5 4.6 3.5 q0 4 -4.6 4 q-4.6 0 -4.6 -4 q0 -4 4.6 -3.5" />
          <path d="M-11 -2 q6 -2.5 11 -1.5" opacity="0.45" />
        </g>
      </g>
      {/* a corner of the betting layout, ruled by hand */}
      <g opacity="0.45" transform="translate(8 95)">
        <path d="M2 2 Q78 3 152 5" />
        <path d="M2 2 Q1 15 0 28 M40 3 L37 29 M78 4 L76 30 M115 4 L114 30 M152 5 L151 31" />
        <path d="M0 28 Q76 30 151 31" />
      </g>
    </svg>
  );
}

function WarningsBanner({ warnings }) {
  if (!warnings || !warnings.length) return null;
  return (
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
      <div className="flex items-center gap-2 font-bold"><AlertTriangle className="w-4 h-4 text-amber-600" /> Inputs the engine is substituting or flagging</div>
      <ul className="list-disc pl-5 space-y-0.5">
        {warnings.map((w, i) => <li key={i}>{w}</li>)}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------- Strategy tournament
const WRAPPER_WORD = { pen: 'pension', isa: 'S&S ISA', other: 'GIA', cash: 'cash' };
const joinClauses = (parts) => parts.length <= 1 ? (parts[0] || '') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
const sentenceCase = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

/*
 * Plain-English description of what a tournament strategy moves relative to the current plan.
 * Every strategy spends the same net budget, so the reconciliation clause matters: pension figures
 * are gross and ISA figures net, which is why the rise and the fall do not match pound for pound.
 */
function summarizeStrategyChange(res, baselinePlayer, { isCouple = false, meta = null, threshold = 50, selfEmployedOnly = false } = {}) {
  // the self-employed get income tax relief only, so calling it NIC relief would be wrong for them
  const reliefWord = selfEmployedOnly ? 'tax relief' : 'tax and NIC relief';
  if (!res) return [];
  if (res.id === 'baseline') return ['Your plan exactly as entered: the benchmark every other strategy is measured against.'];
  // A saved scenario can differ in spend, ages and balances as well as contributions, so a contribution
  // diff would describe only part of it. Name what actually differs, and lead with the budget.
  if (res.isEntrant) {
    const lines = [];
    const a = baselinePlayer?.planState, b = res.planState;
    if (res.entrantOutlay !== null && res.entrantOutlay !== undefined && res.baselineOutlay > 0) {
      const d = res.entrantOutlay - res.baselineOutlay;
      lines.push(Math.abs(d) < 50
        ? `Costs the same to fund as your current plan, about ${formatGBP(res.entrantOutlay)}/yr, so this is a like-for-like comparison.`
        : `Costs ${formatGBP(Math.abs(d))}/yr ${d > 0 ? 'more' : 'less'} to fund than your current plan (${formatGBP(res.entrantOutlay)}/yr against ${formatGBP(res.baselineOutlay)}/yr), so the survival rate is not like-for-like.`);
    }
    if (a && b) {
      const diffs = [];
      const dA = a.demographics, dB = b.demographics;
      if (E.num(dA.retireAgeSelf, 0) !== E.num(dB.retireAgeSelf, 0)) diffs.push(`retires at ${E.num(dB.retireAgeSelf, 0)} rather than ${E.num(dA.retireAgeSelf, 0)}`);
      if (E.num(a.spending.targetSpend, 0) !== E.num(b.spending.targetSpend, 0)) diffs.push(`spends ${formatGBP(E.num(b.spending.targetSpend, 0))}/yr rather than ${formatGBP(E.num(a.spending.targetSpend, 0))}`);
      if (E.num(dA.terminalAge, 0) !== E.num(dB.terminalAge, 0)) diffs.push(`runs to age ${E.num(dB.terminalAge, 0)} rather than ${E.num(dA.terminalAge, 0)}`);
      const balA = (a.accounts || []).reduce((t, x) => t + E.num(x.balance, 0), 0);
      const balB = (b.accounts || []).reduce((t, x) => t + E.num(x.balance, 0), 0);
      if (Math.abs(balB - balA) > 500) diffs.push(`starts with ${formatGBP(balB)} rather than ${formatGBP(balA)}`);
      if (diffs.length) lines.push(`It also ${diffs.join(', ')}.`);
    }
    return lines;
  }
  if (!res.planState || !baselinePlayer?.planState) return [];
  const diff = E.diffStrategyPlans(baselinePlayer.planState, res.planState, { threshold });
  const lines = [];
  const plural = (n) => n === 1 ? '' : 's';

  // one-off capital move (Bed & SIPP): its relief is bundled into taxReliefSaved, so it has to come
  // back out before the annual figure can be quoted as a per-year number
  const src = diff.balanceDeltas.find(d => d.delta < 0);
  const dest = diff.balanceDeltas.find(d => d.delta > 0 && d.cat !== 'cash');
  const refund = diff.balanceDeltas.find(d => d.cat === 'cash' && d.delta > 0);
  const oneOffRelief = (src && dest) ? (dest.delta - Math.abs(src.delta) + (refund ? refund.delta : 0)) : 0;

  const earlyYears = res.phase ? res.phase.yearsToFirstRetire - res.phase.switchYears : 0;
  if (res.phase && res.phase.switchYears > 0 && earlyYears > 0) {
    // contrib on the plan holds year-1 (early phase) only, so describe both phases explicitly
    lines.push(`Two phases: pension-max for ${earlyYears} year${plural(earlyYears)} (pension ${formatGBP(res.phase.early.penContrib)}/yr, S&S ISA ${formatGBP(res.phase.early.isaContrib)}/yr), then ISA-max for the final ${res.phase.switchYears} year${plural(res.phase.switchYears)} before retirement (S&S ISA ${formatGBP(res.phase.late.isaContrib)}/yr, pension ${formatGBP(res.phase.late.penContrib)}/yr).`);
  } else if (!diff.contribDeltas.length) {
    lines.push('Effectively the same contribution split as your current plan. Nothing material moves.');
  } else {
    const parts = [];
    let overflowed = false;
    ['pen', 'isa', 'other', 'cash'].forEach(cat => {
      const c = diff.byCat[cat];
      if (!c || Math.abs(c.contrib) < threshold) return;
      const word = WRAPPER_WORD[cat];
      // only one owner moving needs calling out; both moving is the unremarkable case
      const only = (isCouple && c.owners.length === 1) ? ` (${E.OWNER_LABEL[c.owners[0]] || ''} only)` : '';
      const amt = formatGBP(Math.abs(c.contrib));
      // money appearing in the GIA from nothing is budget spilling past full allowances, not a choice
      const fromNothing = diff.contribDeltas.filter(d => d.cat === cat).every(d => d.from < threshold);
      if (cat === 'other' && c.contrib > 0 && fromNothing) { parts.push(`${amt}/yr now overflows into your GIA${only}`); overflowed = true; }
      else parts.push(`your ${word} contributions ${c.contrib > 0 ? 'rise' : 'fall'} by ${amt}/yr${only}`);
    });
    const reliefDelta = E.num(res.taxReliefSaved, 0) - E.num(baselinePlayer.taxReliefSaved, 0) - oneOffRelief;
    // an overridden budget means the strategies do not cost what the current plan costs, so the
    // usual "same take-home cost" reconciliation would be a lie
    const overridden = meta && Math.abs(E.num(meta.netBudget, 0) - E.num(meta.derivedBudget, 0)) >= threshold;
    let tail = overridden ? `, on the ${formatGBP(meta.netBudget)}/yr take-home budget you set, against ${formatGBP(meta.derivedBudget)}/yr in your plan today` : ', the same take-home cost';
    if (reliefDelta >= threshold) tail += `, with ${formatGBP(reliefDelta)}/yr more ${reliefWord}`;
    else if (reliefDelta <= -threshold) tail += `, giving up ${formatGBP(Math.abs(reliefDelta))}/yr of ${reliefWord}`;
    lines.push(`${sentenceCase(joinClauses(parts))}${tail}.`);
    if (overflowed) lines.push('The GIA overflow is budget that no longer fits inside the ISA and pension allowances.');
  }

  // the tournament re-prices escalation to hold every player to the same total outlay; say so, or the
  // contribution figures look inconsistent with the escalation % still shown on the plan inputs
  const esc = res.escalation;
  if (esc && Math.abs(esc.before - esc.target) >= Math.max(500, esc.target * 0.01)) {
    const pct = esc.target > 0 ? Math.abs(esc.before - esc.target) / esc.target * 100 : 0;
    const dearer = esc.before > esc.target;
    lines.push(`Contribution escalation re-set to ${(esc.rate * 100).toFixed(2)}%/yr so the total you pay in over the accumulation years still comes to ${formatGBP(esc.after)}. Left on your own escalation this split would have ${dearer ? 'cost' : 'been'} ${formatGBP(esc.before)}, ${dearer ? 'paying in' : 'paying in'} ${pct.toFixed(0)}% ${dearer ? 'more' : 'less'} than your current plan.`);
  }

  // described separately from the annual figures because it is capital, not a yearly flow
  if (src && dest) {
    lines.push(`One-off: ${formatGBP(Math.abs(src.delta))} of existing ${WRAPPER_WORD[src.cat]} capital moves into the ${WRAPPER_WORD[dest.cat]}, becoming ${formatGBP(dest.delta)} after basic-rate relief${refund ? `, with ${formatGBP(refund.delta)} of higher-rate relief refunded to cash` : ''}.`);
  }
  return lines;
}

function WrapperStrategyTournament({ plan, ctx, seed, scenarios = [], activeScenarioId, state, setState, cancelRef, onApplyStrategyToSandbox, onApplyStrategyToPlan, onNavigateDocs }) {
  const P = ctx.P;
  const isCouple = ctx.isCouple;
  // Settings, results and run progress are owned by App so they outlive this component's unmount on a tab
  // switch; these accessors keep the rest of the component reading like ordinary local state.
  const { scope, emergencyFloor, budgetOverride, balance, entrantIds, results, progress, isEvaluating } = state;
  /*
   * Bridge risk follows the priority list rather than a control of its own. The hard cap now exists only
   * where the household has said bridge safety comes first - anywhere else it would be a constraint
   * contradicting a preference they stated, applied before the ranking and therefore winning silently.
   */
  const priorityList = E.normalizePriorities(plan?.spending?.priorities);
  const tolerances = E.normalizeTolerances(plan?.spending?.priorityTolerances);
  const preAccessCap = priorityList[0] === 'bridge' ? 0 : Infinity;
  const setField = (key) => (value) => setState(prev => ({ ...prev, [key]: value }));
  const setScope = setField('scope');
  const setEmergencyFloor = setField('emergencyFloor');
  const setBudgetOverride = setField('budgetOverride');
  const setBalance = setField('balance');
  const setResults = setField('results');
  const setProgress = setField('progress');
  const setIsEvaluating = setField('isEvaluating');
  const [confirmApplyId, setConfirmApplyId] = useState(null);
  // A sandbox run is scored against the frozen sandbox plan rather than the saved inputs.
  const selfEmployedOnly = ctx.owners.length > 0 && ctx.owners.every(o => o.selfEmployed);
  const usingSandbox = !!state.basePlan;
  const basePlan = state.basePlan || plan;

  // Any saved scenario other than the one currently loaded can be entered as an extra player. The loaded
  // one is already the baseline, so offering it again would only produce a duplicate of Current Plan.
  const availableEntrants = useMemo(
    () => scenarios.filter(s => s.id !== activeScenarioId),
    [scenarios, activeScenarioId]);
  const selectedEntrants = useMemo(
    () => availableEntrants.filter(s => (entrantIds || []).includes(s.id)),
    [availableEntrants, entrantIds]);
  const toggleEntrant = (id) => setState(prev => {
    const cur = prev.entrantIds || [];
    return { ...prev, entrantIds: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
  });

  const preview = useMemo(() => {
    const entrants = selectedEntrants.map(s => ({ id: s.id, name: s.name, plan: s.data }));
    try { return E.buildTournament(E.resolveMpaa(basePlan), { emergencyFloor: E.num(emergencyFloor, 0), scope, netBudgetOverride: budgetOverride === '' ? null : budgetOverride, balance, entrants }); }
    catch (e) { return null; }
  }, [basePlan, emergencyFloor, scope, budgetOverride, balance, selectedEntrants]);
  const meta = preview?.meta;
  const salaryMissing = ctx.owners.filter(o => o.salary <= 0).map(o => o.label);
  // balancing steers new money to the smaller pension, which throws away relief when that owner sits in
  // a lower band — measured at ~£45k of relief lost against ~£26k of retirement tax saved
  const reliefBandsDiffer = isCouple && ctx.owners.length > 1
    && E.marginalRateAt(ctx.owners[0].salary, P) !== E.marginalRateAt(ctx.owners[1].salary, P);

  const handleRun = async () => {
    if (!preview) return;
    setIsEvaluating(true); setResults(null); cancelRef.current = false;
    const total = preview.strategies.length;
    const out = [];
    try {
      for (let i = 0; i < total; i++) {
        let s = preview.strategies[i];
        // Any player that carries candidates is searched the same way, on the same paths, so the two
        // searching players are ranked against each other on equal terms.
        if (s.candidates) {
          setProgress({ label: `Player ${i + 1}/${total}: ${s.name}: searching…`, value: i / total });
          const evaluated = [];
          for (let k = 0; k < s.candidates.length; k++) {
            const c = s.candidates[k];
            const stats = E.monteCarlo(c.planState, { trials: SEARCH_TRIALS, seed });
            evaluated.push({ ...c, stats });
            setProgress({ label: `Player ${i + 1}/${total}: ${c.label} → ${stats.successRate.toFixed(1)}% safe`, value: (i + (k + 1) / s.candidates.length * 0.6) / total });
            await tick();
          }
          const best = E.pickBest(evaluated, { preAccessCap, priorities: priorityList, tolerances });
          const capNote = priorityList[0] === 'bridge' ? ' Bridge safety ranked first, so candidates risking a pre-access shortfall were ruled out.' : '';
          s = {
            ...s, chosenShare: best.share, chosenLabel: best.label,
            searchResults: evaluated.map(e => ({ label: e.label, successRate: e.stats.successRate, preAccess: e.stats.preNmpaFailRate, p10: e.stats.p10Terminal, median: e.stats.medianTerminal })),
            isaContrib: best.alloc.isaContrib, penContrib: best.alloc.penContrib, giaContrib: best.alloc.giaContrib,
            taxReliefSaved: best.alloc.taxReliefSaved + (best.reliefExtra || 0),
            transferNet: Math.round(best.transferNet || 0), transferGross: Math.round(best.transferGross || 0),
            planState: best.planState, escalation: best.escalation, phase: best.phase || null,
            description: (best.describe || s.description) + capNote
          };
        }
        setProgress({ label: `Player ${i + 1}/${total}: ${s.name}: ${TOURNAMENT_TRIALS.toLocaleString()} paths`, value: (i + 0.6) / total });
        await tick();
        const sctx = E.buildContext(s.planState);
        const stats = await runMonteCarloAsync(sctx, { trials: TOURNAMENT_TRIALS, seed, onProgress: (f) => setProgress({ label: `Player ${i + 1}/${total}: ${s.name}`, value: (i + 0.6 + 0.4 * f) / total }) });
        out.push({ ...s, stats });
        if (cancelRef.current) break;
      }
      // rank: success (within 0.5%), then p10, then median
      const best = out.length ? E.pickBest(out.map(o => ({ ...o, stats: o.stats }))) : null;
      setResults({ players: out, bestId: best ? best.id : null, meta, seed });
    } finally {
      setIsEvaluating(false); setProgress(null);
    }
  };

  // "Re-run on sandbox" arrives as a token rather than a direct call, because the click happens in the
  // sandbox panel which may be on another tab. Clearing the token first makes the run fire exactly once.
  useEffect(() => {
    if (!state.autoRun || !preview || isEvaluating) return;
    setState(prev => ({ ...prev, autoRun: 0 }));
    handleRun();
  }, [state.autoRun, preview]); // eslint-disable-line react-hooks/exhaustive-deps

  const se = results && results.players.length ? results.players[0].stats.standardError : 0;
  const baselinePlayer = results ? results.players.find(p => p.id === 'baseline') : null;

  // The updater closure runs during render, by which time React has cleared currentTarget, so the flag
  // has to be read out of the event first.
  const handleSettingsToggle = (e) => {
    const open = e.currentTarget.open;
    setState(prev => (prev.settingsOpen === open ? prev : { ...prev, settingsOpen: open }));
  };

  // What the collapsed settings header says. Defaults are named too, so the line always reads as a
  // statement of what will be run rather than a list of things you happen to have changed.
  const settingsSummary = [
    budgetOverride === '' ? null : `budget £${Math.round(E.num(budgetOverride, 0)).toLocaleString()}/yr`,
    scope === 'full' ? 'full reallocation' : 'contributions only',
    `£${Math.round(E.num(emergencyFloor, 0)).toLocaleString()} buffer`,
    preAccessCap === 'any' ? 'no bridge-risk cap' : `bridge risk ≤ ${preAccessCap}%`,
    isCouple && balance === 'balanced' ? 'pensions balanced' : null,
    selectedEntrants.length ? `${selectedEntrants.length} scenario${selectedEntrants.length === 1 ? '' : 's'} entered` : null
  ].filter(Boolean).join(' · ');

  return (
    <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600" /> Automated Strategy Tournament &amp; Optimizer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Six wrapper strategies with the same take-home budget, each tested on the same {TOURNAMENT_TRIALS.toLocaleString()} market paths (common random numbers) so differences are real, not noise.{selectedEntrants.length > 0 ? ` Plus ${selectedEntrants.length} saved scenario${selectedEntrants.length === 1 ? '' : 's'} entered as saved.` : ''}
          </p>
        </div>
        <button type="button" onClick={onNavigateDocs} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto">
          <HelpCircle className="w-3.5 h-3.5" /> Tournament methodology &amp; players &rarr;
        </button>
      </div>

      {usingSandbox && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs">
          <span className="text-amber-900 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-amber-600" /><strong className="font-bold">Scoring your sandbox figures</strong>, not your saved plan inputs. The sandbox is frozen as it was when you started this run.</span>
          <button type="button" onClick={() => setState(prev => ({ ...prev, basePlan: null, results: null }))}
            className="px-2.5 py-1 rounded-lg font-semibold bg-surface hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer">Back to plan inputs</button>
        </div>
      )}

      {/*
        * Five advanced controls that most plans leave alone, so they fold away. The summary line carries
        * anything set away from its default, which is what stops a collapsed panel hiding a live setting.
        */}
      <details open={!!state.settingsOpen} onToggle={handleSettingsToggle}
        className="bg-slate-50 border border-slate-200 rounded-xl">
        <summary className="px-3 py-2.5 cursor-pointer text-xs font-semibold text-slate-700 select-none flex flex-wrap items-baseline gap-x-2">
          <span>Tournament settings</span>
          <span className="text-[10px] font-normal text-slate-500 font-mono">{settingsSummary}</span>
        </summary>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-sans p-3">
        <div>
          <label className="text-slate-700 font-semibold block mb-1">Annual take-home budget (£ net)</label>
          <input type="number" min="0" step="250" value={budgetOverride} placeholder={meta ? `${Math.round(meta.derivedBudget).toLocaleString()} (from plan)` : ''} onChange={(e) => setBudgetOverride(e.target.value)}
            className="w-full p-2 bg-surface border border-slate-300 rounded-lg font-mono text-slate-900 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
          <span className="text-[10px] text-slate-500 block mt-1">Derived from current ISA + net cost of pension contributions{salaryMissing.length ? ` (salary missing for ${salaryMissing.join(', ')}: ${Math.round((selfEmployedOnly ? P.higherRate : P.higherRate + P.nicUpper) * 100)}% relief assumed)` : ''}.</span>
        </div>
        <div>
          <label className="text-slate-700 font-semibold block mb-1">Optimisation scope</label>
          <select id="tourn-scope" value={scope} onChange={(e) => setScope(e.target.value)} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer">
            <option value="contributions">Contributions only (rebalance future deposits)</option>
            <option value="full">Full reallocation (+ Bed &amp; SIPP transfer of spare ISA)</option>
          </select>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-slate-700 font-semibold">Protected emergency buffer</label>
            <span className="font-mono font-bold text-indigo-700">£{Math.round(E.num(emergencyFloor, 0)).toLocaleString()}</span>
          </div>
          <input type="range" min="0" max="100000" step="2500" value={E.num(emergencyFloor, 0)} onChange={(e) => setEmergencyFloor(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer mt-2" />
          <span className="text-[10px] text-slate-500 block mt-1">Savings ring-fenced from the bridge and from any Bed &amp; SIPP transfer; it shrinks what counts as available, rather than raising the target (that is the bridge safety margin in Config).</span>
        </div>
        {/*
          * The bridge-risk cap used to be a selector here, which made it a second control for a concern
          * the priority list already covers - and a contradictory one, because the cap is a hard filter
          * applied BEFORE the ranking. Someone could rank "getting safely to pension age" last and still
          * have a 5% cap silently overruling them. It now follows the prioritisation, and the hard
          * constraint lives once, in the advanced thresholds, where it is visible alongside the others.
          */}
        <div>
          <label className="text-slate-700 font-semibold block mb-1">Bridge risk</label>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
            Follows your priority list: <strong>&ldquo;{E.PRIORITY_METRICS.bridge.label}&rdquo;</strong> is currently ranked <strong>{priorityList.indexOf('bridge') + 1} of {priorityList.length}</strong>.
            {priorityList[0] === 'bridge'
              ? ' Ranked first, so a candidate that risks running dry before pension age is ruled out ahead of everything else.'
              : ` Move it up the list in Config to weigh the risk of running dry before age ${ctx.nmpa} more heavily.`}
          </div>
        </div>
        <div>
          <label className="text-slate-700 font-semibold block mb-1">Owner split of new money</label>
          <select value={balance} disabled={!isCouple} onChange={(e) => setBalance(e.target.value)} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50">
            <option value="proportional">Keep current Myself/Partner ratio</option>
            <option value="balanced">Balance pensions between partners</option>
          </select>
          {isCouple && (
            reliefBandsDiffer
              ? <span className="text-[10px] text-amber-700 mt-1 block">One of you gets relief at the higher rate and the other at the basic rate. Balancing steers money to the lower rate, and the relief given up each year usually outweighs the retirement tax it saves. Expect it to score worse here.</span>
              : <span className="text-[10px] text-slate-500 mt-1 block">Balancing puts both personal allowances to work in retirement. It pays when you both get relief at the same rate; it costs you when one of you is a higher-rate taxpayer and the other is not.</span>
          )}
        </div>
      </div>

      {availableEntrants.length > 0 && (
        <div className="px-3 pb-3 text-xs font-sans space-y-2">
          <div>
            <label className="text-slate-700 font-semibold block">Enter saved scenarios as extra players</label>
            <span className="text-[10px] text-slate-500 block mt-0.5">Each runs exactly as saved, on the same market paths. It is not held to the same take-home budget as the five strategies, so a scenario that simply contributes more will score better for that reason alone. The outlay is shown on its card.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableEntrants.map(s => {
              const on = (entrantIds || []).includes(s.id);
              return (
                <button key={s.id} type="button" onClick={() => toggleEntrant(s.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${on ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-surface text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
                  {on ? '✓ ' : '+ '}{s.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono px-3 pb-3">
          <div className="p-2.5 bg-surface border border-slate-200 rounded-xl"><span className="text-slate-500 font-sans block">Net budget tested</span><strong>£{Math.round(meta.netBudget).toLocaleString()}/yr</strong></div>
          <div className="p-2.5 bg-surface border border-slate-200 rounded-xl"><span className="text-slate-500 font-sans block">Pre-SIPP access gap</span><strong>{meta.bridge.gapYears} yr{meta.bridge.gapYears === 1 ? '' : 's'}</strong></div>
          <div className="p-2.5 bg-surface border border-slate-200 rounded-xl"><span className="text-slate-500 font-sans block">Bridge reserve target (+{Math.round(E.num(plan?.config?.bridgeSafetyMargin, 30))}%)</span><strong>{fmtK(meta.bridgeCapital)}</strong></div>
          <div className="p-2.5 bg-surface border border-slate-200 rounded-xl"><span className="text-slate-500 font-sans block">Liquid today above buffer</span><strong>{fmtK(Math.max(0, meta.liquidToday - E.num(emergencyFloor, 0)))}</strong></div>
        </div>
      )}
      </details>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        {progress ? <div className="flex-1"><ProgressBar value={progress.value} label={progress.label} /></div> : <span className="text-[11px] text-slate-400">Seed {seed}. Change it in Config to test a different set of market paths.</span>}
        <button type="button" onClick={handleRun} disabled={isEvaluating || !preview || (meta && meta.netBudget <= 0)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <Zap className="w-3.5 h-3.5" />
          {isEvaluating ? 'Evaluating…' : results ? 'Compare again' : 'Compare strategies now'}
        </button>
      </div>
      {meta && meta.netBudget <= 0 && <p className="text-xs text-rose-600">Enter ISA or pension contributions (or a take-home budget above) to run the tournament.</p>}

      {results && (
        <div className="space-y-3 pt-2">
          <div className="text-[11px] text-slate-500">
            Ranked by survival (ties within 0.5% broken by the 10th-percentile pot). Sampling error at these sample sizes is about ±{(1.96 * se).toFixed(1)} points per player; because every player sees the same paths, <em>differences</em> between players are more reliable than that.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.players.map((res) => {
              const isBest = res.id === results.bestId;
              const st = res.stats;
              const summaryLines = summarizeStrategyChange(res, baselinePlayer, { isCouple, meta: results.meta, selfEmployedOnly });
              return (
                <div key={res.id} className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${isBest ? 'bg-emerald-50/60 border-emerald-300 shadow-sm' : res.id === 'baseline' ? 'bg-slate-50 border-slate-200' : res.isEntrant ? 'bg-surface border-amber-200 shadow-xs' : 'bg-surface border-indigo-100 shadow-xs'}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1">{isBest && <Trophy className="w-3.5 h-3.5 text-emerald-600" />}{res.name}{res.isEntrant && <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider">Saved scenario</span>}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${st.successRate >= 90 ? 'bg-emerald-100 text-emerald-800' : st.successRate >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{st.successRate.toFixed(1)}% survive</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal">{res.description}</p>
                    {summaryLines.length > 0 && (
                      <div className="border-l-2 border-indigo-300 pl-2.5 space-y-1">
                        {summaryLines.map((line, i) => <p key={i} className="text-[11px] leading-snug text-slate-700">{line}</p>)}
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between"><span className="text-slate-500">S&amp;S ISA:</span><strong className="text-teal-700">£{Math.round(res.isaContrib || 0).toLocaleString()}/yr{res.phase && res.phase.switchYears > 0 ? ' avg' : ''}</strong></div>
                      <div className="flex justify-between"><span className="text-slate-500">Pension:</span><strong className="text-blue-700">£{Math.round(res.penContrib || 0).toLocaleString()}/yr{res.phase && res.phase.switchYears > 0 ? ' avg' : ''}</strong></div>
                      {res.giaContrib > 0 && <div className="flex justify-between"><span className="text-slate-500">GIA overflow:</span><strong className="text-amber-700">£{Math.round(res.giaContrib).toLocaleString()}/yr</strong></div>}
                      {res.taxReliefSaved > 0 && <div className="flex justify-between text-emerald-700 font-bold"><span className="font-sans">{selfEmployedOnly ? 'Tax relief:' : 'Tax & NIC relief:'}</span><span>+£{Math.round(res.taxReliefSaved).toLocaleString()}/yr</span></div>}
                      {res.transferNet > 0 && <div className="flex justify-between text-indigo-700 font-bold"><span>Bed &amp; SIPP:</span><span>£{Math.round(res.transferNet).toLocaleString()} &rarr; £{Math.round(res.transferGross).toLocaleString()}</span></div>}
                      {res.phase && res.phase.switchYears > 0 && <div className="flex justify-between text-slate-600"><span className="font-sans">Phasing:</span><span>pension-max {res.phase.yearsToFirstRetire - res.phase.switchYears}y → ISA-max {res.phase.switchYears}y</span></div>}
                      {res.isEntrant && res.entrantOutlay !== null && res.entrantOutlay !== undefined && (
                        <div className="flex justify-between"><span className="text-slate-500 font-sans">Yearly outlay:</span><strong className={Math.abs(res.entrantOutlay - res.baselineOutlay) < 50 ? 'text-slate-700' : 'text-amber-700'}>£{Math.round(res.entrantOutlay).toLocaleString()}/yr vs £{Math.round(res.baselineOutlay).toLocaleString()}</strong></div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-100"><span className="text-slate-500 font-sans">Median pot @ {ctx.terminalAge}:</span><span className="font-bold text-slate-800">{fmtK(st.medianTerminal)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">10th %ile pot:</span><span className="font-bold text-slate-800">{fmtK(st.p10Terminal)}</span></div>
                      {ctx.pensionDeathTaxRate > 0 && <div className="flex justify-between"><span className="text-slate-500 font-sans">Median pot net of pension death tax:</span><span className="font-bold text-slate-800">{fmtK(st.medianTerminalNet)}</span></div>}
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Median failure age:</span><span className={`font-bold ${st.preNmpaFailRate > 5 ? 'text-rose-600' : 'text-slate-700'}`}>{st.medianFailAge ? `Age ${st.medianFailAge}` : 'None'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500 font-sans">Pre-SIPP access (bridge) failures:</span><span className={`font-bold ${st.preNmpaFailRate > 5 ? 'text-rose-600' : 'text-slate-700'}`}>{st.preNmpaFailRate.toFixed(1)}%</span></div>
                    </div>
                    {res.searchResults && (
                      <details className="text-[10px] text-slate-500">
                        <summary className="cursor-pointer font-semibold">Search results by {(res.searchAxis || 'candidate').toLowerCase()}</summary>
                        <div className="grid grid-cols-4 gap-x-2 mt-1 font-mono">
                          {res.searchResults.map(r => <React.Fragment key={r.label}><span className={r.label === res.chosenLabel ? 'font-bold text-slate-800' : ''}>{r.label}</span><span>{r.successRate.toFixed(1)}%</span><span>{r.preAccess.toFixed(1)}% pre</span><span>{fmtK(r.p10)}</span></React.Fragment>)}
                        </div>
                      </details>
                    )}
                  </div>
                  {res.isEntrant ? (
                    <p className="text-[10px] text-slate-500 leading-snug">A scenario differs in more than its contributions, so there is nothing here to copy across. Load it from the scenario selector at the top of the page to work on it.</p>
                  ) : res.id !== 'baseline' && (
                    <div className="space-y-1.5">
                      <button type="button" onClick={() => onApplyStrategyToSandbox(res)} className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer">Apply to Sandbox</button>
                      {/* overwriting entered inputs is destructive, so it takes a second deliberate click */}
                      <button type="button"
                        onClick={() => { if (confirmApplyId === res.id) { onApplyStrategyToPlan(res); setConfirmApplyId(null); } else setConfirmApplyId(res.id); }}
                        onBlur={() => setConfirmApplyId(null)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${confirmApplyId === res.id ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}>
                        {confirmApplyId === res.id ? 'Confirm: overwrite Plan Inputs?' : 'Apply to Plan Inputs'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  // a returning visitor already knows the layout, so only a first visit (no saved plan) opens on the guide
  const [activeTab, setActiveTab] = useState(() => (safeStorageGet(STORAGE_KEY) ? 'inputs' : 'home'));
  const [isEditingRisk, setIsEditingRisk] = useState(false);
  const [selectedHistoricalYear, setSelectedHistoricalYear] = useState(1965);
  const [mcSeed, setMcSeed] = useState(12345);

  // Theme: 'classic' (original stock look, the default), 'light' (Riviera Ledger), 'dark' (Control Room).
  const [theme, setTheme] = useState(() => {
    const saved = safeStorageGet(THEME_STORAGE_KEY);
    if (saved === 'classic' || saved === 'light' || saved === 'dark') return saved;
    return 'classic';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeStorageSet(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const [plan, setPlan] = useState(() => E.normalizePlan(safeStorageGet(STORAGE_KEY) ? (() => { try { return JSON.parse(safeStorageGet(STORAGE_KEY)); } catch (e) { return null; } })() : null));

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

  // Sandbox overrides: { [accountId]: { contrib, growth, balance?, contribByYear? } }
  const sandboxFromPlan = (p) => {
    const init = {};
    (p?.accounts || []).forEach(a => { init[a.id] = { contrib: E.num(a.contrib, 0), growth: E.num(a.growth, 0), balance: E.num(a.balance, 0) }; });
    return init;
  };
  // Retirement-age overrides mirror the engine's blank-input fallback so the sandbox starts on the modelled age.
  const sandboxRetireFromPlan = (p) => ({
    self: E.clamp(E.num(p?.demographics?.retireAgeSelf, 60), 0, 120),
    part: E.clamp(E.num(p?.demographics?.retireAgePart, 60), 0, 120)
  });
  const [sandboxCustomized, setSandboxCustomized] = useState(false);
  const [sandboxAccounts, setSandboxAccounts] = useState(() => sandboxFromPlan(plan));
  const [sandboxRetire, setSandboxRetire] = useState(() => sandboxRetireFromPlan(plan));
  useEffect(() => { if (!sandboxCustomized) setSandboxAccounts(sandboxFromPlan(plan)); }, [plan?.accounts, sandboxCustomized]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!sandboxCustomized) setSandboxRetire(sandboxRetireFromPlan(plan)); }, [plan?.demographics?.retireAgeSelf, plan?.demographics?.retireAgePart, sandboxCustomized]); // eslint-disable-line react-hooks/exhaustive-deps

  // The tournament lives inside the Strategy tab, which unmounts on every tab switch. Its settings and
  // results are held here instead so a run that took a minute to produce survives a trip to another tab —
  // and so a run left in flight can still land its results when the user navigates away mid-evaluation.
  // `basePlan` holds a frozen copy of the sandbox when the user scores the tournament against it rather than
  // the saved plan inputs; `autoRun` is a token the component watches to start that run on arrival.
  const [tournament, setTournament] = useState({
    scope: 'contributions', emergencyFloor: 25000, budgetOverride: '', balance: 'proportional',
    entrantIds: [], results: null, progress: null, isEvaluating: false, basePlan: null, autoRun: 0
  });
  const tournamentCancelRef = useRef(false);
  // Which saved scenarios are overlaid on the Projection chart. Held here, like the tournament's state,
  // so a selection survives a trip to another tab.
  const [compareIds, setCompareIds] = useState([]);
  const [compareSort, setCompareSort] = useState({ key: null, dir: 'desc' });
  // One sandbox, on the Projection tab, beneath the chart it edits.
  const [sandboxOpen, setSandboxOpen] = useState(true);

  useEffect(() => { safeStorageSet(STORAGE_KEY, JSON.stringify(plan)); }, [plan]);
  useEffect(() => { safeStorageSet(SCENARIOS_STORAGE_KEY, JSON.stringify(scenarios)); }, [scenarios]);

  const fileInputRef = useRef(null);
  const isCouple = plan?.demographics?.planningMode !== 'single';

  // ------------------------------------------------------------ engine context & projections
  // MPAA is derived from the projection, so resolve it once and let everything downstream read the result
  const resolvedPlan = useMemo(() => E.resolveMpaa(plan), [plan]);
  const ctx = useMemo(() => E.buildContext(resolvedPlan), [resolvedPlan]);
  const P = ctx.P;
  const terminalAge = ctx.terminalAge;
  const currentAge = ctx.ageSelf0;
  const nmpa = ctx.nmpa;

  const spanYears = ctx.totalYears;
  const maxHistoricalStartYear = useMemo(() => Math.max(E.HISTORICAL_FIRST_YEAR, E.HISTORICAL_LAST_YEAR - spanYears), [spanYears]);
  const activeHistoricalStartYear = useMemo(() => Math.min(Math.max(E.HISTORICAL_FIRST_YEAR, selectedHistoricalYear), maxHistoricalStartYear), [selectedHistoricalYear, maxHistoricalStartYear]);

  const [activeSeries, setActiveSeries] = useState(() => { const init = {}; SERIES_CONFIG.forEach(s => { init[s.id] = s.defaultActive; }); return init; });
  const [maxVisibleAge, setMaxVisibleAge] = useState(null);
  const effectiveMaxVisibleAge = maxVisibleAge === null ? terminalAge : Math.min(Math.max(currentAge + 1, maxVisibleAge), terminalAge);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredHistPoint, setHoveredHistPoint] = useState(null);

  const [targetSurvivalRate, setTargetSurvivalRate] = useState(90);
  // One run, three stages. `simResult` is always the plan exactly as entered; `safeMaxResult` is the
  // solve, which describes a different spend and so cannot share the same card. Keeping them apart is
  // what stops the metric tiles quietly changing meaning depending on which button was pressed last.
  const [simResult, setSimResult] = useState(null);
  const [safeMaxResult, setSafeMaxResult] = useState(null);

  /*
   * The results are a five-step walk rather than one long page: topline, safe spend, the rate-based
   * chart, the Monte Carlo, then the two side by side. Five screens of one idea each beats one screen of
   * five, and the two charts in particular only mean anything read against each other, which is far
   * easier when they occupy the same space one after the other than when they are stacked a scroll apart.
   *
   * `seeAll` cascades the lot for anyone who would rather scroll, and is what a re-run lands on: having
   * already walked it once, the second pass is a comparison, not a tour.
   */
  const PROJECTION_SLIDES = [
    { n: 1, key: 'topline', name: 'Topline' },
    { n: 2, key: 'safespend', name: 'Safe spend' },
    { n: 3, key: 'ratechart', name: 'Rate based' },
    { n: 4, key: 'mcchart', name: 'Monte Carlo' },
    { n: 5, key: 'compare', name: 'Side by side' }
  ];
  const [slide, setSlide] = useState(1);
  const [seeAll, setSeeAll] = useState(false);
  const [sandboxRevealed, setSandboxRevealed] = useState(false);
  const showSlide = (n) => seeAll || slide === n;

  /*
   * Bring what you just asked for into view.
   *
   * Both controls sit at the FOOT of a card, so without this the click appears to do nothing: pressing
   * Next leaves you looking at the bottom of the next step, and "Change something" reveals a sandbox that
   * lands below the fold with the page still at the same scroll position. Measured before this existed:
   * the button at y=853 in a 900px viewport, the sandbox arriving at y=893, scrollY unchanged at 0.
   */
  const slideRef = useRef(null);
  const sandboxRef = useRef(null);
  const scrollTo = (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEffect(() => { if (!seeAll) scrollTo(slideRef.current); }, [slide, seeAll]);
  useEffect(() => { if (sandboxRevealed) scrollTo(sandboxRef.current); }, [sandboxRevealed]);
  const [simProgress, setSimProgress] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const mcCancelRef = useRef(false);
  const [policyResults, setPolicyResults] = useState(null);
  const [policyProgress, setPolicyProgress] = useState(null);
  const [isPolicySearching, setIsPolicySearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [expandedOneOff, setExpandedOneOff] = useState(() => new Set());
  const toggleOneOffExpand = (id) => setExpandedOneOff(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const handleFocus = (e) => e.target.select();
  const activeRiskMatrix = plan?.riskProfiles || E.DEFAULT_RISK_PROFILES;
  const scrollToDocSection = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };
  const goToDoc = (id) => { setActiveTab('docs'); setTimeout(() => scrollToDocSection(id), 80); };

  const timelineData = useMemo(() => {
    const exp = E.simulateDeterministic(ctx, 'expected');
    return exp.map(r => ({ ...r, nominal: r.totalCombined * Math.pow(1 + ctx.inflation, r.t) }));
  }, [ctx]);
  const deterministicVerdict = useMemo(() => E.evaluateRows(ctx, timelineData), [ctx, timelineData]);


  // resolved separately: changing retirement ages here moves when pension income starts, and so the trigger
  const sandboxPlan = useMemo(() => E.resolveMpaa({
    ...plan,
    demographics: { ...plan?.demographics, retireAgeSelf: sandboxRetire.self, retireAgePart: sandboxRetire.part },
    accounts: (plan?.accounts || []).map(acc => {
      const sb = sandboxAccounts[acc.id];
      if (!sb) return acc;
      const out = { ...acc, contrib: sb.contrib, growth: sb.growth };
      if (sb.balance !== undefined) out.balance = sb.balance;
      if (sb.contribByYear) out.contribByYear = sb.contribByYear; else delete out.contribByYear;
      return out;
    })
  }), [plan, sandboxAccounts, sandboxRetire]);
  const sandboxCtx = useMemo(() => E.buildContext(sandboxPlan), [sandboxPlan]);
  const isRetireModified = useMemo(() => {
    const base = sandboxRetireFromPlan(plan);
    return base.self !== sandboxRetire.self || (isCouple && base.part !== sandboxRetire.part);
  }, [plan?.demographics?.retireAgeSelf, plan?.demographics?.retireAgePart, sandboxRetire, isCouple]); // eslint-disable-line react-hooks/exhaustive-deps
  const isSandboxModified = useMemo(() => isRetireModified || (plan?.accounts || []).some(acc => {
    const sb = sandboxAccounts[acc.id];
    if (!sb) return false;
    return E.num(acc.contrib, 0) !== E.num(sb.contrib, 0) || E.num(acc.growth, 0) !== E.num(sb.growth, 0) || (sb.balance !== undefined && E.num(acc.balance, 0) !== E.num(sb.balance, 0)) || !!sb.contribByYear;
  }), [plan?.accounts, sandboxAccounts, isRetireModified]);
  const sandboxTimeline = useMemo(() => E.simulateDeterministic(sandboxCtx, 'expected'), [sandboxCtx]);

  /*
   * Saved scenarios overlaid on the Projection chart, projected the same way the live plan is.
   *
   * The dependency list is the point: a scenario's `data` only changes when it is saved, so these runs
   * are not repeated on every keystroke the way timelineData is. buildContext throws on a plan that is
   * missing required inputs, so each is guarded individually — a half-finished saved scenario reports
   * itself in the table rather than blanking the tab.
   */
  const selectedCompare = useMemo(
    () => scenarios.filter(s => s.id !== activeScenarioId && compareIds.includes(s.id)).slice(0, MAX_COMPARE),
    [scenarios, activeScenarioId, compareIds]
  );
  const compareRuns = useMemo(() => selectedCompare.map((s, i) => {
    const tone = COMPARE_PALETTE[theme][i % COMPARE_PALETTE[theme].length];
    try {
      const sctx = E.buildContext(s.data);
      const rows = E.simulateDeterministic(sctx, 'expected');
      if (!rows.length) return { id: s.id, name: s.name, tone, error: 'produced no projection' };
      const retAge = sctx.owners[0].retireAge;
      return {
        id: s.id, name: s.name, tone, rows,
        retireAge: retAge,
        startAge: rows[0].ageSelf,
        years: sctx.totalYears,
        retirePot: (rows.find(r => r.ageSelf === retAge) || rows[0]).totalCombined,
        verdict: E.evaluateRows(sctx, rows)
      };
    } catch (err) {
      return { id: s.id, name: s.name, tone, error: err?.message || 'cannot be projected' };
    }
  }), [selectedCompare, theme]);

  /*
   * The comparison table's rows, current plan first. Both sides are measured identically — terminalPot
   * and lifetimeTax come from evaluateRows either way — so a difference in the table is a difference in
   * the plans rather than in how they were read. The retirement pot is taken at each scenario's *own*
   * retirement age, since comparing "retire at 55" against "retire at 60" at a single age would answer
   * a question nobody asked.
   */
  const compareRows = useMemo(() => {
    const baseRetAge = ctx.owners[0].retireAge;
    const baseTerminal = deterministicVerdict.terminalPot;
    const rows = [{
      id: '__current__', name: 'Current plan', isBase: true, tone: SERIES_CONFIG[0].colors[theme],
      retireAge: baseRetAge, retirePot: (timelineData.find(r => r.ageSelf === baseRetAge) || timelineData[0])?.totalCombined || 0,
      terminal: baseTerminal, delta: null, lifetimeTax: deterministicVerdict.lifetimeTax,
      survived: deterministicVerdict.survived, failAge: deterministicVerdict.failAge, failReason: deterministicVerdict.failReason,
      years: ctx.totalYears, startAge: currentAge
    }];
    compareRuns.forEach(r => rows.push(r.error
      ? { id: r.id, name: r.name, tone: r.tone, error: r.error }
      : {
        id: r.id, name: r.name, tone: r.tone, retireAge: r.retireAge, retirePot: r.retirePot,
        terminal: r.verdict.terminalPot, delta: r.verdict.terminalPot - baseTerminal, lifetimeTax: r.verdict.lifetimeTax,
        survived: r.verdict.survived, failAge: r.verdict.failAge, failReason: r.verdict.failReason,
        years: r.years, startAge: r.startAge
      }));
    return rows;
  }, [ctx, theme, timelineData, deterministicVerdict, compareRuns, currentAge]);

  // Sorted for display, with the current plan pinned to the top: it is the thing everything else is a
  // delta against, so sorting it into the middle of the table would make the deltas hard to read.
  const sortedCompareRows = useMemo(() => {
    if (!compareSort.key) return compareRows;
    const [base, ...rest] = compareRows;
    const val = (r) => (r.error ? -Infinity : (r[compareSort.key] ?? -Infinity));
    rest.sort((a, b) => (compareSort.dir === 'asc' ? val(a) - val(b) : val(b) - val(a)));
    return [base, ...rest];
  }, [compareRows, compareSort]);

  const sandboxMetrics = useMemo(() => {
    if (!timelineData.length || !sandboxTimeline.length) return null;
    const baseTerminal = timelineData[timelineData.length - 1]?.totalCombined || 0;
    const sbTerminal = sandboxTimeline[sandboxTimeline.length - 1]?.totalCombined || 0;
    // Each scenario is measured at its own retirement age: retiring later means a longer accumulation run.
    const baseRetAge = ctx.owners[0].retireAge;
    const sbRetAge = sandboxCtx.owners[0].retireAge;
    const baseRetRow = timelineData.find(r => r.ageSelf === baseRetAge) || timelineData[0];
    const sbRetRow = sandboxTimeline.find(r => r.ageSelf === sbRetAge) || sandboxTimeline[0];
    // Contributions stop at each owner's own retirement age, so total them per owner rather than off a single age.
    const totalPlannedContribs = (c) => c.accounts.reduce((sum, a) => {
      const o = c.owners.find(x => x.key === a.owner);
      if (!o) return sum;
      const yrs = Math.max(0, Math.round(o.retireAge - o.age0));
      let acct = 0;
      for (let t = 0; t < yrs; t++) acct += E.contribAtYear(a, t);
      return sum + acct;
    }, 0);
    const cumulativeExtraCapital = totalPlannedContribs(sandboxCtx) - totalPlannedContribs(ctx);
    const terminalDelta = sbTerminal - baseTerminal;
    return { baseTerminal, sbTerminal, terminalDelta, baseRetAge, sbRetAge, baseRetirement: baseRetRow?.totalCombined || 0, sbRetirement: sbRetRow?.totalCombined || 0, retirementDelta: (sbRetRow?.totalCombined || 0) - (baseRetRow?.totalCombined || 0), cumulativeExtraCapital, multiplier: cumulativeExtraCapital !== 0 ? terminalDelta / cumulativeExtraCapital : 0 };
  }, [timelineData, sandboxTimeline, ctx, sandboxCtx]);

  const historicalTimeline = useMemo(() => E.simulateHistorical(ctx, activeHistoricalStartYear), [ctx, activeHistoricalStartYear]);
  /*
   * The estate, at several ages at once.
   *
   * One death age would be false precision, and worse than that it would hide the single largest
   * discontinuity in the whole calculation: an inherited pension is tax-free to the beneficiary if
   * death is before 75 and taxed at their marginal rate from 75. Measured across 360 households, that
   * one boundary changes which decumulation policy is best from Sequential winning 59% of them to
   * winning 21%. A tab that asked for one number and answered it would be answering the wrong question
   * confidently, so the ages are shown side by side and the chosen one is only highlighted.
   */
  const inheritanceView = useMemo(() => {
    const inh = plan?.inheritance || {};
    const bens = E.normalizeBeneficiaries(inh.beneficiaries);
    const declared = bens.reduce((t, b) => t + E.num(b.sharePct, 0), 0);
    const declaredPen = bens.reduce((t, b) => t + E.num(b.penPct, 0), 0);
    const homeValue = Math.max(0, E.num(inh.homeValue, 0));
    const chosenAge = E.clamp(E.num(inh.deathAge, terminalAge), currentAge, 120);
    const ages = [...new Set([...INHERITANCE_AGES, chosenAge])].filter(a => a >= currentAge).sort((a, b) => a - b);

    const at = (age) => {
      /*
       * Wrappers at the death age, read off the projection - NOT the terminal row. Dying at 74 on a
       * plan that runs to 95 leaves whatever the pot held at 74, and using the age-95 figure would
       * value an estate after twenty more years of drawdown that never happened.
       */
      const row = timelineData.find(r => r.ageSelf >= age) || timelineData[timelineData.length - 1];
      if (!row) return null;
      // the home is gone from the estate if it was sold during retirement; its proceeds are already in
      // the wrappers by then, so counting it again would double it
      const soldBy = inh.homeSold && E.num(inh.homeSaleAge, 999) <= age;
      const fn = isCouple ? E.estateForCouple : E.estateAtDeath;
      const res = fn(plan?.config, { pen: row.pensions, isa: row.isas, other: row.other, cash: row.cash }, {
        deathAge: age, deathYear: row.year,
        homeValue: soldBy ? 0 : homeValue,
        // selling the home does not forfeit the residence band: the downsizing addition keeps it, so the
        // value of what was sold has to travel with the plan
        formerHomeValue: soldBy ? homeValue : 0,
        homeToDescendants: !!inh.homeToDescendants,
        transferredNrbPct: E.num(inh.transferredNrbPct, 0),
        transferredRnrbPct: E.num(inh.transferredRnrbPct, 0),
        qsrInheritedValue: E.num(inh.qsrInheritedValue, 0), qsrTaxPaid: E.num(inh.qsrTaxPaid, 0),
        qsrYearsBefore: E.num(inh.qsrYearsBefore, 99), activeServiceExempt: !!inh.activeServiceExempt,
        gifts: inh.gifts, beneficiaries: bens
      });
      const est = isCouple ? res.second : res;
      return { age, year: row.year, homeSold: soldBy, ...est };
    };

    const rows = ages.map(at).filter(Boolean);
    const chosen = rows.find(r => r.age === chosenAge) || rows[rows.length - 1];
    /*
     * A suggestion priced at the chosen death age. Sizing it means asking what this plan looks like at
     * that age if the gift were made next year, which is a question only the projection can answer - so
     * the search is handed a function that runs it. Ten or so extra deterministic runs, each about the
     * cost of the Trajectory tab's own, which is cheaper than being wrong by a factor of two.
     */
    const chosenRow = timelineData.find(r => r.ageSelf >= chosenAge) || timelineData[timelineData.length - 1];
    const liquidToday = { cash: 0, other: 0, isa: 0 };
    ctx.accounts.forEach(a => { if (a.cat in liquidToday) liquidToday[a.cat] += Math.max(0, E.num(a.balance, 0)); });
    const giftYear = ctx.baseYear + 1;
    const project = (amount) => {
      const giftCtx = E.buildContext({
        ...E.resolveMpaa(plan),
        inheritance: { ...inh, gifts: [...(inh.gifts || []), { id: '__probe', amount, year: giftYear }] }
      });
      const rows = E.simulateDeterministic(giftCtx, 'expected');
      const row = rows.find(r => r.ageSelf >= chosenAge) || rows[rows.length - 1];
      if (!row) return null;
      /*
       * Solvency is judged over the WHOLE plan, not up to the death age: a gift that leaves the
       * household destitute at 91 is not made acceptable by their having chosen to price death at 80.
       */
      return { pen: row.pensions, isa: row.isas, other: row.other, cash: row.cash,
        survived: E.evaluateRows(giftCtx, rows).survived };
    };
    // the search costs a dozen projections, so it is only run for the tab that shows it
    const soldByChosen = inh.homeSold && E.num(inh.homeSaleAge, 999) <= chosenAge;
    const suggestion = (chosenRow && bens.length && activeTab === 'inheritance') ? E.suggestGift(plan?.config,
      { pen: chosenRow.pensions, isa: chosenRow.isas, other: chosenRow.other, cash: chosenRow.cash },
      { deathAge: chosenAge, deathYear: chosenRow.year,
        homeValue: soldByChosen ? 0 : homeValue, formerHomeValue: soldByChosen ? homeValue : 0,
        homeToDescendants: inh.homeToDescendants !== false,
        transferredNrbPct: E.num(inh.transferredNrbPct, 0), transferredRnrbPct: E.num(inh.transferredRnrbPct, 0),
        gifts: inh.gifts, beneficiaries: bens, giftYear, liquidToday, project }) : null;
    // the 75 boundary, priced for this household rather than described in the abstract
    const before = rows.filter(r => r.age < 75).slice(-1)[0];
    const after = rows.find(r => r.age >= 75);
    const cliff = (before && after && before.netToBeneficiaries > 0)
      ? { before, after, loss: before.netToBeneficiaries - after.netToBeneficiaries }
      : null;
    return { rows, chosen, cliff, bens, declared, declaredPen, homeValue, chosenAge, suggestion,
      surplus: E.surplusIncome(timelineData), hasBens: bens.length > 0 };
  }, [plan, ctx, timelineData, isCouple, terminalAge, currentAge, activeTab]);

  const historicalMetrics = useMemo(() => {
    if (!historicalTimeline.length) return null;
    const ev = E.evaluateRows(ctx, historicalTimeline);
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
  }, [historicalTimeline, ctx, activeHistoricalStartYear]);

  const chartDisplayData = useMemo(() => timelineData.map(d => {
    let activeVal = d.totalCombined;
    if (!isCouple || plan?.activeProfileView === 'Myself') activeVal = d.totalSelf;
    if (isCouple && plan?.activeProfileView === 'Partner') activeVal = d.totalPart;
    return { ...d, expected: activeVal };
  }), [timelineData, plan?.activeProfileView, isCouple]);
  const visibleData = useMemo(() => chartDisplayData.filter(d => d.ageSelf <= effectiveMaxVisibleAge), [chartDisplayData, effectiveMaxVisibleAge]);

  /*
   * The lucky / unlucky band.
   *
   * Off by default is the wrong instinct here: a range is the first thing anyone wants and the expected
   * line alone invites reading a single number as a forecast. It is on, and honest about its one bias.
   *
   * Quartiles by default because that is what BlackRock actually publish - the decile band is our own
   * extrapolation outward from their interquartile range - and because the quartile band measures closer
   * to the simulation (mean error 1.6% against 2.8%), being less exposed to the tail. The toggle to
   * deciles exists so the band can be compared like for like against the Monte Carlo fan, which is drawn
   * at the 10th and 90th.
   */
  /*
   * Both charts draw the QUARTILE band by default and carry the 10th/90th as an optional outer pair,
   * toggled from each chart's own legend. Same shape on both sides is the whole point: a reader comparing
   * them should be comparing method, not percentile.
   */
  // One control for both charts. They exist to be read against each other, so letting them sit on
  // different percentiles would make the only comparison that matters impossible to trust.
  const [bandMode, setBandMode] = useState('quartile');   // 'quartile' | 'decile'
  // The Monte Carlo step exists to show its range, so there is nothing to switch off there.
  const showFan = true;
  const bandSpec = BAND_QUANTILES[bandMode] || null;
  // Both quantile pairs, so the outer toggle costs nothing at the moment it is pressed. Four
  // deterministic sweeps, about 38ms on a 45-year plan, recomputed only when the plan itself changes.
  const rateCurves = useMemo(() => {
    try {
      return {
        q: { lo: E.quantileCurve(resolvedPlan, -BAND_QUANTILES.quartile.z), hi: E.quantileCurve(resolvedPlan, BAND_QUANTILES.quartile.z) },
        d: { lo: E.quantileCurve(resolvedPlan, -BAND_QUANTILES.decile.z), hi: E.quantileCurve(resolvedPlan, BAND_QUANTILES.decile.z) },
        mid: E.simulateDeterministic(ctx, 'expected')
      };
    } catch { return null; }
  }, [resolvedPlan, ctx]);
  const bandCurves = useMemo(() => {
    if (!bandSpec || !rateCurves) return null;
    return bandMode === 'decile' ? rateCurves.d : rateCurves.q;
  }, [bandSpec, bandMode, rateCurves]);
  // pick the same total the expected line is showing, so the band cannot describe a different household
  const bandKey = (!isCouple || plan?.activeProfileView === 'Myself') ? 'totalSelf'
    : (isCouple && plan?.activeProfileView === 'Partner') ? 'totalPart' : 'totalCombined';
  const bandData = useMemo(() => {
    if (!bandCurves) return null;
    return bandCurves.lo.pot
      .map((d, i) => ({ ageSelf: d.ageSelf, lo: d[bandKey], hi: bandCurves.hi.pot[i][bandKey] }))
      .filter(d => d.ageSelf <= effectiveMaxVisibleAge);
  }, [bandCurves, bandKey, effectiveMaxVisibleAge]);

  /*
   * PINCH, on the Monte Carlo chart only: it is DRAWN as though every path left a single point, and they
   * did not. stepYear applies a year's growth at row 0, so the first plotted value already carries that
   * path's own first-year return - measured, an 81%-of-the-mean spread before the chart has drawn
   * anything. The sixty animated trials and the band they dissolve into converge on the same point, which
   * is what makes the reveal read as a fan opening rather than sixty unrelated lines.
   *
   * A deliberate cosmetic lie, confined to the path geometry: bandData, fanData and simResult are
   * untouched, so the tooltip, the tiles and the side-by-side table all still report the true first-year
   * figures. The rate-based chart is NOT pinched - it is the reference the Monte Carlo is read against,
   * and it draws what it computes.
   */
  const pinchY = (rows, key, anchorKey) => (d, i) => yScale(Math.max(0, i === 0 ? rows[0][anchorKey] : d[key]));

  /*
   * The Monte Carlo fan: the 10th to 90th percentile of simulated wealth at every year, not a line any
   * one path follows. `bands` only exists when a run asked runTrial to keep its paths, which is stage 1.
   *
   * It shares the chart's axes rather than owning its own, so the two ranges can be read against each
   * other. The fan sets the ceiling and the expected line sits low against it, which is the correct
   * picture rather than a scaling fault: one smooth curve accounts for very little of the distribution.
   */
  const fanBands = simResult?.bands || null;
  const fanData = useMemo(
    () => (fanBands ? fanBands.map(b => ({ ...b, ageSelf: currentAge + b.t })) : []),
    [fanBands, currentAge]);
  const fanVisible = useMemo(
    () => (showFan && fanData.length ? fanData.filter(d => d.ageSelf <= effectiveMaxVisibleAge) : null),
    [showFan, fanData, effectiveMaxVisibleAge]);

  /*
   * The Monte Carlo chart plays itself in, spreading from the left edge as the horizon fills. It is not
   * decoration: the shape of the thing - a point at the start widening into a cloud - is the fact the
   * chart exists to convey, and watching it happen lands that better than arriving at the finished
   * picture. It runs ONCE per set of results. Coming back to the slide shows the completed chart, because
   * a replay on every visit would be an animation you have to sit through rather than one you watched.
   */
  const [mcReveal, setMcReveal] = useState(0);
  useEffect(() => {
    if (!fanData.length) { setMcReveal(0); return; }
    if (slide !== 4 && !seeAll) { setMcReveal(0); return; }   // rewound, so arriving always plays it
    setMcReveal(0);
    const start = performance.now(), ms = 2200;
    let raf = 0;
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / ms);
      setMcReveal(t);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fanData, simResult, slide, seeAll]);

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
  const [viewportW, setViewportW] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isNarrow = viewportW < 640;
  const chartWidth = isNarrow ? 560 : 960, chartHeight = isNarrow ? 620 : 420;
  const margin = isNarrow ? { top: 18, right: 14, bottom: 40, left: 58 } : { top: 25, right: 35, bottom: 45, left: 80 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const xScale = useMemo(() => d3.scaleLinear().domain([currentAge, Math.max(currentAge + 1, effectiveMaxVisibleAge)]).range([0, innerWidth]), [currentAge, effectiveMaxVisibleAge, innerWidth]);
  const maxY = useMemo(() => {
    let max = 0;
    visibleData.forEach(d => { if (activeSeries.expected && d.expected > max) max = d.expected; if (activeSeries.nominal && d.nominal > max) max = d.nominal; });
    if (isSandboxModified) sandboxTimeline.forEach(d => { if (d.ageSelf <= effectiveMaxVisibleAge && d.totalCombined > max) max = d.totalCombined; });
    // an overlaid scenario that outgrows the live plan must lift the axis, not run off the top of it
    compareRuns.forEach(r => { if (r.rows) r.rows.forEach(d => { if (d.ageSelf <= effectiveMaxVisibleAge && d.totalCombined > max) max = d.totalCombined; }); });
    // and so must the lucky edge, which by construction sits above everything else on the chart
    if (bandData) bandData.forEach(d => { if (d.hi > max) max = d.hi; });
    // The simulated fan reaches highest of all - its 90th percentile is a genuine tail, not a smooth
    // curve - so it sets the ceiling for everything else on the chart.
    if (fanVisible) fanVisible.forEach(d => { if (d.p90 > max) max = d.p90; });
    return Math.max(max * 1.08, 100000);
  }, [visibleData, activeSeries, isSandboxModified, sandboxTimeline, compareRuns, effectiveMaxVisibleAge, bandData, fanVisible]);
  const yScale = useMemo(() => d3.scaleLinear().domain([0, maxY]).range([innerHeight, 0]).nice(), [maxY, innerHeight]);
  const pathGenerators = useMemo(() => {
    const paths = {};
    SERIES_CONFIG.forEach(s => { if (activeSeries[s.id]) paths[s.id] = d3.line().x(d => xScale(d.ageSelf)).y(d => yScale(d[s.id] || 0)).curve(d3.curveMonotoneX)(visibleData); });
    return paths;
  }, [visibleData, activeSeries, xScale, yScale]);
  const bandPaths = useMemo(() => {
    if (!bandData || bandData.length < 2) return null;
    const x = (d) => xScale(d.ageSelf);
    return {
      area: d3.area().x(x).y0(d => yScale(Math.max(0, d.lo))).y1(d => yScale(d.hi)).curve(d3.curveMonotoneX)(bandData),
      lo: d3.line().x(x).y(d => yScale(Math.max(0, d.lo))).curve(d3.curveMonotoneX)(bandData),
      hi: d3.line().x(x).y(d => yScale(d.hi)).curve(d3.curveMonotoneX)(bandData)
    };
  }, [bandData, xScale, yScale]);
  // The sandbox and each saved scenario are legend entries like any other series, so they need somewhere
  // to keep their on/off state. The sandbox starts on - it appears because you just edited something -
  // while saved scenarios start off, since a chart that silently draws every scenario you ever kept is
  // unreadable the moment you have more than two.
  const [showSandboxLine, setShowSandboxLine] = useState(true);
  const sandboxLinePath = useMemo(() => {
    if (!showSandboxLine || !isSandboxModified || !sandboxTimeline.length) return null;
    return d3.line().x(d => xScale(d.ageSelf)).y(d => yScale(d.totalCombined)).curve(d3.curveMonotoneX)(sandboxTimeline.filter(d => d.ageSelf <= effectiveMaxVisibleAge));
  }, [showSandboxLine, isSandboxModified, sandboxTimeline, effectiveMaxVisibleAge, xScale, yScale]);
  // Same generator as the sandbox line, one per overlaid scenario. Like the sandbox these are raw engine
  // rows, so the pot is read off totalCombined rather than the profile-aware `expected` key.
  const comparePaths = useMemo(() => compareRuns.filter(r => r.rows).map(r => ({
    id: r.id, tone: r.tone,
    d: d3.line().x(d => xScale(d.ageSelf)).y(d => yScale(d.totalCombined)).curve(d3.curveMonotoneX)(r.rows.filter(d => d.ageSelf <= effectiveMaxVisibleAge))
  })), [compareRuns, effectiveMaxVisibleAge, xScale, yScale]);
  const histXScale = useMemo(() => d3.scaleLinear().domain([currentAge, Math.max(currentAge + 1, terminalAge)]).range([0, innerWidth]), [currentAge, terminalAge, innerWidth]);
  /*
   * Monte Carlo paths, drawn to match the rate-based chart: quartile band plus a median, with the
   * 10th/90th available as an outer pair from the legend. `reveal` is the animation clock - the fraction
   * of the horizon drawn so far - so the chart can play itself in once and then stay put.
   */
  /*
   * The two phases of the reveal, derived from one clock.
   *
   * DRAW (0 to 0.72): sixty of the real simulated futures sweep out from the left, each one a plan that
   * lived through its own order of good and bad years. They already differ at the first point drawn,
   * because stepYear applies a year's growth at row 0 - the chart opens slightly fanned rather than
   * pinched, which is correct. SETTLE (0.72 to 1): they fade out as the percentile band fades in, so the
   * summary is visibly made OF those paths rather than asserted over them.
   *
   * Drawing the actual trials matters. A wipe across a pre-computed band looks similar for a second and
   * says nothing true: the fan would appear whether or not anything had been simulated.
   *
   * It replays on every arrival at the step. The clock is reset whenever the step is not on screen, so
   * coming back rewinds it rather than resuming a finished animation.
   */
  const mcDraw = Math.min(1, mcReveal / 0.72);
  const mcSettle = Math.max(0, (mcReveal - 0.72) / 0.28);
  const mcSpaghetti = useMemo(() => {
    const sample = simResult?.samplePaths;
    if (!showFan || !sample || !sample.length || mcSettle >= 1) return null;
    const age0 = currentAge;
    const lastAge = Math.min(effectiveMaxVisibleAge, age0 + sample[0].length - 1);
    const upto = age0 + Math.max(1, Math.round((lastAge - age0) * mcDraw));
    const anchor = fanData[0] ? fanData[0].p50 : null;
    const gen = d3.line().x(d => xScale(d.a)).y((d, i) => yScale(Math.max(0, i === 0 && anchor !== null ? anchor : d.v))).curve(d3.curveMonotoneX);
    return sample.map((pth, i) => {
      const rows = [];
      for (let t = 0; t < pth.length; t++) { const a = age0 + t; if (a > upto) break; rows.push({ a, v: pth[t] }); }
      return rows.length > 1 ? { id: i, d: gen(rows) } : null;
    }).filter(Boolean);
  }, [simResult, showFan, mcDraw, mcSettle, currentAge, effectiveMaxVisibleAge, xScale, yScale, fanData]);

  const fanPaths = useMemo(() => {
    if (!fanVisible || fanVisible.length < 2) return null;
    const cut = Math.max(2, Math.ceil(fanVisible.length * Math.max(mcSettle, mcReveal >= 1 ? 1 : 0)));
    const rows = fanVisible.slice(0, cut);
    const x = (d) => xScale(d.ageSelf);
    const line = (key) => d3.line().x(x).y(pinchY(rows, key, 'p50')).curve(d3.curveMonotoneX)(rows);
    // the same percentiles the rate-based chart is showing, so the two can be laid over each other
    const lo = bandMode === 'decile' ? 'p10' : 'p25', hi = bandMode === 'decile' ? 'p90' : 'p75';
    return {
      band: d3.area().x(x).y0(pinchY(rows, lo, 'p50')).y1(pinchY(rows, hi, 'p50')).curve(d3.curveMonotoneX)(rows),
      median: line('p50'), edgeLo: line(lo), edgeHi: line(hi)
    };
  }, [fanVisible, xScale, yScale, mcReveal, mcSettle, bandMode]);
  // The first age at which a tenth of the paths are broke. Worth naming: it is the most actionable thing
  // on the chart, and a smooth deterministic line could never have produced it. Read off the whole fan,
  // not the visible slice, so dragging the horizon slider cannot change the answer.
  const fanRuinAge = useMemo(() => {
    const hit = fanData.find(d => d.p10 <= 0);
    return hit ? hit.ageSelf : null;
  }, [fanData]);

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

  /*
   * The side-by-side table. The two columns answer the same five questions by different means, so the
   * only honest way to show them is at identical quantiles with the gap spelled out.
   *
   * The rate-based column reads its figures off the quantile curves already drawn on slide 3; the Monte
   * Carlo column off the same summary the tiles use. The median row is the pair worth noticing: they
   * agree there and part company at the edges, which is the whole argument for having both.
   */
  const compareRows2 = useMemo(() => {
    if (!simResult || !rateCurves) return null;
    const last = (c) => c.pot[c.pot.length - 1]?.totalCombined ?? 0;
    const atRetire = (rows) => rows.find(d => d.ageSelf === ctx.owners[0].retireAge);
    const rate = {
      p10: last(rateCurves.d.lo), p25: last(rateCurves.q.lo),
      p50: rateCurves.mid[rateCurves.mid.length - 1]?.totalCombined ?? 0,
      p75: last(rateCurves.q.hi), p90: last(rateCurves.d.hi)
    };
    const mc = {
      p10: simResult.p10Terminal, p25: simResult.p25Terminal, p50: simResult.medianTerminal,
      p75: simResult.p75Terminal, p90: simResult.p90Terminal
    };
    const row = (label, key) => ({ label, rate: rate[key], mc: mc[key], pct: mc[key] > 0 ? (rate[key] - mc[key]) / mc[key] * 100 : 0 });
    // Both columns as a percentage of outcomes, so the row compares like with like. Counting how many of
    // the drawn lines survive would measure how many lines were drawn, not the plan.
    const smoothRate = E.smoothSurvivalRate(resolvedPlan);
    const mcRetire = fanData.find(d => d.ageSelf === ctx.owners[0].retireAge);
    return {
      quantiles: [row('10th percentile', 'p10'), row('25th percentile', 'p25'), row('Median', 'p50'), row('75th percentile', 'p75'), row('90th percentile', 'p90')],
      extras: [
        { label: `Median pot at retirement (${ctx.owners[0].retireAge})`, rate: formatGBP(atRetire(rateCurves.mid)?.totalCombined ?? 0), mc: mcRetire ? formatGBP(mcRetire.p50) : '—', note: 'expected path vs simulated median' },
        { label: `Survives to ${ctx.terminalAge}`, rate: `${smoothRate.toFixed(1)}%`, mc: `${simResult.successRate.toFixed(1)}%`, note: smoothRate >= simResult.successRate ? `flattered by ${(smoothRate - simResult.successRate).toFixed(1)} pts` : '' },
        { label: `Stranded before ${nmpa}`, rate: deterministicVerdict.failReason === 'pre-access' ? 'yes' : 'no', mc: `${simResult.preNmpaFailRate.toFixed(1)}% of paths`, note: 'pension locked, bridge spent' }
      ]
    };
  }, [simResult, rateCurves, resolvedPlan, ctx, deterministicVerdict, fanData, nmpa]);

  const sequenceLoss = useMemo(() => {
    if (!simResult || !Number.isFinite(simResult.p10Terminal)) return null;
    const T = ctx.totalYears + 1;
    const smoothPotAt = (edge) => {
      const flat = {};
      Object.entries(activeRiskMatrix).forEach(([k, v]) => {
        const b = E.luckyBand(E.num(v.real, 0) / 100, E.num(v.volatility, 12) / 100, T, E.num(v.sigmaParam, 0) / 100);
        flat[k] = { ...v, real: b[edge] * 100, volatility: 0, sigmaParam: 0 };
      });
      const c = E.buildContext({ ...resolvedPlan, riskProfiles: flat });
      return E.evaluateRows(c, E.simulateDeterministic(c, 'expected')).terminalPot;
    };
    const smoothLow = smoothPotAt('unlucky');
    const smoothHigh = smoothPotAt('lucky');
    const actualLow = simResult.p10Terminal, actualHigh = simResult.p90Terminal;
    const gapLow = smoothLow - actualLow, gapHigh = smoothHigh - actualHigh;
    const pctLow = smoothLow > 0 ? (gapLow / smoothLow) * 100 : 0;
    const pctHigh = smoothHigh > 0 ? (gapHigh / smoothHigh) * 100 : 0;
    /*
     * Four states, because the number alone does not say which story it is telling.
     *
     * A small gap survives even with no withdrawals at all (measured: 0.8% on a 35-to-65 accumulation
     * plan) because a contribution stream weights the early years differently from the late ones, so the
     * terminal pot stops being a monotone function of the annualised return. That is contribution
     * timing, not forced selling, and calling it a loss would overclaim. The same 0.8% also appears on a
     * genuinely withdrawing plan whose pot is large relative to the draw - a different reason for the
     * same small number, so magnitude has to be read alongside whether the plan draws down at all.
     * Below MATERIAL_PCT the figure is dominated by the first effect; a real sequence loss on these
     * fixtures runs 12-26%, an order of magnitude clear of it.
     */
    const MATERIAL_PCT = 2;
    const drawdownYears = ctx.terminalAge - Math.min(...ctx.owners.map(o => o.retireAge));
    const state = actualLow <= 0 ? 'ruin'
      : pctLow >= MATERIAL_PCT ? 'loss'
        : drawdownYears <= 0 ? 'buying' : 'small';
    return { smoothLow, smoothHigh, actualLow, actualHigh, gapLow, gapHigh, pctLow, pctHigh, state, smoothSurvives: smoothLow > 0 };
  }, [simResult, ctx.totalYears, ctx.terminalAge, ctx.owners, resolvedPlan, activeRiskMatrix]);


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
  const NON_NUMERIC_SPENDING = ['drawdownStrategy', 'decumulationPolicy', 'priorities'];
  const updateSpending = (field, value) => setPlan(prev => ({ ...prev, spending: { ...(prev.spending || {}), [field]: NON_NUMERIC_SPENDING.includes(field) ? value : parseInputNumber(value) } }));

  // the household's ranked objectives, and the promote/demote that reorders them
  const priorityList = E.normalizePriorities(plan?.spending?.priorities);
  const priorityTolerances = E.normalizeTolerances(plan?.spending?.priorityTolerances);
  const priorityMode = plan?.spending?.priorityMode === 'balanced' ? 'balanced' : 'ranked';
  const setTolerance = (key, value) => updateSpending('priorityTolerances', { ...(plan?.spending?.priorityTolerances || {}), [key]: value });
  const movePriority = (i, dir) => {
    const next = [...priorityList], j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    updateSpending('priorities', next);
  };
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

  // --- inheritance ---------------------------------------------------------------------------
  const updateInheritance = (field, value) => setPlan(prev => ({ ...prev, inheritance: { ...(prev.inheritance || {}), [field]: value } }));
  const addBeneficiary = () => setPlan(prev => {
    const list = prev.inheritance?.beneficiaries || [];
    // a new row takes whatever share is unallocated, so the table tends towards totalling 100 by itself
    const left = Math.max(0, 100 - list.reduce((t, b) => t + E.num(b.sharePct, 0), 0));
    return { ...prev, inheritance: { ...(prev.inheritance || {}), beneficiaries: [...list, { id: 'ben_' + Date.now(), name: '', relationship: 'descendant', sharePct: left || '', income: '' }] } };
  });
  const updateBeneficiary = (id, patch) => setPlan(prev => ({ ...prev, inheritance: { ...(prev.inheritance || {}), beneficiaries: (prev.inheritance?.beneficiaries || []).map(b => b.id === id ? { ...b, ...patch } : b) } }));
  const addGift = () => setPlan(prev => ({ ...prev, inheritance: { ...(prev.inheritance || {}), gifts: [...(prev.inheritance?.gifts || []), { id: 'gift_' + Date.now(), amount: '', year: new Date().getFullYear(), desc: '' }] } }));
  const updateGift = (id, patch) => setPlan(prev => ({ ...prev, inheritance: { ...(prev.inheritance || {}), gifts: (prev.inheritance?.gifts || []).map(g => g.id === id ? { ...g, ...patch } : g) } }));
  const deleteGift = (id) => setPlan(prev => ({ ...prev, inheritance: { ...(prev.inheritance || {}), gifts: (prev.inheritance?.gifts || []).filter(g => g.id !== id) } }));
  const surplusGiftAnnual = Math.max(0, E.num(plan?.inheritance?.surplusGift?.annual, 0));
  const updateSurplusGift = (field, value) => setPlan(prev => ({
    ...prev,
    inheritance: {
      ...(prev.inheritance || {}),
      surplusGift: { ...(prev.inheritance?.surplusGift || {}), [field]: value }
    }
  }));
  /*
   * Accepting the suggestion writes an ordinary planned gift, nothing special: it lands in the same list,
   * with the same year and amount inputs, and can be edited or deleted like any other. Dated next year
   * rather than this one so it is money the projection still has to find, which is the honest framing -
   * the allowance it buys back is worth having only if the household can spare the cash.
   */
  const addSuggestedGift = (amount, year) => setPlan(prev => ({
    ...prev,
    inheritance: {
      ...(prev.inheritance || {}),
      gifts: [...(prev.inheritance?.gifts || []), {
        id: 'gift_' + Date.now(), amount: Math.round(amount), year: E.num(year, ctx.baseYear + 1),
        desc: 'Gift to restore the residence allowance'
      }]
    }
  }));

  const deleteBeneficiary = (id) => setPlan(prev => ({ ...prev, inheritance: { ...(prev.inheritance || {}), beneficiaries: (prev.inheritance?.beneficiaries || []).filter(b => b.id !== id) } }));

  // ------------------------------------------------------------ scenarios
  const handleSaveScenario = () => {
    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, name: scenarioNameInput.trim() !== '' ? scenarioNameInput.trim() : s.name, data: clone(plan) } : s));
    setScenarioNameInput(''); flash('Scenario saved');
  };
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
    setSandboxCustomized(false); setActiveScenarioId(id); setPlan(data); setSimResult(null); setSafeMaxResult(null); setSandboxAccounts(sandboxFromPlan(data)); setSandboxRetire(sandboxRetireFromPlan(data));
  };
  const handleDeleteScenario = (idToDelete) => {
    if (scenarios.length <= 1) { window.alert('At least one scenario must be retained.'); return; }
    const remaining = scenarios.filter(s => s.id !== idToDelete);
    setScenarios(remaining);
    if (activeScenarioId === idToDelete) { setActiveScenarioId(remaining[0].id); setPlan(E.normalizePlan(remaining[0].data)); }
    setCompareIds(prev => prev.filter(id => id !== idToDelete));
  };

  const toggleCompare = (id) => setCompareIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  const sortCompareBy = (key) => setCompareSort(prev => (prev.key === key ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }));
  // The same three outcome states the Historical backtest reports, worded the same way. A floor failure
  // funds every year and only then ends short, so it is not a "ran dry after N of N years".
  const outcomeLabel = (r) => (r.survived ? `Survived all ${r.years} years`
    : r.failReason === 'floor' ? `All ${r.years} years funded, below floor`
      : `Ran dry after ${Math.max(0, r.failAge - r.startAge)} of ${r.years} years`);

  // ------------------------------------------------------------ sandbox
  // The sandbox as a plan object: the saved plan with its contributions, escalation and retirement ages
  // replaced by the sandbox figures. Used both to write the sandbox back and to score it in the tournament.
  const planFromSandbox = (prev) => ({
    ...prev,
    demographics: { ...prev.demographics, retireAgeSelf: sandboxRetire.self, ...(isCouple ? { retireAgePart: sandboxRetire.part } : {}) },
    accounts: (prev.accounts || []).map(acc => {
      const sb = sandboxAccounts[acc.id];
      if (!sb) return acc;
      const out = { ...acc, contrib: sb.contrib, growth: sb.growth };
      if (sb.balance !== undefined) out.balance = sb.balance;
      if (sb.contribByYear) out.contribByYear = sb.contribByYear; else delete out.contribByYear;
      return out;
    })
  });
  const handleApplySandboxToPlan = () => {
    setSandboxCustomized(false);
    setPlan(prev => planFromSandbox(prev));
    flash('Sandbox applied to plan inputs');
  };
  const handleResetSandbox = () => { setSandboxCustomized(false); setSandboxAccounts(sandboxFromPlan(plan)); setSandboxRetire(sandboxRetireFromPlan(plan)); };
  const updateSandboxRetire = (key, value) => {
    setSandboxCustomized(true);
    setSandboxRetire(prev => ({ ...prev, [key]: E.clamp(E.num(value, prev[key]), 0, 120) }));
  };
  const adjustSandboxRetire = (key, delta) => {
    setSandboxCustomized(true);
    setSandboxRetire(prev => ({ ...prev, [key]: E.clamp(E.num(prev[key], 60) + delta, 0, 120) }));
  };
  const updateSandboxField = (id, field, value) => {
    setSandboxCustomized(true);
    setSandboxAccounts(prev => { const cur = { ...(prev[id] || {}) }; delete cur.contribByYear; return { ...prev, [id]: { ...cur, [field]: parseInputNumber(value) } }; });
  };
  const adjustSandboxContrib = (id, delta) => {
    setSandboxCustomized(true);
    setSandboxAccounts(prev => { const cur = { ...(prev[id] || {}) }; delete cur.contribByYear; return { ...prev, [id]: { ...cur, contrib: Math.max(0, E.num(cur.contrib, 0) + delta) } }; });
  };
  const handleApplyStrategyToSandbox = (strategy) => {
    setSandboxCustomized(true);
    const fresh = {};
    (strategy.planState?.accounts || []).forEach(a => {
      fresh[a.id] = { contrib: E.num(a.contrib, 0), growth: E.num(a.growth, 0) };
      const base = (plan.accounts || []).find(x => x.id === a.id);
      if (base && E.num(base.balance, 0) !== E.num(a.balance, 0)) fresh[a.id].balance = E.num(a.balance, 0);
      if (Array.isArray(a.contribByYear)) fresh[a.id].contribByYear = a.contribByYear;
    });
    setSandboxAccounts(fresh);
    setActiveTab('projection');
    flash(`"${strategy.name}" applied to the Sandbox on the Projection chart`, 3500);
  };

  // Writes the strategy straight into the plan rather than the sandbox. Contributions and escalation are
  // replaced wholesale — the escalation is the normalised rate, not the one originally entered, so copying
  // only the amounts would leave the plan costing a different total from the strategy that was scored.
  const handleApplyStrategyToPlan = (strategy) => {
    if (!strategy?.planState) return;
    setPlan(prev => ({
      ...prev,
      accounts: (prev.accounts || []).map(a => {
        const next = (strategy.planState.accounts || []).find(x => x.id === a.id);
        if (!next) return a;
        const out = { ...a, contrib: E.num(next.contrib, 0), growth: E.num(next.growth, 0) };
        // a balance only moves when the strategy actually shifts capital (Bed & SIPP)
        if (E.num(next.balance, 0) !== E.num(a.balance, 0)) out.balance = E.num(next.balance, 0);
        if (Array.isArray(next.contribByYear)) out.contribByYear = next.contribByYear; else delete out.contribByYear;
        return out;
      })
    }));
    setActiveTab('inputs');
    flash(`"${strategy.name}" written into Plan Inputs. Save a scenario first if you want the old figures back`, 6000);
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
        setSandboxCustomized(false); setPlan(E.normalizePlan(parsed)); setSimResult(null); setSafeMaxResult(null);
        setSlide(1); setSeeAll(false); setSandboxRevealed(false);
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
    if (window.confirm('Reset all inputs back to blank?')) { setSandboxCustomized(false); setPlan(E.normalizePlan(null)); safeStorageRemove(STORAGE_KEY); setSimResult(null); setSafeMaxResult(null); }
  };
  const handleExportCSV = () => {
    if (!timelineData.length) return;
    const headers = ['Year', 'Age (Myself)', 'Age (Partner)', 'Working (Myself)', 'Working (Partner)', 'Target Spend (£)', 'Net Guaranteed Income (£)', 'Working Partner Take-home (£)', 'State Pension (Myself £)', 'State Pension (Partner £)', 'Net Drawdown Demand (£)', 'Pension Withdrawals Gross (£)', 'PA Harvested (£)', 'Income Tax (£)', 'CGT (£)', 'Realised Gains (£)', 'Pensions (£)', 'ISAs (£)', 'Other Investments (£)', 'Cash Savings (£)', 'Total Combined Pot (£)', 'Pre-SIPP access Liquid (£)', 'Unmet (£)', 'Status'];
    const rows = timelineData.map(r => [r.year, r.ageSelf, isCouple ? r.agePart : 'N/A', r.workingSelf ? 'Yes' : 'No', isCouple ? (r.workingPart ? 'Yes' : 'No') : 'N/A', r.targetSpend.toFixed(0), r.netGuaranteed.toFixed(0), r.workingTakeHome.toFixed(0), r.spSelf.toFixed(0), isCouple ? r.spPart.toFixed(0) : '0', r.netDrawdown.toFixed(0), r.drawdownPensions.toFixed(0), r.harvested.toFixed(0), r.taxPaid.toFixed(0), (r.cgtPaid || 0).toFixed(0), (r.realisedGains || 0).toFixed(0), r.pensions.toFixed(0), r.isas.toFixed(0), r.other.toFixed(0), r.cash.toFixed(0), r.totalCombined.toFixed(0), r.preNmpaLiquid.toFixed(0), r.unmetDemand.toFixed(0), r.preNmpaInsolvent ? 'Pre-SIPP access gap' : r.unmetDemand > E.FAIL_TOLERANCE ? 'Shortfall' : 'Solvent']);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a'); link.setAttribute('href', encodeURI(csvContent)); link.setAttribute('download', `retirement_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); link.remove();
  };

  // ------------------------------------------------------------ Monte Carlo
  // Stage 1: the plan exactly as entered. Fast, and the only stage that always runs.
  const runStageTest = async (scale = { from: 0, to: 1 }) => {
    const label = `Testing ${MC_TRIALS.toLocaleString()} paths against your current spend…`;
    setSimProgress({ label, value: scale.from });
    await tick();
    const stats = await runMonteCarloAsync(ctx, {
      trials: MC_TRIALS, seed: mcSeed, shouldStop: () => mcCancelRef.current, collectPaths: true,
      onProgress: (f) => setSimProgress({ label, value: scale.from + (scale.to - scale.from) * f })
    });
    if (mcCancelRef.current) return null;
    const res = { ...stats, spend: ctx.targetSpend };
    setSimResult(res);
    return res;
  };

  /*
   * Stage 2: the same engine run backwards. Stage 1 fixes the spending and reports the risk; this fixes
   * the risk and reports the spending. It bisects on the spend, re-running the search at each step, then
   * confirms the answer over the full path count, which is why it costs more than stage 1.
   */
  const runStageSafeMax = async (targetRate, scale = { from: 0, to: 1 }) => {
    const span = scale.to - scale.from;
    setSimProgress({ label: `Solving for the most you could spend at ${targetRate}%…`, value: scale.from });
    await tick();
    const paths = E.pathsForSeed(mcSeed, SEARCH_TRIALS, ctx.totalYears);
    const rateAt = (spend) => { let s = 0; for (const zs of paths) if (E.runTrial(ctx, zs, spend).survived) s++; return (s / SEARCH_TRIALS) * 100; };
    let low = 0, result;
    if (rateAt(0) < targetRate) {
      result = { spend: 0, note: 'Even zero spending fails the target. Check the pre-SIPP access gap, one-off costs or the bequest floor.' };
    } else {
      let high = Math.max(20000, ctx.targetSpend * 2, 150000), guard = 0;
      while (rateAt(high) >= targetRate && guard++ < 8) { low = high; high *= 2; }
      for (let iter = 0; iter < 14; iter++) {
        const mid = E.round250((low + high) / 2);
        if (mid <= low || mid >= high) break;
        if (rateAt(mid) >= targetRate) low = mid; else high = mid;
        setSimProgress({ label: `Narrowing… £${low.toLocaleString()}–£${high.toLocaleString()}`, value: scale.from + span * (0.1 + 0.5 * (iter + 1) / 14) });
        await tick();
        if (mcCancelRef.current) break;
      }
      result = { spend: E.round250(low) };
    }

    /*
     * Verification, on the full sample, and it is not a formality.
     *
     * The bisection above runs on SEARCH_TRIALS paths and picks, from the spends near the boundary,
     * whichever one that small sample happened to flatter - so re-measuring regresses, and always
     * downward, because the selection was upward. Reporting the search's answer against a fresh 5,000
     * paths produced a "90% safe spend" that survived 88.4%. Every fixture tested came back short.
     *
     * So the same seed throughout (SEARCH_TRIALS paths are then a prefix of MC_TRIALS, not a different
     * draw), and then walk the answer down on the full sample until the number about to be shown clears
     * the target. What is displayed is what was measured.
     */
    const confirm = async (spend, label) => runMonteCarloAsync(ctx, {
      trials: MC_TRIALS, seed: mcSeed, spendOverride: spend, shouldStop: () => mcCancelRef.current,
      onProgress: (f) => setSimProgress({ label, value: scale.from + span * (0.6 + 0.4 * f) })
    });
    let spend = result.spend;
    let stats = await confirm(spend, `Confirming £${spend.toLocaleString()} over ${MC_TRIALS.toLocaleString()} paths…`);
    if (mcCancelRef.current || !stats) return null;
    if (!result.note && stats.successRate < targetRate) {
      let lo = 0, hi = spend, bestSpend = 0, bestStats = stats;
      for (let i = 0; i < 5; i++) {
        const mid = E.round250((lo + hi) / 2);
        if (mid <= lo || mid >= hi) break;
        const s = await confirm(mid, `Checking £${mid.toLocaleString()} against ${targetRate}%…`);
        if (mcCancelRef.current || !s) return null;
        if (s.successRate >= targetRate) { lo = mid; bestSpend = mid; bestStats = s; } else hi = mid;
      }
      if (bestSpend > 0) { spend = bestSpend; stats = bestStats; }
      else {
        spend = 0;
        stats = await confirm(0, 'Checking zero spending…');
        if (mcCancelRef.current || !stats) return null;
        result.note = `No spending above zero clears ${targetRate}%. The plan holds only while nothing is drawn from it.`;
      }
    }
    const res = { spend, note: result.note, targetRate, stats };
    setSafeMaxResult(res);
    return res;
  };

  /*
   * The single action on the Projection tab. Each stage renders as it lands rather than at the end, so the
   * fast answer is on screen in about a second while the slower one is still working.
   *
   * It clears any tournament results as it goes. Those live on another tab and were scored against the
   * plan as it was, so leaving them up after a fresh run would present stale figures as current ones.
   */
  const handleRunAll = async ({ cascade = false } = {}) => {
    if (isSimulating || isOptimizing) return;
    mcCancelRef.current = false;
    const wantSafeMax = true;          // both stages always run; there is nothing useful to switch off
    setSlide(1); setSeeAll(cascade); setSandboxRevealed(cascade);
    setIsSimulating(true);
    // Every stage is cleared, including one that is about to be skipped: a verdict line left over from an
    // earlier run would otherwise sit alongside fresh figures and read as part of the same measurement.
    setSimResult(null); setSafeMaxResult(null);
    setTournament(prev => (prev.results ? { ...prev, results: null } : prev));
    try {
      await runStageTest(wantSafeMax ? { from: 0, to: 0.35 } : { from: 0, to: 1 });
      if (mcCancelRef.current) return;
      if (wantSafeMax) {
        setIsOptimizing(true);
        await runStageSafeMax(targetSurvivalRate, { from: 0.35, to: 1 });
      }
    } finally {
      setIsSimulating(false); setIsOptimizing(false); setSimProgress(null);
    }
  };

  // Re-solve stage 2 alone, which is what a change of target survival rate needs: stage 1 does not depend on it.
  // Takes the rate explicitly: it is called straight from the survival-rate buttons, and reading it back
  // out of state there would use the value from before the click rather than the one just chosen.
  const handleResolveSafeMax = async (rate = targetSurvivalRate) => {
    if (isSimulating || isOptimizing) return;
    mcCancelRef.current = false;
    setIsOptimizing(true);
    try { await runStageSafeMax(rate); }
    finally { setIsOptimizing(false); setSimProgress(null); }
  };

  const handleCancelMC = () => { mcCancelRef.current = true; tournamentCancelRef.current = true; };

  const mcBusy = isSimulating || isOptimizing || tournament.isEvaluating;

  // ------------------------------------------------------------ decumulation policy auto-pick
  // Every policy combination is scored on the same seed (common random numbers), so the differences
  // between them are far more reliable than each one's absolute sampling error.
  const POLICY_SHORT = { 'Bracket Fill Basic': 'Tax Smoothing', 'Bracket Fill': 'UK FIRE Bracket Fill', 'Sequential': 'Sequential' };
  const policyRowLabel = (c) => `${POLICY_SHORT[c.decumulationPolicy] || c.decumulationPolicy} · ${c.drawdownStrategy === 'Full 25% Lump Sum' ? 'Lump Sum' : 'Phased'}${c.harvestApplies ? (c.harvestPersonalAllowance ? ' · harvest on' : ' · harvest off') : ''}`;
  // nothing to decumulate means every policy scores identically, so the sweep would be meaningless
  const policySweepReady = useMemo(() => {
    const funded = (ctx.accounts || []).reduce((s, a) => s + a.balance + a.contrib, 0);
    return funded > 0 && ctx.targetSpend > 0;
  }, [ctx]);

  /*
   * The estate optimiser. Cheap enough (about fifty deterministic runs, a tenth of a second) to run
   * synchronously on a click rather than chunked through the event loop like the Monte Carlo searches.
   */
  const [estatePlan, setEstatePlan] = useState(null);
  const estateActions = useMemo(() => estatePlan ? E.estateActionPlan(plan, estatePlan) : [], [plan, estatePlan]);
  const [estateError, setEstateError] = useState('');
  const handleOptimizeEstate = () => {
    setEstateError('');
    try {
      const r = E.optimizeInheritance(plan);
      if (!r) { setEstateError('Add at least one person under Who inherits on the Inheritance tab first — there is nothing to rank without an heir.'); setEstatePlan(null); return; }
      setEstatePlan(r);
    } catch (err) {
      setEstateError(String(err && err.message ? err.message : err));
      setEstatePlan(null);
    }
  };
  const applyEstatePlan = () => {
    if (!estatePlan) return;
    const b = estatePlan.best;
    setPlan(prev => {
      const inh = prev.inheritance || {};
      return {
        ...prev,
        spending: { ...(prev.spending || {}), decumulationPolicy: b.policy, drawdownStrategy: b.drawdown },
        config: { ...(prev.config || {}), harvestPersonalAllowance: b.harvest, harvestCeiling: b.ceiling || 'pa' },
        oneOffContributions: [...(prev.oneOffContributions || []), ...(b.recycle || []).map(x => ({ ...x, id: 'c_' + Math.random().toString(36).slice(2) }))],
        inheritance: {
          ...inh,
          gifts: b.gift > 0
            ? [...(inh.gifts || []), { id: 'gift_' + Date.now(), amount: Math.round(b.gift), year: estatePlan.giftYear, desc: 'Gift (estate plan)' }]
            : inh.gifts,
          beneficiaries: b.split
            ? E.normalizeBeneficiaries(inh.beneficiaries).map((x, i) => ({ ...x, pensionSharePct: b.split[i] }))
            : inh.beneficiaries
        }
      };
    });
  };

  const handleFindBestPolicy = async () => {
    setIsPolicySearching(true); setPolicyResults(null);
    setPolicyProgress({ label: 'Preparing policy combinations…', value: 0 });
    await tick();
    try {
      const candidates = E.buildPolicyCandidates(plan);
      const out = [];
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const label = policyRowLabel(c);
        setPolicyProgress({ label: `Testing ${i + 1}/${candidates.length}: ${label}`, value: i / candidates.length });
        await tick();
        // resolve MPAA per candidate: the policies differ in when taxable pension income starts
        const cctx = E.buildContext(E.resolveMpaa(c.planState));
        const stats = await runMonteCarloAsync(cctx, {
          trials: TOURNAMENT_TRIALS, seed: mcSeed,
          onProgress: (f) => setPolicyProgress({ label: `Testing ${i + 1}/${candidates.length}: ${label}`, value: (i + f) / candidates.length })
        });
        // the bequest priority ranks on this; null when nobody has been named as an heir, in which
        // case the metric falls back to the pot and says so
        stats.postTaxInheritance = E.postTaxInheritanceFor(c.planState, cctx);
        out.push({ ...c, label, stats });
      }
      // ranked against what the household said it cares about, not a fixed survival-first order
      const { winner: best, steps } = priorityMode === 'balanced'
        ? { winner: E.pickBalanced(out), steps: [] }
        : E.explainPick(out, { priorities: priorityList, tolerances: priorityTolerances });
      setPlan(prev => ({
        ...prev,
        spending: { ...(prev.spending || {}), decumulationPolicy: best.decumulationPolicy, drawdownStrategy: best.drawdownStrategy },
        config: { ...(prev.config || {}), harvestPersonalAllowance: best.harvestPersonalAllowance }
      }));
      /*
       * Order the table by the SAME priorities that chose the winner. Sorting by survival while the
       * ranking used something else would put the chosen row below rows it supposedly beat.
       */
      const rank = (c) => priorityList.map(k => {
        const m = E.PRIORITY_METRICS[k];
        return (m.higherIsBetter ? -1 : 1) * m.get(c.stats);
      });
      const rows = [...out].sort((a, b) => {
        if (a.id === best.id) return -1;
        if (b.id === best.id) return 1;
        const ra = rank(a), rb = rank(b);
        for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
        return 0;
      });
      setPolicyResults({ rows, bestId: best.id, seed: mcSeed, trials: TOURNAMENT_TRIALS, steps, priorities: priorityList });
      const decided = steps.length ? E.PRIORITY_METRICS[steps[0].key].label.toLowerCase() : 'your priorities';
      flash(`Applied "${best.label}": best of ${candidates.length} combinations for ${decided}`, 4000);
    } finally { setIsPolicySearching(false); setPolicyProgress(null); }
  };

  const displayedAccounts = isCouple ? (plan?.accounts || []) : (plan?.accounts || []).filter(a => a.owner === 'Myself');
  // enough has been entered for the rest of the app to say something meaningful
  const planStarted = E.num(plan?.spending?.targetSpend, 0) > 0
    || (plan?.accounts || []).some(a => E.num(a.balance, 0) > 0 || E.num(a.contrib, 0) > 0);
  const tabBtn = (id, Icon, label, accent = 'blue') => (
    <button key={id} onClick={() => setActiveTab(id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === id ? (accent === 'indigo' ? 'bg-surface text-indigo-600 shadow-xs' : 'bg-surface text-blue-600 shadow-xs') : 'text-slate-600 hover:text-slate-900'}`}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );
  const ageMarker = (age, label, color, fill, stroke, textColor, y, scale, shownAge = age) => (age <= effectiveMaxVisibleAge && age >= currentAge) ? (
    <g transform={`translate(${scale(age)}, 0)`}>
      <line y2={innerHeight} stroke={color} strokeWidth="1.5" strokeDasharray="4,4" />
      <rect x={-46} y={y} width={92} height={20} rx={4} fill={fill} stroke={stroke} />
      <text y={y + 14} textAnchor="middle" fill={textColor} fontSize="10" fontWeight="bold">{label} ({shownAge})</text>
    </g>
  ) : null;
  const mp = MARKER_PALETTE[theme];
  const cp = CHART_PALETTE[theme];
  const themedSeries = useMemo(() => SERIES_CONFIG.map(s => ({ ...s, color: s.colors[theme] })), [theme]);
  const markers = (scale) => (
    <>
      {ageMarker(ctx.owners[0].retireAge, 'Retire M', mp.retireSelf.line, mp.retireSelf.fill, mp.retireSelf.stroke, mp.retireSelf.text, 10, scale)}
      {isCouple && ageMarker(ctx.owners[1].retireAge + (currentAge - ctx.agePart0), 'Retire P', mp.retirePart.line, mp.retirePart.fill, mp.retirePart.stroke, mp.retirePart.text, 32, scale, ctx.owners[1].retireAge)}
      {ageMarker(nmpa, 'NMPA', mp.nmpa.line, mp.nmpa.fill, mp.nmpa.stroke, mp.nmpa.text, 54, scale)}
      {ageMarker(ctx.spa, 'State Pen', mp.statePension.line, mp.statePension.fill, mp.statePension.stroke, mp.statePension.text, 76, scale)}
    </>
  );


  const themeOptions = [
    { id: 'classic', Icon: Monitor, title: 'Classic theme (original look)' },
    { id: 'light', Icon: Sun, title: 'Riviera Ledger (light)' },
    { id: 'dark', Icon: Moon, title: 'Control Room (dark)' },
  ];

  // The sandbox, rendered once at the foot of the Projection tab, directly under the chart it edits.
  /*
   * One chart body, drawn twice: once with the rate-based band and once with the Monte Carlo range.
   *
   * They share the scales deliberately - same x, same y - so flicking between the two slides compares
   * method rather than axis. Both carry the same wrapper lines underneath, because those come from the
   * deterministic run either way; what differs is the range drawn around them, and the colour it is drawn
   * in. Each keeps its own outer 10th/90th toggle, since that is a property of the range, not the plan.
   */
  /*
   * Slide chrome. The numbered row is the map - five steps, where you are, and one click to any of them -
   * and "See all" is the escape hatch for anyone who would rather scroll than walk.
   */
  const slideHead = (n, title, sub) => (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black shrink-0">{n}</span>
          {title}
        </h2>
        <span className="text-xs text-slate-500">{sub}</span>
      </div>
    </div>
  );

  /*
   * One band control, rendered on both chart steps and driving both of them. It used to be split - a mode
   * picker on one chart and a 10th/90th checkbox in each legend - which allowed the two charts to sit on
   * different percentiles, quietly destroying the only comparison they exist to support.
   */
  const bandToggle = (
    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1 py-1 rounded-xl text-xs">
      {['quartile', 'decile'].map(k => (
        <button key={k} type="button" onClick={() => setBandMode(k)} title={`Draw both charts at the ${BAND_QUANTILES[k].lowPct} and ${BAND_QUANTILES[k].highPct} percentile`}
          className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${bandMode === k ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>{BAND_QUANTILES[k].button}</button>
      ))}
    </div>
  );

  const slideNav = (n) => (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
      <div className="flex items-center gap-1.5">
        {PROJECTION_SLIDES.map(s => (
          <button key={s.n} type="button" onClick={() => { setSeeAll(false); setSlide(s.n); }} title={s.name}
            className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${!seeAll && slide === s.n ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-surface border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'}`}>{s.n}</button>
        ))}
        <button type="button" onClick={() => setSeeAll(!seeAll)}
          className={`ml-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${seeAll ? 'bg-slate-800 text-white border-slate-800' : 'bg-surface border-slate-200 text-slate-500 hover:text-slate-900'}`}>
          {seeAll ? 'One at a time' : 'See all'}
        </button>
      </div>
      {!seeAll && (
        <div className="flex items-center gap-2">
          <button type="button" disabled={n === 1} onClick={() => setSlide(n - 1)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-surface text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">&larr; Back</button>
          <button type="button" onClick={() => { if (n < 5) setSlide(n + 1); else setSandboxRevealed(true); }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 cursor-pointer">
            {n < 5 ? <>Next: {PROJECTION_SLIDES[n].name} &rarr;</> : <>Change something &rarr;</>}
          </button>
        </div>
      )}
    </div>
  );

  const renderProjectionChart = (kind) => {
    const isRate = kind === 'rate';
    const band = isRate ? cp.rateBand : cp.fanBand;
    const edge = isRate ? cp.rateEdge : cp.fanEdge;
    return (
      <>
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none" onMouseLeave={() => setHoveredPoint(null)}>
            <g transform={`translate(${margin.left}, ${margin.top})`}>
              {yScale.ticks(isNarrow ? 5 : 6).map((t, i) => <g key={i} transform={`translate(0, ${yScale(t)})`}><line x2={innerWidth} stroke={cp.gridMajor} strokeDasharray="3,3" /><text x={-8} dy="0.32em" fill={cp.axisText} fontSize={isNarrow ? 12 : 10} textAnchor="end" fontFamily="monospace">{t >= 1000000 ? `£${(t / 1000000).toFixed(t >= 10000000 ? 0 : 1)}m` : `£${(t / 1000).toFixed(0)}k`}</text></g>)}
              {xScale.ticks(isNarrow ? 5 : 10).map((t, i) => <g key={i} transform={`translate(${xScale(t)}, 0)`}><line y2={innerHeight} stroke={cp.gridMinor} /><text y={innerHeight + 20} fill={cp.axisText} fontSize={isNarrow ? 13 : 11} textAnchor="middle" fontFamily="monospace">{t}</text></g>)}
              {markers(xScale)}
              {isRate && bandPaths && <>
                <path d={bandPaths.area} fill={band} stroke="none" />
                <path d={bandPaths.lo} fill="none" stroke={edge} strokeWidth="1.5" strokeDasharray="5,4" />
                <path d={bandPaths.hi} fill="none" stroke={edge} strokeWidth="1.5" strokeDasharray="5,4" />
              </>}
              {/* the real trials, drawing themselves out, then dissolving into the band they make up */}
              {!isRate && mcSpaghetti && (
                <g opacity={1 - mcSettle}>
                  {mcSpaghetti.map(sp => <path key={sp.id} d={sp.d} fill="none" stroke={cp.fanMedian} strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" />)}
                </g>
              )}
              {!isRate && fanPaths && (
                <g opacity={mcReveal >= 1 ? 1 : mcSettle}>
                  <path d={fanPaths.band} fill={band} stroke="none" />
                  <path d={fanPaths.edgeLo} fill="none" stroke={edge} strokeWidth="1.5" />
                  <path d={fanPaths.edgeHi} fill="none" stroke={edge} strokeWidth="1.5" />
                  <path d={fanPaths.median} fill="none" stroke={cp.fanMedian} strokeWidth="2.5" strokeLinecap="round" />
                </g>
              )}
              {themedSeries.map(s => (activeSeries[s.id] && pathGenerators[s.id]) ? <path key={s.id} d={pathGenerators[s.id]} fill="none" stroke={s.color} strokeWidth={s.strokeWidth} strokeDasharray={s.dash} strokeLinecap="round" /> : null)}
              {sandboxLinePath && <path d={sandboxLinePath} fill="none" stroke={cp.sandboxDash} strokeWidth="3.5" strokeDasharray="6,4" strokeLinecap="round" />}
              {comparePaths.map(c => <path key={c.id} d={c.d} fill="none" stroke={c.tone} strokeWidth="2.5" strokeDasharray="5,3" strokeLinecap="round" />)}
              <rect width={innerWidth} height={innerHeight} fill="transparent" onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const age = Math.round(xScale.invert((e.clientX - rect.left) * (innerWidth / Math.max(1, rect.width)))); setHoveredPoint(visibleData.find(d => d.ageSelf === age) || null); }} />
              {hoveredPoint && <g transform={`translate(${xScale(hoveredPoint.ageSelf)}, 0)`}><line y2={innerHeight} stroke={cp.hoverCrosshair} strokeWidth="1" strokeDasharray="2,2" /><circle cy={yScale(hoveredPoint.expected || 0)} r="4" fill={cp.trajectoryHoverFill} stroke={cp.hoverDotStroke} strokeWidth="2" /></g>}
            </g>
          </svg>
          {hoveredPoint && (
            <div className="absolute top-4 left-24 bg-surface/95 border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1 backdrop-blur-md pointer-events-none">
              <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 flex justify-between gap-4"><span>Age {hoveredPoint.ageSelf} ({hoveredPoint.year})</span><span className="text-slate-500">Spend: {formatGBP(hoveredPoint.targetSpend)}/yr</span></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 font-mono">
                {activeSeries.expected && <div className="text-blue-600 font-bold">Expected: {formatGBP(hoveredPoint.expected)}</div>}
                {isSandboxModified && <div className="text-amber-600 font-bold">Sandbox: {formatGBP(sandboxTimeline.find(d => d.ageSelf === hoveredPoint.ageSelf)?.totalCombined)}</div>}
                {activeSeries.pensions && <div className="text-sky-600">Pensions: {formatGBP(hoveredPoint.pensions)}</div>}
                {activeSeries.isas && <div className="text-teal-600">ISAs: {formatGBP(hoveredPoint.isas)}</div>}
                <div className="text-slate-600">Tax this year: {formatGBP(hoveredPoint.taxPaid)}</div>
                {isRate && bandData && (() => { const b = bandData.find(d => d.ageSelf === hoveredPoint.ageSelf); return b ? <div className="col-span-2 border-t border-slate-100 pt-1 mt-0.5" style={{ color: cp.rateMedianText || undefined }}>{bandSpec.highPct} {formatGBP(b.hi)} · {bandSpec.lowPct} {formatGBP(Math.max(0, b.lo))}</div> : null; })()}
                {!isRate && fanVisible && (() => { const b = fanVisible.find(d => d.ageSelf === hoveredPoint.ageSelf); return b ? <div className="col-span-2 border-t border-slate-100 pt-1 mt-0.5">75th {formatGBP(b.p75)} · median {formatGBP(b.p50)} · 25th {formatGBP(Math.max(0, b.p25))}</div> : null; })()}
                {compareRuns.filter(r => r.rows).map(r => (
                  <div key={r.id} className="font-bold truncate" style={{ color: r.tone }}>{r.name}: {formatGBP(r.rows.find(d => d.ageSelf === hoveredPoint.ageSelf)?.totalCombined)}</div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {themedSeries.map(s => (
            <button key={s.id} onClick={() => setActiveSeries(prev => ({ ...prev, [s.id]: !prev[s.id] }))} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border ${activeSeries[s.id] ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold' : 'bg-surface border-slate-200 text-slate-400 opacity-60'}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />{s.label}{activeSeries[s.id] && <Check className="w-3 h-3 text-slate-600" />}
            </button>
          ))}
          {(isSandboxModified || scenarios.filter(sc => sc.id !== activeScenarioId).length > 0) && <span className="w-px h-5 bg-slate-200 mx-1" />}
          {isSandboxModified && (
            <button type="button" onClick={() => setShowSandboxLine(v => !v)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border ${showSandboxLine ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold' : 'bg-surface border-slate-200 text-slate-400 opacity-60'}`}>
              <span className="w-3.5 h-0 border-t-2 border-dashed" style={{ borderColor: cp.sandboxDash }} />Sandbox{showSandboxLine && <Check className="w-3 h-3 text-amber-700" />}
            </button>
          )}
          {scenarios.filter(sc => sc.id !== activeScenarioId).map(sc => {
            const run = compareRuns.find(r => r.id === sc.id);
            const atCap = !run && selectedCompare.length >= MAX_COMPARE;
            return (
              <button key={sc.id} type="button" disabled={atCap} onClick={() => toggleCompare(sc.id)} title={atCap ? `Up to ${MAX_COMPARE} scenarios at once` : sc.name}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all border max-w-[14rem] ${run ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold cursor-pointer' : atCap ? 'bg-surface border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-surface border-slate-200 text-slate-400 opacity-70 cursor-pointer hover:opacity-100'}`}>
                <span className="w-3.5 h-0 border-t-2 border-dashed shrink-0" style={{ borderColor: run ? run.tone : 'currentColor' }} />
                <span className="truncate">{sc.name}</span>{run && <Check className="w-3 h-3 text-slate-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderSandboxPanel = () => {
    const open = sandboxOpen;
    return (
    <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-5">
      <div className={open ? 'pb-3 border-b border-slate-100' : ''}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Sandbox</h3>
            <p className="text-xs text-slate-500 mt-0.5">Change balances, contributions, escalation or retirement age here and the projection follows, without touching your saved plan inputs.</p>
          </div>
          <button type="button" onClick={() => setSandboxOpen(o => !o)} className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {open ? 'Hide' : isSandboxModified ? 'Show (edited)' : 'Show'}
          </button>
        </div>
      </div>
      {!open ? null : <>
      {isSandboxModified && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
          <span>Adjusted sandbox line now visible in chart projections above. Apply it to Plan Inputs to keep it, or save it there as a scenario.</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-3 border-y border-slate-100">
        <div><h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Wrapper Sandbox Controls</h4><span className="text-[11px] text-slate-500">Adjust retirement ages and individual wrappers below, or reset back to your baseline plan inputs.</span></div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleResetSandbox} disabled={!isSandboxModified} className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${isSandboxModified ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer' : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'}`}><RotateCcw className="w-3.5 h-3.5" /> Reset Sandbox</button>
          <button onClick={handleApplySandboxToPlan} disabled={!isSandboxModified} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${isSandboxModified ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 dark:from-[#C77A2E] dark:to-[#B0631E] dark:hover:from-[#B0631E] dark:hover:to-[#8A4C17] text-white cursor-pointer active:scale-95' : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'}`}><Check className="w-3.5 h-3.5" /> Apply to Plan Inputs</button>
        </div>
      </div>
      <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Users className="w-4 h-4 text-slate-500" />
          <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Retirement Age</h5>
          <span className="text-[11px] text-slate-500">Contributions stop and drawdown begins at this age. Test retiring earlier or later.</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ctx.owners.map(o => {
            const base = sandboxRetireFromPlan(plan)[o.key];
            const val = sandboxRetire[o.key];
            const changed = val !== base;
            const yearsToGo = Math.max(0, Math.round(val - o.age0));
            return (
              <div key={o.key} className={`p-3 rounded-xl border transition-colors ${changed ? 'bg-amber-50/60 border-amber-200' : 'bg-surface border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 font-sans">{o.label}</span>
                  {changed
                    ? <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-sans text-[10px] font-bold">{base} &rarr; {val}</span>
                    : <span className="text-slate-400 font-sans text-[10px]">Base: {base}</span>}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input type="number" min="0" max="120" step="1" value={val} onFocus={handleFocus} onChange={(e) => updateSandboxRetire(o.key, e.target.value)} className="w-20 p-1.5 bg-surface border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  {[-5, -1, 1, 5].map(d => (
                    <button key={d} onClick={() => adjustSandboxRetire(o.key, d)} className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-sans font-semibold text-slate-700 cursor-pointer">{d > 0 ? '+' : ''}{d}</button>
                  ))}
                  <span className="text-[10px] text-slate-400 font-sans ml-auto">{yearsToGo > 0 ? `${yearsToGo} yr${yearsToGo === 1 ? '' : 's'} to go` : 'at/past current age'}</span>
                </div>
                {val < nmpa && <div className="text-[10px] text-amber-700 font-sans mt-1.5">Retires before pension access age {nmpa}: needs {Math.round(nmpa - val)} yr bridge from ISAs/GIA/cash.</div>}
              </div>
            );
          })}
        </div>
      </div>
      {sandboxMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-4 rounded-2xl border shadow-2xs ${sandboxMetrics.terminalDelta >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Terminal Pot Impact (@ {terminalAge})</span>{sandboxMetrics.terminalDelta >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}</div>
            <div className={`text-xl font-black font-mono mt-1 ${sandboxMetrics.terminalDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{sandboxMetrics.terminalDelta >= 0 ? '+' : ''}{formatGBP(sandboxMetrics.terminalDelta)}</div>
            <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">{formatGBP(sandboxMetrics.baseTerminal)} &rarr; {formatGBP(sandboxMetrics.sbTerminal)}</span>
          </div>
          <div className={`p-4 rounded-2xl border shadow-2xs ${sandboxMetrics.retirementDelta >= 0 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'}`}>
            <div className="flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Retirement Pot Impact</span>{sandboxMetrics.retirementDelta >= 0 ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <ArrowDownRight className="w-4 h-4 text-rose-600" />}</div>
            <div className={`text-xl font-black font-mono mt-1 ${sandboxMetrics.retirementDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{sandboxMetrics.retirementDelta >= 0 ? '+' : ''}{formatGBP(sandboxMetrics.retirementDelta)}</div>
            <span className="text-[11px] text-slate-500 block mt-0.5 font-mono">{sandboxMetrics.baseRetAge === sandboxMetrics.sbRetAge ? `At Age ${sandboxMetrics.baseRetAge}` : `Age ${sandboxMetrics.baseRetAge} → ${sandboxMetrics.sbRetAge} (each at own retirement)`}</span>
          </div>
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-2xs"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Cumulative Extra Invested</span><div className="text-xl font-bold font-mono text-slate-800 mt-1">{sandboxMetrics.cumulativeExtraCapital >= 0 ? '+' : ''}{formatGBP(sandboxMetrics.cumulativeExtraCapital)}</div><span className="text-[11px] text-slate-500 block mt-0.5">Total difference in deposits to retirement</span></div>
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-2xs"><span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Wealth Compounding Multiple</span><div className="text-xl font-bold font-mono text-indigo-700 mt-1">{sandboxMetrics.cumulativeExtraCapital !== 0 ? `${sandboxMetrics.multiplier.toFixed(2)}x` : '-'}</div><span className="text-[11px] text-slate-500 block mt-0.5">Terminal change per £1 of extra deposits</span></div>
        </div>
      )}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold font-sans"><tr><th className="p-3">Portfolio Wrapper</th>{isCouple && <th className="p-3">Owner</th>}<th className="p-3">Balance Today (£)</th><th className="p-3">Annual Contribution (£)</th><th className="p-3">Quick Adjust</th><th className="p-3">Escalation (% / yr)</th><th className="p-3 text-right">Status</th></tr></thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {displayedAccounts.map(acc => {
              const sb = sandboxAccounts[acc.id] || { contrib: acc.contrib, growth: acc.growth, balance: acc.balance };
              const isModified = E.num(acc.contrib, 0) !== E.num(sb.contrib, 0) || E.num(acc.growth, 0) !== E.num(sb.growth, 0) || (sb.balance !== undefined && E.num(sb.balance, 0) !== E.num(acc.balance, 0)) || !!sb.contribByYear;
              return (
                <tr key={acc.id} className={`transition-colors ${isModified ? 'bg-amber-50/40' : 'hover:bg-slate-50/60'}`}>
                  <td className="p-3 font-sans font-bold text-slate-800">{acc.category}<span className="block text-[10px] text-slate-400 font-normal">Base: {formatGBP(E.num(acc.contrib, 0))} / yr @ {acc.growth || 0}%{sb.balance !== undefined && E.num(sb.balance, 0) !== E.num(acc.balance, 0) ? ` · balance ${formatGBP(E.num(acc.balance, 0))} → ${formatGBP(sb.balance)}` : ''}</span></td>
                  {isCouple && <td className="p-3 font-sans text-slate-600">{acc.owner}</td>}
                  <td className="p-3"><input type="number" min="0" step="1000" value={sb.balance ?? E.num(acc.balance, 0)} onFocus={handleFocus} onChange={(e) => updateSandboxField(acc.id, 'balance', e.target.value)} className="w-32 p-1.5 bg-surface border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" /></td>
                  <td className="p-3"><div className="flex items-center gap-1.5"><input type="number" min="0" step="250" value={sb.contrib} onFocus={handleFocus} onChange={(e) => updateSandboxField(acc.id, 'contrib', e.target.value)} className="w-28 p-1.5 bg-surface border border-slate-300 rounded font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500" />{sb.contribByYear && <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-sans" title="Year-by-year schedule from a phased strategy; editing replaces it">phased</span>}</div></td>
                  <td className="p-3"><div className="flex items-center gap-1">{[-1000, -500, 500, 1000].map(d => <button key={d} onClick={() => adjustSandboxContrib(acc.id, d)} className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-sans font-semibold text-slate-700 cursor-pointer">{d > 0 ? '+' : ''}{Math.abs(d) >= 1000 ? `${d / 1000}k` : d}</button>)}</div></td>
                  <td className="p-3"><div className="flex items-center gap-1.5"><input type="number" step="0.5" value={sb.growth} onFocus={handleFocus} onChange={(e) => updateSandboxField(acc.id, 'growth', e.target.value)} className="w-20 p-1.5 bg-surface border border-slate-300 rounded text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500" /><span className="text-slate-400 font-sans">%</span></div></td>
                  <td className="p-3 text-right">{isModified ? <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-sans text-[10px] font-bold">Adjusted</span> : <span className="text-slate-400 font-sans text-[10px]">Unchanged</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>}
    </div>
    );
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="bg-surface border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100"><TrendingUp className="w-5 h-5" /></div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display italic">Monte-Carlo Retirement Planner</h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-100">{APP_VERSION}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                UK multi-wrapper drawdown model, Monte Carlo &amp; historical backtesting. <strong className="text-slate-700 font-semibold">For educational &amp; illustrative purposes only. This is not financial advice.</strong> Please complete <span className="font-semibold text-blue-700">Plan Inputs</span> first; Config changes are optional.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* data-tabbar keeps these clickable while the in-app editor is on, so you can still move
                  between tabs while editing; Alt-click edits a tab's own label. */}
              <div data-tabbar className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 flex-wrap">
                {tabBtn('home', Home, 'Start Here')}
                {tabBtn('inputs', Sliders, 'Plan Inputs')}
                {tabBtn('config', Settings, 'Config & Assumptions')}
                {tabBtn('projection', Layers, 'Projection')}
                {tabBtn('strategy', Zap, 'Strategy', 'indigo')}
                {tabBtn('inheritance', Gift, 'Inheritance', 'indigo')}
                {tabBtn('historical', History, 'Historical Backtest', 'indigo')}
                {tabBtn('audit', Table, 'Audit Data Table')}
                {tabBtn('docs', BookOpen, 'Documentation')}
              </div>
              <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                {themeOptions.map(({ id, Icon, title }) => (
                  <button key={id} type="button" onClick={() => setTheme(id)} title={title}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === id ? 'bg-surface text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-px bg-indigo-600/60 mt-4" />
          <div className="h-px bg-indigo-600/25 mt-[3px]" />
        </div>

        {/* Scenario Toolbar. Plan Inputs only: saving a scenario means saving THE PLAN, so it belongs
            beside the plan, not floating over a chart where it reads as saving what is on screen. */}
        {activeTab === 'inputs' && (
        <div className="bg-surface border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><Bookmark className="w-4 h-4 text-blue-600" /><span>Active Scenario:</span></div>
            <div className="flex items-center gap-1.5">
              <select value={activeScenarioId} onChange={(e) => handleSelectScenario(e.target.value)} className="p-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {scenarios.length > 1 && (
                <button onClick={() => handleDeleteScenario(activeScenarioId)} title="Delete this scenario" className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer rounded-lg hover:bg-rose-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <input type="text" placeholder="Scenario name (optional)" value={scenarioNameInput} onChange={(e) => setScenarioNameInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveScenario(); }} className="p-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56" />
            <button onClick={handleSaveScenario} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"><Save className="w-3.5 h-3.5" /> Save</button>
            <button onClick={handleSaveAsNewScenario} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"><Plus className="w-3.5 h-3.5 text-slate-600" /> Save as New Scenario</button>
            {saveSuccessMsg && <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200"><Check className="w-3 h-3 text-emerald-600" /> {saveSuccessMsg}</span>}
          </div>
        </div>
        )}

        {activeTab !== 'docs' && activeTab !== 'home' && <WarningsBanner warnings={ctx.warnings} />}

        {/* TAB 0: LANDING */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden bg-surface border border-slate-200/90 rounded-2xl shadow-xs">
              {/* light-touch sketches: decorative, behind the text, and out of the way on narrow screens */}
              <SketchRoulette spin className="hidden md:block absolute -right-6 -top-4 w-64 lg:w-80 text-indigo-600/[0.2] pointer-events-none" />
              <SketchCards className="hidden lg:block absolute right-64 top-16 w-40 text-amber-600/[0.16] pointer-events-none rotate-6" />
              <div className="relative p-6 sm:p-8 max-w-2xl space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">His Majesty's Royal Casino presents</span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display italic leading-tight">
                  Test your portfolio against the casino of life!
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This model runs your pensions, ISAs, GIA and cash through {MC_TRIALS.toLocaleString()} different
                  market histories, taxes every withdrawal under UK rules, and tells you how often the plan actually holds, not just how it looks
                  on a good day.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button type="button" onClick={() => setActiveTab('inputs')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95">
                    <Sliders className="w-3.5 h-3.5" /> {planStarted ? 'Back to Plan Inputs' : 'Start with Plan Inputs'}
                  </button>
                  <button type="button" onClick={() => setActiveTab('docs')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
                    <BookOpen className="w-3.5 h-3.5" /> Read the methodology
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  <strong className="text-slate-700 font-semibold">Educational and illustrative only. This is not financial advice.</strong> Everything
                  is stated in today&rsquo;s money, and your plan is saved in this browser only.
                </p>
              </div>
            </div>

            {/* what each tab does */}
            <div className="bg-surface border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">What each tab is for</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Click any card to go there. Plan Inputs is the only tab you have to fill in. Everything else reads from what you entered there.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { tab: 'inputs', Icon: Sliders, name: 'Plan Inputs', accent: 'blue', need: 'Required',
                    body: 'Who you are, when you stop working, what you spend, and what each wrapper holds. One-off costs and deposits live here too. Choose Advanced inputs if either of you is self-employed.' },
                  { tab: 'config', Icon: Settings, name: 'Config & Assumptions', accent: 'blue', need: 'Optional',
                    body: 'Tax rates, allowances, return and volatility assumptions, drawdown policy and the random seed. Defaults are current-year figures, so change them to test a different assumption, not because the tab exists.' },
                  { tab: 'projection', Icon: Layers, name: 'Projection', accent: 'blue',
                    body: `Your plan year by year on one chart: the expected path, a modelled range that updates as you type, and the ${MC_TRIALS.toLocaleString()}-path simulation with its survival rate and safe-spend solver. The sandbox for testing a different contribution or retirement age lives here too.` },
                  { tab: 'strategy', Icon: Zap, name: 'Strategy', accent: 'indigo',
                    body: 'The tournament: holds your spending and budget fixed and re-splits the money between wrappers, scoring each strategy on identical market paths.' },
                  { tab: 'inheritance', Icon: Gift, name: 'Inheritance', accent: 'indigo',
                    need: 'What your heirs actually receive, which is not the pot you leave.',
                    body: 'From 2027 an unused pension counts towards inheritance tax, and if you die at 75 or over your heirs pay their own income tax on it too. Says what reaches them, and how much it depends on when you die and who they are.' },
                  { tab: 'historical', Icon: History, name: 'Historical Backtest', accent: 'indigo',
                    body: `Replays real returns from ${E.HISTORICAL_FIRST_YEAR} onwards through your plan. A reality check on the random draws: sequences like 1973 or 2000 actually happened.` },
                  { tab: 'audit', Icon: Table, name: 'Audit Data Table', accent: 'blue',
                    body: 'Every projected year as raw numbers (balances, drawdown, tax paid), so you can check the arithmetic rather than trust the charts.' },
                  { tab: 'docs', Icon: BookOpen, name: 'Documentation', accent: 'blue',
                    body: 'How each calculation works, which modelling decisions were made and why, and what is not modelled yet, plainly stated.' }
                ].map(t => (
                  <button key={t.tab} type="button" onClick={() => setActiveTab(t.tab)}
                    className="text-left p-3.5 rounded-xl border border-slate-200 bg-surface hover:border-indigo-200 hover:bg-slate-50 transition-colors cursor-pointer group flex flex-col gap-1.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <t.Icon className={`w-4 h-4 shrink-0 ${t.accent === 'indigo' ? 'text-indigo-600' : 'text-blue-600'}`} />
                      <strong className="text-xs font-bold text-slate-900 group-hover:text-indigo-700">{t.name}</strong>
                      {t.need && <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${t.need === 'Required' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>{t.need}</span>}
                    </span>
                    <span className="text-[11px] text-slate-600 leading-relaxed">{t.body}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* honesty note */}
            <div className="relative overflow-hidden bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <SketchCards className="hidden sm:block absolute -right-3 -bottom-8 w-44 text-slate-500/[0.12] pointer-events-none -rotate-6" />
              <div className="relative max-w-2xl space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4 text-slate-500" /> What this model will not tell you</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  It covers UK income tax and its personal-allowance taper, including the Scottish and Welsh bands, National Insurance for
                  employees and the self-employed, the annual allowance with taper and carry-forward, the MPAA, ISA limits, realisation-based
                  CGT, the {Math.round(P.pclsProp * 100)}% tax-free element and the pre-SIPP access bridge. It does <em>not</em> cover
                  inheritance tax on the wider estate, defined benefit accrual, or care costs.
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Assumption and gap is listed below. Weigh accordingly.
                </p>
                <button type="button" onClick={() => goToDoc('doc-coverage')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer pt-0.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Modelling decisions, coverage and known gaps &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: PLAN INPUTS */}
        {activeTab === 'inputs' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">User Inputs &amp; Wrapper Portfolios</h2>
                <p className="text-xs text-slate-500">Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Tab</kbd> to move between fields. All amounts are in today's money (real terms).</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportJSON} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"><Download className="w-3.5 h-3.5" /> Export JSON</button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"><Upload className="w-3.5 h-3.5" /> Import JSON</button>
                {/* No `accept` filter, deliberately. Android's document picker matches on MIME type rather
                    than extension, and the providers behind it report .json as anything from
                    application/json to text/plain to application/octet-stream - so an extension filter
                    greys the file out and the user cannot select their own export at all. The handler
                    validates the contents and says so plainly if they are wrong, which is the check that
                    actually protects anything; the picker filter was only ever a hint. */}
                <input type="file" ref={fileInputRef} onChange={handleImportJSON} className="hidden" />
                <button onClick={handleResetDefaults} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"><RotateCcw className="w-3.5 h-3.5" /> Clear All Inputs</button>
              </div>
            </div>

            {/* Demographics & Targets */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> 1. Demographics, Salaries &amp; Retirement Targets</h3>
                  <span className="text-xs text-slate-500">Choose whether this plan is for an individual or a couple.</span>
                </div>
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  <button type="button" onClick={() => updateDemographics('planningMode', 'single')} className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${!isCouple ? 'bg-surface text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Single</button>
                  <button type="button" onClick={() => updateDemographics('planningMode', 'couple')} className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${isCouple ? 'bg-surface text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>With Partner</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div><label className="text-slate-600 font-semibold block mb-1">Current Age (Myself)</label><input type="number" min="0" max="120" placeholder="e.g. 40" onFocus={handleFocus} value={plan?.demographics?.currentAgeSelf ?? ''} onChange={(e) => updateDemographics('currentAgeSelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">Current Age (Partner)</label><input type="number" min="0" max="120" placeholder="e.g. 40" onFocus={handleFocus} value={plan?.demographics?.currentAgePart ?? ''} onChange={(e) => updateDemographics('currentAgePart', e.target.value)} className={inputCls} /></div>}
                <div><label className="text-slate-600 font-semibold block mb-1">Retirement Age (Myself)</label><input type="number" min="0" max="120" placeholder="e.g. 60" onFocus={handleFocus} value={plan?.demographics?.retireAgeSelf ?? ''} onChange={(e) => updateDemographics('retireAgeSelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">Retirement Age (Partner)</label><input type="number" min="0" max="120" placeholder="e.g. 60" onFocus={handleFocus} value={plan?.demographics?.retireAgePart ?? ''} onChange={(e) => updateDemographics('retireAgePart', e.target.value)} className={inputCls} /></div>}
                <div><label className="text-slate-600 font-semibold block mb-1">{plan?.demographics?.employmentSelf === 'self-employed' ? 'Annual Profit: self-employment (Myself £/yr)' : 'Gross Salary (Myself £/yr)'}</label><input type="number" min="0" step="1000" placeholder="for tax relief & bridging" onFocus={handleFocus} value={plan?.demographics?.salarySelf ?? ''} onChange={(e) => updateDemographics('salarySelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">{plan?.demographics?.employmentPart === 'self-employed' ? 'Annual Profit: self-employment (Partner £/yr)' : 'Gross Salary (Partner £/yr)'}</label><input type="number" min="0" step="1000" placeholder="for tax relief & bridging" onFocus={handleFocus} value={plan?.demographics?.salaryPart ?? ''} onChange={(e) => updateDemographics('salaryPart', e.target.value)} className={inputCls} /></div>}
                <div><label className="text-slate-600 font-semibold block mb-1">Expected State Pension (Myself £/yr)</label><input type="number" min="0" step="250" placeholder="e.g. 11500" onFocus={handleFocus} value={plan?.demographics?.statePensionSelf ?? ''} onChange={(e) => updateDemographics('statePensionSelf', e.target.value)} className={inputCls} /></div>
                {isCouple && <div><label className="text-slate-600 font-semibold block mb-1">Expected State Pension (Partner £/yr)</label><input type="number" min="0" step="250" placeholder="e.g. 11500" onFocus={handleFocus} value={plan?.demographics?.statePensionPart ?? ''} onChange={(e) => updateDemographics('statePensionPart', e.target.value)} className={inputCls} /></div>}
                <div className="sm:col-span-2">
                  <label className="text-slate-600 font-semibold block mb-1">{isCouple ? 'Joint Net Living Spend (£/yr)' : 'Net Living Spend (£/yr)'}</label>
                  <input type="number" min="0" step="1000" placeholder="e.g. 30000" onFocus={handleFocus} value={plan?.spending?.targetSpend ?? ''} onChange={(e) => updateSpending('targetSpend', e.target.value)} className={inputCls} />
                  <span className="text-[10px] text-slate-400 mt-1 block">Drawn from the first retirement. A partner still working offsets it with their take-home pay when a salary is entered.</span>
                </div>
                <div><label className="text-slate-600 font-semibold block mb-1">Plan to Age</label><input type="number" min="1" max="120" placeholder="100" onFocus={handleFocus} value={plan?.demographics?.terminalAge ?? ''} onChange={(e) => updateDemographics('terminalAge', e.target.value)} className={inputCls} /></div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Minimum pot at age {terminalAge} (£)</label>
                  <input type="number" min="0" step="5000" placeholder="0" onFocus={handleFocus} value={plan?.config?.solvencyFloor ?? ''} onChange={(e) => updateConfig('solvencyFloor', e.target.value)} className={`${inputCls} text-amber-700`} />
                  <span className="text-[10px] text-slate-400 mt-1 block">Bequest floor in today's money, tested at the terminal age only. The whole projection is in real terms, so £100,000 here means £100,000 of today's purchasing power. There is no need to gross it up for inflation.</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{isCouple ? 'Joint Net Living Spend' : 'Net Living Spend'} by age (optional)</span>
                  <button onClick={addSpendBand} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"><Plus className="w-3.5 h-3.5" /> Add Band</button>
                </div>
                <p className="text-[11px] text-slate-500 mb-2 max-w-3xl">
                  Set what a stretch of years actually costs, in today's money, instead of one figure for the whole
                  retirement. Ages are &quot;Myself&quot; ages. Any year you do not cover falls back to the {isCouple ? 'joint ' : ''}living
                  spend above, so you can name only the years that differ. Spending can rise as well as fall.
                </p>
                {(plan?.spending?.spendBands || []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    No bands set, so {formatGBP(E.num(plan?.spending?.targetSpend, 0))}/yr applies for the whole retirement.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(plan.spending.spendBands || []).map(band => {
                      const from = E.num(band.fromAge, NaN);
                      const to = E.isBlank(band.toAge) ? terminalAge : E.num(band.toAge, NaN);
                      const badRange = Number.isFinite(from) && Number.isFinite(to) && to < from;
                      const yrs = (Number.isFinite(from) && Number.isFinite(to) && !badRange) ? (to - from + 1) : null;
                      return (
                        <div key={band.id} className={`grid grid-cols-1 sm:grid-cols-4 gap-2 p-2.5 border rounded-xl text-xs items-center ${badRange ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500">Age</span>
                            <input type="number" min="0" max="120" placeholder="From" onFocus={handleFocus} value={band.fromAge}
                              onChange={(e) => updateSpendBand(band.id, { fromAge: parseInputNumber(e.target.value) })}
                              className="w-14 p-1 bg-surface border border-slate-300 rounded font-mono text-center font-bold" />
                            <span className="text-slate-400">to</span>
                            <input type="number" min="0" max="120" placeholder={String(terminalAge)} onFocus={handleFocus} value={band.toAge}
                              onChange={(e) => updateSpendBand(band.id, { toAge: parseInputNumber(e.target.value) })}
                              className="w-14 p-1 bg-surface border border-slate-300 rounded font-mono text-center font-bold" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">Spend</span>
                            <input type="number" min="0" step="1000" placeholder="£/yr" onFocus={handleFocus} value={band.amount}
                              onChange={(e) => updateSpendBand(band.id, { amount: parseInputNumber(e.target.value) })}
                              className="w-28 p-1.5 bg-surface border border-slate-300 rounded font-mono text-blue-700 font-bold" />
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

              {/* Advanced: optional figures most plans can leave blank */}
              <div className="pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdvanced(v => !v)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <Settings className="w-3.5 h-3.5" /> Advanced inputs {showAdvanced ? '▾' : '▸'}
                  <span className="font-normal normal-case tracking-normal text-slate-400">(optional; sensible defaults are assumed if left blank)</span>
                </button>
                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs mt-3">
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Cash buffer kept from surplus income (months)</label>
                      <input type="number" min="0" step="1" placeholder="6" onFocus={handleFocus} value={plan?.config?.cashBufferMonths ?? ''} onChange={(e) => updateConfig('cashBufferMonths', e.target.value)} className={inputCls} />
                      <span className="text-[10px] text-slate-400 mt-1 block">Months of spending held back in cash before surplus income is swept into the ISA.</span>
                    </div>
                    {ctx.owners.map(o => {
                      const field = o.key === 'self' ? 'employmentSelf' : 'employmentPart';
                      const isSE = plan?.demographics?.[field] === 'self-employed';
                      return (
                        <div key={`emp_${o.key}`}>
                          <label className="text-slate-600 font-semibold block mb-1">Employment type ({o.label})</label>
                          <select value={isSE ? 'self-employed' : 'employed'} onChange={(e) => updateDemographics(field, e.target.value)} className={`${inputCls} cursor-pointer`}>
                            <option value="employed">Employed (Class 1 NIC, salary sacrifice)</option>
                            <option value="self-employed">Self-employed (Class 4 NIC, relief at source)</option>
                          </select>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {isSE
                              ? `The salary box above is read as annual trading profit. Pension contributions get income tax relief only, with no NIC saving${P.erPass > 0 ? ', and the employer NIC pass-through in Config does not apply' : ''}.`
                              : 'Pension contributions are priced as salary sacrifice: income tax and employee NIC relief.'}
                          </span>
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
                            Default is 0, meaning pay rises with inflation. The projection is in today's money, so 0 holds
                            {isSE ? ' profit' : ' pay'} flat in real terms rather than freezing it in cash terms. Enter 1 for a
                            1% real rise a year; a negative figure winds earnings down.
                            {rate !== 0 && ` At ${rate}%, ${formatGBP(o.salary)} today is worth ${formatGBP(o.salary * Math.pow(1 + rate / 100, Math.max(0, o.retireAge - o.age0)))} in today's money at retirement.`}
                          </span>
                        </div>
                      );
                    })}
                    {ctx.owners.map(o => (
                      <div key={`cf_${o.key}`}>
                        <label className="text-slate-600 font-semibold block mb-1">Pension allowance carried forward ({o.label} £)</label>
                        <input type="number" min="0" step="1000" placeholder="blank = £0" onFocus={handleFocus}
                          value={plan?.demographics?.[o.key === 'self' ? 'cfBroughtForwardSelf' : 'cfBroughtForwardPart'] ?? ''}
                          onChange={(e) => updateDemographics(o.key === 'self' ? 'cfBroughtForwardSelf' : 'cfBroughtForwardPart', e.target.value)} className={inputCls} />
                        <span className="text-[10px] text-slate-400 mt-1 block">Unused annual allowance from the last three tax years. Cannot be used once a pension is flexibly accessed, and never lifts the earnings limit.</span>
                      </div>
                    ))}
                    {P.cgtEnabled && ctx.owners.map(o => (
                      <div key={`cg_${o.key}`}>
                        <label className="text-slate-600 font-semibold block mb-1">Capital gains already used ({o.label} £)</label>
                        <input type="number" min="0" step="500" placeholder="blank = full allowance" onFocus={handleFocus}
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
                          <input type="number" min="0" step="500" placeholder="blank = balance is all cost" onFocus={handleFocus}
                            value={acc?.unrealisedGain ?? ''} onChange={(e) => updateAccountField(o.ids.other, 'unrealisedGain', e.target.value)} className={inputCls} />
                          <span className="text-[10px] text-slate-400 mt-1 block">How much of today's GIA balance is profit. Left blank, only future growth is taxed, which understates CGT on long-held holdings.</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Balances & Contributions */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4 overflow-x-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-600" /> 2. Current Balances, Annual Contributions &amp; Risk Profiles</h3>
                <button type="button" onClick={() => goToDoc('doc-risk-profiles')} className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"><HelpCircle className="w-3.5 h-3.5" /> Guide to investment allocations &amp; fund types &rarr;</button>
              </div>
              <p className="text-[11px] text-slate-500">Pension contributions are gross (including tax relief and employer amounts); ISA, GIA and cash contributions are net. Contributions stop at each owner's retirement age. Allowances: ISA £{P.isaAllowance.toLocaleString()}, pension £{P.pensionAllowance.toLocaleString()} per person (Config).</p>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="pb-2">Account Wrapper</th>{isCouple && <th className="pb-2">Owner</th>}<th className="pb-2">Balance Today (£)</th><th className="pb-2">Annual Contribution (£)</th><th className="pb-2">Contrib Growth (%/yr)</th><th className="pb-2">Asset Allocation (Risk Tier)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {displayedAccounts.map(acc => {
                    const over = (acc.id.startsWith('isa') && E.num(acc.contrib, 0) > P.isaAllowance) || (acc.id.startsWith('pen') && E.num(acc.contrib, 0) > P.pensionAllowance);
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 font-sans font-bold text-slate-800">{acc.category}{Array.isArray(acc.contribByYear) && <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-normal">phased schedule</span>}</td>
                        {isCouple && <td className="py-2.5 font-sans text-slate-500">{acc.owner}</td>}
                        <td className="py-2.5"><input type="number" min="0" step="500" placeholder="0" onFocus={handleFocus} value={acc.balance} onChange={(e) => updateAccountField(acc.id, 'balance', e.target.value)} className="w-32 p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-slate-900 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none" /></td>
                        <td className="py-2.5"><input type="number" min="0" step="250" placeholder="0" onFocus={handleFocus} value={acc.contrib} onChange={(e) => { updateAccountField(acc.id, 'contrib', e.target.value); if (acc.contribByYear) setPlan(prev => ({ ...prev, accounts: prev.accounts.map(a => a.id === acc.id ? { ...a, contribByYear: undefined } : a) })); }} className={`w-28 p-1.5 bg-slate-50 border rounded text-slate-800 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none ${over ? 'border-rose-400 text-rose-700' : 'border-slate-300'}`} title={over ? 'Exceeds the annual allowance set in Config' : ''} /></td>
                        <td className="py-2.5"><input type="number" step="0.5" placeholder="0" onFocus={handleFocus} value={acc.growth} onChange={(e) => updateAccountField(acc.id, 'growth', e.target.value)} className="w-20 p-1.5 bg-slate-50 border border-slate-300 rounded text-slate-800 focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none" /></td>
                        <td className="py-2.5">
                          <select value={acc.risk} onChange={(e) => updateAccountField(acc.id, 'risk', e.target.value)} className="p-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-blue-700 font-semibold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                            {Object.keys(activeRiskMatrix).map(rk => <option key={rk} value={rk}>{activeRiskMatrix[rk].label || rk}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Other income */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2"><Coins className="w-4 h-4 text-blue-600" /> 3. Expected Other Income Streams (e.g. Defined Benefit Pensions, Part-time work, Rental income)</h3>
                  <span className="text-[11px] text-slate-500">Taxable streams count towards the personal allowance and tax bands; tax-free streams directly reduce net drawdown demand. Blank end age = plan end.</span>
                  <ul className="list-disc pl-4 text-[11px] text-slate-500 mt-1 leading-relaxed max-w-3xl space-y-0.5">
                    <li><strong>Earnings</strong> (employment / self-employment) are taxed <em>and</em> count as relevant UK earnings, so they raise how much you can pay into a pension that year.</li>
                    <li><strong>Other taxable income</strong> (DB pensions, annuities, rent, dividends, interest) is taxed at income-tax rates but does <strong>not</strong> support pension contributions.</li>
                    <li><strong>Tax-free income</strong> is neither taxed nor counted.</li>
                  </ul>
                  <span className="text-[11px] text-slate-500 mt-1 block">With no relevant earnings the pension limit is {formatGBP(P.pensionNoEarningsLimit)}/yr.</span>
                </div>
                <button onClick={addOtherIncome} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"><Plus className="w-3.5 h-3.5" /> Add Stream</button>
              </div>
              {(plan?.otherIncomes || []).length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 border border-slate-200 rounded-xl">No additional income streams registered.</div>
              ) : (
                <div className="space-y-2">
                  {plan.otherIncomes.map(inc => (
                    <div key={inc.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs items-center">
                      <input type="text" onFocus={handleFocus} value={inc.name} onChange={(e) => updateListItem('otherIncomes', inc.id, { name: e.target.value })} className="p-1.5 bg-surface border border-slate-300 rounded font-bold text-slate-800 sm:col-span-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Description" />
                      {isCouple ? (
                        <select value={inc.owner} onChange={(e) => updateListItem('otherIncomes', inc.id, { owner: e.target.value })} className="p-1.5 bg-surface border border-slate-300 rounded text-slate-700"><option value="Myself">Myself</option><option value="Partner">Partner</option></select>
                      ) : <div className="p-1.5 text-slate-500 font-semibold">Myself</div>}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Age</span>
                        <input type="number" min="0" max="120" placeholder="Start" onFocus={handleFocus} value={inc.startAge} onChange={(e) => updateListItem('otherIncomes', inc.id, { startAge: parseInputNumber(e.target.value) })} className="w-12 p-1 bg-surface border border-slate-300 rounded font-mono text-center font-bold" />
                        <span className="text-slate-400">to</span>
                        <input type="number" min="0" max="120" placeholder="End" onFocus={handleFocus} value={inc.endAge} onChange={(e) => updateListItem('otherIncomes', inc.id, { endAge: parseInputNumber(e.target.value) })} className="w-12 p-1 bg-surface border border-slate-300 rounded font-mono text-center font-bold" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" step="500" placeholder="£/yr" onFocus={handleFocus} value={inc.amount} onChange={(e) => updateListItem('otherIncomes', inc.id, { amount: parseInputNumber(e.target.value) })} className="w-24 p-1.5 bg-surface border border-slate-300 rounded font-mono text-emerald-700 font-bold" />
                        <select value={inc.incomeType} onChange={(e) => updateListItem('otherIncomes', inc.id, { incomeType: e.target.value })} className="p-1.5 bg-surface border border-slate-300 rounded text-xs font-semibold text-amber-700" title="Drives both income tax and whether this counts as relevant earnings for pension contributions">
                          {Object.keys(E.INCOME_TYPES).map(k => <option key={k} value={k}>{E.INCOME_TYPES[k].label}</option>)}
                        </select>
                      </div>
                      <div className="flex justify-end"><button onClick={() => deleteOtherIncome(inc.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* One-offs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> 4. One-Off Deposits (by Wrapper)</h3>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Lump sums into a chosen wrapper. Anything above that year's allowance is parked in Other Investments and fed in over later years.</span>
                    <button type="button" onClick={() => goToDoc('doc-one-off-deposits')} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer mt-0.5"><HelpCircle className="w-3.5 h-3.5" /> How one-off deposits &amp; multi-year staging work &rarr;</button>
                  </div>
                  <button onClick={addOneOffContrib} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200 self-start sm:self-auto"><Plus className="w-3.5 h-3.5" /> Add Lump Sum</button>
                </div>
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm"><Info className="w-4 h-4 text-indigo-600" /> Annual Allowance Headroom: {ctx.baseYear} tax year</div>
                  {ctx.owners.map(o => (
                    <div key={o.key} className="flex flex-wrap gap-x-4">
                      <span className="font-semibold">{o.label}:</span>
                      <span>S&amp;S ISA remaining <strong>{formatGBP(E.wrapperHeadroomAtYear(ctx, o.key, 'isa', 0))}</strong>/yr</span>
                      <span>Pension remaining <strong>{formatGBP(E.wrapperHeadroomAtYear(ctx, o.key, 'pen', 0))}</strong>/yr</span>
                    </div>
                  ))}
                  <p className="text-slate-500 text-[11px] leading-relaxed">A one-off deposit that exceeds remaining headroom is auto-staged: the allowed amount deposits now, the rest parks in Other Investments and drip-feeds into the target wrapper as future years' allowance opens up.</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">These are <strong>this year's</strong> figures. Headroom changes in later years as regular contributions escalate, and again once contributions stop at retirement. Each deposit below shows the headroom for its own year.</p>
                </div>
                {(plan?.oneOffContributions || []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic p-3 bg-slate-50 border border-slate-200 rounded-xl">No one-off contributions scheduled.</div>
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
                      return (
                        <div key={c.id} className={`p-2.5 rounded-xl text-xs space-y-2 border ${incomplete ? 'bg-rose-50/70 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <input type="date" value={c.date || (c.year ? `${c.year}-01-01` : '')} onChange={(e) => { const d = e.target.value; updateListItem('oneOffContributions', c.id, { date: d, year: parseInt(d.slice(0, 4)) || '' }); }} className={`p-1 bg-surface border rounded font-mono text-slate-800 text-xs ${missingDate ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'}`} />
                            {isCouple ? (
                              <select value={c.owner} onChange={(e) => updateListItem('oneOffContributions', c.id, { owner: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700"><option value="Myself">Myself</option><option value="Partner">Partner</option></select>
                            ) : <span className="text-slate-500 font-semibold px-1">Myself</span>}
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-400 leading-none">Funding source: new capital or internal transfer?</span>
                              <select value={c.transferredFrom} onChange={(e) => updateListItem('oneOffContributions', c.id, { transferredFrom: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700" title="Transferred from">
                                <option value="External">External (New Capital)</option>
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
                              <select value={c.category} onChange={(e) => { const category = e.target.value; const patch = { category }; if (c.stagedTargetWrapper === c.category) patch.stagedTargetWrapper = category; updateListItem('oneOffContributions', c.id, patch); }} className={`p-1 bg-surface border rounded text-blue-700 font-semibold ${missingDest ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-300'}`}>
                                {Object.values(E.CATEGORY_LABEL).map(l => <option key={l} value={l}>{l}</option>)}
                                <option value={E.AUTO_DEPOSIT}>{E.AUTO_DEPOSIT}</option>
                              </select>
                            </div>
                            <input type="number" min="0" step="1000" placeholder="Amount (£)" onFocus={handleFocus} value={c.amount} onChange={(e) => updateListItem('oneOffContributions', c.id, { amount: parseInputNumber(e.target.value) })} className="w-24 p-1 bg-surface border border-slate-300 rounded font-mono text-emerald-700 font-bold" />
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
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans text-[10px] font-bold">Direct Deposit (£{Math.round(st.amount).toLocaleString()} within headroom)</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-sans text-[10px] font-bold">Staged (Option A): £{Math.round(st.H0).toLocaleString()} now &rarr; {destLabel}, £{Math.round(st.surplus0).toLocaleString()} parked in Other Investments</span>
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
                                <select value={c.stagedTargetWrapper} onChange={(e) => updateListItem('oneOffContributions', c.id, { stagedTargetWrapper: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700">
                                  {Object.values(E.CATEGORY_LABEL).map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                              </div>
                              <div className="space-y-0.5 text-slate-600">
                                <div>Year {c.year}: £{Math.round(st.H0).toLocaleString()} direct to {c.category} + £{Math.round(st.surplus0).toLocaleString()} parked in Other Investments</div>
                                {st.tranches.map((tr, i) => (
                                  <div key={i}>Year {tr.year}: £{Math.round(tr.amount).toLocaleString()} transferred to {c.stagedTargetWrapper}</div>
                                ))}
                                {st.unresolvedRemainder > 0 && (
                                  <div className="text-amber-700">£{Math.round(st.unresolvedRemainder).toLocaleString()} remains parked in Other Investments beyond the plan horizon.</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2"><Trash2 className="w-4 h-4 text-rose-600" /> 5. One-Off Capital Costs</h3>
                    <button type="button" onClick={() => goToDoc('doc-one-offs')} className="text-[11px] text-rose-600 hover:text-rose-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer mt-0.5"><HelpCircle className="w-3.5 h-3.5" /> How costs are liquidated from your wrappers &rarr;</button>
                  </div>
                  <button onClick={addOneOffCost} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200 self-start sm:self-auto"><Plus className="w-3.5 h-3.5" /> Add Cost</button>
                </div>
                {(plan?.oneOffCosts || []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic p-3 bg-slate-50 border border-slate-200 rounded-xl">No one-off capital expenses scheduled.</div>
                ) : (
                  <div className="space-y-2">
                    {plan.oneOffCosts.map(cost => (
                      <div key={cost.id} className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                        <input type="date" value={cost.date || (cost.year ? `${cost.year}-01-01` : '')} onChange={(e) => { const d = e.target.value; updateListItem('oneOffCosts', cost.id, { date: d, year: parseInt(d.slice(0, 4)) || '' }); }} className="p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800 text-xs" />
                        <input type="text" onFocus={handleFocus} value={cost.desc} onChange={(e) => updateListItem('oneOffCosts', cost.id, { desc: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700 flex-1" placeholder="Purpose" />
                        <input type="number" min="0" step="1000" placeholder="Amount (£)" onFocus={handleFocus} value={cost.amount} onChange={(e) => updateListItem('oneOffCosts', cost.id, { amount: parseInputNumber(e.target.value) })} className="w-24 p-1 bg-surface border border-slate-300 rounded font-mono text-rose-700 font-bold" />
                        <button onClick={() => deleteOneOffCost(cost.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONFIG */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Sliders className="w-4 h-4 text-blue-600" /> Decumulation &amp; Pension Withdrawal Methodology</h2>
                  <p className="text-xs text-slate-500 mt-1">Select how withdrawals are ordered across tax wrappers and how pensions are crystallised. <button type="button" onClick={() => goToDoc('doc-decumulation')} className="text-blue-600 hover:underline font-semibold cursor-pointer">What the evidence says &rarr;</button></p>
                </div>
                <div className="shrink-0">
                  <button type="button" onClick={handleFindBestPolicy} disabled={isPolicySearching || !policySweepReady}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 dark:from-[#2C5C8F] dark:to-[#A9781F] dark:hover:from-[#204568] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 dark:fill-[#FCD34D] dark:text-[#FCD34D]" />
                    {isPolicySearching ? 'Searching…' : '⚡ Auto-Pick Best Policy'}
                  </button>
                  {!policySweepReady && <span className="text-[10px] text-slate-400 mt-1 block text-right max-w-[15rem]">Add balances or contributions and a living spend first: with nothing to draw down, every policy scores the same.</span>}
                </div>
              </div>
              {policyProgress && <ProgressBar value={policyProgress.value} label={policyProgress.label} />}

              {/* Ranked priorities. Measured across 360 households, the objective moves the recommended
                  policy more than the choice of policies does, so this sits above the policy picker. */}
              <div className="pt-1">
                {/* Balanced sits BESIDE the list, not inside it: it is a different mechanism, not a
                    seventh priority. The list stays visible but greyed when it is on, so the switch
                    reads as "these are no longer being used in order" rather than as things vanishing. */}
                <div className="flex flex-wrap items-center gap-1 mb-2 p-0.5 bg-slate-100 rounded-lg w-fit text-[11px] font-bold">
                  {[['ranked', 'Rank my priorities'], ['balanced', 'Balance them all']].map(([m, lbl]) => (
                    <button key={m} type="button" onClick={() => updateSpending('priorityMode', m)}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${priorityMode === m ? 'bg-surface text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{lbl}</button>
                  ))}
                </div>
                {priorityMode === 'balanced' && (
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2 p-2 bg-blue-50/70 border border-blue-200 rounded-xl">
                    Every priority is weighed together rather than in order, so a modest gain in several can outweigh a small loss in one. Each is scored against the best and worst option available for your plan, which is what makes percentages and pounds comparable. The {E.MAX_SURVIVAL_SACRIFICE_PTS}-point survival limit still applies.
                  </p>
                )}
                <div className={`flex flex-wrap items-baseline justify-between gap-2 mb-1.5 ${priorityMode === 'balanced' ? 'opacity-40' : ''}`}>
                  <label className="text-slate-600 font-semibold text-xs">{priorityMode === 'balanced' ? 'Your order (not used while balancing)' : 'What matters most to you, in order'}</label>
                  <div className="flex items-center gap-3">
                    {priorityList.join() !== E.DEFAULT_PRIORITIES.join() && (
                      <button type="button" onClick={() => updateSpending('priorities', [...E.DEFAULT_PRIORITIES])} className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline font-semibold cursor-pointer">Reset to default</button>
                    )}
                    <button type="button" onClick={() => goToDoc('doc-priorities')} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer"><HelpCircle className="w-3.5 h-3.5" /> How each priority picks a policy &rarr;</button>
                  </div>
                </div>
                <ol data-priority-list className={`space-y-1.5 ${priorityMode === 'balanced' ? 'opacity-40 pointer-events-none' : ''}`}>
                  {priorityList.map((key, i) => {
                    const m = E.PRIORITY_METRICS[key];
                    return (
                      <li key={key} className={`flex items-start gap-2 p-2 rounded-xl border text-xs ${i === 0 ? 'bg-blue-50/70 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                        <span className={`shrink-0 w-5 h-5 rounded-full grid place-items-center font-bold text-[10px] ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className={`font-bold ${i === 0 ? 'text-blue-900' : 'text-slate-700'}`}>{m.label}</div>
                          <div className="text-[10px] text-slate-500 leading-snug">{m.why}</div>
                        </div>
                        <div className="flex flex-col shrink-0">
                          <button type="button" aria-label={`Move ${m.label} up`} disabled={i === 0} onClick={() => movePriority(i, -1)} className="p-0.5 text-slate-400 enabled:hover:text-blue-700 disabled:opacity-25 enabled:cursor-pointer"><ChevronUp className="w-3.5 h-3.5" /></button>
                          <button type="button" aria-label={`Move ${m.label} down`} disabled={i === priorityList.length - 1} onClick={() => movePriority(i, 1)} className="p-0.5 text-slate-400 enabled:hover:text-blue-700 disabled:opacity-25 enabled:cursor-pointer"><ChevronDown className="w-3.5 h-3.5" /></button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <span className="text-[10px] text-slate-400 mt-1.5 block">
                  Worked down in order. A lower priority only decides between options that are already within {E.RATE_EPSILON_PTS} percentage point (survival, bridge risk) or {Math.round(E.MONEY_EPSILON_REL * 100)}% (money) of the best on every priority above it — so nothing you rank higher is ever traded away for something you rank lower.
                </span>

                <details className="mt-3 text-xs">
                  <summary className="cursor-pointer text-slate-600 font-semibold hover:text-slate-900">Advanced: set your own thresholds</summary>
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      How different two options have to be on a priority before it decides between them. Leave a field blank to use the default. Smaller means that priority settles more households by itself; larger means it declares more near-ties and hands the choice down to what you ranked next.
                    </p>
                    {/* Deliberately NOT derived from the ranking. Measured: at a 0.05pt top-priority
                        threshold the lower priorities decided 14 of 40 households, against 29 of 40 at
                        1pt - so "rank it higher, tolerate less" would make everything below your first
                        choice matter less the more strongly you felt about it. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {priorityList.map((key, i) => {
                        const m = E.PRIORITY_METRICS[key];
                        const pts = m.unit === 'pts';
                        return (
                          <label key={key} className="flex items-center gap-2">
                            <span className="text-slate-500 w-5 shrink-0">{i + 1}.</span>
                            <span className="text-slate-700 flex-1 min-w-0 truncate" title={m.label}>{m.label}</span>
                            <input type="number" min="0" step={pts ? '0.25' : '1'} placeholder={pts ? String(E.RATE_EPSILON_PTS) : String(Math.round(E.MONEY_EPSILON_REL * 100))}
                              onFocus={handleFocus} value={plan?.spending?.priorityTolerances?.[key] ?? ''}
                              onChange={(e) => setTolerance(key, parseInputNumber(e.target.value))}
                              className="w-16 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800" />
                            <span className="text-[10px] text-slate-400 w-6">{pts ? 'pts' : '%'}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="text-[11px] text-slate-600"><strong>Safety limit.</strong> Whatever the order says, a recommendation is never more than <strong>{E.MAX_SURVIVAL_SACRIFICE_PTS} percentage points</strong> below the best survival available. Measured across 120 households, the worst any stated preference actually costs is 4.3 points, so this rarely binds — it exists for plans nobody thought to test.</div>
                      <div className="text-[11px] text-slate-500">Money thresholds never fall below {formatGBP(E.MONEY_EPSILON_FLOOR)}, because a percentage of a near-zero figure is a near-zero threshold, which would make that priority infinitely fussy on exactly the plans where it matters least.</div>
                    </div>
                  </div>
                </details>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Decumulation Policy</label>
                  <select value={plan?.spending?.decumulationPolicy} onChange={(e) => updateSpending('decumulationPolicy', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-blue-700 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                    {Object.entries(E.DECUMULATION_POLICIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {(E.DECUMULATION_POLICIES[plan?.spending?.decumulationPolicy]?.blurb || (() => ''))(P)}
                  </span>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Pension Drawdown Strategy</label>
                  <select value={plan?.spending?.drawdownStrategy} onChange={(e) => updateSpending('drawdownStrategy', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-blue-700 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
                    <option value="Phased Drawdown">Phased Drawdown (Ongoing {Math.round(P.pclsProp * 100)}% tax-free proportion)</option>
                    <option value="Full 25% Lump Sum">Full Lump Sum (Upfront statutory PCLS into Cash)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Phased crystallises {Math.round(P.pclsProp * 100)}% tax-free with each draw; Lump Sum moves the tax-free cash (capped at £{P.lsa.toLocaleString()}) into cash savings at retirement.</span>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Harvest unused 0% allowance</label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={!!plan?.config?.harvestPersonalAllowance} onChange={(e) => updateConfig('harvestPersonalAllowance', e.target.checked)} className="accent-blue-600" />
                    <span className="text-slate-700 font-semibold">Draw pension beyond what the year needs and re-wrap it; proceeds fill the ISA first, then the GIA.</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">Applies to the two bracket-fill policies once retired and past the access age.</span>
                  {/* How far up the bands that harvest runs. The second setting is a bequest trade, not a
                      spending one, so it is offered here rather than assumed by a policy. */}
                  <label className="text-slate-600 font-semibold block mb-1 mt-2">…and draw up to</label>
                  <select value={plan?.config?.harvestCeiling === 'basic' ? 'basic' : 'pa'} onChange={(e) => updateConfig('harvestCeiling', e.target.value)} disabled={!plan?.config?.harvestPersonalAllowance} className="w-full p-2 bg-surface border border-slate-300 rounded-lg text-slate-800 font-bold cursor-pointer disabled:opacity-50">
                    <option value="pa">the tax-free personal allowance ({formatGBP(P.pa)}) — costs nothing</option>
                    <option value="basic">the basic-rate limit ({formatGBP(P.higherRateStartsAt)}) — pays 20% now</option>
                  </select>
                  <span className="text-[10px] text-slate-400 mt-1 block">Drawing to the basic-rate limit costs 20% today and is a <strong>bequest</strong> trade: from 2027 a pension left behind is taxed twice, by your estate and again by the heir at their own rate. It wins for a later death and loses for an early one, so let the estate optimiser on the Strategy tab decide it rather than guessing.</span>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Capital gains tax on the GIA</label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={!!plan?.config?.cgtEnabled} onChange={(e) => updateConfig('cgtEnabled', e.target.checked)} className="accent-blue-600" />
                    <span className="text-slate-700 font-semibold">Tax gains realised when Other Investments are sold, using the cost basis of each holding.</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">Off treats the GIA as tax-free. Gains are wiped on death, so nothing is charged at the terminal age.</span>
                  <button type="button" onClick={() => goToDoc('doc-cgt')} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold flex items-center gap-1 cursor-pointer mt-1"><HelpCircle className="w-3.5 h-3.5" /> How capital gains are tracked &amp; taxed &rarr;</button>
                </div>
              </div>

              {/* Generated from the policy definition, never written per policy: hand-written copy drifts,
                  and instructions that describe a strategy the engine is not running are worse than none. */}
              <details className="pt-3 border-t border-slate-100" open>
                <summary className="cursor-pointer text-xs font-bold text-slate-900 uppercase tracking-wider hover:text-blue-700">How to actually follow this policy</summary>
                <ol className="mt-2 space-y-2">
                  {E.policyPlaybook(plan?.spending?.decumulationPolicy, P).map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-xs">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 grid place-items-center font-bold text-[10px] mt-0.5">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800">{step.title}</div>
                        <div className="text-slate-600 leading-relaxed">{step.body}</div>
                        {step.detail && <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.detail}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
                <span className="text-[10px] text-slate-400 mt-2 block">Written from the policy the model is actually running, so these steps and the projection can never disagree. Changing the policy above rewrites them.</span>
              </details>

              {policyResults && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-emerald-600" /> Policy search results: winner applied above</h3>
                    <span className="text-[10px] text-slate-400">{policyResults.rows.length} combinations · {policyResults.trials.toLocaleString()} paths each · seed {policyResults.seed} · ranked by your priorities, in order</span>
                  </div>
                  {/* Why THIS one won: only the priorities that actually narrowed the field. A priority
                      that never bit did not influence the answer, and claiming it did would be a story. */}
                  {policyResults.steps && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-slate-700 space-y-1">
                      {policyResults.steps.length === 0 ? (
                        <span>Every combination scored the same on all of your priorities, so the simplest setting was kept.</span>
                      ) : policyResults.steps.map((st, i) => (
                        <div key={st.key} className="flex gap-2">
                          <span className="font-bold text-blue-800 shrink-0">{i + 1}. {st.label}:</span>
                          <span>ruled out {st.ruledOut} of {st.ruledOut + st.left} remaining. {st.serves}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-1.5 pr-3">Policy combination</th><th className="pb-1.5 pr-3">Survival</th><th className="pb-1.5 pr-3">Pre-SIPP access failures</th><th className="pb-1.5 pr-3">10th %ile pot</th><th className="pb-1.5">Median pot</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {policyResults.rows.map(r => {
                          const won = r.id === policyResults.bestId;
                          return (
                            <tr key={r.id} className={won ? 'bg-emerald-50/70' : 'hover:bg-slate-50/80'}>
                              <td className={`py-1.5 pr-3 font-sans ${won ? 'font-bold text-emerald-900' : 'text-slate-700'}`}>{won && <Trophy className="w-3 h-3 text-emerald-600 inline mr-1 -mt-0.5" />}{r.label}</td>
                              <td className={`py-1.5 pr-3 font-bold ${r.stats.successRate >= 90 ? 'text-emerald-700' : r.stats.successRate >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>{r.stats.successRate.toFixed(1)}%</td>
                              <td className={`py-1.5 pr-3 ${r.stats.preNmpaFailRate > 5 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>{r.stats.preNmpaFailRate.toFixed(1)}%</td>
                              <td className="py-1.5 pr-3 text-slate-700">{fmtK(r.stats.p10Terminal)}</td>
                              <td className="py-1.5 text-slate-700">{fmtK(r.stats.medianTerminal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-400">Every combination is scored on the same market paths, so differences between rows are more reliable than each row's own sampling error. Changing any plan input invalidates these results. Re-run to refresh.</p>
                </div>
              )}
            </div>

            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Settings className="w-4 h-4 text-blue-600" /> Global Economic &amp; Calculation Configuration</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3">
                <div><label className="text-slate-600 font-semibold block mb-1">Valuation Date (Today)</label><input type="date" value={plan?.config?.valuationDate ?? ''} onChange={(e) => updateConfig('valuationDate', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Year 0 flows are pro-rated to the {(ctx.yf * 100).toFixed(0)}% of the year remaining.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Headline Inflation CPI (% pa)</label><input type="number" step="0.1" placeholder="2.5" onFocus={handleFocus} value={plan?.config?.inflation ?? ''} onChange={(e) => updateConfig('inflation', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Only used for the nominal display series.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Personal Pension Access Age (NMPA)</label><input type="number" min="0" max="120" placeholder="58" onFocus={handleFocus} value={plan?.demographics?.privatePensionAge ?? ''} onChange={(e) => updateDemographics('privatePensionAge', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Statutory NMPA is 55 today and 57 from April 2028.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">State Pension Start Age</label><input type="number" min="0" max="120" placeholder="68" onFocus={handleFocus} value={plan?.demographics?.statePensionAge ?? ''} onChange={(e) => updateDemographics('statePensionAge', e.target.value)} className={inputCls} /></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Tournament bridge safety margin (%)</label><input type="number" min="0" step="5" placeholder="30" onFocus={handleFocus} value={plan?.config?.bridgeSafetyMargin ?? ''} onChange={(e) => updateConfig('bridgeSafetyMargin', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Uplift on the pre-SIPP access reserve, assuming 0% real growth. This scales the bridge <em>target</em> upwards; the tournament's emergency buffer instead holds savings back from counting towards it.</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Pension death-tax haircut (%)</label><input type="number" min="0" max="100" step="5" placeholder="0" onFocus={handleFocus} value={plan?.config?.pensionDeathTaxRate ?? ''} onChange={(e) => updateConfig('pensionDeathTaxRate', e.target.value)} className={inputCls} /><span className="text-[10px] text-slate-400 mt-1 block">Applied to pension left at age {terminalAge} for the "net" pot figures only (IHT from April 2027 / beneficiary income tax).</span></div>
                <div><label className="text-slate-600 font-semibold block mb-1">Monte Carlo seed</label><div className="flex gap-1"><input type="number" value={mcSeed} onChange={(e) => setMcSeed(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} /><button type="button" onClick={() => setMcSeed(Math.floor(Math.random() * 1e9) + 1)} className="px-2 bg-slate-100 border border-slate-300 rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-slate-200">Reseed</button></div><span className="text-[10px] text-slate-400 mt-1 block">Same seed = same market paths (reproducible, fair comparisons).</span></div>
              </div>
            </div>

            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4 overflow-x-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Asset Allocations, Return Matrix &amp; Volatilities (σ)</h3>
                  <span className="text-[11px] text-slate-500">Expected real return is treated as the median (geometric) annual rate; Monte Carlo paths are log-normal around it with the stated σ, one market factor for all wrappers. The lucky and unlucky columns are calculated from the expected rate, σ, forecast uncertainty and your {ctx.totalYears}-year horizon, so they are not editable.</span>
                </div>
                <button onClick={() => setIsEditingRisk(!isEditingRisk)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${isEditingRisk ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}><Pencil className="w-3.5 h-3.5" />{isEditingRisk ? 'Done Editing' : 'Edit Matrix'}</button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Assumptions:</span>
                {/* The published set is what a new plan starts on now, so the house figures are labelled as
                    the fallback they became: dateless, and the thing to reach for when the CMA expires. */}
                {[['builtin', 'House figures (no expiry)', 'The planner’s own dateless figures. No forecast-uncertainty term, so the band is drawn from volatility alone.'],
                  ...Object.entries(E.CMA_PRESETS).map(([k, v]) => [k, `${v.name}${k === E.DEFAULT_RISK_SOURCE ? ' (default)' : ''}`, `${v.detail} · published ${v.published} · expires ${v.expires}`])
                ].map(([key, name, detail]) => {
                  const on = (plan?.riskSource || 'builtin') === key;
                  return (
                    <button key={key} type="button" onClick={() => applyRiskPreset(key)} title={detail}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${on ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold' : 'bg-surface border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                      {name}{on && <Check className="w-3 h-3 inline ml-1.5 -mt-0.5 text-slate-600" />}
                    </button>
                  );
                })}
                {plan?.riskSource && E.CMA_PRESETS[plan.riskSource] && (
                  <span className="text-[11px] text-slate-500">
                    {E.CMA_PRESETS[plan.riskSource].detail}. {E.CMA_PRESETS[plan.riskSource].note} Published figures are
                    nominal and are shown here deflated at your {E.num(plan?.config?.inflation, 2.5)}% inflation setting;
                    change that and these update. Expires {E.CMA_PRESETS[plan.riskSource].expires} — refresh from the
                    source after that. Editing any cell makes the table your own.
                  </span>
                )}
                {!plan?.riskSource && (
                  <span className="text-[11px] text-slate-500">Or load a published set of capital market assumptions. Every figure stays editable either way.</span>
                )}
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-2">Allocation Category</th><th className="pb-2">Expected Real Return (% pa)</th><th className="pb-2">Unlucky, 10th %ile (% pa)</th><th className="pb-2">Lucky, 90th %ile (% pa)</th><th className="pb-2">Nominal Return (% pa)</th><th className="pb-2">Annual Volatility (σ % pa)</th><th className="pb-2">Forecast Uncertainty (% pa)</th></tr></thead>
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
                            <input type="number" step={step} min={field === 'volatility' || field === 'sigmaParam' ? 0 : undefined} onFocus={handleFocus} value={val[field] ?? ''} onChange={(e) => updateRiskField(key, field, e.target.value)} className={`w-20 p-1 bg-slate-50 border border-slate-300 rounded font-mono ${color} font-bold focus:bg-surface focus:ring-1 focus:ring-blue-500`} />
                          ) : <span className={`${color} font-bold`}>{E.num(val[field], 0).toFixed(field === 'volatility' ? 1 : 2)}%</span>}
                        </td>
                      ))}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">UK Income Tax, National Insurance &amp; Pension Allowances</h3>
              <p className="text-[11px] text-slate-500">Defaults are 2025/26 (frozen to April 2028), and all thresholds are held constant in real terms.</p>
              <div className="pb-1">
                <label className="text-slate-600 font-semibold block mb-1 text-xs">Where you pay income tax</label>
                <select value={plan?.config?.taxRegion ?? 'ruk'} onChange={(e) => updateConfig('taxRegion', e.target.value)} className="w-full sm:w-80 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-blue-700 font-bold focus:bg-surface focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
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
                  ['isaAnnualAllowance', 'ISA Allowance (£/person/yr)'], ['pensionAnnualAllowance', 'Pension Annual Allowance (£/person/yr)'], ['pensionNoEarningsLimit', 'Pension Limit With No Earnings (£/person/yr)'], ['mpaaLimit', 'Money Purchase Annual Allowance (£/person/yr)'], ['pensionTaperThreshold', 'Annual Allowance Taper Threshold (£ earnings)'], ['pensionTaperRate', 'Annual Allowance Taper Rate (%)'], ['pensionTaperFloor', 'Tapered Annual Allowance Floor (£)'], ['cgtAnnualExempt', 'CGT Annual Exempt Amount (£/person/yr)'], ['cgtBasicRate', 'CGT Rate: Basic Band (%)'], ['cgtHigherRate', 'CGT Rate: Higher/Additional Band (%)']
                ].map(([field, label]) => (
                  <div key={field}><span className="text-slate-600 font-sans font-semibold block mb-1">{label}</span><input type="number" min="0" placeholder={String(E.DEFAULT_CONFIG[field])} onFocus={handleFocus} value={plan?.config?.[field] ?? ''} onChange={(e) => updateConfig(field, e.target.value)} className={smallInputCls} /></div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdvancedConfig(v => !v)} className="text-[11px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                  <Settings className="w-3.5 h-3.5" /> Advanced inputs {showAdvancedConfig ? '▾' : '▸'}
                  <span className="font-normal normal-case tracking-normal text-slate-400">(niche settings most plans leave at the default)</span>
                </button>
                {showAdvancedConfig && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono mt-3">
                    <div><span className="text-slate-600 font-sans font-semibold block mb-1">Employer NIC Passed to Pension (%)</span><input type="number" min="0" placeholder={String(E.DEFAULT_CONFIG.employerNicPassThrough)} onFocus={handleFocus} value={plan?.config?.employerNicPassThrough ?? ''} onChange={(e) => updateConfig('employerNicPassThrough', e.target.value)} className={smallInputCls} /><span className="text-[10px] text-slate-400 font-sans mt-1 block">Share of the employer's NIC saving added to a salary-sacrifice contribution.</span></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* TAB 3: TRAJECTORY & SANDBOX */}
        {/* TAB 4: PROJECTION - the deterministic path, the modelled band and the simulated fan on one chart */}
        {activeTab === 'projection' && (
          <div className="space-y-6">

            <div className="bg-surface border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Run the numbers</h3>
                  <span className="text-[11px] text-slate-500">{simResult ? 'Five steps: what your plan does, the most you could spend, the two ways of drawing the range, then both side by side.' : 'Answers arrive as they land, so the first is on screen while the rest is still working. Every figure is in today\u2019s money.'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {mcBusy && (
                    <button type="button" onClick={handleCancelMC} className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer">Stop</button>
                  )}
                  <button onClick={handleRunAll} disabled={mcBusy}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 dark:from-[#2C5C8F] dark:to-[#A9781F] dark:hover:from-[#204568] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 dark:fill-[#FCD34D] dark:text-[#FCD34D]" />
                    {isSimulating && !isOptimizing ? 'Testing…' : isOptimizing ? 'Solving…' : tournament.isEvaluating ? 'Comparing…' : '⚡ Run the numbers'}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-600 pt-2.5 border-t border-slate-100">
                <span className="text-slate-400">Tests how your current spend holds up, then solves for the most you could take instead.</span>
                <button type="button" onClick={() => setActiveTab('strategy')} className="text-slate-500 hover:text-slate-800 hover:underline font-semibold cursor-pointer">Comparing wrapper strategies lives on the Strategy tab &rarr;</button>
              </div>
              {simProgress && <div className="w-full"><ProgressBar value={simProgress.value} label={simProgress.label} /></div>}
            </div>

            {/* Nothing but the button until there is something to show. */}
            {!simResult ? (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-slate-700 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-blue-950 text-sm"><Layers className="w-4 h-4 text-blue-600" /> What you will get</div>
                <p className="leading-relaxed">Five steps. What your plan does as entered, the most you could safely spend instead, then the same range drawn two ways &mdash; compounded from the return assumptions, and read off {MC_TRIALS.toLocaleString()} randomised paths &mdash; and finally the two side by side. Every figure is in today&rsquo;s money.</p>
              </div>
            ) : (
            <>
              {isCouple && (
                <div className="bg-surface border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">Whose money:</span>
                  {['Combined', 'Myself', 'Partner'].map(pv => (
                    <button key={pv} onClick={() => setPlan(prev => ({ ...prev, activeProfileView: pv }))} className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${plan?.activeProfileView === pv ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}`}>{pv}</button>
                  ))}
                </div>
              )}

              {/* ---------------- 1. TOPLINE ---------------- */}
              {showSlide(1) && (
                <div ref={slideRef} style={{ scrollMarginTop: 12 }} className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                  {slideHead(1, 'Your plan as entered', `Spending ${formatGBP(simResult.spend)} a year to age ${terminalAge}.`)}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Survival rate</span><span className={`text-xl font-black font-mono ${simResult.successRate >= 90 ? 'text-emerald-700' : simResult.successRate >= 75 ? 'text-amber-700' : 'text-rose-700'}`}>{simResult.successRate.toFixed(1)}%</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">&plusmn;{(1.96 * simResult.standardError).toFixed(1)} pts</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Pot at retirement</span><span className="text-xl font-black font-mono text-indigo-700">{formatGBP(timelineData.find(r => r.ageSelf === ctx.owners[0].retireAge)?.totalCombined)}</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">age {ctx.owners[0].retireAge}, expected path</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Median pot @ {terminalAge}</span><span className="text-xl font-black font-mono text-blue-700">{formatGBP(simResult.medianTerminal)}</span>{ctx.pensionDeathTaxRate > 0 && <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">net of death tax {formatGBP(simResult.medianTerminalNet)}</span>}</div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Unlucky pot @ {terminalAge}</span><span className="text-xl font-black font-mono text-rose-700">{formatGBP(simResult.p10Terminal)}</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">one plan in ten ends below</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Pre-access failures</span><span className={`text-xl font-black font-mono ${simResult.preNmpaFailRate > 5 ? 'text-rose-700' : 'text-slate-700'}`}>{simResult.preNmpaFailRate.toFixed(1)}%</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">stranded before {nmpa}</span></div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className={simResult.successRate >= 90 ? 'text-emerald-700' : simResult.successRate >= 75 ? 'text-amber-700' : 'text-rose-700'}>{formatGBP(simResult.spend)} a year held in {simResult.successRate.toFixed(1)}% of {simResult.trials.toLocaleString()} futures.</strong>{' '}
                    A path counts as failed in any year that living costs cannot be met from a wrapper you can actually reach, or if the pot ends below your bequest floor. The &plusmn; is sampling error: at this many trials, a difference smaller than that is noise.
                    {simResult.preNmpaFailRate > 5 && <> <strong className="text-rose-700">Check the pre-access figure separately</strong> &mdash; {simResult.preNmpaFailRate.toFixed(1)}% of paths had pension money that was still locked, which is a bridging problem rather than a saving-enough one.</>}
                    {simResult.medianFailAge && <> Of the paths that did fail, the median ran dry at {simResult.medianFailAge}; the earliest at {simResult.earliestFailAge}.</>}
                  </p>
                  {slideNav(1)}
                </div>
              )}

              {/* ---------------- 2. SAFE SPEND ---------------- */}
              {showSlide(2) && (
                <div ref={slideRef} style={{ scrollMarginTop: 12 }} className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                  {slideHead(2, 'The most you could spend', 'Holds the risk fixed and solves for the income instead.')}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">Survive at least:</span>
                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                      {[85, 90, 95, 99].map(rate => (
                        <button key={rate} type="button" disabled={mcBusy} onClick={() => { setTargetSurvivalRate(rate); handleResolveSafeMax(rate); }}
                          className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${targetSurvivalRate === rate ? 'bg-surface text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{rate}%</button>
                      ))}
                    </div>
                    {isOptimizing && <span className="text-slate-400">solving&hellip;</span>}
                  </div>
                  {safeMaxResult ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Safe maximum</span><span className="text-xl font-black font-mono text-emerald-700">{formatGBP(safeMaxResult.spend)}</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">a year, today&rsquo;s money</span></div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Against your {formatGBP(simResult.spend)}</span><span className={`text-xl font-black font-mono ${safeMaxResult.spend >= simResult.spend ? 'text-emerald-700' : 'text-rose-700'}`}>{safeMaxResult.spend >= simResult.spend ? '+' : '−'}{formatGBP(Math.abs(safeMaxResult.spend - simResult.spend))}</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">a year {safeMaxResult.spend >= simResult.spend ? 'more' : 'less'}</span></div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">It actually survives</span><span className="text-xl font-black font-mono text-emerald-700">{safeMaxResult.stats.successRate.toFixed(1)}%</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">at or above the {targetSurvivalRate}% asked for</span></div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80"><span className="text-slate-500 block mb-0.5">Median pot @ {terminalAge}</span><span className="text-xl font-black font-mono text-blue-700">{formatGBP(safeMaxResult.stats.medianTerminal)}</span><span className="text-[10px] text-slate-400 block mt-0.5 font-mono">spending the maximum</span></div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {safeMaxResult.stats.note
                          ? <><strong className="text-rose-700">{safeMaxResult.stats.note}</strong>{' '}</>
                          : <><strong className="text-slate-700">{formatGBP(safeMaxResult.spend)} a year clears {targetSurvivalRate}%</strong>, and the {safeMaxResult.stats.successRate.toFixed(1)}% beside it is measured on the same {safeMaxResult.stats.trials.toLocaleString()} paths that figure is quoted from &mdash; not a separate sample, so the number is the one you are actually buying.{' '}</>}
                        A lower target returns a higher figure: you are choosing how much risk of running short to accept in exchange for income now. 95% is the conventional planning benchmark; 99% is close to belt-and-braces and costs a lot of income to reach.
                        {safeMaxResult.spend < simResult.spend && <> <strong className="text-rose-700">Your entered spend is above this.</strong> That is not a prohibition &mdash; it is the size of the bet you are making.</>}
                      </p>
                    </>
                  ) : <p className="text-xs text-slate-500">Solving&hellip;</p>}
                  {slideNav(2)}
                </div>
              )}

              {/* ---------------- 3. RATE-BASED CHART ---------------- */}
              {showSlide(3) && (
                <div ref={slideRef} style={{ scrollMarginTop: 12 }} className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                  {slideHead(3, 'Rate based', 'One steady rate per wrapper, compounded. Redraws as you type.')}
                  <div className="flex flex-wrap items-center gap-3">
                    {bandToggle}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-slate-600 whitespace-nowrap">Horizon: <strong>Age {effectiveMaxVisibleAge}</strong></span>
                      <input type="range" min={currentAge + 1} max={terminalAge} value={effectiveMaxVisibleAge} onChange={(e) => setMaxVisibleAge(Number(e.target.value))} className="w-32 sm:w-40 accent-blue-600 cursor-pointer" />
                    </div>
                  </div>
                  {renderProjectionChart('rate')}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className="text-slate-700">The band is the {bandSpec.lowPct} to {bandSpec.highPct} percentile, each edge compounded at that age&rsquo;s own rate.</strong>
                    {' '}<strong className="text-rose-700">The weakness: none of these lines can go bust.</strong> A casino lets a winner keep playing but stops a loser at zero. This chart only models the winner. No line here ever sells cheap to pay a bill, so the bottom edge flatters you &mdash; and the weaker the plan, the more it flatters.
                    {bandCurves && bandCurves.lo.failAge !== null && <> <strong className="text-rose-700">Below age {bandCurves.lo.failAge} the bottom edge is broken, not low.</strong></>}
                  </p>
                  {slideNav(3)}
                </div>
              )}

              {/* ---------------- 4. MONTE CARLO CHART ---------------- */}
              {showSlide(4) && (
                <div ref={slideRef} style={{ scrollMarginTop: 12 }} className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                  {slideHead(4, 'Monte Carlo', `${simResult.trials.toLocaleString()} randomised futures, same axes as the last screen.`)}
                  <div className="flex flex-wrap items-center gap-3">
                    {bandToggle}
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                      <span className="text-slate-600 whitespace-nowrap">Horizon: <strong>Age {effectiveMaxVisibleAge}</strong></span>
                      <input type="range" min={currentAge + 1} max={terminalAge} value={effectiveMaxVisibleAge} onChange={(e) => setMaxVisibleAge(Number(e.target.value))} className="w-32 sm:w-40 accent-blue-600 cursor-pointer" />
                    </div>
                  </div>
                  {renderProjectionChart('mc')}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <strong className="text-emerald-700">The strength: these futures can go bust, and some do.</strong> Each line lived one particular order of good and bad years, sold at whatever price those years offered, and stopped dead at zero. That is the half the previous chart leaves out.
                    {' '}The band is the same {bandSpec.lowPct} to {bandSpec.highPct} percentile, so the two charts can be read against each other directly.
                    {fanRuinAge !== null
                      ? <> <strong className="text-rose-700">A tenth are broke by {fanRuinAge}.</strong></>
                      : <> Fewer than one in ten are broke by {terminalAge}.</>}
                  </p>
                  {slideNav(4)}
                </div>
              )}

              {/* ---------------- 5. SIDE BY SIDE ---------------- */}
              {showSlide(5) && (
                <div ref={slideRef} style={{ scrollMarginTop: 12 }} className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
                  {slideHead(5, 'Side by side', 'The same plan, both ways, at the same five points.')}
                  {compareRows2 && (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                          <tr>
                            <th className="p-2.5">Pot at age {terminalAge}</th>
                            <th className="p-2.5" style={{ color: cp.rateEdge }}>Rate based</th>
                            <th className="p-2.5" style={{ color: cp.fanMedian }}>Monte Carlo</th>
                            <th className="p-2.5">Difference</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {compareRows2.quantiles.map(r => (
                            <tr key={r.label} className={r.label === 'Median' ? 'bg-slate-50/80' : ''}>
                              <td className="p-2 font-sans font-semibold text-slate-700">{r.label}</td>
                              <td className="p-2 text-slate-800">{formatGBP(r.rate)}</td>
                              <td className="p-2 text-slate-800">{formatGBP(r.mc)}</td>
                              <td className={`p-2 font-semibold ${Math.abs(r.pct) < 2 ? 'text-slate-400' : r.pct > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{r.mc > 0 ? `${r.pct > 0 ? '+' : ''}${r.pct.toFixed(0)}%` : '—'}</td>
                            </tr>
                          ))}
                          {compareRows2.extras.map(r => (
                            <tr key={r.label} className="border-t-2 border-slate-200">
                              <td className="p-2 font-sans font-semibold text-slate-700">{r.label}</td>
                              <td className="p-2 text-slate-800">{r.rate}</td>
                              <td className="p-2 text-slate-800">{r.mc}</td>
                              <td className="p-2 text-slate-400 font-sans">{r.note || ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Read the <strong>Difference</strong> column downward. The two methods agree near the middle and part company at the bottom: the rate-based figures sit above the Monte Carlo ones precisely where the plan is under most strain, because that is where being unable to go bust flatters you most. Everything here is in today&rsquo;s money.
                  </p>
                  {sequenceLoss && sequenceLoss.state === 'loss' && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed">
                      <strong className="text-rose-700">{formatGBP(sequenceLoss.gapLow)} of that gap is order alone.</strong> An unlucky <em>rate</em> arriving evenly leaves {formatGBP(sequenceLoss.smoothLow)}; one plan in ten actually ends below {formatGBP(sequenceLoss.actualLow)}. Same average return, different order of arrival.
                    </div>
                  )}
                  {slideNav(5)}
                </div>
              )}
            </>
            )}


            {/* Saved scenarios overlay on whichever chart is showing, and the table ranks them against each
                other. Kept outside the five steps: it compares PLANS, where the steps compare methods. */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
            {scenarios.filter(s => s.id !== activeScenarioId).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Compare saved scenarios:</span>
                {scenarios.filter(s => s.id !== activeScenarioId).map(s => {
                  const run = compareRuns.find(r => r.id === s.id);
                  const atCap = !run && selectedCompare.length >= MAX_COMPARE;
                  return (
                    <button key={s.id} type="button" disabled={atCap} onClick={() => toggleCompare(s.id)} title={atCap ? `Up to ${MAX_COMPARE} at once` : s.name}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all border max-w-[16rem] ${run ? 'bg-slate-100 border-slate-300 text-slate-900 font-semibold cursor-pointer' : atCap ? 'bg-surface border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-surface border-slate-200 text-slate-500 opacity-70 cursor-pointer hover:opacity-100'}`}>
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 border" style={{ backgroundColor: run ? run.tone : 'transparent', borderColor: run ? run.tone : 'currentColor' }} />
                      <span className="truncate">{s.name}</span>{run && <Check className="w-3 h-3 text-slate-600 shrink-0" />}
                    </button>
                  );
                })}
                {selectedCompare.length > 0 && <button type="button" onClick={() => setCompareIds([])} className="text-xs text-slate-500 hover:text-slate-800 hover:underline font-semibold cursor-pointer">Clear</button>}
              </div>
            )}
            </div>
            {selectedCompare.length > 0 && (
              <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Table className="w-4 h-4 text-blue-600" /> Scenario Comparison</h2>
                  <span className="text-xs text-slate-500">Every figure on the expected-return path, in today&rsquo;s money. Each scenario&rsquo;s retirement pot is read at its own retirement age. Click a column to sort.</span>
                </div>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold font-sans">
                      <tr>
                        <th className="p-2.5">Scenario</th>
                        {[['retireAge', 'Retires'], ['retirePot', 'Pot at retirement'], ['terminal', 'Terminal pot'], ['delta', 'vs current'], ['lifetimeTax', 'Lifetime tax']].map(([key, label]) => (
                          <th key={key} className="p-2.5">
                            <button type="button" onClick={() => sortCompareBy(key)} className="font-semibold hover:text-slate-900 cursor-pointer flex items-center gap-1">
                              {label}{compareSort.key === key && <span className="text-[9px]">{compareSort.dir === 'desc' ? '▼' : '▲'}</span>}
                            </button>
                          </th>
                        ))}
                        <th className="p-2.5 text-right">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {sortedCompareRows.map(r => (
                        <tr key={r.id} className={`transition-colors ${r.isBase ? 'bg-slate-50/80' : 'hover:bg-slate-50/80'}`}>
                          <td className="p-2 font-sans font-semibold text-slate-800">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.tone }} />
                              <span className="truncate max-w-[14rem]">{r.name}</span>
                              {r.isBase && <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wide shrink-0">Baseline</span>}
                            </span>
                          </td>
                          {r.error ? (
                            <td colSpan={5} className="p-2 font-sans text-slate-400 italic">This scenario cannot be projected: {r.error}</td>
                          ) : (
                            <>
                              <td className="p-2 text-slate-700">{r.retireAge}</td>
                              <td className="p-2 text-slate-700">{formatGBP(r.retirePot)}</td>
                              <td className="p-2 font-bold text-blue-700">{formatGBP(r.terminal)}</td>
                              <td className={`p-2 font-semibold ${r.delta === null ? 'text-slate-300' : r.delta > 0 ? 'text-emerald-700' : r.delta < 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                                {r.delta === null ? '—' : `${r.delta > 0 ? '+' : r.delta < 0 ? '−' : ''}${formatGBP(Math.abs(r.delta))}`}
                              </td>
                              <td className="p-2 text-slate-600">{formatGBP(r.lifetimeTax)}</td>
                            </>
                          )}
                          <td className="p-2 text-right">
                            {r.error ? <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-sans text-[10px] font-bold">Unavailable</span>
                              : <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold ${r.survived ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{outcomeLabel(r)}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">One steady real rate per wrapper, so this ranks the plans against each other rather than against a market. It carries no sequence-of-returns risk: for the chance each scenario survives, enter them in the tournament on the Strategy tab, which runs every scenario on the same market paths.</p>
              </div>
            )}
            {/* The sandbox is the end of the walk, not a permanent fixture: it appears once the five steps
                have been seen (or straight away on a re-run, when they have been seen already). */}
            {simResult && (sandboxRevealed || seeAll) && (
              <div ref={sandboxRef} style={{ scrollMarginTop: 12 }} className="space-y-6">
                {renderSandboxPanel()}
                {simResult && (
                  <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-500">Changed something? Run it again and the five steps come back with every figure refreshed.</span>
                    <button type="button" onClick={() => handleRunAll({ cascade: true })} disabled={mcBusy}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 dark:from-[#2C5C8F] dark:to-[#A9781F] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60">
                      <RotateCcw className="w-3.5 h-3.5" /> {mcBusy ? 'Running…' : 'Rerun projections'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STRATEGY - which split of the money wins, rather than what the outcome is */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs text-slate-700 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-indigo-950 text-sm"><Zap className="w-4 h-4 text-indigo-600" /> Strategy Tournament</div>
              <p className="leading-relaxed">A different question from the one the Projection tab answers. That one asks what happens to your plan; this asks whether a <strong>different split of the same money</strong> would do better. Your spending and your total budget are held fixed, the budget is re-divided between wrappers, and every strategy is scored on identical market paths so the comparison is like for like.</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">Nothing here changes your plan on its own. Applying a winning strategy is a separate, deliberate click, and it lands in the Sandbox on the Projection tab so you can see it drawn before committing it.</p>
              <p className="text-slate-500 text-[11px] leading-relaxed">Nothing being paid in? Then this tournament has nothing to divide. The search for someone already retired is on the <button type="button" onClick={() => setActiveTab('inheritance')} className="text-purple-700 hover:text-purple-900 hover:underline font-semibold cursor-pointer">Inheritance tab</button>, which ranks the choices that are left on what your heirs keep.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1 pt-0.5">
                <button type="button" onClick={() => goToDoc('doc-tournament')} className="text-[11px] text-blue-700 hover:text-blue-900 hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5" /> Tournament methodology and players &rarr;
                </button>
              </div>
            </div>
            <WrapperStrategyTournament plan={plan} ctx={ctx} seed={mcSeed} scenarios={scenarios} activeScenarioId={activeScenarioId} state={tournament} setState={setTournament} cancelRef={tournamentCancelRef} onApplyStrategyToSandbox={handleApplyStrategyToSandbox} onApplyStrategyToPlan={handleApplyStrategyToPlan} onNavigateDocs={() => goToDoc('doc-tournament')} />
          </div>
        )}

        {/* TAB 5: HISTORICAL */}
        {activeTab === 'inheritance' && (
          <div className="space-y-6">
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3 text-xs text-slate-600 leading-relaxed">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Gift className="w-4 h-4 text-purple-600" /> What your heirs actually receive</h2>
              <p>The projection reports the pot you leave. This reports what reaches the people you leave it to, which is a different number. Two things separate them: from 6 April 2027 an unused pension counts as part of your estate for inheritance tax, and if you die at 75 or over your beneficiaries then pay their own income tax on what they draw from it — on top of the tax the estate already paid.</p>
              <p className="text-slate-500">So <strong>which wrapper the money sits in now changes what it is worth to them</strong>, and so does when you die and who inherits. Nothing here is advice; the figures are illustrations built from the rules in Config, which you can change.</p>
              <button type="button" onClick={() => goToDoc('doc-inheritance')} className="text-[11px] text-purple-700 hover:text-purple-900 hover:underline font-semibold flex items-center gap-1 cursor-pointer"><HelpCircle className="w-3.5 h-3.5" /> The rules, and what is not modelled &rarr;</button>
            </div>

            {/* ---------- the estate optimiser ---------- */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4" data-estate-optimiser>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Gift className="w-4 h-4 text-purple-600" /> Most efficient estate allocation</h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">Everything else on this tab prices what you have typed. This searches the choices you can still make: the order you draw wrappers down, how far up the tax bands you draw the pension each year, a gift now, how the pension is split between the people inheriting it, and moving money between wrappers up to the allowances that cap it. All of it ranked on one number &mdash; <strong>what your heirs keep</strong>, after inheritance tax and after their own income tax on drawing an inherited pension down over {estatePlan ? estatePlan.spreadYears : E.num(plan?.config?.inheritedPensionSpreadYears, 5)} years. The Strategy tab answers a different question: how to divide money you are still paying in.</p>
                </div>
                <div className="shrink-0">
                  <button type="button" onClick={handleOptimizeEstate} data-optimise-estate
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95">
                    <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> Find the best allocation
                  </button>
                </div>
              </div>
              {estateError && <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">{estateError}</div>}
              {estatePlan && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl"><span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500 mb-1">As it stands</span><div className="text-lg font-bold font-mono text-slate-900">{formatGBP(estatePlan.baseline.net)}</div></div>
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl"><span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700 mb-1">Best found</span><div className="text-lg font-bold font-mono text-emerald-800">{formatGBP(estatePlan.best.net)}</div></div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl"><span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Difference</span><div className={`text-lg font-bold font-mono ${estatePlan.gain > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>{estatePlan.gain > 0 ? '+' : ''}{formatGBP(estatePlan.gain)}</div><span className="text-[10px] text-slate-400">priced at death at {estatePlan.deathAge}</span></div>
                  </div>

                  {/* The answer as a list of things to do, not as a label. An allocation nobody can act
                      on is a worse deliverable than a smaller one they can. */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3" data-action-plan>
                    <h3 className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2"><Check className="w-3.5 h-3.5" /> What to do</h3>
                    <ol className="space-y-2.5 list-none">
                      {estateActions.map((a, i) => (
                        <li key={a.key} className="flex gap-2.5">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                          <div className="space-y-0.5">
                            <div className="text-[12px] font-bold text-emerald-950">{a.title}</div>
                            <div className="text-[11px] text-emerald-900 leading-relaxed">{a.body}</div>
                            {a.detail && <div className="text-[10px] text-emerald-700 leading-relaxed">{a.detail}</div>}
                          </div>
                        </li>
                      ))}
                    </ol>
                    <span className="text-[10px] text-emerald-700 block">Only what changes is listed. Everything else about your plan stays as it is.</span>
                  </div>

                  {/* what each lever is worth on its own, so the household acts on the right one */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse" data-lever-table>
                      <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-1.5 pr-3">Lever</th><th className="pb-1.5 pr-3">Worth on its own</th><th className="pb-1.5">Best setting</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {estatePlan.levers.map(l => (
                          <tr key={l.key}>
                            <td className="py-1.5 pr-3 font-semibold text-slate-800">{l.label}</td>
                            <td className={`py-1.5 pr-3 font-mono ${l.gain > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>{l.gain > 0 ? '+' + formatGBP(l.gain) : '—'}</td>
                            <td className="py-1.5 text-slate-600">{l.pick}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Each lever is measured against your plan as it stands, not against the running best &mdash; otherwise whichever was searched first would be credited with everything the others also deliver. They do not add up to the difference above, because they overlap.</span>

                  {/* a zero is a finding, not a gap in the search */}
                  {estatePlan.reasons.map(r => (
                    <div key={r.key} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">{r.text}</div>
                  ))}

                  <div>
                    <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Ranked, best first</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse" data-estate-ranked>
                        <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-1.5 pr-3">What you would do</th><th className="pb-1.5 pr-3">Heirs keep</th><th className="pb-1.5 pr-3">Estate tax</th><th className="pb-1.5">Their income tax</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                          {estatePlan.ranked.map((c, i) => (
                            <tr key={i} className={c.label === estatePlan.best.label ? 'bg-emerald-50/60' : ''}>
                              <td className="py-1.5 pr-3 text-slate-700">{c.label}</td>
                              <td className="py-1.5 pr-3 font-mono font-bold text-emerald-700">{formatGBP(c.net)}</td>
                              <td className="py-1.5 pr-3 font-mono text-rose-700">{formatGBP(c.iht)}</td>
                              <td className="py-1.5 font-mono text-rose-700">{c.incomeTax > 0 ? formatGBP(c.incomeTax) : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* priced alongside rather than ranked: see the engine comment on optimizeInheritance */}
                  {estatePlan.charity && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                      <strong>Charity, priced but not ranked.</strong> Leaving {estatePlan.charity.pct}% of the estate to charity takes the rate to {estatePlan.charity.ratePct}%: the charity receives {formatGBP(estatePlan.charity.toCharity)} and your family {formatGBP(estatePlan.charity.toFamily)}, which is {formatGBP(Math.abs(estatePlan.charity.costToFamily))} {estatePlan.charity.costToFamily > 0 ? 'less' : 'more'} than the best plan above. It is not in the ranking because a donation would always score as a loss against what the heirs keep, and that is a decision about what you want rather than about tax.
                    </div>
                  )}
                  {estatePlan.spread && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 leading-relaxed">
                      <strong>Their choice, not yours.</strong> If your heirs drew the inherited pension over {estatePlan.spread.years} years instead of {estatePlan.spreadYears}, they would keep {formatGBP(estatePlan.spread.net)} &mdash; {estatePlan.spread.gain > 0 ? `${formatGBP(estatePlan.spread.gain)} more` : 'no more'}. That is not searched above, because every candidate has to be scored on the same assumption about someone else&rsquo;s behaviour.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button type="button" onClick={applyEstatePlan} disabled={estatePlan.gain <= 0} data-apply-estate
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                      <Check className="w-3.5 h-3.5" /> Apply this allocation
                    </button>
                    <span className="text-[10px] text-slate-400">Writes the withdrawal order{estatePlan.best.gift > 0 ? ', the gift' : ''}{estatePlan.best.split ? ', the nomination' : ''}{estatePlan.best.recycle ? ' and the transfers' : ''} into your plan. {estatePlan.runs} projections were run to find it.</span>
                  </div>
                </div>
              )}
            </div>

            {/* ---------- who inherits ---------- */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Users className="w-3.5 h-3.5 text-purple-600" /> Who inherits</h3>
                <button onClick={addBeneficiary} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200"><Plus className="w-3.5 h-3.5" /> Add person</button>
              </div>
              {!inheritanceView.hasBens ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 border border-slate-200 rounded-xl">Nobody added yet. Add at least one person to see what they would receive.</div>
              ) : (
                <div className="space-y-2">
                  {inheritanceView.bens.map(b => (
                    <div key={b.id} className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <input type="text" placeholder="Name" value={b.name} onChange={(e) => updateBeneficiary(b.id, { name: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700 w-28" />
                      <select value={b.relationship} onChange={(e) => updateBeneficiary(b.id, { relationship: e.target.value })} title={E.IHT_RELATIONSHIPS[b.relationship].who} className="p-1 bg-surface border border-slate-300 rounded text-purple-700 font-semibold cursor-pointer">
                        {Object.entries(E.IHT_RELATIONSHIPS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-slate-500" title="Their share of everything except the pension: the house, ISAs, investments and cash. This is the will.">will
                        <input type="number" min="0" max="100" step="5" onFocus={handleFocus} value={b.sharePct} onChange={(e) => updateBeneficiary(b.id, { sharePct: parseInputNumber(e.target.value) })} className="w-16 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800 font-bold" />%
                      </label>
                      {/* The pension passes by nomination, not by the will. Blank follows the will share,
                          which is what most people mean and what the model assumed for everyone before
                          the two were separable. */}
                      <label className="flex items-center gap-1 text-slate-500" title="Their share of the PENSION, which passes by the nomination form you gave your scheme — not by your will. Leave blank to match the will share.">pension
                        <input type="number" min="0" max="100" step="5" placeholder={String(E.num(b.sharePct, 0))} onFocus={handleFocus} value={b.pensionSharePct} onChange={(e) => updateBeneficiary(b.id, { pensionSharePct: parseInputNumber(e.target.value) })} className="w-16 p-1 bg-surface border border-slate-300 rounded font-mono text-purple-700 font-bold" />%
                      </label>
                      {/* Income and age drive the income tax on an inherited pension, which a spouse pays
                          even though they pay no inheritance tax. Only a charity escapes both. */}
                      {E.IHT_RELATIONSHIPS[b.relationship].incomeTaxpayer ? (
                        <>
                          <label className="flex items-center gap-1 text-slate-500">their income
                            <input type="number" min="0" step="1000" placeholder="0" onFocus={handleFocus} value={b.income} onChange={(e) => updateBeneficiary(b.id, { income: parseInputNumber(e.target.value) })} className="w-24 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800" />
                          </label>
                          <label className="flex items-center gap-1 text-slate-500">age
                            <input type="number" min="0" max="120" placeholder="—" onFocus={handleFocus} value={b.age} onChange={(e) => updateBeneficiary(b.id, { age: parseInputNumber(e.target.value) })} className="w-14 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800" />
                          </label>
                          {/* The single biggest lever on this tab: a pot drawn over twenty years instead
                              of five gets twenty personal allowances instead of five. */}
                          <label className="flex items-center gap-1 text-slate-500" title="How many years they would draw an inherited pension over. Each year has its own personal allowance and basic-rate band, so a longer draw costs far less tax. Blank uses the default in Config.">draws over
                            <input type="number" min="1" max="40" placeholder={String(E.num(plan?.config?.inheritedPensionSpreadYears, 5))} onFocus={handleFocus} value={b.spreadYears} onChange={(e) => updateBeneficiary(b.id, { spreadYears: parseInputNumber(e.target.value) })} className="w-14 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800" />y
                          </label>
                        </>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-semibold">{E.IHT_RELATIONSHIPS[b.relationship].note}</span>
                      )}
                      <button onClick={() => deleteBeneficiary(b.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors ml-auto"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {/* shares are normalised rather than rejected, but silently rescaling someone's 60% to
                      100% would be dishonest, so say so */}
                  {Math.abs(inheritanceView.declared - 100) > 0.01 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Will shares total <strong>{inheritanceView.declared}%</strong>, not 100%. The figures below scale them proportionally so they add up — adjust them if that is not what you meant.</span>
                    </div>
                  )}
                  {Math.abs(inheritanceView.declaredPen - 100) > 0.01 && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Pension shares total <strong>{Math.round(inheritanceView.declaredPen)}%</strong>, not 100%. They are scaled to add up, the same as the will shares.</span>
                    </div>
                  )}
                  <span className="text-[10px] text-purple-700 block">
                    <strong>Two columns, because there are two documents.</strong> Your will divides the house, ISAs, investments and cash. Your <strong>pension</strong> goes to whoever is on the nomination form held by your scheme, which most people filled in once and never looked at again. Splitting them is the most valuable choice on this tab: an inherited pension is taxed at the recipient&rsquo;s own rate, so the same pot is worth far more to someone with an unused personal allowance than to a higher-rate taxpayer. Leave the pension column blank and it simply follows the will.
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    It does not follow that the whole pension should go to whoever earns least. Each person has their own allowances and bands, so putting a large pot on one heir can reach the additional rate that splitting it would have avoided &mdash; and a slow draw-down by the right person usually beats a clever split by the wrong one. The table below shows which way it falls for your figures.
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Income, age and the draw-down period decide what an inherited pension costs them, if you die at {E.num(plan?.config?.pensionIncomeTaxFromAge, 75)} or over. Each year of drawing gets its own {formatGBP(P.pa)} personal allowance and basic-rate band, so the number of years matters as much as who receives it — a young grandchild can spread it over decades, a sixty-year-old child cannot. Age matters only in that someone at {E.num(plan?.config?.statePensionAgeForHeirs, 68)} or over is assumed to have a state pension already using part of that allowance.
                  </span>
                  <span className="text-[10px] text-amber-700 block">This holds only while their circumstances stay roughly as they are over those years. Someone about to retire, start a business or come into other money would face a different bill.</span>
                  <span className="text-[10px] text-slate-400 block">A spouse or civil partner pays no inheritance tax but <strong>does</strong> pay income tax on an inherited pension, so their details still matter.</span>
                  {/* Naming who each row covers, and who it does not. Picking the wrong one is worth the
                      whole residence band in one direction and the whole spousal exemption in the other,
                      and neither mistake shows up as an error - only as a wrong number. */}
                  <details className="text-[10px]">
                    <summary className="cursor-pointer text-slate-500 font-semibold hover:text-slate-800">Which of these is which?</summary>
                    <ul className="mt-1.5 space-y-1 pl-1">
                      {Object.entries(E.IHT_RELATIONSHIPS).map(([k, v]) => (
                        <li key={k} className="text-slate-500"><strong className="text-slate-700">{v.label}:</strong> {v.who}</li>
                      ))}
                    </ul>
                    <p className="mt-1.5 text-amber-700">Children and grandchildren are one option because the rules treat them the same way: both are direct descendants, and either will unlock the residence allowance if your home passes to them.</p>
                  </details>
                </div>
              )}
            </div>


            {/* ---------- gifts already made ---------- */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Coins className="w-3.5 h-3.5 text-purple-600" /> Gifts you have already made</h3>
                <button onClick={addGift} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-200"><Plus className="w-3.5 h-3.5" /> Add gift</button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                A gift drops out of your estate once you have survived <strong>seven years</strong>. Before that it counts — but usually not in the way people expect. It rarely creates a tax bill of its own; instead it <strong>uses up your {formatGBP(E.num(plan?.config?.ihtNrb, 325000))} allowance first</strong>, leaving less to shelter everything else. The cost lands on your estate, not on the gift.
              </p>
              {(plan?.inheritance?.gifts || []).length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 bg-slate-50 border border-slate-200 rounded-xl">No gifts recorded. If you have given money away in the last seven years, add it — it changes the allowance available to your estate.</div>
              ) : (
                <div className="space-y-2">
                  {(plan?.inheritance?.gifts || []).map(g => (
                    <div key={g.id} className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <input type="text" placeholder="What it was for" value={g.desc ?? ''} onChange={(e) => updateGift(g.id, { desc: e.target.value })} className="p-1 bg-surface border border-slate-300 rounded text-slate-700 flex-1 min-w-[8rem]" />
                      <label className="flex items-center gap-1 text-slate-500">amount
                        <input type="number" min="0" step="1000" placeholder="0" onFocus={handleFocus} value={g.amount ?? ''} onChange={(e) => updateGift(g.id, { amount: parseInputNumber(e.target.value) })} className="w-28 p-1 bg-surface border border-slate-300 rounded font-mono text-purple-700 font-bold" />
                      </label>
                      <label className="flex items-center gap-1 text-slate-500">year
                        <input type="number" min="1950" max="2100" onFocus={handleFocus} value={g.year ?? ''} onChange={(e) => updateGift(g.id, { year: parseInputNumber(e.target.value) })} className="w-20 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800" />
                      </label>
                      {/* Past and planned gifts are told apart by the year alone, not a separate flag:
                          one fact, one input, and no way for the two to disagree. */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${E.num(g.year, 0) > ctx.baseYear ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                        {E.num(g.year, 0) > ctx.baseYear ? 'planned' : 'already given'}
                      </span>
                      <button onClick={() => deleteGift(g.id)} className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <span className="text-[10px] text-blue-700 block">A gift dated in the future is <strong>planned</strong>: it leaves your plan in that year, so it reduces what you have to live on in the projection as well as what you leave behind. One dated in the past has already gone and only affects the tax.</span>
                  <span className="text-[10px] text-slate-400 block">The year matters because the seven years run from the gift to your death — so the same gift costs nothing or a great deal depending on the death age you chose above. The first {formatGBP(E.num(plan?.config?.giftAnnualExemption, 3000))} of gifts in any year is exempt immediately; carrying an unused year forward is not modelled, so this is the cautious reading.</span>
                </div>
              )}
              {inheritanceView.chosen && inheritanceView.chosen.gifts && inheritanceView.chosen.gifts.length > 0 && (
                <div className="overflow-x-auto pt-1">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-1.5 pr-3">Gift</th><th className="pb-1.5 pr-3">Years before death</th><th className="pb-1.5 pr-3">Allowance it uses</th><th className="pb-1.5 pr-3">Tax on the gift</th><th className="pb-1.5">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {inheritanceView.chosen.gifts.map((g, i) => (
                        <tr key={i}>
                          <td className="py-1.5 pr-3 font-sans">{g.desc || formatGBP(g.amount)}<span className="block text-[10px] text-slate-400">{formatGBP(g.amount)} in {g.year}</span></td>
                          <td className="py-1.5 pr-3">{g.yearsBefore}</td>
                          <td className="py-1.5 pr-3 text-amber-700">{g.survived ? '—' : formatGBP(g.againstNrb)}</td>
                          <td className="py-1.5 pr-3 text-rose-700">{g.tax > 0 ? `${formatGBP(g.tax)} at ${g.ratePct}%` : '—'}</td>
                          <td className="py-1.5 font-sans text-slate-600">{g.survived ? 'Outside your estate' : g.tax > 0 ? `Taxed above the allowance, tapered to ${g.ratePct}%` : 'No tax of its own — but it consumes the allowance'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <span className="text-[10px] text-slate-400 block mt-1.5">
                    Allowance left for your estate after gifts: <strong>{formatGBP(inheritanceView.chosen.nrb)}</strong> of {formatGBP(inheritanceView.chosen.nrbFull)}.
                    {inheritanceView.chosen.nrbUsedByGifts > 0 && ` Those gifts have taken ${formatGBP(inheritanceView.chosen.nrbUsedByGifts)} of it.`}
                    {' '}Taper relief only reduces tax on the part of a gift above the allowance — which is why a gift inside it shows no benefit from taper however long ago it was made.
                  </span>
                </div>
              )}

              {/* ---------- a gift the arithmetic actually supports ---------- */}
              {inheritanceView.suggestion?.worthwhile && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2" data-gift-suggestion>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> A gift worth considering</h4>
                    <button onClick={() => addSuggestedGift(inheritanceView.suggestion.amount, inheritanceView.suggestion.giftYear)} data-add-suggested-gift className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"><Plus className="w-3.5 h-3.5" /> Add as a planned gift</button>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    At age {inheritanceView.chosenAge} your estate is <strong>{formatGBP(inheritanceView.chosen.grossEstate)}</strong>, which is above the {formatGBP(E.num(plan?.config?.ihtRnrbTaperFrom, 2000000))} line where the residence allowance starts to be withdrawn &mdash; &pound;1 of allowance for every &pound;2 over. That is costing you <strong>{formatGBP(inheritanceView.chosen.rnrbTaperLoss)}</strong> of allowance.
                  </p>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Giving away <strong>{formatGBP(inheritanceView.suggestion.amount)}</strong> in {inheritanceView.suggestion.giftYear} {inheritanceView.suggestion.clearsLine ? <>brings it back to the line</> : <>brings it down to {formatGBP(inheritanceView.suggestion.estateAfter)}</>} and restores <strong>{formatGBP(inheritanceView.suggestion.bandRestored)}</strong> of allowance, taking the bill from {formatGBP(inheritanceView.suggestion.taxBefore)} to <strong>{formatGBP(inheritanceView.suggestion.taxAfter)}</strong> &mdash; a saving of <strong>{formatGBP(inheritanceView.suggestion.saving)}</strong>.
                  </p>
                  {inheritanceView.suggestion.costPerPound > 1.05 && (
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      Less than the {formatGBP(inheritanceView.chosen.grossEstate - E.num(plan?.config?.ihtRnrbTaperFrom, 2000000))} you are over, because money given away also stops earning: by {inheritanceView.chosenAge} each &pound;1 given now has taken <strong>&pound;{inheritanceView.suggestion.costPerPound.toFixed(2)}</strong> off the estate. That figure is measured on your own plan rather than assumed &mdash; it is above &pound;1 partly through growth forgone and partly because spending that would have come from this money now comes out of the pension, taxed on the way.
                    </p>
                  )}
                  <p className="text-[10px] text-emerald-800 leading-relaxed">
                    <strong>{formatGBP(inheritanceView.suggestion.bandSaving)} of that saving is certain.</strong> The {formatGBP(E.num(plan?.config?.ihtRnrbTaperFrom, 2000000))} test looks at what you <strong>owned at death</strong>, and money you have given away is not owned at death &mdash; so the allowance comes back the day you make the gift, seven years or not. The rest of the saving is the ordinary effect of the money being outside your estate, and that part does depend on surviving seven years. That asymmetry is why this is the only gift suggested here: gifting <em>in general</em> is close to tax-neutral inside seven years, because the gift eats the {formatGBP(E.num(plan?.config?.ihtNrb, 325000))} allowance your estate would have used anyway.
                  </p>
                  {!inheritanceView.suggestion.outsideEstate && (
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      At the death age you have chosen the gift has <strong>not</strong> cleared seven years, so it also uses up {formatGBP(E.num(plan?.config?.ihtNrb, 325000))}-band allowance &mdash; the saving above is already net of that. Living longer after it only improves the figure.
                    </p>
                  )}
                  {inheritanceView.suggestion.limitedBy === 'liquid' && (
                    <p className="text-[10px] text-amber-800 leading-relaxed">That is as far as your cash, unwrapped investments and ISAs stretch, so it reduces the withdrawal rather than ending it. The rest of your wealth is in a pension, which would have to be drawn and taxed before it could be given away &mdash; a different decision, so it is not suggested here.</p>
                  )}
                  {inheritanceView.suggestion.limitedBy === 'solvency' && (
                    <p className="text-[10px] text-amber-800 leading-relaxed">This is as much as the plan can spare: giving more would leave you short before the end of it, so the suggestion stops here rather than clearing the line. An allowance is no use to someone who has run out.</p>
                  )}
                  <p className="text-[10px] text-emerald-700 leading-relaxed">Added as a planned gift it leaves the plan in {inheritanceView.suggestion.giftYear}, so it reduces what you have to live on as well as what you leave behind. Check the survival rate afterwards &mdash; an allowance is no use if the money was needed.</p>
                </div>
              )}
            </div>

            {/* ---------- regular gifts out of income (s.21) ---------- */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Gift className="w-3.5 h-3.5 text-purple-600" /> Regular gifts out of income</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The one gift that needs no seven years. A gift that is <strong>habitual</strong>, paid out of <strong>income rather than capital</strong>, and leaves your standard of living intact is exempt <strong>immediately</strong> — no clock, no allowance used, and no upper limit. It is the most useful relief most people never claim, and the only one that works for someone who does not expect to live seven years.
              </p>
              <div className="flex flex-wrap items-end gap-3 text-xs">
                <label className="flex flex-col gap-1 text-slate-600 font-semibold">Amount each year
                  <input type="number" min="0" step="500" placeholder="0" onFocus={handleFocus} value={plan?.inheritance?.surplusGift?.annual ?? ''} onChange={(e) => updateSurplusGift('annual', parseInputNumber(e.target.value))} className="w-32 p-1.5 bg-surface border border-slate-300 rounded font-mono text-purple-700 font-bold" />
                </label>
                <label className="flex flex-col gap-1 text-slate-600 font-semibold">From year
                  <input type="number" min="1950" max="2100" placeholder={String(ctx.baseYear + 1)} onFocus={handleFocus} value={plan?.inheritance?.surplusGift?.fromYear ?? ''} onChange={(e) => updateSurplusGift('fromYear', parseInputNumber(e.target.value))} className="w-24 p-1.5 bg-surface border border-slate-300 rounded font-mono text-slate-800" />
                </label>
                <label className="flex flex-col gap-1 text-slate-600 font-semibold">Until year
                  <input type="number" min="1950" max="2100" placeholder="end of plan" onFocus={handleFocus} value={plan?.inheritance?.surplusGift?.toYear ?? ''} onChange={(e) => updateSurplusGift('toYear', parseInputNumber(e.target.value))} className="w-24 p-1.5 bg-surface border border-slate-300 rounded font-mono text-slate-800" />
                </label>
              </div>
              {inheritanceView.surplus && (
                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${surplusGiftAnnual > inheritanceView.surplus.sustainable ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  {/* The binding figure is the leanest year: the exemption asks whether the gift could be
                      repeated every year without eating capital, not whether it averages out. */}
                  Your income after living costs is <strong>{formatGBP(inheritanceView.surplus.median)}</strong> a year at the median, and <strong>{formatGBP(inheritanceView.surplus.min)}</strong> in the leanest year of the plan. A regular gift up to that leanest figure is the part you could defend as coming out of income every year.
                  {surplusGiftAnnual > inheritanceView.surplus.sustainable
                    ? <> You have entered <strong>{formatGBP(surplusGiftAnnual)}</strong>, which is more — the excess would be coming out of capital, so treat it as an ordinary gift with a seven-year clock rather than an exempt one.</>
                    : surplusGiftAnnual > 0
                      ? <> At <strong>{formatGBP(surplusGiftAnnual)}</strong> a year you are inside it.</>
                      : <> Nothing is being gifted yet.</>}
                </div>
              )}
              <span className="text-[10px] text-slate-400 block">
                What this models: the money leaves your plan each year, so it reduces what you have to live on, and it never enters your estate or touches an allowance. What it cannot judge is whether the gift is really <em>habitual</em> — a pattern, not a one-off — which is the test HMRC actually applies. Drawdown taken from a pension is deliberately excluded from the income figure above even though HMRC will often accept regular pension income, because if the executors lose that argument the gift becomes an ordinary transfer with a seven-year clock. Your executors claim this on form IHT403, and it is far easier to claim when you have kept a record of the income and the gifts.
              </span>
            </div>

            {/* ---------- the estate ---------- */}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Home className="w-3.5 h-3.5 text-purple-600" /> Your estate</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Home value (today&rsquo;s money)</label>
                  <input type="number" min="0" step="10000" placeholder="0" onFocus={handleFocus} value={plan?.inheritance?.homeValue ?? ''} onChange={(e) => updateInheritance('homeValue', parseInputNumber(e.target.value))} className={inputCls} />
                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                    <input type="checkbox" checked={plan?.inheritance?.homeToDescendants !== false} onChange={(e) => updateInheritance('homeToDescendants', e.target.checked)} className="accent-purple-600" />
                    <span className="text-[10px] text-slate-500">It passes to a child, grandchild or step-child</span>
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">This is what unlocks the {formatGBP(E.num(plan?.config?.ihtRnrb, 175000))} residence allowance. Without a home, or if it goes to anyone else, there is no residence allowance at all.</span>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Expected age at death</label>
                  <input type="number" min={currentAge} max="120" placeholder={String(terminalAge)} onFocus={handleFocus} value={plan?.inheritance?.deathAge ?? ''} onChange={(e) => updateInheritance('deathAge', parseInputNumber(e.target.value))} className={inputCls} />
                  <span className="text-[10px] text-slate-400 mt-1 block">Not the same as &ldquo;Plan to Age&rdquo; ({terminalAge}), which is deliberately pessimistic so the money lasts. This one is your best guess, because an estate is valued when you die, not at your planning horizon.</span>
                </div>
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Sell the home during retirement?</label>
                  <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={!!plan?.inheritance?.homeSold} onChange={(e) => updateInheritance('homeSold', e.target.checked)} className="accent-purple-600" />
                    <span className="text-slate-700 font-semibold text-[11px]">Yes, at age</span>
                    <input type="number" min={currentAge} max="120" disabled={!plan?.inheritance?.homeSold} onFocus={handleFocus} value={plan?.inheritance?.homeSaleAge ?? ''} onChange={(e) => updateInheritance('homeSaleAge', parseInputNumber(e.target.value))} className="w-16 p-1 bg-surface border border-slate-300 rounded font-mono text-slate-800 disabled:opacity-40" />
                  </label>
                  <span className="text-[10px] text-slate-400 mt-1 block">After a sale the house is no longer in the estate, so the residence allowance goes with it. The cash it released is counted in your wrappers instead.</span>
                </div>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-600 font-semibold hover:text-slate-900">Widowed? Add your late partner&rsquo;s unused allowances</summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">% of their nil-rate band unused</label>
                    <input type="number" min="0" max="100" step="5" placeholder="100" onFocus={handleFocus} value={plan?.inheritance?.transferredNrbPct ?? ''} onChange={(e) => updateInheritance('transferredNrbPct', parseInputNumber(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">% of their residence band unused</label>
                    <input type="number" min="0" max="100" step="5" placeholder="100" onFocus={handleFocus} value={plan?.inheritance?.transferredRnrbPct ?? ''} onChange={(e) => updateInheritance('transferredRnrbPct', parseInputNumber(e.target.value))} className={inputCls} />
                  </div>
                  <span className="text-[10px] text-slate-400 sm:col-span-2">Usually 100% of both, because everything passing to a spouse is exempt and so uses none of their allowances. Worth up to {formatGBP(E.num(plan?.config?.ihtNrb, 325000) + E.num(plan?.config?.ihtRnrb, 175000))} and commonly missed.</span>
                </div>
              </details>

              {/* Two cases where an identical estate pays a completely different amount, and neither is
                  visible from the balances. Quick succession relief in particular is not applied
                  automatically - it has to be claimed - so a household unaware of it loses it entirely. */}
              <details className="text-xs">
                <summary className="cursor-pointer text-slate-600 font-semibold hover:text-slate-900">Special circumstances — recent inheritance, or death on active service</summary>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!plan?.inheritance?.activeServiceExempt} onChange={(e) => updateInheritance('activeServiceExempt', e.target.checked)} className="accent-purple-600 mt-0.5" />
                      <span className="text-slate-700"><strong>Death on active service.</strong> A full exemption from inheritance tax where a member of the armed forces dies from a wound, accident or disease contracted on service — and, since 2014, for emergency services personnel and anyone deliberately targeted because of their job.</span>
                    </label>
                    <span className="text-[10px] text-slate-400 mt-1 block ml-6">This is an exemption, not a relief: it takes the estate&rsquo;s bill to nothing regardless of its size. A war widow&rsquo;s or widower&rsquo;s pension is a different thing — tax-free income, with no bearing on inheritance tax.</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-slate-700 font-semibold mb-1">Did you inherit something in the last five years, on which inheritance tax was paid?</div>
                    <span className="text-[10px] text-slate-400 mb-2 block">If so, quick succession relief cuts the tax on your own estate by up to the whole amount paid then, tapering by a fifth for each year that has passed. It has to be claimed by whoever handles your estate — it is not given automatically.</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Value you inherited</label>
                        <input type="number" min="0" step="5000" placeholder="0" onFocus={handleFocus} value={plan?.inheritance?.qsrInheritedValue ?? ''} onChange={(e) => updateInheritance('qsrInheritedValue', parseInputNumber(e.target.value))} className={inputCls} />
                      </div>
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Tax paid on it</label>
                        <input type="number" min="0" step="500" placeholder="0" data-qsr-tax onFocus={handleFocus} value={plan?.inheritance?.qsrTaxPaid ?? ''} onChange={(e) => updateInheritance('qsrTaxPaid', parseInputNumber(e.target.value))} className={inputCls} />
                      </div>
                      <div>
                        <label className="text-slate-600 font-semibold block mb-1">Years ago</label>
                        <input type="number" min="0" max="10" step="1" placeholder="—" onFocus={handleFocus} value={plan?.inheritance?.qsrYearsBefore ?? ''} onChange={(e) => updateInheritance('qsrYearsBefore', parseInputNumber(e.target.value))} className={inputCls} />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {(E.DEFAULT_CONFIG.qsrScale || []).map((v, i) => `${i}–${i + 1}y: ${v}%`).join(' · ')}
                        </span>
                      </div>
                    </div>
                    {/* The credit is driven by the TAX PAID, not by what was inherited: an estate that paid
                        nothing generates no credit however large the legacy was. That is easy to get wrong
                        on the way in, and silently produces a relief of zero, so it is said out loud. */}
                    {E.num(plan?.inheritance?.qsrInheritedValue, 0) > 0 && !(E.num(plan?.inheritance?.qsrTaxPaid, 0) > 0) && (
                      <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>You have entered what you inherited but not the <strong>tax paid on it</strong>, and the credit is a share of that tax rather than of the legacy &mdash; so as it stands the relief is <strong>£0</strong>. The figure is on the IHT421 or the estate accounts from that death.</span>
                      </div>
                    )}
                    {inheritanceView.chosen && inheritanceView.chosen.qsrRelief > 0 && (
                      <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                        Quick succession credit at your chosen death age: <strong>{formatGBP(inheritanceView.chosen.qsrRelief)}</strong> off the bill &mdash; {inheritanceView.chosen.qsrPct}% of the {formatGBP(E.num(plan?.inheritance?.qsrTaxPaid, 0))} paid then, because {E.num(plan?.inheritance?.qsrYearsBefore, 0)} whole years separate the two deaths.
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>

            {/* ---------- results ---------- */}
            {inheritanceView.hasBens && inheritanceView.chosen && (
              <>
                {/* The headline the study says matters: not "here is your bill" but "it depends when". */}
                {inheritanceView.cliff && inheritanceView.cliff.loss > 0 && (
                  <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl shadow-xs space-y-1">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-black font-display italic text-amber-900">Dying at {inheritanceView.cliff.after.age} rather than {inheritanceView.cliff.before.age} costs your heirs {formatGBP(inheritanceView.cliff.loss)}</div>
                        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">An inherited pension is tax-free to them if you die before {E.num(plan?.config?.pensionIncomeTaxFromAge, 75)}, and taxed at their own rate from {E.num(plan?.config?.pensionIncomeTaxFromAge, 75)} onwards. That is a step, not a slope, and it is the largest single number on this page. It is also the reason the table below shows several ages instead of asking you to pick one.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">What they receive, by when you die</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="pb-1.5 pr-3">If you die at</th><th className="pb-1.5 pr-3">Estate</th><th className="pb-1.5 pr-3">Allowances</th>
                        <th className="pb-1.5 pr-3">Inheritance tax</th><th className="pb-1.5 pr-3">Their income tax</th><th className="pb-1.5 pr-3">They receive</th><th className="pb-1.5">Total taken</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {inheritanceView.rows.map(r => (
                          <tr key={r.age} className={r.age === inheritanceView.chosenAge ? 'bg-purple-50/70 font-bold' : ''}>
                            <td className="py-1.5 pr-3 font-sans">{r.age}{r.age === inheritanceView.chosenAge ? ' (your estimate)' : ''}{r.homeSold ? ' · home sold' : ''}</td>
                            <td className="py-1.5 pr-3">{formatGBP(r.grossEstate)}</td>
                            <td className="py-1.5 pr-3 text-slate-500">{formatGBP(r.nrb + r.rnrb)}</td>
                            <td className="py-1.5 pr-3 text-rose-700">{formatGBP(r.iht)}</td>
                            <td className="py-1.5 pr-3 text-rose-700">{r.incomeTaxOnPensions > 0 ? formatGBP(r.incomeTaxOnPensions) : '—'}</td>
                            <td className="py-1.5 pr-3 text-emerald-700 font-bold">{formatGBP(r.netToBeneficiaries)}</td>
                            <td className="py-1.5">{r.effectiveRatePct.toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Each row values the estate at that age, using the pot your projection holds then — not the pot at {terminalAge}. Dying earlier leaves more because fewer years of drawdown have happened.{isCouple ? ' As a couple, the first death passes everything to the survivor tax-free and doubles both allowances; the tax shown falls on the second.' : ''}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs"><span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Estate at {inheritanceView.chosen.age}</span><div className="text-xl font-bold font-mono text-slate-900">{formatGBP(inheritanceView.chosen.grossEstate)}</div><span className="text-[11px] text-slate-400">{inheritanceView.chosen.pensionCounts ? `Includes ${formatGBP(inheritanceView.chosen.pension)} of pension, which counts from 2027` : `Excludes ${formatGBP(inheritanceView.chosen.pension)} of pension — death before the 2027 rule`}</span></div>
                  <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs"><span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Total tax</span><div className="text-xl font-bold font-mono text-rose-700">{formatGBP(inheritanceView.chosen.totalTax)}</div><span className="text-[11px] text-slate-400">{formatGBP(inheritanceView.chosen.iht)} estate tax at {inheritanceView.chosen.ratePct}%{inheritanceView.chosen.charityQualifies ? ' (reduced by your charitable gift)' : ''}{inheritanceView.chosen.incomeTaxOnPensions > 0 ? ` · ${formatGBP(inheritanceView.chosen.incomeTaxOnPensions)} their income tax` : ''}{inheritanceView.chosen.qsrRelief > 0 ? ` · after a ${formatGBP(inheritanceView.chosen.qsrRelief)} quick succession credit` : ''}</span></div>
                  <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs"><span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">They receive</span><div className="text-xl font-bold font-mono text-emerald-700">{formatGBP(inheritanceView.chosen.netToBeneficiaries)}</div><span className="text-[11px] text-slate-400">{inheritanceView.chosen.effectiveRatePct.toFixed(0)}% of the estate is taken in total</span></div>
                </div>

                <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Person by person, if you die at {inheritanceView.chosen.age}</h3>
                  <div className="overflow-x-auto">
                    <table data-person-table className="w-full text-left text-[11px] border-collapse">
                      <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-1.5 pr-3">Who</th><th className="pb-1.5 pr-3">Will</th><th className="pb-1.5 pr-3">Pension</th><th className="pb-1.5 pr-3">Before tax</th><th className="pb-1.5 pr-3">Estate tax</th><th className="pb-1.5 pr-3">Their income tax</th><th className="pb-1.5 pr-3">They keep</th><th className="pb-1.5">Effective rate</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {inheritanceView.chosen.beneficiaries.map(b => (
                          <tr key={b.id}>
                            <td className="py-1.5 pr-3 font-sans font-semibold text-slate-800">{b.name || E.IHT_RELATIONSHIPS[b.relationship].label}<span className="block text-[10px] text-slate-400 font-normal">{E.IHT_RELATIONSHIPS[b.relationship].label}</span></td>
                            <td className="py-1.5 pr-3">{b.sharePct.toFixed(0)}%</td>
                            <td className="py-1.5 pr-3 text-purple-700">{b.penSharePct.toFixed(0)}%<span className="block text-[10px] text-slate-400 font-sans">{b.pensionPart > 0 ? `${formatGBP(b.pensionPart)} over ${b.spreadYears}y` : '—'}</span></td>
                            <td className="py-1.5 pr-3">{formatGBP(b.gross)}</td>
                            <td className="py-1.5 pr-3 text-rose-700">{b.ihtBorne > 0 ? formatGBP(b.ihtBorne) : '—'}</td>
                            <td className="py-1.5 pr-3 text-rose-700">{b.incomeTaxOnPension > 0 ? formatGBP(b.incomeTaxOnPension) : '—'}</td>
                            <td className="py-1.5 pr-3 text-emerald-700 font-bold">{formatGBP(b.net)}</td>
                            <td className="py-1.5">{b.effectiveRatePct.toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Inheritance tax is charged on the estate, so an exempt person&rsquo;s share is untouched and the taxable beneficiaries carry the whole bill between them. The will column divides everything except the pension; the pension column is your nomination form, which is a separate document. An inherited pension is assumed drawn evenly over the years shown, at the income each person has given here — drawing it faster, or a change in their circumstances, would cost more.</span>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'historical' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm"><History className="w-4 h-4 text-indigo-600" /> Empirical Historical Backtest ({E.HISTORICAL_FIRST_YEAR}–{E.HISTORICAL_LAST_YEAR})</div>
              <p>Feeds actual historical real returns (US large-cap equities and a 50/50 government/corporate bond blend, weighted by each wrapper's risk tier) into your plan, <strong>starting from today (Age {currentAge})</strong> through to Age {terminalAge}.</p>
              <p className="text-slate-500">Selectable start years are capped at <strong>{maxHistoricalStartYear}</strong> so your {spanYears}-year plan runs within recorded history through {E.HISTORICAL_LAST_YEAR}.{historicalMetrics?.beyondData && ' Years beyond the dataset use the expected return.'}</p>
              <p className="text-slate-500">Your working years cannot run the pot dry, because your living spend is only drawn from the first retirement onwards. The verdict below therefore counts <strong>drawdown years</strong>, not calendar years — a plan that fails the moment you stop working has funded nothing, however far away that moment is.</p>
            </div>
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div><h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Historical Scenario or Start Year</h3><span className="text-[11px] text-slate-500">Select an iconic crisis preset or slide to any year between {E.HISTORICAL_FIRST_YEAR} and {maxHistoricalStartYear}.</span></div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-indigo-700"><span>Start Year:</span><input type="number" min={E.HISTORICAL_FIRST_YEAR} max={maxHistoricalStartYear} value={activeHistoricalStartYear} onChange={(e) => setSelectedHistoricalYear(Math.max(E.HISTORICAL_FIRST_YEAR, Math.min(maxHistoricalStartYear, Number(e.target.value) || E.HISTORICAL_FIRST_YEAR)))} className="w-16 p-1 bg-surface border border-slate-300 rounded text-center text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {HISTORICAL_PRESETS.map(p => {
                  const isValid = p.year <= maxHistoricalStartYear;
                  return (
                    <button key={p.year} onClick={() => isValid && setSelectedHistoricalYear(p.year)} disabled={!isValid} className={`p-2.5 rounded-xl border text-left transition-all ${!isValid ? 'bg-slate-50 text-slate-300 border-slate-200/50 cursor-not-allowed opacity-50' : activeHistoricalStartYear === p.year ? 'bg-indigo-600 dark:bg-[#A9781F] text-white border-indigo-600 shadow-xs cursor-pointer' : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer'}`}>
                      <div className="flex items-center justify-between"><span className="font-bold text-xs">{p.year}</span>{!isValid && <span className="text-[9px] text-slate-400 font-sans">Over {E.HISTORICAL_LAST_YEAR}</span>}</div>
                      <div className={`text-[10px] leading-tight truncate mt-0.5 ${!isValid ? 'text-slate-300' : activeHistoricalStartYear === p.year ? 'text-indigo-100' : 'text-slate-500'}`}>{p.label.split('(')[0]}</div>
                    </button>
                  );
                })}
              </div>
              <div className="pt-2 flex items-center gap-3"><span className="text-xs font-mono text-slate-400">{E.HISTORICAL_FIRST_YEAR}</span><input type="range" min={E.HISTORICAL_FIRST_YEAR} max={maxHistoricalStartYear} value={activeHistoricalStartYear} onChange={(e) => setSelectedHistoricalYear(Number(e.target.value))} className="w-full accent-indigo-600 cursor-pointer" /><span className="text-xs font-mono text-slate-600 font-bold">{maxHistoricalStartYear}</span></div>
            </div>
            {historicalMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border shadow-xs ${historicalMetrics.survived ? 'bg-emerald-50/90 border-emerald-200' : 'bg-rose-50/90 border-rose-200'}`}>
                  <span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Backtest Verdict</span>
                  <div className="flex items-center gap-2">{historicalMetrics.survived ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />}<div><div className={`text-base font-black font-display italic ${historicalMetrics.survived ? 'text-emerald-800' : 'text-rose-800'}`}>{historicalMetrics.survived ? `Survived all ${spanYears} years` : historicalMetrics.failReason === 'floor' ? `All ${spanYears} years funded, below floor` : historicalMetrics.failedBeforeDrawdown ? `Ran dry before retirement, at Age ${historicalMetrics.failAge}` : historicalMetrics.fundedDrawdownYears <= 0 ? `Ran dry in year 1 of ${historicalMetrics.drawdownYears} drawdown years` : `Ran dry after ${historicalMetrics.fundedDrawdownYears} of ${historicalMetrics.drawdownYears} drawdown years`}</div><span className="text-[11px] text-slate-500">{historicalMetrics.survived ? `Age ${currentAge} to ${terminalAge}, no shortfall in any year`
                    : historicalMetrics.failReason === 'floor' ? `Ends below the ${formatGBP(ctx.solvencyFloor)} bequest floor at Age ${terminalAge}`
                      : `${historicalMetrics.failReason === 'pre-access' ? `Pension still locked at Age ${historicalMetrics.failAge}` : `Age ${historicalMetrics.failAge}`} (${historicalMetrics.failYear}) · ${historicalMetrics.unfundedYears} of ${spanYears} plan years unfunded${historicalMetrics.failCost > 0 ? ` · a ${formatGBP(historicalMetrics.failCost)} one-off cost falls that year` : ''}`}</span></div></div>
                </div>
                <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs"><span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Starting Balance (Today)</span><div className="text-xl font-bold font-mono text-slate-900 mt-1">{formatGBP(historicalMetrics.startVal)}</div><span className="text-[11px] text-slate-400">After year-0 flows, at Age {currentAge}</span></div>
                <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs"><span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Lowest Portfolio Trough</span><div className="text-xl font-bold font-mono text-amber-700 mt-1">{formatGBP(historicalMetrics.minVal)}</div><span className="text-[11px] text-slate-400">Lowest total experienced</span></div>
                <div className="bg-surface border border-slate-200/90 p-4 rounded-2xl shadow-xs"><span className="text-[11px] font-bold uppercase tracking-wider block text-slate-500 mb-1">Terminal Pot @ {terminalAge}</span><div className={`text-xl font-bold font-mono mt-1 ${historicalMetrics.terminalVal > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatGBP(historicalMetrics.terminalVal)}</div><span className="text-[11px] text-slate-400">Real purchasing power remaining · lifetime tax {formatGBP(historicalMetrics.lifetimeTax)}</span></div>
              </div>
            )}
            <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
              <div><h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Historical Wealth Path (Simulating {activeHistoricalStartYear}–{activeHistoricalStartYear + spanYears})</h3><span className="text-xs text-slate-500">Real purchasing power across accumulation and decumulation</span></div>
              <div className="relative overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none" onMouseLeave={() => setHoveredHistPoint(null)}>
                  <g transform={`translate(${margin.left}, ${margin.top})`}>
                    {histYScale.ticks(6).map((t, i) => <g key={i} transform={`translate(0, ${histYScale(t)})`}><line x2={innerWidth} stroke={cp.gridMajor} strokeDasharray="3,3" /><text x={-10} dy="0.32em" fill={cp.axisText} fontSize="10" textAnchor="end" fontFamily="monospace">£{(t / 1000).toFixed(0)}k</text></g>)}
                    {histXScale.ticks(10).map((t, i) => <g key={i} transform={`translate(${histXScale(t)}, 0)`}><line y2={innerHeight} stroke={cp.gridMinor} /><text y={innerHeight + 20} fill={cp.axisText} fontSize="11" textAnchor="middle" fontFamily="monospace">{t}</text></g>)}
                    {markers(histXScale)}
                    {histLinePath && <path d={histLinePath} fill="none" stroke={cp.historicalLine} strokeWidth="3" strokeLinecap="round" />}
                    <rect width={innerWidth} height={innerHeight} fill="transparent" onMouseMove={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const age = Math.round(histXScale.invert((e.clientX - rect.left) * (innerWidth / Math.max(1, rect.width)))); setHoveredHistPoint(historicalTimeline.find(d => d.ageSelf === age) || null); }} />
                    {hoveredHistPoint && <g transform={`translate(${histXScale(hoveredHistPoint.ageSelf)}, 0)`}><line y2={innerHeight} stroke={cp.hoverCrosshair} strokeWidth="1" strokeDasharray="2,2" /><circle cy={histYScale(hoveredHistPoint.totalCombined)} r="4" fill={cp.historicalHoverFill} stroke={cp.hoverDotStroke} strokeWidth="2" /></g>}
                  </g>
                </svg>
                {hoveredHistPoint && (
                  <div className="absolute top-4 left-24 bg-surface/95 border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1 backdrop-blur-md pointer-events-none">
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
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT */}
        {activeTab === 'audit' && (
          <div className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div><h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Table className="w-4 h-4 text-blue-600" /> Year-by-Year Cash Flow &amp; Wrapper Ledger</h2><span className="text-xs text-slate-500">Expected-return path: contributions, guaranteed income, decumulation waterfall, tax and wrapper balances (end of year).</span></div>
              <button onClick={handleExportCSV} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer self-start sm:self-auto"><FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV Spreadsheet</button>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold font-sans"><tr><th className="p-2.5">Year</th><th className="p-2.5">Age (M)</th>{isCouple && <th className="p-2.5">Age (P)</th>}<th className="p-2.5">Spend Target</th><th className="p-2.5">Guaranteed + Take-home (net)</th><th className="p-2.5">Net Drawdown</th><th className="p-2.5">Pension Draw (gross)</th><th className="p-2.5">Tax</th>{P.cgtEnabled && <th className="p-2.5">CGT</th>}<th className="p-2.5">Pensions</th><th className="p-2.5">ISAs</th><th className="p-2.5">Other Inv</th><th className="p-2.5">Cash</th><th className="p-2.5">Total Combined</th><th className="p-2.5">Pre-SIPP access Liquid</th><th className="p-2.5 text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {timelineData.map(r => (
                    <tr key={r.year} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2 font-bold text-slate-800">{r.year}</td><td className="p-2">{r.ageSelf}</td>{isCouple && <td className="p-2">{r.agePart}</td>}
                      <td className="p-2 font-sans font-medium text-slate-700">{formatGBP(r.targetSpend)}</td>
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
        )}

        {/* TAB 7: DOCS */}
        {activeTab === 'docs' && (
          <div className="space-y-6">
            <div id="doc-mc-buttons" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Dices className="w-4 h-4 text-blue-600" /> The Three Stages of a Monte Carlo Run</h2>
              <p className="text-xs text-slate-600 leading-relaxed">Two of these run from one button on the Projection tab, each result appearing as its stage finishes. They use the same engine on the same {MC_TRIALS.toLocaleString()} randomised market paths and differ only in which side of the equation is held fixed: one fixes your spending and reports the risk, the other fixes the risk and reports the spending. The second can be switched off if you only want the fast answer. The third leaves both alone and changes where the money sits instead; it answers a different question, so it has its own tab and its own button.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-800 block">Stage 1, always runs: "will this plan hold?"</strong>
                  <p className="text-slate-500">Takes the target living expenditure from Plan Inputs exactly as entered and runs it through {MC_TRIALS.toLocaleString()} paths. The answer is a <strong>survival rate</strong>: the share of paths that funded every year to age {terminalAge} without running dry and finished above your bequest floor. Use it once you know roughly what you want to spend. This stage reports a probability rather than targeting one, so the target survival rate does not affect it.</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-800 block">Stage 2, optional: "how much could I spend?"</strong>
                  <p className="text-slate-500">Ignores your target figure and solves for the <strong>largest annual spend</strong> that still survives at the target survival rate you pick. It bisects on the spending amount, re-running the full simulation at each step, which is why it takes longer than the first stage. At 95% it finds the spend that fails in no more than 1 path in 20. Because it describes a different spend from the one you entered, it gets its own line in the verdict and its own row of figures, rather than overwriting stage 1.</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-800 block">The target survival rate (85 / 90 / 95%)</strong>
                  <p className="text-slate-500">Only affects stage 2. It is the share of paths you are asking the spending figure to survive, so a <em>lower</em> target returns a <em>higher</em> figure: 85% buys you more income now in exchange for a 1-in-7 chance of running short. 95% is the conventional planning benchmark. Changing it after a run offers to solve stage 2 again on its own, since nothing else depends on it.</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-800 block">On the Strategy tab: "would a different split do better?"</strong>
                  <p className="text-slate-500">Holds your spending and your budget fixed and re-splits the budget between wrappers, scoring each strategy on identical market paths. It is the slowest stage because it runs several full simulations, and two of its players search a range of candidates first. The methodology and the players are documented below.</p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <strong className="text-slate-800 block">One expected path, two ranges</strong>
                <p className="text-slate-500">Stage 1 keeps every simulated path, not just its ending, so the chart can show where all {MC_TRIALS.toLocaleString()} of them stood at each age: the shaded band is the 10th to 90th percentile, the solid line the median. Read the right-hand edge and you get the same three pot figures reported underneath it, because both use the same quantile. No path follows any of the three lines, and the band widens with age because nothing cancels out the early years.</p>
                <p className="text-slate-500">The rate-based and Monte Carlo charts share a y-scale so they can be read against each other directly. What that shows is how little of the distribution a single line accounts for. The line itself is well placed &mdash; it tracks the simulated median to within a few percent (measured &minus;3.5%, &minus;1.5% and +0.4% across three households), because the engine compounds the same rate it draws around as the median of each year&rsquo;s return. The point is the distance above and below it. Read on its own, a single curve looks like an answer; against the spread of {MC_TRIALS.toLocaleString()} paths it is visibly one thread of a very wide cloth.</p>
                <p className="text-slate-500">The rate-based band answers the same question far more cheaply, as a shaded band either side of the expected line that redraws as you type. Each edge takes that age&rsquo;s own quantile rate: the spread of an annualised return is &radic;(sp&sup2; + &sigma;&sup2;/T) and narrows with the horizon, so one rate cannot describe every age on a chart &mdash; held fixed it is out by 24&ndash;29% at age 50 on a 45-year plan. Re-derived per age it lands within 2&ndash;3% of the Monte Carlo.</p>
                <p className="text-slate-500">What survives is the real difference between the two. The band cannot run dry, because a smooth line has no bad decade in it; the fan can, because it is made of paths that did. So the band&rsquo;s lower edge stays optimistic, and increasingly so as a plan weakens &mdash; 5.5% out at 99.5% survival, 16.2% at 97.3%, 98% at 91.3%. Use the band to see the shape of the range as you type, and the fan when the downside is the decision.</p>
                <p className="text-slate-500">Where the lower edge touches zero, a tenth of the paths have run dry by that age. That is a statement no smooth line could have made.</p>
                <p className="text-slate-500"><strong className="text-slate-800">Sequence risk, priced.</strong> The card under the chart puts a number on the same effect rather than describing it. It takes each tier&rsquo;s 10th-percentile annualised return &mdash; the unlucky column of the Config risk matrix, over your own horizon &mdash; compounds it evenly to age {terminalAge}, and sets that against the 10th-percentile pot the simulation actually produced. The two runs share an expected return, a plan and a horizon; all that separates them is the order the returns arrive in, so the difference is sequence risk in pounds. It is one-sided by nature: the same comparison at the 90th percentile comes out far smaller, and sometimes favourable, because selling units cheaply to live on is irreversible in a way that buying them cheaply is not. While you are still contributing it disappears, and can turn mildly favourable &mdash; a bumpy path buys more units when prices are low. This is also the one thing a published return forecast cannot supply, however detailed: withdrawal order is not a property of a return distribution.</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed"><strong className="text-slate-800">Reading any of it honestly.</strong> Every figure is in today&rsquo;s money. The headline carries a &plusmn; sampling error: at {MC_TRIALS.toLocaleString()} trials a difference smaller than that is noise, so treat 94.2% and 95.1% as the same answer. Check the <strong>pre-SIPP access failure</strong> line separately: a plan can survive overall while still stranding you before age {nmpa}, which is a bridging problem, not a saving-enough problem. A path counts as failed in any year that living costs or a one-off cost cannot be met from an accessible wrapper, or if the terminal pot ends below your bequest floor. Paths are seeded, so the same seed reproduces the result exactly; change the seed in Config to test a different draw of markets.</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">No stage changes your plan on its own. Applying a strategy from stage 3 is a separate, deliberate click.</p>
            </div>

            <div id="doc-tournament" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-600" /> Automated Strategy Tournament &amp; Optimisation Methodology</h2>
              <p className="text-xs text-slate-600 leading-relaxed">The tournament compares six ways of splitting the same annual take-home budget between S&amp;S ISAs and pensions. Every player is run on the same {TOURNAMENT_TRIALS.toLocaleString()} market paths (common random numbers), so the ranking reflects the strategies rather than sampling luck. Any saved scenario can be entered as an extra player; those run exactly as saved and are not held to the same budget, which their cards state.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"><strong className="text-slate-800 block">1. Equal net budget</strong><p className="text-slate-500">Each strategy costs the same take-home pay. Pension money is grossed up using each owner's own salary (income tax + NIC relief, plus any employer NIC pass-through set in Config), capped by the annual allowance (£{P.pensionAllowance.toLocaleString()}) and salary; ISA money is capped at £{P.isaAllowance.toLocaleString()} per person; anything left over flows to a GIA.</p></div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"><strong className="text-slate-800 block">2. Conservative bridge sizing</strong><p className="text-slate-500">If spending starts before anyone can access a pension (age {nmpa}), the bridge reserve is the sum of net drawdown in those years (after guaranteed income and a working partner's take-home), uplifted by the safety margin ({E.num(plan?.config?.bridgeSafetyMargin, 30)}%) and assuming 0% real growth.</p></div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"><strong className="text-slate-800 block">3. The players</strong><p className="text-slate-500"><strong>Current Plan</strong> · <strong>Survival Maximizer</strong> (searches the ISA share from 0% to 100% and keeps the best survival, subject to the bridge-risk cap) · <strong>Bridge-Sized Relief</strong> (pension-first, with only the pre-access bridge carved out: the requirement is sized with growth counted on both existing balances and new contributions, then cover levels either side of it are searched, some paid in level and some over the final years only, and spare ISA capital above the reserve is moved into the pension) · <strong>Relief-First</strong> (pension first, bridge minimum kept; with a Bed &amp; SIPP transfer of spare ISA capital in full scope) · <strong>Bracket-Smoothed Sizing</strong> (pension funded only to the pot whose sustainable withdrawal plus state pension fills the basic-rate band, the rest to ISA) · <strong>Relief-First, Bridge-Last</strong> (pension-max early, ISA-max in the final years before retirement).</p></div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1"><strong className="text-slate-800 block">4. Reading the results</strong><p className="text-slate-500">Rank by survival first; ties within 0.5 points are broken by the 10th-percentile pot. Watch the pre-SIPP access failure rate: a strategy can win on total survival by accepting more bridge risk. The "Partner balancing" option steers new money to the partner with the smaller projected pension so both personal allowances can be used in retirement; it costs relief if that partner pays a lower marginal rate, so it does not always win.</p></div>
              </div>
            </div>

            <div id="doc-decumulation" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Sliders className="w-4 h-4 text-blue-600" /> Decumulation Policies &amp; Pension Drawdown Strategies</h2>
              <p className="text-xs text-slate-600 leading-relaxed">How money is withdrawn across wrappers changes lifetime tax and the size of the pot left at the end; it changes the probability of maintaining your living costs far less than the spend level, asset allocation and the pre-SIPP access bridge do.</p>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
                <li><strong>Tax Smoothing (default):</strong> fills the £{P.pa.toLocaleString()} allowance from pension income (0%), then draws pension income up to the £{P.basicLimit.toLocaleString()} higher-rate threshold (about {Math.round((1 - P.pclsProp) * P.basicRate * 100)}% effective with the {Math.round(P.pclsProp * 100)}% tax-free element), then cash, GIA and ISA, with pension income above the threshold as the last resort. Cash and ISAs are preserved as the low-volatility reserve and the tax-free shield for later life.</li>
                <li><strong>UK FIRE Bracket Fill:</strong> draws pension only up to the £{P.pa.toLocaleString()} allowance, then cash, GIA and ISAs; pension income above the allowance is the last resort. Pays the least tax during your lifetime and leaves the largest pot, but that pot is mostly taxable pension. Set the pension death-tax haircut in Config to see the difference net of what beneficiaries would pay.</li>
                <li><strong>Sequential:</strong> cash → GIA → ISA → pension, no bracket management. Shown as the naive baseline; it wastes the personal allowance in early retirement.</li>
                <li><strong>Harvest unused allowance:</strong> once retired and past age {nmpa}, any unused 0% allowance is filled from the pension and the net proceeds moved to ISA (within the £{P.isaAllowance.toLocaleString()} limit) or cash. It only matters when spending is largely covered by guaranteed income.</li>
                <li><strong>Phased Drawdown</strong> crystallises {Math.round(P.pclsProp * 100)}% tax-free with each withdrawal (UFPLS-style), keeping the rest invested. <strong>Full Lump Sum</strong> moves the maximum tax-free cash (capped at £{P.lsa.toLocaleString()}) into cash savings at retirement; later withdrawals are then fully taxable.</li>
              </ul>
            </div>

            <div id="doc-coverage" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Modelling Decisions, Coverage &amp; Known Gaps</h2>
              <p className="text-xs text-slate-600 leading-relaxed">Where the rules leave room for judgement, this is the decision the model makes and why. Read this before trusting a number.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Decisions taken</h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li><strong>Everything is in today's money.</strong> Growth uses each tier's <em>real</em> rate, so every pot, spend and bequest figure is in today's purchasing power. The "Combined (Nominal)" chart series is the only place inflation is added back, for display. A £100,000 bequest floor therefore means £100,000 of today's money. Do not gross it up.</li>
                <li><strong>Pay is flat in real terms unless you say otherwise.</strong> Salary, or trading profit for the self-employed, is held at the figure you enter for every working year. Because the projection is in today's money that is not a frozen wage, it is pay rising exactly with inflation. Set a real growth rate per person under Advanced inputs to model promotions or a career winding down; it compounds on top of inflation and feeds the relevant-earnings cap, the annual allowance taper and the relief rate on every pension contribution.</li>
                <li><strong>The MPAA is derived, not declared.</strong> The model runs the expected path once, finds the first year each person draws taxable pension income, and applies the £{P.mpaaLimit.toLocaleString()} allowance from that age. It assumes you have <em>not</em> already flexibly accessed a pension: reasonable for planning, wrong if you have, which would need the trigger set earlier.</li>
                <li><strong>Carry-forward is not consumed.</strong> Unused allowance from the prior three years is offered as headroom but is not tracked as being used up, so a plan that leans on it repeatedly is optimistic. It never lifts the earnings limit, and it accrues at each prior year's <em>tapered</em> allowance.</li>
                <li><strong>The annual allowance taper keys off earnings.</strong> HMRC tapers on adjusted income, which adds employer contributions; the model only knows earnings, so the taper is approximate for anyone near the £{P.aaTaperThr.toLocaleString()} threshold.</li>
                <li><strong>A blank salary means "unknown", not "zero".</strong> While you are still working, leaving salary empty leaves the pension allowance unconstrained rather than dropping it to £{P.pensionNoEarningsLimit.toLocaleString()}. Enter a salary for an accurate limit.</li>
                <li><strong>CGT is realisation-based.</strong> Gains are booked only when the GIA is actually sold, using a running cost basis. Gains are wiped by the uplift on death, so nothing is charged on whatever remains at the terminal age.</li>
                <li><strong>The tournament holds contributions equal.</strong> Every strategy is re-priced to cost the same total over the accumulation years as your current plan, by solving its contribution escalation. Without this a strategy could win simply by asking you to pay in more.</li>
                <li><strong>Allowance harvesting is a bequest tool.</strong> It never improves survival. It moves money from a pot taxed on death into one that is not. It is worth nothing unless you set a pension death tax rate, and close calls are broken on the pot left <em>after</em> that tax.</li>
                <li><strong>The self-employed get income tax relief only.</strong> A sole trader cannot salary sacrifice, so a personal contribution saves income tax at the marginal rate but no NIC, and no employer NIC can be passed through. That is 40% relief for a higher-rate trader against 42% for an employee, and 20% against 28% in the basic band. Set the employment type per person in Advanced inputs.</li>
                <li><strong>Allowances are frozen in real terms</strong> at the Config figures. Any future rise in the ISA or pension allowance is not modelled, so long staging schedules are deliberately cautious.</li>
              </ul>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Modelled</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Income tax including the personal-allowance taper, employee Class 1 NIC and self-employed Class 4 NIC, the {Math.round(P.pclsProp * 100)}% tax-free element capped at the £{P.lsa.toLocaleString()} Lump Sum Allowance, the £{P.pensionAllowance.toLocaleString()} annual allowance with taper and three-year carry-forward, the relevant-earnings limit, the MPAA, ISA allowances, realisation-based CGT with its annual exempt amount and band split, state pension timing, the pre-SIPP access bridge, one-off deposits with multi-year staging, one-off costs, spending bands by age, salary-sacrifice relief including any employer NIC pass-through, and relief at source for the self-employed.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Not modelled yet</h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li><strong>Lumpy self-employed profits.</strong> Trading profit is carried as a single figure that grows at a steady rate, exactly like a salary. Real self-employment swings year to year, and a bad year can waste an annual allowance that carry-forward only partly recovers. <strong>Class 2 NIC</strong> is also not charged: it stopped being mandatory above the Small Profits Threshold in 2024, and the voluntary route for those below it does not change a projection. Payments on account, the trading allowance, capital allowances and incorporation are all out of scope.</li>
                <li><strong>Devolved income tax:</strong> covered. Set where you pay tax in Config. Scotland uses its own six bands, Wales
                  is offered but currently matches England and Northern Ireland. Only the bands are devolved: National Insurance, capital gains
                  tax, the personal allowance and its taper apply unchanged, and relief at source on a pension contribution stays at 20%.
                  Note that the region only shows up where the model actually routes income through the tax calculation - pension drawdown,
                  the state pension and other taxable income - so it does not change a projection whose earning years are all before anyone
                  has retired.</li>
                <li><strong>Inheritance tax on the estate.</strong> The pension death tax setting applies a haircut to leftover pension only, so it represents the <em>extra</em> tax a pension suffers relative to an ISA, not IHT on everything.</li>
                <li><strong>Defined benefit pensions</strong> beyond entering them as a taxable income stream; no accrual, revaluation or transfer values.</li>
                <li><strong>Care costs, the Lifetime ISA, the National Minimum Wage floor on salary sacrifice, dividend and savings-interest taxation inside the GIA, share pooling and the 30-day CGT rule.</strong></li>
                <li><strong>Allowance and threshold changes</strong> announced for future years, and any change to the state pension triple lock.</li>
              </ul>
              <p className="text-xs text-slate-500 leading-relaxed">This is an educational model, not advice. Where a figure matters to a real decision, check it against current HMRC guidance or a regulated adviser.</p>
            </div>

            <div id="doc-taper" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-600" /> Spending by Age</h2>
              <p className="text-xs text-slate-600 leading-relaxed">Retirement spending often isn't flat. Set what a stretch of years actually costs in Plan Inputs as bands: a start age, an end age and what those years cost in today's money. A band that names ages 58 to 67 at {formatGBP(45000)}, then 68 to 79 at {formatGBP(34000)}, then 80 onwards at {formatGBP(40000)}, says exactly that, including the rise at the end for care. Ages are "Myself" ages.</p>
              <p className="text-xs text-slate-600 leading-relaxed">Bands only override the years they cover. Any year outside every band falls back to the headline living spend, so naming a single expensive stretch is enough; you do not have to describe the whole retirement. Leave the end age blank to run a band to the terminal age. If two bands overlap the earlier one wins for the shared years, and the model says so in the warnings rather than picking silently.</p>
              <p className="text-xs text-slate-500 leading-relaxed">Bands replaced an older pair of percentage "tapers" that could only step spending down at two fixed ages. Any saved plan still carrying tapers is converted to the equivalent bands when it loads, so its projection is unchanged. The safe-spend solver scales the whole shape at once: it finds the multiple of your headline spend that survives, and every band moves with it in proportion.</p>
            </div>

            <div id="doc-risk-profiles" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /> Asset Allocations, Return Bounds &amp; Volatility (σ)</h2>
              <p className="text-xs text-slate-600 leading-relaxed">Each wrapper is assigned a risk tier carrying an expected real return (treated as the median annual rate), a volatility, and a forecast uncertainty. The first two describe the <em>path</em>; the third describes how sure we are of the average that path is scattered around, and the distinction matters more the longer you plan for. Volatility averages out as σ/√T. Being wrong about the long-run average does not average out at all, so it is drawn once per simulated path and then lived with, giving an annualised spread of √(u² + σ²/T). The built-in tiers set that uncertainty to zero, which is itself a claim — that we know the long-run average and are only unsure of the route — and a published set of capital market assumptions will generally say otherwise.</p>
              <p className="text-xs text-slate-600 leading-relaxed"><strong className="text-slate-800">&ldquo;Expected&rdquo; here means the middle, not the average.</strong> The figure in the first column is the <em>median</em> rate: half the simulated years land above it and half below. Compound the middle rate and you get the middle outcome, which is why the Expected line on the Projection chart sits almost exactly on the simulation&rsquo;s median &mdash; within half a percent on a plain lump sum, and within about 3&frac12;% on a real plan, where contributions and tax blur it slightly.</p>
              <p className="text-xs text-slate-600 leading-relaxed">The <em>average</em> would be a much bigger number and a far less useful one. Picture a casino floor: nobody is made to stop while they are winning, but everybody stops at zero. Money behaves the same way. A pot that compounds well keeps compounding with nothing above it, while a pot that runs dry is finished and stays finished &mdash; so a handful of runaway futures drag the average up and away from anything the rest experience. On one ordinary plan modelled here the middle outcome is {formatGBP(7193811)} while the average is {formatGBP(22457043)}: more than three times higher, and a figure almost nobody in the simulation actually ends up with. You plan around the outcome in the middle, so the middle rate is what this model compounds. It is the standard convention too &mdash; published capital market assumptions quote annualised returns, not arithmetic ones.</p>
              <p className="text-xs text-slate-600 leading-relaxed">The 10th and 90th percentile columns beside them are that spread at the two tails: over your horizon the annualised return lands between them eight times in ten. They also draw the rate-based band on the Projection chart, re-derived at every age rather than held at one rate, because that spread narrows as the horizon lengthens and a single rate is wrong everywhere except the horizon it came from. What they cannot do is stand in for the simulation: a smooth curve contains no bad decade and cannot run dry, so its lower edge stays optimistic on a plan under strain. All wrappers move together (one market factor scaled by each tier's σ), so the correlations a published set also carries cannot be used without a second factor; the historical backtest blends real US equity and bond returns by the tier's equity weight ({Object.entries(E.RISK_EQUITY_WEIGHTS).map(([k, v]) => `${k.replace(' Risk', '')} ${Math.round(v * 100)}%`).join(', ')}).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {Object.entries(activeRiskMatrix).map(([k, v]) => (
                  <div key={k} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"><span className="font-bold text-slate-800">{k} ({v.label})</span><p className="text-slate-500">Expected real {E.num(v.real, 0).toFixed(2)}% pa, σ = {E.num(v.volatility, 0).toFixed(1)}%.</p></div>
                ))}
              </div>
            </div>

            <div id="doc-one-off-deposits" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> One-Off Deposits &amp; Multi-Year Staging</h2>
              <p className="text-xs text-slate-600 leading-relaxed">A one-off deposit is a lump sum paid into a chosen wrapper in a chosen year. Because ISAs and pensions are capped each tax year, the engine checks the deposit against that year's remaining allowance before it lands.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Where the money comes from</h3>
              <p className="text-xs text-slate-600 leading-relaxed"><strong>External (new capital)</strong> is money arriving from outside the plan (an inheritance, a bonus, a property sale), and nothing is deducted from your existing pots. Choosing any wrapper instead treats it as an internal transfer: the full amount is taken out of that pot in the deposit year. If that pot does not hold enough at the time, the engine moves what is there and the rest is recorded as a shortfall.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">How much fits this year (headroom)</h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li><strong>S&amp;S ISA:</strong> {formatGBP(P.isaAllowance)} less whatever your regular ISA contribution is that year.</li>
                <li><strong>Carry forward:</strong> unused annual allowance from the previous three tax years is added to the current year's. Years inside the projection are worked out from your contribution schedule; for the three years before it starts the model has no data, so it assumes nothing unless you enter a figure under Advanced inputs. Carry forward never lifts the earnings limit, so it does nothing for someone with no relevant earnings.</li>
                <li><strong>Pension after flexible access:</strong> taking taxable pension income permanently replaces the allowance with the money purchase annual allowance of {formatGBP(P.mpaaLimit)}, and carry forward is no longer available. Taking only tax-free cash, or buying an annuity, does not trigger it. You do not enter this: the model works out the first year your plan draws taxable pension income and applies it from there.</li>
                <li><strong>Pension:</strong> {formatGBP(P.pensionAllowance)}, but capped at your <em>relevant UK earnings</em>, less your regular pension contribution that year. Only employment and self-employment income counts as earnings; DB pensions, annuities, rent, dividends and interest do not. With no relevant earnings the limit is <strong>{formatGBP(P.pensionNoEarningsLimit)}</strong>, which is what normally applies once you have retired. If you leave your salary blank while still working, the engine treats your earnings as unknown and does not constrain the allowance.</li>
                <li><strong>Other Investments and Cash Savings:</strong> no annual limit, so a deposit there is never staged.</li>
              </ul>
              <p className="text-xs text-slate-600 leading-relaxed">Headroom is therefore not a fixed number. It shrinks in later years if your regular contributions escalate, and it changes again at retirement, when regular contributions stop and the pension earnings test begins to constrain it. The card above the deposits table shows this tax year only. Each deposit row shows the headroom for its own year.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">If the deposit exceeds the headroom</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Rather than silently breaching the allowance, the deposit is staged across several tax years:</p>
              <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
                <li>As much as fits the current year's allowance goes straight into the target wrapper.</li>
                <li>The surplus is parked in <strong>Other Investments (GIA)</strong>, where it stays invested and grows at that account's risk tier. Once it has grown, moving it out is a disposal, so with CGT switched on each transfer year realises a proportional gain.</li>
                <li>At the start of each following tax year, as much as that year's allowance permits is moved from the GIA into the target wrapper, repeating until nothing is left. You can redirect where the staged money ends up from the row's settings icon.</li>
              </ol>
              <p className="text-xs text-slate-600 leading-relaxed">Where several deposits compete for the same person's allowance in the same year, they are resolved in date order, so one allowance is never counted twice. If a market fall shrinks the parked money, that year's transfer is capped at whatever the GIA actually holds. Anything still parked at the end of the plan stays in Other Investments and is flagged as a warning.</p>

              <p className="text-xs text-slate-500 leading-relaxed"><strong>Assumption:</strong> allowances are held fixed in real terms at the figures in Config ({formatGBP(P.isaAllowance)} ISA, {formatGBP(P.pensionAllowance)} pension, {formatGBP(P.pensionNoEarningsLimit)} with no earnings). Any future increase in these limits is <strong>not</strong> modelled, so a long staging schedule is a cautious estimate. If allowances do rise, the money would move across in fewer years than shown. You can edit the figures in Config to test a different assumption.</p>
            </div>

            <div id="doc-inheritance" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Gift className="w-4 h-4 text-purple-600" /> Inheritance Tax: the rules, and what is not modelled</h2>
              <p className="text-xs text-slate-600 leading-relaxed">Rules as published for 2026/27 and checked in September 2026. Three of the four regimes below changed between 2025 and 2027, so they are all editable in Config rather than baked in — if a Budget moves them, change the figure rather than waiting for the app.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">The one change that inverts the usual advice</h3>
              <p className="text-xs text-slate-600 leading-relaxed">From <strong>6 April 2027</strong> an unused pension counts as part of your estate. Before that date it sat outside, which is the entire basis of the conventional &ldquo;spend everything else first&rdquo; advice. And if you die at <strong>{E.num(plan?.config?.pensionIncomeTaxFromAge, 75)} or over</strong>, your beneficiaries then pay their own income tax on what they draw from it — on top of the inheritance tax the estate already paid. At the additional rate that is roughly <strong>67%</strong> of that pound gone, against 40% for the same pound in an ISA.</p>
              <p className="text-xs text-slate-600 leading-relaxed">We tested whether that means you should drain the pension early. <strong>It does not.</strong> Across 360 households ranked on what heirs actually receive, a &ldquo;pension first&rdquo; policy won 6 times out of 3,600 — and on one wealthy household it left £6.2m where the best policy left £13.5m. Emptying a pension early means paying income tax at <em>your</em> marginal rate, on a large pot, during retirement, and the proceeds cannot be sheltered fast enough because the ISA allowance is £20,000 a year. The double charge is real and still cheaper than volunteering for the single one early.</p>
              <p className="text-xs text-slate-600 leading-relaxed">What the change really does is make the answer depend on facts a projection never asked for. The best policy for a household dying at 74 wins 59% of the time; for the same household dying at 80 it wins 21%. That is why this tab prices several ages rather than asking you to pick one.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">The allowances</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 pr-3 font-semibold text-slate-700">Nil-rate band</td><td className="py-1.5 pr-3 font-mono">{formatGBP(E.num(plan?.config?.ihtNrb, 325000))}</td><td className="py-1.5 text-slate-600">Frozen to 5 April 2031.</td></tr>
                    <tr><td className="py-1.5 pr-3 font-semibold text-slate-700">Residence nil-rate band</td><td className="py-1.5 pr-3 font-mono">{formatGBP(E.num(plan?.config?.ihtRnrb, 175000))}</td><td className="py-1.5 text-slate-600">Only if a home passes to a child, grandchild or step-child. Capped at the home&rsquo;s own value, and lost £1 for every £2 of estate above {formatGBP(E.num(plan?.config?.ihtRnrbTaperFrom, 2000000))}.</td></tr>
                    <tr><td className="py-1.5 pr-3 font-semibold text-slate-700">Transferred from a late spouse</td><td className="py-1.5 pr-3 font-mono">up to {formatGBP(E.num(plan?.config?.ihtNrb, 325000) + E.num(plan?.config?.ihtRnrb, 175000))}</td><td className="py-1.5 text-slate-600">Usually 100% of both, because anything passing to a spouse is exempt and so uses neither. Commonly missed.</td></tr>
                    <tr><td className="py-1.5 pr-3 font-semibold text-slate-700">Rate</td><td className="py-1.5 pr-3 font-mono">{E.num(plan?.config?.ihtRate, 40)}%</td><td className="py-1.5 text-slate-600">Falling to {E.num(plan?.config?.ihtCharityRate, 36)}% where at least {E.num(plan?.config?.ihtCharityThresholdPct, 10)}% of the estate goes to charity — so just past that point, giving more away costs your family nothing.</td></tr>
                    <tr><td className="py-1.5 pr-3 font-semibold text-slate-700">Quick succession relief</td><td className="py-1.5 pr-3 font-mono">{(E.DEFAULT_CONFIG.qsrScale || []).join('/')}%</td><td className="py-1.5 text-slate-600">Where you inherited within five years and tax was paid then, by whole years elapsed. <strong>Not automatic</strong> — it must be claimed.</td></tr>
                    <tr><td className="py-1.5 pr-3 font-semibold text-slate-700">Death on active service</td><td className="py-1.5 pr-3 font-mono">exempt</td><td className="py-1.5 text-slate-600">Full exemption for armed forces deaths from service, and since 2014 emergency services personnel and anyone targeted because of their job.</td></tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Who inherits changes the tax, not just the shares</h3>
              <p className="text-xs text-slate-600 leading-relaxed">A spouse or civil partner is fully exempt and passes their unused allowances on. A charity is exempt and can pull the rate down for everyone else. A direct descendant unlocks the residence allowance. Anyone else gets no relief. And because an inherited pension is taxed at the <em>recipient&rsquo;s</em> marginal rate, the same pot is worth materially more to a grandchild with no income than to a child earning six figures — identical estate, identical will, different outcome.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Two documents, not one</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Your will divides the house, ISAs, investments and cash. Your pension does not pass under it at all — it goes to whoever is named on the <strong>nomination form</strong> held by your scheme, which most people completed once on joining. The tab asks for both because an inherited pension is taxed at the <em>recipient&rsquo;s</em> marginal rate: nominating it to someone with an unused personal allowance, and leaving the taxed assets to higher-rate earners, is usually the single most valuable choice available. How long each person draws it over matters just as much — every year of drawing gets its own allowance and basic-rate band, so a young grandchild spreading it over twenty years pays a fraction of what the same pot costs drawn over five.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Selling your home does not lose the residence band</h3>
              <p className="text-xs text-slate-600 leading-relaxed">If you sell or give away the home on or after 8 July 2015 — to pay for care, typically — the <strong>downsizing addition</strong> preserves the band it would have given, as long as assets of at least that value pass to direct descendants instead. The plan applies it whenever the home is marked as sold. A partial downsizing, where you move somewhere cheaper, would need the value of both properties and is not asked for, so a household that trades down is modelled on the more cautious footing of having kept the newer home only.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Gifts out of income</h3>
              <p className="text-xs text-slate-600 leading-relaxed">The exemption for <em>normal expenditure out of income</em> (s.21) is immediate, unlimited and needs no seven years: a habitual gift, paid from income rather than capital, that leaves your standard of living intact. This is the only gift that helps someone who does not expect to live seven years, and it is claimed by the executors on form IHT403 — which is far easier when the giver kept a record. The plan checks the arithmetic half of the test, comparing the gift against guaranteed income and earnings less living costs, in the <em>leanest</em> year rather than on average. It excludes pension drawdown from that income figure even though HMRC will often accept regular pension income, because a gift that fails the test becomes an ordinary transfer with a seven-year clock. Whether the gift is genuinely habitual is a question about a pattern of behaviour that no calculator can settle.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">The estate optimiser, and what it will not do</h3>
              <p className="text-xs text-slate-600 leading-relaxed">The Inheritance tab carries a second search, for households the contributions tournament cannot help because nothing is being paid in. It ranks five choices on one number &mdash; what the heirs keep, after inheritance tax and after their own income tax on drawing an inherited pension down: the <strong>order you draw wrappers down</strong>, <strong>how far up the tax bands you draw the pension each year</strong>, a <strong>gift now</strong>, <strong>how the pension is split between the people inheriting it</strong>, and <strong>moving money between wrappers up to the allowances</strong> (including the £3,600 a year that basic-rate relief buys for £2,880 even with no earnings at all). Each lever is also measured on its own, against your plan untouched, because crediting whichever was searched first with everything the others deliver would send you after the wrong one.</p>
              <p className="text-xs text-slate-600 leading-relaxed">Two of those deserve a note. <strong>Drawing the pension past the tax-free allowance</strong> costs 20% today and only pays off if you die at 75 or over, when the pension is taxed twice &mdash; by the estate, then by the heir. The sign flips on the death age, so it is searched rather than recommended. And the <strong>pension split</strong> is swept in 5% steps rather than handed to whoever earns least, because that rule of thumb breaks on a large pot: £1.5m drawn over five years reaches the additional rate whoever receives it, while splitting it uses two sets of allowances. On one household here, half to a four-year-old and half to a £150,000 earner beat all of it to the four-year-old by £18,842.</p>
              <p className="text-xs text-slate-600 leading-relaxed">One thing the search will tell you it cannot improve: <strong>who receives which asset under your will</strong>. Inheritance tax is charged on the estate before it is divided, so among beneficiaries who are all taxable, giving one the house and another the ISA changes who gets what and not what survives. It moves the total only when someone exempt is named &mdash; a spouse or a charity &mdash; and then it is a question about who you want to benefit rather than about tax.</p>
              <p className="text-xs text-slate-600 leading-relaxed">Two things it deliberately refuses. It will not search <strong>how long your heirs take the pension</strong>, because that is their decision made after your death, and a candidate that won by assuming twenty years of patience from someone else would not be a plan &mdash; it is reported as a sensitivity instead. And it will not rank a <strong>charitable gift</strong>: leaving 10% cuts the rate from 40% to 36% but always leaves the family with less, so ranking it on what the heirs keep would score a donation as a failure. The cost and the benefit are both shown, and the choice stays yours. Nor will it recommend anything that leaves you short: a variant that breaks a plan which otherwise survives is rejected rather than ranked, however well it does for the estate.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Business Relief, and why it is absent</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Business Relief is the largest thing this tab does not model. Qualifying trading businesses, unquoted shares and AIM-listed shares can escape inheritance tax in whole or in part, which makes reallocating a portfolio into them the classic estate-planning move — and it is not offered here, deliberately, for three reasons. The relief needs the asset to have been <strong>owned for two years</strong> at death, so it is exactly the wrong tool for someone who has just been given a short prognosis. The regime changed from 6 April 2026: relief is no longer unlimited, an allowance applies above which relief falls to 50%, and AIM shares now attract 50% relief in every case rather than 100%. And the assets that qualify carry investment risk far above anything else in this plan, so a tool that modelled the tax saving without modelling that risk would be recommending a trade on half the picture. If it matters to your estate, it is a conversation with an adviser, and the figures on this tab will be too low.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">What this does not model</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Everyone receives the same proportion of every wrapper: a will leaving the pension to one person and the ISA to another is a legal document, not a plan input. An inherited pension is assumed drawn evenly over {E.num(plan?.config?.inheritedPensionSpreadYears, 5)} years at the income each beneficiary has given, which holds only while their circumstances do. Gifts, the seven-year rule, taper relief and regular gifts out of income are modelled; carrying an unused annual exemption forward is not, nor are the small-gift and wedding exemptions, Business Relief (above), a deed of variation after death, or life cover written in trust. Neither are trusts, business succession, or domicile.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Why only one gift is ever suggested</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Above {formatGBP(E.num(plan?.config?.ihtRnrbTaperFrom, 2000000))} the residence allowance is withdrawn £1 for every £2, and the test for it looks at what you <strong>owned at death</strong>. Money given away is not owned at death — so that allowance comes back the day the gift is made, seven years or not. Nothing else about gifting is so clear-cut: inside seven years a gift consumes the {formatGBP(E.num(plan?.config?.ihtNrb, 325000))} allowance the estate would have used anyway, so it is close to tax-neutral, and presenting it as a saving would be misleading. The tab therefore suggests the one gift that clears the taper and says plainly which part of the saving is certain and which part still needs the seven years.</p>
              <p className="text-xs text-slate-600 leading-relaxed">Sizing that gift is done by running your own plan, not by subtracting the excess: money given away also stops growing, and spending that would have come from it comes out of a pension instead, taxed on the way — so each £1 given can take £1 to £2 off the estate, and suggesting the excess itself would suggest roughly twice what is needed. The search stops at the largest gift the plan can still afford, since an allowance is no use to someone who has run out of money.</p>
              <p className="text-xs text-slate-600 leading-relaxed"><strong>One trap worth naming because a calculator cannot catch it:</strong> giving away your home and continuing to live in it does not remove it from your estate. That is a gift with reservation of benefit, it is the most common estate-planning mistake there is, and no figure on this page will warn you about it.</p>
              <p className="text-xs text-slate-500 leading-relaxed">All of this is illustration, not advice. Inheritance tax turns on facts about your family and your assets that a planning tool has no way to hold, and the amounts involved are usually large enough to be worth an hour of a professional&rsquo;s time.</p>
            </div>

            <div id="doc-priorities" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Trophy className="w-4 h-4 text-blue-600" /> Your Priorities, and the Policy Each One Chooses</h2>
              <p className="text-xs text-slate-600 leading-relaxed">A decumulation policy is only &quot;best&quot; relative to what you are trying to achieve. Across 360 test households, ranking on the size of the eventual pot rather than on not running out changed the recommended policy for <strong>64% of them</strong> &mdash; and took the simplest policy, Sequential, from winning 1% of households to winning 55%. Nothing about the policies changed; only the question being asked of them. That is why the priority order sits above the policy picker rather than inside it.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">How the order is applied</h3>
              <p className="text-xs text-slate-600 leading-relaxed">The list is worked down in order. Your first priority narrows the field to the settings that are best on it; the second then chooses among <em>those</em>, and so on. A lower priority can only ever break a near-tie on the ones above it, so ranking something first genuinely protects it: it is never traded away for a gain in something you ranked lower.</p>
              <p className="text-xs text-slate-600 leading-relaxed">&quot;Near-tie&quot; needs a number, or the top priority would decide everything, since exact ties are rare. Two settings count as equal when they are within <strong>{E.RATE_EPSILON_PTS} percentage point</strong> on a rate (survival, bridge risk) or <strong>{Math.round(E.MONEY_EPSILON_REL * 100)}%</strong> on an amount of money. The rate threshold is deliberately tighter than the money one: survival is already a probability, so three points of it (90% down to 87%) is a much larger concession than 3% of a pot, and one point sits comfortably above the noise in the simulation itself.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">What each priority is, and which policy it pushes towards</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead><tr className="border-b border-slate-200 text-slate-500 font-semibold"><th className="pb-1.5 pr-3">Priority</th><th className="pb-1.5 pr-3">What it measures</th><th className="pb-1.5">Why it favours the policy it does</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {E.PRIORITY_KEYS.map(k => (
                      <tr key={k} className="align-top">
                        <td className="py-1.5 pr-3 font-bold text-slate-800">{E.PRIORITY_METRICS[k].label}</td>
                        <td className="py-1.5 pr-3 text-slate-600">{E.PRIORITY_METRICS[k].why}</td>
                        <td className="py-1.5 text-slate-600">{E.PRIORITY_METRICS[k].serves}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Why the default is survival first</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Running out of money is the one outcome no later good luck can undo, and it is not symmetric with the others: a smaller bequest is a disappointment, an empty pot at 84 is a crisis. So the default order is <strong>not running out</strong>, then <strong>protecting the bad case</strong>, then what is left behind. Reorder it freely &mdash; but if you promote the pot or the bequest above survival, you are telling the model you would accept a materially higher chance of running dry in exchange, and it will do exactly that.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">What this does not yet cover</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Two priorities people legitimately hold are not on the list, because the model cannot yet measure them honestly. <strong>Keeping money reachable</strong> &mdash; a policy that drains ISAs early leaves you richer on paper but with wealth locked until pension age and taxable to reach &mdash; needs a measure of accessible wealth the engine does not currently report. <strong>Simplicity</strong> is real too: Sequential needs no annual bracket management, and that is worth something in effort and in avoided mistakes, but it is not a number this model can produce.</p>
            </div>

            <div id="doc-cgt" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-600" /> Capital Gains Tax on Other Investments (GIA)</h2>
              <p className="text-xs text-slate-600 leading-relaxed">Pensions and ISAs shelter growth, but a general investment account does not. When CGT is switched on in Config, the engine tracks the <strong>cost basis</strong> of each person's GIA and charges tax on gains as they are realised.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Growth is not taxed until you sell</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Holding costs nothing. Money paid in is added at cost; growth raises the value without raising the cost, so the unrealised gain builds up untaxed. Tax is only triggered by a disposal: funding your spending, paying a one-off cost, or moving money out under a staged deposit. Each disposal is treated as selling a slice of the whole holding, so the gain is the same proportion of the sale as the unrealised gain is of the pot.</p>
              <p className="text-xs text-slate-600 leading-relaxed">Example: a {formatGBP(100000)} GIA holding {formatGBP(40000)} of gain is 40% gain. Selling {formatGBP(10000)} realises {formatGBP(4000)}; the remaining {formatGBP(3000)} exemption leaves {formatGBP(1000)} taxable, so the bill is {formatGBP(180)} at the basic rate.</p>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Rates and allowances</h3>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                <li>Each person has a {formatGBP(P.cgtAnnualExempt)} annual exempt amount. If you have already realised gains this tax year, enter them in Plan Inputs so the current year's exemption is reduced; leaving it blank assumes the full allowance is available.</li>
                <li>Gains stack on top of that year's income: the part falling in your remaining basic-rate band is taxed at {Math.round(P.cgtBasicRate * 100)}%, anything above at {Math.round(P.cgtHigherRate * 100)}%.</li>
                <li>The bill is settled from cash, then the GIA, then ISAs, then an accessible pension. This is the same order used for one-off costs. Selling to pay the bill realises a little more gain, which is carried into the next year, mirroring the fact that CGT is due the January after the tax year.</li>
              </ul>

              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">Setting your opening position</h3>
              <p className="text-xs text-slate-600 leading-relaxed">The "of which unrealised gain" figure on the GIA row tells the engine how much of today's balance is profit. Left blank, the balance is treated as entirely cost, so only future growth is ever taxed, which may provide too much weight to GIA. If you hold long-standing investments with a large embedded gain, enter it, or the model will understate your tax.</p>

              <p className="text-xs text-slate-500 leading-relaxed"><strong>Deliberate omissions:</strong> gains are wiped by the uplift on death, so nothing is charged on whatever remains at the terminal age. This is a real reason to spend other wrappers first. Dividends and interest inside the GIA are not modelled separately, share pooling and the 30-day rule are ignored, and the exempt amount and rates are held flat in real terms at the Config figures.</p>
            </div>

            <div id="doc-one-offs" className="bg-surface border border-slate-200/90 p-5 rounded-2xl shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Coins className="w-4 h-4 text-blue-600" /> One-Off Cost Liquidation Hierarchy</h2>
              <p className="text-xs text-slate-600 leading-relaxed">When a one-off capital cost is scheduled, the engine liquidates assets in this order:</p>
              <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
                <li><strong>Cash Savings</strong> (both owners), then <strong>Other Investments (GIA)</strong>, then <strong>Stocks &amp; Shares ISAs</strong>.</li>
                <li><strong>Pensions</strong>, but only for an owner who has reached the access age ({nmpa}). If the cost still cannot be met, the year is flagged as a shortfall, or a pre-SIPP access gap when pension money existed but was locked.</li>
              </ol>
              <p className="text-xs text-slate-500">Known simplifications: state pension is held flat in real terms (no triple-lock uplift), tax thresholds and allowances are held flat in real terms, and the death of a partner is not modelled.</p>
              <p className="text-xs text-slate-500 leading-relaxed"><strong>Pension allowance limitations.</strong> The model assumes you have <strong>not</strong> yet flexibly accessed a pension, because it is built for planning towards retirement rather than for someone already drawing an income. If you have already taken taxable pension income, your annual allowance is already {formatGBP(P.mpaaLimit)} and the projection will overstate how much you can contribute until the year it starts drawing. Carry forward is also worked out independently for each year rather than being consumed as it is used, so several large staged deposits in overlapping years could each count the same unused allowance. Neither the tapered annual allowance for high earners nor annual allowance charges themselves are modelled.</p>
            </div>
          </div>
        )}

      </div>
      <EditMode />
    </div>
  );
}
