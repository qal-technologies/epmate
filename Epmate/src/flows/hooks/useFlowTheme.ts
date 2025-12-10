import {useState, useEffect, useCallback} from 'react';
import {Appearance, ColorSchemeName} from 'react-native';
import {flowRegistry} from '../core/FlowRegistry';
import {useFlowContext} from '../core/FlowContext';
import type {FlowThemeConfig, FlowThemeValue} from '../types';


// Default theme colors
const DEFAULT_THEMES: Record<'dark' | 'light', FlowThemeConfig> = {
    dark: {
        bgColor: '#1a1a1a',
        text: '#ffffff',
        icon: '#cccccc',
    },
    light: {
        bgColor: '#ffffff',
        text: '#000000',
        icon: '#333333',
    },
};

/**
 * useFlowTheme hook - provides getter and setter for theme management.
 * Fully reactive to both device theme changes and user-set themes.
 * 
 * @param scope - Optional scope ID (defaults to current context)
 * @returns {theme, getTheme, setTheme, resolvedTheme, deviceTheme}
 */
export function useFlowTheme (scope?: string) {
    const context = useFlowContext();

    // State for device theme - uses Appearance API for reactivity
    const [deviceTheme, setDeviceTheme] = useState<ColorSchemeName>(
        Appearance.getColorScheme() || 'light'
    );

    // Subscribe to device theme changes
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({colorScheme}) => {
            setDeviceTheme(colorScheme || 'light');
        });
        return () => subscription.remove();
    }, []);

    // Determine target scope - supports cross-pack access with dotted names
    const targetScope = scope || context.parentId || context.flowId;

    // Subscribe to registry for immediate reactivity on user theme changes
    const [registryTick, setRegistryTick] = useState(0);
    useEffect(() => {
        const unsub = flowRegistry.subscribe(() => setRegistryTick(t => t + 1));
        return unsub;
    }, []);

    // Get current theme from registry or fall back to device theme
    const getTheme = useCallback((): FlowThemeValue => {
        if(!targetScope) return deviceTheme || 'light';

        // Try to get theme from current node or walk up hierarchy
        const node = flowRegistry.getNode(targetScope);
        if(node?.props?.theme) return node.props.theme;

        // Check parent chain
        const chain = flowRegistry.getParentChain(targetScope);
        for(const ancestor of chain) {
            if(ancestor.props?.theme) return ancestor.props.theme;
        }

        // Fall back to device theme
        return deviceTheme || 'light';
    }, [targetScope, deviceTheme, registryTick]);

    // Resolve theme to actual config object
    const resolveTheme = useCallback((themeValue: FlowThemeValue): FlowThemeConfig => {
        if(typeof themeValue === 'string') {
            return DEFAULT_THEMES[themeValue as 'dark' | 'light'] || DEFAULT_THEMES.light;
        }
        // It's already an object - merge with defaults based on bgColor darkness
        const isDark = themeValue.bgColor?.includes('#1') ||
            themeValue.bgColor?.includes('#0') ||
            themeValue.bgColor?.toLowerCase().includes('dark');
        const base = isDark ? DEFAULT_THEMES.dark : DEFAULT_THEMES.light;
        return {...base, ...themeValue};
    }, []);

    // Set theme - immediately updates registry and triggers re-renders
    const setTheme = useCallback((theme: FlowThemeValue) => {
        if(!targetScope) {
            console.warn('[useFlowTheme] No scope available to set theme');
            return;
        }

        // Update the node's theme prop in registry
        flowRegistry.updateNodeProps(targetScope, {theme});

        // Registry notify will trigger re-renders across all subscribed components
    }, [targetScope]);

    // Current theme value
    const theme = getTheme();

    // Resolved theme config (always an object with bgColor, text, icon)
    const resolvedTheme = resolveTheme(theme);

    return {
        theme,           // Raw theme value ('dark'|'light'|object)
        getTheme,        // Getter function
        setTheme,        // Setter function - immediate UI update
        resolvedTheme,   // Resolved config object with bgColor, text, icon, etc.
        deviceTheme,     // Device preference ('dark'|'light')
    };
}

export default useFlowTheme;
