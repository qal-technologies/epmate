import { ViewStyle, TextStyle } from 'react-native';

/**
 * @category Core
 * @description Defines the type of a flow, which can be a modal or a page.
 */
export type FlowType = 'modal' | 'page';

/**
 * @category Core
 * @description Defines the size of a flow, which can be 'full', 'half', or 'bottom'.
 */
export type SizeType = 'full' | 'half' | 'bottom';

/**
 * @category Core
 * @description Defines the type of animation for a flow transition.
 */
export type AnimationType = 'slideBottom' | 'slideTop' | 'slideLeft' | 'slideRight' | 'fade';


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
 * @description Props for a child component within a flow.
 * @template T - A generic type for the `extras` prop, allowing for custom data to be passed.
 * @property {string} name - The unique name of the child within its parent flow.
 * @property {React.ReactNode} page - The React component to render for this step.
 * @property {SizeType} [size='full'] - The size of the flow component.
 * @property {AnimationType} [animationType='slideBottom'] - The animation to use when this child is shown.
 * @property {boolean} [draggable=false] - If true, the user can drag the component (e.g., a bottom sheet).
 * @property {boolean} [dismissable=true] - If true, the user can dismiss the component (e.g., by swiping or pressing an overlay).
 * @property {string} [title] - The title to display in the header.
 * @property {boolean} [noTitle] - If true, the title header will not be displayed.
 * @property {boolean} [canGoBack=true] - If true, a back button will be shown, allowing the user to navigate to the previous step.
 * @property {boolean} [shouldSwitch] - A flag to control switching behavior, if needed.
 * @property {T} [extras] - An object for any extra data you want to associate with this child.
 * @property {string} [background] - The background color or style for the component.
 * @property {(ctx: { from: string; opener?: string }) => Promise<boolean> | boolean} [onOpen] - A lifecycle hook that runs before the child is opened. Returning `false` will cancel the navigation.
 * @property {(dir: 'forward' | 'backward') => Promise<boolean> | boolean} [onSwitching] - A lifecycle hook that runs before switching to another child. Returning `false` will cancel the switch.
 * @property {(position: number) => void} [onDrag] - A callback that fires as the user drags a draggable component.
 * @property {() => void} [onClose] - A lifecycle hook that runs when the child is closed.
 * @property {React.ReactElement} [activityIndicator] - An optional custom activity indicator to show during async operations like `onOpen` or `onSwitching`.
 */
export type FlowChildProps<T = Record<string, any>> = {
  coverScreen?: boolean;
  name: string;
  page: React.ReactNode;
  size?: SizeType;
  animationType?: 'slideBottom' | 'slideTop' | 'slideLeft' | 'slideRight' | 'fade';
  draggable?: boolean;
  dismissable?: boolean;
  title?: string;
  noTitle?: boolean;
  canGoBack?: boolean;
  shouldSwitch?: boolean;
  extras?: T;
  background?: string;
  onOpen?: (ctx: {
    from: string;
    opener?: string;
  }) => Promise<boolean> | boolean;
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  onDrag?: (position: number) => void;
  onClose?: () => void;
  activityIndicator?: React.ReactElement;
};

/**
 * @category Configuration
 * @description Options for creating a new flow.
 * @property {FlowType} type - The type of flow to create ('modal' or 'page').
 * @property {boolean} [shareState=false] - If true, the state is shared across children of this flow.
 * @property {boolean} [isRestrictedIn=false] - If true, prevents navigating into this flow under certain conditions.
 * @property {boolean} [isRestrictedOut=false] - If true, prevents navigating out of this flow under certain conditions.
 * @property {string} [theme] - An optional theme name to apply to the flow.
 * @property {number} [lifecycleTimeoutMs=8000] - The timeout in milliseconds for lifecycle hooks like `onOpen` and `onSwitching`.
 * @property {AtEndConfig} [atEnd] - Configuration for what happens when the flow reaches its end.
 */
export type FlowCreateOptions = {
  type: FlowType;
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
