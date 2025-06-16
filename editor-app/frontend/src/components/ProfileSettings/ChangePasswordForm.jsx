import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, IconButton, InputAdornment } from '@mui/material';
import { useSnackbar } from 'notistack';
import { apiRequest } from '../../utils/api';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Placeholder for a new API utility function if we create one
// import { updateUserPasswordApi } from '../../utils/api';

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const validatePasswordComplexity = (password) => {
    // Basic complexity: At least 12 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character.
    // This should ideally match backend validation (VALIDATION_CONFIG.password)
    const errors = [];
    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number.');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character.');
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('All fields are required.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.');
      setIsLoading(false);
      return;
    }

    const complexityErrors = validatePasswordComplexity(newPassword);
    if (complexityErrors.length > 0) {
      setError(complexityErrors.join(' '));
      setIsLoading(false);
      return;
    }
    
    if (newPassword === currentPassword) {
      setError('New password cannot be the same as the current password.');
      setIsLoading(false);
      return;
    }

    try {
      // Using generic apiRequest, assuming the endpoint is PUT /api/users/me/password
      await apiRequest('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      enqueueSnackbar('Password changed successfully!', { variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error("Password change error:", err);
      setError(err.data?.error || err.message || 'Failed to change password.');
      enqueueSnackbar(err.data?.error || err.message || 'Failed to change password.', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Change Password
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
        name="currentPassword"
        label="Current Password"
        type={showCurrentPassword ? 'text' : 'password'}
        id="currentPassword"
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
      <TextField
        margin="normal"
        required
        fullWidth
        name="newPassword"
        label="New Password"
        type={showNewPassword ? 'text' : 'password'}
        id="newPassword"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        disabled={isLoading}
        helperText="Min 12 chars, with uppercase, lowercase, number, and special character."
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle new password visibility"
                onClick={() => setShowNewPassword(!showNewPassword)}
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
              >
                {showNewPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmNewPassword"
        label="Confirm New Password"
        type={showConfirmNewPassword ? 'text' : 'password'}
        id="confirmNewPassword"
        autoComplete="new-password"
        value={confirmNewPassword}
        onChange={(e) => setConfirmNewPassword(e.target.value)}
        disabled={isLoading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle confirm new password visibility"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                onMouseDown={(event) => event.preventDefault()}
                edge="end"
              >
                {showConfirmNewPassword ? <VisibilityOff /> : <Visibility />}
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
        {isLoading ? 'Changing Password...' : 'Change Password'}
      </Button>
    </Box>
  );
}

export default ChangePasswordForm;