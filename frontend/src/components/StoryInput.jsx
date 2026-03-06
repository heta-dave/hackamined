import React, { useState } from 'react';

const DNALoader = () => (
  <div className="flex items-center justify-center gap-1.5 h-6">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="relative w-1.5 h-5 flex-shrink-0">
        <div className="absolute top-[2px] bottom-[2px] left-1/2 w-[2px] bg-gray-600/50 -translate-x-1/2" />
        <div
          className="w-1.5 h-1.5 bg-white rounded-full dna-dot-top absolute top-0"
          style={{ animationDelay: `${i * -0.2}s` }}
        />
        <div
          className="w-1.5 h-1.5 bg-gray-400 rounded-full dna-dot-bottom absolute bottom-0"
          style={{ animationDelay: `${i * -0.2}s` }}
        />
      </div>
    ))}
  </div>
);

const StoryInput = ({ onGenerate, onUpload, isLoading }) => {
  const [activeTab, setActiveTab] = useState('generate');

  // Generate State
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('Sci-Fi');

  // Upload State
  const [scriptText, setScriptText] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setScriptText(e.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="relative p-10 bg-white text-gray-900 rounded-3xl shadow-[0_10px_50px_-15px_rgba(0,0,0,0.1)] border border-[#f0f0f0] overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent"></div>

      <div className="absolute top-8 right-10 text-[10px] font-mono text-gray-400 tracking-widest uppercase">
        System v2.4
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-black mb-3 text-black tracking-tighter uppercase">
          Narrative DNA <span className="text-gray-300">Engine</span>
        </h2>
        <p className="text-gray-500 max-w-md text-sm leading-relaxed">
          Decode the genetic architecture of your story.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex w-full bg-[#fafafa] p-1.5 rounded-xl mb-8 font-bold text-xs uppercase tracking-widest border border-[#f0f0f0]">
        <button
          className={`flex-1 py-3 px-4 rounded-lg transition-all ${activeTab === 'generate' ? 'bg-white text-black shadow-sm border border-[#f0f0f0]' : 'text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('generate')}
        >
          Synthesize Arc
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-lg transition-all ${activeTab === 'upload' ? 'bg-white text-black shadow-sm border border-[#f0f0f0]' : 'text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('upload')}
        >
          Import Sequence
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Story Genre</label>
            <div className="relative">
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-4 bg-[#fafafa] rounded-xl border border-[#f0f0f0] focus:border-black/10 outline-none text-black transition-all appearance-none cursor-pointer"
              >
                {['Sci-Fi', 'Thriller', 'Romance', 'Horror', 'Fantasy', 'Mystery', 'Drama', 'Comedy'].map(g => (
                  <option key={g} className="bg-white">{g}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-2 uppercase tracking-widest">Narrative Core</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="w-full p-5 h-40 bg-[#fafafa] rounded-2xl border border-[#f0f0f0] focus:border-black/10 outline-none text-black placeholder-gray-300 transition-all resize-none text-sm leading-relaxed"
              placeholder="A hacker discovers his entire reality is a computer simulation..."
            />
          </div>
          <button
            onClick={() => onGenerate(idea, genre)}
            disabled={isLoading || !idea.trim()}
            className="w-full py-5 bg-black text-white hover:bg-gray-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex justify-center items-center disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
          >
            {isLoading ? (
              <DNALoader />
            ) : (
              <span className="flex items-center gap-2">
                Sequence Arc
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <label className="block text-[10px] font-mono font-bold text-gray-400 mb-3 uppercase tracking-widest leading-relaxed">
              Sequence Import (.txt) or Direct Input
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="block w-full text-xs text-gray-400 mb-6
                file:mr-4 file:py-2.5 file:px-6
                file:rounded-full file:border file:border-[#f0f0f0]
                file:text-[10px] file:font-black file:uppercase file:tracking-widest
                file:bg-[#fafafa] file:text-black
                hover:file:bg-[#f5f5f5] hover:file:border-[#e5e5e5] cursor-pointer"
            />
            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              className="w-full p-5 h-48 bg-[#fafafa] rounded-2xl border border-[#f0f0f0] focus:border-black/10 outline-none text-black placeholder-gray-300 transition-all resize-none text-sm leading-relaxed font-mono"
              placeholder="INT. ROOM - DAY&#10;&#10;JOHN enters the room quickly..."
            />
          </div>
          <button
            onClick={() => onUpload(scriptText)}
            disabled={isLoading || !scriptText.trim()}
            className="w-full py-5 bg-black text-white hover:bg-gray-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex justify-center items-center disabled:opacity-30 disabled:cursor-not-allowed group shadow-lg"
          >
            {isLoading ? (
              <span className="animate-pulse">Sequencing...</span>
            ) : (
              <span className="flex items-center gap-2">
                Start Analysis
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryInput;
