import React, { useState, useEffect } from 'react';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';
import PropTypes from 'prop-types'; // Added PropTypes

function HealthchecksWidgetFields({ initialData, onChange: parentOnChange }) {
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [uuid, setUuid] = useState(initialData?.uuid || '');

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setApiKey(initialData.key || '');
      setUuid(initialData.uuid || '');
    } else {
      setUrl('');
      setApiKey('');
      setUuid('');
    }
  }, [initialData]);

  // Effect to call parentOnChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'healthchecks',
      url: url || undefined,
      key: apiKey || undefined,
      uuid: uuid || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Healthchecks URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    // uuid is optional

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'healthchecks' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, uuid, parentOnChange]);

  const handleInputChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const isUrlError = !url?.trim();
  const isApiKeyError = !apiKey?.trim();

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Healthchecks URL"
        name="url"
        value={url}
        onChange={handleInputChange(setUrl)}
        fullWidth
        required
        type="url"
        error={isUrlError}
        helperText={isUrlError ? 'Healthchecks URL is required.' : "URL of your Healthchecks instance (e.g., https://hc.example.com)"}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleInputChange(setApiKey)}
        fullWidth
        required
        type="password" // Mask the key & enable visibility toggle
        error={isApiKeyError}
        helperText={isApiKeyError ? 'API Key is required.' : "Read-only API Key from Project Settings."}
      />
      <TextField
        label="Check UUID (Optional)"
        name="uuid"
        value={uuid}
        onChange={handleInputChange(setUuid)}
        fullWidth
        helperText="Optional. UUID of a specific check. If omitted, shows total stats."
      />
    </Box>
  );
}

HealthchecksWidgetFields.propTypes = {
  initialData: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

export default HealthchecksWidgetFields;