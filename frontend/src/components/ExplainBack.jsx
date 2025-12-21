import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Loader2, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

export default function ExplainBack({ 
  sessionId,
  topic,
  onEvaluationComplete,
  onProfileUpdate,
  onRequestReExplanation
}) {
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!explanation.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/evaluate-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          topic,
          learner_explanation: explanation.trim()
        })
      });
      
      const data = await response.json();
      setEvaluation(data);
      
      if (onEvaluationComplete) {
        onEvaluationComplete(data);
      }
      
      if (data.profile_updated && onProfileUpdate) {
        onProfileUpdate(data.updated_profile);
      }
      
    } catch (error) {
      console.error('Error evaluating explanation:', error);
      // Fallback evaluation for demo purposes
      setEvaluation({
        understanding: 'partial',
        feedback: 'Good attempt! Let me help you understand this better.',
        suggestions: ['Try to explain the core mechanism', 'Think about what happens step by step'],
        profile_updated: false
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setExplanation('');
    setEvaluation(null);
  };

  const handleRequestReExplanation = () => {
    if (onRequestReExplanation) {
      onRequestReExplanation('explain_back_incorrect');
    }
    handleReset();
  };

  const understandingConfig = {
    correct: {
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      label: 'Great Understanding! 🎉',
      emoji: '✨'
    },
    partial: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'Partial Understanding 💭',
      emoji: '💡'
    },
    incorrect: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'Needs More Clarity 📚',
      emoji: '🤔'
    },
    not_attempted: {
      icon: AlertTriangle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'Try Explaining the Concept 📝',
      emoji: '✏️'
    },
    off_topic: {
      icon: AlertTriangle,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      label: 'Let\'s Focus on the Topic 🎯',
      emoji: '🎯'
    }
  };

  return (
    <motion.div
      layout
      className="bg-gradient-to-br from-peacock-50 to-peacock-100 rounded-xl p-5 border border-peacock-200"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => !evaluation && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-lg flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Explain Back to Me 🎯</h4>
            <p className="text-sm text-gray-600">
              Teaching is the best way to learn - explain this concept in your own words
            </p>
          </div>
        </div>
        <Sparkles size={20} className="text-peacock-500" />
      </div>

      {/* Expanded Input Section */}
      <AnimatePresence>
        {(isExpanded || evaluation) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4"
          >
            {!evaluation ? (
              <>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain this concept in 2-3 sentences as if you were teaching a friend..."
                  className="w-full h-24 p-3 rounded-lg border border-peacock-300 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-200 resize-none text-gray-700"
                  disabled={isSubmitting}
                />
                
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    {explanation.length}/500 characters
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!explanation.trim() || isSubmitting}
                    className="flex items-center space-x-2 bg-peacock-500 text-white px-4 py-2 rounded-lg hover:bg-peacock-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Submit</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Evaluation Result */}
                {(() => {
                  const config = understandingConfig[evaluation.understanding] || understandingConfig.partial;
                  const Icon = config.icon;
                  
                  return (
                    <div className={`rounded-xl p-4 ${config.bgColor} border ${config.borderColor}`}>
                      <div className="flex items-center space-x-3 mb-3">
                        <Icon size={24} className={config.color} />
                        <span className="font-semibold text-gray-900">{config.label}</span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{evaluation.feedback}</p>
                      
                      {evaluation.suggestions && evaluation.suggestions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">💡 Tips to improve:</p>
                          <ul className="space-y-1">
                            {evaluation.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                                <span>•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Action buttons based on understanding */}
                      <div className="flex space-x-3 mt-4">
                        <button
                          onClick={handleReset}
                          className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          Try Again
                        </button>
                        
                        {evaluation.understanding !== 'correct' && (
                          <button
                            onClick={handleRequestReExplanation}
                            className="px-3 py-1.5 text-sm bg-saffron-500 text-white rounded-lg hover:bg-saffron-600 transition-colors"
                          >
                            Explain Differently
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Your explanation */}
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Your explanation:</p>
                  <p className="text-sm text-gray-700 italic">"{explanation}"</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Collapsed state hint */}
      {!isExpanded && !evaluation && (
        <p className="text-sm text-peacock-600 mt-3 cursor-pointer" onClick={() => setIsExpanded(true)}>
          Click to expand and test your understanding →
        </p>
      )}
    </motion.div>
  );
}
