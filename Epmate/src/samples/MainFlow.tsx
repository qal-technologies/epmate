import React from 'react';
import {useFlow} from '../flows/hooks/useFlow';
import {FlowKitchenSink} from './FlowKitchenSink';
import {FlowDebugOverlay} from '../flows/FlowDebugOverlay';
import {DashboardFlow} from './DashboardFlow';
import {AuthFlow} from './AuthFlow';
import FlowEnhancedTest from './FlowEnhancedTest';


export const MainFlow = () => {
  const Flow = useFlow();
  return (
    <>
      <Flow.Navigator >
        <FlowEnhancedTest/>
        <FlowKitchenSink />
        <AuthFlow />
        <DashboardFlow />
      </Flow.Navigator>
      <FlowDebugOverlay />
    </>
  );
};
