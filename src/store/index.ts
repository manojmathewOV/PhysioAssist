import { persistReducer } from 'redux-persist';
import EncryptedStorage from './storage';
import { combineReducers } from 'redux';

import poseReducer from './slices/poseSlice';
import exerciseReducer from './slices/exerciseSlice';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import networkReducer from './slices/networkSlice';

/**
 * No rehydration timeout. redux-persist's default gives up after 5 s and then
 * treats the (empty) initial state as rehydrated, and its next save would
 * overwrite what is stored: a slow Keychain read (e.g. a locked phone) could
 * erase the patient's history. Waiting for storage never does that.
 */
const REHYDRATE_TIMEOUT = 0;

const rootPersistConfig = {
  key: 'root',
  storage: EncryptedStorage,
  timeout: REHYDRATE_TIMEOUT,
  whitelist: ['user', 'settings'], // Only persist user and settings (HIPAA-compliant encrypted storage)
};

// Of the exercise slice only the session history is kept across launches
const exercisePersistConfig = {
  key: 'exercise',
  storage: EncryptedStorage,
  timeout: REHYDRATE_TIMEOUT,
  whitelist: ['history'],
};

export const rootReducer = combineReducers({
  pose: poseReducer,
  exercise: persistReducer(exercisePersistConfig, exerciseReducer),
  user: userReducer,
  settings: settingsReducer,
  network: networkReducer,
});

export const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

/**
 * The app's live store is created in ./appStore (imported by App only).
 * Creating it starts persistence, which schedules redux-persist's rehydration
 * timeout; keeping that out of this module lets code and tests that need only
 * the reducers or types import them without starting it.
 */
export type RootState = ReturnType<typeof persistedReducer>;
export type { AppDispatch } from './appStore';
