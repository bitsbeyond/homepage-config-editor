import React, { useState } from 'react';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material'; // Added Alert
import { apiRequest } from '../../utils/api'; // Import apiRequest

function InitialSetupPage({ onSetupComplete }) { // onSetupComplete prop will be used later
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      // Call the backend API to create the initial admin user
      const response = await apiRequest('/api/setup/admin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // If successful (backend returns 201 Created), call the onSetupComplete callback
      console.log('Initial admin created:', response); // Log success response
      onSetupComplete(); // Notify App component

    } catch (err) {
      console.error("Initial setup error:", err);
      // Use error message from API response if available, otherwise use default
      setError(err.data?.error || err.message || 'Failed to create admin user.');
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
      }}
    >
      <Container component="main" maxWidth="xs">
        {/* Remove marginTop from Paper, parent Box handles centering */}
        <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 4 }}>
          <Typography component="h1" variant="h5">
            Initial Admin Setup
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
            Create the first administrator account.
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Admin Email Address"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              error={password !== confirmPassword && confirmPassword !== ''}
              helperText={password !== confirmPassword && confirmPassword !== '' ? 'Passwords do not match' : ''}
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
              disabled={isLoading || password !== confirmPassword || !password}
            >
              {isLoading ? 'Creating Admin...' : 'Create Admin User'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default InitialSetupPage;