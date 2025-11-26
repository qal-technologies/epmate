import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../../../theme/theme';

const ProcessingPaymentScreen = () => {
  const navigation = useNavigation();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      isInteraction: true,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      //handle flutterwave payment here using backend or a hook/helper that sends boolean to know if navigate to successful or failed.
      //   navigation.navigate('Home');
      // once the backend returns payment status, sucessful or not, the animation reaches the end and stop
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size={80} color={theme.colors.primary} />
        <Text style={ styles.title }>Confirming your payment...</Text>
        
        <Text style={styles.subtitle}>
          Please wait while we confirm receipt. This may take a moment.
        </Text>
        <View style={styles.progressContainer}>
          <Animated.View
            style={[styles.progressBar, { width, borderRadius: 50 }]}
          />
        </View>
        <Text style={styles.progressText}>Verifying with bank...</Text>
      </View>
      <Text style={styles.footerText}>
        Payments are processed securely by Flutterwave
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background
  },
  content: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    
    width: '95%',
    height: Dimensions.get('screen').height - 200,
    padding: 15,
    paddingTop:100,
    borderRadius: 20,
    alignSelf: 'center'
  },
  title: {
    fontSize: 35,
    fontWeight: 'bold',
    marginTop: 100,
    textAlign: 'left',
    alignSelf: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 50,
  },
  progressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: theme.colors.primaryTrans,
    borderRadius: 50,
    marginTop: 50,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text,
    opacity: 0.8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.placeholder,
    textAlign: 'center',
    position: 'absolute',
    bottom: 16,
  },
});

export default ProcessingPaymentScreen;
