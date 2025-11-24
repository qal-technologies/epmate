import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { flowRegistry } from './core/FlowRegistry';
import { useFlow } from './core/FlowInstance';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { TouchableRipple, Text } from 'react-native-paper';
import {} from './core/Wrappers/FlowPage'
import {ModalFlow} from './core/Wrappers/FlowModal';


const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// ... (helper functions and types remain the same)
function sizeToSnapPoints(size?: string) {
  switch (size) {
    case 'full':
      return ['100%'];
    case 'half':
      return ['50%'];
    case 'bottom':
      return ['30%', '60%', '100%'];
    default:
      return ['50%'];
  }
}

type FlowInjected = {
  api: ReturnType<typeof useFlow>;
  parentId: string;
  childId: string;
  flags: { opening: boolean; switching: boolean; dragging: boolean };
};

const FlowChildWrapper: React.FC<{
  flow: FlowInjected;
  children: React.ReactNode;
}> = ({ flow, children }) => {
  if (!React.isValidElement(children)) return children;
  return React.cloneElement(children as React.ReactElement<any>, { flow });
};

const OverlayPortal: React.FC<{ children: React.ReactNode }> = React.memo(
  ({ children }) => {
    return (
      <View pointerEvents="box-none" style={styles.overlayContainer}>
        {children}
      </View>
    );
  },
);
const FullScreenPageWrapper = React.memo(function FullScreenPageWrapper({
  parentId,
  childId,
  content,
  background,
  runtime,
}: {
  parentId: string;
  childId: string;
  content: React.ReactNode;
  background?: string;
  runtime: ReturnType<typeof useFlow>;
}) {
  const node = flowRegistry.getNode(childId);
  const childProps = node?.props || {};
  const {
    animationType = 'fade',
    title,
    noTitle,
    canGoBack = true,
    activityIndicator,
  } = childProps;

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    runtime.onAnimationComplete(parentId, true);

    switch (animationType) {
      case 'slideBottom':
        translateY.value = SCREEN_HEIGHT;
        break;
      case 'slideTop':
        translateY.value = -SCREEN_HEIGHT;
        break;
      case 'slideLeft':
        translateX.value = -SCREEN_WIDTH;
        break;
      case 'slideRight':
        translateX.value = SCREEN_WIDTH;
        break;
      default:
        opacity.value = 0;
        break;
    }

    opacity.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0, {}, () => {
      runtime.onAnimationComplete(parentId, false);
    });

    return () => {
      runtime.onAnimationComplete(parentId, true);
      switch (animationType) {
        case 'slideBottom':
          translateY.value = withSpring(SCREEN_HEIGHT);
          break;
        case 'slideTop':
          translateY.value = withSpring(-SCREEN_HEIGHT);
          break;
        case 'slideLeft':
          translateX.value = withSpring(-SCREEN_WIDTH);
          break;
        case 'slideRight':
          translateX.value = withSpring(SCREEN_WIDTH);
          break;
        default:
          opacity.value = withSpring(0);
          break;
      }
      opacity.value = withSpring(0, {}, () => {
        runtime.onAnimationComplete(parentId, false);
      });
    };
  }, [parentId, runtime, animationType, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const { opening, switching } = runtime.getFlags(parentId);
  const siblings = parentId ? flowRegistry.getChildren(parentId) : [];
  const isFirstChild = siblings.length > 0 ? siblings[0].id === childId : false;
  const api = runtime;

  const page = (
    <FlowChildWrapper
      flow={{
        api: runtime,
        parentId,
        childId,
        flags: runtime.getFlags(parentId),
      }}
    >
      {content}
    </FlowChildWrapper>
  );

  return (
    <Reanimated.View
      pointerEvents="box-none"
      style={[
        styles.fullScreen,
        { backgroundColor: background || '#fff' },
        animatedStyle,
      ]}
    >
      {!noTitle && (
        <View style={styles.header}>
          {canGoBack && !isFirstChild && (
            <View style={styles.headerRight}>
              <TouchableRipple onPress={() => api.prev(parentId)}>
                <View style={styles.headerAction}>
                  <MaterialIcons
                    name="arrow-back"
                    color={theme.colors.primary}
                    size={18}
                  />
                </View>
              </TouchableRipple>
            </View>
          )}

          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title ?? node?.name ?? ''}
            </Text>
          </View>
        </View>
      )}

      {page}
      {(opening || switching) && (
        <View style={styles.activityIndicatorContainer}>
          {activityIndicator || <ActivityIndicator size="large" />}
        </View>
      )}
    </Reanimated.View>
  );
});

