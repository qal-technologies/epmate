import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useFlow } from '../flows/hooks/useFlow';
import {TextInput} from 'react-native-paper';

const Flow = useFlow();

// --- Components ---

const HomeScreen = () => {
  const nav = Flow.nav();
  const { getShared} = Flow.state();
  const username = getShared('username') || 'Guest';

  return (
    <View style={styles.screen}>
      
      <Text style={styles.title}>Dashboard: Welcome, {username}!</Text>
      <Button title="Go to Settings" onPress={() => nav.open('SettingsFlow')} />
      <View style={styles.spacer} />
      <Button 
        title="Logout" 
        color="red"
        onPress={() => nav.switchRoot('AuthPack')} 
      />
      <View style={styles.spacer} />
      <Button title="Switch to Kitchen Pack" onPress={() => nav.switchRoot('KitchenSinkPack')} />
      
    </View>
  );
};

const GeneralSettings = () => {
  const nav = Flow.nav();
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>General Settings</Text>
      <Button title="Go to Profile" onPress={() => nav.next()} />
      <Button title="Back to Home" onPress={() => nav.close()} />
    </View>
  );
};

const ProfileSettings = () => {
  const nav = Flow.nav();
  const { setShared } = Flow.state();
    const username = Flow.state().getShared('username') || ''; 
    
  return (
    <View style={styles.screen}>
          <Text style={styles.title}>Dashboard Profile Settings</Text>
          <Text>Username: {username}</Text>
          <TextInput
              value={username}
              style={{
                  height:50,
                  width:200,
                  marginVertical:10,
                  marginHorizontal:10
              }}
          onChangeText={(username)=> setShared('username', username)}
          />
      <Button 
        title="Set Name to 'User'" 
      />
      <View style={styles.spacer} />
      <Button title="Back" onPress={() => nav.prev()} />
    </View>
  );
};

// --- Flow Definition ---

export const DashboardFlow = () => {
  return (
    <Flow.Pack name="DashboardPack" initial="HomeParent" >
      {/* Main Dashboard Parent */}
      <Flow.Parent name="HomeParent" initial="Home" >
        <Flow.FC name="Home" page={<HomeScreen />}/>
        
        {/* Nested Settings Flow */}
        <Flow.FC name="SettingsFlow" page={
          <Flow.Parent name="Settings" initial="General">
            <Flow.FC name="General" page={<GeneralSettings />} />
            <Flow.FC name="Profile" page={<ProfileSettings />} />
          </Flow.Parent>
        } />
      </Flow.Parent>
    </Flow.Pack>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#e0f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  spacer: {
    height: 20,
  },
});
