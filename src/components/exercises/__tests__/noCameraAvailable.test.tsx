import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { NoCameraAvailable } from '../CameraUnavailable';

describe('no-camera recovery reflects available actions', () => {
  it('does not promise practice when the build has no simulator', () => {
    const back = jest.fn();
    const screen = render(<NoCameraAvailable onBack={back} />);
    expect(screen.queryByText(/practice|pretend/i)).toBeNull();
    expect(screen.queryByTestId('use-practice-mode')).toBeNull();
    expect(screen.getByText(/Camera tracking is unavailable/i)).toBeTruthy();
    fireEvent.press(screen.getByTestId('camera-help-back'));
    expect(back).toHaveBeenCalledTimes(1);
    screen.unmount();
  });
  it('describes the simulated body only when the action exists', () => {
    const practice = jest.fn();
    const back = jest.fn();
    const screen = render(
      <NoCameraAvailable
        onBack={back}
        practiceAction={{
          label: 'Practice without camera',
          onPress: practice,
          testID: 'use-practice-mode',
        }}
      />
    );
    expect(screen.getByText(/pretend body/i)).toBeTruthy();
    expect(practice).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId('use-practice-mode'));
    expect(practice).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId('camera-help-back'));
    expect(back).toHaveBeenCalledTimes(1);
    screen.unmount();
  });
});
