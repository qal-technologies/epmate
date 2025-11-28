import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/state/store';
import AppRootNavigator from './src/navigation/AppRootNavigator';
import { NavigationContainer } from '@react-navigation/native';

const App = () => {
  return (
    <Provider store={ store }>
        <PersistGate loading={ null } persistor={ persistor }>
          <Root />
        </PersistGate>
    </Provider>
  );
};

const Root = () => {
  return (
    <PaperProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NavigationContainer>
          <AppRootNavigator />
        </NavigationContainer>
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

export default App;
