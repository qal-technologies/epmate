import React, {useState, useEffect, useRef} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated as Anime, Dimensions} from 'react-native';
import {flowRegistry} from './core/FlowRegistry';
import {useFlowRuntime} from './core/FlowRuntime';
import {MaterialIcons} from '@expo/vector-icons';
import Animated, {SlideInDown, SlideInRight, SlideOutRight} from 'react-native-reanimated';

const {width, height} = Dimensions.get('window');

type LogEntry = {
  id: string;
  timestamp: number;
  type: 'event' | 'error';
  message: string;
  details?: any;
};

export const FlowDebugOverlay = () => {

  if(!__DEV__) return null;

  const runtime = useFlowRuntime();
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'nodes' | 'logs'>('nodes');
  const [, setTick] = useState(0);

  // Animation for panel
  const slideAnim = useRef(new Anime.Value(height)).current;

  useEffect(() => {
    const unsub = flowRegistry.subscribe(() => setTick(t => t + 1));

    // Subscribe to runtime events for logging
    // Note: FlowRuntime doesn't have a global subscribe, but we can listen to specific nodes.
    // Ideally FlowRuntime should expose a global listener or we just poll/hook into notify.
    // For now, we'll just track registry updates.

    return unsub;
  }, []);

  useEffect(() => {
    Anime.timing(slideAnim, {
      toValue: expanded ? 0 : height,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const nodes = flowRegistry.getAllNodes();
  const activeRoot = runtime.getActiveRoot();

  const renderNodes = () => (
    <ScrollView style={styles.scroll}>
      <Text style={styles.sectionHeader}>Active Root: <Text style={styles.value}>{activeRoot || 'None'}</Text></Text>
      <Text style={styles.sectionHeader}>Registered Nodes ({nodes.length})</Text>
      {nodes.map(node => {
        const activeChild = runtime.getActive(node.id);
        const flags = runtime.getFlags(node.id);
        const isOpening = flags.opening;
        const isSwitching = flags.switching;

        return (
          <View key={node.id} style={styles.nodeCard}>
            <View style={styles.nodeHeader}>
              <Text style={styles.nodeType}>{node.type.toUpperCase()}</Text>
              <Text style={styles.nodeId}>{node.id}</Text>
            </View>
            <Text style={styles.nodeDetail}>Parent: {node.parentId || 'Root'}</Text>
            {activeChild && (
              <Text style={styles.activeChild}>Active: {activeChild.name}</Text>
            )}
            <View style={styles.flagsRow}>
              {isOpening && <Text style={styles.flag}>OPENING</Text>}
              {isSwitching && <Text style={styles.flag}>SWITCHING</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderLogs = () => (
    <ScrollView style={styles.scroll}>
      <Text style={styles.sectionHeader}>Event Log</Text>
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>No events captured yet.</Text>
      ) : (
        logs.map(log => (
          <View key={log.id} style={[styles.logEntry, log.type === 'error' && styles.errorLog]}>
            <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</Text>
            <Text style={styles.logMessage}>{log.message}</Text>
            {log.details && (
              <Text style={styles.logDetails}>{JSON.stringify(log.details, null, 2)}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Floating Button */}
      {!expanded && (
        <Animated.View style={styles.fab} entering={SlideInRight} onTouchEnd={toggleExpand} exiting={SlideOutRight}>
          <MaterialIcons name="bug-report" size={24} color="white" />
        </Animated.View>
      )}

      {/* Expanded Panel */}
      <Anime.View
        style={[
          styles.panel,
          {transform: [{translateY: slideAnim}]}
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Flow Debugger</Text>
          <TouchableOpacity onPress={toggleExpand} style={styles.closeBtn}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nodes' && styles.activeTab]}
            onPress={() => setActiveTab('nodes')}
          >
            <Text style={[styles.tabText, activeTab === 'nodes' && styles.activeTabText]}>Nodes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
            onPress={() => setActiveTab('logs')}
          >
            <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>Logs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'nodes' ? renderNodes() : renderLogs()}
        </View>
      </Anime.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  panel: {
    width: '100%',
    height: '60%',
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#bb86fc',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    
  },
  activeTabText: {
    color: '#bb86fc',
  },
  content: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  value: {
    color: 'white',
    fontWeight: 'bold',
  },
  nodeCard: {
    backgroundColor: '#2c2c2c',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nodeType: {
    fontSize: 10,
    color: '#03dac6',
    fontWeight: 'bold',
    marginRight: 8,
    backgroundColor: 'rgba(3, 218, 198, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeId: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  nodeDetail: {
    color: '#bbb',
    fontSize: 12,
  },
  activeChild: {
    color: '#bb86fc',
    fontSize: 12,
    marginTop: 4,
  },
  flagsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  flag: {
    fontSize: 10,
    color: '#cf6679',
    marginRight: 8,
    fontWeight: 'bold',
  },
  logEntry: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#2c2c2c',
    borderRadius: 4,
  },
  errorLog: {
    borderLeftWidth: 3,
    borderLeftColor: '#cf6679',
  },
  logTime: {
    color: '#666',
    fontSize: 10,
    marginBottom: 2,
  },
  logMessage: {
    color: '#ddd',
    fontSize: 12,
  },
  logDetails: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 20,
    textAlign: 'center',
  },
});
