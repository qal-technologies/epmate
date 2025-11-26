import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { db, firebaseFirestore } from '../../utils/firebaseFirestore';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import AuthBtn from '../../components/AuthButton';
import MyInput from 'components/myInput';

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
      // firebaseFirestore.updateDocument('users', uid, { displayName: name });
      dispatch(login({ uid, displayName: name }));
      navigation.navigate('Home');
    } catch (error: any) {
      console.error('Error saving name:', error.message || error);
    }
  };

  return (
    <View style={styles.container}>

      <View>
        <MyInput type='text' value={name} setValue={setName} label='Enter Your Full Name' labelNote='This is just your display name and can be changed from the app settings' upperMb={5} selectionColor={theme.colors.primary} withLabel />
      </View>
      
      <AuthBtn
        btnMode="contained"
        btnStyle="solid"
        btnText="Continue"
        onClick={handleSaveName}
        disabled={name.trim().length === 0}
        mv
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems:'center',
    padding: 20,
    paddingTop:80,
    backgroundColor: theme.colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    marginBottom: 16,
    backgroundColor: theme.colors.background,

  },
});

export default UserNameScreen;
