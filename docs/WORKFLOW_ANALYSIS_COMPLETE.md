# Clinical Assessment System - Complete Workflow Analysis

## User Types & Their Needs

### 1. Elderly Patient at Home (Tech Novice)
**Needs:**
- Absolute simplicity
- Large fonts, voice guidance
- Minimal choices (4 max per screen)
- Can't get lost
- Encouraging, not clinical

**Workflow:**
```
Open → Pick Joint → Pick Movement → Watch Demo → Do It → See Result → Done
```

### 2. Young/Tech-Savvy Patient
**Needs:**
- Quick access
- Progress tracking
- Gamification elements
- Social sharing
- Skip redundant steps

**Workflow:**
```
Open → Quick Start (remembers last) → Do It → Compare History → Share
```

### 3. Professional Therapist
**Needs:**
- All clinical data
- Multi-patient management
- Custom protocols
- Export reports
- Research-grade metrics

**Workflow:**
```
Load Patient → Select Protocol → Multi-Movement Sequence → Detailed Analysis → Export
```

### 4. Caregiver Assisting Patient
**Needs:**
- Simple instructions for patient
- Ability to help position camera
- Clear visual cues
- Results they can explain

**Workflow:**
```
Setup Mode → Position Camera → Guide Patient → Monitor Progress → Review Together
```

### 5. Research/Clinical Trial Participant
**Needs:**
- Standardized protocols
- Video recording
- Automatic upload
- Consistency checks

**Workflow:**
```
Load Study Protocol → Follow Exact Steps → Auto-Record → Auto-Upload → Confirmation
```

---

## Joint × Movement Combinations (Complete Matrix)

### Total Permutations: 20 unique assessments

| Joint | Movements | Sides | Total |
|-------|-----------|-------|-------|
| **Shoulder** | Flexion, Abduction, Ext Rotation, Int Rotation | L, R | 8 |
| **Elbow** | Flexion, Extension | L, R | 4 |
| **Knee** | Flexion, Extension | L, R | 4 |
| **Hip** | Flexion, Abduction | L, R | 4 |
| **TOTAL** | 10 movement types | × 2 sides | **20** |

### Extended Movements (Future):
- **Shoulder**: Horizontal Abduction, Scaption, Combined movements
- **Wrist**: Flexion, Extension, Radial/Ulnar deviation
- **Ankle**: Plantarflexion, Dorsiflexion, Inversion, Eversion
- **Spine**: Flexion, Extension, Lateral bending, Rotation
- **Neck**: Full range

**Potential Total**: 60+ assessments

---

## Workflow Paths (All Permutations)

### Path 1: Simple Quick Assessment
```
User Type: Elderly
Duration: 2-3 minutes
Steps: 7

1. Open app
2. [Simple Mode Auto-Detected or Selected]
3. Select Joint (4 big cards)
4. Select Side (Left/Right toggle)
5. Select Movement (2-4 cards with icons)
6. Watch Demo (3x auto-play, can't skip)
7. Perform Movement
   → Camera auto-starts
   → Real-time angle display (160px)
   → Encouragement messages
   → "Done" when satisfied
8. See Simple Result
   → "Great! 152°"
   → "Very Good"
   → "Save" button
9. [Option: Measure Another or Exit]

Choices Made: 3
Total Clicks: ~5
```

### Path 2: Advanced Single Assessment
```
User Type: Therapist/Tech-Savvy
Duration: 5-8 minutes
Steps: 10+

1. Open app
2. [Advanced Mode Selected]
3. Choose Assessment Type
   ○ Single Movement
   ○ Full Joint (all movements)
   ○ Bilateral Comparison
   ○ Custom Protocol
4. Configure Settings
   ☑ Show demo
   ☑ Record video
   ☑ Save compensations
   ☑ Enable AI feedback
5. Select Joint + Side
6. Select Movement(s)
   [Multi-select if Full Joint]
7. For Each Movement:
   a. Watch Demo (can skip if familiar)
   b. Perform Movement
   c. See Detailed Feedback
      → Angle: 152°
      → Quality: Excellent
      → Compensations: None
      → Secondary joints: Elbow 175° ✓
      → AI Insight: "Good form"
8. View Comprehensive Report
   → All movements tabulated
   → Graphs
   → Comparisons to normative data
9. Export Options
   ○ PDF Report
   ○ CSV Data
   ○ Video + Data
   ○ Share with Patient
10. [Continue or Exit]

Choices Made: 8+
Total Clicks: 12+
```

