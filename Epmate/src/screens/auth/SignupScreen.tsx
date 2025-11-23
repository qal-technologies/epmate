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

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setLoadGoogle] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [passError, setPassError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      if (!email) {
        setEmailError('Email is required');
        setLoading(false);
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setEmailError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (!password) {
        setPassError('Password is required');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setPassError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setPassError('Passwords do not match');
        setLoading(false);
        return;
      }

      // const userCredential = await firebaseAuth.signUpWithEmail(
      //   email,
      //   password,
      // );

      // const uid = userCredential.user?.uid;
      // const userEmail = userCredential.user?.email;

      // if (!uid || !userEmail) return;

      // firebaseFirestore.addDocument('users', { uid: { email: userEmail } });

      navigation.navigate('userName', { userId: '12345' });
    } catch (error: any) {
      console.error('Signup error:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoadGoogle(true);
    try {
      // const userCredential = await firebaseAuth.signInWithGoogle();
      // const uid = userCredential.user?.uid;
      // const displayName = userCredential.user?.displayName;
      // const userEmail = userCredential.user?.email;

      // if (!uid || !userEmail || !displayName) return;

      // await db.collection('users').doc(uid).set({
      //   email: userEmail,
      //   name: displayName,
      // });

      // localStorage.setItem('userName', displayName);
      dispatch(
        login({ uid: '1234', email: 'user@gmail.com', displayName: 'user' }),
      );
      navigation.navigate('Role', { userId: '1234' });
    } catch (error: any) {
      console.error('Google Signup error:', error.message || error);
    } finally {
      setLoadGoogle(false);
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
      <Text style={styles.title}>Create Account</Text>
      <Text style={[styles.sub, { color: 'black', textAlign: 'center' }]}>
        We'll send you a verification code to your email.
      </Text>

      <View style={{ paddingHorizontal: 15 }}>
        <TextInput
          label="Email"
          value={email}
          mode='outlined'
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholder="your.name@email.com"
          outlineColor={theme.colors.placeholder}
          activeOutlineColor={emailError ? 'red' : theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          error={!!emailError}
          onFocus={() => setEmailError(null)}
        />

        {emailError && (
          <HelperText
            type={'error'}
            style={{ color: 'red', marginBottom: 8, textAlign: 'center' }}
          >
            {emailError}{' '}
          </HelperText>
        )}

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          mode='outlined'
          placeholder="****"
          activeOutlineColor={passError ? 'red' : theme.colors.primary}
          outlineStyle={{ borderColor: theme.colors.primary }}
          placeholderTextColor={theme.colors.placeholder}
          error={!!passError}
          onFocus={() => setPassError(null)}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          style={styles.input}
          mode='outlined'
          placeholder="****"
          outlineColor={theme.colors.placeholder}
          activeOutlineColor={passError ? 'red' : theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          error={!!passError}
          onFocus={() => setPassError(null)}
          right={
            <TextInput.Icon
              icon={showConfirmPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          }
        />
        
          <HelperText
            type={passError ? "error" : 'info'}
            style={{ marginBottom: 8, textAlign: 'center' }}
          >
            {!passError ? 'Password must be random and more than 6 characters': passError}
          </HelperText>

        <AuthBtn
          loading={loading}
          loadingText="Creating account..."
          btnText="Sign Up"
          onClick={handleSignup}
          btnMode="contained"
          btnStyle="solid"
          disabled={
            email.trim().length < 5 ||
            password.trim().length < 6 ||
            confirmPassword.trim().length < 6
          }
          mv
        />

        <Divider style={{ marginVertical: 10 }} />

        <AuthBtn
          loading={googleLoading}
          btnText="Continue with Google"
          onClick={handleGoogleSignup}
          btnMode="outlined"
          btnStyle="border"
          icon="google"
          mv
        />

        <Button onPress={() => navigation.replace('Login')} mode="text">
          Already have an account? <Text style={styles.link}>Log in</Text>
        </Button>

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
