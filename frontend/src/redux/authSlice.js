import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../services/axiosClient';

// Khôi phục user từ token sau hard refresh
export const fetchMeThunk = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get('/profile/');
      return {
        ...res.data.data.user,
        avatar_url: res.data.data.profile?.avatar_url || null
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Phiên đăng nhập hết hạn');
    }
  }
);

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Đăng nhập thất bại');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post('/auth/register', { name, email, password });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Đăng ký thất bại');
    }
  }
);

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerThunk.fulfilled, (state) => { state.loading = false; })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      });
  },
});

export const { loginSuccess, logout, updateProfile, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
