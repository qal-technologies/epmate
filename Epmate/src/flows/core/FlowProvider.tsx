import React from 'react';
import { FlowContext, FlowContextValue } from './FlowContext';

interface FlowProviderProps extends FlowContextValue {
  children: React.ReactNode;
}

export const FlowProvider: React.FC<FlowProviderProps> = ({
  children,
  parentId,
  childId,
  flowId,
}) => {
  const value = React.useMemo(
    () => ({ parentId, childId, flowId }),
    [parentId, childId, flowId],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
};
