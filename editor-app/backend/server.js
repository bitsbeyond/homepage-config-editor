const fastify = require('fastify')({
  logger: {
    level: 'debug', // Set log level to debug to see detailed logs
    transport: { // Optional: Pretty print logs for better readability in terminal
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }
});
const fs = require('node:fs').promises;
const path = require('node:path');
const fastifyStatic = require('@fastify/static');
const { initDatabase, countUsers, createInitialAdmin, findUserByEmail } = require('./database');
const bcrypt = require('bcrypt');
const fastifyJwt = require('@fastify/jwt');
const yaml = require('js-yaml'); // Import js-yaml library
const dotenv = require('dotenv'); // Import dotenv
const multipart = require('@fastify/multipart');
const fastifyHelmet = require('@fastify/helmet'); // Corrected import
// Removed Git-related imports
const {
    readConfigFile,
    writeConfigFile,
    writeRawConfigFile,
    readSettings, // Keep existing readSettings
    writeSettings,
    getUnifiedGroupNames, // Import the new function
    renameGroup, // Import the group renaming function
    deleteGroup, // Import the group deletion function
    CONFIG_DIR: configUtilsConfigDir
} = require('./configUtils');
const {
  findUserByEmail: findUserByEmailForAuth,
  updateUserPassword,
  listUsers,          // Added
  createUser,         // Added
  deleteUser,         // Added
  updateUserRole,     // Added
  updateUserEmail,    // Added for email updates
  // Account lockout functions
  isAccountLocked,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  getLockoutStatus
} = require('./database'); // Import admin DB functions
const {
  checkGitAvailability,
  isGitRepository,
  initializeRepository,
  commitFile, // Import commitFile
  getFileHistory, // Import getFileHistory
  revertToCommit, // Import revertToCommit
  configDir: gitConfigDir // Use the configDir exported from gitUtils
} = require('./gitUtils');
const {
    initializeValidators, // Renamed
    validateServicesData,
    validateBookmarksData,
    validateWidgetsData,
    validateSettingsData
} = require('./validationUtils'); // Import validation utils
const {
    validateEmail,
    validatePassword,
    validateFilename,
    validateText,
    validateFilePath,
    createValidationMiddleware,
    sanitizeHtml
} = require('./validationMiddleware'); // Import enhanced validation middleware

// Use CONFIG_DIR determined by configUtils based on EDITOR_DATA_DIR or default
// Ensure the config dir used by gitUtils and configUtils is the same
const CONFIG_DIR = configUtilsConfigDir;
if (CONFIG_DIR !== gitConfigDir) {
    fastify.log.error(`Mismatch between configUtils CONFIG_DIR (${CONFIG_DIR}) and gitUtils configDir (${gitConfigDir}). Exiting.`);
    process.exit(1);
}
const ALLOWED_EXTENSIONS = ['.yaml', '.yml', '.css', '.js']; // For editing

// --- Image Management Setup ---
const IMAGES_DIR_NAME = 'images';
const IMAGES_DIR = process.env.EDITOR_DATA_DIR
    ? path.join(process.env.EDITOR_DATA_DIR, IMAGES_DIR_NAME)
    : path.join(path.dirname(CONFIG_DIR), IMAGES_DIR_NAME); // if CONFIG_DIR is /config, dirname is /, so /images.

fastify.log.info(`Images will be stored in: ${IMAGES_DIR}`);

// Sanitize uploaded image filenames to prevent path traversal and problematic characters
function sanitizeImageFilename(originalName) {
  let sanitized = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_');
  sanitized = sanitized.substring(0, 250).replace(/^_+|_+$/g, '');
  if (!sanitized) {
    sanitized = `image-${Date.now()}${path.extname(originalName) || '.unknown'}`;
  }
  return sanitized;
}
// --- End Image Management Setup ---

// Path to the built frontend assets within the container
// Corresponds to the COPY destination in the Dockerfile's final stage
const FRONTEND_PATH = path.join(__dirname, '../frontend/dist');

// Register fastify-static plugin
fastify.register(fastifyStatic, {
  root: FRONTEND_PATH,
  prefix: '/', // Serve files from the root URL path
  wildcard: false, // Prevent @fastify/static from creating its own /* GET and HEAD routes
 });

// Register @fastify/multipart for file upload handling (replaces fastify-multer)
fastify.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
 
// Register JWT plugin with dual token support
const JWT_SECRET = process.env.JWT_SECRET || 'a-very-insecure-secret-key-replace-me';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'a-very-insecure-refresh-secret-replace-me';

if (JWT_SECRET === 'a-very-insecure-secret-key-replace-me') {
    fastify.log.warn('Using default insecure JWT secret. Set JWT_SECRET environment variable for production!');
}
if (REFRESH_SECRET === 'a-very-insecure-refresh-secret-replace-me') {
    fastify.log.warn('Using default insecure refresh secret. Set REFRESH_SECRET environment variable for production!');
}

fastify.register(fastifyJwt, {
  secret: JWT_SECRET
});

// Register cookie plugin for refresh token management
fastify.register(require('@fastify/cookie'), {
  secret: REFRESH_SECRET, // Use refresh secret for cookie signing
  parseOptions: {}
});

// Register fastify-helmet for security headers (SR5: HTTP Security Headers)
// Determine if HTTPS is being used (check environment)
// HSTS should only be enabled when the app is served over HTTPS
const isHttps = process.env.HTTPS_ENABLED === 'true' || process.env.NODE_ENV === 'production';

fastify.register(fastifyHelmet, {
  // Content Security Policy - allows inline scripts/styles required by React/Vite/MUI
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // Required for Vite HMR, React, and Monaco Editor loaded from CDN
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],  // Required for MUI emotion CSS-in-JS and Monaco Editor CSS from CDN
      imgSrc: ["'self'", "data:", "https:", "http://localhost:*"], // Allow all HTTPS images for CDN icons (homarr-labs, Google, etc.)
      connectSrc: ["'self'", "https://cdn.jsdelivr.net", "http://localhost:*", "ws://localhost:*"], // Allow CDN metadata fetch and WebSocket
      workerSrc: ["'self'", "blob:"], // Required for Monaco Editor web workers
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],  // Monaco Editor loads codicon fonts from CDN
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"], // Prevents clickjacking (equivalent to X-Frame-Options: DENY)
    },
  },
  // HTTP Strict Transport Security (HSTS) - only enable for HTTPS deployments
  hsts: isHttps ? {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: false // Set to true only after testing and registering with HSTS preload list
  } : false, // Disable HSTS for HTTP-only development environments
  // Referrer Policy - controls how much referrer information is sent
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin' // Send origin for cross-origin, full URL for same-origin
  },
  // Explicitly enable X-Content-Type-Options (prevents MIME sniffing)
  xContentTypeOptions: true, // Sets "X-Content-Type-Options: nosniff"
  // Explicitly enable X-Frame-Options (prevents clickjacking)
  xFrameOptions: { action: 'deny' }, // Sets "X-Frame-Options: DENY"
});

// Register rate limiting (SR6: API Rate Limiting)
// Using a simple in-memory Map-based rate limiter for full control

// Rate limit stores: IP -> { count, resetTime }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generic rate limiter function
 * @param {number} max - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
function createRateLimiter(max, windowMs) {
  return async (request, reply) => {
    const key = `${request.ip}-${request.routeOptions.url}-${request.routeOptions.method}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // No record or expired - create new
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return; // Allow request
    }

    if (record.count >= max) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return reply.code(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Too many attempts. Please try again in ${retryAfter} seconds.`,
        retryAfter: retryAfter
      });
    }

    // Increment count
    record.count++;
    rateLimitStore.set(key, record);
  };
}

// Strict rate limiter for sensitive endpoints (5 requests per minute)
const strictRateLimiter = createRateLimiter(5, 60 * 1000);

// Global rate limiter for normal endpoints (100 requests per minute)
const globalRateLimiter = createRateLimiter(100, 60 * 1000);

// In-memory refresh token store (for production, consider Redis or database)
const refreshTokenStore = new Map();

// Import jsonwebtoken for manual token handling
const jwt = require('jsonwebtoken');

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    type: 'access'
  };
  
  const refreshTokenPayload = {
    id: user.id,
    email: user.email,
    type: 'refresh'
  };

  const accessToken = jwt.sign(accessTokenPayload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_SECRET, { expiresIn: '7d' });

  // Store refresh token with user ID
  refreshTokenStore.set(refreshToken, {
    userId: user.id,
    email: user.email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });

  return { accessToken, refreshToken };
};

// Helper function to verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const stored = refreshTokenStore.get(token);
    
    if (!stored || stored.userId !== decoded.id || new Date() > stored.expiresAt) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

// Helper function to invalidate refresh token
const invalidateRefreshToken = (token) => {
  refreshTokenStore.delete(token);
};

// Helper function/hook to verify JWT authentication
const verifyAuth = async (request, reply) => {
  try {
    await request.jwtVerify(); // Verify token from Authorization header
  } catch (err) {
    fastify.log.info('Auth check failed: Invalid or missing token.');
    reply.code(401).send({ error: 'Unauthorized' });
  }
};

// ========================================
// API Routes
// ========================================

// --- Setup Routes ---

/**
 * GET /api/setup/status
 * Checks if the initial admin setup is required (i.e., no users exist).
 */
fastify.get('/api/setup/status', async (request, reply) => {
  try {
    const userCount = await countUsers();
    const needsSetup = userCount === 0;
    reply.send({ needsSetup });
  } catch (error) {
    fastify.log.error('Error checking setup status:', error);
    reply.code(500).send({ error: 'Failed to check setup status.' });
  }
});

/**
 * POST /api/setup/admin
 * Creates the initial administrator user. Only allowed if no users exist.
 * Expects { email, password } in the request body.
 */
fastify.post('/api/setup/admin', {
  preHandler: [
    strictRateLimiter, // Rate limiting: 5 attempts per minute
    createValidationMiddleware({
      maxSize: 1024, // 1KB limit for setup requests
      body: {
        email: { type: 'email', required: true },
        password: { type: 'password', required: true }
      }
    })
  ]
}, async (request, reply) => {
  const { email, password } = request.body;


  try {
    // Attempt to create the initial admin
    const newUser = await createInitialAdmin(email, password);
    // Exclude password hash from the response
    const { password_hash, ...userResponse } = newUser;
    reply.code(201).send(userResponse); // 201 Created
  } catch (error) {
    fastify.log.error('Error during initial admin setup:', error);
    if (error.message.includes('users already exist')) {
      reply.code(409).send({ error: 'Setup already completed. Admin user exists.' }); // 409 Conflict
    } else if (error.message.includes('Email and password are required') || error.message.includes('Failed to create initial admin user')) {
        reply.code(500).send({ error: 'Failed to create admin user.' });
    }
     else {
      reply.code(500).send({ error: 'An unexpected error occurred during setup.' });
    }
  }
});

// --- Authentication Routes ---

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 * Expects { email, password } in the request body.
 */
