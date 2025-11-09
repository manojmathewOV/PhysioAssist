"""
PhysioAssist Prescription API - Python Integration Example

This example demonstrates how to integrate with the PhysioAssist Prescription API
using Python. Suitable for clinic management systems, EMR integrations, and
custom therapist dashboards.

Requirements:
    pip install requests

Usage:
    python python-integration.py
"""

import requests
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum


class ExerciseCategory(str, Enum):
    STRENGTH = "strength"
    FLEXIBILITY = "flexibility"
    BALANCE = "balance"
    ENDURANCE = "endurance"
    PLYOMETRIC = "plyometric"
    FUNCTIONAL = "functional"
    REHABILITATION = "rehabilitation"


class PrescriptionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


@dataclass
class ExerciseTemplate:
    """Exercise template model"""
    id: str
    name: str
    description: str
    category: str
    difficulty: int
    body_region: str
    primary_joints: List[str]
    estimated_duration: int
    recommended_reps: int
    recommended_sets: int
    patient_instructions: str
    active: bool


@dataclass
class ExercisePrescription:
    """Exercise prescription model"""
    id: str
    template_id: str
    patient_id: str
    therapist_id: str
    prescribed_at: int
    start_date: int
    reps: int
    sets: int
    frequency_per_week: int
    status: str
    completion_percent: int


