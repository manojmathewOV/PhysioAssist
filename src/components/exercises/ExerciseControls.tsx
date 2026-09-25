import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Vibration } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  startExercise,
  stopExercise,
  clearExercise,
} from '../../store/slices/exerciseSlice';
import { RootState } from '../../store';
import { AccessibilityIds } from '../../constants/accessibility';
import { EXERCISES } from '../../constants/exercises';
import { exerciseValidationService } from '../../services/exerciseValidationService';

/** Form scores below this threshold are shown as "Poor" and trigger a haptic cue. */
const POOR_FORM_THRESHOLD = 0.6;
const FORM_FEEDBACK_VIBRATION_MS = 150;

interface ExerciseControlsProps {
  isActive?: boolean;
  onStart?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onReset?: () => void;
}

const ExerciseControls: React.FC<ExerciseControlsProps> = ({
  isActive: propIsActive,
  onStart: propOnStart,
  onStop: propOnStop,
  onPause: propOnPause,
  onReset: propOnReset,
}) => {
  const dispatch = useDispatch();
  const { isExercising, repetitionCount, formScore, currentPhase, feedback } =
    useSelector((state: RootState) => state.exercise);
  const enableHaptics = useSelector(
    (state: RootState) => state.settings.enableHaptics !== false
  );

  // Use props if provided, otherwise use Redux state
  const isActive = propIsActive !== undefined ? propIsActive : isExercising;

  // Haptic cue when a new form correction arrives while form is poor, so the
  // user notices it without having to look at the screen mid-exercise.
  const lastFeedbackRef = useRef(feedback);
  useEffect(() => {
    const isNewFeedback = !!feedback && feedback !== lastFeedbackRef.current;
    lastFeedbackRef.current = feedback;
    if (isActive && isNewFeedback && formScore < POOR_FORM_THRESHOLD && enableHaptics) {
      Vibration.vibrate(FORM_FEEDBACK_VIBRATION_MS);
    }
  }, [feedback, formScore, isActive, enableHaptics]);

  const handleSelectBicepCurl = () => {
    const exercise = EXERCISES.bicepCurl;
    dispatch(startExercise(exercise));
    exerciseValidationService.startExercise(exercise);
  };

  const handleStart = () => {
    if (propOnStart) {
      propOnStart();
    } else {
      // Default Redux behavior
      dispatch(startExercise({ id: 'default', name: 'Default Exercise' } as any));
    }
  };

  const handleStop = () => {
    if (propOnStop) {
      propOnStop();
    } else {
      dispatch(stopExercise());
    }
  };

  const handlePause = () => {
    if (propOnPause) {
      propOnPause();
    } else {
      dispatch(stopExercise());
    }
  };

  const handleReset = () => {
    if (propOnReset) {
      propOnReset();
    } else {
      dispatch(clearExercise());
    }
  };

  return (
    <View style={styles.container}>
      {/* Exercise selection buttons */}
      <View
        style={styles.exerciseButtons}
        accessible={true}
        accessibilityLabel="Select exercise type"
        accessibilityRole="menu"
      >
        <TouchableOpacity
          style={[styles.exerciseButton, styles.bicepCurlButton]}
          onPress={handleSelectBicepCurl}
          testID={AccessibilityIds.exercise.bicepCurlOption}
          accessible={true}
          accessibilityLabel="Bicep Curl Exercise"
          accessibilityRole="button"
        >
          <Text style={styles.exerciseButtonText}>Bicep Curl</Text>
        </TouchableOpacity>
      </View>

      {/* Rep counter and form quality indicators */}
      {isActive && (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Reps:</Text>
              <Text
                style={styles.statValue}
                testID={AccessibilityIds.exercise.repCounter}
              >
                {repetitionCount}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Phase:</Text>
              <Text style={styles.statValue} testID="exercise-phase-indicator">
                {currentPhase}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Form:</Text>
              <Text
                style={[styles.statValue, styles.formQuality]}
                testID={AccessibilityIds.exercise.formQuality}
              >
                {formScore >= 0.8
                  ? 'Excellent'
                  : formScore >= POOR_FORM_THRESHOLD
                    ? 'Good'
                    : 'Poor'}
              </Text>
            </View>
          </View>
          {feedback ? (
            <View style={styles.feedbackContainer}>
              <Text
                style={styles.feedbackText}
                testID={AccessibilityIds.exercise.feedbackText}
              >
                {feedback}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* Control buttons */}
      <View style={styles.controlButtons}>
        {!isActive ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={handleStart}
            testID={AccessibilityIds.exercise.startExerciseButton}
            accessible={true}
            accessibilityLabel="Start exercise"
            accessibilityRole="button"
            accessibilityHint="Double tap to start exercise"
          >
            <Text style={styles.buttonText}>Start Exercise</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.pauseButton]}
              onPress={handlePause}
              testID={AccessibilityIds.exercise.pauseExerciseButton}
              accessible={true}
              accessibilityLabel="Pause exercise"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStop}
              testID={AccessibilityIds.exercise.endExerciseButton}
              accessible={true}
              accessibilityLabel="End exercise"
              accessibilityRole="button"
            >
              <Text style={styles.buttonText}>End</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={handleReset}
          testID="reset-button"
          accessible={true}
          accessibilityLabel="Reset exercise"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
  },
  exerciseButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  exerciseButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#2196F3',
  },
  bicepCurlButton: {
    backgroundColor: '#4CAF50',
  },
  exerciseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formQuality: {
    color: '#4CAF50',
  },
  feedbackContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.8)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
