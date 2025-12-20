import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const agentInfo = {
  sutradhar: {
    name: 'Sutradhar',
    emoji: '🎛️',
    role: 'Orchestrating',
    color: 'from-purple-500 to-purple-600',
  },
  pragnabodh: {
    name: 'PragnaBodh',
    emoji: '🧠',
    role: 'Analyzing',
    color: 'from-saffron-500 to-saffron-600',
  },
  gurukulguide: {
    name: 'GurukulGuide',
    emoji: '🧑‍🏫',
    role: 'Teaching',
    color: 'from-peacock-500 to-peacock-600',
  },
  vidyaforge: {
    name: 'VidyaForge',
    emoji: '🛠️',
    role: 'Creating',
    color: 'from-green-500 to-green-600',
  },
  sarvshiksha: {
    name: 'SarvShiksha',
    emoji: '♿',
    role: 'Adapting',
    color: 'from-lotus-500 to-lotus-600',
  },
};

export default function AgentIndicator({ agent }) {
  const info = agentInfo[agent] || {
    name: 'Agent',
    emoji: '🤖',
    role: 'Processing',
    color: 'from-gray-500 to-gray-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      className={`flex items-center space-x-2 bg-gradient-to-r ${info.color} text-white px-4 py-2 rounded-full shadow-lg`}
    >
      <span className="text-lg">{info.emoji}</span>
      <span className="font-medium">{info.name}</span>
      <span className="text-white/80 text-sm">{info.role}...</span>
      <Loader2 size={14} className="animate-spin" />
    </motion.div>
  );
}
