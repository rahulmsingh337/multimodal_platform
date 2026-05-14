"""
Backend API Test Suite
Tests all endpoints in backend-vercel/api/index.py
Run: pytest tests/backend/test_api.py -v
"""

import sys
import os
import pytest
import json
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend-vercel'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend-vercel/api'))

from index import app
from fastapi.testclient import TestClient

client = TestClient(app)


# ── Health & Root ─────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self):
        r = client.get("/health")
        assert r.status_code == 200

    def test_health_status_ok(self):
        r = client.get("/health")
        assert r.json()["status"] == "ok"

    def test_health_has_version(self):
        r = client.get("/health")
        assert "version" in r.json()
        assert r.json()["version"] == "1.0.0"

    def test_health_has_timestamp(self):
        r = client.get("/health")
        assert "timestamp" in r.json()

    def test_health_has_database_field(self):
        r = client.get("/health")
        assert "database" in r.json()

    def test_health_has_ai_fields(self):
        r = client.get("/health")
        body = r.json()
        assert "ai_image" in body
        assert "ai_nlp" in body
        assert "tts" in body

    def test_root_returns_200(self):
        r = client.get("/")
        assert r.status_code == 200

    def test_root_has_message(self):
        r = client.get("/")
        assert "message" in r.json()

    def test_root_has_docs_link(self):
        r = client.get("/")
        assert "docs" in r.json()

    def test_docs_returns_200(self):
        r = client.get("/docs")
        assert r.status_code == 200


# ── Avatars ───────────────────────────────────────────────────────────────────

class TestAvatars:
    def test_list_avatars_returns_200(self):
        r = client.get("/api/v1/avatars")
        assert r.status_code == 200

    def test_list_avatars_has_avatars_key(self):
        r = client.get("/api/v1/avatars")
        assert "avatars" in r.json()

    def test_list_avatars_has_total(self):
        r = client.get("/api/v1/avatars")
        body = r.json()
        assert "total" in body
        assert body["total"] == len(body["avatars"])

    def test_list_avatars_has_demo_avatars(self):
        r = client.get("/api/v1/avatars")
        avatars = r.json()["avatars"]
        assert len(avatars) >= 3
        names = [a["name"] for a in avatars]
        assert "Priya" in names
        assert "Marcus" in names
        assert "Aiko" in names

    def test_avatar_has_required_fields(self):
        r = client.get("/api/v1/avatars")
        av = r.json()["avatars"][0]
        assert "id" in av
        assert "name" in av
        assert "status" in av
        assert "lora_ready" in av
        assert "voice_id" in av

    def test_get_avatar_by_id(self):
        r = client.get("/api/v1/avatars/av1")
        assert r.status_code == 200
        assert r.json()["name"] == "Priya"

    def test_get_avatar_not_found(self):
        r = client.get("/api/v1/avatars/nonexistent_id")
        assert r.status_code == 404

    def test_create_avatar(self):
        r = client.post("/api/v1/avatars/?name=TestAvatar&voice_id=rachel")
        assert r.status_code == 200
        body = r.json()
        assert "avatar_id" in body
        assert "job_id" in body
        assert body["status"] == "queued"

    def test_create_avatar_default_voice(self):
        r = client.post("/api/v1/avatars/?name=VoiceTest")
        assert r.status_code == 200
        assert "avatar_id" in r.json()

    def test_create_avatar_returns_job(self):
        r = client.post("/api/v1/avatars/?name=JobTest")
        body = r.json()
        assert body["job_id"].startswith("job_")
        assert body["avatar_id"].startswith("av_")

    def test_animate_avatar(self):
        r = client.post("/api/v1/avatars/av1/animate?text=Hello+World&voice_id=rachel")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "done"
        assert "output" in body

    def test_animate_avatar_has_video_url(self):
        r = client.post("/api/v1/avatars/av1/animate?text=Hello")
        output = r.json()["output"]
        assert "video_url" in output
        assert output["video_url"].startswith("http")

    def test_animate_avatar_has_audio_url(self):
        r = client.post("/api/v1/avatars/av1/animate?text=Hello")
        output = r.json()["output"]
        assert "audio_url" in output

    def test_delete_avatar(self):
        # Create first
        create_r = client.post("/api/v1/avatars/?name=ToDelete")
        av_id = create_r.json()["avatar_id"]
        # Delete
        del_r = client.delete(f"/api/v1/avatars/{av_id}")
        assert del_r.status_code == 200
        assert del_r.json()["deleted"] is True

    def test_avatar_lora_ready_status(self):
        r = client.get("/api/v1/avatars/av1")
        assert r.json()["lora_ready"] is True

    def test_avatar_voice_assignment(self):
        r = client.get("/api/v1/avatars/av2")
        assert r.json()["voice_id"] == "adam"


