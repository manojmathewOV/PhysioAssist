# 📹 YouTube Video Comparison - Comprehensive Implementation Plan

## Executive Summary

This document defines a production-ready implementation plan for PhysioAssist's YouTube comparison feature based on:
- **Real iOS device capabilities and limitations**
- **Clinical physical therapy use cases**
- **Research-backed common patient errors**
- **Two distinct usage modes**: Pre-recorded selfie comparison + Live split-screen comparison

---

## 🎯 Clinical Use Cases & User Stories

### **Use Case 1: Asynchronous Self-Assessment (Pre-Recorded)**
**Patient Story:**
> "I'm recovering from shoulder surgery. My therapist sent me a YouTube video showing proper shoulder abduction technique. I want to record myself doing the exercise at home, compare it to the video, and see what I'm doing wrong before my next appointment."

**Workflow:**
1. Patient selects exercise type (e.g., "Shoulder Abduction")
2. Patient pastes YouTube reference video URL
3. Patient positions phone camera (tripod/phone stand recommended)
4. Patient records themselves performing 3-5 reps
5. App analyzes both videos offline
6. Patient reviews side-by-side comparison with error highlights
7. Patient can save/share report with therapist

**Clinical Value:**
- Enables home exercise program compliance monitoring
- Reduces in-person visit frequency
- Provides objective feedback between therapy sessions
- Creates video records for progress tracking

---

### **Use Case 2: Real-Time Guided Exercise (Live Split-Screen)**
**Patient Story:**
> "I want to follow along with the YouTube video in real-time and see if my form matches. I need immediate feedback so I can correct myself during the exercise."

**Workflow:**
1. Patient selects exercise and YouTube video
2. Patient positions camera to capture full body
3. App displays split-screen: YouTube video (left) + Live camera (right)
4. Both videos play simultaneously with pose overlays
5. Real-time audio feedback: "Bend elbow more" / "Good rep!"
6. Session is automatically recorded for later review
7. Post-session report shows errors with timestamps

**Clinical Value:**
- Immediate form correction reduces injury risk
- Gamification improves engagement
- Real-time coaching without therapist present
- Builds patient confidence in proper technique

---

## 📱 iOS Device Capabilities & Constraints

### **Pose Estimation Performance (2025 Research Findings)**

#### **Available Technologies:**

| Technology | Platform | FPS on iOS | Keypoints | Accuracy | Use Case |
|------------|----------|------------|-----------|----------|----------|
| **MoveNet Lightning** | TFLite | 20-30 FPS | 17 | Good | ✅ Real-time live |
| **MoveNet Thunder** | TFLite | 10-15 FPS | 17 | Excellent | ✅ Pre-recorded analysis |
| **MediaPipe Pose** | Native | 15-25 FPS | 33 | Excellent | ✅ Both modes |
| **Apple Vision** | iOS Native | 5-15 FPS | 19 | Good | ⚠️ Slower performance |

**Current App Implementation:** MoveNet Lightning INT8 (17 keypoints)

**Recommendation:**
- **Real-time mode:** Keep MoveNet Lightning (optimized for speed)
- **Pre-recorded analysis:** Use MoveNet Thunder for higher accuracy
- **Future upgrade:** MediaPipe Pose for 33 keypoints (better scapula/spine detection)

---

### **Camera Hardware Limitations**

#### **Multi-Camera Recording (iOS 13+)**
**Supported Devices:** iPhone XS, XR, 11, 12, 13, 14, 15, 16, 17+

**Constraints:**
- ✅ Simultaneous front + rear camera recording
- ❌ Maximum resolution: **1080p** (not 4K) when using dual cameras
- ❌ Fixed layout on native iOS (rear camera large, front small)
- ✅ Custom layouts possible with React Native Vision Camera + Frame Processors

**PhysioAssist Implementation Strategy:**
```
Mode 1: Pre-recorded selfie → Single camera, full 4K quality
Mode 2: Live split-screen → Dual camera not needed!
        - Use single camera for patient
        - YouTube video plays from file (not live camera)
        - No dual-camera limitation applies
```

---

#### **Selfie Camera Angle Limitations (Research Findings)**

**Key Finding:** Pose estimation accuracy degrades at extreme angles (±45° from frontal)

**Clinical Implications:**

| Exercise Type | Optimal Camera Angle | Patient Positioning | Accuracy Impact |
|--------------|---------------------|---------------------|-----------------|
| **Shoulder Abduction** | Frontal (0°) | Face camera, arms visible | ✅ High accuracy |
| **Shoulder Flexion** | Side view (90°) | Profile to camera | ⚠️ Moderate accuracy |
| **Knee Squat** | Frontal (0°) or 45° | Face camera, full body | ✅ High accuracy |
| **Elbow Flexion** | Side view (90°) | Profile, elbow visible | ⚠️ Moderate accuracy |

**Solution: Multi-Angle Video Requirement**

For exercises requiring side-view assessment:
```
1. Patient records frontal view (Rep 1-3)
2. App prompts: "Now record from the side angle"
3. Patient repositions camera/body
4. Patient records side view (Rep 4-6)
5. App analyzes both angles and merges results
```

**Alternative: YouTube Video Angle Detection**
```typescript
// Auto-detect YouTube video camera angle
const videoAngle = detectCameraAngle(youtubeFrames);
// Prompt patient to match the angle
showPositioningGuide(videoAngle); // "Position camera on your right side"
```

---

