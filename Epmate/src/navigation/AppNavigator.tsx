// navigation/AppNavigator.tsx
import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PickupDelivery from '../screens/main/services/errands/pickup/PickupDelivery';
import TaskCompletionScreen from '../screens/main/pages/Tasks/TaskCompletionScreen';
import RatingScreen from '../screens/main/pages/RatingScreen';
import IssueScreen from '../screens/main/IssueScreen';
import PaymentScreen from '../screens/main/pages/PaymentScreen';
import MyTasksScreen from '../screens/main/pages/Tasks/MyTasksScreen';
import SafetyScreen from '../screens/main/pages/SafetyScreen';
import CustomDrawerContent from './CustomDrawerContent';
import { HomeStackParamList, MainTabParamList, DrawerParamList } from './types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import ErrandsDeliveryModal from '../screens/main/services/errands/ErrandsDeliveryModal';
import ConfirmOrderScreen from '../screens/main/services/payment/ConfirmOrderScreen';
import ProcessingPaymentScreen from '../screens/main/services/payment/ProcessingPaymentScreen';
import CompletePaymentScreen from '../screens/main/services/payment/CompletePaymentScreen';
import SearchingHelpersModal from '../screens/main/services/utils/SearchingHelpersModal';
import HelperListModal from '../screens/main/services/utils/HelperListModal';
import ServiceSelectionModal from '../screens/main/ServiceSelectionModal';
import { theme } from 'theme/theme';
import FlowSampleScreen from '../screens/sample/FlowSampleScreen';
import AdvancedFlowSample from '../screens/sample/AdvancedFlowSample';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<HomeStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const HomeStack: React.FC = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showErrandModal, setShowErrandModal] = useState(false);
  const [showHelperListModal, setShowHelperListModal] = useState(false);
  const [currentService, setCurrentService] = useState('');
  const [errandOption, setErrandOption] = useState('');
  const [locationData, setLocationData] = useState<any>({
    pickupLocation: null,
    deliveryLocation: null,
    userId: null,
  });

  const handleFindHelpers = () => {
    setShowLocationModal(false);
    setIsSearching(true);
  };

  const handleHelpersFound = () => {
    setIsSearching(false);
    setShowHelperListModal(true);
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {(props: NativeStackScreenProps<HomeStackParamList, 'Home'>) => (
          <>
            <HomeScreen
              {...(props as any)}
              isSearching={isSearching}
              currentService={currentService}
            />
            <ServiceSelectionModal
              setCurrentService={setCurrentService}
              onServiceSelect={() => setShowErrandModal(true)}
            />

            {showErrandModal && (
              <ErrandsDeliveryModal
                setErrandOption={option => {
                  setErrandOption(option);
                  setShowLocationModal(true);
                }}
                visible={showErrandModal}
                onDismiss={() => setShowErrandModal(false)}
              />
            )}

            {showLocationModal && (
              <PickupDelivery
                visible={showLocationModal}
                onDismiss={() => setShowLocationModal(false)}
                onFindHelpers={data => {
                  setLocationData({
                    pickupLocation: data.pickupLocation,
                    deliveryLocation: data.deliveryLocation,
                    userId: data.userId,
                  });
                  setShowLocationModal(false);
                  setIsSearching(true);
                }}
              />
            )}
            {isSearching && (
              <SearchingHelpersModal
                visible={isSearching}
                onHelpersFound={() => {
                  setIsSearching(false);
                  setShowHelperListModal(true);
                }}
              />
            )}
            {showHelperListModal && (
              <HelperListModal
                visible={showHelperListModal}
                onDismiss={() => setShowHelperListModal(false)}
                onAcceptHelper={helperData => {
                  setShowHelperListModal(false);
                  props.navigation.navigate('ConfirmOrder', {
                    helperData,
                    locationData,
                  });
                }}
              />
            )}
          </>
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
        tabBarActiveTintColor: theme.colors.primary,
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
        name="Profile"
        component={ProfileScreen as React.ComponentType<any>}
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
        drawerActiveTintColor: theme.colors.primary,
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
       <Drawer.Screen
        name="Flow Sample"
        component={FlowSampleScreen as React.ComponentType<any>}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="autorenew" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Advanced Flow Sample"
        component={AdvancedFlowSample as React.ComponentType<any>}
        options={{
          drawerIcon: ({ color, size }) => (
            <MaterialIcons name="autorenew" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default AppNavigator;
