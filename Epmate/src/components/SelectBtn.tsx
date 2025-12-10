import { AntDesign, FontAwesome, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { theme } from '../theme/theme';
import Animated, { FadeIn, FadeInRight, FadeOut, FadeOutRight } from 'react-native-reanimated';

type RadioProps = {
  selected: boolean;
  value: any;
  setSelected: (state?: any) => void;
  icon?: 'location-pin' | 'handshake' | string;
  title?: string;
  description: string;
  mv?: boolean;
  iconPack?:"Material"|'Awesome' | 'Community' | 'Ant'
};

const RadioBtn: React.FC<RadioProps> = ({
  selected,
  value,
  setSelected,
  icon,
  title,
  description,
  mv = true,
  iconPack ='Material'
}) => {
  return (
    <TouchableOpacity
      onPress={() => setSelected(value)}
      key={value}
      style={[
        styles.parent,
        {
          display: 'flex',
          flexDirection: 'row',
          gap: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 15,
          borderColor: selected
            ? theme.colors.primary
            : theme.colors.placeholder,
          borderRadius: 15,
          backgroundColor: selected ? theme.colors.primaryTrans : 'transparent',
          alignSelf: 'center',
          marginVertical: mv ? 6 : 0,
          width: '100%',
        },
      ]}
    >
      {icon && (
        <View style={styles.iconView}>
          {iconPack == 'Awesome' ? (
            <FontAwesome name={icon as any} size={20} color={'white'} />
          ) : iconPack == 'Community' ? (
            <MaterialCommunityIcons name={icon as any} size={20} color={'white'} />
          ) : iconPack == 'Ant' ? (
            <AntDesign name={icon as any} size={20} color={'white'} />
          ) : (
            <MaterialIcons name={icon as any} size={20} color={'white'} />
          )}
        </View>
      )}
      <View
        style={{
          marginInlineEnd: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '10px',
          flexShrink: 1,
          flex: 1,
        }}
      >
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={!title ? styles.title : styles.sm}>{description}</Text>
      </View>
      {selected && (
        <Animated.View entering={FadeInRight} exiting={FadeOutRight}>
        <MaterialCommunityIcons
          name="check-circle"
          color={theme.colors.primary}
          size={22}
          style={{
            marginRight: 10,
          }}
        />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  parent: {
    width: '90%',
    padding: 8,
    paddingInline: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderColor: 'grey',
    borderWidth: 1,
    backgroundColor: theme.colors.background,
  },
  iconView: {
    padding: 15,
    width: 50,
    height: 50,
    backgroundColor: theme.colors.primary,
    borderRadius: 500,
    overflow: 'hidden',
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
    maxWidth: '80%',
  },
  sub: {
    fontSize: 14,
    fontWeight: 'light',
    textAlign: 'center',
    marginBottom: 5,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
  sm: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
  },
});

export default RadioBtn;
