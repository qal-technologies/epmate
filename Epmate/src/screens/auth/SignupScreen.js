import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { firebaseAuth, db } from '../../utils/firebase';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();

  const handleSignup = async () => {
    try {
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      await db.collection('users').doc(userCredential.user.uid).set({
        email: userCredential.user.email,
        role: 'user', // or 'helper'
      });
      dispatch(login());
    } catch (error) {
      console.error(error);
    }
  };

  const handleGoogleSignup = () => {
    // Implement Google Sign-In here
    dispatch(login());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
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
      <Button mode="contained" onPress={handleSignup} style={styles.button}>
        Sign Up
      </Button>
      <Button
        mode="outlined"
        onPress={handleGoogleSignup}
        style={styles.button}
        icon="google"
      >
        Continue with Google
      </Button>
      <Button onPress={() => navigation.navigate('Login')}>
        Already have an account? Log in
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

export default SignupScreen;
