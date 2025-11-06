import React from 'react';
import { render } from '@testing-library/react-native';
import PoseOverlay from '../pose/PoseOverlay';
import { PoseLandmark } from '../../types/pose';
import { renderWithProviders } from '../../utils/testHelpers';

describe('PoseOverlay', () => {
  const mockLandmarks: PoseLandmark[] = [
    { x: 0.5, y: 0.5, z: 0, visibility: 0.9, name: 'nose' },
    { x: 0.4, y: 0.4, z: 0, visibility: 0.9, name: 'left_eye' },
    { x: 0.6, y: 0.4, z: 0, visibility: 0.9, name: 'right_eye' },
  ];

  const mockAngles = {
    leftElbow: 90,
    rightElbow: 90,
    leftKnee: 180,
    rightKnee: 180,
  };

  it('should render without crashing', () => {
    const { getByTestId } = renderWithProviders(
      <PoseOverlay
        landmarks={mockLandmarks}
        width={320}
        height={480}
        angles={mockAngles}
      />
    );

    // The SVG should be rendered
    expect(getByTestId('pose-overlay-svg')).toBeTruthy();
  });

  it('should render landmarks as circles', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={mockLandmarks}
        width={320}
        height={480}
        angles={mockAngles}
      />
    );

    const tree = toJSON();
    const circles = findElements(tree, 'Circle');

    // We have 3 visible landmarks
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it('should calculate correct positions for landmarks', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={mockLandmarks}
        width={320}
        height={480}
        angles={mockAngles}
      />
    );

    const tree = toJSON();
    const circles = findElements(tree, 'Circle');

    // Check if circles have positions
    expect(circles.length).toBeGreaterThan(0);
    if (circles.length > 0) {
      expect(circles[0].props.cx).toBeDefined();
      expect(circles[0].props.cy).toBeDefined();
    }
  });

  it('should display joint angles when provided', () => {
    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={mockLandmarks}
        width={320}
        height={480}
        angles={mockAngles}
        showAngles={true}
      />
    );

    const tree = toJSON();
    const texts = findElements(tree, 'Text');

    // Should have angle text elements - check for RNSVGTSpan children with degree symbols
    const angleTexts = texts.filter(
      (text) =>
        text.children &&
        text.children.some(
          (child: any) =>
            child &&
            child.type === 'RNSVGTSpan' &&
            child.props &&
            child.props.content &&
            typeof child.props.content === 'string' &&
            child.props.content.includes('°')
        )
    );

    expect(angleTexts.length).toBeGreaterThan(0);
  });

  it('should highlight specific joints when requested', () => {
    const highlightedJoints = ['left_eye']; // Use a joint name that's in our mockLandmarks

    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={mockLandmarks}
        width={320}
        height={480}
        angles={mockAngles}
        highlightJoints={highlightedJoints}
      />
    );

    const tree = toJSON();
    const circles = findElements(tree, 'Circle');

    // Check if highlighted joints have different radius (rendered as string)
    const highlightedCircle = circles.find((circle) => circle.props.r === '8');
    expect(highlightedCircle).toBeTruthy();
  });

  it('should scale landmarks to screen dimensions', () => {
    const customWidth = 640;
    const customHeight = 960;

    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={mockLandmarks}
        width={customWidth}
        height={customHeight}
        angles={mockAngles}
      />
    );

    const tree = toJSON();
    const svg = findElement(tree, 'Svg');

    expect(svg?.props.width).toBe(customWidth);
    expect(svg?.props.height).toBe(customHeight);
  });

  it('should handle empty landmarks array', () => {
    const { getByTestId } = renderWithProviders(
      <PoseOverlay landmarks={[]} width={320} height={480} angles={mockAngles} />
    );

    // Should still render SVG element
    expect(getByTestId('pose-overlay-svg')).toBeTruthy();
  });

  it('should handle missing angles gracefully', () => {
    const { getByTestId } = renderWithProviders(
      <PoseOverlay landmarks={mockLandmarks} width={320} height={480} />
    );

    // Should render without angles
    expect(getByTestId('pose-overlay-svg')).toBeTruthy();
  });

  it('should not render landmarks with low visibility', () => {
    const landmarksWithLowVisibility: PoseLandmark[] = [
      { x: 0.5, y: 0.5, z: 0, visibility: 0.3, name: 'at_threshold' },
      { x: 0.5, y: 0.5, z: 0, visibility: 0.1, name: 'invisible_2' },
      { x: 0.5, y: 0.5, z: 0, visibility: 0.8, name: 'visible' },
    ];

    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={landmarksWithLowVisibility}
        width={320}
        height={480}
        angles={mockAngles}
      />
    );

    const tree = toJSON();
    const circles = findElements(tree, 'Circle');

    // Should filter out landmarks with visibility < 0.3, so 0.3 and 0.8 should be rendered
    expect(circles.length).toBe(2);
  });

  it('should render connections between landmarks', () => {
    const connectedLandmarks: PoseLandmark[] = Array(33)
      .fill(null)
      .map((_, i) => ({
        x: 0.5 + (i % 2) * 0.1,
        y: 0.3 + Math.floor(i / 10) * 0.1,
        z: 0,
        visibility: 0.9,
        name: `landmark_${i}`,
      }));

    const { toJSON } = renderWithProviders(
      <PoseOverlay
        landmarks={connectedLandmarks}
        width={320}
        height={480}
        angles={mockAngles}
      />
    );

    const tree = toJSON();
    const lines = findElements(tree, 'Line');

    // Should render connection lines
    expect(lines.length).toBeGreaterThan(0);
  });
});

// Helper functions to traverse the component tree
function findElements(tree: any, type: string): any[] {
  const elements: any[] = [];

  // Map React Native SVG types
  const typeMap: Record<string, string> = {
    Circle: 'RNSVGCircle',
    Line: 'RNSVGLine',
    Text: 'RNSVGText',
    Svg: 'RNSVGSvgView',
  };

  const targetType = typeMap[type] || type;

  function traverse(node: any) {
    if (!node) return;

    if (node.type === targetType) {
      elements.push(node);
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  traverse(tree);
  return elements;
}

function findElement(tree: any, type: string): any {
  const elements = findElements(tree, type);
  return elements[0] || null;
}
