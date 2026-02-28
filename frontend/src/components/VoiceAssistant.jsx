import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Send, Loader2, 
  BookOpen, Brain, HelpCircle, MessageSquare
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Assistant persona
const ASSISTANT_NAME = "Pragya";
const ASSISTANT_AVATAR = "\u{1F9D1}\u200D\u{1F3EB}"; // teacher emoji

// Interaction modes
const MODES = [
  { id: 'conversation', label: 'Chat', icon: MessageSquare, emoji: '\u{1F4AC}', desc: 'Ask anything' },
  { id: 'explain', label: 'Explain', icon: BookOpen, emoji: '\u{1F4DA}', desc: 'Learn concepts' },
  { id: 'quiz', label: 'Quiz Me', icon: Brain, emoji: '\u{1F3AF}', desc: 'Test yourself' },
  { id: 'doubt', label: 'Doubts', icon: HelpCircle, emoji: '\u{1F914}', desc: 'Clear doubts' },
];

// Quick suggestion chips based on mode
const SUGGESTIONS = {
  conversation: [
    "What should I learn next?",
    "Give me a summary",
    "How is this used in real life?",
  ],
  explain: [
    "Explain it simply",
    "Give me an example",
    "Why is this important?",
  ],
  quiz: [
    "Start a quick quiz",
    "Ask me a harder question",
    "Give me a hint",
  ],
  doubt: [
    "I don't understand this",
    "Can you explain differently?",
    "What's the difference between...",
  ]
};

/**
 * VoiceAssistant Component (Cross-Browser)
 * =========================================
 * Teaching assistant with voice + text input.
 * 
 * STT Strategy (Cross-Browser):
 * - Chrome/Edge: Web Speech API (real-time transcription)
 * - Firefox/Safari/All: MediaRecorder API -> Backend Gemini transcription
 * 
 * TTS: Edge TTS via backend (works everywhere)
 */
