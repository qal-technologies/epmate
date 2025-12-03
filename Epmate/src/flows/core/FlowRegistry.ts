/* 
   GLOBAL REGISTRY FOR ALL FLOWS
   - Tracks parents, children, nested structures
   - Allows navigation without React Context
*/

type FlowType = 'modal' | 'page' | 'child';

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
 * @interface FlowNode
 * @description Represents a registered node in the flow tree.
 */
export interface FlowNode {
  id: string;
  name: string;
  type: FlowType;
  parentId: string | null;
  children: string[];
  props: any;

  // runtime states
  isMounted: boolean;
  activeIndex: number;
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

  // listeners for registry changes
  private listeners: Set<() => void> = new Set();
  private instanceId = Math.random().toString(36).slice(2);

  private constructor() {
    this.currentChild = {};
    this.parentOf = {};
    if (__DEV__) console.log(`[FlowRegistry] Instance created: ${this.instanceId}`);
  }

  /**
   * Gets the singleton instance of the FlowRegistry.
   * @returns {FlowRegistry} The singleton instance.
   */
  public static getInstance() {
    if (!FlowRegistry.instance) {
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
  public registerNode(options: FlowNodeOptions): FlowNode {
    const { id, name, type, parentId = null, props = {} } = options;
    if (__DEV__) console.log(`[FlowRegistry:${this.instanceId}] Registering node: ${id}, type: ${type}, parent: ${parentId}`);

    // Check if node already exists FIRST - if so, merge and update it
    const existingNode = this.nodes.get(id);
    if (existingNode) {
      if (__DEV__) console.log(`[FlowRegistry:${this.instanceId}] Updating existing node: ${id}`);
      // Merge props instead of replacing to preserve existing values
      existingNode.props = { ...existingNode.props, ...props };
      existingNode.name = name;
      existingNode.type = type;
      this.notify();
      return existingNode;
    }

    if (parentId && !this.nodes.has(parentId)) {
      if (__DEV__) {
        console.warn(
          `[FlowRegistry] Parent '${parentId}' not found. Auto-registering as placeholder.`,
        );
      }
      this.registerNode({
        id: parentId,
        name: parentId,
        type: 'page',
        parentId: null,
        props: {},
      });
    }

    // Ensure unique names *within the same parent*
    if (parentId) {
      const siblings = this.tree.get(parentId) || [];
      const conflict = siblings
        .map(id => this.nodes.get(id))
        .find(n => n?.name === name && n?.id !== id);

      if (conflict) {
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
    };

    this.nodes.set(id, newNode);

    // Attach to parent tree
    if (parentId) {
      this.parentOf[id] = parentId;

      const arr = this.tree.get(parentId) || [];
      arr.push(id);
      this.tree.set(parentId, arr);
    }

    // Create children storage if not exists (preserve auto-registered children)
    if (!this.tree.has(id)) {
      this.tree.set(id, []);
    }

    this.notify();
    if (__DEV__) console.log(`[FlowRegistry] Registered ${id}. Total nodes: ${this.nodes.size}`);
    return newNode;
  }

  /**
   * Unregisters a node and all its descendants from the registry.
   * @param {string} id - The ID of the node to unregister.
   */
  public unregisterNode(id: string) {
    const node = this.nodes.get(id);
    if (!node) return;

    // remove from parent
    if (node.parentId) {
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
  public getNode(id: string) {
    return this.nodes.get(id) || null;
  }

  /**
   * Retrieves all children of a given node.
   * @param {string} id - The ID of the parent node.
   * @returns {FlowNode[]} An array of child nodes.
   */
  public getChildren(id: string): FlowNode[] {
    const ids = this.tree.get(id) || [];
    return ids.map(i => this.nodes.get(i)!).filter(Boolean);
  }

  /**
   * Finds a child node by its name within a specific parent.
   * @param {string} parentId - The ID of the parent node.
   * @param {string} name - The name of the child.
   * @returns {FlowNode | null} The child node, or null if not found.
   */
  public getChildByName(parentId: string, name: string): FlowNode | null {
    const ids = this.tree.get(parentId) || [];
    for (let id of ids) {
      const node = this.nodes.get(id);
      if (node?.name === name) return node;
    }
    return null;
  }

  /**
   * Traces the lineage of a node up to the root.
   * @param {string} nodeId - The ID of the node to start from.
   * @returns {FlowNode[]} An array of ancestor nodes, starting from the immediate parent.
   */
  public getParentChain(nodeId: string): FlowNode[] {
    const chain: FlowNode[] = [];
    let current = this.nodes.get(nodeId);

    while (current?.parentId) {
      const parent = this.nodes.get(current.parentId);
      if (!parent) break;

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
  public setCurrentChild(parentId: string, childId: string | null): void {
    if (!parentId) return;
    if (childId === null) {
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
  public getCurrentChild(parentId: string): string | null {
    return this.currentChild[parentId] ?? null;
  }

  /**
   * Finds the nearest parent that contains the specified child ID in its subtree.
   * @param {string} childId - The ID of the child node.
   * @returns {string | null} The ID of the parent, or null if not found.
   */
  public findParentByChild(childId: string): string | null {
    // direct parent
    const direct = this.parentOf[childId];
    if (direct) return direct;

    // fallback: search tree for an ancestor that contains childId in its descendants
    for (const [parentId, children] of this.tree.entries()) {
      // shallow check: direct child
      if (children.includes(childId)) return parentId;
      // deep check — walk descendants
      const stack = [...children];
      while (stack.length) {
        const cid = stack.shift()!;
        if (cid === childId) return parentId;
        const sub = this.tree.get(cid);
        if (sub && sub.length) stack.push(...sub);
      }
    }
    return null;
  }

  /**
   * Finds the top-most parent that currently has an active child.
   * Uses a heuristic to favor parents with the most recent registrations.
   * @returns {string | null} The ID of the parent, or null if none found.
   */
  public findTopParentWithActiveChild(): string | null {
    // prefer parents whose currentChild entry exists and choose the last inserted node key
    const parents = Array.from(this.tree.keys());
    for (let i = parents.length - 1; i >= 0; i--) {
      const pid = parents[i];
      if (this.currentChild[pid]) return pid;
      const children = this.tree.get(pid) || [];
      if (children.length > 0) {
        // use presence of any active child in subtree
        for (const c of children) {
          if (this.currentChild[c]) return pid;
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
  public getMom(childId: string) {
    return this.parentOf[childId];
  }

  /**
   * Returns a debug snapshot of the registry state.
   * @returns {object} The nodes and tree structure.
   */
  public debugTree() {
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
  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getInstanceId() {
    return this.instanceId;
  }

  /**
   * Retrieves all root nodes (nodes with no parent).
   * @returns {FlowNode[]} An array of root nodes.
   */
  public getRoots(): FlowNode[] {
    return Array.from(this.nodes.values()).filter(n => n.parentId === null);
  }
}

export const flowRegistry = FlowRegistry.getInstance();
