import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// SESSION PERSISTENCE HELPERS
// ============================================
const SESSION_STORAGE_KEY = 'pragnapath_session_id';
const PROFILE_STORAGE_KEY = 'pragnapath_profile';

export const getStoredSessionId = () => {
  return localStorage.getItem(SESSION_STORAGE_KEY);
};

export const storeSessionId = (sessionId) => {
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
};

export const getStoredProfile = () => {
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const storeProfile = (profile) => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
};

// Session APIs - with persistence
export const startSession = async (topic = null, forceNew = false) => {
  // Check for existing session
  const existingSessionId = getStoredSessionId();
  
  if (existingSessionId && !forceNew) {
    try {
      // Try to restore existing session
      const sessionData = await getSession(existingSessionId);
      if (sessionData) {
        return {
          session_id: existingSessionId,
          profile: sessionData.profile || getStoredProfile(),
          restored: true
        };
      }
    } catch (error) {
      console.log('Previous session not found, creating new one');
      clearStoredSession();
    }
  }
  
  // Create new session
  const response = await api.post('/api/session/start', { topic });
  
  // Store session ID for persistence
  storeSessionId(response.data.session_id);
  if (response.data.profile) {
    storeProfile(response.data.profile);
  }
  
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/api/session/${sessionId}`);
  return response.data;
};

export const getProfile = async (sessionId) => {
  const response = await api.get(`/api/session/${sessionId}/profile`);
  return response.data;
};

// Diagnostic APIs
export const startDiagnostic = async (sessionId, topic) => {
  const response = await api.post('/api/diagnostic/start', { session_id: sessionId, topic });
  return response.data;
};

export const submitAnswer = async (sessionId, questionId, selectedAnswer, timeTaken, confidence = null) => {
  const response = await api.post('/api/diagnostic/answer', {
    session_id: sessionId,
    question_id: questionId,
    selected_answer: selectedAnswer,
    time_taken_seconds: timeTaken,
    confidence_rating: confidence,
  });
  return response.data;
};

export const completeDiagnostic = async (sessionId) => {
  const response = await api.post('/api/diagnostic/complete', { session_id: sessionId });
  return response.data;
};

// Tutoring APIs
export const getExplanation = async (sessionId, topic, subtopic = null) => {
  const response = await api.post('/api/explain', {
    session_id: sessionId,
    topic,
    subtopic,
  });
  return response.data;
};

export const getReExplanation = async (sessionId, topic, trigger = 'user_request') => {
  const response = await api.post('/api/re-explain', {
    session_id: sessionId,
    topic,
    trigger,
  });
  return response.data;
};

export const compareExplanations = async (sessionId, topic) => {
  const response = await api.post('/api/compare-explanations', {
    session_id: sessionId,
    topic,
  });
  return response.data;
};

// Content Generation APIs
export const generateContent = async (sessionId, topic, contentType = 'all') => {
  const response = await api.post('/api/generate-content', {
    session_id: sessionId,
    topic,
    content_type: contentType,
  });
  return response.data;
};

export const generateQuiz = async (sessionId, topic, previousResults = []) => {
  const response = await api.post('/api/generate-quiz', {
    session_id: sessionId,
    topic,
    previous_results: previousResults,
  });
  return response.data;
};

// Accessibility APIs
export const transformAccessibility = async (content, mode = 'all') => {
  const response = await api.post('/api/accessibility/transform', { content, mode });
  return response.data;
};

// Profile APIs
export const updateProfile = async (sessionId, updates) => {
  const response = await api.post('/api/profile/update', {
    session_id: sessionId,
    ...updates,
  });
  
  // Update stored profile
  if (response.data.profile) {
    storeProfile(response.data.profile);
  }
  
  return response.data;
};

// Evaluate learner's explanation (Explain Back feature)
export const evaluateExplanation = async (sessionId, topic, learnerExplanation) => {
  const response = await api.post('/api/evaluate-explanation', {
    session_id: sessionId,
    topic,
    learner_explanation: learnerExplanation
  });
  
  // Update stored profile if changed
  if (response.data.updated_profile) {
    storeProfile(response.data.updated_profile);
  }
  
  return response.data;
};

// Submit MCQ answer with profile update
export const submitMCQAnswer = async (sessionId, mcqResult) => {
  const response = await api.post('/api/mcq/submit', {
    session_id: sessionId,
    ...mcqResult
  });
  
  // Update stored profile if changed
  if (response.data.updated_profile) {
    storeProfile(response.data.updated_profile);
  }
  
  return response.data;
};

// Get visualization data for a topic
export const getVisualization = async (sessionId, topic, conceptKey = null) => {
  const response = await api.post('/api/visualize', {
    session_id: sessionId,
    topic,
    concept_key: conceptKey
  });
  return response.data;
};

// Get sign-language ready scripts
export const getSignLanguageScripts = async (content) => {
  const response = await api.post('/api/accessibility/sign-language', {
    content
  });
  return response.data;
};

// ============================================
// NEW ADVANCED FEATURES
// ============================================

// Set learning intent (why they're learning)
export const setLearningIntent = async (sessionId, intent) => {
  const response = await api.post('/api/learning-intent', {
    session_id: sessionId,
    intent
  });
  
  if (response.data.profile) {
    storeProfile(response.data.profile);
  }
  
  return response.data;
};

// Get "Why am I learning this?" explanation
export const getWhyExplanation = async (sessionId, topic) => {
  const response = await api.post('/api/why-mode', {
    session_id: sessionId,
    topic
  });
  return response.data;
};

// Check for misconceptions in learner's input
export const checkMisconceptions = async (sessionId, topic, learnerInput, inputType) => {
  const response = await api.post('/api/misconception-check', {
    session_id: sessionId,
    topic,
    learner_input: learnerInput,
    input_type: inputType
  });
  return response.data;
};

// Compare concepts
export const compareConcepts = async (sessionId, topic, compareWith = null) => {
  const response = await api.post('/api/compare-concepts', {
    session_id: sessionId,
    topic,
    compare_with: compareWith
  });
  return response.data;
};

// Demo APIs
export const getTopics = async () => {
  const response = await api.get('/api/demo/topics');
  return response.data;
};

export const runDemoFlow = async (topic) => {
  const response = await api.post('/api/demo/full-flow', { topic });
  return response.data;
};

// Orchestration
export const orchestrate = async (sessionId, userInput, action = 'auto') => {
  const response = await api.post('/api/orchestrate', {
    session_id: sessionId,
    user_input: userInput,
    action,
  });
  return response.data;
};

export default api;
