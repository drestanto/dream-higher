import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import ObjectDetectionScanner from '../components/ObjectDetectionScanner';
import TransactionPanel from '../components/TransactionPanel';
import KepoPopup from '../components/KepoPopup';
import useTransactionStore from '../stores/transactionStore';
import { beep } from '../services/sound';
import api from '../services/api';
import { CheckCircle, XCircle, ScanLine, ScanBarcode, Eye, Printer, Home, Grid3X3, Search, Package } from 'lucide-react';

export default function ScanPage() {
  const { type } = useParams(); // 'in' or 'out'
  const navigate = useNavigate();
  const transactionType = type?.toUpperCase() === 'IN' ? 'IN' : 'OUT';

  const {
    currentTransaction,
    createTransaction,
    addItemByBarcode,
    decreaseItemByBarcode,
    completeTransaction,
    cancelTransaction,
    kepoGuess,
    kepoAudioUrl,
    clearKepo,
    reset,
  } = useTransactionStore();

  const [scanFeedback, setScanFeedback] = useState(null);
  const [showSummary, setShowSummary] = useState(false); // Step 1: summary view after complete
  const [receipt, setReceipt] = useState(null);
  const [scanMode, setScanMode] = useState('barcode'); // 'barcode', 'detection', or 'manual'

  // Manual cashier state
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset and create new transaction when type changes
  useEffect(() => {
    // Always reset when transaction type changes to ensure clean state
    const initTransaction = async () => {
      // If there's an existing transaction with different type, reset first
      if (currentTransaction && currentTransaction.type !== transactionType) {
        reset();
      }

      // Create new transaction if none exists or was just reset
      if (!currentTransaction || currentTransaction.type !== transactionType) {
        await createTransaction(transactionType);
      }
    };

    initTransaction();

    return () => {
      // Clean up on unmount - reset the store
      reset();
    };
  }, [transactionType]);

  // Fetch products when manual mode is activated
  useEffect(() => {
    if (scanMode === 'manual' && products.length === 0) {
      const fetchProducts = async () => {
        setProductsLoading(true);
        try {
          const response = await api.get('/products');
          setProducts(response.data);
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setProductsLoading(false);
        }
      };
      fetchProducts();
    }
  }, [scanMode]);

  // Handle barcode scan
  const handleScan = async (barcode) => {
    try {
      if (!currentTransaction) {
        await createTransaction(transactionType);
      }

      await addItemByBarcode(barcode);

      // Play success sound
      beep(transactionType === 'OUT' ? 'scanOut' : 'scanIn');

      // Show success feedback
      setScanFeedback({ type: 'success', message: 'Item ditambahkan!' });
      setTimeout(() => setScanFeedback(null), 1500);
    } catch (error) {
      // Play error sound
      beep('error');

      // Show error feedback
      setScanFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Produk tidak ditemukan',
      });
      setTimeout(() => setScanFeedback(null), 2000);
    }
  };

  // Handle AI object detection
  const handleDetection = async ({ product, action, confidence }) => {
    try {
      if (!currentTransaction) {
        await createTransaction(transactionType);
      }

      if (action === 'add') {
        // Add item to cart
        await addItemByBarcode(product.barcode);
        beep(transactionType === 'OUT' ? 'scanOut' : 'scanIn');
        setScanFeedback({
          type: 'success',
          message: `+ ${product.name} (${(confidence * 100).toFixed(0)}%)`,
        });
      } else if (action === 'cancel') {
        // Decrease item from cart
        const result = await decreaseItemByBarcode(product.barcode);
        if (result.success) {
          beep('error'); // Use error beep for cancel feedback
          setScanFeedback({
            type: 'warning',
            message: `- ${product.name} (${result.action === 'removed' ? 'dihapus' : 'dikurangi'})`,
          });
        } else {
          setScanFeedback({
            type: 'error',
            message: `${product.name} tidak ada di keranjang`,
          });
        }
      }

      setTimeout(() => setScanFeedback(null), 2000);
    } catch (error) {
      beep('error');
      setScanFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Gagal memproses produk',
      });
      setTimeout(() => setScanFeedback(null), 2000);
    }
  };

  // Handle transaction complete
  const handleComplete = async () => {
    try {
      const result = await completeTransaction();

      // Play complete sound
      beep('complete');

      // Fetch receipt data
      if (currentTransaction) {
        const receiptRes = await api.get(`/transactions/${currentTransaction.id}/receipt`);
        setReceipt(receiptRes.data);
        // Show summary first (Step 1), not full receipt yet
        setShowSummary(true);
      }
    } catch (error) {
      console.error('Error completing transaction:', error);
    }
  };

  // Handle print/download - open receipt in new tab
  const handlePrintReceipt = () => {
    if (currentTransaction) {
      window.open(`/receipt/${currentTransaction.id}`, '_blank');
    }
  };

  // Handle back to home from summary
  const handleBackToHome = () => {
    setShowSummary(false);
    setReceipt(null);
    reset();
    navigate('/');
  };

  // Handle cancel
  const handleCancel = async () => {
    if (confirm('Batalkan transaksi ini?')) {
      await cancelTransaction();
      reset();
      navigate('/');
    }
  };

  // Handle close kepo popup
  const handleCloseKepo = () => {
    clearKepo();
  };

  // Handle manual product click
  const handleProductClick = async (product) => {
    try {
      if (!currentTransaction) {
        await createTransaction(transactionType);
      }

      await addItemByBarcode(product.barcode);

      // Play success sound
      beep(transactionType === 'OUT' ? 'scanOut' : 'scanIn');

      // Show success feedback
      setScanFeedback({ type: 'success', message: `+ ${product.name}` });
      setTimeout(() => setScanFeedback(null), 1500);
    } catch (error) {
      beep('error');
      setScanFeedback({
        type: 'error',
        message: error.response?.data?.error || 'Gagal menambahkan produk',
      });
      setTimeout(() => setScanFeedback(null), 2000);
    }
  };

  // Filter products for manual mode
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.barcode.includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  // Helper function to format currency
  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Show summary view after transaction complete
  if (showSummary && receipt) {
    return (
      <div className="h-full flex flex-col">
        {/* Header - same style as scan page */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle className="w-7 h-7 text-green-500" />
            Transaksi Selesai
          </h1>
          <p className="text-gray-500 mt-1">
            {transactionType === 'OUT' ? 'Customer Beli' : 'Beli ke Vendor'} - {receipt.receiptNumber}
          </p>
        </div>

        {/* Summary Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-lg mx-auto">
            {/* Items list */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-800">Detail Pembelian</h3>
                <p className="text-sm text-gray-500">{receipt.items.length} item</p>
              </div>

              <div className="divide-y">
                {receipt.items.map((item, index) => (
                  <div key={index} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatRupiah(item.unitPrice)} × {item.quantity} = {formatRupiah(item.total)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatRupiah(item.total)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatRupiah(receipt.total)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleBackToHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Home className="w-5 h-5" />
                <span>Kembali</span>
              </button>
              {transactionType === 'OUT' && (
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Printer className="w-5 h-5" />
                  <span>Cetak Struk</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Kepo Popup */}
        {kepoGuess && (
          <KepoPopup
            guess={kepoGuess}
            audioUrl={kepoAudioUrl}
            onClose={handleCloseKepo}
          />
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Scanner Panel (Left/Center) */}
      <div className="flex-1 p-6 flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ScanLine className="w-7 h-7" />
              {transactionType === 'OUT' ? 'Customer Beli' : 'Beli ke Vendor'}
            </h1>

            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setScanMode('barcode')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  scanMode === 'barcode'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ScanBarcode className="w-4 h-4" />
                Barcode
              </button>
              <button
                onClick={() => setScanMode('detection')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  scanMode === 'detection'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                AI
              </button>
              <button
                onClick={() => setScanMode('manual')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  scanMode === 'manual'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Manual
              </button>
            </div>
          </div>
          <p className="text-gray-500 mt-1">
            {scanMode === 'barcode'
              ? transactionType === 'OUT'
                ? 'Scan barcode produk yang dibeli customer'
                : 'Scan barcode produk yang masuk ke stok'
              : scanMode === 'detection'
              ? transactionType === 'OUT'
                ? 'Gerakkan barang dari warung ke luar untuk jual'
                : 'Gerakkan barang dari luar ke warung untuk beli'
              : 'Klik produk untuk menambahkan ke transaksi'}
          </p>
        </div>

        {/* Scanner / Manual Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative flex-1 min-h-[300px] overflow-hidden">
            {scanMode === 'barcode' ? (
              <BarcodeScanner
                key={`barcode-${transactionType}`}
                onScan={handleScan}
                isActive={true}
              />
            ) : scanMode === 'detection' ? (
              <ObjectDetectionScanner
                key={`detection-${transactionType}`}
                onDetect={handleDetection}
                transactionType={transactionType}
                isActive={true}
              />
            ) : (
              /* Manual Cashier Grid */
              <div className="h-full flex flex-col bg-gray-50 rounded-lg">
                {/* Search bar */}
                <div className="p-3 border-b bg-white rounded-t-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    />
                  </div>
                </div>

                {/* Product grid */}
                <div className="flex-1 overflow-auto p-3">
                  {productsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : Object.keys(groupedProducts).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Tidak ada produk ditemukan</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedProducts)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([category, categoryProducts]) => (
                          <div key={category}>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              {category}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {categoryProducts.map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => handleProductClick(product)}
                                  className="bg-white rounded-lg border p-3 text-left hover:border-green-500 hover:shadow-md transition-all active:scale-95"
                                >
                                  <h4 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                                    {product.name}
                                  </h4>
                                  <p className="text-green-600 font-semibold text-sm">
                                    {formatRupiah(
                                      transactionType === 'OUT'
                                        ? product.sellPrice
                                        : product.buyPrice
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Stok: {product.stock}
                                  </p>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scan feedback overlay */}
            {scanFeedback && (
              <div
                className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-10 ${
                  scanFeedback.type === 'success'
                    ? 'bg-green-500 text-white'
                    : scanFeedback.type === 'warning'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {scanFeedback.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>{scanFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Mode indicator */}
          <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                transactionType === 'OUT'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  transactionType === 'OUT' ? 'bg-green-500' : 'bg-blue-500'
                }`}
              />
              Mode: {transactionType === 'OUT' ? 'Jual ke Customer' : 'Beli dari Supplier'}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Panel (Right) */}
      <div className="w-96 bg-white border-l shadow-lg">
        <TransactionPanel onComplete={handleComplete} onCancel={handleCancel} />
      </div>

      {/* Kepo Popup */}
      {kepoGuess && (
        <KepoPopup
          guess={kepoGuess}
          audioUrl={kepoAudioUrl}
          onClose={handleCloseKepo}
        />
      )}

    </div>
  );
}
