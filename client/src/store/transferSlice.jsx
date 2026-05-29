import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import transferApi from "../api/transferApi";

export const getTransfers = createAsyncThunk(
  "transfer/getTransfers",
  async (params, { rejectWithValue }) => {
    try {
      const res = await transferApi.getTransfers(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllTransfers = createAsyncThunk(
  "transfer/getAllTransfers",
  async (params, { rejectWithValue }) => {
    try {
      const res = await transferApi.getAllTransfers(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getTransferStats = createAsyncThunk(
  "transfer/getStats",
  async (params, { rejectWithValue }) => {
    try {
      const res = await transferApi.getTransferStats(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const transferSlice = createSlice({
  name: "transfer",
  initialState: {
    transfers: [],
    pagination: null,
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearTransferError: (state) => {
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
      state.transfers = action.payload.data?.transfers || action.payload.data || [];
      state.pagination = action.payload.data?.pagination || null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An error occurred";
    };

    builder
      .addCase(getTransfers.pending, handlePending)
      .addCase(getTransfers.fulfilled, handleFulfilled)
      .addCase(getTransfers.rejected, handleRejected)
      
      .addCase(getAllTransfers.pending, handlePending)
      .addCase(getAllTransfers.fulfilled, handleFulfilled)
      .addCase(getAllTransfers.rejected, handleRejected)
      
      .addCase(getTransferStats.pending, handlePending)
      .addCase(getTransferStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
      })
      .addCase(getTransferStats.rejected, handleRejected);
  },
});

export const { clearTransferError } = transferSlice.actions;
export default transferSlice.reducer;