fastify.post('/api/auth/login', {
  preHandler: [
    strictRateLimiter, // Rate limiting: 5 attempts per minute
    createValidationMiddleware({
      maxSize: 1024, // 1KB limit for login requests
      body: {
        email: { type: 'email', required: true },
        password: { type: 'text', required: true, maxLength: 128, stripHtml: false }
      }
    })
  ]
}, async (request, reply) => {
  const { email, password } = request.body;

  try {
    // Check if account is locked before proceeding
    const isLocked = await isAccountLocked(email);
    if (isLocked) {
      const lockoutStatus = await getLockoutStatus(email);
      fastify.log.warn(`Login attempt blocked: Account locked for ${email}. ${lockoutStatus.minutesRemaining} minutes remaining.`);
      return reply.code(423).send({
        error: 'Account temporarily locked due to too many failed login attempts.',
        lockedUntil: lockoutStatus.lockedUntil,
        minutesRemaining: lockoutStatus.minutesRemaining
      }); // 423 Locked
    }

    // Use the specifically imported function for clarity in this context
    const user = await findUserByEmailForAuth(email);

    if (!user) {
      // Record failed attempt even for non-existent users to prevent user enumeration timing attacks
      await recordFailedLoginAttempt(email);
      fastify.log.warn(`Login failed: User not found - ${email}`);
      return reply.code(401).send({ error: 'Invalid email or password.' }); // 401 Unauthorized
    }

    // Compare provided password with the stored hash
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      // Record failed login attempt
      const attemptResult = await recordFailedLoginAttempt(email);
      
      if (attemptResult.isLocked) {
        fastify.log.warn(`Account locked after failed login attempt for ${email}`);
        return reply.code(423).send({
          error: 'Account locked due to too many failed login attempts. Please try again in 1 hour.',
          attemptsRemaining: 0
        }); // 423 Locked
      } else {
        fastify.log.warn(`Login failed: Incorrect password - ${email}. ${attemptResult.attemptsRemaining} attempts remaining.`);
        return reply.code(401).send({
          error: 'Invalid email or password.',
          attemptsRemaining: attemptResult.attemptsRemaining
        }); // 401 Unauthorized
      }
    }

    // Passwords match - Reset failed login attempts and generate tokens
    await resetFailedLoginAttempts(email);
    const { accessToken, refreshToken } = generateTokens(user);

    fastify.log.info(`Login successful: ${email} - Access token expires in 1h, refresh token expires in 7d`);
    
    // Set refresh token as HttpOnly cookie
    reply.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    });

    // Send access token in response body
    reply.send({
      accessToken,
      user: { email: user.email, role: user.role },
      expiresIn: 3600 // 1 hour in seconds
    });

  } catch (error) {
    fastify.log.error('Login error:', error);
    reply.code(500).send({ error: 'An unexpected error occurred during login.' });
  }
});

/**
 * POST /api/auth/refresh
 * Refreshes an access token using a valid refresh token from HttpOnly cookie.
 */
fastify.post('/api/auth/refresh', async (request, reply) => {
  try {
    const refreshToken = request.cookies.refreshToken;
    
    if (!refreshToken) {
      fastify.log.info('Refresh attempt without refresh token cookie');
      return reply.code(401).send({ error: 'Refresh token not found' });
    }

    // Verify and validate refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      fastify.log.warn('Invalid or expired refresh token used');
      return reply.code(401).send({ error: 'Invalid or expired refresh token' });
    }

    // Get user data to generate new access token
    const user = await findUserByEmailForAuth(decoded.email);
    if (!user) {
      fastify.log.error(`Refresh token valid but user not found: ${decoded.email}`);
      // Invalidate the refresh token since user no longer exists
      invalidateRefreshToken(refreshToken);
      return reply.code(401).send({ error: 'User not found' });
    }

    // Generate new access token (keep same refresh token)
    const accessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access'
    };
    
    const newAccessToken = jwt.sign(accessTokenPayload, JWT_SECRET, { expiresIn: '1h' });
    
    fastify.log.info(`Access token refreshed for user: ${user.email}`);
    reply.send({
      accessToken: newAccessToken,
      expiresIn: 3600 // 1 hour in seconds
    });

  } catch (error) {
    fastify.log.error('Error during token refresh:', error);
    reply.code(500).send({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Logs out user by invalidating refresh token and clearing cookie.
 */
fastify.post('/api/auth/logout', async (request, reply) => {
  try {
    const refreshToken = request.cookies.refreshToken;
    
    if (refreshToken) {
      // Invalidate the refresh token
      invalidateRefreshToken(refreshToken);
      fastify.log.info('Refresh token invalidated during logout');
    }
    
    // Clear the refresh token cookie
    reply.clearCookie('refreshToken', { path: '/' });
    fastify.log.info('Logout successful - refresh token cleared');
    reply.send({ message: 'Logout successful.' });
    
  } catch (error) {
    fastify.log.error('Error during logout:', error);
    // Still clear cookie even if there was an error
    reply.clearCookie('refreshToken', { path: '/' });
    reply.send({ message: 'Logout completed.' });
  }
});

/**
 * GET /api/auth/status
 * Checks if the current user (based on JWT) is authenticated.
 * Requires a valid JWT in the Authorization header (Bearer token).
 */
fastify.get('/api/auth/status', {
  // Add hook to verify JWT before handler runs
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify(); // Verifies token from Authorization header
      // If using cookies: await request.jwtVerify({ onlyCookie: true });
    } catch (err) {
      fastify.log.info('Auth status check failed: Invalid or missing token.');
      reply.code(401).send({ loggedIn: false, error: 'Unauthorized' });
    }
  }
}, async (request, reply) => {
  // If preHandler passes, request.user contains the decoded JWT payload
  const { id, email, role } = request.user;
  fastify.log.info(`Auth status check successful for user: ${email}`);
  reply.send({ loggedIn: true, user: { id, email, role } });
});

// --- User Management Routes (Require Auth) ---

/**
 * PUT /api/users/me/password
 * Allows the currently authenticated user to change their own password.
 * Requires { currentPassword, newPassword } in the request body.
 */
fastify.put('/api/users/me/password', {
  preHandler: [
    strictRateLimiter, // Rate limiting: 5 attempts per minute
    async (request, reply) => {
      try {
        await request.jwtVerify(); // Ensure user is logged in
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    createValidationMiddleware({
      maxSize: 1024, // 1KB limit for password change requests
      body: {
        currentPassword: { type: 'text', required: true, maxLength: 128, stripHtml: false },
        newPassword: { type: 'password', required: true }
      }
    })
  ]
}, async (request, reply) => {
  const { currentPassword, newPassword } = request.body;
  const userId = request.user.id; // Get user ID from verified JWT payload
  const userEmail = request.user.email; // For logging

  // Additional validation for password change
  if (newPassword === currentPassword) {
      return reply.code(400).send({ error: 'New password cannot be the same as the current password.' });
  }

  try {
    // 1. Fetch the user's current hash to verify currentPassword
    // We need findUserByEmail again here, or better, a findUserById function
    // Let's reuse findUserByEmail for now, assuming email is unique and available in JWT
    const currentUser = await findUserByEmailForAuth(userEmail);

    if (!currentUser) {
        // Should not happen if JWT is valid, but good to check
        fastify.log.error(`Password change failed: User ${userEmail} (ID: ${userId}) not found despite valid JWT.`);
        return reply.code(404).send({ error: 'User not found.' });
    }

    // 2. Verify the current password
    const match = await bcrypt.compare(currentPassword, currentUser.password_hash);
    if (!match) {
      fastify.log.warn(`Password change failed: Incorrect current password for user ${userEmail}`);
      return reply.code(401).send({ error: 'Incorrect current password.' }); // 401 Unauthorized (or 400 Bad Request)
    }

    // 3. Update the password in the database
    const updated = await updateUserPassword(userId, newPassword);

    if (updated) {
      fastify.log.info(`Password successfully updated for user ${userEmail}`);
      reply.send({ message: 'Password updated successfully.' });
    } else {
      // This might happen if the user ID was somehow invalid during the update
      fastify.log.error(`Password update failed unexpectedly for user ${userEmail} (ID: ${userId}) after verification.`);
      reply.code(500).send({ error: 'Failed to update password.' });
    }

  } catch (error) {
    fastify.log.error(`Error changing password for user ${userEmail}:`, error);
    reply.code(500).send({ error: 'An unexpected error occurred while changing the password.' });
  }
});

/**
 * PUT /api/users/me/email
 * Allows the currently authenticated user to change their own email address.
 * Requires { newEmail, currentPassword } in the request body.
 */
fastify.put('/api/users/me/email', {
  preHandler: [
    async (request, reply) => {
      try {
        await request.jwtVerify(); // Ensure user is logged in
      } catch (err) {
        reply.code(401).send({ error: 'Unauthorized' });
      }
    },
    createValidationMiddleware({
      maxSize: 1024, // 1KB limit
      body: {
        newEmail: { type: 'email', required: true },
        currentPassword: { type: 'text', required: true, maxLength: 128, stripHtml: false }
      }
    })
  ]
}, async (request, reply) => {
  const { newEmail, currentPassword } = request.body;
  const userId = request.user.id;
  const currentUserEmail = request.user.email; // For logging and verification

  if (newEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
    return reply.code(400).send({ error: 'New email cannot be the same as the current email.' });
  }

  try {
    // 1. Verify the current password
    const userForPasswordCheck = await findUserByEmailForAuth(currentUserEmail);
    if (!userForPasswordCheck) {
      fastify.log.error(`Email change failed: User ${currentUserEmail} (ID: ${userId}) not found despite valid JWT.`);
      return reply.code(404).send({ error: 'User not found.' });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, userForPasswordCheck.password_hash);
    if (!passwordMatch) {
      fastify.log.warn(`Email change failed: Incorrect current password for user ${currentUserEmail}`);
      return reply.code(401).send({ error: 'Incorrect current password.' });
    }

    // 2. Update the email in the database
    // The updateUserEmail function in database.js already checks if the new email is in use
    const updated = await updateUserEmail(userId, newEmail); // newEmail is already validated by middleware

    if (updated) {
      fastify.log.info(`Email successfully updated for user ID ${userId} from ${currentUserEmail} to ${newEmail}`);
      // IMPORTANT: If email is part of the JWT payload, the current token will be stale.
      // The client should be instructed to re-authenticate or the server should issue a new token.
      // For simplicity now, we'll just send success. Client might need to re-login to see changes reflected in JWT.
      reply.send({ message: 'Email updated successfully. Please note that your session token may still contain the old email until you log in again.' });
    } else {
      // This case should ideally be caught by specific errors in updateUserEmail (e.g., email in use)
      fastify.log.error(`Email update failed unexpectedly for user ID ${userId} after verification.`);
      reply.code(500).send({ error: 'Failed to update email address.' });
    }

  } catch (error) {
    fastify.log.error(`Error changing email for user ${currentUserEmail}:`, error);
    if (error.message.includes('Email address is already in use')) {
        reply.code(409).send({ error: error.message }); // 409 Conflict
    } else {
        reply.code(500).send({ error: 'An unexpected error occurred while changing the email address.' });
    }
  }
});


// --- Admin User Management Routes (Require Admin Role) ---

// Helper function/hook to verify Admin role
const verifyAdmin = async (request, reply) => {
  try {
    await request.jwtVerify(); // First, ensure user is logged in
    if (request.user.role !== 'Admin') {
      fastify.log.warn(`Forbidden: Non-admin user ${request.user.email} attempted admin action.`);
      reply.code(403).send({ error: 'Forbidden: Administrator access required.' }); // 403 Forbidden
    }
    // If admin, continue
  } catch (err) {
    // This catches errors from jwtVerify (invalid token)
    reply.code(401).send({ error: 'Unauthorized' });
  }
};


/**
 * GET /api/users
 * Lists all users (Admin only).
 */
fastify.get('/api/users', { preHandler: [verifyAdmin] }, async (request, reply) => {
  try {
    const users = await listUsers();
    // Ensure password hashes are not included (listUsers already excludes them)
    reply.send(users);
  } catch (error) {
    fastify.log.error('Error listing users:', error);
    reply.code(500).send({ error: 'Failed to retrieve user list.' });
  }
});

/**
 * POST /api/users
 * Creates a new user (Admin only).
 * Requires { email, password, role } in the body.
 */
fastify.post('/api/users', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { email, password, role } = request.body;

    // Basic validation
    if (!email || !password || !role) {
        return reply.code(400).send({ error: 'Email, password, and role are required.' });
    }
    if (role !== 'Admin' && role !== 'User') {
        return reply.code(400).send({ error: "Invalid role. Must be 'Admin' or 'User'." });
    }
     if (!/\S+@\S+\.\S+/.test(email)) {
        return reply.code(400).send({ error: 'Invalid email format.' });
    }
    if (password.length < 8) {
        return reply.code(400).send({ error: 'Password must be at least 8 characters long.' });
    }

    try {
        const newUser = await createUser(email, password, role);
        // Exclude password hash from response (createUser already does this)
        reply.code(201).send(newUser); // 201 Created
    } catch (error) {
        fastify.log.error('Error creating user via admin route:', error);
        if (error.message.includes('Email address already exists')) {
            reply.code(409).send({ error: 'Email address already exists.' }); // 409 Conflict
        } else {
            reply.code(500).send({ error: 'Failed to create user.' });
        }
    }
});

/**
 * DELETE /api/users/{userId}
 * Deletes a user (Admin only).
 */
fastify.delete('/api/users/:userId', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { userId } = request.params;
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericUserId)) {
        return reply.code(400).send({ error: 'Invalid user ID.' });
    }

    // Prevent admin from deleting themselves
    if (request.user.id === numericUserId) {
        return reply.code(400).send({ error: 'Administrators cannot delete their own account.' });
    }

    try {
        const deleted = await deleteUser(numericUserId);
        if (deleted) {
            fastify.log.info(`Admin ${request.user.email} deleted user ID ${numericUserId}`);
            reply.send({ message: 'User deleted successfully.' });
        } else {
            // User ID might not exist
            reply.code(404).send({ error: 'User not found.' });
        }
    } catch (error) {
        fastify.log.error(`Error deleting user ID ${numericUserId} by admin ${request.user.email}:`, error);
         if (error.message.includes('Cannot delete the last administrator')) {
            reply.code(400).send({ error: error.message });
        } else {
            reply.code(500).send({ error: 'Failed to delete user.' });
        }
    }
});

