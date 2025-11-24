// src/flow/core/FlowState.ts
/**
 * FlowState
 *
 * - Fully typed flow-local, child-scoped state engine.
 * - Uses an internal registry for metadata and optional persistent storage.
 * - Auto-infers caller parent/child via flowRegistry when ids are omitted.
 *
 * Usage:
 *  import FlowState, { useFlowState, registerStorageAdapter } from './core/FlowState';
 *
 *  // simple usage from a component:
 *  const s = useFlowState(); // optional childId inferred
 *  const val = s.get('cart'); // returns wrapped value or { value: null, status: 'undefined' }
 *  s.set('cart.items', [{ id: 1 }]); // sets under inferred parent
 *
 */

import { useEffect, useMemo, useState } from 'react';
import { flowRegistry } from '../FlowRegistry';

/* -------------------- Types -------------------- */

export type Primitive = string | number | boolean | null;
export type AnyValue = Primitive | Record<string, any> | any[];

export type PermissionMode = 'public' | 'shared' | 'single';

export type PermissionRecord = {
  mode: PermissionMode;
  ownerId: string; // parentId or childId that created it
  sharedWith?: Set<string>; // allowed child names or ids (for 'shared')
  singleTarget?: string | null; // exact childId allowed
  ttl?: number | null; // milliseconds
  expiresAt?: number | null;
};

export type StateKeyMeta = {
  key: string;
  namespace: string; // parentId or childId that owns this data set
  createdAt: number;
  updatedAt: number;
  sizeBytes: number;
  permission?: PermissionRecord;
};

export type PersistAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/* -------------------- Default storage adapter (localStorage-based if available) -------------------- */

let storageAdapter: PersistAdapter | null = null;

function defaultLocalAdapter(): PersistAdapter | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return {
        getItem: async (k: string) => {
          const v = localStorage.getItem(k);
          return v === null ? null : v;
        },
        setItem: async (k: string, value: string) => {
          localStorage.setItem(k, value);
        },
        removeItem: async (k: string) => {
          localStorage.removeItem(k);
        },
      };
    }
  } catch (err) {
    // ignore
  }
  return null;
}

/**
 * registerStorageAdapter(adapter)
 * - Use this to plug AsyncStorage (React Native) or any other storage.
 * - If not registered explicitly, FlowState will attempt to use localStorage when available.
 */
export function registerStorageAdapter(adapter: PersistAdapter) {
  storageAdapter = adapter;
}

/* lazy init */
if (!storageAdapter) {
  storageAdapter = defaultLocalAdapter();
}

/* -------------------- Internal in-memory stores & registry -------------------- */

/**
 * namespace convention:
 * - parent-level data stored under namespace 'parent::<parentId>'
 * - child-level ephemeral under 'child::<childId>'
 *
 * all keys inside a namespace are simple strings (may be dot-paths).
 */

const parentStore: Map<string, Map<string, AnyValue>> = new Map();
const childStore: Map<string, Map<string, AnyValue>> = new Map();
const metaRegistry: Map<string, StateKeyMeta> = new Map(); // map namespace::key -> meta
const permissionRegistry: Map<string, PermissionRecord> = new Map(); // namespace::key -> PermissionRecord

/* event listeners for reactive usage */
type StateEvent =
  | { type: 'set'; namespace: string; key: string; value: AnyValue }
  | { type: 'remove'; namespace: string; key: string }
  | { type: 'clear'; namespace: string }
  | { type: 'batch'; namespace: string; batchKey: string };

const listeners: Set<(ev: StateEvent) => void> = new Set();

/* -------------------- Helpers -------------------- */

function nsKey(namespace: string, key: string) {
  return `${namespace}::${key}`;
}

function now() {
  return Date.now();
}

function safeJsonParse<T = any>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch (err) {
    // corrupted JSON — attempt to backup and return null
    try {
      const backupKey = `flowstate:corrupt:${now()}`;
      storageAdapter?.setItem(backupKey, s).catch(() => {});
    } catch {}
    return null;
  }
}

