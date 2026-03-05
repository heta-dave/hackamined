from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

analyzer = SentimentIntensityAnalyzer()

def analyze_emotional_arc(text):
    sentences = text.split('.')
    arc = []
    for i, sentence in enumerate(sentences):
        if len(sentence.strip()) < 3: continue
        score = analyzer.polarity_scores(sentence)['compound']
        arc.append({"beat": i, "score": score, "text": sentence[:30] + "..."})
    return arc
