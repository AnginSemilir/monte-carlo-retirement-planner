#!/usr/bin/env bash
# F16's check (LAUNCH-PLAN.md): does a change to the app's screens alone give the solver's worker a new URL, and so a new
# cache key (src/solverWorker.js keys the stored solves on self.location.href)?
#   bash cache-key.sh <a clean worktree of the agent's code at the commit>
# Builds the site as it is, then again with one visible change to a screen: the Config tab's "Reseed" button reads
# "Reseed now" (src/App.jsx, below the engine slice; a code change, since the minifier strips a comment). It prints the
# solver worker's built file name each time, beside the engine slice's hash (research/engine.mjs as
# research/build-engine.py builds it), and restores src/App.jsx afterwards.
# NOT RUN by the review: on 1 Nov the review's container could not resolve registry.npmjs.org, so `npm ci` failed and
# nothing was built. It is for the agent, whose checkout has its dependencies (LAUNCH-PLAN.md F16, step P1 (g)).
set -euo pipefail
WT="$1"; cd "$WT"
[ -z "$(git status --porcelain)" ] || { echo "cache-key: $WT is not clean"; exit 1; }
echo "# bash cache-key.sh at $(git log -1 --format='%h %s' | cut -c1-80)"
[ -d node_modules ] || npm ci --no-audit --no-fund > /tmp/cache-key-npm.log 2>&1
one() {   # label
  python3 research/build-engine.py > /dev/null
  local eng; eng=$(sha256sum research/engine.mjs | cut -c1-12)
  npm run build > /tmp/cache-key-build.log 2>&1 || { tail -20 /tmp/cache-key-build.log; exit 1; }
  local w; w=$(ls dist/assets | grep -E '^solverWorker-.*\.js$' | tr '\n' ' ')
  echo "$1: the solver's worker built as ${w:-NONE}; the engine slice sha256 $eng"
}
one "as committed"
[ "$(grep -c '>Reseed</button>' src/App.jsx)" = 1 ] || { echo "cache-key: the Reseed button is not where it was"; exit 1; }
sed -i 's|>Reseed</button>|>Reseed now</button>|' src/App.jsx
one "the Reseed button's text changed (a screen only)"
git checkout -- src/App.jsx
[ -z "$(git status --porcelain -- src)" ] && echo "src/App.jsx restored"
