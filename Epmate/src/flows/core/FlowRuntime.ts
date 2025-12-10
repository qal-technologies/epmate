import {flowRegistry} from './FlowRegistry';
import {FlowNode} from '../types';
import {FlowState as FlowStateType, SetStateOptions, FlowStateValue, FlowCreateOptions, AtEndConfig} from '../types';
import {makeId, inferParent, runWithTimeout} from '../utils';
import {clear as clearState} from './state/FlowStateManager';
import './state/FlowStorage'; // Register MMKV adapter
import {flowNavigationHistory} from './FlowNavigationHistory';
import {Alert} from 'react-native';

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
export function getActiveRoot (): string | null {
  return activeRootId;
}

/**
 * Switches the active root pack of the application.
 * Triggers a global re-render and cleans up orphaned states from the previous root.
 * 
 * @param {string} rootId - The ID of the pack (or a node within the pack) to switch to.
 */
export function switchRoot (rootId: string) {
  // Try to resolve the actual Pack ID if a child/parent ID is given
  let targetPackId = rootId;
  const node = flowRegistry.getNode(rootId);

  if(node) {
    if(node.type === 'pack') {
      targetPackId = node.id;
    } else {
      // Walk up to find the pack
      const chain = flowRegistry.getParentChain(node.id);
      const pack = chain.find(n => n.type === 'pack');
      if(pack) {
        targetPackId = pack.id;
        // if (__DEV__) console.log(`[FlowRuntime] switchRoot resolved '${rootId}' to pack '${targetPackId}'`);
      }
    }
  }

  if(activeRootId !== targetPackId) {
    activeRootId = targetPackId;
    // Notify all listeners to trigger re-render
    notify(targetPackId, 'root:switch', {rootId: targetPackId});
    flowRegistry.forceUpdate();

    // Memory Optimization: Clean up orphaned states after switching roots
    // We do this in a timeout to allow the new root to mount and register its active children first
    setTimeout(() => {
      const orphanedIds = flowNavigationHistory.cleanupOrphanedStates();
      if(orphanedIds.length > 0) {
        // Also clean up temporary data state for these orphaned scopes
        // We need to import cleanupTempState from FlowStateManager
        // But we can't do circular imports if FlowStateManager imports FlowRuntime (it doesn't seem to).
        // Let's assume we can import it.
        // Actually, I'll add the import at the top first.
        const {cleanupTempState} = require('./state/FlowStateManager');
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
export function ensureRuntime (parentId: string) {
  if(!stackMap.has(parentId)) stackMap.set(parentId, []);
  if(!activeMap.has(parentId)) activeMap.set(parentId, null);
  if(!openingMap.has(parentId)) openingMap.set(parentId, false);
  if(!switchingMap.has(parentId)) switchingMap.set(parentId, false);
  if(!draggingMap.has(parentId)) draggingMap.set(parentId, false);
  if(!animationMap.has(parentId)) animationMap.set(parentId, false);
  if(!lockedMap.has(parentId)) lockedMap.set(parentId, false);
}

function notify (nodeId: string, event: string, payload?: any) {
  const set = listeners.get(nodeId);
  if(!set) return;
  for(const cb of Array.from(set)) {
    try {
      cb({event, payload});
    } catch(err) {
      if(__DEV__) console.error('[Flow] listener error:', err);
    }
  }
}

function safeGetNode (id: string, suppressWarning = false): FlowNode | null {
  const n = flowRegistry.getNode(id);
  if(!n) {
    if(__DEV__ && !suppressWarning) console.warn(`[Flow] Node "${id}" not found in registry.`);
    return null;
  }
  return n;
}

function pushChildOntoStack (parentId: string, childId: string) {
  ensureRuntime(parentId);
  const arr = stackMap.get(parentId)!;
  if(arr[arr.length - 1] !== childId) {
    arr.push(childId);
    stackMap.set(parentId, arr);
  }
  activeMap.set(parentId, childId);
  try {
    flowRegistry.setCurrentChild(parentId, childId);
  } catch(e) { }
  notify(parentId, 'stack:push', {childId, stack: [...arr]});
  // Force global re-render since FlowNavigator subscribes to registry
  flowRegistry.forceUpdate();
}

function popChildFromStack (parentId: string): string | null {
  ensureRuntime(parentId);
  const arr = stackMap.get(parentId)!;
  if(arr.length === 0) return null;
  const popped = arr.pop()!;
  const newActive = arr.length > 0 ? arr[arr.length - 1] : null;
  activeMap.set(parentId, newActive);
  try {
    flowRegistry.setCurrentChild(parentId, newActive);
  } catch(e) { }
  notify(parentId, 'stack:pop', {popped, newActive});
  // Force global re-render since FlowNavigator subscribes to registry
  flowRegistry.forceUpdate();
  return popped;
}

function getCurrentActiveChildId (parentId: string): string | null {
  return activeMap.get(parentId) ?? null;
}

/* -------------------- Lifecycle Runners -------------------- */

async function runOnSwitching (
  childNode: FlowNode,
  direction: 'forward' | 'backward',
  timeoutMs: number,
) {
  if(!childNode.props?.onSwitching) return true;
  return runWithTimeout(
    () => childNode.props.onSwitching!(direction),
    timeoutMs,
    false,
  );
}

async function runOnOpen (
  childNode: FlowNode,
  ctx: {from: string; opener?: string;},
  timeoutMs: number,
) {
  if(!childNode.props?.onOpen) return true;
  return runWithTimeout(
    () => childNode.props.onOpen!(ctx),
    timeoutMs,
    false,
  );
}

/**
 * Universal restriction check - validates restrictions at ALL levels.
 * Checks Pack, Parent, FC, and Modal levels for isRestrictedIn/Out.
 * Only called during NAVIGATION, not registration.
 * @param parentName - The parent flow ID
 * @param childName - The target child name
 * @param direction - 'in' for entering, 'out' for leaving
 * @returns Object with allowed flag, title, and message
 */
function checkRestrictions(
  parentName: string,
  childName: string,
  direction: 'in' | 'out' = 'in'
): {allowed: boolean; title: string; message: string} {
  const restrictionProp = direction === 'in' ? 'isRestrictedIn' : 'isRestrictedOut';
  
  // Helper to parse restriction value (string or {title?, message?})
  const parseRestriction = (value: any, defaultTitle: string, defaultMsg: string) => {
    if(typeof value === 'string') {
      return {title: defaultTitle, message: value};
    }
    if(typeof value === 'object' && value !== null) {
      return {
        title: value.title || defaultTitle,
        message: value.message || defaultMsg,
      };
    }
    return {title: defaultTitle, message: defaultMsg};
  };
  
  // 1. Check Pack level (walk up the hierarchy)
  const parentChain = flowRegistry.getParentChain(parentName);
  const pack = parentChain.find(n => n.type === 'pack');
  if(pack?.props?.[restrictionProp]) {
    const {title, message} = parseRestriction(
      pack.props[restrictionProp],
      'Restricted',
      direction === 'in' ? 'Access to this flow is restricted.' : 'You cannot leave this flow.'
    );
    return {allowed: false, title, message};
  }

  // 2. Check Parent level
  const parent = flowRegistry.getNode(parentName);
  if(parent?.props?.[restrictionProp]) {
    const {title, message} = parseRestriction(
      parent.props[restrictionProp],
      'Restricted',
      direction === 'in' ? 'Access to this page is restricted.' : 'You cannot leave this page.'
    );
    return {allowed: false, title, message};
  }

  // 3. Check FC/Child level (target for 'in', current for 'out')
  if(direction === 'in') {
    const child = flowRegistry.getChildByName(parentName, childName);
    if(child?.props?.isRestrictedIn) {
      const {title, message} = parseRestriction(
        child.props.isRestrictedIn,
        'Restricted',
        'Access to this step is restricted.'
      );
      return {allowed: false, title, message};
    }
    
    // Also check if child's parent is a modal with restrictions
    if(child?.parentId) {
      const childParent = flowRegistry.getNode(child.parentId);
      if(childParent?.type === 'modal' && childParent?.props?.isRestrictedIn) {
        const {title, message} = parseRestriction(
          childParent.props.isRestrictedIn,
          'Restricted',
          'Access to this modal is restricted.'
        );
        return {allowed: false, title, message};
      }
    }
  }
  
  // 4. Check current child for 'out' direction
  if(direction === 'out') {
    const child = flowRegistry.getChildByName(parentName, childName);
    if(child?.props?.isRestrictedOut) {
      const {title, message} = parseRestriction(
        child.props.isRestrictedOut,
        'Restricted',
        'You cannot leave this screen.'
      );
      return {allowed: false, title, message};
    }
  }

  return {allowed: true, title: '', message: ''};
}

function cleanupAndUnregister (
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
  if(unregisterFlag) flowRegistry.unregisterNode(parentId);
}

async function handleAtEnd (parentNode: FlowNode, opts?: FlowCreateOptions) {
  const atEnd: AtEndConfig = parentNode.props?.atEnd;
  const lifecycleTimeoutMs = opts?.lifecycleTimeoutMs ?? 8000;

  let didSomething = false;

  if(parentNode.props?.isRestrictedOut) {
    notify(parentNode.id, 'atEnd:blocked:restrictedOut', null);
    return false;
  }

  if(!atEnd) return false;

  if(typeof atEnd.endWith === 'function') {
    try {
      const res = await Promise.resolve(
        atEnd.endWith({parentNode, flowRegistry, lifecycleTimeoutMs}),
      );
      if(res && res.dismount) {
        cleanupAndUnregister(
          parentNode.id,
          !!atEnd.cleanUp,
          !!atEnd.resetState,
        );
      }
      return true;
    } catch(err) {
      if(__DEV__) console.warn('[Flow] atEnd function threw', err);
      return false;
    }
  }

  const mode = atEnd.endWith;
  switch(mode) {
    case 'parent': {
      const pParentId = parentNode.parentId;
      if(!pParentId) {
        if(atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
        notify(parentNode.id, 'atEnd:no-parent', null);
        return true;
      }
      notify(parentNode.id, 'atEnd:parent', {toParent: pParentId});
      didSomething = true;

      if(atEnd.cleanUp)
        cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      return true;
    }
    case 'self': {
      const children = flowRegistry.getChildren(parentNode.id);
      if(children && children.length > 0) {
        stackMap.set(parentNode.id, []);
        activeMap.set(parentNode.id, children[0].id);
        notify(parentNode.id, 'atEnd:self:reset', {to: children[0].id});
        if(atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      }
      return true;
    }
    case 'element': {
      const el = atEnd.element;
      if(!el) {
        notify(parentNode.id, 'atEnd:element:missing', null);
        if(atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
        return true;
      }
      notify(parentNode.id, 'atEnd:element', {element: el});
      if(atEnd.cleanUp)
        cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      return true;
    }
    default: {
      notify(parentNode.id, 'atEnd:unknown', {atEnd});
      if(atEnd.cleanUp)
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
export async function open (
  parentName: string,
  childName: string,
  opener?: string,
  opts: FlowCreateOptions = {},
) {
  const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
  if(!parentName || !childName) return false;

  const parent = flowRegistry.getNode(parentName);
  if(!parent) return false;

  // Try to find child by name within this parent
  let child = flowRegistry.getChildByName(parentName, childName);

  // Fallback: try constructing ID if not found by name
  if(!child) {
    const childId = parentName + '.' + childName;
    child = safeGetNode(childId, true); // Suppress warning
  }

  if(!child) {
    // Last resort: maybe childName IS the ID?
    child = safeGetNode(childName, true); // Suppress warning
  }

  if(!child) {
    // Now we can warn if we really didn't find it
    if(__DEV__) console.warn(`[Flow] Node "${childName}" not found in registry (checked name, ID, and direct ID).`);
    return false;
  }

  ensureRuntime(parentName);

  // FIRST: Universal restriction check at ALL levels (Pack/Parent/FC/Modal)
  const restrictionIn = checkRestrictions(parentName, childName, 'in');
  if(!restrictionIn.allowed) {
    Alert.alert(restrictionIn.title, restrictionIn.message);
    return false;
  }

  // Check isRestrictedOut on CURRENT node before leaving
  const currentId = getCurrentActiveChildId(parentName);
  const currentNode = currentId ? safeGetNode(currentId) : null;

  if(currentNode && currentNode.id !== child.id) {
    const restrictionOut = checkRestrictions(parentName, currentNode.name, 'out');
    if(!restrictionOut.allowed) {
      Alert.alert(restrictionOut.title, restrictionOut.message);
      return false;
    }
  }

  if(lockedMap.get(parentName)) return false;

  try {
    if(currentNode && currentNode.id !== child.id) {
      switchingMap.set(parentName, true);
      notify(parentName, 'switching:start', {from: currentNode.id, to: child.id});
      const ok = await runOnSwitching(currentNode, 'forward', lifecycleTimeoutMs);
      switchingMap.set(parentName, false);
      if(!ok) return false;
    }

    // --- SMART TAB / GLOBAL NAVIGATION Check ---
    // If the child belongs to a different parent (e.g. cross-pack navigation)
    // We must delegate to the correct parent logic.
    if(child.parentId && child.parentId !== parentName) {
      // Check if we need to switch root or just open in that parent?
      // If the child's parent is a Pack (or descendant of one), we might need to switch root.
      if(__DEV__) console.log(`[FlowRuntime] Cross-parent navigation detected. Delegating to parent: ${child.parentId}`);

      // If we are replacing, we can't easily replace across stacks. We just ignore replace or treat as open?
      // Let's just open the target.
      // We also need to ensure the target parent is visible (Switch Root if needed).

      const rootOfTarget = flowRegistry.getParentChain(child.id).find(n => n.type === 'pack');
      if(rootOfTarget && rootOfTarget.id !== getActiveRoot()) {
        switchRoot(rootOfTarget.id);
      }

      // Now call open recursively on the correct parent
      return open(child.parentId, child.name, opener, opts);
    }
    // -------------------------------------------

    openingMap.set(parentName, true);
    notify(parentName, 'opening:start', {to: child.id, from: currentNode?.id ?? null});
    const okOpen = await runOnOpen(child, {from: 'parent', opener}, lifecycleTimeoutMs);
    openingMap.set(parentName, false);
    if(!okOpen) return false;

    // REPLACE Logic
    if(opts?.replace) {
      // Pop current active from history and stack
      flowNavigationHistory.pop(parentName);
      popChildFromStack(parentName);
    }

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
export async function close (parentName: string) {
  if(!parentName) return false;
  const parent = flowRegistry.getNode(parentName);
  if(!parent) return false;

  ensureRuntime(parentName);

  // Check isRestrictedOut on current active child using universal check
  const currentId = getCurrentActiveChildId(parentName);
  if(currentId) {
    const currentNode = safeGetNode(currentId);
    if(currentNode) {
      const restrictionOut = checkRestrictions(parentName, currentNode.name, 'out');
      if(!restrictionOut.allowed) {
        Alert.alert(restrictionOut.title, restrictionOut.message);
        return false;
      }
    }
  }

  // 2. Determine visibility from hideTab logic
  // If target is modal or has hideTab=true, we close the tab.
  // Otherwise we open it (unless it was explicitly closed? No, user wants state driven by page)

  // Find the pack that controls the tab (closest Pack ancestor)
  if(currentId) {
    const currentNode = safeGetNode(currentId);
    const packNode = flowRegistry.getParentChain(currentNode?.id as string).find(n => n.type === 'pack');
    if(packNode) {
      const shouldHide =
        (currentNode?.props?.hideTab) ||
        (currentNode?.props?.modal) ||
        (currentNode?.type === 'child' && flowRegistry.getNode(currentNode?.parentId!)?.type === 'modal');

      if(shouldHide) {
        flowRegistry.setTabVisibility(packNode.id, false);
      } else {
        flowRegistry.setTabVisibility(packNode.id, true);
      }
    }
  }


  // Check isRestrictedOut on current active child
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
 * Manually opens the tab bar for a specific pack (or finds the nearest tab parent).
 * @param {string} [packId] - The ID of the pack. If omitted, finds nearest tab parent from active child.
 */
export function openTab(packId?: string) {
  let target = packId;
  
  if (!target) {
    const rootId = getActiveRoot();
    if (rootId) {
      const activeChildId = activeMap.get(rootId);
      if (activeChildId) {
        const chain = flowRegistry.getParentChain(activeChildId);
        const tabParent = chain.find(n => n.props?.navType === 'tab');
        target = tabParent?.id || rootId;
      } else {
        target = rootId;
      }
    }
  }
  
  if (target) {
    flowRegistry.setTabVisibility(target, true);
  }
}

/**
 * Manually closes the tab bar for a specific pack (or finds the nearest tab parent).
 * @param {string} [packId] - The ID of the pack. If omitted, finds nearest tab parent from active child.
 */
export function closeTab(packId?: string) {
  let target = packId;
  
  if (!target) {
    // Find the nearest parent with navType='tab'
    const rootId = getActiveRoot();
    if (rootId) {
      const activeChildId = activeMap.get(rootId);
      if (activeChildId) {
        const chain = flowRegistry.getParentChain(activeChildId);
        const tabParent = chain.find(n => n.props?.navType === 'tab');
        target = tabParent?.id || rootId;
      } else {
        target = rootId;
      }
    }
  }
  
  if (target) {
    flowRegistry.setTabVisibility(target, false);
  }
}

/**
 * Manually opens the drawer for a specific pack (or finds the nearest drawer parent).
 * @param {string} [packId] - The ID of the pack. If omitted, finds nearest drawer parent from active child.
 */
export function openDrawer(packId?: string) {
  let target = packId;
  
  if (!target) {
    // Find the nearest parent with navType='drawer'
    const rootId = getActiveRoot();
    if (rootId) {
      const activeChildId = activeMap.get(rootId);
      if (activeChildId) {
        const chain = flowRegistry.getParentChain(activeChildId);
        const drawerParent = chain.find(n => n.props?.navType === 'drawer');
        target = drawerParent?.id || rootId;
      } else {
        target = rootId;
      }
    }
  }
  
  if (target) {
    flowRegistry.setDrawerVisibility(target, true);
  }
}

/**
 * Manually closes the drawer for a specific pack (or finds the nearest drawer parent).
 * @param {string} [packId] - The ID of the pack. If omitted, finds nearest drawer parent from active child.
 */
export function closeDrawer(packId?: string) {
  let target = packId;
  
  if (!target) {
    // Find the nearest parent with navType='drawer'
    const rootId = getActiveRoot();
    if (rootId) {
      const activeChildId = activeMap.get(rootId);
      if (activeChildId) {
        const chain = flowRegistry.getParentChain(activeChildId);
        const drawerParent = chain.find(n => n.props?.navType === 'drawer');
        target = drawerParent?.id || rootId;
      } else {
        target = rootId;
      }
    }
  }
  
  if (target) {
    flowRegistry.setDrawerVisibility(target, false);
  }
}

/**
 * Navigates to the next sibling flow.
 * 
 * @param {string} [parentName] - The parent flow ID. If omitted, infers from context.
 * @param {FlowCreateOptions} [opts] - Options for navigation.
 * @returns {Promise<boolean>} True if successful.
 */
export async function next (
  parentName?: string | null,
  opts: FlowCreateOptions = {},
): Promise<boolean> {
  const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
  const inferredParent = inferParent(parentName);
  if(!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if(!parent) return false;

  const children = flowRegistry.getChildren(parentName);
  if(!children || children.length === 0) {
    if(parent.parentId) return next(parent.parentId, opts);
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

    // Find next unrestricted node
    // We loop from nextIdx until we find one or run out
    let targetNode: FlowNode | null = null;
    let targetIdx = nextIdx;

    while(targetIdx < children.length) {
      const candidate = children[targetIdx];
      // Check restriction
      if(!candidate.props?.isRestrictedIn) {
        targetNode = candidate;
        break;
      }
      // If restricted, we skip it
      // Check if it has a redirect/fallback logic? User said: "run a next... if it's the last child, go to the first child and down"
      // Basically skip. 
      targetIdx++;
    }

    if(!targetNode) {
      // We ran off the end.
      // Handle atEnd or Wrap check
      const handled = await handleAtEnd(parent, opts);
      if(handled) return true;

      // Explicit wrapping logic requested by user: "if it's the last child, go to the first child and down"
      // If handleAtEnd didn't handle it (returned false), we wrap?
      // Usually handleAtEnd defaults to false.
      // Let's implement wrap-around for restricted skip SEARCH from step 0?
      // User said: "if it's the last child, go to the first child and down"
      // This implies if we hit end, we start from 0.

      // Let's try to find an unrestricted node from 0 to idx
      let wrapIdx = 0;
      while(wrapIdx <= idx) { // Don't go past current? Or just find *any*? Usually just scan from 0.
        const candidate = children[wrapIdx];
        if(!candidate.props?.isRestrictedIn) {
          // We found one at the start!
          // But wait, are we allowed to wrap? 
          // If 'atEnd' didn't fire (return true), maybe we shouldn't?
          // The user requirement seems strong on "go to first child".

          // We'll call open on it.
          return open(parentName, candidate.name, undefined, opts);
        }
        wrapIdx++;
      }

      if(parent.parentId) return next(parent.parentId, opts);
      return false;
    }

    const currNode = safeGetNode(currId) as any;
    const nextNode = targetNode;

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
export async function prev (
  parentName?: string | null,
  opts: FlowCreateOptions = {},
): Promise<boolean> {
  const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
  const inferredParent = inferParent(parentName);
  if(!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if(!parent) return false;

  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  // Check isRestrictedOut on current active child using universal check
  const currentId = getCurrentActiveChildId(parentName);
  if(currentId) {
    const currentNode = safeGetNode(currentId);
    if(currentNode) {
      const restrictionOut = checkRestrictions(parentName, currentNode.name, 'out');
      if(!restrictionOut.allowed) {
        Alert.alert(restrictionOut.title, restrictionOut.message);
        lockedMap.set(parentName, false); // Unlock before returning
        return false;
      }
    }
  }

  try {
    const currId = getCurrentActiveChildId(parentName);
    if(!currId) return false;

    const currNode = safeGetNode(currId);
    if(!currNode) return false;

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
export async function goTo (parentName: string, ...pathSegments: string[]) {
  if(!parentName || !pathSegments.length) return false;
  const inferredParent = inferParent(parentName);
  if(!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if(!parent) return false;

  if(lockedMap.get(parentName)) return false;
  lockedMap.set(parentName, true);

  try {
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
      if(currNode) {
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
export function getActive (parentName: string) {
  if(!parentName) return null;
  const activeId = getCurrentActiveChildId(parentName);
  if(!activeId) return null;
  return safeGetNode(activeId);
}

/**
 * Gets the current runtime flags for a parent flow.
 * @param {string} parentName - The parent flow ID.
 * @returns {object} Object containing flags: opening, switching, dragging, animating.
 */
export function getFlags (parentName: string) {
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
export function onChange (parentName: string, cb: (...args: any[]) => void) {
  if(!parentName || typeof cb !== 'function') return () => { };
  const set = listeners.get(parentName) || new Set();
  set.add(cb);
  listeners.set(parentName, set);
  return () => {
    const s = listeners.get(parentName);
    if(s) {
      s.delete(cb);
      if(s.size === 0) listeners.delete(parentName);
    }
  };
}

/**
 * Gets the parent ID (mom) of a given child.
 * @param {string} childId - The child ID.
 * @returns {string | null} The parent ID, or null if not found.
 */
export function getMom (childId: string): string | null {
  return flowRegistry.getMom(childId) ?? null;
}

/**
 * Updates the drag position for a parent flow.
 * @param {string} parentName - The parent flow ID.
 * @param {number} pos - The current drag position.
 */
export function onDragUpdate (parentName: string, pos: number) {
  ensureRuntime(parentName);
  draggingMap.set(parentName, true);
  const activeId = getCurrentActiveChildId(parentName);
  if(activeId) {
    const node = safeGetNode(activeId);
    try {
      node?.props?.onDrag?.(pos);
    } catch(err) { }
  }
  notify(parentName, 'drag', {pos});
}

/**
 * Handles the end of a drag gesture.
 * @param {string} parentName - The parent flow ID.
 */
export function onDragEnd (parentName: string) {
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
  notify(parentName, 'animating', {isAnimating});
}

/**
 * Hook to access the Flow Runtime API.
 * Provides methods for navigation, state access, and event handling.
 */
export function useFlowRuntime () {
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