import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { theme } from '../../theme/theme';
import { Button, TouchableRipple } from 'react-native-paper';
import AuthBtn from '../../components/AuthButton';

type ConfirmOrderScreenProps = NativeStackNavigationProp<
  HomeStackParamList,
  'ConfirmOrder'
>;

type Props = {
  navigation: ConfirmOrderScreenProps;
};

const ConfirmOrderScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableRipple onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableRipple>
        <Text style={styles.headerTitle}>Confirm Your Order</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.taskType}>Task Type: Pickup and Deliver</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Locations</Text>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Pickup Location:</Text>
          <Text style={styles.locationText}>A123, Central Market, Abjua</Text>
        </View>
        <View style={styles.locationContainer}>
          <Text style={styles.locationLabel}>Delivery Location:</Text>
          <Text style={styles.locationText}>
            House B4, Sunshine Estate, Apo
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Helper Details</Text>
        <View style={styles.helperContainer}>
          <Image
            source={{ uri: 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.helperName}>John Okafor</Text>
            <Text style={styles.helperRating}>Rating: 3.9/5 ★</Text>
            <Text style={styles.helperTasks}>Total tasks completed: 48</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Price Summary</Text>
        <Text style={styles.price}>₦1,650</Text>
        <Text style={styles.priceDetail}>Service fee: ₦150</Text>
        <Text style={styles.priceDetail}>Helper's charge: 1,500</Text>
      </View>

      <AuthBtn
        btnText="CONFIRM ORDER"
        btnStyle="solid"
        onClick={() => navigation.navigate('ConfirmOrder')}
        btnMode="contained"
        mv
        style={styles.confirmButton}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 8,
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
  },
  priceDetail: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConfirmOrderScreen;
