import { motion } from 'framer-motion';
import { AlertTriangle, Lightbulb, X, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function MisconceptionAlert({ 
  misconception, 
  correction, 
  confidence, 
  onDismiss 
}) {
  if (!misconception) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden shadow-lg"
    >
      {/* Decorative top bar */}
      <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
              <AlertTriangle className="text-white" size={20} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Misconception Detected</h4>
              <p className="text-xs text-gray-600">
                {confidence < 40 
                  ? "Let's clarify this tricky concept together" 
                  : "Quick correction to strengthen your understanding"
                }
              </p>
            </div>
          </div>
          {onDismiss && (
            <button 
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* What you might be thinking */}
        <div className="mb-4 p-3 bg-white/60 rounded-lg border border-amber-100">
          <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
            <AlertTriangle size={14} />
            <span>Common confusion:</span>
          </div>
          <p className="text-gray-700 text-sm">{misconception}</p>
        </div>

        {/* The correct understanding */}
        <div className="p-3 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-2">
            <Lightbulb size={14} />
            <span>Here's the correct way to think about it:</span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown>{correction}</ReactMarkdown>
          </div>
        </div>

        {/* Confidence-aware encouragement */}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <ChevronRight size={12} />
          <span>
            {confidence < 40 
              ? "This is a concept many learners find challenging. You're doing great by tackling it!"
              : confidence < 70
              ? "Small misconceptions like this are normal - catching them early helps a lot!"
              : "This is just a minor clarification. You've got a solid understanding overall!"
            }
          </span>
        </div>
      </div>
    </motion.div>
  );
}
