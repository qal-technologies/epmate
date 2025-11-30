// navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import PolicyPage from '../screens/auth/Privacy';
import TermsPage from '../screens/auth/Terms';
import RolePage from '../screens/auth/ChooseRole';
import UserNameScreen from '../screens/auth/UserNameScreen';
import ForgotPasswordScreen from 'screens/auth/ForgotPasswordScreen';
import OTPScreen from 'screens/auth/OtpPage';
import SignupScreen from 'screens/auth/SignupScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={ { headerShown: false } }>
      
      <Stack.Screen
        name="Signup"
        component={SignupScreen as React.ComponentType<any>}
      />
    

      <Stack.Screen
        name="Terms"
        component={TermsPage as React.ComponentType<any>}
      />
      <Stack.Screen
        name="Policy"
        component={PolicyPage as React.ComponentType<any>}
      />
      <Stack.Screen
        name="Role"
        component={RolePage as React.ComponentType<any>}
      />

      <Stack.Screen
        name="userName"
        component={UserNameScreen as React.ComponentType<any>}
      />

      <Stack.Screen
        name="otp"
        component={OTPScreen as React.ComponentType<any>}
      />

    </Stack.Navigator>
  );
};

export default AuthNavigator;
