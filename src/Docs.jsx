/*
 * THE DOCUMENTATION TAB, LOADED WHEN IT IS OPENED.
 *
 * Three hundred lines of prose shipped in the first chunk to everybody, including the great majority who
 * never open the tab. It is the one part of the planner that is text rather than arithmetic or controls,
 * so it is the one part that can leave the first load without anything else changing: App renders it
 * through React.lazy, and this file has no state of its own beyond the section list it reports back.
 *
 * Everything the prose quotes - the plan, the parameters, the trial counts, the money formatter - comes
 * in as props, so this module imports nothing from App.jsx and cannot pull the engine into a second
 * chunk. The copy editor (vite-plugin-inline-edit) scans this file alongside App.jsx, so the text here
 * stays editable in place.
 */
import { useEffect } from 'react';
import { Zap, Sliders, ShieldCheck, Wallet, Plus, HelpCircle, Coins, BookOpen } from 'lucide-react';
import { PhoneCollapse } from './phone.jsx';
import { solverApproximations } from './solverApproximations.js';

export default function Docs({ E, P, plan, nmpa, activeRiskMatrix, isPhone, docSections, onSections,
  scrollToDocSection, formatGBP, fmtNum, solverFacts = {} }) {
  /*
   * The documentation of the new planner, the app's only planner since D155 (Details, "How the solver decides"; Phase 12 item 1,
   * the rename pass): it starts with how the solver decides, its coverage section lists the solver's approximations, and the
   * prose names the new planner's places. The classic planner's own sections (the Projection tab's three stages, the
   * tournament and its recommended policy, the priorities) retired with it.
   */
  /*
   * The contents list is read off the rendered cards rather than kept as a second hand-written list: a
   * new card joins the contents by itself, and one that stops leading with a heading goes visibly
   * missing rather than quietly dropping out of a list nobody re-checks. It runs here, after this
   * chunk has rendered, because an effect in App would fire before the cards existed.
   */
  useEffect(() => {
    const found = [...document.querySelectorAll('[id^="doc-"]')]
      .map(el => { const h = el.querySelector('h2'); return h ? { id: el.id, label: h.textContent.trim() } : null; })
      .filter(Boolean);
    onSections(found);
  }, [onSections]);
  return (
    <div className="space-y-6">
      {!isPhone && docSections.length > 1 && (
        <nav data-doc-contents aria-label="Documentation contents" className="bg-surface border border-slate-200/90 p-5 rounded-xl">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600" /> What is in here</h2>
          <ol className="mt-2.5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-0.5 text-xs">
            {docSections.map((sec, i) => (
              <li key={sec.id} className="flex gap-2 items-baseline">
                <span className="text-slate-400 tabular-nums shrink-0">{i + 1}</span>
                <button type="button" onClick={() => scrollToDocSection(sec.id)}
                  className="text-left min-h-6 text-blue-700 hover:text-blue-900 hover:underline font-semibold cursor-pointer">{sec.label}</button>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div id="doc-solver" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Zap className="w-4 h-4 text-indigo-600" /> How the solver decides</h2>
        <p className="text-xs text-slate-600 leading-relaxed">The solved plan is worked out backwards, from the last year of your plan to this one. For each year, and for each amount of money you might have by then, the solver weighs every move open to it: how much to spend, which pot to draw from, whether to move money between pots, and how much risk to take. It keeps the move that does best over the markets that year could bring, given the best it has already found for every year after.</p>
        <p className="text-xs text-slate-600 leading-relaxed"><strong className="text-slate-800">Not running out comes first.</strong> Then spending: it aims at your target, spends up to 110% of it when the money allows, and plans no less than {Math.round(100 * (solverFacts.floor || 0.8))}% of it where you set no lower limit; how much you dislike cuts decides how readily it trims. A small weight goes to what you leave behind.</p>
        <p className="text-xs text-slate-600 leading-relaxed"><strong className="text-slate-800">Every figure comes from simulating the solved plan</strong> with the app&rsquo;s own engine, the same engine that runs your current approach, on the same simulated markets, so the two compare fairly. Your current approach is your plan run by the app&rsquo;s own rules: the yardstick. Your limits are what the solver may not change. A rule of thumb sums up the plan&rsquo;s own choices in three lines, shown where following it costs under half a point.</p>
        <h3 className="text-sm font-semibold text-slate-800 pt-1">The solver&rsquo;s approximations</h3>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          {solverApproximations(solverFacts).map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        </PhoneCollapse>
      </div>

      

      

      <div id="doc-decumulation" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Sliders className="w-4 h-4 text-blue-600" /> Decumulation Policies &amp; Pension Drawdown Strategies</h2>
        <p className="text-xs text-slate-600 leading-relaxed">How money is withdrawn across wrappers changes lifetime tax and the size of the pot left at the end; it changes the probability of maintaining your living costs far less than the spend level, asset allocation and the pre-SIPP access bridge do.</p>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
          <li><strong>Tax Smoothing (default):</strong> fills the £{fmtNum(P.pa)} allowance from pension income (0%), then draws pension income up to the £{fmtNum(P.basicLimit)} higher-rate threshold (about {Math.round((1 - P.pclsProp) * P.basicRate * 100)}% effective with the {Math.round(P.pclsProp * 100)}% tax-free element), then cash, GIA and ISA, with pension income above the threshold as the last resort. Cash and ISAs are preserved as the low-volatility reserve and the tax-free shield for later life.</li>
          <li><strong>UK FIRE Bracket Fill:</strong> draws pension only up to the £{fmtNum(P.pa)} allowance, then cash, GIA and ISAs; pension income above the allowance is the last resort. Pays the least tax during your lifetime and leaves the largest pot, but that pot is mostly taxable pension. Set the pension death-tax haircut in Details, Assumptions to see the difference net of what beneficiaries would pay.</li>
          <li><strong>Sequential:</strong> cash → GIA → ISA → pension, no bracket management. Shown as the naive baseline; it wastes the personal allowance in early retirement.</li>
          <li><strong>Harvest unused allowance:</strong> once retired and past age {nmpa}, any unused 0% allowance is filled from the pension and the net proceeds moved to ISA (within the £{fmtNum(P.isaAllowance)} limit) or cash. It only matters when spending is largely covered by guaranteed income.</li>
          <li><strong>Phased Drawdown</strong> crystallises {Math.round(P.pclsProp * 100)}% tax-free with each withdrawal (UFPLS-style), keeping the rest invested. <strong>Full lump sum</strong> moves the maximum tax-free cash (capped at £{fmtNum(P.lsa)}) into cash savings at retirement; later withdrawals are then fully taxable.</li>
        </ul>
        </PhoneCollapse>
      </div>

      <div id="doc-guardrails" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /> Spending Guardrails (Guyton-Klinger)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">The decumulation policy above decides <strong>where</strong> each year's money comes from. Guardrails decide <strong>how much</strong> to take, and they are a separate switch in You, under Your current approach, off by default. With them off, every simulated year spends the plan whatever the markets did. That is the strict test, and the one every figure in this app was built on. With them on, spending reacts to the pots the way a real household's would, following the rules Jonathan Guyton and William Klinger set out in 2006, translated into this model's terms:</p>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
          <li><strong>The rails.</strong> The first year the pots are drawn on, the withdrawal rate is recorded: that year's draw over the combined pot. Every later year the current rate is compared to it. More than {Math.round(E.GUARDRAILS.band * 100)}% above, the draw is cut by {Math.round(E.GUARDRAILS.cut * 100)}%. More than {Math.round(E.GUARDRAILS.band * 100)}% below, it is raised by {Math.round(E.GUARDRAILS.raise * 100)}%. A 5% start has its rails at 4% and 6%.</li>
          <li><strong>The draw, not the spend.</strong> The rate is measured on what the pots are asked for after the State Pension and any other guaranteed income, because that is what a withdrawal rate means. The cut and the rise apply to that draw. A household living entirely on guaranteed income is never touched by the rule.</li>
          <li><strong>No rise after a loss.</strong> In any year the pots fell, the inflation rise that would have kept spending level is skipped and never made up. The model runs in today's money, so this appears as spending falling by the {E.num(plan?.config?.inflation, E.DEFAULT_CONFIG.inflation)}% inflation assumption in real terms.</li>
          <li><strong>No cuts at the end.</strong> The cut is switched off in the final {E.GUARDRAILS.freezeYears} years of the plan, where there is no long horizon left to protect. The rise still applies.</li>
          <li><strong>The rails follow your plan.</strong> When the plan itself changes what it asks of the pots, because the State Pension starts, a spending band begins, or an income stream ends, the rails are re-set on that new footing with every cut and rise so far carried into them. Without this the rule would read your own choices as market news: on a perfectly smooth path it raised spending to more than double by age 80, undoing a reduction the household had planned on purpose.</li>
        </ul>
        <p className="text-xs text-slate-600 leading-relaxed"><strong>What it does to the numbers, and why it is off by default.</strong> A path that survives by cutting three times still counts as a survival, so switching the rule on makes the survival rate rise for a reason the rate cannot show on its own. Two figures appear beside it to say what that cost: the spending a typical run actually lived on, and what the unlucky tenth lived on. Read the rate with those or it will flatter the plan. The safe-spend solver's answer becomes a safe <em>starting</em> spend, and it is never lower with the rule on than off, because the option to cut can only widen what a starting figure survives. The four parameters are held constant rather than exposed: the switch is one decision, and four numbers under it would turn it into a tuning exercise.</p>
        <p className="text-xs text-slate-500 leading-relaxed"><strong>Seeing where it acts.</strong> Details' Year by year table gains a column when the rule is on, naming what it did in each year of the expected path (a cut, a rise, a skipped inflation rise, or the rails being re-set) and the multiplier it has left on the draw. The expected path is smooth, so most of what it shows there is rises and re-sets; the cuts happen in the simulated bad runs, which is where the Monte Carlo figures come from.</p>
        </PhoneCollapse>
      </div>

      <div id="doc-lookahead" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-600" /> Preparing for a One-off Cost</h2>
        <p className="text-xs text-slate-600 leading-relaxed">A one-off cost you enter in You is a cost the plan can see coming, but until this setting it was met as if it were a surprise: read in its own year and paid by the cost order, cash then GIA then ISA and finally the pension, with no ceiling on the pension draw. A cost larger than the liquid wrappers therefore landed on the pension in one year and went through the higher and additional bands, when the same money drawn over the years before would have come out at the basic rate. The setting is <strong>Prepare for one-off costs, years ahead</strong> in You, under Your current approach; the default is {E.DEFAULT_CONFIG.lookaheadYears === 0 ? 'off (0)' : `${E.DEFAULT_CONFIG.lookaheadYears} years`}.</p>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5">
          <li><strong>What it does.</strong> From that many years ahead, each year the plan sets the liquid wrappers, grown at the rate they earn, against every known cost inside the window. Whatever would still be short is divided by the years left until the cost lands, and that share is drawn from the pension on top of the living draw, never past the basic-rate limit ({formatGBP(P.higherRateStartsAt)} of total taxable income). The proceeds go to the ISA up to the allowance and then to cash, not the GIA, because money for spending within a few years should not realise a gain on the way out.</li>
          <li><strong>Where it cannot act.</strong> Only once retired and past the pension access age, since before that the pension cannot be drawn. A household whose living draw already reaches the basic-rate limit has no room under the ceiling, and the rule correctly does nothing rather than draw at 40%. A cost the liquid wrappers will cover on their own leaves it idle too.</li>
          <li><strong>Self-correcting, not scheduled.</strong> It is recomputed from the balances every year: a rise in the markets shrinks the shortfall and the reserve stops growing, a fall widens it and the next year draws more. Nothing is earmarked, because the cost order spends the liquid wrappers first when the year comes.</li>
          <li><strong>What it costs.</strong> Money leaves the pension's tax-free growth a few years early and part of it sits in cash meanwhile. That is the trade against twenty or more points of tax on the year the cost lands.</li>
        </ul>
        <p className="text-xs text-slate-500 leading-relaxed"><strong>What the study found.</strong> Over the scenario library with a cost of a quarter or a half of the household's wealth placed six years into retirement, the rule was idle for most households, whose liquid wrappers covered the cost anyway. Where it acted, the cost-year pension draw fell by a hundred thousand pounds or more, lifetime tax fell by twenty to seventy thousand, the median terminal pot rose rather than fell, and survival rose by up to three points with no household worse by more than a point. Your current approach's year by year (Details) gains a <strong>Set aside</strong> column when the setting is on, showing the years it acted and the cost year each draw was for.</p>
        </PhoneCollapse>
      </div>

      <div id="doc-coverage" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Modelling Decisions, Coverage &amp; Known Gaps</h2>
        <p className="text-xs text-slate-600 leading-relaxed">Where the rules leave room for judgement, this is the decision the model makes and why. Read this before trusting a number.</p>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Decisions taken</h3>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li><strong>Everything is in today's money.</strong> Growth uses each tier's <em>real</em> rate, so every pot, spend and bequest figure is in today's purchasing power. The "Combined (Nominal)" chart series is the only place inflation is added back, for display. A £100,000 bequest floor therefore means £100,000 of today's money. Do not gross it up.</li>
          <li><strong>Pay is flat in real terms unless you say otherwise.</strong> Salary, or trading profit for the self-employed, is held at the figure you enter for every working year. Because the projection is in today's money that is not a frozen wage, it is pay rising exactly with inflation. Set a real growth rate per person under Advanced inputs to model promotions or a career winding down; it compounds on top of inflation and feeds the relevant-earnings cap, the annual allowance taper and the relief rate on every pension contribution.</li>
          <li><strong>The MPAA is derived, not declared.</strong> The model runs the expected path once, finds the first year each person draws taxable pension income, and applies the £{fmtNum(P.mpaaLimit)} allowance from that age. It assumes you have <em>not</em> already flexibly accessed a pension: reasonable for planning, wrong if you have, which would need the trigger set earlier.</li>
          <li><strong>Carry-forward is not consumed.</strong> Unused allowance from the prior three years is offered as headroom but is not tracked as being used up, so a plan that leans on it repeatedly is optimistic. It never lifts the earnings limit, and it accrues at each prior year's <em>tapered</em> allowance.</li>
          <li><strong>The annual allowance taper keys off earnings.</strong> HMRC tapers on adjusted income, which adds employer contributions; the model only knows earnings, so the taper is approximate for anyone near the £{fmtNum(P.aaTaperThr)} threshold.</li>
          <li><strong>A blank salary means "unknown", not "zero".</strong> While you are still working, leaving salary empty leaves the pension allowance unconstrained rather than dropping it to £{fmtNum(P.pensionNoEarningsLimit)}. Enter a salary for an accurate limit.</li>
          <li><strong>CGT is realisation-based.</strong> Gains are booked only when the GIA is actually sold, using a running cost basis. Gains are wiped by the uplift on death, so nothing is charged on whatever remains at the terminal age.</li>
          
          <li><strong>Allowance harvesting is a bequest tool.</strong> It never improves survival. It moves money from a pot taxed on death into one that is not. It is worth nothing unless you set a pension death tax rate, and close calls are broken on the pot left <em>after</em> that tax.</li>
          <li><strong>An employee paying in from net pay or by relief at source gets income tax relief only.</strong> National Insurance is paid on the whole salary, and no employer NIC is passed through; salary sacrifice, the default, also saves the employee's NIC, and adds a share of the employer's NIC saving to the pension only where the pass-through in Details, Assumptions is set. The employment type asks which (not sure is priced as net pay, the more cautious). Relief at source is priced as net pay, which for a low earner can lean either way: where the salary less the contribution falls below the personal allowance, the 20% that relief at source still adds is not counted, but the contribution also comes off the pay that the personal allowance and the starting rate for savings are set against, so savings interest can be taxed less than relief at source would tax it. For every employee the pension figure, entered gross with the employer's part included, is priced as the employee's own contribution.</li>
          <li><strong>The self-employed get income tax relief only.</strong> A sole trader cannot salary sacrifice, so a personal contribution saves income tax at the marginal rate but no NIC, and no employer NIC can be passed through. That is 40% relief for a higher-rate trader against 42% for an employee paying by salary sacrifice, and 20% against 28% in the basic band. Set the employment type per person in Advanced inputs.</li>
          <li><strong>Allowances are frozen in real terms</strong> at the figures in Details, Assumptions. Any future rise in the ISA or pension allowance is not modelled, so long staging schedules are deliberately cautious.</li>
        </ul>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Modelled</h3>
        <p className="text-xs text-slate-600 leading-relaxed">Income tax including the personal-allowance taper, employee Class 1 NIC and self-employed Class 4 NIC, the {Math.round(P.pclsProp * 100)}% tax-free element capped at the £{fmtNum(P.lsa)} Lump Sum Allowance, the £{fmtNum(P.pensionAllowance)} annual allowance with taper and three-year carry-forward, the relevant-earnings limit, the MPAA, ISA allowances, realisation-based CGT with its annual exempt amount and band split, state pension timing, the pre-SIPP access bridge, one-off deposits with multi-year staging, one-off costs, spending bands by age, salary-sacrifice relief including any employer NIC pass-through set in Details, Assumptions, and income tax relief alone for the self-employed and for an employee paying in from net pay or by relief at source.</p>

        <>
        <h3 className="text-sm font-semibold text-slate-800 pt-1">The solver&rsquo;s approximations</h3>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          {solverApproximations(solverFacts).map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        </>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Not modelled yet</h3>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li><strong>Lumpy self-employed profits.</strong> Trading profit is carried as a single figure that grows at a steady rate, exactly like a salary. Real self-employment swings year to year, and a bad year can waste an annual allowance that carry-forward only partly recovers. <strong>Class 2 NIC</strong> is also not charged: it stopped being mandatory above the Small Profits Threshold in 2024, and the voluntary route for those below it does not change a projection. Payments on account, the trading allowance, capital allowances and incorporation are all out of scope.</li>
          <li><strong>Devolved income tax:</strong> covered. Set where you pay tax in You. Scotland uses its own six bands, Wales
            is offered but currently matches England and Northern Ireland. Only the bands are devolved: National Insurance, capital gains
            tax, the personal allowance and its taper apply unchanged, and relief at source on a pension contribution stays at 20%.
            Note that the region only shows up where the model actually routes income through the tax calculation - pension drawdown,
            the state pension and other taxable income - so it does not change a projection whose earning years are all before anyone
            has retired.</li>
          <li><strong>Inheritance tax on the estate.</strong> The pension death tax setting applies a haircut to leftover pension only, so it represents the <em>extra</em> tax a pension suffers relative to an ISA, not IHT on everything.</li>
          <li><strong>Defined benefit pensions</strong> beyond entering them as a taxable income stream; no accrual, revaluation or transfer values.</li>
          <li><strong>Tax on cash interest.</strong> The Cash Savings wrapper earns its tier&rsquo;s return and nothing is charged on it, so it stands for a <strong>cash ISA</strong>, or for savings inside your personal savings allowance. There is no wrapper for taxable cash above that allowance: the nearest proxy is Other Investments at a low risk tier, which taxes the growth as CGT on disposal rather than as interest every year &mdash; later, at a lower rate and after a larger allowance, so it flatters a large cash holding. Measured on a &pound;100,000 holding at the Low Risk tier, the interest tax not charged runs to about &pound;2,600 a year for a basic-rate payer and &pound;5,400 for a higher-rate one.</li>
          <li><strong>Care costs, the Lifetime ISA, the National Minimum Wage floor on salary sacrifice, dividend and savings-interest taxation inside the GIA, share pooling and the 30-day CGT rule.</strong></li>
          <li><strong>Allowance and threshold changes</strong> announced for future years, and any change to the state pension triple lock.</li>
        </ul>
        <p className="text-xs text-slate-500 leading-relaxed">This is an educational model, not advice. Where a figure matters to a real decision, check it against current HMRC guidance or a regulated adviser.</p>
        </PhoneCollapse>
      </div>

      <div id="doc-taper" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-600" /> Spending by Age</h2>
        <p className="text-xs text-slate-600 leading-relaxed">Retirement spending often isn't flat. Set what a stretch of years actually costs in You as bands: a start age, an end age and what those years cost in today's money. A band that names ages 58 to 67 at {formatGBP(45000)}, then 68 to 79 at {formatGBP(34000)}, then 80 onwards at {formatGBP(40000)}, says exactly that, including the rise at the end for care. Ages are "Myself" ages.</p>
        <p className="text-xs text-slate-600 leading-relaxed">Bands only override the years they cover. Any year outside every band falls back to the headline living spend, so naming a single expensive stretch is enough; you do not have to describe the whole retirement. Leave the end age blank to run a band to the terminal age. If two bands overlap the earlier one wins for the shared years, and the model says so in the warnings rather than picking silently.</p>
        <p className="text-xs text-slate-500 leading-relaxed">Bands replaced an older pair of percentage "tapers" that could only step spending down at two fixed ages. Any saved plan still carrying tapers is converted to the equivalent bands when it loads, so its projection is unchanged. The safe-spend solver scales the whole shape at once: it finds the multiple of your headline spend that survives, and every band moves with it in proportion.</p>
        </PhoneCollapse>
      </div>

      <div id="doc-risk-profiles" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-600" /> Asset Allocations, Return Bounds &amp; Volatility (σ)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">Each wrapper is assigned a risk tier carrying an expected real return (treated as the median annual rate), a volatility, and a forecast uncertainty. The first two describe the <em>path</em>; the third describes how sure we are of the average that path is scattered around, and the distinction matters more the longer you plan for. Volatility averages out as σ/√T. Being wrong about the long-run average does not average out at all, so it is drawn once per simulated path and then lived with, giving an annualised spread of √(u² + σ²/T). The built-in tiers set that uncertainty to zero, which is itself a claim — that we know the long-run average and are only unsure of the route — and a published set of capital market assumptions will generally say otherwise.</p>
        <p className="text-xs text-slate-600 leading-relaxed"><strong className="text-slate-800">&ldquo;Expected&rdquo; here means the middle, not the average.</strong> The figure in the first column is the <em>median</em> rate: half the simulated years land above it and half below. Compound the middle rate and you get the middle outcome, which is why a projection compounded at these rates sits almost exactly on the simulation&rsquo;s median &mdash; within half a percent on a plain lump sum, and within about 3&frac12;% on a real plan, where contributions and tax blur it slightly.</p>
        <p className="text-xs text-slate-600 leading-relaxed">The <em>average</em> would be a much bigger number and a far less useful one. Picture a casino floor: nobody is made to stop while they are winning, but everybody stops at zero. Money behaves the same way. A pot that compounds well keeps compounding with nothing above it, while a pot that runs dry is finished and stays finished &mdash; so a handful of runaway futures drag the average up and away from anything the rest experience. On one ordinary plan modelled here the middle outcome is {formatGBP(7193811)} while the average is {formatGBP(22457043)}: more than three times higher, and a figure almost nobody in the simulation actually ends up with. You plan around the outcome in the middle, so the middle rate is what this model compounds. It is the standard convention too &mdash; published capital market assumptions quote annualised returns, not arithmetic ones.</p>
        <p className="text-xs text-slate-600 leading-relaxed">The 10th and 90th percentile columns beside them are that spread at the two tails: over your horizon the annualised return lands between them eight times in ten. That spread narrows as the horizon lengthens, so a rate taken at one horizon is wrong at every other. What they cannot do is stand in for the simulation: a smooth curve at the 10th percentile&rsquo;s rate contains no bad decade and cannot run dry, so it stays optimistic on a plan under strain. All wrappers move together (one market factor scaled by each tier's σ), so the correlations a published set also carries cannot be used without a second factor; the historical backtest blends real US equity and bond returns by the tier's equity weight ({Object.entries(E.RISK_EQUITY_WEIGHTS).map(([k, v]) => `${k.replace(' Risk', '')} ${Math.round(v * 100)}%`).join(', ')}).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {Object.entries(activeRiskMatrix).map(([k, v]) => (
            <div key={k} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1"><span className="font-bold text-slate-800">{k} ({v.label})</span><p className="text-slate-500">Expected real {E.num(v.real, 0).toFixed(2)}% pa, σ = {E.num(v.volatility, 0).toFixed(1)}%.</p></div>
          ))}
        </div>
        </PhoneCollapse>
      </div>

      <div id="doc-one-off-deposits" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Plus className="w-4 h-4 text-blue-600" /> One-Off Deposits &amp; Multi-Year Staging</h2>
        <p className="text-xs text-slate-600 leading-relaxed">A one-off deposit is a lump sum paid into a chosen wrapper in a chosen year. Because ISAs and pensions are capped each tax year, the engine checks the deposit against that year's remaining allowance before it lands.</p>
        <p className="text-xs text-slate-600 leading-relaxed"><strong>Into a pension, the amount you enter is what lands in it.</strong> The app does not add tax relief to a deposit you type: if relief at source applies (you pay £8,000 and £10,000 arrives), enter the £8,000 from where it is paid and the £2,000 of relief as its own deposit from External, as the app's own Bed and SIPP suggestion does. A deposit the plan routes itself (Auto) is relieved by the app.</p>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Where the money comes from</h3>
        <p className="text-xs text-slate-600 leading-relaxed"><strong>External (new capital)</strong> is money arriving from outside the plan (an inheritance, a bonus, a property sale), and nothing is deducted from your existing pots. Choosing any wrapper instead treats it as an internal transfer: the full amount is taken out of that pot in the deposit year. If that pot does not hold enough at the time, the engine moves what is there and the rest is recorded as a shortfall.</p>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">How much fits this year (headroom)</h3>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li><strong>S&amp;S ISA:</strong> {formatGBP(P.isaAllowance)} less whatever your regular ISA contribution is that year.</li>
          <li><strong>Carry forward:</strong> unused annual allowance from the previous three tax years is added to the current year's. Years inside the projection are worked out from your contribution schedule; for the three years before it starts the model has no data, so it assumes nothing unless you enter a figure under Advanced inputs. Carry forward never lifts the earnings limit, so it does nothing for someone with no relevant earnings.</li>
          <li><strong>Pension after flexible access:</strong> taking taxable pension income permanently replaces the allowance with the money purchase annual allowance of {formatGBP(P.mpaaLimit)}, and carry forward is no longer available. Taking only tax-free cash, or buying an annuity, does not trigger it. You do not enter this: the model works out the first year your plan draws taxable pension income and applies it from there.</li>
          <li><strong>Pension:</strong> {formatGBP(P.pensionAllowance)}, but capped at your <em>relevant UK earnings</em>, less your regular pension contribution that year. Only employment and self-employment income counts as earnings; DB pensions, annuities, rent, dividends and interest do not. With no relevant earnings the limit is <strong>{formatGBP(P.pensionNoEarningsLimit)}</strong>, which is what normally applies once you have retired. If you leave your salary blank while still working, the engine treats your earnings as unknown and does not constrain the allowance.</li>
          <li><strong>Other Investments and Cash Savings:</strong> no annual limit, so a deposit there is never staged.</li>
        </ul>
        <p className="text-xs text-slate-600 leading-relaxed">Headroom is therefore not a fixed number. It shrinks in later years if your regular contributions escalate, and it changes again at retirement, when regular contributions stop and the pension earnings test begins to constrain it. The card above the deposits table shows this tax year only. Each deposit row shows the headroom for its own year.</p>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">If the deposit exceeds the headroom</h3>
        <p className="text-xs text-slate-600 leading-relaxed">Rather than silently breaching the allowance, the deposit is staged across several tax years:</p>
        <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
          <li>As much as fits the current year's allowance goes straight into the target wrapper.</li>
          <li>The surplus is parked in <strong>Other Investments (GIA)</strong>, where it stays invested and grows at that account's risk tier. Once it has grown, moving it out is a disposal, so with CGT switched on each transfer year realises a proportional gain.</li>
          <li>At the start of each following tax year, as much as that year's allowance permits is moved from the GIA into the target wrapper, repeating until nothing is left. You can redirect where the staged money ends up from the row's settings icon.</li>
        </ol>
        <p className="text-xs text-slate-600 leading-relaxed">Where several deposits compete for the same person's allowance in the same year, they are resolved in date order, so one allowance is never counted twice. If a market fall shrinks the parked money, that year's transfer is capped at whatever the GIA actually holds. Anything still parked at the end of the plan stays in Other Investments and is flagged as a warning.</p>

        <p className="text-xs text-slate-500 leading-relaxed"><strong>Assumption:</strong> allowances are held fixed in real terms at the figures in Details, Assumptions ({formatGBP(P.isaAllowance)} ISA, {formatGBP(P.pensionAllowance)} pension, {formatGBP(P.pensionNoEarningsLimit)} with no earnings). Any future increase in these limits is <strong>not</strong> modelled, so a long staging schedule is a cautious estimate. If allowances do rise, the money would move across in fewer years than shown. You can edit the figures in Details, Assumptions to test a different assumption.</p>
        </PhoneCollapse>
      </div>

      <div id="doc-cgt" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-blue-600" /> Capital Gains Tax on Other Investments (GIA)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">Pensions and ISAs shelter growth, but a general investment account does not. When CGT is switched on in Details, Assumptions, the engine tracks the <strong>cost basis</strong> of each person's GIA and charges tax on gains as they are realised.</p>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Growth is not taxed until you sell</h3>
        <p className="text-xs text-slate-600 leading-relaxed">Holding costs nothing. Money paid in is added at cost; growth raises the value without raising the cost, so the unrealised gain builds up untaxed. Tax is only triggered by a disposal: funding your spending, paying a one-off cost, or moving money out under a staged deposit. Each disposal is treated as selling a slice of the whole holding, so the gain is the same proportion of the sale as the unrealised gain is of the pot.</p>
        <p className="text-xs text-slate-600 leading-relaxed">Example: a {formatGBP(100000)} GIA holding {formatGBP(40000)} of gain is 40% gain. Selling {formatGBP(10000)} realises {formatGBP(4000)}; the remaining {formatGBP(3000)} exemption leaves {formatGBP(1000)} taxable, so the bill is {formatGBP(180)} at the basic rate.</p>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Rates and allowances</h3>
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          <li>Each person has a {formatGBP(P.cgtAnnualExempt)} annual exempt amount. If you have already realised gains this tax year, enter them in You so the current year's exemption is reduced; leaving it blank assumes the full allowance is available.</li>
          <li>Gains stack on top of that year's income: the part falling in your remaining basic-rate band is taxed at {Math.round(P.cgtBasicRate * 100)}%, anything above at {Math.round(P.cgtHigherRate * 100)}%.</li>
          <li>The bill is settled from cash, then the GIA, then ISAs, then an accessible pension. This is the same order used for one-off costs. Selling to pay the bill realises a little more gain, which is carried into the next year, mirroring the fact that CGT is due the January after the tax year.</li>
        </ul>

        <h3 className="text-sm font-semibold text-slate-800 pt-1">Setting your opening position</h3>
        <p className="text-xs text-slate-600 leading-relaxed">The "of which unrealised gain" figure on the GIA row tells the engine how much of today's balance is profit. Left blank, the balance is treated as entirely cost, so only future growth is ever taxed, which may provide too much weight to GIA. If you hold long-standing investments with a large embedded gain, enter it, or the model will understate your tax.</p>

        <p className="text-xs text-slate-500 leading-relaxed"><strong>Deliberate omissions:</strong> gains are wiped by the uplift on death, so nothing is charged on whatever remains at the terminal age. This is a real reason to spend other wrappers first. Dividends and interest inside the GIA are not modelled separately, share pooling and the 30-day rule are ignored, and the exempt amount and rates are held flat in real terms at the figures in Details, Assumptions.</p>
        </PhoneCollapse>
      </div>

      <div id="doc-one-offs" className="bg-surface border border-slate-200/90 p-5 rounded-xl space-y-3">
        <PhoneCollapse isPhone={isPhone}>
        <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2"><Coins className="w-4 h-4 text-blue-600" /> One-Off Cost Liquidation Hierarchy</h2>
        <p className="text-xs text-slate-600 leading-relaxed">When a one-off capital cost is scheduled, the engine liquidates assets in this order:</p>
        <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-1">
          <li><strong>Cash Savings</strong> (both owners), then <strong>Other Investments (GIA)</strong>, then <strong>Stocks &amp; Shares ISAs</strong>.</li>
          <li><strong>Pensions</strong>, but only for an owner who has reached the access age ({nmpa}). If the cost still cannot be met, the year is flagged as a shortfall, or a pre-SIPP access gap when pension money existed but was locked.</li>
        </ol>
        <p className="text-xs text-slate-500">Known simplifications: state pension is held flat in real terms (no triple-lock uplift), tax thresholds and allowances are held flat in real terms, and the death of a partner is not modelled.</p>
        <p className="text-xs text-slate-500 leading-relaxed"><strong>Pension allowance limitations.</strong> The model assumes you have <strong>not</strong> yet flexibly accessed a pension, because it is built for planning towards retirement rather than for someone already drawing an income. If you have already taken taxable pension income, your annual allowance is already {formatGBP(P.mpaaLimit)} and the projection will overstate how much you can contribute until the year it starts drawing. Carry forward is also worked out independently for each year rather than being consumed as it is used, so several large staged deposits in overlapping years could each count the same unused allowance. Neither the tapered annual allowance for high earners nor annual allowance charges themselves are modelled.</p>
        </PhoneCollapse>
      </div>
    </div>
  );
}
