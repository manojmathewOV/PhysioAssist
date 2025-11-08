# Focused Remediation Plan: Production Essentials
## Gates 7-11: Safety, YouTube Templates & Simple Auth

**Date:** 2025-11-08
**Branch:** `claude/testing-validation-documentation-011CUv14uuvdCZ2RFG62FUT7`
**Scope:** Fix critical issues for production deployment
**Timeline:** 2-3 weeks (web-executable)

---

## 🎯 Revised Understanding of System

### Core Workflow (Clarified)
```
Doctor/PT prescribes exercises
  ↓
Sends YouTube URLs to patient (email/message)
  ↓
Patient opens URL in PhysioAssist app
  ↓
App downloads YouTube video as reference template
  ↓
Patient performs exercise in front of camera
  ↓
AI compares patient's pose to YouTube template (temporal alignment)
  ↓
Provides form corrections in real-time
  ↓
Saves session data to patient profile
```

**Key Insight:** The video comparison services already exist! Just need:
1. UI to receive/display YouTube templates
2. Authentication to save patient profiles
3. API to push prescribed exercises from external system
4. Fix safety features (compensatory mechanisms)

---

## 📊 Gate Structure

| Gate | Focus | Duration | Web % | CLI % |
|------|-------|----------|-------|-------|
| **Gate 7** | Fix Compensatory Mechanisms | 3-4 days | 95% | 5% |
| **Gate 8** | Simple Authentication System | 2-3 days | 100% | 0% |
| **Gate 9** | YouTube Template UI | 3-4 days | 100% | 0% |
| **Gate 10** | External Prescription API | 2-3 days | 100% | 0% |
| **Gate 11** | CLI Simulator Testing | 3-5 days | 0% | 100% |

**Total Timeline:** 13-19 days (2-3 weeks)

---

## GATE 7: Fix Compensatory Mechanisms (Real Frame Analysis)

### 🎯 Objective
Replace hardcoded return values in compensatory mechanisms with actual pixel analysis of camera frames.

### 📋 Current State
```typescript
// src/utils/compensatoryMechanisms.ts:145-180
const analyzeBrightness = (frame: Frame): number => {
  // TODO: Implement actual brightness analysis
  return 0.5; // ❌ ALWAYS RETURNS 0.5
};

const analyzeContrast = (frame: Frame): number => {
  return 0.5; // ❌ ALWAYS RETURNS 0.5
};

const detectHarshShadows = (frame: Frame): number => {
  return 0.2; // ❌ ALWAYS RETURNS 0.2
};
```

### ✅ Success Criteria
- [ ] `analyzeBrightness()` returns actual frame luminance (0-1 scale)
- [ ] `analyzeContrast()` returns actual standard deviation / 255
- [ ] `detectHarshShadows()` detects high-contrast edges near person
- [ ] SetupWizard lighting check fails in dark room
- [ ] SetupWizard lighting check passes in well-lit room
- [ ] Validation: Test in 3 lighting conditions (dim, normal, bright)

### 🔧 Implementation Tasks

#### Task 7.1: Implement Real Brightness Analysis
**File:** `src/utils/compensatoryMechanisms.ts`
**Effort:** 1 day

**Approach:**
```typescript
const analyzeBrightness = (frame: Frame): number => {
  // Get frame buffer (pixel data)
  const buffer = frame.toArrayBuffer(); // or frame.buffer depending on API
  const data = new Uint8ClampedArray(buffer);

  let totalLuminance = 0;
  const pixelCount = data.length / 4; // RGBA format

  // Calculate average luminance using standard formula
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Luminance formula: 0.299R + 0.587G + 0.114B
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += luminance;
  }

  // Normalize to 0-1 range
  return (totalLuminance / pixelCount) / 255;
};
```

**Edge Cases:**
- Empty frame buffer → return 0.5 (default)
- Invalid frame format → log error, return 0.5
- Performance: Sample every 4th pixel if full analysis too slow

---

#### Task 7.2: Implement Real Contrast Analysis
**File:** `src/utils/compensatoryMechanisms.ts`
**Effort:** 1 day

