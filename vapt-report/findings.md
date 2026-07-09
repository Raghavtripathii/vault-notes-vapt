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