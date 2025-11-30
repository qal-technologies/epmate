import {MaterialIcons} from '@expo/vector-icons';
import AuthBtn from 'components/AuthButton';
import ModalBackButton from 'components/ModalBackButton';
import type {HelperData} from 'hooks/useHelpers';
import useTaskName from 'hooks/useServiceType';
import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity, } from 'react-native';
import {Button} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {theme} from 'theme/theme';

const TaskCompletionScreen = () => {

  const {selectedHelper, locationData} = useSelector((state: any) => state.order);

  if(!selectedHelper) return null;

  const helper: HelperData = selectedHelper;
  const serviceType = useTaskName();

  return (
    <View style={styles.container}>
      <ModalBackButton withTitle title='Task Completed - Please Confirm' size={18} />

      <View style={styles.upper}>
        <MaterialIcons name='check-circle' color={theme.colors.primary} size={30} />

        <Text style={styles.mainTitle}>Has Your Task Been Completed?</Text>
        <Text style={styles.mainSub}>Your helper: ${helper.name}, reports the task is finished. </Text>
      </View>


      <View style={styles.card}>
        <Text style={styles.title}>Your Helper</Text>

        <View style={styles.Avatar} key={selectedHelper.id}>
          {selectedHelper.image ? (
            <Image
              source={{uri: selectedHelper.image}}
              style={styles.Image}
              alt={selectedHelper.name}
            />
          ) : (
            <MaterialIcons
              name='verified-user'
              size={40}
              color={theme.colors.primary}
            />
          )}
        </View>

        <View style={{flex: 1}}>
          <Text style={styles.name}>{selectedHelper.name}</Text>
          <Text style={[styles.rating, {fontWeight: 'bold'}]}>
            Rating: <Text style={styles.rating}>{selectedHelper.rating} / 5</Text>
          </Text>

          <Text style={{color: theme.colors.placeholder}}>
            {selectedHelper.totalTasks} tasks completed
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        {serviceType.toLowerCase().includes('pickup') && (
          <>
            <View style={styles.typeWrapper}>
              <MaterialIcons name='location-pin' color={theme.colors.accent} size={25} />
              <View>
                <Text style={styles.typeTitle}>Pickup Location:</Text>
                <Text style={styles.typeValue}>{locationData?.pickupLocation}</Text>
              </View>
            </View>

            <View style={styles.typeWrapper}>
              <MaterialIcons name='check-circle' color={theme.colors.primary} size={25} />
              <View>
                <Text style={styles.typeTitle}>Delivery Location:</Text>
                <Text style={styles.typeValue}>{locationData?.deliveryLocation}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <AuthBtn btnText='YES, CONFIRM & PAY' btnStyle='solid' onClick={() => { }} btnMode='contained' />

      <AuthBtn btnText='No, Report an Issue' btnStyle='border' onClick={() => { }} btnMode='outlined' mv />

      <Text style={styles.footerText}>Your payment is held in escro and will be released to ${helper.name} upon your confirmation.</Text>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  mainTitle: {
    fontWeight: 'bold',
    fontSize: 25,
    marginBottom: 7,
    minWidth: '100%'
  },
  mainSub: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 6,
    minWidth: '100%'
  },
  card: {
    backgroundColor: theme.colors.secondary,
    width: '100%',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  Avatar: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.primaryTrans,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  Image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  rating: {
    fontWeight: '300',
    fontSize: 14,
  },
  sub: {
    color: theme.colors.placeholder,
    fontWeight: '300',
    fontSize: 16
  },
  typeWrapper: {
    width: '100%',
    gap: 10,
    flexDirection: 'row',
    marginBottom: 6
  },
  typeTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    opacity: 0.9
  },
  typeValue: {
    fontWeight: '300',
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    marginTop: 7
  },
  upper: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 3,
  },
});

export default TaskCompletionScreen;
