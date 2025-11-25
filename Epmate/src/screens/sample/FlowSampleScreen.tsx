import React from 'react';
import { View, Text, Button } from 'react-native';
import { useFlow } from '../../flows';
import FlowNavigator from '../../flows/FlowNavigator';

const Flow = useFlow().create();

const Page = ({ flow, title }: { flow?: any; title: string }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>{title}</Text>
    <View style={{ position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around' }}>
      <Button title="Prev" onPress={() => flow.api.prev()} />
      <Button title="Next" onPress={() => flow.api.next()} />
    </View>
  </View>
);

const FlowSampleScreen = () => {
  return (
    <>
      <Flow.Navigator>
        <Flow.Page name="sample">
          <Flow.Page.FC name="page1" page={<Page title="Page 1" />} />
          <Flow.Page.FC name="page2" page={<Page title="Page 2" />} />
          <Flow.Page.FC name="page3" page={<Page title="Page 3" />} />
        </Flow.Page>
      </Flow.Navigator>
      <FlowNavigator />
    </>
  );
};

export default FlowSampleScreen;