/**
 * PUT /api/users/{userId}/role
 * Updates a user's role (Admin only).
 * Requires { role } in the body.
 */
fastify.put('/api/users/:userId/role', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { userId } = request.params;
    const { role } = request.body;
    const numericUserId = parseInt(userId, 10);

    if (isNaN(numericUserId)) {
        return reply.code(400).send({ error: 'Invalid user ID.' });
    }
    if (role !== 'Admin' && role !== 'User') {
        return reply.code(400).send({ error: "Invalid role specified. Must be 'Admin' or 'User'." });
    }

     // Prevent admin from changing their own role via this endpoint (should use profile settings if allowed)
    if (request.user.id === numericUserId) {
        return reply.code(400).send({ error: 'Administrators cannot change their own role via this endpoint.' });
    }


    try {
        const updated = await updateUserRole(numericUserId, role);
        if (updated) {
             fastify.log.info(`Admin ${request.user.email} updated role for user ID ${numericUserId} to ${role}`);
            reply.send({ message: 'User role updated successfully.' });
        } else {
            // User ID might not exist
            reply.code(404).send({ error: 'User not found.' });
        }
    } catch (error) {
        fastify.log.error(`Error updating role for user ID ${numericUserId} by admin ${request.user.email}:`, error);
        if (error.message.includes('Cannot demote the last administrator')) {
            reply.code(400).send({ error: error.message });
        } else {
            reply.code(500).send({ error: 'Failed to update user role.' });
        }
    }
});


// --- Example Protected Route (demonstrates usage) ---

// [DUPLICATE REMOVED] The verifyAdmin function is defined earlier.


// [DUPLICATE REMOVED] The GET /api/users route is defined earlier.

// [DUPLICATE REMOVED] The POST /api/users route is defined earlier.

// [DUPLICATE REMOVED] The DELETE /api/users/:userId route is defined earlier.

// [DUPLICATE REMOVED] The PUT /api/users/:userId/role route is defined earlier. - Removing this line now


// --- Example Protected Route (demonstrates usage) ---
// fastify.get('/api/protected-data', {
//   preHandler: async (request, reply) => {
//     try {
//       await request.jwtVerify();
//     } catch (err) {
//       reply.code(401).send({ error: 'Unauthorized' });
//     }
//   }
// }, async (request, reply) => {
//   // Access user info from decoded token
//   const userEmail = request.user.email;
//   return { message: `This is protected data for ${userEmail}` };
// });


// --- Configuration Data Routes (Require Auth) ---

// Helper function to create authenticated config routes
const createAuthenticatedConfigRoute = (configName, defaultEmptyValue = null) => {
  fastify.get(`/api/${configName}`, {
    // Ensure user is authenticated before allowing access
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify(); // Verify JWT from Authorization header
      } catch (err) {
        fastify.log.warn(`Unauthorized access attempt to /api/${configName}`);
        reply.code(401).send({ error: 'Unauthorized' });
      }
    }
  }, async (request, reply) => {
    try {
      const data = await readConfigFile(configName, fastify.log);
      // Return parsed data or a default empty value if file is missing/empty/invalid
      // Frontend might expect specific structures (e.g., array for services/bookmarks)
      let responseData = data;
      if (data === null || data === undefined) {
          // Provide sensible defaults based on expected type
          if (configName === 'services' || configName === 'bookmarks') {
              responseData = []; // Expecting an array of groups
          } else if (configName === 'settings' || configName === 'widgets') {
              responseData = {}; // Expecting an object
          } else {
              responseData = defaultEmptyValue; // Fallback
          }
          fastify.log.info(`Config ${configName} not found or empty, returning default: ${JSON.stringify(responseData)}`);
      }
      reply.send(responseData);
    } catch (error) {
      // readConfigFile logs specific errors, send generic server error here for critical issues
      fastify.log.error(`Critical error reading config ${configName}:`, error);
      reply.code(500).send({ error: `Failed to read ${configName} configuration.` });
    }
  });
};

// Create routes for each main config file
createAuthenticatedConfigRoute('services', []); // Default to empty array
createAuthenticatedConfigRoute('bookmarks', []); // Default to empty array
createAuthenticatedConfigRoute('widgets', {});   // Default to empty object
// Remove the generic route creator for settings, we'll define a custom one below
// createAuthenticatedConfigRoute('settings', {});  // Default to empty object

/**
 * GET /api/settings
 * Retrieves the settings configuration AND a unified list of group names.
 * Requires authentication.
 */
fastify.get('/api/settings', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify(); // Verify JWT
    } catch (err) {
      fastify.log.warn(`Unauthorized GET attempt to /api/settings`);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
}, async (request, reply) => {
  try {
    // Fetch both settings and group names concurrently
    const [settingsData, groupNames] = await Promise.all([
      readSettings(fastify.log),
      getUnifiedGroupNames(fastify.log)
    ]);

    // Handle potentially null settings data
    const responseSettings = settingsData === null || settingsData === undefined ? {} : settingsData;

    reply.send({ settings: responseSettings, groupNames });

  } catch (error) {
    fastify.log.error(`Error retrieving settings or group names:`, error);
    // Distinguish between errors from settings vs group names if needed,
    // but a general failure is probably sufficient for the client.
    reply.code(500).send({ error: 'Failed to retrieve settings configuration.' });
  }
});

/**
 * POST /api/services
 * Overwrites the services configuration file with the provided data.
 * Requires authentication.
 * Expects the full services configuration array in the request body.
 */
fastify.post('/api/services', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify(); // Verify JWT
    } catch (err) {
      fastify.log.warn(`Unauthorized POST attempt to /api/services`);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
}, async (request, reply) => {
  const newServicesData = request.body;

  // Basic validation: Check if it's an array (Homepage expects an array of groups)
  if (!Array.isArray(newServicesData)) {
      fastify.log.warn('Invalid data format received for POST /api/services. Expected array.');
      return reply.code(400).send({ error: 'Invalid data format. Services configuration must be an array.' });
  }

  // --- Schema Validation ---
  const validationResult = validateServicesData(newServicesData, fastify.log);
  if (!validationResult.isValid) {
      fastify.log.warn('Services data failed schema validation.');
      // Format errors for better readability if possible
      const errorMessages = validationResult.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
      return reply.code(400).send({
          error: 'Invalid data format. Services configuration failed schema validation.',
          details: errorMessages, // Provide detailed errors
          rawErrors: validationResult.errors // Optionally send raw errors
      });
  }
  fastify.log.info('Services data passed schema validation.');
  // --- End Schema Validation ---

  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name for commit author
    const servicesFilename = 'services.yaml';
    const settingsFilename = 'settings.yaml';

    // 1. Write the new services data
    await writeConfigFile('services', newServicesData, fastify.log); // writeConfigFile no longer takes user details
    fastify.log.info(`Services configuration written successfully by user ${userEmail}`);

    // Commit services.yaml change
    try {
        await commitFile(servicesFilename, userEmail, userName, `Update ${servicesFilename} via services editor`);
    } catch (gitError) {
        fastify.log.error(`Git commit failed for ${servicesFilename} after saving services:`, gitError);
    }

    // 2. Update settings.yaml with default layouts for any new groups
    try {
        const currentSettings = await readSettings(fastify.log) || {};
        // readSettings returns layout as an array of {name, header, style, columns}
        if (!Array.isArray(currentSettings.layout)) {
            currentSettings.layout = [];
        }
        let settingsModified = false;
        const defaultLayout = { header: true, style: 'row', columns: 4 };
        const existingGroupNames = new Set(currentSettings.layout.map(entry => entry.name));

        if (Array.isArray(newServicesData)) {
            newServicesData.forEach(group => {
                if (typeof group === 'object' && group !== null) {
                    const groupName = Object.keys(group)[0];
                    if (groupName && !existingGroupNames.has(groupName)) {
                        currentSettings.layout.push({ name: groupName, ...defaultLayout });
                        existingGroupNames.add(groupName);
                        settingsModified = true;
                        fastify.log.info(`Adding default layout settings for new service group: ${groupName}`);
                    }
                }
            });
        }

        if (settingsModified) {
            await writeSettings(currentSettings, fastify.log);
            fastify.log.info(`Settings configuration updated with default layouts for new service groups by user ${userEmail}`);
            try {
                await commitFile(settingsFilename, userEmail, userName, `Update ${settingsFilename} with default layouts for new service groups`);
            } catch (gitError) {
                fastify.log.error(`Git commit failed for ${settingsFilename} after adding default layouts:`, gitError);
            }
        }
    } catch (settingsError) {
        fastify.log.error(`Error updating settings with default layouts after saving services:`, settingsError);
    }

    // Send success response for the primary operation (saving services)
    reply.send({ message: 'Services configuration updated successfully.' });

  } catch (error) {
    // writeConfigFile logs specific errors, send generic server error here
    fastify.log.error(`Error writing services configuration for user ${request.user.email}:`, error);
    reply.code(500).send({ error: 'Failed to update services configuration.' });
  }
});

