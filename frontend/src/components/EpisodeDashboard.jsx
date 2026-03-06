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

  const handleAnalyze = async (episode) => {
    setSelectedEp(episode);
    setLoading(true);
    setImprovementData(null);
    setActiveTab('analytics');
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-8">
      {/* Episode List */}
      <div className="w-full lg:w-1/3 space-y-4">
        {episodes.map((ep, idx) => (
          <div
            key={idx}
            onClick={() => handleAnalyze(ep)}
            className={`p-4 rounded-lg cursor-pointer transition-all border ${
              selectedEp === ep
                ? 'bg-blue-900 border-blue-500'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-750'
            }`}
          >
            <h3 className="font-bold text-white">Ep {idx + 1}: {ep.title}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ep.synopsis}</p>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div className="w-full lg:w-2/3 bg-gray-900 rounded-xl border border-gray-700 min-h-[500px] flex flex-col">

        {!selectedEp ? (
          <div className="h-full flex items-center justify-center text-gray-500 p-6">
            Select an episode to analyze its DNA or generate a video
          </div>
        ) : (
          <>
            {/* Tab Bar */}
            <div className="flex border-b border-gray-700 px-4 pt-4 gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'text-white border-violet-500 bg-gray-800'
                      : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 overflow-y-auto">

              {/* ── Analytics Tab ── */}
              {activeTab === 'analytics' && (
                loading ? (
                  <div className="h-full flex items-center justify-center text-blue-400 animate-pulse">
                    Extracting Narrative DNA...
                  </div>
                ) : analytics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <CliffhangerMeter score={analytics.cliffhanger_score} />
                      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-center items-center h-full border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">Scroll Stop Score</div>
                        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
                          {analytics.scroll_stop_score}
                        </div>
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-center items-center h-full border border-gray-700">
                        <div className="text-sm text-gray-400 mb-1">Total Viral Moments</div>
                        <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                          {analytics.viral_moments.length}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <RetentionHeatmap data={analytics.drop_off_risk?.segments || analytics.drop_off_risk} />
                        <EmotionalArcChart data={analytics.emotional_arc} />
                      </div>
                      <div>
                        <CharacterGraph data={analytics.tension_graph} />
                      </div>
                    </div>

                    <ViralMoments moments={analytics.viral_moments} />

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                      <h3 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Script Segment</h3>
                      <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedEp.script_segment}
                      </p>
                    </div>

                    <div className="mt-6 border-t border-gray-700 pt-6">
                      <button
                        onClick={handleImprove}
                        disabled={improving}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded font-bold text-white transition-all shadow-lg"
                      >
                        {improving ? "Analyzing & Rewriting..." : "✨ Auto-Improve Cliffhanger"}
                      </button>

                      {improvementData && (
                        <div className="mt-6 bg-gray-800 p-6 rounded-lg border border-purple-500/30">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-purple-400">AI Improvement Suggestion</h3>
                            <div className="flex items-center gap-4">
                              <div className="text-sm text-gray-400">Original: <span className="text-red-400 font-bold">{improvementData.original_score}</span></div>
                              <div className="text-sm text-gray-400">→ New: <span className="text-green-400 font-bold">{improvementData.predicted_score}</span></div>
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm mb-4">{improvementData.analysis}</p>
                          <ul className="list-disc list-inside text-gray-400 text-sm space-y-1 mb-4">
                            {improvementData.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Original</h4>
                              <div className="bg-black/20 p-4 rounded border-l-2 border-gray-700 font-mono text-xs text-gray-500 whitespace-pre-wrap">{selectedEp.script_segment}</div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">Rewritten</h4>
                              <div className="bg-black/40 p-4 rounded border-l-2 border-purple-500 font-mono text-xs text-gray-200 whitespace-pre-wrap">{improvementData.rewritten_segment}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center pt-20">Click an episode on the left to load analytics</div>
                )
              )}

              {/* ── Video Generator Tab ── */}
              {activeTab === 'video' && (
                <VideoGenerator episode={selectedEp} genre="drama" />
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EpisodeDashboard;

