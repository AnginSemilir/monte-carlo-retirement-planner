import { useState, useMemo, useEffect, useRef } from 'react';
import { TrendingUp, Plus, X, Loader2 } from 'lucide-react';
import {
  buildContext, resolveMpaa, monteCarlo, quantileCurve, optimizeSpend, safeRetirementAge,
  buildPolicyCandidates, explainPick, toleranceFor, BAND_QUANTILES, TAX_REGION_LABELS, num
} from './App.jsx';
import { SIMPLE_BLANK, toFullPlan, readiness, oneOffId, earningId } from './simplePlan.js';

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
const TARGET = 90;          // fixed, and stated in words rather than offered as a dial. See PLAN-streamlined.md.
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

export default function Simple() {
  const [s, setS] = useState(load);
  const [view, setView] = useState('expected');
  const [res, setRes] = useState(null);          // { mc, safeSpend, safeAge }
  const [busy, setBusy] = useState(false);
  const runToken = useRef(0);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ } }, [s]);

  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));
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
  const band = BAND_QUANTILES.quartile;   // the full app's default too, so the two draw the same picture
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
   * Everything expensive, debounced behind one token so a stale answer can never overwrite a fresh one.
   * The three results land in order and appear as they arrive, because the survival rate is a second and
   * the retirement scan is twenty - waiting for all three would make the page feel broken.
   */
  useEffect(() => {
    if (!ctx || !full) { setRes(null); return; }
    const mine = ++runToken.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        /*
         * The policy is chosen FIRST, and every figure after it is quoted on the winner. Picking the
         * policy and then reporting survival, safe spend and safe retirement age from the default one
         * would describe a plan nobody is being recommended.
         */
        const cands = buildPolicyCandidates(full).map((c) => {
          const cctx = buildContext(resolveMpaa(c.planState));
          return { ...c, ctx: cctx, stats: monteCarlo(cctx, { trials: LIVE_TRIALS, seed: 12345, collectPaths: true }) };
        });
        if (runToken.current !== mine) return;
        // survival first, every lower tier gated by its own tolerance, fixed preference where none bites
        const rates0 = cands.map(c => c.stats.successRate);
        const best0 = Math.max(...rates0);
        const sEps0 = toleranceFor('survive', best0);
        const finalists = cands.filter(c => best0 - c.stats.successRate <= sEps0);
        const won = explainPick(cands, { priorities: POLICY_PRIORITIES }).winner;
        // the headline rate is the run that WON, not a fresh one - a re-run would print a different
        // number from the one the choice was made on
        const mc = won.stats;
        const wonPlan = resolveMpaa(won.planState);
        const wonCtx = won.ctx;
        setRes({ mc, policy: { label: policyLabel(won), candidates: cands.length, tied: finalists.length,
          bestRate: best0, worstRate: Math.min(...rates0) }, plan: wonPlan });
        await tick();

        const safeSpend = optimizeSpend(wonCtx, { targetRate: TARGET, searchTrials: 300, finalTrials: 1200 });
        if (runToken.current !== mine) return;
        setRes(r => ({ ...r, safeSpend }));
        await tick();

        const safeAge = safeRetirementAge(wonPlan, { targetRate: TARGET, searchTrials: 300, finalTrials: 1200 });
        if (runToken.current !== mine) return;
        setRes(r => ({ ...r, safeAge }));
      } catch (err) {
        if (runToken.current === mine) setRes({ error: String(err && err.message ? err.message : err) });
      } finally { if (runToken.current === mine) setBusy(false); }
    }, 700);
    return () => clearTimeout(timer);
  }, [ctx, full]);

  // ------------------------------------------------------------------ the one chart
  const chart = useMemo(() => {
    if (!expected) return null;
    const fan = res?.mc?.bands;
    const useFan = view === 'range' && fan && fan.length;
    const age0 = expected.mid[0]?.ageSelf ?? 0;
    const series = useFan
      ? fan.map(b => ({ age: age0 + b.t, lo: b.p25, mid: b.p50, hi: b.p75 }))
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
      ...(fan && fan.length ? fan.map(b => b.p75) : [0]));
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
    const W = 720, H = 300, L = 44, R = 16, T = 14, B = 30;
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
    return { W, H, L, R, T, B, ih, x, y, area, line, ticks, ageTicks, useFan, a0, a1, clippedTo };
  }, [expected, res, view]);

  // ------------------------------------------------------------------ input helpers
  const inCls = 'w-full p-2 bg-surface border border-slate-300 rounded-lg text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500';
  const money = (k, label) => (
    <label className="block">
      <span className="text-[11px] text-slate-500 font-semibold block mb-1">{label}</span>
      <input type="number" min="0" step="1000" inputMode="numeric" value={s[k]} placeholder="0"
        onFocus={(e) => e.target.select()} onChange={(e) => set(k, e.target.value)} className={inCls} />
    </label>
  );
  const age = (k, label, ph) => (
    <label className="block">
      <span className="text-[11px] text-slate-500 font-semibold block mb-1">{label}</span>
      <input type="number" min="0" max="120" inputMode="numeric" value={s[k]} placeholder={ph}
        onFocus={(e) => e.target.select()} onChange={(e) => set(k, e.target.value)} className={inCls} />
    </label>
  );

  const addOneOff = () => setS(p => ({ ...p, oneOffs: [...p.oneOffs, { id: oneOffId(), date: '', amount: '', direction: 'in' }] }));
  const setOneOff = (id, k, v) => setS(p => ({ ...p, oneOffs: p.oneOffs.map(o => o.id === id ? { ...o, [k]: v } : o) }));
  const dropOneOff = (id) => setS(p => ({ ...p, oneOffs: p.oneOffs.filter(o => o.id !== id) }));
  const addEarning = () => setS(p => ({ ...p, earnings: [...(p.earnings || []), { id: earningId(), amount: '', startAge: p.retireSelf || '', endAge: '', owner: 'Myself' }] }));
  const setEarning = (id, k, v) => setS(p => ({ ...p, earnings: (p.earnings || []).map(e => e.id === id ? { ...e, [k]: v } : e) }));
  const dropEarning = (id) => setS(p => ({ ...p, earnings: (p.earnings || []).filter(e => e.id !== id) }));

  const figure = (label, value, sub, tone = 'text-slate-900', pending = false) => (
    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
      <span className="text-[11px] text-slate-500 block mb-0.5">{label}</span>
      {pending
        ? <span className="text-2xl font-black font-mono text-slate-300 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />&mdash;</span>
        : <span className={`text-2xl font-black font-mono ${tone}`}>{value}</span>}
      <span className="text-[11px] text-slate-500 block mt-1 leading-snug">{sub}</span>
    </div>
  );

  const mc = res?.mc, ss = res?.safeSpend, sa = res?.safeAge;
  const rateTone = !mc ? '' : mc.successRate >= TARGET ? 'text-emerald-700' : mc.successRate >= 75 ? 'text-amber-700' : 'text-rose-700';

  return (
    <div className="grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-5 items-start">

      {/* ------------------------------------------------ LEFT: what you have */}
      <div className="bg-surface border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 p-1 rounded-xl">
          {[[false, 'Just me'], [true, 'Me and a partner']].map(([v, label]) => (
            <button key={label} type="button" onClick={() => set('couple', v)}
              className={`flex-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${!!s.couple === v ? 'bg-surface text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
          ))}
        </div>

        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">You</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {age('ageSelf', 'Age now', '55')}{age('retireSelf', 'Stop working at', '62')}
            {s.couple && <>{age('agePart', 'Partner age now', '55')}{age('retirePart', 'Partner stops at', '62')}</>}
            {money('spend', 'Spend a year')}
            {money('statePensionSelf', 'State Pension /yr')}
            {s.couple && money('statePensionPart', 'Partner State Pension /yr')}
          </div>
          <label className="block mt-2.5">
            <span className="text-[11px] text-slate-500 font-semibold block mb-1">Where you pay tax</span>
            <select value={s.region} onChange={(e) => set('region', e.target.value)} className={inCls}>
              {Object.entries(TAX_REGION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>

        <div className="pt-1">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">Portfolio</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {money('pen', 'Pension')}{money('isa', 'ISA')}
            {money('gia', 'Investments')}{money('cash', 'Cash')}
          </div>
          {s.couple && (
            <div className="grid grid-cols-2 gap-2.5 mt-2.5 pt-2.5 border-t border-slate-100">
              {money('penPart', 'Partner pension')}{money('isaPart', 'Partner ISA')}
              {money('giaPart', 'Partner investments')}{money('cashPart', 'Partner cash')}
            </div>
          )}
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">One-off payments and withdrawals</h2>
            <button type="button" onClick={addOneOff} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {s.oneOffs.length === 0
            ? <p className="text-[11px] text-slate-400">A house sale, an inheritance, a new roof.</p>
            : <div className="space-y-2">
              {s.oneOffs.map(o => (
                <div key={o.id} className="flex items-center gap-1.5">
                  <input type="date" value={o.date} onChange={(e) => setOneOff(o.id, 'date', e.target.value)} className="flex-1 min-w-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-mono" />
                  <input type="number" min="0" step="1000" value={o.amount} placeholder="0" onFocus={(e) => e.target.select()} onChange={(e) => setOneOff(o.id, 'amount', e.target.value)} className="w-20 shrink-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-mono" />
                  <select value={o.direction} onChange={(e) => setOneOff(o.id, 'direction', e.target.value)} className="shrink-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-semibold">
                    <option value="in">in</option><option value="out">out</option>
                  </select>
                  <button type="button" onClick={() => dropOneOff(o.id)} title="Remove" className="shrink-0 p-1 text-slate-400 hover:text-rose-600 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>}
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Work after you stop</h2>
            <button type="button" onClick={addEarning} className="flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 cursor-pointer"><Plus className="w-3 h-3" /> Add</button>
          </div>
          {s.earnings.length === 0
            ? <p className="text-[11px] text-slate-400">Consultancy, a day a week, a phased wind-down. Taxed as earnings, and it does not move your retirement age.</p>
            : <div className="space-y-2">
              {s.earnings.map(e => (
                <div key={e.id} className="flex items-center gap-1.5">
                  <input type="number" min="0" step="1000" value={e.amount} placeholder="£/yr" onFocus={(ev) => ev.target.select()} onChange={(ev) => setEarning(e.id, 'amount', ev.target.value)} className="w-20 shrink-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-mono" />
                  <span className="text-[10px] text-slate-400 shrink-0">age</span>
                  <input type="number" min="0" max="120" value={e.startAge} placeholder="from" onFocus={(ev) => ev.target.select()} onChange={(ev) => setEarning(e.id, 'startAge', ev.target.value)} className="w-14 shrink-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-mono" />
                  <span className="text-[10px] text-slate-400 shrink-0">to</span>
                  <input type="number" min="0" max="120" value={e.endAge} placeholder="to" onFocus={(ev) => ev.target.select()} onChange={(ev) => setEarning(e.id, 'endAge', ev.target.value)} className="w-14 shrink-0 p-1.5 bg-surface border border-slate-300 rounded-lg text-[11px] font-mono" />
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
      <div className="bg-surface border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Can you afford it?</h2>
          {busy && <span className="text-[11px] text-slate-400 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> working</span>}
        </div>

        {!ready.ready ? (
          <div className="p-8 text-center">
            <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Still need {ready.missing.join(', ')}.</p>
            <p className="text-[11px] text-slate-400 mt-1.5">The answer appears as soon as those are in. There is no button to press.</p>
          </div>
        ) : (
          <>
            {chart && (
              <>
                <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl w-fit text-xs">
                  {[['expected', 'Expected'], ['range', 'Full range']].map(([k, label]) => (
                    <button key={k} type="button" onClick={() => setView(k)} disabled={k === 'range' && !res?.mc}
                      className={`px-3 py-0.5 rounded-lg font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${view === k ? 'bg-surface text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full h-auto select-none" role="img"
                    aria-label={`Pot from age ${chart.a0} to ${chart.a1}, ${chart.useFan ? 'from simulated paths' : 'compounded from the return assumptions'}`}>
                    {chart.ticks.map((v, i) => (
                      <g key={i}>
                        <line x1={chart.L} x2={chart.W - chart.R} y1={chart.y(v)} y2={chart.y(v)} stroke="#e2e8f0" strokeWidth="1" />
                        <text x={chart.L - 7} y={chart.y(v) + 3} textAnchor="end" fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">{GBP_SHORT(v)}</text>
                      </g>
                    ))}
                    <polygon points={chart.area} fill={chart.useFan ? '#6366f1' : '#2563eb'} opacity="0.16" />
                    <path d={chart.line} fill="none" stroke={chart.useFan ? '#4f46e5' : '#2563eb'} strokeWidth="2.5" strokeLinejoin="round" />
                    <line x1={chart.L} x2={chart.W - chart.R} y1={chart.T + chart.ih} y2={chart.T + chart.ih} stroke="#cbd5e1" strokeWidth="1" />
                    {chart.ageTicks.map(p => (
                      <text key={p.age} x={chart.x(p.age)} y={chart.H - 10} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="ui-monospace, monospace">{p.age}</text>
                    ))}
                  </svg>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {chart.useFan
                    ? <>The shaded band is the {band.lowPct} to {band.highPct} of {LIVE_TRIALS.toLocaleString()} simulated futures, and a path that runs out stays at zero &mdash; so the bottom edge is honest about failure.</>
                    : <>The shaded band is the {band.lowPct} to {band.highPct}, compounded from the return assumptions. <strong className="text-slate-700">No line here can go bust</strong>, so the bottom edge flatters a weak plan. Flip to the full range to see what that hides.</>}
                  {' '}Both views share one scale, so switching compares rather than rescales.
                  {chart.clippedTo && <> The top of the band runs off the chart, reaching {GBP(chart.clippedTo)} at its highest &mdash; the axis follows the middle line so it stays readable.</>}
                </p>
              </>
            )}

            <div className="grid sm:grid-cols-3 gap-3 pt-1">
              {figure('Survives', mc ? `${mc.successRate.toFixed(1)}%` : '', mc ? `of ${mc.trials.toLocaleString()} futures, spending ${GBP(num(s.spend, 0))}` : 'simulating', rateTone, !mc)}
              {figure('Safe spend', ss ? GBP(ss.spend) : '', `the most that still clears ${TARGET}%`, 'text-emerald-700', !ss)}
              {figure('Retire from',
                sa ? (sa.alreadyRetired ? 'now' : sa.age == null ? 'later' : String(sa.age)) : '',
                sa ? (sa.alreadyRetired ? 'you are already past the age you entered'
                  : sa.age == null ? `no age up to your horizon clears ${TARGET}%`
                    : `the earliest stop that clears ${TARGET}%`)
                  : 'scanning each age',
                'text-blue-700', !sa)}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
              All three are quoted at a <strong className="text-slate-700">{TARGET}% target</strong>: the most you could spend, and the earliest you could stop, while still coming through {TARGET} futures in 100. Every figure is in today&rsquo;s money.
              {ss && ss.spend < num(s.spend, 0) && <> <strong className="text-rose-700">You are planning to spend more than the safe figure.</strong> That is the size of the bet, not a prohibition.</>}
            </p>

            {res?.policy && (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                <strong className="text-slate-700">How it draws the money: {res.policy.label.toLowerCase()}.</strong>{' '}
                Picked from {res.policy.candidates} ways of drawing down, on whichever survives most often &mdash; no setting to change.
                {res.policy.tied > 1
                  ? <> {res.policy.tied} of them survive about equally often here ({res.policy.bestRate.toFixed(1)}%, against {res.policy.worstRate.toFixed(1)}% for the weakest), so survival alone cannot separate them. Of those {res.policy.tied} this one protects the bad case best; where even that is too close to call, the model&rsquo;s standard order decides rather than a difference too small to measure.</>
                  : <> It survives {res.policy.bestRate.toFixed(1)}% of the time against {res.policy.worstRate.toFixed(1)}% for the weakest, and no other option comes close enough to matter.</>}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
