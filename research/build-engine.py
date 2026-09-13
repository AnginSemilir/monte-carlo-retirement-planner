# Rebuilds engine.mjs: the engine half of App.jsx, with every helper in the `E` namespace
# re-exported by name so the test suites can `import * as E`.
import os, re, sys

# research/ sits at the repo root, so App.jsx is one level up in src/
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
src = open(os.path.join(REPO, 'src', 'App.jsx')).read().split('\n')

start = next(i for i, l in enumerate(src) if l.startswith("} from 'lucide-react'")) + 1
e_line = next(i for i, l in enumerate(src) if l.startswith('const E = {'))
end = next(i for i, l in enumerate(src) if l.startswith('export {'))

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
