// navigation/AppRootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { AppAuth, onAuthStateChanged } from '../utils/firebaseAuth';
import { login, logout } from '../state/slices/authSlice';
import NotificationPermissionModal from '../screens/main/utils/EnableNotification';
import LocationPermissionModal from '../screens/main/utils/LocationPermissionModal';
import SplashScreen from '../screens/SplashScreen';
import RolePage from 'screens/auth/ChooseRole';

const AppRootNavigator: React.FC = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [roleSelected, setRoleSelected] = useState(false);
  const [userId, setId] = useState('');

  useEffect(() => {
    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (!showNotificationModal) {
      const unsubscribe = onAuthStateChanged(AppAuth, user => {
        if (user) {
          dispatch(login({ uid: user.uid, email: user.email ?? undefined }));
          setId(userId);
          setUserLoggedIn(true);
        } else {
          dispatch(logout());
          setUserLoggedIn(false);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [showNotificationModal, dispatch]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (showNotificationModal) {
    return (
      <NotificationPermissionModal
        visible={showNotificationModal}
        onDismiss={() => setShowNotificationModal(false)}
      />
    );
  }

  if (showLocationModal) {
    return (
      <LocationPermissionModal
        visible={showLocationModal}
        onDismiss={() => setShowLocationModal(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!userLoggedIn) {
    return <AuthNavigator />;
  }

  return <AppNavigator />;
};

export default AppRootNavigator;
