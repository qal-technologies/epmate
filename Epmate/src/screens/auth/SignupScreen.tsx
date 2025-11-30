import React, { useState } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import {
TextInput,
Button,
Text,
Divider,
HelperText,
} from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { firebaseAuth } from '../../utils/firebaseAuth';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { db, firebaseFirestore } from '../../utils/firebaseFirestore';
import TPView from '../../components/T&PView';
import Banner from '../../components/UpperBanner';
import AuthBtn from '../../components/AuthButton';
import MyInput from 'components/myInput';
import useOtp from 'hooks/useOtp';

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Signup'
>;

type Props = {
  navigation: SignupScreenNavigationProp;
};

const SignupScreen: React.FC<Props> = ( { navigation } ) => {
  const [ loading, setLoading ] = useState<boolean>( false );
  const [ phoneNumber, setNumber ] = useState( '' );

  const handleSignup = async () => {
    setLoading( true );
    try {

      const normalizeNumber = () => {
        if ( phoneNumber && phoneNumber.trim().length == 11 ) {
          let newNumber: string = phoneNumber;
          const trimmable = newNumber.startsWith( '0' );

          if ( trimmable ) newNumber.slice( 1 );
          const toInt = parseInt( newNumber );
          return toInt as any;
        }
        return phoneNumber as any;
      };

      setTimeout( () => {
        useOtp( { id: '12345', destination: normalizeNumber() }, navigation, 4 );

        setLoading( false );
      }, 4000 );
    } catch ( error: any ) {
      if (__DEV__) console.error( 'Signup error:', error.message || error );
      setLoading( false );
    }
  };

  return (
    <ScrollView
      style={ styles.container }
      scrollToOverflowEnabled
      scrollEnabled
      contentContainerStyle={ {
        paddingBottom: 10,
      } }
    >
      <Banner />
      <Text style={ styles.title }>Enter your phone number</Text>
      <View style={ { alignItems: 'center', marginBottom: 20 } }>
        <Text style={ styles.sub }>
          We'll send you a verification code on your WhatsApp.
        </Text>
      </View>

      <View style={ { paddingHorizontal: 15 } }>
        <MyInput type="mobile" value={ phoneNumber } setValue={ setNumber } disabled={ loading } />

        <AuthBtn
          loading={ loading }
          loadingText="Sending code..."
          btnText="Continue"
          onClick={ handleSignup }
          disabled={ phoneNumber.trim().length < 10 }
          btnMode="contained"
          btnStyle="solid"
          mv
        />

        <TPView navigation={ navigation } />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create( {
  container: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: 'black',
    fontFamily: theme.fonts.bold,
  },
  sub: {
    fontSize: 16,
    fontWeight: 'light',
    textAlign: 'center',
    marginBottom: 5,
    color: 'black',
    fontFamily: theme.fonts.regular,
  },
  small: {
    fontSize: 14,
    fontWeight: 'light',
    textAlign: 'center',
    color: 'white',
    fontFamily: theme.fonts.regular,
  },
  sm: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
  },
  link: {
    color: theme.colors.primary,
    textDecorationColor: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  input: {
    marginBottom: 16,
    borderColor: theme.colors.primary,
    tintColor: theme.colors.primary,
    outlineColor: theme.colors.primary,
    borderCurve: 'circular',
    backgroundColor: theme.colors.secondary,
  },
  button: {
    marginBottom: 16,
    backgroundColor: theme.colors.primary,
    color: 'white',
    borderRadius: '20px',
  },
  googleBtn: {
    backgroundColor: 'none',
    color: 'black',
  },
} );

export default SignupScreen;
