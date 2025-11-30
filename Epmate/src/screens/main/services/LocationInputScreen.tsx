//screens/main/services/LocationInputScreen.tsx
import React, {useState} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AuthBtn from '../../../components/AuthButton';
import {theme} from '../../../theme/theme';
import {useDispatch} from 'react-redux';
import MyInput from '../../../components/myInput';
import {setLocationData, setIsSearching} from '../../../state/slices/orderSlice';
import {useNavigation} from '@react-navigation/native';
import ModalBackButton from '../../../components/ModalBackButton';

const LocationInputScreen: React.FC = () => {
    const [pickupLocation, setPickupLocation] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const dispatch = useDispatch();
    const navigation = useNavigation<any>();

    const isButtonEnabled = pickupLocation.trim() !== '' && deliveryLocation.trim() !== '';

    const findHelper = async () => {
        try {
            dispatch(setLocationData({
                pickupLocation,
                deliveryLocation,
            }));

            dispatch(setIsSearching(true));

            navigation.navigate('MainDrawer');
        } catch(error) {
            if(__DEV__) console.error('Error creating errand:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ModalBackButton onPress={() => navigation.navigate('ServiceTypeSelection')} />
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>Enter Locations</Text>

                <MyInput
                    type='text'
                    value={pickupLocation}
                    setValue={setPickupLocation}
                    placeholder="Your current location or address"
                    label='Pickup Location'
                    withLabel
                    selectionColor={theme.colors.primary}
                />

                <MyInput
                    type='text'
                    value={deliveryLocation}
                    setValue={setDeliveryLocation}
                    placeholder="Enter delivery location"
                    label="Enter delivery Location"
                    withLabel
                    selectionColor={theme.colors.primary}
                />

                <AuthBtn
                    disabled={!isButtonEnabled}
                    onClick={findHelper}
                    btnMode="contained"
                    btnStyle="solid"
                    btnText="FIND HELPER"
                    mv
                    rounded
                />
                <Text style={styles.shadow}>
                    You can provide more instructions to your helper later
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.secondary,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        flex: 1,
        width: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginVertical: 20,
        marginBottom: 30,
        textAlign: 'center',
    },
    shadow: {
        color: 'grey',
        opacity: 0.9,
        marginTop: 4,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default LocationInputScreen;
