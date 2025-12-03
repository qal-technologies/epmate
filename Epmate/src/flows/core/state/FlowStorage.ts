import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerStorageAdapter, PersistAdapter } from './FlowState';

let asyncAdapter: PersistAdapter;

// Defensive check for AsyncStorage availability
if (AsyncStorage) {
  asyncAdapter = {
    getItem: async (key: string) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e) {
        console.warn('[FlowStorage] getItem failed', e);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (e) {
        console.warn('[FlowStorage] setItem failed', e);
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        console.warn('[FlowStorage] removeItem failed', e);
      }
    },
  };
} else {
  console.warn('[FlowStorage] AsyncStorage is not available. Falling back to in-memory storage.');
  const memoryStore = new Map<string, string>();
  asyncAdapter = {
    getItem: async (key: string) => memoryStore.get(key) || null,
    setItem: async (key: string, value: string) => { memoryStore.set(key, value); },
    removeItem: async (key: string) => { memoryStore.delete(key); },
  };
}

// Register the adapter immediately
try {
  registerStorageAdapter(asyncAdapter);
} catch (e) {
  console.warn('[FlowStorage] Failed to register storage adapter', e);
}

export const FlowStorage = {
  adapter: asyncAdapter,
  
  clearAll: async () => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.clear();
      }
    } catch (e) {
      console.warn('[FlowStorage] clearAll failed', e);
    }
  },

  /**
   * Loads the state for a given scope.
   * @param scope The flow scope ID.
   * @returns The parsed state object or null if not found.
   */
  load: async (scope: string): Promise<Record<string, any> | null> => {
    const key = `flow:${scope}`;
    try {
      const json = await asyncAdapter.getItem(key);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      if (__DEV__)
        console.error(
          `[FlowStorage] Failed to parse state for scope ${scope}`,
          e,
        );
      return null;
    }
  },

  /**
   * Saves the state for a given scope.
   * @param scope The flow scope ID.
   * @param state The state object to save.
   */
  save: async (scope: string, state: Record<string, any>) => {
    const key = `flow:${scope}`;
    try {
      await asyncAdapter.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn('[FlowStorage] save failed', e);
    }
  },

  /**
   * Removes the state for a given scope completely.
   * @param scope The flow scope ID.
   */
  removeScope: async (scope: string) => {
    const key = `flow:${scope}`;
    try {
      await asyncAdapter.removeItem(key);
    } catch (e) {
      console.warn('[FlowStorage] removeScope failed', e);
    }
  },
};
