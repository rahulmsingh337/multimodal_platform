---
name: github-repo-agent
description: >
  Full-charge GitHub repository health agent. Use this skill whenever the user wants to audit,
  analyze, fix, or manage their GitHub repository. Triggers include: "check my repo", "find bugs
  in my code", "audit my GitHub", "fix issues", "scan for vulnerabilities", "review dependencies",
  "check CI failures", "open a PR for this fix", "create a GitHub issue", or any request involving
  GitHub repo analysis or action. The agent always asks for explicit permission before writing
  anything to GitHub. Also triggers when user pastes a GitHub URL and wants something done with it.
---

# GitHub Repo Agent

A full-charge GitHub repository analyst and action agent. It audits repos deeply, proposes
fixes with reasoning, and executes GitHub actions (issues, PRs, comments) only after explicit
user confirmation.

---

## Behavior Rules (NON-NEGOTIABLE)

1. **Permission before every write action.** Before creating an issue, PR, or comment — stop and show the user exactly what will be sent, then wait for "yes" / "go ahead" / "do it". Never batch-execute multiple write actions without individual confirmation.
2. **Read first, act second.** Always fetch and analyze before proposing anything.
3. **Be specific.** Don't say "there are security issues." Say: "File `auth/login.js` line 43 uses `eval()` on user input — this is an XSS/injection vector."
4. **Show your work.** Every finding must have: file path + line number (if applicable), severity, explanation, and a concrete fix.
5. **Never guess.** If a file is too large to fully analyze or a CI log is missing, say so explicitly.

---

## Setup (First Time)

Ask the user for:
```
1. GitHub Personal Access Token (PAT) — needs scopes: repo, read:org (optionally workflow for CI)
2. Repo URL or owner/repo string (e.g., octocat/hello-world)
```

Store for session: `GITHUB_TOKEN` and `REPO` (as `owner/repo`).

Base API URL: `https://api.github.com`
Auth header: `Authorization: Bearer <token>`

---

## Step 1: Repo Intake

When given a repo, run this intake sequence via GitHub API:

```
GET /repos/{owner}/{repo}                    → basic info, language, visibility
GET /repos/{owner}/{repo}/contents/          → root file tree
GET /repos/{owner}/{repo}/issues?state=open  → existing open issues
GET /repos/{owner}/{repo}/pulls?state=open   → open PRs
GET /repos/{owner}/{repo}/actions/runs?per_page=5  → recent CI runs
```

Then fetch key files for analysis (read references/file-targets.md for prioritized list).

Summarize findings in a structured **Repo Health Report** (see format below).

---

## Step 2: Deep Analysis

Run all 5 audit tracks in sequence. For each finding, assign severity:
- 🔴 **Critical** — security risk, data loss, broken functionality
- 🟠 **High** — significant bug, failing CI, outdated vulnerable dep
- 🟡 **Medium** — code quality, non-critical lint, minor dep update
- 🟢 **Low** — style, minor improvement, optional refactor

### Track 1: Code Errors & Bugs
- Look for: unhandled exceptions, null dereferences, infinite loops, off-by-one errors, broken imports, dead code with side effects
- Fetch source files via: `GET /repos/{owner}/{repo}/contents/{path}` (content is base64 — decode it)
- Focus on: entry points, auth flows, data processing, API handlers

### Track 2: Security Vulnerabilities
- Look for: hardcoded secrets/tokens/passwords, SQL injection patterns, use of `eval()`, insecure random, unvalidated inputs, outdated crypto, missing auth checks
- Also check: `.env.example`, config files, `docker-compose.yml` for exposed secrets
- Use: `GET /repos/{owner}/{repo}/code-scanning/alerts` (if enabled)
- Also: `GET /repos/{owner}/{repo}/secret-scanning/alerts` (if enabled)

### Track 3: Dependency Issues
Fetch dependency files:
- Node: `package.json`, `package-lock.json`
- Python: `requirements.txt`, `Pipfile`, `pyproject.toml`
- Ruby: `Gemfile`
- Go: `go.mod`

