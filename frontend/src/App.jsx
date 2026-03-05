import React, { useState } from 'react';
import StoryInput from './components/StoryInput';
import EpisodeDashboard from './components/EpisodeDashboard';
import { generateArc } from './api';

function App() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (idea, genre) => {
    setLoading(true);
    try {
      const data = await generateArc(idea, genre);
      setEpisodes(data.episodes);
    } catch (error) {
      console.error("Failed to generate", error);
      alert("Error connecting to backend. Make sure uvicorn is running.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
            <h1 className="text-xl font-mono text-gray-500">NARRATIVE_DNA_ENGINE // v1.0</h1>
        </header>
        
        {episodes.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-20">
            <StoryInput onGenerate={handleGenerate} isLoading={loading} />
          </div>
        ) : (
          <EpisodeDashboard episodes={episodes} />
        )}
      </div>
    </div>
  );
}

export default App;
