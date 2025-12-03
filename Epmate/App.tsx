import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/state/store';
// import AppRootNavigator from './src/navigation/AppRootNavigator';
import { NavigationContainer } from '@react-navigation/native';

import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineNotice } from './src/components/OfflineNotice';
import MainFlow from './src/samples/MainFlow';
import MinimalFlowTest from './src/samples/MinimalFlowTest';

const App = () => {
  console.log('[App] Rendering');
  return (
    <Provider store={ store }>
        <PersistGate loading={ null } persistor={ persistor }>
          <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
               <MainFlow/>
            </GestureHandlerRootView>
          </ErrorBoundary>
        </PersistGate>
    </Provider>
  );
};

/*
const App = () => {
  return (
    <Provider store={ store }>
        <PersistGate loading={ null } persistor={ persistor }>
          <ErrorBoundary>
            <Root />
          </ErrorBoundary>
        </PersistGate>
    </Provider>
  );
};

const Root = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <OfflineNotice />
        <NavigationContainer>
          <AppRootNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};
*/

export default App;
