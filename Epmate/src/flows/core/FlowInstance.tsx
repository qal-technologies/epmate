// src/flow/core/FlowInstance.tsx
import React from 'react';
import { flowRegistry, FlowNode } from './FlowRegistry';

/**
 * FlowInstance.tsx
 *
 * - Provides useFlow().create() factory for <Flow.Navigator>, <Flow.Page>, <Flow.Modal>
 * - Exposes runtime navigation helpers
 * - Registers Flow nodes & children into flowRegistry
 */

/* -------------------- Types -------------------- */
export type createFlowType = 'modal' | 'page' | 'child';
export type SizeType = 'full' | 'half' | 'bottom';
export type FlowType = 'modal' | 'page';

export type AtEndConfig =
  | {
      endWith: 'parent' | 'self' | 'element' | ((ctx: any) => any);
      element?: string;
      cleanUp?: boolean;
      resetState?: boolean;
    }
  | undefined;

export type FlowChildProps = {
  name: string;
  page: React.ReactNode;
  size?: SizeType;
  draggable?: boolean;
  dismissable?: boolean;
  title?: string;
  noTitle?: boolean;
  canGoBack?: boolean;
  shouldSwitch?: boolean;
  extras?: Record<string, any>;
  background?: string;
  onOpen?: (ctx: {
    from: string;
    opener?: string;
  }) => Promise<boolean> | boolean;
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  onDrag?: (position: number) => void;
  onClose?: () => void;
};

export type FlowCreateOptions = {
  type: FlowType;
  shareState?: boolean;
  isRestrictedIn?: boolean;
  isRestrictedOut?: boolean;
  theme?: string;
  lifecycleTimeoutMs?: number;
  atEnd?: AtEndConfig;
};

/* ---------------- runtime maps ----------------- */
const stackMap: Map<string, string[]> = new Map();
const activeMap: Map<string, string | null> = new Map();
const openingMap: Map<string, boolean> = new Map();
const switchingMap: Map<string, boolean> = new Map();
const draggingMap: Map<string, boolean> = new Map();
const animationMap: Map<string, boolean> = new Map();
const stateMap: Map<string, any> = new Map();
const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

/* -------------------- Internal helpers -------------------- */

/**
 * Creates a unique ID for a node.
 * @param parentId - The ID of the parent node.
 * @param name - The name of the node.
 * @returns The unique ID for the node.
 */
function makeId(parentId: string | null, name: string) {
  if (!name || typeof name !== 'string')
    throw new Error('[Flow] Child name must be a non-empty string.');
  return parentId ? `${parentId}.${name}` : name;
}

/**
 * Safely retrieves a node from the registry.
 * @param id - The ID of the node to retrieve.
 * @returns The node if found, otherwise null.
 */
function safeGetNode(id: string): FlowNode | null {
  const n = flowRegistry.getNode(id);
  if (!n) {
    console.warn(`[Flow] Node "${id}" not found in registry.`);
    return null;
  }
  return n;
}

/**
 * Notifies listeners of an event.
 * @param nodeId - The ID of the node that the event is for.
 * @param event - The name of the event.
 * @param payload - The payload for the event.
 */
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

/**
 * Runs a function with a timeout.
 * @param fn - The function to run.
 * @param timeoutMs - The timeout in milliseconds.
 * @param fallback - The fallback value to return if the function times out.
 * @returns The result of the function or the fallback value.
 */
async function runWithTimeout<T>(
  fn: () => Promise<T> | T,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  return new Promise(async resolve => {
    const timer = setTimeout(() => {
      console.warn(`[Flow] lifecycle function timed out after ${timeoutMs}ms.`);
      resolve(fallback);
    }, timeoutMs);

    try {
      const result = await fn();
      clearTimeout(timer);
      resolve(result);
    } catch (err) {
      console.error('[Flow] lifecycle function error:', err);
      clearTimeout(timer);
      resolve(fallback);
    }
  });
}

/* -------------------- Navigation primitives -------------------- */
/**
 * Pushes a child onto the stack for a parent.
 * @param parentId - The ID of the parent.
 * @param childId - The ID of the child to push.
 */
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

/**
 * Pops a child from the stack for a parent.
 * @param parentId - The ID of the parent.
 * @returns The ID of the popped child, or null if the stack was empty.
 */
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

/**
 * Gets the ID of the currently active child for a parent.
 * @param parentId - The ID of the parent.
 * @returns The ID of the active child, or null if there is no active child.
 */
