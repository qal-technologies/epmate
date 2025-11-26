import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useFlowNav } from '../../flows';

const StateTestPage = () => {
  const { next } = useFlowNav();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>State Management Test</Text>
      <Text>First Page</Text>
      <View style={{ height: 20 }} />
      <Button title="Next Page" onPress={() => next()} />
    </View>
  );
};

const NavigationTestPage = () => {
  const { prev } = useFlowNav();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation Test</Text>
      <Text>If you see this, navigation works!</Text>
      <Button title="Go Back" onPress={() => prev()} />
    </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export { StateTestPage, NavigationTestPage };
