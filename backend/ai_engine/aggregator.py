import traceback
from . import (
    narrative_dna, emotion, cliffhanger, retention, 
    viral, tension, story_decomposer
)

class NarrativeDNAAggregator:
    def __init__(self):
        pass

    def analyze_story(self, story_text: str) -> dict:
        """Executes the full analysis pipeline."""
        
        # We need the emotional arc for cliffhanger and viral analysis
        try:
            emotion_data = emotion.analyze_emotional_arc(story_text)
        except Exception as e:
            print(f"Error in emotion analysis: {e}")
            emotion_data = [] # Provide empty fallback to allow dependent modules a chance, though they might also fail gracefully
            
        try:
            pacing_data = narrative_dna.analyze_pacing(story_text)
        except Exception as e:
            print(f"Error in pacing analysis: {e}")
            pacing_data = []

        try:
            cliff_score = cliffhanger.calculate_score(story_text, emotion_data)
        except Exception as e:
            print(f"Error in cliffhanger scoring: {e}")
            cliff_score = 0.0

        try:
            drop_off = retention.predict_drop_off(story_text)
        except Exception as e:
            print(f"Error in drop-off prediction: {e}")
            drop_off = {}

        try:
            scroll_score = retention.predict_scroll_stop(story_text)
        except Exception as e:
            print(f"Error in scroll stop prediction: {e}")
            scroll_score = 0.0

        try:
            viral_moms = viral.detect_viral_moments(story_text, emotion_data)
        except Exception as e:
            print(f"Error in viral moment detection: {e}")
            viral_moms = []

        try:
            tension_data = tension.build_graph(story_text)
        except Exception as e:
            print(f"Error in tension graph generation: {e}")
            tension_data = {"nodes": [], "links": []}

        # -------------------------------------------------------------
        # Compute Narrative DNA Fingerprint
        # -------------------------------------------------------------
        # 1. Emotion Intensity (average absolute emotion score)
        emotion_intensity = 0.0
        if emotion_data:
            emotion_intensity = sum(abs(e.get('score', 0)) for e in emotion_data) / len(emotion_data)
            
        # 2. Conflict Density
        conflict_density = tension_data.get("tension_score", 0.0) if tension_data else 0.0
        
        # 3. Mystery Level (normalize cliffhanger score 0-100 to 0-1)
        mystery_level = cliff_score / 100.0 if cliff_score else 0.0
        
        # 4. Engagement Potential
        engagement_potential = 0.0
        if isinstance(drop_off, dict) and 'engagement_score' in drop_off:
            engagement_potential = drop_off['engagement_score']
            
        # 5. Character Complexity
        # Normalize based on an assumed maximum of ~10 characters for a short segment
        char_count = len(tension_data.get("characters", [])) if tension_data else 0
        character_complexity = min(char_count / 10.0, 1.0)
        
        narrative_dna_fingerprint = {
            "emotion_intensity": round(float(emotion_intensity), 2),
            "conflict_density": round(float(conflict_density), 2),
            "mystery_level": round(float(mystery_level), 2),
            "engagement_potential": round(float(engagement_potential), 2),
            "character_complexity": round(float(character_complexity), 2)
        }

        try:
            todorov_stage = story_decomposer.analyze_todorov_stage(story_text)
        except Exception as e:
            print(f"Error in Todorov analysis: {e}")
            todorov_stage = {"stage": "Unknown", "confidence": 0}

        try:
            characters = tension_data.get("characters", [])
            propp_roles = story_decomposer.extract_propp_characters(story_text, characters)
        except Exception as e:
            print(f"Error in Propp character extraction: {e}")
            propp_roles = {}

        # Structure the final output
        result = {
            "pacing_curve": pacing_data,
            "emotional_arc": emotion_data,
            "emotion_analysis": emotion_data,
            "cliffhanger_score": cliff_score,
            "drop_off_risk": drop_off,
            "retention_prediction": drop_off,
            "viral_moments": viral_moms,
            "tension_graph": tension_data,
            "scroll_stop_score": scroll_score,
            "narrative_dna": narrative_dna_fingerprint,
            "todorov_stage": todorov_stage,
            "propp_characters": propp_roles
        }
        
        return result
