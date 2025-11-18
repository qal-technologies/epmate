import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button, RadioButton } from 'react-native-paper';

const services = [
  'Errands & Delivery',
  'House Chores',
  'Home Repairs & Technical Help',
  'Cooking',
  'Project & Assignments',
];

const ServiceSelectionModal = ({ onSelectErrands }) => {
  const [selectedService, setSelectedService] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a service</Text>
      <RadioButton.Group onValueChange={setSelectedService} value={selectedService}>
        {services.map((service) => (
          <View key={service} style={styles.radioButtonContainer}>
            <RadioButton value={service} />
            <Text>{service}</Text>
          </View>
        ))}
      </RadioButton.Group>
      <Button
        mode="contained"
        disabled={selectedService === ''}
        onPress={() => {
          if (selectedService === 'Errands & Delivery') {
            onSelectErrands();
          }
        }}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default ServiceSelectionModal;
