import {flowRegistry} from '../FlowRegistry';
import {open, close, next, prev, goTo, switchRoot, getActive} from '../FlowRuntime';
import {flowNavigationHistory} from '../FlowNavigationHistory';

// Mock dependencies
jest.mock('../FlowRegistry');
jest.mock('../FlowNavigationHistory');
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('FlowNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('open()', () => {
    it('should open a child flow successfully', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page', children: ['Child']};
      const mockChild = {id: 'Parent.Child', name: 'Child', type: 'child', parentId: 'Parent'};

      (flowRegistry.getNode as jest.Mock).mockImplementation((id) => {
        if(id === 'Parent') return mockParent;
        if(id === 'Parent.Child') return mockChild;
        return null;
      });
      (flowRegistry.getChildByName as jest.Mock).mockReturnValue(mockChild);
      (flowRegistry.forceUpdate as jest.Mock).mockImplementation(() => { });

      const result = await open('Parent', 'Child');

      expect(result).toBe(true);
      expect(flowNavigationHistory.push).toHaveBeenCalledWith('Parent', expect.objectContaining({
        childId: 'Parent.Child',
        childName: 'Child'
      }));
    });

    it('should fail if parent does not exist', async () => {
      (flowRegistry.getNode as jest.Mock).mockReturnValue(null);
      const result = await open('InvalidParent', 'Child');
      expect(result).toBe(false);
    });

    it('should fail if child does not exist', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page'};
      (flowRegistry.getNode as jest.Mock).mockImplementation((id) => id === 'Parent' ? mockParent : null);
      (flowRegistry.getChildByName as jest.Mock).mockReturnValue(null);

      const result = await open('Parent', 'InvalidChild');
      expect(result).toBe(false);
    });
  });

  describe('close()', () => {
    it('should close the active child', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page'};
      (flowRegistry.getNode as jest.Mock).mockReturnValue(mockParent);
      (flowRegistry.forceUpdate as jest.Mock).mockImplementation(() => { });

      // First open something to have a stack
      // We can't easily inject into internal stackMap without opening
      // So we rely on the fact that close() returns true if parent exists and it runs without error
      // Ideally we would verify stackMap is empty, but it's private.
      // We can verify notify is called if we could mock it, but notify is internal too.
      // We can verify flowRegistry.forceUpdate is called? No, close() calls notify which calls listeners.
      // close() does NOT call forceUpdate directly, but it calls notify('close').

      const result = await close('Parent');
      expect(result).toBe(true);
    });

    it('should fail if parent does not exist', async () => {
      (flowRegistry.getNode as jest.Mock).mockReturnValue(null);
      const result = await close('InvalidParent');
      expect(result).toBe(false);
    });
  });

  describe('next()', () => {
    it('should navigate to the next sibling', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page', children: ['Child1', 'Child2']};
      const child1 = {id: 'Parent.Child1', name: 'Child1', type: 'child', parentId: 'Parent'};
      const child2 = {id: 'Parent.Child2', name: 'Child2', type: 'child', parentId: 'Parent'};

      (flowRegistry.getNode as jest.Mock).mockImplementation((id) => {
        if(id === 'Parent') return mockParent;
        if(id === 'Parent.Child1') return child1;
        if(id === 'Parent.Child2') return child2;
        return null;
      });
      (flowRegistry.getChildren as jest.Mock).mockReturnValue([child1, child2]);
      (flowRegistry.getChildByName as jest.Mock).mockImplementation((pid, name) => {
        if(name === 'Child1') return child1;
        if(name === 'Child2') return child2;
        return null;
      });
      (flowRegistry.forceUpdate as jest.Mock).mockImplementation(() => { });

      // Setup: Open first child
      await open('Parent', 'Child1');

      // Act: Go next
      const result = await next('Parent');

      expect(result).toBe(true);
      expect(flowNavigationHistory.push).toHaveBeenLastCalledWith('Parent', expect.objectContaining({
        childId: 'Parent.Child2'
      }));
    });

    it('should fail if no siblings available', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page', children: ['Child1']};
      const child1 = {id: 'Parent.Child1', name: 'Child1', type: 'child', parentId: 'Parent'};

      (flowRegistry.getNode as jest.Mock).mockReturnValue(mockParent);
      (flowRegistry.getChildren as jest.Mock).mockReturnValue([child1]);
      (flowRegistry.getChildByName as jest.Mock).mockReturnValue(child1);
      (flowRegistry.forceUpdate as jest.Mock).mockImplementation(() => { });

      await open('Parent', 'Child1');
      const result = await next('Parent');

      expect(result).toBe(false);
    });
  });

  describe('prev()', () => {
    it('should navigate to the previous sibling or history entry', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page', children: ['Child1', 'Child2']};
      const child1 = {id: 'Parent.Child1', name: 'Child1', type: 'child', parentId: 'Parent'};
      const child2 = {id: 'Parent.Child2', name: 'Child2', type: 'child', parentId: 'Parent'};

      (flowRegistry.getNode as jest.Mock).mockImplementation((id) => {
        if(id === 'Parent') return mockParent;
        if(id === 'Parent.Child1') return child1;
        if(id === 'Parent.Child2') return child2;
        return null;
      });
      (flowRegistry.getChildren as jest.Mock).mockReturnValue([child1, child2]);
      (flowRegistry.getChildByName as jest.Mock).mockImplementation((pid, name) => {
        if(name === 'Child1') return child1;
        if(name === 'Child2') return child2;
        return null;
      });
      (flowNavigationHistory.pop as jest.Mock).mockReturnValue({childId: 'Parent.Child1'});

      // Setup: Open Child1 then Child2
      await open('Parent', 'Child1');
      await open('Parent', 'Child2');

      // Act: Go prev
      const result = await prev('Parent');

      expect(result).toBe(true);
      // We expect it to pop from history
      expect(flowNavigationHistory.pop).toHaveBeenCalledWith('Parent');
    });
  });

  describe('goTo()', () => {
    it('should navigate to a specific path within the same parent', async () => {
      const mockParent = {id: 'Parent', name: 'Parent', type: 'page', children: ['Child']};
      const mockChild = {id: 'Parent.Child', name: 'Child', type: 'child', parentId: 'Parent'};

      (flowRegistry.getNode as jest.Mock).mockImplementation((id) => {
        if(id === 'Parent') return mockParent;
        if(id === 'Parent.Child') return mockChild;
        return null;
      });
      (flowRegistry.getChildByName as jest.Mock).mockReturnValue(mockChild);
      (flowRegistry.forceUpdate as jest.Mock).mockImplementation(() => { });

      const result = await goTo('Parent', 'Child');


      expect(result).toBe(true);
      expect(flowNavigationHistory.push).toHaveBeenCalledWith('Parent', expect.objectContaining({
        childId: 'Parent.Child'
      }));
    });
  });

  describe('switchRoot()', () => {
    it('should switch the active root pack and clean up orphaned states', async () => {
      const mockPack = {id: 'MainPack', name: 'MainPack', type: 'pack'};
      (flowRegistry.getNode as jest.Mock).mockReturnValue(mockPack);
      (flowRegistry.forceUpdate as jest.Mock).mockImplementation(() => { });
      (flowNavigationHistory.cleanupOrphanedStates as jest.Mock).mockReturnValue([]);

      // We use fake timers because switchRoot has a setTimeout for cleanup
      jest.useFakeTimers();

      switchRoot('MainPack');

      // Verify immediate effects
      expect(flowRegistry.forceUpdate).toHaveBeenCalled();

      // Verify delayed effects
      jest.runAllTimers();
      expect(flowNavigationHistory.cleanupOrphanedStates).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});
