import React, {useEffect, useLayoutEffect} from 'react';
import {View} from 'react-native';
import {flowRegistry} from '../core/FlowRegistry';
import {FlowType, FlowBaseProps, FlowChildProps, FlowModalProps, FlowPageProps, FlowModalChildProps, FlowPageChildProps} from '../types';
import {useFlowContext} from '../core/FlowContext';
import {useFlowState} from './useFlowState';
import {useFlowNav} from './useFlowNav';
import {open, useFlowRuntime} from '../core/FlowRuntime';
import {FlowPack} from '../FlowPack';
import {FlowProvider} from '../core/FlowProvider';
import {useFlowBackHandler} from '../core/FlowBackHandler';
import { useFlowProps, useFlowParentProps } from './useFlowProps';
import { FlowNavigatorWrapper } from '../FlowNavigatorWrapper';

/**
 * @component FlowFC
 * @description
 * Internal component used to register a flow page or child node within the Flow Registry.
 * It does not render any visible UI itself (returns `null`) because the actual content rendering
 * is handled by the `FlowNavigator` based on the active flow state.
 *
 * This component is typically used as a child of `Flow.Parent`.
 *
 * @param {FlowChildProps & { parentId?: string }} props - The properties for the flow child.
 * @param {string} props.name - The unique identifier for this child within its parent flow.
 * @param {React.ReactNode} props.page - The React component to be rendered when this child is active.
 * @param {string} [props.parentId] - The ID of the parent flow. Automatically injected by `Flow.Parent`.
 * @returns {null} This component renders nothing directly.
 */
const FlowFC: React.FC<FlowChildProps & {parentId?: string;}> = ({name, page, parentId, ...props}) => {
  const propsRef = React.useRef(props);
  propsRef.current = props;

  // Register synchronously using useLayoutEffect to ensure parent exists
  useLayoutEffect(() => {
    if(parentId && name) {
      const id = `${parentId}.${name}`;

      flowRegistry.registerNode({
        id,
        name,
        type: 'child',
        parentId,
        props: {page, ...propsRef.current},
      });
      return () => {

        flowRegistry.unregisterNode(id);
      };
    }
  }, [name, parentId]);

  // CRITICAL: Watch for page prop changes and update registry (enables hot reload)
  useEffect(() => {
    if(parentId && name && page) {
      const id = `${parentId}.${name}`;
      const existingNode = flowRegistry.getNode(id);
      if(existingNode) {
        // Update the page prop in the registry when it changes
        flowRegistry.registerNode({
          id,
          name,
          type: 'child',
          parentId,
          props: {page, ...propsRef.current},
        });

      }
    }
  }, [page, name, parentId]);

  return null;
};

/**
 * @component FlowParent
 * @description
 * A container component that defines a parent flow. It registers itself in the Flow Registry
 * and manages the lifecycle of its children (which are typically `Flow.FC` components).
 *
 * It acts as a logical grouping for a set of related screens or modals.
 *
 * @param {FlowBaseProps} props - The properties for the parent flow.
 * @param {string} props.name - The unique identifier for this flow.
 * @param {FlowType} [props.type='page'] - The type of flow ('page' or 'modal'). Defaults to 'page'.
 * @param {React.ReactNode} props.children - The child components (usually `Flow.FC`) to register.
 * @returns {React.ReactElement} Renders its children, injecting the `parentId` prop into them.
 */
