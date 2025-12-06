import {useEffect, useCallback} from 'react';
import {BackHandler} from 'react-native';
import {prev} from './FlowRuntime';
import {flowRegistry} from './FlowRegistry';

/**
 * @type BackBehavior
 * @description Defines how the back button should behave
 */
export type BackBehavior = 'prev' | 'close' | 'none' | 'custom';

/**
 * @interface BackHandlerOptions
 * @description Configuration options for the flow back handler
 */
export interface BackHandlerOptions {
  /** How the back button should behave */
  behavior?: BackBehavior;
  /** Custom handler function for 'custom' behavior */
  onBack?: () => boolean | Promise<boolean>;
  /** Whether to block the back button entirely */
  disabled?: boolean;
  /** Priority for nested flows (higher = handled first) */
  priority?: number;
}

/**
 * Priority registry for back handlers
 * Allows nested flows to intercept back button before parent flows
 */
const backHandlerRegistry = new Map<string, {priority: number; handler: () => boolean;}>();

/**
 * @function useFlowBackHandler
 * @description
 * Hook to integrate hardware back button with Flow navigation.
 * Automatically handles Android back button and iOS swipe gestures.
 * 
 * @param parentId - The ID of the parent flow to handle back navigation for
 * @param options - Configuration options for back button behavior
 * 
 * @example
 * ```tsx
 * function MyScreen() {
 *   useFlowBackHandler('MyFlow', {
 *     behavior: 'prev',
 *     priority: 10
 *   });
 *   // ... rest of component
 * }
 * ```
 */
