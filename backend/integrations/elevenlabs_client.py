import httpx
from config import settings

class ElevenLabsClient:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        self.headers = {
            "xi-api-key": settings.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        }

    async def generate_speech(self, text: str, voice_id: str, model_id: str = "eleven_turbo_v2") -> bytes:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text-to-speech/{voice_id}",
                headers=self.headers,
                json={"text": text, "model_id": model_id, "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}},
                timeout=60.0,
            )
            response.raise_for_status()
            return response.content

    async def list_voices(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.BASE_URL}/voices", headers=self.headers)
            response.raise_for_status()
            return response.json()["voices"]
