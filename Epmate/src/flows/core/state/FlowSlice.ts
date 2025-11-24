import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'flow-session-storage' });

interface FlowState {
  sharedData: Record<string, any>;
  privateData: Record<string, Record<string, any>>; // flowName -> data
  categories: Record<string, Record<string, any>>;
  secureData: Record<string, { value: any; key: string }>;
}

const flowSlice = createSlice({
  name: 'flow',
  initialState: {
    sharedData: {},
    privateData: {},
    categories: {},
    secureData: {},
  } as FlowState,
  reducers: {
    setState: (
      state,
      action: PayloadAction<{ key: string; value: any; shared?: boolean }>,
    ) => {
      const { key, value, shared = true } = action.payload;
      if (shared) {
        state.sharedData[key] = value;
        storage.set(`shared:${key}`, JSON.stringify(value)); // Persist to MMKV
      }
    },

    setPrivateState: (
      state,
      action: PayloadAction<{ flow: string; key: string; value: any }>,
    ) => {
      const { flow, key, value } = action.payload;
      if (!state.privateData[flow]) state.privateData[flow] = {};
      state.privateData[flow][key] = value;
    },

    setCategoryState: (
      state,
      action: PayloadAction<{
        category: string;
        key: string;
        value: any;
        secure?: string;
      }>,
    ) => {
      const { category, key, value, secure } = action.payload;
      if (!state.categories[category]) state.categories[category] = {};

      if (secure) {
        const secureKey = `${category}:${key}`;
        state.secureData[secureKey] = { value, key: secure };
      } else {
        state.categories[category][key] = value;
      }
    },

    getCategoryState: (
      state,
      action: PayloadAction<{ category: string; key: string; secure?: string }>,
    ) => {
      // Returns via selector pattern
    },

    takeState: (state, action: PayloadAction<string>) => {
      const value = state.sharedData[action.payload];
      delete state.sharedData[action.payload];
      storage.delete(`shared:${action.payload}`);
      return value;
    },

    clearTemporary: (state, action: PayloadAction<string>) => {
      // Clear data for a specific flow when navigating away
      delete state.privateData[action.payload];
    },
  },
});

// Hydrate state from MMKV on app start
export const hydrateState = () => (dispatch: any) => {
  const keys = storage.getAllKeys();
  keys.forEach(key => {
    if (key.startsWith('shared:')) {
      const value = storage.getString(key);
      if (value) {
        const cleanKey = key.replace('shared:', '');
        dispatch(
          flowSlice.actions.setState({
            key: cleanKey,
            value: JSON.parse(value),
          }),
        );
      }
    }
  });
};

export default flowSlice;