### Path 3: Bilateral Comparison
```
User Type: Any
Duration: 4-6 minutes
Purpose: Compare left vs right

1. Open app
2. Select "Bilateral Comparison"
3. Select Joint
4. Select Movement
5. Watch Demo Once
6. Perform LEFT Side
   → Display: "Left Side - 145°"
7. [Auto-Transition]
8. Perform RIGHT Side
   → Display: "Right Side - 152°"
9. See Comparison Screen
   ┌─────────────────────────┐
   │  Left    │    Right     │
   │  145°    │    152°      │
   │  Good    │  Excellent   │
   │          │              │
   │  Difference: 7° (5%)    │
   │  ✓ Within normal range  │
   └─────────────────────────┘
10. [Save or Retry]

Choices Made: 3
Total Clicks: 6
```

### Path 4: Full Joint Assessment
```
User Type: Therapist or Progress Tracking
Duration: 10-15 minutes
Purpose: Assess all movements for one joint

1. Open app
2. Select "Full Joint Assessment"
3. Select Joint (e.g., Shoulder)
4. [Auto-loads all 4 movements for shoulder]
5. Select Side
6. See Movement Checklist:
   □ Forward Flexion (160°)
   □ Abduction (160°)
   □ External Rotation (90°)
   □ Internal Rotation (70°)
7. For Each Movement (4× loop):
   a. Watch Demo
   b. Perform
   c. Quick Result
   d. ✓ Mark Complete
8. See Full Summary
   ┌──────────────────────────┐
   │ Left Shoulder Summary    │
   ├──────────────────────────┤
   │ Flexion:      152° (95%) │
   │ Abduction:    145° (91%) │
   │ Ext Rotation:  85° (94%) │
   │ Int Rotation:  62° (89%) │
   ├──────────────────────────┤
   │ Overall: Good            │
   │ Recommendations: [...]   │
   └──────────────────────────┘
9. [Save Report]

Choices Made: 3
Measurements: 4
Duration: ~12 min (3 min each)
```

### Path 5: Prescribed Protocol
```
User Type: Patient with therapist prescription
Duration: Variable
Purpose: Follow exact protocol from therapist

1. Open app
2. [Protocol Auto-Loads or QR Code Scan]
3. See Protocol Overview:
   "Dr. Smith's Shoulder Recovery Protocol"
   Week 3, Day 2
   Movements: 3
   Est. Time: 8 minutes
4. [Start Protocol]
5. Guided Sequence (auto-advances):
   → Movement 1/3: Right Shoulder Flexion
   → Movement 2/3: Right Shoulder Abduction
   → Movement 3/3: Bilateral Comparison - Ext Rotation
6. Each movement pre-configured:
   - Demo settings
   - Target angles
   - Reps required
   - Rest periods
7. Results Auto-Sent to Therapist
8. See Next Session Preview
   "Next: Tomorrow, 3 movements"

Choices Made: 1 (Start)
Total Clicks: 2
Highly Automated
```

### Path 6: Progress Tracking
```
User Type: Any (repeat user)
Duration: 3-5 minutes
Purpose: Compare to previous assessments

1. Open app
2. Select "Progress Tracking"
3. See History:
   Nov 14: Shoulder Flexion - 152°
   Nov 11: Shoulder Flexion - 148°
   Nov 8:  Shoulder Flexion - 142°
4. Select "Retry Shoulder Flexion"
5. [Skips demo - familiar movement]
6. Perform Movement
7. See Comparison:
   ┌─────────────────────────┐
   │ Today: 157° ⬆️ +5°      │
   │                         │
   │ [Graph showing trend]   │
   │ 142° → 148° → 152° → 157°│
   │                         │
   │ 🎉 New Personal Best!   │
   │ +15° in 6 days          │
   └─────────────────────────┘
8. [Share or Continue]

Choices Made: 2
Smart: Remembers settings
```

