import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function NextcloudWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      if (newUrl !== url) {
        setUrl(newUrl);
      }
      const newUsername = initialData.username || '';
      if (newUsername !== username) {
        setUsername(newUsername);
      }
      const newPassword = initialData.password || '';
      if (newPassword !== password) {
        setPassword(newPassword);
      }
      const newKey = initialData.key || '';
      if (newKey !== key) {
        setKey(newKey);
      }
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'nextcloud',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      key: key || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Nextcloud widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'nextcloud' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'nextcloud';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, key, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, Username)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Password, Key)
  const handlePasswordChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setPassword(event.target.value);
  };

  const handleKeyChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setKey(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Nextcloud URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Nextcloud instance (e.g., https://cloud.example.com)"}
      />
      <Typography variant="caption" sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
        Authentication (use Username/Password OR NC-Token):
      </Typography>
      <TextField
        fullWidth
        name="username"
        label="Username (Optional)"
        value={username}
        onChange={handleUsernameChange}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Nextcloud username (if not using NC-Token)"}
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password"
        label="Password (Optional)"
        type="password" // Enables visibility toggle
        value={password}
        onChange={handlePasswordChange}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Nextcloud password (if not using NC-Token). Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="key"
        label="NC-Token (Optional)"
        type="password" // Enables visibility toggle
        value={key}
        onChange={handleKeyChange}
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "NC-Token (takes precedence over username/password). Found in Settings > System. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

NextcloudWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

NextcloudWidgetFields.defaultProps = {
  initialData: null,
};

export default NextcloudWidgetFields;