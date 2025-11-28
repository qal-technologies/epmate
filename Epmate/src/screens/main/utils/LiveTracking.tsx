import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, StatusBar, TouchableOpacity, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from 'theme/theme';
import { useSelector } from 'react-redux';
import HelperDetails from './HelperDetailsCard';

const LiveTracking: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>( null );
  const { locationData, selectedHelper } = useSelector( ( state: any ) => state.order );

  const initialRegion = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={ styles.container }>
      <StatusBar translucent backgroundColor={ 'transparent' } barStyle="dark-content" />

      <MapView
        ref={ mapRef }
        provider={ PROVIDER_GOOGLE }
        style={ styles.map }
        initialRegion={ initialRegion }
      >
      </MapView>

      {/* Header with Back Button */ }
      <View style={ styles.header }>
        <TouchableOpacity
          style={ styles.backButton }
          onPress={ () => navigation.navigate( 'MainDrawer' ) }
        >
          <MaterialIcons name="arrow-back" size={ 24 } color={ theme.colors.text } />
        </TouchableOpacity>
        <Text style={ styles.headerTitle }>Live Tracking</Text>

        <TouchableOpacity onPress={ () => { } } >
          <MaterialIcons name='person' size={ 20 } color={ theme.colors.text } />
        </TouchableOpacity>
      </View>

      {/* Helper Details at Bottom */ }
      <View style={ styles.bottomSheet }>
        <HelperDetails />
      </View>
    </View>
  );
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    padding: 12,
  },
  backButton: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    marginLeft: 15,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: 10,
  },
} );

export default LiveTracking;
