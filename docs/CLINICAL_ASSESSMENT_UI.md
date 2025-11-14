# Clinical Assessment UI - Comprehensive Guide

## Overview

The Clinical Assessment UI provides a patient-friendly, frictionless workflow for physiotherapy joint assessments with real-time angle measurement and clinical feedback.

## Design Philosophy

### 1. Patient-Centric Design
- **Large, Easy-to-Read Angles**: 96px font size for primary angle display
- **Color-Coded Feedback**: Intuitive color progression from blue (starting) → green (excellent)
- **Encouraging Messages**: Dynamic instructions that motivate and guide
- **Accessibility**: Full screen reader support, ARIA labels, accessible color contrast

### 2. Frictionless Workflow
```
Select Joint & Movement → Start Assessment → Real-Time Feedback → Complete & Review
       (30 seconds)              (2-5 minutes)      (continuous)        (review)
```

### 3. Clinical Accuracy
- Based on AAOS (American Academy of Orthopaedic Surgeons) standards
- ISB-compliant measurement protocols
- Compensation detection and quality assessment
- Multi-plane angle display for complex joints (shoulder)

## Components

### 1. JointSelectionPanel (`src/components/clinical/JointSelectionPanel.tsx`)

**Purpose**: Allow users to select which joint and movement to assess

**Features**:
- Expandable joint categories (Shoulder, Elbow, Knee, Hip)
- Movement type selection with descriptions
- Side selection (Left/Right)
- Target angle display for each movement
- Visual feedback for selected items

**Usage**:
```typescript
import { JointSelectionPanel } from '@components/clinical';

<JointSelectionPanel
  selectedJoint={selectedJoint}
  selectedMovement={selectedMovement}
  onSelectJoint={setSelectedJoint}
  onSelectMovement={setSelectedMovement}
  onConfirm={handleConfirmSelection}
  side={selectedSide}
  onSelectSide={setSelectedSide}
/>
```

**Available Joints & Movements**:

**Shoulder**:
- Forward Flexion (160° target) - "Lifting arm to the front"
- Abduction (160° target) - "Lifting arm to the side"
- External Rotation (90° target) - "Turning outwards"
- Internal Rotation (70° target) - "Turning inwards"

**Elbow**:
- Flexion (150° target) - "Bending the elbow"
- Extension (0° target) - "Straightening the elbow"

**Knee**:
- Flexion (135° target) - "Bending the knee"
- Extension (0° target) - "Straightening the knee"

**Hip**:
- Flexion (120° target) - "Lifting leg forward"
- Abduction (45° target) - "Lifting leg to the side"

### 2. ClinicalAngleDisplay (`src/components/clinical/ClinicalAngleDisplay.tsx`)

**Purpose**: Display real-time angle measurements with clinical context

**Features**:
- **Primary Angle Display**: Large, color-coded angle value (96px font)
- **Target & Progress**: Progress bar showing % of target achieved
- **Clinical Grade Badge**: Visual indicator of clinical quality (Excellent/Good/Fair/Limited)
- **Multi-Plane Display**: For shoulder - shows Glenohumeral, Scapulothoracic, and Rhythm ratio
- **Quality Indicators**: Tracking quality with recommendations
- **Compensation Alerts**: Visual warnings for detected compensations
- **Secondary Joints**: Monitor supporting joints for proper form

**Usage**:
```typescript
import { ClinicalAngleDisplay } from '@components/clinical';

<ClinicalAngleDisplay
  measurement={currentMeasurement}
  showMultiPlane={true}
  showTarget={true}
  showQuality={true}
  showCompensations={true}
  compact={false}
/>
```

**Props**:
- `measurement`: ClinicalJointMeasurement object from measurement service
- `showMultiPlane`: Display scapulohumeral rhythm for shoulder (default: true)
- `showTarget`: Show target angle and progress bar (default: true)
- `showQuality`: Show tracking quality indicators (default: true)
- `showCompensations`: Show detected compensations (default: true)
- `compact`: Use compact layout (default: false)