const ModalBottomSheetWrapper = React.memo(function ModalBottomSheetWrapper({
  parentId,
  childId,
  snapPoints,
  draggable,
  dismissable,
  background,
  content,
  runtime,
}: {
  parentId: string;
  childId: string;
  snapPoints: string[];
  draggable: boolean;
  dismissable: boolean;
  background?: string;
  content: React.ReactNode;
  runtime: ReturnType<typeof useFlow>;
}) {
  const ref = React.useRef<any>(null);

  // child props and header behavior
  const node = flowRegistry.getNode(childId);
  const childProps = node?.props || {};
  const title = childProps.title ?? node?.name ?? '';
  const noTitle = !!childProps.noTitle;
  const topElement: React.ReactNode | undefined = childProps.topElement;
  const { opening, switching } = runtime.getFlags(parentId);
  const activityIndicator = childProps.activityIndicator;

  const normalizedSnapPoints = React.useMemo(() => {
    return snapPoints;
  }, [snapPoints]);

  const onAnimate = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex !== toIndex) {
        runtime.onAnimationComplete(parentId, true);
      }
    },
    [parentId, runtime],
  );

  const onChangeHandler = React.useCallback(
    (index: number) => {
      runtime.onAnimationComplete(parentId, false);
      if (index === -1) {
        runtime.prev(parentId);
        return;
      }
      const percent =
        normalizedSnapPoints.length > 1
          ? index / (normalizedSnapPoints.length - 1)
          : 1;

      runtime.onDragUpdate(parentId, percent);
    },
    [parentId, runtime, normalizedSnapPoints],
  );

  const handlePresent = React.useCallback(() => {
    try {
      ref.current?.present?.();
    } catch (err) {}
  }, []);

  React.useEffect(() => {
    handlePresent();
  }, [handlePresent]);

  const renderBackdrop = React.useCallback(
    (props: any) => {
      if (snapPoints.some(s => String(s).includes('100%'))) {
        return (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior={dismissable ? 'close' : 'none'}
          />
        );
      }
      return null;
    },
    [snapPoints, dismissable],
  );

  const page = (
    <View style={{ flex: 1 }}>
      {!noTitle && (
        <View
          style={[styles.header, { backgroundColor: background || '#fff' }]}
        >
          {dismissable && (
            <View style={styles.headerRight}>
              <TouchableRipple onPress={() => runtime.close(parentId)}>
                <View style={styles.headerAction}>
                  <MaterialIcons
                    name="close"
                    color={theme.colors.primary}
                    size={16}
                  />
                </View>
              </TouchableRipple>
            </View>
          )}

          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {title}
            </Text>
            {topElement ? <View>{topElement}</View> : null}
          </View>
        </View>
      )}

      <View style={styles.bsContent}>
        <FlowChildWrapper
          flow={{
            api: runtime,
            parentId,
            childId,
            flags: runtime.getFlags(parentId),
          }}
        >
          {content}
        </FlowChildWrapper>
      </View>
      {(opening || switching) && (
        <View style={styles.activityIndicatorContainer}>
          {activityIndicator || <ActivityIndicator size="large" />}
        </View>
      )}
    </View>
  );

  return (
    <BottomSheetModal
      key={childId}
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      onChange={onChangeHandler}
      onAnimate={onAnimate}
      backgroundStyle={{ backgroundColor: background || '#fff' }}
      handleComponent={draggable ? undefined : null}
      enablePanDownToClose={dismissable}
      backdropComponent={renderBackdrop}
      onDismiss={() => runtime.prev(parentId)}
    >
      <View style={styles.bsContent}>{page}</View>
    </BottomSheetModal>
  );
});

const FlowNavigator: React.FC = () => {
  const runtime = useFlow();
  const [activeList, setActiveList] = React.useState<any[]>([]);

  React.useEffect(() => {
    const updateActiveFlows = () => {
      const debug = flowRegistry.debugTree();
      const parents = (debug.nodes || []).filter(
        (n: any) => n.parentId === null,
      );
      const active = parents.map((p: any) => ({
        parentNode: p,
        activeNode: runtime.getActive(p.id),
      }));
      setActiveList(active);
    };

    const unsubscribe = flowRegistry.subscribe(updateActiveFlows);
    updateActiveFlows();

    return () => {
      unsubscribe();
    };
  }, [runtime]);

  if (!activeList.some(a => a.activeNode)) return null;

  const rendered = activeList.map(({ parentNode, activeNode }) => {
    if (!activeNode) return null;
    const childProps = activeNode.props || {};
    const size = childProps.size || 'half';
    const draggable = !!childProps.draggable;
    const dismissable = childProps.dismissable !== false;
    const coverScreen = !!childProps.coverScreen;
    const background =
      childProps.background ||
      (parentNode.props?.theme === 'dark' ? '#111' : '#fff');

    let content;
    if (parentNode.type === 'modal') {
      const snapPoints = sizeToSnapPoints(size);
      content = (
        <ModalBottomSheetWrapper
          key={activeNode.id}
          parentId={parentNode.id}
          childId={activeNode.id}
          snapPoints={snapPoints}
          draggable={draggable}
          dismissable={dismissable}
          background={background}
          content={activeNode.props?.page ?? null}
          runtime={runtime}
        />
      );
    } else {
      content = (
        <FullScreenPageWrapper
          key={activeNode.id}
          parentId={parentNode.id}
          childId={activeNode.id}
          content={activeNode.props?.page ?? null}
          background={background}
          runtime={runtime}
        />
      );
    }

    if (coverScreen) {
      return (
        <Modal
          key={activeNode.id}
          transparent
          visible
          statusBarTranslucent
          animationType="none"
        >
          {content}
        </Modal>
      );
    }

    return (
      <View key={activeNode.id} pointerEvents="auto" style={styles.overlaySlot}>
        {content}
      </View>
    );
  });

  return <OverlayPortal>{rendered}</OverlayPortal>;
};

export default FlowNavigator;

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 99999,
    zIndex: 99999,
    pointerEvents: 'box-none',
  },
  overlaySlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  bsContent: {
    flex: 1,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e3e3e3',
    backgroundColor: 'transparent',
  },
  headerLeft: { width: 48, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRight: { width: 72, alignItems: 'flex-end', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerAction: {
    padding: 8,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
  },
  pageContent: { flex: 1 },
  activityIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});
