import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';
import api from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, revenueRes, topRes, catRes, lowRes] = await Promise.all([
        api.get('/analytics/summary?period=week'),
        api.get('/analytics/revenue'),
        api.get('/analytics/top-products?limit=5'),
        api.get('/analytics/categories'),
        api.get('/analytics/low-stock'),
      ]);

      setSummary(summaryRes.data);
      setRevenue(revenueRes.data);
      setTopProducts(topRes.data);
      setCategories(catRes.data);
      setLowStock(lowRes.data);
      setWeeklyData(summaryRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardType) => {
    setExpandedCard(expandedCard === cardType ? null : cardType);
  };

  const closeModal = () => {
    setExpandedCard(null);
  };

  const revenueChartData = {
    labels: revenue.slice(-7).map((r) => {
      const date = new Date(r.date);
      return date.toLocaleDateString('id-ID', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Pendapatan',
        data: revenue.slice(-7).map((r) => r.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const topProductsChartData = {
    labels: topProducts.map((p) => p.product.name.substring(0, 15)),
    datasets: [
      {
        label: 'Terjual',
        data: topProducts.map((p) => p.totalQuantity),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  const categoryChartData = {
    labels: categories.map((c) => c.category),
    datasets: [
      {
        data: categories.map((c) => c.totalRevenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Ringkasan aktivitas warung 7 hari terakhir</p>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => handleCardClick('sales')}
          className="bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Penjualan 7 Hari</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatRupiah(summary?.totalSales || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Klik untuk detail harian</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => handleCardClick('purchases')}
          className="bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pembelian Stok 7 Hari</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatRupiah(summary?.totalPurchases || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Klik untuk detail harian</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => handleCardClick('profit')}
          className="bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Profit Bersih 7 Hari</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatRupiah(summary?.netProfit || 0)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Klik untuk detail harian</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div
          onClick={() => handleCardClick('transactions')}
          className="bg-white rounded-xl shadow-sm p-5 border cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Transaksi 7 Hari</p>
              <p className="text-2xl font-bold text-gray-800">
                {summary?.transactionCount || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">Klik untuk detail harian</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Modal for 7-day breakdown */}
      {expandedCard && weeklyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          {/* Blur backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

          {/* Modal content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {expandedCard === 'sales' && 'Penjualan 7 Hari Terakhir'}
                {expandedCard === 'purchases' && 'Pembelian 7 Hari Terakhir'}
                {expandedCard === 'profit' && 'Profit 7 Hari Terakhir'}
                {expandedCard === 'transactions' && 'Transaksi 7 Hari Terakhir'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total (7 hari)</p>
                <p className="text-2xl font-bold text-gray-800">
                  {expandedCard === 'sales' && formatRupiah(weeklyData?.totalSales || 0)}
                  {expandedCard === 'purchases' && formatRupiah(weeklyData?.totalPurchases || 0)}
                  {expandedCard === 'profit' && formatRupiah(weeklyData?.netProfit || 0)}
                  {expandedCard === 'transactions' && `${weeklyData?.transactionCount || 0} transaksi`}
                </p>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">BREAKDOWN HARIAN</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {revenue.slice(-7).map((day) => {
                    const date = new Date(day.date);
                    const dayName = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

                    return (
                      <div key={day.date} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{dayName}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {expandedCard === 'sales' && formatRupiah(day.revenue || 0)}
                          {expandedCard === 'purchases' && formatRupiah(day.purchases || 0)}
                          {expandedCard === 'profit' && formatRupiah(day.profit || 0)}
                          {expandedCard === 'transactions' && `${day.transactionCount || 0} tx`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-gray-500">
                  {expandedCard === 'sales' && `Total ${weeklyData?.salesCount || 0} transaksi penjualan`}
                  {expandedCard === 'purchases' && `Total ${weeklyData?.purchaseCount || 0} transaksi pembelian`}
                  {expandedCard === 'profit' && `${weeklyData?.salesCount || 0} transaksi penjualan, ${weeklyData?.purchaseCount || 0} transaksi pembelian`}
                  {expandedCard === 'transactions' && `${weeklyData?.salesCount || 0} penjualan, ${weeklyData?.purchaseCount || 0} pembelian`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h3 className="font-semibold text-gray-800 mb-4">Pendapatan 7 Hari Terakhir</h3>
          <div className="h-64">
            <Line
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => formatRupiah(value),
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h3 className="font-semibold text-gray-800 mb-4">Produk Terlaris</h3>
          <div className="h-64">
            <Bar
              data={topProductsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-5 border">
          <h3 className="font-semibold text-gray-800 mb-4">Penjualan per Kategori</h3>
          <div className="h-48">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: { boxWidth: 12, font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5 border">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">Stok Menipis</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Semua stok aman</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-auto">
              {lowStock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      Sisa: {product.stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
