/*
 * BROWSER PROBES, SHARED BY THE HARNESSES.
 *
 * These run inside the page via page.evaluate, so they are written as functions with no closure over
 * anything in node. They live here rather than inline in one harness because the phone harness and the
 * desktop regression harness must measure the SAME things the SAME way - a second copy of the contrast
 * maths that drifted by a rounding rule would let a real fault pass on one and fail on the other.
 *
 * Every probe returns plain data, never a DOM node: page.evaluate has to serialise the result.
 */

// WCAG contrast, measured against the background that is really behind the text
const CONTRAST_PROBE = () => {
  const lum = (c) => {
    const [r, g, b] = c;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => { const m = (s || '').match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
  const bgOf = (el) => {
    let n = el, acc = [255, 255, 255];
    const stack = [];
    while (n && n.nodeType === 1) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) stack.push(c); if (c && c[3] === 1) break; n = n.parentElement; }
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
    return acc;
  };
  const bad = [];
  for (const el of document.querySelectorAll('body *')) {
    // the in-page editor is dev-only chrome and never ships, so it is not part of what a visitor sees
    if (el.closest('[data-dev-chrome]')) continue;
    // only elements with their own visible text run
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1).map(n => n.textContent.trim()).join(' ');
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el);
    const f = lum(over(fg, bg)), b = lum(bg);
    const ratio = (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
    if (ratio < 3) bad.push({ text: own.slice(0, 45), ratio: +ratio.toFixed(2), color: cs.color, size: cs.fontSize });
  }
  return bad;
};

// How far the document can scroll sideways. Anything over a pixel is a layout that does not fit.
const OVERFLOW_PROBE = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;

/*
 * The sandbox's amber line, identified by BOTH of its attributes. The nominal and cash series are dashed
 * too, so matching the dash alone counts them and the probe could never read zero - which is exactly the
 * failure a "no line before editing" assertion needs to be able to see.
 */
const AMBER_PROBE = () => {
  const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  if (!svg) return 0;
  return [...svg.querySelectorAll('path')].filter(x => (x.getAttribute('stroke-dasharray') || '') === '6,4'
    && (x.getAttribute('stroke-width') || '') === '3.5').length;
};

// The widest SVG on the page and how wide it is painted, for "is the chart using the screen" checks.
const CHART_WIDTH_PROBE = () => {
  const svg = [...document.querySelectorAll('svg')].sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
  return svg ? Math.round(svg.getBoundingClientRect().width) : 0;
};

/*
 * Controls a finger cannot reliably hit. 44px is the figure both Apple and the WCAG target-size rule
 * land on.
 *
 * An element passes if its own box clears the bar OR it carries an invisible ::before hit area that
 * does - a real technique for keeping a control visually small while making it tappable, and one this
 * app uses for the slide pills, so a probe that ignored it would report false faults.
 *
 * TWO BARS, which is what the standard itself does. A control that stands on its own must clear 44px
 * (WCAG 2.5.5, and Apple's own figure). A control sitting INSIDE a sentence - "…see the evidence →"
 * within a paragraph - is held to 24px instead, which is WCAG 2.5.8's inline exception. That exception
 * exists for a good reason: growing a link in running prose to 44px tall tears a hole in the paragraph
 * around it, so the rule would make the page worse to read in the name of making it easier to tap.
 *
 * Skips: dev-only chrome, anything explicitly marked data-hit-ok, and anything not laid out.
 * An element also passes if it carries an invisible absolutely-positioned ::before that clears the bar,
 * which is the standard way to keep a control visually small and still tappable.
 */
const TOUCH_PROBE = (min) => {
  const bad = [];
  const INLINE_MIN = 24;
  const sel = 'button, a[href], input, select, summary, [role="button"]';
  for (const el of document.querySelectorAll(sel)) {
    if (el.closest('[data-dev-chrome]') || el.closest('[data-hit-ok]') || el.hasAttribute('data-hit-ok')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) continue;                       // not laid out at all
    // embedded in running text? then the inline bar applies
    const inSentence = !!el.parentElement && ['P', 'SPAN', 'LI', 'LABEL'].includes(el.parentElement.tagName);
    const bar = inSentence ? INLINE_MIN : min;
    if (r.width >= bar && r.height >= bar) continue;
    const be = getComputedStyle(el, '::before');
    const bw = parseFloat(be.width) || 0, bh = parseFloat(be.height) || 0;
    if (be.position === 'absolute' && bw >= bar && bh >= bar) continue;
    bad.push({ tag: el.tagName.toLowerCase(), inSentence,
               text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28),
               w: Math.round(r.width), h: Math.round(r.height) });
  }
  return bad;
};

/*
 * The bottom navigation: present, pinned to the bottom, tall enough, and - the part that actually bites -
 * not sitting on top of the page's own content. Scroll to the end first, because that is the only place
 * the last element and the bar can collide.
 */
const NAV_PROBE = () => {
  const nav = document.querySelector('[data-bottomnav]');
  if (!nav) return { present: false };
  const cs = getComputedStyle(nav);
  const r = nav.getBoundingClientRect();
  window.scrollTo(0, document.body.scrollHeight);
  const navTop = nav.getBoundingClientRect().top;
  const last = document.querySelector('[data-app-content]');
  const lastBottom = last ? last.getBoundingClientRect().bottom : null;
  return {
    present: true, fixed: cs.position === 'fixed',
    atBottom: Math.abs(window.innerHeight - r.bottom) <= 1,
    height: Math.round(r.height),
    clear: lastBottom === null ? null : lastBottom <= navTop + 1,
    lastBottom: lastBottom === null ? null : Math.round(lastBottom), navTop: Math.round(navTop)
  };
};

// Computed font size and height of the text inputs, for the iOS focus-zoom rule (anything under 16px
// makes Safari zoom the page when the field is focused, and it never zooms back out).
const INPUT_SIZE_PROBE = () => [...document.querySelectorAll('input[type="text"], input[type="number"]')]
  .filter(el => el.getBoundingClientRect().height > 0)
  .map(el => ({ font: Math.round(parseFloat(getComputedStyle(el).fontSize)), h: Math.round(el.getBoundingClientRect().height) }));

module.exports = { CONTRAST_PROBE, OVERFLOW_PROBE, AMBER_PROBE, CHART_WIDTH_PROBE, TOUCH_PROBE, NAV_PROBE, INPUT_SIZE_PROBE };
