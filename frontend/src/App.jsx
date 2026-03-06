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

  const handleUpload = (scriptText) => {
    // Treat the uploaded script as one single "Episode" segment
    const uploadedEp = {
      title: "Uploaded Script",
      synopsis: "Custom script uploaded for direct analysis.",
      script_segment: scriptText
    };
    setEpisodes([uploadedEp]);
  };

  return (
    <div className="min-h-screen bg-[#fbfbfb] text-[#555] p-6 font-sans selection:bg-black selection:text-white">
      <div className="max-w-7xl mx-auto">


        {episodes.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-20">
            <StoryInput onGenerate={handleGenerate} onUpload={handleUpload} isLoading={loading} />
          </div>
        ) : (
          <EpisodeDashboard episodes={episodes} />
        )}
      </div>
    </div>
  );
}

export default App;
