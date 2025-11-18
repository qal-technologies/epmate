import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { AppAuth, onAuthStateChanged } from '../../utils/firebaseAuth';

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

type Props = {
  navigation: SplashScreenNavigationProp;
};

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(AppAuth, user => {
      setTimeout(() => {
        if (user) {
          navigation.replace('Home', { userId: user.uid });
        } else {
          navigation.replace('Login');
        }
      }, 2400);
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo.jpg')}
        style={styles.logo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
  logo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
