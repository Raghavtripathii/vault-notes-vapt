require("dotenv").config();

const express = require("express");
const db = require("./db");
const jwt = require("jsonwebtoken");
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});