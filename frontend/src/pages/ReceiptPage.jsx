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
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200], // Thermal receipt size
      });

      let y = 10;
      const pageWidth = 80;
      const margin = 5;
      const contentWidth = pageWidth - (margin * 2);

      // Header
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(receipt.shopName, pageWidth / 2, y, { align: 'center' });
      y += 5;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(receipt.address, pageWidth / 2, y, { align: 'center' });
      y += 6;

      // Dashed line
      pdf.setLineDash([1, 1]);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Info
      pdf.setFontSize(8);
      pdf.text(`Tanggal: ${formatDate(receipt.date)}`, margin, y);
      y += 4;
      pdf.text(`No: ${receipt.receiptNumber}`, margin, y);
      y += 4;
      pdf.text(`Tipe: ${receipt.type === 'OUT' ? 'Penjualan' : 'Pembelian'}`, margin, y);
      y += 6;

      // Dashed line
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Items header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Item', margin, y);
      pdf.text('Harga', margin + 30, y);
      pdf.text('Qty', margin + 48, y);
      pdf.text('Total', pageWidth - margin, y, { align: 'right' });
      y += 4;

      // Items
      pdf.setFont('helvetica', 'normal');
      receipt.items.forEach((item) => {
        // Item name (wrap if too long)
        const itemName = item.name.length > 15 ? item.name.substring(0, 15) : item.name;
        pdf.text(itemName, margin, y);
        pdf.text(formatRupiah(item.unitPrice), margin + 30, y);
        pdf.text(`x${item.quantity}`, margin + 48, y);
        pdf.text(formatRupiah(item.total), pageWidth - margin, y, { align: 'right' });
        y += 5;
      });

      y += 2;

      // Dashed line
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;

      // Total
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('TOTAL', margin, y);
      pdf.text(`Rp ${formatRupiah(receipt.total)}`, pageWidth - margin, y, { align: 'right' });
      y += 7;

      // Kepo sentence
      if (receipt.kepoSentence) {
        pdf.setLineDash([1, 1]);
        pdf.rect(margin, y, contentWidth, 12);
        y += 4;
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.text('Warung Kepo:', pageWidth / 2, y, { align: 'center' });
        y += 4;
        const kepoLines = pdf.splitTextToSize(`"${receipt.kepoSentence}"`, contentWidth - 4);
        pdf.text(kepoLines, pageWidth / 2, y, { align: 'center' });
        y += kepoLines.length * 3 + 3;
      }

      // Footer
      pdf.setLineDash([1, 1]);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text('Terima Kasih!', pageWidth / 2, y, { align: 'center' });
      y += 4;
      pdf.text('Powered by Dream Higher', pageWidth / 2, y, { align: 'center' });

      pdf.save(`struk-${receipt.receiptNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF: ' + error.message);
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
        <div className="p-4 font-mono text-sm">
          {/* Header */}
          <div className="text-center border-b border-dashed pb-2 mb-2">
            <h2 className="font-bold text-lg leading-tight">{receipt.shopName}</h2>
            <p className="text-gray-600 text-xs mt-0.5 leading-tight">{receipt.address}</p>
          </div>

          {/* Info */}
          <div className="mb-2 text-xs space-y-0.5 leading-tight">
            <p>Tanggal: {formatDate(receipt.date)}</p>
            <p>No: {receipt.receiptNumber}</p>
            <p>Tipe: {receipt.type === 'OUT' ? 'Penjualan' : 'Pembelian'}</p>
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed py-2 mb-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-1">Item</th>
                  <th className="text-right pb-1">Harga</th>
                  <th className="text-center pb-1">Qty</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={index} className="border-b border-dotted">
                    <td className="py-1 pr-2 leading-tight">{item.name}</td>
                    <td className="py-1 text-right leading-tight">{formatRupiah(item.unitPrice)}</td>
                    <td className="py-1 text-center leading-tight">×{item.quantity}</td>
                    <td className="py-1 text-right leading-tight">{formatRupiah(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center font-bold text-base mb-2 leading-tight">
            <span>TOTAL</span>
            <span>Rp {formatRupiah(receipt.total)}</span>
          </div>

          {/* Kepo Warung Comment */}
          {receipt.kepoSentence && (
            <div className="border border-dashed rounded-lg p-2 mb-2 bg-gray-50">
              <p className="text-xs text-center text-gray-500 mb-0.5 leading-tight">💬 Warung Kepo:</p>
              <p className="text-xs text-center italic text-gray-700 leading-tight">"{receipt.kepoSentence}"</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-dashed pt-2 leading-tight">
            <p>Terima Kasih!</p>
            <p className="mt-0.5">Powered by Dream Higher</p>
          </div>
        </div>
      </div>
    </div>
  );
}