async function persistNamespace(namespace: string) {
  if (!storageAdapter) return;
  const map = namespace.startsWith('parent::')
    ? parentStore.get(namespace)
    : childStore.get(namespace);
  if (!map) {
    await storageAdapter.removeItem(namespace).catch(() => {});
    return;
  }
  try {
    const obj: Record<string, AnyValue> = Object.fromEntries(map.entries());
    await storageAdapter.setItem(namespace, JSON.stringify(obj));
  } catch (err) {
    // ignore persistence error
  }
}

async function loadNamespace(namespace: string) {
  if (!storageAdapter) return;
  try {
    const raw = await storageAdapter.getItem(namespace);
    const parsed = safeJsonParse<Record<string, AnyValue>>(raw);
    if (parsed) {
      const map = new Map<string, AnyValue>(Object.entries(parsed));
      if (namespace.startsWith('parent::')) {
        parentStore.set(namespace, map);
      } else {
        childStore.set(namespace, map);
      }
      // update meta registry sizes
      for (const [k, v] of Object.entries(parsed)) {
        const mk = nsKey(namespace, k);
        const s = JSON.stringify(v).length;
        metaRegistry.set(mk, {
          key: k,
          namespace,
          createdAt: metaRegistry.get(mk)?.createdAt ?? now(),
          updatedAt: now(),
          sizeBytes: s,
          permission: permissionRegistry.get(mk),
        });
      }
    }
  } catch (err) {
    // ignore
  }
}

/* dot-path helpers */
function splitDotPath(key: string) {
  if (!key) return [];
  return String(key).split('.');
}

function getAtPath(obj: any, path: string[]) {
  let cur = obj;
  for (const p of path) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}
function setAtPath(obj: any, path: string[], value: any) {
  if (path.length === 0) return value;
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    if (cur[p] == null) cur[p] = {};
    cur = cur[p];
  }
  cur[path[path.length - 1]] = value;
  return obj;
}

/* utility to build a wrapper value with helpers */
function makeWrapped(namespace: string, key: string, value: AnyValue) {
  const setSelf = (v: AnyValue) => {
    _set(namespace, key, v, { persist: true }).catch(() => {});
  };

  const wrapper: any = {
    value,
    meta: metaRegistry.get(nsKey(namespace, key)) ?? null,
    // array helpers
    push: (item: any) => {
      if (!Array.isArray(wrapper.value)) wrapper.value = [];
      wrapper.value.push(item);
      setSelf(wrapper.value);
      return wrapper;
    },
    pop: () => {
      if (!Array.isArray(wrapper.value)) return null;
      const r = wrapper.value.pop();
      setSelf(wrapper.value);
      return r;
    },
    unshift: (item: any) => {
      if (!Array.isArray(wrapper.value)) wrapper.value = [];
      wrapper.value.unshift(item);
      setSelf(wrapper.value);
      return wrapper;
    },
    shift: () => {
      if (!Array.isArray(wrapper.value)) return null;
      const r = wrapper.value.shift();
      setSelf(wrapper.value);
      return r;
    },
    forEach: (cb: (v: any, i?: number) => void) => {
      if (!Array.isArray(wrapper.value)) return;
      wrapper.value.forEach(cb);
      return wrapper;
    },
    // object helpers
    assign: (obj: Record<string, any>) => {
      if (typeof wrapper.value !== 'object' || wrapper.value === null)
        wrapper.value = {};
      Object.assign(wrapper.value, obj);
      setSelf(wrapper.value);
      return wrapper;
    },
    setPath: (dotPath: string, v: any) => {
      const parts = splitDotPath(dotPath);
      if (typeof wrapper.value !== 'object' || wrapper.value === null)
        wrapper.value = {};
      setAtPath(wrapper.value, parts, v);
      setSelf(wrapper.value);
      return wrapper;
    },
    getPath: (dotPath: string) => {
      const parts = splitDotPath(dotPath);
      return getAtPath(wrapper.value, parts);
    },
    // string helpers
    trim: () => {
      if (typeof wrapper.value === 'string') {
        wrapper.value = wrapper.value.trim();
        setSelf(wrapper.value);
      }
      return wrapper.value;
    },
    append: (s: string) => {
      if (typeof wrapper.value !== 'string')
        wrapper.value = String(wrapper.value ?? '');
      wrapper.value = wrapper.value + s;
      setSelf(wrapper.value);
      return wrapper;
    },
    // numeric helpers
    increment: (n = 1) => {
      if (typeof wrapper.value !== 'number')
        wrapper.value = Number(wrapper.value ?? 0);
      wrapper.value = wrapper.value + n;
      setSelf(wrapper.value);
      return wrapper.value;
    },
    decrement: (n = 1) => {
      if (typeof wrapper.value !== 'number')
        wrapper.value = Number(wrapper.value ?? 0);
      wrapper.value = wrapper.value - n;
      setSelf(wrapper.value);
      return wrapper.value;
    },
    // raw
    save: (v: AnyValue) => {
      wrapper.value = v;
      setSelf(v);
      return wrapper;
    },
    remove: () => {
      _remove(namespace, key);
      wrapper.value = null;
      return null;
    },
  };

  return wrapper;
}

