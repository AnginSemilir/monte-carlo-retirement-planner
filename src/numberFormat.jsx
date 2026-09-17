/*
 * A MONEY FIELD THAT READS AS MONEY WHEN YOU ARE NOT IN IT.
 *
 * Six digits with no separator is a number you count rather than read, and "350000" in a balance box is
 * exactly that. A plain <input type="number"> cannot carry separators at all, so a money field has to be
 * a text field that formats on the way out and strips on the way in.
 *
 * Formatting WHILE somebody types is the obvious approach and the wrong one: re-rendering "1,234" under a
 * caret sitting after the "2" moves the caret to the end, so correcting the middle of a figure becomes
 * impossible. Holding the raw digits for as long as the field has focus avoids that entirely, and the
 * separators appear the moment you leave, which is when they are worth having.
 *
 * It takes the same props an <input type="number"> took and hands `onChange` the same shape - an object
 * whose target.value is a plain number string - so the call sites did not have to change at all.
 *
 * The convention itself, and the parser that has to be its exact inverse, live in App.jsx beside the
 * engine: engine code writes money into its own warnings, and the script that slices that file for the
 * test suites drops every import, so what the engine calls has to be defined in the slice.
 */
import { useState } from 'react';
import { fmtNum, parseFormatted } from './App.jsx';

export function MoneyInput({ value, onChange, onFocus, step, min, max, type, ...rest }) {
  const [draft, setDraft] = useState(null);
  const empty = value === '' || value === null || value === undefined;
  const shown = draft !== null ? draft : (empty ? '' : fmtNum(value));
  return (
    <input {...rest} type="text" inputMode="decimal" data-money value={shown}
      onFocus={(e) => { setDraft(empty ? '' : String(value)); if (onFocus) onFocus(e); }}
      onChange={(e) => { const raw = e.target.value; setDraft(raw); if (onChange) onChange({ target: { value: parseFormatted(raw) } }); }}
      onBlur={() => setDraft(null)} />
  );
}
