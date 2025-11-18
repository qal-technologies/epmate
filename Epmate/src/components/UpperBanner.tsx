import React from 'react';
import { Text } from 'react-native-paper';
import { Image, View, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';

type Props = {
    withText?:boolean
}

const Banner: React.FC<Props> = ({ withText = true }) => {
  return (
    <View style={styles.gnBg}>
      <Image src={require('../assets/images/logo.jpg')} style={styles.image} />
      {withText && (
        <>
          <Text style={styles.sub}>Get Help Anytime, Anywhere</Text>
          <Text style={styles.small}>
            From chores to repairs, deliveries, cooking, assignment and more -
            your trusted helpers are one tap away.
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    maxWidth: '70%',
    objectFit: 'cover',
  },
  gnBg: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: 30,
    textAlign: 'center',
  },
  sub: {
    fontSize: 16,
    fontWeight: 'light',
    textAlign: 'center',
    marginBottom: 5,
    color: 'white',
    fontFamily: theme.fonts.regular,
  },
  small: {
    fontSize: 14,
    fontWeight: 'light',
    textAlign: 'center',
    color: 'white',
    fontFamily: theme.fonts.regular,
  },
});

export default Banner;