/**
 * POST /api/widgets
 * Overwrites the widgets configuration file with the provided data.
 * Requires authentication.
 * Expects the full widgets configuration array in the request body.
 */
fastify.post('/api/widgets', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify(); // Verify JWT
    } catch (err) {
      fastify.log.warn(`Unauthorized POST attempt to /api/widgets`);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
}, async (request, reply) => {
  const newWidgetsData = request.body;

  // Basic validation: Check if it's an array (Homepage expects an array for widgets.yaml)
  if (!Array.isArray(newWidgetsData)) {
      fastify.log.warn('Invalid data format received for POST /api/widgets. Expected array.');
      return reply.code(400).send({ error: 'Invalid data format. Widgets configuration must be an array.' });
  }

  // --- Schema Validation ---
  const validationResultWidgets = validateWidgetsData(newWidgetsData, fastify.log);
  if (!validationResultWidgets.isValid) {
      fastify.log.warn('Widgets data failed schema validation.');
      const errorMessages = validationResultWidgets.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
      return reply.code(400).send({
          error: 'Invalid data format. Widgets configuration failed schema validation.',
          details: errorMessages,
          rawErrors: validationResultWidgets.errors
      });
  }
  fastify.log.info('Widgets data passed schema validation.');
  // --- End Schema Validation ---

  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name
    const widgetsFilename = 'widgets.yaml';

    await writeConfigFile('widgets', newWidgetsData, fastify.log); // writeConfigFile no longer takes user details
    fastify.log.info(`Widgets configuration updated successfully by user ${userEmail}`);

    // Commit widgets.yaml change
    try {
        await commitFile(widgetsFilename, userEmail, userName, `Update ${widgetsFilename} via widgets editor`);
    } catch (gitError) {
        fastify.log.error(`Git commit failed for ${widgetsFilename} after saving widgets:`, gitError);
    }

    reply.send({ message: 'Widgets configuration updated successfully.' });
  } catch (error) {
    // writeConfigFile logs specific errors, send generic server error here
    fastify.log.error(`Error writing widgets configuration for user ${request.user.email}:`, error);
    reply.code(500).send({ error: 'Failed to update widgets configuration.' });
  }
});

/**
 * PUT /api/widgets/order
 * Overwrites the widgets.yaml file with a new order of widgets.
 * Requires authentication.
 * Expects the full widgets configuration array (in the new order) in the request body.
 */
fastify.put('/api/widgets/order', {
  preHandler: [verifyAuth] // Ensure user is authenticated
}, async (request, reply) => {
  const newOrderedWidgetsData = request.body;
  fastify.log.debug({ msg: 'Received data for PUT /api/widgets/order', data: newOrderedWidgetsData }); // Log received data

  // Basic validation: Check if it's an array
  if (!Array.isArray(newOrderedWidgetsData)) {
    fastify.log.warn('Invalid data format received for PUT /api/widgets/order. Expected array.');
    return reply.code(400).send({ error: 'Invalid data format. Widgets configuration must be an array.' });
  }

  // --- Schema Validation ---
  // Validate the entire array of widgets to ensure each widget's structure is correct.
  const validationResultWidgets = validateWidgetsData(newOrderedWidgetsData, fastify.log);
  if (!validationResultWidgets.isValid) {
    fastify.log.warn('Reordered widgets data failed schema validation.');
    const errorMessages = validationResultWidgets.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
    return reply.code(400).send({
      error: 'Invalid data format. Widgets configuration failed schema validation.',
      details: errorMessages,
      rawErrors: validationResultWidgets.errors
    });
  }
  fastify.log.info('Reordered widgets data passed schema validation.');
  // --- End Schema Validation ---

  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name for commit author
    const widgetsFilename = 'widgets.yaml';

    // Overwrite the widgets.yaml file with the new ordered data
    fastify.log.info({ msg: 'Data before calling writeConfigFile for /api/widgets/order', data: newOrderedWidgetsData });
    await writeConfigFile('widgets', newOrderedWidgetsData, fastify.log);
    fastify.log.info(`Widgets configuration reordered and saved successfully by user ${userEmail}. Checking file content immediately after write...`);

    // Immediately read back and log the file content for verification
    try {
        const writtenData = await readConfigFile('widgets', fastify.log);
        fastify.log.info({ msg: 'Content of widgets.yaml immediately after writeConfigFile in /api/widgets/order', data: writtenData });
    } catch (readError) {
        fastify.log.error({ msg: 'Error reading back widgets.yaml immediately after write', error: readError });
    }

    // Commit widgets.yaml change
    try {
      await commitFile(widgetsFilename, userEmail, userName, `Reorder info widgets via editor`);
    } catch (gitError) {
      fastify.log.error(`Git commit failed for ${widgetsFilename} after reordering widgets:`, gitError);
      // Non-fatal for the primary operation, but log it.
    }

    reply.send({ message: 'Info widgets reordered successfully.' });

  } catch (error) {
    fastify.log.error(`Error reordering widgets configuration for user ${request.user.email}:`, error);
    reply.code(500).send({ error: 'Failed to reorder widgets configuration.' });
  }
});

/**
 * PUT /api/services/group/{groupName}/order
 * Updates the order of items within a specific service group.
 * Requires authentication.
 * Expects { items: [...] } in the body, where items is the ordered array of service objects for that group.
 */
fastify.put('/api/services/group/:groupName/order', {
  preHandler: [verifyAuth] // Use the existing auth verification hook
}, async (request, reply) => {
  const { groupName } = request.params;
  const { items } = request.body; // Expecting { items: [ { service1: {...} }, { service2: {...} }, ... ] }

  if (!groupName) {
    return reply.code(400).send({ error: 'Group name is required in the URL path.' });
  }
  if (!Array.isArray(items)) {
    fastify.log.warn(`Invalid data format received for PUT /api/services/group/${groupName}/order. Expected { items: [...] }.`);
    return reply.code(400).send({ error: 'Invalid data format. Expected { items: [...] } in the request body.' });
  }

  try {
    // 1. Read the current full services configuration
    const currentServicesData = await readConfigFile('services', fastify.log);

    // Handle case where the file doesn't exist or is empty
    if (!Array.isArray(currentServicesData)) {
        fastify.log.error(`Cannot reorder items: services.yaml not found or is not a valid array.`);
        return reply.code(404).send({ error: `Services configuration not found or invalid.` });
    }

    // 2. Find the index of the group to update
    const groupIndex = currentServicesData.findIndex(group =>
        typeof group === 'object' && group !== null && Object.keys(group)[0] === groupName
    );

    if (groupIndex === -1) {
        fastify.log.warn(`Group "${groupName}" not found for reordering in services.yaml.`);
        return reply.code(404).send({ error: `Group "${groupName}" not found.` });
    }

    // 3. Update the items within that specific group
    // The structure is [{ groupName: [item1, item2] }], so we update the array value
    currentServicesData[groupIndex][groupName] = items;
    fastify.log.debug(`Updated items for group "${groupName}":`, items);


    
        // 4. Write the entire modified configuration back
        const userEmail = request.user.email; // Get user email from JWT
        const userName = userEmail; // Use email as name
        const servicesFilename = 'services.yaml';

        await writeConfigFile('services', currentServicesData, fastify.log); // writeConfigFile no longer takes user details
        fastify.log.info(`Successfully reordered items in service group "${groupName}" by user ${userEmail}`);

        // Commit services.yaml change
        try {
            await commitFile(servicesFilename, userEmail, userName, `Reorder items in service group: ${groupName}`);
        } catch (gitError) {
            fastify.log.error(`Git commit failed for ${servicesFilename} after reordering group ${groupName}:`, gitError);
        }
    
        reply.send({ message: `Items in group "${groupName}" reordered successfully.` });
  } catch (error) {
    fastify.log.error(`Error reordering items in service group "${groupName}" for user ${request.user.email}:`, error);
    // Handle potential errors from read/writeConfigFile
    if (error.message.includes('Failed to write') || error.message.includes('Failed to read')) {
        reply.code(500).send({ error: `Failed to update services configuration file.` });
    } else {
        reply.code(500).send({ error: 'An unexpected error occurred while reordering service items.' });
    }
  }
});


// Helper function to get valid HOMEPAGE_* env keys
const getValidHomepageEnvKeys = async (logger) => {
    let envFilePath;
    if (process.env.DOTENV_PATH) {
        envFilePath = path.resolve(process.env.DOTENV_PATH);
        logger.debug(`Using explicit DOTENV_PATH for validation: ${envFilePath}`);
    } else if (process.env.EDITOR_DATA_DIR) {
        // Local development: Assume .env is in the project root (two levels up from backend)
        envFilePath = path.resolve(__dirname, '../../.env');
        logger.debug(`Using local development .env path for validation: ${envFilePath}`);
    } else {
        // Docker context (default)
        envFilePath = '/compose_root/.env';
        logger.debug(`Using default Docker .env path for validation: ${envFilePath}`);
    }

    // logger.debug(`Reading .env for validation from: ${envFilePath}`); // Already logged above
    try {
        const envFileContent = await fs.readFile(envFilePath);
        const parsedEnv = dotenv.parse(envFileContent);
        const allKeys = Object.keys(parsedEnv);
        const validKeys = allKeys.filter(key => key.startsWith('HOMEPAGE_VAR_') || key.startsWith('HOMEPAGE_FILE_'));
        logger.debug(`Found ${validKeys.length} valid HOMEPAGE_* keys in .env`);
        return validKeys;
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.info(`.env file not found at ${envFilePath} during validation. Assuming no valid keys.`);
            return [];
        } else {
            logger.error(`Error reading or parsing .env file at ${envFilePath} during validation:`, error);
            throw new Error('Failed to read environment variables file for validation.'); // Re-throw to signal failure
        }
    }
};

