import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function AuthentikWidgetFields({ initialData, onChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [version, setVersion] = useState(initialData?.version ? String(initialData.version) : '1');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes (e.g., when editing)
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setVersion(initialData.version ? String(initialData.version) : '1');
    } else {
      setUrl('');
      setApiKey('');
      setVersion('1');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'authentik',
      url: url || undefined,
      key: apiKey || undefined,
      version: version !== '1' ? parseInt(version, 10) : undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Authentik URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Token (key) is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'authentik' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     // Ensure 'type' is always present, even if all other fields are cleared by user
    if (Object.keys(dataForParent).length === 1 && dataForParent.type === 'authentik') {
        // If only type is present, it means all fields were empty or undefined.
        // Parent form will still receive this, and errors object will reflect missing mandatory fields.
    }


    onChange(dataForParent, errors);
  }, [url, apiKey, version, onChange]);

  // Handle changes for standard TextField (URL)
  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  };

  // Handle changes for EnvVarAutocompleteInput (API Token)
  const handleApiKeyChange = (event) => {
      // EnvVarAutocompleteInput passes { target: { name, value } }
      setApiKey(event.target.value);
  };


  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Authentik URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Authentik instance (e.g., https://auth.example.com)"}
      />
      <EnvVarAutocompleteInput
        label="API Token"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Authentik API Token (Intent: API Token, Permissions: View User, View Event). Can use {{HOMEPAGE_VAR_...}}"}
      />
      <FormControl fullWidth>
        <InputLabel id="authentik-version-label">Widget Version</InputLabel>
        <Select
          labelId="authentik-version-label"
          id="authentik-version-select"
          name="version"
          value={version}
          label="Widget Version"
          onChange={(e) => setVersion(e.target.value)}
        >
          <MenuItem value="1">v1 (&lt; 2025.8.0, Default)</MenuItem>
          <MenuItem value="2">v2 (&gt;= 2025.8.0)</MenuItem>
        </Select>
        <FormHelperText>Use v2 for Authentik 2025.8.0 and newer.</FormHelperText>
      </FormControl>
    </Box>
  );
}

AuthentikWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
    version: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onChange: PropTypes.func.isRequired,
};

AuthentikWidgetFields.defaultProps = {
  initialData: null,
};

export default AuthentikWidgetFields;