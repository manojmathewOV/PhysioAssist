#!/usr/bin/env python3
"""
Prepare real-human pose fixtures from the open telerehabilitation dataset:

  Clemente C. et al. "Feasibility of 3D Body Tracking from Monocular 2D Video
  Feeds in Musculoskeletal Telerehabilitation". Sensors 2024, 24(1):206.
  https://doi.org/10.3390/s24010206  Data: https://doi.org/10.5281/zenodo.10408307
  Licence: CC BY 4.0 (attribution required; derivatives allowed).

8 healthy adults, 8 physiotherapy exercises, 2 sets x 7 repetitions each,
filmed at 30 fps and run through MediaPipe Pose (12 world landmarks per frame),
with synchronised Qualisys motion capture (100 Hz) as ground truth.

Each fixture keeps the MediaPipe world landmarks (downsampled, rounded) and the
ground-truth joint amplitude series computed exactly as the paper's Table 3.
No video or images are included (the dataset has none).

Usage:
  python3 scripts/fixtures/telerehab_prepare.py OUT_DIR [--subjects 1,2] [--fps 15]
"""
import argparse
import gzip
import hashlib
import io
import json
import math
import os
import sys
import urllib.request
import zipfile

RECORD = "https://zenodo.org/records/10408307/files/3D-HPE-dataset.zip?download=1"
MD5 = "89a21b4281b0fed32bbb7d9854b2c3aa"
CACHE = os.path.expanduser("~/.cache/physioassist/3D-HPE-dataset.zip")

# Table 1 of the paper (file name = <subject><exercise>.txt)
EXERCISES = {
    1: ("shoulder_flexion", "sagittal", "right_shoulder"),
    2: ("shoulder_abduction", "frontal", "right_shoulder"),
    3: ("elbow_flexion", "sagittal", "right_elbow"),
    4: ("shoulder_press", "frontal", "right_shoulder"),
    5: ("hip_abduction", "frontal", "right_hip"),
    6: ("squat", "sagittal", "right_knee"),
    7: ("march", "sagittal", "right_hip"),
    8: ("seated_knee_extension", "sagittal", "right_knee"),
}
# Order of the 12 MediaPipe world landmarks in data_pos_mediapipe/*.txt
MP_JOINTS = [
    "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist",
    "right_wrist", "left_hip", "right_hip", "left_knee", "right_knee",
    "left_ankle", "right_ankle",
]


def fetch_zip() -> bytes:
    if not os.path.exists(CACHE):
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        req = urllib.request.Request(RECORD, headers={"User-Agent": "PhysioAssistFixtures/1.0"})
        with urllib.request.urlopen(req, timeout=600) as r, open(CACHE, "wb") as f:
            f.write(r.read())
    data = open(CACHE, "rb").read()
    digest = hashlib.md5(data).hexdigest()
    if digest != MD5:
        sys.exit(f"checksum mismatch: {digest} != {MD5}")
    return data


def read_qualisys(text: str):
    lines = text.splitlines()
    start = max(i for i, l in enumerate(lines) if l.startswith("DATA_TYPES"))
    rows = []
    for l in lines[start + 1:]:
        if not l.strip():
            continue
        vals = [float(v) if v not in ("", "NaN") else math.nan for v in l.split("\t")]
        rows.append([vals[i:i + 3] for i in range(0, len(vals), 3)])
    return rows  # frames x markers x (x, y, z) in mm; lab axes: X lateral, Y antero-posterior, Z up


def angle_deg(u, v):
    nu = math.hypot(*u)
    nv = math.hypot(*v)
    if nu == 0 or nv == 0:
        return math.nan
    c = max(-1.0, min(1.0, sum(a * b for a, b in zip(u, v)) / (nu * nv)))
    return math.degrees(math.acos(c))


