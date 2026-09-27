/**
 * Camera-screen skeleton and angle guidance (native, react-native-svg).
 *
 * Draws a calm, simplified body with a soft shadow so it reads on any background,
 * highlights the limbs the current exercise measures, and for each measured joint
 * shows a gauge: the goal range as a translucent track and the current angle as an
 * arc with a knob, green inside the range, amber outside. Numbers appear only when `showAngles` is on;
 * otherwise an in-range joint just gets a tick. Geometry is shared with the web
 * overlay (overlayGeometry.ts).
 */
import React, { useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useSelector } from 'react-redux';

import { RootState } from '@store/index';
import { PoseLandmark } from '../../types/pose';
import { colors } from '../../theme';
import {
  AngleStatus,
  JointFocus,
  buildOverlayModel,
  focusFromExercise,
} from './overlayGeometry';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PoseOverlayProps {
  landmarks?: PoseLandmark[];
  width?: number;
  height?: number;
  /** Angle values to display (camelCase or snake_case joint names). */
  angles?: Record<string, number | { angle: number }>;
  /** Show angle numbers (otherwise only arcs and a tick when in range). */
  showAngles?: boolean;
  highlightJoints?: string[];
  /** Joints and goal ranges to guide; defaults to the current exercise phase. */
  focusJoints?: JointFocus[];
}

const statusColor: Record<AngleStatus, string> = {
  good: colors.poseGood,
  adjust: colors.poseAdjust,
  neutral: colors.skeleton,
};

const LABEL_HEIGHT = 30;

const PoseOverlay: React.FC<PoseOverlayProps> = ({
  landmarks: propLandmarks,
  width,
  height,
  angles: propAngles,
  showAngles = true,
  highlightJoints = [],
  focusJoints,
}) => {
  const currentPose = useSelector((state: RootState) => state.pose.currentPose);
  const exercise = useSelector((state: RootState) => state.exercise.currentExercise);
  const phase = useSelector((state: RootState) => state.exercise.currentPhase);

  const landmarks = propLandmarks ?? currentPose?.landmarks ?? [];
  const overlayWidth = width || screenWidth;
  const overlayHeight = height || screenHeight;

  const focus = useMemo(
    () => focusJoints ?? focusFromExercise(exercise, phase),
    [focusJoints, exercise, phase]
  );

  const angleValues = useMemo(() => {
    if (!propAngles) {
      return undefined;
    }
    const values: Record<string, number> = {};
    for (const [joint, value] of Object.entries(propAngles)) {
      const deg = typeof value === 'number' ? value : value?.angle;
      if (typeof deg === 'number') {
        values[joint] = deg;
      }
    }
    return values;
  }, [propAngles]);

  const model = useMemo(
    () =>
      buildOverlayModel(landmarks, {
        width: overlayWidth,
        height: overlayHeight,
        focus,
        angleValues: showAngles ? angleValues : undefined,
        highlightJoints,
      }),
    [
      landmarks,
      overlayWidth,
      overlayHeight,
      focus,
      angleValues,
      showAngles,
      highlightJoints,
    ]
  );

  if (!propLandmarks && !currentPose) {
    return null;
  }

  return (
    <Svg
      testID="pose-overlay-svg"
      style={StyleSheet.absoluteFill}
      width={overlayWidth}
      height={overlayHeight}
      pointerEvents="none"
    >
      {/* Shadow pass, then limbs */}
      {model.segments.map((s, i) => (
        <Line
          key={`shadow-${i}`}
          x1={s.from.x}
          y1={s.from.y}
          x2={s.to.x}
          y2={s.to.y}
          stroke={colors.poseShadow}
          strokeWidth={s.focus ? 11 : 8}
          strokeLinecap="round"
          opacity={s.opacity}
        />
      ))}
      {model.segments.map((s, i) => (
        <Line
          key={`limb-${i}`}
          x1={s.from.x}
          y1={s.from.y}
          x2={s.to.x}
          y2={s.to.y}
          stroke={s.focus ? colors.skeleton : colors.poseLimb}
          strokeWidth={s.focus ? 6 : 4}
          strokeLinecap="round"
          opacity={s.opacity}
        />
      ))}

      {model.head ? (
        <Circle
          cx={model.head.at.x}
          cy={model.head.at.y}
          r={model.head.radius}
          fill="none"
          stroke={colors.poseLimb}
          strokeWidth={3}
          opacity={model.head.opacity}
        />
      ) : null}

      {/* Joints: white dots with a coloured ring */}
      {model.joints.map((j) => (
        <Circle
          key={`joint-${j.name}`}
          cx={j.at.x}
          cy={j.at.y}
          r={j.focus ? 8 : 5}
          fill="#FFFFFF"
          stroke={j.focus ? colors.skeleton : colors.poseShadow}
          strokeWidth={j.focus ? 3 : 2}
          opacity={j.opacity}
        />
      ))}

      {/* Current angle arcs and labels */}
      {model.angles.map((a) => {
        const color = statusColor[a.status];
        const text = showAngles
          ? `${Math.round(a.degrees)}°`
          : a.status === 'good'
            ? '✓'
            : null;
        const labelWidth = text && text.length > 2 ? 58 : 36;
        return (
          <G key={`angle-${a.joint}`}>
            {a.targetPath ? (
              <Path
                d={a.targetPath}
                fill="none"
                stroke={colors.poseTarget}
                strokeWidth={14}
                strokeLinecap="round"
              />
            ) : null}
            <Path
              d={a.arcPath}
              fill="none"
              stroke={colors.poseShadow}
              strokeWidth={8}
              strokeLinecap="round"
            />
            <Path
              d={a.arcPath}
              fill="none"
              stroke={color}
              strokeWidth={5}
              strokeLinecap="round"
            />
            <Circle
              cx={a.knobAt.x}
              cy={a.knobAt.y}
              r={6}
              fill={color}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            {text ? (
              <G>
                <Rect
                  x={a.labelAt.x - labelWidth / 2}
                  y={a.labelAt.y - LABEL_HEIGHT / 2}
                  width={labelWidth}
                  height={LABEL_HEIGHT}
                  rx={LABEL_HEIGHT / 2}
                  fill={colors.cameraOverlay}
                  stroke={color}
                  strokeWidth={2}
                />
                <SvgText
                  x={a.labelAt.x}
                  y={a.labelAt.y + 6}
                  fill="#FFFFFF"
                  fontSize={17}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {text}
                </SvgText>
              </G>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
};

export default PoseOverlay;
