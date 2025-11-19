// utils/firebaseConfig.ts
import {
  initializeApp as initializeFirebaseApp,
  getApps,
} from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyCOTvrP3IpGvzUl250cHv5I_McAxf0IDcY',
  authDomain: 'epmate-app.firebaseapp.com',
  projectId: 'epmate-app',
  storageBucket: 'epmate-app.firebasestorage.app',
  messagingSenderId: '1045005823140',
  appId: '1:1045005823140:web:ba19af9f2e6c3a78deca31',
  measurementId: 'G-50J15H9WEL',
};

const app =
  getApps().length === 0 ? initializeFirebaseApp(firebaseConfig) : getApps()[0];

export { app};
