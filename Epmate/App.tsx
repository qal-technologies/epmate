import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider } from 'react-native-paper';
import { Provider, useSelector } from 'react-redux';
import { store } from './src/state/store';
import { useLocationPermission } from './src/hooks/useLocationPermission';
import LocationPermissionModal from './src/screens/main/LocationPermissionModal';
import AppRootNavigator from './src/navigation/AppRootNavigator';
import SplashScreen from './src/screens/SplashScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
};

const Root = () => {
  const { isLoggedIn } = useSelector((state: any) => state.auth);
  const locationPermissionGranted = useLocationPermission();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (!showSplash) {
      if (isLoggedIn && !locationPermissionGranted) {
        setIsModalVisible(true);
      }
    }
  }, [showSplash, isLoggedIn, locationPermissionGranted]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider>
      <NavigationContainer>
        <AppRootNavigator />
      </NavigationContainer>
      <LocationPermissionModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
      />
    </PaperProvider>
  );
};

export default App;
