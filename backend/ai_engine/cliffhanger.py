def calculate_score(text, emotion_arc):
    if not emotion_arc: return 0
    
    scores = [x['score'] for x in emotion_arc]
    avg_sentiment = sum(scores) / len(scores)
    end_sentiment = sum(scores[-3:]) / 3 if len(scores) >= 3 else scores[-1]
    
    sentiment_shift = abs(end_sentiment - avg_sentiment) * 100
    
    last_sentences = text.split('.')[-4:]
    questions = sum(1 for s in last_sentences if '?' in s)
    info_gap_score = min(questions * 25, 50)
    
    stakes_keywords = ['die', 'kill', 'secret', 'never', 'truth', 'trap', 'bomb', 'love', 'run', 'escape', 'terrified', 'hunt']
    stakes_score = 0
    for word in stakes_keywords:
        if word in text.lower()[-200:]:
            stakes_score += 15
            
    total = (0.3 * sentiment_shift) + (0.4 * info_gap_score) + (0.3 * stakes_score)
    return min(round(total, 1), 100)
