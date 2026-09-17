import { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, Plus, X, Loader2, Download, Minus, Bookmark, Maximize2 } from 'lucide-react';
import {
  buildContext, resolveMpaa, monteCarlo, quantileCurve, optimizeSpend, safeRetirementAge,
  buildPolicyCandidates, explainPick, toleranceFor, simulateDeterministic, DEFAULT_RISK_PROFILES,
  STATE_PENSION_FULL, BAND_QUANTILES, TAX_REGION_LABELS, num, fmtNum, parseFormatted
} from './App.jsx';
import { SIMPLE_BLANK, toFullPlan, readiness, oneOffId, earningId } from './simplePlan.js';
import { ChartFullscreen } from './phone.jsx';

/*
 * THE STREAMLINED PAGE.
 *
 * One screen. What you have on the left, whether you can afford it on the right, and no configuration
 * decision anywhere. The full app is eight tabs and sixty-odd fields, all of which earn their place for
 * somebody and none of which earn it for somebody who only wants to know whether they can retire.
 *
 * It is a FRONT END over the same engine, not a second model: every figure here comes from the function
 * the full app calls for it, so the two cannot drift apart and a fix to either reaches both.
 */

const GBP = (v) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
  .format(Number.isFinite(v) ? v : 0);
// axis labels only: £1.7m reads at a glance where £1,748,069 has to be counted
const GBP_SHORT = (v) => {
  const n = Number.isFinite(v) ? v : 0;
  if (Math.abs(n) >= 1e6) return `£${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m`;
  if (Math.abs(n) >= 1e3) return `£${Math.round(n / 1e3)}k`;
  return `£${Math.round(n)}`;
};
const KEY = 'rp_simple_v1';
const SCEN_KEY = 'rp_simple_scenarios_v1';
const MAX_SCENARIOS = 6;
const SP_HINT = `e.g. ${STATE_PENSION_FULL.toLocaleString()}`;   // the full new State Pension, suggested not assumed
const TARGET = 90;          // fixed, and stated in words rather than offered as a dial. See PLAN-streamlined.md.
/*
 * THE FOUR WRAPPERS, IN THE SAME COLOURS THE FULL PLANNER USES.
 *
 * The chart drew one total, which answers "will it last" but not "what is it made of" - and the mix is
 * what the whole decumulation question turns on: a pot that is nearly all pension behaves very
 * differently from the same figure mostly in an ISA. The rows already carry the split, so the only thing
 * missing was somewhere to turn it on.
 *
 * All four are ON by default. The mix is not an advanced detail to go looking for - it is most of the
 * answer to "is this plan safe", since a pot that is nearly all pension has tax and access problems an
 * ISA-heavy one of the same size does not. Hidden behind a click, most people would never see it. The
 * legend is still a legend: any line that is in the way turns off.
 *
 * `key` is the field on a simulateDeterministic row. Colours are CSS variables rather than hexes, so they
 * follow the theme like everything else on the page.
 */
const WRAPPERS = [
  { key: 'pensions', label: 'Pensions', color: 'rgb(var(--blue-600))' },
  { key: 'isas', label: 'ISAs', color: 'rgb(var(--emerald-600))' },
  { key: 'other', label: 'Other investments', color: 'rgb(var(--amber-600))' },
  { key: 'cash', label: 'Cash', color: 'rgb(var(--slate-500))' }
];
const LIVE_TRIALS = 1500;   // enough for a +/-1.5pt figure that redraws while you type

/*
 * HOW THE DRAWDOWN POLICY IS CHOSEN: THE ONE THAT SURVIVES MOST, AND WHAT BREAKS THE TIE.
 *
 * Survival is what somebody opening this page came to ask about, so it decides. The full app lets you
 * rank six priorities; here the ranking is fixed, survival first.
 *
 * It is "max survival WITHIN A TOLERANCE" rather than the strict maximum, and the difference matters.
 * Survival is estimated from 1,500 random paths, so it carries about +/-1.5 points of sampling error -
 * and across eighteen candidates the highest figure is very often the luckiest draw rather than the best
 * policy. Taking the strict maximum would chase that noise and hand back a different answer on every
 * keystroke.
 *
 * The 1,500 paths are spent as two seeds of 750, ranked on the mean, so the worker can also rank each
 * run alone and report when the two disagree. That is a CLOSE CALL, and the page says so. It happens on
 * about 40% of the scenario library at this budget (33% at 3,000) - this page is the noisier of the two
 * by design, because it redraws while you type - and the regret when it does is under a point of
 * survival, which is why the note says either would serve rather than pretending one is right.
 *
 * ON ABOUT A QUARTER OF HOUSEHOLDS SURVIVAL CANNOT DISCRIMINATE AT ALL, and something has to break the
 * tie. balanced-regret.mjs measured it across the 420-household library: survival separates the field on
 * 73.1% of them - so the rule does real work most of the time - and ties on the remaining 26.9%. The
 * reference plan is one of the ties, with 14 of its 18 candidates on the same rate, which is why a single
 * household made this look more common than it is.
 *
 * WHERE IT TIES, EVERY LOWER TIER IS GATED BY ITS OWN TOLERANCE TOO, and when nothing clears its
 * tolerance the answer falls to a fixed preference order rather than to an argmax. That is the whole of
 * the fix: a tie-break that ranks on Monte Carlo estimates separated by less than their own error bar
 * is not choosing, it is reading noise, and it duly flipped between 1,500 and 8,000 paths on identical
 * inputs. The gating lives in explainPick, so the full app gets it as well.
 *
 * Measured on the reference plan afterwards: the recommendation holds across £100 steps of spend AND
 * across trial counts, and it lands on the £32,000 branch of the tied set rather than the £30,750 one -
 * so gating the tie-break did not merely stabilise the answer, it stopped giving away £1,250 a year.
 *
 * AND THE TIED SET IS NOT INTERCHANGEABLE, which an earlier version of this said and was wrong about.
 * They tie on SURVIVAL, which is the only thing the tolerance covers. Checked across the 16 tied on the
 * reference plan, the other two headline figures move materially: safe spend runs £30,250 to £32,000 and
 * the earliest retirement age is 67 for some and 68 for others. The split is almost entirely the
 * drawdown strategy - every lump-sum variant lands near £32,000 and 67, every phased one near £30,750
 * and 68 - while the decumulation policy inside each barely matters.
 *
 * So the page says they survive equally well and NOT that the choice does not matter, because it does.
 */
// survival first, then the model's standard order behind it - every tier gated by its own tolerance
const POLICY_PRIORITIES = ['survive', 'downside', 'bequest', 'bridge', 'pot', 'tax'];
const POLICY_NAME = { 'Bracket Fill Basic': 'Tax smoothing', 'Bracket Fill': 'Bracket fill', 'Sequential': 'Sequential', 'ISA First': 'ISA first' };
const policyLabel = (c) => c ? `${POLICY_NAME[c.decumulationPolicy] || c.decumulationPolicy}, ${
  c.drawdownStrategy === 'Full 25% Lump Sum' ? 'lump sum up front' : 'phased tax-free cash'}` : '';

const tick = () => new Promise(r => setTimeout(r, 0));

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    // spread over the blank so a plan saved before a field existed still loads with it
    if (raw) return { ...SIMPLE_BLANK, ...JSON.parse(raw), earnings: JSON.parse(raw).earnings || [] };
  } catch { /* private mode */ }
  return SIMPLE_BLANK;
};

const loadScenarios = () => {
  try { const raw = localStorage.getItem(SCEN_KEY); if (raw) return JSON.parse(raw).slice(0, MAX_SCENARIOS); } catch { /* private mode */ }
  return [];
};

