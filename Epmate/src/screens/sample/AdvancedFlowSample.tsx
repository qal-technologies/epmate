import React from 'react';
import { View, Button } from 'react-native';
import { useFlow } from '../../flows';
import { Text } from 'react-native-paper';


const InternalNavSample = () => {
  const nav = useFlow().nav();
  const state = useFlow().state();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Internal Navigation Sample</Text>
      <Button title="Set State and Go to Next" onPress={() => {
        state.set('from', 'step1');
        nav.next();
      }} />
    </View>
  );
};

const StateDisplaySample = () => {
  const nav = useFlow().nav();
  const state = useFlow().state();
  const from = state.get('from');

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>State from previous step:</Text>
      <Text>{JSON.stringify({ from })}</Text>
      <Button title="Next" onPress={() => nav.next()} />
    </View>
  );
};

const NeighborNavSample = () => {
  const nav = useFlow().nav();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Neighbor Navigation Sample</Text>
      <Button
        title="Open Settings"
        onPress={() => nav.open('settings')}
      />
    </View>
  );
};

const AutoNavSample = () => {
  const nav = useFlow().nav();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      nav.next();
    }, 2000);
    return () => clearTimeout(timer);
  }, [nav]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Auto Navigating in 2 seconds...</Text>
    </View>
  );
};

const AdvancedFlowSample = () => {
  const Flow = useFlow();
  
  return (
    <>
      <Flow.Parent name="onboarding">
        <Flow.FC name="step1" page={<InternalNavSample />} />
        <Flow.FC name="step2" page={<StateDisplaySample />} />
        <Flow.FC name="step3" page={<AutoNavSample />} />
        <Flow.FC name="step4" page={<NeighborNavSample />} />
      </Flow.Parent>
      
      <Flow.Parent name="settings" type="modal">
        <Flow.FC name="options" page={<Text>Settings Page</Text>} />
      </Flow.Parent>
      
      <Flow.Navigator />
    </>
  );
};

export default AdvancedFlowSample;
