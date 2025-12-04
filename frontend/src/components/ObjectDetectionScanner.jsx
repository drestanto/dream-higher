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
  const [currentDetections, setCurrentDetections] = useState([]); // Real-time detection display

  // Track last frame's detection (for consecutive movement detection)
  // Only tracks ONE object - resets if different object or no object detected
  const lastFrameRef = useRef(null); // { label: string, zone: 'left'|'right' } | null

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

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
    lastFrameRef.current = null;
    setLastDetection(null);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Resize to 320x240 for faster API processing (reduces network overhead)
    const targetWidth = 320;
    const targetHeight = 240;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Apply mirror if needed
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    // Draw video scaled down to target size
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Get base64 without the data:image/jpeg;base64, prefix (quality 0.7)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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
    const frameStart = performance.now();

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        setIsProcessing(false);
        return;
      }

      const captureTime = performance.now();
      console.log(`[LATENCY] Frame capture: ${(captureTime - frameStart).toFixed(0)}ms`);

      // Call object detection API via backend
      const apiStart = performance.now();
      const promptsToUse = detectionLabels.length > 0 ? detectionLabels : ['box', 'tube', 'bottle'];
      console.log(`[DETECTION] Sending prompts:`, promptsToUse);
      const detectResponse = await api.post('/ai/detect', {
        image: imageBase64,
        prompts: promptsToUse,
      });
      const apiEnd = performance.now();
      console.log(`[LATENCY] API /ai/detect: ${(apiEnd - apiStart).toFixed(0)}ms`);
      console.log(`[DETECTION] Response:`, detectResponse.data);

      if (!detectResponse.data.success) {
        console.log(`[DETECTION] API returned success=false`);
        setLastDetection(null);
        setIsProcessing(false);
        return;
      }

      if (!detectResponse.data.results?.length) {
        console.log(`[DETECTION] No objects detected in frame - resetting tracking`);
        lastFrameRef.current = null; // Reset tracking on no detection
        setLastDetection(null);
        setCurrentDetections([]);
        setIsProcessing(false);
        return;
      }

      const results = detectResponse.data.results;
      console.log(`[DETECTION] Found ${results.length} object(s):`, results.map(r => `${r.name} (${(r.confidence * 100).toFixed(0)}%)`).join(', '));

      const imageWidth = detectResponse.data.image_size?.[0] || 320;

      // Update real-time detection display (show all for UI)
      setCurrentDetections(results.map(r => ({
        name: r.name,
        confidence: r.confidence,
        zone: determineZone(r.bbox, imageWidth),
      })));

      // Filter results with confidence >= 0.5, then pick the highest confidence one
      const validResults = results.filter(r => r.confidence >= 0.5);
      if (validResults.length === 0) {
        console.log(`[DETECTION] No objects with confidence >= 0.5 - resetting tracking`);
        lastFrameRef.current = null; // Reset tracking
        setIsProcessing(false);
        return;
      }

      // Pick only the highest confidence object
      const bestResult = validResults.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      console.log(`[DETECTION] Selected highest confidence: ${bestResult.name} (${(bestResult.confidence * 100).toFixed(0)}%)`);

      const detectedLabel = bestResult.name;
      const confidence = bestResult.confidence;
      const bbox = bestResult.bbox;
      const zone = determineZone(bbox, imageWidth);

      // Get last frame's detection
      const lastFrame = lastFrameRef.current;

      // Check if this is a CONSECUTIVE detection of the SAME object
      const isSameObject = lastFrame && lastFrame.label === detectedLabel;
      const prevZone = isSameObject ? lastFrame.zone : null;

      // Update tracking for next frame
      lastFrameRef.current = { label: detectedLabel, zone };

      // If different object than last frame, reset tracking - no action
      if (lastFrame && !isSameObject) {
        console.log(`[DETECTION] Different object detected (was: ${lastFrame.label}, now: ${detectedLabel}) - resetting tracking`);
        setIsProcessing(false);
        return;
      }

      // Only trigger action if object MOVED between zones in consecutive frames
      if (!prevZone || prevZone === zone) {
        // First detection or same zone - no action
        if (!prevZone) {
          console.log(`[DETECTION] First detection of ${detectedLabel} in zone: ${zone} - waiting for consecutive movement`);
        } else {
          console.log(`[DETECTION] ${detectedLabel} stayed in zone: ${zone} - no action`);
        }
        setIsProcessing(false);
        return;
      }

      // Object moved between zones in consecutive frames!
      console.log(`[DETECTION] ${detectedLabel} moved from ${prevZone} to ${zone} (consecutive)`);

      // Reset tracking after triggering action to prevent duplicate triggers
      lastFrameRef.current = null;

      const movedLeftToRight = prevZone === 'left' && zone === 'right';
      const movedRightToLeft = prevZone === 'right' && zone === 'left';

      // Determine action based on transaction type and movement direction
      // left = WARUNG (dalam), right = LUAR
      // JUAL (OUT): dalam→luar (left→right) = ADD, luar→dalam (right→left) = CANCEL
      // BELI (IN): luar→dalam (right→left) = ADD, dalam→luar (left→right) = CANCEL
      let action = null;
      if (transactionType === 'OUT') {
        action = movedLeftToRight ? 'add' : 'cancel';
      } else {
        action = movedRightToLeft ? 'add' : 'cancel';
      }

      console.log(`[DETECTION] Action: ${action} (transactionType: ${transactionType})`);

      // Match detected label to product via backend
      const matchResponse = await api.post('/ai/match', {
        detectedLabel: detectedLabel,
      });

      if (matchResponse.data.matched && matchResponse.data.product) {
        const product = matchResponse.data.product;

        onDetect({
          product,
          action, // 'add' or 'cancel'
          confidence,
          zone,
        });

        setLastDetection({
          label: detectedLabel,
          zone,
          action,
          confidence,
          matched: true,
          productName: product.name,
        });
      } else {
        setLastDetection({
          label: detectedLabel,
          zone,
          action,
          confidence,
          matched: false,
          productName: null,
        });
      }
    } catch (err) {
      console.error('Detection error:', err);
      setCurrentDetections([]);
    } finally {
      const totalTime = performance.now() - frameStart;
      console.log(`[LATENCY] Total frame processing: ${totalTime.toFixed(0)}ms`);
      console.log('---');
      setIsProcessing(false);
    }
  }, [isProcessing, isScanning, captureFrame, detectionLabels, determineZone, isMirrored, transactionType, onDetect]);

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

      // Start detection loop at ~2 FPS (500ms interval) for better latency
      intervalRef.current = setInterval(processDetection, 500);

    } catch (err) {
      setError(`Gagal mengakses kamera: ${err.message}`);
      setIsScanning(false);
    }
  }, [processDetection]);

  // Update interval when processDetection changes
  useEffect(() => {
    if (isScanning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(processDetection, 500);
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
    lastFrameRef.current = null; // Reset tracking when mirror changes
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

            {/* Zone labels - WARUNG always left, LUAR always right */}
            <div className="absolute top-2 left-4 px-2 py-1 bg-blue-600/80 text-white text-xs rounded">
              WARUNG
            </div>
            <div className="absolute top-2 right-4 px-2 py-1 bg-green-600/80 text-white text-xs rounded">
              LUAR
            </div>

            {/* Direction indicator - JUAL always left→right, BELI always right→left */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-xs rounded-full">
              {transactionType === 'OUT' ? 'JUAL →' : '← BELI'}
            </div>

            {/* Mirror indicator */}
            {isMirrored && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-yellow-500/80 text-white text-xs rounded">
                MIRRORED
              </div>
            )}
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Real-time detection display */}
        {isScanning && (
          <div className="absolute top-10 left-2 right-2">
            {/* Current detections */}
            {currentDetections.length > 0 ? (
              <div className="space-y-1">
                {currentDetections.map((det, i) => (
                  <div key={i} className={`px-2 py-1 rounded text-xs text-white ${
                    det.zone === 'left' ? 'bg-blue-600/80' : 'bg-green-600/80'
                  }`}>
                    {det.name} ({(det.confidence * 100).toFixed(0)}%) - {det.zone === 'left' ? 'WARUNG' : 'LUAR'}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-2 py-1 rounded text-xs text-white bg-gray-600/80 inline-block">
                No object detected
              </div>
            )}
          </div>
        )}

        {/* Last detection info (movement triggered) */}
        {lastDetection && (
          <div className={`absolute bottom-2 left-2 right-2 p-2 rounded text-white text-sm ${
            lastDetection.matched ? 'bg-green-600/90' : 'bg-yellow-600/90'
          }`}>
            <div className="font-medium">
              {lastDetection.matched
                ? `${lastDetection.action === 'add' ? '+' : '-'} ${lastDetection.productName}`
                : `Unknown: ${lastDetection.label}`
              }
            </div>
            <div className="text-xs opacity-80">
              Zone: {lastDetection.zone} | Action: {lastDetection.action} |
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
