import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { theme } from '../../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onDismiss: (state?: any) => void;
}
const LocationPermissionModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const [isGranted, setIsGranted] = useState<boolean>(true);

  useEffect(() => {
    const checkPermission = async () => {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        onDismiss();
      } else {
        setIsGranted(false);
      }
    };
    checkPermission();
  }, []);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      onDismiss();
      setIsGranted(true);
      return;
    }
    if (__DEV__) console.log('Location permissions denied.');
    onDismiss();
  };

  if (isGranted) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <MaterialIcons
            name="location-pin"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={styles.title}>Location Permission</Text>
        </View>

        <Text style={styles.message}>
          We need your location to find helpers near you.
        </Text>
        <View style={styles.buttonContainer}>
          <Button
            onPress={onDismiss}
            mode="outlined"
            textColor={theme.colors.primary}
            style={{ borderColor: theme.colors.primary, paddingHorizontal: 0 }}
          >
            Maybe later
          </Button>

          <Button
            onPress={requestLocationPermission}
            mode="contained"
            buttonColor={theme.colors.primary}
            style={{ paddingHorizontal: 20 }}
          >
            Allow
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
});

export default LocationPermissionModal;
