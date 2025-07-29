import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NetworkState {
  isConnected: boolean;
  queuedActions: any[];
}

const initialState: NetworkState = {
  isConnected: true,
  queuedActions: [],
};

const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<{ isConnected: boolean }>) => {
      state.isConnected = action.payload.isConnected;
    },
    queueAction: (state, action: PayloadAction<any>) => {
      state.queuedActions.push(action.payload);
    },
    clearQueue: (state) => {
      state.queuedActions = [];
    },
  },
});

export const { setStatus, queueAction, clearQueue } = networkSlice.actions;
export default networkSlice.reducer;