import React from 'react';
import {
  Text,
  Button,
  type ButtonProps,
  ActivityIndicator,
} from 'react-native-paper';
import { theme } from '../theme/theme';
import type { StyleProps } from 'react-native-reanimated';

type Props = {
  btnText: string;
  btnMode?: 'contained' | 'outlined';
  btnStyle: 'solid' | 'border';
  rounded?: boolean;
  onClick: () => void;
  style?: StyleProps | {};
  mv?: boolean;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
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
  loading,
  loadingText,
}) => {
  const textColor = {
    solid: disabled || loading ? '#454545' : theme.colors.secondary,
    border: disabled || loading ? '#454545' : theme.colors.primary,
  };

  const btnColor = {
    border: disabled || loading ? '#c9c9c9' : theme.colors.secondary,
    solid: disabled || loading ? '#c9c9c9' : theme.colors.primary,
  };

  const border = {
    border: {
      borderColor: disabled || loading ? '#c9c9c9' : theme.colors.primary,
    },
    solid: {
      borderColor: 'transparent',
    },
  };

  return (
    <Button
      mode={btnMode}
      textColor={textColor[btnStyle]}
      buttonColor={btnColor[btnStyle]}
      style={[
        {
          borderRadius: rounded ? 50 : 12,
          marginVertical: mv ? 16 : 0,
          width: '90%',
          maxWidth: 350,
          padding: 3,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: border[btnStyle].borderColor,
          alignSelf:'center'
        },

        disabled && {
          cursor: 'auto',
        },
        { ...style },
      ]}
      onPress={onClick}
      icon={icon}
      disabled={!!loading || !!disabled}
    >
      {!loading
        ? btnText
        : loadingText || (
            <ActivityIndicator size={'small'} color={textColor[btnStyle]} />
          )}
    </Button>
  );
};

export default AuthBtn;
