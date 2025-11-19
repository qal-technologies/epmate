import React, { useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { firebaseAuth } from '../../utils/firebaseAuth';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { db } from '../../utils/firebaseFirestore';
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
  const dispatch = useDispatch();

  const handleSignup = async () => {
    try {
      const userCredential = await firebaseAuth.signUpWithEmail(
        email,
        password,
      );

      const uid = userCredential.user?.uid;
      const userEmail = userCredential.user?.email;

      if (!uid || !userEmail) return;

      await db.collection('users').doc(uid).set({
        email: userEmail,
      });

      navigation.navigate('userName', { userId: uid }); 
    } catch (error: any) {
      console.error('Signup error:', error.message || error);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const userCredential = await firebaseAuth.signInWithGoogle();
      const uid = userCredential.user?.uid;
      const displayName = userCredential.user?.displayName;
      const userEmail = userCredential.user?.email;

      if (!uid || !userEmail || !displayName) return;

      await db.collection('users').doc(uid).set({
        email: userEmail,
        name: displayName,
      });

      localStorage.setItem('userName', displayName);
      dispatch(login({ uid, email: userEmail, displayName: displayName }));
      navigation.navigate('Role', { userId: uid }); 
    } catch (error: any) {
      console.error('Google Signup error:', error.message || error);
    }
  };

  return (
    <View style={styles.container}>
      <Banner />
      <Text style={styles.title}>Create an Account</Text>
      <Text style={[styles.sm, { color: 'black' }]}>
        We'll send you a verification code to your email.
      </Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        placeholder="your.name@email.com"
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholder="****"
      />

      <AuthBtn
        btnText="Sign Up"
        onClick={handleSignup}
        btnMode="contained"
        btnStyle="solid"
        disabled={email.trim().length < 5 || password.trim().length < 6}
        mv
      />

      <Divider />

      <AuthBtn
        btnText="Continue with Google"
        onClick={handleGoogleSignup}
        btnMode="outlined"
        btnStyle="border"
        icon="google"
      />

      <Button onPress={() => navigation.replace('Login')} mode="text">
        Already have an account? <Text style={styles.link}>Log in</Text>
      </Button>

      <TPView navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
    textAlign: 'center',
  },
  image: {
    maxWidth: '70%',
    objectFit: 'cover',
  },
  gnBg: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: 'white',
    fontFamily: theme.fonts.bold,
  },
  sub: {
    fontSize: 16,
    fontWeight: 'light',
    textAlign: 'center',
    marginBottom: 5,
    color: 'white',
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
