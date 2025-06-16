import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function OpnsenseWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [wan, setWan] = useState(initialData?.wan || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setWan(initialData.wan || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setWan('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'opnsense',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      wan: wan || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for OPNsense widget.';
    }
    if (!username?.trim()) {
      errors.username = 'API Key (username) is required.';
    }
    if (!password?.trim()) {
      errors.password = 'API Secret (password) is required.';
    }
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'opnsense' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'opnsense';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, wan, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL, WAN)
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
        label="OPNsense URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your OPNsense instance (e.g., http://opnsense.local)"}
        type="url"
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Key (Username)"
        type="password" // Enables visibility toggle
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Generated API Key from OPNsense. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Secret (Password)"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Generated API Secret from OPNsense. Can be a {{HOMEPAGE_VAR_...}}"}
      />
      <TextField
        fullWidth
        name="wan"
        label="WAN Interface (Optional)"
        value={wan} // Use individual state
        onChange={handleTextFieldChange(setWan)} // Use specific handler with setter
        helperText="Optional, defaults to 'wan' (e.g., opt1)"
      />
    </Box>
  );
}

OpnsenseWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    wan: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

OpnsenseWidgetFields.defaultProps = {
  initialData: null,
};

export default OpnsenseWidgetFields;