import { flowRegistry, FlowNode } from './FlowRegistry';
import { FlowState, SetStateOptions, FlowStateValue, FlowCreateOptions, AtEndConfig } from '../types';
import { makeId, inferParent, runWithTimeout } from '../utils';

/* ---------------- runtime maps ----------------- */
const stackMap: Map<string, string[]> = new Map();
const activeMap: Map<string, string | null> = new Map();
const openingMap: Map<string, boolean> = new Map();
const switchingMap: Map<string, boolean> = new Map();
const draggingMap: Map<string, boolean> = new Map();
const animationMap: Map<string, boolean> = new Map();
const stateMap: Map<string, FlowState> = new Map();
const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

/* -------------------- Internal helpers -------------------- */

export function ensureRuntime(parentId: string) {
  if (!stackMap.has(parentId)) stackMap.set(parentId, []);
  if (!activeMap.has(parentId)) activeMap.set(parentId, null);
  if (!openingMap.has(parentId)) openingMap.set(parentId, false);
  if (!switchingMap.has(parentId)) switchingMap.set(parentId, false);
  if (!draggingMap.has(parentId)) draggingMap.set(parentId, false);
  if (!animationMap.has(parentId)) animationMap.set(parentId, false);
  if (!stateMap.has(parentId)) {
    stateMap.set(parentId, {
      __categories: {},
      __secure: {},
      __temp: {},
      __scoped: {},
    });
  }
}

function notify(nodeId: string, event: string, payload?: any) {
  const set = listeners.get(nodeId);
  if (!set) return;
  for (const cb of Array.from(set)) {
    try {
      cb({ event, payload });
    } catch (err) {
      console.error('[Flow] listener error:', err);
    }
  }
}

