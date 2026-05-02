# Severity Classification Guide

Use this to calibrate severity ratings consistently.

---

## 🔴 Critical

Assign when the finding could cause: security breach, data loss, authentication bypass, remote code execution, or exposed secrets.

Examples:
- Hardcoded API keys, passwords, tokens in source code
- `eval()` called on user-supplied input
- SQL query built with string concatenation from user input (SQL injection)
- Auth check missing on a protected route
- Private key or `.env` file committed to repo
- Dependency with known CVE rated CVSS ≥ 9.0
- CI workflow that uses `pull_request_target` with checkout of untrusted code (GitHub Actions pwn request)
- Command injection (`exec(user_input)`, `os.system(user_input)`)

---

## 🟠 High

Assign when the finding could cause: functional breakage, significant data exposure, or serious performance degradation — but not immediate compromise.

Examples:
- Unhandled promise rejections / uncaught exceptions in critical paths
- Missing input validation on API endpoints (but not direct injection risk)
- Dependency with CVE rated CVSS 7.0–8.9
- Outdated major version with known breaking security changes (e.g., `express 3.x`)
- Failing CI on main/master branch
- Race condition in concurrent code
- Memory leak in a long-running process
- Insecure direct object reference (IDOR) risk
- Password stored as MD5 or plain SHA1

---

## 🟡 Medium

Assign when the finding is a real problem but doesn't create immediate risk.

Examples:
- `console.log` statements with potentially sensitive data left in production code
- Deprecated API usage that will break in the next major version
- Test coverage < 20% on critical modules
- Function > 100 lines with no clear decomposition
- Outdated dependency (minor version, no known CVE)
- TODO/FIXME comments in auth or payment code
- Inconsistent error handling (some errors caught, others not)
- Missing `.gitignore` entries for common build artifacts or IDE files
- README missing installation instructions

---

## 🟢 Low

Assign when the finding is a code quality or style issue with no functional impact.

Examples:
- Unused imports or variables
- Function > 50 lines (but < 100)
- Nesting depth > 4 levels
- Missing JSDoc / docstrings on exported functions
- Inconsistent naming conventions
- Dead code (unreachable but harmless)
- Duplicate utility functions
- Missing `CHANGELOG.md` or `CONTRIBUTING.md`
- Overly permissive CORS (`*`) in a dev config that's not used in production

---

## Escalation Rule

If you're between two severities, ask: **"Could this be exploited or cause data loss with one more step?"**
- Yes → go higher
- No → go lower
