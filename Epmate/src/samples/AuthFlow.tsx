import React, {useEffect} from 'react';
import {View, Text, Button, StyleSheet, TextInput} from 'react-native';
import {useFlow} from '../flows/hooks/useFlow';

const Flow = useFlow();

// --- Components ---

const LoginScreen = () => {
    const nav = Flow.nav();
    const {setParentProps} = Flow.parentProps();

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Login</Text>
            <Button title="Go to Register" onPress={() => nav.open('Register')} />
            <Button title="Forgot Password?" onPress={() => nav.open('ForgotPassword')} />
            <View style={styles.spacer} />
            <Button
                title="Login (Switch to Dashboard)"
                onPress={() => {
                    // Simulate login and switch to Dashboard pack
                    nav.switchRoot('DashboardPack');
                }}
            />
            <View style={styles.spacer} />
            <Button
                title="Update Parent Title"
                onPress={() => setParentProps({name: 'Auth Wizard (Modified)', })}
            />
        </View>
    );
};

const RegisterScreen = () => {
    const nav = Flow.nav();
    // Demonstrate typed props: We define { color: string } but also get standard props like 'title'
    const {props, setProps} = Flow.props<{color: string;}>();

    // Test: Update own props on mount
    useEffect(() => {
        setProps({title: 'Join Us!', color: '#007AFF',});
    }, []);

    return (
        <View style={styles.screen}>
            <Text style={[styles.title, {color: props.color || 'black'}]}>
                {props.title || 'Register'}
            </Text>
            <Button title="Back to Login" onPress={() => nav.prev()} />
        </View>
    );
};

const ForgotPasswordScreen = () => {
    const nav = Flow.nav();

    return (
        <View style={styles.screen}>
            <Text style={styles.title}>Recover Password</Text>
            <Button title="Back" onPress={() => nav.close()} />
        </View>
    );
};

// --- Flow Definition ---

export const AuthFlow = () => {
    return (

        <Flow.Pack name="AuthPack" initial="AuthWizard" >
            <Flow.Parent name="AuthWizard" initial="Login">
                <Flow.FC name="Login" page={<LoginScreen />} />
                <Flow.FC name="Register" page={<RegisterScreen />} />
                <Flow.FC name="ForgotPassword" page={<ForgotPasswordScreen />} />
            </Flow.Parent>
        </Flow.Pack>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    spacer: {
        height: 20,
    },
});
