import React, {useState} from 'react';
import {
  View,
  TextInputProps,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import {theme} from '../theme/theme';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {MaterialIcons} from '@expo/vector-icons';

type MyInputProps = TextInputProps & {
  containerStyle?: object;
  type?: 'mobile' | 'number' | 'email' | 'password' | 'text' | 'otp';
  placeholder?: string;
  secureTextEntry?: boolean;
  rounded?: boolean;
  borderless?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  withLabel?: boolean;
  label?: string;
  centerUpper?: boolean;
  labelNote?: string;
  value?: any;
  upperMb?: number;
  setValue?: (state: any) => void;
  disabled?: boolean;
  country?: string;
};

const MyInput: React.FC<MyInputProps> = ({
  containerStyle,
  type = 'text',
  placeholder,
  secureTextEntry = false,
  rounded = false,
  value,
  setValue,
  borderless = false,
  activeColor = theme.colors.primary,
  inactiveColor = theme.colors.placeholder,
  withLabel = false,
  label = '',
  labelNote,
  centerUpper,
  upperMb,
  disabled = false,
  ...rest
}) => {
  const getKeyboardType = () => {
    switch(type) {
      case 'mobile':
      case 'number':
      case 'otp':
        return 'numeric';
      case 'email':
        return 'email-address';
      default:
        return 'default';
    }
  };
  const [focused, setFocused] = useState(false);
  const gotten = numberNflag.find(
    number => number.name == 'nigeria',
  );

  return (
    <View
      style={{
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginVertical: 10,
      }}
    >
      {withLabel && label && (
        <View style={[styles.upper, {marginBottom: upperMb ? upperMb : 5}]}>
          <Text
            style={[
              styles.label,
              centerUpper && {textAlign: 'center', alignSelf: 'center'},
            ]}
          >
            {label}
          </Text>
          {labelNote && (
            <Text
              style={[
                styles.note,
                centerUpper && {textAlign: 'center', alignSelf: 'center'},
              ]}
            >
              {labelNote}
            </Text>
          )}
        </View>
      )}

      <Animated.View
        entering={FadeInDown.springify()}
        style={[
          styles.container,
          containerStyle,
          rounded && styles.rounded,
          borderless && styles.borderless,
          focused && {borderColor: theme.colors.primary},
          type === 'otp' && {width: '30%', maxWidth: 200},
        ]}
      >
        {type == 'mobile' && (
          <View
            style={{
              backgroundColor: theme.colors.secondary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: 50,
              paddingHorizontal: 8,
              paddingInlineStart: 14,
              borderRightColor: focused
                ? theme.colors.primary
                : theme.colors.primaryTrans,
              borderRightWidth: 1,
              gap: 4,
            }}
          >
            <Text>{gotten?.flag}</Text>
            <TextInput
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: theme.colors.text,
              }}
              value={gotten?.code}
              editable={false}
              onFocus={() => setFocused(!focused)}
              onBlur={() => setFocused(!focused)}
            />
            <MaterialIcons name="arrow-drop-down" color={'black'} size={16} />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            type === 'otp' && {
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: 18,
            },
          ]}
          maxLength={type === 'otp' ? 4 : type == 'mobile' ? 11 : 50}
          value={value}
          onChangeText={text => setValue && setValue(text)}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={getKeyboardType()}
          placeholderTextColor={inactiveColor}
          selectionColor={activeColor}
          onFocus={() => setFocused(!focused)}
          onBlur={() => setFocused(!focused)}
          {...rest}
          editable={!disabled}
        />
      </Animated.View>
    </View>
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

export const MobileInput: React.FC<MyInputProps> = ({
  country,
  placeholder,
  keyboardType,
  inactiveColor,
  activeColor,
  ...rest
}) => {
  const gotten = numberNflag.find(
    number => number.name == country || 'nigeria',
  );

  const [showDrop, setShowDrop] = useState(false);
  const [focused, setFocused] = useState(false);

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
        <Text>{gotten?.flag}</Text>
        <TextInput
          style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: theme.colors.text,
          }}
          value={gotten?.code}
          editable={false}
          onFocus={() => setFocused(!focused)}
          onBlur={() => setFocused(!focused)}
        />
        <MaterialIcons name="arrow-drop-down" color={'black'} size={16} />
      </View>

      <TextInput
        style={[
          styles.input,
        ]}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={inactiveColor}
        selectionColor={activeColor}
        {...rest}
      />
      {showDrop && (
        <View>
          {numberNflag.map((tag, index) => {
            return (
              <TouchableOpacity key={index}>
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
    width: Dimensions.get('window').width - 50,
    maxWidth: 400,
    flex: 1,
    borderWidth: 1.5,
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.primaryTrans,
    borderRadius: 10,
    minHeight: 50,
    maxHeight: 50,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  upper: {
    gap: 1,
  },
  label: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'left'
  },
  note: {
    color: 'gray',
    opacity: 0.98,
    textAlign: 'left'
  },
  input: {
    height: 50,
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    paddingHorizontal: 10,
  },
  rounded: {
    borderRadius: 20,
  },
  borderless: {
    borderWidth: 0,
  },
});

export default MyInput;