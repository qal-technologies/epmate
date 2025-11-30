// styles/commonStyles.ts
import {StyleSheet} from 'react-native';
import {theme} from '../theme/theme';

/**
 * Common reusable styles to reduce duplication across components
 */
export const commonStyles = StyleSheet.create({
  // Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },

  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },

  // Card styles
  card: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },

  cardSmall: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  cardLarge: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  // Button styles
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },

  roundButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 50,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar styles
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primaryTrans,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryTrans,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Text styles
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: theme.colors.secondary,
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    width: '100%',
  },

  modalContentFull: {
    backgroundColor: theme.colors.secondary,
    padding: 20,
    paddingTop: 30,
    width: '100%',
    borderRadius: 12,
    bottom: 0,
    position: 'absolute',
    borderStartStartRadius: 25,
    borderEndStartRadius: 25,
  },

  // Close button for modals
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 4,
    borderRadius: 70,
    backgroundColor: theme.colors.background,
  },

  // Row layouts
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  // Shadow styles
  shadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: theme.colors.placeholder,
    marginVertical: 12,
  },

  // Progress bar container
  progressContainer: {
    width: '80%',
    height: 8,
    backgroundColor: theme.colors.primaryTrans,
    borderRadius: 50,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});

/**
 * Common border radius values
 */
export const borderRadius = {
  small: 8,
  medium: 12,
  large: 15,
  xlarge: 20,
  xxlarge: 25,
  round: 50,
  circle: 70,
} as const;

/**
 * Common spacing values
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/**
 * Common font sizes
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 35,
} as const;
