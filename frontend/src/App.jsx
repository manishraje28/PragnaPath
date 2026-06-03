import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, BookOpen, Users, ArrowRight, Zap, LogOut, User, ChevronLeft } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import TopicSelector from './components/TopicSelector';
import DiagnosticFlow from './components/DiagnosticFlow';
import LearningView from './components/LearningView';
import ProfileCard from './components/ProfileCard';
import AgentIndicator from './components/AgentIndicator';
import LearningIntentSelector from './components/LearningIntentSelector';
import VoiceButton from './components/VoiceButton';
import {
  startSession, getTopics, getStoredSessionId, getStoredProfile, clearStoredSession,
  getAuthToken, storeAuthToken, storeUserData, getStoredUserData, clearAllUserData,
  getCurrentUser, createGuestAccount, logout as logoutApi,
  getSession, getProfile, getUserData,
  storeProfile
} from './api';

function App() {
  // ==========================================
  // AUTH STATE
  // ==========================================
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ==========================================
  // APP STATE
  // ==========================================
  // Phases: 'landing' | 'login' | 'signup' | 'dashboard' | 'topic' | 'intent' | 'diagnostic' | 'learning'
  const [currentPhase, setCurrentPhase] = useState('landing');
  const [sessionId, setSessionId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [previousProfile, setPreviousProfile] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [learningIntent, setLearningIntent] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [topics, setTopics] = useState([]);
  const [adaptationCount, setAdaptationCount] = useState(0);

  // Agent trace state
  const [agentTraces, setAgentTraces] = useState([]);

  // Trace helpers
  const addTrace = useCallback((agent, action, output = null, status = 'completed', isLoop = false) => {
    const trace = { id: Date.now(), agent, action, output, status, isLoop, timestamp: new Date().toISOString() };
    setAgentTraces(prev => [...prev, trace]);
    return trace.id;
  }, []);

  const updateTrace = useCallback((traceId, updates) => {
    setAgentTraces(prev => prev.map(t => t.id === traceId ? { ...t, ...updates } : t));
  }, []);

  // ==========================================
  // AUTH CHECK ON MOUNT
  // ==========================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        const storedUser = getStoredUserData();

        if (token && storedUser) {
          try {
            const verifiedUser = await getCurrentUser();
            if (verifiedUser) {
              setUser(verifiedUser);
              // Restore profile from localStorage if exists
              const storedProfile = getStoredProfile();
              if (storedProfile) setProfile(storedProfile);
              setCurrentPhase('dashboard');
              setAuthLoading(false);
              return;
            }
          } catch (e) {
            // For guest users or server unavailable, use stored data
            if (storedUser.is_guest) {
              setUser(storedUser);
              const storedProfile = getStoredProfile();
              if (storedProfile) setProfile(storedProfile);
              setCurrentPhase('dashboard');
              setAuthLoading(false);
              return;
            }
            clearAllUserData();
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      }
      setAuthLoading(false);
      setCurrentPhase('landing');
    };
    checkAuth();
  }, []);

  // ==========================================
  // FETCH TOPICS WHEN NEEDED
  // ==========================================
  useEffect(() => {
    const needsTopics = ['dashboard', 'topic', 'intent', 'diagnostic', 'learning'].includes(currentPhase);
    if (needsTopics && topics.length === 0) {
      (async () => {
        try {
          const data = await getTopics();
          setTopics(data.topics || []);
        } catch (error) {
          console.error('Failed to fetch topics:', error);
          setTopics([
            { id: 'os_deadlock', name: 'Operating Systems: Deadlock', icon: '🔒' },
            { id: 'ds_trees', name: 'Data Structures: Trees', icon: '🌳' },
            { id: 'algo_dp', name: 'Dynamic Programming', icon: '🧩' },
          ]);
        }
      })();
    }
  }, [currentPhase, topics.length]);

  // ==========================================
  // SESSION INITIALIZATION (auto-create when needed)
  // ==========================================
  useEffect(() => {
    if (['topic', 'intent', 'diagnostic', 'learning'].includes(currentPhase) && !sessionId && user) {
      initSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPhase, sessionId, user]);

  const initSession = async () => {
    try {
      setActiveAgent('sutradhar');
      const traceId = addTrace('sutradhar', 'Initializing session...', null, 'in-progress');
      const data = await startSession(null, false);
      updateTrace(traceId, { status: 'completed', output: data.restored ? 'Session restored' : `New session: ${data.session_id}` });
      setSessionId(data.session_id);
      if (data.profile) {
        setProfile(data.profile);
        storeProfile(data.profile);
      }
      setActiveAgent(null);
    } catch (error) {
      console.error('Failed to init session:', error);
      setActiveAgent(null);
    }
  };

  // ==========================================
  // AUTH HANDLERS
  // ==========================================
  const handleLoginSuccess = (data) => {
    setUser(data.user);
    setSessionId(null);
    setProfile(null);
    setCurrentPhase('dashboard');
  };

  const handleSignupSuccess = (data) => {
    setUser(data.user);
    setSessionId(null);
    setProfile(null);
    setCurrentPhase('dashboard');
  };

  const handleGuestStart = async () => {
    try {
      const data = await createGuestAccount();
      setUser(data.user);
      setSessionId(null);
      setProfile(null);
      setCurrentPhase('dashboard');
    } catch (error) {
      console.error('Guest account creation failed:', error);
      setUser({ user_id: 'guest', name: 'Guest', is_guest: true });
      setCurrentPhase('dashboard');
    }
  };

  const handleLogout = () => {
    logoutApi();
    clearStoredSession();
    setUser(null);
    setSessionId(null);
    setProfile(null);
    setPreviousProfile(null);
    setCurrentTopic(null);
    setLearningIntent(null);
    setActiveAgent(null);
    setAgentTraces([]);
    setAdaptationCount(0);
    setCurrentPhase('landing');
  };

  // ==========================================
  // DASHBOARD HANDLERS
  // ==========================================
  const handleNewTopic = () => {
    setCurrentPhase('topic');
  };

  const handleContinueTopic = (topic) => {
    // User clicking "Continue" on an already-explored topic
    // Skip diagnostic → go straight to learning with existing profile
    setCurrentTopic(topic);
    addTrace('sutradhar', 'Continuing topic', topic);
    setCurrentPhase('learning');
  };

  // ==========================================
  // LEARNING FLOW HANDLERS
  // ==========================================
  const handleStartSession = async (topic = null, forceNew = false) => {
    try {
      setActiveAgent('sutradhar');
      const traceId = addTrace('sutradhar', 'Initializing session...', null, 'in-progress');
      const data = await startSession(topic, forceNew);
      updateTrace(traceId, { status: 'completed', output: data.restored ? 'Session restored' : `New session: ${data.session_id}` });
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

  const handleBackToDashboard = () => {
    setCurrentPhase('dashboard');
  };

  const handleTopicSelect = (topic) => {
    addTrace('sutradhar', 'Topic selected', topic);
    setCurrentTopic(topic);

    // Check if this topic was already explored (profile has it)
    if (profile?.topics_explored?.includes(topic)) {
      // Offer to skip diagnostic
      const skipDiag = window.confirm(
        `You've already explored "${topic}" before. Your profile is adapted for it.\n\nClick OK to continue learning directly, or Cancel to retake the diagnostic.`
      );
      if (skipDiag) {
        setCurrentPhase('learning');
        return;
      }
    }
    setCurrentPhase('intent');
  };

  const handleIntentComplete = (intent) => {
    setLearningIntent(intent);
    addTrace('pragnabodh', 'Learning goal set', intent);
    setCurrentPhase('diagnostic');
  };

  const handleDiagnosticComplete = (newProfile, insights) => {
    setPreviousProfile(profile);
    setProfile(newProfile);
    storeProfile(newProfile);
    addTrace('pragnabodh', 'Diagnostic complete', 'Profile built successfully');
    setCurrentPhase('learning');
  };

  const handleProfileUpdate = (newProfile, trigger = 'adaptation') => {
    setPreviousProfile(profile);
    setProfile(newProfile);
    storeProfile(newProfile);
    setAdaptationCount(prev => prev + 1);
    addTrace('pragnabodh', 'Profile adapted', `Trigger: ${trigger}`, 'completed', true);
  };

  const handleAgentChange = (agent) => {
    if (agent && agent !== activeAgent) {
      addTrace(agent, 'Agent activated', null, 'in-progress');
    } else if (!agent && activeAgent) {
      setAgentTraces(prev => {
        const lastTrace = [...prev].reverse().find(t => t.agent === activeAgent && t.status === 'in-progress');
        if (lastTrace) return prev.map(t => t.id === lastTrace.id ? { ...t, status: 'completed' } : t);
        return prev;
      });
    }
    setActiveAgent(agent);
  };

  // ==========================================
  // RENDER
  // ==========================================
  const isPublicPhase = ['landing', 'login', 'signup'].includes(currentPhase);
  const isAppPhase = !isPublicPhase;

  const renderPhase = () => {
    switch (currentPhase) {
      case 'landing':
        return (
          <LandingPage
            onLogin={() => setCurrentPhase('login')}
            onSignup={() => setCurrentPhase('signup')}
            onGuest={handleGuestStart}
          />
        );

      case 'login':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-saffron-50/30 flex items-center justify-center relative">
            <button
              onClick={() => setCurrentPhase('landing')}
              className="absolute top-6 left-6 flex items-center space-x-2 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <ChevronLeft size={20} />
              <span className="text-sm">Back</span>
            </button>
            <Login
              onLoginSuccess={handleLoginSuccess}
              onNavigateToSignup={() => setCurrentPhase('signup')}
            />
          </div>
        );

      case 'signup':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-peacock-50/30 flex items-center justify-center relative">
            <button
              onClick={() => setCurrentPhase('landing')}
              className="absolute top-6 left-6 flex items-center space-x-2 text-gray-400 hover:text-gray-700 transition-colors z-10"
            >
              <ChevronLeft size={20} />
              <span className="text-sm">Back</span>
            </button>
            <Signup
              onSignupSuccess={handleSignupSuccess}
              onNavigateToLogin={() => setCurrentPhase('login')}
            />
          </div>
        );

      case 'dashboard':
        return (
          <Dashboard
            user={user}
            profile={profile}
            onNewTopic={handleNewTopic}
            onContinueTopic={handleContinueTopic}
            onLogout={handleLogout}
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

      default:
        return null;
    }
  };

  // ==========================================
  // REFRESH ON TAB VISIBLE
  // When the user returns to the tab, refresh the session/profile so the dashboard shows latest progress
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const stored = getStoredSessionId();
          if (stored) {
            const sessionData = await getSession(stored);
            if (sessionData?.profile) {
              setProfile(sessionData.profile);
              storeProfile(sessionData.profile);
            }
          }
        } catch (err) {
          console.error('Session refresh on visibility failed:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, sessionId]);

  // Ensure dashboard shows latest profile when the user navigates to it
  useEffect(() => {
    const restoreForDashboard = async () => {
      if (currentPhase !== 'dashboard') return;
      if (profile) return; // already loaded

      try {
        const stored = getStoredSessionId();
        if (stored) {
          const sessionData = await getSession(stored);
          if (sessionData?.profile) {
            setProfile(sessionData.profile);
            storeProfile(sessionData.profile);
            return;
          }
        }

        // Fallback: try user-level data
        if (user?.user_id) {
          const userData = await getUserData(user.user_id);
          if (userData?.profile) {
            setProfile(userData.profile);
            storeProfile(userData.profile);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to restore profile for dashboard:', err);
      }
    };

    restoreForDashboard();
  }, [currentPhase, user, sessionId, profile]);

  // LOADING STATE
  // ==========================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-saffron-500/20">
            <span className="text-white font-bold text-2xl">प्र</span>
          </div>
          <div className="w-6 h-6 border-2 border-saffron-200 border-t-saffron-500 rounded-full animate-spin mx-auto mt-4" />
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ═══════ APP HEADER (only for authenticated views) ═══════ */}
      {isAppPhase && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo — click goes to dashboard */}
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={handleBackToDashboard}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-xl flex items-center justify-center shadow-lg shadow-saffron-500/20">
                  <span className="text-white font-bold text-lg">प्र</span>
                </div>
                <div>
                  <h1 className="font-display font-bold text-xl text-gray-900">PragnaPath</h1>
                  <p className="text-xs text-gray-400 -mt-1">The AI that learns how you learn</p>
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Active Agent */}
                {activeAgent && <AgentIndicator agent={activeAgent} />}

                {/* Adaptation Counter */}
                {adaptationCount > 0 && currentPhase === 'learning' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-peacock-500 to-peacock-600 text-white px-3 py-1.5 rounded-full text-sm"
                  >
                    <Zap size={14} />
                    <span>{adaptationCount} adaptation{adaptationCount > 1 ? 's' : ''}</span>
                  </motion.div>
                )}

                {/* Dashboard link (when in learning flow) */}
                {currentPhase !== 'dashboard' && (
                  <button
                    onClick={handleBackToDashboard}
                    className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Dashboard
                  </button>
                )}

                {/* User badge */}
                {user && (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                      <div className="w-6 h-6 bg-gradient-to-br from-saffron-400 to-peacock-500 rounded-full flex items-center justify-center">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {user.name || user.email?.split('@')[0] || 'Guest'}
                      </span>
                      {user.is_guest && (
                        <span className="text-xs bg-saffron-100 text-saffron-600 px-2 py-0.5 rounded-full">Guest</span>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-sm text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Log out"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* ═══════ PROFILE SIDEBAR (when learning) ═══════ */}
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

      {/* ═══════ MAIN CONTENT ═══════ */}
      {isPublicPhase ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      ) : (
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
      )}

      {/* ═══════ VOICE ASSISTANT (learning only) ═══════ */}
      {currentPhase === 'learning' && (
        <VoiceButton
          topic={currentTopic}
          sessionId={sessionId}
          onTranscript={(text) => addTrace('voice', 'User spoke', text)}
        />
      )}
    </div>
  );
}

export default App;
