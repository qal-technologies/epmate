import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const PaymentScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Payment Screen</Text>
      <Button mode="contained">Pay Now</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaymentScreen;
