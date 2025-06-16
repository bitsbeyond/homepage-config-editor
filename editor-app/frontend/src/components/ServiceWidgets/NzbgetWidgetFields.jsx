import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function NzbgetWidgetFields({ initialData, onChange: parentOnChange }) {
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
      type: 'nzbget',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for NZBget widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'nzbget' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'nzbget';
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
        label="NZBget URL"
        type="url"
        value={url}
        onChange={handleUrlChange}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your NZBget instance (e.g., http://nzbget.host:6789)"}
      />
      <TextField
        fullWidth
        name="username"
        label="Username (Optional)"
        value={username}
        onChange={handleUsernameChange}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Control Username for NZBget"}
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password"
        label="Password (Optional)"
        type="password" // Enables visibility toggle
        value={password}
        onChange={handlePasswordChange}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Control Password for NZBget. Can be a {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

NzbgetWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

NzbgetWidgetFields.defaultProps = {
  initialData: null,
};

export default NzbgetWidgetFields;