import React from 'react';
import { flowRegistry } from './FlowRegistry';
import { 
  FlowPageProps, 
  FlowModalProps,
  FlowPageChildProps,
  FlowModalChildProps,
  FlowChildProps,
} from '../types';
import { makeId } from '../utils';
import { FlowProvider } from './FlowProvider';
import FlowNavigator from '../FlowNavigator';
import { useFlowState } from '../hooks/useFlowState';
import { useFlowNav } from '../hooks/useFlowNav';
import {
  open,
  close,
  next,
  prev,
  goTo,
  getActive,
  getFlags,
  onChange,
  getMom,
  onDragUpdate,
  onDragEnd,
  onAnimationComplete,
  ensureRuntime,
} from './FlowRuntime';

const ParentContext = React.createContext<string | null>(null);

/* -------------------- Types -------------------- */

type PageComponent = React.FC<FlowPageProps> & {
  Page: PageComponent;
  Modal: ModalComponent;
  FC: React.FC<FlowPageChildProps>;
};

type ModalComponent = React.FC<FlowModalProps> & {
  Page: PageComponent;
  Modal: ModalComponent;
  FC: React.FC<FlowModalChildProps>;
};

/* -------------------- Module-Level Components (Created Once) -------------------- */

// Registry to track what's been registered to prevent duplicates
const registeredIds = new Set<string>();

function createFlowComponentOnce(
  type: 'page' | 'modal' | 'child'
): React.FC<any> {
  return function FlowComponent(props: any) {
    const { name, children, page, ...restProps } = props;
    const contextParent = React.useContext(ParentContext);
    
    const parentId = props.parent ?? contextParent;
    const isRoot = type !== 'child' && !parentId;
    const id = isRoot ? name : makeId(parentId, name);

    // Register on mount - but check if already registered first
    if (!registeredIds.has(id)) {
      registeredIds.add(id);
      
      try {
        flowRegistry.registerNode({
          id,
          name,
          type: type === 'child' ? 'child' : type,
          parentId: isRoot ? null : parentId,
          props: { ...restProps, ...(page ? { page } : {}) },
        });

        if (!isRoot && parentId) {
          ensureRuntime(parentId);
        }
      } catch (err) {
        console.error(`[Flow] register error:`, err);
        registeredIds.delete(id); // Remove if registration failed
      }
    }

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        registeredIds.delete(id);
        try {
          flowRegistry.unregisterNode(id);
        } catch (e) {}
      };
    }, [id]);

    if (isRoot) {
      return (
        <FlowProvider parentId={id} childId={null} flowId={id}>
          <ParentContext.Provider value={id}>
            {children}
          </ParentContext.Provider>
        </FlowProvider>
      );
    }

    return null;
  };
}

// Create components ONCE at module level
const PageComponentImpl = createFlowComponentOnce('page');
const ModalComponentImpl = createFlowComponentOnce('modal');
const PageChildComponent = createFlowComponentOnce('child');
const ModalChildComponent = createFlowComponentOnce('child');
const StandaloneChildComponent = createFlowComponentOnce('child');

// Type them properly
const Page = PageComponentImpl as PageComponent;
const Modal = ModalComponentImpl as ModalComponent;
const FC = StandaloneChildComponent as React.FC<FlowChildProps>;

// Set up nested properties
Page.Page = Page;
Page.Modal = Modal;
Page.FC = PageChildComponent as React.FC<FlowPageChildProps>;

Modal.Page = Page;
Modal.Modal = Modal;
Modal.FC = ModalChildComponent as React.FC<FlowModalChildProps>;

// The final Flow object - created ONCE at module level
const Flow = {
  Navigator: FlowNavigator,
  Page,
  Modal,
  FC,
};

/* -------------------- Hook -------------------- */

export function useFlow() {
  // Simply return the pre-created Flow object
  const create = React.useCallback(() => Flow, []);
  
  return {
    create,
    open,
    close,
    next,
    prev,
    goTo,
    getActive,
    getFlags,
    onChange,
    getMom,
    onDragUpdate,
    onDragEnd,
    onAnimationComplete,
    __debug: {},
    state: useFlowState,
    nav: useFlowNav,
  };
}