**Visual Hierarchy**:
```
┌─────────────────────────────────────┐
│         Forward Flexion             │  ← Movement type
│                                     │
│            145°                     │  ← Large angle (color-coded)
│                                     │
│        ✓ Excellent                  │  ← Clinical grade badge
│                                     │
│  Target: 160°            91%        │  ← Target & percentage
│  ████████████████░░░░               │  ← Progress bar
│                                     │
│  🎯 Target Achieved!                │  ← Success message (if 100%)
│                                     │
│  Tracking Quality: ● Excellent      │  ← Quality indicator
│  • Good arm alignment               │  ← Recommendations
│                                     │
│  ⚠ Compensations Detected           │  ← Compensation alerts
│  trunk_lean            mild         │
│                                     │
│  Secondary Joints                   │  ← Supporting joints
│  left_elbow: 175° ✓                 │
└─────────────────────────────────────┘
```

### 3. ClinicalAssessmentScreen (`src/screens/ClinicalAssessmentScreen.tsx`)

**Purpose**: Main assessment workflow screen for mobile

**Workflow Phases**:

1. **Setup Phase**:
   - Show JointSelectionPanel modal
   - User selects joint, movement, and side
   - Confirm selection

2. **Ready Phase**:
   - Camera view active
   - "Change Selection" button available
   - "Start Assessment" button visible
   - Instructions: "Position yourself in camera view, then tap Start"

3. **Assessing Phase**:
   - Real-time pose detection
   - Live angle measurement
   - ClinicalAngleDisplay showing current angles
   - Dynamic instructions based on progress
   - "Stop" button to end assessment

4. **Complete Phase**:
   - Summary card with:
     - Max angle achieved
     - Clinical grade
     - Target achievement %
   - "New Assessment" button to restart

**Features**:
- Haptic feedback on key actions
- Smooth animations between phases
- Real-time tracking of max angle achieved
- Auto-compensation detection
- Selection badge showing current assessment parameters

### 4. WebClinicalAssessmentScreen (`src/screens/web/WebClinicalAssessmentScreen.tsx`)

**Purpose**: Web-optimized version using webcam

**Differences from Mobile**:
- Uses `<video>` element instead of react-native-vision-camera
- Manual frame processing with canvas
- Desktop-friendly button layouts
- CSS styling instead of StyleSheet
- No haptic feedback

## Color Coding System

