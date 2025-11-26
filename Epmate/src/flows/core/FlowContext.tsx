import React from 'react';

export interface FlowContextValue {
  parentId: string | null;
  childId: string | null;
  flowId: string | null;
}

export const FlowContext = React.createContext<FlowContextValue>({
  parentId: null,
  childId: null,
  flowId: null,
});

export const useFlowContext = () => React.useContext(FlowContext);
