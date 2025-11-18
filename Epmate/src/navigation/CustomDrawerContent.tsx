// navigation/CustomDrawerContent.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { Avatar, Divider } from 'react-native-paper';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserRating } from '../hooks/useUserRating';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = props => {
  const [isHelperBoxVisible, setIsHelperBoxVisible] = useState(true);
  const fadeAnim = new Animated.Value(1); 
  const { rating, isLoading, isError } = useUserRating();
  const { user } = useSelector((state: any) => state.auth);

  const userName = (user && (user.name || user.displayName || user.email)) ?? 'User';

  useEffect(() => {
    const loadHelperVisibility = async () => {
      const value = await AsyncStorage.getItem('helperButtonVisible');
      if (value === 'false') setIsHelperBoxVisible(false);
    };
    loadHelperVisibility();
  }, []);

    const removeHelperButton = async () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsHelperBoxVisible(false));
      await AsyncStorage.setItem('helperButtonVisible', 'false');
  };
  
  const openHelperRegistration = () => {
    props.navigation.navigate('RegisterHelper');
  };
  
  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.userInfoSection}>
        <Avatar.Icon size={60} icon="account" />
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.ratingText}>
          <MaterialIcons
            name={'star'}
            color={theme.colors.background}
            size={14}
          />
          {isLoading ? 'Loading rating...' : `${rating ?? '0.00'} Rating`}
        </Text>
      </View>

      <Divider style={{ marginBottom: 20 }} />

      <DrawerItemList {...props} />

      {isHelperBoxVisible && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            marginTop: 'auto',
            marginBottom: 20,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity
              style={styles.helperButton}
              onPress={openHelperRegistration}
            >
              <Text style={styles.helperButtonText}>Become a Helper</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={removeHelperButton}>
              <MaterialIcons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  userInfoSection: {
    paddingLeft: 20,
    paddingVertical: 30,
  },
  userName: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 18,
  },
  ratingText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  helperButton: {
    flex: 1,
    backgroundColor: '#00D09C',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  helperButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomDrawerContent;
