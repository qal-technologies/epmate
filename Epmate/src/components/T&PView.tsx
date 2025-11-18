import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../theme/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup' | 'Login'
>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

const TPView: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={{ width: '90%', marginTop: 8 }}>
      <Text style={[styles.small, styles.sm, { color: 'black' }]}>
        By continuing, you agree to Epmate's{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Terms')}>
          Terms of Service
        </Text>{' '}
        and
        <Text style={styles.link} onPress={() => navigation.navigate('Policy')}>
          Privacy Policy.
        </Text>
      </Text>
      <Text style={[styles.small, styles.sm, { color: 'black' }]}>
        You may receive notifications about your tasks and helpers. You can
        unsubsibe.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});
export default TPView;
