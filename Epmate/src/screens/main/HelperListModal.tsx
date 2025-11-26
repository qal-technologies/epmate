// components/HelperListModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  FlatList,
  View,
  Animated,
  Image,
  Alert,
} from 'react-native';
import {
  Modal,
  Portal,
  Button,
  TextInput,
  ActivityIndicator,
} from 'react-native-paper';
import { useHelpers, type HelperData, } from '../../hooks/useHelpers';
import { theme } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AuthBtn from '../../components/AuthButton';
import MyInput from 'components/myInput';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onAcceptHelper: (state?: any) => void;
}

const HelperListModal: React.FC<Props> = ({
  visible,
  onDismiss,
  onAcceptHelper,
}) => {
  const { isLoading, isError } = useHelpers();
  const [countdown, setCountdown] = useState(60);
  const [selectedHelper, setSelectedHelper] = useState<HelperData | null>(null);
  const [Offer, setOffer] = useState('');
  const colorAnim = useRef(new Animated.Value(0)).current;

  const helpers = [
    {
      id: '1',
      name: 'John Doe',
      tagPrice: 'N1,500',
      rating: 4.5,
      tasks: 120,
      distance: 2.3,
      image: null,
      totalTask: 120,
    },
    {
      id: '2',
      name: 'Jane Smith',
      tagPrice: 'N2,250',
      rating: 4.7,
      tasks: 98,
      distance: 1.8,
      image: null,
      totalTask: 98,
    },
    {
      id: '3',
      name: 'Mike Johnson',
      tagPrice: 'N10,250',
      rating: 4.2,
      tasks: 75,
      distance: 3.1,
      image: null,
      totalTask: 75,
    },
  ];

  useEffect(() => {
    let timer: number;
    if (visible) {
      setCountdown(60);
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: false,
      }).start();
      timer = setInterval(
        () => {
          if (countdown == 0) Alert.alert('somthing happened');
          setCountdown(prev => (prev > 0 ? prev - 1 : 0))
        },
        1000);
    } else colorAnim.setValue(0);

    return () => clearInterval(timer);
  }, [visible, colorAnim]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.primary, '#FFF'],
  });

  const handleAccept = (id: any) => {
    if (id) {
      setSelectedHelper(id);
      const foundHelper = helpers.find(h => h.id === id);
      if (foundHelper) {
        onAcceptHelper(foundHelper);
      }
      onDismiss();
    }
  };

  const handleOffer = () => {
    // fetch api for alerting helpper around for that price and if the accept return those helpers array using usehelpers hook.
    // isLoading = true;
    // setTimeout(() => {
    //   isLoading = false;
    // }, 4000);
    // usehelper hook sets is loading to true again to make the modal ui start loading.
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text style={styles.title}>Available Helper Offers</Text>
        {isLoading && (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={theme.colors.primary} size={'large'} style={{ alignSelf: 'center' }} />
            <Text style={{ fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>Fetching...</Text>
          </View>
        )}
        {!isError && (
          <View
            style={{
              width: '100%',
              padding: 20,
              flex: 1,
              justifyContent: 'center',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <MaterialIcons
              name="handyman"
              color={theme.colors.primary}
              size={80}
            />
            <Text style={{ fontSize: 25, color: theme.colors.primary, marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
              Error fetching helpers
            </Text>
          </View>
        )}
        {helpers && (
          <>
            <FlatList
              data={helpers}
              contentContainerStyle={{
                marginBlock: 12,
                flex: 1,
                paddingBottom: 20,
                overflow: 'scroll'
              }}

              keyExtractor={item => item.id}
              scrollEnabled={true}
              renderItem={({ item }) => (
                <HelperItem
                  item={item}
                  backgroundColor={backgroundColor}
                  onPress={(value) => handleAccept(value)}
                  key={item.name}
                />
              )}


            />

            <View
              style={{
                minWidth: '100%',
                backgroundColor: theme.colors.secondary,
                justifyContent: 'center',
                gap: 6,
                padding: 10,
                borderRadius: 18,
              }}
            >
              <Text style={{ fontSize: 14, color: 'grey', opacity: 0.9, fontStyle: 'italic', textAlign:'center', marginTop:10 }}>
                A higher price may attract more helpers
              </Text>
              <TextInput
                label="Preferred Price"
                value={Offer}
                onChangeText={setOffer}
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor={theme.colors.placeholder}
                mode="outlined"
                outlineColor={theme.colors.placeholder}
                activeOutlineColor={theme.colors.primary}
                keyboardType="numeric" />
              
              <AuthBtn
                btnText="SUBMIT OFFER"
                btnStyle="solid"
                btnMode="contained"
                onClick={handleOffer}
                disabled={isLoading}
                mv
              />
            </View>
          </>
        )}
      </Modal>
    </Portal>
  );
};

type HelperProps = {
  item: HelperData | null;
  backgroundColor: any;
  onPress: (state?: any) => void;
};

const HelperItem: React.FC<HelperProps> = ({
  item,
  backgroundColor,
  onPress,
}) => {
  if (item) {
    return (
      <Animated.View style={styles.helperItem} key={item.id} >
        <View style={styles.helperImage}>
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <MaterialIcons
              name="verified-user"
              color={theme.colors.primary}
              size={30}
            />
          )}
        </View>
        <View style={styles.helperInfo}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', flexWrap: 'wrap' }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2 }}>
            {item.tagPrice}
          </Text>
          <View
            style={{
              display: 'flex',
              gap: 3,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'flex-start',
            }}
          >
            <Text style={{ fontSize: 12 }}>Rating: {item.rating} / 5 </Text>
            <MaterialIcons name="star" color={theme.colors.primary} size={12} />
          </View>
          <Text style={{ fontSize: 12 }}> Total tasks: {item.tasks}</Text>
          <Text style={{ fontSize: 12 }}>
            Distance: {item.distance ? item.distance : '0'} mins away
          </Text>
        </View>

        <Animated.View
          style={{
            backgroundColor,
            borderRadius: 16,
            padding: 8,
            paddingInline: 15,
            width: 'auto',
            minWidth: 70,
            alignSelf: 'flex-end',
            justifyContent: 'center',
          }}
          onTouchEnd={() => onPress(item.id)}
        >
          <Text style={{ fontSize: 18, color: theme.colors.secondary }}>
            ACCEPT
          </Text>
        </Animated.View>
      </Animated.View>
    );
  }
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.background,
    padding: 20,
    flex: 1,
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
    borderRadius: '50%',
    objectFit: 'cover',
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
  input: {
    marginTop: 10,
    marginBottom: 10,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  },
});

export default HelperListModal;
