const express = require("express");
const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Vault Notes backend is alive!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});