/* -------------------- Core internal helpers (async) -------------------- */

/**
 * _set: internal single point writer
 * - namespace: e.g., 'parent::Auth' or 'child::Auth.Login'
 * - key: simple key or dot path
 * - persist: whether to persist to storage adapter
 * Returns saved value or null on failure.
 */
async function _set(
  namespace: string,
  key: string,
  value: AnyValue,
  opts?: { persist?: boolean; permission?: PermissionRecord },
): Promise<AnyValue | null> {
  try {
    // choose store map
    const isParent = namespace.startsWith('parent::');
    const map = isParent
      ? parentStore.get(namespace) ?? new Map()
      : childStore.get(namespace) ?? new Map();

    // support dot paths: if key includes dot, store as nested object under base key
    if (key.includes('.')) {
      const parts = splitDotPath(key);
      const base = parts[0];
      const existing = map.get(base);
      let obj =
        typeof existing === 'object' && existing !== null
          ? { ...existing }
          : {};
      setAtPath(obj, parts.slice(1), value);
      map.set(base, obj);
      metaRegistry.set(nsKey(namespace, base), {
        key: base,
        namespace,
        createdAt: metaRegistry.get(nsKey(namespace, base))?.createdAt ?? now(),
        updatedAt: now(),
        sizeBytes: JSON.stringify(obj).length,
        permission:
          opts?.permission ?? permissionRegistry.get(nsKey(namespace, base)),
      });
    } else {
      map.set(key, value);
      metaRegistry.set(nsKey(namespace, key), {
        key,
        namespace,
        createdAt: metaRegistry.get(nsKey(namespace, key))?.createdAt ?? now(),
        updatedAt: now(),
        sizeBytes: JSON.stringify(value).length,
        permission:
          opts?.permission ?? permissionRegistry.get(nsKey(namespace, key)),
      });
    }

    if (isParent) parentStore.set(namespace, map);
    else childStore.set(namespace, map);

    if (opts?.permission) {
      permissionRegistry.set(nsKey(namespace, key), opts.permission);
    }

    // persist
    if (opts?.persist && storageAdapter) {
      await persistNamespace(namespace);
    }

    // fire event
    listeners.forEach(cb => cb({ type: 'set', namespace, key, value }));

    // return the saved structure (for dot path, return top-level base or nested value)
    if (key.includes('.')) {
      const parts = splitDotPath(key);
      const base = parts[0];
      const stored = map.get(base);
      // return nested value
      const val = getAtPath(stored, parts.slice(1));
      return val === undefined ? null : val;
    } else {
      return map.get(key) ?? null;
    }
  } catch (err) {
    return null;
  }
}

