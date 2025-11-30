import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import {theme} from '../theme/theme';
import {MaterialIcons} from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineNotice = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [isChecking, setIsChecking] = useState(false);
  const translateY = useSharedValue(-100);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) {
         // Show "Back Online" briefly then hide
         translateY.value = withTiming(0, {duration: 300});
         translateY.value = withDelay(3000, withTiming(-100, {duration: 300}));
      } else {
        // Show "No Internet" and stay
        translateY.value = withTiming(0, {duration: 300});
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setIsChecking(false);
    
    if (state.isConnected) {
        translateY.value = withDelay(2000, withTiming(-100, {duration: 300}));
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateY: translateY.value}],
    };
  });

  if (isConnected === true && translateY.value === -100) return null;

  const backgroundColor = isConnected ? '#4CAF50' : '#F44336';
  const message = isConnected ? 'You are back online' : 'No Internet Connection';
  const icon = isConnected ? 'wifi' : 'wifi-off';

  return (
    <Animated.View style={[styles.container, animatedStyle, {backgroundColor, paddingTop: insets.top}]}>
      <View style={styles.content}>
        <MaterialIcons name={icon} size={20} color="white" />
        <Text style={styles.text}>{message}</Text>
        {!isConnected && (
            <TouchableOpacity onPress={handleRetry} disabled={isChecking}>
                <MaterialIcons name="refresh" size={20} color="white" style={{opacity: isChecking ? 0.5 : 1}}/>
            </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
