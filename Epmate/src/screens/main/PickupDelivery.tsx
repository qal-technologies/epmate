import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Provider } from 'react-native-paper';
import SearchingHelpersModal from './SearchingHelpersModal';
import HelperListModal from './HelperListModal';

interface Props {
  setIsSearching: (state: any) => void;
  userId: string;
  isSearching: boolean;
}
const PickupDelivery: React.FC<Props> = ({
  setIsSearching,
  isSearching,
  userId,
}) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [isHelperListVisible, setIsHelperListVisible] = useState(false);

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

  const hideHelperList = () => setIsHelperListVisible(false);

  return (
    <Provider>
      <View style={styles.container}>
        <TextInput
          label="Pickup Location"
          value={pickupLocation}
          onChangeText={setPickupLocation}
          style={styles.input}
        />
        <TextInput
          label="Delivery Location"
          value={deliveryLocation}
          onChangeText={setDeliveryLocation}
          style={styles.input}
        />
        <Button
          mode="contained"
          disabled={!isButtonEnabled}
          onPress={findHelper}
        >
          Find Helper
        </Button>
        <SearchingHelpersModal visible={isSearching} />
        <HelperListModal
          visible={isHelperListVisible}
          onDismiss={hideHelperList}
        />
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
});

export default PickupDelivery;
