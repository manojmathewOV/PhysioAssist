/**
 * How the camera picture is drawn behind the pose overlay (web).
 *
 * 'focus': the room is dimmed, desaturated and softly blurred, and the person
 * (from MediaPipe's segmentation mask) is drawn at full brightness on top, so
 * the patient and the angle overlay stand out and other people or objects in
 * the room recede. Without a mask (no person found yet) the whole picture is
 * dimmed. 'natural': the camera picture as it is.
 */
export type VideoStyle = 'natural' | 'focus';

/** The room behind the patient in 'focus'. */
export const BACKGROUND_FILTER = 'grayscale(0.7) brightness(0.35) blur(8px)';
/** Softens the mask's edge so the person isn't cut out with a hard line. */
const MASK_EDGE_FILTER = 'blur(3px)';
/** Fallback dimming where canvas filters aren't supported (older Safari). */
const DIM = 'rgba(8, 14, 24, 0.62)';

type Drawable = CanvasImageSource;

export function drawCameraFrame(
  ctx: CanvasRenderingContext2D,
  image: Drawable,
  mask: Drawable | null | undefined,
  width: number,
  height: number,
  style: VideoStyle,
  scratch: () => HTMLCanvasElement
) {
  ctx.clearRect(0, 0, width, height);
  if (style === 'natural') {
    ctx.drawImage(image, 0, 0, width, height);
    return;
  }
  // (Typed as always present, but older Safari lacks canvas filters)
  const filters = typeof (ctx as { filter?: unknown }).filter === 'string';
  // The room: dimmed (and blurred where supported)
  if (filters) ctx.filter = BACKGROUND_FILTER;
  ctx.drawImage(image, 0, 0, width, height);
  if (filters) ctx.filter = 'none';
  else {
    ctx.fillStyle = DIM;
    ctx.fillRect(0, 0, width, height);
  }
  if (!mask) return;

  // The person: the frame cut out by the segmentation mask, full brightness
  const cut = scratch();
  if (cut.width !== width || cut.height !== height) {
    cut.width = width;
    cut.height = height;
  }
  const c = cut.getContext('2d');
  if (!c) return;
  c.save();
  c.clearRect(0, 0, width, height);
  if (filters) c.filter = MASK_EDGE_FILTER;
  c.drawImage(mask, 0, 0, width, height);
  if (filters) c.filter = 'none';
  c.globalCompositeOperation = 'source-in';
  c.drawImage(image, 0, 0, width, height);
  c.restore();
  ctx.drawImage(cut, 0, 0, width, height);
}
