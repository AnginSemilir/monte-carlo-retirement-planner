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
  /*
   * THE EVOLVED PLAYER, WHICH ONLY EXISTS WHERE THERE IS A BRIDGE.
   *
   * The plan above retires at 60, after the pension unlocks, so the tournament must NOT offer it - a
   * player that never wins is a slower run for nothing, and that is asserted first. Then the same
   * household retiring at 52 must get it, must show its generations, and must not finish behind the
   * players it was started from: elitism carries the best genome forward untouched, so a warm start is
   * a floor. Its module is fetched on the press rather than shipped with the page, so the chunk
   * arriving is part of what this proves works.
   */
  console.log('the evolved player');
  // the players are only named once they have run, so both halves of this are read off the result cards
  const cards1 = await p.evaluate(() => [...document.querySelectorAll('[data-strategy-card]')].map(c => c.getAttribute('data-strategy-card')));
  ok('a household retiring after the access age is not offered it', cards1.length > 0 && !cards1.includes('evolved'), cards1.join(', '));
  {
    const fire = JSON.parse(JSON.stringify(plan));
    fire.demographics.retireAgeSelf = 52;
    fire.accounts[0].contrib = 12000; fire.accounts[1].contrib = 6000;
    const p2 = await b.newPage({ viewport: { width: 1400, height: 1300 } });
    const errs2 = [];
    p2.on('pageerror', e => errs2.push(e.message));
    await p2.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    await p2.addInitScript(pl => { localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl)); localStorage.setItem('rp_which_app', JSON.stringify('full')); }, fire);
    await p2.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
    await p2.waitForTimeout(800);
    await p2.evaluate(() => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => /Strategy/.test(b.textContent)); if (x) x.click(); });
    await p2.waitForTimeout(600);
    const label = await p2.evaluate(() => { const x = [...document.querySelectorAll('button')].find(b => /Compare strategies now/.test(b.textContent)); return x ? x.textContent.trim() : null; });
    if (label) {
      const t1 = Date.now();
      await p2.evaluate((l) => { const x = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === l); x.click(); }, label);
      // the generation counter has to appear, or the search is not running where the user can see it
      const sawGen = await p2.waitForFunction(() => /generation \d+/i.test(document.body.innerText), null, { timeout: 120000 }).then(() => true).catch(() => false);
      ok('...whose search reports its generations while it runs', sawGen);
      await p2.waitForFunction(() => document.querySelectorAll('[data-strategy-card]').length > 0, null, { timeout: 300000 });
      await p2.waitForTimeout(600);
      const res = await p2.evaluate(() => {
        const rows = [...document.querySelectorAll('h3, h4, strong')].map(e => e.textContent.trim());
        const body = document.body.innerText;
        const m = body.match(/Evolved Plan[\s\S]{0,1200}/);
        const rates = {};
        // each player's card carries its name and its survival figure; read them as pairs
        document.querySelectorAll('[data-strategy-card]').forEach(c => {
          const id = c.getAttribute('data-strategy-card');
          const pc = (c.innerText.match(/(\d+\.\d)%/) || [])[1];
          if (id && pc) rates[id] = Number(pc);
        });
        const winCard = [...document.querySelectorAll('[data-strategy-card]')].find(c => c.querySelector('svg.lucide-trophy') || /border-emerald-300/.test(c.className));
        return { ids: [...document.querySelectorAll('[data-strategy-card]')].map(c => c.getAttribute('data-strategy-card')),
          best: winCard ? winCard.getAttribute('data-strategy-card') : null,
          settled: /It settled on:/.test(body), generations: /Bred over \d+ generations/.test(body),
          neverSaw: /paths it never saw while searching/.test(body), rates, cards: document.querySelectorAll('[data-strategy-card]').length,
          junk: (body.match(/undefined|NaN|\[object/g) || []).slice(0, 3), snippet: (m ? m[0] : '').split('\n').slice(0, 4).join(' | ').slice(0, 220) };
      });
      ok('...and a household retiring at 52 gets the player', res.ids.includes('evolved'), res.ids.join(', '));
      ok('...which says what it settled on, in words', res.settled && res.generations, res.snippet);
      ok('...naming the held-out scoring', res.neverSaw);
      const names = Object.keys(res.rates);
      /*
       * NOT "the evolved player wins". It searches on a different seed from the one it is scored on,
       * so it is the only player whose figure is not flattered by its own selection - and it can and
       * does finish behind the others. What has to hold is that it is scored on the same footing and
       * that the trophy goes to whoever actually scored best, which is what protects the household
       * from an extra player that had a bad run.
       */
      if (names.length > 1 && res.rates.evolved !== undefined) {
        ok('...is scored on the same footing as the rest', res.rates.evolved > 0 && res.rates.evolved <= 100, `${res.rates.evolved}%`);
        const top = Math.max(...names.map(n => res.rates[n]));
        ok('...and the trophy still goes to whoever scored best',
          res.best !== null && res.rates[res.best] >= top - 1.0,
          `winner ${res.best} at ${res.rates[res.best]}, best on the page ${top}`);
      } else {
        console.log(`  note  card rates not readable (${res.cards} cards); skipped the scoring checks`);
      }
      ok('...with no undefined or NaN on the card', res.junk.length === 0, res.junk.join(', '));
      console.log(`  evolved-player run: ${((Date.now() - t1) / 1000).toFixed(1)}s`);
    }
    ok('no page errors with the evolved player', errs2.length === 0, errs2.slice(0, 2).join(' | '));
    await p2.close();
  }

  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