def ground_truth(exercise: int, markers):
    """Joint amplitude per Table 3: segment projected on the plane of movement,
    angle to the reference direction (vertical down unless stated)."""
    plane = EXERCISES[exercise][1]
    keep = (0, 2) if plane == "frontal" else (1, 2)  # frontal: X-Z, sagittal: Y-Z

    def proj(v):
        return [v[keep[0]], v[keep[1]]]

    down = [0.0, -1.0]
    # Marker order isn't consistent between recordings: identify them by anatomy.
    # Squat: hip, knee, ankle from top to bottom. Otherwise the proximal joint
    # (shoulder, elbow, hip, knee) is the one that moves least.
    n = len(markers[0]) if markers else 0

    def column(i):
        return [m[i] for m in markers if not any(math.isnan(c) for c in m[i])]

    if exercise == 6:
        order = sorted(range(n), key=lambda i: -sum(p[2] for p in column(i)) / max(1, len(column(i))))
    else:
        def spread(i):
            pts = column(i)
            return sum(max(p[k] for p in pts) - min(p[k] for p in pts) for k in range(3)) if pts else 0
        order = sorted(range(n), key=spread)[:2]
    markers = [[m[i] for i in order] for m in markers]
    out = []
    for m in markers:
        if any(math.isnan(c) for p in m for c in p):
            out.append(None)
            continue
        if exercise == 6:  # squat: knee->hip vs foot->knee (markers: hip, knee, ankle)
            hip, knee, ankle = m
            a = angle_deg(proj([h - k for h, k in zip(hip, knee)]), proj([k - a_ for k, a_ in zip(knee, ankle)]))
        else:  # segment joint1 -> joint2 against vertical down
            j1, j2 = m[0], m[1]
            a = angle_deg(proj([b - a_ for a_, b in zip(j1, j2)]), down)
        out.append(None if math.isnan(a) else round(a, 1))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--subjects", default="1,2")
    ap.add_argument("--fps", type=int, default=15)
    args = ap.parse_args()
    subjects = [int(s) for s in args.subjects.split(",")]
    z = zipfile.ZipFile(io.BytesIO(fetch_zip()))
    os.makedirs(args.out, exist_ok=True)
    step_mp = max(1, round(30 / args.fps))
    step_gt = max(1, round(100 / 10))  # ground truth at 10 Hz
    written = []
    for s in subjects:
        for e, (name, plane, joint) in EXERCISES.items():
            mp_path = f"3D-HPE-dataset/data_pos_mediapipe/{s}{e}.txt"
            if mp_path not in z.namelist():
                continue
            rows = [l.split() for l in z.read(mp_path).decode().splitlines() if l.strip()]
            frames = []
            for r in rows[::step_mp]:
                frame_no = int(float(r[0]))
                xyz = [round(float(v), 3) for v in r[1:]]
                frames.append([round(frame_no / 30 * 1000)] + xyz)
            gt_rows = read_qualisys(z.read(f"3D-HPE-dataset/data_pos_qualisys/{s}{e}.txt").decode())
            gt = ground_truth(e, gt_rows)[::step_gt]
            fixture = {
                "source": "Clemente et al., Sensors 2024, 24(1):206; doi:10.5281/zenodo.10408307",
                "license": "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)",
                "note": "MediaPipe Pose world landmarks (metres, hip-centred, XY parallel to the camera); "
                        "ground truth from Qualisys markers per the paper's Table 3. Derived and downsampled.",
                "subject": s,
                "exercise": name,
                "exerciseNumber": e,
                "plane": plane,
                "evaluatedJoint": joint,
                "camera": "frontal, parallel to the body" if plane == "frontal" else "35 degrees to the frontal plane",
                "repetitions": 14,
                "repetitionsNote": "2 sets of 7; some trials may be incomplete",
                "joints": MP_JOINTS,
                "fps": round(30 / step_mp, 2),
                "frames": frames,
                "groundTruthHz": 10,
                "groundTruthDegrees": gt,
            }
            path = os.path.join(args.out, f"s{s}-{name}.json.gz")
            with gzip.open(path, "wt", encoding="utf-8") as f:
                json.dump(fixture, f, separators=(",", ":"))
            written.append((path, os.path.getsize(path)))
    for p, size in written:
        print(f"{p}  {size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
