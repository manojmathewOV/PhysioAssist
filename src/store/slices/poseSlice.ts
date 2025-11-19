import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProcessedPoseData, JointAngle } from '../../types/pose';

interface PoseState {
  currentPose: ProcessedPoseData | null;
  jointAngles: Record<string, JointAngle>;
  isDetecting: boolean;
  confidence: number;
  frameRate: number;
  timestamp: number; // When pose data was last updated
  sessionId: string; // Unique session identifier
  metadata: {
    capturedAt: number; // When frame was captured
    frameNumber: number; // Frame sequence number
    fps: number; // Frames per second at capture time
  };
}

const initialState: PoseState = {
  currentPose: null,
  jointAngles: {},
  isDetecting: false,
  confidence: 0,
  frameRate: 0,
  timestamp: 0,
  sessionId: '',
  metadata: {
    capturedAt: 0,
    frameNumber: 0,
    fps: 0,
  },
};

const poseSlice = createSlice({
  name: 'pose',
  initialState,
  reducers: {
    setPoseData: (state, action: PayloadAction<ProcessedPoseData>) => {
      state.currentPose = action.payload;
      state.confidence = action.payload.confidence;

      // Track timestamp when data was stored
      state.timestamp = Date.now();

      // Update metadata (preserve frameNumber before overwriting)
      const prevFrameNumber = state.metadata?.frameNumber || 0;
      state.metadata = {
        capturedAt: Date.now(), // Frame capture time
        frameNumber: prevFrameNumber + 1,
        fps: state.frameRate,
      };
    },
    setJointAngles: (state, action: PayloadAction<Record<string, JointAngle>>) => {
      state.jointAngles = action.payload;
    },
    setDetecting: (state, action: PayloadAction<boolean>) => {
      state.isDetecting = action.payload;

      // Generate new session ID when starting detection
      if (action.payload) {
        state.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        state.metadata.frameNumber = 0; // Reset frame counter
      }
    },
    setFrameRate: (state, action: PayloadAction<number>) => {
      state.frameRate = action.payload;
    },
    resetPose: (state) => {
      state.currentPose = null;
      state.jointAngles = {};
      state.confidence = 0;
      state.timestamp = 0;
      state.metadata = {
        capturedAt: 0,
        frameNumber: 0,
        fps: 0,
      };
    },
  },
});

export const { setPoseData, setJointAngles, setDetecting, setFrameRate, resetPose } =
  poseSlice.actions;
export default poseSlice.reducer;
