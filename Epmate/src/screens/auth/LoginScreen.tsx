import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button, Divider } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { firebaseAuth } from '../../utils/firebaseAuth';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import TPView from '../../components/T&PView';
import Banner from '../../components/UpperBanner';
import AuthBtn from '../../components/AuthButton';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

type Props = {
  navigation: LoginScreenNavigationProp;
};

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      await firebaseAuth.signInWithEmail(email, password);
      dispatch(login({ uid: '12345', email: email }));
    } catch (error: any) {
      console.error('Login error:', error.message || error);
    }
  };

  const handleGoogleLogin = () => {
    dispatch(login());
  };

  return (
    <View style={styles.container}>
      <Banner withText={false} />
      <Text style={styles.title}>Welcome to Epmate</Text>
      <Text style={styles.sub}>Please login...</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
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
        btnText="Login"
        onClick={handleLogin}
        btnMode="contained"
        btnStyle="solid"
        disabled={email.trim().length < 1 || password.trim().length < 1}
        mv
      />

      <Divider />

      <Text style={styles.small}>
        Link your email account for quicker sign in
      </Text>
      <AuthBtn
        btnText="Continue with Google"
        onClick={handleGoogleLogin}
        btnMode="outlined"
        btnStyle="border"
        icon="google"
      />
      <Button onPress={() => navigation.navigate('Signup')}>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.text,
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
    color: 'black',
    fontFamily: theme.fonts.regular,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
  link: {
    color: theme.colors.primary,
    textDecorationColor: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