---

## Modularity Architecture

### 1. Movement Configuration System

**Current Problem**: Hardcoded movements in components

**Solution**: Movement Registry Pattern

```typescript
// movements.config.json
{
  "movements": [
    {
      "id": "shoulder_flexion",
      "joint": "shoulder",
      "type": "flexion",
      "displayName": {
        "simple": "Lift Forward",
        "advanced": "Forward Flexion"
      },
      "description": {
        "simple": "Raise your arm straight in front",
        "advanced": "Glenohumeral flexion in sagittal plane"
      },
      "targetAngle": 160,
      "normalRange": { "min": 150, "max": 180 },
      "measurementFunction": "measureShoulderFlexion",
      "demos": {
        "video": "/demos/shoulder_flexion_hd.mp4",
        "3d": "/demos/shoulder_flexion_3d.glb",
        "svg": "ShoulderFlexionAnimation"
      },
      "icon": "⬆️",
      "sides": ["left", "right"],
      "secondaryJoints": ["elbow"],
      "tips": [
        "Keep elbow straight",
        "Move slowly and smoothly"
      ],
      "contraindications": [
        "Recent shoulder surgery",
        "Acute shoulder pain"
      ]
    }
    // ... 59 more movements
  ]
}
```

**Usage:**
```typescript
// MovementRegistry.ts
import movementsConfig from './movements.config.json';

export class MovementRegistry {
  static getMovement(id: string) {
    return movementsConfig.movements.find(m => m.id === id);
  }

  static getMovementsByJoint(joint: string) {
    return movementsConfig.movements.filter(m => m.joint === joint);
  }

  static addCustomMovement(movement: Movement) {
    // Therapist can add custom movements
  }
}
```

### 2. Demo Video Management System

**Multi-Format Support:**

```typescript
// DemoManager.ts
export interface DemoConfig {
  format: '2d-svg' | '3d-model' | 'video' | 'live-therapist';
  quality: 'low' | 'medium' | 'high' | '4k';
  speed: 0.5 | 1.0 | 1.5 | 2.0;
  loops: number | 'infinite';
  autoPlay: boolean;
  skipAfterView: boolean;
}

export class DemoManager {
  // Automatically selects best format based on:
  // - Device capabilities
  // - Network speed
  // - User preference
  // - Movement complexity

  async loadDemo(movementId: string, config: DemoConfig) {
    const movement = MovementRegistry.getMovement(movementId);

    switch(config.format) {
      case 'video':
        return this.loadVideo(movement.demos.video, config.quality);
      case '3d-model':
        return this.load3DModel(movement.demos['3d']);
      case '2d-svg':
        return this.loadSVGAnimation(movement.demos.svg);
      case 'live-therapist':
        return this.loadLiveStream(movement.id);
    }
  }

  // Easy to add new demo
  async uploadCustomDemo(movementId: string, file: File, format: string) {
    // Therapist uploads custom demo video
    const url = await this.storage.upload(file);
    await this.db.addDemo(movementId, { format, url });
  }
}
```

**Demo Library Structure:**
```
/public/demos/
├── videos/
│   ├── shoulder_flexion_hd.mp4
│   ├── shoulder_flexion_4k.mp4
│   ├── shoulder_flexion_low.mp4
│   └── [60 more movements × 3 qualities]
├── 3d-models/
│   ├── shoulder_flexion.glb
│   ├── shoulder_flexion_skeleton.glb
│   └── [60 more]
├── thumbnails/
│   └── [60 thumbnails]
└── custom/
    └── [therapist uploads]
```

### 3. Assessment Protocol System

**Protocol Templates:**