const FlowParent: React.FC<FlowBaseProps> = ({name, type = 'page', children, ...props}) => {
  const context = useFlowContext();
  const parentId = context.flowId || null;
  const runtime = useFlowRuntime(); // Get runtime once at component level
  const nav = useFlowNav(name); // Get nav API for this parent
  
  // Enable back handling for this parent
  useFlowBackHandler(name);

  const [isRegistered, setIsRegistered] = React.useState(false);
  const instanceId = React.useRef(Math.random().toString(36).slice(2)).current;



  // 1. Lifecycle: Register SYNCHRONOUSLY before render using useLayoutEffect
  // This ensures children can find their parent when they register
  React.useLayoutEffect(() => {

    flowRegistry.registerNode({
      id: name,
      name,
      type,
      parentId,
      props,
    });
    setIsRegistered(true);
    return () => {

      flowRegistry.unregisterNode(name);
      setIsRegistered(false);
    };
  }, [name, type, parentId]);

  // 2. Auto-open first child after registration and children are mounted
  React.useEffect(() => {
    if (!isRegistered) {

      return;
    }



    // Small delay to ensure children have registered
    const timeoutId = setTimeout(() => {
      const active = runtime.getActive(name);
      const children = flowRegistry.getChildren(name);
      


      
      // Only auto-open if no child is currently active
      if (!active) {
        if (children.length > 0) {
          // Try to open the specified initial child first
          let childToOpen = children[0];
          
          if (props.initial) {
            const initialChild = children.find(c => c.name === props.initial);
            if (initialChild) {
              childToOpen = initialChild;

            } else {
              if (__DEV__) console.warn(`[FlowParent:${instanceId}] Initial child "${props.initial}" not found, using first child: ${children[0].name}`);
            }
          } else {

          }
          
          // Use the nav API's open function

          nav.open(childToOpen.name).then(result => {

          }).catch(err => {
            if (__DEV__) console.error(`[FlowParent:${instanceId}] nav.open error:`, err);
          });
        } else {
          if (__DEV__) console.warn(`[FlowParent:${instanceId}] No children registered yet for "${name}"`);
        }
      } else {

      }
    }, 10); // Small delay for child registration

    return () => clearTimeout(timeoutId);
  }, [isRegistered, name, props.initial, instanceId, runtime, nav]);

  const [tick, setTick] = React.useState(0);

  // Subscribe to runtime changes to trigger re-render when active child changes
  React.useEffect(() => {
    const unsubRuntime = runtime.onChange(name, () => {
      setTick(t => t + 1);
    });
    // ALSO subscribe to registry changes. 
    // This is critical because if a child registers AFTER we render, we need to re-render to "see" it.
    const unsubRegistry = flowRegistry.subscribe(() => {
       setTick(t => t + 1);
    });

    return () => {
      unsubRuntime();
      unsubRegistry();
    };
  }, [name, runtime]);

  // Wait for registration before rendering children
  if(!isRegistered) {

    return null;
  }

  // 3. Inline Rendering Logic for Nested Parents
  // If this parent is nested (not a root/pack child) and not a modal, it must render its own active child.
  const activeChild = runtime.getActive(name);
  const parentNode = parentId ? flowRegistry.getNode(parentId) : null;
  const isNested = parentId && parentNode?.type !== 'pack' && type !== 'modal';

  return (
    <>
      {/* Register children (invisible) */}
      {React.Children.map(children, (child) => {
        if(React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {parentId: name});
        }
        return child;
      })}

      {/* Render active child content if nested */}
      {isNested && activeChild && activeChild.props.page ? (
        <View style={{flex: 1}}>
          <FlowProvider parentId={name} childId={activeChild.id} flowId={name}>
            {activeChild.props.page}
          </FlowProvider>
        </View>
      ) : null}
    </>
  );
};

// Interfaces for the Step Builder Pattern

/**
 * @interface IBuilderNamed
 * @description Interface for the first step of the builder: naming the flow.
 */
interface IBuilderNamed<P> {
  /**
   * Sets the unique name of the flow.
   * @param {string} name - The name of the flow.
   * @returns {IBuilderChild<P>} The next step in the builder (adding a child).
   */
  named (name: string): IBuilderChild<P>;
}

/**
 * @interface IBuilderChild
 * @description Interface for the second step of the builder: adding a child screen.
 */
interface IBuilderChild<P> {
  /**
   * Adds a child screen/component to the flow.
   * @param {string} name - The unique name of the child screen.
   * @param {React.ReactNode} component - The React component to render for this screen.
   * @returns {IBuilderChild<P> & IBuilderProps<P>} Returns itself to allow adding more children, or proceeds to setting props.
   */
  child (name: string, component: React.ReactNode): IBuilderChild<P> & IBuilderProps<P>;
}

/**
 * @interface IBuilderProps
 * @description Interface for the third step of the builder: setting flow properties.
 */
