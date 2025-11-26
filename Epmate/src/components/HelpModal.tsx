import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Portal, Modal, List } from 'react-native-paper';
import { theme } from '../theme/theme';

type HelpModalProps = {
  visible: boolean;
  onDismiss: () => void;
};

type HelpItem = {
  key: string;
  title: string;
  icon: string;
  onPress?: () => void;
};

const helpItems: HelpItem[] = [
  {
    key: 'errands',
    title: 'Errands & Delivery',
    icon: 'briefcase',
  },
  {
    key: 'cooking',
    title: 'Cooking & Catering',
    icon: 'silverware-fork-knife',
  },
  {
    key: 'repairs',
    title: 'Home Repairs & Technical Help',
    icon: 'tools',
  },
  {
    key: 'cleaning',
    title: 'House Cleaning & Chores',
    icon: 'broom',
  },
  {
    key: 'security',
    title: 'Security Assistance',
    icon: 'shield',
  },
];
const HelpModal= ({ visible, onDismiss }:HelpModalProps) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.secondary },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>
          What do you need help with today?
        </Text>
        <List.Section>
          {helpItems.map(item => (
            <List.Item
              key={item.key}
              title={item.title}
              left={props => <List.Icon {...props} icon={item.icon} />}
            />
          ))}
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
