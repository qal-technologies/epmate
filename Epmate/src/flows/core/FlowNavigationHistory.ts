import {flowRegistry} from './FlowRegistry';
import {FlowStorage} from './state/FlowStorage';

/**
 * @interface NavigationHistoryEntry
 * @description Represents a single entry in the navigation history
 */
export interface NavigationHistoryEntry {
  /** ID of the child that was active */
  childId: string;
  /** Timestamp when this entry was created */
  timestamp: number;
  /** Scroll position when navigating away (optional) */
  scrollPosition?: {x: number; y: number;};
  /** Saved component state (optional) */
  componentState?: any;
  /** Navigation parameters passed to this child */
  params?: Record<string, any>;
  /** Name of the child for debugging */
  childName?: string;
}

/**
 * @class FlowNavigationHistory
 * @description
 * Manages navigation history for flow-based navigation.
 * Maintains separate back and forward stacks per parent flow,
 * enabling proper navigation memory and state preservation.
 * 
 * Features:
 * - Back/forward navigation support
 * - Component state preservation
 * - Scroll position tracking
 * - Navigation parameters
 * - Memory-efficient history management
 */
export class FlowNavigationHistory {
  // History stacks per parent flow
  private backStack: Map<string, NavigationHistoryEntry[]> = new Map();
  private forwardStack: Map<string, NavigationHistoryEntry[]> = new Map();
  private loadedScopes = new Set<string>();

  // Component state storage
  private componentStateStore: Map<string, any> = new Map();

  // Configuration
  private maxHistorySize = 50; // Prevent memory leaks

  /**
   * Pushes a new entry onto the history stack
   * @param parentId - The parent flow ID
   * @param entry - The navigation history entry
   */
  push (parentId: string, entry: NavigationHistoryEntry): void {
    if(!parentId) return;
    this.ensureLoaded(parentId);

    const stack = this.backStack.get(parentId) || [];

    // Add entry to back stack
    stack.push(entry);

    // Limit history size to prevent memory issues
    if(stack.length > this.maxHistorySize) {
      stack.shift(); // Remove oldest entry
    }

    this.backStack.set(parentId, stack);
    this.saveHistory(parentId);

    // Clear forward stack when new navigation happens
    this.forwardStack.set(parentId, []);

    if(__DEV__) {

    }
  }

  /**
   * Pops the most recent entry from the back stack
   * @param parentId - The parent flow ID
   * @returns The popped entry, or null if stack is empty
   */
  pop (parentId: string): NavigationHistoryEntry | null {
    if(!parentId) return null;

    const stack = this.backStack.get(parentId) || [];
    if(stack.length === 0) return null;

    const entry = stack.pop()!;
    this.backStack.set(parentId, stack);
    this.saveHistory(parentId);

    // Move to forward stack
    const forwardStack = this.forwardStack.get(parentId) || [];
    forwardStack.push(entry);
    this.forwardStack.set(parentId, forwardStack);

    if(__DEV__) {

    }

    return entry;
  }

  /**
   * Peeks at the top of the back stack without removing it
   * @param parentId - The parent flow ID
   * @returns The top entry, or null if stack is empty
   */
  peek (parentId: string): NavigationHistoryEntry | null {
    if(!parentId) return null;

    const stack = this.backStack.get(parentId) || [];
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }

  /**
   * Checks if backwards navigation is possible
   * @param parentId - The parent flow ID
   * @returns True if can go back
   */
  canGoBack (parentId: string): boolean {
    const stack = this.backStack.get(parentId) || [];
    return stack.length > 0;
  }

  /**
   * Checks if forward navigation is possible
   * @param parentId - The parent flow ID
   * @returns True if can go forward
   */
  canGoForward (parentId: string): boolean {
    const stack = this.forwardStack.get(parentId) || [];
    return stack.length > 0;
  }

  /**
   * Gets the next forward navigation entry without removing it
   * @param parentId - The parent flow ID
   * @returns The next forward entry, or null
   */
  peekForward (parentId: string): NavigationHistoryEntry | null {
    if(!parentId) return null;

    const stack = this.forwardStack.get(parentId) || [];
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }

  /**
   * Pops from the forward stack (for forward navigation)
   * @param parentId - The parent flow ID
   * @returns The entry to navigate to, or null
   */
  popForward (parentId: string): NavigationHistoryEntry | null {
    if(!parentId) return null;

    const stack = this.forwardStack.get(parentId) || [];
    if(stack.length === 0) return null;

    const entry = stack.pop()!;
    this.forwardStack.set(parentId, stack);

    // Add back to back stack
    const backStack = this.backStack.get(parentId) || [];
    backStack.push(entry);
    this.backStack.set(parentId, backStack);

    return entry;
  }

  /**
   * Saves component state for a specific child
   * @param childId - The child ID
   * @param state - The state to save
   */
  saveComponentState (childId: string, state: any): void {
    if(!childId) return;
    this.componentStateStore.set(childId, state);

    if(__DEV__) {

    }
  }

  /**
   * Restores component state for a specific child
   * @param childId - The child ID
   * @returns The restored state, or null if not found
   */
  restoreComponentState (childId: string): any {
    if(!childId) return null;

    const state = this.componentStateStore.get(childId);

    if(__DEV__ && state) {

    }

    return state || null;
  }

