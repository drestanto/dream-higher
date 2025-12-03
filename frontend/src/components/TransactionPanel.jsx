import { Minus, Plus, Trash2, Check, X, Printer } from 'lucide-react';
import useTransactionStore from '../stores/transactionStore';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TransactionPanel({ onComplete, onCancel }) {
  const { currentTransaction, items, updateQuantity, removeItem, isLoading } =
    useTransactionStore();

  if (!currentTransaction) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>Mulai scan untuk membuat transaksi</p>
      </div>
    );
  }

  const handleQuantityChange = (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQty);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">
              {currentTransaction.type === 'OUT' ? 'Customer Beli' : 'Beli ke Vendor'}
            </h3>
            <p className="text-sm text-gray-500">
              {items.length} item
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              currentTransaction.type === 'OUT'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {currentTransaction.type}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Belum ada item</p>
            <p className="text-sm">Scan barcode untuk menambahkan</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white rounded-lg shadow-sm border p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatRupiah(item.unitPrice)} / pcs
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="font-semibold text-gray-800">
                    {formatRupiah(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer with total and actions */}
      <div className="border-t bg-white p-4">
        {/* Total */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-medium text-gray-600">Total</span>
          <span className="text-2xl font-bold text-gray-800">
            {formatRupiah(currentTransaction.totalAmount)}
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            <span>Batal</span>
          </button>
          <button
            onClick={onComplete}
            disabled={isLoading || items.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-5 h-5" />
            <span>{isLoading ? 'Memproses...' : 'Selesai'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
