import 'react';
import { useFlow } from '../core/FlowInstance';

declare module 'react' {
  interface Attributes {
    flow?: {
       api: ReturnType<typeof useFlow>;
        parentId: string;
        childId: string;
        flags: { opening: boolean; switching: boolean; dragging: boolean };
    };
  }
}
