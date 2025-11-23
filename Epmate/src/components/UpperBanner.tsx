import React from 'react';
import { Text } from 'react-native-paper';
import { Image, View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { theme } from '../theme/theme';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideInUp } from 'react-native-reanimated';
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
        entering={SlideInUp.springify()}
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
          </View>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  image: {
    maxWidth: '90%',
    maxHeight: '90%',
    flexShrink:0.8,
    objectFit: 'contain',
    alignSelf:'center'
  },
  gnBg: {
    backgroundColor: theme.colors.primary,
    width: Dimensions.get('window').width,
    display: 'flex',
    justifyContent: 'space-evenly',
    alignItems:'center',
    flexDirection: 'column',
    padding: 10,
    paddingTop:20,
    marginBottom: 15,
    textAlign: 'center',
    height:'40%',
    overflow: 'hidden',
  },
  bannerText: {
    marginTop: 4,
    width:'100%',
    alignSelf:'center',
  },
  sub: {
    fontSize: 22,
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
    opacity:.95,
    fontFamily: theme.fonts.regular,
  },
});

export default Banner;
