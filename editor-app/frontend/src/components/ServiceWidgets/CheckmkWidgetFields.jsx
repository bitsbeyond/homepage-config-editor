import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function CheckmkWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [site, setSite] = useState(initialData?.site || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setSite(initialData.site || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setSite('');
      setUsername('');
      setPassword('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'checkmk',
      url: url || undefined,
      site: site || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'URL is required.';
    }
    if (!site?.trim()) {
      errors.site = 'Site name is required (usually "cmk" by default).';
    }
    if (!username?.trim()) {
      errors.username = 'Username is required.';
    }
    if (!password?.trim()) {
      errors.password = 'Password is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'checkmk' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
      dataForParent.type = 'checkmk';
    }

    parentOnChange(dataForParent, errors);
  }, [url, site, username, password, parentOnChange]);

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
        label="Checkmk URL"
        name="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "e.g., http://checkmk.host.or.ip:port"}
      />

      <TextField
        label="Site Name"
        name="site"
        value={site}
        onChange={handleTextFieldChange(setSite)}
        fullWidth
        required
        error={!!fieldErrors.site}
        helperText={fieldErrors.site || "Your site name (usually 'cmk' by default)"}
      />

      <EnvVarAutocompleteInput
        label="Username"
        name="username"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        fullWidth
        required
        error={!!fieldErrors.username}
        helperText={fieldErrors.username || "Authentication username. Can use {{HOMEPAGE_VAR_...}}"}
      />

      <EnvVarAutocompleteInput
        label="Password"
        name="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.password}
        helperText={fieldErrors.password || "Authentication password. Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

CheckmkWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    site: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

CheckmkWidgetFields.defaultProps = {
  initialData: null,
};

export default CheckmkWidgetFields;
