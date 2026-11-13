#!/bin/bash
# THE RE-RUN'S BACKUP (registrations/couples-d4b.md, where it runs; the review of 9 Nov, item 1, part 3, step 3; D63's rule for
# D4, carried to the re-run): every MINUTES (30), each finished chunk of the run's folder (its log holding a done line, and the
# arrays file its log names) copied byte for byte to a worktree of the orphan branch BRANCH and pushed, with a heartbeat (the
# time, and the numbers of the chunks in flight). Nothing of a chunk is read but whether its log holds a done line: an arrays
# file is copied with cp -p, compared with cmp and tested with gzip -t (its integrity, nothing printed), never decompressed to
# be read; no log line is printed. Run inside the tracked task beside the batch, so a turn of the model never runs it:
#   bash research/solver/backup-chunks.sh <the run's folder> <branch> [minutes] &   then the batch, then: kill %1; one last
#   bash research/solver/backup-chunks.sh <folder> <branch> once
# The branch is never merged, and goes after the run's read (D63).
set -u
DIR="$1"; BRANCH="$2"; MIN="${3:-30}"
WT="${BACKUP_WT:-/home/user/$BRANCH-wt}"
[ -d "$DIR" ] || { echo "backup-chunks: no folder $DIR"; exit 2; }
case "$BRANCH" in d4b-backup*) ;; *) echo "backup-chunks: the branch must be a d4b-backup one, not '$BRANCH'"; exit 2;; esac
if [ ! -d "$WT/.git" ] && [ ! -f "$WT/.git" ]; then
  if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
    git fetch -q origin "$BRANCH" && git worktree add -q "$WT" "origin/$BRANCH" && (cd "$WT" && git checkout -q -B "$BRANCH")
  else
    git worktree add -q --detach "$WT" && (cd "$WT" && git checkout -q --orphan "$BRANCH" && git rm -rq --cached . >/dev/null 2>&1; find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} + )
  fi
fi
# each chunk's arrays file by its number, from the audit's own list (no log is read for it)
FILES=$(node research/solver/audit-couples.mjs --unit-files) || { echo "backup-chunks: no unit list"; exit 2; }
once() {
  local n=0 flight=""
  for log in "$DIR"/case*.txt; do
    [ -f "$log" ] || continue
    local k; k=$(basename "$log" .txt); k=${k#case}
    if grep -qE '^ +done ' "$log"; then
      local f; f=$(printf '%s\n' "$FILES" | awk -v k="$k" '$1 == k { print $2 }')
      [ -f "$DIR/$f" ] || continue
      for x in "$log" "$DIR/$f"; do
        local y="$WT/$(basename "$x")"
        if [ ! -f "$y" ] || ! cmp -s "$x" "$y"; then cp -p "$x" "$y" && cmp -s "$x" "$y" || { echo "backup-chunks: the copy of $(basename "$x") differs"; return 1; }; n=$((n + 1)); fi
      done
      gzip -t "$WT/$f" || { echo "backup-chunks: $f fails gzip -t"; return 1; }
    else
      flight="$flight $k"
    fi
  done
  [ -f "$DIR/stage2.json" ] && { cmp -s "$DIR/stage2.json" "$WT/stage2.json" || { cp -p "$DIR/stage2.json" "$WT/stage2.json"; n=$((n + 1)); }; }
  echo "$(date -u +%FT%TZ) in flight:${flight:- none}" > "$WT/heartbeat.txt"
  (cd "$WT" && git add -A . && git commit -qm "backup: $n files, $(date -u +%FT%TZ)" && git push -q origin "$BRANCH") >/dev/null 2>&1 || (cd "$WT" && git push -q origin "$BRANCH" >/dev/null 2>&1) || echo "backup-chunks: the push failed at $(date -u +%T); the next try in $MIN minutes"
  echo "backup-chunks: $(date -u +%T) $n files copied; $(ls "$WT" | grep -c '\.json\.gz$') arrays files on $BRANCH"
}
if [ "${MIN}" = once ]; then once; exit $?; fi
while true; do once; sleep $((MIN * 60)); done
