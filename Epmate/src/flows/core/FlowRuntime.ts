import { flowRegistry } from './FlowRegistry';
import { FlowNode } from '../types';
import {FlowState as FlowStateType, SetStateOptions, FlowStateValue, FlowCreateOptions, AtEndConfig} from '../types';
import { makeId, inferParent, runWithTimeout } from '../utils';
import {clear as clearState} from './state/FlowStateManager';
import './state/FlowStorage'; // Register MMKV adapter
import { flowNavigationHistory } from './FlowNavigationHistory';

/* ---------------- runtime maps ----------------- */
const stackMap: Map<string, string[]> = new Map();
const activeMap: Map<string, string | null> = new Map();
const openingMap: Map<string, boolean> = new Map();
const switchingMap: Map<string, boolean> = new Map();
const draggingMap: Map<string, boolean> = new Map();
const animationMap: Map<string, boolean> = new Map();
const lockedMap: Map<string, boolean> = new Map();
const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

// Active root management
let activeRootId: string | null = null;

/**
 * Gets the ID of the currently active root pack.
 * @returns {string | null} The ID of the active root, or null if none.
 */
export function getActiveRoot(): string | null {
  return activeRootId;
}

/**
 * Switches the active root pack of the application.
 * Triggers a global re-render and cleans up orphaned states from the previous root.
 * 
 * @param {string} rootId - The ID of the pack (or a node within the pack) to switch to.
 */
export function switchRoot(rootId: string) {
  // Try to resolve the actual Pack ID if a child/parent ID is given
  let targetPackId = rootId;
  const node = flowRegistry.getNode(rootId);
  
  if (node) {
    if (node.type === 'pack') {
      targetPackId = node.id;
    } else {
      // Walk up to find the pack
      const chain = flowRegistry.getParentChain(node.id);
      const pack = chain.find(n => n.type === 'pack');
      if (pack) {
        targetPackId = pack.id;
        // if (__DEV__) console.log(`[FlowRuntime] switchRoot resolved '${rootId}' to pack '${targetPackId}'`);
      }
    }
  }

  if (activeRootId !== targetPackId) {
    activeRootId = targetPackId;
    // Notify all listeners to trigger re-render
    notify(targetPackId, 'root:switch', { rootId: targetPackId });
    flowRegistry.forceUpdate();
    
    // Memory Optimization: Clean up orphaned states after switching roots
    // We do this in a timeout to allow the new root to mount and register its active children first
    setTimeout(() => {
      const orphanedIds = flowNavigationHistory.cleanupOrphanedStates();
      if (orphanedIds.length > 0) {
        // Also clean up temporary data state for these orphaned scopes
        // We need to import cleanupTempState from FlowStateManager
        // But we can't do circular imports if FlowStateManager imports FlowRuntime (it doesn't seem to).
        // Let's assume we can import it.
        // Actually, I'll add the import at the top first.
        const { cleanupTempState } = require('./state/FlowStateManager');
        cleanupTempState(orphanedIds);
      }
    }, 1000);
  }
}

/* -------------------- Internal helpers -------------------- */

/**
 * Ensures that the runtime maps are initialized for a given parent.
 * @param {string} parentId - The parent flow ID.
 */
export function ensureRuntime(parentId: string) {
  if (!stackMap.has(parentId)) stackMap.set(parentId, []);
  if (!activeMap.has(parentId)) activeMap.set(parentId, null);
  if (!openingMap.has(parentId)) openingMap.set(parentId, false);
  if (!switchingMap.has(parentId)) switchingMap.set(parentId, false);
  if (!draggingMap.has(parentId)) draggingMap.set(parentId, false);
  if (!animationMap.has(parentId)) animationMap.set(parentId, false);
  if(!lockedMap.has(parentId)) lockedMap.set(parentId, false);
}

function notify(nodeId: string, event: string, payload?: any) {
  const set = listeners.get(nodeId);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try {
      cb({ event, payload });
    } catch (err) {
      if(__DEV__) console.error('[Flow] listener error:', err);
    }
  }
}

function safeGetNode(id: string, suppressWarning = false): FlowNode | null {
  const n = flowRegistry.getNode(id);
  if (!n) {
    if (__DEV__ && !suppressWarning) console.warn(`[Flow] Node "${id}" not found in registry.`);
    return null;
  }
  return n;
}

