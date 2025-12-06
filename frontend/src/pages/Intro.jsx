import { useNavigate } from 'react-router-dom';
import { Package, PlusCircle, ScanLine, PackagePlus, History, BarChart3, ArrowRight } from 'lucide-react';

export default function Intro() {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-auto p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <img src="/favicon.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang di Warung Kepo!</h1>
        <p className="text-gray-600">Aplikasi kasir warung dengan AI yang suka nebak-nebak</p>
      </div>

      {/* Step 1 - Yellow */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold text-lg">1</div>
          <h2 className="text-xl font-bold text-yellow-700">Pertama: Isi Daftar Produk</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Sebelum mulai transaksi, pastikan produk-produk warung kamu sudah terdaftar di sistem.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/add-product')}
            className="flex items-center gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <PlusCircle className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Tambah Produk</p>
              <p className="text-sm text-gray-500">Scan barcode untuk menambah produk baru</p>
            </div>
            <ArrowRight className="w-5 h-5 text-yellow-500 ml-auto" />
          </button>
          <button
            onClick={() => navigate('/products')}
            className="flex items-center gap-3 p-4 bg-white border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <Package className="w-6 h-6 text-yellow-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Produk Terdaftar</p>
              <p className="text-sm text-gray-500">Lihat & kelola semua produk</p>
            </div>
            <ArrowRight className="w-5 h-5 text-yellow-500 ml-auto" />
          </button>
        </div>
      </div>

      {/* Step 2 - Green */}
      <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">2</div>
          <h2 className="text-xl font-bold text-green-700">Kedua: Mulai Transaksi</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Catat semua transaksi jual-beli di warung kamu. Bisa scan barcode, deteksi AI, atau pilih manual.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/scan/out')}
            className="flex items-center gap-3 p-4 bg-white border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ScanLine className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Customer Beli</p>
              <p className="text-sm text-gray-500">Catat penjualan ke pelanggan</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-500 ml-auto" />
          </button>
          <button
            onClick={() => navigate('/scan/in')}
            className="flex items-center gap-3 p-4 bg-white border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
          >
            <PackagePlus className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Beli ke Vendor</p>
              <p className="text-sm text-gray-500">Catat pembelian stok dari supplier</p>
            </div>
            <ArrowRight className="w-5 h-5 text-green-500 ml-auto" />
          </button>
        </div>
      </div>

      {/* Step 3 - Orange */}
      <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">3</div>
          <h2 className="text-xl font-bold text-orange-700">Ketiga: Pantau Hasil</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Lihat riwayat transaksi dan statistik penjualan warung kamu.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-3 p-4 bg-white border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <History className="w-6 h-6 text-orange-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Riwayat</p>
              <p className="text-sm text-gray-500">Lihat semua transaksi yang sudah selesai</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-500 ml-auto" />
          </button>
          <button
            onClick={() => navigate('/statistik')}
            className="flex items-center gap-3 p-4 bg-white border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">Statistik</p>
              <p className="text-sm text-gray-500">Analisis penjualan & grafik</p>
            </div>
            <ArrowRight className="w-5 h-5 text-orange-500 ml-auto" />
          </button>
        </div>
      </div>

      {/* Fun note */}
      <div className="text-center p-4 bg-gray-100 rounded-xl">
        <p className="text-gray-600 text-sm">
          <span className="font-semibold">Fitur Warung Kepo:</span> Setelah transaksi selesai, AI akan nebak-nebak mau masak apa berdasarkan belanjaanmu!
        </p>
      </div>
    </div>
  );
}
