import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    PanResponder,
    ScrollView,
    Appearance,
} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {useFlowNav} from './hooks/useFlowNav';
import {FlowDrawerStyle, FlowChildProps} from './types';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Default drawer styles
const DEFAULT_DRAWER_STYLE: Required<Omit<FlowDrawerStyle, 'width' | 'height' | 'triggerIcon' | 'triggerStyle'>> & Pick<FlowDrawerStyle, 'width' | 'height' | 'triggerIcon' | 'triggerStyle'> = {
    size: 'default',
    position: 'left',
    bgColor: '#ffffff',
    overlayOpacity: 0.5,
    gestureEnabled: true,
    animationDuration: 300,
    width: undefined,
    height: undefined,
    triggerIcon: undefined,
    triggerStyle: undefined,
    hideTrigger: false,
};

// Get drawer dimensions based on size and position
const getDrawerDimensions = (style: FlowDrawerStyle) => {
    const {size, position} = {...DEFAULT_DRAWER_STYLE, ...style};
    const isHorizontal = position === 'left' || position === 'right';

    let dimensionValue: number;

    switch(size) {
        case 'full':
            dimensionValue = isHorizontal ? SCREEN_WIDTH : SCREEN_HEIGHT;
            break;
        case 'icon':
            dimensionValue = isHorizontal ? 80 : 60;
            break;
        case 'default':
        default:
            dimensionValue = isHorizontal ? SCREEN_WIDTH * 0.85 : SCREEN_HEIGHT * 0.85;
            break;
    }

    return isHorizontal
        ? {width: style.width || dimensionValue, height: '100%'}
        : {width: '100%', height: style.height || dimensionValue};
};

interface FlowDrawerWrapperProps {
    parentId: string;
    activeChildId: string;
    drawerStyle?: FlowDrawerStyle;
    iconStyle?: any;
    children: React.ReactNode;
    tick?: number;
}

/**
 * FlowDrawerWrapper - Renders a drawer navigation layout
 * Supports left/right/top/bottom positions and full/default/icon sizes
 * Theme reactive with device fallback
 */
