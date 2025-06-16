import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Box } from '@mui/material';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function ProwlarrWidgetFields({ initialData, onChange: parentOnChange }) {
  // Individual state for each field
  const [url, setUrl] = useState(initialData?.url || '');
  const [apiKey, setApiKey] = useState(initialData?.key || '');
  const [fieldErrors, setFieldErrors] = useState({});

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      const newUrl = initialData.url || '';
      const newApiKey = initialData.key || '';

      if (newUrl !== url) setUrl(newUrl);
      if (newApiKey !== apiKey) setApiKey(newApiKey);
    } else {
      // Reset to defaults
      setUrl('');
      setApiKey('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status whenever local state changes
  useEffect(() => {
    const currentWidgetData = {
      type: 'prowlarr',
      url: url || undefined,
      key: apiKey || undefined,
    };

    const errors = {};
    if (!url?.trim()) {
      errors.url = 'Prowlarr URL is required.';
    }
    if (!apiKey?.trim()) {
      errors.key = 'API Key is required.';
    }
    setFieldErrors(errors);

    // Clean up undefined fields from currentWidgetData before sending to parent
    const dataForParent = { type: 'prowlarr' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });

    parentOnChange(dataForParent, errors);
  }, [url, apiKey, parentOnChange]);

  // Handle changes for individual fields
  const handleUrlChange = (event) => setUrl(event.target.value);
  const handleApiKeyChange = (event) => setApiKey(event.target.value);

  return (
    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Prowlarr URL"
        name="url"
        value={url}
        onChange={handleUrlChange}
        fullWidth
        required
        type="url"
        error={!!fieldErrors.url}
        helperText={fieldErrors.url || "Base URL of your Prowlarr instance (e.g., http://prowlarr.host.or.ip:9696)"}
      />
      <EnvVarAutocompleteInput
        label="API Key"
        name="key"
        value={apiKey}
        onChange={handleApiKeyChange}
        fullWidth
        required
        type="password"
        error={!!fieldErrors.key}
        helperText={fieldErrors.key || "Found in Prowlarr under Settings > General > API Key. Can use {{HOMEPAGE_VAR_...}}"}
      />
    </Box>
  );
}

ProwlarrWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    url: PropTypes.string,
    key: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

ProwlarrWidgetFields.defaultProps = {
  initialData: null,
};

export default ProwlarrWidgetFields;