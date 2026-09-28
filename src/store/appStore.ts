/**
 * The app's store: persisted state (encrypted storage on iOS/Android) that is
 * rehydrated at launch. Only App imports this; see ./index for the reducers.
 */
import { configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistStore,
} from 'redux-persist';

import { persistedReducer, historyPersistence } from './index';
import { historyWriteResult } from './slices/exerciseSlice';

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE],
      },
    }),
});

// Installed once for this live store; reducer-only imports do not create observers.
historyPersistence.subscribe((event) => store.dispatch(historyWriteResult(event)));
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
