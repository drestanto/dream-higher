import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await api.get(`/transactions/${id}/receipt`);
        setReceipt(response.data);
      } catch (err) {
        setError('Gagal memuat struk');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReceipt();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Memuat struk...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500">{error || 'Struk tidak ditemukan'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      {/* Receipt */}
      <div className="max-w-sm mx-auto bg-white shadow-lg print:shadow-none">
        <div className="p-6 font-mono text-sm">
          {/* Header */}
          <div className="text-center border-b border-dashed pb-4 mb-4">
            <h2 className="font-bold text-xl">{receipt.shopName}</h2>
            <p className="text-gray-600 text-xs mt-1">{receipt.address}</p>
          </div>

          {/* Info */}
          <div className="mb-4 text-xs space-y-1">
            <p>Tanggal: {formatDate(receipt.date)}</p>
            <p>No: {receipt.receiptNumber}</p>
            <p>Tipe: {receipt.type === 'OUT' ? 'Penjualan' : 'Pembelian'}</p>
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed py-4 mb-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Harga</th>
                  <th className="text-center pb-2">Qty</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={index} className="border-b border-dotted">
                    <td className="py-2 pr-2">{item.name}</td>
                    <td className="py-2 text-right">{formatRupiah(item.unitPrice)}</td>
                    <td className="py-2 text-center">×{item.quantity}</td>
                    <td className="py-2 text-right">{formatRupiah(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center font-bold text-lg mb-6">
            <span>TOTAL</span>
            <span>Rp {formatRupiah(receipt.total)}</span>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-dashed pt-4">
            <p>Terima Kasih!</p>
            <p className="mt-1">Powered by Dream Higher</p>
          </div>
        </div>
      </div>
    </div>
  );
}