export default function Simple({ isPhone = false, isCoarse = false, viewport = { width: 1280, height: 800 } }) {
  const [s, setS] = useState(load);
  const [view, setView] = useState('rate');      // 'rate' (CAGR) | 'mc' - the advanced deck's two charts
  const [bandMode, setBandMode] = useState('quartile');
  const [showWrappers, setShowWrappers] = useState(() => Object.fromEntries(WRAPPERS.map(w => [w.key, true])));
  const [chartFull, setChartFull] = useState(false);
  const [overlayBox, setOverlayBox] = useState(null);
  const [scenarios, setScenarios] = useState(loadScenarios);
  const [activeScenario, setActiveScenario] = useState(null);
  const [res, setRes] = useState(null);          // { mc, safeSpend, safeAge }
  const [busy, setBusy] = useState(false);
  const runToken = useRef(0);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ } }, [s]);
  useEffect(() => { try { localStorage.setItem(SCEN_KEY, JSON.stringify(scenarios)); } catch { /* quota */ } }, [scenarios]);

  /*
   * SAVED SCENARIOS, AS BOOKMARKS.
   *
   * The page answers one set of figures at a time, and the question people actually have is comparative:
   * is retiring two years later worth more than saving another £300 a month? Holding both answers in your
   * head while you retype the inputs is what makes that hard, so a scenario is stored whole and restored
   * whole, and flipping between two of them is one click with no recompute of anything but the answer.
   *
   * Stored as a full copy of the input shape rather than a diff: the inputs are a dozen small fields, and
   * a diff would have to be migrated every time one is added - which has already happened three times.
   */
  const saveScenario = () => setScenarios(prev => {
    if (prev.length >= MAX_SCENARIOS) return prev;
    const n = (prev.reduce((m, x) => Math.max(m, x.n || 0), 0)) + 1;
    const rec = { id: `sc_${Date.now().toString(36)}`, n, plan: { ...s } };
    setActiveScenario(rec.id);
    return [...prev, rec];
  });
  const loadScenario = (rec) => { markFast(); setS({ ...SIMPLE_BLANK, ...rec.plan }); setActiveScenario(rec.id); };
  const dropScenario = (id) => setScenarios(prev => prev.filter(x => x.id !== id));

  const set = (k, v) => { setActiveScenario(null); setS(prev => ({ ...prev, [k]: v })); };   // typed: slower debounce
  const step = (k, by, min = 0) => {
    markFast();                       // a press is a finished thought, so do not make it wait for typing
    setActiveScenario(null);
    setS(prev => {
      const next = Math.max(min, Math.round((num(prev[k], 0) + by) * 100) / 100);
      return { ...prev, [k]: String(next) };
    });
  };

  const ready = useMemo(() => readiness(s), [s]);
  const full = useMemo(() => (ready.ready ? toFullPlan(s) : null), [s, ready.ready]);
  const resolved = useMemo(() => { try { return full ? resolveMpaa(full) : null; } catch { return null; } }, [full]);
  const ctx = useMemo(() => { try { return resolved ? buildContext(resolved) : null; } catch { return null; } }, [resolved]);

  /*
   * The expected view is arithmetic on the return assumptions - no simulation - so it can and does
   * redraw on every keystroke. The full range cannot: it is a Monte Carlo, and it waits for you to stop
   * typing. Both are drawn on ONE scale, which is what makes flipping between them a comparison rather
   * than two unrelated pictures.
   */
  const band = BAND_QUANTILES[bandMode] || BAND_QUANTILES.quartile;
  /*
   * The expected year-by-year path of the CHOSEN plan. It backs the two pot-at-a-date cards and the CSV,
   * so both quote the same rows the chart is drawn from rather than a second opinion.
   */
  const timeline = res?.timeline || null;

  const expected = useMemo(() => {
    // quantileCurve takes a PLAN and builds its own context per quantile - handing it a ctx silently
    // falls back to blank ages and a nonsense rate, which draws a plausible-looking wrong chart.
    // the chosen policy's plan once it has landed, the typed-in one until then, so the chart and the
    // figures below it describe the same recommendation rather than two different ones
    const src = res?.plan || resolved;
    if (!src) return null;
    try {
      const lo = quantileCurve(src, -band.z), mid = quantileCurve(src, 0), hi = quantileCurve(src, band.z);
      return { lo: lo.pot, mid: mid.pot, hi: hi.pot, failAge: lo.failAge };
    } catch { return null; }
  }, [resolved, res?.plan, band.z]);

  /*
   * THE WORK, AND WHEN IT HAPPENS.
   *
   * Everything expensive runs in a worker (src/simWorker.js), so typing never waits on it. Three things
   * fall out of that, and each was a complaint about this page:
   *
   * 1 TYPING NO LONGER CATCHES. Entering "10000" used to fire the debounce between digits and freeze the
   *   tab on 100, then 1000, then 10000, because the six seconds of arithmetic owned the main thread. It
   *   is off the thread now, and a superseded job is simply ignored when it reports back.
   *
   * 2 THE DEBOUNCE SPLITS IN TWO. A stepper press is a finished thought and fires almost at once; typing
   *   is mid-thought and waits longer, so a four-digit figure is one job rather than four.
   *
   * 3 THE NEXT CLICK IS USUALLY ALREADY DONE. Once an answer lands the worker is idle, so it quietly
   *   computes the answers one step either way on the two figures people actually step - retirement age
   *   and spend. Those land in a cache keyed by the inputs, and a stepper press that hits the cache is
   *   instant rather than six seconds. A real request always pre-empts the speculative ones.
   */
  const workerRef = useRef(null);
  const seqRef = useRef(0);
  const cacheRef = useRef(new Map());
  const pendingRef = useRef([]);
  const speculatingRef = useRef(false);

  // the inputs that actually change an answer, as a cache key
  const sigOf = (x) => JSON.stringify([x.couple, x.ageSelf, x.retireSelf, x.agePart, x.retirePart, x.terminalAge,
    x.spend, x.taperPct, x.taperFromAge, x.region, x.statePensionSelf, x.statePensionPart,
    x.pen, x.isa, x.gia, x.cash, x.penPart, x.isaPart, x.giaPart, x.cashPart,
    x.penRisk, x.isaRisk, x.giaRisk, x.cashRisk, x.penPartRisk, x.isaPartRisk, x.giaPartRisk, x.cashPartRisk,
    x.penC, x.isaC, x.giaC, x.cashC, x.penCPart, x.isaCPart, x.giaCPart, x.cashCPart,
    x.penG, x.isaG, x.giaG, x.cashG, x.penGPart, x.isaGPart, x.giaGPart, x.cashGPart,
    x.penCIsPct, x.penCIsPctPart, x.salary, x.salaryPart, x.oneOffs, x.earnings]);
  const sig = useMemo(() => sigOf(s), [s]);

  useEffect(() => {
    const w = new Worker(new URL('./simWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e) => {
      const m = e.data;
      if (m.quiet) {
        // a speculative job: bank it, never let it touch the screen
        const entry = cacheRef.current.get(m.quiet) || {};
        if (m.stage === 'done' || m.stage === 'error') {
          if (m.stage === 'done') cacheRef.current.set(m.quiet, { ...entry, complete: true });
          speculatingRef.current = false;
          nextSpeculation();
        } else cacheRef.current.set(m.quiet, { ...entry, ...m });
        return;
      }
      if (m.seq !== seqRef.current) return;      // superseded
      if (m.stage === 'error') { setRes({ error: m.error }); setBusy(false); return; }
      if (m.stage === 'done') { setBusy(false); queueSpeculation(); return; }
      setRes(prev => ({ ...(prev || {}), ...m }));
      if (m.stage === 'mc') cacheRef.current.set(sigRef.current, { ...m });
    };
    return () => { w.terminate(); workerRef.current = null; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const sigRef = useRef(sig);
  useEffect(() => { sigRef.current = sig; }, [sig]);

  /*
   * A stepper is a deliberate press, so it can fire almost immediately; typing needs room for the next
   * digit. Anything that changes the inputs sets this, and the effect below reads it.
   */
  const fastRef = useRef(false);
  const markFast = () => { fastRef.current = true; };

  useEffect(() => {
    if (!ready.ready) { setRes(null); return; }
    const wait = fastRef.current ? 180 : 1100;
    fastRef.current = false;
    const timer = setTimeout(() => {
      const cached = cacheRef.current.get(sig);
      if (cached && cached.mc) {
        // already computed while we were idle, so this press costs nothing
        setRes({ ...cached });
        if (!cached.complete) startJob(); else { setBusy(false); queueSpeculation(); }
        return;
      }
      startJob();
    }, wait);
    return () => clearTimeout(timer);
  }, [sig, ready.ready]);   // eslint-disable-line react-hooks/exhaustive-deps

  const startJob = () => {
    const w = workerRef.current;
    if (!w) return;
    pendingRef.current = [];               // a real request outranks anything speculative
    speculatingRef.current = false;
    const seq = ++seqRef.current;
    setBusy(true);
    setRes(prev => (prev && prev.mc ? prev : null));
    w.postMessage({ seq, simple: s, trials: LIVE_TRIALS, target: TARGET });
  };

  /*
   * What to compute while nobody is asking: one step either way on the two figures that carry steppers
   * and get pressed - retirement age and spend. Four jobs, queued one at a time so a real request can
   * cut in between them.
   */
  const queueSpeculation = () => {
    const near = [];
    /*
     * Ordered by how likely the press is, because the queue warms in order and a real request cuts in
     * front of whatever is left. Measured: a press that hits this cache answers in 470ms against 4,513ms
     * for one that misses, so the ordering decides which presses feel instant during the first minute.
     */
    for (const [k, by] of [['retireSelf', 1], ['spend', 1000], ['pen', 10000], ['isa', 10000]]) {
      for (const d of [by, -by]) {
        const v = Math.max(0, num(s[k], 0) + d);
        if (!v) continue;
        const variant = { ...s, [k]: String(v) };
        const vsig = sigOf(variant);
        if (!cacheRef.current.has(vsig)) near.push({ vsig, variant });
      }
    }
    pendingRef.current = near;
    if (cacheRef.current.size > 24) cacheRef.current.clear();   // keep it small; these are large objects
    nextSpeculation();
  };

  const nextSpeculation = () => {
    if (speculatingRef.current) return;
    const job = pendingRef.current.shift();
    const w = workerRef.current;
    if (!job || !w) return;
    speculatingRef.current = true;
    cacheRef.current.set(job.vsig, {});
    w.postMessage({ seq: -1, quiet: job.vsig, simple: job.variant, trials: LIVE_TRIALS, target: TARGET });
  };

  // ------------------------------------------------------------------ the one chart
  const chart = useMemo(() => {
    if (!expected) return null;
    const fan = res?.mc?.bands;
    const useFan = view === 'mc' && fan && fan.length;
    const age0 = expected.mid[0]?.ageSelf ?? 0;
    const loKey = bandMode === 'decile' ? 'p10' : 'p25', hiKey = bandMode === 'decile' ? 'p90' : 'p75';
    const series = useFan
      ? fan.map(b => ({ age: age0 + b.t, lo: b[loKey], mid: b.p50, hi: b[hiKey] }))
      : expected.mid.map((p, i) => ({ age: p.ageSelf, lo: expected.lo[i]?.totalCombined ?? 0, mid: p.totalCombined, hi: expected.hi[i]?.totalCombined ?? 0 }));
    if (series.length < 2) return null;
    /*
     * ONE SCALE FOR BOTH VIEWS. The y-axis is taken from whichever view reaches highest, not from the one
     * on screen - otherwise flipping rescales the picture and the two stop being comparable, which is the
     * only thing the toggle exists to let you do.
     */
    const medTop = Math.max(
      ...expected.mid.map(p => p.totalCombined),
      ...(fan && fan.length ? fan.map(b => b.p50) : [0]));
    const edgeTop = Math.max(
      ...expected.hi.map(p => p.totalCombined),
      ...(fan && fan.length ? fan.map(b => b[hiKey]) : [0]));
    /*
     * The scale is taken from the MEDIAN, not the band's top edge, and the band clips against it.
     *
     * A good upper quantile compounded across forty years runs to tens of millions on a plan whose
     * median ends near zero. Scaling to that edge is arithmetically honest and visually useless: it
     * flattens the line the chart exists to show into the axis. So the axis follows the median with
     * headroom, the band runs off the top where it must, and the caption says by how much rather than
     * letting the clip pass unremarked.
     */
    const yMax = Math.max(1, Math.min(edgeTop, medTop * 2.5)) * 1.06;
    const clippedTo = edgeTop > yMax ? edgeTop : null;
    /*
     * On a phone the viewBox width is the screen width, so SVG text renders 1:1 rather than being
     * shrunk by the ratio between a 720-wide box and a ~330px column. 0.62 of the width keeps the chart
     * and the dials beneath it on one screen; the fullscreen overlay hands its own measured box in.
     */
    const W = overlayBox ? overlayBox.w : isPhone ? viewport.width : 720;
    const H = overlayBox ? overlayBox.h : isPhone ? Math.min(Math.round(W * 0.62), 260) : 300;
    const L = isPhone && !overlayBox ? 38 : 44, R = 16, T = 14, B = 30;
    const iw = W - L - R, ih = H - T - B;
    const a0 = series[0].age, a1 = series[series.length - 1].age;
    const x = (a) => L + (a1 === a0 ? 0 : ((a - a0) / (a1 - a0)) * iw);
    const y = (v) => T + ih - (Math.max(0, Math.min(yMax, v)) / yMax) * ih;
    const area = series.map(p => `${x(p.age).toFixed(1)},${y(p.hi).toFixed(1)}`).join(' ') + ' ' +
      [...series].reverse().map(p => `${x(p.age).toFixed(1)},${y(p.lo).toFixed(1)}`).join(' ');
    const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(p.age).toFixed(1)},${y(p.mid).toFixed(1)}`).join(' ');
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * yMax);
    const every = Math.max(1, Math.ceil(series.length / 8));
    // the final age always gets a label - it is the end of the plan - and a tick too close to it goes
    const ageTicks = series.filter((q, i) => i === series.length - 1 ||
      (i % every === 0 && (series.length - 1 - i) >= every / 2));
    /*
     * The individual runs, drawn behind the band. The band says where the middle of the distribution
     * sits; the lines say what one life actually looks like - lumpy, and some of them hitting zero and
     * staying there. That second thing is the whole argument for simulating at all, and a smooth shaded
     * region quietly hides it.
     */
    const paths = (useFan && res?.mc?.samplePaths ? res.mc.samplePaths : []).slice(0, 40).map(pth => {
      const pts = Array.isArray(pth) ? pth : Object.values(pth);
      return pts.map((v, i) => `${i ? 'L' : 'M'}${x(age0 + i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    });
    /*
     * The wrappers come from the deterministic run, in BOTH views, which is what the full planner does
     * too: the split is a property of the plan rather than of the range drawn around it, and a Monte
     * Carlo has no single split to report. They are drawn on the same scales, so they read against the
     * total line rather than against an axis of their own.
     */
    const wrappers = {};
    for (const w of WRAPPERS) {
      const rows = (timeline || []).filter(r => r.ageSelf >= a0 && r.ageSelf <= a1);
      if (rows.length > 1) wrappers[w.key] = rows.map((r, i) => `${i ? 'L' : 'M'}${x(r.ageSelf).toFixed(1)},${y(r[w.key] || 0).toFixed(1)}`).join(' ');
    }
    return { W, H, L, R, T, B, ih, x, y, area, line, ticks, ageTicks, useFan, a0, a1, clippedTo, paths, wrappers };
  }, [expected, res, view, bandMode, timeline, isPhone, viewport.width, overlayBox]);

  /*
   * The chart markup as a function, because it is rendered in two places: inline, and again inside the
   * fullscreen overlay. Two copies of this JSX would be two things to keep in step.
   */
  /*
   * THE PHONE'S FIRST SCREEN: the chart, and the dials that move it.
   *
   * On a phone the grid stacks, and it stacked the FORM first - so the chart was below the fold and you
   * were editing blind, which is the same fault the sandbox had on the full planner. This card is
   * ordered first and sticks to the top of the viewport, so the line stays in view while you scroll
   * down to the inputs.
   *
   * The dials underneath are the four questions people actually arrive with: when can I stop, what will
   * I spend, and how much is in the two big pots. They call the SAME `step()` the form's own steppers
   * call, so there is no second path to the state.
   */
  const phoneDial = (label, value, by, k) => (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => step(k, -by, 0)} aria-label={`decrease ${label}`}
        className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer active:bg-slate-200">
        <Minus className="w-4 h-4" />
      </button>
      <span className="flex-1 min-w-0 text-center leading-tight">
        <span className="block text-[10px] text-slate-500 truncate">{label}</span>
        <span className="block text-xs font-bold text-slate-900 tabular-nums">{value}</span>
      </span>
      <button type="button" onClick={() => step(k, by, 0)} aria-label={`increase ${label}`}
        className="min-h-11 min-w-11 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer active:bg-slate-200">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );

  /*
   * bleed-tight, not bleed: the phone chart card is p-3, so the pull that cancels the gutters has to be
   * 1.75rem (the page's 1rem plus its 0.75rem) and not the 2.25rem sized for the full planner's p-5 card.
   * Half a rem too far each side is exactly the 7px of horizontal scroll this page had.
   *
   * And no sideways scroller on a phone: the chart is already the full width with nothing to scroll, and
   * a scroll container is where a browser stops computing touch-action, as the projection deck found.
   */
  const chartPanel = (inOverlay = false) => (
          <div className={`relative ${isPhone && !inOverlay ? 'bleed-tight' : 'overflow-x-auto'} ${inOverlay ? 'h-full' : ''}`}>
            {isPhone && !inOverlay && (
              <button type="button" data-chart-expand aria-label="Expand chart" onClick={() => setChartFull(true)}
                className="absolute top-1 right-1 z-10 min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-surface/90 border border-slate-200 text-slate-600 cursor-pointer">
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className={inOverlay ? 'w-full h-full select-none' : 'w-full h-auto select-none'}
              preserveAspectRatio={inOverlay ? 'xMidYMid meet' : undefined} role="img"
              aria-label={`Pot from age ${chart.a0} to ${chart.a1}, ${chart.useFan ? 'from simulated paths' : 'compounded from the return assumptions'}`}>
              {chart.ticks.map((v, i) => (
                <g key={i}>
                  <line x1={chart.L} x2={chart.W - chart.R} y1={chart.y(v)} y2={chart.y(v)} stroke="rgb(var(--slate-200))" strokeWidth="1" />
                  <text x={chart.L - 7} y={chart.y(v) + 3} textAnchor="end" fontSize="9" fill="rgb(var(--slate-500))" style={{ fontVariantNumeric: 'tabular-nums' }}>{GBP_SHORT(v)}</text>
                </g>
              ))}
              <polygon points={chart.area} fill={chart.useFan ? 'rgb(var(--indigo-600))' : 'rgb(var(--blue-600))'} opacity="0.16" />
              {chart.paths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke="rgb(var(--indigo-600))" strokeWidth="0.7" pathLength="1"
                  opacity={busy ? 0.5 : 0.28}
                  className={busy ? 'sim-sweep' : undefined}
                  style={busy ? { animationDelay: `${(i % 10) * 0.12}s` } : undefined} />
              ))}
              {WRAPPERS.map(w => (showWrappers[w.key] && chart.wrappers[w.key]
                ? <path key={w.key} d={chart.wrappers[w.key]} fill="none" stroke={w.color} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
                : null))}
              <path d={chart.line} fill="none" stroke={chart.useFan ? 'rgb(var(--indigo-600))' : 'rgb(var(--blue-600))'} strokeWidth="2.5" strokeLinejoin="round" />
              <line x1={chart.L} x2={chart.W - chart.R} y1={chart.T + chart.ih} y2={chart.T + chart.ih} stroke="rgb(var(--slate-300))" strokeWidth="1" />
              {chart.ageTicks.map(p => (
                <text key={p.age} x={chart.x(p.age)} y={chart.H - 10} textAnchor="middle" fontSize="9" fill="rgb(var(--slate-500))" style={{ fontVariantNumeric: 'tabular-nums' }}>{p.age}</text>
              ))}
            </svg>
          </div>
  );

  // ------------------------------------------------------------------ input helpers
  /*
   * One height for every control on this panel. Four wrappers each carrying a balance, a risk level and a
   * contribution is twelve inputs before the personal details start, and at the default input height that
   * ran well past a laptop screen - so the whole form was being scrolled to be read. Shorter boxes and
   * tighter gaps put it back in one view, which is worth more here than the extra few pixels of padding.
   */
  /*
   * LAYOUT: LABEL LEFT, CONTROL RIGHT - AND THE PORTFOLIO AS A TABLE.
   *
   * The first pass stacked a label over every control in a two-column grid, which looked reasonable in
   * the markup and read badly on screen: "Expected retirement spending" wrapped to three lines and
   * knocked its own column out of alignment, and the four wrappers each became a three-deck card, so the
   * panel ran to 923px before the personal details were finished.
   *
   * Labels now sit to the left of their control, where they can be long without pushing anything down,
   * and the four wrappers are one table with a header row - balance, risk, paid in each year - which is
   * how the figures actually relate to each other and lets the eye compare down a column.
   */
  /*
   * 16px text on a phone, and it is not a taste decision: Safari zooms the whole page when a field with
   * text under 16px receives focus, and it does not zoom back out afterwards. The page ends up wider
   * than the screen with a chart running off the side, from one tap into a box.
   *
   * The desktop sizes are untouched - 12/13px is right where a mouse is doing the pointing.
   */
  const inCls = isPhone
    ? 'w-full px-2 py-2 min-h-[44px] bg-surface border border-slate-300 rounded-md text-[16px] tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
    : 'w-full px-1.5 sm:px-2 py-1 bg-surface border border-slate-300 rounded-md text-[12px] sm:text-[13px] tabular-nums text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500';
  const subCls = isPhone
    ? 'px-2 py-2 min-h-[44px] bg-surface border border-slate-200 rounded-md text-[16px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500'
    : 'px-1.5 py-1 bg-surface border border-slate-200 rounded-md text-[11px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500';

  /*
   * Six digits without separators is a number you have to count rather than read, and a plain number
   * input cannot carry them. So these are text inputs that format on the way out and strip on the way
   * in, keeping inputMode numeric so a phone still shows the number pad.
   */
  // Shared with the full planner rather than a second copy, so the Config toggle reaches this page too
  // and a figure cannot read one way here and another way there. `parseFormatted` is the exact inverse of
  // `fmtNum` under whichever convention is active, which is the whole point: under the European one
  // "1.234" is one thousand two hundred and thirty-four, and a parser that assumed otherwise would store
  // a different number from the one on screen.
  const fmt = (v) => (v === '' || v == null ? '' : fmtNum(v));
  const parse = (v) => parseFormatted(v);
  // `hint` overrides the placeholder, for the one field where 0 is a poor prompt: the State Pension,
  // where the full new award is what most people get and blank quietly means "none at all".
  const cash = (k, extra = '', hint = '0') => (
    <input type="text" inputMode="numeric" value={fmt(s[k])} placeholder={hint}
      onFocus={(e) => e.target.select()} onChange={(e) => set(k, parse(e.target.value))}
      className={`${inCls} text-right ${extra}`} />
  );

  /*
   * SIDE BY SIDE, NOT STACKED.
   *
   * Two buttons 13px tall sitting on top of each other: too small for a mouse - 24px is the WCAG 2.5.8
   * minimum and neither half met it - and under a finger the 44px touch rule turns the pair into an 88px
   * stack inside a 26px row. The phone's own quick dials are side by side for exactly that reason, and
   * borrowing the shape fixes both ends at once. Minus first, because that is the order the phone uses
   * and the order a number line runs in.
   */
  const stepper = (k, by, min = 0) => (
    <span className="flex shrink-0 leading-none">
      <button type="button" onClick={() => step(k, -by, min)} aria-label={`decrease ${k}`}
        className="w-6 h-6 flex items-center justify-center rounded-l border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer"><Minus className="w-3 h-3" /></button>
      <button type="button" onClick={() => step(k, by, min)} aria-label={`increase ${k}`}
        className="w-6 h-6 flex items-center justify-center rounded-r border border-l-0 border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer"><Plus className="w-3 h-3" /></button>
    </span>
  );

  /*
   * THE FULL AWARD IN ONE TAP, AND STILL NOT AN ASSUMPTION.
   *
   * The same control as the full planner's, for the same reason: the full new State Pension is what most
   * people on a full National Insurance record get, but how many qualifying years stand behind any one
   * award is not something this page knows, so it stays a suggestion in the placeholder and a button you
   * press. Pressing it when it is already on CLEARS the field, because the next thing somebody does after
   * deciding they are not on the full award is type their own number over a blank.
   *
   * It lives inside the same 148px control column as every other row, so the column still lines up: the
   * field flexes and the button takes what it needs, which still leaves room for five digits.
   */
  const statePensionField = (k) => {
    const isFull = String(s[k] ?? '') !== '' && Number(s[k]) === STATE_PENSION_FULL;
    return (
      <span className="flex items-stretch gap-1 w-full">
        <input type="text" inputMode="numeric" value={fmt(s[k])} placeholder={SP_HINT}
          onFocus={(e) => e.target.select()} onChange={(e) => set(k, parse(e.target.value))}
          className={`${inCls} text-right flex-1 min-w-0`} />
        <button type="button" aria-pressed={isFull} data-full-state-pension
          onClick={() => set(k, isFull ? '' : String(STATE_PENSION_FULL))}
          title={`The full new State Pension, \u00a3${STATE_PENSION_FULL.toLocaleString()} a year`}
          className={`shrink-0 px-1.5 rounded border text-[10px] font-bold cursor-pointer ${isFull ? 'bg-blue-50 border-blue-600 text-blue-700' : 'bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900'}`}>
          Full
        </button>
      </span>
    );
  };

  // one row of the details list: a label that may be long, and a control that never moves
  const row = (label, control) => (
    <label className="flex items-center gap-2 min-h-[26px]">
      <span className="text-[11px] text-slate-500 font-semibold flex-1 min-w-0 leading-tight">{label}</span>
      <span className="flex items-center gap-1 w-[148px] shrink-0">{control}</span>
    </label>
  );

  const RISK_SHORT = { 'High Risk': 'High', 'Medium/High Risk': 'Med-hi', 'Medium Risk': 'Med',
    'Medium/Low Risk': 'Med-lo', 'Low Risk': 'Low', 'Cash Equivalents': 'Cash' };

  /*
   * NO STEPPERS IN THE PORTFOLIO ON A PHONE.
   *
   * This row is five columns - label, balance, risk, contribution, escalation - inside 412px, and a
   * stepper is 48px of it beside a field that then has about 60px left to show six digits in. They earn
   * their place on a desktop, where the row has room; here they were taking it from the number.
   *
   * Nothing is lost: the sticky card above the chart carries ± dials for the pension and ISA balances,
   * which is the better place to nudge one anyway, because the line you are moving is on the same screen.
   * The field itself still takes a typed figure, which is what a five-digit balance wants.
   *
   * One line of the portfolio table. The contribution is TWO figures, not one choice between two: what
   * goes in this year, and how much more goes in each year after it. The £/% toggle beside the amount is
   * a separate question again - whether that amount was typed in pounds or as a share of salary - and
   * only the pension has it, because a percentage of salary is a pension idea.
   */
  const wrapperRow = (k, label, cKey, pctKey = null, salKey = null) => {
    const isPct = pctKey && s[pctKey];
    return (
      <div key={k} className="contents">
        <span className="text-[11px] text-slate-600 font-semibold self-center">{label}</span>
        <span className="flex items-stretch gap-0.5">{cash(k)}{!isPhone && stepper(k, 10000)}</span>
        <select value={s[k + 'Risk'] || 'Medium Risk'} onChange={(e) => set(k + 'Risk', e.target.value)}
          aria-label={`${label} risk level`} className={`${subCls} w-full cursor-pointer px-1`}>
          {Object.keys(DEFAULT_RISK_PROFILES).map(r => <option key={r} value={r}>{RISK_SHORT[r] || r}</option>)}
        </select>
        <span className="flex items-stretch gap-0.5">
          <input type="text" inputMode="numeric" value={isPct ? s[cKey] : fmt(s[cKey])} placeholder={isPct ? '%' : '0'}
            onFocus={(e) => e.target.select()} onChange={(e) => set(cKey, parse(e.target.value))}
            aria-label={`${label} contribution`}
            className={`${subCls} w-full min-w-0 text-right tabular-nums tabular-nums px-1 ${pctKey ? 'rounded-r-none border-r-0' : ''}`} />
          {pctKey && (
            <button type="button" onClick={() => set(pctKey, !s[pctKey])} title={isPct ? 'a % of salary' : 'pounds a year'}
              className={`shrink-0 px-1 rounded-md rounded-l-none border text-[10px] font-bold cursor-pointer ${isPct ? 'bg-accent text-onaccent border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900'}`}>
              {isPct ? '%' : '\u00a3'}
            </button>
          )}
          {!isPhone && stepper(cKey, isPct ? 1 : 500)}
        </span>
        <span className="flex items-stretch gap-0.5">
          <input type="text" inputMode="numeric" value={s[k + 'G']} placeholder="0"
            onFocus={(e) => e.target.select()} onChange={(e) => set(k + 'G', parse(e.target.value))}
            aria-label={`${label} contribution increase`}
            className={`${subCls} w-full min-w-0 text-right tabular-nums tabular-nums px-1`} />
          <span className="text-[10px] text-slate-400 self-center">%</span>
        </span>
        {isPct && salKey && (
          <>
            <span />
            <span className="col-span-4 flex items-center gap-1.5 -mt-0.5 mb-0.5">
              <span className="text-[10px] text-slate-400 shrink-0">of a salary of</span>
              <input type="text" inputMode="numeric" value={fmt(s[salKey])} placeholder="0"
                onFocus={(e) => e.target.select()} onChange={(e) => set(salKey, parse(e.target.value))}
                aria-label={`${label} salary`} className={`${subCls} w-28 text-right tabular-nums tabular-nums`} />
            </span>
          </>
        )}
      </div>
    );
  };

  /*
   * What the taper actually does to the money, said in pounds. A percent a year compounded over twenty
   * years is not a figure anyone can hold in their head, and this is the input most likely to be set
   * optimistically - so the page shows where it lands rather than leaving it to be imagined.
   */
  const taperNote = useMemo(() => {
    const pct = num(s.taperPct, 0), from = num(s.taperFromAge, 0), spend = num(s.spend, 0);
    if (!(pct > 0) || !(from > 0) || !(spend > 0)) return 'Leave the percentage blank to spend the same every year. Most people spend less once they are past the active early years.';
    return `${GBP(spend)} a year until ${from}, then ${GBP(Math.round(spend * (1 - pct / 100)))} from ${from} on. One step down, held for the rest of the plan — care costs late on can push it back up.`;
  }, [s.taperPct, s.taperFromAge, s.spend, s.terminalAge]);

  /*
   * The rows behind the answer, as a file. Somebody who wants to check the arithmetic should not have to
   * open the full app to do it, and a spreadsheet is where that checking actually happens.
   */
  const exportCsv = () => {
    if (!timeline) return;
    const cols = [['year', r => r.year], ['age', r => r.ageSelf], ['pensions', r => r.pensions],
      ['isas', r => r.isas], ['gia', r => r.other], ['cash', r => r.cash], ['total', r => r.totalCombined],
      ['target spend', r => r.targetSpend], ['state pension', r => r.spSelf + (r.spPart || 0)],
      ['guaranteed income', r => r.netGuaranteed], ['earnings take-home', r => r.workingTakeHome],
      ['drawn from pots', r => r.netDrawdown], ['income tax', r => r.taxPaid], ['cgt', r => r.cgtPaid],
      ['unmet', r => r.unmetDemand || 0]];
    const num2 = (v) => (typeof v === 'number' ? Math.round(v) : v);
    const rows = [cols.map(c => c[0]).join(','), ...timeline.map(r => cols.map(c => num2(c[1](r))).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `retirement-projection-age-${num(s.ageSelf, 0)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const addOneOff = () => setS(p => ({ ...p, oneOffs: [...p.oneOffs, { id: oneOffId(), date: '', amount: '', direction: 'in' }] }));
  const setOneOff = (id, k, v) => setS(p => ({ ...p, oneOffs: p.oneOffs.map(o => o.id === id ? { ...o, [k]: v } : o) }));
  const dropOneOff = (id) => setS(p => ({ ...p, oneOffs: p.oneOffs.filter(o => o.id !== id) }));
  const addEarning = () => setS(p => ({ ...p, earnings: [...(p.earnings || []), { id: earningId(), amount: '', startAge: p.retireSelf || '', endAge: '', owner: 'Myself' }] }));
  const setEarning = (id, k, v) => setS(p => ({ ...p, earnings: (p.earnings || []).map(e => e.id === id ? { ...e, [k]: v } : e) }));
  const dropEarning = (id) => setS(p => ({ ...p, earnings: (p.earnings || []).filter(e => e.id !== id) }));

  /*
   * A card sizes its own figure. "£1,246,411" is nine characters and overflowed the card on a phone,
   * where the same class held "84.9%" comfortably - so the type scale steps down as the string grows
   * rather than being set once for the shortest value it will ever hold.
   */
  const figure = (label, value, sub, tone = 'text-slate-900', pending = false) => {
    const n = String(value).length;
    const size = n > 10 ? 'text-base' : n > 8 ? 'text-lg' : n > 6 ? 'text-xl' : 'text-2xl';
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 min-w-0">
        <span className="text-[11px] text-slate-500 block mb-0.5 leading-snug">{label}</span>
        {pending
          ? <span className="text-2xl font-black tabular-nums text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />&mdash;</span>
          : <span className={`${size} font-black tabular-nums tabular-nums block truncate ${tone}`} title={String(value)}>{value}</span>}
        <span className="text-[11px] text-slate-500 block mt-1 leading-snug">{sub}</span>
      </div>
    );
  };

  const mc = res?.mc, ss = res?.safeSpend, sa = res?.safeAge;
  /*
   * The rate-based chart has its own end-of-plan figures and CANNOT produce the Monte Carlo ones: a
   * survival rate, a safe spend and an earliest retirement age are all counts over simulated paths, and
   * a compounded line has no paths to count. So the cards follow the chart rather than sitting there
   * quoting figures the picture above them did not produce.
   */
  const rateCards = useMemo(() => {
    if (!expected) return null;
    const end = (arr) => (arr && arr.length ? arr[arr.length - 1].totalCombined : null);
    const at = (arr, age) => { const r = (arr || []).find(x => x.ageSelf >= age); return r ? r.totalCombined : null; };
    return { retire: at(expected.mid, num(s.retireSelf, 0)), mid: end(expected.mid),
      lo: end(expected.lo), hi: end(expected.hi), failAge: expected.failAge };
  }, [expected, s.retireSelf]);
  const potAtRetirement = useMemo(() => {
    if (!timeline) return null;
    const at = num(s.retireSelf, 0);
    const row = timeline.find(r => r.ageSelf >= at);
    return row ? row.totalCombined : null;
  }, [timeline, s.retireSelf]);
  const rateTone = !mc ? '' : mc.successRate >= TARGET ? 'text-emerald-700' : mc.successRate >= 75 ? 'text-amber-700' : 'text-rose-700';

  /*
   * Flex column below lg, grid at lg and up, and the difference matters. As a GRID each card is its own
   * row, and a grid row is a sticky element's containing block - so a sticky card has zero travel and
   * never sticks. In a flex column the containing block is the whole column, which is what lets the
   * chart stay put while the form scrolls underneath it.
   */
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,424px)_minmax(0,1fr)] gap-5 lg:items-start">
      {isPhone && ready.ready && (
        <div data-phone-chart className="order-first lg:hidden sticky top-0 z-20 bg-surface border border-slate-200/90 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-slate-900">Projections</h2>
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-0.5 rounded-lg text-[11px]">
              {[['rate', 'Rate'], ['mc', 'Monte Carlo']].map(([k, label]) => (
                <button key={k} type="button" onClick={() => setView(k)} disabled={k === 'mc' && !res?.mc}
                  className={`px-2.5 min-h-11 rounded-lg font-semibold cursor-pointer disabled:opacity-40 ${view === k ? 'bg-surface text-blue-700 shadow-2xs' : 'text-slate-500'}`}>{label}</button>
              ))}
            </div>
          </div>
          {chartPanel()}
          {/* the verdict, in one line: the three figures somebody came to this page for */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[['Survival', res?.mc ? `${res.mc.successRate.toFixed(0)}%` : '—'],
              ['Safe max', res?.safeSpend?.spend != null ? GBP_SHORT(res.safeSpend.spend) : '—'],
              ['Earliest', res?.safeAge?.age != null ? String(res.safeAge.age) : '—']].map(([k, v]) => (
              <div key={k} className="min-w-0">
                <span className="block text-[10px] text-slate-500 truncate">{k}</span>
                <span className="block text-sm font-bold text-slate-900 tabular-nums">{v}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t border-slate-100">
            {phoneDial('Retire at', s.retireSelf || '—', 1, 'retireSelf')}
            {phoneDial('Spending', fmt(s.spend) || '—', 1000, 'spend')}
            {phoneDial('Pension', fmt(s.pen) || '—', 10000, 'pen')}
            {phoneDial('ISA', fmt(s.isa) || '—', 10000, 'isa')}
          </div>
        </div>
      )}

      {/* ------------------------------------------------ LEFT: what you have */}
      <div className="bg-surface border border-slate-200/90 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {scenarios.map(rec => (
            <span key={rec.id}
              className={`group inline-flex items-center rounded-lg border text-xs font-bold transition-colors ${activeScenario === rec.id ? 'bg-accent text-onaccent border-blue-600' : 'bg-surface border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-800'}`}>
              <button type="button" onClick={() => loadScenario(rec)} title={`Scenario ${rec.n}: ${GBP(num(rec.plan.spend, 0))} a year, stopping at ${num(rec.plan.retireSelf, 0)}`}
                className="px-2.5 py-1 cursor-pointer">{rec.n}</button>
              <button type="button" onClick={() => dropScenario(rec.id)} aria-label={`Remove scenario ${rec.n}`}
                className={`pr-1.5 pl-0.5 cursor-pointer opacity-50 hover:opacity-100 ${activeScenario === rec.id ? 'text-white' : 'text-slate-400 hover:text-rose-600'}`}><X className="w-3 h-3" /></button>
            </span>
          ))}
          <button type="button" onClick={saveScenario} disabled={scenarios.length >= MAX_SCENARIOS}
            title={scenarios.length >= MAX_SCENARIOS ? `Six saved is the limit — remove one first` : 'Save these figures so you can come back and compare'}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-[11px] font-bold text-slate-500 hover:text-blue-800 hover:border-blue-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <Bookmark className="w-3 h-3" /> Save scenario
          </button>
          {scenarios.length > 0 && <span className="text-[11px] text-slate-400">click a number to compare</span>}
        </div>

        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1 rounded-lg">
          {[[false, 'Just me'], [true, 'Me and a partner']].map(([v, label]) => (
            <button key={label} type="button" onClick={() => set('couple', v)}
              className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${!!s.couple === v ? 'bg-surface text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
          ))}
        </div>

        <p className="text-[11px] text-slate-500">Change anything to see the difference. Save a scenario to compare two.</p>

        <div className="space-y-1">
          <h2 className="text-xs font-semibold text-slate-900 mb-1.5">You</h2>
          {row('Age now', cash('ageSelf'))}
          {row('Retire at', <>{cash('retireSelf')}{stepper('retireSelf', 1)}</>)}
          {s.couple && row('Partner age now', cash('agePart'))}
          {s.couple && row('Partner retires at', <>{cash('retirePart')}{stepper('retirePart', 1)}</>)}
          {row('Expected retirement spending', <>{cash('spend')}{stepper('spend', 1000)}</>)}
          {row('State Pension a year', statePensionField('statePensionSelf'))}
          {s.couple && row('Partner State Pension', statePensionField('statePensionPart'))}
          {row('Where you pay tax',
            <select value={s.region} onChange={(e) => set('region', e.target.value)} className={`${subCls} w-full cursor-pointer`}>
              {Object.entries(TAX_REGION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>)}
          {/* two inputs in one sentence, so it gets its own line rather than the label/control split */}
          <div className="flex items-center gap-1.5 min-h-[26px] text-[11px] text-slate-500 font-semibold">
            <span className="shrink-0">Spending eases by</span>
            <input type="text" inputMode="numeric" value={s.taperPct} placeholder="0"
              onFocus={(e) => e.target.select()} onChange={(e) => set('taperPct', parse(e.target.value))}
              aria-label="taper percent" className={`${subCls} w-11 text-center tabular-nums`} />
            <span className="shrink-0">% from age</span>
            <input type="text" inputMode="numeric" value={s.taperFromAge} placeholder="75"
              onFocus={(e) => e.target.select()} onChange={(e) => set('taperFromAge', parse(e.target.value))}
              aria-label="taper start age" className={`${subCls} w-11 text-center tabular-nums`} />
          </div>
          <p className="text-[10px] text-slate-400 leading-snug pt-0.5">{taperNote}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold text-slate-900 mb-1.5">Portfolio</h2>
          <div className="grid grid-cols-[auto_minmax(92px,1fr)_60px_66px_44px] sm:grid-cols-[auto_minmax(92px,1fr)_66px_74px_46px] gap-x-1 gap-y-1 items-center">
            <span />
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide text-right pr-5">Balance</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Risk</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">In each yr</span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide" title="how much the yearly amount rises each year">Rising</span>
            {wrapperRow('pen', 'Pension', 'penC', 'penCIsPct', 'salary')}
            {wrapperRow('isa', 'ISA', 'isaC')}
            {wrapperRow('gia', 'GIA', 'giaC')}
            {wrapperRow('cash', 'Cash', 'cashC')}
            {s.couple && <>
              {wrapperRow('penPart', 'Partner pension', 'penCPart', 'penCIsPctPart', 'salaryPart')}
              {wrapperRow('isaPart', 'Partner ISA', 'isaCPart')}
              {wrapperRow('giaPart', 'Partner GIA', 'giaCPart')}
              {wrapperRow('cashPart', 'Partner cash', 'cashCPart')}
            </>}
          </div>
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-900">One-off payments and withdrawals</h2>
            <button type="button" onClick={addOneOff} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {s.oneOffs.length === 0
            ? <p className="text-[11px] text-slate-400">A house sale, an inheritance, a new roof.</p>
            : <div className="space-y-2">
              {s.oneOffs.map(o => (
                <div key={o.id} className="flex items-center gap-1.5">
                  <input type="date" value={o.date} onChange={(e) => setOneOff(o.id, 'date', e.target.value)} className={`${subCls} flex-1 min-w-0 tabular-nums`} />
                  <input type="text" inputMode="numeric" value={fmt(o.amount)} placeholder="0" onFocus={(e) => e.target.select()} onChange={(e) => setOneOff(o.id, 'amount', parse(e.target.value))} className={`${subCls} w-20 shrink-0 text-right tabular-nums tabular-nums`} />
                  <select value={o.direction} onChange={(e) => setOneOff(o.id, 'direction', e.target.value)} className={`${subCls} shrink-0 font-semibold cursor-pointer`}>
                    <option value="in">in</option><option value="out">out</option>
                  </select>
                  <button type="button" onClick={() => dropOneOff(o.id)} title="Remove" className="shrink-0 p-1 text-slate-400 hover:text-rose-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>}
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-slate-900">Post-retirement income</h2>
            <button type="button" onClick={addEarning} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {s.earnings.length === 0
            ? <p className="text-[11px] text-slate-400">Consultancy, a day a week, a phased wind-down. Taxed as earnings, and it does not move your retirement age.</p>
            : <div className="space-y-2">
              {s.earnings.map(e => (
                <div key={e.id} className="flex items-center gap-1.5">
                  <input type="text" inputMode="numeric" value={fmt(e.amount)} placeholder="£/yr" onFocus={(ev) => ev.target.select()} onChange={(ev) => setEarning(e.id, 'amount', parse(ev.target.value))} className={`${subCls} w-20 shrink-0 text-right tabular-nums tabular-nums`} />
                  <span className="text-[10px] text-slate-400 shrink-0">age</span>
                  <input type="number" min="0" max="120" value={e.startAge} placeholder="from" onFocus={(ev) => ev.target.select()} onChange={(ev) => setEarning(e.id, 'startAge', ev.target.value)} className={`${subCls} w-12 shrink-0 text-center tabular-nums`} />
                  <span className="text-[10px] text-slate-400 shrink-0">to</span>
                  <input type="number" min="0" max="120" value={e.endAge} placeholder="to" onFocus={(ev) => ev.target.select()} onChange={(ev) => setEarning(e.id, 'endAge', ev.target.value)} className={`${subCls} w-12 shrink-0 text-center tabular-nums`} />
                  {s.couple && (
                    <select value={e.owner || 'Myself'} onChange={(ev) => setEarning(e.id, 'owner', ev.target.value)} className="shrink-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-semibold">
                      <option value="Myself">me</option><option value="Partner">them</option>
                    </select>
                  )}
                  <button type="button" onClick={() => dropEarning(e.id)} title="Remove" className="shrink-0 p-1 text-slate-400 hover:text-rose-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>}
        </div>
      </div>

      {/* ------------------------------------------------ RIGHT: can you afford it */}
      <div className="bg-surface border border-slate-200/90 rounded-xl p-5 space-y-4 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Projections</h2>
          {busy && <span className="text-[11px] text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> {view === 'mc' ? `simulating ${LIVE_TRIALS.toLocaleString()} futures` : 'working'}</span>}
        </div>

        {!ready.ready ? (
          <div className="p-8 text-center">
            <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Still need {ready.missing.join(', ')}.</p>
            <p className="text-[11px] text-slate-400 mt-1.5">The answer appears as soon as those are in. There is no button to press.</p>
          </div>
        ) : (
          <>
            {chart && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg w-fit text-xs">
                    {[['rate', 'Rate based'], ['mc', 'Monte Carlo']].map(([k, label]) => (
                      <button key={k} type="button" onClick={() => setView(k)} disabled={k === 'mc' && !res?.mc}
                        className={`px-3 py-0.5 rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${view === k ? 'bg-surface text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
                    ))}
                  </div>
                  {/* one band control driving both charts, so the two stay comparable rather than drifting apart */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg w-fit text-xs">
                    {Object.entries(BAND_QUANTILES).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setBandMode(k)} title={`Draw both charts at the ${v.lowPct} and ${v.highPct}`}
                        className={`px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer ${bandMode === k ? 'bg-accent text-onaccent' : 'text-slate-500 hover:text-slate-900'}`}>{v.button}</button>
                    ))}
                  </div>
                </div>
                {!isPhone && chartPanel()}
                {/* The overlay renders the same markup at the size it measures for itself. This page has
                    no reveal animation to protect, so the one chart memo simply follows the overlay box. */}
                {isPhone && chartFull && (
                  <ChartFullscreen open title="Projections"
                    toolbar={<>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg text-xs">
                        {[['rate', 'Rate based'], ['mc', 'Monte Carlo']].map(([k, label]) => (
                          <button key={k} type="button" onClick={() => setView(k)} disabled={k === 'mc' && !res?.mc}
                            className={`px-3 min-h-11 rounded-lg font-semibold cursor-pointer disabled:opacity-40 ${view === k ? 'bg-surface text-blue-700 shadow-2xs' : 'text-slate-500'}`}>{label}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg text-xs">
                        {Object.entries(BAND_QUANTILES).map(([k, v]) => (
                          <button key={k} type="button" onClick={() => setBandMode(k)} title={`${v.lowPct} to ${v.highPct}`}
                            className={`px-2.5 min-h-11 rounded-lg font-semibold cursor-pointer ${bandMode === k ? 'bg-accent text-onaccent' : 'text-slate-500'}`}>{v.label || k}</button>
                        ))}
                      </div>
                    </>}
                    onBox={setOverlayBox}
                    onClose={() => { setChartFull(false); setOverlayBox(null); }}>
                    {chartPanel(true)}
                  </ChartFullscreen>
                )}
                {/* A legend that is also the control: clicking an entry draws that wrapper. Each carries
                    its own colour swatch, so a line on the chart can be named without a key elsewhere. */}
                {Object.keys(chart.wrappers).length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Short on purpose: the longer version wrapped the legend onto two rows at this
                        width, and onto three on a phone. The buttons carry aria-pressed, so they read as
                        toggles without being told to. */}
                    <span className="text-[11px] text-slate-500 mr-0.5">Made up of:</span>
                    {WRAPPERS.map(w => chart.wrappers[w.key] ? (
                      <button key={w.key} type="button" aria-pressed={!!showWrappers[w.key]}
                        onClick={() => setShowWrappers(v => ({ ...v, [w.key]: !v[w.key] }))}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${showWrappers[w.key] ? 'bg-surface border-slate-300 text-slate-900' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'}`}>
                        <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: w.color, opacity: showWrappers[w.key] ? 1 : 0.45 }} />
                        {w.label}
                      </button>
                    ) : null)}
                  </div>
                )}
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {chart.useFan
                    ? <>The shaded band is the {band.lowPct} to {band.highPct} of {LIVE_TRIALS.toLocaleString()} simulated futures, and a path that runs out stays at zero &mdash; so the bottom edge is honest about failure.</>
                    : <>The shaded band is the {band.lowPct} to {band.highPct}, each edge compounded at that age&rsquo;s own rate. <strong className="text-slate-700">Using fixed rates of interest to project future growth tends to overestimate survival at the unlucky, lower quartile.</strong> This is because in reality a few loss-making years combined with drawdown could take a higher-risk portfolio to £0. See the Monte Carlo simulation for a better predictor of how robust your plan is.</>}
                  {' '}Both views share one scale, so switching compares rather than rescales.
                  {chart.clippedTo && <> The top of the band runs off the chart, reaching {GBP(chart.clippedTo)} at its highest &mdash; the axis follows the middle line so it stays readable.</>}
                </p>
              </>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {chart && !chart.useFan ? <>
                {figure('Pot at retirement', rateCards?.retire == null ? '' : GBP(rateCards.retire),
                  `age ${num(s.retireSelf, 0)}, expected path`, 'text-slate-900', !rateCards)}
                {figure(`Expected pot @ ${num(s.terminalAge, 95)}`, rateCards ? GBP(rateCards.mid) : '',
                  'the middle line, compounded', 'text-slate-900', !rateCards)}
                {figure(`${band.highPct} @ ${num(s.terminalAge, 95)}`, rateCards ? GBP(rateCards.hi) : '',
                  'the top edge of the band', 'text-slate-900', !rateCards)}
                {figure(`${band.lowPct} @ ${num(s.terminalAge, 95)}`, rateCards ? GBP(rateCards.lo) : '',
                  rateCards && rateCards.failAge !== null && rateCards.failAge !== undefined
                    ? `broken from age ${rateCards.failAge}, not low` : 'the bottom edge of the band',
                  rateCards && rateCards.failAge != null ? 'text-rose-700' : 'text-slate-900', !rateCards)}
              </> : <>
                {figure('Survival rate', mc ? `${mc.successRate.toFixed(1)}%` : '',
                  mc ? `±${(1.96 * mc.standardError).toFixed(1)} pts, spending ${GBP(num(s.spend, 0))}` : 'simulating', rateTone, !mc)}
                {figure('Safe maximum', ss ? GBP(ss.spend) : '', `a year, the most that clears ${TARGET}%`, 'text-slate-900', !ss)}
                {figure('Earliest safe retirement',
                  sa ? (sa.alreadyRetired ? 'now' : sa.age == null ? 'later' : `Age ${sa.age}`) : '',
                  sa ? (sa.alreadyRetired ? 'you are already past the age you entered'
                    : sa.age == null ? `no age up to your horizon clears ${TARGET}%`
                      : `the earliest stop that clears ${TARGET}%`)
                    : 'scanning each age',
                  'text-slate-900', !sa)}
                {figure('Pot at retirement', potAtRetirement == null ? '' : GBP(potAtRetirement),
                  `age ${num(s.retireSelf, 0)}, expected path`, 'text-slate-900', potAtRetirement == null)}
                {figure(`Median pot @ ${num(s.terminalAge, 95)}`, mc ? GBP(mc.medianTerminal) : '',
                  'half of futures end above this', 'text-slate-900', !mc)}
                {/* a pot floors at zero, so "below this" is meaningless once the tenth percentile has run dry */}
                {figure(`Unlucky pot @ ${num(s.terminalAge, 95)}`, mc ? GBP(mc.p10Terminal) : '',
                  mc && mc.p10Terminal <= 0 ? 'one plan in ten runs out before the end' : 'one plan in ten ends below',
                  mc && mc.p10Terminal <= 0 ? 'text-rose-700' : 'text-slate-900', !mc)}
              </>}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              {/* these three are counts over simulated paths, so they belong to the Monte Carlo view only */}
              {mc && chart && chart.useFan && <>
                <span>Tax over your lifetime, typical run: <strong className="text-slate-700 tabular-nums">{GBP(mc.medianLifetimeTax)}</strong></span>
                {mc.preNmpaFailRate > 0 && <span>Stranded before the pension unlocks: <strong className={mc.preNmpaFailRate > 5 ? 'text-rose-700 tabular-nums' : 'text-slate-700 tabular-nums'}>{mc.preNmpaFailRate.toFixed(1)}%</strong></span>}
                {mc.medianFailAge && <span>Of the runs that fail, the money typically goes at <strong className="text-slate-700 tabular-nums">{mc.medianFailAge}</strong></span>}
              </>}
              {/* the export is the year-by-year projection, which both views are drawn from */}
              <button type="button" onClick={exportCsv} disabled={!timeline}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-surface text-slate-600 hover:text-slate-900 hover:border-slate-300 font-semibold cursor-pointer disabled:opacity-40">
                <Download className="w-3 h-3" /> Export the year-by-year figures
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
              All three are quoted at a <strong className="text-slate-700">{TARGET}% target</strong>: the most you could spend, and the earliest you could stop, while still coming through {TARGET} futures in 100. Every figure is in today&rsquo;s money.
              {ss && ss.spend < num(s.spend, 0) && <> <strong className="text-rose-700">You are planning to spend more than the safe figure.</strong> The difference is the additional risk you are accepting, not a reason you cannot do it.</>}
            </p>

            {res?.policy && (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong className="text-slate-700">How it draws the money: {policyLabel(res.policy)}.</strong>{' '}
                Picked from {res.policy.candidates} ways of drawing down, on whichever survives most often &mdash; no setting to change.
                {res.policy.tied > 1
                  ? <> {res.policy.tied} of them survive about equally often here ({res.policy.bestRate.toFixed(1)}%, against {res.policy.worstRate.toFixed(1)}% for the weakest), so survival alone cannot separate them. Of those {res.policy.tied} this one protects the bad case best; where even that is too close to call, the model&rsquo;s standard order decides rather than a difference too small to measure.</>
                  : <> It survives {res.policy.bestRate.toFixed(1)}% of the time against {res.policy.worstRate.toFixed(1)}% for the weakest, and no other option comes close enough to matter.</>}
                {res.policy.closeCall && (
                  <> <span data-close-call className="text-amber-800"><strong>Close call.</strong> The plan was simulated twice on independent market paths, and the two runs would each have chosen differently &mdash; {res.policy.closeCall.map(c => policyLabel(c).toLowerCase()).join(' and ')}. The figures on this page combine both runs; the two ways of drawing are too close for the simulation to separate, and either would serve.</span></>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
