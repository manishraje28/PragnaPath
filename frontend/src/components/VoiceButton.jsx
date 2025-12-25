import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';

/**
 * VoiceButton Component
 * =====================
 * A floating action button that opens the Voice Assistant.
 * Shows at the bottom-right corner of the screen.
 */
export default function VoiceButton({ 
  topic = null, 
  sessionId = null,
  onTranscript = null 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Voice Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-peacock-500 to-peacock-600 
                       text-white rounded-full shadow-lg shadow-peacock-500/30 
                       flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
            title="Voice Assistant"
          >
            <Mic size={24} />
            
            {/* Subtle pulse indicator */}
            <span className="absolute inset-0 rounded-full bg-peacock-400 animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice Assistant Panel */}
      <VoiceAssistant
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        topic={topic}
        sessionId={sessionId}
        onTranscript={onTranscript}
      />
    </>
  );
}
