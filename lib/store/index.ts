import { configureStore } from "@reduxjs/toolkit";
import pinnedConversationsReducer from "./pinnedConversationsSlice";

const STORAGE_KEY = "dataw-pinned-conversations";

export const store = configureStore({
  reducer: {
    pinnedConversations: pinnedConversationsReducer,
  },
});

if (typeof window !== "undefined") {
  store.subscribe(() => {
    try {
      const state = store.getState();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.pinnedConversations),
      );
    } catch {
      // ignore storage errors
    }
  });
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
