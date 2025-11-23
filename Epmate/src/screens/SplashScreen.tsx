import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import Animated, { ZoomIn } from 'react-native-reanimated';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Animated.Image
        entering={ZoomIn.springify()}
        source={require('../assets/')}
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
