import { motion } from 'framer-motion';
import { Brain, BookOpen, Zap, Eye, Target, Gauge } from 'lucide-react';

const styleIcons = {
  conceptual: Brain,
  visual: Eye,
  'exam-focused': Target,
};

const styleColors = {
  conceptual: 'from-saffron-500 to-saffron-600',
  visual: 'from-peacock-500 to-peacock-600',
  'exam-focused': 'from-lotus-500 to-lotus-600',
};

const styleDescriptions = {
  conceptual: 'Stories & Analogies',
  visual: 'Visual & Diagrams',
  'exam-focused': 'Definitions & Patterns',
};

export default function ProfileCard({ profile, compact = false, showChange = false, previousProfile = null }) {
  if (!profile) return null;

  const StyleIcon = styleIcons[profile.learning_style] || Brain;
  const styleColor = styleColors[profile.learning_style] || 'from-gray-500 to-gray-600';

  // Detect changes for animation
  const hasStyleChange = previousProfile && previousProfile.learning_style !== profile.learning_style;

  if (compact) {
    return (
      <motion.div
        layout
        className="card w-64 profile-card"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-10 h-10 bg-gradient-to-br ${styleColor} rounded-lg flex items-center justify-center`}>
            <StyleIcon size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Your Style</p>
            <p className="font-semibold text-gray-900 capitalize">
              {profile.learning_style?.replace('-', ' ')}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Pace</span>
            <span className="font-medium capitalize">{profile.pace}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Confidence</span>
            <span className="font-medium capitalize">{profile.confidence}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Depth</span>
            <span className="font-medium capitalize">{profile.depth_preference?.replace('-', ' ')}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className={`card ${hasStyleChange ? 'ring-2 ring-saffron-500 ring-offset-2' : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-lg text-gray-900">
          Your Learning Profile
        </h3>
        {hasStyleChange && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center space-x-1 bg-saffron-100 text-saffron-700 px-3 py-1 rounded-full text-xs font-medium"
          >
            <Zap size={12} />
            <span>Adapted!</span>
          </motion.span>
        )}
      </div>

      {/* Main Style */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <motion.div
          key={profile.learning_style}
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className={`w-16 h-16 bg-gradient-to-br ${styleColor} rounded-xl flex items-center justify-center shadow-lg`}
        >
          <StyleIcon size={32} className="text-white" />
        </motion.div>
        <div>
          <p className="text-sm text-gray-500">Learning Style</p>
          <p className="font-display font-semibold text-xl text-gray-900 capitalize">
            {profile.learning_style?.replace('-', ' ')}
          </p>
          <p className="text-sm text-gray-600">
            {styleDescriptions[profile.learning_style]}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Gauge size={20} className="mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-500">Pace</p>
          <p className="font-semibold capitalize">{profile.pace}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Target size={20} className="mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-500">Confidence</p>
          <p className="font-semibold capitalize">{profile.confidence}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <BookOpen size={20} className="mx-auto mb-1 text-gray-400" />
          <p className="text-xs text-gray-500">Depth</p>
          <p className="font-semibold capitalize text-sm">{profile.depth_preference?.split('-')[0]}</p>
        </div>
      </div>

      {/* Accuracy (if available) */}
      {profile.total_answers > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Session Accuracy</span>
            <span className="font-semibold text-lg">
              {Math.round((profile.correct_answers / profile.total_answers) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(profile.correct_answers / profile.total_answers) * 100}%` }}
              className="h-full bg-gradient-to-r from-peacock-500 to-peacock-600 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
