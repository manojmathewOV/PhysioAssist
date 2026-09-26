#!/usr/bin/env python3
"""
Run real video through the app's pose model and save what the app would receive.

Uses the MediaPipe Tasks Pose Landmarker in VIDEO mode with the exact model
bundled in the app (assets/models/pose_landmarker_full.task, checksum recorded)
and the app's options (1 pose, 0.5 detection/presence/tracking confidence, the
react-native-mediapipe defaults). Each output frame holds the same fields the
app's MediaPipe bridge delivers: 33 image landmarks (x, y, z, visibility,
presence), 33 world landmarks, and the frame size, plus inference time.

Optional --transform applies a paired stress test to every frame (the movement
is unchanged, only the pixels): r720, r480, dark, backlit, jpeg, shake, crop,
mirror.

Usage:
  python3 scripts/fixtures/video_extract.py VIDEO OUT.json.gz [--fps 15] [--transform NAME]
"""
import argparse
import gzip
import hashlib
import json
import math
import os
import random
import time

import cv2
import mediapipe as mp
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL = os.path.join(ROOT, "assets", "models", "pose_landmarker_full.task")


def make_transform(name: str, seed: int = 7):
    rng = random.Random(seed)
    state = {"dx": 0.0, "dy": 0.0, "rot": 0.0}

    def resize(img, height):
        h, w = img.shape[:2]
        s = height / min(h, w)
        return cv2.resize(img, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)

    def f(img):
        if name == "r720":
            return resize(img, 720)
        if name == "r480":
            return resize(img, 480)
        if name == "dark":
            # About 3 stops under-exposed, with sensor noise
            out = img.astype(np.float32) * 0.18 + np.random.default_rng(1).normal(0, 3, img.shape)
            return np.clip(out, 0, 255).astype(np.uint8)
        if name == "backlit":
            # Bright window behind: a white gradient over the frame, subject darker
            h, w = img.shape[:2]
            grad = np.linspace(0.85, 0.2, w, dtype=np.float32)[None, :, None]
            out = img.astype(np.float32) * 0.55 * (1 - grad) + 255 * grad
            return np.clip(out, 0, 255).astype(np.uint8)
        if name == "jpeg":
            ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 12])
            return cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if name == "shake":
            # Handheld: smoothed random walk of up to ~3% translation and 3 degrees
            h, w = img.shape[:2]
            for k, lim in (("dx", 0.03 * w), ("dy", 0.03 * h), ("rot", 3.0)):
                state[k] = max(-lim, min(lim, 0.85 * state[k] + rng.gauss(0, lim / 4)))
            m = cv2.getRotationMatrix2D((w / 2, h / 2), state["rot"], 1.0)
            m[0, 2] += state["dx"]
            m[1, 2] += state["dy"]
            return cv2.warpAffine(img, m, (w, h), borderMode=cv2.BORDER_REFLECT)
        if name == "crop":
            # Phone too close / tilted up: the lower third of the body is out of frame
            h = img.shape[0]
            return img[: int(h * 0.62)]
        if name == "mirror":
            return cv2.flip(img, 1)
        return img

    return f


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--fps", type=float, default=15)
    ap.add_argument("--transform", default="none")
    args = ap.parse_args()

    model_md5 = hashlib.md5(open(MODEL, "rb").read()).hexdigest()
    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=MODEL),
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    transform = make_transform(args.transform)
    cap = cv2.VideoCapture(args.video)
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30
    step = max(1, round(src_fps / args.fps))
    frames = []
    width = height = None
    index = 0
    with mp.tasks.vision.PoseLandmarker.create_from_options(options) as landmarker:
        while True:
            ok, bgr = cap.read()
            if not ok:
                break
            if index % step:
                index += 1
                continue
            t_ms = int(round(index / src_fps * 1000))
            bgr = transform(bgr)
            height, width = bgr.shape[:2]
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
            start = time.perf_counter()
            result = landmarker.detect_for_video(image, t_ms)
            ms = (time.perf_counter() - start) * 1000
            if result.pose_landmarks:
                img = [
                    [round(p.x, 4), round(p.y, 4), round(p.z, 4), round(p.visibility or 0, 3), round(p.presence or 0, 3)]
                    for p in result.pose_landmarks[0]
                ]
                world = [[round(p.x, 3), round(p.y, 3), round(p.z, 3)] for p in result.pose_world_landmarks[0]]
                frames.append([t_ms, round(ms, 1), img, world])
            else:
                frames.append([t_ms, round(ms, 1), None, None])
            index += 1
    cap.release()
    out = {
        "video": os.path.basename(args.video),
        "transform": args.transform,
        "width": width,
        "height": height,
        "fps": round(src_fps / step, 3),
        "model": "pose_landmarker_full.task",
        "modelMd5": model_md5,
        "mediapipe": mp.__version__,
        "options": {"numPoses": 1, "minPoseDetectionConfidence": 0.5, "minPosePresenceConfidence": 0.5, "minTrackingConfidence": 0.5},
        "frames": frames,
    }
    with gzip.open(args.out, "wt", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"))
    detected = sum(1 for fr in frames if fr[2] is not None)
    print(f"{args.out}: {len(frames)} frames, {detected} with a pose, {width}x{height}, "
          f"{np.median([fr[1] for fr in frames]) if frames else 0:.0f} ms median")


if __name__ == "__main__":
    main()
