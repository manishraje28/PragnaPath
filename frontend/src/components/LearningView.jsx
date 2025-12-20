import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  RefreshCw, 
  Zap, 
  BookOpen, 
  FileText, 
  Accessibility, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { getExplanation, getReExplanation, generateContent, transformAccessibility } from '../api';
import ProfileCard from './ProfileCard';

export default function LearningView({ 
  sessionId, 
  topic, 
  profile, 
  onProfileUpdate, 
  onAgentChange,
  adaptationCount 
}) {
  const [explanation, setExplanation] = useState(null);
  const [previousExplanation, setPreviousExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reExplaining, setReExplaining] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [accessibleContent, setAccessibleContent] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [previousProfile, setPreviousProfile] = useState(null);
  const [styleChanged, setStyleChanged] = useState(false);

  // Load initial explanation
  useEffect(() => {
    const loadExplanation = async () => {
      try {
        onAgentChange('gurukulguide');
        const data = await getExplanation(sessionId, topic);
        setExplanation(data.explanation);
        setLoading(false);
        onAgentChange(null);
      } catch (error) {
        console.error('Failed to load explanation:', error);
        setLoading(false);
        onAgentChange(null);
      }
    };
    loadExplanation();
  }, [sessionId, topic]);

  // Handle re-explanation (THE WOW MOMENT!)
  const handleReExplain = async (trigger = 'user_request') => {
    setReExplaining(true);
    setPreviousExplanation(explanation);
    setPreviousProfile(profile);
    
    try {
      onAgentChange('pragnabodh');
      await new Promise(r => setTimeout(r, 500)); // Brief pause for effect
      
      onAgentChange('gurukulguide');
      const data = await getReExplanation(sessionId, topic, trigger);
      
      setExplanation(data.explanation);
      setStyleChanged(data.style_changed);
      setShowComparison(true);
      
      if (data.new_profile) {
        onProfileUpdate(data.new_profile);
      }
      
      onAgentChange(null);
      setReExplaining(false);
    } catch (error) {
      console.error('Failed to re-explain:', error);
      onAgentChange(null);
      setReExplaining(false);
    }
  };

  // Generate practice content
  const handleGenerateContent = async () => {
    if (generatedContent) {
      setShowPractice(!showPractice);
      return;
    }
    
    try {
      onAgentChange('vidyaforge');
      const data = await generateContent(sessionId, topic);
      setGeneratedContent(data.content);
      setShowPractice(true);
      onAgentChange(null);
    } catch (error) {
      console.error('Failed to generate content:', error);
      onAgentChange(null);
    }
  };

  // Get accessible version
  const handleAccessibility = async () => {
    if (accessibleContent) {
      setShowAccessibility(!showAccessibility);
      return;
    }
    
    try {
      onAgentChange('sarvshiksha');
      const data = await transformAccessibility(explanation?.content || '', 'all');
      setAccessibleContent(data.accessible_content);
      setShowAccessibility(true);
      onAgentChange(null);
    } catch (error) {
      console.error('Failed to transform content:', error);
      onAgentChange(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-full flex items-center justify-center mb-4"
        >
          <BookOpen size={32} className="text-white" />
        </motion.div>
        <p className="text-gray-600 text-lg">GurukulGuide is preparing your lesson...</p>
        <p className="text-gray-400 text-sm mt-2">Personalized for your learning style</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 ml-72"> {/* Offset for sidebar */}
      {/* Topic Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-sm text-gray-500 mb-1">Currently Learning</p>
            <h1 className="font-display text-3xl font-bold text-gray-900">{topic}</h1>
          </div>
          
          {/* Style Badge */}
          {explanation && (
            <motion.div
              key={explanation.style_used}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-r from-peacock-500 to-peacock-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            >
              Teaching Style: {explanation.style_used?.replace('-', ' ')}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Adaptation Alert */}
      <AnimatePresence>
        {styleChanged && showComparison && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-saffron-500 to-peacock-500 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-3">
                <Zap size={24} />
                <div>
                  <p className="font-semibold">🎯 Teaching Style Adapted!</p>
                  <p className="text-sm text-white/90">
                    I noticed you might prefer a different approach. The explanation below uses a new teaching style.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Explanation Card */}
      <motion.div
        layout
        className="card mb-6"
      >
        {/* Explanation Content */}
        <div className="explanation-content prose prose-gray max-w-none">
          <ReactMarkdown>{explanation?.content}</ReactMarkdown>
        </div>

        {/* Indian Analogy Highlight */}
        {explanation?.indian_analogy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-saffron-50 border-l-4 border-saffron-500 rounded-r-lg"
          >
            <div className="flex items-start space-x-3">
              <Lightbulb size={20} className="text-saffron-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-saffron-800 mb-1">🇮🇳 Indian Context Analogy</p>
                <p className="text-saffron-700">{explanation.indian_analogy}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Key Takeaways */}
        {explanation?.key_takeaways && explanation.key_takeaways.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3">📌 Key Takeaways</h4>
            <ul className="space-y-2">
              {explanation.key_takeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle size={16} className="text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-gray-700">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Follow-up Question */}
        {explanation?.follow_up_question && (
          <div className="mt-6 p-4 bg-peacock-50 rounded-xl border border-peacock-200">
            <p className="font-medium text-peacock-800 mb-2">🤔 Check Your Understanding:</p>
            <p className="text-peacock-700 italic">{explanation.follow_up_question}</p>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Re-explain Button (THE KEY DEMO BUTTON) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleReExplain('struggling')}
          disabled={reExplaining}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-6 py-4 rounded-xl font-medium shadow-lg shadow-saffron-500/25 hover:shadow-xl transition-all disabled:opacity-50"
        >
          {reExplaining ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <RefreshCw size={20} />
          )}
          <span>I'm Struggling - Explain Differently</span>
        </motion.button>

        {/* Generate Practice */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateContent}
          className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <FileText size={20} />
          <span>{showPractice ? 'Hide' : 'Generate'} Practice Content</span>
          {showPractice ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </motion.button>

        {/* Accessibility */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAccessibility}
          className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-6 py-4 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <Accessibility size={20} />
          <span>{showAccessibility ? 'Hide' : 'Get'} Accessible Version</span>
          {showAccessibility ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </motion.button>
      </div>

      {/* Comparison View (Before/After) */}
      <AnimatePresence>
        {showComparison && previousExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="card bg-gradient-to-br from-gray-50 to-gray-100">
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                <Zap size={20} className="text-saffron-500" />
                <span>🎯 See How Teaching Adapted!</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Before */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">Before</span>
                    <span className="text-sm text-gray-500">
                      Style: {previousExplanation.style_used?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-6">
                    {previousExplanation.content?.substring(0, 300)}...
                  </div>
                </div>

                {/* After */}
                <div className="bg-white rounded-xl p-4 border-2 border-saffron-500">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm bg-saffron-100 text-saffron-700 px-2 py-1 rounded">After</span>
                    <span className="text-sm text-saffron-600 font-medium">
                      Style: {explanation?.style_used?.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-6">
                    {explanation?.content?.substring(0, 300)}...
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowComparison(false)}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700"
              >
                Hide comparison
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Practice Content */}
      <AnimatePresence>
        {showPractice && generatedContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="card">
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-4">
                📚 Practice Content
              </h3>

              {/* Summary */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Summary</h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {generatedContent.summary}
                </p>
              </div>

              {/* MCQs */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Practice Questions</h4>
                <div className="space-y-4">
                  {generatedContent.mcqs?.slice(0, 3).map((mcq, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800 mb-2">
                        {index + 1}. {mcq.question}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {mcq.options.map((opt, i) => (
                          <div key={i} className="text-sm text-gray-600 bg-white p-2 rounded">
                            {String.fromCharCode(65 + i)}. {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flashcards */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Flashcards</h4>
                <div className="grid md:grid-cols-3 gap-3">
                  {generatedContent.flashcards?.map((card, index) => (
                    <div key={index} className="bg-gradient-to-br from-peacock-50 to-peacock-100 p-4 rounded-lg">
                      <p className="font-medium text-peacock-800 mb-2">{card.front}</p>
                      <p className="text-sm text-peacock-600">{card.back}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessible Content */}
      <AnimatePresence>
        {showAccessibility && accessibleContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="card">
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                <Accessibility size={20} className="text-lotus-500" />
                <span>♿ Accessible Versions</span>
              </h3>

              <div className="space-y-4">
                {/* Dyslexia-friendly */}
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Dyslexia-Friendly</h4>
                  <p className="text-amber-700 whitespace-pre-line leading-loose" style={{ fontFamily: 'OpenDyslexic, sans-serif' }}>
                    {accessibleContent.dyslexia_friendly}
                  </p>
                </div>

                {/* Simplified */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Simplified Version</h4>
                  <p className="text-green-700 whitespace-pre-line">
                    {accessibleContent.simplified_version}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
