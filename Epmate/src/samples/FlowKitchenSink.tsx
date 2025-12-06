import React from 'react';
import {View, Text, Button, StyleSheet, ScrollView, Switch} from 'react-native';
import {useFlow} from '../flows';
import {setShared} from 'flows/core/state/FlowStateManager';

// --- Components ---
const Flow = useFlow();

// Builder Pattern Example
//  Flow.create('page')
//     .named('BuilderFlow')
//     .child('Step1', (
//       <View style={styles?.center}>
//         <Text style={styles?.title}>Builder Pattern Step 1</Text>
//         <Button title="Next Step" onPress={() => Flow.nav().next()} />
//       </View>
//     ))
//     .child('Step2', (
//       <View style={styles?.center}>
//         <Text style={styles?.title}>Builder Pattern Step 2</Text>
//         <Button title="Finish" onPress={() => Flow.nav().close()} />
//       </View>
//     ))
//     .props({title: 'Builder Flow Demo'})
//     .build();

const KitchenSinkHome = () => {
  const nav = Flow.nav();
  const {setShared, getShared} = Flow.state();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Flow Kitchen Sink</Text>
      <Text style={styles.subHeader}>Comprehensive Feature Demo {getShared('globalCounter') || 'none'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation</Text>
        <Button title="Open Modal Flow" onPress={() => nav.open('DemoModal')} />
        <View style={styles.spacer} />
        <Button title="Open Nested Page" onPress={() => nav.open('NestedFlow')} />
        <View style={styles.spacer} />
        {/* <Button title="Switch to Auth Pack" onPress={() => nav.switchRoot('AuthPack')} /> */}
        {/* <Button title="Switch to Auth Pack" onPress={() => nav.switchRoot('DashboardPack')} /> */}
        <View style={styles.spacer} />
        <Button title="Open Builder Flow" onPress={() => nav.open('BuilderFlow')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>State Management</Text>
        <Button
          title="Set Global State"
          onPress={() => setShared('globalCounter', Math.floor(Math.random() * 100))}
        />
      </View>
    </ScrollView>
  );
};

const DemoModalStep1 = () => {
  const nav = Flow.nav();
  const {props, setProps} = Flow.props<{title: string; count: number;}>();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{props.title || 'Modal Step 1'}</Text>
      <Text>Count Prop: {props.count || 0}</Text>
      <Button title="Increment Prop" onPress={() => setProps({count: (props.count || 0) + 1})} />
      <View style={styles.spacer} />
      <Button title="Next Step" onPress={() => nav.next()} />
    </View>
  );
};

const DemoModalStep2 = () => {
  const nav = Flow.nav();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Modal Step 2</Text>
      <Button title="Close Modal" onPress={() => nav.close()} />
    </View>
  );
};

const NestedPage1 = () => {
  const nav = Flow.nav();
  const {parentProps, setParentProps} = Flow.parentProps();
  const {props, setProps} = Flow.props();
  const {getShared, get } = Flow.state();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Nested Page 1</Text>
      <Text>Parent Name: {parentProps.theme}</Text>
      <Text>Child Title: {props.title}</Text>
      <Text>{getShared('globalCounter')}</Text>
      <Button
        title="Change Parent Title & theme"
        onPress={() => setParentProps({name: 'Updated Nested Parent', theme: 'dark'})}
      />

      <Button
        title="Change Child Title"
        onPress={() => setProps({title: 'Updated child title', noTitle: false})}
      />
      <View style={styles.spacer} />
      <Button title="Go Deeper" onPress={() => nav.next()} />
    </View>
  );
};

const NestedPage2 = () => {
  const nav = Flow.nav();
  const {parentProps, setParentProps} = Flow.parentProps();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Nested Page 2</Text>

      <Text>Parent Name: {parentProps.name}</Text>
      <Text>Parent Theme: {parentProps.theme}</Text>
      <Button title="Go Back" onPress={() => nav.prev()} />
    </View>
  );
};

// --- Flow Definition ---

export const FlowKitchenSink = () => {
  return (
    <Flow.Pack name="KitchenSinkPack" initial="Main">

      {/* Main Flow */}
      <Flow.Parent name="Main" initial="Home" >
        <Flow.FC name="Home" page={<KitchenSinkHome />} title="Kitchen Sink" />

        {/* Nested Flow (Inline) */}
        <Flow.FC name="NestedFlow" page={
          <Flow.Parent name="NestedParent" initial="Page1">
            <Flow.FC name="Page1" page={<NestedPage1 />} title="Nested 1" />
            <Flow.FC name="Page2" page={<NestedPage2 />} title="Nested 2" />
          </Flow.Parent>
        } />
      </Flow.Parent>

      {/* Modal Flow (Overlay) */}
      <Flow.Parent name="DemoModal" type="modal" initial="Step1">
        <Flow.FC name="Step1" page={<DemoModalStep1 />} title="Modal Start" />
        <Flow.FC name="Step2" page={<DemoModalStep2 />} title="Modal End" />
      </Flow.Parent>

    </Flow.Pack>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  spacer: {
    height: 15,
  },
});
