import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {flowRegistry} from '../core/FlowRegistry';
import {FlowType, FlowBaseProps, FlowChildProps, FlowModalProps, FlowPageProps, FlowModalChildProps, FlowPageChildProps} from '../types';
import {useFlowContext} from '../core/FlowContext';
import FlowNavigator from '../FlowNavigator';
import {useFlowState} from './useFlowState';
import {useFlowNav} from './useFlowNav';

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

  useEffect(() => {
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
  }, [name, parentId, page]);

  // Update props without unmounting
  useEffect(() => {
    if(parentId && name) {
      const id = `${parentId}.${name}`;
      const existing = flowRegistry.getNode(id);
      if(existing) {
        flowRegistry.registerNode({
          id,
          name,
          type: 'child',
          parentId,
          props: {page, ...propsRef.current},
        });
      }
    }
  });

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
  const [isRegistered, setIsRegistered] = React.useState(false);
  const instanceId = React.useRef(Math.random().toString(36).slice(2)).current;

  if(__DEV__) console.log(`[FlowParent:${instanceId}] Rendering ${name}, parentId: ${parentId}, type: ${type}`);

  // 1. Lifecycle: Register on mount, Unregister on unmount
  // Use useEffect (not useLayoutEffect) to avoid React Strict Mode double-mount cleanup
  React.useEffect(() => {
    if(__DEV__) console.log(`[FlowParent:${instanceId}] Registering ${name}`);
    flowRegistry.registerNode({
      id: name,
      name,
      type,
      parentId,
      props,
    });
    setIsRegistered(true);
    return () => {
      if(__DEV__) console.log(`[FlowParent:${instanceId}] Unregistering ${name} (cleanup)`);
      flowRegistry.unregisterNode(name);
    };
  }, [name, type, parentId]);

  // 2. Updates: Sync props when they change (without unregistering)
  const propsRef = React.useRef(props);
  propsRef.current = props;

  React.useEffect(() => {
    if(isRegistered) {
      flowRegistry.registerNode({
        id: name,
        name,
        type,
        parentId,
        props: propsRef.current,
      });
    }
  }, [isRegistered, name, type, parentId]);

  if(!isRegistered) return null;

  return (
    <>
      {React.Children.map(children, (child) => {
        if(React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {parentId: name});
        }
        return child;
      })}
    </>
  );
};

/**
 * @component FlowNavigatorWrapper
 * @description
 * A wrapper component that integrates the `FlowNavigator` into the component tree.
 * It ensures that the `FlowNavigator` (which handles the actual rendering of active flows)
 * is present and that the container takes up the full available screen space.
 *
 * This component is exposed as `Flow.Navigator`.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} [props.children] - Optional children to render alongside the navigator.
 * @returns {React.ReactElement} A View containing the children and the FlowNavigator.
 */
import {ErrorBoundary} from '../../components/ErrorBoundary';

const FlowNavigatorWrapper: React.FC<{children?: React.ReactNode;}> = ({children}) => {
  return (
    <View style={styles.container}>
      {children}
      <ErrorBoundary>
        <FlowNavigator />
      </ErrorBoundary>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

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
 * The primary hook for interacting with the FlowUI system.
 * It provides methods to create flows programmatically, access core components, and manage flow state.
 *
 * @returns {object} An object containing:
 * - `create`: A function to start building a new flow.
 * - `Parent`: The `FlowParent` component for declarative flow definition.
 * - `FC`: The `FlowFC` component for defining screens/pages.
 * - `Navigator`: The `FlowNavigator` wrapper component.
 * - `state`: A hook accessor for `useFlowState`.
 */
export function useFlow () {
  return React.useMemo(() => ({
    /**
     * Starts the creation of a new flow using the Builder pattern.
     *
     * @template T - The type of flow ('modal' or 'page').
     * @param {T} type - The type of flow to create.
     * @returns {IBuilderNamed<T extends 'modal' ? FlowModalProps : FlowPageProps>} The builder instance, starting at the `named` step.
     *
     * @example
     * const MyModal = Flow.create('modal')
     *   .named('MyModal')
     *   .child('Content', <MyContent />)
     *   .props({ size: 'half' })
     *   .build();
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
     * Hook to access and manage the Flow state.
     *
     * @param {any} [scope] - The optional scope for the state. If not provided, it auto-detects the current flow scope.
     * @returns {object} The state management object from `useFlowState`.
     */
    state: (scope?: any) => useFlowState(scope),

    /**
     * Hook to access Flow navigation tools.
     * @returns The navigation object.
     */
    nav: () => useFlowNav(),
  }), []);
}