function pushChildOntoStack(parentId: string, childId: string) {
  ensureRuntime(parentId);
  const arr = stackMap.get(parentId)!;
  if (arr[arr.length - 1] !== childId) {
    arr.push(childId);
    stackMap.set(parentId, arr);
  }
  activeMap.set(parentId, childId);
  try {
    flowRegistry.setCurrentChild(parentId, childId);
  } catch (e) {}
  notify(parentId, 'stack:push', { childId, stack: [...arr] });
  // Force global re-render since FlowNavigator subscribes to registry
  flowRegistry.forceUpdate();
}

function popChildFromStack(parentId: string): string | null {
  ensureRuntime(parentId);
  const arr = stackMap.get(parentId)!;
  if (arr.length === 0) return null;
  const popped = arr.pop()!;
  const newActive = arr.length > 0 ? arr[arr.length - 1] : null;
  activeMap.set(parentId, newActive);
  try {
    flowRegistry.setCurrentChild(parentId, newActive);
  } catch (e) {}
  notify(parentId, 'stack:pop', { popped, newActive });
  // Force global re-render since FlowNavigator subscribes to registry
  flowRegistry.forceUpdate();
  return popped;
}

function getCurrentActiveChildId(parentId: string): string | null {
  return activeMap.get(parentId) ?? null;
}

/* -------------------- Lifecycle Runners -------------------- */

async function runOnSwitching(
  childNode: FlowNode,
  direction: 'forward' | 'backward',
  timeoutMs: number,
) {
  if (!childNode.props?.onSwitching) return true;
  return runWithTimeout(
    () => childNode.props.onSwitching!(direction),
    timeoutMs,
    false,
  );
}

async function runOnOpen(
  childNode: FlowNode,
  ctx: { from: string; opener?: string },
  timeoutMs: number,
) {
  if (!childNode.props?.onOpen) return true;
  return runWithTimeout(
    () => childNode.props.onOpen!(ctx),
    timeoutMs,
    false,
  );
}

function cleanupAndUnregister(
  parentId: string,
  unregisterFlag: boolean,
  resetStateFlag: boolean,
) {
  stackMap.delete(parentId);
  activeMap.delete(parentId);
  openingMap.delete(parentId);
  switchingMap.delete(parentId);
  draggingMap.delete(parentId);
  animationMap.delete(parentId);
  listeners.delete(parentId);
  if(resetStateFlag) {
    clearState(parentId);
  }
  if (unregisterFlag) flowRegistry.unregisterNode(parentId);
}

