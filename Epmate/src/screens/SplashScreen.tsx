import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { theme } from '../theme/theme';
import Animated, { ZoomIn } from 'react-native-reanimated';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <StatusBar
        animated
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent
      />
      
      <Animated.Image
        entering={ZoomIn.springify()}
        source={require('../assets/images/logoName.png')}
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
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },
});

export default SplashScreen;
