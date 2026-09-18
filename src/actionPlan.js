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

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// What a row of the comparison says when the measure did not move. Module scope: the table that paints
// the cells reads it as well, to know not to colour a row that reports no difference at all.
const NONE = 'no change';

const WRAPPER_NAMES = { pen: 'Pension', isa: 'S&S ISA', other: 'General investment account', cash: 'Cash savings' };
const wrapperName = (id) => WRAPPER_NAMES[String(id).split('_')[0]] || id;
const ownerOf = (id) => (String(id).split('_')[1] === 'part' ? 'Partner' : 'You');

/*
 * The practical instructions. Each contribution that moves becomes one sentence naming the wrapper, the
 * direction and the amount, because that is the unit somebody acts on: a standing order, a salary
 * sacrifice election, a monthly ISA payment. The monthly figure is given beside the yearly one since
 * that is what the instruction will actually be set to.
 */
function movesFrom(diff, { isCouple, formatGBP }) {
  const rows = [];
  for (const d of diff.contribDeltas) {
    const who = isCouple ? `${ownerOf(d.id)}: ` : '';
    rows.push({
      what: `${who}${wrapperName(d.id)}`,
      now: formatGBP(Math.round(d.from)),
      then: formatGBP(Math.round(d.to)),
      change: `${d.delta > 0 ? '+' : '−'}${formatGBP(Math.abs(Math.round(d.delta)))}`,
      monthly: `${d.delta > 0 ? '+' : '−'}${formatGBP(Math.abs(Math.round(d.delta / 12)))} a month`,
      up: d.delta > 0
    });
  }
  return rows.sort((a, b) => Number(a.up) - Number(b.up));   // what stops first, then what starts
}

function stepsFrom(moves, res, { formatGBP }) {
  const steps = [];
  const stopping = moves.filter(m => !m.up), starting = moves.filter(m => m.up);
  if (stopping.length) {
    steps.push({
      head: 'Reduce what you are paying in here',
      body: stopping.map(m => `${m.what}: change the standing order or payroll election from ${m.now} a year to ${m.then} a year (${m.monthly}).`)
    });
  }
  if (starting.length) {
    steps.push({
      head: 'Put the same money in here instead',
      body: starting.map(m => `${m.what}: change the standing order from ${m.now} a year to ${m.then} a year (${m.monthly}).`)
    });
  }
  if (res.transferNet > 0) {
    steps.push({
      head: 'Move money that is already invested',
      body: [
        `Sell ${formatGBP(Math.round(res.transferNet))} from your general investment account and pay it into the pension.`,
        res.transferGross > res.transferNet
          ? `With tax relief that lands as about ${formatGBP(Math.round(res.transferGross))} inside the pension.`
          : null,
        'Selling realises any gain, so check it against your capital gains allowance for the year before you do it, and consider splitting it across two tax years if it is close.'
      ].filter(Boolean)
    });
  }
  if (res.phase && res.phase.switchYears > 0) {
    steps.push({
      head: 'Then switch again later',
      body: [`This strategy is in two phases: the split above holds for about ${res.phase.switchYears} year${res.phase.switchYears === 1 ? '' : 's'}, and then changes. Come back and re-run the comparison when you get there rather than setting it and forgetting it.`]
    });
  }
  steps.push({
    head: 'Check it landed',
    body: [
      'A month after the change, check the payments actually left your account for the new amounts.',
      'Salary sacrifice and workplace pension changes usually take one payroll cycle, and some employers only accept them at fixed points in the year.'
    ]
  });
  return steps;
}

/* The figures, side by side. Only what changes is worth a row, so a measure that moves by nothing is dropped. */
function comparisonRows(baseStats, newStats, { terminalAge, formatGBP, fmtNum }) {
  if (!baseStats || !newStats) return [];
  const money = (v) => (v === null || v === undefined ? '—' : formatGBP(Math.round(v)));
  /*
   * A difference of nothing says so. Signing every delta put a minus sign in front of a zero wherever a
   * measure did not move - most visibly on the unlucky pot, which is nil under both plans on a household
   * whose worst tenth runs dry either way - and that reads as a loss rather than as the absence of one.
   */
  const sign = (d) => (d > 0 ? '+' : '−');
  const pts = (d) => (Math.abs(d) < 0.05 ? NONE : sign(d) + Math.abs(d).toFixed(1) + ' pts');
  const cash = (d) => (Math.abs(d) < 1 ? NONE : sign(d) + formatGBP(Math.abs(Math.round(d))));
  const rows = [
    { what: 'Survival rate', now: `${baseStats.successRate.toFixed(1)}%`, then: `${newStats.successRate.toFixed(1)}%`,
      delta: newStats.successRate - baseStats.successRate, fmt: pts,
      note: `share of ${fmtNum(newStats.trials)} simulated futures the plan lasts` },
    { what: `Median pot at ${terminalAge}`, now: money(baseStats.medianTerminal), then: money(newStats.medianTerminal),
      delta: newStats.medianTerminal - baseStats.medianTerminal, fmt: cash,
      note: 'the middle outcome, in today’s money' },
    { what: `Unlucky pot at ${terminalAge}`, now: money(baseStats.p10Terminal), then: money(newStats.p10Terminal),
      delta: newStats.p10Terminal - baseStats.p10Terminal, fmt: cash,
      note: '10th percentile: only one run in ten leaves less' },
    { what: 'Bridge failures', now: `${baseStats.preNmpaFailRate.toFixed(1)}%`, then: `${newStats.preNmpaFailRate.toFixed(1)}%`,
      delta: newStats.preNmpaFailRate - baseStats.preNmpaFailRate, fmt: pts,
      note: 'runs that fall short before the pension unlocks', lowerIsBetter: true }
  ];
  if (baseStats.medianFailAge || newStats.medianFailAge) {
    rows.push({ what: 'Median failure age', now: baseStats.medianFailAge ? `Age ${baseStats.medianFailAge}` : 'None',
      then: newStats.medianFailAge ? `Age ${newStats.medianFailAge}` : 'None', delta: 0, fmt: () => '',
      note: 'when the money runs out in the runs where it does' });
  }
  return rows;
}

