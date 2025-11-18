import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { Modal, Portal, Button, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useHelpers } from '../../hooks/useHelpers';

const HelperListModal = ({ visible, onDismiss }) => {
  const { helpers, isLoading, isError } = useHelpers();
  const [countdown, setCountdown] = useState(60);
  const [preferredPrice, setPreferredPrice] = useState('');
  const colorAnimation = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    let timer;
    if (visible) {
      setCountdown(60);
      Animated.timing(colorAnimation, {
        toValue: 1,
        duration: 60000,
        useNativeDriver: false,
      }).start();
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      colorAnimation.setValue(0);
    }
    return () => clearInterval(timer);
  }, [visible, colorAnimation]);

  const backgroundColor = colorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#00D09C', '#FFFFFF'],
  });

  const handleAccept = () => {
    onDismiss();
    navigation.navigate('Payment');
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <Text style={styles.title}>Available Helpers ({countdown}s)</Text>
        {isLoading && <Text>Loading...</Text>}
        {isError && <Text>Error fetching helpers</Text>}
        {helpers && (
          <FlatList
            data={helpers}
            keyExtractor={(item) => item.id}
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
  input: {
    marginTop: 10,
    marginBottom: 10,
  },
});

export default HelperListModal;
