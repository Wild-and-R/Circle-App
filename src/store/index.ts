import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import likeReducer from "./likeSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    likes: likeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