  /**
   * Updates scroll position for the current history entry
   * @param parentId - The parent flow ID
   * @param scrollPosition - The scroll position to save
   */
  updateScrollPosition (parentId: string, scrollPosition: {x: number; y: number;}): void {
    const entry = this.peek(parentId);
    if(entry) {
      entry.scrollPosition = scrollPosition;
    }
  }

  /**
   * Clears all history for a specific parent
   * @param parentId - The parent flow ID
   */
  clearHistory (parentId: string): void {
    this.backStack.delete(parentId);
    this.forwardStack.delete(parentId);

    if(__DEV__) {

    }
  }

  /**
   * Clears component state for a specific child
   * @param childId - The child ID
   */
  clearComponentState (childId: string): void {
    this.componentStateStore.delete(childId);
  }

  /**
   * Gets the full back stack for a parent (for debugging)
   * @param parentId - The parent flow ID
   * @returns Array of history entries
   */
  getBackStack (parentId: string): NavigationHistoryEntry[] {
    return this.backStack.get(parentId) || [];
  }

  /**
   * Gets the full forward stack for a parent (for debugging)
   * @param parentId - The parent flow ID
   * @returns Array of history entries
   */
  getForwardStack (parentId: string): NavigationHistoryEntry[] {
    return this.forwardStack.get(parentId) || [];
  }

  /**
   * Gets a summary of the navigation history (for debugging)
   * @returns Object with history statistics
   */
  getHistorySummary (): {
    totalParents: number;
    totalBackEntries: number;
    totalForwardEntries: number;
    totalComponentStates: number;
  } {
    let totalBackEntries = 0;
    let totalForwardEntries = 0;

    this.backStack.forEach(stack => totalBackEntries += stack.length);
    this.forwardStack.forEach(stack => totalForwardEntries += stack.length);

    return {
      totalParents: this.backStack.size,
      totalBackEntries,
      totalForwardEntries,
      totalComponentStates: this.componentStateStore.size,
    };
  }

  /**
   * Cleanup old component states that are no longer in any history
   */
  cleanupOrphanedStates (): string[] {
    const activeChildIds = new Set<string>();

    // Collect all child IDs from all history stacks
    this.backStack.forEach(stack => {
      stack.forEach(entry => activeChildIds.add(entry.childId));
    });
    this.forwardStack.forEach(stack => {
      stack.forEach(entry => activeChildIds.add(entry.childId));
    });

    // Remove states that aren't in any history
    const orphanedStates: string[] = [];
    this.componentStateStore.forEach((_, childId) => {
      if(!activeChildIds.has(childId)) {
        orphanedStates.push(childId);
      }
    });

    // Remove ONLY temporary state for orphaned children
    // Permanent state (set/get) should persist until manually removed
    orphanedStates.forEach(childId => {
      // We need to access the state manager to check/clear temp state
      // But FlowNavigationHistory doesn't have direct access to FlowStateManager's map
      // However, FlowStateManager is the one storing the state in stateMap.
      // Wait, FlowNavigationHistory has its OWN componentStateStore?
      // No, FlowNavigationHistory uses componentStateStore for *navigation state* (like scroll position, params).
      // FlowStateManager uses stateMap for *data state*.

      // The user request is about "keep, take" which are FlowStateManager methods.
      // So we need to tell FlowStateManager to clean up temp state for these orphaned scopes.

      // Since FlowNavigationHistory is lower level or separate, we might need to expose a method on FlowStateManager
      // or have FlowRuntime handle the coordination.

      // Actually, looking at FlowRuntime.ts, we call flowNavigationHistory.cleanupOrphanedStates().
      // This cleans up *navigation history* related state.

      // BUT, the user is talking about DATA state (FlowStateManager).
      // We need a way to clean up FlowStateManager's temp data for orphaned scopes.

      // Let's add a callback or event mechanism? Or just import FlowStateManager here?
      // Importing FlowStateManager here might cause circular deps if FlowStateManager imports FlowNavigationHistory.
      // FlowStateManager imports types and FlowStorage. It does NOT import FlowNavigationHistory.
      // So we can import FlowStateManager here?
      // FlowRuntime imports BOTH.

      // Better approach: FlowNavigationHistory returns the list of orphaned IDs, and FlowRuntime calls FlowStateManager.

      // For now, let's just clear the componentStateStore (which is navigation state) as before,
      // BUT we also need to handle the Data State.

      this.componentStateStore.delete(childId);
    });

    if(__DEV__ && orphanedStates.length > 0) {

    }

    return orphanedStates; // Return list so Runtime can clean up Data State too
  }

  private ensureLoaded (parentId: string) {
    if(this.loadedScopes.has(parentId)) return;
    this.loadedScopes.add(parentId);

    // Load from storage
    FlowStorage.load(`history_${parentId}`).then(data => {
      if(data && Array.isArray(data.stack)) {
        this.backStack.set(parentId, data.stack);
      }
    }).catch(() => { });
  }

  private saveHistory (parentId: string) {
    const stack = this.backStack.get(parentId) || [];
    FlowStorage.save(`history_${parentId}`, {stack});
  }
}

// Singleton instance
export const flowNavigationHistory = new FlowNavigationHistory();