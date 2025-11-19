// navigation/types.ts
export type HomeStackParamList = {
  Home: undefined;
  PickupDelivery: undefined;
  ErrandType: { visible: boolean } | undefined;
  TaskCompletion: undefined;
  Rating: undefined;
  Issue: undefined;
  Payment: undefined;
  ConfirmOrder: undefined;
  CompletePayment: undefined;
  ProcessingPayment: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Account: undefined;
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
  Role: { userId?: string } | undefined;
  userName: { userId?: string } | undefined;
  forgotPassword: { userId?: string } | undefined;
};

export type RootStackParamList = AuthStackParamList & {
  MainDrawer: undefined;
  Home: { userId?: string } | undefined;
};
