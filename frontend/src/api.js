import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// TEXT CLEANUP UTILITIES
// ============================================

/**
 * Strip markdown formatting from text for clean display
 * Removes **bold**, *italic*, __underline__, etc.
 */
export const stripMarkdown = (text) => {
  if (!text) return text;
  
  let cleaned = text;
  
  // Remove bold (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  
  // Remove italic (*text* or _text_) - careful not to remove underscores in words
  cleaned = cleaned.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1');
  
  // Remove code backticks (but keep content)
  cleaned = cleaned.replace(/`(.+?)`/g, '$1');
  
  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  
  // Clean up double spaces
  cleaned = cleaned.replace(/  +/g, ' ');
  
  return cleaned.trim();
};

/**
 * Clean response data by stripping markdown from text fields
 */
export const cleanResponseData = (data) => {
  if (!data) return data;
  if (typeof data === 'string') return stripMarkdown(data);
  if (Array.isArray(data)) return data.map(cleanResponseData);
  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && ['content', 'explanation', 'front', 'back', 'dyslexia_friendly', 'screen_reader_friendly', 'simplified_version', 'simplified', 'one_line_summary'].includes(key)) {
        cleaned[key] = stripMarkdown(value);
      } else if (typeof value === 'object') {
        cleaned[key] = cleanResponseData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return data;
};

// ============================================
// SESSION PERSISTENCE HELPERS
// ============================================
const SESSION_STORAGE_KEY = 'pragnapath_session_id';
const PROFILE_STORAGE_KEY = 'pragnapath_profile';
const USER_ID_STORAGE_KEY = 'pragnapath_user_id';
const AUTH_TOKEN_KEY = 'pragnapath_auth_token';
const USER_DATA_KEY = 'pragnapath_user_data';

export const getStoredSessionId = () => {
  return localStorage.getItem(SESSION_STORAGE_KEY);
};

export const storeSessionId = (sessionId) => {
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
};

export const getStoredUserId = () => {
  return localStorage.getItem(USER_ID_STORAGE_KEY);
};

export const storeUserId = (userId) => {
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
};

// Auth token helpers
export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const storeAuthToken = (token) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const getStoredUserData = () => {
  const stored = localStorage.getItem(USER_DATA_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const storeUserData = (userData) => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  if (userData.user_id) {
    storeUserId(userData.user_id);
  }
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  // Note: We intentionally keep user_id and auth for cross-session persistence
};

export const clearAllUserData = () => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  localStorage.removeItem(USER_ID_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
};

export const isLoggedIn = () => {
  const token = getAuthToken();
  const userData = getStoredUserData();
  return !!(token && userData && !userData.is_guest);
};

export const isGuest = () => {
  const userData = getStoredUserData();
  return userData?.is_guest === true;
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
  // Get stored user_id for returning user recognition
  const storedUserId = getStoredUserId();
  
  // Check for existing session (same browser session)
  const existingSessionId = getStoredSessionId();
  
  if (existingSessionId && !forceNew) {
    try {
      // Try to restore existing session
      const sessionData = await getSession(existingSessionId);
      if (sessionData) {
        return {
          session_id: existingSessionId,
          user_id: storedUserId,
          profile: sessionData.profile || getStoredProfile(),
          restored: true
        };
      }
    } catch (error) {
      console.log('Previous session not found, creating new one');
      clearStoredSession();
    }
  }
  
  // Create new session (send user_id if available for profile restoration)
  const response = await api.post('/api/session/start', { 
    topic,
    user_id: storedUserId  // Send stored user_id for returning users
  });
  
  // Store session ID and user_id for persistence
  storeSessionId(response.data.session_id);
  
  // Store user_id from server (may be new or confirmed existing)
  if (response.data.user_id) {
    storeUserId(response.data.user_id);
  }
  
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

// User persistence APIs
export const getUserData = async (userId = null) => {
  const id = userId || getStoredUserId();
  if (!id) return null;
  
  try {
    const response = await api.get(`/api/user/${id}`);
    return response.data;
  } catch (error) {
    console.log('User data not found');
    return null;
  }
};

export const getUserTopicProgress = async (topic, userId = null) => {
  const id = userId || getStoredUserId();
  if (!id) return null;
  
  try {
    const response = await api.get(`/api/user/${id}/progress/${encodeURIComponent(topic)}`);
    return response.data;
  } catch (error) {
    return null;
  }
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
  return cleanResponseData(response.data);
};

export const getReExplanation = async (sessionId, topic, trigger = 'user_request') => {
  const response = await api.post('/api/re-explain', {
    session_id: sessionId,
    topic,
    trigger,
  });
  return cleanResponseData(response.data);
};

export const compareExplanations = async (sessionId, topic) => {
  const response = await api.post('/api/compare-explanations', {
    session_id: sessionId,
    topic,
  });
  return cleanResponseData(response.data);
};

// Content Generation APIs
export const generateContent = async (sessionId, topic, contentType = 'all') => {
  const response = await api.post('/api/generate-content', {
    session_id: sessionId,
    topic,
    content_type: contentType,
  });
  return cleanResponseData(response.data);
};

export const generateQuiz = async (sessionId, topic, previousResults = []) => {
  const response = await api.post('/api/generate-quiz', {
    session_id: sessionId,
    topic,
    previous_results: previousResults,
  });
  return cleanResponseData(response.data);
};

// Accessibility APIs
export const transformAccessibility = async (content, mode = 'all') => {
  const response = await api.post('/api/accessibility/transform', { content, mode });
  return cleanResponseData(response.data);
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

// ============================================
// AUTHENTICATION APIs
// ============================================

/**
 * Create a guest account (frictionless start)
 */
export const createGuestAccount = async () => {
  const response = await api.post('/api/auth/guest');
  const data = response.data;
  
  // Store auth data
  storeAuthToken(data.access_token);
  storeUserData(data.user);
  storeUserId(data.user.user_id);
  
  return data;
};

/**
 * Register new user with email and password
 */
export const registerUser = async (email, password, name = null) => {
  const response = await api.post('/api/auth/register', {
    email,
    password,
    name
  });
  const data = response.data;
  
  // Store auth data
  storeAuthToken(data.access_token);
  storeUserData(data.user);
  storeUserId(data.user.user_id);
  
  return data;
};

/**
 * Login with email and password
 */
export const loginUser = async (email, password) => {
  const response = await api.post('/api/auth/login', {
    email,
    password
  });
  const data = response.data;
  
  // Store auth data
  storeAuthToken(data.access_token);
  storeUserData(data.user);
  storeUserId(data.user.user_id);
  
  return data;
};

/**
 * Upgrade guest account to registered account
 * Preserves all learning progress
 */
export const upgradeGuestAccount = async (email, password, name = null) => {
  const userData = getStoredUserData();
  if (!userData || !userData.is_guest) {
    throw new Error('No guest account to upgrade');
  }
  
  const response = await api.post('/api/auth/upgrade', {
    guest_user_id: userData.user_id,
    email,
    password,
    name
  });
  const data = response.data;
  
  // Update stored auth data
  storeAuthToken(data.access_token);
  storeUserData(data.user);
  
  return data;
};

/**
 * Get current user from token
 */
export const getCurrentUser = async () => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  
  try {
    const response = await api.get('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    // Token invalid/expired
    clearAllUserData();
    return null;
  }
};

/**
 * Logout - clear all stored data
 */
export const logout = () => {
  clearAllUserData();
};

export default api;
