"""
End-to-End Integration Tests
Tests the full stack against live deployed URLs.
Run: pytest tests/e2e/test_e2e.py -v --timeout=60

Requirements:
  pip install pytest requests pytest-timeout
"""

import pytest
import requests
import json
import time
import os

# Skip E2E tests if network is blocked (CI sandbox environment)
def is_network_available(url='https://multimodal-plat.vercel.app/health'):
    try:
        r = requests.get(url, timeout=5)
        return r.status_code != 403
    except Exception:
        return False

network_available = is_network_available()
skip_if_no_network = pytest.mark.skipif(
    not network_available,
    reason='Live network not available (sandbox environment)'
)

FRONTEND_URL = "https://multimodal-platform-eight.vercel.app"
BACKEND_URL  = "https://multimodal-plat.vercel.app"
TIMEOUT      = 20


# ── Connectivity ──────────────────────────────────────────────────────────────

@skip_if_no_network
class TestConnectivity:
    def test_frontend_is_reachable(self):
        r = requests.get(FRONTEND_URL, timeout=TIMEOUT, allow_redirects=True)
        assert r.status_code in (200, 302, 307), f"Frontend returned {r.status_code}"

    def test_backend_is_reachable(self):
        r = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        assert r.status_code == 200, f"Backend returned {r.status_code}"

    def test_backend_returns_json(self):
        r = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        data = r.json()
        assert isinstance(data, dict)

    def test_docs_are_accessible(self):
        r = requests.get(f"{BACKEND_URL}/docs", timeout=TIMEOUT)
        assert r.status_code == 200
        assert "swagger" in r.text.lower() or "openapi" in r.text.lower()

    def test_openapi_json_accessible(self):
        r = requests.get(f"{BACKEND_URL}/openapi.json", timeout=TIMEOUT)
        assert r.status_code == 200
        spec = r.json()
        assert "openapi" in spec or "swagger" in spec
        assert "paths" in spec


# ── Health Endpoint ───────────────────────────────────────────────────────────

@skip_if_no_network
class TestHealthEndpoint:
    def test_health_status_ok(self):
        r = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        assert r.json()["status"] == "ok"

    def test_health_version(self):
        r = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        assert r.json()["version"] == "1.0.0"

    def test_health_timestamp_present(self):
        r = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        assert "timestamp" in r.json()

    def test_health_database_field(self):
        r = requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        assert "database" in r.json()

    def test_health_response_time_under_10s(self):
        start = time.time()
        requests.get(f"{BACKEND_URL}/health", timeout=TIMEOUT)
        elapsed = time.time() - start
        assert elapsed < 10, f"Health check took {elapsed:.1f}s (too slow)"


# ── CORS ──────────────────────────────────────────────────────────────────────

@skip_if_no_network
class TestCORS:
    def test_cors_allows_frontend_origin(self):
        r = requests.get(f"{BACKEND_URL}/health",
            headers={"Origin": FRONTEND_URL},
            timeout=TIMEOUT)
        assert r.status_code == 200

    def test_cors_header_present(self):
        r = requests.options(f"{BACKEND_URL}/health",
            headers={
                "Origin": FRONTEND_URL,
                "Access-Control-Request-Method": "GET",
            },
            timeout=TIMEOUT)
        # Should allow cross-origin
        assert r.status_code in (200, 204)


# ── Avatars API (Live) ────────────────────────────────────────────────────────

@skip_if_no_network
class TestAvatarsLive:
    def test_list_avatars_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/avatars", timeout=TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert "avatars" in data
        assert "total" in data

    def test_demo_avatars_present_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/avatars", timeout=TIMEOUT)
        names = [a["name"] for a in r.json()["avatars"]]
        assert "Priya" in names

    def test_get_avatar_by_id_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/avatars/av1", timeout=TIMEOUT)
        assert r.status_code == 200
        assert r.json()["name"] == "Priya"

    def test_avatar_not_found_returns_404_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/avatars/does_not_exist", timeout=TIMEOUT)
        assert r.status_code == 404

    def test_create_avatar_live(self):
        r = requests.post(
            f"{BACKEND_URL}/api/v1/avatars/",
            params={"name": "E2ETestAvatar", "voice_id": "rachel"},
            timeout=TIMEOUT
        )
        assert r.status_code == 200
        body = r.json()
        assert "avatar_id" in body
        assert "job_id" in body
        assert body["status"] == "queued"

    def test_animate_avatar_live(self):
        r = requests.post(
            f"{BACKEND_URL}/api/v1/avatars/av1/animate",
            params={"text": "E2E test speech", "voice_id": "rachel"},
            timeout=TIMEOUT
        )
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "done"
        assert "video_url" in body["output"]


# ── Generation API (Live) ─────────────────────────────────────────────────────

@skip_if_no_network
class TestGenerationLive:
    def test_prompt_refine_live(self):
        r = requests.post(f"{BACKEND_URL}/api/v1/generate/prompt-refine",
            json={"raw_prompt": "A woman at sunset", "context": {"type": "avatar_animate"}},
            timeout=TIMEOUT)
        assert r.status_code == 200
        body = r.json()
        assert "refined_prompt" in body
        assert "negative_prompt" in body
        assert "style_tags" in body
        assert "detected_intent" in body

    def test_prompt_refine_detects_speech_intent_live(self):
        r = requests.post(f"{BACKEND_URL}/api/v1/generate/prompt-refine",
            json={"raw_prompt": "Say hello", "context": {"type": "text2speech"}},
            timeout=TIMEOUT)
        assert r.status_code == 200
        assert r.json()["tts_text"] == "Say hello"

    def test_text2video_live(self):
        r = requests.post(f"{BACKEND_URL}/api/v1/generate/text2video",
            json={"raw_prompt": "E2E test video"},
            timeout=TIMEOUT)
        assert r.status_code == 200
        body = r.json()
        assert "job_id" in body
        assert body["status"] == "done"

    def test_text2speech_live(self):
        r = requests.post(f"{BACKEND_URL}/api/v1/generate/text2speech",
            json={"text": "E2E test speech", "voice_id": "rachel"},
            timeout=TIMEOUT)
        assert r.status_code == 200
        assert "audio_url" in r.json()["output"]

    def test_image_gen_live(self):
        r = requests.post(f"{BACKEND_URL}/api/v1/generate/image",
            json={"prompt": "E2E test image"},
            timeout=TIMEOUT)
        assert r.status_code == 200
        assert "image_url" in r.json()["output"]
        assert r.json()["output"]["image_url"].startswith("http")


