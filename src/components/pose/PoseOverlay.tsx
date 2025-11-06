import React, { useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { PoseLandmark } from '@types/pose';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define pose connections (skeleton)
const POSE_CONNECTIONS = [
  // Face
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
  // Arms
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [15, 17],
  [16, 18],
  [15, 19],
  [16, 20],
  [17, 19],
  [18, 20],
  [15, 21],
  [16, 22],
  // Body
  [11, 23],
  [12, 24],
  [23, 24],
  // Legs
  [23, 25],
  [24, 26],
  [25, 27],
  [26, 28],
  [27, 29],
  [28, 30],
  [29, 31],
  [30, 32],
  [27, 31],
  [28, 32],
];

interface PoseOverlayProps {
  landmarks?: PoseLandmark[];
  width?: number;
  height?: number;
  angles?: Record<string, number>;
  showAngles?: boolean;
  highlightJoints?: string[];
}

const PoseOverlay: React.FC<PoseOverlayProps> = ({
  landmarks: propLandmarks,
  width,
  height,
  angles: propAngles,
  showAngles = true,
  highlightJoints = [],
}) => {
  const { currentPose, jointAngles } = useSelector((state: RootState) => state.pose);

  // Use props if provided, otherwise use Redux state
  const landmarks = propLandmarks || currentPose?.landmarks || [];
  const angles = propAngles || jointAngles;
  const overlayWidth = width || screenWidth;
  const overlayHeight = height || screenHeight;

  // Convert normalized coordinates to screen coordinates
  const toScreenCoords = (landmark: PoseLandmark) => ({
    x: landmark.x * overlayWidth,
    y: landmark.y * overlayHeight,
  });

  // Determine color based on confidence
  const getColor = (visibility: number, isHighlighted: boolean = false) => {
    if (isHighlighted) return '#FFD700';
    if (visibility > 0.8) return '#00FF00';
    if (visibility > 0.5) return '#FFFF00';
    return '#FF0000';
  };

  const renderedConnections = useMemo(() => {
    return POSE_CONNECTIONS.map((connection, index) => {
      const [startIdx, endIdx] = connection;
      const startLandmark = landmarks[startIdx];
      const endLandmark = landmarks[endIdx];

      if (!startLandmark || !endLandmark) return null;

      const start = toScreenCoords(startLandmark);
      const end = toScreenCoords(endLandmark);
      const visibility = Math.min(startLandmark.visibility, endLandmark.visibility);

      if (visibility < 0.3) return null;

      return (
        <Line
          key={`connection-${index}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={getColor(visibility)}
          strokeWidth="2"
          opacity={visibility}
        />
      );
    });
  }, [landmarks]);

  const renderedLandmarks = useMemo(() => {
    return landmarks.map((landmark, index) => {
      if (landmark.visibility < 0.3) return null;

      const coords = toScreenCoords(landmark);
      const isHighlighted = highlightJoints.includes(landmark.name);

      return (
        <Circle
          key={`landmark-${index}`}
          cx={coords.x}
          cy={coords.y}
          r={isHighlighted ? 8 : 5}
          fill={getColor(landmark.visibility, isHighlighted)}
          opacity={landmark.visibility}
        />
      );
    });
  }, [landmarks, highlightJoints]);

  // Helper function to map joint names to landmark indices
  const getJointIndex = (jointName: string): number => {
    const jointMap: Record<string, number> = {
      left_shoulder: 11,
      right_shoulder: 12,
      left_elbow: 13,
      right_elbow: 14,
      left_wrist: 15,
      right_wrist: 16,
      left_hip: 23,
      right_hip: 24,
      left_knee: 25,
      right_knee: 26,
      left_ankle: 27,
      right_ankle: 28,
    };
    return jointMap[jointName] || 0;
  };

  const renderedAngles = useMemo(() => {
    if (!showAngles || !angles) return null;

    return Object.entries(angles).map(([jointName, angleValue]) => {
      // Handle both number and JointAngle object formats
      const angle = typeof angleValue === 'number' ? angleValue : angleValue?.angle;
      if (angle === undefined || angle === null) return null;

      // Find the joint landmark position
      const jointIndex = getJointIndex(jointName);
      const jointLandmark = landmarks[jointIndex];
      if (!jointLandmark) return null;

      const coords = toScreenCoords(jointLandmark);

      return (
        <SvgText
          key={`angle-${jointName}`}
          x={coords.x + 15}
          y={coords.y - 10}
          fill="#FFFFFF"
          fontSize="14"
          fontWeight="bold"
          stroke="#000000"
          strokeWidth="1"
        >
          {`${angle.toFixed(0)}°`}
        </SvgText>
      );
    });
  }, [angles, landmarks, showAngles]);

  // Skip rendering if no landmarks when props are provided
  if (propLandmarks !== undefined && landmarks.length === 0) {
    return (
      <Svg
        testID="pose-overlay-svg"
        style={StyleSheet.absoluteFill}
        width={overlayWidth}
        height={overlayHeight}
      />
    );
  }

  // Skip if no pose data from Redux and no props
  if (!propLandmarks && !currentPose) return null;

  return (
    <Svg
      testID="pose-overlay-svg"
      style={StyleSheet.absoluteFill}
      width={overlayWidth}
      height={overlayHeight}
    >
      {renderedConnections}
      {renderedLandmarks}
      {renderedAngles}
    </Svg>
  );
};

export default PoseOverlay;
