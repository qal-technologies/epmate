import React from 'react';
import { useFlowContext } from '../core/FlowContext';
import { next, prev, open, close, goTo } from '../core/FlowRuntime';
import { FlowCreateOptions } from '../types';

export function useFlowNav(scope?: string) {
  const context = useFlowContext();

  // Auto-detect scope if not provided
  const targetScope = scope || context.parentId || context.flowId;

  // Return functions directly - don't call them until user invokes
  const nextFn = React.useCallback((opts?: FlowCreateOptions) => {
    if (!targetScope) {
      if (__DEV__) console.warn('[useFlowNav.next] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return next(targetScope, opts);
  }, [targetScope]);

  const prevFn = React.useCallback((opts?: FlowCreateOptions) => {
    if (!targetScope) {
      if (__DEV__) console.warn('[useFlowNav.prev] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return prev(targetScope, opts);
  }, [targetScope]);

  const openFn = React.useCallback((childName: string, opener?: string, opts?: FlowCreateOptions) => {
    if (!targetScope) {
      if (__DEV__) console.warn('[useFlowNav.open] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return open(targetScope, childName, opener, opts);
  }, [targetScope]);

  const closeFn = React.useCallback(() => {
    if (!targetScope) {
      if (__DEV__) console.warn('[useFlowNav.close] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return close(targetScope);
  }, [targetScope]);

  const goToFn = React.useCallback((...pathSegments: string[]) => {
    if (!targetScope) {
      if (__DEV__) console.warn('[useFlowNav.goTo] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return goTo(targetScope, ...pathSegments);
  }, [targetScope]);

  return {
    next: nextFn,
    prev: prevFn,
    open: openFn,
    close: closeFn,
    goTo: goToFn,
  };
}
