/**
 * The circle behind RepRing (native, react-native-svg). The web build uses
 * RingArc.web.tsx, which draws the same circle with a plain <svg>.
 */
import React from 'react';
import Svg, { Circle } from 'react-native-svg';

import { RingArcProps, ringGeometry } from './RingArc.shared';

export type { RingArcProps };

const RingArc: React.FC<RingArcProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  trackColor,
}) => {
  const { radius, center, circumference, dashOffset, visible } = ringGeometry(
    size,
    strokeWidth,
    progress
  );
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {visible ? (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          // Start at 12 o'clock and fill clockwise
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      ) : null}
    </Svg>
  );
};

export default RingArc;
