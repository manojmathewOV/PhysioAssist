import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import EncryptedStorage from 'react-native-encrypted-storage';
import { combineReducers } from 'redux';

import poseReducer from './slices/poseSlice';
import exerciseReducer from './slices/exerciseSlice';
import userReducer from './slices/userSlice';
import settingsReducer from './slices/settingsSlice';
import networkReducer from './slices/networkSlice';

const rootPersistConfig = {
  key: 'root',
  storage: EncryptedStorage,
  whitelist: ['user', 'settings'], // Only persist user and settings (HIPAA-compliant encrypted storage)
};

export const rootReducer = combineReducers({
  pose: poseReducer,
  exercise: exerciseReducer,
  user: userReducer,
  settings: settingsReducer,
  network: networkReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
