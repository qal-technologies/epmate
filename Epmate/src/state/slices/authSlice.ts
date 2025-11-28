import {createSlice,PayloadAction} from '@reduxjs/toolkit';

interface UserType
{
  id?: string;
  mobile?: string | number;
  displayName?: string;
  mobileVerified?: boolean;
  role?: 'helper' | 'user' | null;
  [key: string]: any;
}

interface currentTracking
{
  helper?: any,
  service?: any,
  serviceType?: any;
  paymentData?: any;
};

interface AuthState
{
  isLoggedIn: boolean;
  user: UserType | null;
  role: 'helper' | 'user' | null;
  mobileVerified: boolean;
  current: currentTracking;
}


const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  role: null,
  mobileVerified: false,
  current: {
    helper: null,
    service: null,
    serviceType: null,
    paymentData: null,
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state,action: PayloadAction<UserType | undefined>) =>
    {
      state.isLoggedIn = true;
      state.user = action.payload ?? null;
      state.role = action.payload?.role ?? null;
      state.mobileVerified = action.payload?.mobileVerified ?? false;
    },

    updateUserProfile: (state,action: PayloadAction<Partial<UserType>>) =>
    {
      if (state.user)
      {
        state.user = {...state.user,...action.payload};
        state.role = action.payload.role ?? state.role;
        state.mobileVerified = action.payload.mobileVerified ?? state.mobileVerified;
      } else
      {
        // If no user exists yet, create one with the provided data
        state.user = action.payload;
        state.role = action.payload.role ?? null;
        state.mobileVerified = action.payload.mobileVerified ?? false;
        state.isLoggedIn = true;
      }
    },
    updateCurrent: (state,action: PayloadAction<Partial<AuthState>>) =>
    {
      if (state.user && state.current)
      {
        state.current.helper = action.payload.current?.helper;
        state.current.service = action.payload.current?.service;
        state.current.serviceType = action.payload.current?.serviceType;
        state.current.paymentData = action.payload.current?.paymentData;
      }
    },

    logout: state =>
    {
      state.isLoggedIn = false;
      state.user = null;
      state.role = null;
      state.mobileVerified = false;
    },
  },
});

export const {login,logout,updateUserProfile, updateCurrent} = authSlice.actions;
export default authSlice.reducer;
