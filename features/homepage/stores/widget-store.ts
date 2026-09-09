import { create } from "zustand";

interface WidgetState {
  isOpen: boolean;
  rulesOpen: boolean;
  kudosOpen: boolean;
  toggleWidget: () => void;
  closeWidget: () => void;
  openRules: () => void;
  closeRules: () => void;
  openKudos: () => void;
  closeKudos: () => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  isOpen: false,
  rulesOpen: false,
  kudosOpen: false,
  toggleWidget: () => set((state) => ({ isOpen: !state.isOpen })),
  closeWidget: () => set({ isOpen: false }),
  openRules: () => set({ isOpen: false, rulesOpen: true }),
  closeRules: () => set({ rulesOpen: false }),
  openKudos: () => set({ isOpen: false, kudosOpen: true }),
  closeKudos: () => set({ kudosOpen: false }),
}));
