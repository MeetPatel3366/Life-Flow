import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import hospitalApi from "../api/hospitalApi";

export const getMyHospitalProfile = createAsyncThunk(
  "hospital/getMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await hospitalApi.getMyHospitalProfile();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMyHospitalProfile = createAsyncThunk(
  "hospital/updateMyProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await hospitalApi.updateMyHospitalProfile(formData);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPendingHospitals = createAsyncThunk(
  "hospital/getPending",
  async (params, { rejectWithValue }) => {
    try {
      const res = await hospitalApi.getPendingHospitals(params);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getHospitals = createAsyncThunk(
  "hospital/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const res = await hospitalApi.getHospitals(params);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const hospitalSlice = createSlice({
  name: "hospital",
  initialState: {
    myProfile: null,
    pendingHospitals: [],
    hospitals: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearHospitalError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getMyHospitalProfile.pending, (state) => {
      state.loading = true; state.error = null;
    });
    builder.addCase(getMyHospitalProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.myProfile = action.payload || null;
    });
    builder.addCase(updateMyHospitalProfile.pending, (state) => {
      state.loading = true; state.error = null;
    });
    builder.addCase(updateMyHospitalProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.myProfile = action.payload;
    });
    builder.addCase(getPendingHospitals.pending, (state) => {
      state.loading = true; state.error = null;
    });
    builder.addCase(getPendingHospitals.fulfilled, (state, action) => {
      state.loading = false;
      state.pendingHospitals = action.payload;
    });
    builder.addCase(getHospitals.pending, (state) => {
      state.loading = true; state.error = null;
    });
    builder.addCase(getHospitals.fulfilled, (state, action) => {
      state.loading = false;
      state.hospitals = action.payload;
    });
    builder.addMatcher(
      (action) => action.type.startsWith("hospital/") && action.type.endsWith("/rejected"),
      (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      }
    );
  },
});

export const { clearHospitalError } = hospitalSlice.actions;
export default hospitalSlice.reducer;
