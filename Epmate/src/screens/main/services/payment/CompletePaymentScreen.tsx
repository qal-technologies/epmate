import React from 'react';
import { View, Text, StyleSheet, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableRipple } from 'react-native-paper';
import { theme } from '../../../../theme/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../../navigation/types';
import {
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import AuthBtn from '../../../../components/AuthButton';

type CompletePayment = NativeStackNavigationProp<
  HomeStackParamList,
  'ConfirmOrder'
>;

type FluttweWave = {
  accountNumber: number;
  accountName: string;
  [key: string]: any;
};

type Props = {
  price: number | any;
  navigation: CompletePayment;
  currency: string;
  helper: FluttweWave;
};

const CompletePaymentScreen: React.FC<Props> = ({ navigation }) => {
  const route = navigation
    .getState()
    .routes.find(r => r.name === 'CompletePayment');
  const {
    helper: helperData,
    price: priceData,
    currency: currencyData,
  } = route?.params || {};
  const helper = helperData;
  const price = priceData;
  const currency = currencyData;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableRipple
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 10,
            borderRadius: '50%',
            backgroundColor: theme.colors.primaryTrans,
          }}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={theme.colors.text}
          />
        </TouchableRipple>
        <Text style={styles.headerTitle}>Complete Your Payment</Text>
      </View>

      <View style={styles.card}>
        <FontAwesome
          name="bank"
          size={40}
          style={{ marginVertical: 15 }}
          color={theme.colors.primary}
        />
        <Text style={styles.paymentMethod}>One-Time Bank Transfer</Text>
        <Text style={styles.paymentInstruction}>
          Transfer the exact amount to confirm your order
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Amount Due:</Text>
          <Text style={styles.detailValue}>
            {currency}
            {price}
          </Text>
          <CopyBtn value={helper} title="Copy" />
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Bank Name:</Text>
          <Text style={styles.detailValue}>Flutterwave Payments</Text>
        </View>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Account Number:</Text>
          <Text style={styles.detailValue}>{'1234567890'}</Text>
          <CopyBtn value={'1234567890'} title="Copy" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bank Account Details</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Account Name:</Text>
          <Text style={styles.detailValue}>
            {helper.accountName || 'Name here'}
          </Text>
          <CopyBtn value={helper.accountName || 'Name here'} title="Copy" />
        </View>
        <Text style={styles.importantNote}>
          Important: This account is for one-time use only. Your order will be
          confirmed upon payment receipt.
        </Text>
      </View>

      <AuthBtn
        btnText="I HAVE PAID"
        btnStyle="solid"
        btnMode="contained"
        onClick={() => navigation.navigate('ProcessingPayment')}
      />

      <Text style={styles.footerText}>
        Payments are processed securely by Flutterwave
      </Text>
    </SafeAreaView>
  );
};

const CopyBtn: React.FC<{ value: any; title?: string }> = ({
  value,
  title,
}) => {
  const handleCopy = (text: any) => {
    Clipboard.setString(text);
  };

  return (
    <TouchableRipple
      style={styles.copyButton}
      onPress={() => handleCopy(value)}
    >
      {title ? (
        <Text style={{ color: theme.colors.primary }}>{title}</Text>
      ) : (
        <MaterialCommunityIcons name="clipboard" />
      )}
    </TouchableRipple>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
    gap: 10,
    minWidth: '98%',
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    width: '90%',
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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
    paddingInline: 8,
  },
  importantNote: {
    fontSize: 14,
    color: 'red',
    marginTop: 8,
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
});

export default CompletePaymentScreen;
