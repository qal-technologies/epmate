import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import {useDispatch,useSelector} from 'react-redux';
import { db, firebaseFirestore } from '../../utils/firebaseFirestore';
import {updateUserProfile} from '../../state/slices/authSlice';
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
  navigation,
}) => {
  const [name, setName] = useState('');
  const dispatch = useDispatch();
  const authState = useSelector((state: any) => state.auth);

  const handleSaveName = async () =>
  {
    try {
      // Check if user already has a role
      const hasRole = authState.role !== null && authState.role !== undefined;
      // Update displayName in Redux store
      dispatch(updateUserProfile({displayName: name}));

      // TODO: Save to Firestore
      // await firebaseFirestore.updateDocument('users', uid, { displayName: name });

      if (hasRole)
      {
        // Profile is complete (has both displayName and role)
        // AppRootNavigator will automatically navigate to Main
      } else
      {
        // User needs to select a role
        navigation.navigate('Role');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Error saving name:', error.message || error);
    }
  };

  return (
    <View style={styles.container}>

      <View>
        <MyInput
          type='text'
          value={name}
          setValue={setName}
          label='Enter Your Full Name'
          upperMb={5}
          selectionColor={theme.colors.primary}
          withLabel
        />
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 80,
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
