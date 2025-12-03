import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, ThumbsUp, ThumbsDown, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function KepoPopup({ guess, audioUrl, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && !isMuted) {
      playAudio();
    }
  }, [audioUrl]);

  const playAudio = () => {
    if (!audioUrl) return;

    const audio = new Audio(`${API_URL}${audioUrl}`);
    audioRef.current = audio;

    audio.onplay = () => setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    audio.play().catch((e) => {
      console.warn('Audio play failed:', e);
      setIsPlaying(false);
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      playAudio();
    } else {
      setIsMuted(true);
      stopAudio();
    }
  };

  const handleClose = () => {
    stopAudio();
    onClose();
  };

  if (!guess) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">🗣️</span>
              WARUNG KEPO SAYS:
            </h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-xl text-gray-800 text-center font-medium leading-relaxed">
            "{guess}"
          </p>

          {/* Audio indicator */}
          {audioUrl && (
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-500">
              {isPlaying ? (
                <>
                  <Volume2 className="w-5 h-5 animate-pulse text-orange-500" />
                  <span className="text-sm">Sedang berbicara...</span>
                </>
              ) : (
                <button
                  onClick={playAudio}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Volume2 className="w-5 h-5" />
                  Putar ulang
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="border-t p-4 flex items-center justify-center gap-3">
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Bener dong!</span>
          </button>
          <button
            onClick={handleClose}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Salah tuh!</span>
          </button>
          <button
            onClick={toggleMute}
            className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          70% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
