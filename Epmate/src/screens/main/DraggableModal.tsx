// components/DraggableModal.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface DraggableModalProps {
  children: React.ReactNode;
  full?: boolean;
}

const DraggableModal: React.FC<DraggableModalProps> = ({ children, full }) => {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate(event => {
      translateY.value = Math.max(
        event.translationY + context.value.y,
        -SCREEN_HEIGHT / 2,
      );
    })
    .onEnd(() => {
      translateY.value =
        translateY.value > -SCREEN_HEIGHT / 4
          ? withSpring(0, { damping: 50 })
          : withSpring(-SCREEN_HEIGHT / 2, { damping: 50 });
    });

  let rStyle;
  full
    ? (rStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: 0 }],
      })))
    : (rStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
      })));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, rStyle]}>
        <View style={styles.line} />
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
    width: '100%',
    backgroundColor: 'white',
    position: 'absolute',
    top: SCREEN_HEIGHT / 1.5,
    borderRadius: 25,
  },
  line: {
    width: 75,
    height: 4,
    backgroundColor: 'grey',
    alignSelf: 'center',
    marginVertical: 15,
    borderRadius: 2,
  },
});

export default DraggableModal;
