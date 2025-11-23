import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { login } from '../../state/slices/authSlice';
import { theme } from '../../theme/theme';
import RadioBtn from '../../components/SelectBtn';

interface Props {
  onRoleSelect: () => void;
}

const ChooseRole: React.FC<Props> = ({onRoleSelect}) => {
  const roles = [
    {
      name: 'helper',
      title: 'Get Help',
      info: 'Find someone trusted to assist you with your needs.',
      icon:'location-pin'
    },
    {
      name: 'user',
      title: 'Offer Help',
      info: 'Provide assitance and earn money.',
      icon:'handshake'
    },
  ];

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const dispatch = useDispatch();

  const handleContinue = () => {
    if (selectedRole) {
      dispatch(login({ role: selectedRole }));
      onRoleSelect(); 
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to use Epmate?</Text>
      {roles.map(role => {
        return (
          <RadioBtn
            description={role.info}
            value={role.name}
            title={role.title}
            selected={selectedRole == role.name}
            setSelected={value => setSelectedRole(value)}
            icon={role.icon}
            mv
          />
        );
      })}
      <Button
        mode="contained"
        onPress={handleContinue}
        disabled={!selectedRole}
        style={styles.continueButton}
      >
        Continue
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginBottom: 16,
  },
  continueButton: {
    marginTop: 16,
  },
});

export default ChooseRole;
