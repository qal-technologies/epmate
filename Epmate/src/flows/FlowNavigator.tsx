import React from 'react';
import {View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity} from 'react-native';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {useFlowNav} from './hooks/useFlowNav';
import {open} from './core/FlowRuntime';
import {FlowProvider} from './core/FlowProvider';
import {useFlowBackHandler} from './core/FlowBackHandler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetModalProvider,
} from '@gorhom/bottom-sheet';
import {MaterialIcons} from '@expo/vector-icons';
import {theme} from '../theme/theme';
import {TouchableRipple} from 'react-native-paper';
import {FlowTabWrapper} from './FlowTabWrapper';
const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

/**
 * @component FlowErrorBoundary
 * ... (No changes) ...
 */
class FlowErrorBoundary extends React.Component<
  {children: React.ReactNode; fallback?: React.ReactNode;},
  {hasError: boolean; error: Error | null;}
> {
  constructor(props: {children: React.ReactNode; fallback?: React.ReactNode;}) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError (error: Error) {
    return {hasError: true, error};
  }

  componentDidCatch (error: Error, errorInfo: React.ErrorInfo) {
    if(__DEV__) {
      console.error('[FlowErrorBoundary] Caught error:', error, errorInfo);
    }
  }

  render () {
    if(this.state.hasError) {
      if(this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={theme.colors.red} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => this.setState({hasError: false, error: null})}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * Helper function to convert abstract size strings to BottomSheet snap points.
 */
function sizeToSnapPoints (size?: string) {
  switch(size) {
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
  api: ReturnType<typeof useFlowRuntime>;
  parentId: string;
  childId: string;
  flags: {opening: boolean; switching: boolean; dragging: boolean;};
};

const FlowChildWrapper: React.FC<{
  flow: FlowInjected;
  children: React.ReactNode;
}> = ({flow, children}) => {
  if(!React.isValidElement(children)) return children;
  return React.cloneElement(children as React.ReactElement<any>, {flow});
};

const OverlayPortal: React.FC<{children: React.ReactNode;}> = React.memo(
  ({children}) => {
    return (
      <View pointerEvents="box-none" style={styles.overlayContainer}>
        {children}
      </View>
    );
  },
);

/**
 * @component FullScreenPageWrapper
 */
const FullScreenPageWrapper = React.memo(function FullScreenPageWrapper ({
  parentId,
  childId,
  content,
  background,
}: {
  parentId: string;
  childId: string;
  content: React.ReactNode;
  background?: string;
  tick?: number;
}) {
  const runtime = useFlowRuntime();
  const nav = useFlowNav(parentId);

  // Enable back handling for the root parent
  useFlowBackHandler(parentId);

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
  const scale = useSharedValue(1);

  React.useEffect(() => {
    if(typeof runtime?.notifyAnimationComplete === 'function') {
      runtime.notifyAnimationComplete(parentId, true);
    }

    switch(animationType) {
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
      case 'zoom':
        scale.value = 0.3;
        opacity.value = 0;
        break;
      case 'none':
        break;
      default:
        opacity.value = 0;
        break;
    }

    opacity.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    scale.value = withSpring(1, {}, () => {
      if(typeof runtime?.notifyAnimationComplete === 'function') runtime.notifyAnimationComplete(parentId, false);
    });

    return () => {
      // Cleanup animation not strictly needed for mount/unmount in this architecture,
      // but good for transitions if keys change.
    };
  }, [parentId, runtime, animationType, opacity, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  const {opening, switching} = runtime.getFlags(parentId);
  const siblings = parentId ? flowRegistry.getChildren(parentId) : [];
  const isFirstChild = siblings.length > 0 ? siblings[0].id === childId : false;

  const page = (
    <FlowProvider parentId={parentId} childId={childId} flowId={parentId}>
      <FlowChildWrapper
        flow={{
          api: runtime,
          parentId,
          childId,
          flags: runtime.getFlags(parentId),
        }}
      >
        <FlowErrorBoundary>
          {content}
        </FlowErrorBoundary>
      </FlowChildWrapper>
    </FlowProvider>
  );

  return (
    <Reanimated.View
      pointerEvents="box-none"
      style={[
        styles.fullScreen,
        {backgroundColor: background || '#fff'},
        animatedStyle,
      ]}
    >
      {!noTitle && (
        <View style={styles.header}>
          {canGoBack && !isFirstChild && (
            <View style={styles.headerRight}>
              <TouchableRipple onPress={() => nav.prev()}>
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

/**
 * @component ModalBottomSheetWrapper
 */
const ModalBottomSheetWrapper = React.memo(function ModalBottomSheetWrapper ({
  parentId,
  childId,
  snapPoints,
  draggable,
  dismissable,
  background,
  content,
  tick,
}: {
  parentId: string;
  childId: string;
  snapPoints: string[];
  draggable: boolean;
  dismissable: boolean;
  background?: string;
  content: React.ReactNode;
  tick?: number;
}) {
  const runtime = useFlowRuntime();
  const nav = useFlowNav(parentId);
  const ref = React.useRef<any>(null);

  const node = flowRegistry.getNode(childId);
  const childProps = node?.props || {};
  const {
    title = node?.name ?? '',
    noTitle = false,
    topElement,
    activityIndicator,
    backdrop,
    withShadow,
  } = childProps;
  const {opening, switching} = runtime.getFlags(parentId);

  const normalizedSnapPoints = React.useMemo(() => {
    return snapPoints;
  }, [snapPoints]);

  const onAnimate = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      if(fromIndex !== toIndex && typeof runtime?.notifyAnimationComplete === 'function') {
        runtime.notifyAnimationComplete(parentId, true);
      }
    },
    [parentId, runtime],
  );

  const onChangeHandler = React.useCallback(
    (index: number) => {
      if(typeof runtime?.notifyAnimationComplete === 'function') {
        runtime.notifyAnimationComplete(parentId, false);
      }
      if(index === -1) {
        nav.prev();
        return;
      }
      const percent = normalizedSnapPoints.length > 1
        ? index / (normalizedSnapPoints.length - 1)
        : 1;
      runtime.onDragUpdate(parentId, percent);
    },
    [parentId, runtime, normalizedSnapPoints, nav],
  );

  const handlePresent = React.useCallback(() => {
    try {
      ref.current?.present?.();
    } catch(err) { }
  }, []);

  React.useEffect(() => {
    handlePresent();
  }, [handlePresent]);

  const renderBackdrop = React.useCallback(
    (props: any) => {
      if(snapPoints.some(s => String(s).includes('100%'))) {
        return (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior={dismissable ? 'close' : 'none'}
            opacity={backdrop === false ? 0 : 0.5}
          />
        );
      }
      return null;
    },
    [snapPoints, dismissable, backdrop],
  );

  const page = (
    <View style={{flex: 1}}>
      {!noTitle && (
        <View
          style={[styles.header, {backgroundColor: background || '#fff'}]}
        >
          {dismissable && (
            <View style={styles.headerRight}>
              <TouchableRipple onPress={() => nav.close()}>
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
        <FlowProvider parentId={parentId} childId={childId} flowId={parentId}>
          <FlowChildWrapper
            flow={{
              api: runtime,
              parentId,
              childId,
              flags: runtime.getFlags(parentId),
            }}
          >
            <FlowErrorBoundary>
              {content}
            </FlowErrorBoundary>
          </FlowChildWrapper>
        </FlowProvider>
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
      backgroundStyle={{
        backgroundColor: background || '#fff',
        ...(withShadow && {
          shadowColor: "#000",
          shadowOffset: {width: 0, height: -2},
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        })
      }}
      handleComponent={draggable ? undefined : null}
      enablePanDownToClose={dismissable}
      backdropComponent={renderBackdrop}
      onDismiss={() => nav.prev()}
    >
      <View style={styles.bsContent}>{page}</View>
    </BottomSheetModal>
  );
});

/**
 * @component FlowNavigator
 * Recursive rendering engine + global modal manager.
 */
const FlowNavigator: React.FC<{children?: React.ReactNode;}> = ({children}) => {
  const runtime = useFlowRuntime();
  const [tick, setTick] = React.useState(0);

  // Force re-render on registry changes
  React.useEffect(() => {
    const unsub = flowRegistry.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);

  // 1. Initialization
  const allNodes = flowRegistry.getAllNodes();
  const packs = allNodes.filter(n => n.type === 'pack');
  let activeRootId = runtime.getActiveRoot();

  // Auto-init active root
  React.useEffect(() => {
    if(!activeRootId && packs.length > 0) {
      const firstPack = packs[0];
      if(__DEV__) console.log(`[FlowNavigator] Auto-initializing active root to: ${firstPack.id}`);
      runtime.switchRoot(firstPack.id);
    }
  }, [activeRootId, packs.length, runtime]);

  // 2. Recursive Rendering Function
  const renderFlow = (nodeId: string): React.ReactNode => {
    const node = flowRegistry.getNode(nodeId);
    if(!node) return null;

    // --- LEAF NODE (Child/Page) ---
    if(node.type === 'child') {
      // It's a leaf Page. Render it wrapped in FullScreenPageWrapper.
      // We assume the parent is a standard parent logic-wise if it got here.
      // BUT `FullScreenPageWrapper` uses `useFlowNav(parentId)`.
      // `node.parentId` should be valid.

      const theme = flowRegistry.getNode(node.parentId!)?.props?.theme || 'light';
      const background = theme === 'dark' ? '#1a1a1a' : '#ffffff';

      return (
        <FullScreenPageWrapper
          key={node.id}
          parentId={node.parentId!}
          childId={node.id}
          content={node.props?.page ?? null}
          background={background}
          tick={tick}
        />
      );
    }

    // --- CONTAINER NODE (Pack/Parent) ---

    // 1. Get the ACTIVE child of this container
    const activeNode = runtime.getActive(nodeId);
    if(!activeNode) {
      // No active child? Nothing to render for this container.
      return null;
    }

    // 2. Recursively render the active child content
    const childContent = renderFlow(activeNode.id);

    // 3. Wrap the content based on THIS node's type/config
    if(node.type === 'pack' && node.props.type === 'tab') {
      // It's a Pack acting as a Tab Navigator
      return (
        <FlowTabWrapper
          key={node.id}
          parentId={node.id}
          activeChildId={activeNode.id}
          tabStyle={node.props.tabStyle}
          iconStyle={node.props.iconStyle}
          children={childContent} // recursive content
          tick={tick}
        />
      );
    }

    // Default: Just return the content (Pass-through for standard Packs and Parents)
    // (Standard properties like `theme` are handled at the leaf or passed down, 
    // but here we primarily handle layout wrapping like Tabs)
    return childContent;
  };

  // 3. Render Root
  // We start from the active Root Pack.
  let rootContent: React.ReactNode = null;
  if(activeRootId) {
    rootContent = renderFlow(activeRootId);
  }

  // 4. Global Modal Scanning
  // Scan all active nodes to see if any are Modals.
  // We need to traverse the active tree or just scan all nodes?
  // Scanning all nodes is safer to catch any active modal.
  const allActiveIds = new Set<string>();

  // Helper to collect active path
  const collectActive = (id: string) => {
    allActiveIds.add(id);
    const activeDiv = runtime.getActive(id);
    if(activeDiv) collectActive(activeDiv.id);
  };
  if(activeRootId) collectActive(activeRootId);

  // Find active modal children
  // A modal is a child node whose parent is a 'modal' typed Parent 
  // OR a child node that has `modal=true` prop.
  const modals: React.ReactNode[] = [];

  // Iterate all "active" nodes (or just all nodes and check if they are active in their parent?)
  // Actually, for a modal to be visible, it must be the ACTIVE child of its parent.
  // So we filter `allNodes` for active children.

  const activeChildren = allNodes.filter(n => {
    if(n.type !== 'child') return false;
    const parent = flowRegistry.getNode(n.parentId!);
    if(!parent) return false;
    return runtime.getActive(parent.id)?.id === n.id;
  });

  activeChildren.forEach(childNode => {
    const parent = flowRegistry.getNode(childNode.parentId!);
    const isModal = parent?.type === 'modal' || childNode.props.modal;
    if(!isModal) return;

    // It's an active modal!
    // Render it via ModalBottomSheetWrapper
    const childProps = childNode.props || {};
    const size = childProps.size || 'half';
    const snapPoints = sizeToSnapPoints(size);
    const draggable = !!childProps.draggable;
    const dismissable = childProps.dismissable !== false;
    const theme = parent?.props?.theme || 'light';
    const background = theme === 'dark' ? '#1a1a1a' : '#ffffff';

    // Determine if we need a background page
    const backgroundPageId = parent?.props?.backgroundPage || childProps.backgroundPage;
    let backgroundElement = null;
    if(backgroundPageId) {
      const bgNode = flowRegistry.getNode(backgroundPageId);
      // Render bgNode (as a page)
      if(bgNode && bgNode.props.page) {
        // We reuse FullScreenPageWrapper? Or just raw content?
        // Use wrapper for consistency?
        backgroundElement = (
          <View style={StyleSheet.absoluteFill} key={`bg_${backgroundPageId}`}>
            <FullScreenPageWrapper
              parentId={bgNode.parentId!}
              childId={bgNode.id}
              content={bgNode.props.page}
              background={background}
              tick={tick}
            />
          </View>
        );
      }
    }

    modals.push(
      <React.Fragment key={`modal_${childNode.id}`}>
        {backgroundElement}
        <ModalBottomSheetWrapper
          parentId={parent!.id}
          childId={childNode.id}
          snapPoints={snapPoints}
          draggable={draggable}
          dismissable={dismissable}
          background={background}
          content={childNode.props?.page ?? null}
          tick={tick}
        />
      </React.Fragment>
    );
  });

  // 5. Auto-Open Logic (Global)
  React.useEffect(() => {
    // Check all active parents for children with 'open=true'
    const activeParents = allNodes.filter(n => (n.type === 'pack' || n.type === 'page' || n.type === 'tab' || n.type === 'modal'));
    activeParents.forEach(parent => {
      // If parent is active in its own parent?
      // Recursively check if the parent is part of the active chain?
      // Check if parent ID is in `allActiveIds` (collected above)?
      // If we use `allActiveIds`:
      if(!allActiveIds.has(parent.id)) return;

      const children = flowRegistry.getChildren(parent.id);
      children.forEach(child => {
        if(child.props.open && runtime.getActive(parent.id)?.id !== child.id) {
          if(__DEV__) console.log(`[FlowNavigator] Auto-opening child: ${child.name}`);
          open(parent.id, child.name);
        }
      });
    });
  }, [tick, activeRootId]);


  return (
    <OverlayPortal>
      <BottomSheetModalProvider>
        {/* 0. Render Configuration Tree (Hidden) */}
        <View style={{display: 'none'}}>
          {children}
        </View>

        {/* 1. Render Root Content */}
        {rootContent}

        {/* 2. Render Modals */}
        {modals}

        {/* 3. Empty State */}
        {!rootContent && !activeRootId && (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator size="large" />
            <Text style={{marginTop: 10, color: '#666'}}>Initializing Flow...</Text>
          </View>
        )}
      </BottomSheetModalProvider>
    </OverlayPortal>
  );
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
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e3e3e3',
    backgroundColor: 'transparent',
    marginTop: 35,
  },
  headerLeft: {width: 48, alignItems: 'flex-start', justifyContent: 'center'},
  headerCenter: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  headerRight: {width: 72, alignItems: 'flex-start', justifyContent: 'center'},
  headerTitle: {fontSize: 18, fontWeight: '600'},
  headerAction: {
    padding: 8,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
  },
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: theme.colors.red,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
