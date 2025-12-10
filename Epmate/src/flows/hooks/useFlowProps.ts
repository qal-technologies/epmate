import React from 'react';
import {useFlowContext} from '../core/FlowContext';
import {flowRegistry} from '../core/FlowRegistry';
import {FlowBaseProps, FlowChildBaseProps, FlowChildProps} from '../types';

/**
 * @hook useFlowProps
 * @description
 * A hook that allows a component to access and modify its own props dynamically.
 * It subscribes to the `FlowRegistry` to ensure the component re-renders when its props are updated.
 * 
 * **Type Safety:**
 * The generic type `T` is merged with the standard `FlowChildProps`.
 * This means you get intellisense for both standard props (like `title`, `name`) AND your custom props.
 * 
 * **Cross-Pack Access:**
 * Pass a `scope` parameter (supports dotted names like "PackName.ParentName.ChildName") 
 * to read/write props of any node in the registry.
 * 
 * @template T - The shape of your custom props. Defaults to `{}`.
 * @param {string} [scope] - Optional scope ID for cross-pack access
 * @returns {object} An object containing:
 * - `props`: The current props (Standard Flow Props & T).
 * - `setProps`: A function to update the props.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { props, setProps } = useFlowProps();
 * props.title; // Standard prop
 * 
 * // Cross-pack access
 * const { props, setProps } = useFlowProps('OtherPack.SomeParent');
 * ```
 */
export function useFlowProps<T = {}> (scope?: string) {
    const context = useFlowContext();
    // Use provided scope or fall back to current context
    const nodeId = scope || context.flowId;

    // Subscribe to registry updates to trigger re-renders
    const [_, setTick] = React.useState(0);

    React.useEffect(() => {
        if(!nodeId) return;
        const unsubscribe = flowRegistry.subscribe(() => {
            setTick(t => t + 1);
        });
        return unsubscribe;
    }, [nodeId]);

    const getProps = React.useCallback((): FlowChildProps & T => {
        if(!nodeId) return {} as FlowChildProps & T;
        const node = flowRegistry.getNode(nodeId);
        return (node?.props || {}) as FlowChildProps & T;
    }, [nodeId, _]); // Depend on tick to re-read props

    const setProps = React.useCallback((newProps: Partial<FlowChildProps & T>) => {
        if(!nodeId) {
            if(__DEV__) console.warn('[useFlowProps] No node ID found in context.');
            return;
        }
        flowRegistry.updateNodeProps(nodeId, newProps);
    }, [nodeId]);

    return {
        props: getProps(),
        setProps,
    };
}

/**
 * @hook useFlowParentProps
 * @description
 * A hook that allows a component to access and modify its **parent's** props dynamically.
 * Useful for child components that need to control parent behavior (e.g., disabling back button, changing theme).
 * 
 * **Type Safety:**
 * The generic type `T` is merged with the standard `FlowBaseProps`.
 * 
 * @template T - The shape of your custom parent props. Defaults to `{}`.
 * @returns {object} An object containing:
 * - `parentProps`: The current parent props (Standard Flow Props & T).
 * - `setParentProps`: A function to update the parent's props.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { parentProps, setParentProps } = useFlowParentProps();
 * parentProps.isRestrictedOut; // Standard prop
 * 
 * // Typed usage
 * const { parentProps, setParentProps } = useFlowParentProps<{ customHeaderColor: string }>();
 * parentProps.customHeaderColor; // Custom prop
 * parentProps.name; // Standard prop still available
 * ```
 */
export function useFlowParentProps<T = {}> (target: 'parent' | 'pack' = 'parent') {
    const context = useFlowContext();
    const parentId = context.parentId;

    // Subscribe to registry updates
    const [_, setTick] = React.useState(0);

    React.useEffect(() => {
        if(!parentId) return;
        const unsubscribe = flowRegistry.subscribe(() => {
            setTick(t => t + 1);
        });
        return unsubscribe;
    }, [parentId]);

    const getParentProps = React.useCallback((): FlowBaseProps & T => {
        let targetId = parentId;

        if(target === 'pack' && parentId) {
            const node = flowRegistry.getNode(parentId);
            if(node && node.parentId) {
                targetId = node.parentId;
            }
        }

        if(!targetId) return {} as FlowBaseProps & T;
        const node = flowRegistry.getNode(targetId);
        return (node?.props || {}) as FlowBaseProps & T;
    }, [parentId, target, _]);

    const setParentProps = React.useCallback((newProps: Partial<FlowBaseProps & T>, to?: 'parent' | 'pack' | string) => {
        let targetId = parentId;
        const resolvedTarget = to || target; // Use call-time target, or hook default

        if(resolvedTarget === 'pack' && parentId) {
            // Find the nearest Pack
            // If parent is a Pack, use it? Or parent's parent?
            // "pack" usually means the container pack.
            // If current parent is regular page, we look up.
            // We need a way to traverse up. FlowRegistry has getParentChain?
            // But here we only have access to registry via import.
            // Let's use flowRegistry.getParentChain(nodeId)
            const chain = flowRegistry.getParentChain(context.childId || context.flowId || '');
            const packParams = chain.find(n => n.type === 'pack');
            if(packParams) {
                targetId = packParams.id;
            } else {
                // Fallback to parent's parent if simple lookup
                const node = flowRegistry.getNode(parentId);
                if(node && node.parentId) {
                    targetId = node.parentId;
                }
            }
        } else if(typeof resolvedTarget === 'string' && resolvedTarget !== 'parent' && resolvedTarget !== 'pack') {
            // Explicit ID
            targetId = resolvedTarget;
        }

        if(!targetId) {
            if(__DEV__) console.warn('[useFlowParentProps] No target ID found in context.');
            return;
        }
        flowRegistry.updateNodeProps(targetId, newProps);
    }, [parentId, target, context.childId, context.flowId]);

    return {
        parentProps: getParentProps(),
        setParentProps,
    };
}


