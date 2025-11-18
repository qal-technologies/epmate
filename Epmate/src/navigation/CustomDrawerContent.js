import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Avatar, Divider, IconButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { useUserRating } from '../hooks/useUserRating';

const CustomDrawerContent = (props) => {
  const [isHelperBoxVisible, setIsHelperBoxVisible] = useState(true);
  const { rating, isLoading, isError } = useUserRating();
  const { user } = useSelector((state) => state.auth);

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.userInfoSection}>
        <Avatar.Icon size={50} icon="account" />
        <View style={styles.userInfoText}>
          <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
          <Text>My Account</Text>
        </View>
      </View>
      <View style={styles.ratingSection}>
        {isLoading && <Text>Loading rating...</Text>}
        {isError && <Text>Error fetching rating</Text>}
        {rating && <Text>⭐ {rating.toFixed(2)} Rating</Text>}
      </View>
      <Divider />
      <DrawerItemList {...props} />
      {isHelperBoxVisible && (
        <View style={styles.helperBox}>
          <Text style={styles.helperBoxTitle}>Become a helper</Text>
          <IconButton
            icon="close"
            size={20}
            onPress={() => setIsHelperBoxVisible(false)}
            style={styles.closeButton}
          />
        </View>
      )}
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  userInfoSection: {
    paddingLeft: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    marginLeft: 15,
  },
  userName: {
    fontWeight: 'bold',
  },
  ratingSection: {
    paddingLeft: 20,
    marginBottom: 10,
  },
  helperBox: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperBoxTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
});

export default CustomDrawerContent;