### Progress-Based Colors
- **Blue (#2196F3)**: Just started (0-25%)
- **Orange (#FF9800)**: Poor progress (25-50%)
- **Yellow (#FFC107)**: Fair progress (50-75%)
- **Light Green (#8BC34A)**: Good progress (75-95%)
- **Green (#4CAF50)**: Excellent/Target achieved (95-100%+)

### Quality Colors
- **Green (#4CAF50)**: Excellent quality
- **Light Green (#8BC34A)**: Good quality
- **Yellow (#FFC107)**: Fair quality
- **Red (#F44336)**: Poor quality

### Severity Colors (Compensations)
- **Light Green (#8BC34A)**: Minimal severity
- **Yellow (#FFC107)**: Mild severity
- **Orange (#FF9800)**: Moderate severity
- **Red (#F44336)**: Severe severity

## Accessibility Features

### Screen Reader Support
- All interactive elements have `accessibilityLabel`
- `accessibilityRole` for proper element identification
- `accessibilityState` for selection states
- `accessibilityLiveRegion="polite"` for dynamic content
- `accessibilityHint` for complex interactions

### Visual Accessibility
- High contrast text (white on dark backgrounds)
- Multiple feedback channels (color + text + icons)
- Large touch targets (minimum 44x44pt)
- Clear focus indicators

### Cognitive Accessibility
- One primary action per screen
- Clear, simple instructions
- Consistent layout patterns
- Visual progress indicators

## Animation & Feedback

### Animations
1. **Pulse Animation**: On target achievement (angle display pulses)
2. **Progress Bar**: Smooth spring animation following angle changes
3. **Fade In**: Instructions fade in on phase changes
4. **Button Pulse**: "Start" button pulses when ready

### Haptic Feedback (Mobile)
- **Medium Impact**: Major actions (start, stop, confirm)
- **Light Impact**: New max angle achieved, UI changes
- **Heavy Impact**: Assessment complete

## Integration Guide

### Adding to Navigation

```typescript
// In RootNavigator.tsx
import ClinicalAssessmentScreen from '@screens/ClinicalAssessmentScreen';

// Add to stack navigator
<Stack.Screen
  name="ClinicalAssessment"
  component={ClinicalAssessmentScreen}
  options={{
    title: 'Clinical Assessment',
    headerShown: false,
  }}
/>
```

### Using Measurement Service

```typescript
import { ClinicalMeasurementService } from '@services/biomechanics/ClinicalMeasurementService';

const clinicalService = new ClinicalMeasurementService();

// Measure shoulder flexion
const measurement = clinicalService.measureShoulderFlexion(poseData, 'left');

// Access results
const angle = measurement.primaryJoint.angle; // 145
const percent = measurement.primaryJoint.percentOfTarget; // 90.6
const grade = measurement.primaryJoint.clinicalGrade; // 'good'
const compensations = measurement.compensations; // []
const quality = measurement.quality.overall; // 'excellent'
```

## Best Practices

### For Therapists
1. **Proper Lighting**: Ensure patient is well-lit for best tracking
2. **Camera Position**: Place camera 6-8 feet from patient, at torso height
3. **Side View**: For flexion/extension, use side view (sagittal plane)
4. **Front View**: For abduction/adduction, use front view (coronal plane)
5. **Verbal Encouragement**: Complement the on-screen feedback

### For Patients
1. **Follow Instructions**: Read the on-screen prompts carefully
2. **Move Slowly**: Controlled movements provide better measurements
3. **Full View**: Keep entire body in frame
4. **Comfortable Pace**: No need to rush, quality over speed
5. **Stop if Pain**: Click "Stop" immediately if movement causes pain

## Technical Specifications

### Performance
- Target FPS: 30fps for pose detection
- Measurement Latency: <50ms from pose to measurement
- UI Update Rate: 60fps for smooth animations

### Accuracy
- Angle Tolerance: ±5.5° (clinically appropriate)
- Target MAE: ≤5°
- Target RMSE: ≤7°
- Target R²: ≥0.95

### Browser/Device Support
- **Mobile**: iOS 13+, Android 8+ (via React Native)
- **Web**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- **Webcam Required**: 720p minimum, 1080p recommended

## Future Enhancements

### Planned Features
1. **Session Recording**: Save assessment videos for review
2. **Progress Tracking**: Compare measurements over time
3. **Export Reports**: Generate PDF reports for clinical records
4. **Multi-Angle Capture**: Automatic prompts to capture different views
5. **Voice Guidance**: Audio instructions for hands-free operation
6. **Bilateral Comparison**: Side-by-side comparison of left vs right
7. **Custom Exercises**: Create custom assessment protocols
8. **Telehealth Integration**: Live remote assessment with therapist

### Research Opportunities
1. **Machine Learning**: Predict compensation patterns
2. **Biomechanical Analysis**: Advanced movement quality scoring
3. **Pain Prediction**: Correlate ROM limitations with reported pain
4. **Outcome Prediction**: Estimate recovery trajectory

## Support

For issues or feature requests related to the Clinical Assessment UI:
1. Check the troubleshooting section below
2. Review the measurement service documentation
3. Open an issue on GitHub with:
   - Device/browser information
   - Steps to reproduce
   - Screenshots/videos if applicable

## Troubleshooting

### Camera Not Working
- **Mobile**: Check app permissions in device settings
- **Web**: Allow webcam access in browser, check if another app is using it
- **Solution**: Restart app/browser, ensure no other apps are using camera

### Inaccurate Measurements
- **Poor Lighting**: Improve lighting conditions
- **Partial Occlusion**: Ensure full body is visible
- **Quick Movements**: Move more slowly for better tracking
- **Camera Angle**: Adjust camera to proper view orientation

### UI Not Responsive
- **Low Performance**: Close other apps, reduce frame rate
- **Browser Compatibility**: Use supported browser version
- **Clear Cache**: Clear app/browser cache and reload

### Compensations Not Detected
- **Expected Behavior**: Some compensations may be too subtle
- **Threshold Settings**: Adjust compensation detection thresholds
- **View Orientation**: Ensure proper camera angle for detection

## References

1. Norkin, C. C., & White, D. J. (2016). *Measurement of Joint Motion: A Guide to Goniometry* (5th ed.)
2. American Academy of Orthopaedic Surgeons. (1965). *Joint Motion: Method of Measuring and Recording*
3. Wu, G., et al. (2005). ISB recommendation on definitions of joint coordinate systems. *Journal of Biomechanics*
4. Magee, D. J. (2014). *Orthopedic Physical Assessment* (6th ed.)

## License

Copyright © 2024 PhysioAssist. All rights reserved.
