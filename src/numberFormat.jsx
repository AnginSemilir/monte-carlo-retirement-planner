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

export function MoneyInput({ value, onChange, onFocus, step, min, max, type, ...rest }) {
  const ref = useRef(null);
  // how many value characters sat to the left of the caret, held from the change to the render after it
  const caretRef = useRef(null);
  const [draft, setDraft] = useState(null);
  const empty = value === '' || value === null || value === undefined;
  // Focused: group the digit string, so a half-typed figure survives. Not focused: the ordinary
  // formatter, so a money field at rest reads exactly like every other figure on the page.
  const shown = draft !== null ? groupDigits(draft) : (empty ? '' : fmtNum(value));

  useLayoutEffect(() => {
    const el = ref.current;
    const want = caretRef.current;
    caretRef.current = null;
    if (!el || want === null || document.activeElement !== el) return;
    // the first position with that many value characters to its left is where the caret belongs
    let i = 0;
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
