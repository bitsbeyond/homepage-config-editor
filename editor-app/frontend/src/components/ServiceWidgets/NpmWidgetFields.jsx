import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function NpmWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
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
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'npm',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for NPM widget.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required for NPM widget.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required for NPM widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'npm' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'npm';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, Username)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Password)
  const handlePasswordChange = (event) => {
    // EnvVarAutocompleteInput passes { target: { name, value } }
    setPassword(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="Nginx Proxy Manager URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Nginx Proxy Manager instance (e.g., http://npm.host:81)"}
      />
      <TextField
        required
        fullWidth
        name="username"
        label="Username"
        value={username}
        onChange={handleUsernameChange}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Admin username for NPM web interface"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password"
        label="Password"
        type="password" // Enables visibility toggle
        value={password}
        onChange={handlePasswordChange}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Password for the NPM admin user. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

NpmWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

NpmWidgetFields.defaultProps = {
  initialData: null,
};

export default NpmWidgetFields;