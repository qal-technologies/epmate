import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useFlow} from '@flows';

// Ultra-minimal test to verify the Flow system works
const MinimalFlowTest = () => {
  const Flow = useFlow();

  const TestScreen = () => {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>✅ Flow System Works!</Text>
        <Text>If you see this, the core rendering is fixed.</Text>
      </View>
    );
  };

  return (
    <Flow.Navigator>
      <Flow.Parent name="TestFlow">
        <Flow.FC name="Test" page={<TestScreen />} />
      </Flow.Parent>
    </Flow.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4CAF50',
  },
});

export default MinimalFlowTest;
