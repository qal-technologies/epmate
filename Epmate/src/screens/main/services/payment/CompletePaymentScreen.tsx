import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Clipboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, TouchableRipple } from 'react-native-paper';
import { theme } from '../../../../theme/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../../navigation/types';
import {
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import AuthBtn from '../../../../components/AuthButton';
import ModalBackButton from 'components/ModalBackButton';
import type { HelperData } from 'hooks/useHelpers';
import { updateOrderStatus } from 'state/slices/orderSlice';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollView } from 'react-native-gesture-handler';

type CompletePayment = NativeStackNavigationProp<
  HomeStackParamList,
  'CompletePayment'
>;

type Props = {
  navigation: CompletePayment;
};

const CompletePaymentScreen: React.FC<Props> = ( { navigation } ) => {
  const dispatch = useDispatch();

  // Get data from Redux instead of navigation params
  const { paymentData, selectedHelper } = useSelector( ( state: any ) => state.order );

  const [ paymentID, setPaymentID ] = useState( '123456' );

  const AccName = 'Flutterwave Payments';
  const AccNo = '12345678901';

  // Navigation guard: redirect if no payment data
  useEffect( () => {
    if ( !paymentData ) {
      Alert.alert( 'Invalid Access', 'Please confirm your order first' );
      navigation.replace( 'MainDrawer' );
    }
  }, [ paymentData, navigation ] );

  const handlePayment = () => {
    // Update order status to processing
    dispatch( updateOrderStatus( 'processing' ) );

    // Navigate without params - paymentID is now part of state
    navigation.replace( 'ProcessingPayment' );
  };

  return (
    <SafeAreaView style={ styles.container }>
        <ModalBackButton onPress={ () => navigation.goBack() } withTitle title='Complete Your Payment'/>


      <ScrollView>
        <View style={ styles.card }>
          <FontAwesome
            name="bank"
            size={ 40 }
            style={ { marginVertical: 15, alignSelf: 'center' } }
            color={ theme.colors.primary }
          />
          <Text style={ styles.paymentMethod }>One-Time Bank Transfer</Text>
          <Text style={ styles.paymentInstruction }>
            Transfer the exact amount to confirm your order
          </Text>
        </View>

        <View style={ styles.card }>
          <Text style={ styles.sectionTitle }>Payment Details</Text>
          <View style={ styles.detailContainer }>
            <View>
              <Text style={ [ styles.detailLabel, { minWidth: '100%' } ] }>AMOUNT DUE:</Text>
              <Text style={ [ styles.detailValue, { fontSize: 25, color: theme.colors.primary } ] }>
                { paymentData?.price }
              </Text>
            </View>
            <CopyBtn value={ paymentData?.price } title="Copy" />
          </View>
          <View style={ styles.detailContainer }>
            <Text style={ styles.detailLabel }>BANK NAME:</Text>
            <Text style={ styles.detailValue }>{ AccName }</Text>
          </View>
          <View style={ styles.detailContainer }>
            <Text style={ styles.detailLabel }>ACCOUNT NUMBER:</Text>
            <Text style={ styles.detailValue }>{ AccNo }</Text>
            <CopyBtn value={ AccNo } title="Copy" />
          </View>
        </View>

        <Text style={ styles.importantNote }>
          This account is for this transaction only and expires in <Text style={ { fontWeight: 'bold', color: 'black' } }>(Flutterwave:Time)</Text>
        </Text>

        <AuthBtn
          btnText="I HAVE PAID"
          btnStyle="solid"
          btnMode="contained"
          onClick={ handlePayment }
        />

        <Text style={ styles.footerText }>
          Payments are processed securely by Flutterwave
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const CopyBtn: React.FC<{ value: any; title?: string; }> = ( {
  value,
  title,
} ) => {
  const handleCopy = ( text: any ) => {
    Clipboard.setString( text );
  };

  return (
    <TouchableRipple
      style={ styles.copyButton }
      onPress={ () => handleCopy( value ) }
    >
      { title ? (
        <Text style={ { color: theme.colors.primary } }>{ title }</Text>
      ) : (
        <FontAwesome name="clipboard" />
      ) }
    </TouchableRipple>
  );
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  header: {
    minWidth: '100%',
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
  paymentMethod: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  paymentInstruction: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 3,
    marginVertical: 6,
    textAlign: 'left',
    width: '100%',
  },
  detailLabel: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'left',
  },
  detailValue: {
    textAlign: 'left',
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    fontSize: 16,
    backgroundColor: theme.colors.primaryTrans,
    position: 'absolute',
    right: 0,
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primaryTrans,
    color: theme.colors.primary,
    paddingInline: 10,
  },
  importantNote: {
    fontSize: 14,
    color: 'gray',
    opacity: .8,
    marginBlock: 8,
    marginTop: 18,
    textAlign: 'center',
  },
  paidButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  paidButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: 16,
  },
} );

export default CompletePaymentScreen;
