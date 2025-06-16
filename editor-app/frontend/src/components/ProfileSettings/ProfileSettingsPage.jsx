import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import ChangePasswordForm from './ChangePasswordForm';
import UpdateEmailForm from './UpdateEmailForm'; // Import the new form

function ProfileSettingsPage() {
  return (
    <Box sx={{ p: 3, maxWidth: '600px', margin: 'auto' }}> {/* Added maxWidth and margin auto for better centering */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          Profile Settings
        </Typography>
        
        <ChangePasswordForm />

        <Divider sx={{ my: 4 }} /> {/* Uncommented and enabled Divider */}

        <UpdateEmailForm /> {/* Added the UpdateEmailForm */}

      </Paper>
    </Box>
  );
}

export default ProfileSettingsPage;