export function buildActionPlanHtml(data, { formatGBP, fmtNum }) {
  const { res, baseline, plan, ctx, diff, playbook, isCouple, seed, trials, summary } = data;
  const terminalAge = ctx?.terminalAge ?? plan?.demographics?.terminalAge ?? 95;
  const moves = movesFrom(diff, { isCouple, formatGBP });
  const steps = stepsFrom(moves, res, { formatGBP });
  const rows = comparisonRows(baseline?.stats, res?.stats, { terminalAge, formatGBP, fmtNum });
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const title = `How to move to ${res.name || res.label || 'this strategy'}`;

  const moveTable = moves.length ? `
    <table>
      <thead><tr><th>What</th><th class="n">Paying in now</th><th class="n">Pay in instead</th><th class="n">Change</th></tr></thead>
      <tbody>${moves.map(m => `
        <tr>
          <td><strong>${esc(m.what)}</strong></td>
          <td class="n">${esc(m.now)}</td>
          <td class="n">${esc(m.then)}</td>
          <td class="n ${m.up ? 'up' : 'down'}">${esc(m.change)}<span class="sub">${esc(m.monthly)}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>` : `<p class="none">This strategy pays in the same amounts you already do. What changes is further down: how the money is drawn once you retire.</p>`;

  const compareTable = rows.length ? `
    <table>
      <thead><tr><th>Measure</th><th class="n">Your plan now</th><th class="n">After the change</th><th class="n">Difference</th></tr></thead>
      <tbody>${rows.map(r => {
        const moved = r.fmt(r.delta) !== NONE && r.fmt(r.delta) !== '';
        const good = !moved ? '' : (r.lowerIsBetter ? (r.delta < 0 ? 'up' : 'down') : (r.delta > 0 ? 'up' : 'down'));
        return `<tr>
          <td><strong>${esc(r.what)}</strong><span class="sub">${esc(r.note)}</span></td>
          <td class="n">${esc(r.now)}</td>
          <td class="n">${esc(r.then)}</td>
          <td class="n ${good}">${esc(r.fmt(r.delta))}</td>
        </tr>`;
      }).join('')}
      </tbody>
    </table>` : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  :root { --ink: #16202b; --soft: #5b6878; --rule: #d8dee6; --tint: #f4f6f9; --good: #10603f; --bad: #9c2b3a; --accent: #1f4ea8; }
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
</style></head>
<body>
<div class="noprint">
  <button class="ghost" onclick="window.close()">Close</button>
  <button onclick="window.print()">Print or save as PDF</button>
</div>
<div class="wrap">
  <header>
    <h1>${esc(title)}</h1>
    <div class="meta">Prepared ${esc(today)} &middot; ${esc(fmtNum(trials))} simulated futures per strategy &middot; every figure in today’s money</div>
  </header>

  <p class="lead">${esc(res.description || '')}</p>
  ${summary && summary.length ? summary.map(s => `<p>${esc(s)}</p>`).join('') : ''}

  <h2>What to change</h2>
  ${moveTable}

  <h2>How to do it</h2>
  <ol class="steps">
    ${steps.map(s => `<li><h3>${esc(s.head)}</h3>${s.body.map(b => `<p>${esc(b)}</p>`).join('')}</li>`).join('')}
  </ol>

  ${playbook && playbook.length ? `<h2>Then, once you are drawing on it</h2>
  ${playbook.map(p => `<div class="policy"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p>${p.detail ? `<p class="detail">${esc(p.detail)}</p>` : ''}</div>`).join('')}` : ''}

  ${compareTable ? `<h2>What it is projected to change</h2>${compareTable}
  <p class="meta">Both columns were run on the same ${esc(fmtNum(trials))} market paths (seed ${esc(String(seed))}), so the difference between them is the strategy rather than luck. A gap of under about a percentage point in the survival rate is inside the sampling error of a run this size.</p>` : ''}

  <footer>
    This sheet was generated from the figures you entered. It is a projection, not advice, and it assumes
    the contributions above are actually made every year. Tax rules, allowances and your own circumstances
    change; re-run the comparison when they do.
  </footer>
</div>
</body></html>`;
}

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
