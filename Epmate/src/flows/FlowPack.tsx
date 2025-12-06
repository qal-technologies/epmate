import React from 'react';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {FlowPackProps} from './types';
import {FlowProvider} from './core/FlowProvider';

/**
 * @component FlowPack
 * @description
 * A container component that groups multiple Flow.Parents together.
 * It acts as a root-level organizer, allowing for separation of concerns
 * (e.g., Main App vs Auth Flow vs Profile Flow).
 * 
 * The FlowNavigator renders the active FlowPack, which in turn renders its active Parent.
 */
export const FlowPack: React.FC<FlowPackProps> = ({
    name,
    children,
    initial,
    isRestrictedIn,
    isRestrictedOut,
    theme,
    shareState,
}) => {
    const runtime = useFlowRuntime();

    // Register the pack with the registry
    React.useEffect(() => {
        flowRegistry.registerNode({
            id: name,
            name,
            type: 'pack',
            parentId: null, // Packs are always top-level roots
            props: {
                initial,
                isRestrictedIn,
                isRestrictedOut,
                theme,
                shareState,
            },
        });

        return () => {
            flowRegistry.unregisterNode(name);
        };
    }, [name, initial, isRestrictedIn, isRestrictedOut, theme, shareState]);

    // If this pack is active, render its active child (Parent)
    // We don't render children directly here; FlowNavigator handles the Pack rendering.
    // However, we need to provide the children to the React tree so they can register themselves.

    // Wrap children in a Provider to establish context, though parents mostly register themselves.
    return (
        <FlowProvider parentId={name} childId={name} flowId={name}>
            {children}
        </FlowProvider>
    );
};
