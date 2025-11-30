import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../../../../navigation/types';
import {theme} from '../../../../theme/theme';
import AuthBtn from '../../../../components/AuthButton';
import {MaterialIcons} from '@expo/vector-icons';
import ModalBackButton from 'components/ModalBackButton';
import type {HelperData} from 'hooks/useHelpers';
import formatPrice from 'utils/formatPrice';
import {useSelector, useDispatch} from 'react-redux';
import {setPaymentData, updateOrderStatus} from 'state/slices/orderSlice';
import {useEffect} from 'react';
import {ScrollView} from 'react-native-gesture-handler';
import useTaskName from 'hooks/useServiceType';
import {commonStyles, borderRadius, spacing, fontSize} from '../../../../styles/commonStyles';

type ConfirmOrderScreenProps = NativeStackNavigationProp<
  HomeStackParamList,
  'ConfirmOrder'
>;

type Props = {
  navigation: ConfirmOrderScreenProps;
};

const ConfirmOrderScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useDispatch();

  // Get data from Redux instead of navigation params
  const {selectedHelper, locationData, serviceType} = useSelector((state: any) => state.order);
  const {user} = useSelector((state: any) => state.auth);

  const helperData: HelperData = selectedHelper;
  const currency = '₦';
  let charge: string | number = 150;
  let total: string | number = helperData.tagPrice + charge;
  total = formatPrice(total);
  charge = formatPrice(charge);

  // Navigation guard: redirect if no helper selected
  useEffect(() => {
    if(!helperData) {
      Alert.alert('Invalid Access', 'Please select a helper first');
      navigation.replace('MainDrawer');
    }
  }, [helperData, navigation]);

  let taskType = useTaskName();


  const handleConfirmOrder = () => {
    // Set payment data in Redux
    dispatch(setPaymentData({
      helperID: helperData.id,
      userID: user.id,
      price: total,
      currency: currency,
    }));

    // Update order status
    dispatch(updateOrderStatus('confirmed'));

    // Navigate without params - data is in Redux
    navigation.navigate('CompletePayment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ModalBackButton onPress={() => navigation.replace('MainDrawer')} withTitle title='Confirm Your Order' />

      <ScrollView>
        <View style={styles.card}>
          <Text style={[styles.taskType, {fontWeight: 'bold'}]}>Task Type: <Text style={styles.taskType}>{taskType}</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Locations</Text>

          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Pickup Location:</Text>

            <Text style={styles.locationText}>
              {locationData?.pickupLocation}
            </Text>
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Delivery Location:</Text>

            <Text style={styles.locationText}>
              {locationData?.deliveryLocation}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Helper Details</Text>
          <View style={styles.helperContainer}>
            {helperData?.image ? (
              <Image
                source={{uri: helperData.image}}
                style={commonStyles.avatar}
              />
            ) : (
              <MaterialIcons
                name="verified-user"
                  color={theme.colors.primary}
                  size={50}
                  style={commonStyles.avatar}
                />
            )}
            <View>
              <Text style={styles.helperName}>{helperData?.name}</Text>
              <Text style={styles.helperRating}>
                Rating: {helperData?.rating}/5 <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: 16
                  }}>
                  ★
                </Text>
              </Text>
              <Text style={styles.helperTasks}>Total tasks completed: {helperData?.totalTasks}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <Text style={styles.price}>{total}</Text>
          <Text style={styles.priceDetail}>Service fee: {charge}</Text>
          <Text style={styles.priceDetail}>Helper's charge: {formatPrice(helperData?.tagPrice, currency)}</Text>
        </View>

        <Text style={styles.confirmButtonText}>
          Confirm your order details before proceeding.
        </Text>

        <AuthBtn
          btnText="CONFIRM ORDER"
          btnStyle="solid"
          onClick={handleConfirmOrder}
          btnMode="contained"
          mv
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    ...commonStyles.screenContainer,
    paddingBottom: 0
  },
  card: {
    ...commonStyles.card,
  },
  taskType: {
    fontSize: fontSize.md,
    fontWeight: 'light'
  },
  sectionTitle: {
    ...commonStyles.sectionTitle,
  },
  locationContainer: {
    marginBottom: spacing.md,
  },
  locationLabel: {
    fontSize: fontSize.md,
    color: theme.colors.text,
  },
  locationText: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  helperContainer: {
    ...commonStyles.row,
  },
  helperName: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  helperRating: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  helperTasks: {
    fontSize: fontSize.sm,
    color: theme.colors.placeholder,
  },
  price: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: theme.colors.primary,
  },
  priceDetail: {
    fontSize: fontSize.md,
    color: theme.colors.placeholder,
  },
  confirmButtonText: {
    color: theme.colors.placeholder,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.lg - 1,
  },
});

export default ConfirmOrderScreen;
