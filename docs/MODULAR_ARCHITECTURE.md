# PhysioAssist Modular Architecture

## Overview

This document describes the complete modular architecture that makes PhysioAssist extensible, maintainable, and easy to customize without code changes.

## Architecture Principles

### 1. Data-Driven Design
- All movements, protocols, and demos are defined in configuration files
- Adding new movements requires NO code changes - just config updates
- Easy for non-developers to extend (therapists can add custom protocols)

### 2. Registry Pattern
- Central registries for movements, demos, and protocols
- Single source of truth for all assessment data
- Type-safe access through utility classes

### 3. Multi-Mode Support
- Simple Mode: For elderly/first-time users
- Advanced Mode: For therapists and power users
- Both modes use same underlying data with different UI

### 4. Progressive Disclosure
- Show only what's needed at each step
- One thing per screen in Simple Mode
- Optional drill-down in Advanced Mode

### 5. Easy Extensibility
- Drop in new demo videos without touching code
- Add custom protocols via JSON/config
- Plugin architecture for future enhancements

---

## Core Components

### 1. Movement Registry (`src/config/movements.config.ts`)

**Purpose:** Central database of all measurable joint movements

**Key Features:**
- 10 movements fully defined (shoulder: 4, elbow: 2, knee: 2, hip: 2)
- Dual display names (simple + advanced)
- Dual descriptions (simple + advanced)
- Dual tips (simple + advanced)
- Multi-format demo support (SVG, video, 3D)
- Target angles and normal ranges
- Clinical metadata
- Tags for filtering

**Example Movement Definition:**
```typescript
{
  id: 'shoulder_flexion',
  joint: 'shoulder',
  type: 'flexion',
  displayName: {
    simple: 'Lift Forward',
    advanced: 'Forward Flexion',
  },
  description: {
    simple: 'Raise your arm straight in front of you',
    advanced: 'Glenohumeral flexion in the sagittal plane with elbow extended',
  },
  targetAngle: 160,
  normalRange: { min: 150, max: 180 },
  measurementFunction: 'measureShoulderFlexion',
  demos: {
    svg: 'ShoulderFlexionAnimation',
    video: '/demos/videos/shoulder_flexion_hd.mp4',
    '3d': '/demos/3d/shoulder_flexion.glb',
    thumbnail: '/demos/thumbnails/shoulder_flexion.jpg',
  },
  tips: {
    simple: [
      'Keep your elbow straight',
      'Move slowly and smoothly',
      'Go as high as comfortable',
      'Stop if you feel pain',
    ],
    advanced: [
      'Maintain scapular stability',
      'Observe for scapulothoracic rhythm',
      'Note any compensatory trunk extension',
      'Assess for pain arc',
    ],
  },
  // ... more fields
}
```

**Usage in Components:**
```typescript
// Get all shoulder movements
const shoulderMovements = MovementRegistry.getMovementsByJoint('shoulder');

// Get specific movement
const flexion = MovementRegistry.getMovement('shoulder_flexion');

// Get display name based on mode
const name = MovementRegistry.getDisplayName('shoulder_flexion', 'simple');
// Returns: "Lift Forward"
```

**Easy to Extend:**
To add a new movement (e.g., hip flexion):
1. Add entry to `MOVEMENT_REGISTRY` array
2. Define all fields (display names, descriptions, tips, demos)
3. No code changes needed - components auto-update

---

### 2. Demo Manager (`src/services/DemoManager.ts`)

**Purpose:** Intelligent demo content loading and format selection

**Key Features:**
- Multi-format support (SVG, 3D, video HD/SD/low)
- Auto-selects best format based on device + network
- Demo caching for performance
- Preloading for protocols
- Quality variants for different network speeds

**Format Selection Logic:**
```typescript
if (isLowEndDevice) {
  return 'svg'; // Lightweight
}

if (supports3D && hasFastNetwork) {
  return '3d'; // Best experience
}

if (hasVideo && hasMediumNetwork) {
  return 'video'; // Good balance
}

return 'svg'; // Universal fallback
```

