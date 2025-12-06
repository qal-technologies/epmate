import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform} from 'react-native';
import {MaterialIcons} from '@expo/vector-icons';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {useFlowNav} from './hooks/useFlowNav';
import {FlowProvider} from './core/FlowProvider';
import {useFlowBackHandler} from './core/FlowBackHandler';
import {theme} from '../theme/theme';
import {FlowTabProps, FlowChildProps} from './types';

// Helper to resolve styles
const getTabBarStyle = (tabStyle: FlowTabProps['tabStyle']) => {
  const {
    position = 'bottom',
    bgColor = '#fff',
    spaceBottom = 0,
    spaceTop = 0,
    withShadow = false,
    opacity = 1,
    borderRadius = 'default',
    width = 'full',
  } = tabStyle || {};

  const baseStyle: any = {
    backgroundColor: bgColor,
    opacity,
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
    baseStyle.top = spaceTop;
    baseStyle.left = 0;
    baseStyle.right = 0;
  } else if(position === 'left') {
    baseStyle.width = 80;
    baseStyle.height = '100%';
    baseStyle.left = 0;
  } else if(position === 'right') {
    baseStyle.width = 80;
    baseStyle.height = '100%';
    baseStyle.right = 0;
  }

  // Shadow
  if(withShadow) {
    baseStyle.shadowColor = '#000';
    baseStyle.shadowOffset = {width: 0, height: 2};
    baseStyle.shadowOpacity = 0.25;
    baseStyle.shadowRadius = 3.84;
    baseStyle.elevation = 5;
  }

  // Border Radius
  if(borderRadius === 'curvedTop') {
    baseStyle.borderTopLeftRadius = 20;
    baseStyle.borderTopRightRadius = 20;
  } else if(borderRadius === 'curvedBottom') {
    baseStyle.borderBottomLeftRadius = 20;
    baseStyle.borderBottomRightRadius = 20;
  } else if(borderRadius === 'curved') {
    baseStyle.borderRadius = 20;
  }

  // Width
  if(width === 'endSpace') {
    baseStyle.marginHorizontal = 20;
  }

  return baseStyle;
};

export const FlowTabWrapper = React.memo(({
  parentId,
  activeChildId,
  tabStyle,
  iconStyle,
  children: renderedContent, // The rendered active flow
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

  // Enable back handling
  useFlowBackHandler(parentId);

  const childrenNodes = flowRegistry.getChildren(parentId);
  const activeChild = flowRegistry.getNode(activeChildId);
  const position = tabStyle?.position || 'bottom';

  // Check if active child wants to hide the tab bar
  const shouldHideTab = activeChild?.props?.hideTab || false;

  const renderTabBar = () => (
    <View style={getTabBarStyle(tabStyle)}>
      <ScrollView
        horizontal={position !== 'left' && position !== 'right'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-around',
          alignItems: 'center',
          ...(position === 'left' || position === 'right' ? {flexDirection: 'column', paddingTop: 40} : {})
        }}
      >
        {childrenNodes.map(child => {
          const isActive = child.id === activeChildId;
          const childProps = child.props as FlowChildProps;
          // Expecting an icon name in extras or a specific prop
          const iconName = childProps.extras?.icon || 'circle';
          const label = childProps.title || child.name;

          const color = isActive
            ? (iconStyle?.activeColor || theme.colors.primary)
            : (iconStyle?.iconColor || '#888');

          return (
            <TouchableOpacity
              key={child.id}
              onPress={() => nav.open(child.name)}
              style={{
                padding: 10,
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 60,
              }}
            >
              <MaterialIcons
                name={iconName as any}
                size={iconStyle?.iconSize || 24}
                color={color}
              />
              {iconStyle?.withText !== false && (
                <Text style={{
                  color: iconStyle?.textColor || color,
                  fontSize: iconStyle?.textSize || 10,
                  marginTop: 4
                }}>
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const isSide = position === 'left' || position === 'right';

  return (
    <View style={{flex: 1, flexDirection: isSide ? 'row' : 'column', backgroundColor: '#f2f2f2'}}>
      {isSide && !shouldHideTab && renderTabBar()}

      <View style={{flex: 1, marginBottom: (!shouldHideTab && position === 'bottom') ? (tabStyle?.spaceBottom || 0) + 50 : 0}}>
        {renderedContent}
      </View>

      {!isSide && !shouldHideTab && renderTabBar()}
    </View>
  );
});
