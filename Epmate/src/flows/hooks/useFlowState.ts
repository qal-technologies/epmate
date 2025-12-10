import React from 'react';
import { useFlowContext } from '../core/FlowContext';
import { 
  getFlowState, 
  setFlowState, 
  getCat as getCatRuntime, 
  setCat as setCatRuntime, 
  secure as secureRuntime, 
  getSecure as getSecureRuntime,
  take as takeRuntime,
  clear as clearRuntime,
  keep as keepRuntime,
  setShared as setSharedRuntime,
  getShared as getSharedRuntime,
  takeShared as takeSharedRuntime,
  onStateChange
} from '../core/state/FlowStateManager';
import { SetStateOptions } from '../types';

/**
 * @hook useFlowState
 * @description
 * A powerful hook for managing state within a flow. It provides a reactive, scoped state management system
 * that persists across navigation steps within the same flow.
 * 
 * **Features:**
 * - **Reactive:** Components re-render automatically when state changes.
 * - **Scoped:** State is isolated to the current flow (or shared if specified).
 * - **Persisted:** State survives unmounts (until the flow is closed).
 * - **Secure:** Supports encrypted storage (mocked).
 * - **Temporary:** Supports ephemeral state that clears on navigation.
 *
 * @template T - The shape of the flow state object. Defaults to `any`.
 * @param {string} [scope] - The ID of the flow scope to manage state for. 
 *   - If omitted, it auto-detects the current `Flow.Parent` or `Flow.FC` scope.
 *   - You can pass 'global' to access shared state.
 * @returns {object} An object containing methods to get, set, and manage state.
 * 
 * @example
 * ```tsx
 * const { set, get, keep } = useFlowState<{ count: number }>();
 * 
 * // Set state (persists)
 * set('count', 1);
 * 
 * // Get state
 * const count = get('count');
 * 
 * // Set temporary state (clears on next nav)
 * keep('tempData', 'some value');
 * ```
 */