**Usage:**
```typescript
import { demoManager } from '@services/DemoManager';

// Get best demo for current device
const demo = await demoManager.getDemoAsset('shoulder_flexion', {
  autoDetect: true,
  cacheEnabled: true,
  preload: true,
});

console.log(demo.format); // 'video'
console.log(demo.uri); // '/demos/videos/shoulder_flexion_hd.mp4'
console.log(demo.quality); // 'hd'

// Preload all demos for a protocol
await demoManager.preloadDemos([
  'shoulder_flexion',
  'shoulder_abduction',
  'shoulder_external_rotation',
]);
```

**Benefits:**
- Users on slow networks get lightweight SVG
- Users on fast networks get beautiful 3D/video
- Transparent to UI components
- Easy to add new formats

---

### 3. Protocol System (`src/config/protocols.config.ts`)

**Purpose:** Pre-configured assessment workflows for clinical scenarios

**Key Features:**
- 6 built-in protocols (rotator cuff, ACL, TKR, general assessments)
- Ordered steps with instructions
- Expected target values for each step
- Timeframe tracking (post-surgery week X)
- Bilateral comparison requirements
- Author/credential attribution
- QR code sharing for therapist prescriptions

**Example Protocol:**
```typescript
{
  id: 'rotator_cuff_week6',
  name: 'Post Rotator Cuff Surgery - Week 6',
  description: 'Progressive ROM assessment. Beginning active-assisted movements.',
  category: 'post-surgery',
  timeframe: {
    week: 6,
    phase: 'Active-Assisted ROM Phase',
  },
  steps: [
    {
      order: 1,
      movementId: 'shoulder_flexion',
      required: true,
      instructions: 'Active-assisted movement. Goal: 140°+',
      targets: {
        minAngle: 120,
        maxAngle: 160,
      },
    },
    // ... more steps
  ],
  estimatedDuration: 20,
  difficulty: 'intermediate',
  requiresBilateralComparison: true,
  tags: ['shoulder', 'post-surgery', 'rotator-cuff'],
}
```

**Usage:**
```typescript
import { ProtocolManager } from '@config/protocols.config';

// Get protocol
const protocol = ProtocolManager.getProtocol('rotator_cuff_week6');

// Get ordered steps
const steps = ProtocolManager.getProtocolSteps('rotator_cuff_week6');

// Filter by category
const postSurgeryProtocols = ProtocolManager.getProtocolsByCategory('post-surgery');

// Search
const kneeProtocols = ProtocolManager.searchProtocols('knee');

// Generate shareable link
const link = ProtocolManager.generateProtocolLink('rotator_cuff_week6');
// Returns: 'physioassist://protocol/rotator_cuff_week6'
```

**Use Cases:**

1. **Therapist Prescription:**
   - Therapist selects protocol
   - Generates QR code
   - Patient scans and follows prescribed workflow

2. **Post-Surgery Tracking:**
   - Week 1: Limited passive ROM
   - Week 6: Active-assisted
   - Week 12: Full active ROM
   - Auto-adjusts targets per week

3. **Research Studies:**
   - Standardized protocols across sites
   - Consistent measurement approach
   - Data comparison

---

### 4. V2 Components (Refactored to Use Registries)

All V2 components now use the centralized registries instead of hardcoded data:

#### **JointSelectionPanelV2**
- Gets joint list from `AVAILABLE_JOINTS`
- Gets joint info from `JOINT_METADATA`
- Dynamically generates voice prompts
- Auto-updates when joints added to registry

#### **MovementSelectionPanelV2**
- Gets movements via `MovementRegistry.getMovementsByJoint()`
- Shows simple display names
- Shows simple descriptions
- Target angles from registry

#### **MovementDemoScreen**
- Gets movement definition from registry
- Loads tips from `movementDef.tips.simple`
- Loads description from `movementDef.description.simple`
- Future: Will load demo via DemoManager

---

## Workflow Examples

### Workflow 1: Simple Quick Assessment

**User:** Elderly patient at home

