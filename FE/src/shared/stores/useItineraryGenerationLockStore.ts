import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ItineraryGenerationLockState = {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
};

export const useItineraryGenerationLockStore = create<ItineraryGenerationLockState>()(
  persist(
    (set) => ({
      isLocked: false,
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false }),
    }),
    {
      name: "bujirun-itinerary-generation-lock",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
