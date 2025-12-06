import { ViewStyle, TextStyle } from 'react-native';

/**
 * @category Core
 * @description Defines the fundamental type of a flow container.
 * - `modal`: A flow that appears as an overlay (e.g., bottom sheet, centered modal).
 * - `page`: A flow that takes up the full screen or a specific container area.
 * - `pack`: A container that groups multiple parents together.
 * - `tab`: A flow that organizes children into tabs.
 */
export type FlowType = 'modal' | 'page' | 'pack' | 'child' | 'tab';

/**
 * @category Core
 * @description Theme options for flow components, affecting background colors and text styles.
 */
export type FlowThemeType = 'light' | 'dark';

/**
 * @category Core
 * @description Defines the size of a modal flow.
 * - `full`: Takes up the entire screen height.
 * - `half`: Takes up approximately 50% of the screen height.
 * - `bottom`: Takes up a smaller portion at the bottom (e.g., 30%).
 */
export type SizeType = 'full' | 'half' | 'bottom';

/**
 * @category Core
 * @description Defines the type of animation used when transitioning between flow steps.
 * 
 * **Values:**
 * - `'slideBottom'`: Slide in from the bottom (default for modals).
 * - `'slideTop'`: Slide in from the top.
 * - `'slideLeft'`: Slide in from the left.
 * - `'slideRight'`: Slide in from the right (default for pages).
 * - `'fade'`: Cross-dissolve opacity.
 * - `'zoom'`: Scale up from center.
 * - `'none'`: Instant switch without animation.
 */
export type AnimationType = 
  | 'slideBottom' 
  | 'slideTop' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'fade' 
  | 'zoom' 
  | 'none';


/**
 * @category Configuration
 * @description Configuration for the behavior when a flow reaches its end (e.g., after the last step).
 * 
 * **Options:**
 * - `endWith`: The action to take.
 *   - `'parent'`: Navigate to the next step in the parent flow.
 *   - `'self'`: Reset the current flow to its initial state.
 *   - `'element'`: Navigate to a specific flow element (requires `element` ID).
 *   - `function`: Custom callback `(ctx) => void`.
 * - `element`: Target ID (only for `endWith: 'element'`).
 * - `cleanUp`: Unregister the flow and clear memory (default: false).
 * - `resetState`: Clear internal state values (default: false).
 * 
 * @example
 * ```tsx
 * // Navigate to parent's next step and cleanup
 * atEnd={{ endWith: 'parent', cleanUp: true }}
 * 
 * // Reset self to start
 * atEnd={{ endWith: 'self' }}
 * ```
 */
export type AtEndConfig =
  | {
      endWith: 'parent' | 'self' | 'element' | ((ctx: any) => any);
      element?: string;
      cleanUp?: boolean;
      resetState?: boolean;
    }
  | undefined;


/**
 * @category Props
 * @description Base properties shared by all Flow Parent components (Page, Modal, Pack).
 * 
 * @example
 * ```tsx
 * <Flow.Parent name="Home" initial="Dashboard">
 *   <Flow.FC name="Dashboard" page={<Dashboard />} />
 * </Flow.Parent>
 * ```
 */
export interface FlowBaseProps {
  /** 
   * Unique identifier for this flow. 
   * Used for registration, navigation, and state scoping.
   * **Must be unique** within its parent container.
   */
  name: string;
  
  /** 
   * The type of flow container.
   * - `'page'`: Standard screen navigation (default).
   * - `'modal'`: Overlay navigation.
   * - `'pack'`: Grouping of multiple flows.
   */
  type?: FlowType;
  
  /** 
   * The child components of this flow. 
   * These should typically be `Flow.FC` components.
   */
  children?: React.ReactNode;
  
  /** 
   * The name of the child to display initially when this flow opens.
   * If not provided, the first declared child is used.
   */
  initial?: string;
  
  /** 
   * Configuration for end-of-flow behavior (e.g., when `next()` is called on the last step).
   * @see AtEndConfig
   */
  atEnd?: AtEndConfig;
  
  /** 
   * If `true`, prevents the user from navigating out of this flow via standard back actions 
   * (hardware back button or header back).
   * 
   * **Use Case:** Mandatory flows like onboarding, login, or critical forms.
   */
  isRestrictedOut?: boolean;
  
