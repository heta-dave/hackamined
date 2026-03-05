def detect_viral_moments(text, emotion_arc):
    moments = []
    
    for item in emotion_arc:
        if abs(item['score']) > 0.8:
            moments.append({
                "timestamp": f"Beat {item['beat']}",
                "type": "Emotional Spike",
                "description": "High intensity emotion detected"
            })
            
    sentences = text.split('.')
    for i, s in enumerate(sentences):
        if 10 < len(s) < 40 and "said" not in s.lower():
             moments.append({
                "timestamp": f"Beat {i}",
                "type": "Quotable Line",
                "description": "Short, punchy dialogue detected"
            })
            
    return moments[:3]
