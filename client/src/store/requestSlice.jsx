import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import requestApi from "../api/requestApi";

export const getMyRequests = createAsyncThunk(
  "request/getMyRequests",
  async (params, { rejectWithValue }) => {
    try {
      const res = await requestApi.getMyRequests(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getHospitalRequests = createAsyncThunk(
  "request/getHospitalRequests",
  async (params, { rejectWithValue }) => {
    try {
      const res = await requestApi.getHospitalRequests(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);
export const getAllRequests = createAsyncThunk(
  "request/getAllRequests",
  async (params, { rejectWithValue }) => {
    try {
      const res = await requestApi.getAllRequests(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getRequestStats = createAsyncThunk(
  "request/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await requestApi.getRequestStats();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const requestSlice = createSlice({
  name: "request",
  initialState: {
    requests: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearRequestError: (state) => {
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
      state.requests = action.payload.data?.requests || action.payload.data || [];
      state.pagination = action.payload.data?.pagination || null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An error occurred";
    };

    builder
      .addCase(getMyRequests.pending, handlePending)
      .addCase(getMyRequests.fulfilled, handleFulfilled)
      .addCase(getMyRequests.rejected, handleRejected)
      
      .addCase(getHospitalRequests.pending, handlePending)
      .addCase(getHospitalRequests.fulfilled, handleFulfilled)
      .addCase(getHospitalRequests.rejected, handleRejected)
      
      .addCase(getAllRequests.pending, handlePending)
      .addCase(getAllRequests.fulfilled, handleFulfilled)
      .addCase(getAllRequests.rejected, handleRejected)
      
      .addCase(getRequestStats.pending, handlePending)
      .addCase(getRequestStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getRequestStats.rejected, handleRejected);
  },
});

export const { clearRequestError } = requestSlice.actions;
export default requestSlice.reducer;
