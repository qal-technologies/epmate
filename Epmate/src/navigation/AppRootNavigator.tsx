// navigation/AppRootNavigator.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { AppAuth, onAuthStateChanged } from '../utils/firebaseAuth';
import { login, logout } from '../state/slices/authSlice';
import NotificationPermissionModal from '../screens/main/utils/EnableNotification';
import LocationPermissionModal from '../screens/main/utils/LocationPermissionModal';
import SplashScreen from '../screens/SplashScreen';

/**
 * Checks if user has completed their profile setup
 * Profile is complete when user has both displayName and role
 */
const checkAuthAndUserProfile = ( authState: any ) =>
{
  const { isLoggedIn, user, role } = authState;

  // If not logged in, navigate to auth
  if ( !isLoggedIn )
  {
    return { showAuth: true, profileComplete: false };
  }

  // Check if profile is complete (has displayName and role)
  const hasDisplayName = user?.displayName && user.displayName.trim().length > 0;
  const hasRole = role !== null && role !== undefined;

  const profileComplete = hasDisplayName && hasRole;

  return { showAuth: false, profileComplete };
};

const AppRootNavigator: React.FC = () => {
  const dispatch = useDispatch();
  const [ isLoading, setIsLoading ] = useState( true );
  const [showLocationModal, setShowLocationModal] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Get auth state from Redux store
  const authState = useSelector( ( state: any ) => state.auth );

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
          // User is authenticated - dispatch basic login info
          // Additional profile data will come from OTP/Role/UserName screens
          dispatch( login( {
            id: user.uid,
            mobile: user.phoneNumber ?? undefined
          } ) );
        } else {
          // dispatch( logout() );
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

  // Check authentication and profile status
  const { showAuth, profileComplete } = checkAuthAndUserProfile( authState );

  // If not logged in, show auth screens
  if ( showAuth ) return <AuthNavigator />;
  // if ( showAuth ) return <AuthNavigator />;

  // If logged in but profile incomplete, show auth screens to complete profile
  // The AuthNavigator will handle routing to userName/Role screens
  if ( !profileComplete ) return <AuthNavigator />;

  // User is logged in with complete profile - show main app
  return <AppNavigator />;
};

export default AppRootNavigator;
