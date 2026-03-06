import React, { useState } from 'react';
import { analyzeStory, improveCliffhanger } from '../api';
import EmotionalArcChart from './charts/EmotionalArcChart';
import RetentionHeatmap from './charts/RetentionHeatmap';
import CharacterGraph from './charts/CharacterGraph';
import ViralMoments from './charts/ViralMoments';
import CliffhangerMeter from './charts/CliffhangerMeter';
import VideoGenerator from './VideoGenerator';

const TABS = [
  { id: 'analytics', label: '📊 Analytics' },
  { id: 'video', label: '🎬 Video Generator' },
];

const EpisodeDashboard = ({ episodes }) => {
  const [selectedEp, setSelectedEp] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [improvementData, setImprovementData] = useState(null);
  const [improving, setImproving] = useState(false);
  const [activeTab, setActiveTab] = useState('analytics');

  const handleSelectEpisode = async (episode) => {
    setSelectedEp(episode);
    setLoading(true);
    setAnalytics(null);
    setImprovementData(null);
    try {
      const data = await analyzeStory(episode.script_segment);
      setAnalytics(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleImprove = async () => {
    if (!selectedEp) return;
    setImproving(true);
    try {
      const data = await improveCliffhanger(selectedEp.script_segment);
      setImprovementData(data);
    } catch (error) {
      console.error("Failed to improve cliffhanger", error);
    }
    setImproving(false);
  };

  const handleBack = () => {
    setSelectedEp(null);
    setAnalytics(null);
    setImprovementData(null);
  };

  if (!selectedEp) {
    return (
      <div className="max-w-6xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-black tracking-tight mb-4">Narrative Arc Generated</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            We've mapped out 5 episodes for your story. Select an episode to dive into its Narrative DNA and emotional metrics.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {episodes.map((ep, idx) => (
            <div
              key={idx}
              onClick={() => handleSelectEpisode(ep)}
              className="group relative bg-white border border-[#f0f0f0] p-8 rounded-2xl cursor-pointer transition-all hover:border-black/5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em]">Episode {idx + 1}</span>
                <div className="w-8 h-8 rounded-full border border-[#f0f0f0] flex items-center justify-center group-hover:border-black transition-colors">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl font-bold text-black mb-3">
                {ep.title !== "Uploaded Script" ? ep.title : "Custom Script"}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                {ep.synopsis}
              </p>

              <div className="mt-8 flex items-center text-xs font-bold text-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                Analyze DNA
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-4 animate-in fade-in duration-500">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={handleBack}
            className="p-2 rounded-full border border-[#f0f0f0] hover:bg-black hover:text-white transition-all text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <div className="text-xs font-mono text-gray-400 uppercase tracking-[0.2em] mb-1">Detailed Analysis</div>
            <h2 className="text-3xl font-bold text-black tracking-tight">{selectedEp.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleImprove}
            disabled={improving || loading}
            className="px-6 py-2.5 bg-black text-white hover:bg-gray-800 rounded-full font-bold text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {improving ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Improving...</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Auto-Improve Cliffhanger
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Script & Synopsis */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl">
            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">Synopsis</h3>
            <p className="text-gray-600 leading-relaxed italic">"{selectedEp.synopsis}"</p>
          </div>

          <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest">Script Segment</h3>
              <span className="text-[10px] bg-[#fafafa] px-2 py-1 rounded border border-[#f0f0f0] text-gray-400 font-mono">CODE VIEW</span>
            </div>
            <div className="bg-[#fcfcfc] p-5 rounded-xl border border-[#f0f0f0] font-mono text-sm leading-relaxed text-gray-600 whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar">
              {selectedEp.script_segment}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics */}
        <div className="lg:col-span-8">
          {loading ? (
            <div className="h-[600px] flex flex-col items-center justify-center bg-white border border-[#f0f0f0] rounded-2xl">
              <div className="w-12 h-12 border-4 border-black/5 border-t-black rounded-full animate-spin mb-4" />
              <div className="text-black font-bold tracking-widest uppercase text-xs animate-pulse">Sequencing Narrative DNA...</div>
            </div>
          ) : analytics ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
              {/* Top row indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl">
                  <CliffhangerMeter score={analytics.cliffhanger_score} />
                </div>
                <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl flex flex-col justify-center items-center">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Retention Score</div>
                  <div className="text-5xl font-black text-black">{analytics.scroll_stop_score}</div>
                  <div className="mt-2 text-[10px] text-gray-400 font-medium">Binge-Watch Potential</div>
                </div>
                <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl flex flex-col justify-center items-center">
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mb-3 text-center">Viral Moments</div>
                  <div className="text-5xl font-black text-black">{analytics.viral_moments.length}</div>
                  <div className="mt-2 text-[10px] text-gray-400 font-medium">High Shear Potential</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl">
                    <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-6">Audience Interest Heatmap</h3>
                    <RetentionHeatmap data={analytics.drop_off_risk?.segments || analytics.drop_off_risk} />
                  </div>
                  <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl">
                    <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-6">Emotional Arc</h3>
                    <div className="rounded-xl overflow-hidden">
                      <EmotionalArcChart data={analytics.emotional_arc} />
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl">
                  <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-6">Character Dynamics Graph</h3>
                  <CharacterGraph data={analytics.tension_graph} />
                </div>
              </div>

              {/* Viral Moments */}
              <div className="bg-white border border-[#f0f0f0] p-6 rounded-2xl">
                <ViralMoments moments={analytics.viral_moments} />
              </div>

              {/* Improvement Section Results */}
              {improvementData && (
                <div className="bg-white text-black p-8 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-[#f0f0f0] animate-in zoom-in-95 duration-500">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-2xl font-black tracking-tighter uppercase text-black">Script Surgery Report</h3>
                      <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-mono font-bold">AI-Powered Optimization</p>
                    </div>
                    <div className="flex items-center gap-6 bg-[#fafafa] px-6 py-3 rounded-xl border border-[#f0f0f0]">
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Old Score</div>
                        <div className="text-xl font-bold text-gray-300 line-through">{improvementData.original_score}</div>
                      </div>
                      <div className="text-2xl text-gray-200">→</div>
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-black mb-1">New Score</div>
                        <div className="text-3xl font-black text-black">{improvementData.predicted_score}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-black rounded-full"></span> Diagnosis
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{improvementData.analysis}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-black rounded-full"></span> Key Fixes
                        </h4>
                        <ul className="space-y-2">
                          {improvementData.suggestions.map((s, i) => (
                            <li key={i} className="flex gap-3 text-sm text-gray-500">
                              <span className="font-bold text-black">0{i + 1}.</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-[#fafafa] border border-[#f0f0f0] p-6 rounded-xl">
                      <h4 className="text-xs font-bold text-black uppercase tracking-widest mb-4 flex items-center justify-between">
                        Optimized Segment
                        <span className="text-[10px] text-black bg-white px-2 py-0.5 rounded-full border border-[#f0f0f0]">HIGH TENSION</span>
                      </h4>
                      <div className="font-mono text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {improvementData.rewritten_segment}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center bg-white border border-[#f0f0f0] rounded-2xl text-gray-300">
              Select an episode to view analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EpisodeDashboard;
