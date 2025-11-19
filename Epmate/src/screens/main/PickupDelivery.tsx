import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Provider, Text } from 'react-native-paper';
import SearchingHelpersModal from './SearchingHelpersModal';
import HelperListModal from './HelperListModal';
import AuthBtn from '../../components/AuthButton';
import { theme } from '../../theme/theme';

interface Props {
  setIsSearching: (state: any) => void;
  setIsHelperListVisible: (state: any) => void;
  userId: string;
}
const PickupDelivery: React.FC<Props> = ({
  setIsSearching,
  setIsHelperListVisible,
  userId,
}) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');

  const isButtonEnabled = pickupLocation !== '' && deliveryLocation !== '';

  const findHelper = async () => {
    setIsSearching(true);

    try {
      await fetch('/.netlify/functions/createErrand', {
        method: 'POST',
        body: JSON.stringify({
          pickupLocation,
          deliveryLocation,
          userId: userId,
        }),
      });
    } catch (error) {
      console.error('Error creating errand:', error);
    }

    setTimeout(() => {
      setIsSearching(false);
      setIsHelperListVisible(true);
    }, 1000);
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Text
          style={{
            fontSize: theme.sizes.xl,
            color: theme.colors.primary,
            marginBottom: 20,
          }}
        >
          Enter Locations
        </Text>
        <TextInput
          label="Pickup Location"
          value={pickupLocation}
          onChangeText={setPickupLocation}
          style={styles.input}
          placeholder="Your current location or address"
        />
        <TextInput
          label="Delivery Location"
          value={deliveryLocation}
          onChangeText={setDeliveryLocation}
          style={styles.input}
          placeholder="Enter delivery location"
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
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  input: {
    marginBottom: 10,
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
