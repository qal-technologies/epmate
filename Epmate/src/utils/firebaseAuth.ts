// utils/firebase/firebaseAuth.ts
import {
  initializeAuth,
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateEmail,
  updateCurrentUser,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
// import {
//   GoogleSignin,
//   statusCodes,
//   SignInResponse,
//   SignInSuccessResponse,
// } from '@react-native-google-signin/google-signin';
import { app } from './firebaseConfig';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// // Configure Google Sign-In
// GoogleSignin.configure({
//   webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
// });

const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
});

type AuthResponse = any; // Adjust as needed for Firebase UserCredential

const firebaseAuth = {
  signUpWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    return createUserWithEmailAndPassword(auth, email, password);
  },

  signInWithEmail: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    return signInWithEmailAndPassword(auth, email, password);
  },

  // signInWithGoogle: async (): Promise<AuthResponse> => {
  //   await GoogleSignin.hasPlayServices();
  //   const result: SignInResponse = await GoogleSignin.signIn();

  //   if (result.type !== 'success') {
  //     throw new Error('Google sign in was cancelled');
  //   }

  //   const successResult = result as SignInSuccessResponse;
  //   const { idToken } = successResult.data;
  //   if (!idToken) {
  //     throw new Error('No idToken from Google Sign-In');
  //   }

  //   const googleCredential = GoogleAuthProvider.credential(idToken);
  //   return signInWithCredential(auth, googleCredential);
  // },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    const extraDetails = {
      url: 'https://www.epmate.com/forgotPassword?type=reset',
      indoors: true,
      dynamicLinkDomain: 'epmate.com',
    };
    return sendPasswordResetEmail(auth, email, extraDetails);
  },

  signOut: async (): Promise<void> => {
    return signOut(auth);
  },

  getCurrentUser: () => {
    return auth.currentUser;
  },

  updatePassword:async (passoword:any)=>{
    return await updatePassword(auth.currentUser as any, passoword);
  }
};

export const AppAuth = auth;
export { onAuthStateChanged };
export { firebaseAuth };
