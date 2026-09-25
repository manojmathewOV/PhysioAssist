import React from 'react';
import PoseOverlay from '../pose/PoseOverlay';
import { PoseLandmark } from '../../types/pose';
import { renderWithProviders } from '../../utils/testHelpers';
import {
  angleStatus,
  buildOverlayModel,
  focusFromExercise,
  toJointKey,
} from '../pose/overlayGeometry';
import { EXERCISES } from '../../constants/exercises';

const NAMES: Record<number, string> = {
  0: 'nose',
  11: 'left_shoulder',
  12: 'right_shoulder',
  13: 'left_elbow',
  14: 'right_elbow',
  15: 'left_wrist',
  16: 'right_wrist',
  23: 'left_hip',
  24: 'right_hip',
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle',
};

/** A standing person with the left elbow bent to 90°. */
const standing = (visibility = 0.95): PoseLandmark[] => {
  const at: Record<number, [number, number]> = {
    0: [0.5, 0.15],
    11: [0.4, 0.3],
    12: [0.6, 0.3],
    13: [0.4, 0.45],
    14: [0.6, 0.45],
    15: [0.3, 0.45], // left forearm horizontal: 90° elbow
    16: [0.6, 0.6],
    23: [0.42, 0.6],
    24: [0.58, 0.6],
    25: [0.42, 0.75],
    26: [0.58, 0.75],
    27: [0.42, 0.9],
    28: [0.58, 0.9],
  };
  return Array.from({ length: 33 }, (_, index) => ({
    x: at[index]?.[0] ?? 0.5,
    y: at[index]?.[1] ?? 0.5,
    z: 0,
    visibility: at[index] ? visibility : 0.1,
    index,
    name: NAMES[index] ?? `landmark_${index}`,
  }));
};

type Node = { type: string; props: Record<string, unknown>; children?: Node[] | null };
const find = (node: Node | Node[] | null, type: string, out: Node[] = []): Node[] => {
  if (!node) return out;
  if (Array.isArray(node)) {
    node.forEach((n) => find(n, type, out));
    return out;
  }
  if (typeof node === 'object') {
    if (node.type === type) out.push(node);
    node.children?.forEach((c) => find(c, type, out));
  }
  return out;
};
const texts = (tree: Node | Node[] | null) =>
  find(tree, 'RNSVGTSpan').map((n) => String(n.props.content));

describe('PoseOverlay', () => {
  it('renders the simplified body: limbs with a shadow pass, joints and a head ring', () => {
    const { getByTestId, toJSON } = renderWithProviders(
      <PoseOverlay landmarks={standing()} width={400} height={800} />
    );
    expect(getByTestId('pose-overlay-svg')).toBeTruthy();
    const tree = toJSON() as Node;
    // 12 body bones drawn twice (shadow + colour)
    expect(find(tree, 'RNSVGLine').length).toBe(24);
    // 12 body joints + head ring; no face or finger dots
    expect(find(tree, 'RNSVGCircle').length).toBe(13);
  });

  it('hides landmarks the model is unsure about', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay landmarks={standing(0.2)} width={400} height={800} />
    );
    expect(find(toJSON() as Node, 'RNSVGLine').length).toBe(0);
  });

  it('shows the angle number for a focused joint when numbers are on', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={standing()}
        width={400}
        height={800}
        showAngles
        focusJoints={[{ joint: 'left_elbow', min: 80, max: 100 }]}
      />
    );
    expect(texts(toJSON() as Node)).toContain('90°');
  });

  it('shows only a tick (no number) for an in-range joint when numbers are off', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={standing()}
        width={400}
        height={800}
        showAngles={false}
        focusJoints={[{ joint: 'left_elbow', min: 80, max: 100 }]}
      />
    );
    const labels = texts(toJSON() as Node);
    expect(labels).toContain('✓');
    expect(labels.some((t) => t.includes('°'))).toBe(false);
  });

  it('uses provided angle values when given', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={standing()}
        width={400}
        height={800}
        showAngles
        angles={{ leftKnee: 123 }}
      />
    );
    expect(texts(toJSON() as Node)).toContain('123°');
  });

  it('uses the given size', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay landmarks={standing()} width={640} height={960} />
    );
    const svg = find(toJSON() as Node, 'RNSVGSvgView')[0] ?? (toJSON() as Node);
    expect(JSON.stringify(svg.props)).toContain('640');
  });

  it('renders an empty overlay for no landmarks', () => {
    const { getByTestId } = renderWithProviders(
      <PoseOverlay landmarks={[]} width={320} height={480} />
    );
    expect(getByTestId('pose-overlay-svg')).toBeTruthy();
  });
});

describe('overlay geometry', () => {
  it('measures angles in pixel space and classifies them against the goal range', () => {
    const model = buildOverlayModel(standing(), {
      width: 400,
      height: 800,
      focus: [{ joint: 'left_elbow', min: 80, max: 100 }],
    });
    const elbow = model.angles.find((a) => a.joint === 'left_elbow')!;
    // 0.1 of width (40px) vs 0.15 of height (120px) legs of the bend: still a right angle
    expect(elbow.degrees).toBeCloseTo(90, 0);
    expect(elbow.status).toBe('good');
    expect(elbow.targetPath).toMatch(/^M /);
    expect(model.segments.filter((s) => s.focus).length).toBe(2);
  });

  it('keeps labels on screen', () => {
    const edge = standing().map((lm) => ({ ...lm, x: lm.x - 0.28 }));
    const model = buildOverlayModel(edge, {
      width: 400,
      height: 800,
      focus: [{ joint: 'left_elbow', min: 80, max: 100 }],
    });
    model.angles.forEach((a) => expect(a.labelAt.x).toBeGreaterThanOrEqual(33));
  });

  it('classifies angle status', () => {
    expect(angleStatus(95, { joint: 'x', min: 80, max: 100 })).toBe('good');
    expect(angleStatus(120, { joint: 'x', min: 80, max: 100 })).toBe('adjust');
    expect(angleStatus(120)).toBe('neutral');
  });

  it('derives goal ranges from the current exercise phase', () => {
    const focus = focusFromExercise(EXERCISES.bicepCurl, 'curl');
    expect(focus.length).toBeGreaterThan(0);
    expect(focus[0].joint).toBe(toJointKey(focus[0].joint));
    expect(focus[0].min).toBeLessThan(focus[0].max!);
  });
});
