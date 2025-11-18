import { useState, useEffect } from 'react';
import { check, PERMISSIONS } from 'react-native-permissions';
import { Platform } from 'react-native';

export const useLocationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const permission = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });
    check(permission).then((result) => {
      if (result === 'granted') {
        setPermissionGranted(true);
      }
    });
  }, []);

  return permissionGranted;
};
