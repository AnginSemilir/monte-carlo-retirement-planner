/*
 * THE STRATEGY TAB'S WORDS (Part C Phase 9; research/solver/PART-C-WORDING.md, decided as B4 in D51): one table of strings,
 * so a change of wording is one line. Each figure comes from src/solverStrategy.js's headline; nothing here is a result.
 *
 *   headlineWords(h, fmt)   { title, amount, back, chance, delivered }   the card at the top (wording section 1)
 *   explanationWords(h)     null | { kind: 'full' | 'short', title, paras }   under it, when the plan starts below target
 *   raiseWords(r)           null | string                                  the late raise (wording section 4)
 *
 * The cases (B4): the first year at the target or above; back within three years (the short note); longer (the full text);
 * the median path never back. A household still working reads its first retired year, "when you retire" (the launch plan's
 * Phase 9: the agent's proposal, adopted in B4).
 */
const years = n => (n === 1 ? 'year' : 'years');
const NUM = ['no', 'one', 'two', 'three'];
const pct = x => `${Math.round(x)}%`;

export const WORDS = {
  title: (h) => (h.retired ? 'Your safe starting spend' : 'Your safe starting spend when you retire'),
  atTarget: (h, fmt) => (h.startLevel > 100 ? `${fmt(h.startSpend)} a year, above your ${fmt(h.target)} target` : `${fmt(h.startSpend)} a year, your full target`),
  below: (h, fmt) => `${fmt(h.startSpend)} a year`,
  share: (h, fmt) => `That is ${pct(h.startLevel)} of your ${fmt(h.target)} target.`,
  // the headline's two back lines in LAYOUT.md section 8's words (D58 (1), finding L12): the figure is the median over the
  // paths of each one's first year back at target, so the words say so
  back: (h) => `In half the markets you are back at your full target by ${h.backYear} (${h.backIn} ${years(h.backIn)} in).`,
  never: () => 'In more than half the markets you stay below your target; see why below.',
  chance: (h) => `Chance your money lasts: ${pct(h.survival)}`,
  delivered: (h) => `Spending delivered over the plan: ${pct(h.delivered)} of your target`,
  fullTitle: 'Why your plan starts below your target',
  full: [
    'Your target is high for what you have saved, so the plan puts not running out first. It spends less in the early years, when a bad run in the markets would do the most damage, and moves back up as your savings allow. Expect to spend below your target for a while; if markets are kind, you will get back to it sooner.',
    'If steady spending matters more to you than the last few points of safety, turn up How much do you dislike cuts? under What matters to you. Your spending will stay closer to your target, and your chance of running out will rise. The two figures move together as you change it, so you can see the trade before you choose.'
  ],
  short: (h) => `The plan starts a little below your target for the first ${NUM[h.dip] || h.dip} ${years(h.dip)}, to protect you against a bad start in the markets.`,
  raise: (r) => `If markets do well, you could spend up to ${Math.round(r.level - 100)}% above your target from about age ${r.age}.`
};

export function headlineWords(h, fmt) {
  const at = h.case === 'atTarget';
  return {
    title: WORDS.title(h),
    amount: at ? WORDS.atTarget(h, fmt) : WORDS.below(h, fmt),
    share: at ? null : WORDS.share(h, fmt),
    back: at ? null : h.case === 'never' ? WORDS.never(h) : WORDS.back(h),
    chance: WORDS.chance(h),
    delivered: WORDS.delivered(h)
  };
}

export function explanationWords(h) {
  if (h.case === 'short') return { kind: 'short', title: null, paras: [WORDS.short(h)] };
  if (h.case === 'long' || h.case === 'never') return { kind: 'full', title: WORDS.fullTitle, paras: WORDS.full };
  return null;
}

export const raiseWords = r => (r ? WORDS.raise(r) : null);

/* the dial's live line (PART-C-WORDING.md section 3; Phase 10, item 3): the headline's figures at one of its settings */
export function dialLineWords(h, fmt) {
  const start = h.case === 'atTarget' ? `start at your full target, ${fmt(h.startSpend)}` : `start at ${fmt(h.startSpend)} (${pct(h.startLevel)} of target)`;
  const back = h.case === 'atTarget' ? '' : h.case === 'never' ? ', below target on a typical run' : `, back at target by ${h.backYear}`;
  return `${start}${back}; chance your money lasts ${pct(h.survival)}`;
}

/* this year's actions and the next years', in the playbook's words (the launch plan's Phase 9, items 4 and 5) */
const DRAW = { 'pa-half': 'up to half your personal allowance', pa: 'up to your personal allowance', 'basic-mid': 'up to the middle of the basic-rate band', basic: 'up to the basic-rate limit', hr: 'up to the higher-rate taper threshold' };
const WRAP = { pa: 'your personal allowance', basic: 'the basic-rate limit', hr: 'the higher-rate taper threshold', pam: 'half your personal allowance', bm: 'the middle of the basic-rate band' };
const steps = k => `${k} step${k > 1 ? 's' : ''}`;
export const PART_WORDS = {
  level: (v, { target, fmt }) => (v < 1 ? `Spend ${fmt(v * target)} this year, ${pct(100 * v)} of your target` : `Spend up to ${fmt(v * target)} this year, ${pct(100 * v)} of your target`),
  draw: v => (v === 'any' ? 'Take what you need from your pension first' : `Take from your pension first, ${DRAW[v] || v}`),
  harvest: v => `Move pension money into your ISA, up to ${WRAP[v] || v}`,
  tierPen: k => `Move your pension ${steps(k)} lower in risk`,
  tierIsa: k => `Move your ISA ${steps(k)} lower in risk`
};
export function actionWords(x, ctx) {
  const what = PART_WORDS[x.part] ? PART_WORDS[x.part](x.value, ctx) : `${x.part} ${x.value}`;
  const cost = x.cost === null ? 'No other move this year differs here.'
    : x.cost > 0 ? `Skipping it costs ${x.cost.toFixed(1)} points of survival.`
      : `Skipping it costs no survival on ${x.n.toLocaleString()} markets.`;
  return { what, cost };
}
/*
 * One year of the median path: the spending and what the year's move does beyond it, each move a line (step U, LAYOUT.md
 * section 8, finding L9). A wrapper's tier is said only in the year it changes, against the year before (`prev`; the first
 * year's against the plan's own tier), as a step down, a step back up or a return to the risk you chose, the pension and the
 * ISA named together where they move alike; a year with nothing to say reads "nothing to change".
 * research/tests/planner-figures.test.mjs plants: 'tiereach' the tier said every year it is held, 'tierdown' a step up worded as
 * a step down.
 */
