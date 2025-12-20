import { motion } from 'framer-motion';
import { Sparkles, Play, Presentation, BookOpen, Brain, Users, Lightbulb } from 'lucide-react';

export default function WelcomeScreen({ onStart, onDemo }) {
  const features = [
    {
      icon: Brain,
      title: 'Cognitive Profiling',
      description: 'Understands YOUR learning style through smart diagnostics',
      color: 'from-saffron-500 to-saffron-600',
    },
    {
      icon: Lightbulb,
      title: 'Adaptive Teaching',
      description: 'Explanations change based on how you learn best',
      color: 'from-peacock-500 to-peacock-600',
    },
    {
      icon: Users,
      title: 'Multi-Agent System',
      description: '5 specialized AI agents working together for you',
      color: 'from-lotus-500 to-lotus-600',
    },
  ];

  const agents = [
    { name: 'Sutradhar', role: 'Orchestrator', emoji: '🎛️' },
    { name: 'PragnaBodh', role: 'Cognitive Engine', emoji: '🧠' },
    { name: 'GurukulGuide', role: 'Adaptive Tutor', emoji: '🧑‍🏫' },
    { name: 'VidyaForge', role: 'Content Generator', emoji: '🛠️' },
    { name: 'SarvShiksha', role: 'Accessibility', emoji: '♿' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-4xl mx-auto mb-16"
      >
        {/* Badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center space-x-2 bg-saffron-100 text-saffron-700 px-4 py-2 rounded-full text-sm font-medium mb-6"
        >
          <Sparkles size={16} />
          <span>ML Mumbai GenAI Hackathon</span>
        </motion.div>

        {/* Main Title */}
        <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-saffron-500 via-peacock-500 to-lotus-500 bg-clip-text text-transparent">
            PragnaPath
          </span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-gray-600 mb-4">
          The AI that learns <span className="text-saffron-600 font-semibold">how YOU learn</span>
        </p>

        {/* Sanskrit meaning */}
        <p className="text-sm text-gray-500 italic mb-8">
          प्रज्ञा पथ • "The Path of Wisdom"
        </p>

        {/* Description */}
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Experience adaptive learning powered by a coordinated system of AI agents. 
          Watch as the teaching style transforms in real-time based on your cognitive profile.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
          >
            <Play size={20} />
            <span>Start Learning</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDemo}
            className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4"
          >
            <Presentation size={20} />
            <span>Judge Demo Mode</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="card card-hover text-center"
          >
            <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
              <feature.icon size={28} className="text-white" />
            </div>
            <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Agent Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <p className="text-sm text-gray-500 mb-4">Powered by 5 Specialized AI Agents</p>
        <div className="flex flex-wrap justify-center gap-3">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-100"
            >
              <span className="text-lg">{agent.emoji}</span>
              <span className="font-medium text-gray-800">{agent.name}</span>
              <span className="text-xs text-gray-500">({agent.role})</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
