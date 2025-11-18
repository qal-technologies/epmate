import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const TaskCompletionScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>Is the task complete?</Text>
      <Button mode="contained" onPress={() => navigation.navigate('Rating')}>
        Yes
      </Button>
      <Button mode="outlined" onPress={() => navigation.navigate('Issue')}>
        No
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TaskCompletionScreen;
