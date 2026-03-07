import React, { useState, useEffect, useRef } from 'react';
import { getStyleOptions, suggestStyle, generateVideo, pollVideoStatus, getVideoUrl } from '../api';

// Always-available fallback options (used immediately, replaced by API response)
const FALLBACK_OPTIONS = {
  shot_styles: ['close_up', 'wide_shot', 'tracking_shot', 'drone', 'dutch_angle', 'over_shoulder'],
  cinematic_styles: ['neon_noir', 'golden_hour', 'desaturated', 'high_contrast_bw', 'vibrant_pop', 'earth_tones', 'teal_orange'],
  moods: ['thriller', 'drama', 'action', 'romance', 'mystery', 'sci_fi'],
};

// Style display labels
const STYLE_LABELS = {
  shot_styles: {
    close_up: '🔍 Close-Up',
    wide_shot: '🌅 Wide Shot',
    tracking_shot: '🎥 Tracking Shot',
    drone: '🚁 Drone',
    dutch_angle: '📐 Dutch Angle',
    over_shoulder: '👥 Over-Shoulder',
  },
  cinematic_styles: {
    neon_noir: '🌆 Neon Noir',
    golden_hour: '🌇 Golden Hour',
    desaturated: '🖤 Desaturated',
    high_contrast_bw: '⬛ High Contrast B&W',
    vibrant_pop: '🎨 Vibrant Pop',
    earth_tones: '🍂 Earth Tones',
    teal_orange: '🎬 Teal & Orange',
  },
  moods: {
    thriller: '😰 Thriller',
    drama: '🎭 Drama',
    action: '💥 Action',
    romance: '💕 Romance',
    mystery: '🔮 Mystery',
    sci_fi: '🚀 Sci-Fi',
  },
};

const SelectGrid = ({ options, labelMap, value, onChange, disabled }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onChange(opt)}
        disabled={disabled}
        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
          value === opt
            ? 'bg-black border-black text-white shadow-md'
            : 'bg-white border-[#f0f0f0] text-gray-600 hover:border-black/20 hover:text-black'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {labelMap?.[opt] || opt}
      </button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
    <span className="w-1.5 h-1.5 bg-black rounded-full"></span> {children}
  </h4>
);

const StatusBadge = ({ status }) => {
  const colors = {
    queued: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
    generating: 'bg-blue-900/50 text-blue-400 border-blue-700',
    done: 'bg-green-900/50 text-green-400 border-green-700',
    error: 'bg-red-900/50 text-red-400 border-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.queued}`}>
      {status?.toUpperCase()}
    </span>
  );
};

