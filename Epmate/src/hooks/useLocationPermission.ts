import { useState, useEffect } from "react";
import * as Location from "expo-location";

export const useLocationPermission = async () => {
  const [permissionGranted, setPermissionGranted] = useState < boolean > (false);

  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        return;
      }
      if (__DEV__) console.log('Location permissions denied.');
    };
    checkPermission();
  }, []);

  return permissionGranted;
};
