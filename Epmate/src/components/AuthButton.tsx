import React from 'react';
import { Text, Button, type ButtonProps } from 'react-native-paper';
import { theme } from '../theme/theme';

type Props = {
  btnText: string;
  btnMode?: 'contained' | 'outlined';
  btnStyle: 'solid' | 'border';
  rounded?: boolean;
  onClick: () => void;
  style?: ButtonProps;
  mv?: boolean;
  icon?: string;
  disabled?: boolean;
};
const AuthBtn: React.FC<Props> = ({
  btnText,
  btnMode,
  btnStyle = 'solid',
  rounded,
  onClick,
  style,
  mv,
  icon,
  disabled,
}) => {
  const textColor = {
    solid: theme.colors.secondary,
    border: theme.colors.primary,
  };

  const btnColor = {
    border: theme.colors.secondary,
    solid: theme.colors.primary,
  };

  return (
    <Button
      mode={btnMode}
      textColor={textColor[btnStyle]}
      buttonColor={btnColor[btnStyle]}
      style={[
        { borderRadius: rounded ? 50 : 10, marginVertical: mv ? 16 : 0 },
        disabled && {
          backgroundColor: 'grey',
          borderColor: 'black',
          cursor: 'auto',
        },
        { ...style },
      ]}
      onPress={onClick}
      icon={icon}
      disabled={disabled}
    >
      {btnText}
    </Button>
  );
};

export default AuthBtn;
