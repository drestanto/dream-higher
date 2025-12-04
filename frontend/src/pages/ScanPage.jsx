import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import ObjectDetectionScanner from '../components/ObjectDetectionScanner';
import TransactionPanel from '../components/TransactionPanel';
import KepoPopup from '../components/KepoPopup';
import useTransactionStore from '../stores/transactionStore';
import { beep } from '../services/sound';
import api from '../services/api';
import { CheckCircle, XCircle, ScanLine, ScanBarcode, Eye, Printer, Home } from 'lucide-react';

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
  const [scanMode, setScanMode] = useState('barcode'); // 'barcode' or 'detection'

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
                        {formatRupiah(item.price)} x {item.quantity}
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
              <button
                onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="w-5 h-5" />
                <span>Cetak Struk</span>
              </button>
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
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setScanMode('barcode')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  scanMode === 'detection'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                AI Detection
              </button>
            </div>
          </div>
          <p className="text-gray-500 mt-1">
            {scanMode === 'barcode'
              ? transactionType === 'OUT'
                ? 'Scan barcode produk yang dibeli customer'
                : 'Scan barcode produk yang masuk ke stok'
              : transactionType === 'OUT'
                ? 'Gerakkan barang dari warung ke luar untuk jual'
                : 'Gerakkan barang dari luar ke warung untuk beli'}
          </p>
        </div>

        {/* Scanner */}
        <div className="flex-1 flex flex-col">
          <div className="relative flex-1 min-h-[300px]">
            {scanMode === 'barcode' ? (
              <BarcodeScanner
                key={`barcode-${transactionType}`}
                onScan={handleScan}
                isActive={true}
              />
            ) : (
              <ObjectDetectionScanner
                key={`detection-${transactionType}`}
                onDetect={handleDetection}
                transactionType={transactionType}
                isActive={true}
              />
            )}

            {/* Scan feedback overlay */}
            {scanFeedback && (
              <div
                className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg ${
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
