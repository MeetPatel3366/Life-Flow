import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import notificationApi from "../api/notificationApi";

export const getNotifications = createAsyncThunk(
  "notification/getNotifications",
  async (params, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getNotifications(params);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    pagination: null,
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearNotificationError: (state) => {
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
      state.notifications = action.payload.data?.notifications || action.payload.data || [];
      state.pagination = action.payload.data?.pagination || null;
      state.unreadCount = action.payload.data?.unreadCount || 0;
    };

    const handleRejected = (state, action) => {
      state.loading = false;
      state.error = action.payload || "An error occurred";
    };

    builder
      .addCase(getNotifications.pending, handlePending)
      .addCase(getNotifications.fulfilled, handleFulfilled)
      .addCase(getNotifications.rejected, handleRejected)
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
