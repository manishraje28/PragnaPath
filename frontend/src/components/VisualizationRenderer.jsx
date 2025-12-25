import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Image, RefreshCw, Copy, Check, ChevronDown, ChevronUp, GitBranch } from 'lucide-react';

/**
 * Enhanced Visualization Renderer
 * Renders flowchart diagrams in a clean, structured landscape layout
 */
export default function VisualizationRenderer({ 
  visualizationData,
  topic,
  onRegenerate
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showCode, setShowCode] = useState(false);

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

  // Enhanced parser for mermaid flowcharts
  const parseFlowchart = (code) => {
    try {
      const lines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('%%'));
      const nodes = new Map();
      const edges = [];
      
      // Determine flow direction (TD = top-down, LR = left-right)
      let direction = 'LR'; // Default to landscape
      const dirMatch = code.match(/flowchart\s+(TD|LR|TB|RL)/i) || code.match(/graph\s+(TD|LR|TB|RL)/i);
      if (dirMatch) {
        direction = dirMatch[1].toUpperCase();
      }
      
      lines.forEach(line => {
        // Skip flowchart/graph declaration
        if (line.trim().match(/^(flowchart|graph)\s/i)) return;
        
        // Parse node definitions and connections
        // Pattern: A[Label] --> B[Label] or A --> B
        const parts = line.split(/--+>?\|?[^|]*\|?/);
        
        // Extract all nodes from the line
        const nodePattern = /(\w+)\s*(?:\[([^\]]+)\]|\(\(([^)]+)\)\)|\{([^}]+)\}|\(([^)]+)\))?/g;
        let match;
        
        while ((match = nodePattern.exec(line)) !== null) {
          const id = match[1];
          const label = match[2] || match[3] || match[4] || match[5] || id;
          
          // Skip if it's just a keyword
          if (['flowchart', 'graph', 'TD', 'LR', 'TB', 'RL', 'subgraph', 'end'].includes(id)) continue;
          
          if (!nodes.has(id)) {
            let shape = 'rect';
            if (match[3]) shape = 'circle';
            else if (match[4]) shape = 'diamond';
            else if (match[5]) shape = 'rounded';
            
            nodes.set(id, { id, label: label.trim(), shape });
          }
        }
        
        // Parse edges with labels
        const edgePattern = /(\w+)\s*--+>?\|?([^|]*)\|?\s*(\w+)/g;
        while ((match = edgePattern.exec(line)) !== null) {
          const from = match[1];
          const label = match[2]?.trim() || '';
          const to = match[3];
          
          if (from !== to && !['flowchart', 'graph', 'subgraph', 'end'].includes(from) && 
              !['flowchart', 'graph', 'subgraph', 'end'].includes(to)) {
            edges.push({ from, to, label });
          }
        }
      });
      
      return { nodes: Array.from(nodes.values()), edges, direction };
    } catch (e) {
      console.error('Parse error:', e);
      return { nodes: [], edges: [], direction: 'LR' };
    }
  };

  // Build flow levels for proper layout
  const buildFlowLevels = (nodes, edges) => {
    if (nodes.length === 0) return [];
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map();
    const outEdges = new Map();
    
    // Initialize
    nodes.forEach(n => {
      inDegree.set(n.id, 0);
      outEdges.set(n.id, []);
    });
    
    // Calculate in-degrees and out-edges
    edges.forEach(e => {
      if (inDegree.has(e.to)) {
        inDegree.set(e.to, inDegree.get(e.to) + 1);
      }
      if (outEdges.has(e.from)) {
        outEdges.get(e.from).push(e);
      }
    });
    
    // Find starting nodes (in-degree = 0)
    const levels = [];
    const assigned = new Set();
    
    // Start with nodes that have no incoming edges
    let currentLevel = nodes.filter(n => inDegree.get(n.id) === 0);
    if (currentLevel.length === 0) {
      // If no clear start, use first node
      currentLevel = [nodes[0]];
    }
    
    while (currentLevel.length > 0 && levels.length < 10) {
      levels.push(currentLevel);
      currentLevel.forEach(n => assigned.add(n.id));
      
      // Find next level nodes
      const nextLevelIds = new Set();
      currentLevel.forEach(n => {
        const outs = outEdges.get(n.id) || [];
        outs.forEach(e => {
          if (!assigned.has(e.to) && nodeMap.has(e.to)) {
            nextLevelIds.add(e.to);
          }
        });
      });
      
      currentLevel = Array.from(nextLevelIds).map(id => nodeMap.get(id)).filter(Boolean);
    }
    
    // Add any remaining unassigned nodes
    const remaining = nodes.filter(n => !assigned.has(n.id));
    if (remaining.length > 0) {
      levels.push(remaining);
    }
    
    return levels;
  };

  const { nodes, edges, direction } = useMemo(() => parseFlowchart(mermaidCode), [mermaidCode]);
  const flowLevels = useMemo(() => buildFlowLevels(nodes, edges), [nodes, edges]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mermaidCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get node style based on shape
  const getNodeStyle = (shape, isFirst, isLast) => {
    const base = "px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 ";
    
    if (isFirst) {
      return base + "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg border-2 border-green-400";
    }
    if (isLast) {
      return base + "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg border-2 border-blue-400";
    }
    
    switch (shape) {
      case 'diamond':
        return base + "bg-amber-50 text-amber-800 border-2 border-amber-300 rounded-lg transform rotate-0";
      case 'circle':
        return base + "bg-purple-50 text-purple-800 border-2 border-purple-300 rounded-full";
      case 'rounded':
        return base + "bg-teal-50 text-teal-800 border-2 border-teal-300 rounded-full";
      default:
        return base + "bg-white text-gray-800 border-2 border-gray-200 rounded-lg hover:border-peacock-300 hover:shadow-md";
    }
  };

  // Render arrow between levels
  const Arrow = ({ label }) => (
    <div className="flex flex-col items-center justify-center px-2">
      <svg width="40" height="20" className="text-gray-400">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>
        <line x1="0" y1="10" x2="30" y2="10" stroke="currentColor" strokeWidth="2" markerEnd="url(#arrowhead)" />
      </svg>
      {label && (
        <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{label}</span>
      )}
    </div>
  );

  // Render vertical connector for branching
  const VerticalConnector = () => (
    <div className="flex justify-center py-1">
      <svg width="2" height="16" className="text-gray-300">
        <line x1="1" y1="0" x2="1" y2="16" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );

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
          <div className="w-10 h-10 bg-gradient-to-br from-peacock-500 to-peacock-600 rounded-xl flex items-center justify-center shadow-lg">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Process Flow Diagram</h4>
            <p className="text-xs text-gray-500">{topic} • {nodes.length} steps</p>
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
        <div className="p-6">
          {flowLevels.length > 0 ? (
            <div className="space-y-6">
              {/* Main Flow - Horizontal Layout */}
              <div className="overflow-x-auto pb-4">
                <div className="flex items-start gap-1 min-w-max px-4 py-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-xl border border-slate-100">
                  {flowLevels.map((level, levelIndex) => (
                    <div key={levelIndex} className="flex items-center">
                      {/* Level nodes */}
                      <div className="flex flex-col gap-3">
                        {level.map((node, nodeIndex) => {
                          const isFirst = levelIndex === 0 && level.length === 1;
                          const isLast = levelIndex === flowLevels.length - 1 && level.length === 1;
                          
                          return (
                            <motion.div
                              key={node.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: levelIndex * 0.1 + nodeIndex * 0.05 }}
                              className="relative"
                            >
                              <div className={getNodeStyle(node.shape, isFirst, isLast)}>
                                <div className="flex items-center gap-2">
                                  {isFirst && <span className="text-xs opacity-75">▶</span>}
                                  <span className="max-w-[180px] truncate">{node.label}</span>
                                  {isLast && <span className="text-xs opacity-75">✓</span>}
                                </div>
                              </div>
                              
                              {/* Show step number */}
                              <div className="absolute -top-2 -left-2 w-5 h-5 bg-peacock-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                                {levelIndex + 1}{level.length > 1 ? String.fromCharCode(97 + nodeIndex) : ''}
                              </div>
                            </motion.div>
                          );
                        })}
                        
                        {/* Show branch indicator if multiple nodes at this level */}
                        {level.length > 1 && (
                          <div className="text-xs text-center text-gray-400 mt-1">
                            ↕ parallel/branch
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow to next level */}
                      {levelIndex < flowLevels.length - 1 && (
                        <div className="flex items-center px-3">
                          <Arrow label={edges.find(e => 
                            level.some(n => n.id === e.from) && 
                            flowLevels[levelIndex + 1]?.some(n => n.id === e.to)
                          )?.label} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded"></div>
                  <span>Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
                  <span>Process</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-50 border-2 border-amber-300 rounded"></div>
                  <span>Decision</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded"></div>
                  <span>End</span>
                </div>
              </div>

              {/* Connections Detail */}
              {edges.length > 0 && (
                <details className="bg-slate-50 rounded-lg p-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    📊 View All Connections ({edges.length})
                  </summary>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {edges.map((edge, idx) => {
                      const fromNode = nodes.find(n => n.id === edge.from);
                      const toNode = nodes.find(n => n.id === edge.to);
                      return (
                        <div key={idx} className="flex items-center gap-1 text-sm bg-white px-3 py-2 rounded-lg border border-slate-200">
                          <span className="font-medium text-gray-700 truncate max-w-[80px]" title={fromNode?.label || edge.from}>
                            {fromNode?.label || edge.from}
                          </span>
                          <span className="text-gray-400">→</span>
                          {edge.label && (
                            <span className="text-xs text-peacock-600 bg-peacock-50 px-1.5 py-0.5 rounded">
                              {edge.label}
                            </span>
                          )}
                          <span className="font-medium text-gray-700 truncate max-w-[80px]" title={toNode?.label || edge.to}>
                            {toNode?.label || edge.to}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          ) : (
            /* Fallback: show formatted code */
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-64">
                {mermaidCode}
              </pre>
            </div>
          )}
          
          {/* Collapsible raw code */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
              <span>📋</span> View Mermaid code (copy & paste to mermaid.live)
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
