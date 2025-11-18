import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import type { IconProps } from 'react-native-paper/lib/typescript/components/MaterialCommunityIcon';
import { theme } from '../theme/theme';

type RadioProps = {
  selected: boolean;
  value: any;
  setSelected: (state?: any) => void;
  icon?: IconProps;
  title?: string;
  description: string;
};

const RadioBtn: React.FC<RadioProps> = ({
  selected,
  value,
  setSelected,
  icon,
  title,
  description,
}) => {
    
  return (
    <TouchableRipple
      onPress={() => setSelected(value)}
      key={value}
      style={[
        styles.parent,
        {
          borderColor: selected ? theme.colors.primary : 'grey',
          backgroundColor: selected
            ? theme.colors.primaryTrans
            : theme.colors.secondary,
        },
      ]}
    >
      {icon && (
        <View style={styles.iconView}>
          <MaterialCommunityIcons name={icon} />
        </View>
      )}
      <View
        style={{
          marginInlineEnd: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        {title && <Text style={styles.title}>{title}</Text>}
        <Text style={!title ? styles.sub : styles.sm}>{description}</Text>
      </View>
      {selected && (
        <MaterialCommunityIcons
          name="check-circle"
          color={theme.colors.primary}
        />
      )}
    </TouchableRipple>
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
    borderWidth: 1.5,
    backgroundColor: theme.colors.background,
  },
  iconView: {
    padding: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    color: 'white',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: theme.colors.text,
    fontFamily: theme.fonts.bold,
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
