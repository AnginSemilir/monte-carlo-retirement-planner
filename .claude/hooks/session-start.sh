#!/usr/bin/env bash
#
# SESSION START, RESUME, CLEAR AND AFTER EVERY COMPACTION (the external review of 21 Oct, Part B Step 3). Whatever this
# prints is added to Claude's context. It switches on the repository's git hooks (a fresh clone does not have them),
# prints CI's latest result for the branch (CI was once red for 32 hours unseen), and after a compaction restates the
# checklist and points at STATE.md, which CLAUDE.md imports at start-up but a summary may have dropped.
#
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" 2>/dev/null || exit 0
git config core.hooksPath .githooks 2>/dev/null
BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
CI="$(timeout 15 gh run list --branch "$BR" --limit 3 --json workflowName,status,conclusion,headSha,createdAt \
  --jq '.[] | "\(.workflowName): \(.status) \(.conclusion // "") on \(.headSha[0:7]) at \(.createdAt)"' 2>/dev/null)"
if [ -n "$CI" ]; then echo "CI on $BR, the latest runs:"; echo "$CI"
else echo "CI on $BR: not readable from this container (gh cannot reach it). Read it with the GitHub tools (the Actions runs for the branch) before anything else, and fix a red run first."; fi
SRC="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).source||""))}catch{}})' 2>/dev/null)"
[ "$SRC" = "compact" ] || exit 0
echo "THE CONTEXT WAS JUST COMPACTED. Re-read research/solver/STATE.md in full (where the work stands, the decisions in force, what is running) and the checklist below. Check running background jobs by their task IDs, not by pattern."
cat research/solver/CHECKLIST.md 2>/dev/null
exit 0
