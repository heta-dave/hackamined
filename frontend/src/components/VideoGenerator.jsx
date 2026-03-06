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
            ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-violet-500 hover:text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {labelMap?.[opt] || opt}
      </button>
    ))}
  </div>
);

const SectionTitle = ({ children }) => (
  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{children}</h4>
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
          setClipsReady(18);
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
      const data = await generateVideo(segments, shotStyle, cinematicStyle, mood, resolution);
      setJobInfo(data);
      setGenerationState('polling');
    } catch (e) {
      console.error('Video generation failed:', e);
      setErrorMsg(e?.response?.data?.detail || e.message || 'Failed to connect to backend.');
      setGenerationState('error');
    }
  };

  const TOTAL_CLIPS = 18;
  const progressPct = generationState === 'done' ? 100
    : generationState === 'polling' ? Math.max(5, Math.round((clipsReady / TOTAL_CLIPS) * 100))
    : generationState === 'started' ? 3
    : 0;

  const isGenerating = generationState === 'started' || generationState === 'polling';

  return (
    <div className="mt-2">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-1 bg-gradient-to-b from-violet-500 to-fuchsia-500 rounded-full" />
        <div>
          <h2 className="text-lg font-bold text-white">Episode Video Generator</h2>
          <p className="text-xs text-gray-500">Powered by Wan2.2-T2V-A14B · 90 seconds · 18 scenes</p>
        </div>
      </div>

      {/* Suggest Style Button */}
      <div className="mb-6 bg-gray-900 border border-gray-700 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white font-medium">✨ AI Style Predictor</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Let Gemini analyze your script and auto-suggest the best cinematic parameters.
            </p>
          </div>
          <button
            onClick={handleSuggest}
            disabled={suggesting || !episode}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-lg text-sm font-bold text-white transition-all shadow-lg disabled:opacity-50 whitespace-nowrap"
          >
            {suggesting ? '🔮 Analyzing...' : '🔮 Predict Best Style'}
          </button>
        </div>

        {suggestion && (
          <div className="mt-4 bg-violet-900/20 border border-violet-500/30 rounded-lg p-4 animate-pulse-once">
            <p className="text-xs text-violet-300 font-bold uppercase tracking-wider mb-2">AI Recommendation Applied</p>
            <p className="text-sm text-gray-300 italic">"{suggestion.suggested.reasoning}"</p>
            {suggestion.alternatives?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Alternatives:</span>
                {suggestion.alternatives.map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => { setShotStyle(alt.shot_style); setCinematicStyle(alt.cinematic_style); setMood(alt.mood); setResolution(alt.resolution); }}
                    className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 hover:border-violet-500 rounded text-gray-400 hover:text-white transition-all"
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
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
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
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
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
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
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
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col">
          <SectionTitle>⚡ Resolution</SectionTitle>
          <div className="flex gap-3 mb-4">
            {['480p', '720p'].map(r => (
              <button
                key={r}
                onClick={() => setResolution(r)}
                disabled={generationState === 'polling'}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border ${
                  resolution === r
                    ? 'bg-violet-600 border-violet-400 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-violet-500'
                } disabled:opacity-50`}
              >
                {r}
              </button>
            ))}
          </div>
          {/* Current Selection Summary */}
          <div className="mt-auto text-xs space-y-1 text-gray-500 bg-black/20 p-3 rounded-lg border border-gray-800">
            <div>🎬 <span className="text-gray-300">{STYLE_LABELS.shot_styles[shotStyle] || shotStyle}</span></div>
            <div>🎨 <span className="text-gray-300">{STYLE_LABELS.cinematic_styles[cinematicStyle] || cinematicStyle}</span></div>
            <div>🎭 <span className="text-gray-300">{STYLE_LABELS.moods[mood] || mood}</span></div>
            <div>⚡ <span className="text-gray-300">{resolution}</span></div>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !episode}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${
          isGenerating
            ? 'bg-gray-700 cursor-wait'
            : 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-indigo-600 hover:from-fuchsia-700 hover:via-violet-700 hover:to-indigo-700 shadow-[0_0_30px_rgba(139,92,246,0.35)]'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {generationState === 'done'
          ? '✅ Video Ready!'
          : isGenerating
          ? `⏳ Generating Clip ${clipsReady}/${TOTAL_CLIPS}...`
          : '🎬 Generate 90-Second Episode Video'}
      </button>

      {/* Progress Bar — visible immediately on click */}
      {(isGenerating || generationState === 'done') && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>
              {generationState === 'done'
                ? '✅ All clips generated & merged!'
                : generationState === 'started'
                ? '🔄 Connecting to generation engine...'
                : `🎞 Generating scene ${clipsReady + 1} of ${TOTAL_CLIPS}...`}
            </span>
            <span className="font-bold text-violet-400">{progressPct}%</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                generationState === 'done'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-500 animate-pulse'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {jobInfo && (
            <p className="text-xs text-gray-600 mt-1.5">
              Job ID: <code className="text-violet-400">{jobInfo.job_id}</code>
              {generationState === 'polling' && <span className="ml-2 text-gray-600">· polling every 4s</span>}
            </p>
          )}
        </div>
      )}

      {/* Error Card */}
      {generationState === 'error' && (
        <div className="mt-4 bg-red-900/20 border border-red-700/50 rounded-xl p-4">
          <p className="text-sm font-bold text-red-400 mb-1">⚠️ Generation Failed</p>
          <p className="text-xs text-red-300/80">{errorMsg || 'An unknown error occurred. Check that the backend server is running on port 8000.'}</p>
          <button
            onClick={() => { setGenerationState(null); setErrorMsg(null); }}
            className="mt-3 px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded text-xs text-white font-medium"
          >
            Dismiss & Retry
          </button>
        </div>
      )}

      {/* Video Playback */}
      {videoUrl && generationState === 'done' && (
        <div className="mt-6 bg-black rounded-xl overflow-hidden border border-violet-500/40 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
          <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white">✅ {episode?.title || 'Episode'} — 90s Preview</span>
            <a
              href={videoUrl}
              download={jobInfo?.video_filename}
              className="px-3 py-1.5 bg-violet-700 hover:bg-violet-600 rounded text-xs font-bold text-white transition-all"
            >
              ⬇ Download
            </a>
          </div>
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full max-h-[500px] bg-black"
          />
        </div>
      )}
    </div>
  );
}
