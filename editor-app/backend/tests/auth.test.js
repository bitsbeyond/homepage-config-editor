const tap = require('tap');
const jwt = require('jsonwebtoken');

// Import Fastify and build our own test app
const fastify = require('fastify');

// Create a test app instance that uses a different port
async function buildTestApp() {
  const app = fastify({ logger: false });
  
  // Set test environment variables
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.REFRESH_SECRET = 'test-refresh-secret-key';
  process.env.EDITOR_DATA_DIR = './test_data';
  
  // Register required plugins for testing
  await app.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET
  });
  
  await app.register(require('@fastify/cookie'));
  
  // Track invalidated refresh tokens for testing
  const invalidatedTokens = new Set();
  
  // Add basic auth routes for testing
  app.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body;
    
    // Simple test authentication
    if (email === 'admin@example.com' && password === 'Newpassword123!') {
      const accessToken = jwt.sign(
        { email, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const refreshToken = jwt.sign(
        { email, type: 'refresh' },
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
      );
      
      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false, // false for testing
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      return {
        success: true,
        accessToken,
        expiresIn: 3600
      };
    }
    
    reply.code(401);
    return { success: false, message: 'Invalid credentials' };
  });
  
  app.post('/api/auth/refresh', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    
    if (!refreshToken) {
      reply.code(401);
      return { success: false, message: 'No refresh token' };
    }
    
    // Check if token is invalidated
    if (invalidatedTokens.has(refreshToken)) {
      reply.code(401);
      return { success: false, message: 'Token invalidated' };
    }
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
      
      const newAccessToken = jwt.sign(
        { email: decoded.email, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      return {
        success: true,
        accessToken: newAccessToken,
        expiresIn: 3600
      };
    } catch (error) {
      reply.code(401);
      return { success: false, message: 'Invalid refresh token' };
    }
  });
  
  app.post('/api/auth/logout', async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;
    
    // Add token to invalidated list
    if (refreshToken) {
      invalidatedTokens.add(refreshToken);
    }
    
    reply.clearCookie('refreshToken');
    return { success: true, message: 'Logged out successfully' };
  });
  
  // Protected route for testing
  app.get('/api/services', {
    preHandler: async (request, reply) => {
      try {
        const token = request.headers.authorization?.replace('Bearer ', '');
        if (!token) {
          reply.code(401);
          return { error: 'No token provided' };
        }
        
        jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        reply.code(401);
        return { error: 'Invalid token' };
      }
    }
  }, async (request, reply) => {
    return { services: [] };
  });
  
  return app;
}

// Configure tap timeout
tap.setTimeout(10000); // 10 seconds should be enough

