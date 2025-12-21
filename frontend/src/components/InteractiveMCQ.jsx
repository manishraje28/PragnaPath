import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Loader2 } from 'lucide-react';

export default function InteractiveMCQ({ 
  mcqs, 
  sessionId, 
  topic,
  onAnswerSubmit,
  onProfileUpdate,
  onRequestReExplanation
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const currentMCQ = mcqs[currentIndex];
  
  const handleSelectAnswer = async (answerIndex) => {
    if (showFeedback || isSubmitting) return;
    
    setSelectedAnswer(answerIndex);
    setIsSubmitting(true);
    
    try {
      // Validate answer
      const isCorrect = answerIndex === currentMCQ.correct_answer;
      const result = {
        questionIndex: currentIndex,
        selectedAnswer: answerIndex,
        correctAnswer: currentMCQ.correct_answer,
        isCorrect,
        difficulty: currentMCQ.difficulty
      };
      
      // Notify parent about the answer (for profile updates)
      if (onAnswerSubmit) {
        await onAnswerSubmit(result);
      }
      
      setFeedback({
        isCorrect,
        explanation: currentMCQ.explanation || (isCorrect 
          ? 'Great job! You understood this concept well.'
          : `The correct answer is: ${currentMCQ.options[currentMCQ.correct_answer]}`),
      });
      setShowFeedback(true);
      setResults([...results, result]);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setFeedback(null);
    
    if (currentIndex + 1 >= mcqs.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setFeedback(null);
    setResults([]);
    setIsComplete(false);
  };

  const handleRequestReExplanation = () => {
    if (onRequestReExplanation) {
      onRequestReExplanation('mcq_incorrect');
    }
  };

  // Calculate stats
  const correctCount = results.filter(r => r.isCorrect).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl p-6 border border-gray-200"
      >
        <div className="text-center">
          {/* Results Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              accuracy >= 80 ? 'bg-green-100' : accuracy >= 50 ? 'bg-yellow-100' : 'bg-red-100'
            }`}
          >
            <span className="text-3xl">
              {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '💪' : '📚'}
            </span>
          </motion.div>

          <h3 className="font-display font-semibold text-xl text-gray-900 mb-2">
            Quiz Complete!
          </h3>
          
          <p className="text-gray-600 mb-4">
            You got <span className="font-semibold text-saffron-600">{correctCount}</span> out of{' '}
            <span className="font-semibold">{results.length}</span> correct ({accuracy}%)
          </p>

          {/* Results breakdown */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-center ${
                  result.isCorrect ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <span className="text-lg">
                  {result.isCorrect ? '✓' : '✗'}
                </span>
                <p className="text-xs text-gray-600 capitalize">{result.difficulty}</p>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRestart}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={16} />
              <span>Try Again</span>
            </motion.button>
            
            {accuracy < 80 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRequestReExplanation}
                className="flex items-center space-x-2 px-4 py-2 bg-saffron-500 text-white rounded-lg hover:bg-saffron-600 transition-colors"
              >
                <span>Need More Explanation</span>
                <ArrowRight size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="bg-white rounded-xl p-6 border border-gray-200"
    >
      {/* Progress */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Question {currentIndex + 1} of {mcqs.length}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${
          currentMCQ.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
          currentMCQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {currentMCQ.difficulty}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / mcqs.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-saffron-500 to-peacock-500 rounded-full"
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {currentMCQ.question}
          </h4>

          {/* Options */}
          <div className="space-y-3">
            {currentMCQ.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: selectedAnswer === null ? 1.01 : 1 }}
                whileTap={{ scale: selectedAnswer === null ? 0.99 : 1 }}
                onClick={() => handleSelectAnswer(index)}
                disabled={showFeedback || isSubmitting}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  showFeedback
                    ? index === currentMCQ.correct_answer
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
                      ? index === currentMCQ.correct_answer
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
                  {showFeedback && index === currentMCQ.correct_answer && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  {showFeedback && index === selectedAnswer && index !== currentMCQ.correct_answer && (
                    <XCircle size={20} className="text-red-500" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Loading state */}
          {isSubmitting && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={24} className="animate-spin text-saffron-500" />
              <span className="ml-2 text-gray-600">Checking answer...</span>
            </div>
          )}

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
                  {feedback.isCorrect ? '✨ Correct! ' : '💡 '}
                  {feedback.explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Button */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex justify-end"
            >
              <button
                onClick={handleNext}
                className="btn-primary flex items-center space-x-2"
              >
                <span>{currentIndex + 1 >= mcqs.length ? 'See Results' : 'Next'}</span>
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
