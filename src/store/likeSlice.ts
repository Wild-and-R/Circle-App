import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/api";

interface LikeEntry {
  liked: boolean;
  count: number;
}

interface LikeState {
  threads: Record<number, LikeEntry>;
}

const initialState: LikeState = {
  threads: {},
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
    hydrateLikes: (
      state,
      action: {
        payload: {
          id: number;
          likedByMe: boolean;
          likes: number;
        }[];
      }
    ) => {
      action.payload.forEach((t) => {
        const existing = state.threads[t.id];

        if (!existing) {
          state.threads[t.id] = {
            liked: t.likedByMe,
            count: t.likes,
          };
          return;
        }

        state.threads[t.id] = {
          liked: existing.liked || t.likedByMe,
          count: Math.max(existing.count, t.likes),
        };
      });
    },

    toggleLikeOptimistic: (state, action) => {
      const id = action.payload;
      const entry = state.threads[id];

      if (!entry) return;

      entry.liked = !entry.liked;
      entry.count += entry.liked ? 1 : -1;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(toggleLikeThread.rejected, (state, action) => {
      const id = action.meta.arg;
      const entry = state.threads[id];

      if (!entry) return;

      // Rollback optimistic update
      entry.liked = !entry.liked;
      entry.count += entry.liked ? 1 : -1;
    });
  },
});

export const {
  hydrateLikes,
  toggleLikeOptimistic,
} = likeSlice.actions;

export default likeSlice.reducer;