class PhysioAssistClient:
    """PhysioAssist API Client"""

    def __init__(self, api_key: str, base_url: str = "https://api.physioassist.com/v1"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        })

    # ========================================================================
    # Template Management
    # ========================================================================

    def list_templates(
        self,
        category: Optional[ExerciseCategory] = None,
        difficulty_min: Optional[int] = None,
        difficulty_max: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict:
        """List exercise templates with optional filters"""
        params = {
            "limit": limit,
            "offset": offset
        }

        if category:
            params["category"] = category.value
        if difficulty_min:
            params["difficulty_min"] = difficulty_min
        if difficulty_max:
            params["difficulty_max"] = difficulty_max
        if search:
            params["search"] = search

        response = self.session.get(f"{self.base_url}/templates", params=params)
        response.raise_for_status()
        return response.json()

    def get_template(self, template_id: str) -> ExerciseTemplate:
        """Get a specific template by ID"""
        response = self.session.get(f"{self.base_url}/templates/{template_id}")
        response.raise_for_status()
        data = response.json()

        return ExerciseTemplate(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            category=data["category"],
            difficulty=data["difficulty"],
            body_region=data["bodyRegion"],
            primary_joints=data["primaryJoints"],
            estimated_duration=data["estimatedDuration"],
            recommended_reps=data["recommendedReps"],
            recommended_sets=data["recommendedSets"],
            patient_instructions=data["patientInstructions"],
            active=data["active"]
        )

    def create_template(self, template_data: Dict) -> ExerciseTemplate:
        """Create a new exercise template (therapist/admin only)"""
        response = self.session.post(f"{self.base_url}/templates", json=template_data)
        response.raise_for_status()
        data = response.json()

        return ExerciseTemplate(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            category=data["category"],
            difficulty=data["difficulty"],
            body_region=data["bodyRegion"],
            primary_joints=data["primaryJoints"],
            estimated_duration=data["estimatedDuration"],
            recommended_reps=data["recommendedReps"],
            recommended_sets=data["recommendedSets"],
            patient_instructions=data["patientInstructions"],
            active=data["active"]
        )

    # ========================================================================
    # Prescription Management
    # ========================================================================

    def create_prescription(
        self,
        template_id: str,
        patient_id: str,
        therapist_id: str,
        frequency_per_week: int,
        reps: Optional[int] = None,
        sets: Optional[int] = None,
        custom_instructions: Optional[str] = None,
        primary_joint_focus: Optional[str] = None
    ) -> ExercisePrescription:
        """Prescribe an exercise to a patient"""
        data = {
            "templateId": template_id,
            "patientId": patient_id,
            "therapistId": therapist_id,
            "frequencyPerWeek": frequency_per_week
        }

        if reps:
            data["reps"] = reps
        if sets:
            data["sets"] = sets
        if custom_instructions:
            data["customInstructions"] = custom_instructions
        if primary_joint_focus:
            data["primaryJointFocus"] = primary_joint_focus

        response = self.session.post(f"{self.base_url}/prescriptions", json=data)
        response.raise_for_status()
        result = response.json()

        return ExercisePrescription(
            id=result["id"],
            template_id=result["templateId"],
            patient_id=result["patientId"],
            therapist_id=result["therapistId"],
            prescribed_at=result["prescribedAt"],
            start_date=result["startDate"],
            reps=result["reps"],
            sets=result["sets"],
            frequency_per_week=result["frequencyPerWeek"],
            status=result["status"],
            completion_percent=result["completionPercent"]
        )

    def get_prescription(self, prescription_id: str) -> ExercisePrescription:
        """Get a specific prescription by ID"""
        response = self.session.get(f"{self.base_url}/prescriptions/{prescription_id}")
        response.raise_for_status()
        data = response.json()

        return ExercisePrescription(
            id=data["id"],
            template_id=data["templateId"],
            patient_id=data["patientId"],
            therapist_id=data["therapistId"],
            prescribed_at=data["prescribedAt"],
            start_date=data["startDate"],
            reps=data["reps"],
            sets=data["sets"],
            frequency_per_week=data["frequencyPerWeek"],
            status=data["status"],
            completion_percent=data["completionPercent"]
        )

    def update_prescription(
        self,
        prescription_id: str,
        status: Optional[PrescriptionStatus] = None,
        completion_percent: Optional[int] = None,
        therapist_notes: Optional[str] = None
    ) -> ExercisePrescription:
        """Update prescription status or notes"""
        data = {}

        if status:
            data["status"] = status.value
        if completion_percent is not None:
            data["completionPercent"] = completion_percent
        if therapist_notes:
            data["therapistNotes"] = therapist_notes

        response = self.session.patch(
            f"{self.base_url}/prescriptions/{prescription_id}",
            json=data
        )
        response.raise_for_status()
        result = response.json()

        return ExercisePrescription(
            id=result["id"],
            template_id=result["templateId"],
            patient_id=result["patientId"],
            therapist_id=result["therapistId"],
            prescribed_at=result["prescribedAt"],
            start_date=result["startDate"],
            reps=result["reps"],
            sets=result["sets"],
            frequency_per_week=result["frequencyPerWeek"],
            status=result["status"],
            completion_percent=result["completionPercent"]
        )

    def cancel_prescription(self, prescription_id: str) -> bool:
        """Cancel a prescription"""
        response = self.session.delete(f"{self.base_url}/prescriptions/{prescription_id}")
        return response.status_code == 204

    def get_patient_prescriptions(
        self,
        patient_id: str,
        status: Optional[PrescriptionStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ExercisePrescription]:
        """Get all prescriptions for a patient"""
        params = {"limit": limit, "offset": offset}

        if status:
            params["status"] = status.value

        response = self.session.get(
            f"{self.base_url}/patients/{patient_id}/prescriptions",
            params=params
        )
        response.raise_for_status()
        data = response.json()

        return [
            ExercisePrescription(
                id=p["id"],
                template_id=p["templateId"],
                patient_id=p["patientId"],
                therapist_id=p["therapistId"],
                prescribed_at=p["prescribedAt"],
                start_date=p["startDate"],
                reps=p["reps"],
                sets=p["sets"],
                frequency_per_week=p["frequencyPerWeek"],
                status=p["status"],
                completion_percent=p["completionPercent"]
            )
            for p in data["prescriptions"]
        ]

    # ========================================================================
    # Library Statistics
    # ========================================================================

    def get_library_stats(self) -> Dict:
        """Get template library statistics"""
        response = self.session.get(f"{self.base_url}/library/stats")
        response.raise_for_status()
        return response.json()


# ============================================================================
# Example Usage
# ============================================================================

def main():
    # Initialize client with API key
    api_key = "your_api_key_here"  # Replace with actual API key
    client = PhysioAssistClient(api_key)

    # Example 1: List shoulder strength exercises
    print("=== Example 1: List shoulder strength exercises ===")
    templates = client.list_templates(
        category=ExerciseCategory.STRENGTH,
        search="shoulder",
        limit=10
    )
    print(f"Found {templates['total']} templates")
    for template in templates['templates']:
        print(f"  - {template['name']} (Difficulty: {template['difficulty']}/5)")

    # Example 2: Get a specific template
    print("\n=== Example 2: Get specific template ===")
    # template = client.get_template("template_123")
    # print(f"Template: {template.name}")
    # print(f"Instructions: {template.patient_instructions}")

    # Example 3: Create a prescription
    print("\n=== Example 3: Create a prescription ===")
    # prescription = client.create_prescription(
    #     template_id="template_123",
    #     patient_id="patient_456",
    #     therapist_id="therapist_789",
    #     frequency_per_week=3,
    #     reps=12,
    #     sets=3,
    #     custom_instructions="Focus on controlled movement. Stop if pain exceeds 3/10.",
    #     primary_joint_focus="shoulder"
    # )
    # print(f"Prescription created: {prescription.id}")
    # print(f"Status: {prescription.status}")

    # Example 4: Get patient's active prescriptions
    print("\n=== Example 4: Get patient's active prescriptions ===")
    # prescriptions = client.get_patient_prescriptions(
    #     patient_id="patient_456",
    #     status=PrescriptionStatus.ACTIVE
    # )
    # print(f"Active prescriptions: {len(prescriptions)}")
    # for prescription in prescriptions:
    #     template = client.get_template(prescription.template_id)
    #     print(f"  - {template.name}: {prescription.completion_percent}% complete")

    # Example 5: Update prescription progress
    print("\n=== Example 5: Update prescription progress ===")
    # updated = client.update_prescription(
    #     prescription_id="prescription_123",
    #     completion_percent=75,
    #     therapist_notes="Patient is progressing well. Increase difficulty next week."
    # )
    # print(f"Updated: {updated.completion_percent}% complete")

    # Example 6: Get library statistics
    print("\n=== Example 6: Get library statistics ===")
    stats = client.get_library_stats()
    print(f"Total templates: {stats['totalTemplates']}")
    print(f"Active templates: {stats['activeCount']}")
    print("By category:")
    for category, count in stats['byCategory'].items():
        if count > 0:
            print(f"  - {category}: {count}")


if __name__ == "__main__":
    main()
