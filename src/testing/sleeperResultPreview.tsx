/** Isolated visual-test entry. Never imported by the patient app or persisted. */
import React, { useState } from 'react';
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText, Screen } from '../components/ui';
import SleeperResultCard from '../components/progress/SleeperResultCard';
import { selectSleeperResult } from '../services/checks/sleeperResult';
import { exampleCheck, EXAMPLE_CONTEXT, EXAMPLE_HISTORY } from './sleeperResultFixtures';

export function ResultPreview() {
  const [scenario, setScenario] = useState('current');
  const [done, setDone] = useState(false);
  (window as any).showSleeperExample = (name: string) => {
    setScenario(name);
    setDone(false);
  };
  const current = exampleCheck();
  const context = { ...EXAMPLE_CONTEXT };
  let history = [...EXAMPLE_HISTORY];
  if (scenario === 'blocked')
    context.blockingMessage = 'Stop and check your programme before another assessment.';
  if (scenario === 'unavailable') current.angle = { state: 'unavailable' };
  if (scenario === 'moved') {
    current.angle.degrees = 50;
    current.elbow.caudalDegrees = 20;
  }
  if (scenario === 'uncertain') {
    current.elbow.caudalDegrees = 10;
    current.elbow.uncertaintyDegrees = 2;
  }
  if (scenario === 'first') history = [];
  if (scenario === 'unsaved') {
    current.saveState = 'pending';
    current.angle.degrees = 80;
  }
  if (scenario === 'changed-method') current.method.allowanceVersion = 'unregistered';
  if (scenario === 'partial-history') context.historyComplete = false;
  if (scenario === 'right') {
    current.side = 'right';
    context.side = 'right';
    history = history.map((h) => ({ ...h, side: 'right' }));
  }
  const view = selectSleeperResult(current, history, context);
  return (
    <SafeAreaProvider>
      <Screen testID="result-preview" scrollResetKey={scenario}>
        {done ? (
          <AppText testID="example-done">Example closed. No data saved.</AppText>
        ) : (
          <SleeperResultCard key={scenario} view={view} onDone={() => setDone(true)} />
        )}
      </Screen>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('SleeperResultPreview', () => ResultPreview);
AppRegistry.runApplication('SleeperResultPreview', {
  rootTag: document.getElementById('root'),
});
