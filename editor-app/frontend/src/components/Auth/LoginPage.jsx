import React, { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material';
import { apiRequest, setAccessToken } from '../../utils/api';

function LoginPage({ onLogin }) { // onLogin prop will be used later
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const response = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        // New dual-token system returns { accessToken, user: { email, role }, expiresIn }
        if (response && response.accessToken) {
            setAccessToken(response.accessToken); // Store access token in memory
            console.log(`Login successful - access token expires in ${response.expiresIn} seconds`);
            onLogin(response.user); // Notify App component of successful login
        } else {
            setError('Login failed: Invalid response from server.');
        }

    } catch (err) {
        console.error("Login error:", err);
        // Use error message from API response if available, otherwise use default
        setError(err.data?.error || err.message || 'Login failed. Please check your credentials.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh', // Ensure the box takes full viewport height
        // Optionally add some background color or styling for the whole page
        // backgroundColor: (theme) => theme.palette.grey[100], // Example background
      }}
    >
      <Container component="main" maxWidth="xs">
        {/* Remove marginTop from Paper, parent Box handles centering */}
        <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 4 }}>
          <Typography component="h1" variant="h5">
            Homepage Editor Login
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                  {error}
              </Alert>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;