import { MaterialCommunityIcons } from '@expo/vector-icons';
import AuthBtn from 'components/AuthButton';
import RadioBtn from 'components/SelectBtn';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Button, RadioButton, TouchableRipple } from 'react-native-paper';
import type { IconProps } from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';
import { theme } from 'theme/theme';

interface Props {
  onServiceSelect: () => void;
  setCurrentService: (service: string) => void;
  isSearching: boolean;
}

const ServiceSelectionModal: React.FC<Props> = ({
  onServiceSelect,
  isSearching,
  setCurrentService,
}) => {
  const services: {
    name: string;
    icon: IconProps | string;
    serviceKey: string;
  }[] = [
      { name: 'Errands & Delivery', icon: 'briefcase', serviceKey: 'errand' },
      { name: 'House Chores', icon: 'broom', serviceKey: 'chores' },
      { name: 'Cooking', icon: 'chef-hat', serviceKey: 'cooking' },
      {
        name: 'Home Repairs & Technical Help',
        icon: 'tools',
        serviceKey: 'repairs',
      },
      { name: 'Projects & Assignments', icon: 'pen', serviceKey: 'projects' },
    ];

  const [selectedService, setSelectedService] = useState('');

  const handleSelectClick = async () => {
    // when we create more function we add them here:
    if (selectedService) {
      const selectedServiceObj = services.find(
        service => service.name === selectedService,
      );

      if (selectedServiceObj) {
        if (selectedServiceObj.serviceKey != 'errand') {
          Alert.alert('Coming soon... Please select another option');
        } else {
          setCurrentService(selectedServiceObj.serviceKey);
          onServiceSelect();
        }
      }
    }
  };
  return (
    <ScrollView
      style={[styles.container, isSearching && { display: 'none' }]}
      contentContainerStyle={{
        paddingBottom: 20,
      }}
    >
      <Text style={styles.title}>What do you need help with today?</Text>

      <View>
        {services.map(service => (
          <TouchableOpacity
            key={service.name}
            style={[
              styles.serviceButton,
              {
                backgroundColor:
                  selectedService === service.name
                    ? theme.colors.primaryTrans
                    : 'transparent',
              },
            ]}
            onPress={() => {
              setCurrentService(service.name);
              setSelectedService(service.name);
            }}
          >
            <MaterialCommunityIcons
              name={service.icon}
              size={25}
              color={theme.colors.primary}
            />
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
              {service.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <AuthBtn
        btnText="Continue"
        disabled={selectedService === ''}
        onClick={handleSelectClick}
        btnMode="contained"
        btnStyle="solid"
        rounded
        style={{ marginTop: 10 }}
        mv
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    // flex: 0.8,
    padding: 10,
    paddingTop: 30,
    borderStartStartRadius: 20,
    borderStartEndRadius: 20,
    maxHeight: Dimensions.get('screen').height / 1.9,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  serviceButton: {
    marginBottom: 3,
    justifyContent: 'flex-start',
    padding: 12,
    borderRadius: 20,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    color: theme.colors.primary,
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
  },
});

export default ServiceSelectionModal;
