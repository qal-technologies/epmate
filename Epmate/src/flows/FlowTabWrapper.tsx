import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, Appearance} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {useFlowNav} from './hooks/useFlowNav';
import {FlowProvider} from './core/FlowProvider';
import {useFlowBackHandler} from './core/FlowBackHandler';
import {FlowTabProps, FlowChildProps} from './types';
import {Dimensions} from 'react-native';
import useScroll from './hooks/useScroll';
import useFlowTheme from './hooks/useFlowTheme';
// Default tab bar styles - used when tabStyle is empty or undefined
const DEFAULT_TAB_STYLE = {
  position: 'bottom' as const,
  bgColor: '#FFFFFF',
  spaceBottom: 0,
  spaceTop: 0,
  withShadow: false,
  opacity: 1,
  spaceLeft: 0,
  spaceRight: 0,
  tabSize: 'default' as const,
  space: 'loose',
  borderRadius: 'default' as const,
  width: 'full' as const,
  animate: true,
  type: 'screen' as const,
};

const getTabBarStyle = (tabStyle: FlowTabProps['tabStyle']) => {
  // Merge with defaults to protect from empty styles
  const mergedStyle = {
    ...DEFAULT_TAB_STYLE,
    ...(tabStyle && Object.keys(tabStyle).length > 0 ? tabStyle : {}),
  };

  const topPadding = Dimensions.get('window').height / 20 || 40;

  const {
    position,
    bgColor,
    spaceBottom,
    spaceTop,
    withShadow,
    spaceLeft,
    spaceRight,
    opacity,
    borderRadius,
    width,
    space,
    tabSize,
    type,
  } = mergedStyle;

  const baseStyle: any = {
    backgroundColor: bgColor,
    opacity: opacity,
    flexDirection: position === 'left' || position === 'right' ? 'column' : 'row',
  };

  // Position
  if(position === 'bottom') {
    baseStyle.position = 'absolute';
    baseStyle.bottom = spaceBottom;
    baseStyle.left = 0;
    baseStyle.right = 0;
  } else if(position === 'top') {
    baseStyle.position = 'absolute';
    baseStyle.top = space === 'tight' ? 0 : spaceTop + topPadding;
    baseStyle.paddingTop = space === 'tight' ? spaceTop + topPadding : 0;
    baseStyle.left = 0;
    baseStyle.right = 0;
  } else if(position === 'left') {
    baseStyle.width = 80;
    baseStyle.height = '99%';
    baseStyle.left = spaceLeft;
  } else if(position === 'right') {
    baseStyle.width = 80;
    baseStyle.height = '99%';
    baseStyle.right = spaceRight;
  }

  //center sidebar (with endSpace):
  if((position === 'left' || position === 'right') && width === 'endSpace') {
    baseStyle.height = type === 'overlay' ? 'auto' : '50%';
    baseStyle.top = type === 'overlay' ? '25%' : 0;
    baseStyle.bottom = type === 'overlay' ? '25%' : 0;
    baseStyle.justifyContent = 'center';
    baseStyle.alignSelf = 'center';
    baseStyle.position = type === 'overlay' ? 'absolute' : 'relative';
    baseStyle.width = tabSize === 'small' ? 60 : tabSize === 'large' ? 120 : tabSize === 'default' ? 80 : tabSize;
  }

  // Shadow
  if(withShadow) {
    baseStyle.shadowColor = '#000';
    baseStyle.shadowOffset = {width: 0, height: 2};
    baseStyle.shadowOpacity = 0.2;
    baseStyle.shadowRadius = 3;
    baseStyle.elevation = 4;
  }

  // Border Radius
  if(borderRadius === 'curvedTop') {
    baseStyle.borderTopLeftRadius = 25;
    baseStyle.borderTopRightRadius = 25;
  } else if(borderRadius === 'curvedBottom') {
    baseStyle.borderBottomLeftRadius = 25;
    baseStyle.borderBottomRightRadius = 25;
  } else if(borderRadius === 'curved') {
    baseStyle.borderBottomLeftRadius = 25;
    baseStyle.borderBottomRightRadius = 25;
    baseStyle.borderTopLeftRadius = 25;
    baseStyle.borderTopRightRadius = 25;
  }

  // Width
  if(width === 'endSpace') {
    if(position === 'left' || position == 'right') {
      baseStyle.marginHorizontal = 0;
    } else {
      baseStyle.marginHorizontal = 20;
    }
  }

  return {...tabStyle, ...baseStyle};
};

