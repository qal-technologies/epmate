import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
        // Persist to AsyncStorage (side effect)
        AsyncStorage.setItem(`shared:${key}`, JSON.stringify(value)).catch(err =>
          console.warn('[FlowSlice] Failed to persist state', err),
        );
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
      AsyncStorage.removeItem(`shared:${action.payload}`).catch(err =>
        console.warn('[FlowSlice] Failed to remove state', err),
      );
      return value;
    },

    clearTemporary: (state, action: PayloadAction<string>) => {
      // Clear data for a specific flow when navigating away
      delete state.privateData[action.payload];
    },
  },
});

// Hydrate state from AsyncStorage on app start
export const hydrateState = () => async (dispatch: any) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const sharedKeys = keys.filter(k => k.startsWith('shared:'));

    if(sharedKeys.length > 0) {
      const pairs = await AsyncStorage.multiGet(sharedKeys);
      pairs.forEach(([key, value]) => {
        if(value) {
          const cleanKey = key.replace('shared:', '');
          try {
            dispatch(
              flowSlice.actions.setState({
                key: cleanKey,
                value: JSON.parse(value),
              }),
            );
          } catch(e) {
          // ignore parse error
          }
        }
      });
    }
  } catch(e) {
    console.warn('[FlowSlice] Failed to hydrate state', e);
  }
};

export default flowSlice;