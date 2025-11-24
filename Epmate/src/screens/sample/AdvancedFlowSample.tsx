import React from 'react';
import { View, Button } from 'react-native';
import { useFlow } from '../../flows';
import FlowNavigator from '../../flows/FlowNavigator';
import { Text } from 'react-native-paper';

const Flow = useFlow().create();

const InternalNavSample: React.FC<{ flow?: any }> = ({ flow }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Internal Navigation Sample</Text>
    <Button title="Set State and Go to Next" onPress={() => {
      flow.api.setFlowState('onboarding', { from: 'step1' });
      flow.api.next();
    }} />
  </View>
);

const StateDisplaySample: React.FC<{ flow?: any }> = ({ flow }) => {
  const [state, setState] = React.useState<any>({});

  React.useEffect(() => {
    setState(flow.api.getFlowState('onboarding'));
  }, [flow]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>State from previous step:</Text>
      <Text>{JSON.stringify(state)}</Text>
      <Button title="Next" onPress={() => flow.api.next()} />
    </View>
  );
};

const NeighborNavSample: React.FC<{ flow?: any }> = ({ flow }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Neighbor Navigation Sample</Text>
    <Button
      title="Open Settings"
      onPress={() => flow.api.open('settings', 'options')}
    />
  </View>
);

const AutoNavSample: React.FC<{ flow?: any }> = ({ flow }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      flow.api.next();
    }, 2000);
    return () => clearTimeout(timer);
  }, [flow]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Auto Navigating in 2 seconds...</Text>
    </View>
  );
};

const AdvancedFlowSample = () => {
  return (
    <>
      <Flow.Navigator>
        <Flow.Page name="onboarding">
          <Flow.Page.FC name="step1" page={<InternalNavSample />} />
          <Flow.Page.FC name="step2" page={<StateDisplaySample />} />
          <Flow.Page.FC name="step3" page={<AutoNavSample />} />
          <Flow.Page.FC name="step4" page={<NeighborNavSample />} />
        </Flow.Page>
        <Flow.Modal name="settings">
          <Flow.Modal.FC name="options" page={<Text>Settings Page</Text>} />
        </Flow.Modal>
      </Flow.Navigator>
      <FlowNavigator />
    </>
  );
};

export default AdvancedFlowSample;
