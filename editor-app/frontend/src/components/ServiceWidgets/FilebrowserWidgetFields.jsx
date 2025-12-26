import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function FilebrowserWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [authHeader, setAuthHeader] = useState(initialData?.authHeader || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setAuthHeader(initialData.authHeader || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setUsername('');
      setPassword('');
      setAuthHeader('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'filebrowser',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
      authHeader: authHeader || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    // Validation: authHeader requires username
    if (authHeader?.trim() && !username?.trim()) {
      errors.authHeader = 'authHeader requires username to be configured.';
      errors.username = 'username is required when authHeader is used.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'filebrowser' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'filebrowser';
    }

    parentOnChange(dataForParent, errors);
  }, [url, username, password, authHeader, parentOnChange]);

  // Helper functions (memoized to prevent flickering)
  const handleTextFieldChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  const handleAutocompleteChange = useCallback((setter) => (event) => {
    setter(event.target.value);
  }, []);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Filebrowser URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://filebrowserhostorip:port"}
      />

      <Typography variant="caption" sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
        Authentication (optional):
      </Typography>

      <EnvVarAutocompleteInput
        label="Username (optional)"
        name="username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        fullWidth
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "User account name. Can use {{HOMEPAGE_VAR_...}}"}
      />

      <EnvVarAutocompleteInput
        label="Password (optional)"
        name="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        fullWidth
        type="password"
        helperText="User account password. Can use {{HOMEPAGE_VAR_...}}"
      />

      <TextField
        label="Auth Header (optional)"
        name="authHeader"
        value={authHeader}
        onChange={handleTextFieldChange(setAuthHeader)}
        fullWidth
        error={!!fieldErrors.authHeader}
        helperText={fieldErrors.authHeader || "Header name for proxy authentication (e.g., X-My-Header). Requires username to be set."}
      />
    </Box>
  );
}

FilebrowserWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    authHeader: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

FilebrowserWidgetFields.defaultProps = {
  initialData: null,
};

export default FilebrowserWidgetFields;
