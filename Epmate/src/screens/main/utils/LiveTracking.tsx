import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, StatusBar, TouchableOpacity, Text} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import {useNavigation} from '@react-navigation/native';
import {MaterialIcons} from '@expo/vector-icons';
import {theme} from 'theme/theme';
import {useDispatch, useSelector} from 'react-redux';
import HelperDetails from './HelperDetailsCard';
import ModalBackButton from 'components/ModalBackButton';
import * as Location from 'expo-location';


const customMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#f5f5f5"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616991"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#f5f5f5"}]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#bdbdbd"}]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{"color": "#eeefff"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{"color": "#e5e5e5"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9e9e9e"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{"color": "#009933"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#75ff75"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#30AF70"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9eff9e"}]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{"color": "#e5e5e5"}]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{"color": "#eeeeee"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#00ccff"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#000000"}]
  }
];

const LiveTracking: React.FC = () => {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const {locationData, selectedHelper} = useSelector((state: any) => state.order);
  const dispatch = useDispatch();
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if(status !== 'granted') {
          if(__DEV__) console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(userCoords);

        // Animate map to user location
        if(mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...userCoords,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            },
            1000
          );
        }
      } catch(error) {
        if(__DEV__) console.error('Error getting location:', error);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor={'transparent'} barStyle="dark-content" />

      <MapView
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={customMapStyle}
        mapType="standard"
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: userLocation?.latitude || 4.9517,
          longitude: userLocation?.longitude || 8.3417,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
      </MapView>

      <View style={styles.header}>
        <ModalBackButton onPress={() => navigation.navigate('MainDrawer')} title='Live Tracking' withTitle size={18} />

        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            backgroundColor: theme.colors.primaryTrans,
            overflow: 'hidden',
            marginBottom: 10,
          }}>
          <MaterialIcons name='person' size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <HelperDetails forTracking />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    height: 70,
    overflow: 'hidden',
    justifyContent: 'space-between',
    zIndex: 1,
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    paddingBottom: 0,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});

export default LiveTracking;
