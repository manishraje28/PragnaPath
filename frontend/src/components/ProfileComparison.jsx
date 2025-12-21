import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

const profileFields = [
  { key: 'learning_style', label: 'Learning Style', icon: '🎯' },
  { key: 'pace', label: 'Pace', icon: '⚡' },
  { key: 'confidence', label: 'Confidence', icon: '💪' },
  { key: 'depth_preference', label: 'Depth', icon: '📚' }
];

const fieldValueColors = {
  learning_style: {
    conceptual: 'bg-saffron-100 text-saffron-700',
    visual: 'bg-peacock-100 text-peacock-700',
    'exam-focused': 'bg-lotus-100 text-lotus-700'
  },
  pace: {
    slow: 'bg-blue-100 text-blue-700',
    medium: 'bg-green-100 text-green-700',
    fast: 'bg-red-100 text-red-700'
  },
  confidence: {
    low: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-green-100 text-green-700'
  },
  depth_preference: {
    'intuition-first': 'bg-purple-100 text-purple-700',
    'formula-first': 'bg-indigo-100 text-indigo-700'
  }
};

export default function ProfileComparison({ 
  previousProfile, 
  currentProfile, 
  trigger,
  onClose 
}) {
  if (!previousProfile || !currentProfile) return null;

  const changes = [];
  
  profileFields.forEach(field => {
    const prevValue = previousProfile[field.key];
    const currValue = currentProfile[field.key];
    
    if (prevValue !== currValue) {
      changes.push({
        ...field,
        from: prevValue,
        to: currValue
      });
    }
  });

  const hasChanges = changes.length > 0;

  // Determine trigger message
  const triggerMessages = {
    mcq_incorrect: '📝 Based on MCQ performance',
    explain_back_incorrect: '💬 Based on your explanation',
    struggling: '🤔 You indicated you were struggling',
    slow_response: '⏱️ Response time indicated difficulty',
    user_request: '🔄 You requested a different approach'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-saffron-50 to-peacock-50 rounded-xl p-4 border border-saffron-200 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="text-saffron-500" size={20} />
          <h4 className="font-semibold text-gray-900">
            {hasChanges ? '🎯 Profile Adapted!' : '✓ Profile Confirmed'}
          </h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Trigger reason */}
      <p className="text-sm text-gray-600 mb-4">
        {triggerMessages[trigger] || 'Adaptation triggered'}
      </p>

      {/* Changes */}
      {hasChanges ? (
        <div className="space-y-3">
          {changes.map((change, index) => (
            <motion.div
              key={change.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-white rounded-lg p-3"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{change.icon}</span>
                <span className="text-sm font-medium text-gray-700">{change.label}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* From value */}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  fieldValueColors[change.key]?.[change.from] || 'bg-gray-100 text-gray-600'
                }`}>
                  {change.from?.replace('-', ' ')}
                </span>
                
                {/* Arrow */}
                <ArrowRight size={16} className="text-gray-400" />
                
                {/* To value */}
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`text-xs px-2 py-1 rounded-full font-medium ring-2 ring-saffron-200 ${
                    fieldValueColors[change.key]?.[change.to] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {change.to?.replace('-', ' ')}
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-3 text-center text-gray-600 text-sm">
          Your profile remains optimized for your learning style ✓
        </div>
      )}

      {/* Stats change if available */}
      {(currentProfile.correct_answers !== undefined && previousProfile.correct_answers !== undefined) && (
        <div className="mt-4 pt-4 border-t border-saffron-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Accuracy</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {currentProfile.total_answers > 0 
                    ? Math.round((currentProfile.correct_answers / currentProfile.total_answers) * 100) 
                    : 0}%
                </span>
                {currentProfile.correct_answers > previousProfile.correct_answers && (
                  <TrendingUp size={14} className="text-green-500" />
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Questions</p>
              <span className="font-semibold text-gray-900">
                {currentProfile.total_answers || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Explanation of adaptation */}
      {hasChanges && (
        <div className="mt-4 text-xs text-gray-500 bg-white/50 rounded-lg p-2">
          💡 <strong>What this means:</strong> The teaching will now be adjusted to match your updated profile for better learning.
        </div>
      )}
    </motion.div>
  );
}
