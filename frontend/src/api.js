import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const generateArc = async (idea, genre) => {
    const response = await axios.post(`${API_URL}/generate_arc`, { idea, genre });
    return response.data;
};

export const analyzeStory = async (script_text) => {
    const response = await axios.post(`${API_URL}/analyze_story`, { script_text });
    return response.data;
};

export const improveCliffhanger = async (script_text) => {
    const response = await axios.post(`${API_URL}/improve_cliffhanger`, { script_text });
    return response.data;
};

export const getStyleOptions = async () => {
    const response = await axios.get(`${API_URL}/video_style_options`);
    return response.data;
};

export const suggestStyle = async (script_text, genre, episode_title) => {
    const response = await axios.post(`${API_URL}/suggest_style`, { script_text, genre, episode_title });
    return response.data;
};

export const generateVideo = async (script_segments, shot_style, cinematic_style, mood, resolution) => {
    const response = await axios.post(`${API_URL}/generate_video`, {
        script_segments, shot_style, cinematic_style, mood, resolution
    });
    return response.data;
};

export const pollVideoStatus = async (job_id) => {
    const response = await axios.get(`${API_URL}/video_status/${job_id}`);
    return response.data;
};

export const getVideoUrl = (filename) => `${API_URL}/video/${filename}`;
