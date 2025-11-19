import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, RadioButton } from 'react-native-paper';
import type { IconProps } from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';

const services: { name: string; icon: IconProps | string }[] = [
  { name: 'Errands & Delivery', icon: 'briefcase' },
  { name: 'House Chores', icon: 'home-lightbulb' },
  { name: 'Cooking', icon: 'chef-hat' },
  { name: 'Home Repairs & Technical Help', icon: 'toolbox' },
  { name: 'Project & Assignments', icon: 'pen' },
];

interface Props {
  onSelectErrands: () => void;
}

const ServiceSelectionModal: React.FC<Props> = ({ onSelectErrands }) => {
  const [selectedService, setSelectedService] = useState('');

  const handleSelectClick = async () => {
    // when we create more function we add them here:
    if (selectedService) {
      switch (selectedService) {
        case 'Errand & Delivery':
          onSelectErrands();
        default:
          null;
      }
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you need help with today?</Text>
      <RadioButton.Group
        onValueChange={setSelectedService}
        value={selectedService}
      >
        {services.map(service => (
          <Button
            key={service.name}
            mode={selectedService === service.name ? 'contained' : 'outlined'}
            style={styles.serviceButton}
            icon={() => (
              <MaterialCommunityIcons
                name={service.icon}
                size={24}
                color={selectedService === service.name ? 'white' : '#00D09C'}
              />
            )}
            onPress={() => setSelectedService(service.name)}
          >
            {service.name}
          </Button>
        ))}
      </RadioButton.Group>
      <Button
        mode="contained"
        disabled={selectedService === ''}
        onPress={() => handleSelectClick}
      >
        Continue
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  serviceButton: {
    marginBottom: 10,
    justifyContent: 'flex-start',
  },
});

export default ServiceSelectionModal;