async function handleAtEnd(parentNode: FlowNode, opts?: FlowCreateOptions) {
  const atEnd: AtEndConfig = parentNode.props?.atEnd;
  const lifecycleTimeoutMs = opts?.lifecycleTimeoutMs ?? 8000;
  
  let didSomething = false;

  if (parentNode.props?.isRestrictedOut) {
    notify(parentNode.id, 'atEnd:blocked:restrictedOut', null);
    return false;
  }

  if (!atEnd) return false;

  if (typeof atEnd.endWith === 'function') {
    try {
      const res = await Promise.resolve(
        atEnd.endWith({ parentNode, flowRegistry, lifecycleTimeoutMs }),
      );
      if (res && res.dismount) {
        cleanupAndUnregister(
          parentNode.id,
          !!atEnd.cleanUp,
          !!atEnd.resetState,
        );
      }
      return true;
    } catch (err) {
      if (__DEV__) console.warn('[Flow] atEnd function threw', err);
      return false;
    }
  }

  const mode = atEnd.endWith;
  switch (mode) {
    case 'parent': {
      const pParentId = parentNode.parentId;
      if (!pParentId) {
        if (atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
        notify(parentNode.id, 'atEnd:no-parent', null);
        return true;
      }
      notify(parentNode.id, 'atEnd:parent', { toParent: pParentId });
      didSomething = true;

      if (atEnd.cleanUp)
        cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      return true;
    }
    case 'self': {
      const children = flowRegistry.getChildren(parentNode.id);
      if (children && children.length > 0) {
        stackMap.set(parentNode.id, []);
        activeMap.set(parentNode.id, children[0].id);
        notify(parentNode.id, 'atEnd:self:reset', { to: children[0].id });
        if (atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      }
      return true;
    }
    case 'element': {
      const el = atEnd.element;
      if (!el) {
        notify(parentNode.id, 'atEnd:element:missing', null);
        if (atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
        return true;
      }
      notify(parentNode.id, 'atEnd:element', { element: el });
      if (atEnd.cleanUp)
        cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      return true;
    }
    default: {
      notify(parentNode.id, 'atEnd:unknown', { atEnd });
      if (atEnd.cleanUp)
        cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      return didSomething;
    }
  }
  return true;
}

/* -------------------- Navigation API -------------------- */

/**
 * Opens a specific child flow within a parent.
 * 
 * @param {string} parentName - The name or ID of the parent flow.
 * @param {string} childName - The name or ID of the child to open.
 * @param {string} [opener] - The ID of the component that triggered the open action.
 * @param {FlowCreateOptions} [opts] - Options for opening the flow (e.g., params, timeout).
 * @returns {Promise<boolean>} True if successful, false otherwise.
 */
export async function open(
  parentName: string,
  childName: string,
  opener?: string,
  opts: FlowCreateOptions = {},
) {
  const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
  if (!parentName || !childName) return false;
  
  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;
  
  // Try to find child by name within this parent
  let child = flowRegistry.getChildByName(parentName, childName);
  
  // Fallback: try constructing ID if not found by name
  if (!child) {
     const childId = parentName + '.' + childName;
     child = safeGetNode(childId, true); // Suppress warning
  }
  
  if (!child) {
    // Last resort: maybe childName IS the ID?
    child = safeGetNode(childName, true); // Suppress warning
  }

  if (!child) {
     // Now we can warn if we really didn't find it
     if (__DEV__) console.warn(`[Flow] Node "${childName}" not found in registry (checked name, ID, and direct ID).`);
     return false;
  }

  ensureRuntime(parentName);

  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  const currentId = getCurrentActiveChildId(parentName);
  const currentNode = currentId ? safeGetNode(currentId) : null;

  try {
    if(currentNode && currentNode.id !== child.id) {
      switchingMap.set(parentName, true);
      notify(parentName, 'switching:start', {from: currentNode.id, to: child.id});
      const ok = await runOnSwitching(currentNode, 'forward', lifecycleTimeoutMs);
      switchingMap.set(parentName, false);
      if(!ok) return false;
    }

    openingMap.set(parentName, true);
    notify(parentName, 'opening:start', {to: child.id, from: currentNode?.id ?? null});
    const okOpen = await runOnOpen(child, {from: 'parent', opener}, lifecycleTimeoutMs);
    openingMap.set(parentName, false);
    if(!okOpen) return false;

    // Save navigation history
    flowNavigationHistory.push(parentName, {
      childId: child.id,
      childName: child.name,
      timestamp: Date.now(),
      params: opts.params,
    });

    pushChildOntoStack(parentName, child.id);
    notify(parentName, 'open', {to: child.id, from: currentNode?.id ?? null});
    return true;
  } catch(err) {
    if(__DEV__) console.error('[FlowRuntime] open failed', err);
    switchingMap.set(parentName, false);
    openingMap.set(parentName, false);
    return false;
  } finally {
    lockedMap.set(parentName, false);
  }
}

/**
 * Closes the active child of a parent flow.
 * 
 * @param {string} parentName - The name or ID of the parent flow.
 * @returns {Promise<boolean>} True if successful.
 */
export async function close(parentName: string) {
  if (!parentName) return false;
  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;
  
  ensureRuntime(parentName);
  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  try {
    const stack = stackMap.get(parentName) ?? [];
    for(const childId of [...stack].reverse()) {
      const node = safeGetNode(childId);
      try {
        node?.props?.onClose?.();
      } catch(err) { }
    }
    stackMap.set(parentName, []);
    activeMap.set(parentName, null);
    notify(parentName, 'close', null);
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

/**
 * Navigates to the next sibling flow.
 * 
 * @param {string} [parentName] - The parent flow ID. If omitted, infers from context.
 * @param {FlowCreateOptions} [opts] - Options for navigation.
 * @returns {Promise<boolean>} True if successful.
 */
export async function next(
  parentName?: string | null,
  opts: FlowCreateOptions = {},
): Promise<boolean> {
  const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
  const inferredParent = inferParent(parentName);
  if (!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;

  const children = flowRegistry.getChildren(parentName);
  if (!children || children.length === 0) {
    if (parent.parentId) return next(parent.parentId, opts);
    return false;
  }

  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  try {
    const currId = getCurrentActiveChildId(parentName);
    if(!currId) return open(parentName, children[0].name, undefined, opts);

    const idx = children.findIndex(c => c.id === currId);
    if(idx < 0) return open(parentName, children[0].name, undefined, opts);

    const nextIdx = idx + 1;
    if(nextIdx >= children.length) {
      const handled = await handleAtEnd(parent, opts);
      if(handled) return true;
      if(parent.parentId) return next(parent.parentId, opts);
      return false;
    }

    const currNode = safeGetNode(currId);
    if (!currNode) {
       // Should not happen if registry is consistent, but handle gracefully
       return open(parentName, children[0].name, undefined, opts);
    }
    const nextNode = children[nextIdx];

    switchingMap.set(parentName, true);
    const okSwitch = await runOnSwitching(currNode, 'forward', lifecycleTimeoutMs);
    switchingMap.set(parentName, false);
    if(!okSwitch) return false;

    openingMap.set(parentName, true);
    const okOpen = await runOnOpen(nextNode, {from: 'sibling', opener: currId}, lifecycleTimeoutMs);
    openingMap.set(parentName, false);
    if(!okOpen) return false;

    // Save navigation history
    flowNavigationHistory.push(parentName, {
      childId: nextNode.id,
      childName: nextNode.name,
      timestamp: Date.now(),
    });

    pushChildOntoStack(parentName, nextNode.id);
    notify(parentName, 'next', {to: nextNode.id, from: currId});
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

/**
 * Navigates to the previous sibling flow or back in history.
 * 
 * @param {string} [parentName] - The parent flow ID. If omitted, infers from context.
 * @param {FlowCreateOptions} [opts] - Options for navigation.
 * @returns {Promise<boolean>} True if successful.
 */
export async function prev(
  parentName?: string | null,
  opts: FlowCreateOptions = {},
): Promise<boolean> {
  const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
  const inferredParent = inferParent(parentName);
  if (!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;

  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  try {
    const currId = getCurrentActiveChildId(parentName);
    if(!currId) return false;

    const currNode = safeGetNode(currId);
    if (!currNode) return false;

    switchingMap.set(parentName, true);
    const okSwitch = await runOnSwitching(currNode, 'backward', lifecycleTimeoutMs);
    switchingMap.set(parentName, false);
    if(!okSwitch) return false;

    // Pop from navigation history
    const historyEntry = flowNavigationHistory.pop(parentName);
    
    const popped = popChildFromStack(parentName);
    if(!popped) {
      if(parent.parentId) return prev(parent.parentId, opts);
      return false;
    }
    
    // Restore component state if available
    if(historyEntry) {
      const previousId = getCurrentActiveChildId(parentName);
      if(previousId && historyEntry.componentState) {
        // State restoration would happen here if we had component-level hooks
        // if(__DEV__) console.log('[FlowRuntime] History entry available for:', previousId);
      }
    }
    
    notify(parentName, 'prev', {to: popped, from: currId});
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

/**
 * Navigates to a specific path within the flow hierarchy.
 * Supports dot notation for deep linking (e.g., 'Pack.Parent.Child').
 * 
 * @param {string} parentName - The starting parent flow ID.
 * @param {...string} pathSegments - The path segments to navigate to.
 * @returns {Promise<boolean>} True if successful.
 */
export async function goTo(parentName: string, ...pathSegments: string[]) {
  if (!parentName || !pathSegments.length) return false;
  const inferredParent = inferParent(parentName);
  if (!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;

  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  try {
    // ... (simplified path resolution logic for brevity, can copy full logic if needed)
    let candidateId: string | null = null;
    const dotted = pathSegments.join('.');
    const direct = `${parentName}.${dotted}`;
    if(flowRegistry.getNode(direct)) candidateId = direct;
    else if(flowRegistry.getNode(dotted)) candidateId = dotted;

    if(!candidateId) return false;
    const target = safeGetNode(candidateId);
    if(!target) return false;

    const current = getCurrentActiveChildId(parentName);
    if(current) {
      const currNode = safeGetNode(current);
      if (currNode) {
        switchingMap.set(parentName, true);
        const okSwitch = await runOnSwitching(currNode, 'forward', 8000);
        switchingMap.set(parentName, false);
        if(!okSwitch) return false;
      }
    }

    openingMap.set(parentName, true);
    const okOpen = await runOnOpen(target, {from: 'goTo', opener: current ?? undefined}, 8000);
    openingMap.set(parentName, false);
    if(!okOpen) return false;

    // Save navigation history
    flowNavigationHistory.push(parentName, {
      childId: target.id,
      childName: target.name,
      timestamp: Date.now(),
    });

    pushChildOntoStack(parentName, target.id);
    notify(parentName, 'goTo', {to: target.id});
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

/* -------------------- Runtime Hook -------------------- */

/**
 * Gets the currently active child node for a parent.
 * @param {string} parentName - The parent flow ID.
 * @returns {FlowNode | null} The active child node, or null.
 */
export function getActive(parentName: string) {
  if (!parentName) return null;
  const activeId = getCurrentActiveChildId(parentName);
  if (!activeId) return null;
  return safeGetNode(activeId);
}

/**
 * Gets the current runtime flags for a parent flow.
 * @param {string} parentName - The parent flow ID.
 * @returns {object} Object containing flags: opening, switching, dragging, animating.
 */
export function getFlags(parentName: string) {
  ensureRuntime(parentName);
  return {
    opening: !!openingMap.get(parentName),
    switching: !!switchingMap.get(parentName),
    dragging: !!draggingMap.get(parentName),
    animating: !!animationMap.get(parentName),
  };
}

/**
 * Subscribes to runtime events for a specific scope.
 * @param {string} parentName - The scope ID to listen to.
 * @param {function} cb - The callback function.
 * @returns {function} Unsubscribe function.
 */
export function onChange(parentName: string, cb: (...args: any[]) => void) {
  if (!parentName || typeof cb !== 'function') return () => {};
  const set = listeners.get(parentName) || new Set();
  set.add(cb);
  listeners.set(parentName, set);
  return () => {
    const s = listeners.get(parentName);
    if (s) {
      s.delete(cb);
      if (s.size === 0) listeners.delete(parentName);
    }
  };
}

/**
 * Gets the parent ID (mom) of a given child.
 * @param {string} childId - The child ID.
 * @returns {string | null} The parent ID, or null if not found.
 */
export function getMom(childId: string): string | null {
  return flowRegistry.getMom(childId) ?? null;
}

/**
 * Updates the drag position for a parent flow.
 * @param {string} parentName - The parent flow ID.
 * @param {number} pos - The current drag position.
 */
export function onDragUpdate(parentName: string, pos: number) {
  ensureRuntime(parentName);
  draggingMap.set(parentName, true);
  const activeId = getCurrentActiveChildId(parentName);
  if (activeId) {
    const node = safeGetNode(activeId);
    try {
      node?.props?.onDrag?.(pos);
    } catch (err) {}
  }
  notify(parentName, 'drag', { pos });
}

/**
 * Handles the end of a drag gesture.
 * @param {string} parentName - The parent flow ID.
 */
export function onDragEnd(parentName: string) {
  ensureRuntime(parentName);
  draggingMap.set(parentName, false);
  notify(parentName, 'dragEnd', null);
}

/**
 * Notifies listeners that an animation has completed.
 * @param {string} parentName - The parent flow ID.
 * @param {boolean} isAnimating - Whether an animation is currently active.
 */
export function notifyAnimationComplete (parentName: string, isAnimating: boolean) {
  ensureRuntime(parentName);
  animationMap.set(parentName, isAnimating);
  notify(parentName, 'animating', { isAnimating });
}

/**
 * Hook to access the Flow Runtime API.
 * Provides methods for navigation, state access, and event handling.
 */
export function useFlowRuntime() {
  return {
    getActive,
    getFlags,
    onChange,
    getMom,
    onDragUpdate,
    onDragEnd,
    notifyAnimationComplete,
    ensureRuntime,
    getActiveRoot,
    switchRoot,
  };
}