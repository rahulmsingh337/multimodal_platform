# File Fetch Priority by Language/Framework

When scanning a repo, fetch files in this priority order based on the primary language detected.

---

## Node.js / JavaScript / TypeScript
1. `package.json`
2. `.env.example`, `.env` (if accidentally committed)
3. `src/index.js` or `src/app.js` or `server.js`
4. `src/auth/**` or `src/middleware/**`
5. `src/routes/**` or `src/api/**`
6. `.github/workflows/*.yml`
7. `Dockerfile`, `docker-compose.yml`
8. `README.md`
9. `.gitignore`
10. `tsconfig.json` (TypeScript)

## Python
1. `requirements.txt` or `pyproject.toml` or `Pipfile`
2. `main.py` or `app.py` or `manage.py`
3. `config.py` or `settings.py`
4. `auth/` or `authentication/`
5. `.github/workflows/*.yml`
6. `Dockerfile`
7. `README.md`
8. `.gitignore`
9. `setup.py` or `setup.cfg`

## Go
1. `go.mod`, `go.sum`
2. `main.go`
3. `cmd/**`
4. `internal/auth/**` or `pkg/auth/**`
5. `.github/workflows/*.yml`
6. `Dockerfile`
7. `README.md`

## Ruby / Rails
1. `Gemfile`, `Gemfile.lock`
2. `config/application.rb`
3. `config/database.yml`
4. `app/controllers/application_controller.rb`
5. `config/routes.rb`
6. `.github/workflows/*.yml`
7. `Dockerfile`
8. `README.md`
9. `.gitignore`

## Java / Kotlin
1. `pom.xml` or `build.gradle`
2. `src/main/resources/application.properties` or `application.yml`
3. Main application class
4. Security config classes
5. `.github/workflows/*.yml`

## PHP
1. `composer.json`, `composer.lock`
2. `index.php` or `public/index.php`
3. `.env.example`
4. Config files
5. `.github/workflows/*.yml`

---

## Universal — Always Check
- `.github/workflows/*.yml` — CI/CD pipelines
- `Dockerfile`, `docker-compose.yml` — container config
- `.gitignore` — check for missing entries
- `README.md` — completeness check
- Any file named `config.*`, `settings.*`, `secrets.*`
- `CHANGELOG.md` or `SECURITY.md`

## Red Flags (Fetch Immediately If Found)
- `.env` file in root (should never be committed)
- `credentials.json`, `keyfile.json` (GCP keys)
- `*.pem`, `*.key`, `id_rsa` (SSH/TLS keys)
- `secrets.yml`, `secrets.json`
