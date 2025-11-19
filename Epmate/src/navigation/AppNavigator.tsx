// navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AccountScreen from '../screens/main/AccountScreen';
import PickupDelivery from '../screens/main/PickupDelivery';
import TaskCompletionScreen from '../screens/main/TaskCompletionScreen';
import RatingScreen from '../screens/main/RatingScreen';
import IssueScreen from '../screens/main/IssueScreen';
import PaymentScreen from '../screens/main/PaymentScreen';
import MyTasksScreen from '../screens/main/MyTasksScreen';
import SafetyScreen from '../screens/main/SafetyScreen';
import CustomDrawerContent from './CustomDrawerContent';
import { HomeStackParamList, MainTabParamList, DrawerParamList } from './types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import ErrandsDeliveryModal from '../screens/main/ErrandsDeliveryModal';
import ConfirmOrderScreen from '../screens/main/ConfirmOrderScreen';
import ProcessingPaymentScreen from '../screens/main/ProcessingPaymentScreen';
import CompletePaymentScreen from '../screens/main/CompletePaymentScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const HomeStack: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {(props: NativeStackScreenProps<HomeStackParamList, 'Home'>) => (
          <HomeScreen {...(props as any)} isSearching={isSearching} />
        )}
      </Stack.Screen>

      <Stack.Screen name="PickupDelivery">
        {(
          props: NativeStackScreenProps<HomeStackParamList, 'PickupDelivery'>,
        ) => (
          <PickupDelivery {...(props as any)} setIsSearching={setIsSearching} />
        )}
      </Stack.Screen>

      <Stack.Screen name="ErrandType">
        {(props: NativeStackScreenProps<HomeStackParamList, 'ErrandType'>) => (
          <ErrandsDeliveryModal
            {...(props as any)}
            setIsSearching={setIsSearching}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="ConfirmOrder">
        {(
          props: NativeStackScreenProps<HomeStackParamList, 'ConfirmOrder'>,
        ) => <ConfirmOrderScreen {...(props as any)} />}
      </Stack.Screen>

      <Stack.Screen name="ProcessingPayment">
        {(
          props: NativeStackScreenProps<
            HomeStackParamList,
            'ProcessingPayment'
          >,
        ) => <ProcessingPaymentScreen {...(props as any)} />}
      </Stack.Screen>

      <Stack.Screen name="CompletePayment">
        {(
          props: NativeStackScreenProps<HomeStackParamList, 'CompletePayment'>,
        ) => <CompletePaymentScreen {...(props as any)} />}
      </Stack.Screen>

      <Stack.Screen
        name="TaskCompletion"
        component={TaskCompletionScreen as React.ComponentType<any>}
      />
      <Stack.Screen
        name="Rating"
        component={RatingScreen as React.ComponentType<any>}
      />
      <Stack.Screen
        name="Issue"
        component={IssueScreen as React.ComponentType<any>}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen as React.ComponentType<any>}
      />
    </Stack.Navigator>
  );
};

/** Tab navigator */
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00D09C',
        tabBarInactiveTintColor: 'gray',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack as React.ComponentType<any>}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Account"
        component={AccountScreen as React.ComponentType<any>}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

/** Drawer navigator - top-level app navigator after auth */
const AppNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#00D09C',
        drawerInactiveTintColor: 'gray',
      }}
    >
      <Drawer.Screen
        name="Main"
        component={MainTabs as React.ComponentType<any>}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Payment"
        component={PaymentScreen as React.ComponentType<any>}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="payment" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="My Tasks"
        component={MyTasksScreen as React.ComponentType<any>}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="check-circle" color={color} size={size} />
          ),
        }}
      />

      <Drawer.Screen
        name="Safety"
        component={SafetyScreen as React.ComponentType<any>}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="security" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AppNavigator;
