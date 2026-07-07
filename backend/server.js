const express = require("express");
const db = require("./db");
const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Vault Notes backend is alive!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});