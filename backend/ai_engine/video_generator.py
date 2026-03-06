"""
video_generator.py
Handles all video generation logic for the VBOX Engine.
Uses Wan-AI/Wan2.2-T2V-A14B-Diffusers for text-to-video generation.
Each clip is ~5s; 18 clips are concatenated for ~90 seconds total.
"""

import os
import uuid
import json
import tempfile
import subprocess
from typing import List, Dict, Any

# ── Configuration ──────────────────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BACKEND_DIR, "generated_videos")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MODEL_ID = "Wan-AI/Wan2.2-T2V-A14B-Diffusers"

# Shot duration constants
FRAMES_PER_CLIP = 81          # ~5 seconds at 16fps (default for Wan2.2)
NUM_CLIPS = 18                # 18 × 5s = 90s
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


def _load_pipeline():
    """Lazy-load the Wan2.2 T2V diffusion pipeline to avoid startup overhead."""
    try:
        import torch
        from diffusers import AutoencoderKLWan, WanTransformer3DModel, WanPipeline
        from diffusers.schedulers.scheduling_unipc_multistep import UniPCMultistepScheduler
        from transformers import CLIPVisionModel

        print(f"[video_generator] Loading Wan2.2 pipeline from {MODEL_ID}...")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if torch.cuda.is_available() else torch.float32
        
        vae = AutoencoderKLWan.from_pretrained(MODEL_ID, subfolder="vae", torch_dtype=dtype)
        pipe = WanPipeline.from_pretrained(
            MODEL_ID,
            vae=vae,
            torch_dtype=dtype,
        )
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=8.0)
        pipe = pipe.to(device)
        
        if torch.cuda.is_available():
            pipe.enable_model_cpu_offload()
            
        print(f"[video_generator] Pipeline loaded on {device}.")
        return pipe
    except Exception as e:
        print(f"[video_generator] ERROR loading pipeline: {e}")
        raise


def _export_clip(frames, fps: int, out_path: str):
    """Export a list of PIL frames to an MP4 using imageio."""
    try:
        import imageio
        writer = imageio.get_writer(out_path, fps=fps, codec="libx264", quality=8)
        for frame in frames:
            import numpy as np
            writer.append_data(np.array(frame))
        writer.close()
    except Exception as e:
        raise RuntimeError(f"Failed to export clip: {e}")


def _concatenate_clips_ffmpeg(clip_paths: List[str], output_path: str):
    """Use ffmpeg (if available) to concatenate clips into a single video."""
    list_file = output_path.replace(".mp4", "_list.txt")
    with open(list_file, "w") as f:
        for cp in clip_paths:
            f.write(f"file '{cp}'\n")
    
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", list_file, "-c", "copy", output_path
    ]
    result = subprocess.run(cmd, capture_output=True)
    os.remove(list_file)
    
    if result.returncode != 0:
        # Fallback: use imageio directly if ffmpeg not available
        _concatenate_clips_imageio(clip_paths, output_path)


def _concatenate_clips_imageio(clip_paths: List[str], output_path: str):
    """Fallback concatenation using imageio directly."""
    import imageio
    import numpy as np
    
    writer = imageio.get_writer(output_path, fps=TARGET_FPS, codec="libx264", quality=8)
    for cp in clip_paths:
        reader = imageio.get_reader(cp)
        for frame in reader:
            writer.append_data(frame)
        reader.close()
    writer.close()


# ── Public Interface ───────────────────────────────────────────────────────────

_pipeline = None  # module-level cache to avoid reloading


def generate_episode_video(
    script_segments: List[str],
    shot_style: str = "wide_shot",
    cinematic_style: str = "teal_orange",
    mood: str = "drama",
    resolution: str = "480p",
    job_id: str = None,
) -> Dict[str, Any]:
    """
    Generate a ~90-second video from a list of script segments.
    
    Args:
        script_segments: List of scene descriptions / script lines.
        shot_style: Key from SHOT_STYLES dict.
        cinematic_style: Key from CINEMATIC_STYLES dict.
        mood: Key from MOODS dict.
        resolution: "480p" or "720p".
        job_id: Optional unique identifier for the job.
    
    Returns:
        dict with keys: video_path, clips_generated, duration_seconds, job_id
    """
    global _pipeline
    
    if job_id is None:
        job_id = str(uuid.uuid4())[:8]
    
    job_dir = os.path.join(OUTPUT_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    width, height = (854, 480) if resolution == "480p" else (1280, 720)
    
    # Distribute script segments evenly across NUM_CLIPS scenes
    prompts = []
    for i in range(NUM_CLIPS):
        seg_idx = min(i * len(script_segments) // NUM_CLIPS, len(script_segments) - 1)
        base = script_segments[seg_idx] if script_segments else "cinematic scene"
        prompts.append(_build_scene_prompt(base, shot_style, cinematic_style, mood, i + 1, NUM_CLIPS))
    
    # Load pipeline (cached after first call)
    if _pipeline is None:
        _pipeline = _load_pipeline()
    
    clip_paths = []
    print(f"[video_generator] Generating {NUM_CLIPS} clips for job {job_id}...")
    
    for i, prompt in enumerate(prompts):
        clip_path = os.path.join(job_dir, f"clip_{i:02d}.mp4")
        print(f"[video_generator] Generating clip {i+1}/{NUM_CLIPS}: {prompt[:60]}...")
        
        output = _pipeline(
            prompt=prompt,
            negative_prompt="blurry, low quality, distorted, watermark, text overlay, static, poor lighting",
            height=height,
            width=width,
            num_frames=FRAMES_PER_CLIP,
            guidance_scale=6.0,
            num_inference_steps=30,
        )
        
        frames = output.frames[0]  # List[PIL.Image]
        _export_clip(frames, TARGET_FPS, clip_path)
        clip_paths.append(clip_path)
        print(f"[video_generator] Clip {i+1} saved: {clip_path}")
    
    # Concatenate all clips
    final_path = os.path.join(OUTPUT_DIR, f"episode_{job_id}.mp4")
    print(f"[video_generator] Concatenating {len(clip_paths)} clips -> {final_path}")
    _concatenate_clips_ffmpeg(clip_paths, final_path)
    
    duration = NUM_CLIPS * (FRAMES_PER_CLIP / TARGET_FPS)
    print(f"[video_generator] Done! Video saved at {final_path} (~{duration:.0f}s)")
    
    return {
        "job_id": job_id,
        "video_path": final_path,
        "video_filename": f"episode_{job_id}.mp4",
        "clips_generated": len(clip_paths),
        "duration_seconds": duration,
    }
