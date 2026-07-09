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