**Flow:**
1. Open app → Simple Mode auto-selected
2. **JointSelectionPanelV2** shows 4 large cards
   - Data from: `JOINT_METADATA`
3. Tap "Shoulder" → Tap "Left"
4. **MovementSelectionPanelV2** shows 4 movements
   - Data from: `MovementRegistry.getMovementsByJoint('shoulder')`
   - Displays: Simple names ("Lift Forward" not "Flexion")
5. Tap "Lift Forward"
6. **MovementDemoScreen** shows animated demo
   - Data from: `MovementRegistry.getMovement('shoulder_flexion')`
   - Tips from: `movementDef.tips.simple`
   - Demo via: `demoManager.getDemoAsset()` (auto-selects SVG for slow network)
7. Tap "I'm Ready"
8. **ClinicalAngleDisplayV2** shows 160px angle
   - Target from: `movementDef.targetAngle`
9. Done → Celebration screen

**Data flow:**
```
JOINT_METADATA → JointSelectionPanelV2
MOVEMENT_REGISTRY → MovementSelectionPanelV2
MOVEMENT_REGISTRY → MovementDemoScreen
MOVEMENT_REGISTRY → ClinicalAngleDisplayV2
```

### Workflow 2: Prescribed Protocol

**User:** Post-surgery patient with QR code from therapist

**Flow:**
1. Scan QR code: `physioassist://protocol/rotator_cuff_week6`
2. App loads protocol via `ProtocolManager.getProtocol()`
3. **ProtocolScreen** shows:
   - Protocol name
   - Description
   - 4 steps in order
   - Estimated time: 20 min
4. Start Protocol
5. For each step in `protocol.steps`:
   - Get movement: `MovementRegistry.getMovement(step.movementId)`
   - Show demo
   - Perform measurement
   - Check against `step.targets`
   - Show ✓ or ✗ based on targets
6. Complete protocol → Summary report
   - 3/4 targets met
   - Step 2 needs work (only 110° vs target 120°)

**Data flow:**
```
QR Code → ProtocolManager
ProtocolManager → Get protocol with steps
Each step → MovementRegistry → Get movement definition
Movement definition → DemoManager → Get demo
Movement definition → MeasurementService → Perform measurement
```

### Workflow 3: Therapist Creating Custom Protocol

**User:** Physical therapist creating custom protocol

**Flow:**
1. Open Advanced Mode → "Create Protocol"
2. Enter protocol metadata:
   - Name: "ACL Reconstruction - Week 8"
   - Category: Post-Surgery
   - Week: 8
3. Add steps:
   - Step 1: Select "Knee Extension" from registry
     - Set target: 0° ± 2°
     - Add instruction: "Full extension critical"
   - Step 2: Select "Knee Flexion" from registry
     - Set target: 110-120°
     - Add instruction: "Progressive overpressure"
4. Save protocol
5. Generate QR code
6. Share with patients via email/print

