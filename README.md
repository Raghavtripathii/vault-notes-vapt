# Vault Notes — Build-It, Break-It, Report-It VAPT Project

A full-stack notes-taking application that I built securely from scratch, then deliberately
re-introduced five real vulnerabilities into, exploited each one manually, and documented
in a professional penetration testing report.

This project exists to demonstrate the full vulnerability lifecycle from a developer's
perspective: **secure implementation → intentional vulnerability introduction → manual
exploitation → professional-grade reporting** — rather than just testing a pre-built
vulnerable app like OWASP Juice Shop.

📄 **[Read the full VAPT Report (PDF)](./vapt-report/Vault_Notes_VAPT_Report.pdf)**

🔗 **Live Demo:** [vault-notes-frontend-gules.vercel.app](https://vault-notes-frontend-gules.vercel.app) — passcode-gated; see note below.

---

## Why this project exists

Most beginner security portfolios show a writeup against an app someone else built
(Juice Shop, DVWA, etc.). This project instead shows the vulnerability from **both sides**:
the exact secure code that existed before, and the exact change that broke it — visible
directly in the commit history — followed by a real exploitation and a report written the
way a junior VAPT analyst would deliver one to a client.

## Tech Stack

**Backend:** Node.js, Express, SQLite, JWT (jsonwebtoken), CORS
**Frontend:** React, TypeScript, Vite, Axios
**Deployment:** Vercel (frontend), Render (backend)
**Testing tool used:** Postman (manual request crafting and exploitation)

## Features

- User signup & login with JWT-based authentication
- Protected REST API endpoints (create note, list notes, get note by ID)
- React/TypeScript frontend with a notes dashboard

## Vulnerabilities — Introduced, Exploited & Documented

| # | Vulnerability | Severity | OWASP Category |
|---|---|---|---|
| 1 | SQL Injection — Authentication Bypass | Critical | A03:2021 Injection |
| 2 | IDOR — Unauthorized Note Access | High | A01:2021 Broken Access Control |
| 3 | Stored XSS in Note Content | High | A03:2021 Injection |
| 4 | Plaintext Password Storage | Critical | A02:2021 Cryptographic Failures |
| 5 | Hardcoded Secret Exposed in Frontend | Critical | A02:2021 Cryptographic Failures / CWE-798 |

Full technical detail — proof-of-concept requests, exact payloads, impact analysis, and
remediation code — for every finding is in the
**[VAPT Report](./vapt-report/Vault_Notes_VAPT_Report.pdf)** and in
**[findings.md](./vapt-report/findings.md)**.

Each vulnerability was introduced in its own dedicated commit, clearly labeled `VULN:` in
the commit message, with the original secure implementation visible in the commit
immediately before it — so the exact before/after of each flaw is traceable in the
[commit history](../../commits/main).

## Methodology

Testing was performed manually and iteratively:
1. Reason about the vulnerability class at the code level
2. Deliberately introduce it in an isolated, labeled commit
3. Craft a proof-of-concept request in Postman to confirm real exploitability
4. Document severity, impact, and remediation immediately after confirming the exploit

This mirrors a genuine white-box penetration testing workflow, scoped to a self-built
application for learning purposes.

## Running Locally

**Backend:**
```bash
cd backend
npm install
node server.js
```
Runs on `http://localhost:3000`. Requires a `.env` file with `JWT_SECRET=<any-value>`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Deployment & Access

This application is intentionally exploitable, so the live demo is access-gated rather
than left open to the public internet — the same way a real client engagement
environment would be scoped and access-controlled. Frontend and backend are deployed
separately (a static frontend vs. a persistent Node process for the SQLite-backed API),
with `JWT_SECRET` set as an environment variable on the backend host.

On the live deployment, Finding #5 (the exposed secret) can also be confirmed directly
in the browser console by running `window.__leakedJwtSecret` — a slightly more realistic
demonstration than source-file inspection alone, since it requires no code-reading at all.

> ⚠️ **Note:** This application contains intentional security vulnerabilities and is for
> educational/portfolio purposes only. Do not reuse any code from it in a production
> system without applying the remediations documented in the report.

## Possible Extensions

- Re-run the exploitation using Burp Suite in place of Postman, for broader tooling coverage
- Introduce a CORS misconfiguration and session-handling weakness as additional findings
- Add role-based access (admin vs. standard user) to demonstrate privilege escalation

## Author

**Raghvendra Tripathi**
[github.com/Raghavtripathii](https://github.com/Raghavtripathii)