### **Video Storage Constraints**

#### **Storage Requirements per Session:**

```
Single Exercise Session (3 reps, 30 seconds):
- YouTube video (720p, cached): 15-25 MB
- Patient video (1080p): 50-80 MB
- Pose data (JSON): 0.5-1 MB
- Comparison report (HTML): 1-2 MB

Total per session: ~70-110 MB
```

**iPhone Storage Tiers:**
- 64GB iPhone: ~500-700 sessions before cleanup needed
- 128GB iPhone: ~1000-1400 sessions
- 256GB+ iPhone: Storage not a concern

**Automatic Cleanup Strategy:**
```typescript
const storagePolicy = {
  maxSessionsStored: 100,
  autoDeleteAfterDays: 30,
  keepFavorites: true,
  keepSharedWithTherapist: true,

  cleanup: {
    deleteYouTubeCache: '24 hours',    // YouTube videos deleted after 1 day
    deletePatientVideo: '30 days',      // Patient videos kept 1 month
    keepPoseData: '90 days',            // Pose data kept 3 months (small size)
    keepReports: 'forever'              // Reports kept (tiny size)
  }
};
```

---

## 🧠 Research-Based Common Patient Errors

### **Shoulder Abduction Exercises**

Based on physical therapy research, these are the **most common errors** patients make:

#### **1. Shoulder Hiking/Shrugging (Upper Trapezius Dominance)**
**What it looks like:**
- Shoulder girdle elevates during arm raise
- Patient "shrugs" shoulder up toward ear
- Compensation for weak deltoid/rotator cuff

**Keypoint Detection:**
```typescript
const shoulderHiking = {
  landmarks: ['leftShoulder', 'leftEar'],
  calculation: 'shoulderToEar_Y_distance',
  baseline: recordFirstRepDistance(),
  threshold: {
    good: '< 2cm elevation',
    warning: '2-5cm elevation',
    critical: '> 5cm elevation'
  },
  feedback: {
    critical: "Lower your shoulder - don't shrug up toward your ear",
    warning: "Try to keep your shoulder down and relaxed"
  },
  injuryRisk: 'high', // Can cause impingement
  priority: 1
};
```

#### **2. Trunk Leaning (Lateral Compensation)**
**What it looks like:**
- Patient leans torso sideways to "help" lift arm
- Reduces actual deltoid work
- Common when using too much weight

**Keypoint Detection:**
```typescript
const trunkLeaning = {
  landmarks: ['leftShoulder', 'rightShoulder', 'leftHip', 'rightHip'],
  calculation: 'trunk_lateral_angle',
  baseline: 'vertical (0°)',
  threshold: {
    good: '< 5° lean',
    warning: '5-15° lean',
    critical: '> 15° lean'
  },
  feedback: {
    critical: "Stand up straight - you're leaning to the side",
    warning: "Keep your torso upright"
  },
  injuryRisk: 'medium',
  priority: 2
};
```

#### **3. Internal Rotation (Thumb Down Position)**
**What it looks like:**
- Shoulder internally rotates during abduction
- Thumb points down instead of forward/up
- Increases impingement risk

**Keypoint Detection:**
```typescript
const internalRotation = {
  landmarks: ['leftShoulder', 'leftElbow', 'leftWrist'],
  calculation: 'forearm_rotation_estimate',
  // Note: True rotation requires 3D or side-view
  threshold: {
    good: 'wrist ahead of elbow (external rotation)',
    warning: 'wrist aligned with elbow',
    critical: 'wrist behind elbow (internal rotation)'
  },
  feedback: {
    critical: "Rotate your arm - keep thumb pointing up",
    warning: "Maintain neutral wrist position"
  },
  injuryRisk: 'high', // Impingement risk
  priority: 1
};
```

#### **4. Incomplete Range of Motion**
**What it looks like:**
- Patient stops before 90° (or prescribed target)
- Common due to pain, weakness, or fear

**Keypoint Detection:**
```typescript
const incompleteROM = {
  landmarks: ['leftShoulder', 'leftElbow', 'leftHip'],
  calculation: 'shoulder_abduction_angle',
  referenceTarget: getYouTubeMaxAngle(), // e.g., 90°
  threshold: {
    good: '> 90% of reference ROM',
    warning: '70-90% of reference ROM',
    critical: '< 70% of reference ROM'
  },
  feedback: {
    critical: `Lift your arm higher - you reached ${userMax}° but target is ${refMax}°`,
    warning: "Try to lift a bit higher if comfortable"
  },
  injuryRisk: 'low',
  priority: 3
};
```

#### **5. Scapular Winging**
**What it looks like:**
- Shoulder blade protrudes from back
- Indicates serratus anterior weakness
- **Limitation:** Requires rear camera or side view to detect

**Keypoint Detection:**
```typescript
const scapularWinging = {
  landmarks: ['spine', 'scapula'], // MediaPipe 33-point model needed
  requiresCameraAngle: 'rear or side (90°)',
  calculation: 'scapula_protrusion_depth',
  limitation: 'MoveNet 17-point cannot detect - needs MediaPipe upgrade',
  futureImplementation: true
};
```

---

### **Knee Exercises (Squats)**

#### **1. Knee Valgus (Knees Caving Inward) - HIGHEST PRIORITY**
**What it looks like:**
- Knees collapse inward during squat descent
- Most common error, high injury risk (ACL, MCL)

