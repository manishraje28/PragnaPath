import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

// Available Indian English voices
const VOICES = [
  { id: 'en-IN-NeerjaNeural', name: 'Neerja', gender: 'female', description: 'Warm female teacher (recommended)' },
  { id: 'en-IN-NeerjaExpressiveNeural', name: 'Neerja Expressive', gender: 'female', description: 'Expressive female voice' },
  { id: 'en-IN-PrabhatNeural', name: 'Prabhat', gender: 'male', description: 'Professional male teacher' }
];

const SPEEDS = [
  { value: '-20%', label: 'Slow', icon: '🐢' },
  { value: '+0%', label: 'Normal', icon: '🎯' },
  { value: '+15%', label: 'Fast', icon: '⚡' }
];

export default function TextToSpeech({ text, onStart, onEnd, className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [selectedSpeed, setSelectedSpeed] = useState('+0%');
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = async () => {
    if (!text || text.trim().length === 0) {
      setError('No text to speak');
      return;
    }

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsLoading(true);
    setError(null);
    onStart?.();

    try {
      const response = await fetch(`${API_BASE}/api/tts/speak`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          rate: selectedSpeed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        onEnd?.();
      };

      audio.onerror = () => {
        setError('Audio playback failed');
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setError('Speech generation failed. Please try again.');
      setIsLoading(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      onEnd?.();
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stop();
    } else {
      speak();
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Main TTS Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          font-medium text-sm transition-all
          ${isPlaying 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
        `}
        title={isPlaying ? 'Stop reading' : 'Read aloud (Indian voice)'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {isLoading ? 'Loading...' : isPlaying ? 'Stop' : '🔊 Listen'}
        </span>
      </motion.button>

      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowSettings(!showSettings)}
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="Voice settings"
      >
        <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </motion.button>

      {/* Settings Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 p-4 
                       bg-white dark:bg-gray-800 rounded-xl shadow-2xl 
                       border border-gray-200 dark:border-gray-700 z-50"
          >
            <h4 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
              🇮🇳 Indian Voice Settings
            </h4>
            
            {/* Voice Selection */}
            <div className="mb-4">
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                Teacher Voice
              </label>
              <div className="space-y-2">
                {VOICES.map((voice) => (
                  <label
                    key={voice.id}
                    className={`
                      flex items-center gap-3 p-2 rounded-lg cursor-pointer
                      transition-colors
                      ${selectedVoice === voice.id 
                        ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="voice"
                      value={voice.id}
                      checked={selectedVoice === voice.id}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="hidden"
                    />
                    <span className="text-xl">{voice.gender === 'female' ? '👩‍🏫' : '👨‍🏫'}</span>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-white text-sm">
                        {voice.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {voice.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Speed Selection */}
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                Speaking Speed
              </label>
              <div className="flex gap-2">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed.value}
                    onClick={() => setSelectedSpeed(speed.value)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg text-sm font-medium
                      transition-colors
                      ${selectedSpeed === speed.value
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <span className="mr-1">{speed.icon}</span>
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full left-0 mt-2 text-xs text-red-500 whitespace-nowrap"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

// Compact version for inline use
export function TTSButton({ text, size = 'md', className = '' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const speak = async () => {
    if (!text) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'en-IN-NeerjaNeural', rate: '+0%' })
      });

      const audioBlob = await response.blob();
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;

      audio.onplay = () => { setIsPlaying(true); setIsLoading(false); };
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; };

      await audio.play();
    } catch (err) {
      console.error('TTS error:', err);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={speak}
      disabled={isLoading}
      className={`
        ${sizes[size]} rounded-full flex items-center justify-center
        ${isPlaying ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}
        transition-colors disabled:opacity-50
        ${className}
      `}
      title="Read aloud"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isPlaying ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </button>
  );
}
