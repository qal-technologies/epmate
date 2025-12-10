import React from 'react';
import {useFlow} from '../flows/hooks/useFlow';
import {FlowKitchenSink} from './FlowKitchenSink';
import {FlowDebugOverlay} from '../flows/FlowDebugOverlay';
import {DashboardFlow} from './DashboardFlow';
import {AuthFlow} from './AuthFlow';


 const MainFlow = () => {
  const Flow = useFlow();
  return (
    <>
      <Flow.Navigator >
        <Flow.Pack
          name="GenPack"
          initial="Sink"
          navType='tab'
          tabStyle={{
            borderRadius: 'curved',
            withShadow: true,
            animate: true,
            spaceBottom: 10,
            width: 'endSpace',
            containerBgColor: 'white',
            type: 'overlay',
          }}
          iconStyle={{
            allCaps: true,
          }}
        >

          {/* Main Home Tab */}
          <Flow.Parent name="Sink" initial="Sink" icon='home' >
            <Flow.FC page={<FlowKitchenSink />} name='Sink' />
          </Flow.Parent>

          <Flow.Parent name="AuthSink" initial="AuthSink" icon='home' >
            <Flow.FC page={<AuthFlow />} name='AuthSink' />
          </Flow.Parent>
          {/* <AuthFlow /> */}
        </Flow.Pack>
        <DashboardFlow />
      </Flow.Navigator>
      <FlowDebugOverlay />
    </>
  );
};
