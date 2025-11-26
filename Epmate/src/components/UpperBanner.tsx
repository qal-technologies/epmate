import React from 'react';
import { Text } from 'react-native-paper';
import { Image, View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { theme } from '../theme/theme';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOutUp, SlideInDown, SlideInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';


type Props = {
  withText?: boolean;
};

const Banner: React.FC<Props> = ({ withText = true }) => {
  return (
    <>
      <StatusBar
        animated
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
        translucent
      />
      <Animated.View
        entering={FadeInUp.springify()}
        exiting={FadeOutUp.springify()} 
        style={[
          styles.gnBg,
          {
            maxHeight: !withText
              ? Dimensions.get('screen').height / 3
              : Dimensions.get('screen').height / 2,
          },
        ]}
      >
        <Image
          source={require('../assets/images/logoName.png')}
          style={styles.image}
        />
        {withText && (
          <View style={styles.bannerText}>
            <Text style={styles.sub}>Get Help Anytime, Anywhere</Text>
            <Text style={styles.small}>
              From chores to repairs, deliveries, cooking, assignment and more -
              your trusted helpers are one tap away.
            </Text>

            <Animated.Image source={require('../assets/images/handyman.png')} entering={FadeInDown.springify()} style={styles.handyman} />
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  image: {
    maxWidth: '50%',
    maxHeight: '50%',
    flexShrink: 0.8,
    objectFit: 'contain',
    alignSelf: 'center',
    marginTop: 20,
  },
  gnBg: {
    backgroundColor: theme.colors.primary,
    width: Dimensions.get('window').width,
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'column',
    padding: 10,
    paddingTop: 40,
    marginBottom: 15,
    textAlign: 'center',
    height: '55%',
    overflow: 'hidden',
  },
  bannerText: {
    width: '100%',
    alignSelf: 'center',
    marginTop: -30,
  },
  sub: {
    fontSize: 25,
    fontWeight: 'bold',
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
    opacity: .95,
    fontFamily: theme.fonts.regular,
  },
  handyman: {
    position: 'absolute',
    top: 52,
    width: 170,
    height: 170,
    alignSelf: 'center',
  },
});

export default Banner;
