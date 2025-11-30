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
Modal,
} from 'react-native';
import { Portal } from 'react-native-paper';
import type { IconProps } from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';
import Animated, { FadeIn, FadeInDown, FadeOutDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentService } from 'state/slices/orderSlice';
import { theme } from 'theme/theme';

interface Props {
  isSearching: boolean;
  onServiceSelect: () => void;
}

const ServiceSelectionModal: React.FC<Props> = ({
  isSearching,
  onServiceSelect,
}) => {
  const services: {
    name: string;
    icon: IconProps | string;
    serviceKey: string;
  }[] = [
      {name: 'Errands & Delivery', icon: 'briefcase', serviceKey: 'errand'},
      {name: 'House Chores', icon: 'broom', serviceKey: 'chores'},
      {name: 'Cooking', icon: 'chef-hat', serviceKey: 'cooking'},
      {
        name: 'Home Repairs & Technical Help',
        icon: 'tools',
        serviceKey: 'repairs',
      },
      {name: 'Projects & Assignments', icon: 'pen', serviceKey: 'projects'},
    ];

  const [selectedService, setSelectedService] = useState('');
  const dispatch = useDispatch();

  const handleSelectClick = async () => {
    if(selectedService) {
      const selectedServiceObj = services.find(
        service => service.name === selectedService,
      );

      if(selectedServiceObj) {
        if(selectedServiceObj.serviceKey != 'errand') {
          Alert.alert('Coming soon...', 'Please select another option');
        } else {
          dispatch(setCurrentService(selectedServiceObj.serviceKey));
          onServiceSelect();
        }
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 20,
      }}
    >
      <Text style={ styles.title }>What do you need help with today?</Text>

      <View>
        { services.map( ( service, index ) => (
          <Animated.View
            entering={ FadeInDown.springify().delay( index * 100 ) }
            exiting={ FadeOutDown.springify().delay( index * 100 ) }
            key={ service.name }
            style={ [
              styles.serviceButton,
              {
                backgroundColor:
                  selectedService === service.name
                    ? theme.colors.primaryTrans
                    : 'transparent',
              },
            ] }
            onTouchEnd={ () => {
              setSelectedService( service.name );
            } }
          >
            <MaterialCommunityIcons
              name={ service.icon as any}
              size={ 25 }
              color={ theme.colors.primary }
            />
            <Text style={ { fontWeight: 'bold', fontSize: 16 } }>
              { service.name }
            </Text>
          </Animated.View>
        ) ) }
      </View>

      <AuthBtn
        btnText="Continue"
        disabled={ selectedService === '' }
        onClick={ handleSelectClick }
        btnMode="contained"
        btnStyle="solid"
        rounded
        style={ { marginTop: 10 } }
        mv
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create( {
  container: {
    padding: 10,
    paddingTop: 30,
    borderStartStartRadius: 20,
    borderStartEndRadius: 20,
    maxHeight: Dimensions.get('screen').height / 1.95,
    backgroundColor: theme.colors.secondary,
    width: '100%',
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
} );

export default ServiceSelectionModal;
