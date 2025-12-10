import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Button, TouchableOpacity, Alert} from 'react-native';
import {Flow, FlowNavigator, useFlowNav, useFlowTheme, useFlowProps, useFlowState, useFlowParentProps} from '@flows';



/**
 * FlowEnhancedTest - Comprehensive test sample for all FlowNavigator enhancements
 * 
 * Tests:
 * - Auto-open with if/open props
 * - Universal restrictions on all levels
 * - Tab navigation with hideOnScroll
 * - Drawer navigation with positions
 * - Theme getter/setter with immediate reactivity
 * - Modal with onDrag callback
 */

// Test page components
const HomePage = () => {
    const nav = useFlowNav();
    const {setTheme, theme, resolvedTheme} = useFlowTheme();

    return (
        <ScrollView style={[styles.page, {backgroundColor: resolvedTheme.bgColor}]}>
            <Text style={[styles.title, {color: resolvedTheme.text}]}>Home</Text>
            <Text style={styles.subtitle}>Current theme: {typeof theme === 'string' ? theme : 'custom'}</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Theme Tests</Text>
                <Button title="Set Dark Theme" onPress={() => setTheme('dark')} />
                <Button title="Set Light Theme" onPress={() => setTheme('light')} />
                <Button
                    title="Set Custom Theme"
                    onPress={() => setTheme({bgColor: '#1a237e', text: '#fff', custom: 'value'})}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pack Navigation</Text>
                <Button title="Switch to Auth Pack" onPress={() => nav.switchRoot('AuthPack')} />
                <Button title="Switch to Dashboard Pack" onPress={() => nav.switchRoot('DashboardPack')} />
                <Button title="Switch to FlowKitchenSink Pack" onPress={() => nav.switchRoot('KitchenSinkPack')} />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Navigation Tests</Text>
                <Button title="Go to Settings" onPress={() => nav.open('Settings')} />
                <Button title="Go to Profile" onPress={() => nav.open('Profile')} />
                <Button title="Open Modal" onPress={() => nav.open('TestModal')} />
            </View>
        </ScrollView>
    );
};

const SettingsPage = () => {
    const nav = useFlowNav();
    const {props, setProps} = useFlowProps();
    const {parentProps, setParentProps} = useFlowParentProps();
    const {get, set} = useFlowState();
    const restricted = get('restricted', false);

    if(props.onSwitching) {
        setProps({
            onSwitching: (dir: any) => {
                const run: any = Alert.alert('switching from: ', dir || 'Somewhere');
                return run;
            }
        });
    }

    return (
        <ScrollView style={styles.page}>
            <Text style={styles.title}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Restriction Test</Text>
                <Text>Restricted Out: {restricted ? 'Yes' : 'No'}</Text>
                <Button
                    title={restricted ? 'Remove Restriction' : 'Add Restriction'}
                    onPress={() => {
                        set('restricted', !restricted);
                        setProps({isRestrictedOut: !restricted ? {title: 'my App says', message: 'You are restricted out'} : false});
                    }}
                />

            </View>

            <View style={styles.section}>
                <Text>Current Title: {props.title || 'Not set'}</Text>
                <Text>Local Text State: {get('localText', 'Text Not Set') }</Text>

                <Button
                    title="Change Own Title"
                    onPress={() => setProps({title: `Title ${Date.now() % 1000}`})}
                />
                <Button
                    title="Change Parent Title"
                    onPress={() => setParentProps({title: `Parent ${Date.now() % 1000}`})}
                />
                <Button
                    title="Change Local Text (should NOT re-animate)"
                    onPress={() => set('localText', `Text ${Date.now() % 10000}`)}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Auto-Open Test</Text>
                <Button title="Open with if=true" onPress={() => nav.open('AutoOpenChild')} />


                <Button title="Close Tab" onPress={() => nav.closeTab()} />
                <Button title="Open Tab" onPress={() => nav.openTab()} />
            </View>

            <Button title="Go Back" onPress={() => nav.prev()} />
        </ScrollView>
    );
};

const ProfilePage = () => {
    const nav = useFlowNav();
    const {resolvedTheme} = useFlowTheme();

    return (
        <View style={[styles.page, {backgroundColor: resolvedTheme.bgColor}]}>
            <Text style={[styles.title, {color: resolvedTheme.text}]}>Profile</Text>
            <Text style={{color: resolvedTheme.text}}>
                Theme is reactive - changes reflect immediately!
            </Text>
            <Button title="Go Back" onPress={() => nav.prev()} />
        </View>
    );
};

