#!/bin/bash
# MobiPhysio pilot data (CC0 1.0, doi:10.7910/DVN/XSI0QN), kept OUTSIDE the repository:
# the videos show identifiable people. Downloads the clips listed in the committed
# manifest (MD5-checked), then runs each through the app's pose model, plus paired
# stress tests on six clean clips. Then run the benchmark:
#
#   scripts/fixtures/mobiphysio_pilot.sh ~/mobiphysio
#   MOBIPHYSIO_DIR=~/mobiphysio PILOT_OUT=out.md \
#     npx jest src/testing/videoPatient/__tests__/mobiphysioPilot.test.ts
#
# Needs: curl, md5sum, python3 with mediapipe and opencv-python.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:?usage: $0 OUTPUT_DIR}"
mkdir -p "$OUT/raw" "$OUT/landmarks" "$OUT/robustness"
cp "$ROOT/docs/benchmarks/mobiphysio-pilot-manifest.json" "$OUT/manifest.json"
cd "$OUT"

python3 -c "import json; [print(v['id'], v['md5'], v['file']) for v in json.load(open('manifest.json'))['videos']]" |
  while read -r id md5 file; do
    if [ -s "raw/$file" ] && [ "$(md5sum "raw/$file" | cut -d' ' -f1)" = "$md5" ]; then continue; fi
    for try in 1 2 3; do
      curl -sS -m 600 -L -o "raw/$file" "https://dataverse.harvard.edu/api/access/datafile/$id" &&
        [ "$(md5sum "raw/$file" | cut -d' ' -f1)" = "$md5" ] && break
      echo "retry $file ($try)"; sleep $((10 * try))
    done
    [ "$(md5sum "raw/$file" | cut -d' ' -f1)" = "$md5" ] || { echo "checksum failed: $file"; exit 1; }
  done

X="$ROOT/scripts/fixtures/video_extract.py"
{
  for f in raw/*.mp4; do n=$(basename "$f" .mp4); echo "$f landmarks/$n.json.gz none"; done
  for n in E01_P02_AF_VFL_GM E01_P05_AF_VFL_GM E01_P09_AF_VFL_GF E01_P13_AF_VFL_GF E01_P18_AF_VFL_GM E01_P53_AF_VFL_GF; do
    for t in r720 r480 dark backlit jpeg shake crop mirror; do echo "raw/$n.mp4 robustness/$n.$t.json.gz $t"; done
  done
} | while read -r src out t; do [ -s "$out" ] || echo "$src $out $t"; done |
  xargs -P 3 -L 1 sh -c 'python3 '"$X"' "$0" "$1" --transform "$2"'