**Keypoint Detection:**
```typescript
const kneeValgus = {
  landmarks: ['leftHip', 'leftKnee', 'leftAnkle', 'rightHip', 'rightKnee', 'rightAnkle'],
  calculation: 'knee_to_ankle_X_offset',
  baseline: 'knee aligned over ankle (X coordinate within 5% body width)',
  threshold: {
    good: 'knee within 5% of ankle X position',
    warning: 'knee 5-10% medial to ankle',
    critical: 'knee > 10% medial to ankle (valgus collapse)'
  },
  feedback: {
    critical: "Push your knees outward - they're caving in",
    warning: "Keep knees aligned over your toes"
  },
  injuryRisk: 'critical', // ACL tear risk
  priority: 1
};
```

#### **2. Heel Lift (Weight Shift to Toes)**
**What it looks like:**
- Heels lift off ground during descent
- Indicates tight calves or quad dominance

**Keypoint Detection:**
```typescript
const heelLift = {
  landmarks: ['leftAnkle', 'leftHeel', 'leftToe'], // Need foot landmarks
  calculation: 'heel_Y_position_change',
  baseline: recordHeelPositionAtStart(),
  threshold: {
    good: '< 1cm heel elevation',
    warning: '1-2cm heel elevation',
    critical: '> 2cm heel elevation'
  },
  feedback: {
    critical: "Keep your heels on the ground throughout the movement",
    warning: "Try to maintain heel contact"
  },
  injuryRisk: 'medium',
  priority: 2,
  limitation: 'MoveNet only has ankle point - need MediaPipe for heel/toe'
};
```

#### **3. Posterior Pelvic Tilt (Butt Wink)**
**What it looks like:**
- Tailbone tucks under at bottom of squat
- Lumbar spine excessive flexion
- Can cause lower back pain

**Keypoint Detection:**
```typescript
const posteriorPelvicTilt = {
  landmarks: ['leftHip', 'rightHip', 'leftShoulder', 'rightShoulder'],
  calculation: 'hip_to_shoulder_angle_change',
  baseline: recordPelvicAngleAtTop(),
  threshold: {
    good: '< 10° pelvic rotation',
    warning: '10-20° pelvic rotation',
    critical: '> 20° pelvic rotation (butt wink)'
  },
  feedback: {
    critical: "Stop before your tailbone tucks under - don't go as deep",
    warning: "Maintain neutral spine position"
  },
  injuryRisk: 'medium',
  priority: 2
};
```

#### **4. Insufficient Depth (Incomplete Squat)**
**What it looks like:**
- Patient doesn't reach prescribed depth (usually 90° knee angle)
- Common in beginners or those with limited mobility

**Keypoint Detection:**
```typescript
const insufficientDepth = {
  landmarks: ['leftHip', 'leftKnee', 'leftAnkle'],
  calculation: 'knee_flexion_angle',
  referenceTarget: getYouTubeMinAngle(), // e.g., 90°
  threshold: {
    good: 'within 10° of reference depth',
    warning: '10-20° short of reference',
    critical: '> 20° short of reference'
  },
  feedback: {
    critical: `Squat deeper - you reached ${userDepth}° but target is ${refDepth}°`,
    warning: "Try to go a bit lower if comfortable"
  },
  injuryRisk: 'low',
  priority: 3
};
```

---

### **Elbow Exercises (Flexion/Extension)**

#### **1. Shoulder Compensation (Shoulder Movement During Curl)**
**What it looks like:**
- Shoulder swings forward/back during bicep curl
- Uses momentum instead of isolated bicep work
- Most common error in arm exercises

**Keypoint Detection:**
```typescript
const shoulderCompensation = {
  landmarks: ['leftShoulder', 'leftElbow'],
  calculation: 'shoulder_X_position_change',
  baseline: recordShoulderPositionAtStart(),
  threshold: {
    good: '< 3cm shoulder movement',
    warning: '3-7cm shoulder movement',
    critical: '> 7cm shoulder movement (swinging)'
  },
  feedback: {
    critical: "Keep your upper arm still - don't swing your shoulder",
    warning: "Pin your elbow to your side"
  },
  injuryRisk: 'low',
  priority: 1
};
```

#### **2. Incomplete Extension (Not Straightening Arm)**
**What it looks like:**
- Patient doesn't fully extend elbow at bottom
- Reduces ROM and effectiveness

**Keypoint Detection:**
```typescript
const incompleteExtension = {
  landmarks: ['leftShoulder', 'leftElbow', 'leftWrist'],
  calculation: 'elbow_extension_angle',
  referenceTarget: getYouTubeMinAngle(), // e.g., 170-180° (full extension)
  threshold: {
    good: '> 160° extension',
    warning: '140-160° extension',
    critical: '< 140° extension'
  },
  feedback: {
    critical: "Straighten your arm completely at the bottom",
    warning: "Extend your arm a bit more"
  },
  injuryRisk: 'low',
  priority: 2
};
```

#### **3. Wrist Deviation (Wrist Not Neutral)**
**What it looks like:**
- Wrist bends excessively during movement
- Can cause wrist strain

**Keypoint Detection:**
```typescript
const wristDeviation = {
  landmarks: ['leftElbow', 'leftWrist'], // Limited without hand landmarks
  calculation: 'elbow_to_wrist_angle',
  threshold: {
    good: 'wrist in line with forearm (straight)',
    warning: 'slight wrist bend',
    critical: 'excessive wrist flexion/extension'
  },
  feedback: {
    warning: "Keep your wrist straight and neutral"
  },
  injuryRisk: 'low',
  priority: 3,
  limitation: 'Better detection with MediaPipe hand landmarks'
};
```