export const FlowDrawerWrapper = React.memo(({
    parentId,
    activeChildId,
    drawerStyle: propDrawerStyle,
    iconStyle: propIconStyle,
    children: renderedContent,
    tick,
}: FlowDrawerWrapperProps) => {
    const runtime = useFlowRuntime();
    const nav = useFlowNav(parentId);

    // Subscribe to registry for real-time updates
    const [registryTick, setRegistryTick] = React.useState(0);
    React.useEffect(() => {
        const unsub = flowRegistry.subscribe(() => setRegistryTick(t => t + 1));
        return unsub;
    }, []);

    // Read drawerStyle from registry (single source of truth)
    const packNode = flowRegistry.getNode(parentId);
    const drawerStyle = {...DEFAULT_DRAWER_STYLE, ...packNode?.props?.drawerStyle, ...propDrawerStyle};
    const iconStyle = packNode?.props?.iconStyle || propIconStyle;

    // Device theme detection with reactivity
    const [deviceTheme, setDeviceTheme] = React.useState(Appearance.getColorScheme() || 'light');
    React.useEffect(() => {
        const subscription = Appearance.addChangeListener(({colorScheme}) => {
            setDeviceTheme(colorScheme || 'light');
        });
        return () => subscription.remove();
    }, []);

    // Get theme from registry with device fallback
    const parentTheme = packNode?.props?.theme || deviceTheme;
    const themeColors = parentTheme === 'dark'
        ? {bg: '#1a1a1a', text: '#ffffff', icon: '#cccccc', active: '#007AFF'}
        : {bg: '#ffffff', text: '#000000', icon: '#666666', active: '#007AFF'};

    // Apply theme colors to drawer if not explicitly set
    const effectiveBgColor = drawerStyle.bgColor || themeColors.bg;

    const childrenNodes = flowRegistry.getChildren(parentId);
    const activeChild = flowRegistry.getNode(activeChildId);

    // Drawer visibility state - sync with registry
    const registryIsOpen = flowRegistry.getDrawerVisibility(parentId);
    const [isOpen, setIsOpen] = React.useState(registryIsOpen);
    const slideAnim = React.useRef(new Animated.Value(0)).current;

    // Sync local state with registry when it changes externally (via nav.openDrawer/closeDrawer)
    React.useEffect(() => {
        if(registryIsOpen !== isOpen) {
            setIsOpen(registryIsOpen);
            Animated.timing(slideAnim, {
                toValue: registryIsOpen ? 0 : getClosedTranslate(),
                duration: animationDuration,
                useNativeDriver: true,
            }).start();
        }
    }, [registryIsOpen]);

    const dimensions = getDrawerDimensions(drawerStyle);
    const {position, overlayOpacity, animationDuration, gestureEnabled} = drawerStyle;
    const isHorizontal = position === 'left' || position === 'right';

    // Get initial translate value based on position
    const getClosedTranslate = () => {
        const dim = isHorizontal ? dimensions.width : dimensions.height;
        const numericDim = typeof dim === 'number' ? dim : SCREEN_WIDTH * 0.85;

        switch(position) {
            case 'left': return -numericDim;
            case 'right': return numericDim;
            case 'top': return -numericDim;
            case 'bottom': return numericDim;
            default: return -numericDim;
        }
    };

    // Animate drawer open/close and sync with registry
    const toggleDrawer = React.useCallback((open?: boolean) => {
        const shouldOpen = open !== undefined ? open : !isOpen;
        setIsOpen(shouldOpen);

        // Sync with registry so other components can know drawer state
        flowRegistry.setDrawerVisibility(parentId, shouldOpen);

        Animated.timing(slideAnim, {
            toValue: shouldOpen ? 0 : getClosedTranslate(),
            duration: animationDuration,
            useNativeDriver: true,
        }).start();
    }, [isOpen, slideAnim, animationDuration, parentId]);

    // Initialize drawer closed
    React.useEffect(() => {
        slideAnim.setValue(getClosedTranslate());
    }, []);

    // Pan responder for swipe gestures
    const panResponder = React.useMemo(() =>
        PanResponder.create({
            onStartShouldSetPanResponder: () => gestureEnabled,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                if(!gestureEnabled) return false;
                const {dx, dy} = gestureState;
                return isHorizontal ? Math.abs(dx) > Math.abs(dy) : Math.abs(dy) > Math.abs(dx);
            },
            onPanResponderRelease: (_, gestureState) => {
                const threshold = 50;
                const {dx, dy} = gestureState;

                if(isHorizontal) {
                    if(position === 'left' && dx > threshold) toggleDrawer(true);
                    if(position === 'left' && dx < -threshold) toggleDrawer(false);
                    if(position === 'right' && dx < -threshold) toggleDrawer(true);
                    if(position === 'right' && dx > threshold) toggleDrawer(false);
                } else {
                    if(position === 'top' && dy > threshold) toggleDrawer(true);
                    if(position === 'top' && dy < -threshold) toggleDrawer(false);
                    if(position === 'bottom' && dy < -threshold) toggleDrawer(true);
                    if(position === 'bottom' && dy > threshold) toggleDrawer(false);
                }
            },
        }), [gestureEnabled, isHorizontal, position, toggleDrawer]);

    // Render drawer items
    const renderDrawerContent = () => (
        <Animated.View
            style={[
                styles.drawer,
                {
                    backgroundColor: effectiveBgColor,
                },

                isHorizontal && {width: dimensions.width as any},
                !isHorizontal && {height: dimensions.height as any},
                {
                    transform: [isHorizontal ? {translateX: slideAnim} : {translateY: slideAnim}],
                },

                position === 'left' && {left: 0},
                position === 'right' && {right: 0},
                position === 'top' && {top: 0},
                position === 'bottom' && {bottom: 0},
            ]}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.drawerScrollContent}
            >
                {childrenNodes.map(child => {
                    const isActive = child.id === activeChildId;
                    const childProps = child.props as FlowChildProps;
                    const iconProp = child.props?.icon;
                    const iconName = typeof iconProp === 'string' ? iconProp : 'circle';
                    const isCustomIcon = typeof iconProp === 'function';
                    const label = childProps?.title || child.name;
                    const showLabel = drawerStyle.size !== 'icon' && iconStyle?.withText !== false;

                    // Use iconStyle for sizing (default if not set)
                    const defaultIconSize = 24;
                    const defaultTextSize = 16;
                    const iconSize = iconStyle?.iconSize || defaultIconSize;
                    const textSize = iconStyle?.textSize || defaultTextSize;

                    // Use iconStyle colors with theme fallback
                    const iconColor = isActive
                        ? (iconStyle?.activeColor || themeColors.active).toString()
                        : (iconStyle?.iconColor || themeColors.icon).toString();
                    const textColor = isActive
                        ? (iconStyle?.activeColor || themeColors.active).toString()
                        : (iconStyle?.textColor || themeColors.text).toString();

                    return (
                        <TouchableOpacity
                            key={child.id}
                            onPress={() => {
                                nav.open(child.name, undefined, {replace: true});
                                toggleDrawer(false);
                            }}
                            style={[
                                styles.drawerItem,
                                isActive && styles.drawerItemActive,
                            ]}
                        >
                            {iconStyle?.textOnly !== true && (isCustomIcon ? (
                                iconProp({size: isActive ? iconSize + 4 : iconSize, color: iconColor})
                            ) : (
                                <MaterialIcons
                                    name={iconName as any}
                                    size={isActive ? iconSize + 4 : iconSize}
                                    color={iconColor}
                                />
                            ))}
                            {showLabel && (
                                <Text style={[
                                    styles.drawerItemText,
                                    {
                                        color: textColor,
                                        fontSize: isActive ? textSize + 2 : textSize,
                                        fontWeight: isActive ? '700' : '400',
                                    },
                                    iconStyle?.allCaps && {textTransform: 'uppercase'},
                                ]}>
                                    {iconStyle?.allCaps ? label.toUpperCase() : label}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </Animated.View>
    );

    // Render overlay
    const renderOverlay = () => (
        isOpen && (
            <TouchableOpacity
                style={[styles.overlay, {opacity: overlayOpacity}]}
                activeOpacity={1}
                onPress={() => toggleDrawer(false)}
            />
        )
    );

    // Render the trigger icon based on props
    const renderTriggerIcon = () => {
        const {triggerIcon, triggerStyle: ts} = drawerStyle;
        const iconSize = ts?.size || 24;
        const iconColor = ts?.color || themeColors.icon;

        if(typeof triggerIcon === 'function') {
            return triggerIcon({size: iconSize, color: iconColor});
        }
        if(typeof triggerIcon === 'string') {
            return <MaterialIcons name={triggerIcon as any} size={iconSize} color={iconColor} />;
        }
        if(React.isValidElement(triggerIcon)) {
            return triggerIcon;
        }
        // Default icon
        return <MaterialIcons name="menu" size={iconSize} color={iconColor} />;
    };

    // Get trigger button position styles
    const getTriggerPositionStyle = () => {
        const pos = drawerStyle.triggerStyle?.position ||
            (position === 'right' ? 'top-right' : 'top-left');

        switch(pos) {
            case 'top-right': return {top: 50, right: 10, left: undefined};
            case 'bottom-left': return {top: undefined, bottom: 50, left: 10};
            case 'bottom-right': return {top: undefined, bottom: 50, right: 10, left: undefined};
            case 'top-left':
            default: return {top: 50, left: 10};
        }
    };

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {/* Main content */}
            <View style={styles.content}>
                {/* Drawer toggle button - only if not hidden */}
                {!drawerStyle.hideTrigger && (
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            getTriggerPositionStyle(),
                            drawerStyle.triggerStyle?.backgroundColor && {
                                backgroundColor: drawerStyle.triggerStyle.backgroundColor,
                            },
                            drawerStyle.triggerStyle?.borderRadius && {
                                borderRadius: drawerStyle.triggerStyle.borderRadius,
                            },
                            drawerStyle.triggerStyle?.padding && {
                                padding: drawerStyle.triggerStyle.padding,
                            },
                        ]}
                        onPress={() => toggleDrawer()}
                    >
                        {renderTriggerIcon()}
                    </TouchableOpacity>
                )}

                {renderedContent}
            </View>

            {/* Overlay */}
            {renderOverlay()}

            {/* Drawer */}
            {renderDrawerContent()}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    content: {
        flex: 1,
    },
    drawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 1000,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: {width: 2, height: 0},
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    drawerScrollContent: {
        paddingVertical: 60,
        paddingHorizontal: 16,
    },
    drawerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 4,
    },
    drawerItemActive: {
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
    },
    drawerItemText: {
        marginLeft: 16,
        fontSize: 16,
        color: '#333',
    },
    drawerItemTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 999,
    },
    toggleButton: {
        position: 'absolute',
        top: 50,
        left: 10,
        zIndex: 100,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});

export default FlowDrawerWrapper;
