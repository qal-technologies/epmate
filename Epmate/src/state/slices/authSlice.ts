import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserType {
  id?: string;
  email?: string;
  displayName?: string;
  [key: string]: any; 
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserType | null;
  role: string;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  role: 'user',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<UserType | undefined>) => {
      state.isLoggedIn = true;
      state.user = action.payload ?? null; 
    },

    logout: state => {
      state.isLoggedIn = false;
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
