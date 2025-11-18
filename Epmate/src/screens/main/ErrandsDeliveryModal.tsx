// components/ErrandsDeliveryModal.tsx
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  userId: string | any;
}

const ErrandsDeliveryModal: React.FC<Props> = ({
  visible,
  onDismiss,
  userId,
}) => {
  const [select, onSelect] = useState('pickup');
  
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text style={styles.title}>What do you need?</Text>
        <Button
          mode="contained"
          onPress={() => onSelect('pickup')}
          style={styles.button}
        >
          Pick up and deliver
        </Button>
        <Button
          mode="contained"
          onPress={() => onSelect('buy')}
          style={styles.button}
        >
          Buy and deliver
        </Button>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  button: { marginBottom: 10 },
});

export default ErrandsDeliveryModal;
