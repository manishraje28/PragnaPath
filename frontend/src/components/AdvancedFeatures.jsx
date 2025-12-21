import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  GitCompare, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  Brain
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getWhyExplanation, compareConcepts } from '../api';

export default function AdvancedFeatures({ 
  sessionId, 
  topic,
  addTrace 
}) {
  const [whyExplanation, setWhyExplanation] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [isLoadingWhy, setIsLoadingWhy] = useState(false);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);

  const handleWhyMode = async () => {
    if (whyExplanation) {
      setExpandedSection(expandedSection === 'why' ? null : 'why');
      return;
    }
    
    setIsLoadingWhy(true);
    if (addTrace) addTrace('gurukulguide', 'Generating WHY explanation', topic, 'in-progress');
    
    try {
      const result = await getWhyExplanation(sessionId, topic);
      setWhyExplanation(result.why_explanation);
      setExpandedSection('why');
      if (addTrace) addTrace('gurukulguide', 'WHY explanation ready', 'Contextual motivation generated');
    } catch (error) {
      console.error('Error getting why explanation:', error);
    } finally {
      setIsLoadingWhy(false);
    }
  };

  const handleCompare = async () => {
    if (comparison) {
      setExpandedSection(expandedSection === 'compare' ? null : 'compare');
      return;
    }
    
    setIsLoadingCompare(true);
    if (addTrace) addTrace('gurukulguide', 'Finding similar concept to compare', topic, 'in-progress');
    
    try {
      const result = await compareConcepts(sessionId, topic);
      setComparison(result);
      setExpandedSection('compare');
      if (addTrace) addTrace('gurukulguide', 'Comparison generated', `${topic} vs ${result.compared_with}`);
    } catch (error) {
      console.error('Error getting comparison:', error);
    } finally {
      setIsLoadingCompare(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {/* Why Mode Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleWhyMode}
          disabled={isLoadingWhy}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
            ${whyExplanation 
              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
              : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            }
          `}
        >
          {isLoadingWhy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Brain size={16} />
          )}
          <span>Why learn this?</span>
          {whyExplanation && (
            expandedSection === 'why' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </motion.button>

        {/* Compare Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCompare}
          disabled={isLoadingCompare}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
            ${comparison 
              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }
          `}
        >
          {isLoadingCompare ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GitCompare size={16} />
          )}
          <span>Compare concepts</span>
          {comparison && (
            expandedSection === 'compare' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </motion.button>
      </div>

      {/* Expandable Sections */}
      <AnimatePresence>
        {/* Why Explanation */}
        {expandedSection === 'why' && whyExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="text-white" size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Why Learn {topic}?</h4>
                  <p className="text-xs text-gray-500">Understanding the purpose behind the concept</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{whyExplanation}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {/* Comparison */}
        {expandedSection === 'compare' && comparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <GitCompare className="text-white" size={16} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {topic} vs {comparison.compared_with}
                  </h4>
                  <p className="text-xs text-gray-500">Understanding the key differences</p>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown>{comparison.comparison}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
