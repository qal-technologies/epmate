import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {theme} from '../../../../theme/theme';
import AuthBtn from 'components/AuthButton';
import usePayStatus from 'hooks/usePayStatus';
import {MaterialIcons} from '@expo/vector-icons';
import {useSelector, useDispatch} from 'react-redux';
import {updateOrderStatus, clearOrder} from 'state/slices/orderSlice';
import HelperDetails from 'screens/main/utils/HelperDetailsCard';
import {Portal} from 'react-native-paper';
import {ScrollView} from 'react-native-gesture-handler';
import {TIMEOUTS} from '../../../../constants/timeouts';

const ProcessingPaymentScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const progress = useRef(new Animated.Value(0)).current;

  const {status, loading, errorMessage} = usePayStatus();

  // Get payment data from Redux
  const {paymentData} = useSelector((state: any) => state.order);

  // Navigation guard: redirect if no payment data
  useEffect(() => {
    if(!paymentData) {
      Alert.alert('Invalid Access', 'Please complete payment details first');
      navigation.navigate('MainDrawer');
    }
  }, [paymentData, navigation]);


  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: TIMEOUTS.PAYMENT_ANIMATION_DURATION,
      isInteraction: true,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      //handle flutterwave payment here using backend or a hook/helper that sends boolean to know if navigate to successful or failed.
      //   navigation.navigate('Home');
      // once the backend returns payment status, successful or not, the animation reaches the end and stop
    }, TIMEOUTS.PAYMENT_VERIFICATION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleRedirect = async () => {
    if(status === null) return;

    if(status === false) {
      dispatch(updateOrderStatus('failed'));
      navigation.navigate('ConfirmOrder');
    }
  };

  const cancelPayment = () => {
    dispatch(updateOrderStatus('confirmed'));
    // navigation.navigate('TaskCompletion');
    navigation.navigate('MainDrawer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{width: '100%', height: '100%', }} contentContainerStyle={{alignItems: 'center', justifyContent: 'center', flex: status !== true ? 1 : 0}}>
        <View style={styles.content}>
          {loading ?
            <ActivityIndicator size={100} color={theme.colors.primary} animating={loading} />
            : status === true ?
              <MaterialIcons name="check-circle" size={80} color={theme.colors.primary} style={{marginBottom: -50}} /> : status === false ?
                <MaterialIcons name="error" size={100} color={theme.colors.red} /> : null
          }
          <Text style={styles.title}>{status === true ? 'Payment Successful!' : status === false ? 'Payment Failed' : 'Confirming your payment...'}</Text>

          {status === null ? <Text style={styles.subtitle}>
            Please wait while we confirm your transfer. This may take a moment.
          </Text> : null}

          {status === null && <View style={styles.progressContainer}>
            <Animated.View
              style={[styles.progressBar, {width, borderRadius: 50}]}
            />
          </View>
          }

          {status !== null &&
            <Text style={{
              color: 'black',
              marginVertical: 1,
              textAlign: 'center',
              opacity: .7,
              fontSize: status === false ? 14 : 18,
            }}>{status === false ? errorMessage || '' : status === true && 'Your order is now active'}</Text>
          }

          {status === true && <HelperDetails />}

          {status === null && <Text style={styles.progressText}>Verifying with bank...</Text>}

          {status === null && <TouchableOpacity style={styles.cancelBtn} onPress={cancelPayment}>
            <MaterialIcons name='cancel' color={theme.colors.red} size={14} />
            <Text style={styles.cancelText}>Cancel Payment</Text>
          </TouchableOpacity>}

          {status === false && <View style={{gap: 8, width: '100%', marginTop: 25}}>
            <AuthBtn btnText='Retry Payment' btnStyle='solid' btnMode='contained' onClick={handleRedirect} type='error' />
            <AuthBtn btnText='Cancel Payment' btnStyle='border' btnMode='outlined' onClick={cancelPayment} bdColor={theme.colors.placeholder} txtColor={theme.colors.placeholder} />
          </View>
          }

        </View>
        {<Text style={styles.footerText}>
          {status === null || status === false && 'Payments are processed securely by Flutterwave'}
        </Text>}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  content: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    width: '98%',
    height: 'auto',
    padding: 15,
    paddingVertical: 50,
    borderRadius: 20,
    alignSelf: 'center'
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    marginTop: 50,
    textAlign: 'left',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray,
    textAlign: 'center',
    marginTop: 50,
  },
  progressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: theme.colors.primaryTrans,
    borderRadius: 50,
    marginTop: 50,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.8,
    marginTop: 8,
  },
  cancelBtn: {
    padding: 8,
    paddingHorizontal: 15,
    borderColor: theme.colors.red,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 30,
  },
  cancelText: {
    fontWeight: 300,
    color: theme.colors.red
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: 10,
    position: 'relative',
    bottom: 10,
    padding: 10,
  },
});

export default ProcessingPaymentScreen;
