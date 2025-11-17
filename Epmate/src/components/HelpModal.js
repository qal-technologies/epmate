import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal, Portal, List } from 'react-native-paper';
import { theme } from '../theme/theme';

const HelpModal = ({ visible, onDismiss }) => {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text style={styles.title}>What do you need help with today?</Text>
        <List.Section>
          <List.Item
            title="Errands & Delivery"
            left={() => <List.Icon icon="briefcase" />}
          />
          <List.Item
            title="Cooking & Catering"
            left={() => <List.Icon icon="silverware-fork-knife" />}
          />
          <List.Item
            title="Home Repairs & Technical Help"
            left={() => <List.Icon icon="tools" />}
          />
          <List.Item
            title="House Cleaning & Chores"
            left={() => <List.Icon icon="broom" />}
          />
          <List.Item
            title="Security Assistance"
            left={() => <List.Icon icon="shield" />}
          />
        </List.Section>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default HelpModal;
