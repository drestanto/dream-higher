import { useEffect, useState } from 'react';
import {
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import api from '../services/api';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: '', status: 'COMPLETED' });
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...filters,
      });

      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
          <p className="text-gray-500">
            Total: {pagination.total} transaksi
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border rounded-lg bg-white text-gray-700"
          >
            <option value="">Semua Tipe</option>
            <option value="OUT">Penjualan (OUT)</option>
            <option value="IN">Pembelian (IN)</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border rounded-lg bg-white text-gray-700"
          >
            <option value="">Semua Status</option>
            <option value="COMPLETED">Selesai</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden"
            >
              {/* Transaction Header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(tx.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Type Icon */}
                  <div
                    className={`p-2 rounded-lg ${
                      tx.type === 'OUT'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {tx.type === 'OUT' ? (
                      <ArrowUpCircle className="w-5 h-5" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">
                        {tx.type === 'OUT' ? 'Penjualan' : 'Pembelian'}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          tx.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {tx.status === 'COMPLETED' ? 'Selesai' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(tx.completedAt || tx.createdAt)} • {tx.items?.length || 0} item
                    </p>
                  </div>
                </div>

                {/* Amount and expand */}
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg text-gray-800">
                    {formatRupiah(tx.totalAmount)}
                  </span>
                  {expandedId === tx.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === tx.id && (
                <div className="border-t p-4 bg-gray-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left pb-2">Produk</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Harga</th>
                        <th className="text-right pb-2">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tx.items?.map((item) => (
                        <tr key={item.id} className="border-t border-gray-200">
                          <td className="py-2 text-gray-800">
                            {item.product?.name || 'Unknown'}
                          </td>
                          <td className="py-2 text-center text-gray-600">
                            x{item.quantity}
                          </td>
                          <td className="py-2 text-right text-gray-600">
                            {formatRupiah(item.unitPrice)}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-800">
                            {formatRupiah(item.unitPrice * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Kepo guess if exists */}
                  {tx.kepoGuess && (
                    <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-700">
                        <span className="font-medium">🗣️ Kepo Warung:</span> "{tx.kepoGuess}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-gray-600">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
