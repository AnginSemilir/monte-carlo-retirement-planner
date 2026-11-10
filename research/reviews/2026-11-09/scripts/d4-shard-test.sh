#!/bin/bash
# The split of D4's units between sessions (prototype/d4-shard.diff), tested on the lines the patch adds and nothing else:
# no unit is launched and no result is touched.   bash shard-test.sh <the patched batch-couples.sh> [PLANT=1]
# 1. D4_SHARD unset: the list of units to do is unchanged, in order;
# 2. for n = 1 to 9, on a full list (0 to 519) and on a list with gaps: every unit is in exactly one shard;
# 3. a value that is not i/n with 0 <= i < n is refused with exit 2.
# PLANT=1 turns the filter's == into <=, and check 2 must fail.
set -u
BATCH="$1"
LINES=$(grep -E '^(SHARD=|case "\$SHARD"|\[ "\$\{SHARD%|TODO=\$\(printf)' "$BATCH")
[ "$(printf '%s\n' "$LINES" | grep -c .)" = 4 ] || { echo "FAIL  the patch's four lines not found in $BATCH"; exit 1; }
[ "${PLANT:-0}" = 1 ] && LINES=$(printf '%s\n' "$LINES" | sed 's/\$1 % n == i/$1 % n <= i/')
run() { ( TODO="$1"; if [ "$2" = unset ]; then unset D4_SHARD; else D4_SHARD="$2"; fi; eval "$LINES"; printf '%s\n' $TODO ) ; }
bad=0; ok() { if [ "$1" = 0 ]; then echo "PASS  $2"; else echo "FAIL  $2"; bad=$((bad + 1)); fi; }
FULL=$(seq 0 519); GAPS=$(seq 0 519 | awk '$1 % 7 != 3 && ($1 < 100 || $1 > 163)')
[ "$(run "$FULL" unset)" = "$FULL" ] && [ "$(run "$GAPS" unset)" = "$GAPS" ]; ok $? "D4_SHARD unset: the units to do are unchanged, in order (520, and $(printf '%s\n' $GAPS | grep -c .) with gaps)"
fail=0; cases=0
for LIST in "$FULL" "$GAPS"; do for n in 1 2 3 4 5 6 7 8 9; do
  all=$(for i in $(seq 0 $((n - 1))); do run "$LIST" "$i/$n"; done)
  cases=$((cases + 1))
  [ "$(printf '%s\n' $all | sort -n)" = "$(printf '%s\n' $LIST | sort -n)" ] || fail=$((fail + 1))     # every unit once: no gap, no repeat
done; done
[ "$fail" = 0 ]; ok $? "every unit in exactly one shard: $cases cases (n = 1 to 9, the full list and one with gaps), $fail failing"
r=0; for v in 4/4 5/4 a/b 1/0 /3 3/ 1/2/3 3 -1/4 "1 /4" 1.5/4; do ( TODO="$FULL"; D4_SHARD="$v"; eval "$LINES" ) >/dev/null 2>&1; [ $? = 2 ] || { r=1; echo "      not refused: '$v'"; }; done
ok $r "eleven values that are not i/n with 0 <= i < n are each refused with exit 2"
[ "$(run "$FULL" 3/4 | head -3 | tr '\n' ' ')" = "3 7 11 " ]; ok $? "D4_SHARD=3/4 starts 3, 7, 11"
echo "$([ $bad = 0 ] && echo 'ALL PASS' || echo "FAILED: $bad")${PLANT:+ (planted)}"
exit $([ $bad = 0 ] && echo 0 || echo 1)
