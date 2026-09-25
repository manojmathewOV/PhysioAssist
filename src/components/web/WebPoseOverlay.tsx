/**
 * Web (canvas) version of the pose overlay. Draws the same model as the native
 * SVG overlay (components/pose/overlayGeometry.ts) so both platforms look alike:
 * shadowed limbs, highlighted exercise limbs, goal-range wedges and angle arcs.
 */
import { PoseLandmark } from '../../types/pose';
import { colors } from '../../theme';
import { AngleStatus, JointFocus, buildOverlayModel } from '../pose/overlayGeometry';

export interface WebOverlayOptions {
  /** Joints and goal ranges to guide (e.g. from focusFromExercise). */
  focus?: JointFocus[];
  /** Show angle numbers; otherwise only arcs and a tick when in range. */
  showAngles?: boolean;
}

const statusColor: Record<AngleStatus, string> = {
  good: colors.poseGood,
  adjust: colors.poseAdjust,
  neutral: colors.skeleton,
};

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const WebPoseOverlay = {
  drawPose(
    canvas: HTMLCanvasElement,
    landmarks: PoseLandmark[],
    angles: { [key: string]: number },
    width: number,
    height: number,
    { focus = [], showAngles = false }: WebOverlayOptions = {}
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crisp lines on high-DPI screens
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const model = buildOverlayModel(landmarks, {
      width,
      height,
      focus,
      angleValues: showAngles ? angles : undefined,
    });

    // Limbs: shadow pass, then colour
    for (const pass of ['shadow', 'limb'] as const) {
      for (const s of model.segments) {
        ctx.globalAlpha = s.opacity;
        ctx.strokeStyle =
          pass === 'shadow'
            ? colors.poseShadow
            : s.focus
              ? colors.skeleton
              : colors.poseLimb;
        ctx.lineWidth = pass === 'shadow' ? (s.focus ? 11 : 8) : s.focus ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(s.from.x, s.from.y);
        ctx.lineTo(s.to.x, s.to.y);
        ctx.stroke();
      }
    }

    if (model.head) {
      ctx.globalAlpha = model.head.opacity;
      ctx.strokeStyle = colors.poseLimb;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(model.head.at.x, model.head.at.y, model.head.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Joints
    for (const j of model.joints) {
      ctx.globalAlpha = j.opacity;
      ctx.beginPath();
      ctx.arc(j.at.x, j.at.y, j.focus ? 8 : 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = j.focus ? 3 : 2;
      ctx.strokeStyle = j.focus ? colors.skeleton : colors.poseShadow;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Angle arcs and labels
    for (const a of model.angles) {
      const color = statusColor[a.status];
      if (a.targetPath) {
        ctx.strokeStyle = colors.poseTarget;
        ctx.lineWidth = 14;
        ctx.stroke(new Path2D(a.targetPath));
      }
      const arc = new Path2D(a.arcPath);
      ctx.strokeStyle = colors.poseShadow;
      ctx.lineWidth = 8;
      ctx.stroke(arc);
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.stroke(arc);
      ctx.beginPath();
      ctx.arc(a.knobAt.x, a.knobAt.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      const text = showAngles
        ? `${Math.round(a.degrees)}°`
        : a.status === 'good'
          ? '✓'
          : null;
      if (!text) continue;
      const w = text.length > 2 ? 58 : 36;
      const h = 30;
      roundRect(ctx, a.labelAt.x - w / 2, a.labelAt.y - h / 2, w, h, h / 2);
      ctx.fillStyle = colors.cameraOverlay;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font =
        '700 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, a.labelAt.x, a.labelAt.y + 1);
    }
  },
};

export default WebPoseOverlay;