---

## 🏗️ Video Recording & Playback Architecture

### **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                     VIDEO COMPARISON MODES                   │
├─────────────────────────┬───────────────────────────────────┤
│   MODE 1: ASYNC         │   MODE 2: LIVE SPLIT-SCREEN      │
│   Pre-Recorded Analysis │   Real-Time Guided Exercise       │
└─────────────────────────┴───────────────────────────────────┘

MODE 1 FLOW:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│1. Select     │───▶│2. Record     │───▶│3. Analyze    │
│  YouTube URL │    │  Patient     │    │  Offline     │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                    ┌─────────────────────────┘
                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│6. Save/Share │◀───│5. Review     │◀───│4. Generate   │
│  Report      │    │  Side-by-Side│    │  Report      │
└──────────────┘    └──────────────┘    └──────────────┘

MODE 2 FLOW:
┌──────────────┐    ┌──────────────────────────────────┐
│1. Select     │───▶│2. Split Screen Layout:          │
│  YouTube URL │    │  ┌────────────┬────────────┐    │
└──────────────┘    │  │ YouTube    │ Live       │    │
                    │  │ Video      │ Camera     │    │
                    │  │ (Left)     │ (Right)    │    │
                    │  └────────────┴────────────┘    │
                    │        Real-time Feedback        │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │3. Auto-record session for review │
                    │4. Generate post-session report   │
                    └──────────────────────────────────┘
```

---

### **Technical Implementation: Mode 1 (Async)**

#### **Component Architecture**
```typescript
// src/features/videoComparison/modes/AsyncComparisonMode.tsx

interface AsyncComparisonFlow {
  step1_youtubeSelection: {
    component: 'YouTubeURLInput',
    actions: [
      'validateURL',
      'fetchVideoInfo',
      'downloadVideo(quality: "720p")',
      'extractPoseData_Thunder' // High accuracy mode
    ]
  };

  step2_patientRecording: {
    component: 'PatientRecordingScreen',
    camera: {
      resolution: '1080p', // Full quality, single camera
      orientation: 'portrait',
      frameRate: 30
    },
    guidance: {
      showPositioningOverlay: true,
      showCountdown: true,
      showRepCounter: true
    },
    recording: {
      minDuration: 10, // seconds
      maxDuration: 60,
      saveLocation: 'cache/patient_recordings/'
    }
  };

  step3_offlineAnalysis: {
    component: 'VideoProcessingService',
    steps: [
      'extractFrames(patientVideo, fps: 30)',
      'extractPoses_Thunder(frames)', // High accuracy
      'syncVideos(refPoses, patientPoses)',
      'compareMovements()',
      'detectErrors()',
      'generateRecommendations()'
    ],
    showProgress: true
  };

  step4_reviewScreen: {
    component: 'SideBySideReviewScreen',
    layout: {
      videoPanel: {
        youtubeVideo: 'left (50%)',
        patientVideo: 'right (50%)',
        poseOverlay: true,
        syncControls: true
      },
      feedbackPanel: {
        overallScore: true,
        errorTimeline: true,
        topRecommendations: 3, // Don't overwhelm
        detailedBreakdown: 'expandable'
      }
    },
    playback: {
      syncPlayback: true,
      allowSlowMotion: [0.25, 0.5, 0.75, 1.0],
      allowFrameByFrame: true,
      showErrorMarkers: true // Red markers on timeline
    }
  };

  step5_saveAndShare: {
    actions: [
      'saveToPatientHistory',
      'generatePDFReport',
      'shareWithTherapist(email/sms)',
      'markAsFavorite',
      'addNotes'
    ]
  };
}
```

---

### **Technical Implementation: Mode 2 (Live)**

#### **Component Architecture**
```typescript
// src/features/videoComparison/modes/LiveComparisonMode.tsx

interface LiveComparisonFlow {
  step1_setup: {
    component: 'LiveSetupScreen',
    actions: [
      'loadYouTubeVideo',
      'initializeCamera',
      'showPositioningGuide', // AR overlay showing where to stand
      'calibrateBaseline' // Record patient at rest position
    ]
  };

  step2_splitScreenExercise: {
    component: 'LiveSplitScreenView',
    layout: {
      youtube: {
        position: 'left',
        width: '50%',
        controls: {
          play: true,
          pause: true,
          restart: true,
          speed: [0.5, 0.75, 1.0]
        }
      },
      liveCamera: {
        position: 'right',
        width: '50%',
        poseDetection: {
          model: 'MoveNet_Lightning', // Real-time optimized
          fps: 20, // Target frame rate
          showSkeleton: true,
          skeletonColor: 'green'
        }
      },
      overlay: {
        repCounter: 'top-right',
        currentError: 'bottom-center', // Show current error only
        scoreIndicator: 'top-center' // Live score
      }
    },

    realTimeFeedback: {
      audio: {
        enabled: true,
        priority: 'high_priority_only', // Avoid overwhelming
        cooldown: 3000, // ms between same message
        messages: {
          repComplete: 'Good rep!',
          formError: 'Keep knees aligned',
          encouragement: 'You got this!'
        }
      },
      haptic: {
        enabled: true,
        patterns: {
          repComplete: 'success',
          formError: 'light'
        }
      },
      visual: {
        highlightJoint: true, // Red circle on problem joint
        showAngleDeviation: true, // e.g., "15° off"
        colorCodeSkeleton: true // Green=good, Yellow=warning, Red=critical
      }
    },

    autoRecording: {
      enabled: true,
      startOn: 'firstMovement',
      stopOn: 'videoComplete',
      saveLocation: 'cache/live_sessions/',
      quality: '720p' // Balance quality/performance
    },

    errorDetection: {
      analysisInterval: 500, // ms (2x per second)
      showOnlyTopError: true, // Don't overwhelm
      errorPriority: [
        'injuryRisk: critical',
        'injuryRisk: high',
        'severity: critical',
        'severity: warning'
      ]
    }
  };

