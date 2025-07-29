# YouTube Video Comparison Feature Implementation

## 📹 Feature Overview
The YouTube Video Comparison feature allows patients to compare their exercise form with professional demonstration videos by pasting a YouTube link. The app extracts pose data from both sources and provides real-time, side-by-side comparison with detailed feedback.

## 🏗️ Architecture

### Components Structure
```
src/features/videoComparison/
├── components/
│   ├── VideoComparisonScreen.tsx
│   ├── YouTubeVideoPlayer.tsx
│   ├── SideBySideView.tsx
│   ├── PoseComparisonOverlay.tsx
│   └── ComparisonFeedback.tsx
├── services/
│   ├── youtubeService.ts
│   ├── videoProcessingService.ts
│   ├── poseExtractionService.ts
│   └── comparisonAnalysisService.ts
├── hooks/
│   ├── useVideoComparison.ts
│   ├── useYouTubeDownload.ts
│   └── usePoseSynchronization.ts
├── utils/
│   ├── videoUtils.ts
│   ├── poseMatchingUtils.ts
│   └── feedbackGenerator.ts
└── types/
    └── videoComparison.types.ts
```

## 📱 Implementation Details

### 1. YouTube Video Service
```typescript
// src/features/videoComparison/services/youtubeService.ts
import { ytdl } from 'react-native-ytdl';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface YouTubeVideoInfo {
  url: string;
  title: string;
  duration: number;
  thumbnail: string;
  author: string;
}

export class YouTubeService {
  private static instance: YouTubeService;
  private cache: Map<string, YouTubeVideoInfo> = new Map();

  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  async validateUrl(url: string): Promise<boolean> {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    try {
      const info = await ytdl.getInfo(url);
      const videoInfo: YouTubeVideoInfo = {
        url,
        title: info.videoDetails.title,
        duration: parseInt(info.videoDetails.lengthSeconds),
        thumbnail: info.videoDetails.thumbnails[0].url,
        author: info.videoDetails.author.name
      };

      this.cache.set(url, videoInfo);
      return videoInfo;
    } catch (error) {
      throw new Error('Failed to fetch YouTube video info');
    }
  }

  async downloadVideo(url: string, quality: 'low' | 'medium' | 'high' = 'medium'): Promise<string> {
    const qualityMap = {
      low: '360p',
      medium: '720p',
      high: '1080p'
    };

    try {
      const videoPath = `${RNFS.CachesDirectoryPath}/youtube_${Date.now()}.mp4`;
      const stream = ytdl(url, { quality: qualityMap[quality] });
      
      await RNFS.writeFile(videoPath, stream, 'base64');
      return videoPath;
    } catch (error) {
      throw new Error('Failed to download YouTube video');
    }
  }
}
```

### 2. Video Processing Service
```typescript
// src/features/videoComparison/services/videoProcessingService.ts
import { FFmpegKit, FFmpegKitConfig } from 'react-native-ffmpeg';

export class VideoProcessingService {
  static async extractFrames(
    videoPath: string, 
    fps: number = 30
  ): Promise<string[]> {
    const outputDir = `${RNFS.CachesDirectoryPath}/frames_${Date.now()}`;
    await RNFS.mkdir(outputDir);

    const command = `-i ${videoPath} -vf fps=${fps} ${outputDir}/frame_%04d.jpg`;
    
    await FFmpegKit.execute(command);
    
    const frames = await RNFS.readDir(outputDir);
    return frames
      .filter(file => file.name.endsWith('.jpg'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(file => file.path);
  }

  static async synchronizeVideos(
    referenceFrames: string[],
    userFrames: string[]
  ): Promise<{ offset: number; confidence: number }> {
    // Implement frame matching algorithm
    // This could use image similarity metrics or pose matching
    const offset = await this.findBestAlignment(referenceFrames, userFrames);
    const confidence = await this.calculateConfidence(offset);

    return { offset, confidence };
  }

  private static async findBestAlignment(
    reference: string[],
    user: string[]
  ): Promise<number> {
    // Simplified alignment - in production use DTW or similar
    let bestOffset = 0;
    let bestScore = -Infinity;

    for (let offset = -30; offset <= 30; offset++) {
      const score = await this.calculateAlignmentScore(reference, user, offset);
      if (score > bestScore) {
        bestScore = score;
        bestOffset = offset;
      }
    }

    return bestOffset;
  }
}
```

