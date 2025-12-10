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
 * 
 * Use `type="tab"` to make this Pack act as a Tab Navigator, where each direct child 
 * (Parent or nested Pack) becomes a tab.
 */
export const FlowPack: React.FC<FlowPackProps> = ({
    name,
    children,
    initial,
    isRestrictedIn,
    isRestrictedOut,
    theme,
    shareState,
    type,
    tabStyle,
    iconStyle,
    hideTab,
}) => {
    const runtime = useFlowRuntime();

    // Register the pack with the registry SYNCHRONOUSLY using useLayoutEffect
    // This ensures the pack is registered BEFORE children try to register.
    React.useLayoutEffect(() => {
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
                type,
                tabStyle,
                iconStyle,
                hideTab,
            },
        });

        return () => {
            flowRegistry.unregisterNode(name);
        };
    }, [name, initial, isRestrictedIn, isRestrictedOut, theme, shareState, type, tabStyle, iconStyle, hideTab]);

    // Wrap children in a Provider to establish context, allowing children to access flowId.
    return (
        <FlowProvider parentId={name} childId={name} flowId={name}>
            {children}
        </FlowProvider>
    );
};
