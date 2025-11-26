import React, { useState } from 'react';
import { Text,} from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import RadioBtn from '../../components/SelectBtn';
import AuthBtn from '../../components/AuthButton';
import { firebaseFirestore } from '../../utils/firebaseFirestore';
import { useDispatch } from 'react-redux';
import type { RootStackParamList } from 'navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation,} from '@react-navigation/native';
import { login } from 'state/slices/authSlice';

type RoleScreenProp = NativeStackNavigationProp<
  RootStackParamList,
  'Role'
>;

type Props = {
  userId?: string;
  navigation?: RoleScreenProp;
};

const RolePage: React.FC<Props> = ({navigation, userId}) => {
  const [userRole, setUserRole] = useState('user');

  const roles = [
    {
      name: 'user',
      title: 'Get Help',
      info: 'Find someone trusted to assist you with your needs',
      icon: 'location-pin',
    },
    {
      name: 'helper',
      title: 'Offer Help',
      info: 'Provide assistance and earn money',
      icon: 'handshake',
    },
  ];

  const dispatch = useDispatch();
  
  const handleRoleSelection = async () => {
    if (userRole) {
      // firebaseFirestore
      //   .addDocument('users', { userId: { role: userRole } })
      //   .then(() => {
      dispatch(login({ role: userRole }));
      if (userRole == 'user') navigation.navigate('userName', {userId})
      else navigation.navigate('Home');
        // });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to use Epmate?</Text>

      {roles.map(role => {
        return (
          <RadioBtn
            key={role.name}
            value={role.name}
            description={role.info}
            title={role.title}
            icon={role.icon}
            setSelected={value => setUserRole(value)}
            selected={role.name == userRole}
          />
        );
      })}

      <Text
        style={{
          marginTop: 1,
          marginBottom: 5,
          fontSize: 14,
          color: 'grey',
          textAlign: 'center',
        }}
      >
        You can switch roles anytime
      </Text>

      <AuthBtn
        disabled={!userRole}
        btnStyle="solid"
        btnText="Continue"
        onClick={handleRoleSelection}
        btnMode="contained"
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.secondary,
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
    textAlign: 'center',
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
});

export default RolePage;
