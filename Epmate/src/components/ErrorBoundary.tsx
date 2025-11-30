import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {theme} from '../theme/theme';
import {MaterialIcons} from '@expo/vector-icons';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {hasError: false, error: null};
    }

    static getDerivedStateFromError (error: Error) {
        return {hasError: true, error};
    }

    componentDidCatch (error: Error, errorInfo: React.ErrorInfo) {
        if(__DEV__) {
            if(__DEV__) console.log('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null});
    };

    render () {
        if(this.state.hasError) {
            return (
                <View style={styles.container}>
                    <MaterialIcons name="error-outline" size={64} color={theme.colors.red} />
                    <Text style={styles.title}>Oops! Something went wrong.</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: theme.colors.background,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: theme.colors.text,
    },
    message: {
        fontSize: 16,
        color: theme.colors.placeholder,
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
