import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Cpu, Database, GitBranch, Network, Code } from 'lucide-react';

const topicIcons = {
  'os_deadlock': Cpu,
  'os_scheduling': Cpu,
  'ds_trees': GitBranch,
  'ds_hashing': Database,
  'algo_dp': Code,
  'algo_sorting': Network,
};

export default function TopicSelector({ topics, onSelect, sessionId }) {
  return (
    <div className="max-w-4xl mx-auto py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-peacock-500/25">
          <BookOpen size={32} className="text-white" />
        </div>
        <h2 className="font-display text-3xl font-bold text-gray-900 mb-3">
          Choose Your Topic
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Select a Computer Science topic to begin. We'll first understand your learning style, 
          then teach you in the way that works best for you.
        </p>
      </motion.div>

      {/* Topic Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic, index) => {
          const Icon = topicIcons[topic.id] || BookOpen;
          
          return (
            <motion.button
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(topic.name)}
              className="card card-hover text-left group relative overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-saffron-500/5 to-peacock-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                {/* Icon and Emoji */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gray-100 group-hover:bg-saffron-100 rounded-xl flex items-center justify-center transition-colors duration-300">
                    <span className="text-2xl">{topic.icon}</span>
                  </div>
                </div>

                {/* Topic Name */}
                <h3 className="font-display font-semibold text-lg text-gray-900 mb-2 group-hover:text-saffron-600 transition-colors">
                  {topic.name}
                </h3>

                {/* Arrow */}
                <div className="flex items-center text-gray-400 group-hover:text-saffron-500 transition-colors">
                  <span className="text-sm">Start learning</span>
                  <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Custom Topic */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <p className="text-gray-500 text-sm">
          More topics coming soon!
        </p>
      </motion.div>
    </div>
  );
}
