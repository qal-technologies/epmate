import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { Provider } from 'react-redux';
import { store } from './src/state/store';
import AppRootNavigator from './src/navigation/AppRootNavigator';
import { NavigationContainer } from '@react-navigation/native';

const App = () => {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
};

const Root = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <AppRootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
