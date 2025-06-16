import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function CalibreWebWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({});

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

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: 'calibreweb',
      url: url || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const validationErrors = {};
    if (!url?.trim()) {
      validationErrors.url = 'Calibre-web URL is required.';
    }
    if (!username?.trim()) {
      validationErrors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      validationErrors.password = 'Password is required.';
    }

    setFieldErrors(validationErrors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'calibreweb' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 1) { // Only type field present
        dataForParent.type = 'calibreweb';
    }

    parentOnChange(dataForParent, validationErrors);
  }, [url, username, password]); // Removed parentOnChange from dependencies

  // Specific handlers for each input type
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const handleAutocompleteChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info">
        Requires Calibre-web version ≥ 0.6.21.
      </Alert>
      <TextField
        required
        fullWidth
        name="url"
        label="Calibre-web URL"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "The base URL of your Calibre-web instance (e.g., http://192.168.1.101:8083)."}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="username"
        label="Username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Your Calibre-web username. Can use {{HOMEPAGE_VAR_...}}"}
      />
      <EnvVarAutocompleteInput
        required
        fullWidth
        name="password"
        label="Password"
        type="password" // Enables visibility toggle
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Your Calibre-web password. Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

CalibreWebWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

CalibreWebWidgetFields.defaultProps = {
  initialData: null,
};

export default CalibreWebWidgetFields;