/**
 * The 'focus' camera picture: the room dimmed (and blurred where the browser
 * can), the person cut out by the segmentation mask on top at full brightness.
 */
import { BACKGROUND_FILTER, drawCameraFrame } from '../focusFrame';

/** A 2D context that records what was drawn and with which settings. */
const recorder = (supportsFilter = true) => {
  const calls: string[] = [];
  const ctx: Record<string, unknown> = {
    clearRect: () => calls.push('clear'),
    drawImage: (img: { id: string }) =>
      calls.push(
        `draw ${img.id} filter=${ctx.filter ?? '-'} op=${ctx.globalCompositeOperation}`
      ),
    fillRect: () => calls.push(`fill ${ctx.fillStyle}`),
    save: () => undefined,
    restore: () => undefined,
    globalCompositeOperation: 'source-over',
  };
  if (supportsFilter) ctx.filter = 'none';
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
};

const image = { id: 'frame' } as unknown as CanvasImageSource;
const mask = { id: 'mask' } as unknown as CanvasImageSource;

const scratchOf = (ctx: CanvasRenderingContext2D) => () =>
  ({
    id: 'cut',
    width: 0,
    height: 0,
    getContext: () => ctx,
  }) as unknown as HTMLCanvasElement;

describe('camera picture', () => {
  it('natural: the frame as it is', () => {
    const { ctx, calls } = recorder();
    drawCameraFrame(ctx, image, mask, 100, 100, 'natural', scratchOf(recorder().ctx));
    expect(calls).toEqual(['clear', 'draw frame filter=none op=source-over']);
  });

  it('focus: the room dimmed, then the person cut out by the mask at full brightness', () => {
    const main = recorder();
    const cut = recorder();
    drawCameraFrame(main.ctx, image, mask, 100, 100, 'focus', scratchOf(cut.ctx));
    expect(main.calls).toEqual([
      'clear',
      `draw frame filter=${BACKGROUND_FILTER} op=source-over`,
      'draw cut filter=none op=source-over',
    ]);
    // The mask (soft-edged), then the frame kept only where the mask is
    expect(cut.calls).toEqual([
      'clear',
      'draw mask filter=blur(3px) op=source-over',
      'draw frame filter=none op=source-in',
    ]);
  });

  it('focus without a person found: the whole picture is dimmed', () => {
    const { ctx, calls } = recorder();
    drawCameraFrame(ctx, image, null, 100, 100, 'focus', scratchOf(recorder().ctx));
    expect(calls).toEqual([
      'clear',
      `draw frame filter=${BACKGROUND_FILTER} op=source-over`,
    ]);
  });

  it('where canvas filters are missing, the room is dimmed with a dark layer instead', () => {
    const { ctx, calls } = recorder(false);
    drawCameraFrame(ctx, image, null, 100, 100, 'focus', scratchOf(recorder(false).ctx));
    expect(calls[1]).toBe('draw frame filter=- op=source-over');
    expect(calls[2]).toMatch(/^fill rgba/);
  });
});
