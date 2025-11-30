// screens/main/HomeScreen.tsx
import React, {useRef, useEffect} from 'react';
import {StyleSheet, View, StatusBar} from 'react-native';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useNavigation} from '@react-navigation/native';
import {IconButton} from 'react-native-paper';
import {MaterialIcons} from '@expo/vector-icons';
import {theme} from 'theme/theme';
import ServiceSelectionModal from './ServiceSelectionModal';
import SearchingHelpersModal from './services/utils/SearchingHelpersModal';
import {useSelector, useDispatch} from 'react-redux';
import {RootState} from '../../state/store';
import {setIsSearching} from '../../state/slices/orderSlice';
import * as Location from 'expo-location';
import {MAP_DELTAS, TIMEOUTS} from '../../constants/timeouts';

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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = React.useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const isSearching = useSelector((state: RootState) => state.order.isSearching);

  // Get user's location on mount
  useEffect(() => {
    (async () => {
      try {
        const {status} = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (__DEV__) console.log('Location permission denied');
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
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...userCoords,
              latitudeDelta: MAP_DELTAS.LATITUDE,
              longitudeDelta: MAP_DELTAS.LONGITUDE,
            },
            TIMEOUTS.MAP_USER_LOCATION_DURATION
          );
        }
      } catch (error) {
        if (__DEV__) console.error('Error getting location:', error);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
    });
    return unsubscribe;
  }, [navigation, isSearching]);

  const handleAnimateMap = () => {
    if(mapRef.current && userLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: MAP_DELTAS.LATITUDE,
          longitudeDelta: MAP_DELTAS.LONGITUDE,
        },
        TIMEOUTS.MAP_ANIMATION_DURATION,
      );
    }
  };

  const handleServiceSelect = () => {
    navigation.navigate('ServiceTypeSelection');
  };

  const handleSearchComplete = () => {
    dispatch(setIsSearching(false));
    navigation.navigate('HelperSelection');
  };

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <StatusBar translucent backgroundColor={'transparent'} />
      <View style={styles.container}>
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
            latitudeDelta: MAP_DELTAS.LATITUDE,
            longitudeDelta: MAP_DELTAS.LONGITUDE,
          }}
        />
        <IconButton
          icon={() => <MaterialIcons name="menu" size={28} color="black" />}
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        />
        {!isSearching && (
          <ServiceSelectionModal
            isSearching={false}
            onServiceSelect={handleServiceSelect}
          />
        )}
      </View>
      <SearchingHelpersModal
        visible={isSearching}
        onAnimateMap={handleAnimateMap}
        onComplete={handleSearchComplete}
      />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {...StyleSheet.absoluteFillObject},
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 8,
    zIndex: 1,
    backgroundColor: theme.colors.secondary,
  },
});

export default HomeScreen;
