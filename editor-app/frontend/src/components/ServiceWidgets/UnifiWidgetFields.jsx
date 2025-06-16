import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function UnifiWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [site, setSite] = useState(initialData?.site || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setSite(initialData.site || '');
      setUsername(initialData.username || '');
      setPassword(initialData.password || '');
      setApiKey(initialData.key || '');
    } else {
      // Reset to defaults if initialData becomes null (e.g., widget deselected)
      setUrl('');
      setSite('');
      setUsername('');
      setPassword('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'unifi',
      url: url || undefined,
      site: site || undefined,
      username: username || undefined,
      password: password || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Unifi Controller URL is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'unifi' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
    // Ensure 'type' is always present
    if (Object.keys(dataForParent).length === 0) {
        dataForParent.type = 'unifi';
    }

    parentOnChange(dataForParent, errors);
  }, [url, site, username, password, apiKey, parentOnChange]);

  // Handle changes for standard TextFields
  const handleTextFieldChange = (setter) => (event) => {
      setter(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput
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
        label="Unifi Controller URL"
        type="url"
        value={url}
        onChange={handleTextFieldChange(setUrl)}
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "URL of your Unifi Controller (e.g., https://unifi.host:8443)"}
      />
      <TextField
        fullWidth
        name="site"
        label="Site Name (Optional)"
        value={site}
        onChange={handleTextFieldChange(setSite)}
        helperText="Optional. Defaults to the controller's default site."
      />
      <Typography variant="caption" sx={{ mt: 1, mb: -1, color: 'text.secondary' }}>
        Authentication (use Username/Password OR API Key):
      </Typography>
      <EnvVarAutocompleteInput
        fullWidth
        name="username"
        label="Username (Optional)"
        value={username}
        onChange={handleAutocompleteChange(setUsername)}
        helperText="Optional. Local controller username (if not using API Key). Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="password"
        label="Password (Optional)"
        type="password"
        value={password}
        onChange={handleAutocompleteChange(setPassword)}
        helperText="Optional. Local controller password (if not using API Key). Can be a {{HOMEPAGE_VAR_...}}"
      />
      <EnvVarAutocompleteInput
        fullWidth
        name="key"
        label="API Key (Optional)"
        type="password"
        value={apiKey}
        onChange={handleAutocompleteChange(setApiKey)}
        helperText="Optional. API Key (if not using Username/Password). Can be a {{HOMEPAGE_VAR_...}}"
      />
    </Box>
  );
}

UnifiWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    site: PropTypes.string,
    username: PropTypes.string,
    password: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

UnifiWidgetFields.defaultProps = {
  initialData: null,
};

export default UnifiWidgetFields;