from pydantic import BaseModel
from typing import List, Dict, Any

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
    cliffhanger_score: float
    drop_off_risk: List[Dict[str, Any]]
    viral_moments: List[Dict[str, Any]]
    tension_graph: Dict[str, Any]
    scroll_stop_score: float
