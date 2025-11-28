import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { theme } from 'theme/theme';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

interface myButtonProp {
    iconName: 'mic-off' | 'megaphone' | 'keypad' | string;
    title: string;
    onPress: () => void;
    endBtn?: boolean;
}

const CallButtons: React.FC<myButtonProp> = ( { iconName, endBtn, title, onPress } ) => {
    return (
        <TouchableOpacity onPress={ onPress } style={ {
            width: 'auto',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            flexDirection: 'column',
        } }>
            <View style={ [ styles.btn, endBtn && styles.endButton ] }>
                <Ionicons name={ iconName as any } size={ 25 } color={ endBtn ? 'white' : theme.colors.primary } />
            </View>
            <Text style={ styles.btnText }>{ title }</Text>
        </TouchableOpacity>
    );
};

export default function CallPage () {
    const navigation = useNavigation<any>();

    const { selectedHelper } = useSelector( ( state: any ) => state.order );
    const [ callTime, setCallTime ] = useState( '0:00' );
    const [ callStatus, setCallStatus ] = useState( 'Connecting...' );

    useEffect( () => {
        if ( !selectedHelper ) {
            navigation.goBack();
        }
    }, [ selectedHelper, navigation ] );

    const buttons: myButtonProp[] = [
        { iconName: 'mic-off', title: 'Mute', onPress: () => { } },
        { iconName: 'megaphone', title: 'Speaker', onPress: () => { } },
        { iconName: 'keypad', title: 'Keypad', onPress: () => { } }
    ];

    if ( !selectedHelper ) return null;

    return (
        <SafeAreaView style={ styles.container } edges={ [ 'top', 'bottom', 'left', 'right' ] }>
            <StatusBar backgroundColor={ theme.colors.secondary } barStyle={ 'dark-content' } />
            <Text style={ styles.title }>Calling your Helper</Text>

            <View style={ styles.upper }>
                <View style={ styles.Avatar }>
                    { selectedHelper.image ? (
                        <Image
                            source={ { uri: selectedHelper.image } }
                            style={ styles.Image }
                        />
                    ) : (
                        <MaterialIcons name='verified-user' size={ 80 } color={ theme.colors.primary } />
                    ) }
                </View>

                <Text style={ styles.name }>{ selectedHelper.name }</Text>
                <Animated.Text style={ [ styles.status ] }>
                    { callStatus.toLowerCase().includes( 'connecting...' ) ? callStatus : callTime }
                </Animated.Text>
            </View>

            <View style={ styles.ButtonWrap }>
                { buttons.map( ( btn, index ) => (
                    <CallButtons
                        iconName={ btn.iconName }
                        title={ btn.title }
                        onPress={ btn.onPress }
                        key={ index }
                    />
                ) ) }
            </View>
            <CallButtons
                iconName='call'
                title='End Call'
                endBtn
                onPress={ () => navigation.navigate( 'MainDrawer' ) }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create( {
    container: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        gap: 10,
        justifyContent: 'space-evenly',
        backgroundColor: theme.colors.secondary,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 25,
        color: theme.colors.text,
        position: 'absolute',
        top: '10%',
    },
    upper: {
        width: '100%',
        alignItems: 'center',
        gap: 6,
        paddingTop: 20
    },
    Avatar: {
        width: 180,
        height: 180,
        backgroundColor: theme.colors.secondary,
        padding: 8,
        borderWidth: 10,
        borderRadius: 90, // Fixed: 180/2 = 90
        borderColor: theme.colors.primaryTrans,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    Image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    name: {
        fontWeight: 'bold',
        fontSize: 26,
        marginBottom: -8
    },
    status: {
        fontWeight: '300',
        opacity: 0.3
    },
    ButtonWrap: {
        width: '90%',
        flexDirection: 'row',
        gap: '10%',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
    },
    btn: {
        width: 60,
        height: 60,
        backgroundColor: theme.colors.primaryTrans,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30, // Fixed: 60/2 = 30
        padding: 10,
    },
    btnText: {},
    endButton: {
        backgroundColor: 'red'
    },
} );