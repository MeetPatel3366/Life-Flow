import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import bloodStockApi from "../api/bloodStockApi";

export const getBloodStock = createAsyncThunk(
  "bloodStock/getBloodStock",
  async (params, { rejectWithValue }) => {
    try {
      const res = await bloodStockApi.getBloodStock(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAvailableBloodStock = createAsyncThunk(
  "bloodStock/getAvailable",
  async (params, { rejectWithValue }) => {
    try {
      const res = await bloodStockApi.getAvailableBloodStock(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getHospitalBloodStock = createAsyncThunk(
  "bloodStock/getHospitalBloodStock",
  async ({ hospitalId, params }, { rejectWithValue }) => {
    try {
      const res = await bloodStockApi.getHospitalBloodStock(hospitalId, params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getBloodStockStats = createAsyncThunk(
  "bloodStock/getStats",
  async (params, { rejectWithValue }) => {
    try {
      const res = await bloodStockApi.getBloodStockStats(params);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const bloodStockSlice = createSlice({
  name: "bloodStock",
  initialState: {
    stock: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearBloodStockError: (state) => {
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
      state.stock = action.payload.data?.bloodStocks || action.payload.data?.stocks || action.payload.data?.stock || action.payload.data || [];
      state.pagination = action.payload.data?.pagination || null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An error occurred";
    };

    builder
      .addCase(getBloodStock.pending, handlePending)
      .addCase(getBloodStock.fulfilled, handleFulfilled)
      .addCase(getBloodStock.rejected, handleRejected)
      
      .addCase(getAvailableBloodStock.pending, handlePending)
      .addCase(getAvailableBloodStock.fulfilled, handleFulfilled)
      .addCase(getAvailableBloodStock.rejected, handleRejected)
      
      .addCase(getHospitalBloodStock.pending, handlePending)
      .addCase(getHospitalBloodStock.fulfilled, handleFulfilled)
      .addCase(getHospitalBloodStock.rejected, handleRejected)
      
      .addCase(getBloodStockStats.pending, handlePending)
      .addCase(getBloodStockStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(getBloodStockStats.rejected, handleRejected);
  },
});

export const { clearBloodStockError } = bloodStockSlice.actions;
export default bloodStockSlice.reducer;
