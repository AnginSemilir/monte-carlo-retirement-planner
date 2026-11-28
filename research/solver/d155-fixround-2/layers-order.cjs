// EXPLORATORY probe (D155, the answers to the reviewer's third look; run: node research/solver/d155-fixround-2/layers-order.cjs):
// the browser's own painting order in each card of restyle-regression's planted layers (read from its source), at a point in the
// card away from its text: document.elementsFromPoint, topmost first. A layer listed above the card paints over the card's own
// background; one below it is hidden by that background where the background is opaque
const { chromium } = require('/tmp/node_modules/playwright');
const { join } = require('node:path');
const { readFileSync } = require('node:fs');
const src = readFileSync(join(__dirname, '../../ui-harnesses/restyle-regression-ui.cjs'), 'utf8');
const LAYERS = /const LAYERS = `([\s\S]*?)`;/.exec(src)[1];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 400, height: 900 } });
  await p.setContent(LAYERS);
  const out = await p.evaluate(() => [...document.querySelectorAll('.card')].map(c => {
    const r = c.getBoundingClientRect(), t = c.querySelector('.t'), name = t ? t.textContent : '?';
    const tr = t.getBoundingClientRect(), onTop = document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2);
    const at = document.elementsFromPoint(r.right - 20, r.top + r.height / 2).slice(0, 3).map(e => e.className || e.tagName.toLowerCase());
    return `${name}: at the text's centre ${onTop === t ? 'the text' : `the ${onTop.className || onTop.tagName.toLowerCase()}`} on top; beside it ${at.join(' over ')}`;
  }));
  console.log(out.join('\n'));
  await b.close();
})();