**Approach:**
```typescript
const analyzeContrast = (frame: Frame): number => {
  const buffer = frame.toArrayBuffer();
  const data = new Uint8ClampedArray(buffer);

  // Calculate mean luminance first
  let sum = 0;
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    sum += luminance;
  }

  const mean = sum / pixelCount;

  // Calculate standard deviation
  let varianceSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const diff = luminance - mean;
    varianceSum += diff * diff;
  }

  const stdDev = Math.sqrt(varianceSum / pixelCount);

  // Normalize to 0-1 range
  return stdDev / 255;
};
```

**Optimization:**
- Use same loop for both brightness and contrast (single pass)
- Cache mean value

---

#### Task 7.3: Implement Shadow Detection
**File:** `src/utils/compensatoryMechanisms.ts`
**Effort:** 1 day

**Approach:**
```typescript
const detectHarshShadows = (frame: Frame): number => {
  const buffer = frame.toArrayBuffer();
  const data = new Uint8ClampedArray(buffer);
  const width = frame.width;
  const height = frame.height;

  // Sobel edge detection for high-contrast boundaries
  let shadowScore = 0;
  const samplePoints = 100; // Sample grid

  for (let i = 0; i < samplePoints; i++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;

    // Get neighboring pixels
    const centerIdx = (y * width + x) * 4;
    const topIdx = ((y - 1) * width + x) * 4;
    const bottomIdx = ((y + 1) * width + x) * 4;
    const leftIdx = (y * width + (x - 1)) * 4;
    const rightIdx = (y * width + (x + 1)) * 4;

    // Calculate luminance for each
    const center = getLuminance(data, centerIdx);
    const top = getLuminance(data, topIdx);
    const bottom = getLuminance(data, bottomIdx);
    const left = getLuminance(data, leftIdx);
    const right = getLuminance(data, rightIdx);

    // Sobel operator
    const gx = (right - left) / 2;
    const gy = (bottom - top) / 2;
    const gradient = Math.sqrt(gx * gx + gy * gy);

    // High gradient = potential shadow edge
    if (gradient > 100) { // Threshold for harsh shadow
      shadowScore += gradient;
    }
  }

  // Normalize
  return Math.min(shadowScore / (samplePoints * 255), 1.0);
};

const getLuminance = (data: Uint8ClampedArray, idx: number): number => {
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  return 0.299 * r + 0.587 * g + 0.114 * b;
};
```

**Alternative (Simpler):**
- Calculate histogram of luminance values
- Detect bimodal distribution (indicates harsh shadows)

---

#### Task 7.4: Add Frame Buffer Access Helper
**File:** `src/utils/frameHelpers.ts` (new file)
**Effort:** 0.5 day

```typescript
import { Frame } from 'react-native-vision-camera';

/**
 * Extracts pixel data from camera frame
 * Handles platform differences (iOS vs Android)
 */
export const getFrameBuffer = (frame: Frame): Uint8ClampedArray | null => {
  try {
    // react-native-vision-camera v4 API
    const buffer = frame.toArrayBuffer();
    return new Uint8ClampedArray(buffer);
  } catch (error) {
    console.error('Failed to extract frame buffer:', error);
    return null;
  }
};

/**
 * Get frame dimensions
 */
export const getFrameDimensions = (frame: Frame): { width: number; height: number } => {
  return {
    width: frame.width,
    height: frame.height,
  };
};
```

---

#### Task 7.5: Update SetupWizard to Use Real Values
**File:** `src/components/common/SetupWizard.tsx`
**Effort:** 0.5 day

**Current:**
```typescript
// Line 62-63
const mockFrame = {} as Frame; // ❌ FAKE FRAME
const mockLandmarks = [];
```

**Replace with:**
```typescript
// Get real frame from camera hook
const { frame } = useCameraFrame(); // Implement hook

const handleLightingCheck = () => {
  if (!frame) {
    setLightingStatus({
      status: 'too_dark',
      message: 'Camera not ready',
      suggestion: 'Please wait for camera to initialize',
      canProceed: false,
      icon: '⚠️',
      brightness: 0,
    });
    return;
  }

  const assessment = checkLightingConditions(frame);
  setLightingStatus(assessment);

  // ... rest of logic
};
```

