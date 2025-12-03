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
  takeShared as takeSharedRuntime
} from '../core/state/FlowStateManager';
import { SetStateOptions } from '../types';

/**
 * @hook useFlowState
 * @description
 * A hook for managing state within a flow. It supports standard key-value storage,
 * categorized storage, secure storage (mocked), temporary state, and scoped state sharing.
 * 
 * Delegates to FlowStateManager in core/state/.
 *
 * @param {string} [scope] - The ID of the flow scope to manage state for. If not provided, it auto-detects the current scope.
 * @returns {object} An object containing state management methods.
 */
export function useFlowState(scope?: string) {
  const context = useFlowContext();
  
  // Auto-detect scope if not provided
  const targetScope = scope || context.parentId || context.flowId;

  if (!targetScope) {
    if (__DEV__) console.warn('[useFlowState] No scope provided and could not auto-detect from context.');
  }

  /**
   * Retrieves a value from the flow state.
   * @param {string} [key] - The key of the value to retrieve. If omitted, returns the entire state object.
   * @returns {any} The stored value, or undefined if not found.
   */
  const get = (key?: string) => {
    if (!targetScope) return undefined;
    const state = getFlowState(targetScope);
    if (!state) return undefined;
    return key ? state[key] : state;
  };

  /**
   * Updates the flow state.
   * @param {string | object} keyOrState - The key to set, or an object to merge.
   * @param {any} [value] - The value to set (if keyOrState is a string).
   * @param {SetStateOptions} [options] - Options for setting state (e.g., temporary, scoped).
   */
  const set = (keyOrState: string | object, value?: any, options?: SetStateOptions) => {
    if (!targetScope) return;
    
    if (typeof keyOrState === 'string') {
      if (value === undefined) {
        if (__DEV__) console.warn('[useFlowState] set(key, value) requires a value.');
        return;
      }
      setFlowState(targetScope, { [keyOrState]: value }, options);
    } else if (typeof keyOrState === 'object') {
      setFlowState(targetScope, keyOrState, options);
    }
  };

  /**
   * Retrieves a value and removes it from the state.
   * @param {string} key - The key to retrieve and remove.
   * @returns {any} The value.
   */
  const take = (key: string) => {
    if (!targetScope) return undefined;
    return takeRuntime(targetScope, key);
  };

  /**
   * Clears a specific key from the state.
   * @param {string} key - The key to clear.
   */
  const clear = (key: string) => {
    if (!targetScope) return;
    clearRuntime(targetScope, key);
  };

  /**
   * Stores temporary state.
   * @param {string} key - The key to store.
   * @param {any} value - The value to store.
   */
  const keep = (key: string, value: any) => {
    if (!targetScope) return;
    keepRuntime(targetScope, key, value);
  };

  /**
   * Retrieves a value from a specific category in the flow state.
   * @param {string} category - The category name.
   * @param {string} [key] - The key within the category.
   * @returns {any} The stored value.
   */
  const getCat = (category: string, key?: string) => {
    if (!targetScope) return undefined;
    return getCatRuntime(targetScope, category, key);
  };

  /**
   * Sets a value within a specific category in the flow state.
   * @param {string} category - The category name.
   * @param {any} newState - The new state to merge into the category.
   */
  const setCat = (category: string, newState: any) => {
    if (!targetScope) return;
    setCatRuntime(targetScope, category, newState);
  };

  /**
   * Securely stores a value (mocked implementation).
   * @param {string} key - The key to store the value under.
   * @param {any} value - The value to store.
   * @param {string} secureKey - The encryption key (mocked).
   */
  const secure = (key: string, value: any, secureKey: string) => {
    if (!targetScope) return;
    secureRuntime(targetScope, key, value, secureKey);
  };

  /**
   * Retrieves a securely stored value.
   * @param {string} key - The key of the value.
   * @param {string} secureKey - The encryption key used for storage.
   * @returns {any} The decrypted value.
   */
  const getSecure = (key: string, secureKey: string) => {
    if (!targetScope) return undefined;
    return getSecureRuntime(targetScope, key, secureKey);
  };

  /**
   * Sends state to specific children (scoped state).
   * @param {string} key - The key to store.
   * @param {any} value - The value to store.
   * @param {string[]} targetChildren - An array of child IDs that can access this state.
   */
  const send = (key: string, value: any, targetChildren: string[]) => {
    if (!targetScope) return;
    setFlowState(targetScope, { [key]: value }, { scope: targetChildren });
  };

  /**
   * Sets a value in the global shared state.
   * @param {string} key - The key to store.
   * @param {any} value - The value to store.
   */
  const setShared = (key: string, value: any) => {
    setSharedRuntime(key, value);
  };

  /**
   * Retrieves a value from the global shared state.
   * @param {string} key - The key to retrieve.
   * @returns {any} The stored value.
   */
  const getShared = (key: string) => {
    return getSharedRuntime(key);
  };

  /**
   * Retrieves and removes a value from the global shared state.
   * @param {string} key - The key to retrieve and remove.
   * @returns {any} The value.
   */
  const takeShared = (key: string) => {
    return takeSharedRuntime(key);
  };

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
