import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface ExerciseControlsProps {
  isActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onReset: () => void;
}

const ExerciseControls: React.FC<ExerciseControlsProps> = ({
  isActive,
  onStart,
  onStop,
  onPause,
  onReset,
}) => {
  return (
    <View style={styles.container}>
      {!isActive ? (
        <TouchableOpacity 
          style={[styles.button, styles.startButton]} 
          onPress={onStart}
          testID="start-button"
        >
          <Text style={styles.buttonText}>Start Exercise</Text>
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.button, styles.pauseButton]} 
            onPress={onPause}
            testID="pause-button"
          >
            <Text style={styles.buttonText}>Pause</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.stopButton]} 
            onPress={onStop}
            testID="stop-button"
          >
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity 
        style={[styles.button, styles.resetButton]} 
        onPress={onReset}
        testID="reset-button"
      >
        <Text style={styles.buttonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FF9800',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  resetButton: {
    backgroundColor: '#607D8B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExerciseControls;