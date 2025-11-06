import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { store } from './store/store';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/common/ErrorBoundary';
import NetworkStatusBar from './components/common/NetworkStatusBar';

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <SafeAreaView style={styles.container}>
          <NavigationContainer>
            <NetworkStatusBar />
            <RootNavigator />
          </NavigationContainer>
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
