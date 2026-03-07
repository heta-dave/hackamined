from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class StoryRequest(BaseModel):
    idea: str
    genre: str

class AnalysisRequest(BaseModel):
    script_text: str

class ImprovementRequest(BaseModel):
    script_text: str

class ImprovementResponse(BaseModel):
    original_score: float
    analysis: str
    suggestions: List[str]
    rewritten_segment: str
    predicted_score: float

class Episode(BaseModel):
    title: str
    synopsis: str
    script_segment: str
    
class ArcResponse(BaseModel):
    episodes: List[Episode]
    
class AnalyticsResponse(BaseModel):
    pacing_curve: List[float]
    emotional_arc: List[Dict[str, Any]]
    emotion_analysis: Optional[List[Dict[str, Any]]] = None
    cliffhanger_score: float
    drop_off_risk: Dict[str, Any]
    retention_prediction: Optional[Dict[str, Any]] = None
    viral_moments: List[Dict[str, Any]]
    tension_graph: Dict[str, Any]
    scroll_stop_score: float
    narrative_dna: Optional[Dict[str, Any]] = None

# ── Video Generation Schemas ──────────────────────────────────────────────────

class StyleSuggestionRequest(BaseModel):
    script_text: str
    genre: str = "drama"
    episode_title: str = "Episode 1"

class SuggestedStyle(BaseModel):
    shot_style: str
    cinematic_style: str 
    mood: str
    resolution: str
    reasoning: str

class StyleSuggestionResponse(BaseModel):
    suggested: SuggestedStyle
    alternatives: List[SuggestedStyle]

class VideoGenerationRequest(BaseModel):
    script_segments: List[str]
    shot_style: str = "wide_shot"
    cinematic_style: str = "teal_orange"
    mood: str = "drama"
    resolution: str = "480p"
    mode: str = "preview"

class VideoGenerationResponse(BaseModel):
    job_id: str
    video_filename: str
    clips_generated: int
    duration_seconds: float
    status: str
    message: str
