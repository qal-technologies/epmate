import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useFlow } from '../../flows';
import { StateTestPage, NavigationTestPage } from './SamplePages';

/**
 * FlowImprovementSample - Clean implementation of new Flow API
 */
const FlowImprovementSample = () => {
  const Flow = useFlow().create();
  const { open } = useFlow();
  
  // Debug: Log when component mounts
  React.useEffect(() => {
    if (__DEV__) console.log('[FlowImprovementSample] Component mounted');
  }, []);
  
  // Open first child after components mount
  React.useEffect(() => {
    if (__DEV__) console.log('[FlowImprovementSample] Attempting to open first child...');
    const timer = setTimeout(() => {
      open('improvementFlow', 'stateTest')
        .then(result => { if (__DEV__) console.log('[FlowImprovementSample] Open result:', result); })
        .catch(e => { if (__DEV__) console.log('[FlowImprovementSample] Open failed:', e); });
    }, 500);
    return () => clearTimeout(timer);
  }, [open]);
  
  return (
    <View style={{ flex: 1 }}>
      <Flow.Page name="improvementFlow" theme="dark">
        <Flow.Page.FC 
          name="stateTest" 
          page={<StateTestPage />}
          animationType="fade"
        />
        <Flow.Page.FC 
          name="navTest" 
          page={<NavigationTestPage />}
          animationType="slideLeft"
        />
      </Flow.Page>
      
      <Flow.Navigator />
    </View>
  );
};

export default FlowImprovementSample;
