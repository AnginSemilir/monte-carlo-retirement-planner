// A LABEL-ONLY EDIT DOES NOT NAME ITS DEPENDANTS (the maintainer's 'unlock enforcement' of 5 Oct, the third: one label,
// 'PROVISIONAL on O96' to 'O96 since resolved', on four rows made the commit answer 19 rows whose substance it did not
// touch). Declared, not inferred: the commit message says
//     relook-label: <id>[, <id> ...]: "<old text>" -> "<new text>"
// and relook.mjs --msg accepts it for a row only when the row's new text is exactly its old text with every <old text>
// replaced by <new text> - nothing else in the row moved - and both texts are short (LABEL_MAX characters) and carry no
// figure (a number outside an item id: a changed figure is never a label). An accepted row's id is then not an item the
// change names, so the rows naming it need no answer; a declaration that does not match its row's change stops the commit.
export const LABEL_MAX = 40;
const ITEM_ID = /\b(O\d{1,3}|[78][a-z]{1,2}|E[1-4]|M\d{1,2}|K\d)\b/g;
export const hasFigure = s => /\d/.test(String(s).replace(ITEM_ID, ''));
export function parseLabels(msgText) {
  const out = [];
  for (const raw of String(msgText).split('\n')) {
    const l = raw.trim();
    const m = /^relook-label:\s*(.+?):\s*"(.*?)"\s*->\s*"(.*?)"\s*$/i.exec(l);
    if (m) out.push({ ids: m[1].split(/[,\s]+/).filter(Boolean), from: m[2], to: m[3], line: l });
  }
  return out;
}
// null when the row's change is exactly the declared substitution; else the reason it is not
export function labelProblem(oldRow, newRow, from, to) {
  if (!from || from === to) return 'the old text is empty or the same as the new';
  if (from.length > LABEL_MAX || to.length > LABEL_MAX) return `a label is at most ${LABEL_MAX} characters`;
  if (hasFigure(from) || hasFigure(to)) return 'a label carries no figure (a number outside an item id)';
  if (oldRow == null || newRow == null) return 'the row is not both removed and added by the change';
  if (!oldRow.includes(from)) return `the old row does not contain "${from}"`;
  if (oldRow.split(from).join(to) !== newRow) return 'the row changed beyond the declared substitution';
  return null;
}
