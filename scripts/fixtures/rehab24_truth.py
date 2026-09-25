#!/usr/bin/env python3
"""
Motion-capture ground truth for the REHAB24-6 benchmark (local use only; the
dataset is CC BY-NC 4.0 and stays outside the repository).

Reads the OptiTrack skeletons (3d_joints/<Ex>/<video>-30fps.npy: frames x 26
joints x [x, y, z, 1], metres, y up) and writes, per video, the true joint
angles at 30 fps in the app's clinical conventions:

- shoulder: angle between the upper arm (Arm -> ForeArm) and the trunk
  pointing down (Spine1 -> Hips), in 3D (0 = arm by the side)
- knee: 180 - interior angle Hip (UpLeg) - Knee (Leg) - Ankle (Foot), in 3D
  (0 = straight)

Usage:
  python3 scripts/fixtures/rehab24_truth.py JOINTS_DIR OUT.json
"""
import json
import os
import sys

import numpy as np

J = {
    "Hips": 0, "Spine1": 2,
    "LeftArm": 7, "LeftForeArm": 8, "RightArm": 12, "RightForeArm": 13,
    "LeftUpLeg": 16, "LeftLeg": 17, "LeftFoot": 18,
    "RightUpLeg": 21, "RightLeg": 22, "RightFoot": 23,
}


def angle(u, v):
    cos = np.sum(u * v, axis=1) / (np.linalg.norm(u, axis=1) * np.linalg.norm(v, axis=1))
    return np.degrees(np.arccos(np.clip(cos, -1, 1)))


def truth(a):
    p = a[:, :, :3]
    down = p[:, J["Hips"]] - p[:, J["Spine1"]]
    out = {}
    for side in ("Left", "Right"):
        arm = p[:, J[f"{side}ForeArm"]] - p[:, J[f"{side}Arm"]]
        out[f"{side.lower()}_shoulder"] = angle(arm, down)
        thigh = p[:, J[f"{side}UpLeg"]] - p[:, J[f"{side}Leg"]]
        shank = p[:, J[f"{side}Foot"]] - p[:, J[f"{side}Leg"]]
        out[f"{side.lower()}_knee"] = 180 - angle(thigh, shank)
    return {k: [None if np.isnan(x) else round(float(x), 1) for x in v] for k, v in out.items()}


def main():
    root, dest = sys.argv[1], sys.argv[2]
    result = {}
    for ex in sorted(os.listdir(root)):
        for name in sorted(os.listdir(os.path.join(root, ex))):
            if name.endswith("-30fps.npy"):
                result[name.replace("-30fps.npy", "")] = truth(np.load(os.path.join(root, ex, name)))
    with open(dest, "w") as f:
        json.dump({"fps": 30, "videos": result}, f, separators=(",", ":"))
    print(f"{dest}: {len(result)} videos")


if __name__ == "__main__":
    main()
