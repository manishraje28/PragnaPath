import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, BookOpen, Users, ArrowRight, Zap } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';
import TopicSelector from './components/TopicSelector';
import DiagnosticFlow from './components/DiagnosticFlow';
import LearningView from './components/LearningView';
import ProfileCard from './components/ProfileCard';
import AgentIndicator from './components/AgentIndicator';
import DemoMode from './components/DemoMode';
import { startSession, getTopics } from './api';

function App() {
  // App state
  const [currentPhase, setCurrentPhase] = useState('welcome'); // welcome, topic, diagnostic, learning, demo
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [adaptationCount, setAdaptationCount] = useState(0);
  const [isDemoMode, setIsDemoMode] = useState(false);

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
  const handleStartSession = async (topic = null) => {
    try {
      setActiveAgent('sutradhar');
      const data = await startSession(topic);
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

  // Handle topic selection
  const handleTopicSelect = (topic) => {
    setCurrentTopic(topic);
    setCurrentPhase('diagnostic');
  };

  // Handle diagnostic completion
  const handleDiagnosticComplete = (newProfile, insights) => {
    setProfile(newProfile);
    setCurrentPhase('learning');
  };

  // Handle profile update (adaptation)
  const handleProfileUpdate = (newProfile) => {
    setProfile(newProfile);
    setAdaptationCount(prev => prev + 1);
  };

  // Render current phase
  const renderPhase = () => {
    switch (currentPhase) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onStart={() => handleStartSession()} 
            onDemo={() => {
              setIsDemoMode(true);
              setCurrentPhase('demo');
            }}
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
      
      case 'diagnostic':
        return (
          <DiagnosticFlow
            sessionId={sessionId}
            topic={currentTopic}
            onComplete={handleDiagnosticComplete}
            onAgentChange={setActiveAgent}
          />
        );
      
      case 'learning':
        return (
          <LearningView
            sessionId={sessionId}
            topic={currentTopic}
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
            onAgentChange={setActiveAgent}
            adaptationCount={adaptationCount}
          />
        );
      
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
                <div className="text-sm text-gray-500">
                  Session: <span className="font-mono text-gray-700">{sessionId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

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
                <Brain size={14} />
                <span>Powered by Google Gemini + ADK</span>
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
