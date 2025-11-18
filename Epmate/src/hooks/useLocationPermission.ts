import { useState, useEffect } from "react";
import { check, PERMISSIONS, PermissionStatus } from "react-native-permissions";
import { Platform } from "react-native";

export const useLocationPermission = () => {
  const [permissionGranted, setPermissionGranted] = useState < boolean > (false);

  useEffect(() => {
    const permission =
      Platform.OS === "ios"
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

    check(permission).then((result: PermissionStatus) => {
      if (result === "granted") {
        setPermissionGranted(true);
      }
    });
  }, []);

  return permissionGranted;
};
