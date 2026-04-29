import replicate
import asyncio
from dataclasses import dataclass

# ── Image Engine ──────────────────────────────────────────────────────────────

@dataclass
class AvatarGenerationResult:
    image_url: str
    seed: int

class ImageEngine:
    async def generate_avatar(self, prompt: str, negative_prompt: str, lora_weights_url: str, seed: int = -1) -> AvatarGenerationResult:
        output = await asyncio.to_thread(
            replicate.run,
            "lucataco/sdxl-lcm:fbbd475b1084de80c47c35bfe4ae64b964294aa7e237e6537eed938cfd24903d",
            input={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "num_inference_steps": 8,
                "lora_weights": lora_weights_url,
                "lora_scale": 0.9,
                "seed": seed if seed != -1 else None,
                "width": 1024,
                "height": 1024,
            }
        )
        return AvatarGenerationResult(image_url=str(output[0]), seed=seed)

    async def image_to_image(self, source_url: str, prompt: str, strength: float = 0.7) -> str:
        output = await asyncio.to_thread(
            replicate.run,
            "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
            input={"image": source_url, "prompt": prompt, "prompt_strength": strength, "num_inference_steps": 30}
        )
        return str(output[0])


# ── Animation Engine ──────────────────────────────────────────────────────────

@dataclass
class AnimationResult:
    video_url: str
    audio_url: str
    duration_s: float

class AnimationEngine:
    def __init__(self, elevenlabs_client, s3_client):
        self.el = elevenlabs_client
        self.s3 = s3_client

    async def animate(self, avatar_image_url: str, speech_text: str, voice_id: str) -> AnimationResult:
        audio_bytes = await self.el.generate_speech(speech_text, voice_id)
        audio_s3_key = f"audio/{voice_id}/{hash(speech_text)}.mp3"
        audio_url = await self.s3.upload_bytes(audio_bytes, audio_s3_key, "audio/mpeg")

        output = await asyncio.to_thread(
            replicate.run,
            "cjwbw/sadtalker:3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376",
            input={
                "source_image": avatar_image_url,
                "driven_audio": audio_url,
                "preprocess": "crop",
                "still_mode": False,
                "use_enhancer": True,
                "pose_style": 0,
                "size_of_image": 512,
                "expression_scale": 1.0,
            }
        )
        video_url = str(output)
        duration = (len(speech_text.split()) / 150) * 60
        return AnimationResult(video_url=video_url, audio_url=audio_url, duration_s=duration)


# ── Video Engine ──────────────────────────────────────────────────────────────

@dataclass
class VideoChunk:
    url: str
    seed: int
    frame_count: int

class VideoEngine:
    async def generate(self, image_url: str, motion_bucket_id: int = 127, fps: int = 6, seed: int | None = None, num_frames: int = 25) -> VideoChunk:
        output = await asyncio.to_thread(
            replicate.run,
            "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
            input={
                "input_image": image_url,
                "video_length": "25_frames_with_svd_xt",
                "sizing_strategy": "maintain_aspect_ratio",
                "frames_per_second": fps,
                "motion_bucket_id": motion_bucket_id,
                "cond_aug": 0.02,
                "decoding_t": 8,
                "seed": seed,
            }
        )
        return VideoChunk(url=str(output), seed=seed or 0, frame_count=num_frames)

    async def generate_long_form(self, image_url: str, target_duration_s: float, fps: int = 6, motion_bucket_id: int = 100) -> list[VideoChunk]:
        chunks_needed = max(1, int((target_duration_s * fps) / 25))
        seed = 42
        chunks = []
        for i in range(chunks_needed):
            chunk = await self.generate(image_url=image_url, motion_bucket_id=motion_bucket_id, fps=fps, seed=seed + i, num_frames=25)
            chunks.append(chunk)
        return chunks
