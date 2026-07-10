# VAPT Findings — Vault Notes

## Finding #1: SQL Injection – Authentication Bypass

**Severity:** Critical

**Location:** `POST /login`

**Vulnerability Class:** OWASP Top 10 — A03:2021 Injection

**Description:**
The login endpoint builds its SQL query by directly concatenating
user-supplied `username` and `password` values into the query string,
instead of using parameterized queries. This allows an attacker to
inject SQL syntax that alters the query's logic.

**Proof of Concept:**
Request body sent to `POST /login`:
```json
{
  "username": "' OR '1'='1' --",
  "password": "anything"
}
```

This transforms the intended query:
```sql
SELECT * FROM users WHERE username = '[input]' AND password = '[input]'
```
into:
```sql
SELECT * FROM users WHERE username = '' OR '1'='1' --' AND password = 'anything'
```
The `--` comments out the rest of the query, and `'1'='1'` is always
true, matching the first row in the `users` table regardless of actual
credentials. The server responded with a valid JWT token, granting
full authenticated access without knowing any real password.

**Impact:**
An attacker can log in as any user (typically the first account in the
database, often an admin in real systems) without knowing their
credentials, gaining full access to that account's private notes.

**Remediation:**
Use parameterized queries (prepared statements) for all database
operations, e.g.:
```javascript
const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
db.get(query, [username, password], ...);
```
This was in fact how the endpoint was originally implemented before
this vulnerability was intentionally introduced for this assessment.


## Finding #2: Insecure Direct Object Reference (IDOR) – Unauthorized Note Access

**Severity:** High

**Location:** `GET /notes/:id`

**Vulnerability Class:** OWASP Top 10 — A01:2021 Broken Access Control

**Description:**
The endpoint for retrieving a single note by ID checks that the
requester has a valid authentication token, but does not verify that
the note actually belongs to the authenticated user. Note IDs are
sequential integers, so any logged-in user can read any other user's
private notes simply by changing the ID in the URL.

**Proof of Concept:**
1. Created account `victim1`, logged in, and created a note via
   `POST /notes` with body:
```json
   { "title": "Victim Secret", "content": "My bank PIN is 4821" }
```
   Server responded with `noteId: 3`.

2. Created a separate, unrelated account `attacker1` and logged in,
   obtaining a valid token for this different account.

