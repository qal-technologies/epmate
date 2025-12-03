import { flowRegistry, FlowNode } from './FlowRegistry';
import {FlowState as FlowStateType, SetStateOptions, FlowStateValue, FlowCreateOptions, AtEndConfig} from '../types';
import { makeId, inferParent, runWithTimeout } from '../utils';
import {clear as clearState} from './state/FlowStateManager';
import './state/FlowStorage'; // Register MMKV adapter

/* ---------------- runtime maps ----------------- */
const stackMap: Map<string, string[]> = new Map();
const activeMap: Map<string, string | null> = new Map();
const openingMap: Map<string, boolean> = new Map();
const switchingMap: Map<string, boolean> = new Map();
const draggingMap: Map<string, boolean> = new Map();
const animationMap: Map<string, boolean> = new Map();
const lockedMap: Map<string, boolean> = new Map();
const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

/* -------------------- Internal helpers -------------------- */

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

function safeGetNode(id: string): FlowNode | null {
  const n = flowRegistry.getNode(id);
  if (!n) {
    if (__DEV__) console.warn(`[Flow] Node "${id}" not found in registry.`);
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
  
  const childId = parentName + '.' + childName;
  const child = safeGetNode(childId);
  if (!child) return false;

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

    const currNode = safeGetNode(currId)!;
    const nextNode = children[nextIdx];

    switchingMap.set(parentName, true);
    const okSwitch = await runOnSwitching(currNode, 'forward', lifecycleTimeoutMs);
    switchingMap.set(parentName, false);
    if(!okSwitch) return false;

    openingMap.set(parentName, true);
    const okOpen = await runOnOpen(nextNode, {from: 'sibling', opener: currId}, lifecycleTimeoutMs);
    openingMap.set(parentName, false);
    if(!okOpen) return false;

    pushChildOntoStack(parentName, nextNode.id);
    notify(parentName, 'next', {to: nextNode.id, from: currId});
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

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

    const currNode = safeGetNode(currId)!;

    switchingMap.set(parentName, true);
    const okSwitch = await runOnSwitching(currNode, 'backward', lifecycleTimeoutMs);
    switchingMap.set(parentName, false);
    if(!okSwitch) return false;

    const popped = popChildFromStack(parentName);
    if(!popped) {
      if(parent.parentId) return prev(parent.parentId, opts);
      return false;
    }
    notify(parentName, 'prev', {to: popped, from: currId});
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

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
      const currNode = safeGetNode(current)!;
      switchingMap.set(parentName, true);
      const okSwitch = await runOnSwitching(currNode, 'forward', 8000);
      switchingMap.set(parentName, false);
      if(!okSwitch) return false;
    }

    openingMap.set(parentName, true);
    const okOpen = await runOnOpen(target, {from: 'goTo', opener: current ?? undefined}, 8000);
    openingMap.set(parentName, false);
    if(!okOpen) return false;

    pushChildOntoStack(parentName, target.id);
    notify(parentName, 'goTo', {to: target.id});
    return true;
  } finally {
    lockedMap.set(parentName, false);
  }
}

/* -------------------- Runtime Hook -------------------- */

export function getActive(parentName: string) {
  if (!parentName) return null;
  const activeId = getCurrentActiveChildId(parentName);
  if (!activeId) return null;
  return safeGetNode(activeId);
}

export function getFlags(parentName: string) {
  ensureRuntime(parentName);
  return {
    opening: !!openingMap.get(parentName),
    switching: !!switchingMap.get(parentName),
    dragging: !!draggingMap.get(parentName),
    animating: !!animationMap.get(parentName),
  };
}

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

export function getMom(childId: string): string | null {
  return flowRegistry.getMom(childId) ?? null;
}

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

export function onDragEnd(parentName: string) {
  ensureRuntime(parentName);
  draggingMap.set(parentName, false);
  notify(parentName, 'dragEnd', null);
}

export function notifyAnimationComplete (parentName: string, isAnimating: boolean) {
  ensureRuntime(parentName);
  animationMap.set(parentName, isAnimating);
  notify(parentName, 'animating', { isAnimating });
}

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
  };
}
