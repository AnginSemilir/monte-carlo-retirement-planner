// triggers.mjs and record-review.mjs's tag rule (RULES.md section 10, the feedback loop): the counts, the retirement pass's
// due rule and the receipt's tag check, each shown able to fail on a planted case.
//   node research/tests/triggers.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { CODES, parseTags, closesOf, passDue, counts, report, dayKey } from '../solver/triggers.mjs';
import { tagProblems } from '../solver/record-review.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
let n = 0;
const ok = (c, name) => { assert.ok(c, name); n++; console.log(`PASS  ${name}`); };

// parsing
ok(JSON.stringify(parseTags('BLOCKING 1. [T:relook] x; MINOR 2. [T:figure] y')) === '{"tags":["relook","figure"],"unknown":[]}', 'two known codes parse in order');
ok(parseTags('[T:nonsense]').unknown[0] === 'nonsense' && parseTags('[T:nonsense]').tags.length === 0, 'an unknown code is reported, not counted');
ok(Object.keys(CODES).every(k => /^[a-z-]+$/.test(k)), 'every code is a plain lower-case word the tag pattern reads');

// closes and the retirement pass
const L = k => Array.from({ length: k }, (_, i) => `## 7x${i} (closed 30 Sep)\n- [T:relook] a -> DROP: once`).join('\n');
ok(closesOf(L(3)).filter(e => e.kind === 'close').length === 3, 'closes are read from their headings');
ok(!passDue(L(4)).due && passDue(L(5)).due, 'the pass is due at the 5th close and not the 4th');
ok(!passDue(L(5) + '\n## Retirement pass 30 Sep\n').due, 'a retirement pass resets the count');
ok(passDue(L(5) + '\n## Retirement pass 30 Sep\n' + L(5)).due, 'and it is due again 5 closes later');

// the windows
const src = [{ name: 'log', lines: [
  { when: '1 Sep', day: dayKey('1 Sep'), text: '[T:figure] old' },
  { when: '29 Sep', day: dayKey('29 Sep'), text: '[T:relook] [T:relook]' },
  { when: '30 Sep', day: dayKey('30 Sep'), text: '[T:c-relook]' }] }];
const lessons = ['## a (closed 28 Sep)', '## b (closed 29 Sep)', '## c (closed 29 Sep)', '## d (closed 30 Sep)', '## e (closed 30 Sep)'].join('\n');
const c = counts(src, lessons, [5, 20]);
ok(c.win[0].get('relook') === 2 && !c.win[0].get('figure') && c.all.get('figure') === 1, 'the last-5 window starts at the 5th-last close and drops older lines');
ok(c.win[1].get('figure') === 1, 'with fewer closes than the window, everything counts');
ok(report(c).length <= 40 && report({ ...c, all: new Map(Object.keys(CODES).map(k => [k, 1])), win: [new Map(), new Map()], last: new Map() }, 40).length <= 40, 'the report holds its 40-line cap');
ok(report(c).some(l => /catches never recorded:.*c-gate/.test(l)), 'a catch never recorded is listed');

// the receipt's tags (record-review.mjs)
ok(tagProblems('none').length === 0, '"none" needs no tag');
ok(tagProblems('BLOCKING 1. [T:relook] O60: stale; MINOR 2. [T:figure] x').length === 0, 'tagged findings pass');
ok(tagProblems('BLOCKING 1. O60: stale').length === 1, 'a finding with no tag is refused');
ok(tagProblems('MINOR 1. [T:bogus] x').length === 1, 'a finding with an unknown code is refused');
ok(tagProblems('BLOCKING 1. [T:relook] a; MINOR 2. b; BACKLOG 3. [T:stale] c').length === 1, 'one untagged finding among tagged ones is refused');
ok(tagProblems('MINOR (carried) 1. [T:carried] x').length === 0, 'a carried finding carries its code');
// end to end: the CLI refuses an untagged verdict before it writes anything (no --verdict write: --check-only)
let refused = false;
try { execFileSync('node', [join(HERE, '../solver/record-review.mjs'), '--check-only', '--verdict', 'pass', '--findings', 'MINOR 1. untagged'], { stdio: 'pipe' }); } catch { refused = true; }
ok(refused, 'the CLI refuses an untagged finding');
execFileSync('node', [join(HERE, '../solver/record-review.mjs'), '--check-only', '--verdict', 'pass', '--findings', 'MINOR 1. [T:stale] tagged'], { stdio: 'pipe' });
ok(true, 'the CLI accepts a tagged finding (check only, nothing written)');
console.log(`${n} passed`);
