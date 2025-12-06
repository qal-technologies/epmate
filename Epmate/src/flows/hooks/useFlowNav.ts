import React from 'react';
import {useFlowContext} from '../core/FlowContext';
import {next, prev, open, close, goTo, switchRoot} from '../core/FlowRuntime';
import {FlowCreateOptions} from '../types';

/**
 * @hook useFlowNav
 * @description
 * A hook that provides a comprehensive navigation API for the current flow scope.
 * It allows you to control flow progression, open/close children, and perform deep navigation.
 *
 * @param {string} [scope] - The ID of the flow scope to control. 
 *   - If omitted, it auto-detects the current `Flow.Parent` or `Flow.FC` scope.
 * @returns {object} An object containing navigation functions.
 * 
 * @example
 * ```tsx
 * const { next, prev, open, close } = useFlowNav();
 * 
 * // Go to next step
 * next();
 * 
 * // Open a specific child
 * open('Details');
 * ```
 */
export function useFlowNav (scope?: string) {
  const context = useFlowContext();

  // Auto-detect scope if not provided
  const targetScope = scope || context.parentId || context.flowId;

  // Return functions directly - don't call them until user invokes

  const nextFn = React.useCallback((opts?: FlowCreateOptions) => {
    if(!targetScope) {
      // if(__DEV__) console.warn('[useFlowNav.next] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return next(targetScope, opts);
  }, [targetScope]);

  const prevFn = React.useCallback((opts?: FlowCreateOptions) => {
    if(!targetScope) {
      // if(__DEV__) console.warn('[useFlowNav.prev] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return prev(targetScope, opts);
  }, [targetScope]);


  const openFn = React.useCallback((childName: string, opener?: string, opts?: FlowCreateOptions) => {
    if(!targetScope) {
      // if(__DEV__) console.warn('[useFlowNav.open] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return open(targetScope, childName, opener, opts);
  }, [targetScope]);


  const closeFn = React.useCallback(() => {
    if(!targetScope) {
      // if(__DEV__) console.warn('[useFlowNav.close] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return close(targetScope);
  }, [targetScope]);


  const goToFn = React.useCallback((...pathSegments: string[]) => {
    if(!targetScope) {
      // if(__DEV__) console.warn('[useFlowNav.goTo] No scope available. Provide scope explicitly or ensure component is wrapped in FlowProvider.');
      return Promise.resolve(false);
    }
    return goTo(targetScope, ...pathSegments);
  }, [targetScope]);

  const switchRootFn = React.useCallback((rootId: string) => {
    switchRoot(rootId);
  }, []);

  return {

    /**
     * Navigates to the next step in the current flow.
     * 
     * @param {FlowCreateOptions} [opts] - Optional configuration for the next step.
     * @returns {Promise<boolean>} Resolves to `true` if navigation was successful, `false` otherwise.
     * 
     * @example
     * ```tsx
     * // Simple next
     * await next();
     * 
     * // Next with params
     * await next({ params: { id: 123 } });
     * ```
     */
    next: nextFn,


    /**
     * Navigates to the previous step in the current flow.
     * 
     * @param {FlowCreateOptions} [opts] - Optional configuration for the previous step.
     * @returns {Promise<boolean>} Resolves to `true` if navigation was successful, `false` otherwise.
     * 
     * @example
     * ```tsx
     * await prev();
     * ```
     */
    prev: prevFn,

    /**
     * Opens a specific child flow or step by name.
     * 
     * @param {string} childName - The name of the child to open.
     * @param {string} [opener] - The ID of the component initiating the open action (optional).
     * @param {FlowCreateOptions} [opts] - Optional configuration for the new step.
     * @returns {Promise<boolean>} Resolves to `true` if the child was successfully opened.
     * 
     * @example
     * ```tsx
     * open('Settings');
     * open('Profile', 'HomeButton', { params: { userId: 1 } });
     * ```
     */
    open: openFn,

    /**
     * Closes the current flow or step.
     * 
     * @returns {Promise<boolean>} Resolves to `true` if the flow was successfully closed.
     * 
     * @example
     * ```tsx
     * close();
     * ```
     */
    close: closeFn,

    /**
     * Navigates to a specific path within the flow hierarchy.
     * Supports dot notation for deep linking.
     * 
     * @param {...string[]} pathSegments - The segments of the path to navigate to (e.g., 'Parent', 'Child').
     * @returns {Promise<boolean>} Resolves to `true` if navigation was successful.
     * 
     * @example
     * ```tsx
     * // Navigate to a sibling
     * goTo('SiblingFlow');
     * 
     * // Deep link
     * goTo('MainPack.SettingsFlow.Privacy');
     * ```
     */
    goTo: goToFn,

    /**
     * Switches the active root flow (e.g., from Auth to Main).
     * 
     * @param {string} rootId - The ID of the root flow to switch to.
     * 
     * @example
     * ```tsx
     * switchRoot('MainPack');
     * ```
     */
    switchRoot: switchRootFn,
  };
}
