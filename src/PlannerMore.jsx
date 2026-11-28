/*
 * YOUR PLAN, BEYOND THE HEADLINE (the new planner's UI pass, 20 Nov 2026). Loaded with src/PlannerPlan.jsx, which places these.
 *
 * Each card reads figures the worker already holds, from the same paths as the headline (src/solverStrategy.js moreOf, the
 * summary's `more`) or the typical run's whole life (aheadOf's `life`), so none of them asks for a second simulation:
 *   VersusStrip   inside the answer card: the solved plan against your current approach, three figures side by side
 *   LastingCard   how long the money lasts, by age, both arms
 *   InvestCard    how the money is invested: the share in shares by age (the solved plan's spread, your current approach's
 *                 typical), and on the typical run each wrapper's share, year by year
 *   LevelsBar     inside the spending card: the retired years at each spending level, both arms, and the years below target
 *   LifeCard      where the money sits on the typical run, wrapper by wrapper, either arm on one scale
 * Every figure is keyed by plan year and drawn at the age the outlook gives (ageAt0), so a couple put back from its mirror
 * reads right. The charts carry a hover readout and a "Show the figures" table each.
 */
import React, { useMemo, useState } from 'react';

const PAD = { l: 44, r: 16, t: 14, b: 26 };
// a chart's drawing box: on a phone about as wide in units as it is in pixels, so its 10-unit labels read at about 10px
// (the UI pass's phone round, 21 Nov: at 600 units they drew near 6px on a 360px screen)
export const dimsOf = isPhone => (isPhone ? { W: 330, H: 240 } : { W: 600, H: 220 });
const lin = (d0, d1, r0, r1) => v => r0 + ((v - d0) * (r1 - r0)) / (d1 - d0 || 1);
const pct = x => `${Math.round(x)}%`;
export const short = v => (v >= 995000 ? `£${(v / 1e6).toFixed(v >= 9.95e6 ? 0 : 1)}m` : v >= 1000 ? `£${Math.round(v / 1000)}k` : `£${Math.round(v)}`);
const card = dim => `p-4 bg-surface border border-slate-200/90 rounded-xl space-y-3 ${dim ? 'opacity-55' : ''}`;
const linkBtn = isPhone => `text-xs font-semibold text-indigo-700 hover:underline cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-9'}`;
const pathOf = (pts, x, y) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join('');

/* a hover readout for a chart drawn over ages: the nearest age to the pointer, a rule at it and a box of lines beside it */
// on a touch screen the readout stays where the finger lifted (a tap reads a year, a drag scrubs; the chart's box is left out
// of the deck's swipe), and a mouse's leaves with the pointer
function useHover(ages, x, W) {
  const [at, setAt] = useState(null);
  const on = e => {
    const r = e.currentTarget.getBoundingClientRect(), vx = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    ages.forEach((a, i) => { if (Math.abs(x(a) - vx) < Math.abs(x(ages[best]) - vx)) best = i; });
    setAt(best);
  };
  return { at, svg: { onPointerMove: on, onPointerDown: on, onPointerLeave: e => { if (e.pointerType === 'mouse') setAt(null); } } };
}
function Readout({ at, x, lines, W }) {
  if (at === null || !lines) return null;
  const left = (100 * x) / W;
  return (
    <div data-readout className="pointer-events-none absolute top-1 z-10 px-2 py-1.5 rounded-md bg-surface border border-slate-300 shadow-xs text-[11px] leading-snug text-slate-800 tabular-nums whitespace-nowrap"
      style={left > 55 ? { right: `${100 - left + 2}%` } : { left: `${left + 2}%` }}>
      {lines.map((l, i) => <div key={i} className={i === 0 ? 'font-semibold' : ''}>{l}</div>)}
    </div>
  );
}
const AgeAxis = ({ a0, a1, x, h }) => [a0, Math.round((a0 + a1) / 2), a1].map(v => <text key={v} x={x(v)} y={h - 8} textAnchor="middle" className="fill-slate-500 text-[10px]">{v}</text>);
function Toggle({ show, setShow, isPhone }) {
  return <button type="button" onClick={() => setShow(v => !v)} className={linkBtn(isPhone)}>{show ? 'Hide the figures' : 'Show the figures'}</button>;
}
const Key = ({ items }) => (
  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
    {items.map(([cls, label, dash]) => (
      <span key={label} className="inline-flex items-center gap-1.5">
        {dash ? <svg width="18" height="6" aria-hidden="true"><line x1="0" x2="18" y1="3" y2="3" className={cls} strokeWidth="2" strokeDasharray={dash === true ? '4 3' : dash} /></svg>
          : <span className={`inline-block w-2.5 h-2.5 rounded-sm ${cls}`} />}
        {label}
      </span>
    ))}
  </div>
);

