import React from 'react';
import {View, Text, Button, StyleSheet, ScrollView, Switch} from 'react-native';
import {useFlow} from '../flows';
import {MaterialIcons} from '@expo/vector-icons';
import {TextInput} from 'react-native-paper';

// --- Components ---
const Flow = useFlow();

// ============ HOME SCREENS ============

const KitchenSinkHome = () => {
  const nav = Flow.nav();
  const {setShared, getShared} = Flow.state();
  const {props} = Flow.props<{dynamicTitle?: string;}>();

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.header}>Flow Kitchen Sink</Text>
      <Text style={styles.subHeader}>Comprehensive Feature Demo</Text>
      <Text>Global Counter: {getShared('globalCounter') || 'none'}</Text>
      <Text>Dynamic Title: {props.dynamicTitle || 'Not Set'}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Navigation Tests</Text>
        <Button title="Open Modal Flow (Overlay)" onPress={() => nav.open('DemoModal')} />
        <View style={styles.spacer} />
        <Button title="Open Nested Flow" onPress={() => nav.open('NestedFlow')} />
        <View style={styles.spacer} />
        <Button title="Open hideTab Test" onPress={() => nav.open('HideTabTest')} />
        <View style={styles.spacer} />
        {/* <Button title="Replace with Settings Tab" onPress={() => nav.switchRoot('KitchenSinkPack')} /> */}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pack Navigation</Text>
        <Button title="Switch to Auth Pack" onPress={() => nav.switchRoot('AuthPack')} />
        <View style={styles.spacer} />
        <Button title="Switch to Dashboard Pack" onPress={() => nav.switchRoot('DashboardPack')} />
        <View style={styles.spacer} />
        <Button title="Switch to Main Pack" onPress={() => nav.switchRoot('MainPack')} />
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

// ============ TITLE CHANGE TEST ============

const TitleChangeTest = () => {
  const nav = Flow.nav();
  const {set, get} = Flow.state();
  const {props, setProps} = Flow.props<{title?: string;}>();
  const {parentProps, setParentProps} = Flow.parentProps();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Title Change Test</Text>
      <Text>Current Title: {props.title || 'Not set'}</Text>
      <Text>Local Text State: {get('localText', 'Text Not Set')}</Text>

      <View style={styles.spacer} />
      <Button
        title="Change Own Title"
        onPress={() => setProps({title: `Title ${Date.now() % 1000}`})}
      />
      <View style={styles.spacer} />
      <Button
        title="Change Parent Title"
        onPress={() => setParentProps({title: `Parent ${Date.now() % 1000}`})}
      />
      <View style={styles.spacer} />
      <Button
        title="Change Local Text (should NOT re-animate)"
        onPress={() => set('localText', `Text ${Date.now() % 10000}`)}
      />
      <View style={styles.spacer} />
      <Button title="Go Back" onPress={() => nav.prev()} />
    </View>
  );
};

// ============ MODAL SCREENS ============

const DemoModalStep1 = () => {
  const nav = Flow.nav();
  const {props, setProps} = Flow.props<{title: string; count: number;}>();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{props.title || 'Modal Step 1'}</Text>
      <Text>This modal should overlay on top of the previous page!</Text>
      <Text>Count Prop: {props.count || 0}</Text>
      <View style={styles.spacer} />
      <Button title="Increment Prop" onPress={() => setProps({count: (props.count || 0) + 1})} />
      <View style={styles.spacer} />
      <Button title="Next Step" onPress={() => nav.next()} />
      <View style={styles.spacer} />
      <Button title="Close Modal" onPress={() => nav.close()} />
    </View>
  );
};

const DemoModalStep2 = () => {
  const nav = Flow.nav();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Modal Step 2</Text>
      <Text>Tab bar should be hidden behind this modal!</Text>
      <Button title="Close Modal" onPress={() => nav.close()} />
    </View>
  );
};

