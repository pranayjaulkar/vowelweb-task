import { create } from "zustand";

interface CreateModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useCreateModalStore = create<CreateModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
