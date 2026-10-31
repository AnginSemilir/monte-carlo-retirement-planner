#!/bin/bash
# E3c's preflight (PREDICTION="none:...": the preflight; the measurement runs under predictions/measure-e3c.md):
# audit-e3c.mjs on all 25 households at 4 points, PAR at a time (default 1, the light lane), into results/diage3c-preflight;
# then reduce-e3c.mjs's parse, gate (at 4 points) and reading through a small parse check. No figure is read.
set -u
OUT=research/solver/results/diage3c-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 24 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-e3c.mjs 4 part {}/25 > research/solver/results/diage3c-preflight/case{}.txt 2>&1 || echo "household {} failed"'
grep -h "Error" "$OUT"/case*.txt | head -3
node -e "
import('./research/solver/reduce-e3c.mjs').then(R => {
  const fs = require('fs'), d = '$OUT', ts = fs.readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).map(f => fs.readFileSync(d + '/' + f, 'utf8'));
  if (!ts.length) { console.log('PREFLIGHT PARSE FAILED: no logs (a check on nothing)'); process.exit(1); }
  const us = ts.flatMap(R.parse), bad = R.gate(us, { pts: 4 });
  if (bad.length) { console.log('PREFLIGHT PARSE FAILED:\n  ' + bad.join('\n  ')); process.exit(1); }
  const dropped = ts.map((t, i) => (i === 0 ? t.replace(/^\s+done\n/m, '') : t)).flatMap(R.parse);
  if (!R.gate(dropped, { pts: 4 }).length) { console.log('PREFLIGHT PARSE FAILED: a dropped done line not refused'); process.exit(1); }
  let n = 0, v = ''; R.reading(us, l => { n++; if (/^VERDICT/.test(l.trim())) v = 'reached'; });
  if (!v) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its verdict'); process.exit(1); }
  console.log('PREFLIGHT PARSE PASSED: ' + us.length + ' households parsed and gated at 4 points; a dropped done line refused; the reading reached its verdict (' + n + ' lines, not read)');
});"
