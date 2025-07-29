# PhysioAssist Architecture Guide

## Overview

PhysioAssist is built with a modular, cross-platform architecture that separates concerns and allows for easy extension and maintenance.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Mobile    │  │     Web     │  │   Tablet    │         │
│  │  (RN View)  │  │  (RN Web)   │  │  (RN View)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Screens   │  │ Components  │  │ Navigation  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      State Management                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Redux Store  │  │   Slices    │  │  Selectors  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Pose Service │  │ Goniometer  │  │  Exercise   │         │
│  │             │  │   Service   │  │ Validation  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    External Services                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  MediaPipe  │  │TensorFlow.js│  │   Camera    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Pose Detection Service

The heart of the application, responsible for:
- Camera frame processing
- Landmark detection using MediaPipe
- Performance optimization
- Platform-specific implementations

```typescript
// Mobile implementation
class PoseDetectionService {
  - processFrame(frame: Frame): Promise<PoseLandmark[]>
  - optimizePerformance(): void
  - dispose(): void
}

// Web implementation
class WebPoseDetectionService {
  - startDetection(video: HTMLVideoElement): void
  - onResults(results: Results): void
  - stopDetection(): void
}
```

### 2. Goniometer Service

Calculates joint angles with medical accuracy:
- 2D angle calculation for screen coordinates
- 3D angle calculation for spatial accuracy
- Angle smoothing for stability
- Joint-specific calculations

```typescript
class GoniometerService {
  - calculateAngle(p1, p2, p3): number
  - calculateAngle3D(p1, p2, p3): number
  - smoothAngle(joint, angle, window): number
  - getAllJointAngles(landmarks): JointAngles
}
```

### 3. Exercise Validation Service

Validates exercise form and tracks progress:
- Phase-based exercise tracking
- Real-time form scoring
- Repetition counting
- Feedback generation

```typescript
class ExerciseValidationService {
  - validateExercise(type, landmarks, angles): ValidationResult
  - startExercise(type, config): void
  - trackPhaseTransition(current, previous): void
  - generateFeedback(errors): string
}
```

### 4. Audio Feedback Service

Provides multi-modal feedback:
- Text-to-speech for instructions
- Sound effects for events
- Haptic feedback on mobile
- Queue management for messages

```typescript
class AudioFeedbackService {
  - speak(message: string, priority?: number): void
  - playSound(event: string): void
  - triggerHaptic(type: string): void
  - processQueue(): void
}
```

## Data Flow

### 1. Pose Detection Flow
```
Camera → Frame → PoseDetection → Landmarks → Store
                                     ↓
                              Goniometer Service
                                     ↓
                               Joint Angles
                                     ↓
                            Exercise Validation
                                     ↓
                              Feedback System
```

### 2. State Management Flow
```
User Action → Dispatch → Reducer → Store → Selectors → UI Update
                            ↓
                        Middleware
                            ↓
                      Side Effects
```

## Platform-Specific Implementations

### Web Platform
- Uses `react-native-web` for UI compatibility
- MediaPipe JavaScript SDK for pose detection
- Canvas-based rendering for overlays
- WebRTC for camera access

### Mobile Platform
- Native camera APIs via Vision Camera
- TensorFlow Lite for optimized inference
- Native rendering for better performance
- Platform-specific optimizations

## Performance Optimizations

### 1. Frame Processing
- Skip frames to reduce load (configurable)
- Process in background thread
- Dispose tensors properly
- Use WebGL acceleration

### 2. State Updates
- Batch updates to reduce re-renders
- Use selectors for derived state
- Memoize expensive computations
- Throttle frequent updates

### 3. Memory Management
- Clear unused references
- Dispose ML models when not needed
- Limit history buffer sizes
- Use weak references where appropriate

## Security Considerations

### 1. Data Privacy
- All processing done on-device
- No data sent to external servers
- Camera permissions required explicitly
- User data stored locally only

### 2. Code Security
- Input validation for all user inputs
- Sanitize feedback messages
- Secure storage for user preferences
- No hardcoded credentials

## Extension Points

### 1. Adding New Exercises
1. Define exercise in `exercises.ts`
2. Add validation logic
3. Create specific feedback rules
4. Add tests

### 2. Adding New Services
1. Create service interface
2. Implement business logic
3. Add to dependency injection
4. Create tests

### 3. Platform Support
1. Create platform-specific service
2. Use dependency injection
3. Handle platform differences
4. Test on target platform

## Testing Strategy

### 1. Unit Tests
- Test services in isolation
- Mock external dependencies
- Test edge cases
- Aim for >80% coverage

### 2. Integration Tests
- Test service interactions
- Test state management
- Test data flow
- Use real implementations

### 3. E2E Tests
- Test complete user flows
- Test on multiple platforms
- Test performance
- Test error scenarios

## Deployment Architecture

### 1. Web Deployment
```
Build → Bundle → CDN → CloudFront → Users
          ↓
     Static Assets
```

### 2. Mobile Deployment
```
Build → Sign → Store → Users
         ↓
    Beta Testing
```

## Monitoring and Analytics

### 1. Performance Metrics
- Frame processing time
- Pose detection accuracy
- Memory usage
- Battery consumption

### 2. User Metrics
- Exercise completion rates
- Form quality scores
- App usage patterns
- Error rates

## Future Considerations

### 1. Scalability
- Cloud processing option
- Multi-user support
- Real-time collaboration
- Progress syncing

### 2. AI Improvements
- Custom exercise learning
- Personalized feedback
- Injury prevention
- Progress prediction

### 3. Integration
- Wearable device support
- EMR integration
- Therapist portal
- Insurance reporting