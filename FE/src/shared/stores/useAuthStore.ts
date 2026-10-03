import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
};

// accessToken은 새로고침 시 /api/auth/reissue로 재발급받으므로 메모리에만 보관한다.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
  clear: () => set({ accessToken: null }),
}));
