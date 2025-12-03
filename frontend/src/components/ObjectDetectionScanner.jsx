import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, FlipHorizontal2, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function ObjectDetectionScanner({
  onDetect,
  transactionType = 'OUT',
  isActive = true
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionLabels, setDetectionLabels] = useState([]);
  const [lastDetection, setLastDetection] = useState(null);
  const [trackedObjects, setTrackedObjects] = useState({});

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const lastProcessedRef = useRef(null);

  // Fetch detection labels on mount
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const response = await api.get('/ai/detection-labels');
        setDetectionLabels(response.data.labels || []);
      } catch (err) {
        console.error('Failed to fetch detection labels:', err);
      }
    };
    fetchLabels();
  }, []);

  const stopScanner = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTrackedObjects({});
    setLastDetection(null);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Apply mirror if needed
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Get base64 without the data:image/jpeg;base64, prefix
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return dataUrl.split(',')[1];
  }, [isMirrored]);

  const determineZone = useCallback((bbox, imageWidth) => {
    // bbox = [x, y, width, height]
    const centerX = bbox[0] + (bbox[2] / 2);
    const midpoint = imageWidth / 2;

    // Left zone = warung (inside shop)
    // Right zone = luar (outside shop / customer side)
    return centerX < midpoint ? 'left' : 'right';
  }, []);

  const processDetection = useCallback(async () => {
    if (isProcessing || !isScanning) return;

    setIsProcessing(true);

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        setIsProcessing(false);
        return;
      }

      // Call object detection API
      const detectResponse = await api.post('/ai/detect', {
        image: imageBase64,
        prompts: detectionLabels.length > 0 ? detectionLabels : ['box', 'tube', 'bottle'],
      });

      if (!detectResponse.data.success || !detectResponse.data.results?.length) {
        setLastDetection(null);
        setIsProcessing(false);
        return;
      }

      const results = detectResponse.data.results;
      const imageWidth = detectResponse.data.image_size?.[0] || 640;

      // Process each detected object
      for (const result of results) {
        const detectedLabel = result.name;
        const confidence = result.confidence;
        const bbox = result.bbox;

        if (confidence < 0.5) continue;

        const zone = determineZone(bbox, imageWidth);
        const objectKey = detectedLabel;

        // Track object movement
        const prevZone = trackedObjects[objectKey];

        if (prevZone && prevZone !== zone) {
          // Object moved between zones!
          let direction = '';

          if (isMirrored) {
            // Mirrored: left and right are swapped visually
            direction = zone === 'left' ? 'out' : 'in';
          } else {
            // Normal: left=warung, right=customer
            direction = zone === 'right' ? 'out' : 'in';
          }

          // Match detected label to product
          const matchResponse = await api.post('/ai/match', {
            detectedLabel: detectedLabel,
          });

          if (matchResponse.data.matched && matchResponse.data.product) {
            const product = matchResponse.data.product;

            // Check if this movement is valid for current transaction type
            const isValidMovement =
              (transactionType === 'OUT' && direction === 'out') ||
              (transactionType === 'IN' && direction === 'in');

            if (isValidMovement) {
              onDetect({
                product,
                direction,
                confidence,
                zone,
              });
            }
          }

          setLastDetection({
            label: detectedLabel,
            zone,
            direction,
            confidence,
            matched: matchResponse.data.matched,
            productName: matchResponse.data.product?.name,
          });
        }

        // Update tracked zone
        setTrackedObjects(prev => ({
          ...prev,
          [objectKey]: zone,
        }));
      }
    } catch (err) {
      console.error('Detection error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, isScanning, captureFrame, detectionLabels, determineZone, trackedObjects, isMirrored, transactionType, onDetect]);

  const startScanner = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      setError(null);

      // Start detection loop at ~4 FPS (250ms interval)
      intervalRef.current = setInterval(processDetection, 250);

    } catch (err) {
      setError(`Gagal mengakses kamera: ${err.message}`);
      setIsScanning(false);
    }
  }, [processDetection]);

  // Update interval when processDetection changes
  useEffect(() => {
    if (isScanning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(processDetection, 250);
    }
  }, [processDetection, isScanning]);

  useEffect(() => {
    if (!isActive) {
      stopScanner();
    }
    return () => stopScanner();
  }, [isActive, stopScanner]);

  const toggleScanner = () => {
    if (isScanning) {
      stopScanner();
    } else {
      startScanner();
    }
  };

  const toggleMirror = () => {
    setIsMirrored(prev => !prev);
    setTrackedObjects({}); // Reset tracking when mirror changes
  };

  return (
    <div className="relative">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

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
          style={{
            minHeight: '300px',
            transform: isMirrored ? 'scaleX(-1)' : 'none',
          }}
        />

        {/* Split zone overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Center divider line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-l-2 border-dashed border-white/60" />

            {/* Zone labels */}
            <div className="absolute top-2 left-4 px-2 py-1 bg-blue-600/80 text-white text-xs rounded">
              {isMirrored ? 'LUAR' : 'WARUNG'}
            </div>
            <div className="absolute top-2 right-4 px-2 py-1 bg-green-600/80 text-white text-xs rounded">
              {isMirrored ? 'WARUNG' : 'LUAR'}
            </div>

            {/* Direction indicator */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs rounded-full">
              {transactionType === 'OUT'
                ? `${isMirrored ? '← JUAL' : 'JUAL →'}`
                : `${isMirrored ? 'BELI →' : '← BELI'}`
              }
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Last detection info */}
        {lastDetection && (
          <div className={`absolute bottom-2 left-2 right-2 p-2 rounded text-white text-sm ${
            lastDetection.matched ? 'bg-green-600/90' : 'bg-yellow-600/90'
          }`}>
            <div className="font-medium">
              {lastDetection.matched
                ? `Detected: ${lastDetection.productName}`
                : `Unknown: ${lastDetection.label}`
              }
            </div>
            <div className="text-xs opacity-80">
              Zone: {lastDetection.zone} | Direction: {lastDetection.direction} |
              Confidence: {(lastDetection.confidence * 100).toFixed(0)}%
            </div>
          </div>
        )}
      </div>

      {/* Scanning indicator */}
      {isScanning && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-full flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          AI Detection
        </div>
      )}

      {/* Overlay when not scanning */}
      {!isScanning && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 rounded-lg">
          <button
            onClick={toggleScanner}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span>Mulai AI Detection</span>
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-16 left-2 right-2 p-3 bg-red-500 text-white text-sm text-center rounded-lg">
          {error}
        </div>
      )}

      {/* Control buttons */}
      {isScanning && (
        <div className="absolute top-2 right-2 flex gap-2">
          {/* Mirror button */}
          <button
            onClick={toggleMirror}
            className={`p-2 rounded-full transition-colors ${
              isMirrored
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
            title="Mirror View"
          >
            <FlipHorizontal2 className="w-4 h-4" />
          </button>

          {/* Stop button */}
          <button
            onClick={toggleScanner}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <CameraOff className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detection labels info */}
      {isScanning && detectionLabels.length > 0 && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
          <span className="font-medium">Detecting:</span> {detectionLabels.join(', ')}
        </div>
      )}
    </div>
  );
}