async function _get(
  namespace: string,
  key: string,
): Promise<{ value: AnyValue | null; status: 'ok' | 'undefined' | 'denied' }> {
  try {
    // lazy load from storage if map missing
    if (namespace.startsWith('parent::') && !parentStore.has(namespace)) {
      await loadNamespace(namespace);
    }
    if (namespace.startsWith('child::') && !childStore.has(namespace)) {
      await loadNamespace(namespace);
    }

    const isParent = namespace.startsWith('parent::');
    const map = isParent
      ? parentStore.get(namespace) ?? new Map()
      : childStore.get(namespace) ?? new Map();

    if (!map.has(key) && key.includes('.')) {
      const parts = splitDotPath(key);
      const base = parts[0];
      const baseVal = map.get(base);
      if (baseVal === undefined) return { value: null, status: 'undefined' };
      const nested = getAtPath(baseVal, parts.slice(1));
      return nested === undefined
        ? { value: null, status: 'undefined' }
        : { value: nested, status: 'ok' };
    }

    if (!map.has(key)) return { value: null, status: 'undefined' };
    // permission check: look up permissionRegistry
    const perm = permissionRegistry.get(nsKey(namespace, key));
    if (perm) {
      // if expired -- auto remove and treat as undefined
      if (perm.expiresAt && perm.expiresAt < now()) {
        await _remove(namespace, key);
        return { value: null, status: 'undefined' };
      }
      // perms do not restrict reads by default here; read-level permission logic is handled by public get(...)
    }
    const v = map.get(key);
    return { value: v ?? null, status: 'ok' };
  } catch (err) {
    return { value: null, status: 'undefined' };
  }
}

async function _remove(namespace: string, key: string) {
  try {
    const isParent = namespace.startsWith('parent::');
    const map = isParent
      ? parentStore.get(namespace)
      : childStore.get(namespace);
    if (!map) return false;
    if (key.includes('.')) {
      const parts = splitDotPath(key);
      const base = parts[0];
      const existing = map.get(base);
      if (!existing) return false;
      // remove nested path
      let cur = existing;
      const last = parts[parts.length - 1];
      const parentPath = parts.slice(0, -1);
      const parentObj = getAtPath(cur, parentPath);
      if (!parentObj || typeof parentObj !== 'object') return false;
      delete parentObj[last];
      map.set(base, cur);
      metaRegistry.set(nsKey(namespace, base), {
        key: base,
        namespace,
        createdAt: metaRegistry.get(nsKey(namespace, base))?.createdAt ?? now(),
        updatedAt: now(),
        sizeBytes: JSON.stringify(cur).length,
        permission: permissionRegistry.get(nsKey(namespace, base)),
      });
    } else {
      map.delete(key);
      metaRegistry.delete(nsKey(namespace, key));
      permissionRegistry.delete(nsKey(namespace, key));
    }

    if (isParent) parentStore.set(namespace, map);
    else childStore.set(namespace, map);

    if (storageAdapter) await persistNamespace(namespace);

    listeners.forEach(cb => cb({ type: 'remove', namespace, key }));
    return true;
  } catch (err) {
    return false;
  }
}

/* -------------------- Public API (sync wrappers using inference) -------------------- */

/**
 * inferNamespace
 * If caller doesn't provide a parentId / childId, attempt to infer:
 * - If there's a currently active parent in flowRegistry -> parent::<id>
 * - If the flowRegistry can detect a child (top active child) -> child::<childId>
 */
function inferNamespace(prefer: 'parent' | 'child' = 'parent'): {
  namespace: string | null;
  inferredId?: string | null;
} {
  // try to find top active parent first
  try {
    const topParent = flowRegistry.findTopParentWithActiveChild();
    if (topParent) {
      if (prefer === 'parent')
        return { namespace: `parent::${topParent}`, inferredId: topParent };
      // prefer child: see if registry has current child for this parent
      const currentChild = flowRegistry.getCurrentChild(topParent);
      if (currentChild)
        return {
          namespace: `child::${currentChild}`,
          inferredId: currentChild,
        };
      return { namespace: `parent::${topParent}`, inferredId: topParent };
    }

    // fallback: first top-level parent node
    const dbg = flowRegistry.debugTree();
    const top = (dbg.nodes || []).find((n: any) => n.parentId === null);
    if (top) return { namespace: `parent::${top.id}`, inferredId: top.id };
  } catch (err) {
    // swallow
  }
  return { namespace: null, inferredId: null };
}

/**
 * set(key, value, options?)
 * - key may be dot-path. Example: set('user.profile.name','Paschal') -> stored under base 'user' nested path
 * - options: { parentId?, childId?, scope?: 'parent'|'child', persist?: boolean, permission?: {mode, sharedWith, singleTarget, ttl} }
 * Returns the saved value (not boolean) or null on failure.
 */
