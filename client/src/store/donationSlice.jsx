import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import donationApi from "../api/donationApi";

export const getMyDonations = createAsyncThunk(
  "donation/getMyDonations",
  async (params, { rejectWithValue }) => {
    try {
      const res = await donationApi.getMyDonations(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getHospitalDonations = createAsyncThunk(
  "donation/getHospitalDonations",
  async (params, { rejectWithValue }) => {
    try {
      const res = await donationApi.getHospitalDonations(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllDonations = createAsyncThunk(
  "donation/getAllDonations",
  async (params, { rejectWithValue }) => {
    try {
      const res = await donationApi.getAllDonations(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getDonationsByHospital = createAsyncThunk(
  "donation/getDonationsByHospital",
  async ({ hospitalId, params }, { rejectWithValue }) => {
    try {
      const res = await donationApi.getDonationsByHospital(hospitalId, params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getDonationStats = createAsyncThunk(
  "donation/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await donationApi.getDonationStats();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const donationSlice = createSlice({
  name: "donation",
  initialState: {
    donations: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDonationError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    const handlePending = (state) => {
      state.loading = true;
      state.error = null;
    };
    
    const handleFulfilled = (state, action) => {
      state.loading = false;
      state.donations = action.payload.data?.donations || action.payload.data || [];
      state.pagination = action.payload.data?.pagination || null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An error occurred";
    };

    builder
      .addCase(getMyDonations.pending, handlePending)
      .addCase(getMyDonations.fulfilled, handleFulfilled)
      .addCase(getMyDonations.rejected, handleRejected)
      
      .addCase(getHospitalDonations.pending, handlePending)
      .addCase(getHospitalDonations.fulfilled, handleFulfilled)
      .addCase(getHospitalDonations.rejected, handleRejected)
      
      .addCase(getDonationsByHospital.pending, handlePending)
      .addCase(getDonationsByHospital.fulfilled, handleFulfilled)
      .addCase(getDonationsByHospital.rejected, handleRejected)
      
      .addCase(getAllDonations.pending, handlePending)
      .addCase(getAllDonations.fulfilled, handleFulfilled)
      .addCase(getAllDonations.rejected, handleRejected)
      
      .addCase(getDonationStats.pending, handlePending)
      .addCase(getDonationStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getDonationStats.rejected, handleRejected);
  },
});

export const { clearDonationError } = donationSlice.actions;
export default donationSlice.reducer;
