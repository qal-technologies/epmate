import React,{useState} from 'react';
import {View,StyleSheet} from 'react-native';
import {TextInput,Provider,Text,Modal,Portal} from 'react-native-paper';
import AuthBtn from '../../components/AuthButton';
import {theme} from '../../theme/theme';
import {useDispatch, useSelector} from 'react-redux';
import MyInput from 'components/myInput';
import {setLocationData} from 'state/slices/orderSlice';

interface Props
{
  visible: boolean;
  onDismiss: () => void;
}
const PickupDelivery: React.FC<Props> = ({
  onDismiss,
  visible,
}) =>
{
  const [pickupLocation,setPickupLocation] = useState('');
  const [deliveryLocation,setDeliveryLocation] = useState('');
  const storedUserId = useSelector((state: any) => state.auth.user?.id);

  const isButtonEnabled = pickupLocation.trim() !== '' && deliveryLocation.trim() !== '';

  const dispatch = useDispatch();
  
  const findHelper = async () =>
  {
    try
    {
      // await fetch('/.netlify/functions/createErrand', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     pickupLocation,
      //     deliveryLocation,
      //     userId: storedUserId,
      //   }),
      // });
      dispatch(setLocationData({
        pickupLocation,
        deliveryLocation,
      }));
      onDismiss();
    } catch (error)
    {
      if (__DEV__) console.error('Error creating errand:',error);
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

          <MyInput type='text' value={pickupLocation} setValue={setPickupLocation}
            placeholder="Your current location or address"
            label='Pickup Location'
            withLabel
            selectionColor={theme.colors.primary}
          />

          <MyInput type='text' value={deliveryLocation} setValue={setDeliveryLocation}
            placeholder="Enter delivery location"
            label="Enter delivery Location" withLabel
            selectionColor={theme.colors.primary}
          />

          <AuthBtn
            disabled={!isButtonEnabled}
            onClick={findHelper}
            btnMode="contained"
            btnStyle="solid"
            btnText="FIND HELPER"
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
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginVertical: 20,
    marginBottom: 30,
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
