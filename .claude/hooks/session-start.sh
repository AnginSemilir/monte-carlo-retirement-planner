#!/usr/bin/env bash
#
# SESSION START, RESUME, CLEAR AND AFTER EVERY COMPACTION (research/solver/RULES.md, layer 3). Whatever this prints is
# added to Claude's context. Rules present after a compaction can stop being followed while an imperative message from
# this hook is (claude-code issue 95745), so the checklist is restated here every time, not left to CLAUDE.md alone.
# It also switches on the repository's git hooks (.githooks/pre-commit), which a fresh clone does not have.
#
cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" 2>/dev/null || exit 0
git config core.hooksPath .githooks 2>/dev/null
SRC="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).source||""))}catch{}})' 2>/dev/null)"
if [ "$SRC" = "compact" ]; then
  echo "THE CONTEXT WAS JUST COMPACTED. Before anything else, re-read the checklist below and follow it: the summary may have dropped rules. Check running background jobs by their task IDs, not by pattern."
fi
echo "PROJECT RULES for the solver research - every run, every result, every plan update. They are enforced (the launcher, the reducers' fair-test gate, check-plan.mjs in the pre-commit hook, GitHub CI and the Stop hook, and the plan-auditor review); in full: research/solver/RULES.md."
cat research/solver/CHECKLIST.md 2>/dev/null
echo "After any change to research/solver/PLAN.md, run the plan-auditor agent: the Stop hook will not let a turn end without its receipt for the plan as it stands."
exit 0
