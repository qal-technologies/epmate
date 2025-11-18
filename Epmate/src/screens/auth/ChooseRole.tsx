import React, { useState } from 'react';
import { Text, Button } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import type { RootStackParamList } from '../../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import RadioBtn from '../../components/SelectBtn';
import AuthBtn from '../../components/AuthButton';
import { db } from '../../utils/firebaseFirestore';

type RoleNavigationProps = NativeStackNavigationProp<
  RootStackParamList,
  'Role'
>;

type Props = {
  navigation: RoleNavigationProps;
  userId: string;
};

const RolePage: React.FC<Props> = ({ navigation, userId }) => {
  const [userRole, setUserRole] = useState('user');

  const roles = [
    {
      name: 'user',
      title: 'Get Help',
      info: 'Find someone trusted to assist you with your needs',
    },
    {
      name: 'helper',
      title: 'Offer Help',
      info: 'Provide assistance and earn money',
    },
  ];

  const handleRoleSelection = async () => {
    db.collection('users')
      .doc(userId)
      .set({
        role: userRole,
      })
      .then(() => {
        navigation.navigate('Home');
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to Epmate?</Text>

      {roles.map(role => {
        return (
          <RadioBtn
            value={role.name}
            title={role.title}
            description={role.info}
            setSelected={value => setUserRole(value)}
            selected={role.name == userRole}
          />
        );
      })}

      <Text style={{ marginTop: 5, fontSize: 14, color: 'grey' }}>
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
    padding: 16,
    backgroundColor: theme.colors.background,
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

export default RolePage;
