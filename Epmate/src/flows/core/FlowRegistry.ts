/* 
   GLOBAL REGISTRY FOR ALL FLOWS
   - Tracks parents, children, nested structures
   - Allows navigation without React Context
   - Supports synchronous registration for proper lifecycle
*/

import {FlowHierarchy} from './FlowHierarchy';
import {FlowNode, FlowType, RegistrationState} from '../types';

/**
 * @interface FlowNodeOptions
 * @description Options for registering a new flow node.
 */
export interface FlowNodeOptions {
  /** Unique identifier for the node */
  id: string;
  /** Human-readable name */
  name: string;
  /** Type of the node */
  type: FlowType;
  /** ID of the parent node, if any */
  parentId?: string | null;
  /** Arbitrary properties associated with the node */
  props?: any;
}

/**
 * @class FlowRegistry
 * @description
 * A singleton class that acts as the central registry for all flow nodes.
 * It maintains the tree structure of flows, tracks relationships between parents and children,
 * and provides methods to query the flow hierarchy.
 *
 * This registry allows for decoupled navigation and state management, as components
 * can look up flow information by ID without relying solely on React Context.
 */
class FlowRegistry {
  private static instance: FlowRegistry;

  // all flows indexed by ID
  private nodes: Map<string, FlowNode> = new Map();

  // Additional properties
  private currentChild: Record<string, any> = {};
  private parentOf: Record<string, any> = {};

  // children lookup: parentId -> childIds[]
  private tree: Map<string, string[]> = new Map();

  // Tab visibility state: packId -> boolean (true=visible, false=hidden)
  private tabVisibility: Map<string, boolean> = new Map();

  // Drawer visibility state: packId -> boolean (true=open, false=closed)
  private drawerVisibility: Map<string, boolean> = new Map();

  // listeners for registry changes
  private listeners: Set<() => void> = new Set();
  private instanceId = Math.random().toString(36).slice(2);

  private constructor() {
    this.currentChild = {};
    this.parentOf = {};

  }

  /**
   * Gets the singleton instance of the FlowRegistry.
   * @returns {FlowRegistry} The singleton instance.
   */
  public static getInstance () {
    if(!FlowRegistry.instance) {
      FlowRegistry.instance = new FlowRegistry();
    }
    return FlowRegistry.instance;
  }

  /**
   * Registers a new node in the flow registry.
   * @param {FlowNodeOptions} options - The options for the new node.
   * @returns {FlowNode} The registered node.
   * @throws {Error} If the parent does not exist or if a duplicate child name exists in the parent.
   */
  public registerNode (options: FlowNodeOptions): FlowNode {
    const {id, name, type, parentId = null, props = {}} = options;

    // VALIDATION: Pack parent must be root (null) - no nested Packs allowed
    if(type === 'pack' && parentId !== null) {
      if(__DEV__) {
        console.warn(`[FlowRegistry] Pack '${name}' cannot be nested. Pack parent must be root (null). Registering as root instead.`);
      }
      // Force Pack to be root level
      return this.registerNode({...options, parentId: null});
    }

    // Check if node already exists FIRST - if so, merge and update it
    const existingNode = this.nodes.get(id);
    if(existingNode) {

      const wasPlaceholder = existingNode.isPlaceholder;

      existingNode.props = {...existingNode.props, ...props};
      existingNode.name = name;
      existingNode.type = type;
      existingNode.parentId = parentId; 

      if(wasPlaceholder) {
        existingNode.isPlaceholder = false;
      }

      this.notify();
      return existingNode;
    }

    if(parentId && !this.nodes.has(parentId)) {
         if(__DEV__) {
        // console.warn(`[FlowRegistry] Parent '${parentId}' not found. Auto-registering as placeholder.`);
      }

      this.registerNode({
        id: parentId,
        name: parentId,
        type: 'pack',
        parentId: null,
        props: {},
      });
      // Mark as placeholder explicitly
      const p = this.nodes.get(parentId);
      if(p) p.isPlaceholder = true;
    }

    // Ensure unique names *within the same parent*
    if(parentId) {
      const siblings = this.tree.get(parentId) || [];
      const conflict = siblings
        .map(id => this.nodes.get(id))
        .find(n => n?.name === name && n?.id !== id && !n?.isPlaceholder);

      if(conflict) {
        throw new Error(
          `[FlowRegistry] Duplicate child name '${name}' inside parent '${parentId}'.`,
        );
      }
    }

    const newNode: FlowNode = {
      id,
      name,
      type,
      parentId,
      children: [],
      props,
      isMounted: false,
      activeIndex: 0,
      registrationState: 'registered',
      registeredAt: Date.now(),
      isPlaceholder: false,
    };

    this.nodes.set(id, newNode);

    // Attach to parent tree
    if(parentId) {
      this.parentOf[id] = parentId;

      const arr = this.tree.get(parentId) || [];
      if(!arr.includes(id)) {
        arr.push(id);
        this.tree.set(parentId, arr);
      }
    }

    // Create children storage if not exists (preserve auto-registered children)
    if(!this.tree.has(id)) {
      this.tree.set(id, []);
    }

    this.notify();

    return newNode;
  }

