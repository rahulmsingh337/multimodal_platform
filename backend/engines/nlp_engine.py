from openai import AsyncOpenAI
from pydantic import BaseModel

class StructuredPrompt(BaseModel):
    refined_prompt: str
    negative_prompt: str
    style_tags: list[str]
    detected_intent: str
    tts_text: str | None

class NLPEngine:
    def __init__(self, client: AsyncOpenAI):
        self.client = client
        self.system_prompt = """
        You are a multimodal AI prompt engineer. Parse user input into structured generation parameters.
        Return JSON matching the StructuredPrompt schema. Be specific with visual descriptions.
        Negative prompt should list common artifacts to avoid (blur, watermark, extra fingers, deformed).
        detected_intent must be one of: avatar_animate | text2video | image_gen | text2speech
        """

    async def parse(self, raw_input: str, context: dict = {}) -> StructuredPrompt:
        response = await self.client.beta.chat.completions.parse(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"Context: {context}\n\nUser input: {raw_input}"},
            ],
            response_format=StructuredPrompt,
        )
        return response.choices[0].message.parsed
