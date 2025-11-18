import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DraggableModal from './DraggableModal';
import ServiceSelectionModal from './ServiceSelectionModal';

const HomeScreen = ({ isSearching }) => {
  const mapRef = useRef(null);
  const navigation = useNavigation();

  if (isSearching && mapRef.current) {
    mapRef.current.animateToRegion(
      {
        latitude: 37.78825 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4324 + (Math.random() - 0.5) * 0.01,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      },
      1000
    );
  }

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
          icon="menu"
          size={30}
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        />
        <DraggableModal>
          <ServiceSelectionModal visible={true} onDismiss={() => {}} />
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1,
  },
});

export default HomeScreen;
