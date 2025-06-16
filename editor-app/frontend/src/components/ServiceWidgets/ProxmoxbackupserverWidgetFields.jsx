import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function ProxmoxbackupserverWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      const newUsername = initialData.username || '';
      const newPassword = initialData.password || '';

      if (newUrl !== url) setUrl(newUrl);
      if (newUsername !== username) setUsername(newUsername);
      if (newPassword !== password) setPassword(newPassword);
    } else {
      // Reset to defaults
      setUrl('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'proxmoxbackupserver',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Proxmox Backup Server URL is required.';
    }
    if (!username?.trim()) {
      errors.username = 'API Token ID (Username) is required.';
    }
    if (!password?.trim()) {
      errors.password = 'API Token Secret (Password) is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'proxmoxbackupserver' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, username, password, parentOnChange]);

  // Handle changes for individual fields
  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleUsernameChange = (event) => setUsername(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Proxmox Backup Server URL"
        variant="outlined"
        fullWidth
        name="url"
        value={url}
        onChange={handleUrlChange}
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., https://pbs.local:8007"}
      />
      <EnvVarAutocompleteInput
        label="API Token ID (Username)"
        name="username"
        value={username}
        onChange={handleUsernameChange}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "e.g., user@pam!tokenid. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        label="API Token Secret (Password)"
        name="password"
        value={password}
        onChange={handlePasswordChange}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Your API Token Secret. Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

ProxmoxbackupserverWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ProxmoxbackupserverWidgetFields.defaultProps = {
  initialData: null,
};

export default ProxmoxbackupserverWidgetFields;