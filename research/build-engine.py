# Rebuilds engine.mjs: the engine half of App.jsx, with every helper in the `E` namespace
# re-exported by name so the test suites can `import * as E`.
import os, re, sys

# research/ sits at the repo root, so App.jsx is one level up in src/
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
src = open(os.path.join(REPO, 'src', 'App.jsx')).read().split('\n')

start = next(i for i, l in enumerate(src) if l.startswith("} from 'lucide-react'")) + 1
e_line = next(i for i, l in enumerate(src) if l.startswith('const E = {'))
exports_at = [i for i, l in enumerate(src) if l.startswith('export {')]
# One export statement, on one line. The slice ends at it and the names are regexed off it, so a second
# statement silently truncates the engine and a multi-line one makes the regex return None - which used
# to surface as a bare AttributeError twenty lines later, with the tests still passing against the last
# good engine.mjs. Fail here instead, and say what to do about it.
if len(exports_at) != 1:
    raise SystemExit(f'build-engine: expected exactly one line starting with "export {{" in App.jsx, '
                     f'found {len(exports_at)} (lines {[i + 1 for i in exports_at]}). '
                     'Merge them into the single existing export statement.')
end = exports_at[0]
if '}' not in src[end]:
    raise SystemExit(f'build-engine: the export statement at line {end + 1} spans multiple lines. '
                     'Keep it on one line so its names can be read off it.')

body = src[start:end + 1]
# the UI half may import React components (EditMode); the engine slice must not carry those through
body = [l for l in body if not l.startswith('import ')]

# names already exported by the file's own export statement
already = set(n.strip() for n in re.search(r'export \{(.+?)\}', src[end]).group(1).split(','))
# every key in the E namespace object (all shorthand properties)
e_keys = [k.strip() for k in re.search(r'const E = \{(.+)\};', src[e_line]).group(1).split(',')]
extra = [k for k in e_keys if k and k not in already]

body.append('export { ' + ', '.join(extra) + ' };')
open(os.path.join(HERE, 'engine.mjs'), 'w').write('\n'.join(body))
print(f'engine.mjs rebuilt: lines {start + 1}-{end + 1}, {len(extra)} extra exports')

# simplePlan.js is the adapter between the two apps' plan shapes, and it imports from App.jsx - which
# node cannot load, because of the .jsx extension. It is otherwise plain ES module code, so the only
# thing standing between it and a test suite is that one import line. Emit a copy with the import
# repointed at the engine slice beside it, the same trick this whole file exists to perform.
sp = open(os.path.join(REPO, 'src', 'simplePlan.js')).read()
sp_out = sp.replace("from './App.jsx'", "from './engine.mjs'")
if sp_out == sp:
    raise SystemExit("build-engine: simplePlan.js no longer imports from './App.jsx'; "
                     'update the rewrite in this script to match.')
open(os.path.join(HERE, 'simplePlan.mjs'), 'w').write(sp_out)
print('simplePlan.mjs rebuilt: import repointed at engine.mjs')