  step3_postSession: {
    component: 'LiveSessionReportScreen',
    autoShow: true,
    content: {
      sessionSummary: {
        totalReps: true,
        averageScore: true,
        improvement: 'vs previous session',
        timeSpent: true
      },
      errorSummary: {
        topErrors: 3,
        errorFrequency: 'chart',
        improvement: 'vs previous session'
      },
      savedRecording: {
        available: true,
        canReview: 'side-by-side like Mode 1',
        canShare: true
      },
      nextSteps: {
        recommendations: 'top 2-3',
        suggestFollowUp: 'e.g., "Focus on knee alignment next time"'
      }
    }
  };
}
```

---

### **Data Storage Architecture**

```typescript
// src/features/videoComparison/storage/VideoStorageManager.ts

interface StorageArchitecture {
  youtube_cache: {
    location: 'cache/youtube_videos/',
    naming: '{videoId}_{quality}.mp4',
    retention: '24 hours',
    maxSize: '100 MB',
    eviction: 'LRU'
  };

  patient_videos: {
    location: 'documents/patient_videos/{sessionId}/',
    naming: '{timestamp}_{exerciseType}.mp4',
    retention: '30 days',
    maxSize: '5 GB total',
    eviction: 'oldest first (keep favorites)'
  };

  pose_data: {
    location: 'documents/pose_data/{sessionId}/',
    naming: '{timestamp}_poses.json',
    format: {
      reference: 'PoseFrame[]',
      patient: 'PoseFrame[]',
      sync: 'TemporalAlignment',
      metadata: 'SessionMetadata'
    },
    retention: '90 days',
    maxSize: '500 MB total'
  };

  comparison_reports: {
    location: 'documents/reports/{sessionId}/',
    naming: '{timestamp}_report.json',
    format: 'ComparisonResult',
    retention: 'forever (tiny size)',
    exportFormats: ['PDF', 'JSON', 'HTML']
  };

  thumbnails: {
    location: 'cache/thumbnails/',
    naming: '{sessionId}_thumb.jpg',
    resolution: '320x180',
    retention: '90 days'
  };
}

class VideoStorageManager {
  async saveSession(session: ComparisonSession): Promise<string> {
    const sessionId = generateUUID();

    // Save patient video
    const videoPath = await this.savePatientVideo(
      session.patientVideo,
      sessionId
    );

    // Save pose data (compressed)
    const posePath = await this.savePoseData(
      {
        reference: session.referencePoses,
        patient: session.patientPoses,
        sync: session.syncData
      },
      sessionId
    );

    // Save comparison report
    const reportPath = await this.saveReport(
      session.comparisonResult,
      sessionId
    );

    // Generate thumbnail
    const thumbPath = await this.generateThumbnail(
      session.patientVideo,
      sessionId
    );

    // Save session metadata to database
    await this.db.sessions.insert({
      sessionId,
      timestamp: Date.now(),
      exerciseType: session.exerciseType,
      youtubeUrl: session.youtubeUrl,
      youtubeTitle: session.youtubeTitle,
      overallScore: session.comparisonResult.overallScore,
      videoPath,
      posePath,
      reportPath,
      thumbPath,
      isFavorite: false,
      sharedWithTherapist: false
    });

    // Trigger cleanup if needed
    await this.cleanupIfNeeded();

    return sessionId;
  }

  async cleanupIfNeeded(): Promise<void> {
    const totalSize = await this.calculateTotalSize();
    const maxSize = 5 * 1024 * 1024 * 1024; // 5 GB

    if (totalSize > maxSize) {
      // Delete oldest non-favorite sessions
      const sessions = await this.db.sessions
        .where('isFavorite').equals(false)
        .and('sharedWithTherapist').equals(false)
        .sortBy('timestamp');

      for (const session of sessions) {
        await this.deleteSession(session.sessionId);
        const newSize = await this.calculateTotalSize();
        if (newSize < maxSize * 0.8) break; // Keep 20% buffer
      }
    }

    // Delete YouTube cache older than 24 hours
    await this.cleanYouTubeCache();
  }
}
```

---

## 📊 Error Detection & Prioritization System

### **Smart Feedback Algorithm (Non-Overwhelming)**

```typescript
// src/features/videoComparison/analysis/SmartFeedbackGenerator.ts

interface ErrorPrioritization {
  step1_detectAllErrors: {
    scan: 'all error patterns for exercise type',
    output: 'ErrorDetection[]'
  };

  step2_riskAssessment: {
    priorityFactors: [
      'injuryRisk (critical > high > medium > low)',
      'severity (critical > warning > good)',
      'frequency (errors in 80%+ of reps prioritized)',
      'cascadingEffect (fixing this fixes other errors)'
    ]
  };

