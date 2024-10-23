import { Product } from "types";
import { create } from "zustand";

interface ProductStore {
  updateProduct: Product | null;
  deleteProduct: Product | null;
  setUpdateProduct: (product: Product | null) => void;
  setDeleteProduct: (product: Product | null) => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  updateProduct: null,
  deleteProduct: null,
  setUpdateProduct: (product) => set({ updateProduct: product }),
  setDeleteProduct: (product) => set({ deleteProduct: product }),
}));
