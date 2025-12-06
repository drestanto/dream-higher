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
  const [filters, setFilters] = useState({ type: '' });
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 1000, // Get all transactions
        status: 'COMPLETED',
        ...filters,
      });

      const response = await api.get(`/transactions?${params}`);
      setTransactions(response.data.transactions);
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

  const toggleSection = (section) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
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
            Total: {transactions.length} transaksi
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
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100vh-12rem)]">
          {/* Penjualan Column */}
          {!filters.type || filters.type === 'OUT' ? (
            <div className="flex-1 flex flex-col min-h-0 h-1/2 lg:h-auto bg-green-50/30 rounded-xl border-2 border-green-200 p-4">
              <button
                onClick={() => toggleSection('OUT')}
                className="flex items-center gap-2 mb-3 w-full hover:bg-green-100/50 p-3 rounded-lg transition-colors bg-white shadow-sm"
              >
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 flex-1 text-left">
                  Penjualan ({groupedTransactions.OUT.length})
                </h2>
                {collapsedSections.has('OUT') ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {!collapsedSections.has('OUT') && (groupedTransactions.OUT.length === 0 ? (
                <p className="text-gray-500 text-sm ml-11">Belum ada transaksi penjualan</p>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 pr-2">
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
              ))}
            </div>
          ) : null}

          {/* Pembelian Column */}
          {!filters.type || filters.type === 'IN' ? (
            <div className="flex-1 flex flex-col min-h-0 h-1/2 lg:h-auto bg-blue-50/30 rounded-xl border-2 border-blue-200 p-4">
              <button
                onClick={() => toggleSection('IN')}
                className="flex items-center gap-2 mb-3 w-full hover:bg-blue-100/50 p-3 rounded-lg transition-colors bg-white shadow-sm"
              >
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 flex-1 text-left">
                  Pembelian ({groupedTransactions.IN.length})
                </h2>
                {collapsedSections.has('IN') ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {!collapsedSections.has('IN') && (groupedTransactions.IN.length === 0 ? (
                <p className="text-gray-500 text-sm ml-11">Belum ada transaksi pembelian</p>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 pr-2">
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
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
