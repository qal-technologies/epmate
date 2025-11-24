// src/flow/hooks/useFlowApi.ts
import { useMemo } from 'react';
import { flowRegistry } from '../../core/FlowRegistry';
import { useFlow as useFlowRuntime } from '../../core/FlowInstance';

/**
 * Types: mirror shapes from your codebase
 * - FlowInjected: the object injected by FlowChildWrapper inside the renderer
 * - FlowChildPublicProps: the props shape for a child (subset)
 */

export type FlowFlags = {
  opening: boolean;
  switching: boolean;
  dragging: boolean;
};

export type FlowInjected = {
  api: ReturnType<typeof useFlowRuntime>;
  parentId: string;
  childId: string;
  flags: FlowFlags;
};

export type FlowChildPublicProps = {
  name: string;
  page?: React.ReactNode;
  size?: 'full' | 'half' | 'bottom';
  draggable?: boolean;
  dismissable?: boolean;
  title?: string;
  noTitle?: boolean;
  canGoBack?: boolean;
  shouldSwitch?: boolean;
  extras?: Record<string, any>;
  background?: string;
  flags: FlowFlags;
  onOpen?: (ctx: {
    from: string;
    opener?: string;
  }) => Promise<boolean> | boolean;
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  onDrag?: (pos: number) => void;
  onClose?: () => void;
};

export type FlowApiNavigation = {
  next: (parent?: string | null) => Promise<any>;
  prev: (parent?: string | null) => Promise<any>;
  goTo: (parent: string | null, ...path: string[]) => Promise<any>;
  open: (pName: string, cName: string, opener?: string) => Promise<any>;
  getMom: (cid?: string) => any;
};

export type UseFlowApiResult = {
  flags: FlowFlags;
  props: FlowChildPublicProps | null;
  nav: FlowApiNavigation;
};

/**
 * useFlowApi
 *
 * Usage:
 * - Child receives `flow` prop injected by FlowChildWrapper (see renderer).
 *
 * Or, if you only have childId (string), call: useFlowApi( 'Auth.Login')
 *
 * Returns typed API + child's declared props + useful helpers.
 */
export function useFlowApi(childIdOverride?: string | null): UseFlowApiResult {
  const runtime = useFlowRuntime();

  // compute final ids (priority: explicit override > injected > registry inference)
  const childId = childIdOverride ?? null;
  const parentId = childId ? flowRegistry.findParentByChild(childId) : null;

  const props = useMemo<FlowChildPublicProps | null>(() => {
    if (!childId) return null;
    const node = flowRegistry.getNode(childId);
    if (!node) return null;

    if (!node.props) node.props = {};

    // keep only public props shape (safe cast)
    const live: FlowChildPublicProps = node.props as FlowChildPublicProps;
    if (!live.flags)
      live.flags = { opening: false, switching: false, dragging: false };

    return live;
  }, [childId]);

  // flags: prefer injected flags (current runtime snapshot) else ask runtime
  const flags: FlowFlags = parentId
    ? runtime.getFlags(parentId)
    : { opening: false, switching: false, dragging: false };

  // helpers
  const next = async (maybeParent?: string | null) => {
    // allow calling next() without parentName; runtime.next will infer
    return runtime.next(maybeParent ?? parentId ?? undefined);
  };

  const prev = async (maybeParent?: string | null) => {
    return runtime.prev(maybeParent ?? parentId ?? undefined);
  };

  const open = async (pName: string, cName: string, opener?: string) => {
    return runtime.open(pName, cName, opener);
  };

  const goTo = async (maybeParent: string | null, ...path: string[]) => {
    return runtime.goTo(maybeParent ?? parentId ?? '', ...path);
  };

  const getMom = (cid?: string) => {
    const id = cid ?? childId;
    if (!id) return null;
    return flowRegistry.getMom(id) ?? null;
  };

  return {
    flags,
    props,
    nav: {
      next,
      prev,
      goTo,
      open,
      getMom,
    },
  };
}