### 3. Pose Extraction Service
```typescript
// src/features/videoComparison/services/poseExtractionService.ts
import { BlazePose } from '@mediapipe/pose';

interface PoseFrame {
  timestamp: number;
  landmarks: PoseLandmark[];
  visibility: number[];
}

export class PoseExtractionService {
  private blazePose: BlazePose;

  constructor() {
    this.blazePose = new BlazePose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.blazePose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  async extractPosesFromFrames(framePaths: string[]): Promise<PoseFrame[]> {
    const poses: PoseFrame[] = [];

    for (let i = 0; i < framePaths.length; i++) {
      const frame = await this.loadImage(framePaths[i]);
      const results = await this.blazePose.send({ image: frame });

      if (results.poseLandmarks) {
        poses.push({
          timestamp: i / 30, // Assuming 30 fps
          landmarks: results.poseLandmarks,
          visibility: results.poseLandmarks.map(l => l.visibility || 0)
        });
      }
    }

    return poses;
  }

  private async loadImage(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `file://${path}`;
    });
  }
}
```

### 4. Comparison Analysis Service
```typescript
// src/features/videoComparison/services/comparisonAnalysisService.ts
export interface ComparisonResult {
  overallScore: number;
  angleDeviations: AngleDeviation[];
  temporalAlignment: TemporalAlignment;
  recommendations: Recommendation[];
}

interface AngleDeviation {
  joint: string;
  referenceAngle: number;
  userAngle: number;
  deviation: number;
  severity: 'good' | 'warning' | 'critical';
}

export class ComparisonAnalysisService {
  static analyzeMovement(
    referencePoses: PoseFrame[],
    userPoses: PoseFrame[],
    exerciseType: string
  ): ComparisonResult {
    const angleDeviations = this.compareAngles(referencePoses, userPoses);
    const temporalAlignment = this.analyzeTempo(referencePoses, userPoses);
    const overallScore = this.calculateOverallScore(angleDeviations, temporalAlignment);
    const recommendations = this.generateRecommendations(angleDeviations, temporalAlignment);

    return {
      overallScore,
      angleDeviations,
      temporalAlignment,
      recommendations
    };
  }

  private static compareAngles(
    reference: PoseFrame[],
    user: PoseFrame[]
  ): AngleDeviation[] {
    const criticalJoints = ['elbow', 'shoulder', 'knee', 'hip'];
    const deviations: AngleDeviation[] = [];

    criticalJoints.forEach(joint => {
      const refAngle = this.calculateAverageAngle(reference, joint);
      const userAngle = this.calculateAverageAngle(user, joint);
      const deviation = Math.abs(refAngle - userAngle);

      deviations.push({
        joint,
        referenceAngle: refAngle,
        userAngle: userAngle,
        deviation,
        severity: this.getSeverity(deviation)
      });
    });

    return deviations;
  }

  private static getSeverity(deviation: number): 'good' | 'warning' | 'critical' {
    if (deviation < 5) return 'good';
    if (deviation < 15) return 'warning';
    return 'critical';
  }

  private static generateRecommendations(
    angleDeviations: AngleDeviation[],
    temporalAlignment: TemporalAlignment
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Angle-based recommendations
    angleDeviations.forEach(deviation => {
      if (deviation.severity !== 'good') {
        recommendations.push({
          type: 'angle',
          priority: deviation.severity === 'critical' ? 'high' : 'medium',
          message: `Adjust your ${deviation.joint} angle by ${deviation.deviation.toFixed(0)}°`,
          detail: this.getAngleCorrection(deviation)
        });
      }
    });

    // Tempo-based recommendations
    if (temporalAlignment.speedRatio > 1.2) {
      recommendations.push({
        type: 'tempo',
        priority: 'medium',
        message: 'Slow down your movement',
        detail: `You're moving ${((temporalAlignment.speedRatio - 1) * 100).toFixed(0)}% faster than the reference`
      });
    }

    return recommendations;
  }
}
```

### 5. React Component Implementation
```typescript
// src/features/videoComparison/components/VideoComparisonScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { useVideoComparison } from '../hooks/useVideoComparison';

