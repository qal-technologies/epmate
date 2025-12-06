import {FlowState, SetStateOptions} from '../../types';
import {FlowStorage} from './FlowStorage';

/* -------------------- Internal State Map -------------------- */
const stateMap: Map<string, FlowState> = new Map();
const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

/* -------------------- Helpers -------------------- */

function notify (scope: string, event: string, payload?: any) {
    const set = listeners.get(scope);
    if(!set) return;
    for(const cb of Array.from(set)) {
        try {
            cb({event, payload});
        } catch(err) {
            if(__DEV__) console.error('[FlowState] listener error:', err);
        }
    }
}

const loadedScopes = new Set<string>();

export function ensureState(scope: string) {
  if (!stateMap.has(scope)) {
    // Initialize with default empty state immediately
    stateMap.set(scope, {
      __categories: {},
      __secure: {},
      __temp: {},
      __scoped: {},
      __shared: {},
    });
  }

  // Trigger async load if not already loaded
  if (!loadedScopes.has(scope)) {
    loadedScopes.add(scope);
    FlowStorage.load(scope).then((stored) => {
      if (stored) {
        // Merge stored state with current (in case writes happened while loading)
        const current = stateMap.get(scope) || {};
        const merged = { ...stored, ...current };
        stateMap.set(scope, merged as FlowState);
        notify(scope, 'state', merged);
      }
    }).catch(err => {
      if (__DEV__) console.warn('[FlowState] Async load failed', err);
    });
  }
}

/* -------------------- Public API -------------------- */

export function getFlowState<T = any>(scope: string): T {
    ensureState(scope);
    return (stateMap.get(scope) || {}) as T;
}

export function setFlowState<T = any>(scope: string, newState: T, options?: SetStateOptions) {
    ensureState(scope);
    const current = stateMap.get(scope)!;

    if(options?.category) {
        if(!current.__categories) current.__categories = {};
        current.__categories[options.category] = {
            ...(current.__categories[options.category] || {}),
            ...newState,
        };
    } else if(options?.secureKey) {
        // Mock secure
        if(!current.__secure) current.__secure = {};
        for(const k in newState) {
            current.__secure[k] = {value: (newState as any)[k]};
        }
    } else if(options?.temporary) {
        if(!current.__temp) current.__temp = {};
        Object.assign(current.__temp, newState);
    } else if(options?.scope) {
        if(!current.__scoped) current.__scoped = {};
        for(const k in newState) {
            current[k] = (newState as any)[k];
            current.__scoped[k] = options.scope;
        }
    } else if(options?.shared) {
        // Shared state (global/cross-flow)
        if(!current.__shared) current.__shared = {};
        Object.assign(current.__shared, newState);
    } else {
        Object.assign(current, newState);
    }

    stateMap.set(scope, current);

    // Persist unless it's purely temporary
    FlowStorage.save(scope, current);

    notify(scope, 'state', newState);
}

export function take<T = any>(scope: string, key: string): T | undefined {
    ensureState(scope);
    const current = stateMap.get(scope)!;

    let val = current[key];
    let found = false;

    if(val !== undefined) {
        delete current[key];
        found = true;
    } else if(current.__temp && current.__temp[key] !== undefined) {
        val = current.__temp[key];
        delete current.__temp[key];
        found = true;
    } else if(current.__shared && current.__shared[key] !== undefined) {
        val = current.__shared[key];
        delete current.__shared[key];
        found = true;
    } else if(current.__secure && current.__secure[key] !== undefined) {
        val = current.__secure[key].value;
        delete current.__secure[key];
        found = true;
    }

    if(found) {
        stateMap.set(scope, current);
        FlowStorage.save(scope, current);
        notify(scope, 'state', {[key]: undefined});
    }

    return val as T;
}

export function takeShared<T = any>(key: string): T | undefined {
    return take<T>('global', key);
}

export function clear(scope: string, key?: string) {
    ensureState(scope);
    const current = stateMap.get(scope)!;

    if(key) {
        let found = false;
        // Clear specific key from all buckets
        if(current[key] !== undefined) {
            delete current[key];
            found = true;
        }
        if(current.__temp && current.__temp[key] !== undefined) {
            delete current.__temp[key];
            found = true;
        }
        if(current.__secure && current.__secure[key] !== undefined) {
            delete current.__secure[key];
            found = true;
        }
        if(current.__shared && current.__shared[key] !== undefined) {
            delete current.__shared[key];
            found = true;
        }

        if(found) {
            stateMap.set(scope, current);
            FlowStorage.save(scope, current);
            notify(scope, 'state', {[key]: undefined});
        }
    } else {
        // Clear entire scope
        stateMap.delete(scope);
        FlowStorage.removeScope(scope);
        notify(scope, 'clear', null);
    }
}

export function keep<T = any>(scope: string, key: string, value: T) {
    setFlowState(scope, {[key]: value}, {temporary: true});
}

export function getCat<T = any>(scope: string, category: string, key?: string): T | undefined {
    ensureState(scope);
    const s = stateMap.get(scope);
    const cat = s?.__categories?.[category];
    if(!cat) return undefined;
    return (key ? cat[key] : cat) as T;
}

export function setCat<T = any>(scope: string, category: string, newState: T) {
    setFlowState(scope, newState, {category});
}

export function secure<T = any>(scope: string, key: string, value: T, secureKey: string) {
    setFlowState(scope, {[key]: value}, {secureKey});
}

export function getSecure<T = any>(scope: string, key: string, secureKey: string): T | undefined {
    ensureState(scope);
    const s = stateMap.get(scope);
    const sec = s?.__secure?.[key];
    if(!sec) return undefined;
    // Mock decryption
    return sec.value as T;
}

export function setShared<T = any>(key: string, value: T) {
    // Use a global scope for shared data
    setFlowState('global', {[key]: value}, {shared: true});
}

export function getShared<T = any>(key: string): T | undefined {
    ensureState('global');
    const s = stateMap.get('global');
    return s?.__shared?.[key] as T;
}

export function onStateChange (scope: string, cb: (...args: any[]) => void) {
    if(!scope || typeof cb !== 'function') return () => { };
    const set = listeners.get(scope) || new Set();
    set.add(cb);
    listeners.set(scope, set);
    return () => {
        const s = listeners.get(scope);
        if(s) {
            s.delete(cb);
            if(s.size === 0) listeners.delete(scope);
        }
    };
}

/**
 * Cleans up temporary state for orphaned scopes.
 * @param scopes - Array of scope IDs to clean up.
 */
export function cleanupTempState(scopes: string[]) {
    scopes.forEach(scope => {
        const current = stateMap.get(scope);
        if (current) {
            let changed = false;
            // Clear temporary state
            if (current.__temp && Object.keys(current.__temp).length > 0) {
                current.__temp = {};
                changed = true;
            }
            // Clear scoped state (sent to this child)
            if (current.__scoped && Object.keys(current.__scoped).length > 0) {
                current.__scoped = {};
                changed = true;
            }
            
            if (changed) {
                stateMap.set(scope, current);
                // We don't necessarily need to persist the cleanup of temp state if it wasn't persisted anyway,
                // but it's good practice to keep memory clean.
                // FlowStorage.save(scope, current); 
                notify(scope, 'cleanup', null);
            }
        }
    });
    // if (__DEV__ && scopes.length > 0) {
    //     console.log(`[FlowStateManager] Cleaned up temporary state for ${scopes.length} scopes`);
    // }
}
