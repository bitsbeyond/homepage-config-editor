const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use the same data directory as the application
const DATA_DIR = process.env.EDITOR_DATA_DIR || '/data';
const DB_PATH = path.join(DATA_DIR, 'editor.db');

console.log(`Connecting to database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');
});

// Check the current state of the test user
const email = 'pplatteel@reversalcoaching.com';

db.get('SELECT email, failed_login_attempts, locked_until FROM users WHERE email = ?', [email], (err, row) => {
  if (err) {
    console.error('Error querying database:', err.message);
  } else if (row) {
    console.log('\n=== Current User State ===');
    console.log(`Email: ${row.email}`);
    console.log(`Failed Login Attempts: ${row.failed_login_attempts}`);
    console.log(`Locked Until: ${row.locked_until}`);
    
    if (row.locked_until) {
      const lockedUntil = new Date(row.locked_until);
      const now = new Date();
      const isLocked = now < lockedUntil;
      console.log(`Is Currently Locked: ${isLocked}`);
      if (isLocked) {
        const minutesRemaining = Math.ceil((lockedUntil - now) / (1000 * 60));
        console.log(`Minutes Remaining: ${minutesRemaining}`);
      }
    } else {
      console.log('Is Currently Locked: false');
    }
  } else {
    console.log(`User ${email} not found in database`);
  }
  
  // Reset the user for testing
  console.log('\n=== Resetting User for Testing ===');
  db.run('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ?', [email], function(err) {
    if (err) {
      console.error('Error resetting user:', err.message);
    } else {
      console.log(`Reset user ${email} - attempts cleared, lockout removed`);
    }
    
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
    });
  });
});