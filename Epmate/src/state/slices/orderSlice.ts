import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { HelperData } from '../../hooks/useHelpers';

interface LocationData {
  pickupLocation: string | null;
  deliveryLocation: string | null;
}

interface PaymentData {
  helperID: string | null;
  userID: string | null;
  price: string | null;
  currency: string | null;
  paymentID?: string | null;
}

type OrderStatus = 'idle' | 'selecting' | 'confirmed' | 'processing' | 'completed' | 'failed';

interface OrderState {
  currentService: string | null;
  serviceType: string | null;
  selectedHelper: HelperData | null;
  locationData: LocationData;
  paymentData: PaymentData | null;
  orderStatus: OrderStatus;
  isSearching: boolean;
}

const initialState: OrderState = {
  currentService: null,
  serviceType: null,
  selectedHelper: null,
  locationData: {
    pickupLocation: null,
    deliveryLocation: null,
  },
  paymentData: null,
  orderStatus: 'idle',
  isSearching: false,
};

const orderSlice = createSlice( {
  name: 'order',
  initialState,
  reducers: {
    setCurrentService: ( state, action: PayloadAction<string> ) => {
      state.currentService = action.payload;
      state.orderStatus = 'selecting';
    },
    setServiceType: ( state, action: PayloadAction<string> ) => {
      state.serviceType = action.payload;
    },

    setSelectedHelper: ( state, action: PayloadAction<HelperData> ) => {
      state.selectedHelper = action.payload;
    },

    setLocationData: ( state, action: PayloadAction<LocationData> ) => {
      state.locationData = action.payload;
    },

    setPaymentData: ( state, action: PayloadAction<PaymentData> ) => {
      state.paymentData = action.payload;
    },

    updateOrderStatus: ( state, action: PayloadAction<OrderStatus> ) => {
      state.orderStatus = action.payload;
    },

    setIsSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },

    // Legacy action for compatibility with existing code
    updateCurrent: ( state, action: PayloadAction<{ current: any; }> ) => {
      const { current } = action.payload;

      if ( current.helper ) {
        state.selectedHelper = current.helper;
      }

      if ( current.paymentData ) {
        state.paymentData = {
          ...state.paymentData,
          ...current.paymentData,
        };
      }
    },

    clearOrder: ( state ) => {
      state.currentService = null;
      state.serviceType = null;
      state.selectedHelper = null;
      state.locationData = {
        pickupLocation: null,
        deliveryLocation: null,
      };
      state.paymentData = null;
      state.orderStatus = 'idle';
      state.isSearching = false;
    },
  },
} );

export const {
  setCurrentService,
  setSelectedHelper,
  setLocationData,
  setPaymentData,
  updateOrderStatus,
  updateCurrent,
  clearOrder,
  setServiceType,
  setIsSearching,
} = orderSlice.actions;

export default orderSlice.reducer;
