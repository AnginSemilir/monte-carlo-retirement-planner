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
# the watchdog (the launch plan of 1 Nov, B14): the branch's latest run of the full tier (.github/workflows/full.yml),
# warned when it is red, or more than 24 hours older than the branch's head (the commit it tested against HEAD)
FULL="$(timeout 15 gh run list --workflow full.yml --branch "$BR" --limit 1 --json status,conclusion,headSha,createdAt 2>/dev/null)"
if [ $? -ne 0 ] || [ -z "$FULL" ]; then
  echo "The full tier on $BR: not readable from this container. Read the branch's latest run of the Full workflow with the GitHub tools: if it is red, or tested a commit more than 24 hours older than the branch's head, that comes first."
else
  HEAD_T="$(git log -1 --format=%ct HEAD 2>/dev/null)"
  RUN_SHA="$(printf '%s' "$FULL" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const r=JSON.parse(s)[0];process.stdout.write(r?r.headSha:"")}catch{}})' 2>/dev/null)"
  RUN_T="$( [ -n "$RUN_SHA" ] && git log -1 --format=%ct "$RUN_SHA" 2>/dev/null)"
  printf '%s' "$FULL" | HEAD_T="$HEAD_T" RUN_T="$RUN_T" BR="$BR" node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      let r; try { r = JSON.parse(s)[0]; } catch { r = undefined; }
      const br = process.env.BR;
      if (!r) { console.log(`WATCHDOG: the full tier has no run on ${br} yet: push, or run the Full workflow by hand.`); return; }
      const sha = String(r.headSha || "").slice(0, 7), head = Number(process.env.HEAD_T);
      const at = Number(process.env.RUN_T) || Math.floor(Date.parse(r.createdAt) / 1000);
      console.log(`The full tier on ${br}, its latest run: ${r.status} ${r.conclusion || ""} on ${sha} at ${r.createdAt}`);
      if (r.status === "completed" && r.conclusion !== "success") console.log(`WATCHDOG: the full tier is red on ${br} (${r.conclusion} on ${sha}): fix it first.`);
      if (head && at && head - at > 86400) console.log(`WATCHDOG: the full tier on ${br} last ran on ${sha}, ${((head - at) / 3600).toFixed(1)} hours older than the head of the branch: run it on the head.`);
    });' 2>/dev/null
fi
# the protected files changed in the last day, for the maintainer's review (the follow-up review of 22 Oct, answer 5:
# the pre-tool hook refuses by exact path only; this list shows a change made any other way)
echo "Protected files changed in the last day (the hooks, CI, CLAUDE.md, the checklist, the launcher, the fair-test gate, the verification suite, the archive):"
node .claude/hooks/protected-changes.mjs --since="24 hours ago" 2>/dev/null | head -40
SRC="$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).source||""))}catch{}})' 2>/dev/null)"
[ "$SRC" = "compact" ] || exit 0
echo "THE CONTEXT WAS JUST COMPACTED. Re-read research/solver/STATE.md in full (where the work stands, the decisions in force, what is running) and the checklist below. Check running background jobs by their task IDs, not by pattern."
cat research/solver/CHECKLIST.md 2>/dev/null
exit 0