export function useFlowState<T = any>(scope?: string) {
  const context = useFlowContext();
  
  // Auto-detect scope if not provided
  const targetScope = scope || context.parentId || context.flowId;

  if (!targetScope) {
    if (__DEV__) {
      // console.warn('[useFlowState] No scope provided and could not auto-detect from context.');
    }
  }

  // Reactive state
  const [localState, setLocalState] = React.useState<T>(() => targetScope ? getFlowState<T>(targetScope) : {} as T);

  // Subscribe to changes
  React.useEffect(() => {
    if (!targetScope) return;

    // Initial sync
    setLocalState(getFlowState<T>(targetScope));

    const unsub = onStateChange(targetScope, () => {
      setLocalState({ ...getFlowState<T>(targetScope) });
    });

    // Also subscribe to global state for shared updates
    // This ensures getShared() returns fresh data on re-render
    let unsubGlobal = () => {};
    if (targetScope !== 'global') {
      unsubGlobal = onStateChange('global', () => {
        // Force re-render by updating local state (even if local state didn't change, 
        // we need to trigger render so getShared() is called again)
        setLocalState(prev => ({ ...prev }));
      });
    }

    return () => {
      unsub();
      unsubGlobal();
    };
  }, [targetScope]);

  /**
   * Retrieves a value from the flow state.
   * 
   * @param {keyof T} [key] - The specific key to retrieve. If omitted, returns the entire state object.
   * @returns {T[keyof T] | T} The stored value, or the entire state object if no key is provided.
   * 
   * @example
   * ```tsx
   * const allState = get();
   * const userName = get('userName');
   * ```
   */
  const get = React.useCallback(<K extends keyof T>(key?: K, fallback: T[K] | '' = ''): T[K] | T | '' => {
    if (!targetScope) return fallback;
    const s = localState || {} as T;
    if (!key) return s;
    const value = s[key];
    return value !== undefined && value !== null ? value : fallback;
  }, [targetScope, localState]);

  /**
   * Updates the flow state.
   * Merges the provided value or object into the existing state.
   * 
   * @param {keyof T | Partial<T>} keyOrState - The key to set, or an object of key-value pairs to merge.
   * @param {any} [value] - The value to set (if the first argument is a key string).
   * @param {SetStateOptions} [options] - Configuration options for this update.
   * @param {string} [options.category] - Store under a specific category/namespace.
   * @param {boolean} [options.temporary] - If true, this state will be cleared on the next navigation.
   * @param {boolean} [options.shared] - If true, updates the global shared state.
   * @param {string} [options.secureKey] - Encrypts the value with this key.
   * @param {string[]} [options.scope] - Limits visibility to specific child IDs.
   * 
   * @example
   * ```tsx
   * // Set a single value
   * set('count', 1);
   * 
   * // Set multiple values
   * set({ name: 'John', age: 30 });
   * 
   * // Set temporary state
   * set('error', 'Invalid input', { temporary: true });
   * ```
   */
  const set = React.useCallback(<K extends keyof T>(keyOrState: K | Partial<T>, value?: T[K], options?: SetStateOptions) => {
    if (!targetScope) return;
    
    if (typeof keyOrState === 'string') {
      if (value === undefined) {
        if (__DEV__) {
          // console.warn('[useFlowState] set(key, value) requires a value.');
        }
        return;
      }
      setFlowState(targetScope, { [keyOrState]: value }, options);
    } else if (typeof keyOrState === 'object') {
      setFlowState(targetScope, keyOrState as any, options);
    }
  }, [targetScope]);

  /**
   * Retrieves a value and immediately removes it from the state.
   * Useful for "consume-once" patterns like flash messages or one-time tokens.
   * 
   * @param {string} key - The key to retrieve and remove.
   * @returns {any} The value that was stored, or undefined if not found.
   * 
   * @example
   * ```tsx
   * const message = take('flashMessage');
   * // 'flashMessage' is now removed from state
   * ```
   */
  const take = React.useCallback(<K extends keyof T>(key: K | string): T[K] | any => {
    if (!targetScope) return undefined;
    return takeRuntime(targetScope, key as string);
  }, [targetScope]);

  /**
   * Clears a specific key from the state.
   * @param {string} key - The key to clear.
   */
  const clear = React.useCallback((key: keyof T | string) => {
    if (!targetScope) return;
    clearRuntime(targetScope, key as string);
  }, [targetScope]);

  /**
   * Stores temporary state that will be automatically cleared on the next navigation action.
   * Alias for `set(key, value, { temporary: true })`.
   * 
   * @param {string} key - The key to store.
   * @param {any} value - The value to store.
   * 
   * @example
   * ```tsx
   * keep('isLoading', true);
   * // Will be cleared when user navigates to next step
   * ```
   */
  const keep = React.useCallback(<K extends keyof T>(key: K | string, value: T[K] | any) => {
    if (!targetScope) return;
    keepRuntime(targetScope, key as string, value);
  }, [targetScope]);

  /**
   * Retrieves a value from a specific named category (namespace) within the state.
   * Categories help organize complex state objects.
   * 
   * @param {string} category - The name of the category (e.g., 'filters', 'formData').
   * @param {string} [key] - The specific key within the category. If omitted, returns the whole category object.
   * @returns {any} The stored value or category object.
   * 
   * @example
   * ```tsx
   * const filters = getCat('filters');
   * const sortBy = getCat('filters', 'sortBy');
   * ```
   */
  const getCat = React.useCallback(<C = any>(category: string, key?: string, fallback: C | '' = ''): C | '' => {
    if (!targetScope) return fallback;
    const cats = (localState as any)?.__categories?.[category];
    if (!cats) return fallback;
    const result = key ? cats[key] : cats;
    return result !== undefined && result !== null ? result : fallback;
  }, [targetScope, localState]);

  /**
   * Sets a value within a specific named category (namespace).
   * Merges the new state into the existing category.
   * 
   * @param {string} category - The name of the category (e.g., 'filters').
   * @param {any} newState - The object or value to merge into the category.
   * 
   * @example
   * ```tsx
   * setCat('filters', { sortBy: 'date', order: 'desc' });
   * ```
   */
  const setCat = React.useCallback(<C = any>(category: string, newState: C) => {
    if (!targetScope) return;
    setCatRuntime(targetScope, category, newState);
  }, [targetScope]);

  /**
   * Securely stores a value using encryption (mocked in this implementation).
   * 
   * @param {string} key - The key to store the value under.
   * @param {any} value - The value to encrypt and store.
   * @param {string} secureKey - The encryption key to use.
   * 
   * @example
   * ```tsx
   * secure('authToken', 'xyz-123', 'my-secret-key');
   * ```
   */
  const secure = React.useCallback(<V = any>(key: string, value: V, secureKey: string) => {
    if (!targetScope) return;
    secureRuntime(targetScope, key, value, secureKey);
  }, [targetScope]);

  /**
   * Retrieves a securely stored value.
   * @param {string} key - The key of the value.
   * @param {string} secureKey - The encryption key used for storage.
   * @returns {any} The decrypted value.
   */
  const getSecure = React.useCallback(<V = any>(key: string, secureKey: string, fallback: V | '' = ''): V | '' => {
    if (!targetScope) return fallback;
    const sec = (localState as any)?.__secure?.[key];
    if (!sec) return fallback;
    const value = sec.value;
    return value !== undefined && value !== null ? value : fallback;
  }, [targetScope, localState]);

  /**
   * Sends state to specific children or targets a specific flow path.
   * Useful for passing data down to specific steps or across the flow hierarchy.
   * 
   * @param {string} keyOrTarget - The key to store OR the target path (dot notation).
   * @param {any} valueOrKey - The value to store OR the key (if first arg is target).
   * @param {string[] | any} targetChildrenOrValue - Target children IDs (array) OR value (if first arg is target).
   * 
   * @example
   * ```tsx
   * // Send to specific children of current flow
   * send('data', { id: 1 }, ['Step2', 'Step3']);
   * 
   * // Send to a specific target path (Deep Link style)
   * send('MainPack.ProfileFlow.Settings', 'theme', 'dark');
   * ```
   */
  const send = React.useCallback((keyOrTarget: string, valueOrKey: any, targetChildrenOrValue?: any) => {
    // Check for dot notation in first argument (e.g. "MainPack.Main.Home")
    if (keyOrTarget.includes('.')) {
      const targetId = keyOrTarget;
      const key = valueOrKey;
      const value = targetChildrenOrValue;
      
      // Send to specific target scope
      setFlowState(targetId, { [key]: value }, { scope: [targetId] });
      return;
    }

    if (!targetScope) return;
    const key = keyOrTarget;
    const value = valueOrKey;
    const targetChildren = targetChildrenOrValue as string[];
    
    setFlowState(targetScope, { [key]: value }, { scope: targetChildren });
  }, [targetScope]);

  /**
   * Sets a value in the global shared state.
   * @param {string} key - The key to store.
   * @param {any} value - The value to store.
   */
  const setShared = React.useCallback(<V = any>(key: string, value: V) => {
    setSharedRuntime(key, value);
  }, []);

  /**
   * Retrieves a value from the global shared state.
   * @param {string} key - The key to retrieve.
   * @returns {any} The stored value.
   */
  const getShared = React.useCallback(<V = any>(key: string, fallback: V | '' = ''): V | '' => {
    return getSharedRuntime<V>(key, fallback);
  }, []);

  /**
   * Retrieves and removes a value from the global shared state.
   * @param {string} key - The key to retrieve and remove.
   * @returns {any} The value.
   */
  const takeShared = React.useCallback(<V = any>(key: string): V | undefined => {
    return takeSharedRuntime<V>(key);
  }, []);

  return {
    get,
    set,
    take,
    clear,
    keep,
    getCat,
    setCat,
    secure,
    getSecure,
    send,
    setShared,
    getShared,
    takeShared,
  };
}
