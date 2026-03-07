"""
video_generator.py
Handles all video generation logic for the VBOX Engine using Replicate.
Uses wan-video/wan2.1-1.3b for text-to-video generation.
"""

import os
import uuid
import tempfile
import subprocess
import requests
from typing import List, Dict, Any
import imageio

import fal_client

# ── Configuration ──────────────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BACKEND_DIR, "generated_videos")
OUTPUT_DIR = os.path.join(BACKEND_DIR, "generated_videos")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MODEL_URL = "fal-ai/wan-t2v"
TARGET_FPS = 16

# ── Cinematic Style Definitions ────────────────────────────────────────────────
SHOT_STYLES = {
    "close_up": "extreme close-up shot, intimate, facial details, bokeh background",
    "wide_shot": "wide establishing shot, epic scale, atmospheric, grand landscape",
    "tracking_shot": "dynamic tracking shot, camera following subject, cinematic movement",
    "drone": "aerial drone shot, bird's eye view, sweeping overhead perspective",
    "dutch_angle": "Dutch angle tilt, thriller shot, disorienting perspective",
    "over_shoulder": "over-the-shoulder shot, conversation, character POV",
}

CINEMATIC_STYLES = {
    "neon_noir": "neon noir aesthetic, high contrast, deep shadows, vibrant neon lights, rain-slicked streets",
    "golden_hour": "golden hour lighting, warm tones, soft diffused sunlight, cinematic warmth",
    "desaturated": "desaturated palette, cold tones, gritty realism, muted colors",
    "high_contrast_bw": "high contrast black and white, dramatic shadows, chiaroscuro lighting",
    "vibrant_pop": "hyper-saturated vibrant colors, bold palette, pop art inspired, vivid",
    "earth_tones": "earthy warm tones, natural palette, organic colors, brown amber green",
    "teal_orange": "teal and orange Hollywood color grading, cinematic blockbuster look",
}

MOODS = {
    "thriller": "tense, suspenseful, ominous atmosphere",
    "drama": "emotionally charged, dramatic tension, intense performances",
    "action": "high-energy, fast-paced, explosive, adrenaline",
    "romance": "soft, intimate, warm, emotional connection",
    "mystery": "mysterious, enigmatic, foggy, shadowy",
    "sci_fi": "futuristic, sleek, technological, otherworldly",
}

# ── Internal Helpers ──────────────────────────────────────────────────────────

def _build_style_prompt(shot_style: str, cinematic_style: str, mood: str) -> str:
    """Build a rich, cinematic T2V prompt demonstrating the visual style."""
    shot_desc = SHOT_STYLES.get(shot_style, SHOT_STYLES["wide_shot"])
    visual_desc = CINEMATIC_STYLES.get(cinematic_style, CINEMATIC_STYLES["teal_orange"])
    mood_desc = MOODS.get(mood, MOODS["drama"])
    
    return (
        f"A breathtaking cinematic test shot, {shot_desc}, {visual_desc}, {mood_desc}, "
        f"masterful cinematography, 4K cinematic quality, "
        f"professional film production, award-winning visuals, ultra-realistic"
    )

def _build_scene_prompt(base_prompt: str, shot_style: str, cinematic_style: str, mood: str, scene_num: int, total_scenes: int) -> str:
    """Build a rich, cinematic T2V prompt for a given scene."""
    shot_desc = SHOT_STYLES.get(shot_style, SHOT_STYLES["wide_shot"])
    visual_desc = CINEMATIC_STYLES.get(cinematic_style, CINEMATIC_STYLES["teal_orange"])
    mood_desc = MOODS.get(mood, MOODS["drama"])
    
    # Add scene-progression context
    if scene_num == 1:
        progression = "opening sequence, establishing the world"
    elif scene_num == total_scenes:
        progression = "climactic finale, peak dramatic moment"
    elif scene_num <= total_scenes // 3:
        progression = "early story development, introducing conflict"
    elif scene_num <= 2 * total_scenes // 3:
        progression = "rising action, escalating tension"
    else:
        progression = "resolution unfolding, aftermath"
    
    return (
        f"{base_prompt}, {shot_desc}, {visual_desc}, {mood_desc}, "
        f"{progression}, masterful cinematography, 4K cinematic quality, "
        f"professional film production, award-winning visuals, ultra-realistic"
    )

