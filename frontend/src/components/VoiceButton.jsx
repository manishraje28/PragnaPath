import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';

const ASSISTANT_AVATAR = "\u{1F9D1}\u200D\u{1F3EB}";

/**
 * VoiceButton Component
 * =====================
 * A floating action button that opens the Pragya Teaching Assistant.
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
      {/* Floating Assistant Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 group flex items-center gap-2 z-40"
            title="Ask Pragya - AI Teaching Assistant"
          >
            {/* Label that shows on hover */}
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden group-hover:block bg-white text-gray-700 text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg border border-gray-100 whitespace-nowrap"
            >
              Ask Pragya
            </motion.span>
            
            {/* Main button */}
            <div className="relative w-14 h-14 bg-gradient-to-br from-peacock-500 via-peacock-600 to-teal-500 
                            text-white rounded-2xl shadow-lg shadow-peacock-500/30 
                            flex items-center justify-center hover:shadow-xl transition-shadow">
              <span className="text-2xl">{ASSISTANT_AVATAR}</span>
              
              {/* Online indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
              
              {/* Subtle pulse */}
              <span className="absolute inset-0 rounded-2xl bg-peacock-400 animate-ping opacity-15" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Teaching Assistant Panel */}
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