// Helper function to find used {{HOMEPAGE_...}} variables in bookmark data
const findUsedEnvVars = (bookmarksData) => {
    const usedVars = new Set();
    const varRegex = /{{(HOMEPAGE_(?:VAR|FILE)_[^}]+)}}/g; // Regex to find {{HOMEPAGE_VAR_XXX}} or {{HOMEPAGE_FILE_XXX}}

    if (!Array.isArray(bookmarksData)) {
        return []; // Should not happen if basic validation passes, but good practice
    }

    bookmarksData.forEach(group => {
        if (typeof group !== 'object' || group === null) return;
        const groupName = Object.keys(group)[0];
        const items = group[groupName];
        if (!Array.isArray(items)) return;

        items.forEach(item => {
            if (typeof item !== 'object' || item === null) return;
            const bookmarkName = Object.keys(item)[0];
            const details = item[bookmarkName];
            if (typeof details === 'object' && details !== null && typeof details.href === 'string') {
                let match;
                while ((match = varRegex.exec(details.href)) !== null) {
                    // Extract the variable name *without* the {{}}
                    const varName = match[1]; // Group 1 captures HOMEPAGE_...
                    usedVars.add(varName);
                }
            }
            // Handle the case where details might be an array (though schema should prevent this now)
             else if (Array.isArray(details)) {
                 details.forEach(detailItem => {
                     if (typeof detailItem === 'object' && detailItem !== null && typeof detailItem.href === 'string') {
                         let match;
                         while ((match = varRegex.exec(detailItem.href)) !== null) {
                             const varName = match[1];
                             usedVars.add(varName);
                         }
                     }
                 });
             }
        });
    });

    return Array.from(usedVars);
};


/**
 * POST /api/bookmarks
 * Overwrites the bookmarks configuration file with the provided data.
 * Requires authentication.
 * Expects the full bookmarks configuration array in the request body.
 */
fastify.post('/api/bookmarks', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify(); // Verify JWT
    } catch (err) {
      fastify.log.warn(`Unauthorized POST attempt to /api/bookmarks`);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
}, async (request, reply) => {
  const newBookmarksData = request.body;

  // DEBUG: Log the received data structure
  fastify.log.debug({ msg: 'Received data for POST /api/bookmarks', data: newBookmarksData });

  // Basic validation: Check if it's an array (Homepage expects an array of groups)
  if (!Array.isArray(newBookmarksData)) {
      fastify.log.warn('Invalid data format received for POST /api/bookmarks. Expected array.');
      return reply.code(400).send({ error: 'Invalid data format. Bookmarks configuration must be an array.' });
  }

  // --- Schema Validation ---
  const validationResultBookmarks = validateBookmarksData(newBookmarksData, fastify.log);
  if (!validationResultBookmarks.isValid) {
      fastify.log.warn('Bookmarks data failed schema validation.');
      const errorMessages = validationResultBookmarks.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
      return reply.code(400).send({
          error: 'Invalid data format. Bookmarks configuration failed schema validation.',
          details: errorMessages,
          rawErrors: validationResultBookmarks.errors
      });
  }
  fastify.log.info('Bookmarks data passed schema validation.');
  // --- End Schema Validation ---

  // --- Environment Variable Validation ---
  let validEnvKeys = [];
  try {
      validEnvKeys = await getValidHomepageEnvKeys(fastify.log);
  } catch (envError) {
      // If reading the .env file fails critically, stop the request
      return reply.code(500).send({ error: envError.message });
  }

  const usedVars = findUsedEnvVars(newBookmarksData);
  const missingVars = usedVars.filter(varName => !validEnvKeys.includes(varName));

  if (missingVars.length > 0) {
      fastify.log.warn(`Bookmark save rejected. Missing environment variables: ${missingVars.join(', ')}`);
      return reply.code(400).send({
          error: 'Missing environment variables',
          message: `The following environment variables used in bookmarks are not defined in the .env file: ${missingVars.join(', ')}. Please define them before saving.`,
          missing: missingVars // Provide the list for frontend handling
      });
  }
  fastify.log.info('Environment variable validation passed for bookmarks.');
  // --- End Environment Variable Validation ---


  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name
    const bookmarksFilename = 'bookmarks.yaml';
    const settingsFilename = 'settings.yaml';

    // 1. Write the new bookmarks data
    await writeConfigFile('bookmarks', newBookmarksData, fastify.log); // writeConfigFile no longer takes user details
    fastify.log.info(`Bookmarks configuration written successfully by user ${userEmail}`);

    // Commit bookmarks.yaml change
    try {
        await commitFile(bookmarksFilename, userEmail, userName, `Update ${bookmarksFilename} via bookmarks editor`);
    } catch (gitError) {
        fastify.log.error(`Git commit failed for ${bookmarksFilename} after saving bookmarks:`, gitError);
    }

    // 2. Update settings.yaml with default layouts for any new groups
    try {
        const currentSettings = await readSettings(fastify.log) || {};
        if (!Array.isArray(currentSettings.layout)) {
            currentSettings.layout = [];
        }
        let settingsModified = false;
        const defaultLayout = { header: true, style: 'row', columns: 4 };
        const existingGroupNames = new Set(currentSettings.layout.map(entry => entry.name));

        if (Array.isArray(newBookmarksData)) {
            newBookmarksData.forEach(group => {
                if (typeof group === 'object' && group !== null) {
                    const groupName = Object.keys(group)[0];
                    if (groupName && !existingGroupNames.has(groupName)) {
                        currentSettings.layout.push({ name: groupName, ...defaultLayout });
                        existingGroupNames.add(groupName);
                        settingsModified = true;
                        fastify.log.info(`Adding default layout settings for new bookmark group: ${groupName}`);
                    }
                }
            });
        }

        if (settingsModified) {
            await writeSettings(currentSettings, fastify.log);
            fastify.log.info(`Settings configuration updated with default layouts for new bookmark groups by user ${userEmail}`);
            try {
                await commitFile(settingsFilename, userEmail, userName, `Update ${settingsFilename} with default layouts for new bookmark groups`);
            } catch (gitError) {
                fastify.log.error(`Git commit failed for ${settingsFilename} after adding default layouts for bookmarks:`, gitError);
            }
        }
    } catch (settingsError) {
        // Log the error but don't fail the primary request, as bookmarks were saved.
        fastify.log.error(`Error updating settings with default layouts after saving bookmarks:`, settingsError);
    }

    // Send success response for the primary operation (saving bookmarks)
    reply.send({ message: 'Bookmarks configuration updated successfully.' });

  } catch (error) {
    // writeConfigFile logs specific errors, send generic server error here
    fastify.log.error(`Error writing bookmarks configuration for user ${request.user.email}:`, error);
    reply.code(500).send({ error: 'Failed to update bookmarks configuration.' });
  }
});

/**
 * PUT /api/bookmarks/group/{groupName}/order
 * Updates the order of items within a specific bookmark group.
 * Requires authentication.
 * Expects { items: [...] } in the body, where items is the ordered array of bookmark objects for that group.
 */
fastify.put('/api/bookmarks/group/:groupName/order', {
  preHandler: [verifyAuth] // Use the existing auth verification hook
}, async (request, reply) => {
  const { groupName } = request.params;
  const { items } = request.body; // Expecting { items: [ { bookmark1: {...} }, { bookmark2: {...} }, ... ] }

  if (!groupName) {
    return reply.code(400).send({ error: 'Group name is required in the URL path.' });
  }
  if (!Array.isArray(items)) {
    fastify.log.warn(`Invalid data format received for PUT /api/bookmarks/group/${groupName}/order. Expected { items: [...] }.`);
    return reply.code(400).send({ error: 'Invalid data format. Expected { items: [...] } in the request body.' });
  }

  try {
    // 1. Read the current full bookmarks configuration
    const currentBookmarksData = await readConfigFile('bookmarks', fastify.log);

    // Handle case where the file doesn't exist or is empty
    if (!Array.isArray(currentBookmarksData)) {
        fastify.log.error(`Cannot reorder items: bookmarks.yaml not found or is not a valid array.`);
        return reply.code(404).send({ error: `Bookmarks configuration not found or invalid.` });
    }

    // 2. Find the index of the group to update
    const groupIndex = currentBookmarksData.findIndex(group =>
        typeof group === 'object' && group !== null && Object.keys(group)[0] === groupName
    );

    if (groupIndex === -1) {
        fastify.log.warn(`Group "${groupName}" not found for reordering in bookmarks.yaml.`);
        return reply.code(404).send({ error: `Group "${groupName}" not found.` });
    }

    // 3. Update the items within that specific group
    // The structure is [{ groupName: [item1, item2] }], so we update the array value
    currentBookmarksData[groupIndex][groupName] = items;
    fastify.log.debug(`Updated items for group "${groupName}":`, items);


    
        // 4. Write the entire modified configuration back
        const userEmail = request.user.email; // Get user email from JWT
        const userName = userEmail; // Use email as name
        const bookmarksFilename = 'bookmarks.yaml';

        await writeConfigFile('bookmarks', currentBookmarksData, fastify.log); // writeConfigFile no longer takes user details
        fastify.log.info(`Successfully reordered items in bookmark group "${groupName}" by user ${userEmail}`);

        // Commit bookmarks.yaml change
        try {
            await commitFile(bookmarksFilename, userEmail, userName, `Reorder items in bookmark group: ${groupName}`);
        } catch (gitError) {
            fastify.log.error(`Git commit failed for ${bookmarksFilename} after reordering group ${groupName}:`, gitError);
        }
    
        reply.send({ message: `Items in group "${groupName}" reordered successfully.` });
  } catch (error) {
    fastify.log.error(`Error reordering items in bookmark group "${groupName}" for user ${request.user.email}:`, error);
    // Handle potential errors from read/writeConfigFile
    if (error.message.includes('Failed to write') || error.message.includes('Failed to read')) {
        reply.code(500).send({ error: `Failed to update bookmarks configuration file.` });
    } else {
        reply.code(500).send({ error: 'An unexpected error occurred while reordering bookmark items.' });
    }
  }
});

/**
 * PUT /api/bookmarks/groups-order
 * Reorders the bookmark groups in bookmarks.yaml.
 * Requires authentication.
 * Expects { orderedGroupNames: ["Group B", "Group A", ...] } in the request body.
 */
