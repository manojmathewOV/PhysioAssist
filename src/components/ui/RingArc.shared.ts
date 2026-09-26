/** Geometry shared by RingArc.tsx (native) and RingArc.web.tsx. */
export interface RingArcProps {
  size: number;
  strokeWidth: number;
  /** 0-1. */
  progress: number;
  color: string;
  trackColor: string;
}

export const ringGeometry = (size: number, strokeWidth: number, progress: number) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));
  return {
    radius,
    center: size / 2,
    circumference,
    dashOffset: circumference * (1 - clamped),
    // A zero-length arc with round caps still draws a dot, so hide it at 0
    visible: clamped > 0,
  };
};
