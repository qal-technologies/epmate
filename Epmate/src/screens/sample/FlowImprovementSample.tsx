import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useFlow } from '../../flows';
import { StateTestPage, NavigationTestPage } from './SamplePages';

/**
 * FlowImprovementSample - Clean implementation of new Flow API
 */
const FlowImprovementSample = () => {
  const Flow = useFlow();
  const nav = Flow.nav();
  
  // Debug: Log when component mounts
  React.useEffect(() => {
    if (__DEV__) console.log('[FlowImprovementSample] Component mounted');
  }, []);
  
  // Open first child after components mount
  React.useEffect(() => {
    if (__DEV__) console.log('[FlowImprovementSample] Attempting to open first child...');
    const timer = setTimeout(() => {
      nav.open('stateTest')
        .then(result => { if (__DEV__) console.log('[FlowImprovementSample] Open result:', result); })
        .catch(e => { if (__DEV__) console.log('[FlowImprovementSample] Open failed:', e); });
    }, 500);
    return () => clearTimeout(timer);
  }, [nav]);
  
  return (
    <View style={{ flex: 1 }}>
      <Flow.Parent name="improvementFlow">
        <Flow.FC 
          name="stateTest" 
          page={<StateTestPage />}
        />
        <Flow.FC 
          name="navTest" 
          page={<NavigationTestPage />}
        />
      </Flow.Parent>
      
      <Flow.Navigator />
    </View>
  );
};

export default FlowImprovementSample;
