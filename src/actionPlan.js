/*
 * "GIVE ME STEPS TO DO THIS" - THE TOURNAMENT'S ANSWER AS SOMETHING YOU CAN ACT ON.
 *
 * The tournament ends with a winner and a card of figures, and then the trail goes cold: the two things
 * it offered were "apply to sandbox", which draws a line on a chart, and "apply to Plan Inputs", which
 * edits the model. Neither tells you what to actually DO on a Monday morning - which standing order to
 * change, from what to what, and what to do with the money once you are drawing it.
 *
 * So this builds a document. It is deliberately a printable page rather than a screen: the point of it
 * is to be taken away from the app - printed, saved as a PDF from the browser's own print dialogue, sent
 * to whoever helps you with this - and a page that exists only inside a tab is not that.
 *
 * WHY NOT A PDF LIBRARY. Generating a PDF in the browser means shipping one (jsPDF and pdfmake are both
 * several hundred kilobytes), re-implementing the layout in its drawing API, and losing the ability to
 * re-flow for paper sizes. The browser already has a typesetter and a PDF writer. A print stylesheet
 * uses both, costs nothing in the bundle, and gives the reader the choice of paper or file.
 *
 * It takes its formatters as arguments rather than importing them: the money formatter lives in App.jsx
 * beside the engine, App.jsx is what imports this, and a module that imported back would be a cycle.
 */

// the print stylesheet, shared by the tournament's sheet and the solved plan's (step U)
const STYLE = `  :root { --ink: #16202b; --soft: #5b6878; --rule: #d8dee6; --tint: #f4f6f9; --good: #10603f; --bad: #9c2b3a; --accent: #1f4ea8; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 32px 36px 48px; font: 11.5pt/1.55 "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif; color: var(--ink); background: #fff; }
  .wrap { max-width: 760px; margin: 0 auto; }
  header { border-bottom: 2.5px solid var(--ink); padding-bottom: 14px; margin-bottom: 26px; }
  h1 { margin: 0 0 4px; font-size: 22pt; line-height: 1.15; letter-spacing: -0.01em; }
  .meta { font-size: 9pt; color: var(--soft); font-family: ui-sans-serif, system-ui, sans-serif; }
  h2 { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 11pt; letter-spacing: 0.06em; text-transform: uppercase;
       color: var(--accent); margin: 30px 0 10px; padding-bottom: 5px; border-bottom: 1px solid var(--rule); }
  p { margin: 0 0 10px; }
  .lead { font-size: 12.5pt; }
  .none { color: var(--soft); font-style: italic; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; font-size: 10.5pt; }
  th { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.05em;
       color: var(--soft); text-align: left; padding: 0 8px 6px; border-bottom: 1px solid var(--rule); font-weight: 600; }
  td { padding: 9px 8px; border-bottom: 1px solid var(--rule); vertical-align: top; }
  tbody tr:nth-child(odd) td { background: var(--tint); }
  .n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .sub { display: block; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 8.5pt; color: var(--soft); font-weight: 400; }
  td.up { color: var(--good); font-weight: 700; } td.down { color: var(--bad); font-weight: 700; }
  ol.steps { margin: 0; padding: 0; list-style: none; counter-reset: s; }
  ol.steps > li { counter-increment: s; position: relative; padding: 0 0 14px 40px; margin: 0; break-inside: avoid; }
  ol.steps > li::before { content: counter(s); position: absolute; left: 0; top: 1px; width: 26px; height: 26px; border-radius: 50%;
      background: var(--ink); color: #fff; font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10pt; font-weight: 700;
      display: flex; align-items: center; justify-content: center; }
  ol.steps h3 { margin: 3px 0 4px; font-size: 12pt; }
  ol.steps p { margin: 0 0 4px; }
  table.funding { width: auto; min-width: 58%; margin: 6px 0 10px; }
  table.funding td { border-bottom: 1px solid var(--rule); padding: 5px 10px 5px 0; }
  table.funding td.tot { border-bottom: none; border-top: 1.5px solid var(--ink); }
  h3.fund-h { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 10pt; letter-spacing: .06em;
      text-transform: uppercase; color: var(--soft); margin: 18px 0 2px; }
  p.fund { color: var(--soft); font-size: 10.5pt; margin: 0 0 6px; }
  .policy { break-inside: avoid; margin-bottom: 14px; padding-left: 14px; border-left: 3px solid var(--rule); }
  .policy h3 { margin: 0 0 3px; font-size: 11.5pt; }
  .policy .detail { color: var(--soft); font-size: 10pt; }
  footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid var(--rule); font-size: 9pt; color: var(--soft);
           font-family: ui-sans-serif, system-ui, sans-serif; }
  .noprint { position: fixed; top: 14px; right: 14px; display: flex; gap: 8px; }
  .noprint button { font: 600 13px ui-sans-serif, system-ui, sans-serif; padding: 9px 16px; border-radius: 8px; cursor: pointer;
      border: 1px solid var(--ink); background: var(--ink); color: #fff; }
  .noprint button.ghost { background: #fff; color: var(--ink); }
  @media print { .noprint { display: none; } body { padding: 0; } h2 { break-after: avoid; } table { break-inside: auto; } tr { break-inside: avoid; } }
  @page { margin: 16mm; }
`;

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');







/*
 * Open it. A new tab rather than an overlay, because the reader is meant to print it or keep it, and
 * because the print dialogue takes the whole document - an overlay would have to hide the app around it
 * with a print stylesheet and would still carry the app's own fonts and colours into the page.
 *
 * Returns false when the browser refused the window, so the caller can say so rather than looking broken.
 */
export function openActionPlan(html) {
  /*
   * No `noopener` in the feature list, deliberately. It sounds like the safe default and it is exactly
   * wrong here: a window opened with noopener hands back null by specification, so there is no handle to
   * write the document into and the reader gets a blank tab. noopener exists to stop a page you navigate
   * to from reaching back into yours - this page is one we generate ourselves, from our own strings, and
   * the whole point is that we write it.
   */
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

// the stylesheet and the escape, for the solved plan's sheet (src/solvedSheet.js, a chunk of its own, built on Print)
export { STYLE, esc };