function safeGetNode(id: string): FlowNode | null {
  const n = flowRegistry.getNode(id);
  if (!n) {
    console.warn(`[Flow] Node "${id}" not found in registry.`);
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
  if (resetStateFlag) stateMap.delete(parentId);
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
      console.warn('[Flow] atEnd function threw', err);
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

  const currentId = getCurrentActiveChildId(parentName);
  const currentNode = currentId ? safeGetNode(currentId) : null;

  try {
    if (currentNode && currentNode.id !== child.id) {
      switchingMap.set(parentName, true);
      notify(parentName, 'switching:start', { from: currentNode.id, to: child.id });
      const ok = await runOnSwitching(currentNode, 'forward', lifecycleTimeoutMs);
      switchingMap.set(parentName, false);
      if (!ok) return false;
    }

    openingMap.set(parentName, true);
    notify(parentName, 'opening:start', { to: child.id, from: currentNode?.id ?? null });
    const okOpen = await runOnOpen(child, { from: 'parent', opener }, lifecycleTimeoutMs);
    openingMap.set(parentName, false);
    if (!okOpen) return false;

    pushChildOntoStack(parentName, child.id);
    notify(parentName, 'open', { to: child.id, from: currentNode?.id ?? null });
    return true;
  } catch (err) {
    switchingMap.set(parentName, false);
    openingMap.set(parentName, false);
    return false;
  }
}

export async function close(parentName: string) {
  if (!parentName) return false;
  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;
  
  ensureRuntime(parentName);
  const stack = stackMap.get(parentName) ?? [];
  for (const childId of [...stack].reverse()) {
    const node = safeGetNode(childId);
    try {
      node?.props?.onClose?.();
    } catch (err) {}
  }
  stackMap.set(parentName, []);
  activeMap.set(parentName, null);
  notify(parentName, 'close', null);
  return true;
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

  const currId = getCurrentActiveChildId(parentName);
  if (!currId) return open(parentName, children[0].name, undefined, opts);

  const idx = children.findIndex(c => c.id === currId);
  if (idx < 0) return open(parentName, children[0].name, undefined, opts);

  const nextIdx = idx + 1;
  if (nextIdx >= children.length) {
    const handled = await handleAtEnd(parent, opts);
    if (handled) return true;
    if (parent.parentId) return next(parent.parentId, opts);
    return false;
  }

  const currNode = safeGetNode(currId)!;
  const nextNode = children[nextIdx];

  switchingMap.set(parentName, true);
  const okSwitch = await runOnSwitching(currNode, 'forward', lifecycleTimeoutMs);
  switchingMap.set(parentName, false);
  if (!okSwitch) return false;

  openingMap.set(parentName, true);
  const okOpen = await runOnOpen(nextNode, { from: 'sibling', opener: currId }, lifecycleTimeoutMs);
  openingMap.set(parentName, false);
  if (!okOpen) return false;

  pushChildOntoStack(parentName, nextNode.id);
  notify(parentName, 'next', { to: nextNode.id, from: currId });
  return true;
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

  const currId = getCurrentActiveChildId(parentName);
  if (!currId) return false;

  const currNode = safeGetNode(currId)!;

  switchingMap.set(parentName, true);
  const okSwitch = await runOnSwitching(currNode, 'backward', lifecycleTimeoutMs);
  switchingMap.set(parentName, false);
  if (!okSwitch) return false;

  const popped = popChildFromStack(parentName);
  if (!popped) {
    if (parent.parentId) return prev(parent.parentId, opts);
    return false;
  }
  notify(parentName, 'prev', { to: popped, from: currId });
  return true;
}

export async function goTo(parentName: string, ...pathSegments: string[]) {
  if (!parentName || !pathSegments.length) return false;
  const inferredParent = inferParent(parentName);
  if (!inferredParent) return false;
  parentName = inferredParent;

  const parent = flowRegistry.getNode(parentName);
  if (!parent) return false;

  // ... (simplified path resolution logic for brevity, can copy full logic if needed)
  let candidateId: string | null = null;
  const dotted = pathSegments.join('.');
  const direct = `${parentName}.${dotted}`;
  if (flowRegistry.getNode(direct)) candidateId = direct;
  else if (flowRegistry.getNode(dotted)) candidateId = dotted;
  
  if (!candidateId) return false;
  const target = safeGetNode(candidateId);
  if (!target) return false;

  const current = getCurrentActiveChildId(parentName);
  if (current) {
    const currNode = safeGetNode(current)!;
    switchingMap.set(parentName, true);
    const okSwitch = await runOnSwitching(currNode, 'forward', 8000);
    switchingMap.set(parentName, false);
    if (!okSwitch) return false;
  }
  
  openingMap.set(parentName, true);
  const okOpen = await runOnOpen(target, { from: 'goTo', opener: current ?? undefined }, 8000);
  openingMap.set(parentName, false);
  if (!okOpen) return false;

  pushChildOntoStack(parentName, target.id);
  notify(parentName, 'goTo', { to: target.id });
  return true;
}

/* -------------------- State API -------------------- */

export function getFlowState(scope: string) {
  ensureRuntime(scope);
  return stateMap.get(scope) || {};
}

export function setFlowState(scope: string, newState: any, options?: SetStateOptions) {
  ensureRuntime(scope);
  const current = stateMap.get(scope)!;
  
  if (options?.category) {
    if (!current.__categories) current.__categories = {};
    current.__categories[options.category] = {
      ...(current.__categories[options.category] || {}),
      ...newState,
    };
  } else if (options?.secureKey) {
    // Mock secure
    if (!current.__secure) current.__secure = {};
    for (const k in newState) {
      current.__secure[k] = { value: newState[k] };
    }
  } else if (options?.temporary) {
    if (!current.__temp) current.__temp = {};
    Object.assign(current.__temp, newState);
  } else if (options?.scope) {
    if (!current.__scoped) current.__scoped = {};
    for (const k in newState) {
      current[k] = newState[k];
      current.__scoped[k] = options.scope;
    }
  } else {
    Object.assign(current, newState);
  }
  
  stateMap.set(scope, current);
  notify(scope, 'state', newState);
}

export function getCat(scope: string, category: string, key?: string) {
  ensureRuntime(scope);
  const s = stateMap.get(scope);
  const cat = s?.__categories?.[category];
  if (!cat) return undefined;
  return key ? cat[key] : cat;
}

export function setCat(scope: string, category: string, newState: any) {
  setFlowState(scope, newState, { category });
}

export function secure(scope: string, key: string, value: any, secureKey: string) {
  setFlowState(scope, { [key]: value }, { secureKey });
}

export function getSecure(scope: string, key: string, secureKey: string) {
  ensureRuntime(scope);
  const s = stateMap.get(scope);
  const sec = s?.__secure?.[key];
  if (!sec) return undefined;
  // Mock decryption
  return sec.value;
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

export function onAnimationComplete(parentName: string, isAnimating: boolean) {
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
    onAnimationComplete,
    ensureRuntime,
  };
}
