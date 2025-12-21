import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, RefreshCw, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Safe Visualization Renderer
 * Renders diagram code as a styled visual representation
 * This version does NOT use mermaid to prevent crashes
 */
export default function VisualizationRenderer({ 
  visualizationData,
  topic,
  onRegenerate
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!visualizationData) {
    return null;
  }

  // Extract mermaid code safely
  let mermaidCode = '';
  try {
    if (typeof visualizationData === 'string') {
      mermaidCode = visualizationData;
    } else if (visualizationData.mermaid) {
      mermaidCode = visualizationData.mermaid;
    } else {
      mermaidCode = JSON.stringify(visualizationData, null, 2);
    }
  } catch (e) {
    mermaidCode = 'Unable to parse diagram data';
  }

  // Parse mermaid code into visual blocks
  const parseToBlocks = (code) => {
    try {
      const lines = code.split('\n').filter(l => l.trim());
      const blocks = [];
      const connections = [];
      const seenIds = new Set();
      
      lines.forEach(line => {
        // Match node definitions like A[Label] or B((Circle)) or C{Diamond}
        const nodeMatches = line.matchAll(/(\w+)\s*[\[\(\{]+([^\]\)\}]+)[\]\)\}]+/g);
        for (const match of nodeMatches) {
          if (!seenIds.has(match[1])) {
            blocks.push({
              id: match[1],
              label: match[2].trim(),
              type: line.includes('((') ? 'circle' : line.includes('{') ? 'diamond' : 'rect'
            });
            seenIds.add(match[1]);
          }
        }
        
        // Match connections like A --> B or A -->|label| B
        const connMatch = line.match(/(\w+)\s*--+>?\|?([^|]*)\|?\s*(\w+)/);
        if (connMatch && connMatch[1] !== connMatch[3]) {
          connections.push({
            from: connMatch[1],
            label: connMatch[2]?.trim() || '',
            to: connMatch[3]
          });
        }
      });
      
      return { blocks, connections };
    } catch (e) {
      return { blocks: [], connections: [] };
    }
  };

  const { blocks, connections } = parseToBlocks(mermaidCode);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get unique nodes from connections that aren't in blocks
  const getFlowNodes = () => {
    const allNodes = new Set();
    const nodeLabels = new Map();
    
    blocks.forEach(b => {
      allNodes.add(b.id);
      nodeLabels.set(b.id, b.label);
    });
    
    connections.forEach(c => {
      allNodes.add(c.from);
      allNodes.add(c.to);
    });
    
    return Array.from(allNodes).map(id => ({
      id,
      label: nodeLabels.get(id) || id
    }));
  };

  const flowNodes = getFlowNodes();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-lg flex items-center justify-center">
            <Image size={16} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Visual Diagram</h4>
            <p className="text-xs text-gray-500">{topic}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {onRegenerate && (
            <button
              onClick={(e) => { e.stopPropagation(); onRegenerate(); }}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Regenerate diagram"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Copy diagram code"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          <button className="p-2 text-gray-400">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {/* Visual flow representation */}
          {flowNodes.length > 0 ? (
            <div className="space-y-4">
              {/* Flow nodes */}
              <div className="flex flex-wrap gap-2 items-center justify-center py-4 bg-gradient-to-br from-gray-50 to-white rounded-lg">
                {flowNodes.map((node, index) => (
                  <div key={node.id} className="flex items-center gap-2">
                    {/* Node box */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-3 py-2 bg-white border-2 border-peacock-200 rounded-lg shadow-sm text-sm font-medium text-gray-700"
                    >
                      {node.label}
                    </motion.div>
                    
                    {/* Arrow */}
                    {index < flowNodes.length - 1 && (
                      <svg width="24" height="12" className="text-gray-300">
                        <line x1="0" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="2"/>
                        <polygon points="18,2 24,6 18,10" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              {/* Connections summary */}
              {connections.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Flow Connections</p>
                  <div className="flex flex-wrap gap-2">
                    {connections.slice(0, 10).map((conn, idx) => (
                      <span key={idx} className="text-xs bg-white px-2 py-1 rounded-full border border-gray-200 text-gray-600">
                        {conn.from} → {conn.label ? `(${conn.label})` : ''} {conn.to}
                      </span>
                    ))}
                    {connections.length > 10 && (
                      <span className="text-xs text-gray-400">+{connections.length - 10} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback: just show the code formatted nicely */
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                {mermaidCode}
              </pre>
            </div>
          )}
          
          {/* Collapsible raw code */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              📋 View Mermaid code (copy & paste to mermaid.live)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-auto max-h-40 font-mono border">
              {mermaidCode}
            </pre>
          </details>
        </div>
      )}
    </motion.div>
  );
}
