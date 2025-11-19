// components/HelperListModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  FlatList,
  View,
  Animated,
  Image,
} from 'react-native';
import {
  Modal,
  Portal,
  Button,
  TextInput,
  ActivityIndicator,
  adaptNavigationTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useHelpers, type HelperData } from '../../hooks/useHelpers';
import { theme } from '../../theme/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AuthBtn from '../../components/AuthButton';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const HelperListModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const { helpers, isLoading, isError } = useHelpers();
  const [countdown, setCountdown] = useState(60);
  const [Offer, setOffer] = useState('');
  const colorAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();

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
        () => setCountdown(prev => (prev > 0 ? prev - 1 : 0)),
        1000,
      );
    } else colorAnim.setValue(0);

    return () => clearInterval(timer);
  }, [visible, colorAnim]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#00D09C', '#FFF'],
  });

  const handleAccept = () => {
    onDismiss();
    navigation.navigate('Payment');
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
        <Text style={styles.title}>Available Helpers ({countdown}s)</Text>
        {isLoading && (
          <Text>
            <ActivityIndicator color={theme.colors.primary} size={'large'} />
          </Text>
        )}
        {isError && (
          <View
            style={{
              width: '100%',
              padding: 20,
              flex: 1,
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <MaterialIcons
              name="handyman"
              color={theme.colors.primary}
              size={30}
            />
            <Text style={{ fontFamily: theme.fonts.bold }}>
              Error fetching helpers
            </Text>
          </View>
        )}
        {helpers && (
          <>
            <FlatList
              data={helpers}
              contentContainerStyle={{ marginBlock: 12, flex: 1 }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <HelperItem
                  item={item}
                  backgroundColor={backgroundColor}
                  onPress={handleAccept}
                  key={item.name}
                />
              )}
            />

            <View
              style={{
                width: '100%',
                backgroundColor: theme.colors.secondary,
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14, color: 'grey', opacity: 0.9 }}>
                A higher price may attract more helpers
              </Text>
              <TextInput
                label="Preferred Price"
                value={Offer}
                onChangeText={setOffer}
                style={styles.input}
              />

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
      <View style={styles.helperItem}>
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
              size={20}
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
            <Text style={{ fontSize: 14 }}>Rating: {item.rating} / 5 </Text>
            <MaterialIcons name="star" color={theme.colors.primary} size={12} />
          </View>
          <Text style={{ fontSize: 14 }}> Total tasks: {item.tasks}</Text>
          <Text style={{ fontSize: 14 }}>
            Distance: {item.distance ? item.distance : '0'} km away
          </Text>
        </View>

        <Animated.View
          style={{
            backgroundColor,
            borderRadius: 16,
            padding: 8,
            paddingInline: 11,
            width: '20%',
            minWidth: 70,
          }}
        >
          <Button onPress={onPress} textColor={theme.colors.secondary}>
            ACCEPT
          </Button>
        </Animated.View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: theme.colors.background,
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  helperItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: theme.colors.secondary,
    borderColor: '#ccc',
    borderWidth: 1.5,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    alignContent: 'center',
    flexWrap: 'wrap',
  },
  helperImage: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    objectFit: 'cover',
    overflow: 'hidden',
  },
  helperInfo: {
    maxWidth: '50%',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    textAlign: 'left',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  input: { marginTop: 10, marginBottom: 10 },
});

export default HelperListModal;
