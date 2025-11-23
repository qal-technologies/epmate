// screens/main/HomeScreen.tsx
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Alert, StatusBar } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { IconButton, Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { theme } from 'theme/theme';

interface Props {
  userId?: string | null;
  currentService?: string | null;
}

const HomeScreen: React.FC<Props> = ({ userId, currentService }) => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const storedUserId = useSelector((state: any) => state.auth.user?.id);
  const [isHelperListVisible, setIsHelperListVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Check userId on mount
  useEffect(() => {
    const idToUse = userId || storedUserId;
    if (!idToUse) {
      Alert.alert('Unauthorized', 'Please login first.');
      navigation.replace('Login');
    }
  }, [userId, storedUserId, navigation]);

  // Animate map if searching
  useEffect(() => {
    if (isSearching && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: 37.78825 + (Math.random() - 0.5) * 0.01,
          longitude: -122.4324 + (Math.random() - 0.5) * 0.01,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000,
      );
    }
  }, [isSearching]);
  const hideHelperList = () => setIsHelperListVisible(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar translucent backgroundColor={'transparent'} />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
        <IconButton
          icon={() => <MaterialIcons name="menu" size={28} color="black" />}
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: { ...StyleSheet.absoluteFillObject },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1,
    backgroundColor: theme.colors.secondary,
  },
});

export default HomeScreen;
