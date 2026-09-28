#!/usr/bin/env python3
"""Known-geometry research only; no RGB estimator or patient tolerance defaults.

Refines the owner's shoulder-level, approximately 90-degree sleeper variant.
Run beside sleeper_geometry_probe.py; uses the existing vector primitives.
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path
import unittest
from sleeper_geometry_probe import angle, dot, finite, mul, norm, sub, unit, rotate_z

CAUDAL = (0., 1., 0.)  # supplied body-axis direction towards the waist/feet
NORMAL = (0., 0., 1.)  # supplied support-plane normal, not inferred from pixels

def projected(v, normal):
    return sub(v, mul(normal, dot(v, normal)))

def caudal_deviation(upper_arm, caudal=CAUDAL, bed_normal=NORMAL):
    """Positive towards waist, negative towards head; None is not zero."""
    if not all(finite(v) for v in (upper_arm, caudal, bed_normal)):
        return None
    n = unit(bed_normal)
    if n is None:
        return None
    beta = angle(projected(upper_arm, n), projected(caudal, n))
    return None if beta is None else 90. - beta

def arm(caudal_deg=0., lift_deg=0.):
    d, l = math.radians(caudal_deg), math.radians(lift_deg)
    return (math.cos(d)*math.cos(l), math.sin(d)*math.cos(l), math.sin(l))

def raw_image_drift(actual_drift, camera_height_angle):
    """Orthographic camera aimed along x, raised by an explicit angle.

    Shows why a raw 2-D angle is not the specified support-plane angle.
    Camera pitch is a synthetic input, not measured by this probe.
    """
    h = math.radians(camera_height_angle)
    sightline = (math.cos(h), 0., math.sin(h))
    beta = angle(projected(arm(actual_drift), sightline), projected(CAUDAL, sightline))
    return None if beta is None else 90.-beta

def classify_band(drift, uncertainty, tolerance):
    """Explicit EXPERIMENTAL inputs; these are not clinical thresholds.

    Other setup, cranial/lift/roll, reference and temporal checks are external.
    Does not classify safe stretch, correct technique, or exercise eligibility.
    """
    if tolerance is None:
        return 'policy_unset'
    if not all(math.isfinite(v) for v in (drift, uncertainty, tolerance)) or min(uncertainty,tolerance)<0:
        return 'unavailable'
    if drift+uncertainty <= tolerance:
        return 'within_caudal_band'
    return 'outside_caudal_band' if drift-uncertainty>tolerance else 'boundary_uncertain'

class CaudalTests(unittest.TestCase):
    def test_perpendicular_setup(self):
        self.assertAlmostEqual(caudal_deviation(arm()),0.)
    def test_75_degrees_to_caudal_axis_is_15_caudal(self):
        self.assertAlmostEqual(caudal_deviation(arm(15)),15.)
    def test_headward_is_not_caudal(self):
        self.assertAlmostEqual(caudal_deviation(arm(-9)),-9.)
    def test_lift_is_separate(self):
        self.assertAlmostEqual(caudal_deviation(arm(0,25)),0.)
    def test_lift_plus_caudal(self):
        self.assertAlmostEqual(caudal_deviation(arm(7,25)),7.)
    def test_mirrored_side(self):
        u=arm(8);self.assertAlmostEqual(caudal_deviation((-u[0],u[1],u[2])),8.)
    def test_scale_and_coordinate_rotation(self):
        for a in range(0,360,9):
            self.assertAlmostEqual(caudal_deviation(rotate_z(mul(arm(11),3),a),rotate_z(CAUDAL,a),NORMAL),11.)
    def test_degenerate_and_missing(self):
        for bad in [None,(0.,0.,0.),(math.nan,0.,0.),(0.,0.,1.)]:
            self.assertIsNone(caudal_deviation(bad))
    def test_invalid_plane(self):
        self.assertIsNone(caudal_deviation(arm(),CAUDAL,(0.,0.,0.)))
        self.assertIsNone(caudal_deviation(arm(),NORMAL,NORMAL))
    def test_off_target_setup_is_not_zeroed(self):
        initial=caudal_deviation(arm(8));current=caudal_deviation(arm(12))
        self.assertAlmostEqual(initial,8);self.assertAlmostEqual(current,12)
        self.assertAlmostEqual(current-initial,4)
    def test_chest_level_projection_degenerates(self):
        self.assertIsNone(raw_image_drift(0,0));self.assertAlmostEqual(raw_image_drift(10,0),90,places=5)
    def test_oblique_projection_not_actual_angle(self):
        self.assertAlmostEqual(raw_image_drift(10,30),19.4254001407,places=7)
        self.assertAlmostEqual(raw_image_drift(10,90),10)
    def test_no_default_tolerance(self):
        self.assertEqual(classify_band(0,0,None),'policy_unset')
    def test_explicit_leeway_and_uncertainty(self):
        # 12 is an arbitrary test parameter, not an owner selection.
        self.assertEqual(classify_band(7,1,12),'within_caudal_band')
        self.assertEqual(classify_band(12,2,12),'boundary_uncertain')
        self.assertEqual(classify_band(16,1,12),'outside_caudal_band')
    def test_invalid_tolerance_or_uncertainty(self):
        self.assertEqual(classify_band(0,-1,12),'unavailable')
        self.assertEqual(classify_band(0,0,math.nan),'unavailable')

def results():
    return {'scope':'Known geometry; not a camera performance result or clinical tolerance',
      'actual_caudal_deg':10,
      'raw_image_angles':[{'camera_elevation_deg':h,'apparent_drift_deg':round(raw_image_drift(10,h),6)} for h in [0,15,30,45,90]],
      'setup_example':{'initial_deviation_deg':8,'current_deviation_deg':12,'change_since_setup_deg':4},
      'clinical_tolerance':None,'patient_number_display_decision':'not_changed'}

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path);args=parser.parse_args()
    outcome=unittest.TextTestRunner(verbosity=1).run(unittest.defaultTestLoader.loadTestsFromTestCase(CaudalTests))
    if not outcome.wasSuccessful():raise SystemExit(1)
    report=results();report['tests_passed']=outcome.testsRun
    data=json.dumps(report,indent=2)+'\n'
    if args.output:args.output.write_text(data)
    else:print(data)
