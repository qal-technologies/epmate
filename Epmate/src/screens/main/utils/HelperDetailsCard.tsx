import React from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from 'theme/theme';
import type { HelperData } from 'hooks/useHelpers';
import AuthBtn from 'components/AuthButton';
import useTaskName from 'hooks/useServiceType';

export default function HelperDetails () {
    const navigation = useNavigation<any>();

    const { selectedHelper: helper, locationData } = useSelector( ( state: any ) => state.order );

    if ( !helper ) return null;

    const selectedHelper: HelperData = helper;
    const serviceType = useTaskName();

    return (
        <View style={ styles.container }>
            <View style={ styles.card }>
                <Text style={ styles.title }>Your Helper</Text>

                <View style={ styles.Avatar } key={ selectedHelper.id }>
                    { selectedHelper.image ? (
                        <Image
                            source={ { uri: selectedHelper.image } }
                            style={ styles.Image }
                            alt={ selectedHelper.name }
                        />
                    ) : (
                        <MaterialIcons
                            name='verified-user'
                            size={ 40 }
                            color={ theme.colors.primary }
                        />
                    ) }
                </View>

                <View style={ { flex: 1 } }>
                    <Text style={ styles.name }>{ selectedHelper.name }</Text>
                    <Text style={ [ styles.rating, { fontWeight: 'bold' } ] }>
                        Rating: <Text style={ styles.rating }>{ selectedHelper.rating } / 5</Text>
                    </Text>

                    <Text style={ { color: theme.colors.placeholder } }>
                        { selectedHelper.totalTasks } tasks completed
                    </Text>

                    <View style={ { width: '100%' } }>
                        <TouchableOpacity
                            onPress={ () => navigation.navigate( 'CallPage' ) }
                            style={ styles.callBtn }
                        >
                            <MaterialIcons name='call' color={ theme.colors.secondary } size={ 18 } />
                            <Text style={ { fontSize: 16, color: theme.colors.secondary, fontWeight: 'bold' } }>
                                Call Helper
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={ styles.card }>
                <Text style={ [ styles.sub, { color: theme.colors.text, fontWeight: 'bold' } ] }>
                    Task Type: <Text style={ styles.sub }>{ serviceType }</Text>
                </Text>
            </View>

            <View style={ styles.card }>
                <Text style={ styles.title }>{ serviceType }</Text>

                { serviceType.toLowerCase().includes( 'pickup' ) && (
                    <>
                        <View style={ styles.typeWrapper }>
                            <MaterialIcons name='location-pin' color={ theme.colors.accent } size={ 25 } />
                            <View>
                                <Text style={ styles.typeTitle }>Pickup Location:</Text>
                                <Text style={ styles.typeValue }>{ locationData?.pickupLocation }</Text>
                            </View>
                        </View>

                        <View style={ styles.typeWrapper }>
                            <MaterialIcons name='check-circle' color={ theme.colors.primary } size={ 25 } />
                            <View>
                                <Text style={ styles.typeTitle }>Delivery Location:</Text>
                                <Text style={ styles.typeValue }>{ locationData?.deliveryLocation }</Text>
                            </View>
                        </View>
                    </>
                ) }
            </View>

            <AuthBtn
                btnText='View Live Map'
                btnStyle='solid'
                btnMode='contained'
                onClick={ () => navigation.navigate( 'LiveTracking' ) }
                style={ {
                    width: '100%',
                    alignSelf: 'center',
                    marginTop: 10,
                } }
            />

            <Text style={ styles.footerText }>
                You can find this order in your 'My Tasks' history
            </Text>
        </View>
    );
}

const styles = StyleSheet.create( {
    container: {
        width: '100%',
        marginTop: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
        marginBottom: 6,
        minWidth: '100%'
    },
    card: {
        backgroundColor: theme.colors.background,
        width: '100%',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    Avatar: {
        width: 80,
        height: 80,
        backgroundColor: theme.colors.primaryTrans,
        borderRadius: 40, // Fixed: '50%' is not valid for borderRadius in RN number type, but string '50%' works. However, number is safer. 80/2 = 40.
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden', // Added to ensure image respects border radius
    },
    Image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', // Fixed: objectFit -> resizeMode
    },
    name: {
        fontWeight: 'bold',
        fontSize: 20,
    },
    rating: {
        fontWeight: '300', // Fixed: 'light' is not valid
        fontSize: 16,
    },
    callBtn: {
        width: '70%',
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary,
        borderRadius: 14,
        padding: 10,
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    sub: {
        color: theme.colors.placeholder,
        fontWeight: '300', // Fixed: 'light' is not valid
        fontSize: 16
    },
    typeWrapper: {
        width: '100%',
        gap: 10,
        flexDirection: 'row',
        marginBottom: 6
    },
    typeTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        opacity: 0.9
    },
    typeValue: {
        fontWeight: '300', // Fixed: 'light' is not valid
        fontSize: 16,
        color: theme.colors.placeholder,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.placeholder,
        textAlign: 'center',
        marginTop: 7
    },
} );