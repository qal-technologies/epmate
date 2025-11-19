import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { firebaseAuth } from '../../utils/firebaseAuth';
import { theme } from '../../theme/theme';
import AuthBtn from '../../components/AuthButton';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation<any>();
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  type ForgotPasswordRouteParams = {
    ForgotPassword: {
      type?: string;
    };
  };

  const route =
    useRoute<RouteProp<ForgotPasswordRouteParams, 'ForgotPassword'>>();

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.type === 'reset') {
        setIsResetMode(true);
      } else {
        setIsResetMode(false);
      }
      setEmail('');
      setNewPassword('');
      setConfirmPassword('');
    }, []),
  );

  const handleSendResetEmail = async () => {
    try {
      setSending(true);
      await firebaseAuth.sendPasswordResetEmail(email);
      Alert.alert('Password reset email sent!');
      navigation.navigate('Login');
    } catch (error: any) {
      console.error('Error sending reset email:', error.message || error);
    } finally {
      setSending(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!isResetMode || newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match!');
      return;
    }

    try {
      setUpdating(true);
      const user = firebaseAuth.getCurrentUser();
      if (user) {
        await user.updatePassword(newPassword);
        Alert.alert('Password updated successfully!');
        navigation.navigate('Login');
      } else {
        Alert.alert('No user is logged in.');
      }
    } catch (error: any) {
      console.error('Error updating password:', error.message || error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      {!isResetMode ? (
        <>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            placeholder="your.name@email.com"
          />

          <AuthBtn
            btnText="Send Reset Email"
            mv
            btnStyle="solid"
            btnMode="contained"
            onClick={handleSendResetEmail}
            disabled={email.trim().length < 5}
            loading={sending}
            loadingText="Sending..."
            rounded
          />
        </>
      ) : (
        <>
          <TextInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
            placeholder="New Password"
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Confirm Password"
          />

          <AuthBtn
            btnText="Update Password"
            mv
            btnStyle="solid"
            btnMode="contained"
            onClick={handleUpdatePassword}
            disabled={
              newPassword.trim().length < 6 || confirmPassword.trim().length < 6
            }
            loading={updating}
            loadingText="Updating..."
            rounded
          />
        </>
      )}

      <Button onPress={() => navigation.navigate('Login')} mode="text">
        Back to <Text style={styles.link}>Login</Text>
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  link: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