  /** 
   * If `true`, prevents navigation into this flow from other flows unless explicitly targeted by ID.
   * Useful for private or internal sub-flows.
   */
  isRestrictedIn?: boolean;
  
  /** 
   * Timeout in milliseconds for lifecycle hooks (e.g., `onOpen`, `onClose`) to complete.
   * Defaults to `8000ms`.
   */
  lifecycleTimeoutMs?: number;
  
  /** 
   * The visual theme for this flow.
   * - `'light'`: Light background, dark text.
   * - `'dark'`: Dark background, light text.
   */
  theme?: FlowThemeType;
  
  /** 
   * If `true`, all children of this flow share the same state scope.
   * If `false` (default), each child has its own isolated state.
   */
  shareState?: boolean;

  /**
   * If `true`, hides the tab bar when this flow (or one of its children) is active.
   * Only applicable if this flow is a child of a Tab Pack.
   */
  hideTab?: boolean;
}

/**
 * @category Props
 * @description Properties specific to a Page-type flow.
 */
export interface FlowPageProps extends FlowBaseProps {
  /** 
   * If false, the default back button in the header will be hidden.
   * Default is `true`.
   */
  canGoBack?: boolean;
}

/**
 * @category Props
 * @description Properties specific to a Modal-type flow.
 */
export interface FlowModalProps extends FlowBaseProps {
  /** 
   * The initial size of the modal.
   * Default is 'half'.
   */
  size?: SizeType;
  
  /** 
   * If true, the modal can be dragged to resize or dismiss (depending on `dismissable`).
   */
  draggable?: boolean;
  
  /** 
   * If true, the modal can be dismissed by tapping the backdrop or dragging it down.
   */
  dismissable?: boolean;
  
  /** 
   * If true, the modal will cover the entire screen, including the status bar area.
   */
  coverScreen?: boolean;

  /**
   * If true, renders a backdrop behind the modal.
   * Default depends on the modal style.
   */
  backdrop?: boolean;

  /**
   * If provided, specific page ID to render behind this modal.
   */
  backgroundPage?: string;

  /**
   * If true, applies a shadow to the modal content.
   */
  withShadow?: boolean;
}

/**
 * @category Props
 * @description Properties specific to a Pack-type flow.
 * A Pack is a high-level container that groups multiple `Flow.Parent`s (e.g., Main, Auth, Onboarding).
 * 
 * @example
 * ```tsx
 * <Flow.Pack name="MainPack" initial="HomeFlow">
 *   <Flow.Parent name="HomeFlow">...</Flow.Parent>
 *   <Flow.Parent name="ProfileFlow">...</Flow.Parent>
 * </Flow.Pack>
 * ```
 */
export interface FlowPackProps extends FlowBaseProps {
  /**
   * The name of the initial parent flow to activate within this pack.
   * Must match the `name` prop of one of the direct children.
   */
  initial?: string;

  /**
   * Style configuration for the tab bar container.
   * Only applicable if `type='tab'`.
   */
  tabStyle?: FlowTabProps['tabStyle'];

  /**
   * Style configuration for the tab icons/labels.
   * Only applicable if `type='tab'`.
   */
  iconStyle?: FlowTabProps['iconStyle'];
}

/**
 * @category Props
 * @description Base properties for any child component (Screen/Step) within a flow.
 * These are typically passed to `Flow.FC`.
 * 
 * @template T - The type of the `extras` data.
 * 
 * @example
 * ```tsx
 * <Flow.FC 
 *   name="Step1" 
 *   page={<MyComponent />} 
 *   title="First Step"
 *   onOpen={() => console.log('Step 1 opened')}
 * />
 * ```
 */
export interface FlowChildBaseProps<T = Record<string, any>> {
  /** 
   * Unique identifier for this child step.
   * **Must be unique** within its parent flow.
   */
  name: string;
  
  /** 
   * The React component to render for this step.
   * This component will receive `parentId` and other context props.
   */
  page: React.ReactNode;
  
  /** 
   * The title to display in the header for this step.
   * If not provided, `name` is used as the title.
   */
  title?: string;
  
  /** 
   * If `true`, the header (including title and back button) is hidden for this step.
   * Useful for custom headers or full-screen content.
   */
  noTitle?: boolean;
  
