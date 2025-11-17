import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { firebaseAuth } from '../../utils/firebase';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleLogin = async () => {
    try {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
      dispatch(login());
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google Sign-In here
    dispatch(login());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Epmate</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={handleLogin} style={styles.button}>
        Login
      </Button>
      <Button
        mode="outlined"
        onPress={handleGoogleLogin}
        style={styles.button}
        icon="google"
      >
        Continue with Google
      </Button>
      <Button onPress={() => navigation.navigate('Signup')}>
        Don't have an account? Sign up
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 16,
  },
});

export default LoginScreen;
