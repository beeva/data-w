import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "dataw-pinned-conversations";

function getInitialPinned(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Conversation key format: "requestId:collectorId"
 * Pinned keys are shown at the top of the conversation list.
 * Persisted in localStorage so pins survive refresh.
 */
const pinnedConversationsSlice = createSlice({
  name: "pinnedConversations",
  initialState: getInitialPinned(),
  reducers: {
    togglePin(state, action: { payload: string }) {
      const key = action.payload;
      const index = state.indexOf(key);
      if (index >= 0) {
        state.splice(index, 1);
      } else {
        state.push(key);
      }
    },
  },
});

export const { togglePin } = pinnedConversationsSlice.actions;
export default pinnedConversationsSlice.reducer;
