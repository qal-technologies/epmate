// components/ErrandsDeliveryModal.tsx
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import RadioBtn from '../../components/SelectBtn';
import AuthBtn from '../../components/AuthButton';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  isHelperListVisible: (state?: any) => void;
  isSearching: (state: any) => void;
}

const ErrandsDeliveryModal: React.FC<Props> = ({
  visible,
  onDismiss,
  isHelperListVisible,
  isSearching,
}) => {
  const [errandSelected, selectErrand] = useState<string | null>(null);

  const errands = [
    {
      name: 'pickup',
      title: 'Pick up and deliver',
      icon: 'delivery-dining',
      info: 'Helper goes to your pick up location and get something for you',
    },
    {
      name: 'buy',
      title: 'Buy and deliver',
      icon: 'money',
      info: 'Helper goes to your buy location and buys your needs',
    },
  ];

  const handleContinue = () => {
    if (errandSelected) {
      if (errandSelected == 'buy') {
        Alert.alert('Coming Soon');
      } else {
        onDismiss();
      }
    }
  };
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
        dismissableBackButton
      >
        <Text style={styles.title}>What do you need?</Text>

        {errands.map(errand => {
          return (
            <RadioBtn
              description={errand.info}
              title={errand.title}
              key={errand.name}
              value={errand.name}
              selected={errand.name == errandSelected}
              setSelected={value => selectErrand(value)}
              icon={errand.icon}
              mv
            />
          );
        })}

        <AuthBtn
          btnText="Continue"
          btnMode="contained"
          btnStyle="solid"
          onClick={handleContinue}
          disabled={!errandSelected}
          rounded
        />
        <Text style={styles.shadow}>Note: You can specify details later</Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  shadow: {
    color: 'grey',
    opacity: 0.9,
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
  button: { marginBottom: 10 },
});

export default ErrandsDeliveryModal;
