export type HomeStackParamList = {
  Home: undefined;
  ErrandType: undefined;
  TaskCompletion: undefined;
  Rating: undefined;
  Issue: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Account: undefined;
  Profile: undefined;
};

export type DrawerParamList = {
  Main: undefined;
  Payment: undefined;
  'My Tasks': undefined;
  Safety: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Terms: undefined;
  Policy: undefined;
  Role: undefined;
  userName: undefined;
  otp: { otp: number | string; mobile: number | string; };
  forgotPassword: undefined;
  Home: undefined;
  Payment: undefined;
};

export type RootStackParamList = {
  MainDrawer: undefined;
  
  // Service Flow Screens (Fullscreen)
  ServiceTypeSelection: undefined;
  LocationInput: undefined;
  HelperSelection: undefined;
  
  // Payment Flow Screens (Already fullscreen)
  ConfirmOrder: undefined;
  ProcessingPayment: undefined;
  CompletePayment: undefined;
  
  // Utility Screens (Already fullscreen)
  CallPage: undefined;
  LiveTracking: undefined;
  
  Auth: undefined;
};
