import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, Text } from 'react-native-paper';
import { Provider, useSelector } from 'react-redux';
import { store } from './src/state/store';
import { theme } from './src/theme/theme';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { useLocationPermission } from './src/hooks/useLocationPermission';
import LocationPermissionModal from './src/screens/main/LocationPermissionModal';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <Provider store={store}>
      <Root />
      <Text>A text in here....</Text>
    </Provider>
  );
};

const Root = () => {
  const { isLoggedIn } = {isLoggedIn: false};
  const locationPermissionGranted = useLocationPermission();
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (isLoggedIn && !locationPermissionGranted) {
      setIsModalVisible(true);
    }
  }, [isLoggedIn, locationPermissionGranted]);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="Main" component={AppNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <LocationPermissionModal
        visible={isModalVisible}
        onDismiss={() => setIsModalVisible(false)}
      />
    </PaperProvider>
  );
};

export default App;
