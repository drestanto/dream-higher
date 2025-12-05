import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import api from '../services/api';
import { beep } from '../services/sound';
import {
  ScanBarcode,
  Package,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  AlertCircle,
  Info,
} from 'lucide-react';

// Available categories (same as seed data)
const CATEGORIES = [
  'Minuman',
  'Makanan Ringan',
  'Mie & Bihun',
  'Bumbu Dapur',
  'Rokok',
  'Kebutuhan Rumah Tangga',
  'Lainnya',
];

export default function AddProductPage() {
  const navigate = useNavigate();

  // States
  const [step, setStep] = useState('scan'); // 'scan', 'exists', 'form', 'success'
  const [scannedBarcode, setScannedBarcode] = useState(null);
  const [existingProduct, setExistingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    buyPrice: '',
    sellPrice: '',
    category: 'Lainnya',
    stock: '0',
  });
  const [formErrors, setFormErrors] = useState({});

  // Handle barcode scan
  const handleScan = useCallback(async (barcode) => {
    setIsLoading(true);
    setError(null);
    setScannedBarcode(barcode);

    try {
      // Check if barcode exists in DB
      const response = await api.get(`/products/barcode/${barcode}`);

      // Product exists
      beep('scanOut');
      setExistingProduct(response.data);
      setStep('exists');
    } catch (err) {
      if (err.response?.status === 404) {
        // Product not found - show form
        beep('scanIn');
        setExistingProduct(null);
        setFormData({
          name: '',
          buyPrice: '',
          sellPrice: '',
          category: 'Lainnya',
          stock: '0',
        });
        setStep('form');
      } else {
        beep('error');
        setError('Gagal mengecek barcode');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Nama produk wajib diisi';
    }

    const buyPrice = parseInt(formData.buyPrice);
    if (!formData.buyPrice || isNaN(buyPrice) || buyPrice < 0) {
      errors.buyPrice = 'Harga beli harus angka positif';
    }

    const sellPrice = parseInt(formData.sellPrice);
    if (!formData.sellPrice || isNaN(sellPrice) || sellPrice < 0) {
      errors.sellPrice = 'Harga jual harus angka positif';
    }

    if (buyPrice > sellPrice) {
      errors.sellPrice = 'Harga jual harus lebih besar dari harga beli';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.post('/products', {
        barcode: scannedBarcode,
        name: formData.name.trim(),
        buyPrice: parseInt(formData.buyPrice),
        sellPrice: parseInt(formData.sellPrice),
        category: formData.category,
        stock: parseInt(formData.stock) || 0,
      });

      beep('complete');
      setStep('success');
    } catch (err) {
      beep('error');
      if (err.response?.data?.error === 'Barcode already exists') {
        setError('Barcode sudah terdaftar di database');
      } else {
        setError(err.response?.data?.error || 'Gagal menyimpan produk');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Reset to scan again
  const handleScanAgain = () => {
    setStep('scan');
    setScannedBarcode(null);
    setExistingProduct(null);
    setError(null);
    setFormErrors({});
  };

  // Format currency
  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-7 h-7 text-purple-600" />
              Tambah Produk Baru
            </h1>
            <p className="text-gray-500 mt-1">
              Scan barcode untuk menambah produk baru ke database
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Step: Scan */}
          {step === 'scan' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                <ScanBarcode className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-800">Scan Barcode Produk</p>
                  <p className="text-sm text-purple-600">
                    Arahkan kamera ke barcode produk, atau upload foto barcode
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <BarcodeScanner onScan={handleScan} isActive={step === 'scan'} />
              </div>

              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Mengecek barcode...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Product Exists */}
          {step === 'exists' && existingProduct && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Produk Sudah Terdaftar</p>
                  <p className="text-sm text-yellow-600">
                    Barcode <span className="font-mono font-semibold">{scannedBarcode}</span> sudah ada di database
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">Detail Produk</h3>

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Nama</span>
                    <span className="font-medium text-gray-800">{existingProduct.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Barcode</span>
                    <span className="font-mono text-gray-800">{existingProduct.barcode}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Kategori</span>
                    <span className="text-gray-800">{existingProduct.category}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Harga Beli (Modal)</span>
                    <span className="text-gray-800">{formatRupiah(existingProduct.buyPrice)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Harga Jual</span>
                    <span className="font-semibold text-green-600">{formatRupiah(existingProduct.sellPrice)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Stok</span>
                    <span className="text-gray-800">{existingProduct.stock}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleScanAgain}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <ScanBarcode className="w-5 h-5" />
                Scan Barcode Lain
              </button>
            </div>
          )}

          {/* Step: Form for New Product */}
          {step === 'form' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Produk Baru Terdeteksi</p>
                  <p className="text-sm text-green-600">
                    Barcode <span className="font-mono font-semibold">{scannedBarcode}</span> belum ada di database. Isi detail produk di bawah.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6 space-y-5">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Indomie Goreng"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                      formErrors.name ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price explanation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Perbedaan Harga:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Harga Beli (Modal)</strong> = Harga beli dari supplier/distributor</li>
                      <li><strong>Harga Jual</strong> = Harga jual ke customer</li>
                    </ul>
                  </div>
                </div>

                {/* Buy Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Beli / Modal (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="buyPrice"
                    value={formData.buyPrice}
                    onChange={handleInputChange}
                    placeholder="Contoh: 2500"
                    min="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                      formErrors.buyPrice ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.buyPrice && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.buyPrice}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">Harga beli dari supplier</p>
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice}
                    onChange={handleInputChange}
                    placeholder="Contoh: 3500"
                    min="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none ${
                      formErrors.sellPrice ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.sellPrice && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.sellPrice}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">Harga jual ke customer</p>
                </div>

                {/* Initial Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stok Awal
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleScanAgain}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Simpan Produk
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Produk Berhasil Ditambahkan!
                </h3>
                <p className="text-green-600">
                  <span className="font-semibold">{formData.name}</span> sudah tersimpan di database
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleScanAgain}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ScanBarcode className="w-5 h-5" />
                  Tambah Produk Lain
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Lihat Daftar Produk
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