fastify.put('/api/bookmarks/groups-order', {
  preHandler: [verifyAuth]
}, async (request, reply) => {
  const { orderedGroupNames } = request.body;

  if (!Array.isArray(orderedGroupNames) || !orderedGroupNames.every(name => typeof name === 'string')) {
    fastify.log.warn('Invalid data format for PUT /api/bookmarks/groups-order. Expected { orderedGroupNames: ["...", ...] }.');
    return reply.code(400).send({ error: 'Invalid data format. Expected an array of group names.' });
  }

  try {
    const userEmail = request.user.email;
    const userName = userEmail;
    const bookmarksFilename = 'bookmarks.yaml';

    // 1. Read the current bookmarks configuration
    const currentBookmarksData = await readConfigFile('bookmarks', fastify.log);

    if (!Array.isArray(currentBookmarksData)) {
      fastify.log.error(`Cannot reorder groups: ${bookmarksFilename} not found or is not a valid array.`);
      return reply.code(404).send({ error: `${bookmarksFilename} not found or invalid.` });
    }

    // 2. Create a new array with groups in the specified order
    const reorderedBookmarksData = [];
    const existingGroupsMap = new Map();
    currentBookmarksData.forEach(groupObject => {
      if (typeof groupObject === 'object' && groupObject !== null) {
        const groupName = Object.keys(groupObject)[0];
        if (groupName) {
          existingGroupsMap.set(groupName, groupObject);
        }
      }
    });

    orderedGroupNames.forEach(groupName => {
      if (existingGroupsMap.has(groupName)) {
        reorderedBookmarksData.push(existingGroupsMap.get(groupName));
        existingGroupsMap.delete(groupName); // Remove from map to track processed groups
      } else {
        fastify.log.warn(`Group "${groupName}" provided in order list but not found in ${bookmarksFilename}. It will be ignored.`);
      }
    });

    // Add any groups that were in bookmarks.yaml but not in orderedGroupNames to the end
    // This preserves groups that might not have been included in the reorder request
    existingGroupsMap.forEach(groupObject => {
      const groupName = Object.keys(groupObject)[0];
      fastify.log.warn(`Group "${groupName}" from ${bookmarksFilename} was not in the ordered list and will be appended.`);
      reorderedBookmarksData.push(groupObject);
    });
    
    // 3. Validate the reordered data (optional, but good practice if structure might change)
    const validationResult = validateBookmarksData(reorderedBookmarksData, fastify.log);
    if (!validationResult.isValid) {
        fastify.log.warn(`Reordered bookmarks data failed schema validation. This might indicate an issue with the reordering logic or incoming data.`);
        const errorMessages = validationResult.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
        return reply.code(400).send({
            error: 'Reordered data failed schema validation.',
            details: errorMessages,
            rawErrors: validationResult.errors
        });
    }


    // 4. Write the reordered configuration back
    await writeConfigFile('bookmarks', reorderedBookmarksData, fastify.log);
    fastify.log.info(`Successfully reordered groups in ${bookmarksFilename} by user ${userEmail}`);

    // 5. Commit bookmarks.yaml change
    try {
      await commitFile(bookmarksFilename, userEmail, userName, `Reorder bookmark groups`);
    } catch (gitError) {
      fastify.log.error(`Git commit failed for ${bookmarksFilename} after reordering groups:`, gitError);
    }

    reply.send({ message: 'Bookmark groups reordered successfully.' });

  } catch (error) {
    fastify.log.error(`Error reordering bookmark groups for user ${request.user.email}:`, error);
    if (error.message.includes('Failed to write') || error.message.includes('Failed to read')) {
      reply.code(500).send({ error: `Failed to update ${bookmarksFilename}.` });
    } else {
      reply.code(500).send({ error: 'An unexpected error occurred while reordering bookmark groups.' });
    }
  }
});


/**
 * PUT /api/services/groups-order
 * Reorders the service groups in services.yaml to match the layout order.
 * Requires authentication.
 * Expects { orderedGroupNames: ["Group B", "Group A", ...] } in the request body.
 */
fastify.put('/api/services/groups-order', {
  preHandler: [verifyAuth]
}, async (request, reply) => {
  const { orderedGroupNames } = request.body;

  if (!Array.isArray(orderedGroupNames) || !orderedGroupNames.every(name => typeof name === 'string')) {
    fastify.log.warn('Invalid data format for PUT /api/services/groups-order. Expected { orderedGroupNames: ["...", ...] }.');
    return reply.code(400).send({ error: 'Invalid data format. Expected an array of group names.' });
  }

  try {
    const userEmail = request.user.email;
    const userName = userEmail;
    const servicesFilename = 'services.yaml';

    const currentServicesData = await readConfigFile('services', fastify.log);

    if (!Array.isArray(currentServicesData)) {
      fastify.log.error(`Cannot reorder groups: ${servicesFilename} not found or is not a valid array.`);
      return reply.code(404).send({ error: `${servicesFilename} not found or invalid.` });
    }

    const reorderedServicesData = [];
    const existingGroupsMap = new Map();
    currentServicesData.forEach(groupObject => {
      if (typeof groupObject === 'object' && groupObject !== null) {
        const groupName = Object.keys(groupObject)[0];
        if (groupName) {
          existingGroupsMap.set(groupName, groupObject);
        }
      }
    });

    orderedGroupNames.forEach(groupName => {
      if (existingGroupsMap.has(groupName)) {
        reorderedServicesData.push(existingGroupsMap.get(groupName));
        existingGroupsMap.delete(groupName);
      } else {
        fastify.log.warn(`Group "${groupName}" provided in order list but not found in ${servicesFilename}. It will be ignored.`);
      }
    });

    // Append any groups not in the ordered list to preserve them
    existingGroupsMap.forEach(groupObject => {
      const groupName = Object.keys(groupObject)[0];
      fastify.log.warn(`Group "${groupName}" from ${servicesFilename} was not in the ordered list and will be appended.`);
      reorderedServicesData.push(groupObject);
    });

    const validationResult = validateServicesData(reorderedServicesData, fastify.log);
    if (!validationResult.isValid) {
      fastify.log.warn('Reordered services data failed schema validation.');
      const errorMessages = validationResult.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
      return reply.code(400).send({
        error: 'Reordered data failed schema validation.',
        details: errorMessages,
        rawErrors: validationResult.errors
      });
    }

    await writeConfigFile('services', reorderedServicesData, fastify.log);
    fastify.log.info(`Successfully reordered groups in ${servicesFilename} by user ${userEmail}`);

    try {
      await commitFile(servicesFilename, userEmail, userName, 'Reorder service groups');
    } catch (gitError) {
      fastify.log.error(`Git commit failed for ${servicesFilename} after reordering groups:`, gitError);
    }

    reply.send({ message: 'Service groups reordered successfully.' });

  } catch (error) {
    fastify.log.error(`Error reordering service groups for user ${request.user.email}:`, error);
    if (error.message.includes('Failed to write') || error.message.includes('Failed to read')) {
      reply.code(500).send({ error: `Failed to update services.yaml.` });
    } else {
      reply.code(500).send({ error: 'An unexpected error occurred while reordering service groups.' });
    }
  }
});


/**
 * POST /api/settings
 * Overwrites the settings configuration file with the provided data.
 * Requires authentication.
 * Expects the full settings configuration object in the request body.
 */
fastify.post('/api/settings', {
  preHandler: async (request, reply) => {
    try {
      await request.jwtVerify(); // Verify JWT
    } catch (err) {
      fastify.log.warn(`Unauthorized POST attempt to /api/settings`);
      reply.code(401).send({ error: 'Unauthorized' });
    }
  }
}, async (request, reply) => {
  const newSettingsData = request.body;

  // Basic validation: Check if it's an object (Homepage expects an object for settings.yaml)
  if (typeof newSettingsData !== 'object' || newSettingsData === null || Array.isArray(newSettingsData)) {
      fastify.log.warn('Invalid data format received for POST /api/settings. Expected object.');
      return reply.code(400).send({ error: 'Invalid data format. Settings configuration must be an object.' });
  }

  // --- Schema Validation ---
  // Note: writeSettings also converts layout array back to object before writing
  // We should validate the data *before* this conversion happens if possible,
  // but the schema expects the object format for layout.
  // Let's validate the incoming data as is for now.
  // If writeSettings modifies it significantly before writing, validation might need adjustment.
  const validationResultSettings = validateSettingsData(newSettingsData, fastify.log);
   if (!validationResultSettings.isValid) {
      fastify.log.warn('Settings data failed schema validation.');
      // Log the detailed errors from AJV
      fastify.log.warn({ msg: 'AJV Validation Errors:', errors: validationResultSettings.errors });
      const errorMessages = validationResultSettings.errors.map(err => `${err.instancePath || '/'} ${err.message}`).join('; ');
      return reply.code(400).send({
          error: 'Invalid data format. Settings configuration failed schema validation.',
          details: errorMessages,
          rawErrors: validationResultSettings.errors
      });
  }
  fastify.log.info('Settings data passed schema validation.');
  // --- End Schema Validation ---


  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name
    const settingsFilename = 'settings.yaml';

    // Use the specific writeSettings function from configUtils
    // It already handles writing to the correct file and converts layout array back to object
    await writeSettings(newSettingsData, fastify.log); // writeSettings no longer takes user details
    fastify.log.info(`Settings configuration updated successfully by user ${userEmail}`);

    // Commit settings.yaml change
    try {
        await commitFile(settingsFilename, userEmail, userName, `Update ${settingsFilename} via settings editor`);
    } catch (gitError) {
        fastify.log.error(`Git commit failed for ${settingsFilename} after saving settings:`, gitError);
    }

    reply.send({ message: 'Settings configuration updated successfully.' });
  } catch (error) {
    // writeSettings logs specific errors, send appropriate status code
    fastify.log.error(`Error writing settings configuration for user ${request.user.email}:`, error);
    if (error.message.startsWith('Invalid settings data')) {
        reply.code(400).send({ error: error.message });
    } else {
        // Log the detailed error before sending a generic response
        fastify.log.error({
            msg: `Error writing settings configuration for user ${request.user.email}`,
            errorMsg: error.message,
            errorStack: error.stack,
            errorCode: error.code // Include error code if available (e.g., EACCES)
        });
        reply.code(500).send({ error: 'Failed to update settings configuration. Check server logs for details.' }); // Updated user message
        }
      }
    });


// --- Settings Group Management Routes ---

/**
 * PUT /api/settings/groups/:oldName/rename
 * Renames a group across settings.yaml, services.yaml, and bookmarks.yaml.
 * Requires authentication.
 * Expects { newName: "New Group Name" } in the request body.
 */
fastify.put('/api/settings/groups/:oldName/rename', {
  preHandler: [verifyAuth] // Ensure user is authenticated
}, async (request, reply) => {
  const { oldName } = request.params;
  const { newName } = request.body;

  if (!oldName) {
    return reply.code(400).send({ error: 'Old group name is required in the URL path.' });
  }
  if (!newName || typeof newName !== 'string' || newName.trim() === '') {
    return reply.code(400).send({ error: 'New group name is required in the request body and cannot be empty.' });
  }
  if (oldName === newName) {
    return reply.code(400).send({ error: 'New group name cannot be the same as the old group name.' });
  }

  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name
    const settingsFilename = 'settings.yaml';
    const servicesFilename = 'services.yaml';
    const bookmarksFilename = 'bookmarks.yaml';

    // Call the utility function to handle renaming across files
    // Note: renameGroup itself doesn't accept user details anymore
    await renameGroup(oldName, newName, fastify.log); // renameGroup no longer takes user details

    fastify.log.info(`Successfully renamed group '${oldName}' to '${newName}' by user ${userEmail}`);

    // Commit changes for potentially affected files
    // We commit all three, accepting potential empty commits if a file wasn't touched
    const commitMessage = `Rename group '${oldName}' to '${newName}'`;
    try {
        await commitFile(settingsFilename, userEmail, userName, commitMessage);
        await commitFile(servicesFilename, userEmail, userName, commitMessage);
        await commitFile(bookmarksFilename, userEmail, userName, commitMessage);
    } catch (gitError) {
        fastify.log.error(`Git commit failed after renaming group '${oldName}':`, gitError);
    }

    reply.send({ message: `Group '${oldName}' successfully renamed to '${newName}'.` });

  } catch (error) {
    fastify.log.error(`Error renaming group '${oldName}' to '${newName}' for user ${request.user.email}:`, error);
    // Handle specific errors thrown by renameGroup or underlying functions
    if (error.message.includes('not found in settings.yaml')) {
        reply.code(404).send({ error: error.message }); // Group not found in the primary file
    } else if (error.message.includes('Failed to write') || error.message.includes('Failed to read')) {
        reply.code(500).send({ error: `Failed to update configuration file during rename.` });
    } else {
        reply.code(500).send({ error: 'An unexpected error occurred while renaming the group.' });
    }
  }
});

