import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const RatingScreen:React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Rate the helper</Text>
      {/* Add rating component here */}
      <Button mode="contained">Submit</Button>
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

export default RatingScreen;
