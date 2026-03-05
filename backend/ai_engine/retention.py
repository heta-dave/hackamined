import random

def predict_drop_off(text):
    segments = ["0-15s", "15-30s", "30-60s", "60-90s"]
    risk_data = []
    
    words = text.split()
    avg_len = sum(len(w) for w in words) / len(words) if words else 0
    
    base_risk = 10
    if avg_len > 5: base_risk += 20
    
    for seg in segments:
        risk = base_risk + random.randint(-5, 15)
        risk_data.append({"segment": seg, "risk": min(risk, 100)})
        
    return risk_data

def predict_scroll_stop(text):
    hook = text[:150].lower()
    score = 50
    
    triggers = ['suddenly', '!', 'blood', 'kiss', 'money', 'secret']
    for t in triggers:
        if t in hook:
            score += 10
            
    return min(score, 98)
