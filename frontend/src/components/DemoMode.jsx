import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  ArrowLeft, 
  Zap, 
  Brain, 
  BookOpen, 
  RefreshCw,
  ChevronRight,
  Loader2,
  Sparkles,
  Eye
} from 'lucide-react';
import { runDemoFlow, compareExplanations, startSession } from '../api';

export default function DemoMode({ topics, onBack }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoResult, setDemoResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showingComparison, setShowingComparison] = useState(false);

  const demoSteps = [
    { icon: Brain, title: 'Build Initial Profile', description: 'Conceptual learner, medium pace' },
    { icon: BookOpen, title: 'First Explanation', description: 'Story & analogy approach' },
    { icon: Zap, title: 'Simulate Struggle', description: 'User answers incorrectly' },
    { icon: RefreshCw, title: 'Update Profile', description: 'Switch to exam-focused' },
    { icon: Sparkles, title: 'Adapted Explanation', description: 'Different teaching style!' },
  ];

  const runDemo = async (topic) => {
    setSelectedTopic(topic);
    setDemoRunning(true);
    setCurrentStep(0);
    setDemoResult(null);

    try {
      // Animate through steps
      for (let i = 0; i < demoSteps.length; i++) {
        setCurrentStep(i);
        await new Promise(r => setTimeout(r, 1500));
      }

      // Actually run the demo
      const result = await runDemoFlow(topic.name);
      setDemoResult(result);
      setShowingComparison(true);
      setDemoRunning(false);
    } catch (error) {
      console.error('Demo failed:', error);
      setDemoRunning(false);
    }
  };

  const resetDemo = () => {
    setSelectedTopic(null);
    setDemoResult(null);
    setShowingComparison(false);
    setCurrentStep(0);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Home</span>
        </button>
        
        <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full">
          <Eye size={16} />
          <span className="font-medium">Judge Demo Mode</span>
        </div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-display text-4xl font-bold text-gray-900 mb-4">
          🎯 The Adaptation Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Watch PragnaPath adapt its teaching style in real-time. 
          <span className="text-saffron-600 font-semibold"> Same topic, different explanations!</span>
        </p>
      </motion.div>

      {!selectedTopic ? (
        /* Topic Selection */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-3 gap-6"
        >
          {topics.map((topic, index) => (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => runDemo(topic)}
              className="card card-hover text-left group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl">{topic.icon}</span>
                <Play size={24} className="text-gray-300 group-hover:text-saffron-500 transition-colors" />
              </div>
              <h3 className="font-display font-semibold text-lg text-gray-900 group-hover:text-saffron-600 transition-colors">
                {topic.name}
              </h3>
              <p className="text-sm text-gray-500 mt-2">Click to run demo</p>
            </motion.button>
          ))}
        </motion.div>
      ) : demoRunning ? (
        /* Demo Progress */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="card">
            <h2 className="font-display text-xl font-semibold text-center mb-8">
              Running Demo: {selectedTopic.name}
            </h2>

            {/* Steps */}
            <div className="space-y-4">
              {demoSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.5 }}
                  animate={{ 
                    opacity: index <= currentStep ? 1 : 0.5,
                    scale: index === currentStep ? 1.02 : 1
                  }}
                  className={`flex items-center space-x-4 p-4 rounded-xl transition-colors ${
                    index < currentStep 
                      ? 'bg-green-50 border border-green-200'
                      : index === currentStep
                        ? 'bg-saffron-50 border-2 border-saffron-500'
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    index < currentStep
                      ? 'bg-green-500'
                      : index === currentStep
                        ? 'bg-saffron-500'
                        : 'bg-gray-300'
                  }`}>
                    {index === currentStep ? (
                      <Loader2 size={24} className="text-white animate-spin" />
                    ) : (
                      <step.icon size={24} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  {index < currentStep && (
                    <div className="ml-auto text-green-500">✓</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      ) : showingComparison && demoResult ? (
        /* Results Comparison - THE WOW MOMENT */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Success Banner */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-r from-saffron-500 via-peacock-500 to-lotus-500 text-white p-6 rounded-2xl text-center shadow-2xl"
          >
            <h2 className="font-display text-3xl font-bold mb-2">
              🎉 Adaptation Demonstrated!
            </h2>
            <p className="text-xl text-white/90">
              The teaching style changed from{' '}
              <span className="font-bold underline">{demoResult.flow.step2_first_explanation.style}</span>
              {' '}to{' '}
              <span className="font-bold underline">{demoResult.flow.step5_adapted_explanation.style}</span>
            </p>
          </motion.div>

          {/* Profile Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Before Profile */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <h3 className="font-semibold text-gray-700">Initial Profile</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Learning Style</span>
                  <span className="font-medium capitalize">{demoResult.flow.step1_initial_profile.learning_style}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Pace</span>
                  <span className="font-medium capitalize">{demoResult.flow.step1_initial_profile.pace}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium capitalize">{demoResult.flow.step1_initial_profile.confidence}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Depth</span>
                  <span className="font-medium capitalize">{demoResult.flow.step1_initial_profile.depth_preference?.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            {/* After Profile */}
            <div className="card border-2 border-saffron-500">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-saffron-500"></div>
                <h3 className="font-semibold text-saffron-700">Adapted Profile</h3>
                <Zap size={16} className="text-saffron-500" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Learning Style</span>
                  <span className="font-medium capitalize text-saffron-600">{demoResult.flow.step4_updated_profile.learning_style}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Pace</span>
                  <span className="font-medium capitalize text-saffron-600">{demoResult.flow.step4_updated_profile.pace}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium capitalize text-saffron-600">{demoResult.flow.step4_updated_profile.confidence}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Depth</span>
                  <span className="font-medium capitalize text-saffron-600">{demoResult.flow.step4_updated_profile.depth_preference?.replace('-', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* First Explanation */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-gray-900">First Explanation</h3>
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {demoResult.flow.step2_first_explanation.style}
                </span>
              </div>
              <div className="prose prose-sm text-gray-600 max-h-80 overflow-y-auto">
                <ReactMarkdown>{demoResult.flow.step2_first_explanation.content}</ReactMarkdown>
              </div>
            </div>

            {/* Adapted Explanation */}
            <div className="card border-2 border-saffron-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-saffron-500 text-white text-xs px-3 py-1 rounded-bl-lg">
                ADAPTED!
              </div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-gray-900">Adapted Explanation</h3>
                <span className="text-sm bg-saffron-100 text-saffron-700 px-3 py-1 rounded-full">
                  {demoResult.flow.step5_adapted_explanation.style}
                </span>
              </div>
              <div className="prose prose-sm text-gray-600 max-h-80 overflow-y-auto">
                <ReactMarkdown>{demoResult.flow.step5_adapted_explanation.content}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Key Message */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 rounded-2xl text-center">
            <p className="text-2xl font-display mb-4">
              "The AI <span className="text-saffron-400">observed</span> the learner struggling and{' '}
              <span className="text-peacock-400">automatically changed</span> how it teaches."
            </p>
            <p className="text-gray-400">
              This is cognitive-adaptive learning powered by multi-agent orchestration.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={resetDemo}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Try Another Topic</span>
            </button>
            <button
              onClick={onBack}
              className="btn-primary flex items-center space-x-2"
            >
              <span>Try Full Experience</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      ) : null}

      {/* Agent Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16"
      >
        <h3 className="text-center text-gray-500 mb-6">Powered by 5 Coordinated AI Agents</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { emoji: '🎛️', name: 'Sutradhar', role: 'Orchestrator' },
            { emoji: '🧠', name: 'PragnaBodh', role: 'Cognitive Engine' },
            { emoji: '🧑‍🏫', name: 'GurukulGuide', role: 'Adaptive Tutor' },
            { emoji: '🛠️', name: 'VidyaForge', role: 'Content Generator' },
            { emoji: '♿', name: 'SarvShiksha', role: 'Accessibility' },
          ].map((agent) => (
            <div
              key={agent.name}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-md border"
            >
              <span>{agent.emoji}</span>
              <span className="font-medium">{agent.name}</span>
              <span className="text-xs text-gray-400">({agent.role})</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
