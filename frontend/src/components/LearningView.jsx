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
  Loader2,
  Image,
  MessageSquare,
  Hand,
  Volume2,
  List,
  Target,
  Sparkles,
  Tag
} from 'lucide-react';
import { getExplanation, getReExplanation, generateContent, transformAccessibility, getVisualization, getSignLanguageScripts, submitMCQAnswer, checkMisconceptions } from '../api';
import ProfileCard from './ProfileCard';
import ProfileComparison from './ProfileComparison';
import InteractiveMCQ from './InteractiveMCQ';
import ExplainBack from './ExplainBack';
import VisualizationRenderer from './VisualizationRenderer';
import ErrorBoundary from './ErrorBoundary';
import AdvancedFeatures from './AdvancedFeatures';
import MisconceptionAlert from './MisconceptionAlert';
import TextToSpeech from './TextToSpeech';

export default function LearningView({ 
  sessionId, 
  topic, 
  profile, 
  previousProfile,
  onProfileUpdate, 
  onAgentChange,
  adaptationCount,
  addTrace
}) {
  const [explanation, setExplanation] = useState(null);
  const [previousExplanation, setPreviousExplanation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reExplaining, setReExplaining] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [accessibleContent, setAccessibleContent] = useState(null);
  const [signLanguageScripts, setSignLanguageScripts] = useState(null);
  const [visualization, setVisualization] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [showProfileChange, setShowProfileChange] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(null);
  const [oldProfile, setOldProfile] = useState(null);
  const [styleChanged, setStyleChanged] = useState(false);
  const [misconceptionData, setMisconceptionData] = useState(null);

  // Load initial explanation
  useEffect(() => {
    const loadExplanation = async () => {
      try {
        onAgentChange('gurukulguide');
        if (addTrace) addTrace('gurukulguide', 'Generating adaptive explanation', null, 'in-progress');
        const data = await getExplanation(sessionId, topic);
        setExplanation(data.explanation);
        if (addTrace) addTrace('gurukulguide', 'Explanation generated', `Style: ${data.style_used}`);
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
    setOldProfile(profile);
    setLastTrigger(trigger);
    
    try {
      onAgentChange('pragnabodh');
      if (addTrace) addTrace('pragnabodh', 'Analyzing learner signal', `Trigger: ${trigger}`, 'in-progress', true);
      await new Promise(r => setTimeout(r, 500)); // Brief pause for effect
      
      onAgentChange('gurukulguide');
      if (addTrace) addTrace('gurukulguide', 'Regenerating with adapted style', null, 'in-progress');
      const data = await getReExplanation(sessionId, topic, trigger);
      
      setExplanation(data.explanation);
      setStyleChanged(data.style_changed);
      setShowComparison(true);
      
      if (data.new_profile) {
        onProfileUpdate(data.new_profile, trigger);
        setShowProfileChange(true);
        setTimeout(() => setShowProfileChange(false), 5000);
      }
      
      if (addTrace) addTrace('gurukulguide', 'Explanation adapted', `New style: ${data.style_used}`);
      onAgentChange(null);
      setReExplaining(false);
    } catch (error) {
      console.error('Failed to re-explain:', error);
      onAgentChange(null);
      setReExplaining(false);
    }
  };

  // Generate visualization
  const handleGenerateVisualization = async () => {
    if (visualization) {
      setShowVisualization(!showVisualization);
      return;
    }
    
    try {
      onAgentChange('gurukulguide');
      if (addTrace) addTrace('gurukulguide', 'Generating visual diagram', topic, 'in-progress');
      const data = await getVisualization(sessionId, topic);
      
      // Validate we got valid data
      if (data && (data.mermaid || data.nodes)) {
        setVisualization(data);
        setShowVisualization(true);
        if (addTrace) addTrace('gurukulguide', 'Diagram generated', 'Mermaid format');
      } else {
        // Set a fallback diagram if data is invalid
        setVisualization({
          mermaid: `flowchart TD\n    A[${topic}] --> B[Key Concept]\n    B --> C[Learn More]`,
          topic: topic,
          type: 'mermaid',
          fallback: true
        });
        setShowVisualization(true);
        if (addTrace) addTrace('gurukulguide', 'Diagram generated', 'Fallback mode');
      }
      onAgentChange(null);
    } catch (error) {
      console.error('Failed to generate visualization:', error);
      // Still show a fallback diagram instead of nothing
      setVisualization({
        mermaid: `flowchart TD\n    A[${topic}] --> B[Explore]\n    B --> C[Practice]\n    C --> D[Master]`,
        topic: topic,
        type: 'mermaid',
        fallback: true
      });
      setShowVisualization(true);
      if (addTrace) addTrace('gurukulguide', 'Diagram fallback', 'Using default', 'completed');
      onAgentChange(null);
    }
  };

  // Handle MCQ answer submission with profile update
  const handleMCQSubmit = async (result) => {
    try {
      if (addTrace) addTrace('vidyaforge', 'Processing MCQ answer', result.isCorrect ? 'Correct' : 'Incorrect');
      const response = await submitMCQAnswer(sessionId, result);
      
      if (response.profile_updated) {
        setOldProfile(response.previous_profile);
        onProfileUpdate(response.updated_profile, 'mcq_incorrect');
        setLastTrigger('mcq_incorrect');
        setShowProfileChange(true);
        if (addTrace) addTrace('pragnabodh', 'Profile adapted', response.change_reasons?.join(', '), 'completed', true);
        setTimeout(() => setShowProfileChange(false), 5000);
      }

      // Check for misconceptions on wrong answer
      if (!result.isCorrect && result.selectedAnswer) {
        try {
          if (addTrace) addTrace('pragnabodh', 'Analyzing incorrect response', null, 'in-progress');
          const misconceptionResult = await checkMisconceptions(
            sessionId,
            topic,
            `Question: ${result.question || ''}\nSelected: ${result.selectedAnswer}\nCorrect: ${result.correctAnswer}`,
            'mcq'
          );
          
          if (misconceptionResult.misconception_detected) {
            setMisconceptionData({
              misconception: misconceptionResult.misconception,
              correction: misconceptionResult.correction,
              confidence: profile?.confidence || 50
            });
            if (addTrace) addTrace('pragnabodh', 'Misconception identified', misconceptionResult.misconception);
          }
        } catch (error) {
          console.error('Error checking misconceptions:', error);
        }
      }
    } catch (error) {
      console.error('Error submitting MCQ:', error);
    }
  };

  // Handle explain-back evaluation complete
  const handleExplainBackComplete = async (evaluation) => {
    if (addTrace) addTrace('pragnabodh', 'Evaluated explanation', `Understanding: ${evaluation.understanding}`);
    
    if (evaluation.profile_updated) {
      setOldProfile(evaluation.previous_profile);
      setLastTrigger('explain_back_incorrect');
      setShowProfileChange(true);
      setTimeout(() => setShowProfileChange(false), 5000);
    }

    // Check for misconceptions if understanding is low
    if (evaluation.understanding === 'poor' || evaluation.understanding === 'partial') {
      try {
        if (addTrace) addTrace('pragnabodh', 'Checking for misconceptions', null, 'in-progress');
        const misconceptionResult = await checkMisconceptions(
          sessionId, 
          topic, 
          evaluation.learner_input || '', 
          'explain_back'
        );
        
        if (misconceptionResult.misconception_detected) {
          setMisconceptionData({
            misconception: misconceptionResult.misconception,
            correction: misconceptionResult.correction,
            confidence: profile?.confidence || 50
          });
          if (addTrace) addTrace('pragnabodh', 'Misconception detected', misconceptionResult.misconception);
        }
      } catch (error) {
        console.error('Error checking misconceptions:', error);
      }
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
      if (addTrace) addTrace('vidyaforge', 'Generating practice content', 'MCQs + Flashcards', 'in-progress');
      const data = await generateContent(sessionId, topic);
      setGeneratedContent(data.content);
      setShowPractice(true);
      if (addTrace) addTrace('vidyaforge', 'Content generated', `${data.content?.mcqs?.length || 0} MCQs, ${data.content?.flashcards?.length || 0} flashcards`);
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
      if (addTrace) addTrace('sarvshiksha', 'Transforming for accessibility', 'All modes', 'in-progress');
      
      const contentToTransform = explanation?.content || 'No content available';
      
      // Fetch both in parallel but handle errors gracefully
      let accessData = { accessible_content: {} };
      let signData = { sign_language_phrases: [], phrase_count: 0 };
      
      try {
        const results = await Promise.allSettled([
          transformAccessibility(contentToTransform, 'all'),
          getSignLanguageScripts(contentToTransform)
        ]);
        
        if (results[0].status === 'fulfilled') {
          accessData = results[0].value;
        }
        if (results[1].status === 'fulfilled') {
          signData = results[1].value;
        }
      } catch (innerError) {
        console.error('Error in accessibility transform:', innerError);
      }
      
      setAccessibleContent(accessData.accessible_content || accessData);
      setSignLanguageScripts(signData);
      setShowAccessibility(true);
      if (addTrace) addTrace('sarvshiksha', 'Accessibility content ready', `${signData?.phrase_count || 0} sign-ready phrases`);
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
      {/* Profile Change Alert */}
      <AnimatePresence>
        {showProfileChange && oldProfile && (
          <ProfileComparison
            previousProfile={oldProfile}
            currentProfile={profile}
            trigger={lastTrigger}
            onClose={() => setShowProfileChange(false)}
          />
        )}
      </AnimatePresence>

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
        {/* TTS Listen Button - Accessibility */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Volume2 size={18} />
            <span className="text-sm font-medium">Listen to explanation (Indian voice)</span>
          </div>
          <TextToSpeech 
            text={explanation?.content || ''} 
            onStart={() => addTrace?.('sarvshiksha', 'Text-to-Speech started', 'Indian voice', 'in-progress')}
            onEnd={() => addTrace?.('sarvshiksha', 'Text-to-Speech completed', null, 'completed')}
          />
        </div>

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

      {/* Advanced Learning Features */}
      <div className="mb-6">
        <AdvancedFeatures
          sessionId={sessionId}
          topic={topic}
          addTrace={addTrace}
        />
      </div>

      {/* Misconception Alert */}
      <AnimatePresence>
        {misconceptionData && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <MisconceptionAlert
              misconception={misconceptionData.misconception}
              correction={misconceptionData.correction}
              confidence={misconceptionData.confidence}
              onDismiss={() => setMisconceptionData(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Re-explain Button (THE KEY DEMO BUTTON) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleReExplain('struggling')}
          disabled={reExplaining}
          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-4 py-3 rounded-xl font-medium shadow-lg shadow-saffron-500/25 hover:shadow-xl transition-all disabled:opacity-50"
        >
          {reExplaining ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          <span className="text-sm">Explain Differently</span>
        </motion.button>

        {/* Generate Visualization */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateVisualization}
          className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-4 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <Image size={18} />
          <span className="text-sm">{showVisualization ? 'Hide' : 'Show'} Diagram</span>
        </motion.button>

        {/* Generate Practice */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerateContent}
          className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-4 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <FileText size={18} />
          <span className="text-sm">{showPractice ? 'Hide' : 'Practice'} MCQs</span>
        </motion.button>

        {/* Accessibility */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAccessibility}
          className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-4 py-3 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <Accessibility size={18} />
          <span className="text-sm">{showAccessibility ? 'Hide' : 'Accessible'}</span>
        </motion.button>
      </div>

      {/* Visualization Panel */}
      <AnimatePresence>
        {showVisualization && visualization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <ErrorBoundary 
              fallbackTitle="Diagram Error"
              fallbackMessage="Failed to render the diagram. Click try again or regenerate."
              onReset={() => setShowVisualization(false)}
            >
              <VisualizationRenderer
                visualizationData={visualization}
                topic={topic}
                onRegenerate={handleGenerateVisualization}
              />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explain Back Section */}
      <div className="mb-6">
        <ExplainBack
          sessionId={sessionId}
          topic={topic}
          onEvaluationComplete={handleExplainBackComplete}
          onProfileUpdate={onProfileUpdate}
          onRequestReExplanation={handleReExplain}
        />
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
                📚 Interactive Practice
              </h3>

              {/* Summary */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-2">Quick Summary</h4>
                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {generatedContent.summary}
                </p>
              </div>

              {/* Interactive MCQs */}
              {generatedContent.mcqs && generatedContent.mcqs.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3 flex items-center space-x-2">
                    <span>🎯 Practice Questions</span>
                    <span className="text-xs bg-saffron-100 text-saffron-700 px-2 py-0.5 rounded-full">
                      Interactive
                    </span>
                  </h4>
                  <InteractiveMCQ
                    mcqs={generatedContent.mcqs}
                    sessionId={sessionId}
                    topic={topic}
                    onAnswerSubmit={handleMCQSubmit}
                    onProfileUpdate={onProfileUpdate}
                    onRequestReExplanation={handleReExplain}
                  />
                </div>
              )}

              {/* Flashcards */}
              {generatedContent.flashcards && generatedContent.flashcards.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">📇 Flashcards</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {generatedContent.flashcards.map((card, index) => (
                      <motion.div 
                        key={index} 
                        className="bg-gradient-to-br from-peacock-50 to-peacock-100 p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="font-medium text-peacock-800 mb-2">{card.front}</p>
                        <p className="text-sm text-peacock-600">{card.back}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
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
                {/* NEW: One-Line Summary */}
                {accessibleContent.one_line_summary && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4 rounded-xl shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={18} />
                      <span className="font-semibold text-sm">📝 In One Line</span>
                    </div>
                    <p className="text-lg font-medium">{accessibleContent.one_line_summary}</p>
                  </motion.div>
                )}

                {/* NEW: Key Terms with Highlighting */}
                {accessibleContent.key_terms && accessibleContent.key_terms.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                      <Tag size={18} />
                      <span>🔑 Key Terms to Know</span>
                    </h4>
                    <div className="grid gap-3">
                      {accessibleContent.key_terms.map((term, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border-l-4 ${
                            term.importance === 'essential' 
                              ? 'bg-red-50 border-red-500' 
                              : term.importance === 'advanced'
                              ? 'bg-purple-50 border-purple-500'
                              : 'bg-yellow-100 border-yellow-500'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-900">{term.term}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              term.importance === 'essential' 
                                ? 'bg-red-200 text-red-700' 
                                : term.importance === 'advanced'
                                ? 'bg-purple-200 text-purple-700'
                                : 'bg-yellow-200 text-yellow-700'
                            }`}>
                              {term.importance === 'essential' ? '⭐ Must Know' : 
                               term.importance === 'advanced' ? '🚀 Advanced' : '💡 Helpful'}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{term.definition}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NEW: Reading Modes Selector */}
                {accessibleContent.reading_modes && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                    <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                      <List size={18} />
                      <span>📖 Choose Your Reading Mode</span>
                    </h4>
                    <ReadingModeSelector modes={accessibleContent.reading_modes} />
                  </div>
                )}

                {/* Dyslexia-friendly */}
                {accessibleContent.dyslexia_friendly && (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">📚 Dyslexia-Friendly</h4>
                    <p className="text-amber-700 whitespace-pre-line leading-loose text-lg" style={{ fontFamily: 'OpenDyslexic, sans-serif', letterSpacing: '0.05em' }}>
                      {accessibleContent.dyslexia_friendly}
                    </p>
                  </div>
                )}

                {/* Simplified */}
                {accessibleContent.simplified_version && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">🌱 Simplified Version</h4>
                    <p className="text-green-700 whitespace-pre-line">
                      {accessibleContent.simplified_version}
                    </p>
                  </div>
                )}

                {/* Fallback if no structured content */}
                {!accessibleContent.dyslexia_friendly && !accessibleContent.simplified_version && !accessibleContent.one_line_summary && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Accessible Version</h4>
                    <p className="text-gray-700 whitespace-pre-line">
                      {typeof accessibleContent === 'string' ? accessibleContent : JSON.stringify(accessibleContent, null, 2)}
                    </p>
                  </div>
                )}

                {/* NEW: Enhanced Sign Language Phrases */}
                {accessibleContent.sign_language_phrases && accessibleContent.sign_language_phrases.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <Hand size={18} />
                      <span>🤟 Sign-Language Ready Phrases</span>
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                        {accessibleContent.sign_language_phrases.length} phrases
                      </span>
                    </h4>
                    <p className="text-xs text-purple-600 mb-3">
                      Structured phrases with gesture hints for sign language interpreters
                    </p>
                    <div className="space-y-2">
                      {accessibleContent.sign_language_phrases.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-start gap-3 p-2 rounded-lg ${
                            item.is_key_concept ? 'bg-purple-100 border-l-4 border-purple-500' : 'bg-white'
                          }`}
                        >
                          <span className="text-purple-400 font-mono text-sm min-w-[24px]">
                            {item.sequence_order || index + 1}.
                          </span>
                          <div className="flex-1">
                            <p className={`text-purple-800 ${item.is_key_concept ? 'font-semibold' : ''}`}>
                              {item.phrase}
                              {item.is_key_concept && <span className="ml-2">⭐</span>}
                            </p>
                            {item.gesture_hint && (
                              <p className="text-xs text-purple-500 mt-1 italic">
                                💡 Gesture: {item.gesture_hint}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-xs text-purple-500 mt-3 italic flex items-center gap-1">
                      ✓ Optimized for sign language avatar systems • ISL/ASL ready
                    </p>
                  </div>
                )}

                {/* Legacy Sign Language Scripts (backward compatibility) */}
                {signLanguageScripts && signLanguageScripts.sign_language_phrases && Array.isArray(signLanguageScripts.sign_language_phrases) && !accessibleContent.sign_language_phrases && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center space-x-2">
                      <Hand size={18} />
                      <span>Sign-Language Ready Scripts</span>
                      <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full">
                        {signLanguageScripts.phrase_count} phrases
                      </span>
                    </h4>
                    <p className="text-xs text-purple-600 mb-3">
                      Short, gesture-friendly phrases designed for sign language interpretation
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {signLanguageScripts.sign_language_phrases.map((phrase, index) => (
                        <motion.span
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="inline-block bg-white text-purple-700 px-3 py-1.5 rounded-lg text-sm border border-purple-200"
                        >
                          {phrase}
                        </motion.span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-500 mt-3 italic">
                      ✓ Ready for integration with sign language avatar systems
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// NEW: Reading Mode Selector Component
function ReadingModeSelector({ modes }) {
  const [activeMode, setActiveMode] = useState('simple');
  
  const modeConfig = {
    simple: { icon: Target, label: 'Simple', color: 'green', emoji: '🎯' },
    step_by_step: { icon: List, label: 'Step-by-Step', color: 'blue', emoji: '📋' },
    key_ideas: { icon: Lightbulb, label: 'Key Ideas', color: 'amber', emoji: '💡' }
  };

  return (
    <div>
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-4">
        {Object.entries(modes).map(([key, mode]) => {
          const config = modeConfig[key] || modeConfig.simple;
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveMode(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeMode === key
                  ? `bg-${config.color}-500 text-white shadow-lg`
                  : `bg-white text-gray-600 hover:bg-gray-100 border border-gray-200`
              }`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Mode Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-white p-4 rounded-lg border border-indigo-100"
        >
          {modes[activeMode]?.bullet_points && modes[activeMode].bullet_points.length > 0 ? (
            <ul className="space-y-2">
              {modes[activeMode].bullet_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 whitespace-pre-line leading-relaxed">
              {modes[activeMode]?.content || 'Content not available'}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
