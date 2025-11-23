// src/flow/core/FlowInstance.tsx
import React from 'react';
import { flowRegistry, FlowNode } from './FlowRegistry';
// import { cleanupFlowState } from './FlowState';

/**
 * FlowInstance.tsx
 *
 * - Provides useFlow().create(type) factory
 * - Exposes runtime navigation helpers
 * - Registers Flow nodes & children into flowRegistry
 *
 * Design notes:
 * - Node id convention: `${parentId ? parentId + "." : ""}${name}`
 * - For top-level flows (no parent) parentId === null and id === name
 * - Runtime stacks are kept in a lightweight Map (non-serializable runtime)
 * - Registry remains the source of truth for structure; runtimeMaps hold transient data (stack, listeners)
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
// stacks, active child, listeners already exist in previous version — improved and with flags
const stackMap: Map<string, string[]> = new Map();
const activeMap: Map<string, string | null> = new Map();
const openingMap: Map<string, boolean> = new Map();
const switchingMap: Map<string, boolean> = new Map();
const draggingMap: Map<string, boolean> = new Map();
const listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

/* -------------------- Internal helpers -------------------- */

function makeId(parentId: string | null, name: string) {
  if (!name || typeof name !== 'string')
    throw new Error('[Flow] Child name must be a non-empty string.');
  return parentId ? `${parentId}.${name}` : name;
}