export async function set(
  key: string,
  value: AnyValue,
  options?: {
    parentId?: string | null;
    childId?: string | null;
    scope?: 'parent' | 'child';
    persist?: boolean;
    permission?: {
      mode: PermissionMode;
      sharedWith?: string[];
      singleTarget?: string | null;
      ttl?: number | null;
    };
  },
): Promise<AnyValue | null> {
  try {
    // resolve namespace
    let namespace: string | null = null;
    if (options?.parentId) namespace = `parent::${options.parentId}`;
    else if (options?.childId) namespace = `child::${options.childId}`;
    else {
      // infer using prefer scope
      const prefer = options?.scope === 'child' ? 'child' : 'parent';
      namespace = inferNamespace(prefer).namespace;
    }
    if (!namespace) return null;

    // build permission record if provided
    let perm: PermissionRecord | undefined;
    if (options?.permission) {
      perm = {
        ...options.permission,
        ownerId:
          options.parentId ??
          options.childId ??
          inferNamespace('parent').inferredId ??
          'unknown',
        sharedWith: options.permission.sharedWith
          ? new Set(options.permission.sharedWith)
          : undefined,
        expiresAt: options.permission.ttl
          ? now() + (options.permission.ttl ?? 0)
          : null,
      };
      permissionRegistry.set(nsKey(namespace, key), perm);
    }

    // write through internal _set (persist handled by opts)
    const saved = await _set(namespace, key, value, {
      persist: !!options?.persist,
      permission: perm,
    });
    return saved;
  } catch (err) {
    return null;
  }
}

/**
 * get(key, options?)
 * - options: parentId?, childId?, requesterChildId? (for permission resolution)
 * Returns wrapped value object or { value: null, status: 'undefined'|'denied' }
 */
export async function get(
  key: string,
  options?: {
    parentId?: string | null;
    childId?: string | null;
    requesterChildId?: string | null;
  },
): Promise<{ wrapper: any | null; status: 'ok' | 'undefined' | 'denied' }> {
  try {
    let namespace: string | null = null;
    if (options?.parentId) namespace = `parent::${options.parentId}`;
    else if (options?.childId) namespace = `child::${options.childId}`;
    else {
      namespace = inferNamespace('parent').namespace;
    }
    if (!namespace) return { wrapper: null, status: 'undefined' };

    // permission enforcement: read permission evaluated against permissionRegistry entry
    const perm = permissionRegistry.get(nsKey(namespace, key));
    if (perm) {
      // check single target
      if (
        perm.singleTarget &&
        options?.requesterChildId &&
        perm.singleTarget !== options.requesterChildId
      ) {
        return { wrapper: null, status: 'denied' };
      }
      if (
        perm.sharedWith &&
        options?.requesterChildId &&
        !perm.sharedWith.has(options.requesterChildId)
      ) {
        return { wrapper: null, status: 'denied' };
      }
    }

    const res = await _get(namespace, key);
    if (res.status !== 'ok' || res.value === null)
      return { wrapper: null, status: res.status };

    // return wrapped value with helper methods
    const wrapped = makeWrapped(namespace, key, res.value);
    return { wrapper: wrapped, status: 'ok' };
  } catch (err) {
    return { wrapper: null, status: 'undefined' };
  }
}

/**
 * take(key, options?)
 * - obtains the value and removes it from store
 * - returns removed value or null
 */
export async function take(
  key: string,
  options?: { parentId?: string | null; childId?: string | null },
): Promise<AnyValue | null> {
  try {
    let namespace: string | null = null;
    if (options?.parentId) namespace = `parent::${options.parentId}`;
    else if (options?.childId) namespace = `child::${options.childId}`;
    else namespace = inferNamespace('parent').namespace;
    if (!namespace) return null;
    const existing = await _get(namespace, key);
    if (existing.status !== 'ok') return null;
    await _remove(namespace, key);
    return existing.value ?? null;
  } catch {
    return null;
  }
}

/**
 * keep(childScopedKey, value)
 * - shorthand to keep ephemeral per-child data; childId inferred when omitted
 * - returns saved value or null
 */
export async function keep(
  key: string,
  value: AnyValue,
  options?: { childId?: string | null; persist?: boolean },
): Promise<AnyValue | null> {
  try {
    const childId = options?.childId ?? inferNamespace('child').inferredId;
    if (!childId) return null;
    const ns = `child::${childId}`;
    const saved = await _set(ns, key, value, { persist: !!options?.persist });
    return saved;
  } catch {
    return null;
  }
}

