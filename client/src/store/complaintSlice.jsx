import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import complaintApi from "../api/complaintApi";

export const getMyComplaints = createAsyncThunk(
  "complaint/getMyComplaints",
  async (params, { rejectWithValue }) => {
    try {
      const res = await complaintApi.getMyComplaints(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getHospitalComplaints = createAsyncThunk(
  "complaint/getHospitalComplaints",
  async (params, { rejectWithValue }) => {
    try {
      const res = await complaintApi.getHospitalComplaints(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getAllComplaints = createAsyncThunk(
  "complaint/getAllComplaints",
  async (params, { rejectWithValue }) => {
    try {
      const res = await complaintApi.getAllComplaints(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const complaintSlice = createSlice({
  name: "complaint",
  initialState: {
    complaints: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearComplaintError: (state) => {
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
      state.complaints = action.payload.data?.complaints || action.payload.data || [];
      state.pagination = action.payload.data?.pagination || null;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An error occurred";
    };

    builder
      .addCase(getMyComplaints.pending, handlePending)
      .addCase(getMyComplaints.fulfilled, handleFulfilled)
      .addCase(getMyComplaints.rejected, handleRejected)
      
      .addCase(getHospitalComplaints.pending, handlePending)
      .addCase(getHospitalComplaints.fulfilled, handleFulfilled)
      .addCase(getHospitalComplaints.rejected, handleRejected)
      
      .addCase(getAllComplaints.pending, handlePending)
      .addCase(getAllComplaints.fulfilled, handleFulfilled)
      .addCase(getAllComplaints.rejected, handleRejected);
  },
});

export const { clearComplaintError } = complaintSlice.actions;
export default complaintSlice.reducer;
