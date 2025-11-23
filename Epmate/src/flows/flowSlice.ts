import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FlowChild, FlowInstance } from './types';

type FlowState = {
  flows: Record<string, FlowInstance>;
  children: Record<string, FlowChild>;
  zCounter: number;
};

const initialState: FlowState = {
  flows: {},
  children: {},
  zCounter: 1000,
};

const slice = createSlice({
  name: 'flow',
  initialState,
  reducers: {
    registerFlow: (
      state,
      action: PayloadAction<{
        name: string;
        type: FlowInstance['type'];
        opts?: Partial<FlowInstance>;
      }>,
    ) => {
      const { name, type, opts } = action.payload;
      if (!state.flows[name]) {
        state.flows[name] = {
          name,
          type,
          children: [],
          stack: [],
          state: {},
          shareState: opts?.shareState ?? true,
          isRestrictedIn: opts?.isRestrictedIn ?? false,
          isRestrictedOut: opts?.isRestrictedOut ?? false,
          theme: opts?.theme ?? undefined,
          z: state.zCounter++,
        };
      }
    },

    registerChild: (
      state,
      action: PayloadAction<{ parent: string; child: FlowChild }>,
    ) => {
      const { parent, child } = action.payload;
      if (state.children[child.id]) {
        return;
      }
      // ensure parent exists
      const p = state.flows[parent];
      if (!p) {
        // We still register child but parent missing - will be resolved once parent registers
        state.children[child.id] = child;
        return;
      }
      // ensure unique child local name
      if (p.children.some(cid => state.children[cid]?.name === child.name)) {
        throw new Error(
          `Child with name "${child.name}" already exists in parent "${parent}"`,
        );
      }
      state.children[child.id] = child;
      p.children.push(child.id);
    },

    openChild: (
      state,
      action: PayloadAction<{ parent: string; childId: string; from?: string }>,
    ) => {
      const { parent, childId } = action.payload;
      const flow = state.flows[parent];
      if (!flow) return;
      // push to stack if not top
      const top = flow.stack[flow.stack.length - 1];
      if (top !== childId) {
        flow.stack.push(childId);
      }
    },

    closeFlow: (state, action: PayloadAction<{ parent: string }>) => {
      const flow = state.flows[action.payload.parent];
      if (!flow) return;
      flow.stack = [];
    },

    popChild: (state, action: PayloadAction<{ parent: string }>) => {
      const flow = state.flows[action.payload.parent];
      if (!flow) return;
      flow.stack.pop();
    },

    setFlowState: (
      state,
      action: PayloadAction<{ parent: string; key: string; value: any }>,
    ) => {
      const f = state.flows[action.payload.parent];
      if (!f) return;
      f.state[action.payload.key] = action.payload.value;
    },

    setChildExtras: (
      state,
      action: PayloadAction<{ childId: string; extras: Record<string, any> }>,
    ) => {
      const child = state.children[action.payload.childId];
      if (!child) return;
      child.props.extras = {
        ...(child.props.extras ?? {}),
        ...action.payload.extras,
      };
    },
  },
});

export const {
    registerFlow,
    registerChild,
    openChild,
    closeFlow,
    popChild,
    setFlowState,
    setChildExtras,
} = slice.actions;

export default slice.reducer;