/**
 * send(parentKey, value, toChildId)
 * - place a key in parent namespace but restrict to singleTarget childId
 * - returns saved value or null
 */
export async function send(
  key: string,
  value: AnyValue,
  toChildId: string,
  options?: { parentId?: string | null; persist?: boolean },
): Promise<AnyValue | null> {
  try {
    const parentId = options?.parentId ?? inferNamespace('parent').inferredId;
    if (!parentId) return null;
    const ns = `parent::${parentId}`;
    const perm: PermissionRecord = {
      mode: 'single',
      ownerId: parentId,
      singleTarget: toChildId,
      ttl: null,
      expiresAt: null,
    };
    permissionRegistry.set(nsKey(ns, key), perm);
    const saved = await _set(ns, key, value, {
      persist: !!options?.persist,
      permission: perm,
    });
    return saved;
  } catch {
    return null;
  }
}

/**
 * share(parentKey, value already exists) -> grant access to allowList (list of child names or ids)
 * - returns the stored value (if present) or null
 */
export async function share(
  key: string,
  allowList: string[],
  options?: { parentId?: string | null; persist?: boolean },
): Promise<AnyValue | null> {
  try {
    const parentId = options?.parentId ?? inferNamespace('parent').inferredId;
    if (!parentId) return null;
    const ns = `parent::${parentId}`;
    const perm: PermissionRecord = {
      mode: 'shared',
      ownerId: parentId,
      sharedWith: new Set(allowList),
      ttl: null,
      expiresAt: null,
    };
    permissionRegistry.set(nsKey(ns, key), perm);
    // return current value if any
    const res = await _get(ns, key);
    if (res.status !== 'ok') return null;
    return res.value ?? null;
  } catch {
    return null;
  }
}

/**
 * remove(key, options)
 * - returns the removed value (if found) otherwise null
 */
export async function remove(
  key: string,
  options?: { parentId?: string | null; childId?: string | null },
): Promise<AnyValue | null> {
  try {
    const parentId = options?.parentId ?? inferNamespace('parent').inferredId;
    const childId = options?.childId ?? inferNamespace('child').inferredId;
    const namespace = parentId
      ? `parent::${parentId}`
      : childId
      ? `child::${childId}`
      : null;
    if (!namespace) return null;
    const existing = await _get(namespace, key);
    if (existing.status !== 'ok') return null;
    await _remove(namespace, key);
    return existing.value ?? null;
  } catch {
    return null;
  }
}

/**
 * clear(namespaceOwnerId, scope)
 * - clears parent-level or child-level store
 * - returns true on success
 */
export async function clear(
  ownerId?: string | null,
  scope: 'parent' | 'child' = 'parent',
): Promise<boolean> {
  try {
    const inferred = inferNamespace(scope === 'parent' ? 'parent' : 'child');
    const id = ownerId ?? inferred.inferredId;
    if (!id) return false;
    const ns = scope === 'parent' ? `parent::${id}` : `child::${id}`;
    if (scope === 'parent') parentStore.delete(ns);
    else childStore.delete(ns);
    // remove meta & permissions for ns
    for (const k of Array.from(metaRegistry.keys())) {
      if (k.startsWith(ns + '::') || k.startsWith(ns + '::'))
        metaRegistry.delete(k);
    }
    for (const k of Array.from(permissionRegistry.keys())) {
      if (k.startsWith(nsKey(ns, ''))) permissionRegistry.delete(k);
    }
    if (storageAdapter) await storageAdapter.removeItem(ns).catch(() => {});
    listeners.forEach(cb => cb({ type: 'clear', namespace: ns }));
    return true;
  } catch {
    return false;
  }
}

/* ---------- Batch API ---------- */

export async function batch(
  parentId: string | null,
  batchKey: string,
  obj: Record<string, AnyValue>,
  options?: { persist?: boolean },
): Promise<Record<string, AnyValue> | null> {
  try {
    const pid = parentId ?? inferNamespace('parent').inferredId;
    if (!pid) return null;
    const ns = `parent::${pid}`;
    // store as normal key under _batch namespace
    const key = `_batch.${batchKey}`;
    await _set(ns, key, obj, { persist: !!options?.persist });
    listeners.forEach(cb => cb({ type: 'batch', namespace: ns, batchKey }));
    return obj;
  } catch {
    return null;
  }
}

