import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  id: string | null;
  email: string | null;
  token: string | null;
  role: string | null;
  center?: string | null;
}

const initialState: UserState = {
  id: null,
  email: null,
  token: null,
  role: null,
  center: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      state.id = action.payload.id;
      state.email = action.payload.email;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.center = action.payload.center || null;
    },
    logout(state) {
      state.id = null;
      state.email = null;
      state.token = null;
      state.role = null;
      state.center = null;
    },
  },
});

export const { setUser, logout } = userSlice.actions;
export default userSlice.reducer;
