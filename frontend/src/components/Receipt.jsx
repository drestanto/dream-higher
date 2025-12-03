import { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';

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

export default function Receipt({ receipt, onClose }) {
  const receiptRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  if (!receipt) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full mx-4">
        {/* Controls */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-gray-800">Struk Transaksi</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt content */}
        <div ref={receiptRef} className="receipt-print p-4 font-mono text-sm">
          <div className="text-center border-b border-dashed pb-3 mb-3">
            <h2 className="font-bold text-lg">{receipt.shopName}</h2>
            <p className="text-gray-600 text-xs">{receipt.address}</p>
          </div>

          <div className="mb-3 text-xs">
            <p>Tanggal: {formatDate(receipt.date)}</p>
            <p>No: {receipt.receiptNumber}</p>
            <p>Tipe: {receipt.type}</p>
          </div>

          <div className="border-t border-b border-dashed py-3 mb-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-1">Item</th>
                  <th className="text-center pb-1">Qty</th>
                  <th className="text-right pb-1">Harga</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item, index) => (
                  <tr key={index} className="border-b border-dotted">
                    <td className="py-1 pr-2 truncate max-w-[120px]">
                      {item.name}
                    </td>
                    <td className="py-1 text-center">x{item.quantity}</td>
                    <td className="py-1 text-right">
                      {formatRupiah(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center font-bold mb-4">
            <span>TOTAL</span>
            <span>Rp {formatRupiah(receipt.total)}</span>
          </div>

          <div className="text-center text-xs text-gray-500 border-t border-dashed pt-3">
            <p>Terima Kasih!</p>
            <p className="mt-1">Powered by Dream Higher</p>
          </div>
        </div>
      </div>
    </div>
  );
}