export async function getBatch(
  parentId: string | null,
  batchKey: string,
): Promise<Record<string, AnyValue> | null> {
  try {
    const pid = parentId ?? inferNamespace('parent').inferredId;
    if (!pid) return null;
    const ns = `parent::${pid}`;
    const res = await _get(ns, `_batch.${batchKey}`);
    if (res.status !== 'ok') return null;
    return (res.value as Record<string, AnyValue>) ?? null;
  } catch {
    return null;
  }
}

export async function removeBatch(
  parentId: string | null,
  batchKey: string,
): Promise<boolean> {
  try {
    const pid = parentId ?? inferNamespace('parent').inferredId;
    if (!pid) return false;
    const ns = `parent::${pid}`;
    const r = await _remove(ns, `_batch.${batchKey}`);
    return !!r;
  } catch {
    return false;
  }
}

/* -------------------- Registry & Introspection -------------------- */

/**
 * stateRegistry() -> returns metadata snapshot
 */
export function stateRegistrySnapshot() {
  const nodes: Record<string, StateKeyMeta> = {};
  for (const [k, v] of metaRegistry.entries()) nodes[k] = v;
  const perms: Record<string, PermissionRecord> = {};
  for (const [k, v] of permissionRegistry.entries()) perms[k] = v;
  return {
    meta: nodes,
    permissions: perms,
    parentNamespaces: Array.from(parentStore.keys()),
    childNamespaces: Array.from(childStore.keys()),
  };
}

/* -------------------- Suggest / autocomplete engine -------------------- */

/**
 * suggest(prefix, options)
 * - returns candidate keys accessible to the caller. prefix can be 'cart.it' and will match 'cart.items' etc.
 * - options: parentId?, childId?, maxResults?
 *
 * Returns array of suggestion objects:
 *  { key: string, namespace: string, status: 'ok'|'undefined'|'denied' }
 */
export function suggest(
  prefix: string,
  options?: {
    parentId?: string | null;
    childId?: string | null;
    maxResults?: number;
  },
) {
  const parentId = options?.parentId ?? inferNamespace('parent').inferredId;
  const childId = options?.childId ?? inferNamespace('child').inferredId;
  const results: Array<{
    key: string;
    namespace: string;
    status: 'ok' | 'undefined' | 'denied';
  }> = [];

  // scan parent namespace keys first
  if (parentId) {
    const ns = `parent::${parentId}`;
    const pmap = parentStore.get(ns);
    if (pmap) {
      for (const k of pmap.keys()) {
        if (k.startsWith(prefix)) {
          const perm = permissionRegistry.get(nsKey(ns, k));
          const status: 'ok' | 'denied' =
            perm && perm.sharedWith && childId && !perm.sharedWith.has(childId)
              ? 'denied'
              : 'ok';
          results.push({ key: k, namespace: ns, status });
        }
      }
    }
  }

  // scan recent children across registry for cross-parent suggestions
  // also include global meta keys
  for (const k of metaRegistry.keys()) {
    const [ns, key] = k.split('::');
    if (key && key.startsWith(prefix)) {
      const perm = permissionRegistry.get(k);
      const status: 'ok' | 'denied' =
        perm && perm.sharedWith && childId && !perm.sharedWith.has(childId)
          ? 'denied'
          : 'ok';
      results.push({ key, namespace: ns, status });
    }
  }

  // unique and slice
  const dedup: Record<
    string,
    { key: string; namespace: string; status: 'ok' | 'undefined' | 'denied' }
  > = {};
  for (const r of results) dedup[`${r.namespace}::${r.key}`] = r;
  const arr = Object.values(dedup).slice(0, options?.maxResults ?? 50);
  return arr;
}

/* -------------------- Listeners & hook -------------------- */

