import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import AuthBtn from "components/AuthButton";
import MyInput from "components/myInput";
import Banner from "components/UpperBanner";
import useOtp from "hooks/useOtp";
import type { RootStackParamList } from "navigation/types";
import React, { useEffect, useRef, useState } from "react";
import { Animated as Anime, View, StyleSheet, Alert, Image, Text, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { login, updateUserProfile } from "state/slices/authSlice";
import { theme } from "theme/theme";
import { firebaseFirestore } from "../../utils/firebaseFirestore";

type OTPScreenProp = NativeStackScreenProps<
    RootStackParamList,
    'otp'
>;

const OTPScreen: React.FC<OTPScreenProp> = ( {
    route,
} ) =>
{
    const { userId: uid, otp: inward, mobile } = route.params || {};
    let otp = inward;
    const [ code, setCode ] = useState( '' );
    const [ loading, setLoading ] = useState( false );
    const dispatch = useDispatch();
    const [ countdown, setCountdown ] = useState( 60 );
    const [ Offer, setOffer ] = useState( '' );
    const colorAnim = useRef( new Anime.Value( 0 ) ).current;
    const authState = useSelector( ( state: any ) => state.auth );


    useEffect( () =>
    {
        let timer: number;
        if ( countdown !== 0 )
        {
            setCountdown( 60 );
            Anime.timing( colorAnim, {
                toValue: 1,
                duration: 60000,
                useNativeDriver: false,
            } ).start();
            timer = setInterval(
                () =>
                {
                    setCountdown( prev => ( prev > 0 ? prev - 1 : 0 ) );
                },
                1000,
            );
        } else colorAnim.setValue( 0 );

        return () => clearInterval( timer );
    }, [ colorAnim ] );


    const reSend = () =>
    {
        otp = useOtp( { destination: mobile, id: uid }, navigation, 4 );
        setCountdown( 60 );
    };

    const navigation = useNavigation();

    /**
     * Check if user already exists in database
     * In production, this should query Firestore to check if user document exists
     */
    const checkIfExistingUser = async ( userId: string, mobile: any ): Promise<boolean> =>
    {
        try
        {
            // TODO: Implement actual Firestore check
            // const userDoc = await firebaseFirestore.getDocument('users', userId);
            // return userDoc !== null && userDoc.role && userDoc.displayName;

            // Temporary hardcoded check for testing
            const existingUsers = [ '9016561308', '7016561308' ];
            return existingUsers.includes( mobile );
        } catch ( error )
        {
            console.error( 'Error checking user:', error );
            return false;
        }
    };

    const handleOtp = async () =>
    {
        try
        {
            if ( !code || !otp ) return;
            setLoading( true );

            setTimeout( async () =>
            {
                if ( code !== otp )
                {
                    Alert.alert( 'OTP Error', 'Incorrect otp' );
                    setLoading( false );
                } else
                {
                    // OTP is correct - update mobile verification status
                    dispatch( updateUserProfile( {
                        id: uid,
                        mobile: mobile ?? undefined,
                        mobileVerified: true
                    } ) );

                    // Check if this is an existing user
                    const isExistingUser = await checkIfExistingUser( uid, mobile );

                    if ( isExistingUser )
                    {
                        // Existing user - fetch their profile from database
                        // TODO: Fetch user data from Firestore and update store
                        // const userData = await firebaseFirestore.getDocument('users', uid);
                        // dispatch(updateUserProfile(userData));

                        
                            // For now, simulate existing user with complete profile
                            dispatch( updateUserProfile( {
                                displayName: 'Existing User',
                                role: 'user'
                            } ) );
                        

                        // AppRootNavigator will handle navigation to Main automatically
                        // because profile is now complete
                    } else
                    {
                        // New user - navigate to userName screen to complete profile
                        navigation.replace('userName');
                    }

                    setLoading( false );
                }
            }, 400 );
        } catch ( error: any )
        {
            console.error( 'Error verifying OTP:', error.message || error );
            setLoading( false );
        }
    };

    return (
        <View style={ styles.container }>
            <StatusBar
                animated
                barStyle="light-content"
                backgroundColor={ theme.colors.primary }
                translucent
            />

            <Animated.View style={ styles.parent } entering={ FadeInUp.springify() } exiting={ FadeOutUp.springify() }>
                <TouchableOpacity style={ styles.back } onPress={ () => navigation.navigate( 'Signup' ) } >
                    <MaterialIcons name="arrow-back" size={ 20 } />
                </TouchableOpacity>
                <Image source={ require( '../../assets/images/logoTrans.png' ) } style={ styles.image } />
                <Text style={ styles.header }>OTP Verification</Text>
            </Animated.View>
            <View style={ { paddingHorizontal: 20 } }>
                <MyInput type="otp" withLabel label="Enter your OTP Code" value={ code } setValue={ setCode } labelNote="An OTP has been sent to your registered WhatsApp number." centerUpper upperMb={ 20 } />

                { countdown == 0 ?
                    <TouchableOpacity style={ styles.resend } onPress={ () => reSend() }>
                        <Text style={ { color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 } }>Resend OTP
                        </Text>
                    </TouchableOpacity> :
                    <Text style={ { textAlign: 'center', color: 'gray' } }>
                        The code expires after{ ' ' }
                        <Text style={ { fontWeight: 'bold', color: theme.colors.primary } }>{ countdown }s
                        </Text>
                    </Text> }
            </View>


            <AuthBtn
                btnMode="contained"
                btnStyle="solid"
                btnText="Continue"
                loading={ loading }
                loadingText="Verifying...."
                onClick={ handleOtp }
                disabled={ code.trim().length < 4 }
                mv
                style={ {
                    marginTop: 50,
                    width: '80%',
                } }
            />
        </View>
    );
};

const styles = StyleSheet.create( {
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: theme.colors.secondary,
    },
    parent: {
        minWidth: Dimensions.get( 'window' ).width,
        padding: 46,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        top: 0,
    },
    back: {
        width: 35,
        height: 35,
        borderRadius: '50%',
        backgroundColor: theme.colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',

        position: 'absolute',
        top: 50,
        left: 10,
    },
    header: {
        color: 'white',
        fontSize: 30,
        textAlign: 'center',
        fontWeight: 'bold',
        marginTop: -20,
    },
    resend: {
        alignSelf: 'center',
        backgroundColor: theme.colors.primaryTrans,
        color: theme.colors.primary,
        padding: 5,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    image: {
        width: 150,
        height: 150,
    },
} );

export default OTPScreen;
