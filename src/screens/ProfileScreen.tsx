import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { queueAction } from '../store/slices/networkSlice';

const ProfileScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const dispatch = useDispatch();
  const isConnected = useSelector((state: RootState) => state.network.isConnected);

  const handleSave = () => {
    if (!isConnected) {
      setShowOfflineMessage(true);
      // Queue the save action for when back online
      dispatch(
        queueAction({
          type: 'profile/save',
          payload: { name },
        })
      );
      setTimeout(() => setShowOfflineMessage(false), 3000);
    } else {
      setShowOfflineMessage(false);
      // Save profile logic here
    }
  };

  return (
    <View style={styles.container} testID="profile-screen">
      <Text style={styles.title}>Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        testID="profile-name-input"
      />

      {showOfflineMessage && (
        <View style={styles.offlineMessage} testID="offline-queue-message">
          <Text style={styles.offlineText}>
            No internet connection. Changes will be saved when you're back online.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        testID="profile-save"
      >
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineMessage: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFE69C',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  offlineText: {
    color: '#856404',
    fontSize: 14,
  },
});

export default ProfileScreen;
