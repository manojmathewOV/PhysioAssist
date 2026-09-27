#!/bin/bash
# REHAB24-6 (Cernek et al., SISAP 2024; CC BY-NC 4.0: non-commercial research only).
# Kept OUTSIDE the repository. Downloads the videos and motion-capture skeletons
# (MD5-checked), computes motion-capture truth, and runs both cameras of the shoulder
# and knee exercises (Ex1 arm abduction, Ex2 arm V-W, Ex5 lunge, Ex6 squat) through
# the app's pose model. Then:
#
#   scripts/fixtures/rehab24_pilot.sh ~/rehab24
#   REHAB24_DIR=~/rehab24 REHAB24_OUT=out.md \
#     npx jest src/testing/videoPatient/__tests__/rehab24.test.ts
#
# Needs: curl, md5sum, unzip, python3 with numpy, mediapipe and opencv-python.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:?usage: $0 OUTPUT_DIR}"
mkdir -p "$OUT/landmarks" && cd "$OUT"
Z=https://zenodo.org/records/13305826/files
for pair in "Segmentation.csv 90b8fbd7445dd050bf27b17126c78fbe" \
  "3d_joints.zip c75ae3fc13fcf16d7f4ca36b93849c74" \
  "videos.zip ed183a245a1b171638e422f7a288e5a8"; do
  set -- $pair
  for try in 1 2 3 4; do
    [ -s "$1" ] && [ "$(md5sum "$1" | cut -d' ' -f1)" = "$2" ] && break
    curl -sS -m 3600 -L -C - -o "$1" "$Z/$1?download=1" || sleep $((5 * try))
  done
  [ "$(md5sum "$1" | cut -d' ' -f1)" = "$2" ] || { echo "checksum failed: $1"; exit 1; }
done
unzip -q -o 3d_joints.zip '*-30fps.npy' -d joints
unzip -q -o videos.zip 'Ex1/*' 'Ex2/*' 'Ex5/*' 'Ex6/*' -d videos
python3 "$ROOT/scripts/fixtures/rehab24_truth.py" joints truth.json

X="$ROOT/scripts/fixtures/video_extract.py"
for f in videos/Ex*/*.mp4; do
  n=$(basename "$f" .mp4)
  id=${n%%-Camera*}
  cam=$(echo "$n" | sed -E 's/.*Camera(1[78]).*/\1/')
  out="landmarks/$id.c$cam.json.gz"
  [ -s "$out" ] || echo "$f $out"
done | xargs -P 3 -L 1 sh -c 'python3 '"$X"' "$0" "$1"'
