/*
 * "Copy the details for a bug report" (Phase 12 item 4; src/solverDiagnostic.js): in the new planner's failure card and in
 * Details' solver settings. The text is built when asked, from the whitelist only, copied where the browser allows, and shown
 * so it can be read and selected by hand. A lazy chunk's component, so the page's first load carries none of it.
 */
import { useState } from 'react';
import { diagnosticText } from './solverDiagnostic.js';

export function DiagnosticCopy({ solve, plan, points, paths, isPhone, tone = 'slate' }) {
  const [text, setText] = useState(null);
  const copy = () => {
    const t = diagnosticText({ solve, plan, points, paths, ua: typeof navigator !== 'undefined' ? navigator.userAgent : '', isolated: typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated });
    setText(t);
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).catch(() => {}); } catch (e) { /* shown below to copy by hand */ }
  };
  const btn = tone === 'amber' ? 'bg-surface border-amber-300 text-amber-900' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700';
  return (
    <div data-diagnostic-box className="space-y-2">
      <button type="button" data-diagnostic-copy onClick={copy} className={`px-3 rounded-lg border text-xs font-semibold cursor-pointer ${btn} ${isPhone ? 'min-h-11' : 'min-h-9'}`}>Copy the details for a bug report</button>
      {text && (<>
        <p className="text-[11px] text-slate-500">Copied, to paste into your report. It holds no amounts: no balances, no spending, no figures from your plan.</p>
        <pre data-diagnostic className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] leading-snug text-slate-700 whitespace-pre-wrap break-words select-all">{text}</pre>
      </>)}
    </div>
  );
}
