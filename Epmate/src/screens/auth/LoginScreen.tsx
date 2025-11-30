import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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
    const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      // const userCred = await firebaseAuth.signInWithEmail(email, password);
      dispatch(login({ uid: '12345', email: email }));
    } catch (error: any) {
      if (__DEV__) console.error('Login error:', error.message || error);
    }
  };

  const handleGoogleLogin = () => {
    dispatch(
      login({ uid: '1234', email: 'user@gmail.com', displayName: 'user' }),
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        justifyContent: 'center',
        paddingBottom: 10,
      }}
    >
      <Banner withText={false} />
      <Text style={styles.title}>Welcome back!</Text>
      <Text style={styles.sub}>Please login...</Text>
      <View style={{ paddingHorizontal: 15 }}>
        <TextInput
          label="Email"
          mode='outlined'
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="your.name@email.com"
          outlineColor={theme.colors.placeholder}
          activeOutlineColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
        />

        <TextInput
          label="Password"
          value={password}
          mode='outlined'
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          placeholder="****"
          outlineColor={theme.colors.placeholder}
          activeOutlineColor={theme.colors.primary}
          placeholderTextColor={theme.colors.placeholder}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />

        <AuthBtn
          btnText="Login"
          onClick={handleLogin}
          btnMode="contained"
          btnStyle="solid"
          disabled={email.trim().length < 1 || password.trim().length < 1}
          mv
        />

        <Divider style={{ marginVertical: 10 }} />

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
        <Button
          onPress={() => navigation.navigate('Signup')}
          mode="text"
          style={{ marginTop: 10 }}
        >
          Don't have an account? <Text style={styles.link}>Sign up</Text>
        </Button>

        <Button
          onPress={() => navigation.navigate('forgotPassword')}
          mode="text"
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>Forgot Password</Text>
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
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: theme.colors.text,
  },
  sub: {
    fontSize: 16,
    fontWeight: 'light',
    textAlign: 'center',
    marginBottom: 24,
    color: 'black',
    fontFamily: theme.fonts.regular,
  },
  small: {
    fontSize: 14,
    fontWeight: 'light',
    textAlign: 'center',
    color: 'black',
    marginBottom: 4,
    fontFamily: theme.fonts.regular,
  },
  input: {
    marginBottom: 16,
        backgroundColor: theme.colors.secondary,
    
  },
  button: {
    marginBottom: 16,
  },
  link: {
    color: theme.colors.primary,
    textDecorationColor: theme.colors.primary,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
