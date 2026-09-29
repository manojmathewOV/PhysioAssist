#!/usr/bin/env python3
"""Offline geometric prototype, NOT a clinical or camera-derived estimator.

All positions and torso axes below are known synthetic 3-D inputs. The hard
computer-vision problem of obtaining those inputs is not solved by this file.
No clinical thresholds, doses, force estimates, or movement permissions are set.
Run: python3 sleeper_geometry_probe.py --output results.json
"""
from __future__ import annotations
import argparse
from dataclasses import dataclass, replace
import json
import math
from pathlib import Path
import random
import statistics
import unittest

Vec = tuple[float, float, float]
Basis = tuple[Vec, Vec, Vec]
IDENTITY: Basis = ((1., 0., 0.), (0., 1., 0.), (0., 0., 1.))
EPS = 1e-9  # Floating point guard only, not a clinical/visibility threshold.

def add(a: Vec, b: Vec) -> Vec:
    return tuple(x + y for x, y in zip(a, b))
def sub(a: Vec, b: Vec) -> Vec:
    return tuple(x - y for x, y in zip(a, b))
def mul(a: Vec, n: float) -> Vec:
    return tuple(x * n for x in a)
def dot(a: Vec, b: Vec) -> float:
    return sum(x * y for x, y in zip(a, b))
def norm(a: Vec) -> float:
    return math.sqrt(dot(a, a))
def cross(a: Vec, b: Vec) -> Vec:
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def unit(a: Vec) -> Vec | None:
    n = norm(a)
    return mul(a, 1/n) if n > EPS else None
def finite(a: Vec | None) -> bool:
    return a is not None and len(a) == 3 and all(math.isfinite(v) for v in a)
def angle(a: Vec, b: Vec) -> float | None:
    ua, ub = unit(a), unit(b)
    return math.degrees(math.acos(max(-1., min(1., dot(ua, ub))))) if ua and ub else None
def outward(v: Vec, basis: Basis) -> Vec:
    return tuple(sum(v[i] * basis[i][j] for i in range(3)) for j in range(3))
def rotate_z(v: Vec, degrees: float) -> Vec:
    a = math.radians(degrees)
    return (v[0]*math.cos(a)-v[1]*math.sin(a), v[0]*math.sin(a)+v[1]*math.cos(a), v[2])

@dataclass(frozen=True)
class Sample:
    shoulder: Vec | None
    elbow: Vec | None
    wrist: Vec | None
    origin: Vec = (0., 0., 0.)
    basis: Basis = IDENTITY  # Synthetic known body frame, NOT inferred scapular frame.
    torso_length: float = .5
    torso_observable: bool = True
    camera_epoch: str = 'setup-A'
    reference_known: bool = True

def body_point(p: Vec | None, s: Sample) -> Vec | None:
    if not finite(p) or not finite(s.origin) or not s.torso_observable:
        return None
    if not math.isfinite(s.torso_length) or s.torso_length <= EPS:
        return None
    if not all(finite(axis) for axis in s.basis):
        return None
    if any(abs(dot(a, b) - (1. if i == j else 0.)) > 1e-7
           for i, a in enumerate(s.basis) for j, b in enumerate(s.basis)):
        return None
    return tuple(dot(sub(p, s.origin), a)/s.torso_length for a in s.basis)

