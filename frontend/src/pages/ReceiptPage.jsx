import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const receiptRef = useRef(null);

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

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;

    setIsGeneratingPDF(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * 0.264583], // 80mm width (thermal receipt size)
      });

      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`struk-${receipt.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

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
      {/* Action buttons - hidden on print */}
      <div className="max-w-sm mx-auto mb-4 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span>Print</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingPDF ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Receipt */}
      <div ref={receiptRef} className="receipt-print max-w-sm mx-auto bg-white shadow-lg print:shadow-none">
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
          <div className="flex justify-between items-center font-bold text-lg mb-4">
            <span>TOTAL</span>
            <span>Rp {formatRupiah(receipt.total)}</span>
          </div>

          {/* Kepo Warung Comment */}
          {receipt.kepoSentence && (
            <div className="border border-dashed rounded-lg p-3 mb-4 bg-gray-50">
              <p className="text-xs text-center text-gray-500 mb-1">💬 Warung Kepo:</p>
              <p className="text-xs text-center italic text-gray-700">"{receipt.kepoSentence}"</p>
            </div>
          )}

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
