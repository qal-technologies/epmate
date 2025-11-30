// constants/timeouts.ts
export const TIMEOUTS = {
  // Helper selection timeouts
  HELPER_ACCEPT_DURATION: 60000, // 60 seconds for helper to accept
  HELPER_STAGGER_DELAY: 5000,    // 5 seconds between each helper appearing
  HELPER_REMOVAL_DELAY: 500,     // 500ms delay before removing expired helper
  
  // Payment processing timeouts
  PAYMENT_ANIMATION_DURATION: 5000, // 5 seconds for payment progress animation
  PAYMENT_VERIFICATION_TIMEOUT: 3000, // 3 seconds before checking payment status
  
  // Map animation
  MAP_ANIMATION_DURATION: 1500, // 1.5 seconds for map animations
  MAP_USER_LOCATION_DURATION: 1000, // 1 second to animate to user location
  
  // Search modal
  SEARCH_MODAL_DURATION: 3200, // 3.2 seconds for searching helpers modal
} as const;

export const ANIMATION_DURATIONS = {
  SLIDE_IN: 100,
  SLIDE_OUT: 400,
  FADE_IN: 300,
} as const;

export const MAP_DELTAS = {
  LATITUDE: 0.0922,
  LONGITUDE: 0.0421,
} as const;
