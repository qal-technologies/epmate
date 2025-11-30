import { useFlowContext } from '../core/FlowContext';
import { getFlowState, setFlowState, getCat as getCatRuntime, setCat as setCatRuntime, secure as secureRuntime, getSecure as getSecureRuntime } from '../core/FlowRuntime';
import { SetStateOptions } from '../types';

export function useFlowState(scope?: string) {
  const context = useFlowContext();
  
  // Auto-detect scope if not provided
  const targetScope = scope || context.parentId || context.flowId;

  if (!targetScope) {
    if (__DEV__) console.warn('[useFlowState] No scope provided and could not auto-detect from context.');
  }

  const get = (key?: string) => {
    if (!targetScope) return undefined;
    const state = getFlowState(targetScope);
    if (!state) return undefined;
    return key ? state[key] : state;
  };

  const set = (newState: any, options?: SetStateOptions) => {
    if (!targetScope) return;
    setFlowState(targetScope, newState, options);
  };

  const getCat = (category: string, key?: string) => {
    if (!targetScope) return undefined;
    return getCatRuntime(targetScope, category, key);
  };

  const setCat = (category: string, newState: any) => {
    if (!targetScope) return;
    setCatRuntime(targetScope, category, newState);
  };

  const secure = (key: string, value: any, secureKey: string) => {
    if (!targetScope) return;
    secureRuntime(targetScope, key, value, secureKey);
  };

  const getSecure = (key: string, secureKey: string) => {
    if (!targetScope) return undefined;
    return getSecureRuntime(targetScope, key, secureKey);
  };

  // Simplified "send" (scoped state setting)
  const send = (key: string, value: any, targetChildren: string[]) => {
    if (!targetScope) return;
    setFlowState(targetScope, { [key]: value }, { scope: targetChildren });
  };

  // Simplified "keep" (temporary state)
  const keep = (key: string, value: any) => {
    if (!targetScope) return;
    setFlowState(targetScope, { [key]: value }, { temporary: true });
  };

  return {
    get,
    set,
    getCat,
    setCat,
    secure,
    getSecure,
    send,
    keep,
  };
}
