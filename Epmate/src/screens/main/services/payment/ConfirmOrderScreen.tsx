import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../../navigation/types';
import { theme } from '../../../../theme/theme';
import { Portal, TouchableRipple } from 'react-native-paper';
import AuthBtn from '../../../../components/AuthButton';
import { MaterialIcons } from '@expo/vector-icons';
import type { HelperData } from 'hooks/useHelpers';
import formatPrice from 'utils/formatPrice';
import { useSelector, useDispatch } from 'react-redux';
import { setPaymentData, updateOrderStatus } from 'state/slices/orderSlice';
import { useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import useTaskName from 'hooks/useServiceType';

type ConfirmOrderScreenProps = NativeStackNavigationProp<
  HomeStackParamList,
  'ConfirmOrder'
>;

type Props = {
  navigation: ConfirmOrderScreenProps;
};

const ConfirmOrderScreen: React.FC<Props> = ( { navigation } ) => {
  const dispatch = useDispatch();

  // Get data from Redux instead of navigation params
  const { selectedHelper, locationData, serviceType } = useSelector( ( state: any ) => state.order );
  const { user } = useSelector( ( state: any ) => state.auth );

  const helperData: HelperData = selectedHelper;
  const currency = '₦';
  let charge: string | number = 150;
  let total: string | number = helperData.tagPrice + charge;
  total = formatPrice( total );
  charge = formatPrice( charge );

  // Navigation guard: redirect if no helper selected
  useEffect( () => {
    if ( !helperData ) {
      Alert.alert( 'Invalid Access', 'Please select a helper first' );
      navigation.navigate( 'MainDrawer' );
    }
  }, [ helperData, navigation ] );

  let taskType = useTaskName();


  const handleConfirmOrder = () => {
    // Set payment data in Redux
    dispatch( setPaymentData( {
      helperID: helperData.id,
      userID: user.id,
      price: total,
      currency: currency,
    } ) );

    // Update order status
    dispatch( updateOrderStatus( 'confirmed' ) );

    // Navigate without params - data is in Redux
    navigation.navigate( 'CompletePayment' );
  };

  return (
    <SafeAreaView style={ styles.container }>
      <View style={ styles.header }>
        <TouchableRipple
          onPress={ () => navigation.goBack() }
          style={ {
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10,
            borderRadius: '50%',
            backgroundColor: theme.colors.primaryTrans,
          } }
        >
          <MaterialIcons
            name="arrow-back"
            size={ 22 }
            color={ theme.colors.text }
          />
        </TouchableRipple>
        <Text style={ styles.headerTitle }>Confirm Your Order</Text>
      </View>

      <ScrollView>
        <View style={ styles.card }>
          <Text style={ [ styles.taskType, { fontWeight: 'bold' } ] }>Task Type: <Text style={ styles.taskType }>{ taskType }</Text></Text>
        </View>

        <View style={ styles.card }>
          <Text style={ styles.sectionTitle }>Locations</Text>

          <View style={ styles.locationContainer }>
            <Text style={ styles.locationLabel }>Pickup Location:</Text>

            <Text style={ styles.locationText }>
              { locationData?.pickupLocation }
            </Text>
          </View>

          <View style={ styles.locationContainer }>
            <Text style={ styles.locationLabel }>Delivery Location:</Text>

            <Text style={ styles.locationText }>
              { locationData?.deliveryLocation }
            </Text>
          </View>
        </View>

        <View style={ styles.card }>
          <Text style={ styles.sectionTitle }>Helper Details</Text>
          <View style={ styles.helperContainer }>
            { helperData?.image !== null ? (
              <Image
                source={ { uri: 'https://via.placeholder.com/50' } }
                style={ styles.avatar }
              />
            ) : (
              <MaterialIcons
                name="verified-user"
                  color={ theme.colors.primary }
                  size={ 50 }
                  style={ styles.avatar }
                />
            ) }
            <View>
              <Text style={ styles.helperName }>{ helperData?.name }</Text>
              <Text style={ styles.helperRating }>
                Rating: { helperData?.rating }/5 <Text
                  style={ {
                    color: theme.colors.primary,
                    fontSize: 16
                  } }>
                  ★
                </Text>
              </Text>
              <Text style={ styles.helperTasks }>Total tasks completed: { helperData?.totalTasks }
              </Text>
            </View>
          </View>
        </View>

        <View style={ styles.card }>
          <Text style={ styles.sectionTitle }>Price Summary</Text>
          <Text style={ styles.price }>{ total }</Text>
          <Text style={ styles.priceDetail }>Service fee: { charge }</Text>
          <Text style={ styles.priceDetail }>Helper's charge: { formatPrice( helperData?.tagPrice, currency ) }</Text>
        </View>

        <Text style={ styles.confirmButtonText }>
          Confirm your order details before proceeding.
        </Text>

        <AuthBtn
          btnText="CONFIRM ORDER"
          btnStyle="solid"
          onClick={ handleConfirmOrder }
          btnMode="contained"
          mv
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
    paddingBottom: 0
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  taskType: {
    fontSize: 16,
    fontWeight: 'light'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  locationText: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  helperName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  helperRating: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  helperTasks: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.primary,
  },
  priceDetail: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: theme.colors.placeholder,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
  },
} );

export default ConfirmOrderScreen;
