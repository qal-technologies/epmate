import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { db } from '../../utils/firebaseFirestore';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import AuthBtn from '../../components/AuthButton';

type UserNameScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'userName'
>;

const UserNameScreen: React.FC<UserNameScreenProps> = ({
  route,
  navigation,
}) => {
  const { userId: uid } = route.params || {};
  const [name, setName] = useState('');
  const dispatch = useDispatch();

  const handleSaveName = async () => {
    try {
      await db.collection('users').doc(uid).update({
        displayName: name,
      });

      dispatch(login({ uid, displayName: name }));
      navigation.navigate('Role');
    } catch (error: any) {
      console.error('Error saving name:', error.message || error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Name</Text>
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Your Name"
      />

      <AuthBtn
        btnMode="contained"
        btnStyle="solid"
        btnText="Continue"
        onClick={handleSaveName}
        disabled={name.trim().length === 0}
        mv
        rounded
      />
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
    marginBottom: 10,
  },
  input: {
    marginBottom: 16,
  },
});

export default UserNameScreen;
