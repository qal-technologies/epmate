import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import { request, PERMISSIONS } from 'react-native-permissions';
import { Platform } from 'react-native';
import { theme } from '../../theme/theme';

interface Props{
  visible: boolean;
  onDismiss: (state?:any) => void;
}
const LocationPermissionModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const requestLocationPermission = () => {
    const permission:any = Platform.select({
      ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    });
    request(permission).then((result) => {
      console.log(result);
      onDismiss();
    });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal} >
        <Text style={styles.title}>Location Permission</Text>
        <Text style={styles.message}>
          We need your location to find helpers near you.
        </Text>
        <View style={styles.buttonContainer}>
          <Button onPress={requestLocationPermission} mode='contained' buttonColor={theme.colors.primary}>Allow</Button>
          <Button onPress={onDismiss} mode='outlined'>Maybe later</Button>
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
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default LocationPermissionModal;
