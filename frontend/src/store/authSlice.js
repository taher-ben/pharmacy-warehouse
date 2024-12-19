import { createSlice } from "@reduxjs/toolkit";
import { redirect } from "react-router-dom";

const authSlice = createSlice({
  name: "auth",
  initialState: { token: localStorage.getItem("token") || null },
  reducers: {
    login: (state, action) => {
      state.token = action.payload;
      localStorage.setItem("token", action.payload);
    },
    logout: (state) => {
      state.token = null;
      setTimeout(() => {
        localStorage.removeItem("token");
        redirect("/login");
      }, 1000);
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
