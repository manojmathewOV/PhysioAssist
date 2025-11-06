import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const NetworkStatusBar: React.FC = () => {
  const isConnected = useSelector(
    (state: RootState) => state.network?.isConnected ?? true
  );

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container} testID="offline-indicator">
      <Text style={styles.text} testID="offline-message">
        You are offline
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ff4444',
    padding: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default NetworkStatusBar;