def observe(base: Sample, current: Sample) -> dict:
    """Return continuous quantities separately; never collapse unknown to zero.

    approximate_ir_deg uses a declared synthetic neutral forearm reference,
    projected perpendicular to the current upper-arm axis. It is a geometric
    surrogate, NOT an ISB joint-angle implementation or isolated GH measurement.
    """
    result = dict(approximate_ir_deg=None, elbow_drift_pct_torso=None,
                  elbow_drift_vector_pct_torso=None, shoulder_drift_pct_torso=None,
                  upper_arm_direction_change_deg=None, elbow_flexion_deg=None,
                  torso_orientation_change_deg=None, reason=None)
    if current.camera_epoch != base.camera_epoch:
        result['reason'] = 'camera_reference_changed'
        return result
    e, s, w = [body_point(p, current) for p in (current.elbow, current.shoulder, current.wrist)]
    e0, s0 = [body_point(p, base) for p in (base.elbow, base.shoulder)]
    if e is not None and e0 is not None:
        d = mul(sub(e, e0), 100.)
        result.update(elbow_drift_pct_torso=norm(d), elbow_drift_vector_pct_torso=d)
    if s is not None and s0 is not None:
        result['shoulder_drift_pct_torso'] = norm(sub(s, s0))*100
    if e is not None and s is not None and e0 is not None and s0 is not None:
        result['upper_arm_direction_change_deg'] = angle(sub(e, s), sub(e0, s0))
    if e is not None and s is not None and w is not None:
        u, f = unit(sub(e, s)), unit(sub(w, e))
        if u is not None and f is not None:
            result['elbow_flexion_deg'] = angle(u, f)
            # Declared local zero direction, not the person's restricted initial pose.
            r = unit(sub((0., 1., 0.), mul(u, u[1])))
            p = unit(sub(f, mul(u, dot(f, u))))
            if r is not None and p is not None and current.reference_known:
                result['approximate_ir_deg'] = math.degrees(math.atan2(dot(u, cross(r, p)), dot(r, p)))
    if body_point(current.origin, current) is not None and body_point(base.origin, base) is not None:
        trace = sum(dot(base.basis[i], current.basis[i]) for i in range(3))
        result['torso_orientation_change_deg'] = math.degrees(math.acos(max(-1., min(1., (trace-1)/2))))
    return result

def sample(ir: float = 30., swing: float = 0., flexion: float = 90.,
           shoulder_shift: Vec = (0., 0., 0.)) -> Sample:
    a = math.radians(swing)
    u = (math.cos(a), math.sin(a), 0.)
    r = (-math.sin(a), math.cos(a), 0.)
    n = cross(u, r)
    th, b = math.radians(ir), math.radians(flexion)
    f = add(mul(u, math.cos(b)), mul(add(mul(r, math.cos(th)), mul(n, math.sin(th))), math.sin(b)))
    s = add((0., .4, 0.), shoulder_shift)
    e = add(s, mul(u, .3))
    return Sample(s, e, add(e, mul(f, .25)))

def transform(s: Sample, degrees: float, scale: float, shift: Vec) -> Sample:
    def point(p):
        return add(mul(rotate_z(p, degrees), scale), shift) if p is not None else None
    return replace(s, shoulder=point(s.shoulder), elbow=point(s.elbow), wrist=point(s.wrist),
                   origin=point(s.origin), basis=tuple(rotate_z(a, degrees) for a in s.basis),
                   torso_length=s.torso_length*scale)

def paired_window(rows: list[tuple[float, dict]], max_gap: float) -> dict:
    """Summarise a PRESELECTED endpoint interval, never search for the best window.

    max_gap is an explicit experimental input, not a patient default. Unknowns
    remain independent per output. No confidence interval is calculated.
    """
    if not math.isfinite(max_gap) or max_gap <= 0 or len(rows) < 2:
        raise ValueError('Explicit positive gap and at least two observations required')
    ts = [t for t, _ in rows]
    if any(not math.isfinite(t) for t in ts) or any(b <= a or b-a > max_gap for a, b in zip(ts, ts[1:])):
        return {'state': 'unavailable', 'reason': 'discontinuous_interval'}
    out = {'state': 'observed_interval', 'start': ts[0], 'end': ts[-1]}
    for k in ['approximate_ir_deg', 'elbow_drift_pct_torso', 'upper_arm_direction_change_deg']:
        vs = [o[k] for _, o in rows]
        out[k] = statistics.median(vs) if all(v is not None and math.isfinite(v) for v in vs) else None
    out['state'] = 'paired' if all(out[k] is not None for k in ['approximate_ir_deg','elbow_drift_pct_torso']) else 'partial'
    return out