function getCurrentActiveChildId(parentId: string): string | null {
  return activeMap.get(parentId) ?? null;
}

/**
 * Infers the parent of a node.
 * @param parentName - The name of the parent to infer.
 * @returns The ID of the inferred parent, or null if it could not be inferred.
 */
function inferParent(parentName?: string | null): string | null {
  if (parentName) return parentName;
  // This is a placeholder for more sophisticated parent inference logic.
  // For now, we assume that if no parent is specified, it's a root-level operation.
  return null;
}

/* -------------------- Async lifecycle runner -------------------- */
/**
 * Runs the onSwitching lifecycle hook for a node.
 * @param childNode - The node to run the hook for.
 * @param direction - The direction of the switch.
 * @param timeoutMs - The timeout in milliseconds.
 * @returns A boolean indicating whether the switch is allowed.
 */
async function runOnSwitching(
  childNode: FlowNode,
  direction: 'forward' | 'backward',
  timeoutMs: number,
) {
  // ... implementation unchanged
}

/**
 * Runs the onOpen lifecycle hook for a node.
 * @param childNode - The node to run the hook for.
 * @param ctx - The context for the hook.
 * @param timeoutMs - The timeout in milliseconds.
 * @returns A boolean indicating whether the open is allowed.
 */
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

/**
 * Ensures that the runtime state for a parent exists.
 * @param parentId - The ID of the parent.
 */
function ensureRuntime(parentId: string) {
  if (!stackMap.has(parentId)) stackMap.set(parentId, []);
  if (!activeMap.has(parentId)) activeMap.set(parentId, null);
  if (!openingMap.has(parentId)) openingMap.set(parentId, false);
  if (!switchingMap.has(parentId)) switchingMap.set(parentId, false);
  if (!draggingMap.has(parentId)) draggingMap.set(parentId, false);
  if (!animationMap.has(parentId)) animationMap.set(parentId, false);
  if (!stateMap.has(parentId)) stateMap.set(parentId, {});
}

/* ---------- AtEnd handler ---------- */
/**
 * Handles the atEnd condition for a flow.
 * @param parentNode - The parent node of the flow.
 * @param opts - The options for the flow.
 * @returns A boolean indicating whether the atEnd condition was handled.
 */
async function handleAtEnd(parentNode: FlowNode, opts?: FlowCreateOptions) {
  const cfg = opts?.atEnd;
  if (!cfg) return false;

  switch (cfg.endWith) {
    case 'parent':
      if (parentNode.parentId) {
        await next(parentNode.parentId, opts);
      }
      break;
    case 'self':
      await close(parentNode.id);
      break;
    case 'element':
      if (cfg.element) {
        await goTo(parentNode.id, cfg.element);
      }
      break;
    case 'function':
      if (typeof cfg.endWith === 'function') {
        cfg.endWith({});
      }
      break;
  }

  if (cfg.cleanUp) {
    cleanupAndUnregister(parentNode.id, true, !!cfg.resetState);
  }
  return true;
}

/**
 * Cleans up and unregisters a flow.
 * @param parentId - The ID of the parent to clean up.
 * @param unregisterFlag - A boolean indicating whether to unregister the flow.
 * @param resetStateFlag - A boolean indicating whether to reset the state of the flow.
 */
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

/* -------------------- Flow API implementation -------------------- */