  step3_filterToTop3: {
    algorithm: 'weighted scoring',
    weights: {
      injuryRisk_critical: 100,
      injuryRisk_high: 75,
      severity_critical: 50,
      frequency_high: 25,
      cascadingEffect: 25
    },
    output: 'top 2-3 errors only'
  };

  step4_adaptiveFeedback: {
    considerPatientLevel: {
      beginner: 'focus on 1-2 critical safety errors only',
      intermediate: 'show 2-3 errors',
      advanced: 'show detailed breakdown'
    },
    considerProgress: {
      improving: 'encourage and show next level errors',
      plateau: 'simplify feedback, focus on fundamentals',
      regressing: 'alert for possible pain/fatigue'
    }
  };
}

class SmartFeedbackGenerator {
  generateFeedback(
    errors: ErrorDetection[],
    patientLevel: 'beginner' | 'intermediate' | 'advanced',
    sessionHistory: SessionHistory[]
  ): Recommendation[] {

    // Step 1: Score each error
    const scoredErrors = errors.map(error => ({
      ...error,
      priorityScore: this.calculatePriorityScore(error)
    }));

    // Step 2: Sort by priority
    scoredErrors.sort((a, b) => b.priorityScore - a.priorityScore);

    // Step 3: Filter to appropriate count
    const maxErrors = patientLevel === 'beginner' ? 2 : 3;
    const topErrors = scoredErrors.slice(0, maxErrors);

    // Step 4: Generate human-friendly messages
    const recommendations = topErrors.map((error, index) => {
      return {
        type: error.type,
        priority: index === 0 ? 'high' : 'medium',
        message: this.generateMessage(error, patientLevel),
        detail: this.generateDetail(error, patientLevel),
        injuryRisk: error.injuryRisk,
        visualAid: this.getVisualAid(error), // Image/video showing correct form
        fixTips: this.getFixTips(error, patientLevel)
      };
    });

    // Step 5: Add positive reinforcement if score is improving
    if (this.isImproving(sessionHistory)) {
      recommendations.unshift({
        type: 'encouragement',
        priority: 'low',
        message: '🎉 Your form is improving!',
        detail: this.getImprovementDetails(sessionHistory)
      });
    }

    return recommendations;
  }

  private calculatePriorityScore(error: ErrorDetection): number {
    const riskScore = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25
    }[error.injuryRisk] || 0;

    const severityScore = {
      critical: 50,
      warning: 25,
      good: 0
    }[error.severity] || 0;

    const frequencyScore = error.frequency > 0.8 ? 25 : 0;
    const cascadingScore = error.cascading ? 25 : 0;

