import { useEffect, useState } from 'react';
import {
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Minus,
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
  const [filters, setFilters] = useState({ type: '' });
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 50,
        status: 'COMPLETED',
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

  const toggleCollapse = (id) => {
    setCollapsedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Group transactions by type
  const groupedTransactions = {
    OUT: transactions.filter((t) => t.type === 'OUT'),
    IN: transactions.filter((t) => t.type === 'IN'),
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
            className="px-3 py-2 border rounded-lg bg-white text-gray-700 text-sm md:text-base"
          >
            <option value="">Semua Tipe</option>
            <option value="OUT">Penjualan</option>
            <option value="IN">Pembelian</option>
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
        <div className="space-y-6">
          {/* Penjualan Group */}
          {!filters.type || filters.type === 'OUT' ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Penjualan ({groupedTransactions.OUT.length})
                </h2>
              </div>

              {groupedTransactions.OUT.length === 0 ? (
                <p className="text-gray-500 text-sm ml-11">Belum ada transaksi penjualan</p>
              ) : (
                <div className="space-y-2 ml-0 md:ml-11">
                  {groupedTransactions.OUT.map((tx) => (
                    <div key={tx.id} className="bg-white rounded-lg shadow-sm border">
                      {/* Transaction Header */}
                      <div className="p-3 md:p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base md:text-lg text-gray-800">
                              {formatRupiah(tx.totalAmount)}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {formatDate(tx.completedAt || tx.createdAt)} • {tx.items?.length || 0} item
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCollapse(tx.id)}
                          className="ml-2 p-2 hover:bg-gray-100 rounded-lg"
                        >
                          {collapsedIds.has(tx.id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Minus className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Items - Default Expanded */}
                      {!collapsedIds.has(tx.id) && (
                        <div className="border-t px-3 md:px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            {tx.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700 flex-1 min-w-0 truncate">
                                  {item.product?.name || 'Unknown'}
                                </span>
                                <span className="text-gray-600 ml-2 whitespace-nowrap">
                                  x{item.quantity}
                                </span>
                                <span className="font-medium text-gray-800 ml-3 whitespace-nowrap">
                                  {formatRupiah(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Kepo guess */}
                          {tx.kepoGuess && (
                            <div className="mt-3 p-2 bg-orange-50 rounded-lg">
                              <p className="text-xs md:text-sm text-orange-700">
                                <span className="font-medium">🗣️ Kepo:</span> "{(() => {
                                  try {
                                    const parsed = JSON.parse(tx.kepoGuess);
                                    return parsed.sentence || tx.kepoGuess;
                                  } catch {
                                    return tx.kepoGuess;
                                  }
                                })()}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Pembelian Group */}
          {!filters.type || filters.type === 'IN' ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Pembelian ({groupedTransactions.IN.length})
                </h2>
              </div>

              {groupedTransactions.IN.length === 0 ? (
                <p className="text-gray-500 text-sm ml-11">Belum ada transaksi pembelian</p>
              ) : (
                <div className="space-y-2 ml-0 md:ml-11">
                  {groupedTransactions.IN.map((tx) => (
                    <div key={tx.id} className="bg-white rounded-lg shadow-sm border">
                      {/* Transaction Header */}
                      <div className="p-3 md:p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base md:text-lg text-gray-800">
                              {formatRupiah(tx.totalAmount)}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {formatDate(tx.completedAt || tx.createdAt)} • {tx.items?.length || 0} item
                          </p>
                        </div>
                        <button
                          onClick={() => toggleCollapse(tx.id)}
                          className="ml-2 p-2 hover:bg-gray-100 rounded-lg"
                        >
                          {collapsedIds.has(tx.id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <Minus className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Items - Default Expanded */}
                      {!collapsedIds.has(tx.id) && (
                        <div className="border-t px-3 md:px-4 py-3 bg-gray-50">
                          <div className="space-y-2">
                            {tx.items?.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-700 flex-1 min-w-0 truncate">
                                  {item.product?.name || 'Unknown'}
                                </span>
                                <span className="text-gray-600 ml-2 whitespace-nowrap">
                                  x{item.quantity}
                                </span>
                                <span className="font-medium text-gray-800 ml-3 whitespace-nowrap">
                                  {formatRupiah(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
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
