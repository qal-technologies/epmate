import {FlowNode, FlowType} from '../types';


/**
 * @interface HierarchyNode
 * @description Represents a node in the flow hierarchy tree
 */
export interface HierarchyNode {
  id: string;
  name: string;
  type: FlowType;
  parentId: string | null;
  depth: number;
  children: HierarchyNode[];
  path: string[];
}

/**
 * @class FlowHierarchy
 * @description
 * Utility class for managing and analyzing the flow hierarchy tree.
 * Provides methods for building, validating, and querying the hierarchy.
 */
export class FlowHierarchy {
  /**
   * Builds a hierarchical tree structure from a flat list of nodes
   * @param nodes - Array of FlowNode objects
   * @returns Root nodes of the hierarchy tree
   */
  static buildHierarchyTree (nodes: FlowNode[]): HierarchyNode[] {
    const nodeMap = new Map<string, HierarchyNode>();
    const roots: HierarchyNode[] = [];

    // First pass: Create hierarchy nodes
    nodes.forEach((node) => {
      nodeMap.set(node.id, {
        id: node.id,
        name: node.name,
        type: node.type,
        parentId: node.parentId,
        depth: 0,
        children: [],
        path: [],
      });
    });

    // Second pass: Build parent-child relationships and calculate depth
    nodes.forEach((node) => {
      const hierarchyNode = nodeMap.get(node.id)!;

      if(node.parentId === null) {
        // Root node
        hierarchyNode.depth = 0;
        hierarchyNode.path = [node.id];
        roots.push(hierarchyNode);
      } else {
        const parent = nodeMap.get(node.parentId);
        if(parent) {
          parent.children.push(hierarchyNode);
          hierarchyNode.depth = parent.depth + 1;
          hierarchyNode.path = [...parent.path, node.id];
        } else if(__DEV__) {
          console.warn(`[FlowHierarchy] Parent ${node.parentId} not found for node ${node.id}`);
        }
      }
    });

    return roots;
  }

  /**
   * Gets all ancestor nodes for a given node ID
   * @param nodes - Array of all FlowNode objects
   * @param nodeId - ID of the node to find ancestors for
   * @returns Array of ancestor nodes, from immediate parent to root
   */
  static getAncestors (nodes: FlowNode[], nodeId: string): FlowNode[] {
    const ancestors: FlowNode[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    let current = nodeMap.get(nodeId);
    while(current?.parentId) {
      const parent = nodeMap.get(current.parentId);
      if(!parent) break;
      ancestors.push(parent);
      current = parent;
    }

    return ancestors;
  }

  /**
   * Gets all descendant nodes for a given node ID
   * @param nodes - Array of all FlowNode objects
   * @param nodeId - ID of the node to find descendants for
   * @returns Array of descendant nodes
   */
  static getDescendants (nodes: FlowNode[], nodeId: string): FlowNode[] {
    const descendants: FlowNode[] = [];
    const children = nodes.filter(n => n.parentId === nodeId);

    children.forEach(child => {
      descendants.push(child);
      descendants.push(...this.getDescendants(nodes, child.id));
    });

    return descendants;
  }

  /**
   * Validates the hierarchy for common issues
   * @param nodes - Array of all FlowNode objects
   * @returns Validation result with any errors found
   */
  static validateHierarchy (nodes: FlowNode[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Check for cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if(!visited.has(nodeId)) {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const node = nodeMap.get(nodeId);
        if(node?.parentId) {
          if(!visited.has(node.parentId) && hasCycle(node.parentId)) {
            return true;
          } else if(recursionStack.has(node.parentId)) {
            return true;
          }
        }
      }
      recursionStack.delete(nodeId);
      return false;
    };

    nodes.forEach(node => {
      if(hasCycle(node.id)) {
        errors.push(`Cycle detected involving node: ${node.id}`);
      }
    });

    // Check for orphaned nodes (parent doesn't exist)
    nodes.forEach(node => {
      if(node.parentId && !nodeMap.has(node.parentId)) {
        errors.push(`Orphaned node: ${node.id} references non-existent parent: ${node.parentId}`);
      }
    });

    // Check for duplicate names within same parent
    const childrenByParent = new Map<string | null, FlowNode[]>();
    nodes.forEach(node => {
      const siblings = childrenByParent.get(node.parentId) || [];
      siblings.push(node);
      childrenByParent.set(node.parentId, siblings);
    });

    childrenByParent.forEach((siblings, parentId) => {
      const names = new Set<string>();
      siblings.forEach(sibling => {
        if(names.has(sibling.name)) {
          errors.push(
            `Duplicate child name "${sibling.name}" under parent: ${parentId || 'root'}`
          );
        }
        names.add(sibling.name);
      });
    });

    // Warnings: Deep nesting
    nodes.forEach(node => {
      const depth = this.computeDepth(nodes, node.id);
      if(depth > 5) {
        warnings.push(`Deep nesting (depth ${depth}) for node: ${node.id}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Computes the depth of a node in the hierarchy
   * @param nodes - Array of all FlowNode objects
   * @param nodeId - ID of the node
   * @returns Depth of the node (0 for root)
   */
  static computeDepth (nodes: FlowNode[], nodeId: string): number {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    let depth = 0;
    let current = nodeMap.get(nodeId);

    while(current?.parentId) {
      depth++;
      current = nodeMap.get(current.parentId);
      if(depth > 100) {
        // Prevent infinite loop
        if(__DEV__) {
          console.error(`[FlowHierarchy] Infinite loop detected for node: ${nodeId}`);
        }
        break;
      }
    }

    return depth;
  }

  /**
   * Finds the root node for a given node ID
   * @param nodes - Array of all FlowNode objects
   * @param nodeId - ID of the node
   * @returns Root node or null if not found
   */
  static findRoot (nodes: FlowNode[], nodeId: string): FlowNode | null {
    const ancestors = this.getAncestors(nodes, nodeId);
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : nodes.find(n => n.id === nodeId) || null;
  }

  /**
   * Gets the full path from root to a node
   * @param nodes - Array of all FlowNode objects
   * @param nodeId - ID of the node
   * @returns Array of node IDs from root to the target node
   */
  static getPath (nodes: FlowNode[], nodeId: string): string[] {
    const ancestors = this.getAncestors(nodes, nodeId);
    return [...ancestors.reverse().map(n => n.id), nodeId];
  }

  /**
   * Finds siblings of a node (nodes sharing the same parent)
   * @param nodes - Array of all FlowNode objects
   * @param nodeId - ID of the node
   * @returns Array of sibling nodes
   */
  static getSiblings (nodes: FlowNode[], nodeId: string): FlowNode[] {
    const node = nodes.find(n => n.id === nodeId);
    if(!node) return [];

    return nodes.filter(n => n.parentId === node.parentId && n.id !== nodeId);
  }

  /**
   * Pretty prints the hierarchy tree for debugging
   * @param nodes - Array of all FlowNode objects
   * @returns String representation of the tree
   */
  static printTree (nodes: FlowNode[]): string {
    const tree = this.buildHierarchyTree(nodes);
    const lines: string[] = [];

    const printNode = (node: HierarchyNode, prefix: string = '', isLast: boolean = true) => {
      const connector = isLast ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${node.name} (${node.type}, id: ${node.id})`);

      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      node.children.forEach((child, index) => {
        printNode(child, newPrefix, index === node.children.length - 1);
      });
    };

    tree.forEach((root, index) => {
      printNode(root, '', index === tree.length - 1);
    });

    return lines.join('\n');
  }
}
