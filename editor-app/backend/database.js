const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing

// Determine data directory: Use EDITOR_DATA_DIR env var if set, otherwise default to /data (for Docker)
const DATA_DIR = process.env.EDITOR_DATA_DIR || '/data';
console.log(`Using data directory: ${DATA_DIR}`); // Log the directory being used

// Database file path
const DB_PATH = path.join(DATA_DIR, 'editor.db');

let db = null; // Singleton database connection instance

/**
 * Initializes the SQLite database connection and ensures the users table exists.
 * Creates the /data directory if it doesn't exist.
 */
async function initDatabase() {
  try {
    // Ensure the /data directory exists (Docker should create the volume, but let's be safe)
    try {
      await fs.access(DATA_DIR);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`Data directory ${DATA_DIR} not found, attempting to create.`);
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log(`Data directory ${DATA_DIR} created.`);
      } else {
        throw error; // Re-throw other access errors
      }
    }

    // Connect to the database (creates the file if it doesn't exist)
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error connecting to SQLite database:', err.message);
        throw err; // Throw error to prevent server start if DB connection fails
      }
      console.log(`Connected to the SQLite database at ${DB_PATH}`);
    });

    // Use Promise wrapper for database operations for async/await compatibility
    const dbRun = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) { // Use function() to access `this` if needed (e.g., lastID)
          if (err) {
            console.error('Database run error:', err.message);
            reject(err);
          } else {
            resolve(this); // Resolve with the statement object
          }
        });
      });
    };

    // Create the users table if it doesn't exist
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('Admin', 'User')) DEFAULT 'User',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME NULL
      );
    `;

    await dbRun(createTableSql);
    console.log("Checked/Ensured 'users' table exists.");

    // Add new columns for account lockout if they don't exist (for existing databases)
    try {
      await dbRun('ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0');
      console.log("Added failed_login_attempts column to users table.");
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log("failed_login_attempts column already exists.");
      } else {
        console.error("Error adding failed_login_attempts column:", error);
      }
    }

    try {
      await dbRun('ALTER TABLE users ADD COLUMN locked_until DATETIME NULL');
      console.log("Added locked_until column to users table.");
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log("locked_until column already exists.");
      } else {
        console.error("Error adding locked_until column:", error);
      }
    }

    // Optional: Add indexes for performance later if needed
    // await dbRun('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);');

  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Exit the process if database initialization fails critically
    process.exit(1);
  }
}

/**
 * Returns the database connection instance.
 * Throws an error if the database is not initialized.
 */
function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// --- Promise-based DB method wrappers ---

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb(); // Get current DB instance
    db.run(sql, params, function (err) {
      if (err) {
        console.error('Database run error:', sql, params, err.message);
        reject(err);
      } else {
        resolve(this); // Resolve with the statement object (contains lastID, changes)
      }
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Database get error:', sql, params, err.message);
        reject(err);
      } else {
        resolve(row); // Resolve with the row object or undefined
      }
    });
  });
};

// --- User Management Functions ---

/**
 * Counts the total number of users in the database.
 * @returns {Promise<number>} The number of users.
 */
async function countUsers() {
  const sql = 'SELECT COUNT(*) as count FROM users';
  const row = await dbGet(sql);
  return row ? row.count : 0;
}

/**
 * Creates the initial administrator user.
 * Only succeeds if there are no existing users.
 * Hashes the password using bcrypt.
 * @param {string} email - The admin's email address.
 * @param {string} password - The admin's plain text password.
 * @returns {Promise<{id: number, email: string, role: string}>} The created user object.
 * @throws {Error} If users already exist or if there's a database error.
 */
async function createInitialAdmin(email, password) {
  const userCount = await countUsers();
  if (userCount > 0) {
    throw new Error('Cannot create initial admin user; users already exist.');
  }

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  // Hash the password
  const saltRounds = 10; // Recommended salt rounds
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const sql = `
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, ?)
  `;
  const params = [email, passwordHash, 'Admin']; // Explicitly set role to Admin

  try {
    const result = await dbRun(sql, params);
    console.log(`Initial admin user created successfully with ID: ${result.lastID}`);
    return { id: result.lastID, email: email, role: 'Admin' };
  } catch (error) {
    console.error('Error creating initial admin user:', error);
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.email')) {
        throw new Error('Email address already exists.'); // Should not happen if countUsers is correct, but good practice
    }
    throw new Error('Failed to create initial admin user.'); // Generic error for other DB issues
  }
}


/**
 * Finds a user by their email address.
 * @param {string} email - The email address to search for.
 * @returns {Promise<object|undefined>} The user object (including password_hash) or undefined if not found.
 */
async function findUserByEmail(email) {
  const sql = 'SELECT id, email, password_hash, role FROM users WHERE email = ?';
  const row = await dbGet(sql, [email]);
  return row; // Returns user object including password_hash
}

/**
 * Updates the password hash for a given user ID.
 * @param {number} userId - The ID of the user to update.
 * @param {string} newPassword - The new plain text password.
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 * @throws {Error} If hashing fails or database update fails.
 */
async function updateUserPassword(userId, newPassword) {
  if (!newPassword) {
    throw new Error('New password cannot be empty.');
  }

  // Hash the new password
  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
  const params = [newPasswordHash, userId];

  try {
    const result = await dbRun(sql, params);
    // Check if any row was actually updated
    return result.changes > 0;
  } catch (error) {
    console.error(`Error updating password for user ID ${userId}:`, error);
    throw new Error('Failed to update password.');
  }
}

/**
 * Finds a user by their ID.
 * @param {number} userId - The ID of the user to find.
 * @returns {Promise<object|undefined>} The user object (excluding password_hash) or undefined if not found.
 */
async function findUserById(userId) {
  // Exclude password_hash from the result for general use
  const sql = 'SELECT id, email, role, created_at FROM users WHERE id = ?';
  const row = await dbGet(sql, [userId]);
  return row;
}

/**
 * Lists all users in the database.
 * @returns {Promise<Array<object>>} An array of user objects (id, email, role, created_at).
 */
async function listUsers() {
  // Exclude password_hash from the list
  const sql = 'SELECT id, email, role, created_at FROM users ORDER BY email ASC';
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(sql, [], (err, rows) => { // Use db.all to get all rows
      if (err) {
        console.error('Database list users error:', err.message);
        reject(err);
      } else {
        resolve(rows || []); // Resolve with rows array or empty array
      }
    });
  });
}

/**
 * Creates a new user (Admin or User).
 * Hashes the password using bcrypt.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's plain text password.
 * @param {string} role - The user's role ('Admin' or 'User').
 * @returns {Promise<{id: number, email: string, role: string}>} The created user object.
 * @throws {Error} If email/password/role is missing, role is invalid, email exists, or DB error occurs.
 */
async function createUser(email, password, role) {
  if (!email || !password || !role) {
    throw new Error('Email, password, and role are required.');
  }
  if (role !== 'Admin' && role !== 'User') {
      throw new Error("Invalid role specified. Must be 'Admin' or 'User'.");
  }

  // Hash the password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const sql = `
    INSERT INTO users (email, password_hash, role)
    VALUES (?, ?, ?)
  `;
  const params = [email, passwordHash, role];

  try {
    const result = await dbRun(sql, params);
    console.log(`User created successfully with ID: ${result.lastID}`);
    return { id: result.lastID, email: email, role: role };
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.email')) {
        throw new Error('Email address already exists.');
    }
    throw new Error('Failed to create user.');
  }
}

/**
 * Deletes a user by their ID.
 * @param {number} userId - The ID of the user to delete.
 * @returns {Promise<boolean>} True if the deletion was successful (row was affected), false otherwise.
 * @throws {Error} If database deletion fails.
 */
async function deleteUser(userId) {
  // Add check: Prevent deleting the last Admin user
  const userToDelete = await findUserById(userId);
  if (userToDelete && userToDelete.role === 'Admin') {
      const adminCountSql = "SELECT COUNT(*) as count FROM users WHERE role = 'Admin'";
      const adminCountResult = await dbGet(adminCountSql);
      if (adminCountResult && adminCountResult.count <= 1) {
          throw new Error("Cannot delete the last administrator user.");
      }
  }

  const sql = 'DELETE FROM users WHERE id = ?';
  try {
    const result = await dbRun(sql, [userId]);
    return result.changes > 0; // True if a row was deleted
  } catch (error) {
    console.error(`Error deleting user ID ${userId}:`, error);
    throw new Error('Failed to delete user.');
  }
}

/**
 * Updates the role for a given user ID.
 * @param {number} userId - The ID of the user to update.
 * @param {string} newRole - The new role ('Admin' or 'User').
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 * @throws {Error} If the role is invalid, trying to demote the last admin, or DB update fails.
 */
async function updateUserRole(userId, newRole) {
  if (newRole !== 'Admin' && newRole !== 'User') {
    throw new Error("Invalid role specified. Must be 'Admin' or 'User'.");
  }

  // Add check: Prevent demoting the last Admin user
  const userToUpdate = await findUserById(userId);
   if (userToUpdate && userToUpdate.role === 'Admin' && newRole === 'User') {
      const adminCountSql = "SELECT COUNT(*) as count FROM users WHERE role = 'Admin'";
      const adminCountResult = await dbGet(adminCountSql);
      if (adminCountResult && adminCountResult.count <= 1) {
          throw new Error("Cannot demote the last administrator user.");
      }
  }


  const sql = 'UPDATE users SET role = ? WHERE id = ?';
  const params = [newRole, userId];

  try {
    const result = await dbRun(sql, params);
    return result.changes > 0;
  } catch (error) {
    console.error(`Error updating role for user ID ${userId}:`, error);
    throw new Error('Failed to update user role.');
  }
}

/**
 * Updates the email for a given user ID.
 * Ensures the new email is not already in use by another user.
 * @param {number} userId - The ID of the user to update.
 * @param {string} newEmail - The new email address.
 * @returns {Promise<boolean>} True if the update was successful, false otherwise.
 * @throws {Error} If the email is already in use or DB update fails.
 */
async function updateUserEmail(userId, newEmail) {
  if (!newEmail) {
    throw new Error('New email cannot be empty.');
  }

  // Check if the new email is already in use by another user
  const existingUserSql = 'SELECT id FROM users WHERE email = ? AND id != ?';
  const existingUser = await dbGet(existingUserSql, [newEmail, userId]);

  if (existingUser) {
    throw new Error('Email address is already in use by another account.');
  }

  const sql = 'UPDATE users SET email = ? WHERE id = ?';
  const params = [newEmail, userId];

  try {
    const result = await dbRun(sql, params);
    return result.changes > 0; // True if a row was updated
  } catch (error) {
    console.error(`Error updating email for user ID ${userId}:`, error);
    if (error.code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed: users.email')) {
        // This should be caught by the check above, but as a fallback
        throw new Error('Email address is already in use.');
    }
    throw new Error('Failed to update email address.');
  }
}

/**
 * Checks if a user account is currently locked.
 * @param {string} email - The email address to check.
 * @returns {Promise<boolean>} True if the account is locked, false otherwise.
 */
async function isAccountLocked(email) {
  const sql = 'SELECT locked_until FROM users WHERE email = ?';
  const row = await dbGet(sql, [email]);
  
  if (!row || !row.locked_until) {
    return false;
  }
  
  const lockedUntil = new Date(row.locked_until);
  const now = new Date();
  
  // If lock time has passed, unlock the account
  if (now >= lockedUntil) {
    await unlockAccount(email);
    return false;
  }
  
  return true;
}

/**
 * Records a failed login attempt for a user.
 * Locks the account if the maximum attempts (10) is reached.
 * @param {string} email - The email address of the user.
 * @returns {Promise<{isLocked: boolean, attemptsRemaining: number}>} Lock status and remaining attempts.
 */
async function recordFailedLoginAttempt(email) {
  const MAX_ATTEMPTS = 10;
  const LOCKOUT_DURATION_HOURS = 1;
  
  // Get current failed attempts
  const sql = 'SELECT failed_login_attempts FROM users WHERE email = ?';
  const row = await dbGet(sql, [email]);
  
  if (!row) {
    // User doesn't exist, but don't reveal this information
    return { isLocked: false, attemptsRemaining: MAX_ATTEMPTS };
  }
  
  const currentAttempts = (row.failed_login_attempts || 0) + 1;
  
  if (currentAttempts >= MAX_ATTEMPTS) {
    // Lock the account
    const lockUntil = new Date();
    lockUntil.setHours(lockUntil.getHours() + LOCKOUT_DURATION_HOURS);
    
    const lockSql = 'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE email = ?';
    await dbRun(lockSql, [currentAttempts, lockUntil.toISOString(), email]);
    
    console.log(`Account locked for user ${email} after ${currentAttempts} failed attempts. Locked until: ${lockUntil.toISOString()}`);
    return { isLocked: true, attemptsRemaining: 0 };
  } else {
    // Increment failed attempts
    const updateSql = 'UPDATE users SET failed_login_attempts = ? WHERE email = ?';
    await dbRun(updateSql, [currentAttempts, email]);
    
    const attemptsRemaining = MAX_ATTEMPTS - currentAttempts;
    console.log(`Failed login attempt ${currentAttempts} for user ${email}. ${attemptsRemaining} attempts remaining.`);
    return { isLocked: false, attemptsRemaining };
  }
}

/**
 * Resets failed login attempts for a user (called on successful login).
 * @param {string} email - The email address of the user.
 * @returns {Promise<void>}
 */
async function resetFailedLoginAttempts(email) {
  const sql = 'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ?';
  await dbRun(sql, [email]);
}

/**
 * Unlocks a user account by clearing the locked_until timestamp.
 * @param {string} email - The email address of the user.
 * @returns {Promise<void>}
 */
async function unlockAccount(email) {
  const sql = 'UPDATE users SET locked_until = NULL WHERE email = ?';
  await dbRun(sql, [email]);
  console.log(`Account unlocked for user ${email}`);
}

/**
 * Gets the lockout status for a user including time remaining.
 * @param {string} email - The email address to check.
 * @returns {Promise<{isLocked: boolean, lockedUntil?: Date, minutesRemaining?: number}>} Lockout status.
 */
async function getLockoutStatus(email) {
  const sql = 'SELECT locked_until, failed_login_attempts FROM users WHERE email = ?';
  const row = await dbGet(sql, [email]);
  
  if (!row || !row.locked_until) {
    return { isLocked: false };
  }
  
  const lockedUntil = new Date(row.locked_until);
  const now = new Date();
  
  if (now >= lockedUntil) {
    // Lock has expired, unlock the account
    await unlockAccount(email);
    return { isLocked: false };
  }
  
  const minutesRemaining = Math.ceil((lockedUntil - now) / (1000 * 60));
  return {
    isLocked: true,
    lockedUntil,
    minutesRemaining
  };
}

module.exports = {
  initDatabase,
  getDb,
  countUsers,
  createInitialAdmin,
  findUserByEmail,
  updateUserPassword,
  updateUserEmail,    // Export new function
  findUserById,       // Export new function
  listUsers,          // Export new function
  createUser,         // Export new function
  deleteUser,         // Export new function
  updateUserRole,     // Export new function
  // Account lockout functions
  isAccountLocked,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  unlockAccount,
  getLockoutStatus,
};