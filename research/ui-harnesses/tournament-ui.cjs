// The tournament's final scoring now runs as one batch across the worker pool: does it still finish, rank, and time reasonably?
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5173';
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:60,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:11976,terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:250000,contrib:1000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:80000,contrib:500,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:20000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:30000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1400, height: 1300 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ status:200, contentType:'application/javascript', body:'window.tailwind={config:{}};' }));
  await p.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(800);
  await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/^Strategy|Strategy$/.test(b.textContent.trim())||/Strategy/.test(b.textContent)); if(x) x.click(); });
  await p.waitForTimeout(600);
  const btn = await p.evaluate(() => { const x=[...document.querySelectorAll('button')].find(b=>/Compare strategies now/.test(b.textContent)); return x ? x.textContent.trim() : null; });
  console.log('run button:', btn);
  if (!btn) { console.log('buttons:', await p.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean).slice(0,60).join(' | '))); await b.close(); return; }
  const t0 = Date.now();
  await p.evaluate((label) => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===label); x.click(); }, btn);
  // done when the progress labels are gone and the search summary has rendered
  await p.waitForFunction(() => { const t = document.body.innerText; return /best survival at/.test(t) && !/Player \d+\/\d+|Scoring \d+ players|Scored \d+ of \d+ players/.test(t); }, null, { timeout: 300000 });
  await p.waitForTimeout(500);
  const t = await p.evaluate(() => document.body.innerText);
  const pct = t.match(/\d+\.\d%/g) || [];
  console.log(`tournament wall clock: ${((Date.now()-t0)/1000).toFixed(1)}s; survival figures on page: ${pct.length}; errors: ${errs.length} ${errs.join(' | ')}`);
  console.log('snippet:', (t.match(/[^\n]*(won|winner|Winner|best)[^\n]*/) || [''])[0].slice(0, 200));

  /*
   * "GIVE ME STEPS TO DO THIS" - the sheet the tournament's answer turns into.
   *
   * It replaced "Apply to sandbox", which drew the strategy as a line on a chart two tabs away. The
   * sheet opens in its own tab so the browser's print dialogue - and its Save as PDF - has the whole
   * document. Everything below is checked on the real document in the real second tab, because the two
   * ways this can break are both invisible from the first one: window.open handing back null (which it
   * does when asked for `noopener`, leaving a blank tab), and a reference error while building the
   * markup, which leaves the button doing nothing at all.
   */
  let fails = 0;
  const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
  const stepsBtn = p.locator('[data-action-plan]').first();
  ok('every strategy offers steps to follow', await p.locator('[data-action-plan]').count() > 0,
     `${await p.locator('[data-action-plan]').count()} buttons`);
  ok('...named as an instruction, not as a place to put it',
     /give me steps/i.test((await stepsBtn.textContent()) || ''), (await stepsBtn.textContent() || '').trim());
  await stepsBtn.scrollIntoViewIfNeeded();
  const popupP = p.waitForEvent('popup', { timeout: 20000 }).catch(() => null);
  await stepsBtn.click();
  const sheet = await popupP;
  ok('pressing it opens the sheet in its own tab', !!sheet);
  if (sheet) {
    await sheet.waitForLoadState('domcontentloaded');
    await sheet.waitForTimeout(500);
    const doc = await sheet.evaluate(() => {
      const tables = [...document.querySelectorAll('table')];
      const cells = (tbl) => [...tbl.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
      return {
        chars: document.body.innerText.length,
        h1: (document.querySelector('h1') || {}).textContent || '',
        sections: [...document.querySelectorAll('h2')].map(h => h.textContent.trim()),
        tables: tables.length,
        // by class, not by position: the funding note puts a third table between these two
        moveRows: document.querySelector('table.moves') ? cells(document.querySelector('table.moves')).length : 0,
        compareRows: document.querySelector('table.compare') ? cells(document.querySelector('table.compare')).length : 0,
        /*
         * The funding note exists to answer "where is the extra coming from - my ISA balance?". It is
         * only there when money both stops and starts, so this reads it when it is there and checks the
         * arithmetic it claims: what you stop, plus the residual, is what goes in.
         */
        funding: document.querySelector('table.funding')
          ? cells(document.querySelector('table.funding')).map(r => r.map(c => c.replace(/[^0-9.\u2212-]/g, '')))
          : null,
        hasFunding: !!document.querySelector('[data-funding]'),
        saysUntouched: /taken out of the money you have already invested|same money, pointed somewhere else/.test(document.body.innerText),
        // the mismatch has to be called expected where the sheet prints two figures that differ
        saysExpected: /This is expected|Expect the two figures to differ/.test(document.body.innerText),
        /*
         * The breakdown on the rising pension row: "£X of this is the money that stops going in above,
         * and about £Y is tax relief added on top". Read back as numbers so the arithmetic is checked
         * against the row's own change figure rather than merely being present.
         */
        splitNote: (() => {
          const tbl = document.querySelector('table.moves');
          if (!tbl) return null;
          for (const tr of tbl.querySelectorAll('tbody tr')) {
            const sub = tr.querySelector('td:first-child .sub');
            if (!sub) continue;
            // a leading digit is required: [\d,]+ alone matches the comma in ", and about" as its own number
            const nums = (sub.textContent.match(/\d[\d,]*(?:\.\d+)?/g) || []).map(x => Number(x.replace(/,/g, '')));
            // the change cell carries the monthly figure in its own .sub, which must not join the number
            const cell = tr.querySelector('td:last-child').cloneNode(true);
            cell.querySelectorAll('.sub').forEach(x => x.remove());
            const change = Number(cell.textContent.replace(/[^\d.]/g, ''));
            return { text: sub.textContent.trim(), nums, change };
          }
          return null;
        })(),
        /*
         * The one-off move sells from the ISA - that is the wrapper bedAndSipp is capped by and moves
         * from. It used to say "general investment account", which would have had somebody sell the
         * wrong holding and expect a CGT bill an ISA cannot produce, so the wrong name is asserted out.
         */
        oneOff: [...document.querySelectorAll('ol.steps > li')]
          .filter(li => /Move money that is already invested/.test(li.querySelector('h3')?.textContent || ''))
          .map(li => li.innerText)[0] || null,
        steps: document.querySelectorAll('ol.steps > li').length,
        policy: document.querySelectorAll('.policy').length,
        junk: (document.body.innerText.match(/undefined|NaN|\[object|\u2212£0\b/g) || []),
        printable: !!document.querySelector('style') && /@media print/.test([...document.querySelectorAll('style')].map(x => x.textContent).join(''))
      };
    });
    ok('...carrying a real document, not a blank tab', doc.chars > 1500, `${doc.chars} characters`);
    ok('...titled for the strategy it describes', /^How to move to .+/.test(doc.h1), doc.h1);
    ok('...with a table of what to pay in instead', doc.moveRows > 0, `${doc.moveRows} rows`);
    if (doc.funding) {
      const n = (x) => Number(String(x).replace(/\u2212/, '-')) || 0;
      const [stop, gap, total] = doc.funding.map(r => n(r[1]));
      ok('...adding up where the extra money comes from', Math.abs(stop + gap - total) <= 2, `${stop} + ${gap} = ${total}`);
    }
    if (doc.hasFunding) ok('...and saying the balances are not raided for it', doc.saysUntouched, '');
    if (doc.hasFunding) ok('...and calling the mismatch expected rather than leaving it to be guessed at', doc.saysExpected, '');
    if (doc.splitNote) {
      const [net, relief] = doc.splitNote.nums;
      ok('...splitting the pension rise into your own money and the relief on it',
        doc.splitNote.nums.length >= 2 && Math.abs(net + relief - doc.splitNote.change) <= 2,
        `${net} + ${relief} against a change of ${doc.splitNote.change} — "${doc.splitNote.text}"`);
    }
    if (doc.oneOff) {
      ok('the one-off move names the wrapper it actually sells from', /S&S ISA/.test(doc.oneOff) && !/general investment account/i.test(doc.oneOff),
        doc.oneOff.split('\n')[1] || '');
      ok('...and says what lands in the pension is bigger than what left', /relief/i.test(doc.oneOff), '');
    }
    ok('...numbered steps to do it', doc.steps >= 2, `${doc.steps} steps`);
    ok('...how to draw on it afterwards', doc.policy > 0, `${doc.policy} policy notes`);
    ok('...and the figures now against the figures after', doc.compareRows >= 3, `${doc.compareRows} rows`);
    ok('...no undefined, NaN or signed zero anywhere in it', doc.junk.length === 0, doc.junk.join(', '));
    ok('...and a print stylesheet, since saving it as a PDF is the point', doc.printable);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
