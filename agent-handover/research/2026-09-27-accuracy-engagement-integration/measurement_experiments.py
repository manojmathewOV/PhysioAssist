#!/usr/bin/env python3
"""Synthetic measurement experiments. Not patient data or PhysioAssist accuracy tests.
Run: python3 measurement_experiments.py --output simulation-results.json
Only the Python standard library is required. No network or filesystem deletion.
"""
from __future__ import annotations
import argparse
import json
import math
import platform
import random
import statistics
from pathlib import Path
import unittest


def projected_angle(true_deg: float, yaw_deg: float) -> float:
    """Orthographic projection of a vector from vertical in one rotating plane.
    NOT a general knee/shoulder correction: no perspective, anatomical uncertainty,
    trunk motion, occlusion or estimator error are modelled.
    """
    if not all(math.isfinite(v) for v in (true_deg, yaw_deg)):
        raise ValueError('finite angles required')
    if not 0 <= true_deg <= 180 or not -90 < yaw_deg < 90:
        raise ValueError('outside declared model domain')
    theta, yaw = math.radians(true_deg), math.radians(yaw_deg)
    return math.degrees(math.atan2(abs(math.sin(theta)*math.cos(yaw)), math.cos(theta)))


def noise_trial(rng: random.Random, n: int, rho: float, sigma: float = 2.0) -> list[float]:
    """Stationary Gaussian AR(1) errors; sigma is marginal standard deviation."""
    error = rng.gauss(0, sigma)
    innovation = sigma * math.sqrt(1-rho*rho)
    result = [error]
    for _ in range(1, n):
        error = rho*error + rng.gauss(0, innovation)
        result.append(error)
    return result


def run() -> dict:
    rng = random.Random(20260927)
    reps = 2000
    rows = []
    for rho in (0.0, 0.9):
        for n in (30, 300, 1800):
            max_err, median_err = [], []
            for _ in range(reps):
                errors = noise_trial(rng, n, rho)
                max_err.append(max(errors))
                median_err.append(statistics.median(errors))
            rows.append({'noise_autocorrelation':rho,'samples_per_constant_hold':n,
                         'synthetic_trials':reps,'mean_maximum_error_deg':round(statistics.mean(max_err),3),
                         'mean_median_error_deg':round(statistics.mean(median_err),3),
                         'median_estimator_rmse_deg':round(math.sqrt(statistics.mean(x*x for x in median_err)),3)})
    # Separate setup offsets cannot be removed by averaging many frames.
    setup_error=[]
    for _ in range(reps):
        offset=rng.gauss(0,3)
        setup_error.append(offset+statistics.median(noise_trial(rng,300,0.0)))
    # Equal true endpoints, independently noisy endpoint observations across reps.
    peak_rows=[]
    for count in (2,3,10):
        maxima=[];medians=[]
        for _ in range(10000):
            eps=[rng.gauss(0,2) for _ in range(count)]
            maxima.append(max(eps));medians.append(statistics.median(eps))
        peak_rows.append({'endpoint_count':count,'synthetic_trials':10000,
                         'mean_best_endpoint_error_deg':round(statistics.mean(maxima),3),
                         'mean_typical_endpoint_error_deg':round(statistics.mean(medians),3)})
    return {'scope':'synthetic geometry/statistics only; not clinical validation, pose inference, or production tests',
            'seed':20260927,'python':platform.python_version(),
            'assumptions':{'true_endpoint_deg':60,'marginal_frame_noise_sd_deg':2,
                           'camera_setup_offset_sd_deg':3,
                           'constant_hold_or_equal_true_repetition_endpoints':True,
                           'no_real_patient_data':True},
            'projection':[{'true_deg':60,'yaw_deg':yaw,'projected_deg':round(projected_angle(60,yaw),3)} for yaw in (0,15,30,45,60)],
            'constant_hold_noise':rows,'repetition_endpoint_noise':peak_rows,
            'median_with_setup_offset_rmse_deg':round(math.sqrt(statistics.mean(x*x for x in setup_error)),3),
            'interpretation':['Choosing the maximum can systematically overestimate an unchanged endpoint; longer recordings create more opportunities.',
                              'Median aggregation reduces random errors in this constant-endpoint toy model; it is not valid to take the median of a whole changing movement.',
                              'Autocorrelation reduces the benefit of having more frames.',
                              'Aggregation does not remove setup bias, invalid geometry, incorrect landmarks, or wrong clinical definitions.',
                              'No simulated number is an acceptance threshold, clinical accuracy estimate, prescribed repetition count, or validated production algorithm.']}


class Tests(unittest.TestCase):
    def test_true_plane(self):
        for x in (0,5,45,90,120,180): self.assertAlmostEqual(projected_angle(x,0),x)
    def test_known_projection(self): self.assertAlmostEqual(projected_angle(60,60),40.8933946491)
    def test_nonuniform_geometry(self): self.assertAlmostEqual(projected_angle(90,60),90)
    def test_mirror_invariance(self): self.assertAlmostEqual(projected_angle(45,30),projected_angle(45,-30))
    def test_invalid_fails(self):
        for a,b in ((float('nan'),0),(10,90),(-5,0)):
            with self.assertRaises(ValueError): projected_angle(a,b)
    def test_reproducible_random(self): self.assertEqual(noise_trial(random.Random(1),50,.9),noise_trial(random.Random(1),50,.9))
    def test_selection_shift(self):
        rng=random.Random(4)
        rows=[noise_trial(rng,60,0) for _ in range(1000)]
        self.assertGreater(statistics.mean(max(r) for r in rows),3)
        self.assertLess(abs(statistics.mean(statistics.median(r) for r in rows)),.1)
    def test_offset_remains(self): self.assertEqual(statistics.median([5+x for x in (-2,-1,0,1,2)]),5)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path);p.add_argument('--test',action='store_true');args=p.parse_args()
    if args.test:
        result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Tests))
        raise SystemExit(0 if result.wasSuccessful() else 1)
    result=run();txt=json.dumps(result,indent=2)+'\n'
    if args.output: args.output.write_text(txt)
    else: print(txt)
