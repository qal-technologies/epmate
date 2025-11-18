// navigation/AppRootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { AppAuth, onAuthStateChanged } from '../utils/firebaseAuth';

const AppRootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(AppAuth, user => {
      setUserLoggedIn(!!user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {userLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppRootNavigator;
