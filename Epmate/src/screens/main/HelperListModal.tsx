// components/HelperListModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, FlatList, View, Animated } from 'react-native';
import { Modal, Portal, Button, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useHelpers } from '../../hooks/useHelpers';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const HelperListModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const { helpers, isLoading, isError } = useHelpers();
  const [countdown, setCountdown] = useState(60);
  const [preferredPrice, setPreferredPrice] = useState('');
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

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text style={styles.title}>Available Helpers ({countdown}s)</Text>
        {isLoading && <Text>Loading...</Text>}
        {isError && <Text>Error fetching helpers</Text>}
        {helpers && (
          <FlatList
            data={helpers}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.helperItem}>
                <Text>{item.name}</Text>
                <Text>Rating: {item.rating}</Text>
                <Text>Tasks: {item.tasks}</Text>
                <Text>Distance: {item.distance}</Text>
                <Animated.View style={{ backgroundColor }}>
                  <Button onPress={handleAccept}>Accept</Button>
                </Animated.View>
              </View>
            )}
          />
        )}
        <TextInput
          label="Preferred Price"
          value={preferredPrice}
          onChangeText={setPreferredPrice}
          style={styles.input}
        />
        <Button>Search with Preferred Price</Button>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
  },
  input: { marginTop: 10, marginBottom: 10 },
});

export default HelperListModal;
