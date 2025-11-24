import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Provider, Text, Modal, Portal } from 'react-native-paper';
import AuthBtn from '../../components/AuthButton';
import { theme } from '../../theme/theme';
import { useSelector } from 'react-redux';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onFindHelpers: (data: {
    pickupLocation: string;
    deliveryLocation: string;
    userId: string;
  }) => void;
}
const PickupDelivery: React.FC<Props> = ({
  onDismiss,
  onFindHelpers,
  visible,
}) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const storedUserId = useSelector((state: any) => state.auth.user?.id);

  const isButtonEnabled = pickupLocation !== '' && deliveryLocation !== '';

  const findHelper = async () => {
    try {
      // await fetch('/.netlify/functions/createErrand', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     pickupLocation,
      //     deliveryLocation,
      //     userId: storedUserId,
      //   }),
      // });
      onFindHelpers({
        pickupLocation,
        deliveryLocation,
        userId: storedUserId,
      });
      onDismiss();
    } catch (error) {
      console.error('Error creating errand:', error);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissableBackButton
        contentContainerStyle={{
          flex: 1,
          paddingTop: 20,
          backgroundColor: theme.colors.secondary,
        }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Enter Locations</Text>
          <TextInput
            mode="outlined"
            label="Pickup Location"
            value={pickupLocation}
            onChangeText={setPickupLocation}
            style={styles.input}
            placeholder="Your current location or address"
            outlineColor={theme.colors.placeholder}
            activeOutlineColor={theme.colors.primary}
            placeholderTextColor={theme.colors.placeholder}
          />
          <TextInput
            mode="outlined"
            label="Delivery Location"
            value={deliveryLocation}
            onChangeText={setDeliveryLocation}
            style={styles.input}
            placeholder="Enter delivery location"
            outlineColor={theme.colors.placeholder}
            activeOutlineColor={theme.colors.primary}
            placeholderTextColor={theme.colors.placeholder}
          />

          <AuthBtn
            disabled={!isButtonEnabled}
            onClick={findHelper}
            btnMode="contained"
            btnStyle="solid"
            btnText="Find Helper"
            mv
            rounded
          />
          <Text style={styles.shadow}>
            You can provide more instructions to your helper later
          </Text>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    marginBottom: 10,
    backgroundColor: theme.colors.secondary,
  },
  shadow: {
    color: 'grey',
    opacity: 0.9,
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PickupDelivery;
