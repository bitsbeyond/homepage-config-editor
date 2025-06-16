import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function QbittorrentWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [enableLeechProgress, setEnableLeechProgress] = useState(initialData?.enableLeechProgress || false);
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setEnableLeechProgress(initialData.enableLeechProgress || false);
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setEnableLeechProgress(false);
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'qbittorrent',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      enableLeechProgress: enableLeechProgress || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for qBittorrent widget.';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'qbittorrent' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        // Only include enableLeechProgress if it's true (not default)
        if (k === 'enableLeechProgress' && currentWidgetData[k] === false) {
          return; // Skip false values for enableLeechProgress
        }
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'qbittorrent';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, enableLeechProgress, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Username, Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  // Handle changes for Switch (Enable Leech Progress)
  const handleSwitchChange = (setter) => (event) => {
      setter(event.target.checked);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="qBittorrent URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your qBittorrent instance (e.g., http://qbittorrent.host:8080)"}
        type="url"
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Username"
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Username for qBittorrent web interface. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Password"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Password for qBittorrent web interface. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <FormControlLabel
        control={
          <Switch
            checked={enableLeechProgress}
            onChange={handleSwitchChange(setEnableLeechProgress)}
            name="enableLeechProgress"
          />
        }
        label="Enable Leech Progress"
        sx={{ mt: 1 }}
      />
    </Box>
  );
}

QbittorrentWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    enableLeechProgress: PropTypes.bool,
  }),
  onChange: PropTypes.func.isRequired,
};

QbittorrentWidgetFields.defaultProps = {
  initialData: null,
};

export default QbittorrentWidgetFields;