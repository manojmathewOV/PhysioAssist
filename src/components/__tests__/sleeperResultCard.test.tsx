import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import SleeperResultCard from '../progress/SleeperResultCard';
import { selectSleeperResult } from '../../services/checks/sleeperResult';
import {
  exampleCheck,
  EXAMPLE_CONTEXT,
  EXAMPLE_HISTORY,
} from '../../testing/sleeperResultFixtures';
const view = () => selectSleeperResult(exampleCheck(), EXAMPLE_HISTORY, EXAMPLE_CONTEXT);
it('shows one current approximate value, paired diagram and passive comparisons', () => {
  const done = jest.fn();
  const ui = render(<SleeperResultCard view={view()} onDone={done} />);
  expect(ui.getByTestId('sleeper-current')).toHaveTextContent('About 42°');
  expect(ui.getByTestId('sleeper-schematic')).toHaveProp(
    'accessibilityLabel',
    expect.stringContaining('left forearm')
  );
  expect(ui.getByTestId('sleeper-schematic')).toHaveProp(
    'accessibilityLabel',
    expect.stringContaining('About 42°')
  );
  expect(ui.getByTestId('sleeper-previous')).toHaveProp(
    'accessibilityLabel',
    expect.stringContaining('About 38°')
  );
  expect(ui.getByTestId('sleeper-best')).toHaveProp(
    'accessibilityLabel',
    expect.stringContaining('About 45°')
  );
  expect(ui.queryByText(/New personal best|Try harder|Go further|Perfect/)).toBeNull();
  fireEvent.press(ui.getByTestId('sleeper-done'));
  expect(done).toHaveBeenCalledTimes(1);
});
it('excluded-but-valid angle stays secondary and does not alter best', () => {
  const r = exampleCheck('current', 50);
  r.elbow.caudalDegrees = 20;
  const ui = render(
    <SleeperResultCard view={selectSleeperResult(r, EXAMPLE_HISTORY, EXAMPLE_CONTEXT)} />
  );
  expect(ui.queryByTestId('sleeper-current')).toBeNull();
  expect(ui.getByTestId('sleeper-excluded')).toHaveTextContent('About 50°');
  expect(ui.getByText('Not used for comparison: elbow moved.')).toBeTruthy();
});
it('unavailable is no number/false pose, even with valid historical values', () => {
  const r = exampleCheck();
  r.angle = { state: 'unavailable' };
  const ui = render(
    <SleeperResultCard view={selectSleeperResult(r, EXAMPLE_HISTORY, EXAMPLE_CONTEXT)} />
  );
  expect(ui.queryByTestId('sleeper-current')).toBeNull();
  expect(ui.queryByTestId('sleeper-schematic')).toBeNull();
  expect(ui.getByTestId('sleeper-previous')).toBeTruthy();
});
it('keeps the approximate qualifier and explanation reachable without gestures', () => {
  const ui = render(<SleeperResultCard view={view()} />);
  expect(ui.queryByTestId('sleeper-explanation')).toBeNull();
  fireEvent.press(ui.getByTestId('sleeper-details'));
  expect(ui.getByTestId('sleeper-explanation')).toHaveTextContent('not a target');
  fireEvent.press(ui.getByTestId('sleeper-details'));
  expect(ui.queryByTestId('sleeper-explanation')).toBeNull();
});
it('first Check avoids duplicated history and acknowledges unsaved status separately', () => {
  const r = exampleCheck();
  const ui = render(
    <SleeperResultCard view={selectSleeperResult(r, [], EXAMPLE_CONTEXT)} />
  );
  expect(ui.getByText('First comparable check')).toBeTruthy();
  expect(ui.queryByTestId('sleeper-best')).toBeNull();
  r.saveState = 'pending';
  ui.rerender(<SleeperResultCard view={selectSleeperResult(r, [], EXAMPLE_CONTEXT)} />);
  expect(ui.getByTestId('sleeper-save-state')).toHaveTextContent('not recorded yet');
});
it('does not keep an open numerical explanation after the result is unavailable', () => {
  const ui = render(<SleeperResultCard view={view()} />);
  fireEvent.press(ui.getByTestId('sleeper-details'));
  const r = exampleCheck();
  r.angle = { state: 'unavailable' };
  ui.rerender(<SleeperResultCard view={selectSleeperResult(r, [], EXAMPLE_CONTEXT)} />);
  expect(ui.queryByTestId('sleeper-explanation')).toBeNull();
});
