import React from 'react';

export type FlowType = 'modal' | 'page' | 'child';

export type SizeOption = 'full' | 'half' | 'bottom';

export type FlowChildProps = {
  name: string;
  page: React.ReactNode;
  size?: SizeOption;
  draggable?: boolean;
  dismissable?: boolean;
  title?: string;
  noTitle?: boolean;
  canGoBack?: boolean;
  shouldSwitch?: boolean;
  extras?: Record<string, any>;
  background?: string;
  dragging: boolean;
  switching: boolean;
  closing: boolean;
  opening: boolean;
  onOpen?: (ctx: {
    from: 'parent' | 'sibling' | string;
  }) => Promise<boolean> | boolean;
  onSwitching?: (dir: 'forward' | 'backward') => Promise<boolean> | boolean;
  onDrag?: (pos: number) => void;
  onClose?: () => void;
};

export type FlowChild = {
  id: string; // 'parent.child' unique key
  parent: string; // parent flow name
  name: string; // child name (local)
  props: FlowChildProps;
};

export type FlowInstance = {
  name: string;
  type: FlowType;
  children: string[]; // array of FlowChild.id
  stack: string[]; // active stack: array of FlowChild.id
  state: Record<string, any>; // shared state for this flow
  shareState?: boolean;
  isRestrictedIn?: boolean;
  isRestrictedOut?: boolean;
  theme?: string;
  z?: number;
};