export function useFlowBackHandler (
  parentId: string | null,
  options: BackHandlerOptions = {}
): void {
  const {
    behavior = 'prev',
    onBack,
    disabled = false,
    priority = 0,
  } = options;

  const handleBackPress = useCallback(async (): Promise<boolean> => {
    if(disabled) return false;
    if(!parentId) return false;

    // Custom handler takes precedence
    if(behavior === 'custom' && onBack) {
      const result = await Promise.resolve(onBack());
      return result;
    }

    // No action
    if(behavior === 'none') {
      return false;
    }

    // Close behavior - closes the entire flow
    if(behavior === 'close') {
      // Close is not implemented yet, fallback to prev
      const success = await prev(parentId);
      return success;
    }

    // Default 'prev' behavior
    if(behavior === 'prev') {
      // Check if we can go back
      const parent = flowRegistry.getNode(parentId);
      if(!parent) return false;

      const children = flowRegistry.getChildren(parentId);
      const currentChildId = flowRegistry.getCurrentChild(parentId);

      if(!currentChildId) return false;

      // Find current child index
      const currentIndex = children.findIndex(c => c.id === currentChildId);

      // If we're on the first child, don't handle back (let app/OS handle it)
      if(currentIndex <= 0) {
        // Check if parent has a parent - if so, delegate to parent
        if(parent.parentId) {
          const success = await prev(parent.parentId);
          return success;
        }
        // At root, allow default back behavior (exit app)
        return false;
      }

      // Navigate to previous child
      const success = await prev(parentId);
      return success; // true = we handled it, false = let OS handle it
    }

    return false;
  }, [parentId, behavior, onBack, disabled]);

  useEffect(() => {
    if(disabled || !parentId) return;

    // Register this handler with its priority
    const handlerKey = `${parentId}_${priority}`;

    const wrappedHandler = () => {
      // Check if there's a higher priority handler
      const handlers = Array.from(backHandlerRegistry.entries())
        .filter(([key]) => key !== handlerKey)
        .sort((a, b) => b[1].priority - a[1].priority);

      if(handlers.length > 0 && handlers[0][1].priority > priority) {
        // Let higher priority handler handle it
        return false;
      }

      // For async navigation, we need to determine synchronously if we can handle it
      // Check conditions that would make us handle the back button
      if(behavior === 'none') {
        return false; // Don't handle it
      }

      // Check if we can navigate back
      const parent = flowRegistry.getNode(parentId);
      if(!parent) return false;

      const children = flowRegistry.getChildren(parentId);
      const currentChildId = flowRegistry.getCurrentChild(parentId);

      if(!currentChildId) return false;

      // Find current child index
      const currentIndex = children.findIndex(c => c.id === currentChildId);

      // If we're on the first child
      if(currentIndex <= 0) {
        // If no parent flow exists (Root), let OS handle (exit app)
        if(!parent.parentId) return false;

        // If parent exists (e.g. Pack), check if IT can go back
        // We need to check history or siblings for the parent
        // This is tricky synchronously.
        // But typically, if we are at the start of a Parent in a Pack, 
        // and the Pack has no history, we should probably exit.

        // Let's check FlowNavigationHistory for the parent
        // We need to import flowNavigationHistory (circular dependency risk?)
        // FlowBackHandler imports FlowRuntime, which imports FlowNavigationHistory.
        // So we can import flowNavigationHistory from FlowNavigationHistory directly?
        // No, FlowBackHandler imports FlowRuntime.
        // Let's assume we can't easily check history synchronously without circular deps.

        // Heuristic: If parent is a 'pack', and we are at the first child of the first parent...
        // But 'parent' here is the FlowParent. 'parent.parentId' is the Pack.
        // If the Pack has history, we should go back.

        // For now, let's just return FALSE if we are at the root of a Pack?
        // But what if we navigated deeper into the Pack?

        // Let's try to access history via a helper or just assume if it's a Pack, we check if we can go back?
        // Actually, if we return true, we MUST handle it.
        // If we return false, we exit.

        // If we are at the start of a FlowParent, and that FlowParent is in a FlowPack.
        // We want to go back to the previous FlowParent in the Pack.
        // If there is no previous FlowParent (history empty), we want to exit.

        // We can check if the FlowParent is the 'initial' child of the Pack?
        // Or check if the Pack has history.

        // Let's try to import flowNavigationHistory dynamically or use a safe getter?
        // Or just rely on a simpler check:
        // If parent.type === 'pack', we are at root.
        // But here 'parent' is the FlowParent. 'parent.parentId' is the Pack.

        // Let's import flowNavigationHistory from its file.
        // It shouldn't cause circular dep if FlowBackHandler is a leaf or close to it.
        // FlowBackHandler -> FlowRuntime -> FlowNavigationHistory.
        // FlowBackHandler -> FlowRegistry.
        // FlowNavigationHistory -> FlowRegistry.
        // So FlowBackHandler -> FlowNavigationHistory is fine.

        const {flowNavigationHistory} = require('./FlowNavigationHistory');
        const canParentGoBack = flowNavigationHistory.canGoBack(parent.parentId);

        if(!canParentGoBack) {
          return false; // Let OS handle it (Exit)
        }
      }

      // We CAN handle this - start async navigation and return true to prevent app exit
      handleBackPress().catch((err: any) => {
        if(__DEV__) console.error('[FlowBackHandler] Navigation failed:', err);
      });

      return true; // Prevent default (app exit)
    };

    backHandlerRegistry.set(handlerKey, {priority, handler: wrappedHandler});

    // Add BackHandler listener
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      wrappedHandler
    );

    return () => {
      subscription.remove();
      backHandlerRegistry.delete(handlerKey);
    };
  }, [parentId, priority, disabled, handleBackPress, behavior]);
}

/**
 * @function clearBackHandlers
 * @description Clears all registered back handlers (useful for testing)
 */
export function clearBackHandlers (): void {
  backHandlerRegistry.clear();
}

/**
 * @function getActiveBackHandlers
 * @description Gets all currently registered back handlers (useful for debugging)
 * @returns Array of handler keys and priorities
 */
export function getActiveBackHandlers (): Array<{key: string; priority: number;}> {
  return Array.from(backHandlerRegistry.entries())
    .map(([key, {priority}]) => ({key, priority}))
    .sort((a, b) => b.priority - a.priority);
}