/**
 * DELETE /api/settings/groups/:groupName
 * Deletes a group across settings.yaml, services.yaml, and bookmarks.yaml.
 * Requires authentication.
 */
fastify.delete('/api/settings/groups/:groupName', {
  preHandler: [verifyAuth] // Ensure user is authenticated
}, async (request, reply) => {
  const { groupName } = request.params;

  if (!groupName) {
    return reply.code(400).send({ error: 'Group name is required in the URL path.' });
  }

  try {
    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name
    const settingsFilename = 'settings.yaml';
    const servicesFilename = 'services.yaml';
    const bookmarksFilename = 'bookmarks.yaml';

    // Call the utility function to handle deletion across files
    // Note: deleteGroup itself doesn't accept user details anymore
    await deleteGroup(groupName, fastify.log); // deleteGroup no longer takes user details

    fastify.log.info(`Successfully deleted group '${groupName}' by user ${userEmail}`);

    // Commit changes for potentially affected files
    const commitMessage = `Delete group '${groupName}' (items moved to Uncategorized)`;
    try {
        await commitFile(settingsFilename, userEmail, userName, commitMessage);
        await commitFile(servicesFilename, userEmail, userName, commitMessage);
        await commitFile(bookmarksFilename, userEmail, userName, commitMessage);
    } catch (gitError) {
        fastify.log.error(`Git commit failed after deleting group '${groupName}':`, gitError);
    }

    reply.send({ message: `Group '${groupName}' successfully deleted.` }); // Use 200 OK or 204 No Content

  } catch (error) {
    fastify.log.error(`Error deleting group '${groupName}' for user ${request.user.email}:`, error);
    // Handle specific errors thrown by deleteGroup or underlying functions
    if (error.message.includes('not found in settings.yaml')) {
        reply.code(404).send({ error: error.message }); // Group not found in the primary file
    } else if (error.message.includes('Failed to write') || error.message.includes('Failed to read')) {
        reply.code(500).send({ error: `Failed to update configuration file during deletion.` });
    } else {
        reply.code(500).send({ error: 'An unexpected error occurred while deleting the group.' });
    }
  }
});


// --- Raw File Editing Routes ---

/**
 * Route to list editable configuration files.
 */
fastify.get('/api/files', { preHandler: [verifyAuth] }, async (request, reply) => { // Added verifyAuth hook
  try {
    // Check if the config directory exists
    try {
      // Use the CONFIG_DIR variable defined at the top (derived from env var or default)
      await fs.access(CONFIG_DIR);
    } catch (err) {
      if (err.code === 'ENOENT') {
        fastify.log.error(`Configuration directory not found: ${CONFIG_DIR}. Ensure EDITOR_DATA_DIR is set correctly or the default /config volume is mounted.`);
        // Return empty list as the frontend expects an array.
        // The frontend should display a message indicating no files found or directory missing.
        return [];
      }
      // Rethrow other access errors (e.g., permissions)
      fastify.log.error(`Error accessing config directory ${CONFIG_DIR}:`, err);
      throw err; // Let the outer catch handle sending a 500 error
    }

    // Read the correct CONFIG_DIR
    const dirents = await fs.readdir(CONFIG_DIR, { withFileTypes: true });
    const files = await Promise.all(
      dirents
        .filter(dirent => dirent.isFile()) // Only include files
        .filter(dirent => ALLOWED_EXTENSIONS.includes(path.extname(dirent.name).toLowerCase())) // Filter by allowed extensions
        .map(async (dirent) => {
          const filePath = path.join(CONFIG_DIR, dirent.name);
          try {
            const stats = await fs.stat(filePath);
            return {
              name: dirent.name,
              // Determine type based on extension for simplicity
              type: path.extname(dirent.name).toLowerCase().substring(1),
              modified_at: stats.mtime, // Last modified time
              size: stats.size, // File size in bytes
            };
          } catch (statErr) {
            fastify.log.error(`Error getting stats for file ${filePath}:`, statErr);
            // Return null or a placeholder if stats fail for a specific file
            return null;
          }
        })
    );

    // Filter out any null results from stat errors
    const validFiles = files.filter(file => file !== null);

    // Sort files alphabetically by name
    validFiles.sort((a, b) => a.name.localeCompare(b.name));

    return validFiles;

  } catch (err) {
    fastify.log.error('Error reading config directory:', err);
    reply.code(500).send({ error: 'Failed to list configuration files.' });
  }
});

/**
 * Route to get the content of a specific configuration file.
 */
fastify.get('/api/files/:filename', { preHandler: [verifyAuth] }, async (request, reply) => { // Added verifyAuth hook
  const { filename } = request.params;

  // Basic sanitization: prevent directory traversal
  // Resolve the path and ensure it stays within CONFIG_DIR
  const requestedPath = path.join(CONFIG_DIR, filename);
  const resolvedPath = path.resolve(requestedPath);

  if (!resolvedPath.startsWith(path.resolve(CONFIG_DIR))) {
    fastify.log.warn(`Attempted directory traversal: ${filename}`);
    reply.code(400).send({ error: 'Invalid filename.' });
    return;
  }

  // Check if the resolved path points to a file with an allowed extension
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    reply.code(400).send({ error: 'Invalid file type.' });
    return;
  }

  try {
    // Check existence again with the resolved path
    await fs.access(resolvedPath);
    const content = await fs.readFile(resolvedPath, 'utf8');
    reply.send({ content });
  } catch (err) {
    if (err.code === 'ENOENT') {
      fastify.log.info(`File not found: ${resolvedPath}`);
      reply.code(404).send({ error: 'File not found.' });
    } else {
      fastify.log.error(`Error reading file ${resolvedPath}:`, err);
      reply.code(500).send({ error: 'Failed to read file.' });
    }
  }
});

/**
 * Route to save content to a specific configuration file.
 */
fastify.put('/api/files/:filename', { preHandler: [verifyAuth] }, async (request, reply) => { // Added verifyAuth hook
  const { filename } = request.params;
  const { content } = request.body; // Assuming content is sent in the request body

  if (content === undefined || content === null) {
    reply.code(400).send({ error: 'Missing file content.' });
    return;
  }

  // Basic sanitization: prevent directory traversal
  const requestedPath = path.join(CONFIG_DIR, filename);
  const resolvedPath = path.resolve(requestedPath);

  if (!resolvedPath.startsWith(path.resolve(CONFIG_DIR))) {
    fastify.log.warn(`Attempted directory traversal during save: ${filename}`);
    reply.code(400).send({ error: 'Invalid filename.' });
    return;
  }

  // Check if the resolved path points to a file with an allowed extension
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    reply.code(400).send({ error: 'Invalid file type for saving.' });
    return;
  }

  try {
    // Validate YAML syntax for .yaml/.yml files before writing
    if (ext === '.yaml' || ext === '.yml') {
      try {
        yaml.load(content); // Attempt to parse the content
        fastify.log.info(`YAML syntax validation passed for ${resolvedPath}`);
      } catch (yamlError) {
        if (yamlError instanceof yaml.YAMLException) {
          fastify.log.warn(`Invalid YAML syntax detected in ${resolvedPath}: ${yamlError.message}`);
          // Return a specific error message indicating YAML issue
          // Return the reply object to ensure execution stops immediately
          return reply.code(400).send({ error: `Invalid YAML syntax: ${yamlError.message}` });
        } else {
          throw yamlError; // Re-throw unexpected errors during parsing
        }
      }
    }

    const userEmail = request.user.email; // Get user email from JWT
    const userName = userEmail; // Use email as name

    // Use the utility function to handle directory checks and writing
    await writeRawConfigFile(filename, content, fastify.log); // writeRawConfigFile no longer takes user details

    fastify.log.info(`Raw file saved successfully via utility: ${resolvedPath} by user ${userEmail}`);

    // Commit the raw file change
    try {
        await commitFile(filename, userEmail, userName, `Update ${filename} via raw editor`);
    } catch (gitError) {
        fastify.log.error(`Git commit failed for ${filename} after saving raw file:`, gitError);
    }

    reply.send({ message: 'File saved successfully.' });
  } catch (err) {
    // Log the specific file system error
    // Log the *entire* error object for detailed diagnostics
    // Catch errors from YAML validation or the writeRawConfigFile utility
    // Log specific FS error properties if available
    fastify.log.error({
        msg: `Error during raw file save process for ${filename}`,
        errorCode: err.code,
        errorNo: err.errno,
        syscall: err.syscall,
        path: err.path,
        errorMessage: err.message,
        // Optionally log the full error stack if needed for deeper debugging
        // errorStack: err.stack
    });
    // Send back a more informative error message including the code if possible
    const detail = err.code ? `${err.code} - ${err.message}` : (err.message || 'Unknown server error during file save.');
    reply.code(500).send({ error: `Save failed: ${detail}. Check permissions.` });
  }
});

/**
 * Route to get the commit history for a specific configuration file.
 */
fastify.get('/api/files/:filename/history', { preHandler: [verifyAuth] }, async (request, reply) => {
  const { filename } = request.params;

  // Basic sanitization (similar to GET /api/files/:filename)
  const requestedPath = path.join(CONFIG_DIR, filename);
  const resolvedPath = path.resolve(requestedPath);
  if (!resolvedPath.startsWith(path.resolve(CONFIG_DIR))) {
    fastify.log.warn(`Attempted directory traversal for history: ${filename}`);
    return reply.code(400).send({ error: 'Invalid filename.' });
  }
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return reply.code(400).send({ error: 'Invalid file type.' });
  }

  try {
    const history = await getFileHistory(filename); // Use filename relative to CONFIG_DIR
    reply.send(history);
  } catch (error) {
    fastify.log.error(`Error getting history for file ${filename}:`, error);
    // getFileHistory might return empty array for files not found in git,
    // so only send 500 for unexpected errors.
    reply.code(500).send({ error: `Failed to get history for ${filename}.` });
  }
});

/**
 * Route to revert a file to a specific commit hash.
 */
