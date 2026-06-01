import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, BookOpen, Zap, Target, Clock, ArrowRight,
  TrendingUp, Award, User, Sparkles, Play, Plus,
  BarChart3, RefreshCw, ChevronRight
} from 'lucide-react';

const STYLE_LABELS = {
  'conceptual': { label: 'Conceptual', emoji: '🧠', desc: 'Stories, analogies, real-world connections' },
  'visual': { label: 'Visual', emoji: '👁️', desc: 'Diagrams, flowcharts, spatial layouts' },
  'exam-focused': { label: 'Exam-Focused', emoji: '🎯', desc: 'Definitions, keywords, patterns' },
};

const PACE_LABELS = {
  'slow': { label: 'Steady', color: 'text-blue-600 bg-blue-50' },
  'medium': { label: 'Moderate', color: 'text-saffron-600 bg-saffron-50' },
  'fast': { label: 'Fast', color: 'text-green-600 bg-green-50' },
};

const CONFIDENCE_LABELS = {
  'low': { label: 'Building', color: 'text-saffron-600' },
  'medium': { label: 'Growing', color: 'text-peacock-600' },
  'high': { label: 'Strong', color: 'text-green-600' },
};

export default function Dashboard({ user, profile, onNewTopic, onContinueTopic, onLogout }) {
  const topicsExplored = profile?.topics_explored || [];
  const styleInfo = STYLE_LABELS[profile?.learning_style] || STYLE_LABELS['conceptual'];
  const paceInfo = PACE_LABELS[profile?.pace] || PACE_LABELS['medium'];
  const confidenceInfo = CONFIDENCE_LABELS[profile?.confidence] || CONFIDENCE_LABELS['medium'];
  const accuracy = profile?.total_answers > 0
    ? Math.round((profile.correct_answers / profile.total_answers) * 100)
    : null;

  const hasProfile = profile && (profile.total_answers > 0 || topicsExplored.length > 0);

  return (
    <div className="min-h-[80vh] py-4">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900">
              Welcome{user?.name ? `, ${user.name}` : ' back'}! 👋
            </h1>
            <p className="text-gray-500 mt-1">
              {hasProfile
                ? 'Continue your adaptive learning journey'
                : "Let's begin your personalized learning journey"
              }
            </p>
          </div>
          {user?.is_guest && (
            <div className="bg-saffron-50 border border-saffron-200 text-saffron-700 px-4 py-2 rounded-lg text-sm flex items-center space-x-2">
              <Sparkles size={14} />
              <span>Guest Mode — Sign up to save your progress</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── LEFT: Profile Card ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-saffron-500 to-peacock-500 p-6 text-white">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                  {styleInfo.emoji}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg">Your Learning Profile</h3>
                  <p className="text-white/80 text-sm">
                    {hasProfile ? `${styleInfo.label} Learner` : 'Not built yet'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-4">
              {hasProfile ? (
                <>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Learning Style</p>
                    <p className="font-medium text-gray-900">{styleInfo.label}</p>
                    <p className="text-xs text-gray-500">{styleInfo.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Pace</p>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${paceInfo.color}`}>{paceInfo.label}</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Confidence</p>
                      <p className={`text-sm font-medium ${confidenceInfo.color}`}>{confidenceInfo.label}</p>
                    </div>
                  </div>
                  {accuracy !== null && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs text-gray-400">Accuracy</p>
                        <p className="text-sm font-bold text-gray-900">{accuracy}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-saffron-500 to-peacock-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {profile.correct_answers}/{profile.total_answers} correct
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Brain size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">Complete your first diagnostic to build your cognitive profile</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── RIGHT: Topics & Actions ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Quick Action - Start New Topic */}
          <button
            onClick={onNewTopic}
            className="w-full group bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-2xl p-6 flex items-center justify-between hover:from-saffron-600 hover:to-saffron-700 transition-all duration-300 shadow-lg shadow-saffron-500/15 hover:shadow-xl hover:shadow-saffron-500/20"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus size={24} />
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-lg">
                  {topicsExplored.length === 0 ? 'Start Your First Topic' : 'Explore a New Topic'}
                </p>
                <p className="text-white/80 text-sm">Choose from CS fundamentals, DSA, algorithms & more</p>
              </div>
            </div>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </button>

          {/* Topics Explored */}
          {topicsExplored.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen size={18} className="text-peacock-500" />
                  <h3 className="font-display font-semibold text-gray-900">Topics Explored</h3>
                </div>
                <span className="text-xs bg-peacock-50 text-peacock-600 px-2 py-1 rounded-full font-medium">
                  {topicsExplored.length} topic{topicsExplored.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {topicsExplored.map((topic, i) => (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-peacock-50 rounded-lg flex items-center justify-center">
                        <BookOpen size={18} className="text-peacock-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{topic}</p>
                        <p className="text-xs text-gray-400">Profile adapted for this topic</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onContinueTopic(topic)}
                      className="flex items-center space-x-1 text-sm text-peacock-600 hover:text-peacock-700 font-medium px-3 py-1.5 rounded-lg hover:bg-peacock-50 transition-all"
                    >
                      <Play size={14} />
                      <span>Continue</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          {hasProfile && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Topics', value: topicsExplored.length, icon: BookOpen, color: 'text-saffron-600 bg-saffron-50' },
                { label: 'Questions', value: profile.total_answers || 0, icon: Target, color: 'text-peacock-600 bg-peacock-50' },
                { label: 'Intent', value: profile.learning_intent || 'conceptual', icon: Zap, color: 'text-lotus-600 bg-lotus-50', isText: true },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <stat.icon size={18} />
                  </div>
                  <p className={`font-bold ${stat.isText ? 'text-sm capitalize' : 'text-2xl'} text-gray-900`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Empty state illustration for new users */}
          {!hasProfile && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <div className="max-w-sm mx-auto">
                <div className="flex justify-center space-x-3 mb-6">
                  {['🎛️', '🧠', '🧑‍🏫', '🛠️', '♿'].map((emoji, i) => (
                    <motion.span
                      key={emoji}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="text-2xl"
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </div>
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">
                  5 AI Agents, Ready to Help
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Pick a topic above to start your first diagnostic. Our agents will analyze your learning style and begin adapting to you immediately.
                </p>
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
                  <span className="flex items-center space-x-1"><RefreshCw size={12} /><span>Real-time adaptation</span></span>
                  <span className="flex items-center space-x-1"><Brain size={12} /><span>Cognitive profiling</span></span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
