const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

let dbClient = null;
let dbType = 'sqlite'; // Default fallback

// Helper to normalize query interface
const db = {
  dbType: () => dbType,
  
  // SELECT queries
  query: async (sql, params = []) => {
    if (dbType === 'mysql') {
      const [rows] = await dbClient.execute(sql, params);
      return rows;
    } else {
      return new Promise((resolve, reject) => {
        dbClient.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  },

  // INSERT/UPDATE/DELETE queries
  execute: async (sql, params = []) => {
    if (dbType === 'mysql') {
      const [result] = await dbClient.execute(sql, params);
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    } else {
      return new Promise((resolve, reject) => {
        dbClient.run(sql, params, function (err) {
          if (err) reject(err);
          else {
            resolve({
              insertId: this.lastID,
              affectedRows: this.changes
            });
          }
        });
      });
    }
  },

  close: async () => {
    if (dbType === 'mysql' && dbClient) {
      await dbClient.end();
    } else if (dbType === 'sqlite' && dbClient) {
      await new Promise((resolve, reject) => {
        dbClient.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
};

async function initializeDatabase() {
  const useMysql = process.env.DB_TYPE === 'mysql';
  
  if (useMysql) {
    console.log('Attempting to connect to MySQL database (pool)...');
    try {
      // Use a connection pool instead of a single connection.
      // This prevents "Failed to update status" errors caused by stale/dropped
      // connections after MySQL's wait_timeout elapses.
      dbClient = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'task_portal',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      });
      dbType = 'mysql';

      // Verify the pool works immediately
      const conn = await dbClient.getConnection();
      console.log('Successfully connected to MySQL database (pool).');
      conn.release();
    } catch (err) {
      console.warn(`MySQL connection failed: ${err.message}. Falling back to SQLite...`);
      dbClient = null;
      dbType = 'sqlite';
    }
  }

  if (dbType === 'sqlite') {
    const dbPath = path.resolve(__dirname, '../database.sqlite');
    console.log(`Using SQLite database at: ${dbPath}`);
    
    dbClient = new sqlite3.Database(dbPath);
    dbType = 'sqlite';
  }

  // Create tables if they do not exist
  try {
    if (dbType === 'mysql') {
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
      `);
      
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
      `);
    } else {
      // SQLite Schema
      dbClient.serialize(() => {
        dbClient.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        dbClient.run(`
          CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);
      });
    }
    console.log('Database tables verified/created successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err.message);
    throw err;
  }
}

module.exports = {
  db,
  initializeDatabase
};
