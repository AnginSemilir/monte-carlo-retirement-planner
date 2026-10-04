#!/bin/bash
# PMAP's preflight (PREDICTION="none:..."): audit-pmap.mjs on the 5 households at 4 wealth points and 20 paths a world, PAR at a
# time (default 1, the light lane), into results/diagpmap-preflight; then reduce-pmap.mjs's parse, gate (the arithmetic held
# to the measured weight read by read, the node check, the control) and reading. No figure is read.
set -u
OUT=research/solver/results/diagpmap-preflight
rm -rf "$OUT"; mkdir -p "$OUT"
seq 0 4 | xargs -P "${PAR:-1}" -I{} sh -c \
  'node research/solver/audit-pmap.mjs 4 20 part {}/5 7002 > research/solver/results/diagpmap-preflight/case{}.txt 2>&1 || echo "household {} failed"'
grep -h "Error" "$OUT"/case*.txt | head -3
node -e "
import('./research/solver/reduce-pmap.mjs').then(R => {
  const fs = require('fs'), d = '$OUT', ts = fs.readdirSync(d).filter(f => /^case\d+\.txt$/.test(f)).map(f => fs.readFileSync(d + '/' + f, 'utf8'));
  if (!ts.length) { console.log('PREFLIGHT PARSE FAILED: no logs (a check on nothing)'); process.exit(1); }
  const us = ts.flatMap(R.parse), bad = R.gate(us);
  if (bad.length) { console.log('PREFLIGHT PARSE FAILED:\n  ' + bad.join('\n  ')); process.exit(1); }
  const off = ts.map((t, i) => t.replace(/dmax 0\.00e\+00/, 'dmax 5.00e-3')).flatMap(R.parse);
  if (!R.gate(off).length) { console.log('PREFLIGHT PARSE FAILED: an arithmetic off the measured weight not refused'); process.exit(1); }
  let n = 0, p = false; R.reading(us, l => { n++; if (/^PANEL/.test(l.trim())) p = true; });
  if (!p) { console.log('PREFLIGHT PARSE FAILED: the reading did not reach its panel line'); process.exit(1); }
  console.log('PREFLIGHT PARSE PASSED: ' + us.length + ' households gated (the arithmetic held to the measured weight on every read, the node check, the control); a planted arithmetic difference refused; the reading reached its panel line (' + n + ' lines, not read)');
});"
