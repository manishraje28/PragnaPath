import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, BookOpen, Users, ArrowRight, Zap } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';
import TopicSelector from './components/TopicSelector';
import DiagnosticFlow from './components/DiagnosticFlow';
import LearningView from './components/LearningView';
import ProfileCard from './components/ProfileCard';
import AgentIndicator from './components/AgentIndicator';
import AgentTracePanel from './components/AgentTracePanel';
import DemoMode from './components/DemoMode';
import LearningIntentSelector from './components/LearningIntentSelector';
import { startSession, getTopics, getStoredSessionId, getStoredProfile, clearStoredSession } from './api';

function App() {
  // App state
  const [currentPhase, setCurrentPhase] = useState('welcome'); // welcome, topic, intent, diagnostic, learning, demo
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [previousProfile, setPreviousProfile] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [learningIntent, setLearningIntent] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [adaptationCount, setAdaptationCount] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Agent trace state for observability panel
  const [agentTraces, setAgentTraces] = useState([]);
  const [showTracePanel, setShowTracePanel] = useState(true);

  // Add trace helper
  const addTrace = useCallback((agent, action, output = null, status = 'completed', isLoop = false) => {
    const trace = {
      id: Date.now(),
      agent,
      action,
      output,
      status,
      isLoop,
      timestamp: new Date().toISOString()
    };
    setAgentTraces(prev => [...prev, trace]);
    return trace.id;
  }, []);

  // Update trace status
  const updateTrace = useCallback((traceId, updates) => {
    setAgentTraces(prev => 
      prev.map(t => t.id === traceId ? { ...t, ...updates } : t)
    );
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedSessionId = getStoredSessionId();
      const storedProfile = getStoredProfile();
      
      if (storedSessionId && storedProfile) {
        console.log('Restoring session:', storedSessionId);
        setSessionId(storedSessionId);
        setProfile(storedProfile);
        addTrace('sutradhar', 'Session restored from storage', `Session ID: ${storedSessionId}`);
        // Go directly to topic selection since we have a session
        setCurrentPhase('topic');
      }
    };
    
    restoreSession();
  }, [addTrace]);

  // Fetch topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getTopics();
        setTopics(data.topics);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
        // Fallback topics
        setTopics([
          { id: 'os_deadlock', name: 'Operating Systems: Deadlock', icon: '🔒' },
          { id: 'ds_trees', name: 'Data Structures: Trees', icon: '🌳' },
          { id: 'algo_dp', name: 'Dynamic Programming', icon: '🧩' },
        ]);
      }
    };
    fetchTopics();
  }, []);

  // Start a new session
  const handleStartSession = async (topic = null, forceNew = false) => {
    try {
      setActiveAgent('sutradhar');
      const traceId = addTrace('sutradhar', 'Initializing session...', null, 'in-progress');
      
      const data = await startSession(topic, forceNew);
      
      // If session was restored, show different message
      if (data.restored) {
        updateTrace(traceId, { 
          status: 'completed', 
          output: 'Session restored successfully' 
        });
      } else {
        updateTrace(traceId, { 
          status: 'completed', 
          output: `New session: ${data.session_id}` 
        });
      }
      
      setSessionId(data.session_id);
      setProfile(data.profile);
      setActiveAgent(null);
      
      if (topic) {
        setCurrentTopic(topic);
        setCurrentPhase('diagnostic');
      } else {
        setCurrentPhase('topic');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setActiveAgent(null);
    }
  };

  // Handle new session (clear previous)
  const handleNewSession = () => {
    clearStoredSession();
    setSessionId(null);
    setProfile(null);
    setLearningIntent(null);
    setAgentTraces([]);
    setAdaptationCount(0);
    setCurrentPhase('welcome');
  };

  // Handle topic selection
  const handleTopicSelect = (topic) => {
    addTrace('sutradhar', 'Topic selected', topic);
    setCurrentTopic(topic);
    setCurrentPhase('intent');  // Go to intent selection first
  };

  // Handle learning intent selection
  const handleIntentComplete = (intent) => {
    setLearningIntent(intent);
    addTrace('pragnabodh', 'Learning goal set', intent);
    setCurrentPhase('diagnostic');
  };

  // Handle diagnostic completion
  const handleDiagnosticComplete = (newProfile, insights) => {
    setPreviousProfile(profile);
    setProfile(newProfile);
    addTrace('pragnabodh', 'Diagnostic complete', 'Profile built successfully');
    setCurrentPhase('learning');
  };

  // Handle profile update (adaptation)
  const handleProfileUpdate = (newProfile, trigger = 'adaptation') => {
    setPreviousProfile(profile);
    setProfile(newProfile);
    setAdaptationCount(prev => prev + 1);
    addTrace('pragnabodh', 'Profile adapted', `Trigger: ${trigger}`, 'completed', true);
  };

  // Handle agent changes with tracing
  const handleAgentChange = (agent) => {
    if (agent && agent !== activeAgent) {
      addTrace(agent, 'Agent activated', null, 'in-progress');
    } else if (!agent && activeAgent) {
      // Update the last trace for this agent
      setAgentTraces(prev => {
        const lastTrace = [...prev].reverse().find(t => t.agent === activeAgent && t.status === 'in-progress');
        if (lastTrace) {
          return prev.map(t => t.id === lastTrace.id ? { ...t, status: 'completed' } : t);
        }
        return prev;
      });
    }
    setActiveAgent(agent);
  };

  // Render current phase
  const renderPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onStart={() => handleStartSession()} 
            /* Demo mode commented out for now
            onDemo={() => {
              setIsDemoMode(true);
              setCurrentPhase('demo');
            }}
            */
          />
        );
      
      case 'topic':
        return (
          <TopicSelector 
            topics={topics}
            onSelect={handleTopicSelect}
            sessionId={sessionId}
          />
        );
      
      case 'intent':
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="max-w-lg w-full">
              <LearningIntentSelector
                sessionId={sessionId}
                topic={currentTopic}
                onIntentSelected={handleIntentComplete}
                onSkip={() => handleIntentComplete('conceptual')}
              />
            </div>
          </div>
        );
      
      case 'diagnostic':
        return (
          <DiagnosticFlow
            sessionId={sessionId}
            topic={currentTopic}
            onComplete={handleDiagnosticComplete}
            onAgentChange={handleAgentChange}
            addTrace={addTrace}
          />
        );
      
      case 'learning':
        return (
          <LearningView
            sessionId={sessionId}
            topic={currentTopic}
            profile={profile}
            previousProfile={previousProfile}
            onProfileUpdate={handleProfileUpdate}
            onAgentChange={handleAgentChange}
            adaptationCount={adaptationCount}
            addTrace={addTrace}
          />
        );
      
      /* Demo mode case commented out for now
      case 'demo':
        return (
          <DemoMode
            topics={topics}
            onBack={() => {
              setIsDemoMode(false);
              setCurrentPhase('welcome');
            }}
          />
        );
      */
      
      default:
        return <WelcomeScreen onStart={() => handleStartSession()} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                if (currentPhase !== 'welcome') {
                  if (confirm('Return to home? Your session will be preserved.')) {
                    setCurrentPhase('welcome');
                  }
                }
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-xl flex items-center justify-center shadow-lg shadow-saffron-500/25">
                <span className="text-white font-bold text-lg">प्र</span>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-gray-900">PragnaPath</h1>
                <p className="text-xs text-gray-500 -mt-1">The AI that learns how you learn</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Active Agent Indicator */}
              {activeAgent && (
                <AgentIndicator agent={activeAgent} />
              )}

              {/* Adaptation Counter */}
              {adaptationCount > 0 && currentPhase === 'learning' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-peacock-500 to-peacock-600 text-white px-3 py-1.5 rounded-full text-sm"
                >
                  <Zap size={14} />
                  <span>{adaptationCount} adaptation{adaptationCount > 1 ? 's' : ''}</span>
                </motion.div>
              )}

              {/* Session ID */}
              {sessionId && (
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-500">
                    Session: <span className="font-mono text-gray-700">{sessionId}</span>
                  </div>
                  <button
                    onClick={handleNewSession}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    New
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Agent Trace Panel - COMMENTED OUT FOR NOW
      <AgentTracePanel 
        traces={agentTraces} 
        isExpanded={showTracePanel}
        onToggle={() => setShowTracePanel(!showTracePanel)}
      />
      */}

      {/* Profile Sidebar (when learning) */}
      <AnimatePresence>
        {currentPhase === 'learning' && profile && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed left-4 top-24 z-40"
          >
            <ProfileCard profile={profile} compact />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                {/* <Brain size={14} /> */}
                {/* <span>Powered by Google Gemini + ADK</span> */}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>PragnaPath</span>
              <span className="text-saffron-500">🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
