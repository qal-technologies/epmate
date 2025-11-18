// utils/firebase/firebaseAuth.ts
import { initializeApp } from 'firebase/app';
import auth, { FirebaseAuthTypes} from '@react-native-firebase/auth';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  GoogleSignin,
  statusCodes,
  User as GoogleUser,
  SignInResponse,
  SignInSuccessResponse,
} from '@react-native-google-signin/google-signin';
import { app } from './firebaseConfig';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});

type AuthResponse = FirebaseAuthTypes.UserCredential;

const firebaseAuth = {
  signUpWithEmail: async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    return auth().createUserWithEmailAndPassword(email, password);
  },

  signInWithEmail: async (
    email: string,
    password: string,
  ): Promise<AuthResponse> => {
    return auth().signInWithEmailAndPassword(email, password);
  },

  signInWithGoogle: async (): Promise<AuthResponse> => {
    // First, make sure Google Play services (if Android) are available
    await GoogleSignin.hasPlayServices();

    const result: SignInResponse = await GoogleSignin.signIn();

    // Check if response is success
    if (result.type !== 'success') {
      throw new Error('Google sign in was cancelled');
    }

    // Here, result is SignInSuccessResponse
    const successResult = result as SignInSuccessResponse; // fix below

    const { idToken } = successResult.data; // in v13+, data has idToken
    if (!idToken) {
      throw new Error('No idToken from Google Sign-In');
    }

    // Create a Firebase credential with the token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);

    // Sign in with credential
    return auth().signInWithCredential(googleCredential);
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    return auth().sendPasswordResetEmail(email);
  },

  signOut: async (): Promise<void> => {
    return auth().signOut();
  },

  getCurrentUser: (): FirebaseAuthTypes.User | null => {
    return auth().currentUser;
  },
};

export const AppAuth = getAuth(app);
export { onAuthStateChanged };
export { firebaseAuth };