export const WORDS_PLANT = { rule: '' };
const tierWords = (what, was, now) => (now === was && WORDS_PLANT.rule !== 'tiereach' ? null
  : now === was ? (now ? `Move your ${what} ${steps(now)} lower in risk` : null)
    : was === 0 ? `Move your ${what} ${steps(now)} lower in risk`
      : now === 0 ? `Move your ${what} back to the risk you chose`
        : now < was && WORDS_PLANT.rule !== 'tierdown' ? `Move your ${what} ${steps(was - now)} back up in risk (${now} below the risk you chose)`
          : `Move your ${what} ${steps(Math.abs(now - was))} further down in risk (${now} below the risk you chose)`);
export function aheadWords(row, { fmt }, prev = null) {
  const p = row.parts, lines = [];
  if (p.draw !== 'none') lines.push(PART_WORDS.draw(p.draw));
  if (p.harvest) lines.push(PART_WORDS.harvest(p.harvest));
  const pen = p.tierPen || 0, isa = p.tierIsa || 0, wp = prev ? prev.tierPen || 0 : 0, wi = prev ? prev.tierIsa || 0 : 0;
  if (pen === isa && wp === wi) { const w = tierWords('pension and ISA', wp, pen); if (w) lines.push(w); }
  else for (const w of [tierWords('pension', wp, pen), tierWords('ISA', wi, isa)]) if (w) lines.push(w);
  if (!lines.length) lines.push('nothing to change');
  return { when: `${row.year} (age ${row.age})`, spend: row.spend > 0 ? `${fmt(row.spend)} (${pct(100 * p.level)})` : 'still working', lines, notes: lines.join('; ') };
}
/* the ten years as the table shows them: consecutive years with the same spending and the same words make one row, "2027 to
   2035 (ages 62 to 70)", its words ending ", each year" */
export function aheadRowsWords(rows, ctx) {
  const out = [];
  rows.forEach((r, i) => {
    const w = aheadWords(r, ctx, i ? rows[i - 1].parts : null), last = out[out.length - 1];
    if (last && last.spend === w.spend && last.notes === w.notes) { last.to = r; return; }
    out.push({ ...w, from: r, to: r });
  });
  return out.map(g => (g.from === g.to ? g : {
    ...g, when: `${g.from.year} to ${g.to.year} (ages ${g.from.age} to ${g.to.age})`,
    lines: g.lines.map((l, j) => (j === g.lines.length - 1 ? `${l}, each year` : l))
  }));
}
/* the audit table's action column (Phase 10, item 7): one year's move, short, the spending first where the year has a target;
   null in a year the table chose no move */
const SHORT_DRAW = { 'pa-half': 'half the personal allowance', pa: 'the personal allowance', 'basic-mid': 'mid basic rate', basic: 'the basic-rate limit', hr: 'the taper threshold' };
const SHORT_WRAP = { pa: 'the personal allowance', basic: 'the basic-rate limit', hr: 'the taper threshold', pam: 'half the personal allowance', bm: 'mid basic rate' };
export function ledgerWords(p, spending) {
  if (!p) return null;
  const w = [];
  if (spending) w.push(`spend ${pct(100 * p.level)}`);
  if (p.draw !== 'none') w.push(p.draw === 'any' ? 'pension first' : `pension first, to ${SHORT_DRAW[p.draw] || p.draw}`);
  if (p.harvest) w.push(`pension to ISA, to ${SHORT_WRAP[p.harvest] || p.harvest}`);
  if (p.tierPen) w.push(`pension ${steps(p.tierPen)} safer`);
  if (p.tierIsa) w.push(`ISA ${steps(p.tierIsa)} safer`);
  return w.join(' · ') || 'as planned';
}
export const COME_BACK = 'Come back next year: the plan is worked out again from where your money then stands.';

/* the rule of thumb (item 7): shown only where following it costs under half a point (src/solverDistil.js SHOW_BELOW) */
export function ruleWords(d, { target, fmt }) {
  const lines = d.rules.map(r => `${r.when.length ? `If ${r.when.join(' and ')}: ` : ''}spend ${fmt(r.level * target)} (${pct(100 * r.level)} of your target).`);
  return { title: 'A rule of thumb', lines, note: `It matches the plan's own choice in ${pct(100 * d.fidelity)} of years; following it instead costs ${d.cost > 0 ? `${d.cost.toFixed(1)} points` : 'no points'} of survival on ${d.n.toLocaleString()} markets.` };
}
