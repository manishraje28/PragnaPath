import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';

// Agent info mapping
const AGENT_INFO = {
  sutradhar: { 
    name: 'Sutradhar', 
    role: 'Orchestrator',
    icon: '🎛️',
    color: 'from-purple-500 to-purple-600'
  },
  pragnabodh: { 
    name: 'PragnaBodh', 
    role: 'Cognitive Engine',
    icon: '🧠',
    color: 'from-saffron-500 to-saffron-600'
  },
  gurukulguide: { 
    name: 'GurukulGuide', 
    role: 'Adaptive Tutor',
    icon: '🧑‍🏫',
    color: 'from-peacock-500 to-peacock-600'
  },
  vidyaforge: { 
    name: 'VidyaForge', 
    role: 'Content Engine',
    icon: '🛠️',
    color: 'from-lotus-500 to-lotus-600'
  },
  sarvshiksha: { 
    name: 'SarvShiksha', 
    role: 'Accessibility',
    icon: '♿',
    color: 'from-green-500 to-green-600'
  }
};

export default function AgentTracePanel({ traces, isExpanded, onToggle }) {
  const [localTraces, setLocalTraces] = useState([]);
  
  useEffect(() => {
    setLocalTraces(traces || []);
  }, [traces]);

  const recentTraces = localTraces.slice(-10); // Show last 10 traces
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed right-4 top-24 z-40 w-80"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 rounded-t-xl shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all"
      >
        <div className="flex items-center space-x-2">
          <Activity size={18} className="text-green-400" />
          <span className="font-semibold">Agent Trace</span>
          <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
            ADK Orchestration
          </span>
        </div>
        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* Trace List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-b-xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto p-3 space-y-2">
              {recentTraces.length === 0 ? (
                <div className="text-center text-gray-500 py-4 text-sm">
                  <Activity size={24} className="mx-auto mb-2 text-gray-400" />
                  <p>No agent activity yet</p>
                  <p className="text-xs text-gray-400 mt-1">Traces will appear as agents work</p>
                </div>
              ) : (
                recentTraces.map((trace, index) => {
                  const agent = AGENT_INFO[trace.agent] || { 
                    name: trace.agent, 
                    icon: '🤖',
                    color: 'from-gray-500 to-gray-600'
                  };
                  
                  return (
                    <motion.div
                      key={trace.id || index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {trace.status === 'completed' ? (
                          <CheckCircle size={16} className="text-green-500" />
                        ) : trace.status === 'in-progress' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Clock size={16} className="text-saffron-500" />
                          </motion.div>
                        ) : (
                          <Clock size={16} className="text-gray-400" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{agent.icon}</span>
                          <span className="font-medium text-gray-900 text-sm">{agent.name}</span>
                          {trace.isLoop && (
                            <span className="text-xs bg-saffron-100 text-saffron-700 px-1.5 py-0.5 rounded">
                              loop
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {trace.action}
                        </p>
                        {trace.output && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            → {trace.output}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="flex-shrink-0 text-xs text-gray-400">
                        {trace.timestamp ? new Date(trace.timestamp).toLocaleTimeString('en-IN', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        }) : ''}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {recentTraces.length > 0 && (
              <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{recentTraces.length} trace{recentTraces.length > 1 ? 's' : ''}</span>
                  <div className="flex items-center space-x-1">
                    <Zap size={12} className="text-saffron-500" />
                    <span>Powered by ADK</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