export default function VideoGenerator({ episode, genre = 'drama' }) {
  const [styleOptions, setStyleOptions] = useState(FALLBACK_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [shotStyle, setShotStyle] = useState('wide_shot');
  const [cinematicStyle, setCinematicStyle] = useState('teal_orange');
  const [mood, setMood] = useState('drama');
  const [resolution, setResolution] = useState('480p');
  const [mode, setMode] = useState('preview');
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [generationState, setGenerationState] = useState(null);
  const [jobInfo, setJobInfo] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [clipsReady, setClipsReady] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    getStyleOptions()
      .then(data => { setStyleOptions(data); setOptionsLoading(false); })
      .catch(() => { setOptionsLoading(false); }); // fallback already set, just stop loading
  }, []);

  useEffect(() => {
    if (generationState !== 'polling' || !jobInfo?.job_id) return;

    pollRef.current = setInterval(async () => {
      try {
        const status = await pollVideoStatus(jobInfo.job_id);
        // Update clip progress if backend reports it
        if (typeof status.clips_generated === 'number') {
          setClipsReady(status.clips_generated);
        }
        if (status.status === 'done') {
          clearInterval(pollRef.current);
          setClipsReady(1);
          setGenerationState('done');
          setVideoUrl(getVideoUrl(status.video_filename));
        } else if (status.status === 'error') {
          clearInterval(pollRef.current);
          setGenerationState('error');
          setErrorMsg(status.error || 'Unknown generation error.');
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 4000);

    return () => clearInterval(pollRef.current);
  }, [generationState, jobInfo]);

  const handleSuggest = async () => {
    if (!episode) return;
    setSuggesting(true);
    setSuggestion(null);
    try {
      const data = await suggestStyle(episode.script_segment, genre, episode.title);
      setSuggestion(data);
      // Auto-apply suggestion
      setShotStyle(data.suggested.shot_style);
      setCinematicStyle(data.suggested.cinematic_style);
      setMood(data.suggested.mood);
      setResolution(data.suggested.resolution);
    } catch (e) {
      console.error('Style suggestion failed:', e);
    }
    setSuggesting(false);
  };

  const handleGenerate = async () => {
    if (!episode) return;
    setGenerationState('started');
    setVideoUrl(null);
    setErrorMsg(null);
    setClipsReady(0);
    try {
      const lines = episode.script_segment.split('\n').filter(l => l.trim().length > 5);
      const segments = lines.length > 0 ? lines : [episode.synopsis];
      const data = await generateVideo(segments, shotStyle, cinematicStyle, mood, resolution, mode);
      setJobInfo(data);
      setGenerationState('polling');
    } catch (e) {
      console.error('Video generation failed:', e);
      setErrorMsg(e?.response?.data?.detail || e.message || 'Failed to connect to backend.');
      setGenerationState('error');
    }
  };

  const TOTAL_CLIPS = mode === 'preview' ? 1 : 18;
  const progressPct = generationState === 'done' ? 100
    : generationState === 'polling' ? Math.max(5, Math.round((clipsReady / TOTAL_CLIPS) * 100))
    : generationState === 'started' ? 3
    : 0;

  const isGenerating = generationState === 'started' || generationState === 'polling';

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-1.5 bg-black rounded-full" />
        <div>
          <h2 className="text-xl font-bold text-black tracking-tight">Narrative Cinema Engine</h2>
          <p className="text-sm font-mono text-gray-400 mt-1 uppercase tracking-widest">Powered by Wan2.1 · {mode === 'preview' ? '3 SEC · 1 SCENE' : '90 SEC · 18 SCENES'}</p>
        </div>
      </div>

      {/* Suggest Style Button */}
      <div className="mb-6 bg-white border border-[#f0f0f0] rounded-2xl p-6 shadow-sm hover:border-black/10 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-1">✨ AI Style Predictor</h3>
            <p className="text-sm text-gray-500">
              Let our models analyze your script and auto-suggest the optimal cinematic parameters.
            </p>
          </div>
          <button
            onClick={handleSuggest}
            disabled={suggesting || !episode}
            className="px-6 py-2.5 bg-black hover:bg-gray-800 rounded-full text-sm font-bold text-white transition-all shadow-lg disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2"
          >
            {suggesting ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              '🔮 Predict Best Style'
            )}
          </button>
        </div>

        {suggestion && (
          <div className="mt-6 bg-[#fafafa] border border-[#f0f0f0] rounded-xl p-5 animate-in fade-in slide-in-from-top-2">
            <p className="text-xs text-black font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-black rounded-full"></span> AI Recommendation Applied
            </p>
            <p className="text-sm text-gray-600 italic leading-relaxed">"{suggestion.suggested.reasoning}"</p>
            {suggestion.alternatives?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#f0f0f0] flex flex-wrap items-center gap-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Alternatives:</span>
                {suggestion.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => { setShotStyle(alt.shot_style); setCinematicStyle(alt.cinematic_style); setMood(alt.mood); setResolution(alt.resolution); }}
                    className="text-xs px-3 py-1.5 bg-white border border-[#f0f0f0] hover:border-black rounded-lg text-gray-500 hover:text-black transition-all shadow-sm"
                    title={alt.reasoning}
                  >
                    {STYLE_LABELS.cinematic_styles[alt.cinematic_style] || alt.cinematic_style}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Style Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shot Style */}
        <div className="bg-white border border-[#f0f0f0] rounded-2xl p-6">
          <SectionTitle>📷 Shot Style</SectionTitle>
          <SelectGrid
            options={styleOptions.shot_styles}
            labelMap={STYLE_LABELS.shot_styles}
            value={shotStyle}
            onChange={setShotStyle}
            disabled={generationState === 'polling'}
          />
        </div>

        {/* Cinematic Style */}
        <div className="bg-white border border-[#f0f0f0] rounded-2xl p-6">
          <SectionTitle>🎨 Color Palette & Look</SectionTitle>
          <SelectGrid
            options={styleOptions.cinematic_styles}
            labelMap={STYLE_LABELS.cinematic_styles}
            value={cinematicStyle}
            onChange={setCinematicStyle}
            disabled={generationState === 'polling'}
          />
        </div>

        {/* Mood */}
        <div className="bg-white border border-[#f0f0f0] rounded-2xl p-6">
          <SectionTitle>🎭 Mood & Atmosphere</SectionTitle>
          <SelectGrid
            options={styleOptions.moods}
            labelMap={STYLE_LABELS.moods}
            value={mood}
            onChange={setMood}
            disabled={generationState === 'polling'}
          />
        </div>

        {/* Resolution + Summary */}
        <div className="bg-white border border-[#f0f0f0] rounded-2xl p-6 flex flex-col">
          <SectionTitle>⚡ Resolution</SectionTitle>
          <div className="flex gap-3 mb-4">
            {['480p', '720p'].map(r => (
              <button
                key={r}
                onClick={() => setResolution(r)}
                disabled={generationState === 'polling'}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                  resolution === r
                    ? 'bg-black border-black text-white shadow-md'
                    : 'bg-white border-[#f0f0f0] text-gray-500 hover:border-black/20 hover:text-black'
                } disabled:opacity-50`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Current Selection Summary */}
          <div className="mt-auto text-xs space-y-2 text-gray-500 bg-[#fafafa] p-4 rounded-xl border border-[#f0f0f0]">
            <div className="flex justify-between items-center border-b border-[#f0f0f0] pb-2">
              <span className="uppercase tracking-widest font-mono text-[10px] font-bold">Shot</span>
              <span className="text-black font-medium">{STYLE_LABELS.shot_styles[shotStyle] || shotStyle}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#f0f0f0] pb-2">
              <span className="uppercase tracking-widest font-mono text-[10px] font-bold">Look</span>
              <span className="text-black font-medium">{STYLE_LABELS.cinematic_styles[cinematicStyle] || cinematicStyle}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#f0f0f0] pb-2">
              <span className="uppercase tracking-widest font-mono text-[10px] font-bold">Mood</span>
              <span className="text-black font-medium">{STYLE_LABELS.moods[mood] || mood}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="uppercase tracking-widest font-mono text-[10px] font-bold">Res</span>
              <span className="text-black font-medium">{resolution}</span>
            </div>
          </div>
        </div>
        
        {/* Generation Mode */}
        <div className="bg-white border border-[#f0f0f0] rounded-2xl p-6 flex flex-col md:col-span-2">
          <SectionTitle>🎞 Generation Mode</SectionTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setMode('preview')}
              disabled={generationState === 'polling'}
              className={`flex-1 py-5 px-6 rounded-xl text-left transition-all border ${
                mode === 'preview'
                  ? 'bg-[#fafafa] border-black shadow-sm'
                  : 'bg-white border-[#f0f0f0] hover:border-black/30'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${mode === 'preview' ? 'bg-black text-white' : 'bg-[#f0f0f0] text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div className={`font-bold text-lg ${mode === 'preview' ? 'text-black' : 'text-gray-600'}`}>3-Second Style Preview</div>
              </div>
              <div className="text-sm font-medium text-gray-500 pl-11">Lightning fast. Renders 1 scene to verify your aesthetic.</div>
            </button>
            <button
              onClick={() => setMode('full')}
              disabled={generationState === 'polling'}
              className={`flex-1 py-5 px-6 rounded-xl text-left transition-all border ${
                mode === 'full'
                  ? 'bg-[#fafafa] border-black shadow-sm'
                  : 'bg-white border-[#f0f0f0] hover:border-black/30'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${mode === 'full' ? 'bg-black text-white' : 'bg-[#f0f0f0] text-gray-400'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
                </div>
                <div className={`font-bold text-lg ${mode === 'full' ? 'text-black' : 'text-gray-600'}`}>90-Second Full Episode</div>
              </div>
              <div className="text-sm font-medium text-gray-500 pl-11">Processes 18 distinct script scenes. Takes roughly 6 minutes.</div>
            </button>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !episode}
        className={`w-full py-5 rounded-2xl font-bold text-white text-lg transition-all shadow-lg flex items-center justify-center gap-3 ${
          isGenerating
            ? 'bg-gray-300 cursor-wait text-gray-600 shadow-none'
            : 'bg-black hover:bg-gray-800 hover:-translate-y-0.5'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {generationState === 'done'
          ? <><svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Video Ready!</>
          : isGenerating
          ? <><div className="w-5 h-5 border-2 border-gray-500 border-t-gray-800 rounded-full animate-spin" /> Generating Clip {clipsReady}/{TOTAL_CLIPS}...</>
          : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Generate {mode === 'preview' ? '3s Style Preview' : '90s Full Episode'}</>}
      </button>

      {/* Progress Bar — visible immediately on click */}
      {(isGenerating || generationState === 'done') && (
        <div className="mt-8 bg-white border border-[#f0f0f0] p-6 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-end text-sm text-gray-500 mb-3">
            <span className="font-bold text-black uppercase tracking-widest text-[10px]">
              {generationState === 'done'
                ? 'Generation Complete'
                : generationState === 'started'
                ? 'Connecting to Wan2.1 Engine...'
                : `Rendering Cinematic Sequence (${clipsReady}/${TOTAL_CLIPS})`}
            </span>
            <span className="font-black text-black text-xl">{progressPct}%</span>
          </div>
          <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                generationState === 'done'
                  ? 'bg-black'
                  : 'bg-black relative overflow-hidden'
              }`}
              style={{ width: `${progressPct}%` }}
            >
              {isGenerating && (
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite] -translate-x-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
              )}
            </div>
          </div>
          {jobInfo && (
            <p className="text-[10px] text-gray-400 mt-3 font-mono uppercase tracking-widest text-center">
              Job ID: <span className="text-black font-bold">{jobInfo.job_id}</span>
              {generationState === 'polling' && <span> · POLLING API SERVER</span>}
            </p>
          )}
        </div>
      )}

      {/* Error Card */}
      {generationState === 'error' && (
        <div className="mt-6 bg-[#fff5f5] border border-[#ffe0e0] rounded-2xl p-6 shadow-sm animate-in zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-red-900 mb-1">Generation Interrupted</h4>
              <p className="text-sm text-red-700 leading-relaxed mb-4">{errorMsg || 'An unknown error occurred with the Replicate API or locally.'}</p>
              <button
                onClick={() => { setGenerationState(null); setErrorMsg(null); }}
                className="px-5 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold transition-all shadow-sm"
              >
                Dismiss & Configure Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Playback */}
      {videoUrl && generationState === 'done' && (
        <div className="mt-8 bg-white border border-[#f0f0f0] p-4 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h4 className="text-sm font-bold text-black tracking-tight">{episode?.title || 'Episode'}</h4>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">{mode === 'preview' ? 'STYLE PREVIEW RENDER' : 'FULL EPISODE RENDER'}</p>
            </div>
            <a
              href={videoUrl}
              download={jobInfo?.video_filename}
              className="px-4 py-2 bg-[#fafafa] hover:bg-black text-black hover:text-white border border-[#f0f0f0] rounded-full text-xs font-bold transition-all flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </a>
          </div>
          <div className="rounded-xl overflow-hidden bg-black aspect-video relative group">
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
