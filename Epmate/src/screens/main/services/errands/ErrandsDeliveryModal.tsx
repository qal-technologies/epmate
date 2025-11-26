// components/ErrandsDeliveryModal.tsx
import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import RadioBtn from '../../../../components/SelectBtn';
import AuthBtn from '../../../../components/AuthButton';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../../navigation/types';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  setErrandOption: (state?: any) => void;
}

const ErrandsDeliveryModal: React.FC<Props> = ({
  visible,
  onDismiss,
  setErrandOption,
}) => {
  const [errandSelected, selectErrand] = useState<string | null>(null);

  const errands = [
    {
      name: 'pickup',
      title: 'Pick up and deliver',
      icon: 'truck',
      info: 'Helper goes to pickup your item and brings it to you.',
    },
    {
      name: 'buy',
      title: 'Buy and deliver',
      icon: 'money',
      info: 'Helper goes to buy item for you and brings it to you.',
    },
  ];

  const handleContinue = () => {
    if (errandSelected) {
      if (errandSelected == 'buy') {
        Alert.alert('Coming Soon');
      } else {
        setErrandOption(errandSelected);
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
        <Text style={styles.title}>Choose the type of errand you want your helper to handle</Text>

        {errands.map(errand => {
          return (
            <RadioBtn
              description={errand.info}
              title={errand.title}
              key={errand.name}
              value={errand.name}
              selected={errand.name == errandSelected}
              setSelected={value => selectErrand(value)}
              // icon={errand.icon}
              iconPack="Awesome"
              mv
            />
          );
        })}

        <AuthBtn
          btnText="CONTINUE"
          btnMode="contained"
          btnStyle="solid"
          onClick={handleContinue}
          disabled={!errandSelected}
          rounded
          mv
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
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
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
