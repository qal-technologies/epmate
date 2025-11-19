import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import { PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';

import RadioBtn from '../../components/SelectBtn';
import AuthBtn from '../../components/AuthButton';
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

  const requestNotification = async () => {
    try {
      let permission;

      if (Platform.OS === 'android') {
        permission = 'android.permission.POST_NOTIFICATIONS';
      }

      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY;
      }

      const result = await request(permission as any);

      console.log('Permission result:', result);

      if (result === RESULTS.GRANTED) {
        if (Platform.OS === 'ios') {
          await messaging().requestPermission();
        }

        console.log('Notifications Enabled');
      } else {
        console.log('User Denied Notifications');
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Enable Notifications</Text>
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
    width: '85%',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  desc: {
    opacity: 0.7,
    marginBottom: 20,
  },
});

export default NotificationPermissionModal;
