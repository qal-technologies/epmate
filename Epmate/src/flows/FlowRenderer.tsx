import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { flowRegistry } from './core/FlowRegistry';
import { useFlow } from './core/FlowInstance';

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { TouchableRipple, Text } from 'react-native-paper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

function useRafThrottledCallback(fn: (v: number) => void) {
  const rafRef = React.useRef<number | null>(null);
  const lastRef = React.useRef<number>(0);
  return React.useCallback(
    (v: number) => {
      lastRef.current = v;
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          fn(lastRef.current);
        });
      }
    },
    [fn],
  );
}

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
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    return () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();
    };
  }, []);

  const node = flowRegistry.getNode(childId);
  const childProps = node?.props || {};
  const title = childProps.title ?? node?.name ?? '';
  const noTitle = !!childProps.noTitle;
  const canGoBack = childProps.canGoBack !== false;

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
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.fullScreen,
        { backgroundColor: background || '#fff', opacity },
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
              {title}
            </Text>
          </View>
        </View>
      )}

      {page}
    </Animated.View>
  );
});

/* BottomSheet wrapper that uses gorhom */
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
  const titleHeight = childProps.titleHeight ?? 56;

  const normalizedSnapPoints = React.useMemo(() => {
    const hasFull = snapPoints.some(s => String(s).includes('100%'));
    return snapPoints;
  }, [snapPoints]);

  const onChangeHandler = React.useCallback(
    (index: number) => {
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
    [parentId, runtime, snapPoints],
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
    </View>
  );

  return (
    <BottomSheetModal
      key={childId}
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      onChange={onChangeHandler}
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

/* main renderer */
const FlowRenderer: React.FC = () => {
  const runtime = useFlow();
  const [, tick] = React.useState(0);
  React.useEffect(() => {
    let mounted = true;
    const id = setInterval(() => {
      if (!mounted) return;
      tick(v => v + 1);
    }, 700);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const debug = flowRegistry.debugTree();
  const parents = React.useMemo(
    () => (debug.nodes || []).filter((n: any) => n.parentId === null),
    [debug],
  );

  const activeList = React.useMemo(() => {
    return parents.map((p: any) => ({
      parentNode: p,
      activeNode: runtime.getActive(p.id),
    }));
  }, [tick, parents, runtime]);

  if (!activeList.some(a => a.activeNode)) return null;

  const rendered = activeList.map(({ parentNode, activeNode }) => {
    if (!activeNode) return null;
    const childProps = activeNode.props || {};
    const size = childProps.size || 'half';
    const draggable = !!childProps.draggable;
    const dismissable = childProps.dismissable !== false;
    const background =
      childProps.background ||
      (parentNode.props?.theme === 'dark' ? '#111' : '#fff');

    if (parentNode.type === 'modal') {
      const snapPoints = sizeToSnapPoints(size);
      const isFull = snapPoints.some(s => String(s).includes('100%'));
      return (
        <View
          key={activeNode.id}
          pointerEvents={isFull ? 'auto' : 'box-none'}
          style={styles.overlaySlot}
        >
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
        </View>
      );
    } else {
      return (
        <View
          key={activeNode.id}
          pointerEvents="auto"
          style={styles.overlaySlot}
        >
          <FullScreenPageWrapper
            key={activeNode.id}
            parentId={parentNode.id}
            childId={activeNode.id}
            content={activeNode.props?.page ?? null}
            background={background}
            runtime={runtime}
          />
        </View>
      );
    }
  });

  return <OverlayPortal>{rendered}</OverlayPortal>;
};

export default React.memo(FlowRenderer);

/* styles */
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
});
