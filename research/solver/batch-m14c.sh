#!/usr/bin/env bash
# M14c (predictions/m14c-bets.md): does the solver's table misjudge the bets M14b's arm with the tier above made? M14b's
# arm B exactly (TIERSABOVE=1 and every other setting of batch-m14b.sh, the same lambdas, the same 3,000 held paths of
# seed 7011), with BETAUDIT=1: betAudit (record.mjs) first checks the solve reproduces m14b-up's record path for path, then at up
# to 40 first-bet positions simulates the bet against the table's best move without it on 500 fresh paths each.
# Households: S194 S162 S252 (their bets lost in M14b) and S330 (the control: its bets won).
set -u
# CELLS re-runs a subset with the same settings (24 Sep 19:45 UK: a container restart killed S330's bet audit; the other
# three had finished): CELLS="64:0.9457416090031758"
H="${CELLS:-34:2 26:0.1 50:2 64:0.9457416090031758}"
printf '%s\n' $H | xargs -P 4 -I{} sh -c '
  set -- $(echo "{}" | tr ":" " ")
  K=$1; LAM=$2
  env RECORD=1 SOLVERONLY=1 LAMBDA=$LAM SEARCH=400 MIX=3 TIERS=1 ONLY=$K FLOOR=0.8 CONF=0.9 MARGIN=0.005 RAISE=0.003 WR=0 LEVELS=1.2,1.1,1,0.95,0.9,0.8 FINALEXACT=1 RAISESURV=1 FAILSHORT=1 RAISECAP=1.1 MINPOTYEARS=1 PLANTIER="Medium Risk" TIERSABOVE=1 BETAUDIT=1 BETPOS=40 BETPATHS=500 \
    timeout 10800 node research/solver/experiment.mjs flex m14c 30 3000 7001 7011 2>&1 | tail -2'