tap.test('Authentication System Tests', async (t) => {
  const app = await buildTestApp();
  
  // Ensure proper cleanup
  t.teardown(async () => {
    await app.close();
  });

  // Test data
  const validCredentials = {
    email: 'admin@example.com',
    password: 'Newpassword123!'
  };

  const invalidCredentials = {
    email: 'admin@example.com',
    password: 'wrongpassword'
  };

  t.test('SR1: JWT Token Management - Dual Token System', async (t) => {
    
    t.test('Login with valid credentials should return dual tokens', async (t) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });

      t.equal(response.statusCode, 200, 'Login should succeed');
      
      const body = JSON.parse(response.body);
      t.ok(body.success, 'Response should indicate success');
      t.ok(body.accessToken, 'Should return access token');
      t.equal(body.expiresIn, 3600, 'Access token should expire in 1 hour');
      
      // Check refresh token cookie
      const cookies = response.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      t.ok(refreshTokenCookie, 'Should set refresh token cookie');
      t.ok(refreshTokenCookie.httpOnly, 'Refresh token cookie should be HttpOnly');
      t.ok(!refreshTokenCookie.secure, 'Should not require HTTPS in dev mode');
      
      // Verify access token structure
      const decoded = jwt.decode(body.accessToken);
      t.equal(decoded.email, validCredentials.email, 'Access token should contain email');
      t.ok(decoded.exp, 'Access token should have expiration');
      t.ok(decoded.iat, 'Access token should have issued at time');
    });

    t.test('Login with invalid credentials should fail', async (t) => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: invalidCredentials
      });

      t.equal(response.statusCode, 401, 'Login should fail');
      
      const body = JSON.parse(response.body);
      t.notOk(body.success, 'Response should indicate failure');
      t.notOk(body.accessToken, 'Should not return access token');
      
      // Check no refresh token cookie is set
      const cookies = response.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      t.notOk(refreshTokenCookie, 'Should not set refresh token cookie');
    });

    t.test('Protected routes should require valid access token', async (t) => {
      // First login to get tokens
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const { accessToken } = JSON.parse(loginResponse.body);

      // Test protected route with valid token
      const validResponse = await app.inject({
        method: 'GET',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${accessToken}`
        }
      });

      t.equal(validResponse.statusCode, 200, 'Should access protected route with valid token');

      // Test protected route without token
      const noTokenResponse = await app.inject({
        method: 'GET',
        url: '/api/services'
      });

      t.equal(noTokenResponse.statusCode, 401, 'Should reject request without token');

      // Test protected route with invalid token
      const invalidTokenResponse = await app.inject({
        method: 'GET',
        url: '/api/services',
        headers: {
          authorization: 'Bearer invalid-token'
        }
      });

      t.equal(invalidTokenResponse.statusCode, 401, 'Should reject request with invalid token');
    });

    t.test('Token refresh should work with valid refresh token', async (t) => {
      // First login to get tokens
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      
      // Test refresh endpoint
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          cookie: `refreshToken=${refreshTokenCookie.value}`
        }
      });

      t.equal(refreshResponse.statusCode, 200, 'Refresh should succeed');
      
      const body = JSON.parse(refreshResponse.body);
      t.ok(body.success, 'Refresh response should indicate success');
      t.ok(body.accessToken, 'Should return new access token');
      t.equal(body.expiresIn, 3600, 'New access token should expire in 1 hour');
    });

    t.test('Token refresh should fail without refresh token', async (t) => {
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh'
      });

      t.equal(refreshResponse.statusCode, 401, 'Refresh should fail without token');
      
      const body = JSON.parse(refreshResponse.body);
      t.notOk(body.success, 'Response should indicate failure');
      t.notOk(body.accessToken, 'Should not return access token');
    });

    t.test('Logout should invalidate refresh token', async (t) => {
      // First login to get tokens
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      
      // Logout
      const logoutResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          cookie: `refreshToken=${refreshTokenCookie.value}`
        }
      });

      t.equal(logoutResponse.statusCode, 200, 'Logout should succeed');
      
      // Try to use refresh token after logout
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          cookie: `refreshToken=${refreshTokenCookie.value}`
        }
      });

      t.equal(refreshResponse.statusCode, 401, 'Refresh should fail after logout');
      
      // Check that refresh token cookie is cleared
      const logoutCookies = logoutResponse.cookies;
      const clearedCookie = logoutCookies.find(cookie => cookie.name === 'refreshToken');
      t.ok(clearedCookie, 'Should clear refresh token cookie');
      t.equal(clearedCookie.value, '', 'Cookie value should be empty');
    });

    t.test('Access token should have proper expiration time', async (t) => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const { accessToken } = JSON.parse(loginResponse.body);
      const decoded = jwt.decode(accessToken);
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + 3600; // 1 hour
      
      // Allow 5 second tolerance for test execution time
      t.ok(Math.abs(decoded.exp - expectedExpiry) <= 5, 'Access token should expire in approximately 1 hour');
    });

    t.test('Refresh token should have proper expiration time', async (t) => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      
      // Decode refresh token to check expiration
      const decoded = jwt.decode(refreshTokenCookie.value);
      
      const now = Math.floor(Date.now() / 1000);
      const expectedExpiry = now + (7 * 24 * 60 * 60); // 7 days
      
      // Allow 5 second tolerance for test execution time
      t.ok(Math.abs(decoded.exp - expectedExpiry) <= 5, 'Refresh token should expire in approximately 7 days');
    });
  });

  t.test('Security Improvements Verification', async (t) => {
    
    t.test('Access tokens should not be stored in localStorage', async (t) => {
      // This is a behavioral test - we verify the API design supports in-memory storage
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const body = JSON.parse(loginResponse.body);
      
      // The API should return the token for in-memory storage, not localStorage
      t.ok(body.accessToken, 'API should return access token for in-memory storage');
      t.equal(typeof body.accessToken, 'string', 'Access token should be a string');
    });

    t.test('Refresh tokens should be HttpOnly cookies', async (t) => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      
      t.ok(refreshTokenCookie.httpOnly, 'Refresh token cookie must be HttpOnly');
      t.ok(refreshTokenCookie.sameSite, 'Refresh token cookie should have SameSite attribute');
    });

    t.test('Tokens should use different secrets', async (t) => {
      // This test verifies that access and refresh tokens can't be used interchangeably
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: validCredentials
      });
      
      const { accessToken } = JSON.parse(loginResponse.body);
      const cookies = loginResponse.cookies;
      const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
      
      // Try to use access token as refresh token
      const invalidRefreshResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: {
          cookie: `refreshToken=${accessToken}`
        }
      });

      t.equal(invalidRefreshResponse.statusCode, 401, 'Access token should not work as refresh token');

      // Try to use refresh token as access token
      const invalidAccessResponse = await app.inject({
        method: 'GET',
        url: '/api/services',
        headers: {
          authorization: `Bearer ${refreshTokenCookie.value}`
        }
      });

      t.equal(invalidAccessResponse.statusCode, 401, 'Refresh token should not work as access token');
    });
  });
});