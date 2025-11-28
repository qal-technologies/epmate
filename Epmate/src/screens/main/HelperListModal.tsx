// navigation/HelperListModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  FlatList,
  View,
  Animated as Anime,
  Image,
  Alert,
  TouchableOpacity,
  Easing,
} from 'react-native';
import {
  Modal,
  Portal,
  ActivityIndicator,
} from 'react-native-paper';
import { useHelpers, type HelperData } from '../../hooks/useHelpers';
import { theme } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AuthBtn from '../../components/AuthButton';
import MyInput from 'components/myInput';
import Animated, { SlideInRight, FadeOut, SlideOutLeft } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { setSelectedHelper } from 'state/slices/orderSlice';
import { useNavigation } from '@react-navigation/native';
import formatPrice from '../../utils/formatPrice';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

interface HelperWithVisibility extends HelperData {
  isVisible: boolean;
  appearDelay: number;
}

const HelperListModal: React.FC<Props> = ( {
  visible,
  onDismiss,
} ) => {
  const { isLoading, isError } = useHelpers();
  const [ Offer, setOffer ] = useState( '' );
  const [ visibleHelpers, setVisibleHelpers ] = useState<HelperWithVisibility[]>( [] );

  const allHelpers: HelperData[] = [
    {
      id: '1',
      name: 'John Doe',
      tagPrice: 1500,
      rating: 4.5,
      tasks: 120,
      distance: 2.3,
      image: 'https://via.placeholder.com/50',
      totalTasks: 120,
    },
    {
      id: '2',
      name: 'Jane Smith',
      tagPrice: 2250,
      rating: 4.7,
      tasks: 98,
      distance: 1.8,
      image: 'https://via.placeholder.com/50',
      totalTasks: 98,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      tagPrice: 10250,
      rating: 4.2,
      tasks: 75,
      distance: 3.1,
      image: 'https://via.placeholder.com/50',
      totalTasks: 75,
    },
    {
      id: '4',
      name: 'Jude Dickson',
      tagPrice: 1700,
      rating: 4.9,
      tasks: 75,
      distance: 1,
      image: 'https://via.placeholder.com/50',
      totalTasks: 275,
    },
    {
      id: '5',
      name: 'Joyce George',
      tagPrice: 1200,
      rating: 4.9,
      tasks: 75,
      distance: 1,
      image: 'https://via.placeholder.com/50',
      totalTasks: 275,
    },
  ];

  // Stagger helper appearance (like Bolt app)
  useEffect( () => {
    if ( visible ) {
      const helpersWithVisibility: HelperWithVisibility[] = allHelpers.map( ( helper, index ) => ( {
        ...helper,
        isVisible: false,
        appearDelay: index * 6000,
      } ) );

      setVisibleHelpers( helpersWithVisibility );

      // Make helpers visible one by one
      helpersWithVisibility.forEach( ( helper, index ) => {
        setTimeout( () => {
          setVisibleHelpers( prev =>
            prev.map( h =>
              h.id === helper.id ? { ...h, isVisible: true } : h
            )
          );
        }, helper.appearDelay );
      } );
    } else {
      setVisibleHelpers( [] );
    }
  }, [ visible ] );

  const dispatch = useDispatch();
  const navigation = useNavigation<any>();

  const handleAccept = ( id: any ) => {
    if ( id ) {
      const foundHelper = allHelpers.find( h => h.id === id );
      if ( foundHelper ) {
        dispatch( setSelectedHelper( foundHelper ) );
        onDismiss();
        navigation.navigate( 'ConfirmOrder' );
      } else {
        Alert.alert( 'Helper not found' );
      }
    }
  };

  const handleHelperExpired = useCallback( ( id: string ) => {
    setVisibleHelpers( prev => prev.filter( h => h.id !== id ) );
  }, [] );

  const handleOffer = () => {
    // fetch api for alerting helpers around for that price
  };

  return (
    <Portal>
      <Modal
        visible={ visible }
        onDismiss={ onDismiss }
        contentContainerStyle={ styles.modal }
      >
        <Text style={ styles.title }>Available Helper Offers</Text>

        { isLoading && (
          <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
            <ActivityIndicator color={ theme.colors.primary } size={ 'large' } style={ { alignSelf: 'center' } } />
            <Text style={ { fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold' } }>Fetching...</Text>
          </View>
        ) }
        { !isError && (
          <View
            style={ {
              width: '100%',
              padding: 20,
              flex: 1,
              justifyContent: 'center',
              gap: 10,
              alignItems: 'center',
            } }
          >
            <MaterialIcons
              name="handyman"
              color={ theme.colors.primary }
              size={ 80 }
            />
            <Text style={ { fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold' } }>
              Error fetching helpers
            </Text>
          </View>
        ) }
        { visibleHelpers.length > 0 ? (
          <>
            <FlatList
              data={ visibleHelpers.filter( h => h.isVisible ) }
              contentContainerStyle={ {
                paddingTop: 10,
                paddingBottom: 20,
              } }
              showsVerticalScrollIndicator={ true }
              fadingEdgeLength={ 50 }
              keyExtractor={ item => item.id }
              scrollEnabled={ true }
              nestedScrollEnabled={ true }
              renderItem={ ( { item, index } ) => (
                <HelperItem
                  index={ index }
                  item={ item }
                  onPress={ ( value ) => handleAccept( value ) }
                  onExpired={ handleHelperExpired }
                  key={ item.id }
                />
              ) }
            />

            <View
              style={ {
                alignSelf: 'center',
                backgroundColor: theme.colors.secondary,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 10,
                borderRadius: 18,
              } }
            >
              <Text style={ { fontSize: 14, color: 'grey', opacity: 0.9, fontStyle: 'italic', textAlign: 'center', marginTop: 10 } }>
                A higher price may attract more helpers
              </Text>

              <MyInput value={ Offer } setValue={ setOffer } placeholder='Enter your price' type='number' selectionColor={ theme.colors.primary } />

              <AuthBtn
                btnText="SUBMIT OFFER"
                btnStyle="solid"
                btnMode="contained"
                onClick={ handleOffer }
                disabled={ isLoading || Offer.trim().length < 3 }
                style={ {
                  marginVertical: 10,
                } }
              />
            </View>
          </> ) :
          <View style={ { flex: 1, alignItems: 'center', justifyContent: 'center' } }>
            <ActivityIndicator color={ theme.colors.primary } size={ 'large' } style={ { alignSelf: 'center' } } />
            <Text style={ { fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold' } }>Searching Helpers...</Text>
          </View>
        }
      </Modal>
    </Portal>
  );
};

type HelperProps = {
  item: HelperData;
  index: number;
  onPress: ( state?: any ) => void;
  onExpired: ( id: string ) => void;
};

const HelperItem: React.FC<HelperProps> = ( {
  item,
  index,
  onPress,
  onExpired,
} ) => {
  const [ isDisabled, setIsDisabled ] = useState( false );
  const [ countdown, setCountdown ] = useState( 60 );
  const widthAnim = useRef( new Anime.Value( 0 ) ).current;

  useEffect( () => {
    // Start animation immediately when item appears
    Anime.timing( widthAnim, {
      toValue: 100,
      duration: 60000, // 60 seconds
      useNativeDriver: false,
      easing: Easing.linear,
    } ).start();

    // Countdown timer
    const timer = setInterval( () => {
      setCountdown( prev => {
        if ( prev <= 0 ) {
          setIsDisabled( true );
          clearInterval( timer );
          // Remove item after expiry
          setTimeout( () => onExpired( item.id ), 200 );
          return 0;
        }
        return prev - 1;
      } );
    }, 1000 );

    return () => clearInterval( timer );
  }, [] );

  const animatedWidth = widthAnim.interpolate( {
    inputRange: [ 0, 100 ],
    outputRange: [ '0%', '150%' ],
  } );

  return (
    <Animated.View
      style={ styles.helperItem }
      entering={ SlideInRight.springify().delay( 100 ) }
      exiting={ SlideOutLeft.duration( 400 ).springify() }
    >
      <View style={ styles.helperImage }>
        { item.image ? (
          <Image
            source={ { uri: item.image } }
            alt={ item.name }
            style={ {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            } }
          />
        ) : (
          <MaterialIcons
            name="verified-user"
              color={ theme.colors.primary }
              size={ 30 }
            />
        ) }
      </View>
      <View style={ styles.helperInfo }>
        <Text style={ { fontSize: 16, fontWeight: 'bold', flexWrap: 'wrap' } }>
          { item.name }
        </Text>
        <Text style={ { fontSize: 18, fontWeight: 'bold', marginBottom: 2 } }>
          { formatPrice( item.tagPrice ) }
        </Text>
        <View
          style={ {
            display: 'flex',
            gap: 3,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'flex-start',
          } }
        >
          <Text style={ { fontSize: 12 } }>Rating: { item.rating } / 5 </Text>
          <MaterialIcons name="star" color={ theme.colors.primary } size={ 12 } />
        </View>
        <Text style={ { fontSize: 12 } }>Total tasks: { item.tasks }</Text>
        <Text style={ { fontSize: 12 } }>
          Distance: { item.distance ? item.distance : '0' } mins away
        </Text>
      </View>

      <TouchableOpacity
        style={ {
          borderRadius: 16,
          padding: 8,
          paddingInline: 15,
          minWidth: 70,
          overflow: 'hidden',
          alignSelf: 'flex-end',
          justifyContent: 'center',
          backgroundColor: theme.colors.primary,
          position: 'relative',
        } }
        onPress={ () => !isDisabled && onPress( item.id ) }
        disabled={ isDisabled }
        activeOpacity={ isDisabled ? 1 : 0.7 }
      >
        <Anime.View
          style={ {
            width: animatedWidth,
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 9,
            backgroundColor: theme.colors.placeholder,
          } }
        />

        <Text style={ { fontSize: 18, color: theme.colors.secondary, zIndex: 99 } }>
          ACCEPT
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create( {
  modal: {
    backgroundColor: theme.colors.background,
    padding: 10,
    height: '100%',
    alignItems: 'center'
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginVertical: 20,
    marginBottom: 20,
    textAlign: 'left',
  },
  helperItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: theme.colors.secondary,
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 18,
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  helperImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryTrans,
    overflow: 'hidden',
  },
  helperInfo: {
    width: '45%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    textAlign: 'left',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
} );

export default HelperListModal;
