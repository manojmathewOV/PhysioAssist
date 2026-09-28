/** Dedicated simulator-only bundle entry. Not reachable from the patient app.
 * No store, pose provider, permission request or measurement activation. */
import React, { useState } from 'react';
import { AppRegistry } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppText, Screen } from '../components/ui';
import SleeperResultCard from '../components/progress/SleeperResultCard';
import { selectSleeperResult } from '../services/checks/sleeperResult';
import { exampleCheck, EXAMPLE_CONTEXT, EXAMPLE_HISTORY } from './sleeperResultFixtures';

function NativeResultPreview() {
  const [done, setDone] = useState(false);
  const result = selectSleeperResult(exampleCheck(), EXAMPLE_HISTORY, EXAMPLE_CONTEXT);
  return (
    <SafeAreaProvider>
      <Screen title="Example Check" testID="native-result-preview">
        {done ? (
          <AppText testID="example-done">Example closed. No data saved.</AppText>
        ) : (
          <SleeperResultCard view={result} onDone={() => setDone(true)} />
        )}
      </Screen>
    </SafeAreaProvider>
  );
}
AppRegistry.registerComponent('PhysioAssist', () => NativeResultPreview);