function safeGetNode(id: string): FlowNode | null {
  const n = flowRegistry.getNode(id);
  if (!n) {
    console.warn(`[Flow] Node "${id}" not found in registry.`);
    return null;
  }
  return n;
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

/* small utility to run async hook with timeout protection */
async function runWithTimeout<T>(
  fn: () => Promise<T> | T,
  timeoutMs: number,
  fallback: T,
): Promise<T> {
  let finished = false;
  return new Promise<T>(resolve => {
    const t = setTimeout(() => {
      if (!finished) {
        finished = true;
        resolve(fallback);
      }
    }, timeoutMs);

    Promise.resolve()
      .then(fn)
      .then(res => {
        if (!finished) {
          finished = true;
          clearTimeout(t);
          resolve(res);
        }
      })
      .catch(err => {
        if (!finished) {
          finished = true;
          clearTimeout(t);
          console.warn('[Flow] hook error', err);
          resolve(fallback);
        }
      });
  });
}

/* -------------------- Navigation primitives -------------------- */

/**
 * pushChildOntoStack(parentId, childId)
 * - ensures stack exists
 * - sets activeMap[parentId] = childId
 * - notifies listeners
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
 * popChildFromStack(parentId)
 * - Pops top of stack; returns new top (or null)
 */

function popChildFromStack(parentId: string) {
  ensureRuntime(parentId);
  const arr = stackMap.get(parentId)!;
  if (arr.length === 0) {
    activeMap.set(parentId, null);
    notify(parentId, 'stack:empty', null);
    return null;
  }
  const popped = arr.pop()!;
  stackMap.set(parentId, arr);

  const top = arr[arr.length - 1] || null;
  activeMap.set(parentId, top);

  try {
    flowRegistry.setCurrentChild(parentId, top);
  } catch (_) {}

  notify(parentId, 'stack:pop', { popped, top, stack: [...arr] });
  return top;
}

/**
 * getCurrentActiveChildId(parentId)
 * - returns activeMap[parentId] if present
 * - else returns children[0] or null
 */
function getCurrentActiveChildId(parentId: string): string | null {
  ensureRuntime(parentId);
  const a = activeMap.get(parentId);
  if (a) return a;
  const children = flowRegistry.getChildren(parentId);
  if (!children || children.length === 0) return null;
  const first = children[0].id;
  activeMap.set(parentId, first);
  return first;
}

/**
 * Infer the parentName when not provided.
 * Strategy:
 *  1. If caller supplies parentName -> use it.
 *  2. Else pick top-most active parent using flowRegistry.findTopParentWithActiveChild()
 *  3. Else fallback to the first top-level registered parent (if any).
 */
function inferParent(parentName?: string | null): string | null {
  if (parentName) return parentName;
  const fromRegistry = flowRegistry.findTopParentWithActiveChild();
  if (fromRegistry) return fromRegistry;
  // fallback: pick first top-level node
  const debug = flowRegistry.debugTree();
  const top = (debug.nodes || []).find((n: any) => n.parentId === null);
  return top ? top.id : null;
}

/* -------------------- Async lifecycle runner -------------------- */

async function runOnSwitching(
  childNode: FlowNode,
  direction: 'forward' | 'backward',
  timeoutMs: number,
) {
  try {
    const cb = childNode.props?.onSwitching;
    if (cb) {
      const res = await runWithTimeout(
        () => Promise.resolve(cb(direction)),
        timeoutMs,
        true,
      );
      return res !== false;
    }
    return true;
  } catch (err) {
    console.warn('[Flow] onSwitching rejected or threw:', err);
    return false;
  }
}

async function runOnOpen(
  childNode: FlowNode,
  ctx: { from: string; opener?: string },
  timeoutMs: number,
) {
  try {
    const cb = childNode.props?.onOpen;
    if (cb) {
      const res = await runWithTimeout(
        () => Promise.resolve(cb(ctx)),
        timeoutMs,
        true,
      );
      return res !== false;
    }
    return true;
  } catch (err) {
    console.warn('[Flow] onOpen rejected or threw:', err);
    return false;
  }
}

function ensureRuntime(parentId: string) {
  if (!stackMap.has(parentId)) stackMap.set(parentId, []);
  if (!activeMap.has(parentId)) activeMap.set(parentId, null);
  if (!openingMap.has(parentId)) openingMap.set(parentId, false);
  if (!switchingMap.has(parentId)) switchingMap.set(parentId, false);
  if (!draggingMap.has(parentId)) draggingMap.set(parentId, false);
}

/* ---------- AtEnd handler ---------- */
async function handleAtEnd(parentNode: FlowNode, opts?: FlowCreateOptions) {
  // parentNode.props might contain atEnd
  const atEnd: AtEndConfig = parentNode.props?.atEnd;
  const lifecycleTimeoutMs = opts?.lifecycleTimeoutMs ?? 8000;

  if (!atEnd) {
    notify(parentNode.id, 'atEnd:none', null);
    return false;
  }

  let didSomething = false;

  // if isRestrictedOut present, block leaving
  if (parentNode.props?.isRestrictedOut) {
    notify(parentNode.id, 'atEnd:blocked:restrictedOut', null);
    return false;
  }

  // support function endWith
  if (typeof atEnd.endWith === 'function') {
    try {
      const res = await Promise.resolve(
        atEnd.endWith({ parentNode, flowRegistry, lifecycleTimeoutMs }),
      );
      if (res && res.dismount) {
        // remove from registry and runtime
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
      // climb to parent and call next() on it (if exists)
      const pParentId = parentNode.parentId;
      if (!pParentId) {
        // no parent — just cleanup or reset based on options
        if (atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
        notify(parentNode.id, 'atEnd:no-parent', null);
        return true;
      }
      // call next on parent parentId via runtime: we will find runtime via exported API later (useFlow())
      // But FlowInstance has no global runtime reference here; we'll notify and let caller runtime handle
      notify(parentNode.id, 'atEnd:parent', { toParent: pParentId });
      didSomething = true;

      // caller (open/next) should then call flow.next(pParentId)
      if (atEnd.cleanUp)
        cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
      return true;
    }
    case 'self': {
      // reset active to first child (keep mounted)
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
      // navigate to external element (element prop can be full id or name)
      const el = atEnd.element;
      if (!el) {
        notify(parentNode.id, 'atEnd:element:missing', null);
        if (atEnd.cleanUp)
          cleanupAndUnregister(parentNode.id, true, !!atEnd.resetState);
        return true;
      }
      // we will notify listeners with target element; actual navigation is up to flow runtime consumer
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
}

/* cleanup utility: remove runtime references and optionally unregister node from registry */
function cleanupAndUnregister(
  parentId: string,
  unregisterFlag: boolean,
  resetStateFlag: boolean,
) {
  // clear runtime maps
  stackMap.delete(parentId);
  activeMap.delete(parentId);
  openingMap.delete(parentId);
  switchingMap.delete(parentId);
  draggingMap.delete(parentId);
  listeners.delete(parentId);

  // clear registry children and node if requested
  if (unregisterFlag) {
    try {
      // cleanupFlowState(parentId);
      flowRegistry.unregisterNode(parentId);
    } catch (err) {
      console.warn('[Flow] cleanup unregister error', err);
    }
  }
  // resetStateFlag integration point: if you integrate with redux/zustand, clear that state here
}

/* -------------------- Flow API implementation -------------------- */

/**
 * FlowRuntime exposes methods that will be returned by useFlow()
 * - create(type): returns Flow component (with Flow.FC)

   * create(type) returns a Flow component you can place in JSX:
   * const Flow = useFlow().create('modal');
   * <Flow name="Auth"><Flow.FC name="Login" .../></Flow>
 * * - runtime helpers (open/close/next/prev/goTo/etc)
*/

export function useFlow() {
  /* create(type) => Flow component factory */
  function create(type: createFlowType = 'page') {
    // parent context lets Flow.FC detect its parent id
    const ParentContext = React.createContext<string | null>(null);

    type FlowCompProps = {
      name: string;
      children?: React.ReactNode;
      shareState?: boolean;
      isRestrictedIn?: boolean;
      isRestrictedOut?: boolean;
      theme?: string;
      lifecycleTimeoutMs?: number;
      atEnd?: AtEndConfig;
    };

    /**
     * FlowComponent registers a parent flow node (top-level id === name).
     * It also provides ParentContext for child Flow.FC to capture parentId easily.
     */
    function FlowComponent({ name, children, ...opts }: FlowCompProps) {
      if (!name || typeof name !== 'string') {
        throw new Error("[Flow] Flow parent must have a valid 'name' prop.");
      }

      // register on mount (id === name)
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
          } else {
            // if exists but type mismatch, warn

            if (exists.type !== type) {
              console.warn(
                `[Flow] Flow "${name}" already exists with type "${exists.type}", requested "${type}".`,
              );

              exists.props = {
                ...(exists.props || {}),
                ...(opts as any),
              };
            }
          }
        } catch (err) {
          console.error('[Flow] register parent error', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [name]);

      return (
        <ParentContext.Provider value={name}>{children}</ParentContext.Provider>
      );
    }

    /**
     * Flow.FC registers a child node under the nearest ParentContext (or explicit parent prop)
     *
     * IDEs will infer props from FlowChildProps type.
     */
    function FlowFC(props: FlowChildProps & { parent?: string }) {
      const contextParent = React.useContext(ParentContext);
      const parentId = props.parent ?? contextParent;

      if (!parentId) {
        throw new Error(
          "[Flow] Flow.FC must be a child of a <Flow name='...'> parent (or supply parent prop).",
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
              type,
              parentId,
              props,
            });
          } else {
            existing.props = { ...(existing.props || {}), ...(props as any) };
          }

          ensureRuntime(parentId);
        } catch (err) {
          console.error('[Flow] register child error', err);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      // Flow.FC does not render anything itself; it describes the page for the Flow engine.
      return null;
    }

    type FlowComponentType = React.FC<FlowCompProps> & {
      FC: React.FC<FlowChildProps & { parent?: string }>;
    };

    // @ts-ignore
    const fc = FlowComponent as FlowComponentType;

    // @ts-ignore
    fc.FC = FlowFC;
    return fc;
  }

  /* ---------------- runtime helpers ---------------- */

  /**
   * open(parentName, childName, opener?)
   *
   * onHover explanation: Opens the named child under the given parent.
   * - Runs current active child's onSwitching('forward') (if exists).
   * - Runs target child's onOpen({from: 'parent'|..., opener})
   * - If either hook returns false (or the hook times out/throws), open is canceled.
   * - Sets runtime flags: switching=true during onSwitching; opening=true during onOpen.
   * - Pushes child onto runtime stack and sets it active on success.
   *
   * Returns boolean success.
   */
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

  /**
   * close(parentName)
   * - Clears the runtime stack for that parent and marks no active child.
   * - Calls onClose for each popped child if present.
   *
   * onHover: Use to reset a flow (close a modal flow entirely).
   */
  async function close(parentName: string) {
    if (!parentName) return false;
    const parent = flowRegistry.getNode(parentName);
    if (!parent) {
      console.warn(`[Flow.close] parent "${parentName}" not registered.`);
      return false;
    }
    ensureRuntime(parentName);
    const stack = stackMap.get(parentName) ?? [];
    // call onClose for items being closed (best-effort)
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

  /**
   * next(parentName)
   * - Navigate to the next sibling under the parent (if any).
   * - Returns false if at end or blocked by lifecycle.
   */
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
      notify(parentName, 'next:at-end', null);

      // If atEnd had no navigation effect (or wasn't present), bubble up to parent parent if exists
      const atEndConfig = parent.props?.atEnd;
      const didNavigateOut = !!(
        atEndConfig &&
        (atEndConfig.endWith || typeof atEndConfig.endWith === 'function')
      );
      if (!didNavigateOut) {
        const upperParentId = parent.parentId;
        if (upperParentId) {
          // call next on the upper parent (auto bubble)
          return next(upperParentId, opts);
        }
      }
      return false;
    }

    const currNode = safeGetNode(currId)!;
    const nextNode = children[nextIdx];

    // switching lifecycle
    switchingMap.set(parentName, true);
    notify(parentName, 'switching:start', { from: currId, to: nextNode.id });
    const okSwitch = await runOnSwitching(
      currNode,
      'forward',
      lifecycleTimeoutMs,
    );
    switchingMap.set(parentName, false);
    if (!okSwitch) return false;

    // opening lifecycle for next
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

  /**
   * prev(parentName)
   * - Navigate backwards in the runtime stack for the given parent.
   * - If stack empty, climbs to nearest registered parent (parent.parentId).
   */
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

    // switching lifecycle backward
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

    // pop stack
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

  /**
   * goTo(parentName, ...pathSegments)
   *
   * onHover notes:
   * - Accepts: goTo('Home', 'History', 'PaymentHistory') or goTo('Home', 'History.PaymentHistory')
   * - Will attempt to resolve the path anywhere under the registry and ensure it's a descendant of the parent.
   * - If the resolved node is not a descendant, it searches globally for a node with matching tail path and tries to re-route.
   */
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

    // normalize into a full id if dotted or segments
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

    if (
      !candidateId.startsWith(parentName + '.') &&
      candidateId !== parentName
    ) {
      const stack: string[] = flowRegistry
        .getChildren(parentName)
        .map(c => c.id);
      let resolved: string | null = null;
      while (stack.length) {
        const nid = stack.shift()!;
        if (nid === candidateId) {
          resolved = nid;
          break;
        }
        const children = flowRegistry.getChildren(nid);
        for (const c of children) stack.push(c.id);
      }
      if (!resolved) {
        console.warn(
          `[Flow.goTo] target "${candidateId}" is not a descendant of "${parentName}". Using global jump.`,
        );
      } else {
        candidateId = resolved;
      }
    }

    const target = safeGetNode(candidateId);
    if (!target) {
      notify(parentName, 'goTo:notfound', pathSegments);
      return false;
    }

    // run lifecycle on current active child (if any) and target onOpen
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

  /**
   * getActive(parentName) -> FlowNode | null
   */
  function getActive(parentName: string) {
    if (!parentName) return null;
    const activeId = getCurrentActiveChildId(parentName);
    if (!activeId) return null;
    return safeGetNode(activeId);
  }

  /**
   * getFlags(parentName) -> { opening, switching, dragging }
   *
   * Helpful for UI: you can call useFlow().getFlags('Auth') to read realtime booleans.
   */
  function getFlags(parentName: string) {
    ensureRuntime(parentName);
    return {
      opening: !!openingMap.get(parentName),
      switching: !!switchingMap.get(parentName),
      dragging: !!draggingMap.get(parentName),
    };
  }

  /**
   * onChange(parentName, cb) -> unsubscribe
   * - onHover: subscribe to flow events such as "open", "close", "stack:push", "switching:start", ...
   */
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

  /**
   * getMom(parentName) -> parentObject
   */
  function getMom(childId: string): string | null {
    return flowRegistry.getMom(childId) ?? null;
  }

  /**
   * onDragUpdate(parentName, pos)
   * - This should be called by the rendering engine when the modal/page is being dragged.
   * - It sets dragging=true while dragging and calls child's onDrag if present.
   */
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

  /**
   * onDragEnd(parentName)
   * - Clears dragging flag and notify listeners
   */
  function onDragEnd(parentName: string) {
    ensureRuntime(parentName);
    draggingMap.set(parentName, false);
    notify(parentName, 'drag:end', null);
  }

  /* debug export for development */
  const __debug = {
    stackMap,
    activeMap,
    openingMap,
    switchingMap,
    draggingMap,
    listeners,
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
    __debug,
  };
}
