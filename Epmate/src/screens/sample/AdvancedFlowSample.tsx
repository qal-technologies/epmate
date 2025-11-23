import React from 'react';
import { View, Button } from 'react-native';
import { useFlow } from '../../flows';
import FlowNavigator from '../../flows/FlowNavigator';
import { Text } from 'react-native-paper';

const Flow = useFlow().create();

const InternalNavSample: React.FC<{ flow?: any }> = ({ flow }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Internal Navigation Sample</Text>
    <Button title="Next" onPress={() => flow.next()} />
  </View>
);

const NeighborNavSample: React.FC<{ flow?: any }> = ({ flow }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Neighbor Navigation Sample</Text>
    <Button
      title="Open Settings"
      onPress={() => flow.open('settings', 'options')}
    />
  </View>
);

const AdvancedFlowSample = () => {
  return (
    <>
      <Flow.Navigator>
        <Flow.Page name="onboarding">
          <Flow.Page.FC name="step1" page={<InternalNavSample />} />
          <Flow.Page.FC name="step2" page={<NeighborNavSample />} />
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
