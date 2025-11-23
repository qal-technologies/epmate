import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Divider,
  HelperText,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { firebaseAuth } from '../../utils/firebaseAuth';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { db, firebaseFirestore } from '../../utils/firebaseFirestore';
import TPView from '../../components/T&PView';
import Banner from '../../components/UpperBanner';
import AuthBtn from '../../components/AuthButton';
import { useNavigation } from '@react-navigation/native';
import MyInput from 'components/myInput';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState<boolean>(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      navigation.navigate('userName', { userId: '12345' });
    } catch (error: any) {
      console.error('Signup error:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      scrollToOverflowEnabled
      scrollEnabled
      contentContainerStyle={{
        justifyContent: 'center',
        paddingBottom: 10,
      }}
    >
      <Banner />
      <Text style={styles.title}>Enter your phone number</Text>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.sub}>
          We'll send you a verification code on your WhatsApp.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 15 }}>
        <MyInput type="mobile" />

        <AuthBtn
          loading={loading}
          loadingText="Sending code..."
          btnText="Continue"
          onClick={handleSignup}
          btnMode="contained"
          btnStyle="solid"
          mv
          rounded
        />

        <TPView navigation={navigation} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    textAlign: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: 'black',
    fontFamily: theme.fonts.bold,
  },
  sub: {
    fontSize: 16,
    fontWeight: 'light',
    textAlign: 'center',
    marginBottom: 5,
    color: 'black',
    fontFamily: theme.fonts.regular,
  },
  small: {
    fontSize: 14,
    fontWeight: 'light',
    textAlign: 'center',
    color: 'white',
    fontFamily: theme.fonts.regular,
  },
  sm: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
  },
  link: {
    color: theme.colors.primary,
    textDecorationColor: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  input: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
    tintColor: theme.colors.primary,
    outlineColor: theme.colors.primary,
    borderCurve: 'circular',
    backgroundColor: theme.colors.secondary,
  },
  button: {
    marginBottom: 16,
    backgroundColor: theme.colors.primary,
    color: 'white',
    borderRadius: '20px',
  },
  googleBtn: {
    backgroundColor: 'none',
    color: 'black',
  },
});

export default SignupScreen;
