import {configureStore,combineReducers} from '@reduxjs/toolkit';
import {persistStore,persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import orderReducer from './slices/orderSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth','order'], // Only persist auth and order state
};

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  order: orderReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig,rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST','persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
