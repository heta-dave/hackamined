import itertools

def build_graph(text):
    words = text.replace("\n", " ").split(" ")
    characters = list(set([w.strip(".,!?") for w in words if w and w[0].isupper() and len(w) > 2]))
    
    stop_caps = ["The", "A", "It", "He", "She", "They", "We", "But", "And", "In", "On"]
    characters = [c for c in characters if c not in stop_caps][:5]
    
    nodes = [{"id": c, "group": 1} for c in characters]
    links = []
    
    if len(characters) > 1:
        for pair in itertools.combinations(characters, 2):
            weight = 1
            links.append({"source": pair[0], "target": pair[1], "value": weight})
            
    return {"nodes": nodes, "links": links}
