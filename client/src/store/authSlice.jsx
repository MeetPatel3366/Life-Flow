import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import authApi from "../api/authApi";

const stored = JSON.parse(localStorage.getItem("lifeflow_auth") || "null");

const initialState = {
  user: stored?.user || null,
  accessToken: stored?.accessToken || null,
  refreshToken: stored?.refreshToken || null,
  isAuthenticated: !!stored?.accessToken,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authApi.login(credentials);
      return res.data.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authApi.googleLogin(data);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getMyProfile = createAsyncThunk(
  "auth/getMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.getMe();
      return res.data.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateMyProfile = createAsyncThunk(
  "auth/updateProfile",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await authApi.updateProfile(formData);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProfileImage = createAsyncThunk(
  "auth/updateProfileImage",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await authApi.updateProfileImage(formData);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      if (user) state.user = user;
      if (accessToken) state.accessToken = accessToken;
      if (refreshToken) state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      
      localStorage.setItem(
        "lifeflow_auth",
        JSON.stringify({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        })
      );
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        authSlice.caseReducers.setCredentials(state, { payload: action.payload });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        authSlice.caseReducers.setCredentials(state, { payload: action.payload });
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getMyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        const stored = JSON.parse(localStorage.getItem("lifeflow_auth") || "{}");
        localStorage.setItem("lifeflow_auth", JSON.stringify({ ...stored, user: state.user }));
      })
      .addCase(getMyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateMyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        const stored = JSON.parse(localStorage.getItem("lifeflow_auth") || "{}");
        localStorage.setItem("lifeflow_auth", JSON.stringify({ ...stored, user: state.user }));
      })

      .addCase(updateProfileImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileImage.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        const stored = JSON.parse(localStorage.getItem("lifeflow_auth") || "{}");
        localStorage.setItem("lifeflow_auth", JSON.stringify({ ...stored, user: state.user }));
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem("lifeflow_auth");
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem("lifeflow_auth");
      });
  },
});

export const { setCredentials, clearError } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.user?.role;

export default authSlice.reducer;
