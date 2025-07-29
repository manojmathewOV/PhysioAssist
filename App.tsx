import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store, persistor } from '@store/index';
import AppNavigator from '@navigation/AppNavigator';
import { initializeServices } from '@services/initializationService';
import LoadingScreen from '@screens/LoadingScreen';
import ErrorBoundary from '@components/common/ErrorBoundary';

const App: React.FC = () => {
  useEffect(() => {
    // Initialize all services on app launch
    initializeServices();
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<LoadingScreen />} persistor={persistor}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <NavigationContainer>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <AppNavigator />
              </NavigationContainer>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;