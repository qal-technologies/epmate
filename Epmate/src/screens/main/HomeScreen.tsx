// screens/main/HomeScreen.tsx
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import DraggableModal from './DraggableModal';
import ServiceSelectionModal from './ServiceSelectionModal';
import { IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { RESULTS } from 'react-native-permissions';
import LocationPermissionModal from './LocationPermissionModal';

interface Props {
  userId?: string | null;
  isSearching: boolean;
}

const HomeScreen: React.FC<Props> = ({ userId, isSearching }) => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const [location, hideLocation] = useState(!RESULTS.GRANTED || false);

  // Check userId on mount
  useEffect(() => {
    if (!userId) {
      Alert.alert('Unauthorized', 'Please login first.');
      navigation.replace('Login');
    }
  }, [userId, navigation]);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          icon={() => <MaterialIcons name="menu" size={28} color="white" />}
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        />
        <DraggableModal>
          <ServiceSelectionModal
            onSelectErrands={() =>
              navigation.navigate('ErrandType', { userId, visible:true })
            }
          />
          <LocationPermissionModal
            onDismiss={() => hideLocation(true)}
            visible={location}
          />
        </DraggableModal>
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
  menuButton: { position: 'absolute', top: 40, left: 10, zIndex: 1 },
});

export default HomeScreen;
