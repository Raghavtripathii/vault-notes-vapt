require("dotenv").config();

const express = require("express");
const db = require("./db");
const jwt = require("jsonwebtoken");
const authMiddleware = require("./authMiddleware");
const app = express();

app.use(express.json());

const PORT = 3000;

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

  const query = `SELECT * FROM users WHERE username = ?`;

  db.get(query, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Something went wrong" });
    }

    if (!user || user.password !== password) {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});