export const FlowTabWrapper = React.memo(({
  parentId,
  activeChildId,
  tabStyle: propTabStyle,
  iconStyle: propIconStyle,
  children: renderedContent,
  tick,
}: {
  parentId: string;
  activeChildId: string;
  tabStyle?: FlowTabProps['tabStyle'];
  iconStyle?: FlowTabProps['iconStyle'];
  children: React.ReactNode;
  tick?: number;
}) => {
  const runtime = useFlowRuntime();
  const nav = useFlowNav(parentId);

  useFlowBackHandler(parentId);

  // Subscribe to registry for real-time updates (including theme changes)
  const [registryTick, setRegistryTick] = React.useState(0);
  React.useEffect(() => {
    const unsub = flowRegistry.subscribe(() => setRegistryTick(t => t + 1));
    return unsub;
  }, []);

  // Read tabStyle from registry (single source of truth)
  const packNode = flowRegistry.getNode(parentId);
  const tabStyle = packNode?.props?.tabStyle || propTabStyle || DEFAULT_TAB_STYLE;
  const iconStyle = packNode?.props?.iconStyle || propIconStyle;

  // Device theme detection with reactivity
  const [deviceTheme, setDeviceTheme] = React.useState(Appearance.getColorScheme() || 'light');
  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({colorScheme}) => {
      setDeviceTheme(colorScheme || 'light');
    });
    return () => subscription.remove();
  }, []);

  // Get theme from registry with device fallback for proper reactivity
  const flowTheme = packNode?.props?.theme || deviceTheme || 'light';

  const themeColors = flowTheme === 'dark'
    ? {bg: '#1a1a1a', text: '#ffffff', icon: '#cccccc', active: '#007AFF'}
    : {bg: '#ffffff', text: '#000000', icon: '#666666', active: '#007AFF'};


  // Use theme colors if bgColor not explicitly set
  const effectiveTabStyle = {
    ...tabStyle,
    bgColor: tabStyle?.bgColor || themeColors.bg,
    containerBgColor: tabStyle?.containerBgColor || themeColors.bg,
  };

  const childrenNodes = flowRegistry.getChildren(parentId);
  const activeChild = flowRegistry.getNode(activeChildId);
  const position = effectiveTabStyle?.position || 'bottom';

  // Default animate to true if not specified
  const shouldAnimate = tabStyle?.animate !== false;
  
  // Use enhanced scroll hook with touch support for hideOnScroll
  const {isScrolling, handleScroll, handleTouchStart, handleTouchEnd, handleTouchMove} = 
    useScroll(tabStyle?.hideOnScroll ? 500 : 300);

  // --- Hide Tab Logic ---
  // Use registry-based visibility - check on parentId (the tab parent), not activeChild
  const shouldHideTab = React.useMemo(() => {
    // Registry-based visibility takes priority - check parentId
    const registryVisible = flowRegistry.getTabVisibility(parentId);
    if(!registryVisible) return true;

    if(!activeChild) return false;
    if(activeChild.props?.hideTab) return true;

    // Check ancestors up to this pack
    const chain = flowRegistry.getParentChain(activeChild.id);
    for(const node of chain) {
      if(node.id === parentId) break;
      if(node.props?.hideTab) return true;
    }

    // hideOnScroll support - hide when scrolling, show when stopped
    // TODO: Fix the scroll to detect touches and drags on the renderer View element
    if(tabStyle?.hideOnScroll === true && isScrolling === true) {
      return true;
    }

    return false;
  }, [activeChild, isScrolling, parentId, registryTick, tabStyle?.hideOnScroll]);

  // --- Animation ---
  // Start visible (0), hide (1)
  const slideAnim = React.useRef(new Animated.Value(shouldHideTab ? 1 : 0)).current;

  React.useEffect(() => {
    if(shouldAnimate) {
      Animated.timing(slideAnim, {
        toValue: shouldHideTab ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // No animation - instant show/hide
      slideAnim.setValue(shouldHideTab ? 1 : 0);
    }
  }, [shouldHideTab, shouldAnimate]);

  const isSide = position === 'left' || position === 'right';
  const isTop = position === 'top';

  const translateVal = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isSide ? (position === 'left' ? -100 : 100) : (isTop ? -100 : 100)],
  });

  // Styles for animated view
  const animatedStyle = {
    transform: [
      isSide ? {translateX: translateVal} : {translateY: translateVal}
    ],
    // opacity: shouldHideTab ? 0 : 1,
    display: shouldHideTab && tabStyle?.type !== 'overlay' ? 'none' : 'flex',
  };

  const finalTabStyle = getTabBarStyle(tabStyle);

  function createColor (color: string, transparency: number | boolean) {
    const isTransparent = !!transparency;
    let colorType = 'word';

    if(color.includes('#')) colorType = 'hex';
    if(color.includes('rgb')) colorType = 'rgb';
    if(color.includes('rgba')) colorType = 'rgba';
    if(color.includes('hsl')) colorType = 'hsl';
    if(color.includes('hsla')) colorType = 'hsla';

    if(isTransparent) {
      const alpha = typeof transparency === 'number' ? transparency : 0.5;
      if(colorType === 'rgb' || colorType === 'rgba') {
        let final;
        switch(colorType) {
          case 'rgb':
            final = `rgba(${color},${alpha})`;
            break;
          case 'rgba':
            final = color;
            break;
        }
        return final;
      }

    }
    return color;
  }

  const renderTabBar = () => {
    const childrenNodes = flowRegistry.getChildren(parentId);


    return (
      <Animated.View style={[finalTabStyle, animatedStyle]}>
        <ScrollView
          horizontal={!isSide}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          fadingEdgeLength={childrenNodes.length > 4 ? 20 : 10}
          contentContainerStyle={{
            alignSelf: 'center',
            flexGrow: 1,
            justifyContent: 'space-around',
            alignItems: 'center',
            paddingInline: !isSide ? childrenNodes.length > 4 ? 5 : 0 : 0,
            gap: 5,
            overflow: 'hidden',
            zIndex: 9999999999999999,
            ...(isSide ? {flexDirection: 'column', paddingVertical: 20} : {}),
          }}
          style={[{flex: 1}]}
        >
          {childrenNodes.map(child => {
            const isActive = child.id === activeChildId;
            const childProps = child.props as FlowChildProps;

            // Icon resolution - support string or element/function
            const iconProp = child.props?.icon || childProps?.extras?.icon;
            const iconName = typeof iconProp === 'string' ? iconProp : 'circle';
            const isCustomIcon = typeof iconProp === 'function';

            const tabSizeProp: any = tabStyle?.tabSize || 'default';
            const label = childProps?.title || child.name;

            // Size defaults based on tabSize
            const getTabSizeValue = (size: typeof tabSizeProp | number, forIcon: boolean, withText: boolean, textOnly: boolean) => {
              const base = forIcon ? 20 : 11;

              if(size !== null && typeof size === 'number') {
                if(size < base) {
                  if(withText) {
                    return textOnly ? base + 6 : base;
                  } else {
                    return base + 6;
                  }
                };

                return textOnly ? size + 1 : size;
              } else {
                switch(size) {
                  case 'small':
                    {
                      if(withText) {
                        return !forIcon ? (textOnly ? 9 + 4 : 9) : 16;
                      } else {
                        return forIcon ? 16 + 6 : 9 + 6;
                      }
                    };
                  case 'large':
                    {
                      if(withText) {
                        return !forIcon ? (textOnly ? 14 + 4 : 14) : 28;
                      } else {
                        return forIcon ? 28 + 6 : 14 + 6;
                      }
                    };
                  case 'default':
                  default:
                    {
                      if(withText) {
                        return !forIcon ? (textOnly ? 11 + 4 : 11) : 20;
                      } else {
                        return forIcon ? 20 + 6 : 11 + 6;
                      }
                    }
                }
              }
            };

            const getIconActiveStyle = (style: typeof iconStyle.iconActiveStyle = 'opacity', activeColor: string) => {
              const generalStyle: any = {
                paddingInline: iconStyle?.textOnly ? (iconStyle?.textPadding ? iconStyle?.textPadding + 5 : 15) : 10,
                paddingBlock: iconStyle?.textOnly ? (iconStyle?.textPadding ? iconStyle?.textPadding - 4 : 5) : 10,
              };

              switch(style) {
                case 'opacity':
                  generalStyle.opacity = 1;
                  break;
                case 'top-border':
                  generalStyle.borderTopWidth = 2;
                  generalStyle.borderTopColor = activeColor;
                  break;
                case 'background':
                  //A very transparent color so it doesnt close the icon/text active color too
                  generalStyle.backgroundColor = createColor(activeColor, 0.1);
                  break;
                case 'bottom-border':
                  generalStyle.borderBottomWidth = 2;
                  generalStyle.borderBottomColor = activeColor;
                  break;
                case 'left-border':
                  generalStyle.borderLeftWidth = 2;
                  generalStyle.borderLeftColor = activeColor;
                  break;
                case 'right-border':
                  generalStyle.borderRightWidth = 2;
                  generalStyle.borderRightColor = activeColor;
                  break;
                case 'circle':
                  generalStyle.borderRadius = 20;
                  generalStyle.borderColor = activeColor;
                  generalStyle.borderWidth = 2;
                  generalStyle.marginVertical = 5;
                  break;
                default:
                  generalStyle.opacity = 1;
                  break;
              }

              return {...generalStyle};
            };

            // Icon size: use iconStyle.iconSize if specified, else derive from tabSize
            const iconSize = getTabSizeValue(iconStyle?.iconSize as number || tabSizeProp, true, iconStyle?.withText !== false, iconStyle?.textOnly === true);

            // Text size: use iconStyle.textSize if specified, else derive from tabSize  
            const textSize = getTabSizeValue(iconStyle?.textSize as number || tabSizeProp, false, iconStyle?.withText !== false, iconStyle?.textOnly === true);

            const color = isActive
              ? (iconStyle?.activeColor || 'black')
              : (iconStyle?.iconColor || '#999');

            return (

              <TouchableOpacity
                key={child.id}
                onPress={() => nav.open(child.name, undefined, {replace: true})}
                style={[{
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 60,
                  alignSelf: isActive ? 'center' : 'auto',
                  padding: 10,
                  zIndex: 99,
                  position: 'relative'
                },
                isActive && getIconActiveStyle(iconStyle?.iconActiveStyle, color)
                ]}
              >

                {iconStyle?.textOnly !== true && (isCustomIcon ? (
                  iconProp({size: isActive ? iconSize + 5 : iconSize, color})
                ) : (
                  <MaterialIcons
                    name={iconName as any}
                    size={isActive ? iconSize + 6 : iconSize}
                    color={color}
                  />
                ))}

                {iconStyle?.withText !== false && (
                  <Text style={{
                    color: iconStyle?.textColor || color,
                    fontSize: isActive ? textSize + 4 : textSize,
                    fontWeight: isActive ? '900' : '600',
                    marginTop: 4,
                    opacity: isActive ? 1 : 0.5,
                    letterSpacing: 0.3,
                    textAlign: 'center',
                    width: '100%',
                  }}
                    maxFontSizeMultiplier={1}
                  >
                    {iconStyle?.allCaps ? label.toUpperCase() : label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };



  return (
    <View style={{flex: 1, flexDirection: isSide ? 'row' : 'column', backgroundColor: tabStyle?.containerBgColor || '#f0f0f0'}}>

      <View style={{
        flex: 1,
      }}>
        <ScrollView
          onScroll={tabStyle?.hideOnScroll ? handleScroll : undefined}
          onTouchStart={tabStyle?.hideOnScroll ? handleTouchStart : undefined}
          onTouchMove={tabStyle?.hideOnScroll ? handleTouchMove : undefined}
          onTouchEnd={tabStyle?.hideOnScroll ? handleTouchEnd : undefined}
          scrollEventThrottle={16}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        >
          {renderedContent}
        </ScrollView>
        {tabStyle?.type === 'overlay' && renderTabBar()}
      </View>
      {tabStyle?.type !== 'overlay' && renderTabBar()}
    </View>);
});
