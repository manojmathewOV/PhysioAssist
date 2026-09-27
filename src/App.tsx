import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store, persistor } from './store/appStore';
import { persistenceRecovery } from './store';
import StorageRestoreBoundary from './components/common/StorageRestoreBoundary';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatusBar from './components/common/NetworkStatusBar';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <StorageRestoreBoundary recovery={persistenceRecovery} persistor={persistor}>
            <NavigationContainer>
              <NetworkStatusBar />
              <RootNavigator />
            </NavigationContainer>
          </StorageRestoreBoundary>
        </SafeAreaView>
      </ErrorBoundary>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default App;