interface IBuilderProps<P> {
  /**
   * Sets the properties for the flow.
   * Note: `name`, `type`, `children`, and `page` are excluded as they are handled by other methods.
   * @param {Omit<P, 'name' | 'type' | 'children' | 'page'>} props - The properties object.
   * @returns {IBuilderBuild} The final step in the builder (building the component).
   */
  props (props: Omit<P, 'name' | 'type' | 'children' | 'page'>): IBuilderBuild;
}

/**
 * @interface IBuilderBuild
 * @description Interface for the final step of the builder: generating the component.
 */
interface IBuilderBuild {
  /**
   * Builds and returns the Flow component.
   * @param {boolean} [shouldBuild=true] - If false, returns an empty fragment (useful for conditional rendering).
   * @returns {React.ReactElement} The constructed Flow component.
   */
  build (shouldBuild?: boolean): React.ReactElement;
}

/**
 * @class FlowBuilder
 * @description
 * A fluent builder class for creating Flow components programmatically.
 * It enforces a strict order of operations: `create` -> `named` -> `child` -> `props` -> `build`.
 *
 * @template P - The type of props for the flow (e.g., `FlowModalProps` or `FlowPageProps`).
 */
class FlowBuilder<P extends FlowBaseProps> implements IBuilderNamed<P>, IBuilderChild<P>, IBuilderProps<P>, IBuilderBuild {
  private type: FlowType;
  private _name: string = '';
  private _props: Partial<P> = {};
  private _children: {name: string; component: React.ReactNode;}[] = [];

  constructor(type: FlowType) {
    this.type = type;
  }

  /**
   * @inheritdoc
   */
  named (name: string): IBuilderChild<P> {
    this._name = name;
    return this as any;
  }

  /**
   * @inheritdoc
   */
  child (name: string, component: React.ReactNode): IBuilderChild<P> & IBuilderProps<P> {
    this._children.push({name, component});
    return this as any;
  }

  /**
   * @inheritdoc
   */
  props (props: Omit<P, 'name' | 'type' | 'children' | 'page'>): IBuilderBuild {
    this._props = {...this._props, ...props} as Partial<P>;
    return this;
  }

  /**
   * @inheritdoc
   */
  build (shouldBuild: boolean = true): React.ReactElement {
    if(!shouldBuild) {
      return <></>;
    }

    const Component: React.FC<any> = (props) => {
      const parentName = props.name || this._name;
      const parentId = props.parentId || null;
      const [isRegistered, setIsRegistered] = React.useState(false);

      // 1. Lifecycle
      React.useEffect(() => {
        if(parentName) {
          flowRegistry.registerNode({
            id: parentName,
            name: parentName,
            type: this.type,
            parentId,
            props: {...this._props, ...props},
          });
          setIsRegistered(true);
        }
        return () => {
          if(parentName) flowRegistry.unregisterNode(parentName);
        };
      }, [parentName, parentId]); // Removed props

      // 2. Updates
      const propsRef = React.useRef(props);
      propsRef.current = props;

      React.useEffect(() => {
        if(parentName) {
          flowRegistry.registerNode({
            id: parentName,
            name: parentName,
            type: this.type,
            parentId,
            props: {...this._props, ...propsRef.current},
          });
        }
      }, [parentName, parentId]);

      if(!isRegistered) return null;

      return (
        <>
          {this._children.map((child) => (
            <FlowFC
              key={child.name}
              name={child.name}
              page={child.component}
              parentId={parentName}
            />
          ))}
        </>
      );
    };
    return <Component />;
  }
}

/**
 * @hook useFlow
 * @description
 * The primary entry point for the Flow System.
 * It provides a comprehensive toolkit for building, rendering, and managing flows.
 * 
 * **Toolkit Includes:**
 * - `create(type)`: A fluent builder for creating new Flow components programmatically.
 * - `Parent`: Declarative component for defining flow containers.
 * - `FC`: Declarative component for defining flow steps/screens.
 * - `Navigator`: The rendering engine that displays the active flow.
 * - `state(scope)`: Accessor for the `useFlowState` hook.
 * - `nav()`: Accessor for the `useFlowNav` hook.
 * - `props()`: Accessor for the `useFlowProps` hook.
 * - `parentProps()`: Accessor for the `useFlowParentProps` hook.
 * 
 * @returns {object} The Flow toolkit.
 * 
 * @example
 * ```tsx
 * const Flow = useFlow();
 * 
 * // Create a modal flow
 * const MyModal = Flow.create('modal')
 *   .named('MyModal')
 *   .child('Step1', <Step1 />)
 *   .build();
 * 
 * // Or use declarative components
 * <Flow.Parent name="MyPage">
 *   <Flow.FC name="Step1" page={<Step1 />} />
 * </Flow.Parent>
 * 
 * // Access props
 * const { props, setProps } = Flow.props();
 * ```
 */
