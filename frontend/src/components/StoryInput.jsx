import React, { useState } from 'react';

const StoryInput = ({ onGenerate, isLoading }) => {
  const [idea, setIdea] = useState('');
  const [genre, setGenre] = useState('Sci-Fi');

  return (
    <div className="p-8 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
        Narrative DNA Engine
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Genre</label>
          <select 
            value={genre} 
            onChange={(e) => setGenre(e.target.value)}
            className="w-full p-3 bg-gray-800 rounded border border-gray-600 focus:border-blue-500 outline-none"
          >
            <option>Sci-Fi</option>
            <option>Thriller</option>
            <option>Romance</option>
            <option>Horror</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Logline / Concept</label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            className="w-full p-3 h-32 bg-gray-800 rounded border border-gray-600 focus:border-blue-500 outline-none"
            placeholder="A detective discovers he is a simulation..."
          />
        </div>
        <button
          onClick={() => onGenerate(idea, genre)}
          disabled={isLoading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded font-bold text-lg transition-all flex justify-center items-center"
        >
          {isLoading ? (
            <span className="animate-pulse">Generating DNA...</span>
          ) : (
            "Generate Narrative Arc"
          )}
        </button>
      </div>
    </div>
  );
};

export default StoryInput;
