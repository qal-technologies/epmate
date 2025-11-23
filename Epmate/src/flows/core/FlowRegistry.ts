// src/flow/core/FlowRegistry.ts
/* 
   GLOBAL REGISTRY FOR ALL FLOWS
   - Tracks parents, children, nested structures
   - Allows navigation without React Context
*/

type FlowType = 'modal' | 'page' | 'child';

export interface FlowNodeOptions {
  id: string;
  name: string;
  type: FlowType;
  parentId?: string | null;
  props?: any;
}

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

class FlowRegistry {
  private static instance: FlowRegistry;

  // all flows indexed by ID
  private nodes: Map<string, FlowNode> = new Map();

  // Additional properties
  private currentChild: Record<string, any> = {};
  private parentOf: Record<string, any> = {};

  // children lookup: parentId -> childIds[]
  private tree: Map<string, string[]> = new Map();

  private constructor() {
    this.currentChild = {};
    this.parentOf = {};
  }

  public static getInstance() {
    if (!FlowRegistry.instance) {
      FlowRegistry.instance = new FlowRegistry();
    }
    return FlowRegistry.instance;
  }

  /* REGISTER NEW FLOW NODE */
  public registerNode(options: FlowNodeOptions): FlowNode {
    const { id, name, type, parentId = null, props = {} } = options;

    if (parentId && !this.nodes.has(parentId)) {
      throw new Error(
        `[FlowRegistry] Parent with id '${parentId}' does not exist.`,
      );
    }

    // Ensure unique names *within the same parent*
    if (parentId) {
      const siblings = this.tree.get(parentId) || [];
      const conflict = siblings
        .map(id => this.nodes.get(id))
        .find(n => n?.name === name);

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

    // Create children storage
    this.tree.set(id, []);

    return newNode;
  }

  /* UNREGISTER NODE */
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
    this.nodes.delete(id);
  }

  /* GET NODE BY ID */
  public getNode(id: string) {
    return this.nodes.get(id) || null;
  }

  /* GET CHILDREN NODES */
  public getChildren(id: string): FlowNode[] {
    const ids = this.tree.get(id) || [];
    return ids.map(i => this.nodes.get(i)!).filter(Boolean);
  }

  /* FIND CHILD BY NAME INSIDE PARENT */
  public getChildByName(parentId: string, name: string): FlowNode | null {
    const ids = this.tree.get(parentId) || [];
    for (let id of ids) {
      const node = this.nodes.get(id);
      if (node?.name === name) return node;
    }
    return null;
  }

  /* TRACE PARENT CHAIN */
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
   * Set currently active child for a parent (runtime helper)
   */
  public setCurrentChild(parentId: string, childId: string | null): void {
    if (!parentId) return;
    if (childId === null) {
      delete this.currentChild[parentId];
      return;
    }
    this.currentChild[parentId] = childId;
  }

  /**
   * Get currently active child id for a parent
   */
  public getCurrentChild(parentId: string): string | null {
    return this.currentChild[parentId] ?? null;
  }

  /**
   * Find nearest parent that has the provided child id as active or contains it in its subtree.
   * Returns parentId or null.
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
   * Find a top-most parent that currently has an active child (runtime),
   * favor parents with the most recent registrations (heuristic).
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

  public getMom(childId: string) {
    return this.parentOf[childId];
  }

  /* DEBUG - optional */
  public debugTree() {
    return {
      nodes: Array.from(this.nodes.values()),
      tree: Array.from(this.tree.entries()),
    };
  }
}

export const flowRegistry = FlowRegistry.getInstance();
