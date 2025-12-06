import React from 'react';
import {View, StyleSheet} from 'react-native';
import FlowNavigator from './FlowNavigator';
import {ErrorBoundary} from '../components/ErrorBoundary';

/**
 * @component FlowNavigatorWrapper
 * @description
 * A wrapper component that integrates the `FlowNavigator` into the component tree.
 * It ensures that the `FlowNavigator` (which handles the actual rendering of active flows)
 * is present and that the container takes up the full available screen space.
 *
 * This component is exposed as `Flow.Navigator`.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} [props.children] - Optional children to render alongside the navigator.
 * @returns {React.ReactElement} A View containing the children and the FlowNavigator.
 */
export const FlowNavigatorWrapper: React.FC<{children?: React.ReactNode;}> = ({children}) => {
  return (
    <View style={styles.container}>
      {children}
      <ErrorBoundary>
        <FlowNavigator />
      </ErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
