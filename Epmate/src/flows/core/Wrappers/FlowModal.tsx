// src/components/ModalFlow.tsx
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface ModalFlowProps {
  size: 'full' | 'half' | 'bottom';
  draggable?: boolean;
  dismissable?: boolean;
  retract?: boolean;
  onDrag?: (distance: number) => void;
  onSwitch?: () => Promise<'forward' | 'backward'>;
  children: React.ReactNode;
}

export const ModalFlow: React.FC<ModalFlowProps> = ({
  size,
  draggable = false,
  dismissable = true,
  retract = false,
  onDrag,
  onSwitch,
  children,
}) => {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const SNAP_POINTS = {
    full: 0,
    half: -Dimensions.get('window').height * 0.5,
    bottom: -Dimensions.get('window').height * 0.8,
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate(event => {
      translateY.value = context.value.y + event.translationY;

      // Call onDrag callback on JS thread
      if (onDrag) {
        runOnJS(onDrag)(translateY.value);
      }
    })
    .onEnd(event => {
      const shouldDismiss = dismissable && translateY.value > 200;
      const shouldSnap = !retract && Math.abs(event.velocityY) > 500;

      if (shouldDismiss) {
        translateY.value = withSpring(
          Dimensions.get('window').height,
          {},
          () => {
            // Trigger close callback
          },
        );
      } else if (shouldSnap) {
        // Snap to nearest point
        const target =
          event.velocityY > 0 ? SNAP_POINTS.bottom : SNAP_POINTS.full;
        translateY.value = withSpring(target);
      } else if (retract) {
        // Return to original position
        translateY.value = withSpring(SNAP_POINTS[size]);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <GestureDetector gesture={draggable ? panGesture : Gesture.Pan()}>
      <Animated.View style={[styles.modal, animatedStyle]}>
        {draggable && <View style={styles.dragHandle} />}
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
    modal: {},
    dragHandle:{},
})