// ============ NESTED SCREENS ============

const NestedPage1 = () => {
  const nav = Flow.nav();
  const {parentProps, setParentProps} = Flow.parentProps();
  const {props, setProps} = Flow.props();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Nested Page 1</Text>
      <Text>Parent Theme: {parentProps.theme}</Text>
      <Text>Child Title: {props.title}</Text>

      <View style={styles.spacer} />
      <Button
        title="Change Parent Theme to Dark"
        onPress={() => setParentProps({theme: 'dark'})}
      />
      <View style={styles.spacer} />
      <Button
        title="Change Child Title"
        onPress={() => setProps({title: `Updated ${Date.now() % 1000}`})}
      />
      <View style={styles.spacer} />
      <Button title="Go Deeper" onPress={() => nav.next()} />
    </View>
  );
};

const NestedPage2 = () => {
  const nav = Flow.nav();
  const {parentProps} = Flow.parentProps();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Nested Page 2</Text>
      <Text>Parent Theme: {parentProps.theme}</Text>
      <View style={styles.spacer} />
      <Button title="Go Back" onPress={() => nav.prev()} />
    </View>
  );
};

// ============ HIDETAB TEST ============

const HideTabTestPage = () => {
  const nav = Flow.nav();
  return (
    <View style={styles.center}>
      <Text style={styles.title}>HideTab Test</Text>
      <Text>The tab bar should be hidden on this page!</Text>
      <Text>(hideTab=true is set on this FC)</Text>
      <View style={styles.spacer} />
      <Button title="Go Back" onPress={() => nav.prev()} />
      <Button title="Close Tab" onPress={() => nav.closeTab()} />
      <Button title="Open Tab" onPress={() => nav.openTab()} />
    </View>
  );
};

// ============ SETTINGS TAB ============

const SettingsPage = () => {
  const nav = Flow.nav();
  const {props, setProps} = Flow.props<{title?: string;}>();

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Settings</Text>
      <Text>Current Title: {props.title || 'Settings'}</Text>
      <View style={styles.spacer} />
      <Button
        title="Change My Title"
        onPress={() => setProps({title: `Settings ${Date.now() % 1000}`})}
      />
      <Button
        title="Change my hideTab"
        onPress={() => setProps({hideTab: !props.hideTab})}
      />
      <View style={styles.spacer} />
      <Button title="Open Title Change Test" onPress={() => nav.open('TitleTest')} />
    </View>
  );
};

// ============ PROFILE TAB WITH CUSTOM ICON ============

const ProfilePage = () => {
  return (
    <View style={styles.center}>
      <Text style={styles.title}>Profile</Text>
      <Text>This tab uses a custom icon function!</Text>
    </View>
  );
};

// ============ FLOW DEFINITION ============