def _download_video(url: str, output_path: str):
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

def _concatenate_clips_ffmpeg(clip_paths: List[str], output_path: str):
    """Use ffmpeg to concatenate clips into a single video."""
    list_file = output_path.replace(".mp4", "_list.txt")
    with open(list_file, "w") as f:
        for cp in clip_paths:
            f.write(f"file '{cp}'\n")
    
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", list_file, "-c", "copy", output_path
    ]
    subprocess.run(cmd, capture_output=True)
    if os.path.exists(list_file):
        os.remove(list_file)

# ── Public Interface ───────────────────────────────────────────────────────────

def generate_episode_video(
    script_segments: List[str],
    shot_style: str = "wide_shot",
    cinematic_style: str = "teal_orange",
    mood: str = "drama",
    resolution: str = "480p",
    mode: str = "preview",
    job_id: str = None,
    progress_callback = None,
) -> Dict[str, Any]:
    """
    Generate a video using Replicate API. 
    If mode == "preview", generates 1 style clip (approx 5s).
    If mode == "full", generates 18 clips for a ~90s episode.
    """
    if job_id is None:
        job_id = str(uuid.uuid4())[:8]
    
    job_dir = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    num_clips = 1 if mode == "preview" else 18
    prompts = []
    
    if mode == "preview":
        prompts.append(_build_style_prompt(shot_style, cinematic_style, mood))
    else:
        for i in range(num_clips):
            seg_idx = min(i * len(script_segments) // num_clips, len(script_segments) - 1)
            base = script_segments[seg_idx] if script_segments else "cinematic scene"
            prompts.append(_build_scene_prompt(base, shot_style, cinematic_style, mood, i + 1, num_clips))
            
    clip_paths = []
    clip_paths = []
    print(f"[video_generator] Generating {num_clips} clips for job {job_id} using Fal.ai...")
    
    for i, prompt in enumerate(prompts):
        clip_path = os.path.join(job_dir, f"clip_{i:02d}.mp4")
        print(f"[video_generator] Generating clip {i+1}/{num_clips}: {prompt[:60]}...")
        
        try:
            output = fal_client.subscribe(
                MODEL_URL,
                arguments={
                    "prompt": prompt,
                    "aspect_ratio": "16:9"
                }
            )
            
            # Fal returns {"video": {"url": "..."}} typically
            if "video" in output and isinstance(output["video"], dict) and "url" in output["video"]:
                video_url = output["video"]["url"]
            elif "url" in output:
                video_url = output["url"]
            else:
                raise ValueError(f"Unexpected Fal.ai response format: {output}")
            
            print(f"[video_generator] Downloading clip from {video_url}...")
            _download_video(video_url, clip_path)
            clip_paths.append(clip_path)
            print(f"[video_generator] Clip {i+1} saved: {clip_path}")
            
        except Exception as e:
            print(f"[video_generator] Error on clip {i+1}: {e}")
            raise RuntimeError(f"Fal.ai API error: {e}")
            
        if progress_callback:
            progress_callback(i + 1, num_clips)
            
    if mode == "preview":
        import shutil
        final_path = os.path.join(OUTPUT_DIR, f"style_preview_{job_id}.mp4")
        shutil.copy(clip_paths[0], final_path)
        final_filename = f"style_preview_{job_id}.mp4"
        duration = 5.0 # usually ~5s
    else:
        final_path = os.path.join(OUTPUT_DIR, f"episode_{job_id}.mp4")
        print(f"[video_generator] Concatenating {len(clip_paths)} clips -> {final_path}")
        _concatenate_clips_ffmpeg(clip_paths, final_path)
        final_filename = f"episode_{job_id}.mp4"
        duration = len(clip_paths) * 5.0

    print(f"[video_generator] Done! Video saved at {final_path} (~{duration:.1f}s)")
    
    return {
        "job_id": job_id,
        "video_path": final_path,
        "video_filename": final_filename,
        "clips_generated": len(clip_paths),
        "duration_seconds": duration,
    }
