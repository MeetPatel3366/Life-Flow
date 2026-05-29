import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import contactApi from "../api/contactApi";

export const fetchAllContacts = createAsyncThunk(
  "contact/fetchAllContacts",
  async (params, { rejectWithValue }) => {
    try {
      const res = await contactApi.getAllContacts(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const contactSlice = createSlice({
  name: "contact",
  initialState: {
    contacts: [],
    pagination: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearContactError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts =
          action.payload.data?.contacts || action.payload.data || [];
        state.pagination = action.payload.data?.pagination || null;
      })
      .addCase(fetchAllContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      });
  },
});

export const { clearContactError } = contactSlice.actions;
export default contactSlice.reducer;