    return riskScore + severityScore + frequencyScore + cascadingScore;
  }

  private generateMessage(
    error: ErrorDetection,
    level: 'beginner' | 'intermediate' | 'advanced'
  ): string {
    // Beginner: Simple, encouraging
    if (level === 'beginner') {
      return error.feedback.simple || error.feedback.critical;
    }

    // Intermediate: Clear, instructive
    if (level === 'intermediate') {
      return error.feedback.warning || error.feedback.critical;
    }

    // Advanced: Technical, precise
    return error.feedback.technical || error.feedback.critical;
  }
}
```

---

## 🚀 Phased Implementation Plan

### **Phase 1: Foundation (Weeks 1-2)**
**Goal:** Build core infrastructure for both modes

#### **Tasks:**
1. **Upgrade Pose Detection Engine**
   - [ ] Integrate MoveNet Thunder model (high accuracy)
   - [ ] Create model switcher (Lightning for live, Thunder for async)
   - [ ] Benchmark performance on iPhone XS/11/12/13
   - [ ] Optimize frame processing pipeline

2. **Video Storage System**
   - [ ] Implement VideoStorageManager
   - [ ] Create automatic cleanup service
   - [ ] Add compression for patient videos
   - [ ] Implement thumbnail generation

3. **Database Schema**
   ```sql
   CREATE TABLE comparison_sessions (
     session_id TEXT PRIMARY KEY,
     timestamp INTEGER,
     exercise_type TEXT,
     mode TEXT, -- 'async' or 'live'
     youtube_url TEXT,
     youtube_title TEXT,
     overall_score INTEGER,
     video_path TEXT,
     pose_data_path TEXT,
     report_path TEXT,
     thumbnail_path TEXT,
     is_favorite BOOLEAN,
     shared_with_therapist BOOLEAN,
     patient_notes TEXT
   );

   CREATE TABLE error_history (
     id INTEGER PRIMARY KEY,
     session_id TEXT,
     error_type TEXT,
     severity TEXT,
     injury_risk TEXT,
     frequency REAL,
     FOREIGN KEY (session_id) REFERENCES comparison_sessions(session_id)
   );
   ```

4. **Testing:**
   - Unit tests for storage manager
   - Integration tests for pose detection
   - Performance benchmarks

**Deliverable:** Core infrastructure ready for Mode 1 implementation

---

### **Phase 2: Mode 1 - Async Comparison (Weeks 3-4)**
**Goal:** Fully functional pre-recorded video comparison

#### **Tasks:**
1. **Recording Screen**
   - [ ] Build PatientRecordingScreen component
   - [ ] Add positioning guide overlay (AR-style)
   - [ ] Implement countdown timer
   - [ ] Add rep counter
   - [ ] Show live pose skeleton for alignment check

2. **Offline Analysis Pipeline**
   - [ ] Implement frame extraction service
   - [ ] Add pose extraction with progress indicator
   - [ ] Build video synchronization algorithm (DTW)
   - [ ] Create comparison analysis service

3. **Review Screen**
   - [ ] Build side-by-side video player
   - [ ] Sync playback controls
   - [ ] Add slow-motion playback
   - [ ] Implement frame-by-frame stepping
   - [ ] Show error timeline markers

4. **Report Generation**
   - [ ] Create report component
   - [ ] Design PDF export template
   - [ ] Add email/SMS sharing
   - [ ] Implement favorite/save system

5. **Testing:**
   - Test with 5 shoulder exercises
   - Test with 5 knee exercises
   - Test with 5 elbow exercises
   - User testing with 3-5 patients

**Deliverable:** Mode 1 ready for beta testing

---

### **Phase 3: Error Detection System (Weeks 5-6)**
**Goal:** Implement research-based error detection

#### **Tasks:**
1. **Shoulder Error Detection**
   - [ ] Implement shoulder hiking detection
   - [ ] Implement trunk leaning detection
   - [ ] Implement internal rotation detection
   - [ ] Implement incomplete ROM detection
   - [ ] Test with 20 shoulder exercise videos

2. **Knee Error Detection**
   - [ ] Implement knee valgus detection (PRIORITY)
   - [ ] Implement heel lift detection
   - [ ] Implement posterior pelvic tilt detection
   - [ ] Implement insufficient depth detection
   - [ ] Test with 20 squat videos

3. **Elbow Error Detection**
   - [ ] Implement shoulder compensation detection
   - [ ] Implement incomplete extension detection
   - [ ] Implement wrist deviation detection
   - [ ] Test with 20 arm exercise videos

4. **Smart Feedback System**
   - [ ] Implement priority scoring algorithm
   - [ ] Create beginner/intermediate/advanced feedback
   - [ ] Build improvement tracking
   - [ ] Add positive reinforcement system

5. **Testing:**
   - Validate error detection accuracy (>85% target)
   - Test feedback prioritization with therapists
   - User testing for overwhelming feedback

**Deliverable:** Intelligent error detection system integrated

---

### **Phase 4: Mode 2 - Live Split-Screen (Weeks 7-8)**
**Goal:** Real-time guided exercise with split-screen

#### **Tasks:**
1. **Split-Screen Layout**
   - [ ] Build LiveSplitScreenView component
   - [ ] Implement synchronized video playback
   - [ ] Add live camera feed with pose overlay
   - [ ] Create overlay UI (rep counter, score, error indicator)

2. **Real-Time Feedback**
   - [ ] Implement real-time pose analysis (500ms intervals)
   - [ ] Add audio feedback with priority queue
   - [ ] Implement haptic feedback patterns
   - [ ] Create visual joint highlighting

3. **Auto-Recording**
   - [ ] Start recording on first movement
   - [ ] Save session automatically
   - [ ] Generate thumbnail from session

4. **Post-Session Report**
   - [ ] Create session summary screen
   - [ ] Add error frequency charts
   - [ ] Show improvement vs. previous session
   - [ ] Enable review of recorded session

5. **Performance Optimization**
   - [ ] Optimize for 20 FPS pose detection
   - [ ] Reduce battery consumption
   - [ ] Handle thermal throttling
   - [ ] Test on older devices (iPhone XS)

6. **Testing:**
   - Performance testing (frame rate, battery)
   - User testing with 5-10 patients
   - Therapist feedback on real-time coaching

**Deliverable:** Mode 2 ready for beta testing

---

### **Phase 5: Camera Positioning & Multi-Angle (Week 9)**
**Goal:** Handle exercises requiring side-view camera angles

#### **Tasks:**
1. **YouTube Video Angle Detection**
   - [ ] Implement camera angle classifier
   - [ ] Detect frontal vs. side view from YouTube video
   - [ ] Auto-suggest camera positioning to patient

2. **Multi-Angle Recording Flow**
   - [ ] Prompt patient for multiple angles if needed
   - [ ] Guide repositioning with AR overlay
   - [ ] Merge multi-angle pose data

3. **Positioning Guide System**
   - [ ] Create AR-style "stand here" overlay
   - [ ] Add distance check (too close/too far)
   - [ ] Verify full body in frame

4. **Testing:**
   - Test with side-view exercises (shoulder flexion, elbow flexion)
   - User testing for positioning guidance clarity

**Deliverable:** Multi-angle support for complex exercises

---

### **Phase 6: Polish & Clinical Integration (Week 10)**
**Goal:** Production-ready with therapist features

#### **Tasks:**
1. **Therapist Dashboard**
   - [ ] Build patient session history view
   - [ ] Add progress tracking charts
   - [ ] Enable remote session review
   - [ ] Add therapist notes/annotations

2. **Patient History**
   - [ ] Create session history screen
   - [ ] Add filtering (exercise type, date, score)
   - [ ] Show progress trends
   - [ ] Enable comparison of sessions

3. **Exercise Library**
   - [ ] Curate 50+ validated YouTube videos
   - [ ] Categorize by body part and difficulty
   - [ ] Add exercise descriptions
   - [ ] Enable therapist to assign videos

4. **Settings & Customization**
   - [ ] Audio feedback settings (volume, rate)
   - [ ] Visual feedback settings (skeleton color)
   - [ ] Storage management screen
   - [ ] Beginner/intermediate/advanced mode toggle

5. **Testing:**
   - End-to-end testing all flows
   - Accessibility testing
   - Clinical validation with 3 therapists
   - Patient beta testing (20+ users)

**Deliverable:** Production-ready v1.0

---

## 📈 Success Metrics

### **Technical Metrics:**
- **Pose detection FPS:** ≥20 FPS (live mode)
- **Error detection accuracy:** ≥85%
- **Video sync accuracy:** <1 frame offset
- **App performance:** <5% battery per 10-min session
- **Storage efficiency:** <100 MB per session

### **Clinical Metrics:**
- **Patient engagement:** 70%+ complete assigned exercises
- **Feedback clarity:** 80%+ understand corrections
- **Form improvement:** 30%+ score increase after 5 sessions
- **Therapist satisfaction:** 8+/10 rating
- **False positive rate:** <15% (avoid incorrect feedback)

### **User Experience Metrics:**
- **Setup time:** <2 minutes for first-time users
- **Task completion:** 90%+ successfully record and review
- **Perceived value:** 8+/10 helpfulness rating
- **Not overwhelming:** <10% report "too much feedback"

---

## 🔒 Clinical Safety & Privacy

### **Safety Guardrails:**
```typescript
const safetySystem = {
  painDetection: {
    trigger: 'sudden ROM decrease or movement hesitation',
    action: 'pause exercise, prompt "Are you experiencing pain?"',
    escalation: 'suggest contacting therapist if pain persists'
  },

  overexertion: {
    trigger: 'session duration > 20 minutes',
    action: 'suggest rest break',
    escalation: 'end session after 30 minutes'
  },

  improperProgression: {
    trigger: 'score decreasing over 3+ sessions',
    action: 'alert therapist, suggest review'
  },

  disclaimers: {
    firstUse: 'This app provides guidance but does not replace professional medical advice',
    beforeExercise: 'Stop if you experience sharp pain',
    emergencyInfo: 'Display therapist contact info'
  }
};
```

### **Privacy:**
- All video processing on-device (no cloud upload)
- Patient videos encrypted at rest
- Optional therapist sharing (explicit consent)
- HIPAA-compliant data handling
- Automatic video deletion after 30 days

---

## 🎓 Patient Education & Onboarding

### **First-Time User Flow:**
```
1. Welcome Screen
   - "Let's learn proper exercise form together"
   - Show 30-second demo video

