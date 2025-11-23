import React from 'react';
import { View, StyleSheet, BackHandler, Platform } from 'react-native';
import { flowRegistry } from './core/FlowRegistry';
import { useFlow } from './core/FlowInstance';
import FlowRenderer from './FlowRenderer';

/**
 * FlowProvider
 * - Wrap app root with this
 * - Provides a single overlay portal via FlowRenderer
 * - Handles Android back button: picks top-most active parent and calls prev() on it.
 */
export const FlowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const runtime = useFlow();

  React.useEffect(() => {
    const onBack = () => {
      try {
        const topParent = flowRegistry.findTopParentWithActiveChild();
        if (topParent) {
          runtime.prev(topParent);
          return true;
        }
        BackHandler.exitApp();
        return true;
      } catch (err) {
        return false;
      }
    };

    if (Platform.OS === 'android') {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBack,
      );
      return () => subscription.remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return;
  }, []);

  return (
    <View style={styles.container}>
      {children}
      <FlowRenderer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default FlowProvider;
