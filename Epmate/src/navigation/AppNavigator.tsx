// navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PickupDelivery from '../screens/main/PickupDelivery';
import TaskCompletionScreen from '../screens/main/pages/Tasks/TaskCompletionScreen';
import RatingScreen from '../screens/main/pages/RatingScreen';
import IssueScreen from '../screens/main/IssueScreen';
import PaymentScreen from '../screens/main/pages/PaymentScreen';
import MyTasksScreen from '../screens/main/pages/Tasks/MyTasksScreen';
import SafetyScreen from '../screens/main/SafetyScreen';
import CustomDrawerContent from './CustomDrawerContent';
import { HomeStackParamList, MainTabParamList, DrawerParamList, RootStackParamList } from './types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import ErrandsDeliveryModal from '../screens/main/services/errands/ErrandsDeliveryModal';
import ConfirmOrderScreen from '../screens/main/services/payment/ConfirmOrderScreen';
import ProcessingPaymentScreen from '../screens/main/services/payment/ProcessingPaymentScreen';
import CompletePaymentScreen from '../screens/main/services/payment/CompletePaymentScreen';
import SearchingHelpersModal from '../screens/main/services/utils/SearchingHelpersModal';
import HelperListModal from '../screens/main/HelperListModal';
import ServiceSelectionModal from '../screens/main/ServiceSelectionModal';
import { theme } from 'theme/theme';
import CallPage from 'screens/main/utils/CallPage';
import LiveTracking from 'screens/main/utils/LiveTracking';
import { StatusBar } from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

const HomeStack: React.FC = () => {
  const [ isSearching, setIsSearching ] = useState( false );
  const [ showLocationModal, setShowLocationModal ] = useState( false );
  const [ showErrandModal, setShowErrandModal ] = useState( false );
  const [ showHelperListModal, setShowHelperListModal ] = useState( false );

  StatusBar.setBarStyle( 'dark-content' );
  StatusBar.setBackgroundColor( 'transparent' );

  return (
    <>
      <Stack.Navigator screenOptions={ { headerShown: false } }>

      <Stack.Screen name="Main">
          { ( props: NativeStackScreenProps<HomeStackParamList, 'Home'> ) => (
          <>
            <HomeScreen
                { ...( props as any ) }
                isSearching={ isSearching }
            />
            <ServiceSelectionModal
                isSearching={ isSearching }
                onServiceSelect={ () => setShowErrandModal( true ) }
            />

              { ( showErrandModal ) && (
              <ErrandsDeliveryModal
                  visible={ showErrandModal }
                  onDismiss={ () => {
                    setShowErrandModal( false );
                    setShowLocationModal( true );
                  } }
              />
              ) }

              { ( showLocationModal ) && (
              <PickupDelivery
                  visible={ showLocationModal }
                  onDismiss={ () => {
                    setShowLocationModal( false );
                    setIsSearching( true );
                  } }
              />
              ) }
              { isSearching && (
              <SearchingHelpersModal
                  visible={ isSearching }
                  onHelpersFound={ () => {
                    setIsSearching( false );
                    setShowHelperListModal( true );
                  } }
              />
              ) }
              { showHelperListModal && (
              <HelperListModal
                  visible={ showHelperListModal }
                  onDismiss={ () => {
                    setShowHelperListModal( false );
                    // Navigate to ConfirmOrder in RootStack
                    props.navigation.navigate( 'ConfirmOrder' as any );
                  } }
              />
              ) }
          </>
          ) }
      </Stack.Screen>

      <Stack.Screen
        name="TaskCompletion"
          component={ TaskCompletionScreen as React.ComponentType<any> }
      />

      <Stack.Screen
        name="Rating"
          component={ RatingScreen as React.ComponentType<any> }
      />
      <Stack.Screen
        name="Issue"
          component={ IssueScreen as React.ComponentType<any> }
      />
    </Stack.Navigator>
    </>
  );
};

/** Tab navigator */
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={ {
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',

      } }
    >
      <Tab.Screen
        name="Home"
        component={ HomeStack as React.ComponentType<any> }
        options={ {
          tabBarIcon: ( { color, size }: any ) => (
            <MaterialIcons name="home" color={ color } size={ size } />
          ),
        } }
      />

      <Tab.Screen
        name="Profile"
        component={ ProfileScreen as React.ComponentType<any> }
        options={ {
          tabBarIcon: ( { color, size }: any ) => (
            <MaterialIcons name="person" color={ color } size={ size } />
          ),
        } }
      />
    </Tab.Navigator>
  );
};

/** Drawer navigator - wraps Tabs */
const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={ ( props: any ) => <CustomDrawerContent { ...( props as any ) } /> }
      screenOptions={ {
        headerShown: false,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: 'gray',
      } }
    >
      <Drawer.Screen
        name="Main"
        component={ MainTabs as React.ComponentType<any> }
        options={ {
          drawerIcon: ( { color, size }: any ) => (
            <MaterialIcons name="home" color={ color } size={ size } />
          ),
        } }
      />

      <Drawer.Screen
        name="Payment"
        component={ PaymentScreen as React.ComponentType<any> }
        options={ {
          drawerIcon: ( { color, size }: any ) => (
            <MaterialIcons name="payment" color={ color } size={ size } />
          ),
        } }
      />

      <Drawer.Screen
        name="My Tasks"
        component={ MyTasksScreen as React.ComponentType<any> }
        options={ {
          drawerIcon: ( { color, size }: any ) => (
            <MaterialIcons name="check-circle" color={ color } size={ size } />
          ),
        } }
      />

      <Drawer.Screen
        name="Safety"
        component={ SafetyScreen as React.ComponentType<any> }
        options={ {
          drawerIcon: ( { color, size }: any ) => (
            <MaterialIcons name="security" color={ color } size={ size } />
          ),
        } }
      />
    </Drawer.Navigator>
  );
};

/** Root Stack - Top level navigator containing Drawer and Fullscreen pages */
const AppNavigator: React.FC = () => {
  return (
    <RootStack.Navigator screenOptions={ { headerShown: false } }>
      <RootStack.Screen name="MainDrawer" component={ DrawerNavigator } />

      <RootStack.Screen name="ConfirmOrder" component={ ConfirmOrderScreen as React.ComponentType<any> } />
      <RootStack.Screen name="ProcessingPayment" component={ ProcessingPaymentScreen as React.ComponentType<any> } />
      <RootStack.Screen name="CompletePayment" component={ CompletePaymentScreen as React.ComponentType<any> } />
      <RootStack.Screen name="CallPage" component={ CallPage as React.ComponentType<any> } />
      <RootStack.Screen name="LiveTracking" component={ LiveTracking as React.ComponentType<any> } />
    </RootStack.Navigator>
  );
};

export default AppNavigator;
