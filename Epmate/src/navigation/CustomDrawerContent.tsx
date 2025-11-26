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

  const userName =
    (user && (user.name || user.displayName || user.email)) ?? 'User';

  useEffect(() => {
    const loadHelperVisibility = async () => {
      const value = await AsyncStorage.getItem('helperButtonVisible');
      // if (value === 'false') setIsHelperBoxVisible(false);
      await AsyncStorage.setItem('helperButtonVisible', 'false');
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
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 15,
            justifyContent: 'flex-start',
          }}
          onPress={() => props.navigation.navigate('Profile')}
        >
          <Avatar.Icon
            size={60}
            icon="account"
            color={theme.colors.primary}
            style={{ backgroundColor: theme.colors.primaryTrans }}
          />
          <View>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.myAccountText}>My Account</Text>
          </View>
        </TouchableOpacity>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 10,
            marginTop: 10,
          }}
        >
          <MaterialIcons name={'star'} color={theme.colors.primary} size={18} />
          <Text style={styles.ratingText}>
            {isLoading ? 'Loading rating...' : `${rating ?? '0.00'} Rating`}
          </Text>
        </View>
      </View>

      <Divider style={{ marginBottom: 20 }} />

      <DrawerItemList {...props} />

      {isHelperBoxVisible && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            marginTop: 'auto',
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={openHelperRegistration}
            style={{
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: theme.colors.primaryTrans,
              padding: 12,
              borderRadius: 15,
              borderWidth: 1,
              borderColor:theme.colors.primary,
              width: '100%',
              display: 'flex',
              flexDirection:'column',
            }}
          >
            <Text style={styles.helperButtonTitle}>Become a Helper</Text>
            <Text style={styles.helperButtonText}>Help others and earn money at your own schedule</Text>
            <TouchableOpacity onPress={removeHelperButton} style={{position:'absolute', top:7, right:7}}>
              <MaterialIcons name="close" size={20} color={theme.colors.placeholder} />
            </TouchableOpacity>
          </TouchableOpacity>
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
  myAccountText: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'left',
  },
  ratingText: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  helperButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  helperButtonTitle: {
    fontSize: 18,
    marginBottom:2,
    fontWeight: 'bold',
  },
  helperButtonText: {
    color: theme.colors.primary,
    fontWeight: 'light',
    fontSize: 14.5,
  },
});

export default CustomDrawerContent;
