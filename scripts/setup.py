#!/usr/bin/env python3
"""
MultiModal Platform — One-shot setup script
Connects Neon (Postgres) + Upstash (Redis) + Vercel env vars automatically.

Usage:
  pip install requests
  python3 scripts/setup.py

You'll be prompted for your tokens.
"""

import subprocess, json, sys, os

try:
    import requests
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

VERCEL_PROJECT_FRONTEND = "multimodal-platform"
VERCEL_PROJECT_BACKEND  = "multimodal-plat"
BACKEND_URL = "https://multimodal-plat.vercel.app"

def banner(msg):
    print(f"\n{'='*60}\n  {msg}\n{'='*60}")

def check_health(backend_url, database_url=None, redis_url=None):
    try:
        r = requests.get(f"{backend_url}/health", timeout=10)
        data = r.json()
        print(f"  Status:   {data.get('status')}")
        print(f"  Database: {data.get('database')}")
        print(f"  Cache:    {data.get('cache')}")
        print(f"  Storage:  {data.get('storage')}")
        return data
    except Exception as e:
        print(f"  ❌ Health check failed: {e}")
        return None

def set_vercel_env(token, project_id, team_id, key, value, targets=None):
    if targets is None:
        targets = ["production", "preview", "development"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    url = f"https://api.vercel.com/v10/projects/{project_id}/env?teamId={team_id}"
    payload = {"key": key, "value": value, "type": "encrypted", "target": targets}
    r = requests.post(url, headers=headers, json=payload)
    if r.status_code in (200, 201):
        print(f"  ✅ Set {key}")
    elif r.status_code == 409:
        print(f"  ⚠️  {key} already exists — update manually in Vercel dashboard")
    else:
        print(f"  ❌ Failed to set {key}: {r.text[:100]}")

def main():
    banner("MultiModal Platform Setup")

    print("\nThis script connects:")
    print("  • Neon (free Postgres)   → backend persistent storage")
    print("  • Upstash (free Redis)   → job queue caching")
    print("  • Vercel env vars        → auto-configured\n")

    print("Before running, create free accounts at:")
    print("  Neon:    https://neon.tech   (sign in with GitHub)")
    print("  Upstash: https://upstash.com (sign in with GitHub)\n")

    # Collect credentials
    vercel_token   = input("Vercel API token (account/tokens page, NOT vcp_): ").strip()
    team_id        = input("Vercel team ID (from project URL or 'rahul-singh-s-projects-9d848a7f'): ").strip()
    database_url   = input("Neon connection string (postgresql://user:pass@host/db): ").strip()
    redis_url      = input("Upstash Redis URL (redis://default:pass@host:port): ").strip()

    if not all([vercel_token, team_id, database_url, redis_url]):
        print("❌ All fields required")
        sys.exit(1)

    banner("Setting Backend Env Vars")
    backend_vars = {
        "DATABASE_URL": database_url,
        "REDIS_URL":    redis_url,
    }
    for k, v in backend_vars.items():
        set_vercel_env(vercel_token, VERCEL_PROJECT_BACKEND, team_id, k, v)

    banner("Triggering Backend Redeploy")
    headers = {"Authorization": f"Bearer {vercel_token}"}
    r = requests.get(f"https://api.vercel.com/v6/deployments?projectId={VERCEL_PROJECT_BACKEND}&teamId={team_id}&limit=1", headers=headers)
    if r.ok:
        latest = r.json().get("deployments", [{}])[0]
        deploy_id = latest.get("uid")
        if deploy_id:
            rd = requests.post(f"https://api.vercel.com/v13/deployments?teamId={team_id}",
                headers={**headers, "Content-Type":"application/json"},
                json={"deploymentId": deploy_id, "name": VERCEL_PROJECT_BACKEND})
            print(f"  Redeploy triggered: {rd.status_code}")

    banner("Health Check")
    print(f"\nChecking {BACKEND_URL}/health ...")
    check_health(BACKEND_URL)

    banner("Setup Complete")
    print("\n✅ Next steps:")
    print("  1. Wait ~60s for redeploy to finish")
    print(f"  2. Visit {BACKEND_URL}/health — should show 'neon-postgres' + 'upstash-redis'")
    print(f"  3. Visit {BACKEND_URL}/docs — Swagger API explorer")
    print("  4. Add API keys to Vercel for real generation:")
    print("     OPENAI_API_KEY, REPLICATE_API_TOKEN, ELEVENLABS_API_KEY")
    print("\n🌐 Frontend: https://multimodal-platform-eight.vercel.app")
    print(f"🔌 Backend:  {BACKEND_URL}")

if __name__ == "__main__":
    main()
