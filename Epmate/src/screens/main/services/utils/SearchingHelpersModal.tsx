//screens/main/services/SearchingHelpersModal.tsx
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import {Portal} from 'react-native-paper';
import {theme} from '../../../../theme/theme';

interface Props {
  visible: boolean;
  onAnimateMap?: () => void;
  onComplete: () => void;
}

const SearchingHelpersModal: React.FC<Props> = ({visible, onAnimateMap, onComplete}) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if(visible) {
      if(onAnimateMap) {
        onAnimateMap();
      }

      progress.setValue(0);

      Animated.timing(progress, {
        toValue: 1,
        duration: 3200,
        useNativeDriver: false,
      }).start();


      const timer = setTimeout(() => {
        onComplete();
      }, 3200);

      return () => clearTimeout(timer);
    }
  }, [visible, progress, onAnimateMap, onComplete]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if(!visible) return null;

  return (
    <Portal>
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.modal}>
          <Text style={styles.text}>Searching for nearby helpers...</Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </Portal>
  );
};

const {width: screenWidth} = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modal: {
    backgroundColor: theme.colors.secondary,
    padding: 15,
    paddingBottom: 30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: 'center',
    width: '100%',
    paddingTop: 25,
  },
  text: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'left',
    fontWeight: 'bold',
    width: '100%',
  },
  progressBar: {
    width: screenWidth - 30,
    height: 10,
    backgroundColor: theme.colors.primaryTrans,
    borderRadius: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
  },
});

export default SearchingHelpersModal;
