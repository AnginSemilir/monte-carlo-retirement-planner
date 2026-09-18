/*
 * A MONEY FIELD THAT READS AS MONEY WHILE YOU TYPE IT.
 *
 * Six digits with no separator is a number you count rather than read, and "350000" in a balance box is
 * exactly that. A plain <input type="number"> cannot carry separators at all, so a money field has to be
 * a text field that formats the text and strips it back to a value on the way out.
 *
 * The separators go in AS YOU TYPE. The obvious objection to that - and the reason this field used to
 * hold raw digits until it lost focus - is the caret: re-rendering "1,234" under a caret sitting after
 * the "2" would send it to the end, and correcting the middle of a figure becomes impossible. The answer
 * is not to avoid formatting but to put the caret back by counting VALUE characters rather than string
 * positions. "How many digits were to my left" survives a separator appearing to their left; "I was at
 * index 3" does not. So the caret is measured with parseFormatted (the exact inverse of the display),
 * the field reformats, and the caret is placed after the same digit it was after before.
 *
 * Deleting a separator therefore does nothing on the first press and deletes the digit before it on the
 * second, which is what every other money field on the web does.
 *
 * It takes the same props an <input type="number"> took and hands `onChange` the same shape - an object
 * whose target.value is a plain number string - so the call sites did not have to change at all.
 *
 * The convention itself, the grouper and the parser that has to be its exact inverse live in App.jsx
 * beside the engine: engine code writes money into its own warnings, and the script that slices that
 * file for the test suites drops every import, so what the engine calls has to be defined in the slice.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { fmtNum, groupDigits, parseFormatted } from './App.jsx';

/*
 * THE POUND SIGN, ONCE THERE IS SOMETHING TO PUT IT IN FRONT OF.
 *
 * An empty money box shows its placeholder; the moment a figure is in it the box says what the figure
 * is, rather than leaving that to a "(£/yr)" in the label above - which is where it used to live, and
 * which is not on screen at all once a form is long enough to scroll.
 *
 * It is part of the DISPLAYED string rather than an adornment beside the field, because an adornment
 * needs a wrapper element and these inputs are handed their own width and padding by forty call sites:
 * a relative wrapper around each one would have to inherit all of it. `parseFormatted` already treats
 * anything that is not a digit as display, so the symbol never reaches the value - and the caret logic
 * counts value characters, so it steps over the symbol the same way it steps over a separator. The one
 * thing it needs told is not to park the caret in front of the sign.
 */
const CURRENCY = '\u00a3';

export function MoneyInput({ value, onChange, onFocus, step, min, max, type, ...rest }) {
  const ref = useRef(null);
  // how many value characters sat to the left of the caret, held from the change to the render after it
  const caretRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const empty = value === '' || value === null || value === undefined;
  // Focused: group the digit string, so a half-typed figure survives. Not focused: the ordinary
  // formatter, so a money field at rest reads exactly like every other figure on the page.
  const body = draft !== null ? groupDigits(draft) : (empty ? '' : fmtNum(value));
  // a minus sign belongs OUTSIDE the symbol: -£1,234, never £-1,234
  const shown = body === '' || body === '-' ? body
    : body.startsWith('-') ? '-' + CURRENCY + body.slice(1)
      : CURRENCY + body;

  useLayoutEffect(() => {
    const el = ref.current;
    const want = caretRef.current;
    caretRef.current = null;
    if (!el || want === null || document.activeElement !== el) return;
    // the first position with that many value characters to its left is where the caret belongs - but
    // never before the currency sign, which is not somewhere a caret can usefully sit
    let i = el.value.startsWith(CURRENCY) ? 1 : 0;
    while (i < el.value.length && parseFormatted(el.value.slice(0, i)).length < want) i++;
    el.setSelectionRange(i, i);
  });

  return (
    <input {...rest} ref={ref} type="text" inputMode="decimal" data-money value={shown}
      onFocus={(e) => { setDraft(empty ? '' : String(value)); if (onFocus) onFocus(e); }}
      onChange={(e) => {
        const raw = e.target.value;
        const at = e.target.selectionStart;
        caretRef.current = at === null ? null : parseFormatted(raw.slice(0, at)).length;
        const plain = parseFormatted(raw);
        setDraft(plain);
        if (onChange) onChange({ target: { value: plain } });
      }}
      onBlur={() => setDraft(null)} />
  );
}
