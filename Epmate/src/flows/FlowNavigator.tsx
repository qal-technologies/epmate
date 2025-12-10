import React from 'react';
import {View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity, TextInput, StatusBar} from 'react-native';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {useFlowNav} from './hooks/useFlowNav';
import {open} from './core/FlowRuntime';
import {FlowProvider} from './core/FlowProvider';
import {useFlowBackHandler} from './core/FlowBackHandler';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
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
import {FlowDrawerWrapper} from './FlowDrawerWrapper';
import useFlowTheme from './hooks/useFlowTheme';
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
 * Renders a page with header and animations.
 * Reads all props from registry for single source of truth.
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

  // Get props from registry (single source of truth)
  const node = flowRegistry.getNode(childId);
  const childProps = node?.props || {};
  const {
    animationType,
    noHeader = false,
    canGoBack = true,
    activityIndicator,
    headerConfig = {},
    isRestrictedIn,
  } = childProps;

  //Auto-exit when current child becomes restricted
  React.useEffect(() => {
    if(isRestrictedIn) {
      if(__DEV__) console.log(`[Flow] Auto-exit: "${node?.name}" became restricted, navigating back`);
      nav.prev();
    }
  }, [isRestrictedIn, nav, node?.name]);

  // Get title from registry - prioritize child's title, then name
  const displayTitle = flowRegistry.getActiveChildTitle(node?.parentId as any) || node?.props?.title || node?.name || '';

  // Get theme from registry for reactive colors
  const parentNode = flowRegistry.getNode(node?.parentId || parentId);
  const flowTheme = parentNode?.props?.theme || node?.props?.theme || useFlowTheme().deviceTheme || 'light';
  const themeColors = flowTheme === 'dark'
    ? {bg: '#1a1a1a', text: '#ffffff', icon: '#cccccc'}
    : {bg: '#ffffff', text: '#000000', icon: '#333333'};


  // consolidate noHeader
  const isNoHeader = noHeader;

  const {
    titlePosition = 'center',
    headerStyle,
    noBackBtn,
    headerRight,
    headerBottom,
    transparent
  } = headerConfig;

  const opacity = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Animation guard - only animate on first mount, not on state changes
  const hasAnimated = React.useRef(false);
  const prevChildId = React.useRef(childId);

  // Animation timing config for natural movement
  const animConfig = {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  };

  React.useEffect(() => {
    // Only animate if child changed or first mount
    const shouldAnimate = !hasAnimated.current || prevChildId.current !== childId;
    prevChildId.current = childId;

    if(!shouldAnimate) return;
    hasAnimated.current = true;

    if(typeof runtime?.notifyAnimationComplete === 'function') {
      runtime.notifyAnimationComplete(parentId, true);
    }

    // Set initial position based on animation type
    switch(animationType) {
      case 'slideBottom':
        translateY.value = SCREEN_HEIGHT;
        opacity.value = 1;
        break;
      case 'slideTop':
        translateY.value = -SCREEN_HEIGHT;
        opacity.value = 1;
        break;
      case 'slideLeft':
        translateX.value = -SCREEN_WIDTH;
        opacity.value = 1;
        break;
      case 'slideRight':
        translateX.value = SCREEN_WIDTH;
        opacity.value = 1;
        break;
      case 'zoom':
        scale.value = 0.3;
        opacity.value = 0;
        break;
      case 'fade':
        opacity.value = 0;
        break;
      case 'none':
        opacity.value = 1;
        return; // No animation
      default:
        opacity.value = 1;
        break;
    }

    // Animate to final position using timing (not spring)
    opacity.value = withTiming(1, animConfig);
    translateX.value = withTiming(0, animConfig);
    translateY.value = withTiming(0, animConfig);
    scale.value = withTiming(1, animConfig, () => {
      if(typeof runtime?.notifyAnimationComplete === 'function') {
        runtime.notifyAnimationComplete(parentId, false);
      }
    });
  }, [childId, parentId, runtime, animationType]);

  React.useEffect(() => {
    if(node?.props?.hideTab == true) {
      nav.closeTab();
    } else {
      nav.openTab();
    }
  }, [node?.props?.hideTab]);

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

  // Check if parent is a tab or drawer navigation - those children don't show back button
  const parentIsTabOrDrawer = parentNode?.props?.navType === 'tab' || parentNode?.props?.navType === 'drawer';

  const showBack = canGoBack && !isFirstChild && !noBackBtn && !parentIsTabOrDrawer;

  const page = (
    <FlowProvider parentId={parentId} childId={childId} flowId={parentId}>
      <StatusBar animated barStyle={flowTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg || 'transparent'} />
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

  const finalHeaderStyle = [
    styles.header,
    transparent && {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'transparent', borderBottomWidth: 0, marginTop: 35},
    !transparent && {backgroundColor: background || themeColors.bg},
  ] as any;

  const headerContent = (
    <View style={[finalHeaderStyle, headerStyle && {...headerStyle}, {flexDirection: 'column', alignItems: 'center', paddingBottom: 5}]}>
      <View style={[{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}, headerBottom && {paddingTop: 30}]}>
        {/* LEFT */}
        <View style={[styles.headerLeft, {flex: titlePosition === 'left' ? 0 : 1, alignItems: 'flex-start', }]}>
          {showBack && (
            <TouchableRipple onPress={() => nav.prev()}>
              <View style={styles.headerAction}>
                <MaterialIcons
                  name="arrow-back"
                  color={themeColors.icon}
                  size={18}
                />
              </View>
            </TouchableRipple>
          )}
        </View>

        {/* CENTER */}
        <View style={[styles.headerCenter, {
          flex: 2,
          alignItems: titlePosition === 'left' ? 'flex-start' : (titlePosition === 'right' ? 'flex-end' : 'center'),
          paddingLeft: titlePosition === 'left' ? 10 : 0,
          paddingBottom: headerBottom ? 5 : 0,
        }]}>
          <Text numberOfLines={1} style={[styles.headerTitle, {color: themeColors.text}]}>
            {displayTitle}
          </Text>
        </View>

        {/* RIGHT */}
        <View style={[styles.headerRight, {flex: 1, alignItems: 'flex-end'}]}>
          {headerRight}
        </View>
      </View>

      {/* BOTTOM */}
      {headerBottom && <View style={{width: '100%'}}>{headerBottom}</View>}
    </View>
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
      {!isNoHeader && headerContent}

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
    noHeader = false,
    topElement,
    activityIndicator,
    backdrop,
    withShadow,
    headerConfig,
    isRestrictedIn,
  } = childProps;

  //Auto-exit when current child becomes restricted
  React.useEffect(() => {
    if(isRestrictedIn) {
      if(__DEV__) console.log(`[Flow] Auto-exit: "${node?.name}" became restricted, navigating back`);
      nav.prev();
    }
  }, [isRestrictedIn, nav, node?.name]);


  // Get theme from registry for reactive colors
  const parentNode = flowRegistry.getNode(node?.parentId || parentId);
  const flowTheme = parentNode?.props?.theme || node?.props?.theme || 'light';
  const themeColors = flowTheme === 'dark'
    ? {bg: '#1a1a1a', text: '#ffffff', icon: '#cccccc'}
    : {bg: '#ffffff', text: '#000000', icon: '#333333'};

  // Extract headerConfig options
  const {
    titlePosition = 'center',
    headerStyle,
    noBackBtn = false,
    headerRight: customHeaderRight,
    headerBottom,
    transparent = false,
  } = headerConfig || {};

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

  React.useEffect(() => {
    if(node?.props?.hideTab == true) {
      nav.closeTab();
    } else {
      nav.openTab();
    }
  }, [node?.props?.hideTab]);

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
      <StatusBar animated barStyle={flowTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg || 'transparent'} />
      {!noHeader && (
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

  // Track which children have been auto-opened (if=true or open=true)
  // This prevents infinite loops - each child only auto-opens ONCE
  const autoOpenedRef = React.useRef<Set<string>>(new Set());

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

  // 2. Recursive Rendering Function - handles packs, parents, and children (unlimited nesting)
  const renderFlow = (nodeId: string, depth: number = 0): React.ReactNode => {
    const node = flowRegistry.getNode(nodeId);
    if(!node) return null;

    // --- LEAF NODE (Child/FC) ---
    if(node.type === 'child') {
      // Check if this child's content is a nested Parent
      const pageContent = node.props?.page;

      // Check if the page content contains a Flow.Parent
      // by checking if it's a React element with type that has a displayName
      const isNestedContainer =
        pageContent &&
        React.isValidElement(pageContent) &&
        (pageContent.type as any)?.displayName?.includes('Flow');

      const background = (flowRegistry.getNode(node.parentId!)?.props?.theme || 'light') === 'dark' ? '#1a1a1a' : '#ffffff';

      return (
        <FullScreenPageWrapper
          key={node.id}
          parentId={node.parentId!}
          childId={node.id}
          content={pageContent ?? null}
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

    // 2. Recursively render the active child content (supports unlimited depth)
    const childContent = renderFlow(activeNode.id, depth + 1);

    // 3. Check for navType (tab/drawer) - works on Pack AND Parent/FC
    const childrenNodes = flowRegistry.getChildren(nodeId);
    const navType = node.props?.navType ;

    // Tab/Drawer requires at least 2 children, else fall back to stack
    if(navType && childrenNodes.length >= 2) {
      if(navType === 'tab') {
        return (
          <FlowTabWrapper
            key={node.id}
            parentId={node.id}
            activeChildId={activeNode.id}
            tabStyle={node.props?.tabStyle}
            iconStyle={node.props?.iconStyle}
            children={childContent}
            tick={tick}
          />
        );
      }
      if(navType === 'drawer') {
        return (
          <FlowDrawerWrapper
            key={node.id}
            parentId={node.id}
            activeChildId={activeNode.id}
            drawerStyle={node.props?.drawerStyle}
            children={childContent}
            tick={tick}
          />
        );
      }
    }

    // Handle Pack without navType (just a container)
    if(node.type === 'pack') {
      return (
        <View key={node.id} style={{flex: 1}}>
          {childContent}
        </View>
      );
    }

    // Handle Parent (page type) - supports unlimited nesting
    if(node.type === 'page') {
      return (
        <View key={node.id} style={{flex: 1}}>
          {childContent}
        </View>
      );
    }

    // Default: Just return the content (Pass-through)
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

  // 5. Auto-Open Logic (Global & Pack Initialization)
  React.useEffect(() => {

    const nodesAndParents = flowRegistry.getAllNodes();

    nodesAndParents.forEach((node) => {
      // --- Case A: Pack Initialization ---
      const activeChild = runtime.getActive(node.id);

      // Only init if:
      // 1. It has an 'initial' prop
      // 2. It has NO active child currently
      // 3. It is part of the active hierarchy (activeRoot or child of active parent)
      const isActiveOrRoot = node.id === activeRootId || runtime.getActive(node.parentId!)?.id === node.id;

      if(!activeChild && node.props?.initial && isActiveOrRoot) {
        // Double check it has children
        const children = flowRegistry.getChildren(node.id);
        if(children.length > 0) {
          // Verify the initial child exists
          // Using open() handles retrieval
          if(__DEV__) console.log(`[FlowNavigator] Auto-initializing Pack '${node.id}' to '${node.props.initial}'`);
          open(node.id, node.props.initial).catch(() => { });
        }
      }

      // --- Case B: autoOpen / open=true Logic ---
      // Check children of this node for auto-open candidates

      if(!isActiveOrRoot) return;

      const children = flowRegistry.getChildren(node.id);

      // First pass: Find children with if=true that should auto-open (ONLY ONCE)
      for(const child of children) {
        if(child.id === activeChild?.id) continue;

        // Skip if already auto-opened (prevents infinite loop)
        if(autoOpenedRef.current.has(child.id)) continue;

        const ifCondition = child.props?.if;
        const openProp = child.props?.open;

        // If 'if' is explicitly true, auto-open this child immediately (ONCE)
        if(ifCondition === true && openProp !== false) {
          if(__DEV__) console.log(`[FlowNavigator] Auto-opening child (once): ${child.name} (if=true)`);
          autoOpenedRef.current.add(child.id); // Mark as opened
          open(node.id, child.name).catch(() => { });
          return; // Exit after opening one
        }
      }

      // Second pass: Check open=true candidates (only if no if=true was found)
      const candidates = children.filter(c => c.props?.open === true);

      for(const child of candidates) {
        if(child.id === activeChild?.id) continue;

        // Skip if already auto-opened
        if(autoOpenedRef.current.has(child.id)) continue;

        const ifCondition = child.props?.if;

        // Skip if 'if' is explicitly false
        if(ifCondition === false) continue;

        // Open if 'open=true' and 'if' is not false (undefined or true)
        if(__DEV__) console.log(`[FlowNavigator] Auto-opening child (once): ${child.name} (open=true)`);
        autoOpenedRef.current.add(child.id); // Mark as opened
        open(node.id, child.name).catch(() => { });
        break; // Only open one
      }
    });

  }, [tick, activeRootId, runtime]);



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
    height: 'auto',
    minHeight: 56,
    paddingHorizontal: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e3e3e3',
    backgroundColor: 'transparent',
    marginTop: 40,
  },
  headerLeft: {width: 'auto', alignItems: 'flex-end', justifyContent: 'center'},
  headerCenter: {alignItems: 'center', justifyContent: 'center'},
  headerRight: {width: 45, alignItems: 'flex-start', justifyContent: 'center'},
  headerTitle: {fontSize: 22, fontWeight: '800', textAlign: 'center'},
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
