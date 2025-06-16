import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput'; 

function AdguardWidgetFields({ initialData, onChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const errors = {};
    if (!url?.trim()) {
      errors.url = 'AdGuard Home URL is required.';
    }
    // Username and password are optional for AdGuard Home widget

    const dataForParent = {
      type: 'adguard-home', // Corrected type
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    // Clean up undefined optional fields
    if (!dataForParent.username) delete dataForParent.username;
    if (!dataForParent.password) delete dataForParent.password;
    // URL is mandatory, so its presence is handled by the error check.
    // If it's empty, error is set; if not, it's included.
    // If it becomes undefined (e.g. initialData was null and user hasn't typed), error is set.
    if (!dataForParent.url && !errors.url) { // Should not happen if logic is correct, but as safeguard
        delete dataForParent.url;
    }


    onChange(dataForParent, errors);
  }, [url, username, password, onChange]); // Depend on individual states and onChange

  // Handle changes for standard TextField (URL)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Username, Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="AdGuard Home URL"
        name="url"
        value={url} // Use individual state
        onChange={handleUrlChange} // Use specific handler
        fullWidth
        required
        type="url"
        helperText="Base URL of your AdGuard Home instance (e.g., http://192.168.1.10)"
      />
      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        fullWidth
        // Although docs imply required, treat as optional in form for flexibility
        // required
        helperText="Username for AdGuard Home web interface. Can use {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        fullWidth
        type="password" // Enables visibility toggle
        // required
        helperText="Password for AdGuard Home web interface. Can use {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

export default AdguardWidgetFields;