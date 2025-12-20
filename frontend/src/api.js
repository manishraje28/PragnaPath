import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session APIs
export const startSession = async (topic = null) => {
  const response = await api.post('/api/session/start', { topic });
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
