import React from 'react';
import {useFlow} from '../flows/hooks/useFlow';
import {FlowKitchenSink} from './FlowKitchenSink';
import {FlowDebugOverlay} from '../flows/FlowDebugOverlay';
import {DashboardFlow} from './DashboardFlow';
import {AuthFlow} from './AuthFlow';


export const MainFlow = () => {
  const Flow = useFlow();
  return (
    <>
      <Flow.Navigator >
        <AuthFlow />
        <FlowKitchenSink />
        <DashboardFlow />
      </Flow.Navigator>
      <FlowDebugOverlay />
    </>
  );
};