fastify.post('/api/files/:filename/rollback', { preHandler: [verifyAuth] }, async (request, reply) => {
  const { filename } = request.params;
  const { commitHash } = request.body; // Expect commit hash in the body

  if (!commitHash || typeof commitHash !== 'string' || commitHash.length < 7) { // Basic validation
    return reply.code(400).send({ error: 'Missing or invalid commitHash in request body.' });
  }

  // Basic sanitization (similar to GET /api/files/:filename)
  const requestedPath = path.join(CONFIG_DIR, filename);
  const resolvedPath = path.resolve(requestedPath);
  if (!resolvedPath.startsWith(path.resolve(CONFIG_DIR))) {
    fastify.log.warn(`Attempted directory traversal for rollback: ${filename}`);
    return reply.code(400).send({ error: 'Invalid filename.' });
  }
  const ext = path.extname(resolvedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return reply.code(400).send({ error: 'Invalid file type.' });
  }

  try {
    const userEmail = request.user.email;
    const userName = userEmail; // Use email as name

    await revertToCommit(filename, commitHash, userEmail, userName);

    fastify.log.info(`Successfully reverted ${filename} to ${commitHash} by user ${userEmail}`);
    reply.send({ message: `File ${filename} successfully reverted to commit ${commitHash.substring(0, 7)}.` });

  } catch (error) {
    fastify.log.error(`Error reverting file ${filename} to commit ${commitHash}:`, error);
    // Check for specific git errors if needed (e.g., invalid hash)
    reply.code(500).send({ error: `Failed to revert ${filename} to commit ${commitHash}.` });
  }
});

// --- Environment Variable Route ---

/**
 * GET /api/env
 * Retrieves the keys (not values) defined in the .env file within the config directory.
 * Requires authentication.
 */
fastify.get('/api/env', { preHandler: [verifyAuth] }, async (request, reply) => {
    let envFilePath;
    if (process.env.DOTENV_PATH) {
        envFilePath = path.resolve(process.env.DOTENV_PATH);
        fastify.log.info(`Using explicit DOTENV_PATH for GET /api/env: ${envFilePath}`);
    } else if (process.env.EDITOR_DATA_DIR) {
        // Local development: .env is in the data directory
        envFilePath = path.join(process.env.EDITOR_DATA_DIR, '.env');
         fastify.log.info(`Using local development .env path for GET /api/env: ${envFilePath}`);
    } else {
        // Docker context (default)
        envFilePath = '/compose_root/.env';
         fastify.log.info(`Using default Docker .env path for GET /api/env: ${envFilePath}`);
    }

  // fastify.log.info(`Attempting to read .env file from: ${envFilePath}`); // Already logged above
  try {
    // Attempt to read the .env file
    const envFileContent = await fs.readFile(envFilePath);
    // Parse the buffer content using dotenv
    const parsedEnv = dotenv.parse(envFileContent);
    // Filter keys to include only those starting with HOMEPAGE_VAR_ or HOMEPAGE_FILE_
    const allKeys = Object.keys(parsedEnv);
    const envKeys = allKeys.filter(key => key.startsWith('HOMEPAGE_VAR_') || key.startsWith('HOMEPAGE_FILE_'));
    fastify.log.info(`Successfully retrieved and filtered ${envKeys.length} HOMEPAGE_* keys from .env file for user ${request.user.email}`);
    reply.send({ keys: envKeys });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // .env file doesn't exist, return empty list
      fastify.log.info(`.env file not found at ${envFilePath}. Returning empty list.`);
      reply.send({ keys: [] });
    } else {
      // Other errors (e.g., permissions)
      fastify.log.error(`Error reading or parsing .env file at ${envFilePath}:`, error);
      reply.code(500).send({ error: 'Failed to read environment variables file.' });
    }
  }
});

// --- Image Management Routes ---

/**
 * GET /api/images
 * Lists all images in the image directory.
 * Requires authentication.
 */
fastify.get('/api/images', { preHandler: [verifyAuth] }, async (request, reply) => {
  try {
    await fs.access(IMAGES_DIR); // Check if dir exists
    const files = await fs.readdir(IMAGES_DIR);
    // Filter for common image extensions to be safe
    const imageFiles = files.filter(file => /\.(jpe?g|png|gif|webp|svg)$/i.test(file));
    
    const imageObjects = imageFiles.map(file => ({
        name: file,
        url: `/api/images/view/${encodeURIComponent(file)}`
    }));
    // Sort images by name for consistent ordering
    imageObjects.sort((a, b) => a.name.localeCompare(b.name));

    reply.send(imageObjects);
  } catch (err) {
    if (err.code === 'ENOENT') {
      fastify.log.info(`Images directory not found when listing: ${IMAGES_DIR}. Returning empty list.`);
      return reply.send([]); // Send empty array if dir doesn't exist
    }
    fastify.log.error('Error listing images:', err);
    reply.code(500).send({ error: 'Failed to list images.' });
  }
});

/**
 * GET /api/images/view/:filename
 * Serves a specific image file.
 * Authentication is removed from this route as browsers don't send Auth headers for <img> src.
 * The images are served based on their filename; obscurity is not security,
 * but other operations (upload, delete, list) remain authenticated.
 */
fastify.get('/api/images/view/:filename', async (request, reply) => {
    const { filename } = request.params;
    // The line below was duplicated in a previous diff, removing it.
    // const { filename: rawFilename } = request.params;
    const rawFilename = filename; // Use the destructured filename

    // Basic sanitization to prevent path traversal.
    // Normalize to prevent tricks like '..\file' and ensure it doesn't try to escape the IMAGES_DIR.
    // path.basename will return only the last portion of a path, stripping directory info.
    const sanitizedFilename = path.basename(rawFilename);

    if (sanitizedFilename !== rawFilename || rawFilename.includes('..') || rawFilename.includes('/')) {
      fastify.log.warn(`Attempted path traversal or invalid characters in image view filename: ${rawFilename}`);
      return reply.code(400).send({ error: 'Invalid filename.' });
    }

    const fullPathToImage = path.join(IMAGES_DIR, sanitizedFilename);
    fastify.log.debug(`Attempting to serve image from: ${fullPathToImage}`);

    try {
      // Check if file exists before attempting to send
      await fs.access(fullPathToImage);
      
      // Use reply.sendFile with just the filename, Fastify resolves it against the root.
      // The second argument to reply.sendFile is the root directory.
      return reply.sendFile(sanitizedFilename, IMAGES_DIR);

    } catch (err) {
      fastify.log.error(`Error serving image ${sanitizedFilename} from ${IMAGES_DIR}:`, err);
      if (err.code === 'ENOENT') {
            reply.code(404).send({ error: 'Image not found.' });
        } else {
            // Use sanitizedFilename for logging consistency if it was the one used in fs.access
            fastify.log.error(`Error serving image ${sanitizedFilename || rawFilename}:`, err);
            reply.code(500).send({ error: 'Failed to serve image.' });
        }
    }
});

/**
 * POST /api/images/upload
 * Uploads a new image. Uses @fastify/multipart for file handling.
 * Requires authentication.
 */
fastify.post('/api/images/upload', { preHandler: [verifyAuth] }, async (request, reply) => {
  let data;
  try {
    data = await request.file();
  } catch (err) {
    fastify.log.warn(`Image upload parse error: ${err.message}`);
    return reply.code(400).send({ error: 'Invalid upload request.' });
  }

  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded.' });
  }

  // Validate MIME type
  if (!data.mimetype.startsWith('image/')) {
    return reply.code(400).send({ error: 'Not an image! Please upload only images.' });
  }

  // Read file into buffer and check if it was truncated (size limit exceeded)
  const buffer = await data.toBuffer();
  if (data.file.truncated) {
    return reply.code(413).send({ error: 'File too large. Maximum size is 5MB.' });
  }

  const sanitizedFilename = sanitizeImageFilename(data.filename);
  fastify.log.info(`Original filename: "${data.filename}", Sanitized to: "${sanitizedFilename}"`);

  const filePath = path.join(IMAGES_DIR, sanitizedFilename);
  await fs.writeFile(filePath, buffer);

  fastify.log.info(`Image uploaded: ${sanitizedFilename} by user ${request.user.email}`);
  reply.send({
    message: 'Image uploaded successfully.',
    filename: sanitizedFilename,
    url: `/api/images/view/${encodeURIComponent(sanitizedFilename)}`
  });
});


/**
 * DELETE /api/images/:filename
 * Deletes a specific image.
 * Requires authentication.
 */
fastify.delete('/api/images/:filename', { preHandler: [verifyAuth] }, async (request, reply) => {
  const { filename } = request.params;
  const filePath = path.join(IMAGES_DIR, filename);

  // Sanitize to prevent path traversal
  const resolvedImagePath = path.resolve(filePath);
  if (!resolvedImagePath.startsWith(path.resolve(IMAGES_DIR))) {
    fastify.log.warn(`Attempted path traversal for image delete: ${filename}`);
    return reply.code(400).send({ error: 'Invalid filename.' });
  }

  try {
    await fs.access(resolvedImagePath); // Check if file exists
    await fs.unlink(resolvedImagePath);
    fastify.log.info(`Image deleted: ${filename} by user ${request.user.email}`);
    reply.send({ message: 'Image deleted successfully.' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      reply.code(404).send({ error: 'Image not found.' });
    } else {
      fastify.log.error(`Error deleting image ${filename}:`, err);
      reply.code(500).send({ error: 'Failed to delete image.' });
    }
  }
});

// --- End Image Management Routes ---

// Catch-all route for SPA: serve index.html for any non-API, non-file GET requests
// This should be registered after API routes and after fastifyStatic.
fastify.get('/*', (request, reply) => {
  // If the request is not for an API endpoint, serve the main index.html file.
  // fastifyStatic will have already tried to serve existing static files.
  if (!request.raw.url.startsWith('/api/')) {
    reply.sendFile('index.html', FRONTEND_PATH);
  } else {
    // If it's an API route that wasn't caught by other handlers, it's a 404.
    // This case should ideally be handled by specific API route 404s or a more specific notFoundHandler for /api/*
    reply.code(404).send({ error: 'API endpoint not found.' });
  }
});

/**
 * Run the server!
 */
const start = async () => {
  try {
    // Initialize the database first
    await initDatabase();

    // Initialize the validators (load schemas)
    await initializeValidators(fastify.log); // Pass the logger instance

    // Ensure Image directory exists
    try {
      await fs.mkdir(IMAGES_DIR, { recursive: true });
      fastify.log.info(`Image directory ensured/created at: ${IMAGES_DIR}`);
    } catch (err) {
      fastify.log.error(`Failed to create image directory ${IMAGES_DIR}. Image uploads may fail. Error:`, err);
      // This is not necessarily fatal for the server to start, but uploads will fail.
    }

    // Initialize Git repository if needed
    fastify.log.info(`Checking Git status in config directory: ${CONFIG_DIR}`);
    const gitAvailable = await checkGitAvailability();
    if (gitAvailable) {
      const isRepo = await isGitRepository(CONFIG_DIR);
      if (!isRepo) {
        await initializeRepository(CONFIG_DIR);
      } else {
        fastify.log.info('Git repository already initialized.');
      }
    } else {
      fastify.log.warn('Git not available. Versioning features will be disabled.');
      // Potentially set a global flag to disable Git-related API endpoints/features
    }

    // Listen on all available network interfaces inside the container
    // Port 3000 is exposed in the Dockerfile and mapped in docker-compose.yml
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
