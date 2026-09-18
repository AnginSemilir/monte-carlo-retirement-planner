/*
 * WHAT BOTH PLANNERS DRAW THE SAME WAY.
 *
 * The full planner and the simple one are two pages over one engine, and a handful of presentational
 * decisions have to agree between them or the site contradicts itself: what an input field looks like,
 * what a risk tier is called, how a tier's label splits into its name and its equity range. Each of
 * these was written twice, and twice this week one copy moved and the other did not - grey fields under
 * the sepia theme on one page, tiers without their equity range on the other. They live here now, with
 * no imports, so either page (and the workers, which bundle App.jsx) can take them without a cycle.
 *
 * Money formatting is not here on purpose: it has to follow the number-format setting, which lives with
 * the engine's fmtNum in App.jsx. The simple page imports formatGBP from there.
 */

/* The field. Surface-coloured so it reads as part of the card under every theme, not a grey well. */
export const fieldCls = 'w-full p-2 bg-surface border border-slate-300 rounded-lg tabular-nums text-slate-900 font-semibold focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:border-blue-600 focus:outline-none';
export const smallFieldCls = 'w-full p-2 bg-surface border border-slate-300 rounded tabular-nums font-semibold text-slate-900 focus:ring-2 focus:ring-inset focus:ring-blue-600 focus:border-blue-600 focus:outline-none';

/* The six tiers, as a phone chip has room to say them. */
export const RISK_SHORT = {
  'High Risk': 'High', 'Medium/High Risk': 'Med-hi', 'Medium Risk': 'Med',
  'Medium/Low Risk': 'Med-lo', 'Low Risk': 'Low', 'Cash Equivalents': 'Cash'
};

/*
 * A tier's label in the risk matrix reads "High Risk: 80–100% Equities". Both pages want it in parts:
 * the name before the colon, and the equity range somebody can hold a fund factsheet up to. The range
 * is the part that matters - "Medium" says only which tier is riskier than which - so a tier whose label
 * carries no percentage gets a plain-words fallback rather than nothing.
 */
export function parseTierLabel(label, key = '') {
  const lab = String(label || key || '');
  const [name, rest = ''] = lab.split(/:\s*/);
  const m = lab.match(/([\d]+\s*[–-]\s*[\d]+%|[\d]+%)\s*Equities/i);
  const range = m ? m[1].replace(/\s+/g, '') : (key === 'Low Risk' ? 'bonds & cash' : key === 'Cash Equivalents' ? 'cash' : '');
  return { name, rest, range, long: lab };
}
