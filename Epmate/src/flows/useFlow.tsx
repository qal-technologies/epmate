// src/flow/useFlow.tsx
import React from 'react';
import { useFlowProvider } from './FlowProvider';
import type { FlowType, FlowChildProps } from './types';

/**
 * useFlow() public hook.
 * create(type) => returns a Flow component (with .FC subcomponent)
 */
export function useFlow() {
  const api = useFlowProvider();

  function create(type: FlowType = 'modal') {
    function Flow({ name, children, ...opts }: any) {
      React.useEffect(() => {
        api.registerFlow(name, type, opts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [name]);

      // Provide parent name context for Flow.FC children
      return (
        <FlowParentContext.Provider value={name}>
          {children}
        </FlowParentContext.Provider>
      );
    }

    // Flow.FC: a child registration component (doesn't render its page here)
    function FlowFC(props: FlowChildProps) {
      const parent = React.useContext(FlowParentContext);
      if (!parent) {
        throw new Error(
          "Flow.FC must be placed as a child of a <Flow name='...'> parent.",
        );
      }
      React.useEffect(() => {
        api.registerChild(parent, props.name, props);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return null; // actual rendering will be managed by overlay renderer
    }

    const FlowParentContext = React.createContext<string | null>(null);

    // assign FC property
    // @ts-ignore
    Flow.FC = FlowFC;
    return Flow as any;
  }

  // direct helpers too
  return {
    create,
    open: api.open,
    close: api.close,
    back: api.back,
    setFlowState: api.setFlowState,
    getFlow: api.getFlow,
    getChild: api.getChild,
  };
}
