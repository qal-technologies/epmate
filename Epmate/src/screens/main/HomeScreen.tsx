// screens/main/HomeScreen.tsx
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from 'theme/theme';

interface Props {
  isSearching?: boolean;
}

const HomeScreen: React.FC<Props> = ({isSearching }) => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>( null );
  
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
  }, [ isSearching ] );
  
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
    left: 8,
    zIndex: 1,
    backgroundColor: theme.colors.secondary,
  },
});

export default HomeScreen;
