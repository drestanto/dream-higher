import { create } from 'zustand';
import api from '../services/api';

const useTransactionStore = create((set, get) => ({
  currentTransaction: null,
  items: [],
  isLoading: false,
  error: null,
  kepoGuess: null,
  kepoAudioUrl: null,

  // Create a new transaction
  createTransaction: async (type = 'OUT') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/transactions', { type });
      set({ currentTransaction: response.data, items: [], isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Add item by barcode
  addItemByBarcode: async (barcode) => {
    const { currentTransaction } = get();
    if (!currentTransaction) {
      throw new Error('No active transaction');
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/transactions/${currentTransaction.id}/items`, {
        barcode,
      });
      set({
        currentTransaction: response.data.transaction,
        items: response.data.transaction.items,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Update item quantity
  updateQuantity: async (itemId, quantity) => {
    const { currentTransaction } = get();
    if (!currentTransaction) return;

    try {
      const response = await api.patch(
        `/transactions/${currentTransaction.id}/items/${itemId}`,
        { quantity }
      );
      set({
        currentTransaction: response.data.transaction,
        items: response.data.transaction.items,
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Remove item
  removeItem: async (itemId) => {
    const { currentTransaction } = get();
    if (!currentTransaction) return;

    try {
      const response = await api.delete(
        `/transactions/${currentTransaction.id}/items/${itemId}`
      );
      set({
        currentTransaction: response.data.transaction,
        items: response.data.transaction.items,
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Decrease item quantity by 1 (for object detection cancel)
  decreaseItemByBarcode: async (barcode) => {
    const { currentTransaction, items } = get();
    if (!currentTransaction) return { success: false };

    // Find item with this barcode
    const item = items.find((i) => i.product?.barcode === barcode);
    if (!item) return { success: false, reason: 'not_found' };

    if (item.quantity <= 1) {
      // Remove item completely
      try {
        const response = await api.delete(
          `/transactions/${currentTransaction.id}/items/${item.id}`
        );
        set({
          currentTransaction: response.data.transaction,
          items: response.data.transaction.items,
        });
        return { success: true, action: 'removed' };
      } catch (error) {
        set({ error: error.message });
        return { success: false };
      }
    } else {
      // Decrease quantity by 1
      try {
        const response = await api.patch(
          `/transactions/${currentTransaction.id}/items/${item.id}`,
          { quantity: item.quantity - 1 }
        );
        set({
          currentTransaction: response.data.transaction,
          items: response.data.transaction.items,
        });
        return { success: true, action: 'decreased' };
      } catch (error) {
        set({ error: error.message });
        return { success: false };
      }
    }
  },

  // Complete transaction
  completeTransaction: async () => {
    const { currentTransaction } = get();
    if (!currentTransaction) return;

    set({ isLoading: true });
    try {
      const response = await api.post(`/transactions/${currentTransaction.id}/complete`);
      set({
        currentTransaction: response.data.transaction,
        kepoGuess: response.data.kepoGuess,
        kepoAudioUrl: response.data.kepoAudioUrl,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Cancel transaction
  cancelTransaction: async () => {
    const { currentTransaction } = get();
    if (!currentTransaction) return;

    try {
      await api.delete(`/transactions/${currentTransaction.id}`);
      set({
        currentTransaction: null,
        items: [],
        kepoGuess: null,
        kepoAudioUrl: null,
      });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Clear kepo state
  clearKepo: () => {
    set({ kepoGuess: null, kepoAudioUrl: null });
  },

  // Reset store
  reset: () => {
    set({
      currentTransaction: null,
      items: [],
      isLoading: false,
      error: null,
      kepoGuess: null,
      kepoAudioUrl: null,
    });
  },
}));

export default useTransactionStore;