**New Hook:**
```typescript
// src/hooks/useCameraFrame.ts
import { useFrameProcessor } from 'react-native-vision-camera';
import { useRef } from 'react';

export const useCameraFrame = () => {
  const latestFrame = useRef<Frame | null>(null);

  useFrameProcessor((frame) => {
    'worklet';
    // Store latest frame for analysis
    latestFrame.current = frame;
  }, []);

  return { frame: latestFrame.current };
};
```

---

#### Task 7.6: Validation Testing
**Effort:** 0.5 day

**Test Scenarios:**
1. **Dim Room (6am, curtains closed)**
   - Expected: brightness < 0.3, status: 'too_dark'
   - Expected: canProceed: false

2. **Normal Room (daytime, window light)**
   - Expected: brightness 0.4-0.7, status: 'good'
   - Expected: canProceed: true

3. **Bright Room (direct sunlight)**
   - Expected: brightness > 0.8, status: 'too_bright'
   - Expected: canProceed: false

4. **Harsh Shadows (side lighting)**
   - Expected: shadows > 0.4, status: 'harsh_shadows'
   - Expected: suggestion to adjust lighting

**Validation Script:**
```bash
# scripts/validate-compensatory.sh
#!/bin/bash

echo "Testing compensatory mechanisms..."

# Test 1: Brightness range
node -e "
const { analyzeBrightness } = require('./src/utils/compensatoryMechanisms');
const mockFrame = createTestFrame('dark'); // 0.2 brightness
const result = analyzeBrightness(mockFrame);
console.log(result < 0.3 ? '✅ Dark room detected' : '❌ Failed');
"

# Test 2: Contrast detection
# Test 3: Shadow detection
```

---

### 📦 Deliverables

1. **Updated Files:**
   - `src/utils/compensatoryMechanisms.ts` (real implementations)
   - `src/utils/frameHelpers.ts` (new)
   - `src/hooks/useCameraFrame.ts` (new)
   - `src/components/common/SetupWizard.tsx` (use real frames)

2. **Tests:**
   - `__tests__/unit/compensatoryMechanisms.test.ts` (unit tests)
   - `scripts/validate-compensatory.sh` (integration test)

3. **Documentation:**
   - `docs/qa/gate-7-verification.md`

---

## GATE 8: Simple Authentication System

### 🎯 Objective
Implement basic authentication to save patient profiles and enable external systems to push prescribed exercises.

### 📋 Requirements

**User Stories:**
1. As a patient, I can create an account with email/password
2. As a patient, I can login and see my profile
3. As a patient, my exercise history persists across sessions
4. As an external system, I can push YouTube URLs to a patient's account via API

### ✅ Success Criteria
- [ ] Patient can register (email, password, name)
- [ ] Patient can login (JWT token stored securely)
- [ ] Profile data persisted (encrypted storage)
- [ ] Logout clears session
- [ ] External API accepts YouTube URLs for patient

### 🔧 Implementation Tasks

#### Task 8.1: Choose Auth Strategy
**Effort:** 0.5 day (decision + setup)

**Options:**

**Option A: Firebase Auth (Recommended)**
- ✅ Free tier (10k users)
- ✅ Built-in email/password
- ✅ No backend needed
- ✅ React Native SDK
- ❌ Vendor lock-in

**Option B: Supabase Auth**
- ✅ Open source
- ✅ PostgreSQL backend
- ✅ REST API for external systems
- ✅ Free tier (50k users)
- ❌ Requires backend hosting

**Option C: Custom Backend (Node.js + Express)**
- ✅ Full control
- ✅ Easy to integrate external API
- ❌ Requires server hosting
- ❌ Security responsibility

**Recommendation:** **Supabase** (best balance of features + control)

---

#### Task 8.2: Set Up Supabase Project
**Effort:** 0.5 day

```bash
# Install Supabase client
npm install @supabase/supabase-js

# Set up environment variables
echo "SUPABASE_URL=https://your-project.supabase.co" >> .env
echo "SUPABASE_ANON_KEY=your-anon-key" >> .env
```

**Create Supabase Client:**
```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

#### Task 8.3: Implement Authentication Service
**File:** `src/services/authService.ts`
**Effort:** 1 day

```typescript
import { supabase } from './supabase';
import EncryptedStorage from 'react-native-encrypted-storage';

interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

interface LoginParams {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Register new user
   */
  register: async ({ email, password, name }: RegisterParams) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }, // Store name in user metadata
        },
      });

      if (error) throw error;

      // Store session
      if (data.session) {
        await EncryptedStorage.setItem(
          'auth_session',
          JSON.stringify(data.session)
        );
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Login existing user
   */
  login: async ({ email, password }: LoginParams) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Store session
      await EncryptedStorage.setItem(
        'auth_session',
        JSON.stringify(data.session)
      );

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await supabase.auth.signOut();
      await EncryptedStorage.removeItem('auth_session');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  /**
   * Get current session
   */
  getSession: async () => {
    try {
      // Try encrypted storage first
      const stored = await EncryptedStorage.getItem('auth_session');
      if (stored) {
        const session = JSON.parse(stored);
        return session;
      }

      // Fallback to Supabase
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  /**
   * Restore session on app launch
   */
  restoreSession: async () => {
    const session = await authService.getSession();
    if (session) {
      // Session valid, user is authenticated
      return { isAuthenticated: true, user: session.user };
    }
    return { isAuthenticated: false, user: null };
  },
};
```

---

#### Task 8.4: Update LoginScreen
**File:** `src/screens/LoginScreen.tsx`
**Effort:** 0.5 day

**Replace stub with:**
```typescript
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess, loginStart, loginFailure } from '../store/slices/userSlice';
import { authService } from '../services/authService';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      dispatch(loginStart());
      const { user, session } = await authService.login({ email, password });

      dispatch(loginSuccess({
        id: user.id,
        email: user.email!,
        name: user.user_metadata.name || 'User',
        profile: {},
      }));
    } catch (error) {
      dispatch(loginFailure(error.message));
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleRegister = async () => {
    try {
      dispatch(loginStart());
      const { user } = await authService.register({ email, password, name });

      dispatch(loginSuccess({
        id: user.id,
        email: user.email!,
        name,
        profile: {},
      }));
    } catch (error) {
      dispatch(loginFailure(error.message));
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isRegistering ? 'Create Account' : 'Login'}
      </Text>

      {isRegistering && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        onPress={isRegistering ? handleRegister : handleLogin}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {isRegistering ? 'Register' : 'Login'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.linkText}>
          {isRegistering
            ? 'Already have an account? Login'
            : "Don't have an account? Register"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

#### Task 8.5: Update App Initialization
**File:** `App.tsx`
**Effort:** 0.5 day

**Add session restoration:**
```typescript
useEffect(() => {
  const initializeAuth = async () => {
    const { isAuthenticated, user } = await authService.restoreSession();

    if (isAuthenticated && user) {
      dispatch(loginSuccess({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || 'User',
        profile: {},
      }));
    }
  };

  initializeAuth();
}, []);
```

---

#### Task 8.6: Create Patient Profile Schema
**Effort:** 0.5 day

**Supabase Table: `patient_profiles`**
```sql
create table patient_profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  age integer,
  surgery_type text,
  surgery_date date,
  assigned_exercises jsonb default '[]'::jsonb,
  exercise_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table patient_profiles enable row level security;

-- Policy: Users can only read/write their own profile
create policy "Users can view own profile"
  on patient_profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on patient_profiles for update
  using (auth.uid() = id);
```

---

### 📦 Deliverables

1. **New Files:**
   - `src/services/supabase.ts`
   - `src/services/authService.ts`

2. **Updated Files:**
   - `src/screens/LoginScreen.tsx` (functional auth)
   - `App.tsx` (session restoration)
   - `package.json` (add @supabase/supabase-js)

3. **Database:**
   - Supabase project created
   - `patient_profiles` table
   - RLS policies

4. **Documentation:**
   - `docs/qa/gate-8-verification.md`

---

## GATE 9: YouTube Template UI

### 🎯 Objective
Build UI for patients to receive prescribed YouTube exercise templates and perform comparisons.

### 📋 User Flow

```
Patient receives email: "New exercise prescribed!"
  ↓
Email contains: YouTube URL (https://youtube.com/watch?v=abc123)
  ↓
Patient taps link → Opens PhysioAssist app (deep link)
  ↓
App shows: "Loading exercise template..."
  ↓
YouTube video downloads (youtubeService)
  ↓
Patient sees: Video thumbnail, exercise name, "Start Exercise" button
  ↓
Patient taps "Start Exercise"
  ↓
Split screen: YouTube video (left) | Live camera (right)
  ↓
Patient performs exercise while watching video
  ↓
AI compares poses in real-time (comparisonAnalysisService)
  ↓
Shows form corrections: "Bend elbow 10° more"
  ↓
After completion: Summary screen with score
```

### ✅ Success Criteria
- [ ] App can receive YouTube URLs via deep link
- [ ] Video downloads and caches locally
- [ ] Split-screen comparison UI
- [ ] Real-time form feedback during exercise
- [ ] Session saved to patient profile

### 🔧 Implementation Tasks

#### Task 9.1: Create Prescribed Exercises Screen
**File:** `src/screens/PrescribedExercisesScreen.tsx` (new)
**Effort:** 1 day

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { supabase } from '../services/supabase';

interface PrescribedExercise {
  id: string;
  youtubeUrl: string;
  title: string;
  thumbnail: string;
  prescribedBy: string;
  prescribedAt: string;
}

const PrescribedExercisesScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState<PrescribedExercise[]>([]);
  const userId = useSelector((state: RootState) => state.user.currentUser?.id);

  useEffect(() => {
    loadPrescribedExercises();
  }, []);

  const loadPrescribedExercises = async () => {
    const { data, error } = await supabase
      .from('patient_profiles')
      .select('assigned_exercises')
      .eq('id', userId)
      .single();

    if (data) {
      setExercises(data.assigned_exercises || []);
    }
  };

  const handleStartExercise = (exercise: PrescribedExercise) => {
    navigation.navigate('VideoComparison', {
      youtubeUrl: exercise.youtubeUrl,
      exerciseTitle: exercise.title,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Prescribed Exercises</Text>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseCard}
            onPress={() => handleStartExercise(item)}
          >
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbnail}
            />
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                Prescribed by: {item.prescribedBy}
              </Text>
              <Text style={styles.date}>
                {new Date(item.prescribedAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No exercises prescribed yet.
            Your doctor will send you exercises soon!
          </Text>
        }
      />
    </View>
  );
};
```

---

#### Task 9.2: Create Video Comparison Screen
**File:** `src/screens/VideoComparisonScreen.tsx` (new)
**Effort:** 2 days

```typescript
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import Video from 'react-native-video';
import { youtubeService } from '../features/videoComparison/services/youtubeService';
import { comparisonAnalysisService } from '../features/videoComparison/services/comparisonAnalysisService';
import { poseDetectionService } from '../services/PoseDetectionService.v2';

const VideoComparisonScreen = ({ route }) => {
  const { youtubeUrl, exerciseTitle } = route.params;
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [referencePoses, setReferencePoses] = useState<any[]>([]);
  const [userPoses, setUserPoses] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    downloadVideo();
  }, []);

  const downloadVideo = async () => {
    try {
      const info = await youtubeService.getVideoInfo(youtubeUrl);
      const path = await youtubeService.downloadVideo(
        youtubeUrl,
        'medium', // Quality
        (progress) => console.log('Download:', progress)
      );
      setVideoPath(path);

      // Extract poses from reference video
      await extractReferencePoses(path);
    } catch (error) {
      Alert.alert('Error', 'Failed to load exercise template');
    }
  };

  const extractReferencePoses = async (path: string) => {
    // TODO: Extract poses frame-by-frame
    // This requires video frame extraction (ffmpeg or similar)
    // For now, use placeholder
    setReferencePoses([]);
  };

  const handleStartExercise = () => {
    setIsRecording(true);
    setUserPoses([]);

    // Start pose detection
    poseDetectionService.initialize().then(() => {
      // Collect poses during exercise
    });
  };

  const handleStopExercise = async () => {
    setIsRecording(false);

    // Compare user poses to reference
    const result = await comparisonAnalysisService.compare(
      userPoses,
      referencePoses
    );

    setFeedback(result.recommendations.join('\n'));

    // Save session
    // TODO: Save to patient_profiles.exercise_history
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exerciseTitle}</Text>

      {/* Split Screen */}
      <View style={styles.splitScreen}>
        {/* Reference Video */}
        <View style={styles.referencePanel}>
          <Text style={styles.label}>Reference</Text>
          {videoPath && (
            <Video
              source={{ uri: videoPath }}
              style={styles.video}
              resizeMode="contain"
              repeat
              paused={!isRecording}
            />
          )}
        </View>

        {/* Live Camera */}
        <View style={styles.cameraPanel}>
          <Text style={styles.label}>You</Text>
          <Camera
            style={styles.camera}
            device={device}
            isActive={true}
          />
        </View>
      </View>

      {/* Feedback */}
      {feedback && (
        <View style={styles.feedbackPanel}>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {!isRecording ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleStartExercise}
          >
            <Text style={styles.buttonText}>Start Exercise</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={handleStopExercise}
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
```

---

#### Task 9.3: Add Deep Linking
**File:** `src/navigation/RootNavigator.tsx`
**Effort:** 0.5 day

```typescript
import { Linking } from 'react-native';

const linking = {
  prefixes: ['physioassist://', 'https://physioassist.app'],
  config: {
    screens: {
      VideoComparison: 'exercise/:youtubeUrl',
    },
  },
};

// In NavigationContainer
<NavigationContainer linking={linking}>
  {/* ... */}
</NavigationContainer>
```

**URL Format:**
```
physioassist://exercise/https://youtube.com/watch?v=abc123
```

---

#### Task 9.4: Add to Navigation
**File:** `src/navigation/RootNavigator.tsx`
**Effort:** 0.5 day

```typescript
const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Exercises" component={PrescribedExercisesScreen} />
    <Tab.Screen name="PoseDetection" component={PoseDetectionScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  // ... auth guards

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VideoComparison"
        component={VideoComparisonScreen}
        options={{ title: 'Exercise Comparison' }}
      />
    </Stack.Navigator>
  );
};
```

---

### 📦 Deliverables

1. **New Screens:**
   - `src/screens/PrescribedExercisesScreen.tsx`
   - `src/screens/VideoComparisonScreen.tsx`

2. **Updated Files:**
   - `src/navigation/RootNavigator.tsx` (deep linking, new screens)
   - `package.json` (add react-native-video)

3. **Documentation:**
   - `docs/qa/gate-9-verification.md`

---

## GATE 10: External Prescription API

### 🎯 Objective
Allow external systems (doctor portal, EMR system) to push YouTube exercise URLs to patient accounts.

### 📋 API Specification

**Endpoint:** `POST /api/prescribe-exercise`

**Authentication:** API Key (Supabase service role key)

**Request:**
```json
{
  "patientEmail": "patient@example.com",
  "youtubeUrl": "https://youtube.com/watch?v=abc123",
  "exerciseTitle": "Knee Flexion Post-Surgery",
  "prescribedBy": "Dr. Smith",
  "notes": "Perform 3 sets of 10 reps, twice daily"
}
```

**Response:**
```json
{
  "success": true,
  "exerciseId": "uuid-here",
  "message": "Exercise prescribed successfully"
}
```

### ✅ Success Criteria
- [ ] External system can authenticate via API key
- [ ] Exercise appears in patient's app immediately
- [ ] Patient receives push notification
- [ ] Invalid patient email returns error

### 🔧 Implementation Tasks

#### Task 10.1: Create Supabase Edge Function
**File:** `supabase/functions/prescribe-exercise/index.ts` (new)
**Effort:** 1 day

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('authorization')?.replace('Bearer ', '');
    if (apiKey !== Deno.env.get('PRESCRIPTION_API_KEY')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { patientEmail, youtubeUrl, exerciseTitle, prescribedBy, notes } =
      await req.json();

    // Validate inputs
    if (!patientEmail || !youtubeUrl || !exerciseTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Find patient by email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    const patient = user?.users.find((u) => u.email === patientEmail);

    if (!patient) {
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get patient profile
    const { data: profile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('assigned_exercises')
      .eq('id', patient.id)
      .single();

    if (profileError) throw profileError;

    // Create new exercise
    const newExercise = {
      id: crypto.randomUUID(),
      youtubeUrl,
      title: exerciseTitle,
      thumbnail: `https://img.youtube.com/vi/${extractVideoId(youtubeUrl)}/maxresdefault.jpg`,
      prescribedBy,
      prescribedAt: new Date().toISOString(),
      notes,
    };

    // Append to assigned exercises
    const updatedExercises = [
      ...(profile?.assigned_exercises || []),
      newExercise,
    ];

    // Update profile
    const { error: updateError } = await supabase
      .from('patient_profiles')
      .update({ assigned_exercises: updatedExercises })
      .eq('id', patient.id);

    if (updateError) throw updateError;

    // TODO: Send push notification

    return new Response(
      JSON.stringify({
        success: true,
        exerciseId: newExercise.id,
        message: 'Exercise prescribed successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function extractVideoId(url: string): string {
  const match = url.match(/(?:v=|\/)([\w-]{11})/);
  return match ? match[1] : '';
}
```

---

#### Task 10.2: Deploy Edge Function
**Effort:** 0.5 day

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Deploy function
supabase functions deploy prescribe-exercise

# Set environment variable
supabase secrets set PRESCRIPTION_API_KEY=your-secret-key-here
```

---

#### Task 10.3: Create API Documentation
**File:** `docs/api/PRESCRIPTION_API.md` (new)
**Effort:** 0.5 day

```markdown
# Exercise Prescription API

## Authentication
Include API key in Authorization header:
```
Authorization: Bearer your-api-key-here
```

## Prescribe Exercise

**Endpoint:** `POST https://your-project.supabase.co/functions/v1/prescribe-exercise`

**Request Body:**
```json
{
  "patientEmail": "patient@example.com",
  "youtubeUrl": "https://youtube.com/watch?v=abc123",
  "exerciseTitle": "Knee Flexion Post-Surgery",
  "prescribedBy": "Dr. Smith",
  "notes": "Perform 3 sets of 10 reps, twice daily"
}
```

**Example cURL:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/prescribe-exercise \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "patientEmail": "patient@example.com",
    "youtubeUrl": "https://youtube.com/watch?v=abc123",
    "exerciseTitle": "Knee Flexion",
    "prescribedBy": "Dr. Smith"
  }'
```

**Response:**
```json
{
  "success": true,
  "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Exercise prescribed successfully"
}
```

## Error Codes
- `401`: Invalid API key
- `404`: Patient not found
- `400`: Missing required fields
- `500`: Server error
```

---

#### Task 10.4: Test API
**Effort:** 0.5 day

```bash
# Test script
curl -X POST https://your-project.supabase.co/functions/v1/prescribe-exercise \
  -H "Authorization: Bearer test-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "patientEmail": "test@example.com",
    "youtubeUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "exerciseTitle": "Test Exercise",
    "prescribedBy": "Test Doctor"
  }'
```

**Expected:** Exercise appears in test patient's app within 5 seconds.

---

### 📦 Deliverables

1. **Supabase Function:**
   - `supabase/functions/prescribe-exercise/index.ts`

2. **Documentation:**
   - `docs/api/PRESCRIPTION_API.md`
   - `docs/qa/gate-10-verification.md`

3. **Deployment:**
   - Edge function deployed to Supabase

---

## GATE 11: CLI Simulator Testing

### 🎯 Objective
Test all functionality in iOS Simulator using Claude Code CLI bridge.

### 📋 Test Scenarios

**1. Full Patient Journey**
- Register new account
- Receive prescribed exercise (via API call)
- Open exercise from list
- Perform exercise in simulator (simulate poses)
- View comparison results
- Check exercise history

**2. Compensatory Mechanisms**
- Test lighting detection (simulate different brightness)
- Test shadow detection
- Test distance/positioning

**3. Authentication**
- Login/logout
- Session persistence
- Profile updates

**4. Error Handling**
- Network errors
- Camera permission denied
- Invalid YouTube URL
- API errors

### ✅ Success Criteria
- [ ] All screens render correctly
- [ ] Navigation flows work
- [ ] Authentication persists across app restarts
- [ ] Compensatory mechanisms detect lighting changes
- [ ] Video comparison completes successfully
- [ ] No crashes or red screens

### 🔧 Testing Tasks

#### Task 11.1: Set Up iOS Simulator
**Effort:** 0.5 day

```bash
# Install dependencies
npm install

# Install iOS dependencies
cd ios && pod install && cd ..

# Launch simulator
npm run ios:sim
```

---

#### Task 11.2: Claude Code CLI Bridge Testing
**Effort:** 2-3 days

**Use Claude Code CLI to:**
1. Run app in simulator
2. Navigate through screens
3. Trigger actions (button presses)
4. Verify UI states
5. Check console logs
6. Take screenshots

**Example Bridge Commands:**
```bash
# Via ios-cli.sh
./scripts/ios/ios-cli.sh simulator status
./scripts/ios/ios-cli.sh simulator screenshot
./scripts/ios/ios-cli.sh simulator logs
```

---

#### Task 11.3: Validation Checklist
**File:** `docs/qa/CLI_VALIDATION_CHECKLIST.md` (new)
**Effort:** 0.5 day

```markdown
# CLI Validation Checklist

## Pre-Testing
- [ ] npm install completed
- [ ] pod install completed
- [ ] Simulator launched
- [ ] App installed

## Gate 7: Compensatory Mechanisms
- [ ] SetupWizard lighting check detects dark room
- [ ] SetupWizard lighting check detects bright light
- [ ] SetupWizard lighting check passes in normal light
- [ ] Shadow detection works

## Gate 8: Authentication
- [ ] Registration screen loads
- [ ] Can create new account
- [ ] Login screen loads
- [ ] Can login with credentials
- [ ] Session persists after app restart
- [ ] Logout clears session

## Gate 9: YouTube Templates
- [ ] Prescribed exercises screen loads
- [ ] Can open exercise from list
- [ ] Video downloads successfully
- [ ] Split-screen comparison renders
- [ ] Pose detection starts
- [ ] Comparison feedback displays

## Gate 10: External API
- [ ] API call prescribes exercise
- [ ] Exercise appears in app
- [ ] Thumbnail displays correctly

## Gate 11: Overall
- [ ] No crashes during testing
- [ ] No red screen errors
- [ ] All navigation works
- [ ] Performance acceptable (30 FPS)
```

---

#### Task 11.4: Bug Fixes
**Effort:** 1-2 days

Fix any issues discovered during testing.

---

### 📦 Deliverables

1. **Documentation:**
   - `docs/qa/CLI_VALIDATION_CHECKLIST.md`
   - `docs/qa/gate-11-verification.md`
   - Screenshots of all screens

2. **Test Reports:**
   - Bug reports (if any)
   - Performance metrics
   - Crash logs (if any)

---

## 📊 Overall Timeline Summary

| Gate | Duration | Dependencies | Output |
|------|----------|--------------|--------|
| **7** | 3-4 days | None | Real compensatory mechanisms |
| **8** | 2-3 days | None | Working authentication |
| **9** | 3-4 days | Gate 8 | YouTube template UI |
| **10** | 2-3 days | Gate 8, 9 | External API |
| **11** | 3-5 days | Gates 7-10 | Validated app |

**Total: 13-19 days (2-3 weeks)**

---

## 🎯 Final Deliverable: Production-Ready PhysioAssist

**Features:**
- ✅ Real lighting/positioning validation (safety)
- ✅ Patient authentication (profiles)
- ✅ YouTube exercise templates (core feature)
- ✅ External prescription system (doctor workflow)
- ✅ Validated in iOS Simulator (quality)

**What's NOT Included (Deferred):**
- Legal docs (Terms, Privacy)
- App Store listing
- Backend scaling
- Analytics
- Push notifications (partial)

**Production Readiness:** ~70% (up from 16%)

**Recommended Next Steps:**
1. Complete Gates 7-11 (2-3 weeks)
2. Add legal compliance (1 week)
3. Beta test with 10 real patients (2 weeks)
4. Launch to App Store (1 week)

**Total to Production:** 6-8 weeks

---

**Plan End**