class GeometryTests(unittest.TestCase):
    def test_rotation_alone_does_not_move_elbow(self):
        o=observe(sample(20),sample(50));self.assertAlmostEqual(o['approximate_ir_deg'],50);self.assertAlmostEqual(o['elbow_drift_pct_torso'],0)
    def test_direction_drift_with_unchanged_length(self):
        b,s=sample(),sample(swing=10);o=observe(b,s)
        self.assertAlmostEqual(norm(sub(s.elbow,s.shoulder)),norm(sub(b.elbow,b.shoulder)))
        self.assertAlmostEqual(o['upper_arm_direction_change_deg'],10)
        self.assertAlmostEqual(o['elbow_drift_pct_torso'],120*math.sin(math.radians(5)))
    def test_shoulder_and_elbow_translate_together(self):
        o=observe(sample(),sample(shoulder_shift=(0.,-.025,0.)))
        self.assertAlmostEqual(o['upper_arm_direction_change_deg'],0);self.assertAlmostEqual(o['elbow_drift_pct_torso'],5)
    def test_torso_motion_separate_from_elbow_drift(self):
        b=sample();o=observe(b,transform(b,20,1,(.4,.1,.2)))
        self.assertAlmostEqual(o['elbow_drift_pct_torso'],0);self.assertAlmostEqual(o['torso_orientation_change_deg'],20)
    def test_scale_and_translation(self):
        b=sample();o=observe(b,transform(b,0,1.8,(4.,-2.,1.)))
        self.assertAlmostEqual(o['elbow_drift_pct_torso'],0);self.assertAlmostEqual(o['approximate_ir_deg'],30)
    def test_elbow_flexion_not_shoulder_rotation(self):
        o=observe(sample(),sample(flexion=60));self.assertAlmostEqual(o['approximate_ir_deg'],30);self.assertAlmostEqual(o['elbow_flexion_deg'],60)
    def test_hidden_wrist_keeps_drift(self):
        o=observe(sample(),replace(sample(swing=10),wrist=None));self.assertIsNone(o['approximate_ir_deg']);self.assertGreater(o['elbow_drift_pct_torso'],0)
    def test_hidden_shoulder_keeps_torso_referenced_elbow(self):
        o=observe(sample(),replace(sample(swing=10),shoulder=None));self.assertIsNone(o['approximate_ir_deg']);self.assertGreater(o['elbow_drift_pct_torso'],0)
    def test_hidden_elbow_never_means_stable(self):
        o=observe(sample(),replace(sample(),elbow=None));self.assertIsNone(o['elbow_drift_pct_torso']);self.assertIsNone(o['approximate_ir_deg'])
    def test_body_frame_unknown(self):
        o=observe(sample(),replace(sample(),torso_observable=False));self.assertIsNone(o['elbow_drift_pct_torso'])
    def test_camera_changed_invalidates_old_basis(self):
        o=observe(sample(),replace(sample(),camera_epoch='B'));self.assertEqual(o['reason'],'camera_reference_changed');self.assertIsNone(o['approximate_ir_deg'])
    def test_unknown_neutral_is_not_zero(self):
        o=observe(sample(),replace(sample(45),reference_known=False));self.assertIsNone(o['approximate_ir_deg'])
    def test_invalid_geometry(self):
        for change in [dict(torso_length=0),dict(elbow=(math.nan,0,0)),dict(basis=((1,0,0),(1,0,0),(0,0,1)))]:
            o=observe(sample(),replace(sample(),**change));self.assertIsNone(o['elbow_drift_pct_torso'])
    def test_straight_forearm_rotation_is_unobservable(self):
        o=observe(sample(),sample(flexion=0));self.assertIsNone(o['approximate_ir_deg'])
    def test_fixed_session_baseline_detects_ratchet(self):
        b=sample();a,c=sample(swing=5),sample(swing=10)
        self.assertAlmostEqual(observe(a,c)['upper_arm_direction_change_deg'],5)
        self.assertAlmostEqual(observe(b,c)['upper_arm_direction_change_deg'],10)
    def test_mirror_metadata_restores_body_coordinates(self):
        def refl(v):return (-v[0],v[1],v[2]) if v else None
        def mirrored(s):return replace(s,shoulder=refl(s.shoulder),elbow=refl(s.elbow),wrist=refl(s.wrist),origin=refl(s.origin),basis=tuple(refl(a) for a in s.basis))
        a=observe(sample(),sample(45,10));b=observe(mirrored(sample()),mirrored(sample(45,10)))
        self.assertAlmostEqual(a['approximate_ir_deg'],b['approximate_ir_deg']);self.assertAlmostEqual(a['elbow_drift_pct_torso'],b['elbow_drift_pct_torso'])
    def test_paired_interval_uses_same_frames(self):
        rows=[(i*.1,observe(sample(),sample(40+i,swing=5))) for i in range(5)]
        o=paired_window(rows,.11);self.assertAlmostEqual(o['approximate_ir_deg'],42);self.assertAlmostEqual(o['upper_arm_direction_change_deg'],5)
    def test_gap_is_not_a_hold(self):
        o=observe(sample(),sample());self.assertEqual(paired_window([(0,o),(5,o)],.11)['state'],'unavailable')
    def test_partial_observation_not_zero(self):
        o=observe(sample(),replace(sample(),wrist=None));p=paired_window([(0,o),(.1,o)],.11)
        self.assertEqual(p['state'],'partial');self.assertIsNone(p['approximate_ir_deg']);self.assertAlmostEqual(p['elbow_drift_pct_torso'],0)
    def test_random_rigid_and_scale_invariance(self):
        rng=random.Random(20260928)
        for _ in range(500):
            a=sample(rng.uniform(5,80));b=sample(rng.uniform(5,80),rng.uniform(-25,25))
            deg,scale,shift=rng.uniform(-170,170),rng.uniform(.3,3),tuple(rng.uniform(-3,3) for _ in range(3))
            x,y=observe(a,b),observe(transform(a,deg,scale,shift),transform(b,deg,scale,shift))
            for k in ['approximate_ir_deg','elbow_drift_pct_torso','upper_arm_direction_change_deg']:
                self.assertAlmostEqual(x[k],y[k],places=8)