3. Sent `GET /notes/3` using the `attacker1` token (not victim1's).

4. Server responded with `200 OK` and returned victim1's full private
   note content:
```json
   {
     "id": 3,
     "user_id": 3,
     "title": "Victim Secret",
     "content": "My bank PIN is 4821"
   }
```

**Impact:**
Any authenticated user can enumerate note IDs (e.g. 1, 2, 3, 4...) to
read the private note content of every other user on the platform,
regardless of ownership. In a real deployment, this could expose
sensitive personal information at scale with minimal effort.

**Remediation:**
Always scope database lookups to the authenticated user's own ID,
e.g.:
```javascript
const query = `SELECT * FROM notes WHERE id = ? AND user_id = ?`;
db.get(query, [noteId, req.user.userId], ...);
```
This was in fact how the endpoint was originally implemented before
this vulnerability was intentionally introduced for this assessment.


## Finding #3: Stored Cross-Site Scripting (XSS) in Note Content

**Severity:** High

**Location:** Frontend rendering of note content (`NotesDashboard.tsx`), displaying data from `GET /notes`

**Vulnerability Class:** OWASP Top 10 — A03:2021 Injection (Cross-Site Scripting)

**Description:**
Note content is rendered directly into the page using React's
`dangerouslySetInnerHTML`, which injects raw HTML without escaping it.
Since note content is fully attacker-controlled (any user can type
anything into the content field), this allows stored JavaScript to
execute in the browser of anyone who views the note.

**Proof of Concept:**

Attempt 1 (blocked): a note was created with the content:
```html
<script>alert('XSS: this note ran JavaScript in your browser')</script>
```
This did not execute. Modern browsers silently strip `<script>` tags
inserted via `innerHTML` as a legacy protective measure, so this
payload, while confirming raw HTML was being injected, did not prove
active code execution on its own.

Attempt 2 (successful): a note was created with the content:
```html
<img src="x" onerror="alert('XSS: this note ran JavaScript in your browser')">
```
Since the image source `"x"` is invalid, the browser fires the
`onerror` event handler, which — unlike `<script>` tags — executes
normally when injected via `innerHTML`. Upon viewing the notes list,
a JavaScript alert popup fired immediately, confirming genuine script
execution triggered purely by note content.

**Impact:**
Any user can craft a note containing malicious JavaScript. If that
note were ever viewed by another user (e.g. in a shared or admin-
viewable context), the attacker's script would run in that victim's
browser session — capable of stealing their auth token from memory,
performing actions on their behalf, or redirecting them to a
malicious site. In this app's current single-user-view design the
practical blast radius is limited, but the underlying rendering flaw
is real and would become critical in any feature involving shared or
admin-visible notes.

**Remediation:**
Never use `dangerouslySetInnerHTML` for user-supplied content. Render
note content as plain text instead, which React escapes automatically:
```tsx
<p>{note.content}</p>
```
If rich text formatting is genuinely required, use a dedicated
sanitization library (e.g. DOMPurify) to strip dangerous tags/attributes
before rendering, rather than trusting raw user input.


## Finding #4: Plaintext Password Storage

**Severity:** Critical

**Location:** `users` table (SQLite database), used in `POST /signup` and `POST /login`

**Vulnerability Class:** OWASP Top 10 — A02:2021 Cryptographic Failures

**Description:**
User passwords are stored in the database exactly as entered at
signup, with no hashing or encryption applied. The login route also
compares passwords directly as plain strings. Anyone with access to
the database file (via a backup, a misconfigured server, another
vulnerability, or insider access) can read every user's real password
in cleartext, with no additional effort required.

**Proof of Concept:**
Querying the `users` table directly:
```javascript
db.all("SELECT id, username, password FROM users", (err, rows) => console.log(rows));
```
returned every user's password as plain, human-readable text:
[
  { id: 1, username: 'raghav', password: 'test2005' },
  { id: 2, username: 'Mahi Tripathi', password: '2004' },
  { id: 3, username: 'victim1', password: 'victimpass123' },
  { id: 4, username: 'attacker1', password: 'attackerpass123' }
]
**Impact:**
Since many people reuse passwords across services, a leaked database
here could let an attacker log into a victim's email, banking, or
other accounts elsewhere. This is one of the most damaging and common
real-world vulnerabilities, frequently responsible for large-scale
credential-stuffing attacks after data breaches.

**Remediation:**
Never store passwords in plaintext. Hash passwords using a slow,
purpose-built algorithm such as bcrypt before saving them, and compare
hashes (never raw passwords) during login:
```javascript
const bcrypt = require("bcrypt");

// at signup:
const hashedPassword = await bcrypt.hash(password, 10);
// store hashedPassword instead of the raw password

// at login:
const match = await bcrypt.compare(password, user.password);
if (!match) {
  return res.status(401).json({ error: "Invalid username or password" });
}
```
This ensures that even if the database is ever exposed, actual
passwords remain protected and cannot be trivially read.


## Finding #5: Hardcoded Secret Exposed in Frontend Code

**Severity:** Critical

**Location:** `frontend/src/api.ts`

**Vulnerability Class:** OWASP Top 10 — A02:2021 Cryptographic Failures / CWE-798 Use of Hard-coded Credentials

**Description:**
The backend's JWT signing secret was hardcoded directly into frontend
source code. Frontend code is bundled and shipped to every visitor's
browser, meaning any secret placed there is effectively public the
moment the site is deployed — regardless of any backend-side
protections. Additionally, since this project's repository is public
on GitHub, the secret is also permanently visible in the commit
history to anyone browsing the repository.

**Proof of Concept:**
1. Opened the live frontend application in Chrome DevTools → Sources
   tab, and located `src/api.ts` served in plain, unminified form,
   containing the literal string of the backend's JWT secret.
2. Navigated to the public GitHub repository and confirmed the same
   secret is visible directly in the file browser at
   `frontend/src/api.ts`, accessible to any visitor without
   authentication.

**Impact:**
Anyone with this secret can forge their own valid JWT tokens for any
user ID of their choosing — completely bypassing the login process
entirely, without needing a password, a SQL injection, or any other
vulnerability. This is effectively a master key to the entire
application's authentication system, and is arguably the most severe
finding in this assessment since it undermines the authentication
system at its root, regardless of any other fixes applied elsewhere.

**Remediation:**
- Never place backend secrets (API keys, signing secrets, database
  credentials) in frontend code under any circumstances.
- Store secrets only in backend environment variables (`.env`), which
  should always be excluded from version control via `.gitignore`.
- If a secret is ever accidentally committed to a public repository,
  treat it as compromised immediately: rotate/regenerate the secret,
  and consider the git history itself compromised unless properly
  scrubbed (e.g. via `git filter-repo` or repository recreation).