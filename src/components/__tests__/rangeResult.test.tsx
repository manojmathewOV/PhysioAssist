/**
 * The range card reads the right way round for straightening exercises
 * (smaller is better, 0° = straight).
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import RangeResult from '../exercises/RangeResult';

describe('RangeResult', () => {
  it('praises reaching the goal when raising (bigger is better)', () => {
    const { getByText } = render(
      <RangeResult joint="left_shoulder" bestDegrees={125} goalDegrees={120} />
    );
    expect(getByText('You reached your goal of 120°.')).toBeTruthy();
  });

  it('praises straightening to within the goal (smaller is better)', () => {
    const { getByText } = render(
      <RangeResult
        joint="left_knee"
        bestDegrees={8}
        goalDegrees={10}
        direction="toward"
      />
    );
    expect(getByText('You straightened to within your goal of 10°.')).toBeTruthy();
  });

  it('says how far short of straightening to the goal', () => {
    const { getByText } = render(
      <RangeResult
        joint="left_knee"
        bestDegrees={25}
        goalDegrees={10}
        direction="toward"
      />
    );
    expect(getByText(/^15° short of your goal \(10°\)/)).toBeTruthy();
  });

  it('explains 0° without a goal', () => {
    const { getByText } = render(
      <RangeResult joint="left_knee" bestDegrees={6} direction="toward" />
    );
    expect(getByText('Closest to straight today (0° is fully straight).')).toBeTruthy();
  });
});