**Result:** New protocol added to `PROTOCOL_REGISTRY` (can be custom or saved to user's library)

---

## Adding New Content (No Code Required!)

### Adding a New Movement

**Example:** Add "Hip Extension"

1. Open `src/config/movements.config.ts`
2. Add to `MOVEMENT_REGISTRY`:

```typescript
{
  id: 'hip_extension',
  joint: 'hip',
  type: 'extension',
  displayName: {
    simple: 'Kick Back',
    advanced: 'Hip Extension',
  },
  description: {
    simple: 'Move your leg straight back behind you',
    advanced: 'Hip extension in the sagittal plane from neutral',
  },
  targetAngle: 20,
  normalRange: { min: 10, max: 30 },
  measurementFunction: 'measureHipExtension', // Add to ClinicalMeasurementService
  demos: {
    svg: 'HipExtensionAnimation',
    video: '/demos/videos/hip_extension_hd.mp4',
    thumbnail: '/demos/thumbnails/hip_extension.jpg',
  },
  icon: '⬇️',
  sides: ['left', 'right'],
  tips: {
    simple: [
      'Keep your knee straight',
      'Don\'t arch your back',
      'Move slowly',
      'Stop if you feel pain',
    ],
    advanced: [
      'Stabilize pelvis to prevent anterior tilt',
      'Monitor for lumbar lordosis compensation',
      'Assess hamstring flexibility',
    ],
  },
  contraindications: ['Acute hip flexor strain', 'Recent hip surgery'],
  tags: ['hip', 'lower-extremity', 'extension', 'gait'],
}
```

3. Save file
4. **All components auto-update:**
   - JointSelectionPanelV2: Shows "Hip" option
   - MovementSelectionPanelV2: Shows "Kick Back" option
   - MovementDemoScreen: Shows tips and description
   - ClinicalAngleDisplayV2: Shows target 20°

### Adding a New Demo Video

**Example:** Add HD video for shoulder flexion

1. Record 10-second demo video
2. Export in 3 qualities:
   - `shoulder_flexion_hd.mp4` (1080p, 15MB)
   - `shoulder_flexion_sd.mp4` (720p, 5MB)
   - `shoulder_flexion_low.mp4` (480p, 2MB)
3. Upload to `/demos/videos/`
4. Update movement definition:

```typescript
{
  id: 'shoulder_flexion',
  // ... other fields
  demos: {
    svg: 'ShoulderFlexionAnimation',
    video: '/demos/videos/shoulder_flexion_hd.mp4', // ← Add this
    thumbnail: '/demos/thumbnails/shoulder_flexion.jpg',
  },
}
```

5. DemoManager will now:
   - Auto-detect best quality for device
   - Load HD on fast network
   - Load SD on medium network
   - Load low on slow network
   - Cache for offline use

### Adding a New Protocol

**Example:** Add "Frozen Shoulder Week 4"

1. Open `src/config/protocols.config.ts`
2. Add to `PROTOCOL_REGISTRY`:

```typescript
{
  id: 'frozen_shoulder_week4',
  name: 'Frozen Shoulder Recovery - Week 4',
  description: 'Progressive stretching protocol for adhesive capsulitis.',
  category: 'injury-recovery',
  conditions: ['Adhesive capsulitis', 'Frozen shoulder'],
  timeframe: {
    week: 4,
    phase: 'Aggressive Stretching Phase',
  },
  steps: [
    {
      order: 1,
      movementId: 'shoulder_flexion',
      required: true,
      instructions: 'Gentle overpressure. Hold 30 seconds.',
      targets: { minAngle: 120 },
    },
    {
      order: 2,
      movementId: 'shoulder_abduction',
      required: true,
      instructions: 'Side-lying position. Gravity-assisted.',
      targets: { minAngle: 100 },
    },
    {
      order: 3,
      movementId: 'shoulder_external_rotation',
      required: true,
      instructions: 'Sleeper stretch position.',
      targets: { minAngle: 45 },
    },
  ],
  estimatedDuration: 25,
  difficulty: 'intermediate',
  requiresBilateralComparison: true,
  tags: ['shoulder', 'frozen-shoulder', 'adhesive-capsulitis', 'stretching'],
  createdAt: '2025-01-15',
  updatedAt: '2025-01-15',
}
```

3. Save file
4. Protocol immediately available:
   - Searchable: `ProtocolManager.searchProtocols('frozen shoulder')`
   - Shareable: QR code generation
   - Trackable: Progress over time

---

## Benefits of Modular Architecture

### For Developers:
✅ No hardcoded strings - everything in configs
✅ Type-safe access via utility classes
✅ Easy testing - mock registries
✅ Clear separation of concerns
✅ Scalable to 100+ movements without complexity

### For Therapists:
✅ Add custom movements via JSON (future feature)
✅ Create custom protocols without coding
✅ Share protocols via QR codes
✅ Brand with institution name/credentials

### For Patients:
✅ Simple mode hides complexity
✅ Consistent experience across movements
✅ Demos auto-optimized for device
✅ Prescribed workflows easy to follow

### For Researchers:
✅ Standardized protocols ensure consistency
✅ Easy to add new assessment types
✅ Multi-site studies use same config
✅ Data export includes protocol metadata

---

## Future Enhancements

### 1. Therapist Portal (Web)
- Upload custom demo videos
- Create custom protocols via drag-drop
- Assign protocols to patients
- Track patient compliance

### 2. Plugin System
- Custom movement types (e.g., yoga poses)
- Third-party demo providers
- Custom measurement algorithms
- Export to EMR systems

### 3. AI Coach Integration
- Real-time posture feedback via AI
- Voice coaching ("Lift higher", "Keep elbow straight")
- Automatic quality scoring
- Personalized tips based on performance

### 4. Multi-Language Support
All display names, descriptions, and tips support multiple languages:

```typescript
displayName: {
  simple: {
    en: 'Lift Forward',
    es: 'Levantar hacia adelante',
    fr: 'Lever vers l'avant',
  },
  advanced: {
    en: 'Forward Flexion',
    es: 'Flexión anterior',
    fr: 'Flexion antérieure',
  },
}
```

---

## Migration Guide

### From V1 (Hardcoded) to V2 (Modular)

**Before (V1):**
```typescript
const movements = [
  { type: 'flexion', label: 'Forward Flexion', target: 160 },
  { type: 'abduction', label: 'Abduction', target: 160 },
];
```

**After (V2):**
```typescript
import { MovementRegistry } from '@config/movements.config';

const movements = MovementRegistry.getMovementsByJoint('shoulder');
// Auto-includes all 4 shoulder movements with full metadata
```

**Migration Steps:**
1. Replace hardcoded arrays with registry calls
2. Update references to use `movementDef.displayName.simple`
3. Replace static tips with `movementDef.tips.simple`
4. Update demo loading to use DemoManager
5. Test both Simple and Advanced modes

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Simple Mode  │  │Advanced Mode │  │Protocol Mode │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     V2 Components                            │
│  ┌──────────────────────┐  ┌───────────────────────┐        │
│  │JointSelectionPanelV2 │  │MovementSelectionPanelV2│       │
│  └──────────────────────┘  └───────────────────────┘        │
│  ┌──────────────────────┐  ┌───────────────────────┐        │
│  │MovementDemoScreen    │  │ClinicalAngleDisplayV2 │        │
│  └──────────────────────┘  └───────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Registry & Manager Layer                    │
│  ┌──────────────────┐  ┌─────────────┐  ┌────────────┐     │
│  │MovementRegistry  │  │DemoManager  │  │ProtocolMgr │     │
│  └──────────────────┘  └─────────────┘  └────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Configuration Layer                        │
│  ┌─────────────────────┐  ┌──────────────────────┐          │
│  │movements.config.ts  │  │protocols.config.ts   │          │
│  │ - 10 movements      │  │ - 6 protocols        │          │
│  │ - Dual mode names   │  │ - Clinical workflows │          │
│  │ - Tips & targets    │  │ - Shareable QR codes │          │
│  └─────────────────────┘  └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Assets Layer                            │
│  ┌──────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐       │
│  │SVG Anims │  │3D Models│  │Videos  │  │Thumbnails│       │
│  └──────────┘  └─────────┘  └────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

The modular architecture achieves:

1. **Extensibility:** Add movements, demos, protocols without code changes
2. **Maintainability:** Single source of truth for all data
3. **Scalability:** Handles 10 movements today, 100+ movements tomorrow
4. **Flexibility:** Simple and Advanced modes from same data
5. **Shareability:** QR codes for protocol prescriptions
6. **Performance:** Smart caching and format selection
7. **Clinical Validity:** Evidence-based protocols from experts
8. **User-Friendly:** Therapists can customize without developers

**Next Steps:**
1. ✅ Movement Registry - Complete
2. ✅ Demo Manager - Complete
3. ✅ Protocol System - Complete
4. ✅ V2 Component Refactoring - Complete
5. ⏳ Therapist Portal (Future)
6. ⏳ AI Coach Integration (Future)
7. ⏳ Multi-Language Support (Future)
