import React, { useState } from 'react';
import {
  View,
  TextInputProps,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
} from 'react-native';
import { theme } from '../theme/theme';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';

type MyInputProps = TextInputProps & {
  containerStyle?: object;
  type: 'mobile' | 'number' | 'email' | 'password' | 'text';
  placeholder?: string;
  secureTextEntry?: boolean;
  rounded?: boolean;
  borderless?: boolean;
  activeColor?: string;
  inactiveColor?: string;
};

const MyInput: React.FC<MyInputProps> = ({
  containerStyle,
  type,
  placeholder,
  secureTextEntry = false,
  rounded = false,
  borderless = false,
  activeColor = theme.colors.primary,
  inactiveColor = theme.colors.placeholder,
  ...rest
}) => {
  const getKeyboardType = () => {
    switch (type) {
      case 'mobile':
      case 'number':
        return 'numeric';
      case 'email':
        return 'email-address';
      default:
        return 'default';
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      style={[styles.container, containerStyle]}
    >
      {type == 'mobile' ? (
        <MobileInput
          country={'nigeria'}
          type="mobile"
          {...rest}
          placeholder={placeholder}
          keyboardType={getKeyboardType()}
          placeholderTextColor={inactiveColor}
          selectionColor={activeColor}
        />
      ) : (
        <TextInput
          style={[
            styles.input,
            rounded && styles.rounded,
            borderless && styles.borderless,
          ]}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={getKeyboardType()}
          placeholderTextColor={inactiveColor}
          selectionColor={activeColor}
          {...rest}
        />
      )}
    </Animated.View>
  );
};

const numberNflag = [
  {
    name: 'nigeria',
    code: '+234',
    flag: '🇳🇬',
  },
  {
    name: 'usa',
    code: '+1',
    flag: '🇺s',
  },
  {
    name: 'ghana',
    code: '+233',
    flag: '🇬🇭',
  },
  {
    name: 'cameroon',
    code: '+237',
    flag: '🇨🇲',
  },
];

const MobileInput: React.FC<MyInputProps & { country?: string }> = ({
  country,
  rounded,
  borderless,
  placeholder,
  keyboardType,
  inactiveColor,
  activeColor,
  ...rest
}) => {
  const gotten = numberNflag.find(
    number => number.name == country || 'nigeria',
  );

  const { code, flag } = gotten;
  const [showDrop, setShowDrop] = useState(false);

  const setCodeAndFlag = (value: any) => {};
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.background,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
          gap: 4,
        }}
      >
        <Text>{flag}</Text>
        <TextInput
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
          }}
          value={code}
          editable={false}
        />
        <MaterialIcons name="arrow-drop-down" color={'black'} size={16} />
      </View>

      <TextInput
        style={[
          styles.input,
          rounded && styles.rounded,
          borderless && styles.borderless,
        ]}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={inactiveColor}
        selectionColor={activeColor}
        {...rest}
      />
      {showDrop && (
        <View>
          {numberNflag.map(tag => {
            return (
              <TouchableOpacity>
                <Text>{tag.code}</Text>
                <Text>{tag.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  input: {
    height: 50,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: theme.colors.secondary,
    color: theme.colors.text,
  },
  rounded: {
    borderRadius: 25,
  },
  borderless: {
    borderWidth: 0,
  },
});

export default MyInput;