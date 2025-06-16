import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function RutorrentWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

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
    const currentWidgetData = {
      type: 'rutorrent',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for ruTorrent widget.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'rutorrent' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'rutorrent';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (Username, Password)
  const handleAutocompleteChange = (setter) => (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setter(event.target.value);
  };

  return (
    <Box sx={{ paddingTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        required
        fullWidth
        name="url"
        label="ruTorrent URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your ruTorrent instance (e.g., http://rutorrent.host)"}
        type="url"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="username" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Username (Optional)"
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        helperText="Optional. Username for ruTorrent web interface. Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Password (Optional)"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        helperText="Optional. Password for ruTorrent web interface. Can be a {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

RutorrentWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

RutorrentWidgetFields.defaultProps = {
  initialData: null,
};

export default RutorrentWidgetFields;