export const FlowKitchenSink = () => {
  return (
    <Flow.Pack
      name="KitchenSinkPack"
      initial="Home"
      navType='tab'
      tabStyle={{
        borderRadius: 'curved',
        withShadow: true,
        animate: true,
        hideOnScroll: true,
        position: 'bottom',
        spaceTop: 20,
        width: 'endSpace',
        containerBgColor: 'white',
        type: 'overlay',
      }}
      iconStyle={{
        textOnly: true,
        allCaps: true,
        textSize: 12,
        textPadding: 10,
      }}
    >

      {/* Main Home Tab */}
      <Flow.Parent name="Home" initial="Home" icon='home' >
        <Flow.FC name="Home" page={<KitchenSinkHome />} title="Kitchen Sink" />

        {/* Nested Flow */}
        <Flow.FC name="NestedFlow" page={
          <Flow.Parent name="NestedParent" initial="Page1" hideTab headerConfig={{
            titlePosition: 'left',
            headerBottom: <TextInput placeholder='Testing' style={{
              width: '100%', padding: 10, borderWidth: 1, borderColor: 'red',
            }}
            />,
            headerStyle: {
              backgroundColor: 'red'
            },
            noBackBtn: true,
          }}>
            <Flow.FC name="Page1" page={<NestedPage1 />} title="Nested 1" />
            <Flow.FC name="Page2" page={<NestedPage2 />} title="Nested 2" />
          </Flow.Parent>
        } />

        {/* HideTab Test */}
        <Flow.FC name="HideTabTest" page={<HideTabTestPage />} title="HideTab Test" hideTab />
      </Flow.Parent>

      {/* Settings Tab */}
      <Flow.Parent name="Settings" initial="SettingsMain" icon='settings' headerConfig={{
        titlePosition: 'left',
        headerBottom: <TextInput placeholder='Testing' style={{
          width: '100%', padding: 10, borderWidth: 1, borderColor: 'red',
        }}
        />,
        headerStyle: {
          backgroundColor: 'red'
        },
        noBackBtn: true,
      }} navType='tab'
      >
        <Flow.FC name="SettingsMain" page={<SettingsPage />} title="Settings 55" />
        <Flow.FC name="TitleTest" page={<TitleChangeTest />} title="Title Test" />
      </Flow.Parent>

      {/* Profile Tab with Custom Icon */}
      <Flow.Parent
        name="Profile"
        initial="ProfileMain"
        icon={({size, color}) => (
          <MaterialIcons name="person" size={size} color={color} />
        )}
        headerConfig={{
          titlePosition: 'left',
          headerBottom: <TextInput placeholder='Testing' style={{
            width: '100%', padding: 10, borderWidth: 1, borderColor: 'red',
          }}
          />,
          headerStyle: {
            backgroundColor: 'red'
          },
          noBackBtn: true,
        }}
      >
        <Flow.FC name="ProfileMain" page={<ProfilePage />} title="Profile"  headerConfig={{
          titlePosition: 'left',
          headerBottom: <TextInput placeholder='Testing' style={{
            width: '100%', padding: 10, borderWidth: 1, borderColor: 'red',
          }}
          />,
          headerStyle: {
            backgroundColor: 'red'
          },
          noBackBtn: true,
        }}/>
      </Flow.Parent>

      {/* Modal Flow (Overlay) */}
      <Flow.Parent name="DemoModal" type="modal" initial="Step1" icon='book' headerConfig={{
        titlePosition: 'left',
        headerBottom: <TextInput placeholder='Testing' style={{
          width: '100%', padding: 10, borderWidth: 1, borderColor: 'red',
        }}
        />,
        headerStyle: {
          backgroundColor: 'red'
        },
        noBackBtn: true,
      }}>
        <Flow.FC name="Step1" page={<DemoModalStep1 />} title="Modal Start" size="half" modal />
        <Flow.FC name="Step2" page={<DemoModalStep2 />} title="Modal End" size="half" modal />
      </Flow.Parent>


      <Flow.Parent name="FF" initial="Home" icon='home' headerConfig={{
        titlePosition: 'left',
        headerBottom: <TextInput placeholder='Testing' style={{
          width: '100%', padding: 10, borderWidth: 1, borderColor: 'red',
        }}
        />,
        headerStyle: {
          backgroundColor: 'red'
        },
        noBackBtn: true,
      }}>
        <Flow.FC name="Home" page={<KitchenSinkHome />} title="Kitchen Sink" />

        {/* Nested Flow */}
        <Flow.FC name="NestedFlow" page={
          <Flow.Parent name="NestedParent" initial="Page1" type='modal' >
            <Flow.FC name="Page1" page={<NestedPage1 />} title="Nested 1" />
            <Flow.FC name="Page2" page={<NestedPage2 />} title="Nested 2" />
          </Flow.Parent>
        } />

        {/* HideTab Test */}
        <Flow.FC name="HideTabTest" page={<HideTabTestPage />} title="HideTab Test" hideTab />
      </Flow.Parent>
    </Flow.Pack>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
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
