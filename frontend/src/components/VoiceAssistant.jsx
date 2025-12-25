import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, MessageCircle, Loader2, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * VoiceAssistant Component
 * ========================
 * Provides bidirectional voice conversation with the AI tutor.
 * - Uses Web Speech API for speech recognition (browser-based)
 * - Sends transcribed text to backend
 * - Plays AI response audio
 * 
 * Features:
 * - Push-to-talk or continuous listening modes
 * - Visual feedback for listening/speaking states
 * - Conversation history display
 * - Works alongside text-based learning
 */
export default function VoiceAssistant({ 
  isOpen, 
  onClose, 
  topic = null,
  sessionId = null,
  onTranscript = null  // Callback when user speaks (for integration)
}) {
  // States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState('conversation'); // conversation, explain, quiz, doubt
  
  // Refs
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const conversationEndRef = useRef(null);
  
  // Check for Speech Recognition support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const isSupported = !!SpeechRecognition;

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      setTranscript(interimTranscript || finalTranscript);
      
      if (finalTranscript) {
        handleUserSpeech(finalTranscript);
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again!');
      } else if (event.error === 'audio-capture') {
        setError('Microphone not found. Please check your mic.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [isSupported]);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Play greeting when opened
  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      playGreeting();
    }
  }, [isOpen]);

  // Play initial greeting
  const playGreeting = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/api/voice/greeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, session_id: sessionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addToConversation('assistant', data.text);
        if (!isMuted && data.audio_base64) {
          await playAudio(data.audio_base64);
        }
      }
    } catch (err) {
      console.error('Greeting error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle user speech
  const handleUserSpeech = async (text) => {
    if (!text.trim()) return;
    
    // Add to conversation
    addToConversation('user', text);
    setTranscript('');
    
    // Notify parent if callback provided
    if (onTranscript) {
      onTranscript(text);
    }
    
    // Send to backend for processing
    try {
      setIsProcessing(true);
      
      const response = await fetch(`${API_BASE_URL}/api/voice/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode,
          topic,
          session_id: sessionId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addToConversation('assistant', data.text);
        if (!isMuted && data.audio_base64) {
          await playAudio(data.audio_base64);
        }
      } else {
        addToConversation('assistant', data.text || 'Sorry, I had trouble with that.');
        if (!isMuted && data.audio_base64) {
          await playAudio(data.audio_base64);
        }
      }
    } catch (err) {
      console.error('Voice processing error:', err);
      setError('Connection error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add message to conversation
  const addToConversation = (role, text) => {
    setConversation(prev => [...prev, {
      id: Date.now(),
      role,
      text,
      timestamp: new Date().toISOString()
    }]);
  };

  // Play audio from base64
  const playAudio = async (base64Audio) => {
    return new Promise((resolve, reject) => {
      try {
        setIsSpeaking(true);
        
        // Convert base64 to blob
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(blob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audioRef.current.onerror = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            reject(new Error('Audio playback failed'));
          };
          audioRef.current.play();
        }
      } catch (err) {
        setIsSpeaking(false);
        reject(err);
      }
    });
  };

  // Toggle listening
  const toggleListening = () => {
    if (!isSupported) {
      setError('Speech recognition not supported in this browser. Try Chrome!');
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  // Mode button styles
  const getModeButtonClass = (m) => {
    const base = "px-3 py-1.5 text-xs font-medium rounded-full transition-all ";
    return mode === m 
      ? base + "bg-peacock-500 text-white shadow-md"
      : base + "bg-gray-100 text-gray-600 hover:bg-gray-200";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-24 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-peacock-500 to-peacock-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Voice Assistant</h3>
              <p className="text-white/70 text-xs">
                {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Tap mic to speak'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="px-4 py-2 bg-gray-50 border-b flex gap-2 overflow-x-auto">
          <button onClick={() => setMode('conversation')} className={getModeButtonClass('conversation')}>
            💬 Chat
          </button>
          <button onClick={() => setMode('explain')} className={getModeButtonClass('explain')}>
            📚 Explain
          </button>
          <button onClick={() => setMode('quiz')} className={getModeButtonClass('quiz')}>
            🎯 Quiz Me
          </button>
          <button onClick={() => setMode('doubt')} className={getModeButtonClass('doubt')}>
            🤔 Doubt
          </button>
        </div>

        {/* Conversation Area */}
        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle size={32} className="mb-2 opacity-50" />
              <p className="text-sm">Start speaking to begin...</p>
            </div>
          ) : (
            conversation.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-peacock-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))
          )}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={conversationEndRef} />
        </div>

        {/* Transcript Preview */}
        {transcript && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <p className="text-sm text-blue-600 italic">"{transcript}"</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center gap-4">
          {/* Main Mic Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleListening}
            disabled={isProcessing || isSpeaking}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-red-500/30'
                : isProcessing || isSpeaking
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-br from-peacock-500 to-peacock-600 text-white shadow-peacock-500/30 hover:shadow-xl'
            }`}
          >
            {isListening ? (
              <>
                <MicOff size={24} />
                {/* Pulse animation when listening */}
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              </>
            ) : (
              <Mic size={24} />
            )}
          </motion.button>

          {/* Stop Speaking Button */}
          {isSpeaking && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={stopSpeaking}
              className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg"
            >
              <VolumeX size={20} />
            </motion.button>
          )}
        </div>

        {/* Browser Support Warning */}
        {!isSupported && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-center">
            <p className="text-sm text-amber-700">
              ⚠️ Speech recognition works best in Chrome browser
            </p>
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
