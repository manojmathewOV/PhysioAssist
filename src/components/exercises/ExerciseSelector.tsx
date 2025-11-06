import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

interface Exercise {
  id: string;
  name: string;
  description: string;
}

interface ExerciseSelectorProps {
  exercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExercise?: Exercise;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  exercises,
  onExerciseSelect,
  selectedExercise,
}) => {
  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity
      style={[
        styles.exerciseItem,
        selectedExercise?.id === item.id && styles.selectedItem,
      ]}
      onPress={() => onExerciseSelect(item)}
      testID={`exercise-${item.id}`}
    >
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} testID="exercise-selector">
      <Text style={styles.title}>Select Exercise</Text>
      <FlatList
        data={exercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  exerciseItem: {
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default ExerciseSelector;