```typescript
// protocols.config.json
{
  "protocols": [
    {
      "id": "post_rotator_cuff_week_1",
      "name": "Post Rotator Cuff Surgery - Week 1",
      "description": "Gentle ROM exercises",
      "duration": "10-15 minutes",
      "frequency": "2x daily",
      "movements": [
        {
          "movementId": "shoulder_flexion",
          "side": "affected",
          "targetAngle": 90,  // Limited in week 1
          "reps": 10,
          "holdTime": 3,
          "restBetween": 30,
          "feedback": "detailed",
          "stopIfPain": true
        },
        {
          "movementId": "shoulder_external_rotation",
          "side": "affected",
          "targetAngle": 30,  // Very limited
          "reps": 10
        }
      ],
      "restrictions": {
        "maxAngle": 90,
        "noWeights": true,
        "noPainTolerance": 0
      }
    }
  ]
}
```

**Protocol Manager:**
```typescript
export class ProtocolManager {
  static loadProtocol(protocolId: string) {
    // Load from config or therapist prescription
  }

  static createCustomProtocol(movements: Movement[], settings: Settings) {
    // Therapist creates custom protocol
  }

  static shareProtocol(protocolId: string, patientId: string) {
    // Generate QR code or deep link
  }
}
```

### 4. Feedback & Coaching System

**Modular Feedback Templates:**

```typescript
// feedback.config.json
{
  "templates": {
    "encouraging": {
      "0-25": ["Great start!", "You're doing it!", "Keep going!"],
      "25-50": ["Awesome!", "Halfway there!", "You've got this!"],
      "50-75": ["Fantastic!", "Almost there!", "So close!"],
      "75-95": ["Wonderful!", "Nearly perfect!", "Just a bit more!"],
      "95-100": ["Perfect!", "Amazing!", "You did it!"]
    },
    "clinical": {
      "0-25": ["Begin movement", "Initial phase", "Continue"],
      "25-50": ["Mid-range achieved", "Continue movement"],
      "50-75": ["Good progress", "Approaching target"],
      "75-95": ["Near target angle", "Maintain form"],
      "95-100": ["Target achieved", "Hold position"]
    },
    "silent": {
      // Just numbers, no commentary
    }
  },
  "languages": {
    "en": { /* English */ },
    "es": { /* Spanish */ },
    "zh": { /* Chinese */ }
  }
}
```

**AI Coaching Integration:**

```typescript
export class AICoach {
  // Real-time posture feedback
  async analyzePosture(pose: PoseData, movement: Movement) {
    const issues = [];

    // Check compensations
    if (pose.trunkLean > 10) {
      issues.push({
        type: 'trunk_lean',
        severity: 'moderate',
        message: 'Try to keep your back straight',
        voiceGuidance: true
      });
    }

    // Check form
    if (movement.id === 'shoulder_flexion' && pose.elbowAngle < 170) {
      issues.push({
        type: 'elbow_bent',
        severity: 'mild',
        message: 'Straighten your elbow',
        visualCue: 'highlight_elbow'
      });
    }

    return issues;
  }

  // Voice coaching
  async provideVoiceGuidance(message: string, urgency: 'low' | 'medium' | 'high') {
    await TextToSpeech.speak(message, {
      rate: urgency === 'high' ? 1.2 : 1.0,
      voice: this.settings.voicePreference
    });
  }
}
```

---

## User Choice Decision Tree (Complete)

