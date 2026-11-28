/*
 * THE "IN SHARES" STRIP'S LABELS CLEAR WCAG'S 4.5:1 AT EVERY SHARE, IN EVERY THEME (the D155 fix round, 28 Nov 2026).
 *
 * Your plan's strip (src/PlannerMore.jsx TierStrip) shades each stretch of a wrapper's life by its share in shares: an
 * indigo layer at opacity 0.15 + 0.85 x share over the card, the share written on it, white-ish text from 60% and dark
 * below. On the shade alone a label from about 50 to 80% fell under 4.5:1 in one theme or another (white on 70% at 3.85:1
 * in the light theme, 3.93:1 in sepia; light text on 50% at about 4.3:1 in the dark), which the browser harness's
 * contrast probe could not see while it read the card behind the label and not the shade (restyle-regression-ui.cjs and
 * lib/probes.cjs since the fix). The label now carries a quarter of the colour opposite its own behind it. The harness
 * reads the shares one household holds; this reads every whole share from 0 to 100, on the palette index.html defines for
 * each theme, by the formula the strip draws with, which check 1 reads from the source.
 *
 *   1. the strip draws as this test assumes: the shade's opacity, the 60% threshold, each label's colour and its backing;
 *   2. every share 0..100 in the light, dark and sepia themes: the label clears 4.5:1 on its block (11px text, not large).
 * Planted (STRIP_PLANT=nochip: the backing taken off, the strip as it stood before the fix), check 2 fails, at the shares the
 * fix is for (55 of them, the weakest the light theme's 60% at 3.20:1).
 *
 *   node research/tests/strip-contrast.test.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PLANT = process.env.STRIP_PLANT || '';
let fails = 0;
const ok = (n, label, cond, detail = '') => { console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${n}. ${label}${detail ? `   ${detail}` : ''}`); if (!cond) fails++; };

// 1. the strip, as drawn
const src = readFileSync(join(ROOT, 'src/PlannerMore.jsx'), 'utf8');
const tier = src.slice(src.indexOf('function TierStrip'), src.indexOf('function TierStrip') + 4000);
const shade = /bg-indigo-700" style=\{\{ opacity: 0\.15 \+ 0\.85 \* \(r\.v \/ 100\) \}\}/.test(tier);
const label = /r\.v >= 60 \? 'text-surface bg-slate-900\/25' : 'text-slate-900 bg-surface\/25'/.test(tier);
ok(1, 'the strip draws as this test assumes: the shade at 0.15 + 0.85 x share, the label light from 60% with a quarter of slate-900 behind it, dark below with a quarter of the surface', shade && label, `shade ${shade}, label ${label}`);

// the themes' palette, from index.html (each token "r g b")
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const block = start => { const i = html.indexOf(start); return i < 0 ? '' : html.slice(i, html.indexOf('}', i)); };
const token = (b, name) => { const m = new RegExp(`--${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`).exec(b); return m ? [+m[1], +m[2], +m[3]] : null; };
const THEMES = { light: block(':root {'), dark: block('html[data-theme="dark"] {'), sepia: block('html[data-theme="sepia"] {') };
const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const over = (fg, a, bg) => fg.map((v, i) => v * a + bg[i] * (1 - a));
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const BACKING = PLANT === 'nochip' ? 0 : 0.25;

// 2. every share in every theme
let worst = null;
const under = [];
for (const [name, b] of Object.entries(THEMES)) {
  const surface = token(b, 'surface'), slate = token(b, 'slate-900'), indigo = token(b, 'indigo-700');
  if (!surface || !slate || !indigo) { ok(2, `the ${name} theme's palette read from index.html`, false, `surface ${surface}, slate-900 ${slate}, indigo-700 ${indigo}`); continue; }
  for (let v = 0; v <= 100; v++) {
    const bar = over(indigo, 0.15 + 0.85 * (v / 100), surface);
    const light = v >= 60, text = light ? surface : slate, behind = over(light ? slate : surface, BACKING, bar);
    const r = ratio(text, behind);
    if (!worst || r < worst.r) worst = { r, v, name };
    if (r < 4.5) under.push(`${name} ${v}% ${r.toFixed(2)}:1`);
  }
}
ok(2, 'every share from 0 to 100, in the light, dark and sepia themes: the label clears 4.5:1 on its block', under.length === 0,
  `${under.length} under${under.length ? `: ${under.slice(0, 4).join(', ')}${under.length > 4 ? ', ...' : ''}` : ''}; the weakest ${worst ? `${worst.name} ${worst.v}% at ${worst.r.toFixed(2)}:1` : 'none'}`);

console.log(fails ? `\n${fails} FAILED${PLANT ? ` (planted: ${PLANT})` : ''}` : `\nALL PASS: ${2} checks`);
process.exit(fails ? 1 : 0);