# ── Generation ────────────────────────────────────────────────────────────────

class TestGeneration:
    def test_prompt_refine_returns_200(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "A woman speaking", "context": {"type": "avatar_animate"}})
        assert r.status_code == 200

    def test_prompt_refine_has_refined_prompt(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "sunset over ocean"})
        body = r.json()
        assert "refined_prompt" in body
        assert len(body["refined_prompt"]) > 0

    def test_prompt_refine_has_negative_prompt(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "portrait photo"})
        assert "negative_prompt" in r.json()

    def test_prompt_refine_has_style_tags(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "cinematic scene"})
        body = r.json()
        assert "style_tags" in body
        assert isinstance(body["style_tags"], list)
        assert len(body["style_tags"]) > 0

    def test_prompt_refine_detects_intent(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "hello", "context": {"type": "text2speech"}})
        assert r.json()["detected_intent"] == "text2speech"

    def test_prompt_refine_tts_text_for_speech(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "Hello world", "context": {"type": "text2speech"}})
        assert r.json()["tts_text"] == "Hello world"

    def test_prompt_refine_tts_null_for_video(self):
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": "A car chase", "context": {"type": "text2video"}})
        assert r.json()["tts_text"] is None

    def test_text2video_returns_200(self):
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "A sunset scene"})
        assert r.status_code == 200

    def test_text2video_has_job_id(self):
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "Forest"})
        body = r.json()
        assert "job_id" in body
        assert body["job_id"].startswith("job_")

    def test_text2video_status_done(self):
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "City"})
        assert r.json()["status"] == "done"

    def test_text2video_has_output(self):
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "Mountains"})
        assert "output" in r.json()
        assert "video_url" in r.json()["output"]

    def test_text2speech_returns_200(self):
        r = client.post("/api/v1/generate/text2speech",
            json={"text": "Hello world", "voice_id": "rachel"})
        assert r.status_code == 200

    def test_text2speech_has_audio_url(self):
        r = client.post("/api/v1/generate/text2speech",
            json={"text": "Test speech"})
        assert "audio_url" in r.json()["output"]

    def test_text2speech_voice_preserved(self):
        r = client.post("/api/v1/generate/text2speech",
            json={"text": "Voice test", "voice_id": "adam"})
        assert r.json()["output"]["voice_id"] == "adam"

    def test_image_gen_returns_200(self):
        r = client.post("/api/v1/generate/image",
            json={"prompt": "A beautiful landscape"})
        assert r.status_code == 200

    def test_image_gen_has_image_url(self):
        r = client.post("/api/v1/generate/image",
            json={"prompt": "Portrait"})
        assert "image_url" in r.json()["output"]

    def test_image_gen_url_is_string(self):
        r = client.post("/api/v1/generate/image",
            json={"prompt": "Abstract art"})
        assert isinstance(r.json()["output"]["image_url"], str)
        assert r.json()["output"]["image_url"].startswith("http")


# ── Jobs ──────────────────────────────────────────────────────────────────────

class TestJobs:
    def test_list_jobs_returns_200(self):
        r = client.get("/api/v1/jobs/")
        assert r.status_code == 200

    def test_list_jobs_has_jobs_key(self):
        r = client.get("/api/v1/jobs/")
        assert "jobs" in r.json()

    def test_list_jobs_has_pagination(self):
        r = client.get("/api/v1/jobs/")
        body = r.json()
        assert "page" in body
        assert "limit" in body
        assert "total" in body

    def test_list_jobs_default_page(self):
        r = client.get("/api/v1/jobs/")
        assert r.json()["page"] == 1

    def test_list_jobs_custom_limit(self):
        r = client.get("/api/v1/jobs/?limit=5")
        assert r.status_code == 200

    def test_job_created_after_generate(self):
        # Create a job via generate endpoint
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "Test scene"})
        job_id = r.json()["job_id"]

        # Fetch it
        r2 = client.get(f"/api/v1/jobs/{job_id}")
        assert r2.status_code == 200
        assert r2.json()["id"] == job_id

    def test_get_job_has_required_fields(self):
        # Create a job first
        r = client.post("/api/v1/generate/text2speech",
            json={"text": "Job field test"})
        job_id = r.json()["job_id"]
        r2 = client.get(f"/api/v1/jobs/{job_id}")
        body = r2.json()
        assert "id" in body
        assert "type" in body
        assert "status" in body
        assert "created_at" in body

    def test_get_job_not_found(self):
        r = client.get("/api/v1/jobs/nonexistent_job_id")
        assert r.status_code == 404

    def test_cancel_job(self):
        # Create a queued job via avatar creation
        r = client.post("/api/v1/avatars/?name=CancelTest")
        job_id = r.json()["job_id"]
        # Cancel it
        r2 = client.delete(f"/api/v1/jobs/{job_id}")
        assert r2.status_code == 200
        assert r2.json()["cancelled"] is True

    def test_cancel_nonexistent_job(self):
        r = client.delete("/api/v1/jobs/fake_job_id")
        assert r.status_code == 200  # graceful — returns True even if not found

    def test_job_type_recorded(self):
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "Type test"})
        job_id = r.json()["job_id"]
        r2 = client.get(f"/api/v1/jobs/{job_id}")
        assert r2.json()["type"] == "text2video"

    def test_speech_job_type(self):
        r = client.post("/api/v1/generate/text2speech",
            json={"text": "Type test"})
        job_id = r.json()["job_id"]
        r2 = client.get(f"/api/v1/jobs/{job_id}")
        assert r2.json()["type"] == "text2speech"

    def test_avatar_job_creates_lora_train_type(self):
        r = client.post("/api/v1/avatars/?name=LoraTest")
        job_id = r.json()["job_id"]
        r2 = client.get(f"/api/v1/jobs/{job_id}")
        assert r2.json()["type"] == "lora_train"