export function onStateEvent(cb: (ev: StateEvent) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * useFlowState(childOrParentId?) - hook for components
 * - If childOrParentId omitted, inference is applied.
 * - returns an API with convenience methods bound to inferred namespace.
 */
export function useFlowState(childOrParentId?: string | null) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000); // coarse tick for UI; you can subscribe to onStateEvent for precise updates
    return () => clearInterval(id);
  }, []);

  // memoized helpers bound to the inferred id if provided
  const api = useMemo(() => {
    const inferredParent: string | null =
      inferNamespace('parent').inferredId ?? null;
    const inferredChild = inferNamespace('child').inferredId;

    const normalizedParent = inferredParent ?? null;

    // compute default namespace
    const nsInfo = childOrParentId
      ? childOrParentId.startsWith('parent::') ||
        childOrParentId.startsWith('child::')
        ? { namespace: childOrParentId, raw: childOrParentId }
        : {
            namespace: childOrParentId.startsWith('child:')
              ? `child::${childOrParentId}`
              : `parent::${childOrParentId}`,
            raw: childOrParentId,
          }
      : inferredParent
      ? { namespace: `parent::${inferredParent}`, raw: inferredParent }
      : inferredChild
      ? { namespace: `child::${inferredChild}`, raw: inferredChild }
      : { namespace: null, raw: null };

    return {
      // core
      set: (
        key: string,
        value: AnyValue,
        opts?: {
          scope?: 'parent' | 'child';
          persist?: boolean;
          permission?: any;
        },
      ) => {
        // determine owner id
        const resolvedScope = opts?.scope ?? 'parent';
        const owner =
          resolvedScope === 'parent'
            ? childOrParentId ?? inferredParent
            : childOrParentId ?? inferredChild;
        return set(key, value, {
          parentId:
            resolvedScope === 'parent' ? (owner as string | null) : undefined,
          childId:
            resolvedScope === 'child' ? (owner as string | null) : undefined,
          scope: resolvedScope,
          persist: !!opts?.persist,
          permission: opts?.permission,
        });
      },
      get: (key: string, opts?: { requesterChildId?: string | null }) =>
        get(key, {
          parentId: childOrParentId ?? inferredParent,
          childId: childOrParentId ?? inferredChild,
          requesterChildId: opts?.requesterChildId ?? inferredChild ?? null,
        }),
      take: (key: string) =>
        take(key, {
          parentId: childOrParentId ?? inferredParent,
          childId: childOrParentId ?? inferredChild,
        }),
      keep: (key: string, value: AnyValue) =>
        keep(key, value, { childId: childOrParentId ?? inferredChild }),
      send: (key: string, value: AnyValue, toChildId: string) =>
        send(key, value, toChildId, {
          parentId: childOrParentId ?? inferredParent,
        }),
      share: (key: string, allowList: string[]) =>
        share(key, allowList, { parentId: childOrParentId ?? inferredParent }),
      remove: (key: string) =>
        remove(key, {
          parentId: childOrParentId ?? inferredParent,
          childId: childOrParentId ?? inferredChild,
        }),
      clear: (scope: 'parent' | 'child' = 'parent', ownerId?: string | null) =>
        clear(
          ownerId ?? (scope === 'parent' ? inferredParent : inferredChild),
          scope,
        ),
      batch: (
        batchKey: string,
        obj: Record<string, AnyValue>,
        persist?: boolean,
      ) => batch(childOrParentId ?? inferredParent, batchKey, obj, { persist }),
      getBatch: (batchKey: string) =>
        getBatch(childOrParentId ?? inferredParent, batchKey),
      removeBatch: (batchKey: string) =>
        removeBatch(childOrParentId ?? inferredParent, batchKey),
      suggest: (prefix: string, opts?: { maxResults?: number }) =>
        suggest(prefix, {
          parentId: childOrParentId ?? inferredParent,
          childId: childOrParentId ?? inferredChild,
          maxResults: opts?.maxResults,
        }),
      registry: () => stateRegistrySnapshot(),
      on: (cb: (ev: StateEvent) => void) => onStateEvent(cb),
      persistAdapterRegistered: () => !!storageAdapter,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childOrParentId, tick]);

  return api;
}

/* -------------------- Export default -------------------- */

const FlowState = {
  set,
  get,
  take,
  keep,
  send,
  share,
  remove,
  clear,
  batch,
  getBatch,
  removeBatch,
  suggest,
  stateRegistrySnapshot,
  onStateEvent,
  useFlowState,
  registerStorageAdapter,
};

export default FlowState;
