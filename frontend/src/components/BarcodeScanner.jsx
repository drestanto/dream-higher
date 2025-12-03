import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

export default function BarcodeScanner({ onScan, isActive = true }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const lastScannedRef = useRef(null);
  const debounceRef = useRef(null);
  const initializingRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    // Prevent multiple simultaneous initializations (fixes React Strict Mode double-mount)
    if (initializingRef.current) return;
    initializingRef.current = true;

    try {
      // Stop existing scanner if any
      await stopScanner();

      // Small delay to ensure DOM is ready and previous scanner is cleaned up
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if element exists
      const element = document.getElementById('qr-reader');
      if (!element) {
        initializingRef.current = false;
        return;
      }

      const scanner = new Html5Qrcode('qr-reader', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.5,
          disableFlip: false,
        },
        (decodedText) => {
          // Debounce to prevent duplicate scans
          if (debounceRef.current) return;
          if (lastScannedRef.current === decodedText) return;

          lastScannedRef.current = decodedText;
          debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            lastScannedRef.current = null;
          }, 1500);

          onScan(decodedText);
        },
        () => {
          // Ignore scan errors (no QR code found in frame)
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      console.error('Scanner error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
      setIsScanning(false);
    } finally {
      initializingRef.current = false;
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [isActive, startScanner, stopScanner]);

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  return (
    <div className="relative">
      {/* Scanner container */}
      <div
        id="qr-reader"
        className="w-full bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '300px' }}
      />

      {/* Overlay when not scanning */}
      {!isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 rounded-lg">
          <button
            onClick={toggleScanner}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Mulai Scan</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-red-500 text-white text-sm text-center rounded-b-lg">
          {error}
        </div>
      )}

      {/* Stop button */}
      {isScanning && (
        <button
          onClick={toggleScanner}
          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <CameraOff className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