# ── Jobs API (Live) ───────────────────────────────────────────────────────────

@skip_if_no_network
class TestJobsLive:
    def test_list_jobs_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/jobs/", timeout=TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert "jobs" in data
        assert "total" in data

    def test_job_created_and_retrievable_live(self):
        # Create a job
        create_r = requests.post(f"{BACKEND_URL}/api/v1/generate/text2speech",
            json={"text": "Job retrieval test"},
            timeout=TIMEOUT)
        job_id = create_r.json()["job_id"]

        # Retrieve it
        get_r = requests.get(f"{BACKEND_URL}/api/v1/jobs/{job_id}", timeout=TIMEOUT)
        assert get_r.status_code == 200
        assert get_r.json()["id"] == job_id

    def test_job_not_found_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/jobs/fake_job_xyz", timeout=TIMEOUT)
        assert r.status_code == 404

    def test_cancel_job_live(self):
        # Create a job via avatar (gets queued)
        create_r = requests.post(
            f"{BACKEND_URL}/api/v1/avatars/",
            params={"name": "CancelE2ETest"},
            timeout=TIMEOUT)
        job_id = create_r.json()["job_id"]

        # Cancel it
        cancel_r = requests.delete(f"{BACKEND_URL}/api/v1/jobs/{job_id}", timeout=TIMEOUT)
        assert cancel_r.status_code == 200
        assert cancel_r.json()["cancelled"] is True


# ── Storage Status (Live) ─────────────────────────────────────────────────────

@skip_if_no_network
class TestStorageLive:
    def test_storage_status_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/storage/status", timeout=TIMEOUT)
        assert r.status_code == 200
        data = r.json()
        assert "postgres" in data
        assert "ai_nlp" in data
        assert "tts" in data

    def test_tts_connected_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/storage/status", timeout=TIMEOUT)
        assert r.json()["tts"]["connected"] is True

    def test_nlp_connected_live(self):
        r = requests.get(f"{BACKEND_URL}/api/v1/storage/status", timeout=TIMEOUT)
        assert r.json()["ai_nlp"]["connected"] is True


# ── Full Pipeline Flow ────────────────────────────────────────────────────────

@skip_if_no_network
class TestFullPipelineFlow:
    def test_complete_tts_pipeline(self):
        """Full flow: refine prompt → generate speech → verify job"""
        # Step 1: Refine prompt
        refine_r = requests.post(f"{BACKEND_URL}/api/v1/generate/prompt-refine",
            json={"raw_prompt": "Hello, welcome to our platform", "context": {"type": "text2speech"}},
            timeout=TIMEOUT)
        assert refine_r.status_code == 200
        tts_text = refine_r.json()["tts_text"]
        assert tts_text is not None

        # Step 2: Generate speech
        speech_r = requests.post(f"{BACKEND_URL}/api/v1/generate/text2speech",
            json={"text": tts_text, "voice_id": "rachel"},
            timeout=TIMEOUT)
        assert speech_r.status_code == 200
        job_id = speech_r.json()["job_id"]

        # Step 3: Verify job exists
        job_r = requests.get(f"{BACKEND_URL}/api/v1/jobs/{job_id}", timeout=TIMEOUT)
        assert job_r.status_code == 200
        assert job_r.json()["type"] == "text2speech"
        assert job_r.json()["status"] == "done"

    def test_complete_avatar_pipeline(self):
        """Full flow: create avatar → animate → verify output"""
        # Step 1: Create avatar
        create_r = requests.post(
            f"{BACKEND_URL}/api/v1/avatars/",
            params={"name": "PipelineTest", "voice_id": "rachel"},
            timeout=TIMEOUT)
        assert create_r.status_code == 200
        av_id = create_r.json()["avatar_id"]

        # Step 2: Animate it (using built-in av1 which is ready)
        anim_r = requests.post(
            f"{BACKEND_URL}/api/v1/avatars/av1/animate",
            params={"text": "Pipeline test speech"},
            timeout=TIMEOUT)
        assert anim_r.status_code == 200
        assert anim_r.json()["status"] == "done"
        assert "video_url" in anim_r.json()["output"]

    def test_complete_image_pipeline(self):
        """Full flow: refine prompt → generate image → verify output"""
        # Step 1: Refine
        refine_r = requests.post(f"{BACKEND_URL}/api/v1/generate/prompt-refine",
            json={"raw_prompt": "Portrait of a professional", "context": {"type": "image_gen"}},
            timeout=TIMEOUT)
        assert refine_r.status_code == 200
        refined = refine_r.json()["refined_prompt"]
        assert len(refined) > 0

        # Step 2: Generate
        img_r = requests.post(f"{BACKEND_URL}/api/v1/generate/image",
            json={"prompt": refined},
            timeout=TIMEOUT)
        assert img_r.status_code == 200
        assert img_r.json()["output"]["image_url"].startswith("http")