  /**
   * Unregisters a node and all its descendants from the registry.
   * @param {string} id - The ID of the node to unregister.
   */
  public unregisterNode (id: string) {
    const node = this.nodes.get(id);
    if(!node) return;

    // remove from parent
    if(node.parentId) {
      const siblings = this.tree.get(node.parentId) || [];
      this.tree.set(
        node.parentId,
        siblings.filter(n => n !== id),
      );
    }

    // remove children from registry
    const children = this.tree.get(id) || [];
    children.forEach(childId => this.unregisterNode(childId));

    this.tree.delete(id);
    this.tree.delete(id);
    this.nodes.delete(id);
    this.notify();
  }

  /**
   * Retrieves a node by its ID.
   * @param {string} id - The ID of the node.
   * @returns {FlowNode | null} The node, or null if not found.
   */
  public getNode (id: string) {
    return this.nodes.get(id) || null;
  }

  /**
   * Retrieves all children of a given node.
   * @param {string} id - The ID of the parent node.
   * @returns {FlowNode[]} An array of child nodes.
   */
  public getChildren (id: string): FlowNode[] {
    const ids = this.tree.get(id) || [];
    return ids.map(i => this.nodes.get(i)!).filter(Boolean);
  }

  /**
   * Finds a child node by its name within a specific parent.
   * @param {string} parentId - The ID of the parent node.
   * @param {string} name - The name of the child.
   * @returns {FlowNode | null} The child node, or null if not found.
   */
  public getChildByName (parentId: string, name: string): FlowNode | null {
    const ids = this.tree.get(parentId) || [];
    for(let id of ids) {
      const node = this.nodes.get(id);
      if(node?.name === name) return node;
    }
    return null;
  }

  /**
   * Traces the lineage of a node up to the root.
   * @param {string} nodeId - The ID of the node to start from.
   * @returns {FlowNode[]} An array of ancestor nodes, starting from the immediate parent.
   */
  public getParentChain (nodeId: string): FlowNode[] {
    const chain: FlowNode[] = [];
    let current = this.nodes.get(nodeId);

    while(current?.parentId) {
      const parent = this.nodes.get(current.parentId);
      if(!parent) break;

      chain.push(parent);
      current = parent;
    }

    return chain;
  }

  /**
   * Sets the currently active child for a parent node.
   * @param {string} parentId - The ID of the parent node.
   * @param {string | null} childId - The ID of the child to set as active, or null to clear.
   */
  public setCurrentChild (parentId: string, childId: string | null): void {
    if(!parentId) return;
    if(childId === null) {
      delete this.currentChild[parentId];
      return;
    }
    this.currentChild[parentId] = childId;
    this.notify();
  }

  /**
   * Gets the ID of the currently active child for a parent node.
   * @param {string} parentId - The ID of the parent node.
   * @returns {string | null} The ID of the active child, or null if none.
   */
  public getCurrentChild (parentId: string): string | null {
    return this.currentChild[parentId] ?? null;
  }

  /**
   * Finds the nearest parent that contains the specified child ID in its subtree.
   * @param {string} childId - The ID of the child node.
   * @returns {string | null} The ID of the parent, or null if not found.
   */
  public findParentByChild (childId: string): string | null {
    // direct parent
    const direct = this.parentOf[childId];
    if(direct) return direct;

    // fallback: search tree for an ancestor that contains childId in its descendants
    for(const [parentId, children] of this.tree.entries()) {
      // shallow check: direct child
      if(children.includes(childId)) return parentId;
      // deep check — walk descendants
      const stack = [...children];
      while(stack.length) {
        const cid = stack.shift()!;
        if(cid === childId) return parentId;
        const sub = this.tree.get(cid);
        if(sub && sub.length) stack.push(...sub);
      }
    }
    return null;
  }

