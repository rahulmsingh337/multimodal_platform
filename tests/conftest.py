"""
Shared test fixtures for backend tests.
"""

import sys
import os
import pytest

# Add backend-vercel to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend-vercel'))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../backend-vercel/api'))

from index import app, _avatars, _jobs
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    """Shared test client for all tests."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_in_memory_store():
    """Reset in-memory store before each test to ensure isolation."""
    # Save originals
    original_avatars = dict(_avatars)
    original_jobs = dict(_jobs)

    yield

    # Restore originals after test
    _avatars.clear()
    _avatars.update(original_avatars)
    _jobs.clear()
    _jobs.update(original_jobs)


@pytest.fixture
def demo_avatar_id():
    return "av1"


@pytest.fixture
def demo_avatar_name():
    return "Priya"


@pytest.fixture
def new_avatar(client):
    """Creates a fresh avatar and returns its ID."""
    r = client.post("/api/v1/avatars/?name=FixtureAvatar&voice_id=rachel")
    return r.json()["avatar_id"]


@pytest.fixture
def new_job(client):
    """Creates a TTS job and returns its ID."""
    r = client.post("/api/v1/generate/text2speech",
                    json={"text": "Fixture test speech", "voice_id": "rachel"})
    return r.json()["job_id"]