export function useFlow() {
  function create() {
    const ParentContext = React.createContext<string | null>(null);

    const FlowNavigator: React.FC<{ children: React.ReactNode }> = ({
      children,
    }) => {
      // The Navigator is now a simple container. The real rendering logic
      // will be in the renamed FlowRenderer -> FlowNavigator.tsx
      return <>{children}</>;
    };

    function createFlowComponent(
      type: 'page' | 'modal',
    ): React.FC<any> & { FC: React.FC<any> } {
      const FlowComponent: React.FC<any> = ({ name, children, ...opts }) => {
        if (!name || typeof name !== 'string') {
          throw new Error(`[Flow] Flow ${type} must have a valid 'name' prop.`);
        }
        React.useEffect(() => {
          try {
            const exists = flowRegistry.getNode(name);
            if (!exists) {
              flowRegistry.registerNode({
                id: name,
                name,
                type,
                parentId: null,
                props: { ...(opts as any) },
              });
            } else if (exists.type !== type) {
              console.warn(
                `[Flow] Flow "${name}" already exists with type "${exists.type}", requested "${type}".`,
              );
              exists.props = { ...(exists.props || {}), ...(opts as any) };
            }
          } catch (err) {
            console.error(`[Flow] register ${type} error`, err);
          }
        }, [name]);
        return (
          <ParentContext.Provider value={name}>
            {children}
          </ParentContext.Provider>
        );
      };

      const FlowFC: React.FC<FlowChildProps & { parent?: string }> = props => {
        const contextParent = React.useContext(ParentContext);
        const parentId = props.parent ?? contextParent;

        if (!parentId) {
          throw new Error(
            `[Flow.FC] must be a child of a <Flow.${
              type === 'page' ? 'Page' : 'Modal'
            } name='...'> parent.`,
          );
        }

        const id = makeId(parentId, props.name);
        React.useEffect(() => {
          try {
            const existing = flowRegistry.getNode(id);
            if (!existing) {
              flowRegistry.registerNode({
                id,
                name: props.name,
                type: 'child',
                parentId,
                props,
              });
            } else {
              existing.props = { ...(existing.props || {}), ...(props as any) };
            }
            ensureRuntime(parentId);
            const children = flowRegistry.getChildren(parentId);
            if (children.length === 1) {
              pushChildOntoStack(parentId, id);
            }
          } catch (err) {
            console.error('[Flow] register child error', err);
          }
        }, []);

        return null;
      };

      (FlowComponent as any).FC = FlowFC;
      return FlowComponent as any;
    }

    const Flow = {
      Navigator: FlowNavigator,
      Page: createFlowComponent('page'),
      Modal: createFlowComponent('modal'),
    };

    return Flow;
  }

  // ... (navigation functions: open, close, next, prev, goTo remain the same)
  // ... (getters and listeners: getActive, getFlags, onChange, etc. remain the same)
  async function open(
    parentName: string,
    childName: string,
    opener?: string,
    opts: FlowCreateOptions = { type: 'page' },
  ) {
    const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
    if (!parentName || !childName) {
      console.warn('[Flow.open] invalid arguments', parentName, childName);
      return false;
    }
    const parent = flowRegistry.getNode(parentName);
    if (!parent) {
      console.warn(`[Flow.open] parent "${parentName}" not registered.`);
      return false;
    }
    const childId = parentName + '.' + childName;
    const child = safeGetNode(childId);
    if (!child) {
      console.warn(`[Flow.open] child "${childId}" not registered.`);
      return false;
    }

    ensureRuntime(parentName);

    const currentId = getCurrentActiveChildId(parentName);
    const currentNode = currentId ? safeGetNode(currentId) : null;

    try {
      if (currentNode && currentNode.id !== child.id) {
        switchingMap.set(parentName, true);
        notify(parentName, 'switching:start', {
          from: currentNode.id,
          to: child.id,
        });
        const ok = await runOnSwitching(
          currentNode,
          'forward',
          lifecycleTimeoutMs,
        );
        switchingMap.set(parentName, false);
        if (!ok) {
          notify(parentName, 'open:blocked-by-switch', {
            from: currentNode.id,
            to: child.id,
          });
          return false;
        }
      }

      // opening lifecycle on target
      openingMap.set(parentName, true);
      notify(parentName, 'opening:start', {
        to: child.id,
        from: currentNode?.id ?? null,
      });
      const okOpen = await runOnOpen(
        child,
        { from: 'parent', opener },
        lifecycleTimeoutMs,
      );
      openingMap.set(parentName, false);
      if (!okOpen) {
        notify(parentName, 'open:blocked-by-open', { to: child.id });
        return false;
      }

      // success: push onto stack
      pushChildOntoStack(parentName, child.id);
      notify(parentName, 'open', {
        to: child.id,
        from: currentNode?.id ?? null,
      });
      return true;
    } catch (err) {
      switchingMap.set(parentName, false);
      openingMap.set(parentName, false);
      console.error('[Flow.open] unexpected error', err);
      return false;
    }
  }

  async function close(parentName: string) {
    if (!parentName) return false;
    const parent = flowRegistry.getNode(parentName);
    if (!parent) {
      console.warn(`[Flow.close] parent "${parentName}" not registered.`);
      return false;
    }
    ensureRuntime(parentName);
    const stack = stackMap.get(parentName) ?? [];
    for (const childId of [...stack].reverse()) {
      const node = safeGetNode(childId);
      try {
        node?.props?.onClose?.();
      } catch (err) {
        console.warn('[Flow.close] onClose error', err);
      }
    }
    stackMap.set(parentName, []);
    activeMap.set(parentName, null);
    notify(parentName, 'close', null);
    return true;
  }

  async function next(
    parentName?: string | null,
    opts: FlowCreateOptions = { type: 'page' },
  ): Promise<boolean> {
    const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
    const inferredParent = inferParent(parentName);

    if (!inferredParent) {
      console.warn('[Flow.next] could not infer parent.');
      return false;
    }

    parentName = inferredParent;
    const parent = flowRegistry.getNode(parentName);

    if (!parent) {
      console.warn(`[Flow.next] parent "${parentName}" not registered.`);
      return false;
    }
    const children = flowRegistry.getChildren(parentName);
    if (!children || children.length === 0) {
      console.warn(`[Flow.next] parent "${parentName}" has no children.`);
      return false;
    }

    const currId = getCurrentActiveChildId(parentName);
    if (!currId) {
      return open(parentName, children[0].name, undefined, opts);
    }
    const idx = children.findIndex(c => c.id === currId);
    if (idx < 0) return open(parentName, children[0].name, undefined, opts);
    const nextIdx = idx + 1;
    if (nextIdx >= children.length) {
      const handled = await handleAtEnd(parent, opts);
      if (handled) return true;

      // Leap navigation: if at the end of a nested flow, call next() on the parent
      if (parent.parentId) {
        return next(parent.parentId, opts);
      }

      notify(parentName, 'next:at-end', null);
      return false;
    }

    const currNode = safeGetNode(currId)!;
    const nextNode = children[nextIdx];

    switchingMap.set(parentName, true);
    notify(parentName, 'switching:start', { from: currId, to: nextNode.id });
    const okSwitch = await runOnSwitching(
      currNode,
      'forward',
      lifecycleTimeoutMs,
    );
    switchingMap.set(parentName, false);
    if (!okSwitch) return false;

    openingMap.set(parentName, true);
    const okOpen = await runOnOpen(
      nextNode,
      { from: 'sibling', opener: currId },
      lifecycleTimeoutMs,
    );
    openingMap.set(parentName, false);
    if (!okOpen) return false;

    pushChildOntoStack(parentName, nextNode.id);
    notify(parentName, 'next', { to: nextNode.id, from: currId });
    return true;
  }

  async function prev(
    parentName?: string | null,
    opts: FlowCreateOptions = { type: 'page' },
  ): Promise<boolean> {
    const lifecycleTimeoutMs = opts.lifecycleTimeoutMs ?? 8000;
    const inferredParent = inferParent(parentName);

    if (!inferredParent) {
      console.warn('[Flow.prev] could not infer parent.');
      return false;
    }

    parentName = inferredParent;
    const parent = flowRegistry.getNode(parentName);

    if (!parent) {
      console.warn(`[Flow.prev] parent "${parentName}" not registered.`);
      return false;
    }

    const currId = getCurrentActiveChildId(parentName);
    if (!currId) {
      notify(parentName, 'prev:none', null);
      return false;
    }

    const currNode = safeGetNode(currId)!;

    switchingMap.set(parentName, true);
    notify(parentName, 'switching:start', {
      direction: 'backward',
      from: currId,
    });
    const okSwitch = await runOnSwitching(
      currNode,
      'backward',
      lifecycleTimeoutMs,
    );
    switchingMap.set(parentName, false);
    if (!okSwitch) return false;

    const popped = popChildFromStack(parentName);
    if (!popped) {
      if (parent.parentId) {
        notify(parentName, 'prev:climb', { toParent: parent.parentId });
        return prev(parent.parentId, opts);
      } else {
        notify(parentName, 'prev:root', null);
        return false;
      }
    }
    notify(parentName, 'prev', { to: popped, from: currId });
    return true;
  }

  async function goTo(parentName: string, ...pathSegments: string[]) {
    if (!parentName) return false;
    if (!pathSegments || pathSegments.length === 0) {
      console.warn('[Flow.goTo] missing target path segments.');
      return false;
    }
    const inferredParent = inferParent(parentName);
    if (!inferredParent) {
      console.warn('[Flow.goTo] could not infer parent.');
      return false;
    }
    parentName = inferredParent;

    const parent = flowRegistry.getNode(parentName);
    if (!parent) {
      console.warn(`[Flow.goTo] parent "${parentName}" not registered.`);
      return false;
    }
    let candidateId: string | null = null;
    if (pathSegments.length === 1 && pathSegments[0].includes('.')) {
      candidateId = pathSegments[0];
    } else {
      const dotted = pathSegments.join('.');
      const direct = `${parentName}.${dotted}`;
      if (flowRegistry.getNode(direct)) candidateId = direct;
      else if (flowRegistry.getNode(dotted)) candidateId = dotted;
      else {
        const all = flowRegistry.debugTree?.().nodes ?? null;
        const nodes = (all ?? []) as FlowNode[];
        const found = nodes.find(
          n => n.id.endsWith(`.${dotted}`) || n.id === dotted,
        );
        if (found) candidateId = found.id;
      }
    }
    if (!candidateId) {
      notify(parentName, 'goTo:notfound', pathSegments);
      return false;
    }
    const target = safeGetNode(candidateId);
    if (!target) {
      notify(parentName, 'goTo:notfound', pathSegments);
      return false;
    }
    const current = getCurrentActiveChildId(parentName);
    if (current) {
      const currNode = safeGetNode(current)!;
      switchingMap.set(parentName, true);
      const okSwitch = await runOnSwitching(currNode, 'forward', 8000);
      switchingMap.set(parentName, false);
      if (!okSwitch) return false;
    }
    openingMap.set(parentName, true);
    const okOpen = await runOnOpen(
      target,
      { from: 'goTo', opener: current ?? undefined },
      8000,
    );
    openingMap.set(parentName, false);
    if (!okOpen) return false;
    pushChildOntoStack(parentName, target.id);
    notify(parentName, 'goTo', { to: target.id });
    return true;
  }

  function getActive(parentName: string) {
    if (!parentName) return null;
    const activeId = getCurrentActiveChildId(parentName);
    if (!activeId) return null;
    return safeGetNode(activeId);
  }

  function getFlags(parentName: string) {
    ensureRuntime(parentName);
    return {
      opening: !!openingMap.get(parentName),
      switching: !!switchingMap.get(parentName),
      dragging: !!draggingMap.get(parentName),
      animating: !!animationMap.get(parentName),
    };
  }

  function onChange(parentName: string, cb: (...args: any[]) => void) {
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

  function getMom(childId: string): string | null {
    return flowRegistry.getMom(childId) ?? null;
  }

  function onDragUpdate(parentName: string, pos: number) {
    ensureRuntime(parentName);
    draggingMap.set(parentName, true);
    const activeId = getCurrentActiveChildId(parentName);
    if (activeId) {
      const node = safeGetNode(activeId);
      try {
        node?.props?.onDrag?.(pos);
      } catch (err) {
        console.warn('[Flow] onDrag error', err);
      }
    }
    notify(parentName, 'drag', { pos });
  }

  function onDragEnd(parentName: string) {
    ensureRuntime(parentName);
    draggingMap.set(parentName, false);
    notify(parentName, 'drag:end', null);
  }

  function onAnimationComplete(parentName: string, animating: boolean) {
    ensureRuntime(parentName);
    animationMap.set(parentName, animating);
    notify(parentName, 'animation:complete', { animating });
  }

  function getFlowState(parentName: string) {
    const inferredParent = inferParent(parentName);
    if (!inferredParent) {
      console.warn('[Flow.getFlowState] could not infer parent.');
      return {};
    }
    ensureRuntime(inferredParent);
    return stateMap.get(inferredParent);
  }

  function setFlowState(parentName: string, newState: any) {
    const inferredParent = inferParent(parentName);
    if (!inferredParent) {
      console.warn('[Flow.setFlowState] could not infer parent.');
      return;
    }
    ensureRuntime(inferredParent);
    const currentState = stateMap.get(inferredParent) || {};
    const updatedState = { ...currentState, ...newState };
    stateMap.set(inferredParent, updatedState);
    notify(inferredParent, 'state:update', updatedState);
  }

  const __debug = {
    stackMap,
    activeMap,
    openingMap,
    switchingMap,
    draggingMap,
    listeners,
    stateMap,
  };

  return {
    create,
    open,
    close,
    next,
    prev,
    goTo,
    getActive,
    getFlags,
    getMom,
    onChange,
    onDragUpdate,
    onDragEnd,
    onAnimationComplete,
    getFlowState,
    setFlowState,
    __debug,
  };
}
