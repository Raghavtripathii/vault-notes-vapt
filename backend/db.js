const sqlite3 = require("sqlite3").verbose();

// right here in the backend folder. That file IS our database.
const db = new sqlite3.Database("./vault.db");

// Set up our two tables the first time this file runs.
// "CREATE TABLE IF NOT EXISTS" means: only create it if it's not already there,
// so restarting the server doesn't wipe our data every time.
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL
    )
  `);
});

module.exports = db;