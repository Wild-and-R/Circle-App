import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/api";

interface LikeState {
  likedThreads: Record<number, boolean>;
}

const initialState: LikeState = {
  likedThreads: {},
};

export const toggleLikeThread = createAsyncThunk(
  "likes/toggleLike",
  async (threadId: number) => {
    await api.post(`/threads/${threadId}/like`);
    return threadId;
  }
);

const likeSlice = createSlice({
  name: "likes",
  initialState,
  reducers: {
    toggleLikeLocal: (state, action) => {
      const id = action.payload;
      state.likedThreads[id] = !state.likedThreads[id];
    },

    setInitialLikes: (state, action) => {
      action.payload.forEach((id: number) => {
        state.likedThreads[id] = true;
      });
    },
  },

  extraReducers: (builder) => {
    builder.addCase(toggleLikeThread.rejected, (state, action) => {
      const id = action.meta.arg;
      // rollback
      state.likedThreads[id] = !state.likedThreads[id];
    });
  },
});

export const { toggleLikeLocal, setInitialLikes } = likeSlice.actions;
export default likeSlice.reducer;