# ── Storage Status ────────────────────────────────────────────────────────────

class TestStorageStatus:
    def test_storage_status_returns_200(self):
        r = client.get("/api/v1/storage/status")
        assert r.status_code == 200

    def test_storage_status_has_postgres(self):
        r = client.get("/api/v1/storage/status")
        assert "postgres" in r.json()

    def test_storage_status_has_ai_nlp(self):
        r = client.get("/api/v1/storage/status")
        assert "ai_nlp" in r.json()

    def test_storage_status_has_tts(self):
        r = client.get("/api/v1/storage/status")
        assert "tts" in r.json()

    def test_tts_always_connected(self):
        r = client.get("/api/v1/storage/status")
        # Browser Web Speech API is always available
        assert r.json()["tts"]["connected"] is True

    def test_nlp_always_connected(self):
        r = client.get("/api/v1/storage/status")
        assert r.json()["ai_nlp"]["connected"] is True


# ── CORS ──────────────────────────────────────────────────────────────────────

class TestCORS:
    def test_cors_header_present(self):
        r = client.options("/health",
            headers={"Origin": "https://multimodal-platform-eight.vercel.app",
                    "Access-Control-Request-Method": "GET"})
        # CORS headers should be in response
        assert r.status_code in (200, 204)

    def test_health_accepts_any_origin(self):
        r = client.get("/health",
            headers={"Origin": "https://example.com"})
        assert r.status_code == 200


# ── Data Integrity ────────────────────────────────────────────────────────────

class TestDataIntegrity:
    def test_avatar_ids_are_unique(self):
        r1 = client.post("/api/v1/avatars/?name=Unique1")
        r2 = client.post("/api/v1/avatars/?name=Unique2")
        assert r1.json()["avatar_id"] != r2.json()["avatar_id"]

    def test_job_ids_are_unique(self):
        r1 = client.post("/api/v1/generate/text2speech", json={"text": "Test 1"})
        r2 = client.post("/api/v1/generate/text2speech", json={"text": "Test 2"})
        assert r1.json()["job_id"] != r2.json()["job_id"]

    def test_created_avatar_retrievable(self):
        r = client.post("/api/v1/avatars/?name=Retrievable")
        av_id = r.json()["avatar_id"]
        r2 = client.get(f"/api/v1/avatars/{av_id}")
        assert r2.status_code == 200
        assert r2.json()["name"] == "Retrievable"

    def test_job_appears_in_list(self):
        r = client.post("/api/v1/generate/text2video",
            json={"raw_prompt": "List test"})
        job_id = r.json()["job_id"]
        r2 = client.get("/api/v1/jobs/")
        job_ids = [j["id"] for j in r2.json()["jobs"]]
        assert job_id in job_ids

    def test_avatar_count_increases(self):
        r1 = client.get("/api/v1/avatars")
        initial = r1.json()["total"]
        client.post("/api/v1/avatars/?name=CountTest")
        r2 = client.get("/api/v1/avatars")
        assert r2.json()["total"] == initial + 1

    def test_refine_prompt_includes_input(self):
        prompt = "unique ocean sunset test phrase"
        r = client.post("/api/v1/generate/prompt-refine",
            json={"raw_prompt": prompt})
        # Refined prompt should contain some part of the input
        assert "ocean" in r.json()["refined_prompt"].lower() or \
               "sunset" in r.json()["refined_prompt"].lower()
