import { create } from 'zustand';
import api from '../services/api';
import { socket } from '../services/socket';

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

  // Socket event handlers
  handleItemAdded: (data) => {
    const { currentTransaction } = get();
    if (currentTransaction && data.transaction.id === currentTransaction.id) {
      set({
        currentTransaction: data.transaction,
        items: data.transaction.items,
      });
    }
  },
}));

// Setup socket listeners
socket.on('item:added', (data) => {
  useTransactionStore.getState().handleItemAdded(data);
});

socket.on('item:updated', (data) => {
  useTransactionStore.getState().handleItemAdded(data);
});

socket.on('item:removed', (data) => {
  useTransactionStore.getState().handleItemAdded(data);
});

export default useTransactionStore;
