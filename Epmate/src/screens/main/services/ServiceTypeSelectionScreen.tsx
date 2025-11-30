//screens/main/services/ServiceTypeSelectionScreen.tsx
import React, {useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import RadioBtn from '../../../components/SelectBtn';
import AuthBtn from '../../../components/AuthButton';
import ModalBackButton from '../../../components/ModalBackButton';
import {useDispatch} from 'react-redux';
import {setServiceType} from '../../../state/slices/orderSlice';
import {useNavigation} from '@react-navigation/native';
import {theme} from '../../../theme/theme';

const ServiceTypeSelectionScreen: React.FC = () => {
  const [errandSelected, selectErrand] = useState<string>('pickup');
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

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
        dispatch(setServiceType(errandSelected));
        navigation.navigate('LocationInput');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <ModalBackButton onPress={() => navigation.navigate('MainDrawer')} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Choose the type of errand you want your helper to handle
        </Text>

        {errands.map(errand => {
          return (
            <RadioBtn
              description={errand.info}
              title={errand.title}
              key={errand.name}
              value={errand.name}
              selected={errand.name == errandSelected}
              setSelected={value => selectErrand(value)}
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
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
});

export default ServiceTypeSelectionScreen;
