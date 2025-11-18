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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const HomeStack = () => {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home">
        {(props) => <HomeScreen {...props} isSearching={isSearching} />}
      </Stack.Screen>
      <Stack.Screen name="PickupDelivery">
        {(props) => <PickupDelivery {...props} setIsSearching={setIsSearching} />}
      </Stack.Screen>
      <Stack.Screen name="TaskCompletion" component={TaskCompletionScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="Issue" component={IssueScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      {/* Add other screens related to the home flow here */}
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="Main" component={MainTabs} />
      <Drawer.Screen name="Payment" component={PaymentScreen} />
      <Drawer.Screen name="My Tasks" component={MyTasksScreen} />
      <Drawer.Screen name="Safety" component={SafetyScreen} />
      {/* Add other drawer screens here */}
    </Drawer.Navigator>
  );
};

export default AppNavigator;
