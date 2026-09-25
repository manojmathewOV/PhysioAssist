/**
 * The circle behind RepRing, drawn with a plain <svg> for the web build
 * (react-native-svg isn't bundled for web). Same props as RingArc.tsx.
 */
import React from 'react';

import { RingArcProps, ringGeometry } from './RingArc.shared';

export type { RingArcProps };

// Raw DOM element: CSS style, not a React Native style
const arcStyle: React.CSSProperties = {
  transition: 'stroke-dashoffset 400ms ease-out, stroke 300ms',
};

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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {visible ? (
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
          style={arcStyle}
        />
      ) : null}
    </svg>
  );
};

export default RingArc;
