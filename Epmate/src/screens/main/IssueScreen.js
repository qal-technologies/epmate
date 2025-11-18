import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, TextInput, RadioButton, Text } from 'react-native-paper';

const issueOptions = [
  'Helper was late',
  'Helper was unprofessional',
  'Item was damaged',
  'Other',
];

const IssueScreen = () => {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [customIssue, setCustomIssue] = useState('');

  return (
    <View style={styles.container}>
      <Text>What was the issue?</Text>
      <RadioButton.Group onValueChange={setSelectedIssue} value={selectedIssue}>
        {issueOptions.map((option) => (
          <View key={option} style={styles.radioButtonContainer}>
            <RadioButton value={option} />
            <Text>{option}</Text>
          </View>
        ))}
      </RadioButton.Group>
      {selectedIssue === 'Other' && (
        <TextInput
          label="Please describe the issue"
          value={customIssue}
          onChangeText={setCustomIssue}
          style={styles.input}
        />
      )}
      <Button mode="contained">Submit</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    marginTop: 10,
  },
});

export default IssueScreen;