2. Camera Setup Tutorial
   - "Position your phone here" (AR guide)
   - "Make sure your full body is visible"
   - Test detection: show live skeleton

3. Mode Selection
   - "Record yourself first (recommended)" → Mode 1
   - "Follow along in real-time" → Mode 2

4. First Exercise (Guided)
   - Simple exercise (e.g., shoulder abduction)
   - Step-by-step instructions
   - Celebrate completion with confetti 🎉

5. Review First Results
   - Explain the score
   - Show top 1 error (not overwhelming)
   - "Try again to improve!"
```

---

## 🔮 Future Enhancements (Post-v1.0)

### **Phase 7: Advanced Features**
1. **Upgrade to MediaPipe 33-point model**
   - Detect scapular winging
   - Better spinal alignment tracking
   - Hand landmark detection for grip analysis

2. **3D Pose Estimation**
   - Depth estimation from monocular camera
   - Better rotation detection
   - Side-view exercises from frontal camera

3. **AI Exercise Recognition**
   - Auto-detect exercise type from movement
   - No need to manually select exercise

4. **Social Features**
   - Share progress with friends
   - Leaderboards for motivation
   - Community challenges

5. **Wearable Integration**
   - Apple Watch for heart rate monitoring
   - Detect fatigue from HR elevation
   - Remind to maintain breathing

6. **Custom Exercise Builder**
   - Therapists create custom exercise videos
   - Define custom error patterns
   - Personalized ROM targets per patient

---

## 📝 Implementation Summary

### **What We're Building:**

**Two Complementary Modes:**
1. **Async Mode (Mode 1):** Patient records video, reviews detailed analysis
2. **Live Mode (Mode 2):** Real-time split-screen guidance with instant feedback

**Key Innovations:**
- ✅ Research-based error detection (not generic angle checks)
- ✅ Smart feedback prioritization (non-overwhelming)
- ✅ Multi-angle support for complex exercises
- ✅ Automatic session recording and progress tracking
- ✅ iOS-optimized architecture (no dual-camera needed)

**Clinical Value:**
- Improves home exercise compliance
- Reduces injury risk from poor form
- Provides objective progress tracking
- Enables remote coaching by therapists

### **Technical Feasibility:**
- ✅ **Proven on iOS:** MoveNet runs 20-30 FPS on iPhone XS+
- ✅ **Storage:** 70-110 MB per session, auto-cleanup handles it
- ✅ **No dual-camera:** Split-screen uses single camera + video playback
- ✅ **Offline-first:** All processing on-device, no cloud required

### **Timeline: 10 Weeks to Production**

---

## 🎯 Next Steps

**Immediate Actions:**
1. Review this plan with medical/therapy team
2. Validate error detection priorities with PT experts
3. Curate initial YouTube video library (50 videos)
4. Begin Phase 1 implementation

**Questions for Stakeholders:**
1. Which exercise type to prioritize? (Shoulder/Knee/Elbow)
2. Target patient population? (Post-op, chronic pain, athletes)
3. Therapist involvement model? (Assign videos, review sessions)
4. Regulatory requirements? (Medical device classification)

---

**Ready to proceed with implementation?**
