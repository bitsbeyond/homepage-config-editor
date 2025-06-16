import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function PaperlessngxWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({}); // State to hold local error messages

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setApiKey('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'paperlessngx',
      url: url || undefined,
      key: apiKey || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required for Paperless-ngx widget.';
    }
    
    // Validation: Either key OR (username + password) must be provided
    const hasKey = apiKey?.trim();
    const hasUsernamePassword = username?.trim() && password?.trim();
    
    if (!hasKey && !hasUsernamePassword) {
      errors.auth = 'Either API Token OR Username + Password must be provided.';
    }
    
    setFieldErrors(errors); // Update local field errors state

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'paperlessngx' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'paperlessngx';
    }

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, username, password, parentOnChange]); // Depend on individual states and parentOnChange

  // Handle changes for standard TextFields (URL)
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Key, Username, Password)
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
        label="Paperless-ngx URL"
        value={url} // Use individual state
        onChange={handleTextFieldChange(setUrl)} // Use specific handler with setter
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Paperless-ngx instance (e.g., http://paperless.local:8000)"}
        type="url"
      />
      
      {/* Authentication Section */}
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
        Authentication (Use Token OR Username/Password)
      </Typography>
      <Typography variant="caption" display="block" gutterBottom color={fieldErrors.auth ? 'error' : 'text.secondary'}>
        {fieldErrors.auth || "If Token is provided, it will be used instead of Username/Password."}
      </Typography>

      <EnvVarAutocompleteInput
        fullWidth
        name="key" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="API Token (Key)"
        type="password" // Enables visibility toggle
        value={apiKey} // Use individual state
        onChange={handleAutocompleteChange(setApiKey)} // Use specific handler with setter
        helperText="API Token from Paperless-ngx settings. Can be a {{HOMEPAGE_VAR_...}}"
      />

      <Box sx={{ textAlign: 'center', my: 1 }}>
        <Typography variant="overline">OR</Typography>
      </Box>

      <EnvVarAutocompleteInput
        fullWidth
        name="username" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Username"
        value={username} // Use individual state
        onChange={handleAutocompleteChange(setUsername)} // Use specific handler with setter
        helperText="Paperless-ngx username. Can be a {{HOMEPAGE_VAR_...}}"
      />
      
      <EnvVarAutocompleteInput
        fullWidth
        name="password" // This 'name' is for the EnvVarAutocompleteInput's own internal use if needed
        label="Password"
        type="password" // Enables visibility toggle
        value={password} // Use individual state
        onChange={handleAutocompleteChange(setPassword)} // Use specific handler with setter
        helperText="Paperless-ngx password. Can be a {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

PaperlessngxWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

PaperlessngxWidgetFields.defaultProps = {
  initialData: null,
};

export default PaperlessngxWidgetFields;