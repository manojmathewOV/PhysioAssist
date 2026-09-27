"""Proposed policy specification tests, NOT the application's implementation.
All parameters and IDs are synthetic; there are no clinical dose defaults.
"""
from dataclasses import dataclass, replace
from typing import Optional, FrozenSet
import unittest

@dataclass(frozen=True)
class Context:
    elapsed: Optional[int] = 10
    earliest: int = 7
    mode: str = 'clinical'
    plan_valid: bool = True
    source_resolved: bool = True
    context_matches: bool = True
    prerequisites: Optional[bool] = True
    approval: bool = False
    time_only_preapproved: bool = False
    current_expired: bool = False

def transition(c: Context) -> str:
    if not c.plan_valid or not c.source_resolved or not c.context_matches:
        return 'needs_plan_review'
    if c.elapsed is None or c.elapsed < 0:
        return 'date_unresolved'
    if c.elapsed < c.earliest:
        return 'not_due'
    if c.prerequisites is not True:
        return 'prerequisites_unmet'
    if c.mode == 'clinical':
        return 'eligible' if c.approval else 'review_due'
    if c.mode == 'time_only' and c.time_only_preapproved:
        return 'eligible'
    return 'needs_plan_review'

def activity_allowed(c: Context) -> bool:
    return c.plan_valid and c.source_resolved and c.context_matches and not c.current_expired

def educational_access(c: Context) -> bool:
    return True  # Available education is not permission to perform movement.

def completed_range(actual: int, minimum: int, maximum: int) -> bool:
    if min(actual, minimum, maximum) < 0 or not 0 < minimum <= maximum:
        raise ValueError('Invalid synthetic range')
    return actual >= minimum

def same_method(a: tuple, b: tuple) -> bool:
    # subject, side, episode context, quantity, assistance, posture, method
    return a == b

class ContractTests(unittest.TestCase):
    def test_elapsed_time_alone_does_not_advance_clinical_stage(self):
        self.assertEqual(transition(Context(elapsed=100)), 'review_due')
    def test_explicit_approval_with_all_conditions_is_eligible(self):
        self.assertEqual(transition(Context(approval=True)), 'eligible')
    def test_approval_does_not_override_too_early(self):
        self.assertEqual(transition(Context(elapsed=1,approval=True)), 'not_due')
    def test_unknown_prerequisite_not_true(self):
        self.assertEqual(transition(Context(prerequisites=None,approval=True)), 'prerequisites_unmet')
    def test_failed_prerequisite_not_true(self):
        self.assertEqual(transition(Context(prerequisites=False,approval=True)), 'prerequisites_unmet')
    def test_missing_date_not_invented(self):
        self.assertEqual(transition(Context(elapsed=None)), 'date_unresolved')
    def test_negative_elapsed_invalid(self):
        self.assertEqual(transition(Context(elapsed=-1)), 'date_unresolved')
    def test_source_conflict_blocks_activation(self):
        c=Context(source_resolved=False,approval=True)
        self.assertEqual(transition(c),'needs_plan_review');self.assertFalse(activity_allowed(c))
    def test_mismatched_episode_or_modifier_blocks_activation(self):
        self.assertFalse(activity_allowed(Context(context_matches=False)))
    def test_suspended_plan_blocks_activity_not_education(self):
        c=Context(plan_valid=False)
        self.assertFalse(activity_allowed(c));self.assertTrue(educational_access(c))
    def test_expired_plan_not_blindly_continued(self):
        self.assertFalse(activity_allowed(Context(current_expired=True)))
    def test_time_only_requires_explicit_preapproval(self):
        self.assertEqual(transition(Context(mode='time_only')), 'needs_plan_review')
    def test_explicit_time_only_contract_can_be_eligible(self):
        self.assertEqual(transition(Context(mode='time_only',time_only_preapproved=True)), 'eligible')
    def test_unknown_transition_mode_refused(self):
        self.assertEqual(transition(Context(mode='inferred_AI',approval=True)), 'needs_plan_review')
    def test_range_lower_bound_completes(self):
        self.assertTrue(completed_range(2,2,3));self.assertFalse(completed_range(1,2,3))
    def test_invalid_range_raises(self):
        with self.assertRaises(ValueError):completed_range(2,3,2)
    def test_dose_change_is_not_method_change(self):
        a=('subject','left','episode','quantity','assisted','supine','method1')
        self.assertTrue(same_method(a,tuple(a)))
    def test_assistance_change_is_method_change(self):
        a=('subject','left','episode','quantity','assisted','supine','method1')
        self.assertFalse(same_method(a,a[:4]+('active',)+a[5:]))

if __name__ == '__main__':
    unittest.main(verbosity=2)
