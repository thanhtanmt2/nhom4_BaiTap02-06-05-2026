import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../services/axiosClient';

export const fetchProfileThunk = createAsyncThunk(
  'profile/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get('/profile/');
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Lỗi tải hồ sơ');
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  'profile/update',
  async ({ full_name, phone, address }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.put('/profile/', { full_name, phone, address });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cập nhật thất bại');
    }
  }
);

export const uploadAvatarThunk = createAsyncThunk(
  'profile/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await axiosClient.post('/profile/avatar', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Upload ảnh thất bại');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    profile: null,
    loading: false,
    saveLoading: false,
    avatarLoading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearProfileMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchProfileThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile || { full_name: '', phone: '', address: '', avatar_url: null };
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // update
      .addCase(updateProfileThunk.pending, (state) => { state.saveLoading = true; state.error = null; state.success = null; })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.profile = action.payload.profile;
        state.success = 'Cập nhật thông tin thành công!';
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.saveLoading = false;
        state.error = action.payload;
      })
      // avatar
      .addCase(uploadAvatarThunk.pending, (state) => { state.avatarLoading = true; state.error = null; })
      .addCase(uploadAvatarThunk.fulfilled, (state, action) => {
        state.avatarLoading = false;
        if (state.profile) state.profile.avatar_url = action.payload.avatar_url;
        state.success = 'Cập nhật ảnh đại diện thành công!';
      })
      .addCase(uploadAvatarThunk.rejected, (state, action) => {
        state.avatarLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfileMessages } = profileSlice.actions;
export default profileSlice.reducer;