def experiments() -> dict:
    b=sample(30)
    cases={
        'rotation_30_to_50_fixed_elbow':sample(50),
        'upper_arm_swing_10_same_IR_and_length':sample(30,10),
        'shoulder_and_elbow_shift_2_5cm_synthetic_only':sample(30,shoulder_shift=(0,-.025,0)),
        'body_turn_20_no_relative_elbow_movement':transform(b,20,1,(.4,.1,.2)),
        'zoom_1_8_and_translation_no_patient_change':transform(b,0,1.8,(4,-2,1)),
        'wrist_hidden_but_elbow_drift_visible':replace(sample(30,10),wrist=None),
        'camera_moved_requires_new_reference':replace(sample(),camera_epoch='B'),
    }
    # Orthographic counterexample: camera observes x,y only. Equal x,y coordinates,
    # different depth => 2-D drift is zero while full 3-D drift is nonzero.
    hidden_depth=(0.,0.,.04)
    depth=replace(b,elbow=add(b.elbow,hidden_depth),wrist=add(b.wrist,hidden_depth))
    return {'scope':'Exact synthetic 3-D geometry, not RGB inference or clinical accuracy',
            'cases':{k:observe(b,s) for k,s in cases.items()},
            'depth_blindness':{'projected_2d_elbow_drift':0.,'true_synthetic_3d_pct_torso':observe(b,depth)['elbow_drift_pct_torso'],
                'meaning':'2-D no visible drift cannot establish 3-D stability; this is not a physiologically isolated movement model.'},
            'baseline_ratchet':{'per_rep_reset_deg':observe(sample(30,5),sample(30,10))['upper_arm_direction_change_deg'],
                                'session_baseline_deg':observe(b,sample(30,10))['upper_arm_direction_change_deg']},
            'units':'Distances are percent of a defined synthetic torso reference; cm in fixture name is not a monocular calibration claim.',
            'thresholds':'No clinical thresholds or dose recommendations; interval gap is explicit synthetic input.',
            'limitations':['Supplied torso frame is exact; visibility and camera epoch are inputs, not inferred detectors.',
                'Real 2-D projection/occlusion and learned depth require separate qualification.',
                'This is a forearm orientation surrogate with a declared neutral, not scapular/bony-axis tracking.',
                'No automatic improvement claim or angle-minus-drift correction.']}

def main() -> int:
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path);args=parser.parse_args()
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(GeometryTests))
    report=experiments();report['test_result']={'run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'random_transform_cases':500}
    text=json.dumps(report,indent=2,allow_nan=False)+'\n'
    if args.output:args.output.write_text(text)
    else:print(text)
    return 0 if result.wasSuccessful() else 1
if __name__=='__main__':raise SystemExit(main())
