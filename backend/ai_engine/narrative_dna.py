from sentence_transformers import SentenceTransformer, util
import numpy as np

# Load a small, fast model. 
try:
    model = SentenceTransformer('all-MiniLM-L6-v2')
except:
    print("Warning: SentenceTransformer model not found. Downloading...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

def analyze_pacing(text):
    sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 5]
    if len(sentences) < 2:
        return [0.5]
        
    embeddings = model.encode(sentences)
    pacing_curve = []
    
    for i in range(len(embeddings) - 1):
        sim = util.cos_sim(embeddings[i], embeddings[i+1]).item()
        speed = 1.0 - sim
        pacing_curve.append(float(speed))
        
    return pacing_curve
