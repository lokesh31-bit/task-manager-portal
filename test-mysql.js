/**
 * Standalone MySQL Connection Test Script
 * Run this from the task-manager-portal directory:
 *   node test-mysql.js
 */

const mysql = require('mysql2/promise');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function testConnection() {
  console.log('=== MySQL Connection Tester ===\n');
  
  const host = await askQuestion('Enter MySQL Host (default: localhost): ') || 'localhost';
  const user = await askQuestion('Enter MySQL Username (default: root): ') || 'root';
  const password = await askQuestion('Enter MySQL Password: ');
  const database = await askQuestion('Enter MySQL Database (default: task_portal): ') || 'task_portal';
  
  rl.close();
  
  console.log('\nAttempting to connect to MySQL database...');
  console.log(`Config: ${user}@${host} -> DB: ${database}\n`);

  try {
    // 1. Establish connection to MySQL server
    const connection = await mysql.createConnection({
      host,
      user,
      password
    });

    console.log('✅ SUCCESS: Connected to MySQL server!');

    // 2. Check and create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    console.log(`✅ SUCCESS: Verified/Created database "${database}"!`);

    await connection.query(`USE \`${database}\`;`);

    // 3. Test simple query
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('✅ SUCCESS: Queried database tables. Current tables:', rows.map(r => Object.values(r)[0]));

    await connection.end();
    console.log('\n🎉 MySQL connection is fully working! You can use these credentials in your backend/.env file.');

  } catch (err) {
    console.error('\n❌ CONNECTION FAILED!');
    console.error(`Error Code: ${err.code}`);
    console.error(`Message: ${err.message}`);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure your MySQL80 service is running on your laptop.');
    console.log('2. Verify the username and password are correct.');
    console.log('3. Ensure your MySQL is running on default port 3306.');
  }
}

testConnection();