export function useFlow () {
  return {
    /**
     * Starts the creation of a new flow using the **Builder Pattern**.
     * This is an alternative to using `<Flow.Parent>` and `<Flow.FC>` components directly.
     * 
     * **Steps:**
     * 1. `create(type)`: Start builder.
     * 2. `named(name)`: Set unique name.
     * 3. `child(name, component)`: Add children (chainable).
     * 4. `props(props)`: Set flow properties.
     * 5. `build()`: Generate the React component.
     *
     * @template T - The type of flow ('modal' or 'page').
     * @param {T} type - The type of flow to create.
     * @returns {IBuilderNamed<T extends 'modal' ? FlowModalProps : FlowPageProps>} The builder instance.
     *
     * @example
     * ```tsx
     * const MyModal = Flow.create('modal')
     *   .named('LoginModal')
     *   .child('Email', <EmailScreen />)
     *   .child('Password', <PasswordScreen />)
     *   .props({ size: 'half', dismissable: true })
     *   .build();
     * ```
     */
    create: <T extends FlowType> (type: T): IBuilderNamed<T extends 'modal' ? FlowModalChildProps : FlowPageChildProps> => {
      return new FlowBuilder(type) as any;
    },

    /**
     * Component for defining a parent flow declaratively.
     * @see FlowParent
     */
    Parent: FlowParent,

    /**
     * Component for defining a screen or page within a flow.
     * @see FlowFC
     */
    FC: FlowFC,

    /**
     * The Flow Navigator component. Wraps content and renders active flows.
     * This should typically be placed at the root of your flow hierarchy or screen.
     * @see FlowNavigatorWrapper
     */
    Navigator: FlowNavigatorWrapper,

    /**
     * Component for defining a Pack of flows.
     * @see FlowPack
     */
    Pack: FlowPack,

    /**
     * Hook accessor to access and manage the Flow state.
     * Returns the same interface as `useFlowState()`.
     *
     * @param {string} [scope] - The optional scope for the state. 
     *   - If omitted, it auto-detects the current `Flow.Parent` or `Flow.FC` scope.
     *   - Pass `'global'` to access shared state.
     * @returns {object} The state management object (get, set, keep, etc.).
     * 
     * @example
     * ```tsx
     * const { set, get } = Flow.state();
     * set('count', 1);
     * ```
     */
    state: (scope?: any) => useFlowState(scope),

    /**
     * Hook accessor to access Flow navigation tools.
     * Returns the same interface as `useFlowNav()`.
     * 
     * @returns {object} The navigation object (open, close, next, prev, etc.).
     * 
     * @example
     * ```tsx
     * const nav = Flow.nav();
     * nav.next();
     * ```
     */
    nav: () => useFlowNav(),

    /**
     * Hook accessor to access and modify the component's own props.
     * Returns the same interface as `useFlowProps()`.
     * 
     * @returns {object} The props management object (props, setProps).
     * 
     * @example
     * ```tsx
     * const { props, setProps } = Flow.props();
     * setProps({ title: 'New Title' });
     * ```
     */
    props: <T = {}>() => useFlowProps<T>(),

    /**
     * Hook accessor to access and modify the parent's props.
     * Returns the same interface as `useFlowParentProps()`.
     * 
     * @returns {object} The parent props management object (parentProps, setParentProps).
     * 
     * @example
     * ```tsx
     * const { parentProps, setParentProps } = Flow.parentProps();
     * setParentProps({ isRestrictedOut: true });
     * ```
     */
    parentProps: <T = {}>() => useFlowParentProps<T>(),
  };
}
