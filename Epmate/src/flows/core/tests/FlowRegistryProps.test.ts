import { flowRegistry } from '../FlowRegistry';

describe('FlowRegistry Prop Updates', () => {
  beforeEach(() => {
    // Reset registry before each test
    (flowRegistry as any).nodes.clear();
    (flowRegistry as any).tree.clear();
    (flowRegistry as any).listeners.clear();
  });

  it('should update node props and notify listeners', () => {
    const nodeId = 'test-node';
    flowRegistry.registerNode({
      id: nodeId,
      name: 'TestNode',
      type: 'page',
      props: { title: 'Initial Title' },
    });

    let notifyCount = 0;
    flowRegistry.subscribe(() => {
      notifyCount++;
    });

    const success = flowRegistry.updateNodeProps(nodeId, { title: 'Updated Title' });

    expect(success).toBe(true);
    expect(flowRegistry.getNode(nodeId)?.props.title).toBe('Updated Title');
    expect(notifyCount).toBe(1);
  });

  it('should merge props correctly', () => {
    const nodeId = 'test-node-merge';
    flowRegistry.registerNode({
      id: nodeId,
      name: 'TestNode',
      type: 'page',
      props: { title: 'Initial', color: 'red' },
    });

    flowRegistry.updateNodeProps(nodeId, { title: 'Updated' });

    const props = flowRegistry.getNode(nodeId)?.props;
    expect(props.title).toBe('Updated');
    expect(props.color).toBe('red'); // Should persist
  });

  it('should return false for unknown nodes', () => {
    const success = flowRegistry.updateNodeProps('unknown-id', { title: 'New' });
    expect(success).toBe(false);
  });
});
