import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProcessedPoseData, JointAngle } from '@types/pose';

interface PoseState {
  currentPose: ProcessedPoseData | null;
  jointAngles: Record<string, JointAngle>;
  isDetecting: boolean;
  confidence: number;
  frameRate: number;
}

const initialState: PoseState = {
  currentPose: null,
  jointAngles: {},
  isDetecting: false,
  confidence: 0,
  frameRate: 0,
};

const poseSlice = createSlice({
  name: 'pose',
  initialState,
  reducers: {
    setPoseData: (state, action: PayloadAction<ProcessedPoseData>) => {
      state.currentPose = action.payload;
      state.confidence = action.payload.confidence;
    },
    setJointAngles: (state, action: PayloadAction<Record<string, JointAngle>>) => {
      state.jointAngles = action.payload;
    },
    setDetecting: (state, action: PayloadAction<boolean>) => {
      state.isDetecting = action.payload;
    },
    setFrameRate: (state, action: PayloadAction<number>) => {
      state.frameRate = action.payload;
    },
    resetPose: (state) => {
      state.currentPose = null;
      state.jointAngles = {};
      state.confidence = 0;
    },
  },
});

export const { setPoseData, setJointAngles, setDetecting, setFrameRate, resetPose } = poseSlice.actions;
export default poseSlice.reducer;