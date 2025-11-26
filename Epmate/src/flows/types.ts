import { ViewStyle, TextStyle } from 'react-native';

/**
 * @category Core
 * @description Defines the type of a flow, which can be a modal or a page.
 */
export type FlowType = 'modal' | 'page';

/**
 * @category Core
 * @description Theme options for flow components.
 */
export type FlowThemeType = 'light' | 'dark';

/**
 * @category Core
 * @description Defines the size of a flow, which can be 'full', 'half', or 'bottom'.
 */
export type SizeType = 'full' | 'half' | 'bottom';

/**
 * @category Core
 * @description Defines the type of animation for a flow transition.
 * @property slideBottom - Slide from bottom to top
 * @property slideTop - Slide from top to bottom
 * @property slideLeft - Slide from left to right
 * @property slideRight - Slide from right to left
 * @property fade - Fade in/out
 * @property zoom - Zoom in/out with scale
 * @property none - No animation
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
 * @description Configuration for what happens when a flow reaches its end.
 * @property {'parent' | 'self' | 'element' | ((ctx: any) => any)} endWith - The action to take at the end of the flow.
 *   - `parent`: Navigates to the next step in the parent flow.
 *   - `self`: Resets the current flow to its first child.
 *   - `element`: Navigates to a specific element (page/modal).
 *   - `function`: A custom function to execute.
 * @property {string} [element] - The target element ID to navigate to when `endWith` is 'element'.
 * @property {boolean} [cleanUp] - If true, unregisters the flow and cleans up its state upon completion.
 * @property {boolean} [resetState] - If true, resets the flow's state upon completion.
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
 * @description Base props for any flow parent.
 */
export interface FlowBaseProps {
  /** Unique name for the flow component */
  name: string;
  /** Child components */
  children?: React.ReactNode;
  /** Initial child to display (by name) */
  initial?: string;
  /** Configuration for what happens when flow reaches the end */
  atEnd?: AtEndConfig;
  /** If true, prevents navigation out of this flow */
  isRestrictedOut?: boolean;
  /** If true, prevents navigation into this flow */
  isRestrictedIn?: boolean;
  /** Timeout for lifecycle hooks in milliseconds */
  lifecycleTimeoutMs?: number;
  /** Theme for the flow */
  theme?: FlowThemeType;
  /** If true, state is shared between children */
  shareState?: boolean;
}

/**
 * @category Props
 * @description Props specific to a Page flow.
 */
export interface FlowPageProps extends FlowBaseProps {
  /** If false, removes back button (default: true) */
  canGoBack?: boolean;
}

/**
 * @category Props
 * @description Props specific to a Modal flow.
 */
export interface FlowModalProps extends FlowBaseProps {
  /** Size of the modal */
  size?: SizeType;
  /** If true, modal can be dragged */
  draggable?: boolean;
  /** If true, modal can be dismissed by tapping outside */
  dismissable?: boolean;
  /** If true, modal covers the entire screen */
  coverScreen?: boolean;
}

/**
 * @category Props
 * @description Base props for any child component.
 */
export interface FlowChildBaseProps<T = Record<string, any>> {
  /** Unique name for the child */
  name: string;
  /** The React component to render */
  page: React.ReactNode;
  /** Title to display in header */
  title?: string;
  /** If true, hides the title/header */
  noTitle?: boolean;
  /** Animation type for this child */
  animationType?: AnimationType;
  /** If false, prevents switching from this child */
  shouldSwitch?: boolean;
  /** Lifecycle hook called when child is opened */
  onOpen?: (ctx: { from: string; opener?: string }) => Promise<boolean> | boolean;
  /** Lifecycle hook called when switching away from this child */
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  /** Lifecycle hook called when child is closed */
  onClose?: () => void;
  /** Extra data to pass to the child component */
  extras?: T;
  /** Background color for the child */
  background?: string;
  /** Custom activity indicator component */
  activityIndicator?: React.ReactElement;
  /** Element to display at the top */
  topElement?: React.ReactNode;
}

/**
 * @category Props
 * @description Props for a child within a Page flow.
 */
export interface FlowPageChildProps<T = Record<string, any>> extends FlowChildBaseProps<T> {
  /** If false, removes back button for this child (default: true) */
  canGoBack?: boolean;
}

/**
 * @category Props
 * @description Props for a child within a Modal flow.
 */
export interface FlowModalChildProps<T = Record<string, any>> extends FlowChildBaseProps<T> {
  /** Size of the modal child */
  size?: SizeType;
  /** If true, modal child can be dragged */
  draggable?: boolean;
  /** If true, modal child can be dismissed */
  dismissable?: boolean;
  /** If true, modal child covers the entire screen */
  coverScreen?: boolean;
  /** Callback when modal is dragged */
  onDrag?: (position: number) => void;
}

/**
 * @category Props
 * @description Generic child props (for standalone Flow.FC)
 */
export type FlowChildProps<T = Record<string, any>> = FlowChildBaseProps<T>;

/**
 * @category Configuration
 * @description Options for creating a new flow.
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
 * @description Defines the styles for a flow theme.
 * @property {ViewStyle} [container] - Style for the main container of the flow component.
 * @property {ViewStyle} [header] - Style for the header section.
 * @property {TextStyle} [title] - Style for the title text in the header.
 * @property {ViewStyle} [closeButton] - Style for the close button.
 * @property {ViewStyle} [backButton] - Style for the back button.
 * @property {ViewStyle} [content] - Style for the content area where the `page` is rendered.
 * @property {ViewStyle} [overlay] - Style for the overlay, typically used with modals.
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
 * @description Represents a value stored in the flow state.
 */
export type FlowStateValue = any;

/**
 * @category State
 * @description Configuration for setting state with advanced options.
 */
export type SetStateOptions = {
  /**
   * If provided, the state is stored under this category.
   */
  category?: string;
  /**
   * If provided, the state is encrypted/secured with this key.
   */
  secureKey?: string;
  /**
   * If true, the state is temporary and will be cleared on the next navigation switch.
   */
  temporary?: boolean;
  /**
   * If provided, the state is only accessible to children with these IDs (or 'hide' to hide from them).
   * Note: This is a simplified implementation of "scoped sending".
   */
  scope?: string[];
};

/**
 * @category State
 * @description The internal structure of the flow state.
 */
export type FlowState = {
  [key: string]: FlowStateValue;
  __categories?: { [category: string]: { [key: string]: FlowStateValue } };
  __secure?: { [key: string]: { value: string; iv?: string } }; // Mocking secure storage
  __temp?: { [key: string]: boolean };
  __scoped?: { [key: string]: string[] };
};
