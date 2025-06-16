import React, { useState } from 'react'; // Removed useContext as it's not used
import { Box, Button, TextField, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { useSnackbar } from 'notistack';
import { updateUserEmailApi } from '../../utils/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

function UpdateEmailForm() {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  // It seems App.jsx provides currentUser, but not directly via AppThemeContext.
  // For now, let's assume we can get the current user's email if needed for display,
  // or the backend handles identifying the user via JWT.
  // const { currentUser } = useContext(AppThemeContext); // This might not be correct.

  const isValidEmail = (email) => {
    // Basic email validation regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!newEmail || !currentPassword) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }

    if (!isValidEmail(newEmail)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      await updateUserEmailApi(newEmail, currentPassword);
      enqueueSnackbar('Email updated successfully! You may need to log in again for the change to fully reflect in your session.', { variant: 'success', autoHideDuration: 6000 });
      setNewEmail('');
      setCurrentPassword('');
      // Potentially trigger a re-fetch of user data or prompt re-login if email is used in UI from JWT
    } catch (err) {
      console.error("Email update error:", err);
      setError(err.data?.error || err.message || 'Failed to update email.');
      enqueueSnackbar(err.data?.error || err.message || 'Failed to update email.', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Update Email Address
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
      <TextField
        margin="normal"
        required
        fullWidth
        id="newEmail"
        label="New Email Address"
        name="newEmail"
        autoComplete="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        disabled={isLoading}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="currentPasswordForEmail"
        label="Current Password (for verification)"
        type={showCurrentPassword ? 'text' : 'password'}
        id="currentPasswordForEmail"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle current password visibility"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
              >
                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? 'Updating Email...' : 'Update Email'}
      </Button>
    </Box>
  );
}

export default UpdateEmailForm;