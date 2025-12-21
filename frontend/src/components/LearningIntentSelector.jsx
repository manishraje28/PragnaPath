import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, BookOpen, Briefcase, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { setLearningIntent } from '../api';

const intents = [
  {
    id: 'exam',
    icon: BookOpen,
    title: 'Exam Preparation',
    description: 'Focus on definitions, keywords, and exam patterns',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  {
    id: 'conceptual',
    icon: Sparkles,
    title: 'Deep Understanding',
    description: 'Focus on intuition, reasoning, and analogies',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  {
    id: 'interview',
    icon: Briefcase,
    title: 'Interview Prep',
    description: 'Focus on trade-offs, edge cases, and real-world',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  {
    id: 'revision',
    icon: Zap,
    title: 'Quick Revision',
    description: 'Concise summaries and key points only',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  }
];

export default function LearningIntentSelector({ 
  sessionId, 
  topic,
  onIntentSelected,
  onSkip 
}) {
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intentMessage, setIntentMessage] = useState(null);

  const handleSelect = async (intentId) => {
    setSelectedIntent(intentId);
    setIsSubmitting(true);
    
    try {
      const result = await setLearningIntent(sessionId, intentId);
      setIntentMessage(result.message);
      
      // Wait a moment to show the message, then proceed
      setTimeout(() => {
        if (onIntentSelected) {
          onIntentSelected(intentId, result);
        }
      }, 1500);
    } catch (error) {
      console.error('Error setting intent:', error);
      setIsSubmitting(false);
    }
  };

  if (intentMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-16 h-16 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Target className="text-white" size={28} />
        </motion.div>
        <p className="text-lg text-gray-700">{intentMessage}</p>
        <p className="text-sm text-gray-500 mt-2">Preparing your personalized learning experience...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Target className="text-white" size={24} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          What's your goal with {topic}?
        </h2>
        <p className="text-gray-500 text-sm">
          This helps me teach you in the most effective way
        </p>
      </div>

      {/* Intent Options */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {intents.map((intent) => {
          const Icon = intent.icon;
          const isSelected = selectedIntent === intent.id;
          
          return (
            <motion.button
              key={intent.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(intent.id)}
              disabled={isSubmitting}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                ${isSelected 
                  ? `${intent.borderColor} ${intent.bgColor}` 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${isSubmitting && !isSelected ? 'opacity-50' : ''}
              `}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${intent.color} flex items-center justify-center mb-2`}>
                <Icon className="text-white" size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {intent.title}
              </h3>
              <p className="text-xs text-gray-500">
                {intent.description}
              </p>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <ArrowRight className="text-white" size={12} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Skip option */}
      {onSkip && (
        <button
          onClick={onSkip}
          disabled={isSubmitting}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip for now (default: deep understanding)
        </button>
      )}
    </motion.div>
  );
}