  /**
   * Finds the top-most parent that currently has an active child.
   * Uses a heuristic to favor parents with the most recent registrations.
   * @returns {string | null} The ID of the parent, or null if none found.
   */
  public findTopParentWithActiveChild (): string | null {
    // prefer parents whose currentChild entry exists and choose the last inserted node key
    const parents = Array.from(this.tree.keys());
    for(let i = parents.length - 1; i >= 0; i--) {
      const pid = parents[i];
      if(this.currentChild[pid]) return pid;
      const children = this.tree.get(pid) || [];
      if(children.length > 0) {
        // use presence of any active child in subtree
        for(const c of children) {
          if(this.currentChild[c]) return pid;
        }
      }
    }
    return null;
  }

  /**
   * Gets the direct parent ID of a child node.
   * @param {string} childId - The ID of the child node.
   * @returns {string | undefined} The parent ID.
   */
  public getMom (childId: string) {
    return this.parentOf[childId];
  }

  /**
   * Returns a debug snapshot of the registry state.
   * @returns {object} The nodes and tree structure.
   */
  public debugTree () {
    return {
      nodes: Array.from(this.nodes.values()),
      tree: Array.from(this.tree.entries()),
    };
  }

  /**
   * Subscribes to changes in the registry.
   * @param {() => void} cb - The callback function to invoke on change.
   * @returns {() => void} A function to unsubscribe.
   */
  public subscribe (cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify () {
    this.listeners.forEach(cb => cb());
  }

  public forceUpdate () {
    this.notify();
  }

  public getInstanceId () {
    return this.instanceId;
  }

  /**
   * Retrieves all root nodes (nodes with no parent).
   * @returns {FlowNode[]} An array of root nodes.
   */
  public getRoots (): FlowNode[] {
    return Array.from(this.nodes.values()).filter(n => n.parentId === null);
  }

  /**
   * Registers a node synchronously (for immediate registration needs)
   * @param {FlowNodeOptions} options - The options for the new node.
   * @returns {FlowNode} The registered node.
   */
  public registerNodeSync (options: FlowNodeOptions): FlowNode {
    return this.registerNode(options);
  }

  /**
   * Validates the entire registry hierarchy
   * @returns Validation result
   */
  public validateHierarchy () {
    const allNodes = Array.from(this.nodes.values());
    return FlowHierarchy.validateHierarchy(allNodes);
  }

  /**
   * Gets all nodes as an array
   * @returns {FlowNode[]} All registered nodes
   */
  public getAllNodes (): FlowNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Updates a node's registration state
   * @param {string} id - The ID of the node.
   * @param {RegistrationState} state - The new state.
   */
  public setRegistrationState (id: string, state: RegistrationState): void {
    const node = this.nodes.get(id);
    if(node) {
      node.registrationState = state;
      this.notify();
    }
  }

  /**
   * Gets a node's registration state
   * @param {string} id - The ID of the node.
   * @returns {RegistrationState | null} The registration state or null if node not found.
   */
  public getRegistrationState (id: string): RegistrationState | null {
    const node = this.nodes.get(id);
    return node ? node.registrationState : null;
  }

  /**
   * Updates the properties of a registered node.
   * Merges the new properties with the existing ones.
   * 
   * @param {string} id - The ID of the node to update.
   * @param {Partial<any>} newProps - The new properties to merge.
   * @returns {boolean} True if the node was found and updated, false otherwise.
   */
  public updateNodeProps (id: string, newProps: Partial<any>): boolean {
    const node = this.nodes.get(id);
    if(!node) {
      if(__DEV__) console.warn(`[FlowRegistry] Cannot update props for unknown node: ${id}`);
      return false;
    }

    // Merge props
    node.props = {...node.props, ...newProps};

    // Notify listeners to trigger re-renders
    this.notify();
    return true;
  }

  /**
   * Prints a visual tree of the registry (for debugging)
   * @returns {string} String representation of the tree
   */
  public printTree (): string {
    const allNodes = Array.from(this.nodes.values());
    return FlowHierarchy.printTree(allNodes);
  }

  // ============ BACKUP & RECOVERY ============

  private backup: {
    nodes: Map<string, FlowNode>;
    tree: Map<string, string[]>;
    currentChild: Record<string, any>;
    parentOf: Record<string, any>;
  } | null = null;

  /**
   * Creates a backup of the current registry state.
   * Call this before risky operations.
   */
  public createBackup (): void {
    this.backup = {
      nodes: new Map(this.nodes),
      tree: new Map(this.tree),
      currentChild: {...this.currentChild},
      parentOf: {...this.parentOf},
    };
    if(__DEV__) console.log('[FlowRegistry] Backup created');
  }

  /**
   * Restores the registry from the last backup.
   * Returns true if restore was successful.
   */
  public restoreFromBackup (): boolean {
    if(!this.backup) {
      if(__DEV__) console.warn('[FlowRegistry] No backup available to restore');
      return false;
    }

    this.nodes = new Map(this.backup.nodes);
    this.tree = new Map(this.backup.tree);
    this.currentChild = {...this.backup.currentChild};
    this.parentOf = {...this.backup.parentOf};

    if(__DEV__) console.log('[FlowRegistry] Restored from backup');
    this.notify();
    return true;
  }

  /**
   * Clears the backup to free memory.
   */
  public clearBackup (): void {
    this.backup = null;
  }

  /**
   * Checks if any modal is currently active in the registry.
   * @returns {boolean} True if a modal is active.
   */
  public hasActiveModal (): boolean {
    const allNodes = this.getAllNodes();
    for(const node of allNodes) {
      if(node.type !== 'child') continue;
      const parent = node.parentId ? this.nodes.get(node.parentId) : null;
      const isModal = parent?.type === 'modal' || node.props?.modal;
      if(!isModal) continue;

      // Check if this modal child is active
      if(parent && this.currentChild[parent.id] === node.id) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets the title of the currently active child for a parent.
   * Recursively finds the deepest active child's title for nested flows.
   * Falls back to name if title not set.
   * @param {string} parentId - The parent ID.
   * @param {Set<string>} [visited] - Internal: tracks visited nodes to prevent infinite loops.
   * @returns {string} The title or name of the deepest active child.
   */
  public getActiveChildTitle (parentId: string, visited: Set<string> = new Set()): string {
    // Prevent infinite recursion
    // console.log('Loaded');
    if(visited.has(parentId)) return '';
    visited.add(parentId);
    // console.log('Checked visited');

    const childId = this.getCurrentChild(parentId);
    // console.log('Checked childId', childId);
    if(!childId) {
      // console.log('No childId');
      return '';
    };

    const child = this.nodes.get(childId);
    // console.log(child?.name || child?.props.title);
    if(!child) {
      // console.log('No child');
      return '';
    }

    // Check if this child has an active child (nested flow)
    // Only use child.id, not child.name to avoid ambiguity
    const nestedChild = this.nodes.get(child.id)?.children;
    // console.log('Checked nestedChild', nestedChild);
    if(nestedChild) {
      const innerChildId = this.getCurrentChild(child.id);
      // console.log('Checked innerChildId', innerChildId);
      if(innerChildId && innerChildId !== childId) {
        // console.log('Loaded nestedChildId');
        const deeperTitle = this.getActiveChildTitle(innerChildId, visited);
        if(deeperTitle) return deeperTitle;
      }
    }
    // console.log('No nestedChildId');

    return child?.props?.title || child?.name || '';
  }

  /**
   * Sets the tab visibility for a specific pack/parent.
   * @param {string} packId - The ID of the pack.
   * @param {boolean} visible - Whether the tab should be visible.
   */
  public setTabVisibility (packId: string, visible: boolean) {
    if(this.tabVisibility.get(packId) === visible) return;
    this.tabVisibility.set(packId, visible);
    this.notify();
  }

  /**
   * Gets the tab visibility for a specific pack/parent.
   * Defaults to true if not set.
   * @param {string} packId - The ID of the pack.
   * @returns {boolean} True if visible.
   */
  public getTabVisibility (packId: string): boolean {
    return this.tabVisibility.get(packId) ?? true;
  }

  /**
   * Sets the drawer visibility for a specific pack/parent.
   * @param {string} packId - The ID of the pack.
   * @param {boolean} visible - Whether the drawer should be open.
   */
  public setDrawerVisibility (packId: string, visible: boolean) {
    if(this.drawerVisibility.get(packId) === visible) return;
    this.drawerVisibility.set(packId, visible);
    this.notify();
  }

  /**
   * Gets the drawer visibility for a specific pack/parent.
   * Defaults to false (closed) if not set.
   * @param {string} packId - The ID of the pack.
   * @returns {boolean} True if drawer is open.
   */
  public getDrawerVisibility (packId: string): boolean {
    return this.drawerVisibility.get(packId) ?? false;
  }

  /**
   * Safe update with automatic backup and rollback on error.
   * @param {() => void} operation - The operation to perform.
   */
  public safeUpdate (operation: () => void): void {
    this.createBackup();
    try {
      operation();
    } catch(error) {
      if(__DEV__) console.error('[FlowRegistry] Operation failed, rolling back:', error);
      this.restoreFromBackup();
    } finally {
      this.clearBackup();
    }
  }
}

export const flowRegistry = FlowRegistry.getInstance();
