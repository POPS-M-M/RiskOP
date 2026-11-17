#!/bin/bash
# Chaîne complète pour les îles prototypes : scènes sources → exports → copie à côté de la page de test
cd "$(dirname "$0")"; L=../out/pipeline.log; : > $L
for isl in "$@"; do
  echo "== $isl build $(date +%T)" >> $L; python3 build_$isl.py 2>&1 | grep -E "ok |Error|Traceback|line [0-9]" >> $L
  echo "== $isl export $(date +%T)" >> $L; python3 export_island.py $isl > ../out/${isl}_export.log 2>&1
  grep -E "^l[123] |^ville|^lod|EXPORT|Error|Traceback|line [0-9]" ../out/${isl}_export.log >> $L
done
python3 pack_for_game.py >> $L 2>&1; echo "== fin $(date +%T)" >> $L