```
START
│
├─ First Time User?
│  ├─ Yes → Onboarding Tutorial (3 screens)
│  │        → Auto-select Simple Mode
│  │        → Guided first assessment
│  └─ No  → Show Home Screen
│
├─ HOME SCREEN
│  ├─ Interface Mode Selection
│  │  ├─ Simple Mode (auto if elderly detected)
│  │  └─ Advanced Mode
│  │
│  ├─ Quick Actions (for returning users)
│  │  ├─ Repeat Last Assessment
│  │  ├─ Continue Protocol
│  │  └─ New Assessment
│  │
│  └─ Main Menu
│     ├─ Start Assessment →
│     ├─ View Progress
│     ├─ Load Protocol
│     └─ Settings
│
├─ ASSESSMENT TYPE
│  ├─ Quick Single (most common)
│  ├─ Full Joint (all movements)
│  ├─ Bilateral Comparison
│  ├─ Multi-Joint
│  ├─ Custom Sequence
│  └─ Load Prescription
│
├─ CONFIGURATION (if Advanced)
│  ├─ Demo Settings
│  │  ├─ Format: 2D / 3D / Video / Skip
│  │  ├─ Loops: 1 / 3 / Until Ready
│  │  ├─ Speed: 0.5× / 1× / 1.5×
│  │  └─ Can Skip: Yes / No
│  │
│  ├─ Feedback Level
│  │  ├─ Minimal (angle only)
│  │  ├─ Standard (angle + progress)
│  │  ├─ Detailed (+ quality)
│  │  └─ Expert (all metrics + AI)
│  │
│  ├─ Recording
│  │  ├─ None
│  │  ├─ Data only
│  │  ├─ Video + Data
│  │  └─ Live Stream
│  │
│  ├─ AI Coaching
│  │  ├─ Off
│  │  ├─ Visual cues only
│  │  ├─ Voice guidance only
│  │  └─ Both
│  │
│  └─ Personality
│     ├─ Encouraging
│     ├─ Clinical
│     └─ Silent
│
├─ JOINT SELECTION
│  ├─ Shoulder
│  ├─ Elbow
│  ├─ Knee
│  ├─ Hip
│  └─ [Future: Wrist, Ankle, Spine, Neck]
│
├─ SIDE SELECTION
│  ├─ Left
│  ├─ Right
│  └─ Both (bilateral)
│
├─ MOVEMENT SELECTION
│  ├─ Single Movement
│  └─ Multiple Movements (checklist)
│
├─ DEMO INTERACTION
│  ├─ Watch (auto-plays)
│  ├─ Replay
│  ├─ Skip (if allowed)
│  ├─ Slow Motion
│  └─ Ready → Start
│
├─ MEASUREMENT INTERACTION
│  ├─ Manual Start/Stop
│  ├─ Auto-Detect Movement
│  ├─ Pause
│  ├─ Retry
│  └─ Done
│
├─ RESULT VIEW
│  ├─ Simple Result
│  │  └─ Angle + Grade
│  └─ Advanced Result
│     ├─ All Metrics
│     ├─ Graphs
│     ├─ AI Insights
│     └─ Recommendations
│
└─ POST-ASSESSMENT
   ├─ Save & Exit
   ├─ Save & Continue (next movement)
   ├─ Retry Same
   ├─ Compare to History
   ├─ Share with Therapist
   ├─ Export Report
   │  ├─ PDF
   │  ├─ CSV
   │  ├─ Video
   │  └─ Email
   └─ Start New Assessment
```

---

## Implementation Priority

### Phase 1: Core Modularity (Week 1-2)
1. ✅ Movement Registry System
2. ✅ Demo Manager (basic)
3. ✅ Protocol System (basic)
4. ✅ User Preferences Store

### Phase 2: Enhanced Features (Week 3-4)
1. ✅ Advanced Mode Implementation
2. ✅ Bilateral Comparison
3. ✅ Full Joint Assessment
4. ✅ Progress Tracking

### Phase 3: AI & Voice (Week 5-6)
1. 🔄 Real-time Posture Feedback
2. 🔄 Voice Command Integration
3. 🔄 TTS Coaching
4. 🔄 AI Insights

### Phase 4: Professional Tools (Week 7-8)
1. 📋 Custom Protocols
2. 📋 Multi-Patient Management
3. 📋 Report Generation
4. 📋 Research Export

---

## Next Steps

Should I implement:
1. **Movement Registry System** (makes everything modular)
2. **Advanced Mode Screen** (full-featured for therapists)
3. **Protocol System** (prescribed assessments)
4. **All of the above** (comprehensive implementation)
