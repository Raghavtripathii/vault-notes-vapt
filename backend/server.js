require("dotenv").config();

const express = require("express");
const db = require("./db");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Vault Notes backend is alive!");
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;

  // basic check so we don't save empty accounts
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const query = `INSERT INTO users (username, password) VALUES (?, ?)`;

  db.run(query, [username, password], function (err) {
    if (err) {
      return res.status(400).json({ error: "That username is already taken" });
    }

    res.status(201).json({ message: "Account created!", userId: this.lastID });
  });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  // VULNERABLE ON PURPOSE: both username and password are glued directly
  // into the SQL string instead of using safe parameterized queries.
  // This lets an attacker manipulate the query logic itself, not just the data.
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.get(query, (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Something went wrong" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // user is legit, hand them a token proving who they are
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  });
});

app.post("/notes", authMiddleware, (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const query = `INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)`;

  db.run(query, [req.user.userId, title, content], function (err) {
    if (err) {
      return res.status(500).json({ error: "Could not save note" });
    }

    res.status(201).json({ message: "Note created!", noteId: this.lastID });
  });
});

app.get("/notes", authMiddleware, (req, res) => {
  const query = `SELECT * FROM notes WHERE user_id = ?`;

  db.all(query, [req.user.userId], (err, notes) => {
    if (err) {
      return res.status(500).json({ error: "Could not fetch notes" });
    }

    res.json(notes);
  });
});

app.get("/notes/:id", authMiddleware, (req, res) => {
  const noteId = req.params.id;
// VULNERABLE ON PURPOSE: removed the "AND user_id = ?" ownership check.
  const query = `SELECT * FROM notes WHERE id = ?`;

  db.get(query, [noteId], (err, note) => {
    if (err) {
      return res.status(500).json({ error: "Could not fetch note" });
    }

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});