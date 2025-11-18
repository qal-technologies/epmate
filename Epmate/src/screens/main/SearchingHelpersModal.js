import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Modal, Portal } from 'react-native-paper';

const SearchingHelpersModal = ({ visible }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();
    } else {
      progress.setValue(0);
    }
  }, [visible, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Portal>
      <Modal visible={visible} contentContainerStyle={styles.modal}>
        <Text style={styles.text}>Searching for nearby helpers...</Text>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progress, { width }]} />
        </View>
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
    alignItems: 'center',
  },
  text: {
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  progress: {
    height: '100%',
    backgroundColor: '#00D09C',
    borderRadius: 5,
  },
});

export default SearchingHelpersModal;