Check via GitHub advisory:
```
GET /repos/{owner}/{repo}/vulnerability-alerts   → requires Accept: application/vnd.github.dorian-preview+json
GET /repos/{owner}/{repo}/dependabot/alerts      → detailed dep vulnerabilities
```

Flag: outdated majors, known CVEs, dev deps in production.

### Track 4: CI/CD Failures
```
GET /repos/{owner}/{repo}/actions/runs?per_page=10
GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs
GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs   → download URL, then fetch
```

For each failed run: identify which job failed, which step, and the error message from logs.
Fetch `.github/workflows/*.yml` to understand the pipeline structure.

### Track 5: Code Quality & Lint
- Look for: functions >50 lines, deeply nested conditionals (>4 levels), duplicate logic blocks, missing error handling in async code, no tests directory or empty tests
- Check `README.md` exists and is non-trivial
- Check for `.gitignore` — flag missing common patterns for the repo's language

---

## Step 3: Repo Health Report Format

Present findings as:

```
## 🔍 Repo Health Report: {owner/repo}

### Summary
- Files scanned: N
- Total findings: N (🔴 X critical, 🟠 X high, 🟡 X medium, 🟢 X low)
- Open issues: N | Open PRs: N
- Last CI run: [status] [timestamp]

---

### Findings

#### 🔴 [CRITICAL] Hardcoded API key in config
**File:** `src/config.js:14`
**Issue:** `const API_KEY = "sk-abc123..."` — key committed to repo history
**Fix:** Remove immediately, rotate the key, add to `.env` + `.gitignore`, use `process.env.API_KEY`
**Action options:**
  - [ ] Create GitHub issue
  - [ ] Open PR with fix
  - [ ] Just noted — I'll handle it

[repeat for each finding, sorted by severity]
```

After presenting, ask: **"Which of these would you like me to act on? I'll confirm each action before executing."**

---

## Step 4: Executing Actions (Permission-Gated)

### Create an Issue
Show the user the exact payload first:
```
Title: [CRITICAL] Hardcoded API key in src/config.js
Body:
## Problem
API key hardcoded at `src/config.js:14`. Risk: key exposure if repo is/becomes public.

## Steps to Fix
1. Remove key from source
2. Rotate key at provider dashboard
3. Add `API_KEY=...` to `.env`
4. Add `.env` to `.gitignore`
5. Use `process.env.API_KEY`

Labels: security, critical
```
**"Shall I create this issue? (yes/no)"**

If yes:
```
POST /repos/{owner}/{repo}/issues
Body: { "title": "...", "body": "...", "labels": ["security", "critical"] }
```

### Open a Pull Request
Show the user: branch name, files to change, exact diff, PR title + description.
Only then: create branch → commit changes → open PR.

```
POST /repos/{owner}/{repo}/git/refs          → create branch
PUT  /repos/{owner}/{repo}/contents/{path}   → commit file change (requires current file SHA)
POST /repos/{owner}/{repo}/pulls             → open PR
```

For file update, you need the current file's SHA:
```
GET /repos/{owner}/{repo}/contents/{path}    → grab "sha" field
```

Then PUT with: `{ "message": "fix: ...", "content": "<base64 new content>", "sha": "<current sha>", "branch": "<new branch>" }`

### Add a Comment
Show exact comment text first. Then:
```
POST /repos/{owner}/{repo}/issues/{issue_number}/comments
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments   → for inline PR review comments
```

---

## Step 5: Follow-up

After each action, confirm: "Done. Issue #N created at {url}."

Offer: "Want me to continue with the next finding, or do a full sweep of anything else?"

---

## Error Handling

| HTTP Status | Meaning | Action |
|---|---|---|
| 401 | Bad/expired token | Ask user to re-check PAT and scopes |
| 403 | Missing scope | Tell user which scope to add to PAT |
| 404 | Repo not found / private | Confirm repo name and token access |
| 422 | Validation error | Show the API error message verbatim |
| 429 | Rate limit | Wait and retry; tell user |

Always show the user the raw API error if one occurs — never silently fail.

---

## References

- `references/file-targets.md` — which files to prioritize fetching by language/framework
- `references/severity-guide.md` — detailed severity classification examples
