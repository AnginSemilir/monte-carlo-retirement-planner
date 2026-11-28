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

// WCAG contrast, measured against the background that is really behind the text. `opts.layerAll` is a plant for the probe's
// own check alone (restyle-regression-ui.cjs, the planted layers): every earlier positioned sibling over the text composited
// under it, painted beneath it or not, as the D155 fix round's rule did
const CONTRAST_PROBE = (opts) => {
  const layerAll = !!(opts && opts.layerAll);
  const lum = (c) => {
    const [r, g, b] = c;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => { const m = (s || '').match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const over = (fg, bg) => fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
  /*
   * What is behind the text: each ancestor's own background, from the text outward to the first opaque one, AND the positioned
   * layers painted beneath it inside the same parent - an earlier sibling, absolutely placed over the text, its colour at its
   * own opacity. That is how a shaded bar under a label is drawn (Your plan's "In shares" strip: the shade is a layer beside
   * the label, not its parent), which the walk up the ancestors alone read as the card behind it: 1:1 for a label that is
   * really 5.65:1, and 3.85:1 for one it called the same (the D155 fix round, 28 Nov 2026).
   *
   * Only a layer painted beneath the text is composited under it (the reviewer's second look at D155, finding 5; CSS 2.1
   * appendix E): one that is drawn (not visibility hidden, not display none), where the text's element at that level is
   * itself positioned and the layer's z-index is not above its own (z-index auto counted as 0; at the same level the earlier
   * in tree order paints first, so beneath). A positioned layer paints over a later sibling that is not positioned, and a
   * layer with the higher z-index paints over the other: such a layer covers the text rather than backing it, and the walk
   * reads what is behind the layer, as it did before the fix round, so text under a veil still fails. An ancestor's opacity
   * is read by neither rule.
   */
  const zOf = cs => { const z = parseInt(cs.zIndex, 10); return Number.isFinite(z) ? z : 0; };
  const bgOf = (el) => {
    const r0 = el.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let n = el, acc = [255, 255, 255];
    const stack = [];   // innermost first
    while (n && n.nodeType === 1) {
      const ns = getComputedStyle(n);
      const c = parse(ns.backgroundColor);
      if (c && c[3] > 0) stack.push(c);
      if (c && c[3] === 1) break;
      const P = n.parentElement;
      if (P) {
        const sibs = [...P.children];
        for (let k = sibs.indexOf(n) - 1; k >= 0; k--) {
          const s = sibs[k], ss = getComputedStyle(s);
          if (ss.position !== 'absolute' && ss.position !== 'fixed') continue;
          if (!layerAll && (ss.visibility === 'hidden' || ss.display === 'none' || ns.position === 'static' || zOf(ss) > zOf(ns))) continue;
          const sr = s.getBoundingClientRect();
          if (cx < sr.left || cx > sr.right || cy < sr.top || cy > sr.bottom) continue;
          const sc = parse(ss.backgroundColor);
          if (sc && sc[3] > 0) stack.push([sc[0], sc[1], sc[2], sc[3] * (+ss.opacity)]);
        }
      }
      n = P;
    }
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
    // WCAG AA: 4.5:1 for text, 3:1 for large text (24px, or 18.66px bold). This checked 3:1 for
    // everything, which is why 393 caption nodes at 10-12px passed it and failed axe.
    const px = parseFloat(cs.fontSize) || 16, bold = parseInt(cs.fontWeight, 10) >= 700;
    const bar = px >= 24 || (bold && px >= 18.66) ? 3 : 4.5;
    if (ratio < bar) bad.push({ text: own.slice(0, 45), ratio: +ratio.toFixed(2), color: cs.color, size: cs.fontSize, bar });
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
 * A third case, which the standard states and this used to miss: a target "whose size is otherwise
 * constrained by the line-height of non-target text" is exempt outright, not held to 24px. A glossary
 * word inside a heading is that case - it is a word, its height is the line it sits in, and the only way
 * to give it a 44px or even a 24px box is to break the line around it. Which is not hypothetical: the
 * phone's glossary marks were 24x44 buttons for exactly this reason, their boxes overflowed the lines
 * they sat in, the blocks below painted over them, and the definitions could not be opened at all. The
 * app marks these with `inline-control`, the same class that opts them out of the CSS touch floor, so
 * the exemption here is the app's own declaration rather than a guess about the DOM. What replaces this
 * check for them is stronger: phone-ui and desktop-reach both ask what a finger actually hits at the
 * middle of the mark, which is the question this probe never asked.
 *
 * A fourth case the standard states (28 Nov 2026, the reviewer on D155): the EQUIVALENT exception, in 2.5.5 as in 2.5.8. A
 * target under the bar passes where its function is "available through an equivalent link or control on the same page" at
 * the bar. Details' history strip is that case: a start year a cell, under 44px across on a phone (a decade of them to a
 * row), where the Start year box above it picks the same year. The target itself declares it, naming its equivalent by a
 * selector (`data-target-equivalent` on the target, not on a container, so nothing else placed beside it is exempt), and the
 * exemption holds only while a control that selector matches is on the page at the bar in both dimensions: with no such
 * control the target is held to the bar as any other (desktop-reach's and phone-ui's plant 'noequivalent' takes the
 * controls off the page and shows the cells caught).
 *
 * Skips: dev-only chrome, anything explicitly marked data-hit-ok, inline-control, a target whose declared equivalent is on the
 * page at the bar, and anything not laid out.
 * An element also passes if it carries an invisible absolutely-positioned ::before that clears the bar,
 * which is the standard way to keep a control visually small and still tappable.
 */
const TOUCH_PROBE = (min) => {
  const bad = [];
  const INLINE_MIN = 24;
  // a target's declared equivalent (data-target-equivalent, a selector), on the page and at the bar in both dimensions; inside
  // the probe, which page.evaluate sends to the page as its own source
  const EQUIVALENT_AT = (el, bar) => {
    const sel = el.getAttribute('data-target-equivalent');
    if (!sel) return false;
    return [...document.querySelectorAll(sel)].some(alt => {
      if (alt === el) return false;
      const cs = getComputedStyle(alt);
      if (cs.visibility === 'hidden' || cs.display === 'none') return false;
      const r = alt.getBoundingClientRect();
      return r.width >= bar && r.height >= bar;
    });
  };
  const sel = 'button, a[href], input, select, summary, [role="button"]';
  for (const el of document.querySelectorAll(sel)) {
    if (el.closest('[data-dev-chrome]') || el.closest('[data-hit-ok]') || el.hasAttribute('data-hit-ok')) continue;
    if (el.classList.contains('inline-control')) continue;          // a word in a line of text; see above
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 && r.height < 1) continue;                       // not laid out at all
    // embedded in running text? then the inline bar applies
    const inSentence = !!el.parentElement && ['P', 'SPAN', 'LI', 'LABEL'].includes(el.parentElement.tagName);
    const bar = inSentence ? INLINE_MIN : min;
    if (r.width >= bar && r.height >= bar) continue;
    if (EQUIVALENT_AT(el, bar)) continue;                              // WCAG's equivalent exception, declared; see above
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
