"""Benchmark BlazePose lite/full/heavy and MoveNet Lightning on COCO val2017 people.

Metrics vs human-annotated COCO keypoints (17 shared points):
  - detection rate
  - PCK@0.05 / PCK@0.1 (fraction of visible keypoints within 5% / 10% of bbox size)
  - goniometry: absolute angle error (deg) for elbow/knee/hip/shoulder, using only
    joints whose 3 annotated points are all visible
  - latency: IMAGE mode (detector + landmarks) and VIDEO mode (tracking, detector skipped)
"""
import json, time, math, statistics as st
import numpy as np, cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions
from mediapipe.tasks.python.vision import PoseLandmarker, PoseLandmarkerOptions, RunningMode
from ai_edge_litert.interpreter import Interpreter

SEL = json.load(open('selected.json'))
# COCO keypoint index -> BlazePose landmark index
COCO_TO_BP = [0, 2, 5, 7, 8, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]
JOINTS = {  # COCO indices (proximal, vertex, distal)
    'elbow': [(5, 7, 9), (6, 8, 10)],
    'knee': [(11, 13, 15), (12, 14, 16)],
    'hip': [(5, 11, 13), (6, 12, 14)],
    'shoulder': [(7, 5, 11), (8, 6, 12)],
}


def angle(a, b, c):
    v1, v2 = np.array(a) - np.array(b), np.array(c) - np.array(b)
    cos = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-9)
    return math.degrees(math.acos(max(-1, min(1, cos))))


def gt_points(s):
    kp = np.array(s['kp']).reshape(17, 3)
    return kp[:, :2], kp[:, 2]


def blazepose_runner(model):
    lm_img = PoseLandmarker.create_from_options(PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=model), running_mode=RunningMode.IMAGE))

    def run(rgb):
        h, w = rgb.shape[:2]
        t = time.perf_counter()
        res = lm_img.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
        dt = (time.perf_counter() - t) * 1000
        if not res.pose_landmarks:
            return None, dt
        lms = res.pose_landmarks[0]
        pts = np.array([[lms[i].x * w, lms[i].y * h] for i in COCO_TO_BP])
        return pts, dt

    def tracking_latency(rgb, n=30):
        lm = PoseLandmarker.create_from_options(PoseLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=model), running_mode=RunningMode.VIDEO))
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        times = []
        for i in range(n):
            t = time.perf_counter()
            lm.detect_for_video(img, i * 33)
            times.append((time.perf_counter() - t) * 1000)
        lm.close()
        return st.median(times[3:])  # skip warm-up / first detection

    return run, tracking_latency


def movenet_runner(model):
    it = Interpreter(model_path=model, num_threads=4)
    it.allocate_tensors()
    inp, out = it.get_input_details()[0], it.get_output_details()[0]
    size = inp['shape'][1]

    def run(rgb):
        h, w = rgb.shape[:2]
        side = max(h, w)
        pad = np.zeros((side, side, 3), np.uint8)
        pad[:h, :w] = rgb
        x = cv2.resize(pad, (size, size)).astype(inp['dtype'])[None]
        t = time.perf_counter()
        it.set_tensor(inp['index'], x)
        it.invoke()
        kp = it.get_tensor(out['index'])[0, 0]  # 17 x (y, x, score)
        dt = (time.perf_counter() - t) * 1000
        if kp[:, 2].mean() < 0.1:
            return None, dt
        return np.stack([kp[:, 1] * side, kp[:, 0] * side], 1), dt

    return run, None


def evaluate(name, run, tracking_latency):
    lat, found, pck05, pck10 = [], 0, [], []
    ang_err = {j: [] for j in JOINTS}
    rgbs = []
    for s in SEL:
        rgb = cv2.cvtColor(cv2.imread('coco/' + s['file']), cv2.COLOR_BGR2RGB)
        rgbs.append(rgb)
        pred, dt = run(rgb)
        lat.append(dt)
        if pred is None:
            continue
        found += 1
        gt, vis = gt_points(s)
        scale = max(s['bbox'][2], s['bbox'][3])
        for i in range(17):
            if vis[i] == 2:
                d = np.linalg.norm(pred[i] - gt[i]) / scale
                pck05.append(d < 0.05)
                pck10.append(d < 0.1)
        for j, triplets in JOINTS.items():
            for a, b, c in triplets:
                if vis[a] == vis[b] == vis[c] == 2:
                    ang_err[j].append(abs(angle(pred[a], pred[b], pred[c]) - angle(gt[a], gt[b], gt[c])))
    r = {
        'model': name,
        'detected': f'{found}/{len(SEL)}',
        'pck05': round(100 * np.mean(pck05), 1),
        'pck10': round(100 * np.mean(pck10), 1),
        'latency_image_ms': round(st.median(lat[3:]), 1),
        'latency_tracking_ms': round(tracking_latency(rgbs[0]), 1) if tracking_latency else None,
    }
    for j, e in ang_err.items():
        r[f'{j}_mae'] = round(float(np.mean(e)), 1)
        r[f'{j}_median'] = round(float(np.median(e)), 1)
        r[f'{j}_n'] = len(e)
    all_err = [x for e in ang_err.values() for x in e]
    r['angle_mae_all'] = round(float(np.mean(all_err)), 1)
    r['angle_within_10deg'] = round(100 * float(np.mean(np.array(all_err) < 10)), 1)
    return r


results = []
for name in ['lite', 'full', 'heavy']:
    run, trk = blazepose_runner(f'pose_landmarker_{name}.task')
    results.append(evaluate(f'BlazePose {name}', run, trk))
    print(json.dumps(results[-1]), flush=True)
run, _ = movenet_runner('movenet_lightning_int8.tflite')
results.append(evaluate('MoveNet Lightning int8', run, None))
print(json.dumps(results[-1]), flush=True)
json.dump(results, open('results.json', 'w'), indent=2)
