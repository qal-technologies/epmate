import { ViewStyle, TextStyle } from 'react-native';

/**
 * @category Core
 * @description Defines the fundamental type of a flow container.
 * - `modal`: A flow that appears as an overlay (e.g., bottom sheet, centered modal).
 * - `page`: A flow that takes up the full screen or a specific container area.
 */
export type FlowType = 'modal' | 'page';

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
 * @property slideBottom - Slide in from the bottom.
 * @property slideTop - Slide in from the top.
 * @property slideLeft - Slide in from the left.
 * @property slideRight - Slide in from the right.
 * @property fade - Fade in opacity.
 * @property zoom - Zoom in from a smaller scale.
 * @property none - No animation, instant transition.
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
 * @property {'parent' | 'self' | 'element' | ((ctx: any) => any)} endWith - The action to take:
 *   - `parent`: Navigate to the next step in the parent flow.
 *   - `self`: Reset the current flow to its initial state.
 *   - `element`: Navigate to a specific flow element (by ID).
 *   - `function`: Execute a custom callback function.
 * @property {string} [element] - The target element ID to navigate to (required if `endWith` is 'element').
 * @property {boolean} [cleanUp] - If true, unregisters the flow and clears its state from memory.
 * @property {boolean} [resetState] - If true, resets the flow's internal state (values) but keeps the flow registered.
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
 * @description Base properties shared by all Flow Parent components.
 */
export interface FlowBaseProps {
  /** 
   * Unique identifier for this flow. 
   * Used for registration, navigation, and state scoping.
   */
  name: string;
  
  /** 
   * The type of flow container.
   * Defaults to 'page'.
   */
  type?: FlowType;
  
  /** 
   * The child components of this flow. 
   * These should typically be `Flow.FC` components.
   */
  children?: React.ReactNode;
  
  /** 
   * The name of the child to display initially. 
   * If not provided, the first child is used.
   */
  initial?: string;
  
  /** 
   * Configuration for end-of-flow behavior.
   */
  atEnd?: AtEndConfig;
  
  /** 
   * If true, prevents the user from navigating out of this flow via standard back actions.
   */
  isRestrictedOut?: boolean;
  
  /** 
   * If true, prevents navigation into this flow from other flows (unless explicitly targeted).
   */
  isRestrictedIn?: boolean;
  
  /** 
   * Timeout in milliseconds for lifecycle hooks (e.g., `onOpen`, `onClose`) to complete.
   */
  lifecycleTimeoutMs?: number;
  
  /** 
   * The visual theme for this flow.
   */
  theme?: FlowThemeType;
  
  /** 
   * If true, all children of this flow share the same state scope.
   * If false, each child has its own isolated state.
   */
  shareState?: boolean;
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
}

/**
 * @category Props
 * @description Base properties for any child component (Screen/Step) within a flow.
 * @template T - The type of the `extras` data.
 */
export interface FlowChildBaseProps<T = Record<string, any>> {
  /** 
   * Unique identifier for this child step.
   */
  name: string;
  
  /** 
   * The React component to render for this step.
   */
  page: React.ReactNode;
  
  /** 
   * The title to display in the header for this step.
   * If not provided, `name` is used.
   */
  title?: string;
  
  /** 
   * If true, the header (including title and back button) is hidden for this step.
   */
  noTitle?: boolean;
  
  /** 
   * The animation to use when entering this step.
   * Default is 'fade'.
   */
  animationType?: AnimationType;
  
  /** 
   * If false, prevents the user from switching away from this step.
   * Useful for mandatory steps or loading states.
   */
  shouldSwitch?: boolean;
  
  /** 
   * Lifecycle hook called before this step opens.
   * Return `false` to prevent opening.
   */
  onOpen?: (ctx: { from: string; opener?: string }) => Promise<boolean> | boolean;
  
  /** 
   * Lifecycle hook called when attempting to switch away from this step.
   * Return `false` to prevent switching.
   */
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  
  /** 
   * Lifecycle hook called after this step has closed.
   */
  onClose?: () => void;
  
  /** 
   * Arbitrary extra data associated with this step.
   */
  extras?: T;
  
  /** 
   * Custom background color for this step.
   */
  background?: string;
  
  /** 
   * Custom activity indicator component to show during transitions.
   */
  activityIndicator?: React.ReactElement;
  
  /** 
   * A component to render at the top of the content area (e.g., a progress bar).
   */
  topElement?: React.ReactNode;
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
   */
  category?: string;
  
  /**
   * If provided, the state is encrypted using this key before storage.
   */
  secureKey?: string;
  
  /**
   * If true, the state is marked as temporary and will be cleared automatically
   * on the next navigation action.
   */
  temporary?: boolean;
  
  /**
   * If provided, limits the visibility of this state to specific child IDs.
   * Use 'hide' to explicitly hide it from the listed children (implementation dependent).
   */
  scope?: string[];

  /**
   * If true, the state is stored in a shared global scope.
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