export const VideoComparisonScreen: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const {
    isLoading,
    comparison,
    startComparison,
    pauseComparison,
    syncVideos
  } = useVideoComparison();

  const handleLoadVideo = async () => {
    if (youtubeUrl) {
      await startComparison(youtubeUrl);
    }
  };

  return (
    <View style={styles.container}>
      {/* URL Input Section */}
      <View style={styles.urlSection}>
        <Text style={styles.label}>Compare with YouTube Video</Text>
        <View style={styles.urlInputWrapper}>
          <TextInput
            style={styles.urlInput}
            placeholder="Paste YouTube URL here..."
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
          />
          <TouchableOpacity
            style={styles.loadButton}
            onPress={handleLoadVideo}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loadButtonText}>Load</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Comparison View */}
      {comparison && (
        <View style={styles.comparisonContainer}>
          <SideBySideView
            referenceVideo={comparison.referenceVideo}
            userCamera={comparison.userCamera}
            poseOverlay={comparison.poseData}
          />
          
          <ComparisonControls
            onPlay={() => comparison.play()}
            onPause={() => comparison.pause()}
            onSync={syncVideos}
          />
          
          <ComparisonFeedback
            analysis={comparison.analysis}
            recommendations={comparison.recommendations}
          />
        </View>
      )}
    </View>
  );
};
```

### 6. Side-by-Side View Component
```typescript
// src/features/videoComparison/components/SideBySideView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VisionCamera } from 'react-native-vision-camera';
import Video from 'react-native-video';
import { PoseOverlay } from '../../pose/PoseOverlay';

interface Props {
  referenceVideo: string;
  userCamera: any;
  poseOverlay: {
    reference: PoseData;
    user: PoseData;
  };
}

export const SideBySideView: React.FC<Props> = ({
  referenceVideo,
  userCamera,
  poseOverlay
}) => {
  return (
    <View style={styles.container}>
      {/* YouTube Reference Video */}
      <View style={styles.videoPanel}>
        <Video
          source={{ uri: referenceVideo }}
          style={styles.video}
          resizeMode="contain"
        />
        <PoseOverlay
          pose={poseOverlay.reference}
          style={styles.overlay}
          color="red"
        />
        <View style={styles.label}>
          <Text style={styles.labelText}>YouTube Reference</Text>
        </View>
      </View>

      {/* User Camera Feed */}
      <View style={styles.videoPanel}>
        <VisionCamera
          style={styles.video}
          device={userCamera.device}
          isActive={true}
          frameProcessor={userCamera.frameProcessor}
        />
        <PoseOverlay
          pose={poseOverlay.user}
          style={styles.overlay}
          color="green"
        />
        <View style={styles.label}>
          <Text style={styles.labelText}>Your Movement</Text>
        </View>
      </View>
    </View>
  );
};
```

## 🔧 Technical Considerations

### 1. Performance Optimization
- **Frame Rate**: Process every 3rd frame (10fps) for pose detection to reduce CPU load
- **Caching**: Cache extracted poses from YouTube videos for repeated use
- **Threading**: Run pose extraction on separate thread using Worklets
- **Memory**: Limit video cache to 100MB, use LRU eviction

### 2. Network Handling
```typescript
const networkConfig = {
  timeout: 30000, // 30 seconds
  retries: 3,
  quality: {
    wifi: 'high',
    cellular: 'medium',
    offline: 'cached_only'
  }
};
```

### 3. Error Handling
```typescript
enum VideoComparisonError {
  INVALID_URL = 'Invalid YouTube URL',
  NETWORK_ERROR = 'Network connection failed',
  VIDEO_TOO_LONG = 'Video exceeds 10 minute limit',
  PROCESSING_FAILED = 'Failed to process video',
  INSUFFICIENT_STORAGE = 'Not enough storage space'
}
```

### 4. Privacy & Security
- Don't store YouTube videos permanently
- Clear cache after 24 hours
- Ensure HTTPS for all video downloads
- Respect YouTube's Terms of Service

## 📊 Testing Strategy

### Unit Tests
```typescript
describe('YouTubeService', () => {
  test('validates YouTube URLs correctly', () => {
    expect(YouTubeService.validateUrl('https://youtube.com/watch?v=123')).toBe(true);
    expect(YouTubeService.validateUrl('https://vimeo.com/123')).toBe(false);
  });
});

describe('ComparisonAnalysis', () => {
  test('calculates angle deviations accurately', () => {
    const result = ComparisonAnalysisService.compareAngles(refPoses, userPoses);
    expect(result[0].deviation).toBeLessThan(5);
  });
});
```

### Integration Tests
- Test full flow from URL input to feedback generation
- Verify synchronization accuracy
- Test error recovery mechanisms

### Performance Tests
- Measure frame processing time
- Monitor memory usage during video processing
- Test on low-end devices

## 🚀 Future Enhancements

1. **Multi-angle Support**: Compare from different camera angles
2. **Slow Motion**: Allow frame-by-frame analysis
3. **Social Sharing**: Share comparison results
4. **Custom Annotations**: Let therapists add notes to reference videos
5. **Offline Mode**: Pre-download reference videos for offline use

This implementation provides a robust YouTube video comparison feature that enhances the PhysioAssist app's ability to help patients improve their exercise form through visual feedback and professional reference videos.