const ModalPage = () => {
    const nav = useFlowNav();
    const [dragPosition, setDragPosition] = useState(1);

    return (
        <View style={styles.modalContent}>
            <Text style={styles.title}>Modal Test</Text>
            <Text>Drag position: {dragPosition.toFixed(2)}</Text>
            <Text style={styles.subtitle}>
                0 = closed, 1 = fully open
            </Text>
            <TouchableOpacity
                style={[styles.button, {opacity: dragPosition}]}
                onPress={() => nav.close()}
            >
                <Text style={styles.buttonText}>Close Modal</Text>
            </TouchableOpacity>
        </View>
    );
};

const AutoOpenChild = () => {
    const {props, setProps} = useFlowProps();

    return (
        <View style={styles.page}>
            <Text style={styles.title}>Auto-Open Test</Text>
            <Text>This child auto-opens when if=true</Text>
            <Button
                title="Set if=false (will close)"
                onPress={() => setProps({if: false})}
            />
        </View>
    );
};

// Drawer test pages
const DrawerHome = () => (
    <View style={styles.page}>
        <Text style={styles.title}>Drawer Home</Text>
        <Text>Swipe from left or tap menu to open drawer</Text>
    </View>
);

const DrawerItem1 = () => (
    <View style={styles.page}>
        <Text style={styles.title}>Drawer Item 1</Text>
    </View>
);

const DrawerItem2 = () => (
    <View style={styles.page}>
        <Text style={styles.title}>Drawer Item 2</Text>
    </View>
);

const TabScreen = () => (
    <Flow.Parent name='DrawerParent' navType='drawer' icon={'settings'}
    >
        <Flow.FC name="DrawerHome" page={<DrawerHome />} title="Home" icon="home" />
        <Flow.FC name="DrawerItem1" page={<DrawerItem1 />} title="Item 1" icon="folder" />
        <Flow.FC name="DrawerItem2" page={<DrawerItem2 />} title="Item 2" icon="star" />
    </Flow.Parent>
);

/**
 * Main Test Component
 */
export default function FlowEnhancedTest () {
    return (
        <Flow.Pack name="MainPack" initial='TabParent'>

            <Flow.Parent
                name="TabParent"
                navType="tab"
                initial = 'Home'
                tabStyle={{
                    hideOnScroll: true,
                    animate: true,
                    type: 'screen',
                    withShadow: true,
                    borderRadius: 'curvedTop',
                }}
                iconStyle={{
                    activeColor: 'red',
                    iconActiveStyle: 'top-border',
                    allCaps: true,
                }}
            >
                <Flow.FC
                    name="Home"
                    page={<HomePage />}
                    title="Home"
                    icon="home"
                />
                <Flow.FC
                    name="Settings"
                    page={<SettingsPage />}
                    title="Settings"
                    icon="settings"
                    if={true}
                />
                <Flow.FC
                    name="Profile"
                    page={<ProfilePage />}
                    title="Profile"
                    icon="person"
                />

                {/* <Flow.FC
                    name="Drawer"
                    page={<TabScreen />}
                    title="DrawerParent"
                    icon="settings"
                /> */}

            </Flow.Parent>

            <Flow.Parent name='DrawerParent' navType='drawer' icon={'settings'}>
                <Flow.FC name="DrawerHome" page={<TabScreen />} title="Home" icon="home" />
                <Flow.FC name="DrawerItem1" page={<DrawerItem1 />} title="Item 1" icon="folder" />
                <Flow.FC name="DrawerItem2" page={<DrawerItem2 />} title="Item 2" icon="star" />
            </Flow.Parent>

            {/* Modal Test */}
            <Flow.Parent name="TestModal" type="modal">
                <Flow.FC
                    name="ModalContent"
                    size="half"
                    draggable
                    dismissable
                    headerConfig={{
                        titlePosition: 'center',
                        transparent: true,
                    }}
                >
                    <ModalPage />
                </Flow.FC>
            </Flow.Parent>

            {/* Auto-Open Test */}
            {/* <Flow.Parent name="AutoOpenParent" initial="AutoOpenChild"> */}
                <Flow.FC
                    name="AutoOpenChild"
                    page={<AutoOpenChild />}
                    open={true}
                    if={true}
                />
            {/* </Flow.Parent> */}

            {/* Restriction Test */}
            <Flow.Parent
                name="RestrictedParent"
            >
                <Flow.FC name="RestrictedChild" page={<Text>Restricted</Text>} />
            </Flow.Parent>

        </Flow.Pack>

    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    section: {
        marginVertical: 15,
        padding: 15,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    modalContent: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
