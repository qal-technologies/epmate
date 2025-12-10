import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {flowRegistry} from './core/FlowRegistry';
import {FlowContext} from './core/FlowContext';
import type {FlowModalProps, SizeType} from './types';

const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

// Size to height mapping
const SIZE_MAP: Record<SizeType, number> = {
  full: SCREEN_HEIGHT,
  half: SCREEN_HEIGHT * 0.5,
  bottom: SCREEN_HEIGHT * 0.35,
};

interface FlowModalComponentProps {
  /** The content to render inside the modal */
  children: React.ReactNode;
  /** Whether the modal is visible */
  visible: boolean;
  /** Called when the modal should close */
  onClose?: () => void;
  /** Size of the modal */
  size?: SizeType;
  /** Whether the modal can be dragged */
  draggable?: boolean;
  /** Whether tapping backdrop dismisses the modal */
  dismissable?: boolean;
  /** Show backdrop */
  backdrop?: boolean;
  /** Called during drag with position (0-1, where 0=closed, 1=fully open) */
  onDrag?: (position: number) => void;
  /** Background color of the modal */
  backgroundColor?: string;
  /** Parent ID for context */
  parentId?: string;
  /** Child ID for context */
  childId?: string;
  /** Header configuration */
  headerConfig?: {
    titlePosition?: 'left' | 'center' | 'right';
    headerStyle?: any;
    noBackBtn?: boolean;
    headerRight?: React.ReactNode;
    headerBottom?: React.ReactNode;
    transparent?: boolean;
  };
}

/**
 * FlowModal - A custom modal component with drag gesture support
 * Returns drag position (0-1) via onDrag callback for dev animations
 */
export const FlowModal = React.memo(({
  children,
  visible,
  onClose,
  size = 'half',
  draggable = true,
  dismissable = true,
  backdrop = true,
  onDrag,
  backgroundColor = '#ffffff',
  parentId,
  childId,
  headerConfig,
}: FlowModalComponentProps) => {
  const modalHeight = SIZE_MAP[size] || SIZE_MAP.half;
  
  // Animation values
  const translateY = React.useRef(new Animated.Value(modalHeight)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const dragProgress = React.useRef(0);

  // Open/close animation
  React.useEffect(() => {
    if(visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: modalHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, modalHeight]);

  // Calculate and report drag position
  const reportDragPosition = React.useCallback((currentY: number) => {
    // Position: 0 = closed (at bottom), 1 = fully open (at top)
    const position = Math.max(0, Math.min(1, 1 - (currentY / modalHeight)));
    dragProgress.current = position;
    onDrag?.(position);
  }, [modalHeight, onDrag]);

  // Pan responder for drag gestures
  const panResponder = React.useMemo(() => {
    if(!draggable) return {panHandlers: {}};

    let startY = 0;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        // @ts-ignore - get current value
        startY = translateY._value || 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const newY = Math.max(0, startY + gestureState.dy);
        translateY.setValue(newY);
        
        // Report drag position to dev
        reportDragPosition(newY);
        
        // Update backdrop opacity based on drag
        const opacity = 0.5 * (1 - newY / modalHeight);
        backdropOpacity.setValue(Math.max(0, opacity));
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const currentY = startY + gestureState.dy;
        
        // Determine whether to close or snap back
        const shouldClose = velocity > 0.5 || currentY > modalHeight * 0.4;
        
        if(shouldClose && dismissable) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: modalHeight,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onDrag?.(0); // Report closed position
            onClose?.();
          });
        } else {
          // Snap back to open
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 150,
          }).start(() => {
            onDrag?.(1); // Report fully open position
          });
          Animated.timing(backdropOpacity, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }, [draggable, dismissable, modalHeight, onClose, onDrag, translateY, backdropOpacity, reportDragPosition]);

  if(!visible) return null;

  const contextValue = {
    flowId: childId || '',
    parentId: parentId || '',
    childId: childId || '',
    type: 'modal' as const,
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      {backdrop && (
        <TouchableWithoutFeedback onPress={dismissable ? onClose : undefined}>
          <Animated.View
            style={[
              styles.backdrop,
              {opacity: backdropOpacity},
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modal,
          {
            height: modalHeight,
            backgroundColor,
            transform: [{translateY}],
          },
          size === 'full' && styles.fullModal,
        ]}
        {...panResponder.panHandlers}
      >
        {/* Drag handle */}
        {draggable && size !== 'full' && (
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
        )}

        {/* Content with context */}
        <FlowContext.Provider value={contextValue}>
          <SafeAreaView style={styles.content}>
            {children}
          </SafeAreaView>
        </FlowContext.Provider>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  modal: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  fullModal: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    top: 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
});

export default FlowModal;
