/*
 * THE SOLVED PLAN'S SHEET (step U, research/reviews/2026-11-03/LAYOUT.md section 3.1): Your plan taken away, with the action
 * plan's print stylesheet: the answer and the explanation, this year's steps with their costs, the next ten years, the rule of
 * thumb where it is shown, the comparison, and the levers' positions, the date and the code version. A chunk of its own, with
 * its words (src/solverWords.js), loaded when the visitor prints, so the page's first load carries neither.
 *   solvedSheetHtml(figures, { fmt, levers, rulesLine, code })   figures: Your plan's ({ strategy, more }), as App.jsx keeps them
 */
import { STYLE, esc } from './actionPlan.js';
import * as W from './solverWords.js';

export function solvedSheetHtml(figures, { fmt, levers, rulesLine, code }) {
  const st = figures.strategy, m = figures.more || {}, h = st.headline, wctx = { target: h.target, fmt }, c = st.compare;
  // a couple's plan (Part D, D5.4): the household's words, each person's moves under their name, the year's split
  const two = !!(m.actions && m.actions.couple) || !!(m.ahead && m.ahead.couple), split = m.actions && m.actions.couple ? W.coupleSplitWords(m.actions.move.parts.split) : null;
  return buildSolvedPlanHtml({
    answer: W.headlineWords(h, fmt, two), explanation: W.explanationWords(h), trials: st.trials.toLocaleString('en-GB'), levers, code,
    thisYearTitle: h.retired ? 'This year' : 'This year, before you retire',
    actions: m.actions ? [...m.actions.actions.map(x => (m.actions.couple ? W.coupleActionWords(x, wctx) : W.actionWords(x, wctx))), ...(split ? [{ what: `${split}.`, cost: 'How the year\'s spending is shared between your money and your partner\'s.' }] : []), ...(W.sweepWords(m.actions.sweep, wctx) ? [{ what: W.sweepWords(m.actions.sweep, wctx), cost: 'As the plan keeps cash at its buffer.' }] : [])] : [],
    rule: m.distil && m.distil.show ? W.ruleWords(m.distil, wctx) : null,
    ahead: m.ahead ? (m.ahead.couple ? W.coupleAheadRowsWords(m.ahead.rows, wctx) : W.aheadRowsWords(m.ahead.rows, wctx)) : [], comeBack: W.COME_BACK,
    compare: {
      title: `The solved plan against your current approach, on the same ${st.trials.toLocaleString('en-GB')} markets`, line: rulesLine,
      rows: [['Chance the money lasts', `${c.yours.survival.toFixed(1)}%`, `${c.solved.survival.toFixed(1)}%`], ['Pot left at the end, typical', fmt(c.yours.medianPot), fmt(c.solved.medianPot)],
        ['Pot left at the end, unlucky tenth', fmt(c.yours.p10Pot), fmt(c.solved.p10Pot)], ['Tax over your lifetime, typical', fmt(c.yours.lifetimeTax), fmt(c.solved.lifetimeTax)],
        ['Estate after the pension\'s death tax, typical', fmt(c.yours.estate), fmt(c.solved.estate)]]
    }
  });
}

export function buildSolvedPlanHtml(d) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const a = d.answer;
  const rows = (cells, cls = '') => `<tr>${cells.map((c, i) => `<td${i && cls ? ` class="${cls}"` : ''}>${esc(c)}</td>`).join('')}</tr>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(a.title)}</title>
<style>${STYLE}</style></head>
<body>
<div class="noprint">
  <button class="ghost" onclick="window.close()">Close</button>
  <button onclick="window.print()">Print or save as PDF</button>
</div>
<div class="wrap" data-solved-sheet>
  <header>
    <h1>${esc(a.title)}: ${esc(a.amount)}</h1>
    <div class="meta">${esc(today)} · ${esc(d.code)} · ${esc(d.levers)}</div>
  </header>
  <p class="lead">${esc([a.share, a.back].filter(Boolean).join(' '))}</p>
  <p>${esc(a.chance)}. ${esc(a.delivered)}. On ${esc(d.trials)} simulated markets.</p>
  ${d.explanation ? `<h2>${esc(d.explanation.title || 'Why')}</h2>${d.explanation.paras.map(t => `<p>${esc(t)}</p>`).join('')}` : ''}
  <h2>${esc(d.thisYearTitle)}</h2>
  ${d.actions.length ? `<ol class="steps">${d.actions.map(x => `<li><h3>${esc(x.what)}</h3><p class="meta">${esc(x.cost)}</p></li>`).join('')}</ol>` : '<p class="none">Nothing to change this year: keep to your plan as it stands.</p>'}
  ${d.rule ? `<h2>${esc(d.rule.title)}</h2>${d.rule.lines.map(l => `<p>${esc(l)}</p>`).join('')}<p class="meta">${esc(d.rule.note)}</p>` : ''}
  <h2>The next ten years on a typical run of the markets</h2>
  <table><thead><tr><th>Year (age)</th><th>Spending (level)</th><th>The year's move</th></tr></thead>
  <tbody>${d.ahead.map(g => `<tr><td>${esc(g.when)}</td><td class="n">${esc(g.spend)}</td><td>${g.lines.map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table>
  <p class="meta">${esc(d.comeBack)}</p>
  <h2>${esc(d.compare.title)}</h2>
  <table><thead><tr><th></th><th class="n">Your current approach</th><th class="n">Solved</th></tr></thead>
  <tbody>${d.compare.rows.map(r => rows(r, 'n')).join('')}</tbody></table>
  <p class="meta">${esc(d.compare.line)}</p>
  <footer>Educational and illustrative only. This is not financial advice. The figures are the app's simulation of the plan as worked out on ${esc(today)}; come back next year, when the plan is worked out again from where your money then stands.</footer>
</div>
</body></html>`;
}
