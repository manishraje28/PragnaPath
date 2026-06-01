import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Brain, Sparkles, BookOpen, ArrowRight, Zap,
  Play, Mic, Eye, LogIn, UserPlus,
  ChevronDown, Lightbulb, Target,
  Layers, RefreshCw, Accessibility
} from 'lucide-react';

// Scroll-triggered animation wrapper
function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage({ onLogin, onSignup, onGuest }) {
  const [hoveredAgent, setHoveredAgent] = useState(null);

  const features = [
    {
      icon: Brain,
      title: 'Cognitive Profiling',
      description: 'Smart diagnostics map your unique learning style — conceptual, visual, or exam-focused — so every explanation fits how your mind works.',
      color: 'text-saffron-600',
      bg: 'bg-saffron-50',
      border: 'border-saffron-100',
      iconBg: 'bg-saffron-100',
    },
    {
      icon: RefreshCw,
      title: 'Real-Time Adaptation',
      description: 'Struggling? The teaching style changes instantly. Watch the same topic explained in a completely different way when the AI detects confusion.',
      color: 'text-peacock-600',
      bg: 'bg-peacock-50',
      border: 'border-peacock-100',
      iconBg: 'bg-peacock-100',
    },
    {
      icon: Layers,
      title: 'Multi-Agent Intelligence',
      description: '5 specialized AI agents collaborate — from diagnostics to tutoring to accessibility — orchestrated like a virtual gurukul.',
      color: 'text-lotus-600',
      bg: 'bg-lotus-50',
      border: 'border-lotus-100',
      iconBg: 'bg-lotus-100',
    },
  ];

  const agents = [
    { emoji: '🎛️', name: 'Sutradhar', role: 'Orchestrator', description: 'The master conductor that coordinates all agents and decides the best learning path for you.', accent: 'border-l-saffron-500' },
    { emoji: '🧠', name: 'PragnaBodh', role: 'Cognitive Engine', description: 'Builds and continuously updates your cognitive profile through smart diagnostics and behavior analysis.', accent: 'border-l-peacock-500' },
    { emoji: '🧑‍🏫', name: 'GurukulGuide', role: 'Adaptive Tutor', description: 'Teaches using the style that works best for you — stories, step-by-step, visuals, or exam patterns.', accent: 'border-l-lotus-500' },
    { emoji: '🛠️', name: 'VidyaForge', role: 'Content Generator', description: 'Creates personalized MCQs, flashcards, summaries, and practice material tailored to your level.', accent: 'border-l-saffron-500' },
    { emoji: '♿', name: 'SarvShiksha', role: 'Accessibility', description: 'Makes learning inclusive — dyslexia-friendly text, screen reader support, simplified language.', accent: 'border-l-peacock-500' },
  ];

  const steps = [
    { num: '01', title: 'Choose a Topic', desc: 'Pick from CS fundamentals — OS, DSA, Algorithms, and more.', icon: BookOpen, color: 'text-saffron-600', bg: 'bg-saffron-50' },
    { num: '02', title: 'Smart Diagnostic', desc: '4-5 intelligent questions map how you think and learn best.', icon: Target, color: 'text-peacock-600', bg: 'bg-peacock-50' },
    { num: '03', title: 'Adaptive Learning', desc: 'AI teaches using YOUR style — with analogies, diagrams, or definitions.', icon: Lightbulb, color: 'text-lotus-600', bg: 'bg-lotus-50' },
    { num: '04', title: 'Continuous Evolution', desc: 'Struggle? The teaching style shifts instantly. Same topic, new approach.', icon: RefreshCw, color: 'text-saffron-600', bg: 'bg-saffron-50' },
  ];

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-lg flex items-center justify-center shadow-md shadow-saffron-500/20">
                <span className="text-white font-bold text-sm">प्र</span>
              </div>
              <span className="font-display font-bold text-lg text-gray-900">PragnaPath</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollTo('features')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it Works</button>
              <button onClick={() => scrollTo('agents')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">AI Agents</button>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={onLogin} className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
                Log In
              </button>
              <button onClick={onSignup} className="text-sm bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-5 py-2 rounded-lg font-medium hover:from-saffron-600 hover:to-saffron-700 transition-all shadow-md shadow-saffron-500/20 hover:shadow-lg hover:shadow-saffron-500/25">
                Sign Up Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-saffron-100/60 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-peacock-100/50 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lotus-50/40 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-saffron-50 border border-saffron-200 text-saffron-700 px-4 py-2 rounded-full text-sm font-medium mb-8"
          >
            <Sparkles size={14} />
            <span>Powered by Google ADK + Gemini AI</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-gray-900"
          >
            The AI that learns{' '}
            <span className="bg-gradient-to-r from-saffron-500 via-saffron-600 to-peacock-500 bg-clip-text text-transparent">
              how you learn
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-4 leading-relaxed"
          >
            PragnaPath uses 5 coordinated AI agents to diagnose how you think, then adapts its teaching in real-time. Same topic, different explanation — personalized just for you.
          </motion.p>

          {/* Sanskrit */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="text-sm text-gray-400 italic mb-10"
          >
            प्रज्ञा पथ &bull; "The Path of Wisdom"
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={onSignup}
              className="group flex items-center space-x-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-saffron-600 hover:to-saffron-700 transition-all duration-300 shadow-xl shadow-saffron-500/20 hover:shadow-2xl hover:shadow-saffron-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus size={20} />
              <span>Start Learning Free</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={onGuest}
              className="group flex items-center space-x-3 border border-gray-200 text-gray-600 px-8 py-4 rounded-xl font-medium text-lg hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all duration-300"
            >
              <Play size={18} />
              <span>Try as Guest</span>
            </button>
          </motion.div>

          {/* Scroll hint */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="mt-16">
            <button onClick={() => scrollTo('stats')} className="text-gray-300 hover:text-gray-500 transition-colors">
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <ChevronDown size={24} />
              </motion.div>
            </button>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section id="stats" className="py-16 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '5', label: 'AI Agents' },
              { value: 'Real-time', label: 'Adaptation' },
              { value: '4', label: 'Learning Styles' },
              { value: '♿', label: 'Fully Accessible' },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 0.1} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-saffron-500 to-peacock-500 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <p className="text-saffron-600 text-sm font-semibold tracking-wide uppercase mb-3">Why PragnaPath</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
              Learning that adapts <span className="text-saffron-500">to you</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Not just another AI chatbot. PragnaPath is an orchestrated system of specialized agents that truly understands how you learn.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.15}>
                <div className={`group h-full bg-white border ${f.border} rounded-2xl p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300`}>
                  <div className={`w-14 h-14 ${f.iconBg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon size={26} className={f.color} />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="py-24 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <p className="text-peacock-600 text-sm font-semibold tracking-wide uppercase mb-3">How It Works</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
              From zero to <span className="text-peacock-500">personalized</span> in minutes
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.15}>
                <div className="relative text-center lg:text-left">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[calc(100%_-_16px)] w-[calc(100%_-_40px)] border-t-2 border-dashed border-gray-200 z-0" />
                  )}
                  <div className={`relative z-10 inline-flex items-center justify-center w-14 h-14 rounded-xl ${step.bg} mb-5`}>
                    <step.icon size={24} className={step.color} />
                  </div>
                  <div className="text-xs font-mono text-gray-400 mb-2">{step.num}</div>
                  <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ AGENT SHOWCASE ═══════ */}
      <section id="agents" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <p className="text-lotus-600 text-sm font-semibold tracking-wide uppercase mb-3">Meet the Agents</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
              5 AI agents, <span className="text-lotus-500">one goal</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Built on Google ADK, each agent specializes in a different aspect of your learning journey.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <AnimatedSection key={agent.name} delay={i * 0.1}>
                <div
                  className={`group bg-white border border-gray-100 ${agent.accent} border-l-4 rounded-xl p-6 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300 cursor-default`}
                  onMouseEnter={() => setHoveredAgent(agent.name)}
                  onMouseLeave={() => setHoveredAgent(null)}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-3xl flex-shrink-0 mt-1">{agent.emoji}</span>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-gray-900">{agent.name}</h3>
                      <p className="text-xs font-mono text-gray-400 mb-2">{agent.role}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{agent.description}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
            {/* The Wow card */}
            <AnimatedSection delay={0.5}>
              <div className="bg-gradient-to-br from-saffron-50 via-white to-peacock-50 border border-saffron-100 border-l-4 border-l-saffron-400 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <span className="text-3xl flex-shrink-0 mt-1">✨</span>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-gray-900">The "Wow" Moment</h3>
                    <p className="text-xs font-mono text-saffron-500 mb-2">Real-time Adaptation</p>
                    <p className="text-sm text-gray-500 leading-relaxed">When you struggle, the agents collaborate to change the teaching approach instantly. Same topic, completely different explanation.</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════ ACCESSIBILITY ═══════ */}
      <section className="py-20 bg-gray-50/50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedSection>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-peacock-50 border border-peacock-100 rounded-2xl mb-6">
                <Accessibility size={32} className="text-peacock-500" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-4 text-gray-900">
                Education for All
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto mb-8 text-lg">
                PragnaPath is built accessibility-first. Dyslexia-friendly text, screen reader support, simplified language modes, and voice assistance.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Dyslexia-Safe Fonts', 'Screen Reader Ready', 'Voice Assistant', 'Simplified Language', 'Indian English TTS'].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-50 via-white to-peacock-50 pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-gray-900">
              Ready to learn <span className="bg-gradient-to-r from-saffron-500 to-peacock-500 bg-clip-text text-transparent">smarter</span>?
            </h2>
            <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
              Join PragnaPath and experience AI-powered learning that truly adapts to you. Free to start, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={onSignup}
                className="group flex items-center space-x-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-saffron-600 hover:to-saffron-700 transition-all duration-300 shadow-xl shadow-saffron-500/20 hover:shadow-2xl hover:shadow-saffron-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Create Free Account</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={onLogin}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 px-6 py-4 rounded-xl transition-all"
              >
                <LogIn size={18} />
                <span>Already have an account? Log in</span>
              </button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-gray-100 py-10 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">प्र</span>
              </div>
              <div>
                <span className="font-display font-semibold text-gray-900">PragnaPath</span>
                <p className="text-xs text-gray-400">The AI that learns how you learn</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Built with Google ADK + Gemini</span>
              <span>&bull;</span>
              <span>Made in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
