import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {useFlow, useFlowNav} from '@flows';
import ServiceFlow from './ServiceFlow';

const MainFlow = () => {
  const Flow = useFlow();

  const HomeScreen = () => {
    const nav = Flow.nav();
    return (
    <View style={styles.container}>
      <Text style={styles.title}>Main Flow Home</Text>
        <Button title="Go to Service Flow" onPress={() => nav.open('ServiceFlow')} />
    </View>
    );
  };

  return (
    <Flow.Navigator>
      <Flow.Parent name="Main">
        <Flow.FC name="Home" page={<HomeScreen />} />
        <Flow.FC name="ServiceFlow" page={<ServiceFlow />} />
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
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default MainFlow;