/* ---------------------------------------------------------------- the solved plan against your current approach, in the card */
export function VersusStrip({ s, ageAt0, fmt, isPhone }) {
  const m = s.more;
  if (!m) return null;
  const c = s.compare, sp = m.spending;
  const failAge = a => (a.failed.t50 === null ? null : Math.round(ageAt0 + a.failed.t50));
  const tiles = [
    { k: 'survival', label: 'Chance your money lasts', a: c.solved.survival, b: c.yours.survival, f: pct, bar: true, diff: d => `${d >= 0 ? '+' : '−'}${Math.abs(Math.round(d))} points`, good: d => d > 0 },
    { k: 'delivered', label: 'Spending delivered over the plan', a: sp.solved.delivered, b: sp.yours.delivered, f: v => `${pct(v)} of target`, bar: true, diff: d => `${d >= 0 ? '+' : '−'}${Math.abs(Math.round(d))} points`, good: d => d > 0 },
    { k: 'tax', label: 'Tax over your lifetime, typical', a: c.solved.lifetimeTax, b: c.yours.lifetimeTax, f: v => fmt(v), bar: false, diff: d => (Math.abs(d) < 500 ? 'about the same' : `${short(Math.abs(d))} ${d < 0 ? 'less' : 'more'}`), good: d => d < 0 }
  ];
  const fa = failAge(sp.solved), fb = failAge(sp.yours);
  const tone = (t, d) => (t.good(d) ? 'text-emerald-700' : Math.abs(d) < 0.5 ? 'text-slate-500' : 'text-rose-700');
  /*
   * ON A PHONE, A TABLE. Three tiles stacked made the answer card a screen and a half and pushed "Why" and the levers off
   * the first slide; the same figures as rows (what, solved, current, the difference) fit in about a third of that, and a
   * row reads across the way the comparison is meant: this plan, then yours, then what it buys you.
   */
  if (isPhone) return (
    <div data-versus="table" className="pt-3 mt-1 border-t border-slate-200 space-y-1.5">
      <div className="text-xs font-semibold text-slate-700">Against your current approach (the app&apos;s fixed rules), on the same markets</div>
      <table className="w-full text-[12px] tabular-nums">
        <thead><tr className="text-[11px] text-slate-500"><th className="text-left font-medium" /><th className="text-right font-medium pl-2">Solved</th><th className="text-right font-medium pl-2">Current</th><th className="text-right font-medium pl-2">Change</th></tr></thead>
        <tbody>{tiles.map(t => {
          const d = t.a - t.b, f = t.k === 'tax' ? short : pct;
          return (
            <tr key={t.k} data-versus-tile={t.k} className="border-t border-slate-100 align-baseline">
              <td className="py-1.5 pr-1 text-slate-700 leading-tight">{t.k === 'survival' ? 'Money lasts' : t.k === 'delivered' ? 'Spending delivered' : 'Lifetime tax'}</td>
              <td className="pl-2 text-right font-semibold text-slate-900">{f(t.a)}</td>
              <td className="pl-2 text-right text-slate-600">{f(t.b)}</td>
              <td className={`pl-2 text-right font-semibold whitespace-nowrap ${tone(t, d)}`}>{t.k === 'tax' ? (Math.abs(d) < 500 ? 'same' : `${d < 0 ? '−' : '+'}${short(Math.abs(d))}`) : `${d >= 0 ? '+' : '−'}${Math.abs(Math.round(d))} pts`}</td>
            </tr>
          );
        })}</tbody>
      </table>
      {(fa !== null || fb !== null) && (
        <p className="text-[11px] text-slate-500" data-versus-fail>
          Where the money does run out: typically at {fa !== null ? fa : '–'} under the solved plan{fb !== null ? `, ${fb} under your current approach` : ''}.
        </p>
      )}
    </div>
  );
  return (
    <div data-versus className="pt-3 mt-1 border-t border-slate-200 space-y-2">
      <div className="text-xs font-semibold text-slate-700">Against your current approach, the app&apos;s fixed rules on the same markets</div>
      <div className={`grid gap-3 ${isPhone ? 'grid-cols-1' : 'grid-cols-1 min-[560px]:grid-cols-3'}`}>
        {tiles.map(t => {
          const d = t.a - t.b;
          return (
            <div key={t.k} data-versus-tile={t.k} className="space-y-1">
              <div className="text-[11px] text-slate-500">{t.label}</div>
              <div className="flex items-baseline gap-2 tabular-nums">
                <span className="text-[17px] font-semibold text-slate-900">{t.f(t.a)}</span>
                <span className={`text-[11px] font-semibold ${t.good(d) ? 'text-emerald-700' : Math.abs(d) < 0.5 ? 'text-slate-500' : 'text-rose-700'}`}>{t.diff(d)}</span>
              </div>
              {t.bar && (
                <div className="space-y-0.5" aria-hidden="true">
                  <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, t.a))}%` }} /></div>
                  <div className="h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-slate-400" style={{ width: `${Math.max(0, Math.min(100, t.b))}%` }} /></div>
                </div>
              )}
              <div className="text-[11px] text-slate-500 tabular-nums">Your current approach: {t.f(t.b)}</div>
            </div>
          );
        })}
      </div>
      {(fa !== null || fb !== null) && (
        <p className="text-[11px] text-slate-500" data-versus-fail>
          Where the money does run out, it typically runs out at {fa !== null ? fa : '–'} under the solved plan{fb !== null ? ` and at ${fb} under your current approach` : ''}.
        </p>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- how long the money lasts */
export function LastingCard({ s, ageAt0, dim, isPhone }) {
  const [show, setShow] = useState(false);
  const L = s.more && s.more.lasting, { W, H } = dimsOf(isPhone);
  const ages = useMemo(() => (L ? L.solved.map((_, t) => ageAt0 + t) : []), [L, ageAt0]);
  const x = lin(ages[0], ages[ages.length - 1], PAD.l, W - PAD.r), y = lin(0, 100, H - PAD.b, PAD.t);
  const hv = useHover(ages, x, W);
  if (!L || ages.length < 2) return null;
  const a = L.solved.map((v, i) => [ages[i], v]), b = L.yours.map((v, i) => [ages[i], v]);
  // the age the two part most, for the sentence (the first where the gap is widest, past the first ten years where it can be)
  let gi = 0;
  L.solved.forEach((v, i) => { if (v - L.yours[i] > L.solved[gi] - L.yours[gi] + 0.5) gi = i; });
  const between = `${pathOf(a, x, y)}${[...b].reverse().map(p => `L${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join('')}Z`;
  const last = ages.length - 1, endA = y(L.solved[last]), endB = y(L.yours[last]);
  // the solved plan's name above its line's last few years (a minimum pot can drop the line in the final year, under the name)
  const topA = Math.min(...L.solved.slice(-4).map(v => y(v)));
  const labA = Math.abs(endA - endB) < 14 ? (endA < endB ? topA - 6 : endA + 14) : topA - 6;
  const label = `How long your money lasts. By ${ages[gi]}: ${pct(L.solved[gi])} of markets under the solved plan, ${pct(L.yours[gi])} under your current approach. At the plan's end: ${pct(L.solved[last])} and ${pct(L.yours[last])}.`;
  const at = hv.at;
  return (
    <section data-more="lasting" data-lasting={JSON.stringify(L)} className={card(dim)}>
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">How long your money lasts</h3>
        <p className="text-xs text-slate-600 mt-0.5">The share of simulated markets in which your money is still going at each age.</p>
      </div>
      <div className="relative" data-no-swipe>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-pan-y" role="img" aria-label={label} data-chart="lasting" {...hv.svg}>
          {[0, 25, 50, 75, 100].map(v => <g key={v}><line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200" /><text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-slate-500 text-[10px]">{v}%</text></g>)}
          <path d={between} className="fill-indigo-100" opacity="0.8" />
          <path d={pathOf(b, x, y)} className="stroke-slate-500 fill-none" strokeWidth="2" strokeDasharray="6 4" />
          <path d={pathOf(a, x, y)} className="stroke-indigo-700 fill-none" strokeWidth="2.5" />
          <text x={x(ages[last]) - 4} y={labA} textAnchor="end" className="fill-indigo-800 text-[10px] font-semibold">{isPhone ? `solved ${pct(L.solved[last])}` : `the solved plan, ${pct(L.solved[last])}`}</text>
          <text x={x(ages[last]) - 4} y={Math.min(endB + 14, H - PAD.b - 4)} textAnchor="end" className="fill-slate-600 text-[10px]">{isPhone ? `current ${pct(L.yours[last])}` : `your current approach, ${pct(L.yours[last])}`}</text>
          {at !== null && <g><line x1={x(ages[at])} x2={x(ages[at])} y1={PAD.t} y2={H - PAD.b} className="stroke-slate-400" /><circle cx={x(ages[at])} cy={y(L.solved[at])} r="4" className="fill-indigo-700 stroke-surface" strokeWidth="2" /><circle cx={x(ages[at])} cy={y(L.yours[at])} r="4" className="fill-slate-500 stroke-surface" strokeWidth="2" /></g>}
          <AgeAxis a0={ages[0]} a1={ages[last]} x={x} h={H} />
        </svg>
        <Readout W={W} at={at} x={at === null ? 0 : x(ages[at])} lines={at === null ? null : [`Age ${ages[at]}`, `Solved plan: ${pct(L.solved[at])}`, `Current approach: ${pct(L.yours[at])}`]} />
      </div>
      <Key items={[['stroke-indigo-700', 'The solved plan', '1 0'], ['stroke-slate-500', 'Your current approach', true]]} />
      {L.solved[gi] - L.yours[gi] >= 1 && (
        <p className="text-xs text-slate-700" data-lasting-gap={ages[gi]}>
          The gap is widest at {ages[gi]}: your money is still going in {pct(L.solved[gi])} of markets under the solved plan, against {pct(L.yours[gi])} under your current approach.
        </p>
      )}
      <Toggle show={show} setShow={setShow} isPhone={isPhone} />
      {show && (
        <table className="w-full text-[11px] tabular-nums" data-more-table="lasting"><thead><tr className="text-slate-500"><th className="text-left font-medium">Age</th><th className="text-right font-medium">Solved plan</th><th className="text-right font-medium">Your current approach</th></tr></thead>
          <tbody>{ages.map((g, i) => (i % 5 === 0 || i === last) && <tr key={g} className="border-t border-slate-100"><td>{g}</td><td className="text-right">{L.solved[i].toFixed(1)}%</td><td className="text-right">{L.yours[i].toFixed(1)}%</td></tr>)}</tbody></table>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- how the money is invested */
// the typical run's strip: one row a wrapper group, each stretch at one risk a block shaded by its share in shares (one hue,
// faint to strong), the plan's years across the row
function TierStrip({ life, ageAt0, a0, a1, rows }) {
  const span = a1 - a0 + 1, width = 100;
  const at = age => (width * (age - a0)) / span;
  return (
    <div className="space-y-1" role="img" data-chart="tierstrip"
      aria-label={rows.map(([k, name]) => `${name}: ${runsOf(life, k).map(r => `${r.v}% in shares from ${ageAt0 + r.t0}`).join(', ')}`).join('. ')}>
      {rows.map(([k, name]) => (
        <div key={k} data-strip={k} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[11px] text-slate-600">{name}</span>
          <div className="relative h-6 flex-1">
          {runsOf(life, k).map(r => {
            const w = (width * (r.t1 - r.t0 + 1)) / span;
            return (
              <div key={r.t0} title={`${name}: ${r.v}% in shares, ages ${ageAt0 + r.t0} to ${ageAt0 + r.t1}`} className="absolute top-0 h-6 rounded-sm overflow-hidden border-r-2 border-surface"
                style={{ left: `${at(ageAt0 + r.t0)}%`, width: `${w}%` }}>
                <div className="absolute inset-0 bg-indigo-700" style={{ opacity: 0.15 + 0.85 * (r.v / 100) }} />
                {w >= 10 && <span className={`relative pl-1 text-[11px] font-semibold leading-6 ${r.v >= 60 ? 'text-surface' : 'text-slate-900'}`}>{r.v}%</span>}
              </div>
            );
          })}
          </div>
        </div>
      ))}
    </div>
  );
}
const runsOf = (life, k) => {
  const out = [];
  life.forEach(r => {
    if (r[k] === null) return;
    const p = out[out.length - 1];
    if (p && p.v === r[k] && p.t1 === r.t - 1) p.t1 = r.t; else out.push({ v: r[k], t0: r.t, t1: r.t });
  });
  return out;
};
export function InvestCard({ s, life, ageAt0, dim, isPhone }) {
  const [show, setShow] = useState(false);
  const eqs = s.more && s.more.equity, a = eqs ? eqs.solved : [], b = eqs ? eqs.yours : [], { W, H } = dimsOf(isPhone);
  const ages = useMemo(() => a.map(p => ageAt0 + p.t), [a, ageAt0]);
  const a0 = ageAt0, a1 = ageAt0 + Math.max(a.length ? a[a.length - 1].t : 0, b.length ? b[b.length - 1].t : 0, 1);
  const x = lin(a0, a1, PAD.l, W - PAD.r), y = lin(0, 100, H - PAD.b, PAD.t);
  const hv = useHover(ages, x, W);
  if (!eqs || a.length < 2) return null;
  const band = (lo, hi) => `${a.map((p, i) => `${i ? 'L' : 'M'}${x(ageAt0 + p.t).toFixed(2)},${y(p[hi]).toFixed(2)}`).join('')}${[...a].reverse().map(p => `L${x(ageAt0 + p.t).toFixed(2)},${y(p[lo]).toFixed(2)}`).join('')}Z`;
  const med = a.map(p => [ageAt0 + p.t, p.p50]), yours = b.map(p => [ageAt0 + p.t, p.p50]);
  // the sentence: where the solved plan starts, its least and when, where it ends; your current approach's start and end
  let lo = 0;
  a.forEach((p, i) => { if (p.p50 < a[lo].p50) lo = i; });
  const start = a[0].p50, end = a[a.length - 1].p50, least = a[lo].p50, leastAge = ageAt0 + a[lo].t;
  const words = least < start - 4
    ? `The solved plan starts with about ${start}% of your money in shares, comes down to about ${least}% by ${leastAge}, when a bad run of markets would do the most damage, and ${end > least + 4 ? `climbs back to about ${end}% by ${ageAt0 + a[a.length - 1].t}` : 'holds about there'}.`
    : end > start + 4 ? `The solved plan starts with about ${start}% of your money in shares and builds to about ${end}% by ${ageAt0 + a[a.length - 1].t}.`
      : `The solved plan keeps about ${start}% to ${end}% of your money in shares.`;
  const yw = b.length ? ` Your current approach, typically: ${b[0].p50}% at the start${b.length > 1 ? `, ${b[b.length - 1].p50}% at ${ageAt0 + b[b.length - 1].t}` : ''}, as each pot keeps the risk you chose and the draws change the mix.` : '';
  const at = hv.at, yAt = at === null ? null : b.find(p => p.t === a[at].t);
  const stripRows = life ? [['eqPen', 'Pension'], ['eqIsa', 'ISA']].filter(([k]) => life.solved.some(r => r[k] !== null)) : [];
  return (
    <section data-more="invest" data-equity={JSON.stringify(eqs)} className={card(dim)}>
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">How your money is invested</h3>
        <p className="text-xs text-slate-600 mt-0.5">The share of your money held in shares, year by year. The solver chooses each pot&apos;s risk every year; your current approach keeps the risk you set.</p>
      </div>
      <div className="relative" data-no-swipe>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-pan-y" role="img" data-chart="equity" {...hv.svg}
          aria-label={`${words}${yw}`}>
          {[0, 25, 50, 75, 100].map(v => <g key={v}><line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200" /><text x={PAD.l - 6} y={y(v) + 3} textAnchor="end" className="fill-slate-500 text-[10px]">{v}%</text></g>)}
          <path d={band('p10', 'p90')} className="fill-indigo-100" />
          <path d={band('p25', 'p75')} className="fill-indigo-200" />
          {yours.length > 1 && <path d={pathOf(yours, x, y)} className="stroke-slate-500 fill-none" strokeWidth="2" strokeDasharray="6 4" />}
          <path d={pathOf(med, x, y)} className="stroke-indigo-700 fill-none" strokeWidth="2.5" />
          {at !== null && <g><line x1={x(ages[at])} x2={x(ages[at])} y1={PAD.t} y2={H - PAD.b} className="stroke-slate-400" /><circle cx={x(ages[at])} cy={y(a[at].p50)} r="4" className="fill-indigo-700 stroke-surface" strokeWidth="2" /></g>}
          <AgeAxis a0={a0} a1={a1} x={x} h={H} />
        </svg>
        <Readout W={W} at={at} x={at === null ? 0 : x(ages[at])} lines={at === null ? null : [`Age ${ages[at]}`, `Solved plan, typical: ${a[at].p50}% in shares`, `Most markets: ${a[at].p10}% to ${a[at].p90}%`, ...(yAt ? [`Current approach, typical: ${yAt.p50}%`] : [])]} />
      </div>
      <Key items={[['stroke-indigo-700', 'Solved plan, typical', '1 0'], ['bg-indigo-200', 'Half of markets'], ['bg-indigo-100', 'Most markets'], ['stroke-slate-500', 'Your current approach, typical', true]]} />
      <p className="text-xs text-slate-700" data-invest-words>{words}{yw}</p>
      {stripRows.length > 0 && (
        <div className="space-y-1" data-invest-strip>
          <div className="text-xs font-semibold text-slate-800">Each pot&apos;s risk on a typical run</div>
          <TierStrip life={life.solved} ageAt0={ageAt0} a0={a0} a1={a1} rows={stripRows} />
          <p className="text-[11px] text-slate-500">Each block is a stretch of years at one risk; a stronger colour is more in shares.</p>
          {/* the strip in words, so a block too narrow for its label still says its figure */}
          <ul className="text-xs text-slate-700 space-y-0.5" data-invest-runs>
            {stripRows.map(([k, name]) => {
              const rs = runsOf(life.solved, k);
              const said = rs.slice(0, 6).map((r, i) => (i === 0 ? `${r.v}% in shares` : `${r.v}% from ${ageAt0 + r.t0}`)).join(', then ');
              return <li key={k}><span className="font-semibold">{name}:</span> {said}{rs.length === 1 ? ' throughout' : rs.length > 6 ? `, and ${rs.length - 6} more changes after` : ''}.</li>;
            })}
          </ul>
        </div>
      )}
      <Toggle show={show} setShow={setShow} isPhone={isPhone} />
      {show && (
        <table className="w-full text-[11px] tabular-nums" data-more-table="equity"><thead><tr className="text-slate-500"><th className="text-left font-medium">Age</th><th className="text-right font-medium">Solved, most markets</th><th className="text-right font-medium">Solved, typical</th><th className="text-right font-medium">Your current approach, typical</th></tr></thead>
          <tbody>{a.map((p, i) => (i % 5 === 0 || i === a.length - 1) && <tr key={p.t} className="border-t border-slate-100"><td>{ageAt0 + p.t}</td><td className="text-right">{p.p10}% to {p.p90}%</td><td className="text-right">{p.p50}%</td><td className="text-right">{(b.find(q => q.t === p.t) || {}).p50 ?? '–'}{b.find(q => q.t === p.t) ? '%' : ''}</td></tr>)}</tbody></table>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- the retired years at each spending level, in the spending card */
const GROUPS = [
  ['floor', 'At the lowest it plans', 'bg-amber-500'],
  ['below', 'Below target', 'bg-amber-300'],
  ['at', 'At target', 'bg-indigo-500'],
  ['above', 'Above target', 'bg-emerald-600']
];
export function groupsOf(levels, floorPct) {
  const g = { floor: 0, below: 0, at: 0, above: 0 };
  let n = 0;
  for (const [k, c] of Object.entries(levels || {})) {
    const lv = Number(k);
    n += c;
    if (lv <= floorPct) g.floor += c; else if (lv < 100) g.below += c; else if (lv === 100) g.at += c; else g.above += c;
  }
  return { g, n };
}
export function LevelsBar({ s, floorShare, isPhone }) {
  const sp = s.more && s.more.spending;
  if (!sp) return null;
  const floorPct = Math.round(100 * floorShare);
  const arms = [['solved', 'Solved plan', sp.solved], ['yours', 'Your current approach', sp.yours]].map(([k, name, a]) => ({ k, name, a, ...groupsOf(a.levels, floorPct) }));
  const b = sp.solved.below;
  return (
    <div data-levels className="space-y-2 pt-1">
      <div className="text-xs font-semibold text-slate-800">Your retired years, by how much you spend</div>
      {arms.map(r => (
        <div key={r.k} className="space-y-0.5" data-levels-arm={r.k}>
          <div className="text-[11px] text-slate-600">{r.name}</div>
          <div className="flex h-3.5 rounded overflow-hidden gap-[2px]" role="img"
            aria-label={`${r.name}: ${GROUPS.map(([k, l]) => `${l.toLowerCase()} ${r.n ? pct((100 * r.g[k]) / r.n) : '0%'}`).join(', ')} of the years the money lasts`}>
            {GROUPS.map(([k, l, cls]) => (r.g[k] > 0 ? <div key={k} title={`${l}: ${pct((100 * r.g[k]) / r.n)}`} className={cls} style={{ width: `${(100 * r.g[k]) / r.n}%` }} /> : null))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
        {GROUPS.map(([k, l, cls]) => <span key={k} className="inline-flex items-center gap-1.5"><span className={`inline-block w-2.5 h-2.5 rounded-sm ${cls}`} />{k === 'floor' ? `${l} (${floorPct}%)` : l}</span>)}
      </div>
      <p className={`text-xs text-slate-700 ${isPhone ? '' : 'max-w-prose'}`} data-levels-words>
        {arms[0].n ? `The solved plan spends at its lowest in ${pct((100 * arms[0].g.floor) / arms[0].n)} of the retired years the money lasts, and above your target in ${pct((100 * arms[0].g.above) / arms[0].n)}. ` : ''}
        {b.p50 > 0 ? `On a typical run you spend below your target for ${b.p50} of your retired years (half the markets between ${b.p25} and ${b.p75}). ` : 'On most runs you never spend below your target. '}
        {arms[1].g.at / Math.max(1, arms[1].n) > 0.9 ? 'Your current approach spends your full target every year it can, and stops when the money runs out: that is why it delivers less over the plan.' : ''}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- where the money sits on the typical run */
const WRAPS = [['pen', 'Pension', 'fill-indigo-500', 'bg-indigo-500'], ['isa', 'ISA', 'fill-teal-600', 'bg-teal-600'], ['other', 'Taxable account', 'fill-amber-500', 'bg-amber-500'], ['cash', 'Cash', 'fill-sky-600', 'bg-sky-600']];
export function LifeCard({ life, ageAt0, fmt, dim, isPhone }) {
  const [arm, setArm] = useState('solved'), [show, setShow] = useState(false);
  const rows = life ? life[arm] : [];
  const ages = useMemo(() => rows.map(r => ageAt0 + r.t), [rows, ageAt0]);
  const top = life ? Math.max(1, ...['solved', 'yours'].flatMap(k => life[k].map(r => r.pen + r.isa + r.other + r.cash))) : 1;
  const { W, H } = dimsOf(isPhone), HL = isPhone ? H : 170;
  const x = lin(ages[0] || 0, ages[ages.length - 1] || 1, PAD.l + 14, W - PAD.r), y = lin(0, top * 1.05, HL - PAD.b, PAD.t);
  const hv = useHover(ages, x, W);
  if (!life || rows.length < 2) return null;
  const present = WRAPS.filter(([k]) => life.solved.some(r => r[k] > 0) || life.yours.some(r => r[k] > 0));
  // the stack, bottom up, in WRAPS' order: each layer between the running sums before and after it
  const cum = rows.map(r => { let s = 0; return present.map(([k]) => { const lo = s; s += r[k]; return [lo, s]; }); });
  const layer = j => `${rows.map((r, i) => `${i ? 'L' : 'M'}${x(ages[i]).toFixed(2)},${y(cum[i][j][1]).toFixed(2)}`).join('')}${[...rows].map((_, i) => i).reverse().map(i => `L${x(ages[i]).toFixed(2)},${y(cum[i][j][0]).toFixed(2)}`).join('')}Z`;
  const ticks = [0, top / 2, top].map(v => Math.round(v / 10000) * 10000);
  const runOut = rows.find(r => r.short), taxOf = k => life[k].reduce((s2, r) => s2 + r.tax, 0), endOf = k => { const r = life[k][life[k].length - 1]; return r.pen + r.isa + r.other + r.cash; };
  const yOut = life.yours.find(r => r.short), sOut = life.solved.find(r => r.short);
  const at = hv.at, r = at === null ? null : rows[at];
  const btn = on => `px-3 rounded-md text-xs font-semibold cursor-pointer ${isPhone ? 'min-h-11' : 'min-h-8'} ${on ? 'bg-surface text-slate-900 shadow-xs border border-slate-200' : 'text-slate-600'}`;
  return (
    <section data-more="life" data-life={JSON.stringify(life)} data-life-arm={arm} className={card(dim)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-slate-900">Where your money sits, on a typical run</h3>
          <p className="text-xs text-slate-600 mt-0.5">The same run of markets as the next ten years, to the end of the plan, pot by pot.</p>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label="Which plan">
          <button type="button" data-life-pick="solved" aria-pressed={arm === 'solved'} onClick={() => setArm('solved')} className={btn(arm === 'solved')}>Solved plan</button>
          <button type="button" data-life-pick="yours" aria-pressed={arm === 'yours'} onClick={() => setArm('yours')} className={btn(arm === 'yours')}>Your current approach</button>
        </div>
      </div>
      <div className="relative" data-no-swipe>
        <svg viewBox={`0 0 ${W} ${HL}`} className="w-full h-auto touch-pan-y" role="img" data-chart="life" {...hv.svg}
          aria-label={`${arm === 'solved' ? 'The solved plan' : 'Your current approach'} on a typical run: ${fmt(endOf(arm))} left at ${ages[ages.length - 1]}, ${fmt(taxOf(arm))} paid in tax${runOut ? `, the money running short at ${ageAt0 + runOut.t}` : ''}.`}>
          {ticks.map(v => <g key={v}><line x1={PAD.l + 14} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-slate-200" /><text x={PAD.l + 10} y={y(v) + 3} textAnchor="end" className="fill-slate-500 text-[10px]">{short(v)}</text></g>)}
          {present.map(([k, , cls], j) => <path key={k} d={layer(j)} className={`${cls} stroke-surface`} strokeWidth="1" />)}
          {runOut && <g data-life-short={ageAt0 + runOut.t}><line x1={x(ageAt0 + runOut.t)} x2={x(ageAt0 + runOut.t)} y1={PAD.t} y2={HL - PAD.b} className="stroke-rose-600" strokeDasharray="3 3" /><text x={x(ageAt0 + runOut.t) - 4} y={PAD.t + 10} textAnchor="end" className="fill-rose-700 text-[10px] font-semibold">runs short at {ageAt0 + runOut.t}</text></g>}
          {at !== null && <line x1={x(ages[at])} x2={x(ages[at])} y1={PAD.t} y2={HL - PAD.b} className="stroke-slate-900" strokeOpacity="0.5" />}
          <AgeAxis a0={ages[0]} a1={ages[ages.length - 1]} x={x} h={HL} />
        </svg>
        <Readout W={W} at={at} x={at === null ? 0 : x(ages[at])} lines={r ? [`Age ${ages[at]}`, ...present.map(([k, l]) => `${l}: ${fmt(r[k])}`), `In shares: ${r.eq === null ? '–' : `${r.eq}%`}`, `Tax that year: ${fmt(r.tax)}`] : null} />
      </div>
      <Key items={present.map(([, l, , bg]) => [bg, l])} />
      <p className="text-xs text-slate-700" data-life-words>
        On this run the solved plan pays {fmt(taxOf('solved'))} in tax and ends with {fmt(endOf('solved'))}{sOut ? `, running short at ${ageAt0 + sOut.t}` : ''}; your current approach pays {fmt(taxOf('yours'))} and {yOut ? `runs short at ${ageAt0 + yOut.t}` : `ends with ${fmt(endOf('yours'))}`}.
      </p>
      <Toggle show={show} setShow={setShow} isPhone={isPhone} />
      {show && (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] tabular-nums" data-more-table="life"><thead><tr className="text-slate-500"><th className="text-left font-medium">Age</th>{present.map(([k, l]) => <th key={k} className="text-right font-medium">{l}</th>)}<th className="text-right font-medium">In shares</th><th className="text-right font-medium">Tax</th></tr></thead>
            <tbody>{rows.map((q, i) => <tr key={q.t} className="border-t border-slate-100"><td>{ages[i]}</td>{present.map(([k]) => <td key={k} className="text-right">{fmt(q[k])}</td>)}<td className="text-right">{q.eq === null ? '–' : `${q.eq}%`}</td><td className="text-right">{fmt(q.tax)}</td></tr>)}</tbody></table>
        </div>
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- every start year in history, in Details' history check */
// one column a start year: a solid bar where the money lasted, a hollow one where it ran out (shape as well as colour), the
// solved plan's row over your current approach's; a column picks that start year for the run below
export function HistoryStrip({ solved, yours, selected, onPick, isPhone }) {
  if (!yours || !yours.length) return null;
  const n = yours.length, sOk = solved ? solved.filter(r => r.ok).length : null, yOk = yours.filter(r => r.ok).length;
  const bySolved = solved ? Object.fromEntries(solved.map(r => [r.y, r])) : {};
  const both = solved ? yours.filter(r => !r.ok && bySolved[r.y] && bySolved[r.y].ok).map(r => r.y) : [];
  const cell = (r, tone) => (r ? (r.ok ? `${tone} border border-transparent` : 'bg-transparent border-2 border-rose-600') : 'bg-slate-100 border border-transparent');
  const row = (name, list, tone, k) => (
    <div className="flex items-center gap-2" data-history-row={k}>
      <span className="w-24 shrink-0 text-[11px] text-slate-600 leading-tight">{name}</span>
      {/* a column a start year is narrower than WCAG 2.5.8's 24px on a desktop; the Start year slider beside the run picks the
          same year, the criterion's equivalent control, which the harnesses' target probe reads by this name */}
      <div className="flex-1 grid gap-[2px]" data-target-equivalent='input[aria-label="Start year"]' style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {yours.map(({ y }) => {
          const r = list ? list.find(q => q.y === y) : null;
          return <button key={y} type="button" onClick={() => onPick && onPick(y)} aria-label={`${y}: ${r ? (r.ok ? 'the money lasts' : `the money runs out in ${r.failYear}`) : 'working it out'}`}
            title={`Starting in ${y}: ${r ? (r.ok ? 'the money lasts' : `runs out in ${r.failYear}`) : 'working it out'}`}
            className={`h-6 rounded-sm cursor-pointer ${cell(r, tone)} ${selected === y ? 'ring-2 ring-offset-1 ring-slate-900' : ''}`} />;
        })}
      </div>
    </div>
  );
  /*
   * ON A PHONE, A DECADE GRID. Sixty-odd columns across a phone are hairlines two pixels wide that no finger can pick. So the
   * years go ten to a row, a row a decade, as a calendar reads: each cell is one start year, its upper half the solved plan and
   * its lower half your current approach, and a cell is a tap target of about 28 by 40 pixels.
   */
  const half = (r, tone) => (r ? (r.ok ? tone : 'bg-transparent border-2 border-rose-600') : 'bg-slate-100');
  const grid = isPhone && (
    <div className="space-y-1" data-history-grid role="group" aria-label="Every start year, a row a decade">
      <div className="grid gap-[3px] text-[10px] text-slate-500 tabular-nums" style={{ gridTemplateColumns: '2.6rem repeat(10, minmax(0, 1fr))' }}>
        <span />{Array.from({ length: 10 }, (_, d) => <span key={d} className="text-center">{d}</span>)}
      </div>
      {[...new Set(yours.map(r => Math.floor(r.y / 10) * 10))].map(dec => (
        <div key={dec} className="grid gap-[3px] items-stretch" style={{ gridTemplateColumns: '2.6rem repeat(10, minmax(0, 1fr))' }}>
          <span className="text-[11px] text-slate-600 tabular-nums self-center">{dec}s</span>
          {Array.from({ length: 10 }, (_, d) => {
            const y = dec + d, yr = yours.find(r => r.y === y);
            if (!yr) return <span key={d} />;
            const sr = solved ? bySolved[y] : null;
            return (
              <button key={d} type="button" onClick={() => onPick && onPick(y)} data-history-cell={y}
                aria-label={`${y}: solved plan ${sr ? (sr.ok ? 'lasts' : `runs out in ${sr.failYear}`) : 'working it out'}; your current approach ${yr.ok ? 'lasts' : `runs out in ${yr.failYear}`}`}
                className={`h-10 rounded-sm flex flex-col gap-[2px] p-[1px] cursor-pointer ${selected === y ? 'ring-2 ring-slate-900' : ''}`}>
                <span className={`flex-1 rounded-[2px] ${half(sr, 'bg-emerald-600')}`} />
                <span className={`flex-1 rounded-[2px] ${half(yr, 'bg-slate-400')}`} />
              </button>
            );
          })}
        </div>
      ))}
      <p className="text-[11px] text-slate-500">In each cell the upper half is the solved plan and the lower half your current approach.</p>
    </div>
  );
  return (
    <div data-history-strip={solved ? 'in' : 'pending'} className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Every start year in history</h3>
        <p className="text-xs text-slate-600 mt-0.5">Your plan run through the real markets from each year since {yours[0].y}. {isPhone ? 'Tap' : 'Click'} a year to see its run below.</p>
      </div>
      {isPhone ? grid : (<>
        {row('Solved plan', solved, 'bg-emerald-600', 'solved')}
        {row('Your current approach', yours, 'bg-slate-400', 'yours')}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 tabular-nums"><span className="w-24 shrink-0" /><span className="flex-1 flex justify-between"><span>{yours[0].y}</span><span>{yours[Math.floor(n / 2)].y}</span><span>{yours[n - 1].y}</span></span></div>
      </>)}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-600" />The money lasts (solved plan)</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-400" />The money lasts (your current approach)</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm border-2 border-rose-600" />It runs out</span>
      </div>
      <p className="text-sm text-slate-800" data-history-count>
        {solved ? <>The solved plan lasts from <strong>{sOk} of {n}</strong> start years; your current approach from <strong>{yOk} of {n}</strong>.{both.length ? ` The solved plan gets through ${both.length === 1 ? `${both[0]}` : `${both.length} start years`} where your current approach runs out.` : ''}</>
          : <>Your current approach lasts from <strong>{yOk} of {n}</strong> start years. Working out the solved plan&apos;s…</>}
      </p>
    </div>
  );
}
