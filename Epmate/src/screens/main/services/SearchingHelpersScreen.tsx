//screens/main/services/SearchingHelpersScreen.tsx
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {theme} from '../../../theme/theme';
import {useNavigation} from '@react-navigation/native';
import ModalBackButton from '../../../components/ModalBackButton';

const SearchingHelpersScreen: React.FC = () => {
  const progress = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => {
      navigation.navigate('HelperSelection');
    }, 3200);

    return () => clearTimeout(timer);
  }, [progress, navigation]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Searching for nearby helpers...</Text>
        <View style={styles.progressBar}>
          <Animated.View
            style={[styles.progress, {width, borderRadius: 50}]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'transparent'
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'transparent'
  },
  text: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    width: '100%',
  },
  progressBar: {
    height: 10,
    width: '100%',
    backgroundColor: theme.colors.primaryTrans,
    borderRadius: 50,
  },
  progress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
});

export default SearchingHelpersScreen;
