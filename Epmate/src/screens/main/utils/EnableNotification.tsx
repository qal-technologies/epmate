import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import RadioBtn from '../../components/SelectBtn';
import AuthBtn from '../../components/AuthButton';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from 'theme/theme';
// Removed unused theme import

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const NotificationPermissionModal: React.FC<Props> = ({
  visible,
  onDismiss,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [isGranted, setIsGranted] = useState<boolean>(true);
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setSelected('allow');
        onDismiss();
      } else {
        setIsGranted(false);
      }
    };
    checkPermission();
  }, []);

  const requestNotification = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
        setIsGranted(true);
      } else {
        console.log('Notification permissions denied.');
      }

      onDismiss();
    } catch (e) {
      console.log('Notification Error:', e);
    }
  };

  const handleConfirm = () => {
    if (selected === 'allow') {
      requestNotification();
    } else {
      onDismiss();
    }
  };

  if (isGranted) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <MaterialIcons
              name="notification-add"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={styles.title}>Enable Notifications</Text>
          </View>
          <Text style={styles.desc}>
            Allow notifications so we can update you on your tasks.
          </Text>

          <RadioBtn
            selected={selected === 'allow'}
            value="allow"
            setSelected={setSelected}
            title="Allow Notifications"
            description="Get updates, reminders, and alerts."
          />

          <RadioBtn
            selected={selected === 'deny'}
            value="deny"
            setSelected={setSelected}
            title="Maybe later"
            description="You can enable this in settings."
          />

          <AuthBtn
            btnText="Confirm"
            onClick={handleConfirm}
            disabled={!selected}
            btnStyle="solid"
            rounded
            btnMode="contained"
            mv
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  box: {
    width: '90%',
    padding: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  desc: {
    opacity: 0.7,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default NotificationPermissionModal;
