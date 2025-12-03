import { useEffect, useRef, useState, useCallback } from 'react';
import { BarcodeDetector } from 'barcode-detector/ponyfill';
import { Camera, CameraOff, ImagePlus, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function BarcodeScanner({ onScan, isActive = true }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const animationRef = useRef(null);
  const lastScannedRef = useRef(null);
  const debounceRef = useRef(null);

  const stopScanner = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      // Initialize detector
      detectorRef.current = new BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'code_93', 'itf', 'qr_code'],
      });

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      setError(null);

      // Start detection loop
      const detectLoop = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) return;

        try {
          const video = videoRef.current;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const barcodes = await detectorRef.current.detect(video);

            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;

              // Debounce to prevent duplicate scans
              if (!debounceRef.current && lastScannedRef.current !== code) {
                lastScannedRef.current = code;
                debounceRef.current = setTimeout(() => {
                  debounceRef.current = null;
                  lastScannedRef.current = null;
                }, 2000);

                onScan(code);
              }
            }
          }
        } catch (err) {
          // Silently ignore detection errors
        }

        // Continue detection loop only if stream is still active
        if (streamRef.current) {
          animationRef.current = requestAnimationFrame(detectLoop);
        }
      };

      animationRef.current = requestAnimationFrame(detectLoop);

    } catch (err) {
      setError(`Gagal mengakses kamera: ${err.message}`);
      setIsScanning(false);
    }
  }, [onScan]);

  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    return () => {
      stopScanner();
    };
  }, [isActive, stopScanner]);

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await api.post('/products/scan-image', { image: base64 });

      if (response.data.barcodes && response.data.barcodes.length > 0) {
        const barcode = response.data.barcodes[0];
        onScan(barcode.value);
        setError(null);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal scan barcode dari gambar';
      setError(errorMsg);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="relative">
      {/* Video element for camera */}
      <div
        className="w-full bg-gray-900 rounded-lg overflow-hidden relative"
        style={{ minHeight: '300px' }}
      >
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ minHeight: '300px' }}
        />

        {/* Scan area indicator */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-green-400 rounded-lg relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br" />
              {/* Scanning line animation */}
              <div
                className="absolute left-0 right-0 h-0.5 bg-green-400"
                style={{ animation: 'scanline 1.5s ease-in-out infinite' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Scanning indicator */}
      {isScanning && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Scanning...
        </div>
      )}

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
        <div className="absolute bottom-16 left-2 right-2 p-3 bg-red-500 text-white text-sm text-center rounded-lg">
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

      {/* Upload image button */}
      <div className="absolute bottom-2 right-2">
        <label className={`flex items-center gap-2 px-3 py-2 text-white text-sm rounded-lg transition-colors cursor-pointer ${isUploading ? 'bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          <span>{isUploading ? 'Scanning...' : 'Upload Foto'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
      `}</style>
    </div>
  );
}