export default function VoiceAssistant({ 
  isOpen, 
  onClose, 
  topic = null,
  sessionId = null,
  onTranscript = null
}) {
  // Core states
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('conversation');
  const [isMuted, setIsMuted] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  
  // Voice recording states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Browser capabilities
  const [sttMethod, setSttMethod] = useState('none'); // 'webspeech', 'mediarecorder', 'none'
  
  // Refs
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const conversationEndRef = useRef(null);
  const inputRef = useRef(null);
  const streamRef = useRef(null);
  
  // Detect browser STT capabilities
  useEffect(() => {
    // Brave exposes webkitSpeechRecognition but blocks it (privacy).
    // Detect Brave and skip straight to MediaRecorder.
    const isBrave = navigator.brave && typeof navigator.brave.isBrave === 'function';
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && !isBrave) {
      setSttMethod('webspeech');
    } else if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
      setSttMethod('mediarecorder');
    } else {
      setSttMethod('none');
    }
  }, []);

  // Initialize Web Speech API (Chrome/Edge)
  useEffect(() => {
    if (sttMethod !== 'webspeech') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      
      setTranscript(interimTranscript || finalTranscript);
      
      if (finalTranscript) {
        handleUserMessage(finalTranscript);
        setTranscript('');
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      // If the browser blocks Web Speech (e.g. Brave privacy settings),
      // auto-downgrade to MediaRecorder so voice still works.
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'network') {
        if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
          console.log('Web Speech blocked — falling back to MediaRecorder');
          setSttMethod('mediarecorder');
          setError('Switched to recording mode. Tap mic again to speak.');
          return;
        }
      }

      if (event.error === 'no-speech') {
        setError('No speech detected. Try again or type your question.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone not found. You can type your question instead.');
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Mic access denied. Please allow microphone or type your question.');
      } else {
        setError('Voice recognition unavailable. You can type your question.');
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
  }, [sttMethod]);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation, isProcessing]);

  // Play greeting when opened
  useEffect(() => {
    if (isOpen && conversation.length === 0) {
      playGreeting();
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ============ GREETING ============
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
        if (autoSpeak && !isMuted && data.audio_base64) {
          await playAudio(data.audio_base64, data.audio_format || 'mp3');
        }
      }
    } catch (err) {
      console.error('Greeting error:', err);
      addToConversation('assistant', `Hi! I'm ${ASSISTANT_NAME}, your learning assistant. ${topic ? `Let's explore ${topic} together!` : 'What would you like to learn today?'} You can type or use voice to ask me anything.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ MESSAGE HANDLING ============
  const handleUserMessage = async (text) => {
    if (!text.trim()) return;
    
    addToConversation('user', text);
    setTextInput('');
    setTranscript('');
    
    if (onTranscript) onTranscript(text);
    
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
      
      if (data.success || data.text) {
        addToConversation('assistant', data.text);
        if (autoSpeak && !isMuted && data.audio_base64) {
          await playAudio(data.audio_base64, data.audio_format || 'mp3');
        }
      } else {
        addToConversation('assistant', "I'm sorry, I couldn't process that. Could you try again?");
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Connection error. Please try again.');
      addToConversation('assistant', "I'm having trouble connecting. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ TEXT INPUT ============
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      handleUserMessage(textInput.trim());
    }
  };

  // ============ VOICE: TOGGLE ============
  const toggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = async () => {
    setError(null);
    
    if (sttMethod === 'webspeech') {
      // Chrome/Edge: Web Speech API
      try {
        setTranscript('');
        recognitionRef.current?.start();
      } catch (err) {
        // Web Speech API exists but threw — fall back to MediaRecorder
        console.warn('Web Speech start() failed, falling back:', err);
        if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
          setSttMethod('mediarecorder');
          setError('Switched to recording mode. Tap mic again to speak.');
        } else {
          setError('Could not start voice recognition. Try typing instead.');
        }
      }
    } else if (sttMethod === 'mediarecorder') {
      // Firefox/Safari: MediaRecorder + Backend transcription
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        // Determine supported format
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser pick default
        }
        
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        audioChunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = async () => {
          // Stop mic stream
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: recorder.mimeType || 'audio/webm' 
          });
          
          if (audioBlob.size < 100) {
            setError('Recording too short. Please try again.');
            setIsListening(false);
            return;
          }
          
          // Send to backend for transcription
          setIsTranscribing(true);
          setTranscript('Transcribing...');
          
          try {
            const resp = await fetch(`${API_BASE_URL}/api/voice/transcribe`, {
              method: 'POST',
              headers: { 'Content-Type': recorder.mimeType || 'audio/webm' },
              body: audioBlob
            });
            
            const data = await resp.json();
            
            if (data.success && data.text && data.text.trim()) {
              setTranscript('');
              handleUserMessage(data.text.trim());
            } else {
              setTranscript('');
              setError('Could not understand. Please try again or type your question.');
            }
          } catch (err) {
            console.error('Transcription error:', err);
            setTranscript('');
            setError('Transcription failed. Please type your question.');
          } finally {
            setIsTranscribing(false);
          }
        };
        
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsListening(true);
        setTranscript('Listening...');
        
      } catch (err) {
        console.error('MediaRecorder error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow it or type your question.');
        } else {
          setError('Could not access microphone. You can type your question instead.');
        }
      }
    } else {
      setError('Voice input is not supported in this browser. Please type your question.');
    }
  };

  const stopListening = () => {
    if (sttMethod === 'webspeech') {
      recognitionRef.current?.stop();
    } else if (sttMethod === 'mediarecorder' && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsListening(false);
  };

  // ============ CONVERSATION ============
  const addToConversation = (role, text) => {
    setConversation(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      text,
      timestamp: new Date()
    }]);
  };

  // ============ AUDIO PLAYBACK ============
  const playAudio = async (base64Audio, audioFormat = 'mp3') => {
    return new Promise((resolve, reject) => {
      try {
        setIsSpeaking(true);
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        // Support WAV (native Gemini audio) and MP3 (Edge TTS fallback)
        const mimeType = audioFormat === 'wav' ? 'audio/wav' : 'audio/mpeg';
        const blob = new Blob([byteArray], { type: mimeType });
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
          audioRef.current.play().catch(() => {
            setIsSpeaking(false);
            resolve();
          });
        } else {
          setIsSpeaking(false);
          resolve();
        }
      } catch (err) {
        setIsSpeaking(false);
        reject(err);
      }
    });
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  // ============ SUGGESTION CLICK ============
  const handleSuggestion = (suggestion) => {
    if (!isProcessing) {
      handleUserMessage(suggestion);
    }
  };

  // ============ FORMAT TIME ============
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-24 right-4 sm:right-6 w-[min(400px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 flex flex-col"
        style={{ maxHeight: 'min(600px, calc(100vh - 8rem))' }}
      >
        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-r from-peacock-600 via-peacock-500 to-teal-500 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-lg shadow-inner">
              {ASSISTANT_AVATAR}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-sm">{ASSISTANT_NAME}</h3>
                <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-[10px] text-white/90 font-medium">
                  AI Tutor
                </span>
              </div>
              <p className="text-white/70 text-xs mt-0.5">
                {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : isProcessing ? 'Thinking...' : topic ? `Learning: ${topic}` : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setAutoSpeak(!autoSpeak); }}
              className={`p-2 rounded-lg transition-colors ${autoSpeak ? 'text-white bg-white/15' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
              title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
            >
              {autoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ===== MODE SELECTOR ===== */}
        <div className="px-3 py-2 bg-gray-50/80 border-b border-gray-100 flex gap-1.5 overflow-x-auto flex-shrink-0">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                mode === m.id
                  ? 'bg-peacock-500 text-white shadow-sm shadow-peacock-500/25'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="text-sm">{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* ===== CONVERSATION AREA ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-white min-h-0" style={{ minHeight: '200px' }}>
          {conversation.length === 0 && !isProcessing ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6">
              <div className="w-16 h-16 bg-gradient-to-br from-peacock-100 to-teal-100 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-sm">
                {ASSISTANT_AVATAR}
              </div>
              <h4 className="font-semibold text-gray-700 mb-1">Hi! I'm {ASSISTANT_NAME}</h4>
              <p className="text-sm text-gray-400 max-w-[240px]">
                Your personal AI tutor. Ask me anything, or pick a suggestion below!
              </p>
            </div>
          ) : (
            conversation.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-peacock-100 to-teal-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    {ASSISTANT_AVATAR}
                  </div>
                )}
                <div className="flex flex-col max-w-[78%]">
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-peacock-500 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-right text-gray-400' : 'text-gray-300 ml-1'}`}>
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start gap-2"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-peacock-100 to-teal-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                {ASSISTANT_AVATAR}
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-peacock-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-peacock-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-peacock-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-400">{ASSISTANT_NAME} is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={conversationEndRef} />
        </div>

        {/* ===== SUGGESTIONS ===== */}
        {conversation.length <= 2 && !isProcessing && (
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <p className="text-[10px] text-gray-400 mb-1.5 font-medium uppercase tracking-wider">Suggestions</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS[mode]?.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-peacock-50 hover:border-peacock-300 hover:text-peacock-600 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== TRANSCRIPT PREVIEW ===== */}
        {(transcript || isTranscribing) && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex-shrink-0">
            <p className="text-sm text-blue-600 flex items-center gap-2">
              {isTranscribing && <Loader2 size={14} className="animate-spin" />}
              <span className="italic">{transcript}</span>
            </p>
          </div>
        )}

        {/* ===== ERROR ===== */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }}
            className="px-4 py-2 bg-amber-50 border-t border-amber-100 flex-shrink-0"
          >
            <p className="text-xs text-amber-700 flex items-center gap-2">
              <span>&#x26A0;&#xFE0F;</span> {error}
              <button onClick={() => setError(null)} className="ml-auto text-amber-500 hover:text-amber-700">
                <X size={12} />
              </button>
            </p>
          </motion.div>
        )}

        {/* ===== INPUT AREA ===== */}
        <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isListening ? 'Listening...' : `Ask ${ASSISTANT_NAME} anything...`}
                disabled={isProcessing || isListening}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-peacock-400 focus:border-transparent disabled:opacity-50 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    handleTextSubmit(e);
                  }
                }}
              />
            </div>
            
            {/* Mic Button */}
            {sttMethod !== 'none' && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                disabled={isProcessing || isSpeaking || isTranscribing}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                    : isTranscribing
                    ? 'bg-amber-400 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-peacock-50 hover:text-peacock-600 border border-gray-200'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={sttMethod === 'webspeech' ? 'Voice input (Speech API)' : 'Voice input (Recording)'}
              >
                {isTranscribing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isListening ? (
                  <>
                    <MicOff size={18} />
                    <span className="absolute inset-0 rounded-xl bg-red-500 animate-ping opacity-20" />
                  </>
                ) : (
                  <Mic size={18} />
                )}
              </motion.button>
            )}
            
            {/* Send Button */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.9 }}
              disabled={!textInput.trim() || isProcessing || isListening}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-peacock-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-peacock-500/20 hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex-shrink-0"
            >
              <Send size={16} />
            </motion.button>
          </form>
          
          {/* Bottom info */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-gray-300">
              {sttMethod === 'webspeech' && 'Voice: Speech API'}
              {sttMethod === 'mediarecorder' && 'Voice: Recording Mode'}
              {sttMethod === 'none' && 'Text only mode'}
            </p>
            {isSpeaking && (
              <button 
                onClick={stopSpeaking}
                className="text-[10px] text-amber-500 hover:text-amber-700 flex items-center gap-1 transition-colors"
              >
                <VolumeX size={10} /> Stop speaking
              </button>
            )}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}
