import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, Clock, Brain, Loader2 } from 'lucide-react';
import { startDiagnostic, submitAnswer, completeDiagnostic } from '../api';

export default function DiagnosticFlow({ sessionId, topic, onComplete, onAgentChange, addTrace }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [insights, setInsights] = useState('');
  const [finalProfile, setFinalProfile] = useState(null);
  
  const startTimeRef = useRef(null);

  // Load diagnostic questions
  useEffect(() => {
    const loadDiagnostic = async () => {
      try {
        onAgentChange('pragnabodh');
        if (addTrace) addTrace('pragnabodh', 'Starting diagnostic assessment', topic, 'in-progress');
        const data = await startDiagnostic(sessionId, topic);
        setQuestions(data.questions);
        setLoading(false);
        startTimeRef.current = Date.now();
        if (addTrace) addTrace('pragnabodh', 'Diagnostic ready', `${data.questions.length} questions loaded`);
        onAgentChange(null);
      } catch (error) {
        console.error('Failed to load diagnostic:', error);
        setLoading(false);
        onAgentChange(null);
      }
    };
    loadDiagnostic();
  }, [sessionId, topic]);

  // Handle answer selection
  const handleSelectAnswer = async (answerIndex) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answerIndex);
    const timeTaken = (Date.now() - startTimeRef.current) / 1000;
    
    try {
      onAgentChange('pragnabodh');
      if (addTrace) addTrace('pragnabodh', 'Processing answer', `Q${currentIndex + 1}`, 'in-progress', true);
      const result = await submitAnswer(
        sessionId,
        questions[currentIndex].id,
        answerIndex,
        timeTaken,
        null
      );
      
      setFeedback({
        isCorrect: result.is_correct,
        message: result.feedback,
        profile: result.updated_profile,
      });
      setShowFeedback(true);
      if (addTrace) addTrace('pragnabodh', 'Answer processed', result.is_correct ? 'Correct' : 'Incorrect');
      onAgentChange(null);
      
      // Store answer
      setAnswers([...answers, {
        questionId: questions[currentIndex].id,
        answer: answerIndex,
        correct: result.is_correct,
        timeTaken,
      }]);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      onAgentChange(null);
    }
  };

  // Move to next question
  const handleNext = async () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setFeedback(null);
    
    if (currentIndex + 1 >= questions.length) {
      // Complete diagnostic
      try {
        onAgentChange('pragnabodh');
        if (addTrace) addTrace('pragnabodh', 'Building learner profile', 'Analyzing responses', 'in-progress');
        const result = await completeDiagnostic(sessionId);
        setInsights(result.insights);
        setFinalProfile(result.profile);
        setIsComplete(true);
        if (addTrace) addTrace('pragnabodh', 'Profile built', `Style: ${result.profile?.learning_style}`);
        onAgentChange(null);
      } catch (error) {
        console.error('Failed to complete diagnostic:', error);
        onAgentChange(null);
      }
    } else {
      setCurrentIndex(currentIndex + 1);
      startTimeRef.current = Date.now();
    }
  };

  // Proceed to learning
  const handleProceed = () => {
    onComplete(finalProfile, insights);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 bg-gradient-to-br from-saffron-500 to-peacock-500 rounded-full flex items-center justify-center mb-4"
        >
          <Brain size={32} className="text-white" />
        </motion.div>
        <p className="text-gray-600 text-lg">Preparing your diagnostic...</p>
        <p className="text-gray-400 text-sm mt-2">PragnaBodh is getting ready to understand you</p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto py-12"
      >
        <div className="card text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25"
          >
            <CheckCircle size={40} className="text-white" />
          </motion.div>

          <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
            🎯 Profile Complete!
          </h2>

          {/* Insights */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What we learned about you:</h3>
            <p className="text-gray-600 leading-relaxed">{insights}</p>
          </div>

          {/* Profile Summary */}
          {finalProfile && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-saffron-50 rounded-lg p-4">
                <p className="text-sm text-saffron-600 mb-1">Learning Style</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {finalProfile.learning_style?.replace('-', ' ')}
                </p>
              </div>
              <div className="bg-peacock-50 rounded-lg p-4">
                <p className="text-sm text-peacock-600 mb-1">Pace</p>
                <p className="font-semibold text-gray-900 capitalize">{finalProfile.pace}</p>
              </div>
              <div className="bg-lotus-50 rounded-lg p-4">
                <p className="text-sm text-lotus-600 mb-1">Confidence</p>
                <p className="font-semibold text-gray-900 capitalize">{finalProfile.confidence}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 mb-1">Depth Preference</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {finalProfile.depth_preference?.replace('-', ' ')}
                </p>
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleProceed}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <span>Start Learning</span>
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="flex items-center space-x-1">
            <Clock size={14} />
            <span>Take your time</span>
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-saffron-500 to-peacock-500 rounded-full"
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="card"
        >
          {/* Topic Badge */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {currentQuestion.topic}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${
              currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question */}
          <h3 className="text-xl font-medium text-gray-900 mb-6">
            {currentQuestion.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: selectedAnswer === null ? 1.01 : 1 }}
                whileTap={{ scale: selectedAnswer === null ? 0.99 : 1 }}
                onClick={() => handleSelectAnswer(index)}
                disabled={showFeedback}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  showFeedback
                    ? index === currentQuestion.correct_answer
                      ? 'border-green-500 bg-green-50'
                      : index === selectedAnswer
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50 opacity-50'
                    : selectedAnswer === index
                      ? 'border-saffron-500 bg-saffron-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    showFeedback
                      ? index === currentQuestion.correct_answer
                        ? 'bg-green-500 text-white'
                        : index === selectedAnswer
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      : selectedAnswer === index
                        ? 'bg-saffron-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {showFeedback && index === currentQuestion.correct_answer && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  {showFeedback && index === selectedAnswer && index !== currentQuestion.correct_answer && (
                    <XCircle size={20} className="text-red-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Feedback */}
          <AnimatePresence>
            {showFeedback && feedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`mt-6 p-4 rounded-xl ${
                  feedback.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <p className={`font-medium ${feedback.isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                  {feedback.isCorrect ? '✨ ' : '💡 '}
                  {feedback.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-end"
            >
              <button
                onClick={handleNext}
                className="btn-primary flex items-center space-x-2"
              >
                <span>{currentIndex + 1 >= questions.length ? 'Complete' : 'Next'}</span>
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
