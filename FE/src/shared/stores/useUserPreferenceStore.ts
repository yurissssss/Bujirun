import { create } from "zustand";

type UserPreferenceState = {
  selectedRegion: string | null;
  setSelectedRegion: (region: string | null) => void;
};

export const useUserPreferenceStore = create<UserPreferenceState>((set) => ({
  selectedRegion: null,
  setSelectedRegion: (region) => set({ selectedRegion: region }),
}));
