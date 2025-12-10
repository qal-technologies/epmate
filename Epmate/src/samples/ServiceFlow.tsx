import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';
import {useFlow, useFlowNav, useFlowState} from '@flows';

const ServiceFlow = () => {
    const Flow = useFlow();

    const WelcomeScreen = () => {
        const nav = Flow.nav();
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Welcome to Service Flow</Text>
                <Button title="Next Step" onPress={() => nav.next()} />
                <Button title="Open Modal" onPress={() => nav.open('InfoModal')} />
            </View>
        );
    };

    const StepTwoScreen = () => {
        const nav = Flow.nav();
        const state = Flow.state();
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Text style={styles.title}>Step Two</Text>
                <Button title="Go Back" onPress={() => nav.prev()} />
                <Text>{JSON.stringify(state.get('timestamp')) || 'Text not set'}</Text>
                <Button
                    title="Set Shared State"
                    onPress={() => state.set('timestamp', Date.now())}
                />
                <Button title="Go to Home Flow" onPress={() => nav.open('Main.HomeFlow')} />
            </View>
        );
    };

    const InfoModal = () => {
        const nav = Flow.nav();
        const state = Flow.state();

        return (
            <View style={styles.container}>
                <Text style={styles.title}>Info Modal</Text>
                <Text>This is a modal flow.</Text>
                <Text>{JSON.stringify(state.get('timestamp')) || 'Text not set'}</Text>
                <Button title="Close" onPress={() => nav.close()} />
            </View>
        );
    };

    const ModalFlow = Flow.create('modal')
        .named('InfoModal')
        .child('Content', <InfoModal />)
        .props({size: 'half', draggable: true})
        .build();

    return (
        <Flow.Parent name="Service" >
            <Flow.FC name="Welcome" page={<WelcomeScreen />} />
            <Flow.FC name="StepTwo" page={<StepTwoScreen />} animationType='slideRight' noHeader />
            <Flow.FC name="InfoModal" page={<InfoModal />} noHeader />

        </Flow.Parent>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default ServiceFlow;
