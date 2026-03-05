import axios from 'axios';

const API_URL = 'http://localhost:8000';

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
