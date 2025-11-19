import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableRipple } from 'react-native-paper';
import { theme } from '../../theme/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AuthBtn from '../../components/AuthButton';

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

const CompletePaymentScreen: React.FC<Props> = ({
  navigation,
  helper,
  price,
  currency,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableRipple onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableRipple>
        <Text style={styles.headerTitle}>Complete Your Payment</Text>
      </View>

      <View style={styles.card}>
        <MaterialIcons
          name="check-circle"
          size={20}
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
          <Text style={styles.detailValue}>{helper.accountNumber}</Text>
          <CopyBtn value={helper.accountNumber} title="Copy" />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bank Account Details</Text>
        <View style={styles.detailContainer}>
          <Text style={styles.detailLabel}>Account Name:</Text>
          <Text style={styles.detailValue}>{helper.accountName}</Text>
          <CopyBtn value={helper.accountName} title="Copy" />
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
    //handle copy with a package or library
    //   take in value:
  };

  return (
    <TouchableRipple style={styles.copyButton}>
      {title ? (
        <Text>{title}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    minWidth: '100%',
  },
  backButton: {
    fontSize: 24,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: 'gray',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyButton: {
    fontSize: 16,
    color: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
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
