import React, { useState } from 'react';
import api from '../utils/api';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  Smile, 
  Frown, 
  Meh, 
  AlertTriangle, 
  Zap, 
  CheckCircle,
  TrendingUp,
  Brain,
  Lightbulb,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';

const AiAnalysis = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [isFallback, setIsFallback] = useState(false);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError('');
      setAnalysisResult(null);
      setIsFallback(false);

      // Call Express backend to run AI analysis for selected date
      const res = await api.post('/ai/analyze', { date: selectedDate });
      
      if (res.data.success) {
        setAnalysisResult(res.data.analysis);
        
        // Trigger celebratory confetti if productivity score is high
        const score = res.data.analysis.productivity_score;
        if (score >= 80) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }
    } catch (err) {
      console.error('Error analyzing day:', err);
      // Express controller returns fallback object when FastAPI is down
      const fallbackData = err.response?.data?.fallback;
      if (fallbackData) {
        setAnalysisResult(fallbackData);
        setError(err.response?.data?.message || 'AI Microservice is offline.');
        setIsFallback(true);
      } else {
        setError('Failed to analyze the day. Make sure you have written a diary entry for this date.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to get visual theme styles based on returned dominant mood/emotion
  // Model labels: sadness, joy, love, anger, fear, surprise
  const getEmotionTheme = (emotion) => {
    const norm = (emotion || '').toLowerCase();
    
    if (norm === 'joy' || norm === 'love') {
      return {
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
        cardBg: 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300',
        textColor: 'text-amber-600 dark:text-amber-400',
        icon: Smile
      };
    }
    
    if (norm === 'surprise') {
      return {
        bg: 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white',
        cardBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-900 dark:text-indigo-300',
        textColor: 'text-indigo-600 dark:text-indigo-400',
        icon: Brain
      };
    }
    
    if (norm === 'sadness') {
      return {
        bg: 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white',
        cardBg: 'bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-300',
        textColor: 'text-blue-600 dark:text-blue-400',
        icon: Frown
      };
    }

    if (norm === 'anger' || norm === 'fear') {
      return {
        bg: 'bg-gradient-to-br from-red-500 to-rose-600 text-white',
        cardBg: 'bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-300',
        textColor: 'text-red-600 dark:text-red-400',
        icon: AlertTriangle
      };
    }

    // Default neutral styling
    return {
      bg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
      cardBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-950 dark:text-emerald-300',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Meh
    };
  };

  const theme = analysisResult ? getEmotionTheme(analysisResult.emotion) : null;
  const EmotionIcon = theme ? theme.icon : null;

  return (
    <div className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            AI Mind & Productivity Analysis <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Let the AI study your daily diary logs and completed tasks to evaluate your state.
          </p>
        </div>

        {/* Date select picker */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <CalendarIcon className="h-4.5 w-4.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none dark:text-slate-250"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-250 text-amber-900 dark:bg-amber-950/20 dark:text-amber-400/90 text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>AI Service Communication Warning</span>
          </div>
          <p className="text-xs">{error}</p>
          {isFallback && (
            <p className="text-[11px] text-slate-500 mt-1">
              * Showing local fallback simulation data since Python FastAPI server is currently offline or loading.
            </p>
          )}
        </div>
      )}

      {/* Action CTA Button */}
      {!analysisResult && !loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 dark:border-slate-800 dark:bg-slate-900 text-center shadow-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 glow-indigo">
            <Brain className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-slate-850 dark:text-white">Ready for your daily reflection?</h3>
            <p className="text-sm text-slate-500 mt-2">
              Make sure you have saved a diary entry and registered your tasks for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} before invoking analysis.
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-650 text-white font-bold px-8 py-3.5 shadow-lg shadow-indigo-900/20 hover:from-indigo-500 hover:to-purple-550 hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
          >
            Analyze My Day
          </button>
        </div>
      )}

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-20 dark:border-slate-800 dark:bg-slate-900 text-center shadow-md flex flex-col items-center justify-center space-y-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white animate-pulse">Running Neural Sentiment Sync...</h3>
            <p className="text-xs text-slate-400 mt-1">Aggregating diaries, computing metrics, and querying AI microservice.</p>
          </div>
        </div>
      )}

      {/* AI Dashboard Result Display */}
      {analysisResult && !loading && (
        <div className="space-y-6">
          
          <div className="grid gap-6 md:grid-cols-3">
            
            {/* 1. Mood Card */}
            <div className={`rounded-3xl p-6 shadow-lg flex flex-col justify-between min-h-[180px] ${theme.bg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider opacity-90">Dominant Mood</span>
                {EmotionIcon && <EmotionIcon className="h-7 w-7 text-white stroke-2" />}
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-wide">{analysisResult.emotion}</h3>
                <p className="text-xs mt-1.5 opacity-90">Sentiment: <span className="font-bold underline">{analysisResult.sentiment}</span></p>
              </div>
            </div>

            {/* 2. Productivity Dial */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Productivity Score</span>
                <TrendingUp className="h-5 w-5 text-indigo-500" />
              </div>
              
              <div className="flex items-center gap-5">
                <div className="relative flex items-center justify-center shrink-0">
                  {/* SVG circular progress indicator */}
                  <svg className="h-20 w-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="stroke-indigo-600 dark:stroke-indigo-500 fill-none transition-all duration-1000"
                      strokeWidth="6"
                      strokeDasharray={213.6}
                      strokeDashoffset={213.6 - (213.6 * analysisResult.productivity_score) / 100}
                    />
                  </svg>
                  <span className="absolute text-lg font-black text-slate-800 dark:text-white">
                    {analysisResult.productivity_score}
                  </span>
                </div>
                
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {analysisResult.productivity_score >= 80 ? 'Highly Productive!' : analysisResult.productivity_score >= 50 ? 'Steady Progress' : 'Rest Mode'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">Computed from tasks completions and diary tones.</p>
                </div>
              </div>
            </div>

            {/* 3. Stress Meter Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Stress Level</span>
                <Zap className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className={`text-2xl font-black ${
                  analysisResult.stress_level === 'High' 
                    ? 'text-red-650 dark:text-red-400' 
                    : analysisResult.stress_level === 'Medium'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-650 dark:text-emerald-450'
                }`}>
                  {analysisResult.stress_level}
                </h3>
                <div className="grid grid-cols-3 gap-1 mt-2.5 h-1.5 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${analysisResult.stress_level ? 'bg-emerald-500' : 'bg-transparent'}`}></div>
                  <div className={`h-full rounded-full ${analysisResult.stress_level === 'Medium' || analysisResult.stress_level === 'High' ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                  <div className={`h-full rounded-full ${analysisResult.stress_level === 'High' ? 'bg-red-500' : 'bg-transparent'}`}></div>
                </div>
              </div>
            </div>

          </div>

          {/* AI Suggestion Box & Motivational Alerts */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* AI suggestions card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-850 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Lightbulb className="h-5 w-5 text-indigo-500" />
                Empathetic AI Suggestions
              </h4>
              <p className="text-sm text-slate-650 dark:text-slate-350 leading-relaxed">
                {analysisResult.recommendation}
              </p>
            </div>

            {/* Motivational message card */}
            <div className={`rounded-3xl border p-6 shadow-sm flex flex-col justify-between gap-4 ${theme.cardBg}`}>
              <h4 className="font-bold flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                Motivational Insight
              </h4>
              <p className="text-xs md:text-sm italic leading-relaxed">
                {(analysisResult.emotion === 'Anger' || analysisResult.emotion === 'Fear')
                  ? '"Deep breaths. Feeling overwhelmed doesn\'t mean unsuccessful. Celebrate having showed up today, and let the rest wait."'
                  : analysisResult.emotion === 'Sadness'
                  ? '"Rest is not giving up. Difficult days are part of growth. Take small steps tomorrow and believe in your improvement."'
                  : analysisResult.productivity_score >= 80
                  ? '"You are flying high today! Capture this positive inertia, but remember to step away and appreciate your achievements."'
                  : '"Every single day is a clean whiteboard. Be patient with your progress and keep heading in the direction of your values."'}
              </p>
            </div>

          </div>

          {/* Re-analyze Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleAnalyze}
              className="rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold px-6 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Re-Analyze Date
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default AiAnalysis;