  /** 
   * The animation to use when entering this step.
   * @see AnimationType
   * Default is `'fade'`.
   */
  animationType?: AnimationType;
  
  /** 
   * If `false`, prevents the user from switching away from this step (e.g., via `next()` or `prev()`).
   * Useful for mandatory steps, loading states, or validation blocking.
   */
  shouldSwitch?: boolean;
  
  /** 
   * Lifecycle hook called before this step opens.
   * 
   * @param {object} ctx - Context object.
   * @param {string} ctx.from - The ID of the flow we are coming from.
   * @param {string} [ctx.opener] - The ID of the component that triggered the open.
   * @returns {boolean | Promise<boolean>} Return `false` to prevent opening.
   */
  onOpen?: (ctx: { from: string; opener?: string }) => Promise<boolean> | boolean;
  
  /** 
   * Lifecycle hook called when attempting to switch away from this step.
   * 
   * @param {'forward' | 'backward'} dir - Direction of switch.
   * @returns {boolean | Promise<boolean>} Return `false` to prevent switching.
   */
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  
  /** 
   * Lifecycle hook called after this step has closed.
   */
  onClose?: () => void;
  
  /** 
   * Arbitrary extra data associated with this step.
   * Can be accessed via `flowRegistry.getNode(id).props.extras`.
   */
  extras?: T;
  
  /** 
   * Custom background color for this step.
   * Overrides the theme background.
   */
  background?: string;
  
  /** 
   * Custom activity indicator component to show during transitions (e.g., while `onOpen` is resolving).
   */
  activityIndicator?: React.ReactElement;
  
  /** 
   * A component to render at the top of the content area (e.g., a progress bar).
   * Renders below the header but above the `page` content.
   */
  topElement?: React.ReactNode;

  /**
   * If true, this step is treated as a modal (overlay).
   * Useful when a single step in a pack needs to be an overlay.
   */
  modal?: boolean;

  /**
   * If true, this step should be automatically opened if possible.
   * (Note: Logic handled by Runtime/Navigator).
   */
  open?: boolean;
}

/**
 * @category Props
 * @description Properties for a child step within a Page flow.
 */
export interface FlowPageChildProps<T = Record<string, any>> extends FlowChildBaseProps<T> {
  /** 
   * If false, the back button is hidden specifically for this step.
   * Overrides the parent's `canGoBack` setting.
   */
  canGoBack?: boolean;
}

/**
 * @category Props
 * @description Properties for a child step within a Modal flow.
 */
export interface FlowModalChildProps<T = Record<string, any>> extends FlowChildBaseProps<T> {
  /** 
   * Overrides the parent's size for this specific step.
   */
  size?: SizeType;
  
  /** 
   * If true, this step allows dragging.
   */
  draggable?: boolean;
  
  /** 
   * If true, this step allows dismissal.
   */
  dismissable?: boolean;
  
  /** 
   * If true, this step covers the full screen.
   */
  coverScreen?: boolean;
  
  /** 
   * Callback triggered when the modal is dragged.
   * @param position - The current drag position (0 to 1).
   */
  onDrag?: (position: number) => void;

  /**
   * If true, renders a backdrop behind the modal step.
   */
  backdrop?: boolean;

  /**
   * If true, applies a shadow to the modal step.
   */
  withShadow?: boolean;
}

/**
 * @category Props
 * @description Properties specific to a Tab-type flow.
 */
export interface FlowTabProps extends FlowBaseProps {
  /**
   * Style configuration for the tab bar container.
   */
  tabStyle?: {
    /** Position of the tab bar. Default: 'bottom' */
    position?: 'top' | 'bottom' | 'left' | 'right';
    /** If true, hides the tab bar on scroll. Default: false */
    hideOnScroll?: boolean;
    /** Background color of the tab bar. */
    bgColor?: string;
    /** Extra space at the bottom (for safe area). */
    spaceBottom?: number;
    /** Extra space at the top. */
    spaceTop?: number;
    /** If true, applies a shadow to the tab bar. */
    withShadow?: boolean;
    /** If true, applies a backdrop blur effect. */
    backdropBlur?: boolean;
    /** Opacity of the tab bar background. */
    opacity?: number;
    /** Border radius style. */
    borderRadius?: 'curved' | 'curvedTop' | 'curvedBottom' | 'default';
    /** Width strategy. */
    width?: 'full' | 'endSpace';
  };

