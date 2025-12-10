import {useState, useEffect, useCallback, useRef} from 'react';
import {useFlowContext} from '../core/FlowContext';

/**
 * @hook useLocalState
 * @description
 * A local state hook that automatically clears when the component unmounts.
 * Unlike useFlowState, this state is NOT persisted and is isolated to the current component instance.
 * Each component using this hook gets its own independent state that doesn't conflict with others.
 * 
 * Use this for temporary UI state that shouldn't persist when navigating away.
 *
 * @template T - The type of state values. Defaults to `any`.
 * @returns {object} An object containing get, set, and clear methods.
 * 
 * @example
 * ```tsx
 * const { get, set, clear } = useLocalState();
 * 
 * // Set local state
 * set('formDirty', true);
 * set('errorMessage', 'Invalid input');
 * 
 * // Get local state
 * const isDirty = get('formDirty', false); // Second param is fallback
 * 
 * // Clear specific key
 * clear('errorMessage');
 * ```
 */
export function useLocalState<T = any>() {
    // Use a ref to store state, initialized with an empty Map
    const stateRef = useRef<Map<string, T>>(new Map());
    
    // Force re-render trigger
    const [, setTick] = useState(0);
    const forceUpdate = useCallback(() => setTick(t => t + 1), []);

    // Clear all state on unmount
    useEffect(() => {
        return () => {
            stateRef.current.clear();
        };
    }, []);

    /**
     * Gets a value from local state.
     * @param key - The key to retrieve.
     * @param fallback - Fallback value if key doesn't exist. Defaults to ''.
     * @returns The stored value or fallback.
     */
    const get = useCallback(<K extends string>(key: K, fallback: T | '' = ''): T | '' => {
        const value = stateRef.current.get(key);
        return value !== undefined && value !== null ? value : fallback;
    }, []);

    /**
     * Sets a value in local state.
     * @param key - The key to store.
     * @param value - The value to store.
     */
    const set = useCallback(<K extends string>(key: K, value: T) => {
        stateRef.current.set(key, value);
        forceUpdate();
    }, [forceUpdate]);

    /**
     * Clears a specific key or all state if no key provided.
     * @param key - Optional key to clear. If omitted, clears all.
     */
    const clear = useCallback((key?: string) => {
        if (key) {
            stateRef.current.delete(key);
        } else {
            stateRef.current.clear();
        }
        forceUpdate();
    }, [forceUpdate]);

    /**
     * Checks if a key exists in local state.
     * @param key - The key to check.
     * @returns True if the key exists.
     */
    const has = useCallback((key: string): boolean => {
        return stateRef.current.has(key);
    }, []);

    /**
     * Gets all keys in local state.
     * @returns Array of keys.
     */
    const keys = useCallback((): string[] => {
        return Array.from(stateRef.current.keys());
    }, []);

    return {
        get,
        set,
        clear,
        has,
        keys,
    };
}

export default useLocalState;
