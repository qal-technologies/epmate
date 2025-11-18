import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Avatar } from 'react-native-paper';

const CustomDrawerContent = (props) => {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.userInfoSection}>
        <Avatar.Icon size={50} icon="account" />
        <Text style={styles.userName}>John Doe</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  userInfoSection: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  userName: {
    marginTop: 10,
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