  /**
   * Style configuration for the tab icons/labels.
   */
  iconStyle?: {
    /** Color of inactive icons. */
    iconColor?: string;
    /** Color of active icons. */
    activeColor?: string;
    /** If true, displays text labels. */
    withText?: boolean;
    /** Color of text labels. */
    textColor?: string;
    /** Size of text labels. */
    textSize?: number;
    /** Size of icons. */
    iconSize?: number;
  };
}

/**
 * @category Props
 * @description Generic props for a Flow Child, used when the specific parent type is not strictly enforced.
 */
export type FlowChildProps<T = Record<string, any>> = FlowChildBaseProps<T>;

/**
 * @category Configuration
 * @description Options object for creating a new flow instance via `Flow.create()`.
 */
export type FlowCreateOptions = {
  shareState?: boolean;
  isRestrictedIn?: boolean;
  isRestrictedOut?: boolean;
  theme?: string;
  lifecycleTimeoutMs?: number;
  atEnd?: AtEndConfig;
  params?: Record<string, any>;
};

/**
 * @category Styling
 * @description Defines the customizable style properties for a flow theme.
 * @property {ViewStyle} [container] - Style for the main container.
 * @property {ViewStyle} [header] - Style for the navigation header.
 * @property {TextStyle} [title] - Style for the header title text.
 * @property {ViewStyle} [closeButton] - Style for the close/dismiss button.
 * @property {ViewStyle} [backButton] - Style for the back navigation button.
 * @property {ViewStyle} [content] - Style for the main content area.
 * @property {ViewStyle} [overlay] - Style for the modal overlay/backdrop.
 */
export type FlowTheme = {
  container?: ViewStyle;
  header?: ViewStyle;
  title?: TextStyle;
  closeButton?: ViewStyle;
  backButton?: ViewStyle;
  content?: ViewStyle;
  overlay?: ViewStyle;
};

/**
 * @category State
 * @description Represents a single value stored in the flow state.
 * Can be any type.
 */
export type FlowStateValue = any;

/**
 * @category State
 * @description Options for the `set` state operation.
 */
export type SetStateOptions = {
  /**
   * If provided, the state is stored under this specific category (namespace).
   * Useful for grouping related data (e.g., 'formData', 'settings').
   */
  category?: string;
  
  /**
   * If provided, the state is encrypted using this key before storage.
   * (Mock implementation in current version).
   */
  secureKey?: string;
  
  /**
   * If `true`, the state is marked as temporary and will be cleared automatically
   * on the next navigation action.
   */
  temporary?: boolean;
  
  /**
   * If provided, limits the visibility of this state to specific child IDs.
   * Only the listed children will be able to access this state.
   */
  scope?: string[];

  /**
   * If `true`, the state is stored in a shared global scope, accessible by any flow
   * that opts into the global scope.
   */
  shared?: boolean;
};

/**
 * @category State
 * @description The internal structure of the Flow State object.
 */
export type FlowState = {
  /** Standard key-value pairs */
  [key: string]: FlowStateValue;
  
  /** Categorized state storage */
  __categories?: { [category: string]: { [key: string]: FlowStateValue } };
  
  /** Securely stored state (mocked in this implementation) */
  __secure?: { [key: string]: { value: string; iv?: string } };
  
  /** Temporary state that expires on navigation */
  __temp?: { [key: string]: boolean };
  
  /** Scoped state visibility rules */
  __scoped?: { [key: string]: string[] };

  /** Shared global state */
  __shared?: { [key: string]: FlowStateValue };
};

/**
 * @type RegistrationState
 * @description Tracks the registration lifecycle of a node
 */
export type RegistrationState = 'pending' | 'registered' | 'active' | 'unmounting';

/**
 * @interface FlowNode
 * @description Represents a registered node in the flow tree.
 */
export interface FlowNode {
  id: string;
  name: string;
  type: FlowType;
  parentId: string | null;
  children: string[];
  props: any;

  // runtime states
  isMounted: boolean;
  activeIndex: number;
  registrationState: RegistrationState;
  registeredAt: number;
}
