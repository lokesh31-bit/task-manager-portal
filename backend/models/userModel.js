const { db } = require('../config/db');

const User = {
  create: async (username, hashedPassword) => {
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    const result = await db.execute(sql, [username, hashedPassword]);
    return result.insertId;
  },

  findByUsername: async (username) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    const rows = await db.query(sql, [username]);
    return rows[0] || null;
  },

  findById: async (id) => {
    const sql = 'SELECT id, username, created_at FROM users WHERE id = ?';
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }
};

module.exports = User;
